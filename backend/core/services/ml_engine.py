import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import logging

logger = logging.getLogger(__name__)

class TanacakraMLEngine:
    """
    Data Science Pipeline independen berbasis Scikit-learn.
    Melatih model pada data historis ML_Dataset Cangkringan (curah hujan, suhu, kelembapan, soil_ph, NDVI, yield_ton_ha).
    T2: Training dilakukan secara lazy (saat inferensi pertama), bukan saat import modul,
    agar cold-start worker tidak lambat dan error bisa ditangani eksplisit.
    """
    def __init__(self):
        self._is_trained = False
        self._trained_rows = 0
        self._fallback_mode = False
        self.clf_model = RandomForestClassifier(n_estimators=25, random_state=42)
        self.reg_model = RandomForestRegressor(n_estimators=25, random_state=42)
        self.classes_labels = ["Kondisi Optimal", "Perlu Pembenahan pH", "Kurang Nutrisi NPK", "Kritis / Kering"]

    def _ensure_trained(self):
        if self._is_trained:
            return
        self._train_from_excel_dataset()

    def _find_dataset_path(self):
        # Lokasi pencarian dataset: env override dulu, lalu kandidat path standar.
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
        possible_paths = [
            os.environ.get("ML_DATASET_PATH"),
            os.path.join(base_dir, "data", "data pendukung", "TANACAKRA_Data_Analysis.xlsx"),
            os.path.join(base_dir, "data", "TANACAKRA_Data_Analysis.xlsx"),
            os.path.join(base_dir, "backend", "data", "TANACAKRA_Data_Analysis.xlsx"),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "data pendukung", "TANACAKRA_Data_Analysis.xlsx"))
        ]
        for path in possible_paths:
            if path and os.path.exists(path):
                return path
        return None

    def _train_from_excel_dataset(self):
        dataset_path = self._find_dataset_path()

        if dataset_path:
            try:
                df = pd.read_excel(dataset_path, sheet_name="ML_Dataset")
                # Normalize column names to lowercase for robust lookup
                df.columns = [c.strip() for c in df.columns]
                temp_col = [c for c in df.columns if c.lower() in ['temperature_c', 'temperature']][0]
                ph_col = [c for c in df.columns if c.lower() in ['soil_ph', 'ph']][0]
                hum_col = [c for c in df.columns if c.lower() in ['humidity_percent', 'kelembapan', 'humidity']][0]
                rain_col = [c for c in df.columns if c.lower() in ['rainfall_mm', 'curah_hujan']][0]
                ndvi_col = [c for c in df.columns if c.lower() in ['ndvi']][0]

                # Features: [soil_ph, humidity_percent, rainfall_mm, temperature, NDVI]
                X = df[[ph_col, hum_col, rain_col, temp_col, ndvi_col]].values
                y_yield = df['yield_ton_ha'].values

                # Categorical status label based on soil_ph and humidity
                y_class = []
                for _, row in df.iterrows():
                    ph = row[ph_col]
                    hum = row[hum_col]
                    if ph < 6.0:
                        y_class.append(1) # Perlu Pembenahan pH
                    elif hum < 40:
                        y_class.append(3) # Kritis / Kering
                    elif ph > 7.5:
                        y_class.append(2) # Kurang Nutrisi
                    else:
                        y_class.append(0) # Optimal

                self.clf_model.fit(X, y_class)
                self.reg_model.fit(X, y_yield)
                self._is_trained = True
                self._trained_rows = len(df)
                self._fallback_mode = False
                logger.info(f"Successfully trained ML model on {len(df)} rows from TANACAKRA_Data_Analysis.xlsx")
                return
            except Exception as e:
                logger.warning(f"Could not train from excel file: {e}. Fallback to synthetic training.")
        else:
            logger.warning("Dataset Excel ML tidak ditemukan. Fallback ke sintetik; set env ML_DATASET_PATH di deployment.")

        # Fallback synthetic training
        X_syn = np.array([
            [6.5, 70, 200, 26, 0.8],
            [5.2, 60, 180, 27, 0.6],
            [6.8, 35, 100, 30, 0.4],
            [4.8, 55, 150, 25, 0.5]
        ])
        y_class_syn = [0, 1, 3, 1]
        y_yield_syn = [18.5, 12.0, 8.5, 10.2]
        self.clf_model.fit(X_syn, y_class_syn)
        self.reg_model.fit(X_syn, y_yield_syn)
        self._is_trained = True
        self._trained_rows = len(X_syn)
        self._fallback_mode = True

    def retrain(self):
        """Paksa muat ulang dataset (dipanggil setelah upload Excel master data)."""
        self._is_trained = False
        self._ensure_trained()
        return {"trained_rows": self._trained_rows, "fallback_mode": self._fallback_mode}

    def predict(self, input_parameters: dict) -> dict:
        """
        Mengeksekusi inferensi Scikit-learn berdasarkan dictionary parameter tanah.
        """
        self._ensure_trained()
        ph = float(input_parameters.get('pH', input_parameters.get('soil_ph', 6.5)))
        kelembapan = float(input_parameters.get('kelembapan', input_parameters.get('humidity_percent', 60)))
        rainfall = float(input_parameters.get('rainfall_mm', 200))
        temp = float(input_parameters.get('temperature', input_parameters.get('temperature_c', input_parameters.get('temperature_C', 26.5))))
        ndvi = float(input_parameters.get('NDVI', 0.75))

        n = float(input_parameters.get('nitrogen', input_parameters.get('n', 100)))
        p = float(input_parameters.get('fosfor', input_parameters.get('p', 35)))
        k = float(input_parameters.get('kalium', input_parameters.get('k', 130)))

        features = np.array([[ph, kelembapan, rainfall, temp, ndvi]])
        pred_class_idx = self.clf_model.predict(features)[0]
        base_predicted_yield = self.reg_model.predict(features)[0]
        
        # Penyesuaian dinamis agar hasil panen bervariasi sesuai parameter spesifik
        ph_factor = 1.0 - (abs(ph - 6.5) * 0.05)
        hum_factor = 1.0 - (abs(kelembapan - 60) * 0.003)
        npk_factor = 1.0 + ((n - 140) * 0.0005) + ((p - 45) * 0.001) + ((k - 190) * 0.0005)
        
        predicted_yield = base_predicted_yield * ph_factor * hum_factor * npk_factor
        # Memastikan yield tidak tidak masuk akal (di bawah 0)
        predicted_yield = max(2.0, predicted_yield)
        probabilities = self.clf_model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))

        status_kesehatan = self.classes_labels[pred_class_idx]

        # Logika Rekomendasi Pemupukan Sederhana & Stabilisasi Tanah
        rekomendasi_tindakan = []
        if ph < 6.0:
            rekomendasi_tindakan.append(f"Butuh Pupuk NPK & Kapur Dolomit ({round((6.5 - ph) * 200, 0)} kg/ha) untuk menstabilkan tanah yang terlalu asam.")
        elif ph > 7.5:
            rekomendasi_tindakan.append("Butuh Pupuk Sulfur/Belerang untuk menstabilkan tanah yang terlalu basa.")

        if kelembapan < 40:
            rekomendasi_tindakan.append("Butuh penyiraman rutin / irigasi 2x sehari untuk menstabilkan kelembapan tanah.")

        if n < 80 or p < 25 or k < 100:
            rekomendasi_tindakan.append("Butuh Pupuk NPK Susulan (150 kg/ha) + Pupuk Kandang Organik untuk menstabilkan nutrisi hara tanah.")

        if not rekomendasi_tindakan:
            rekomendasi_tindakan.append("Kondisi tanah sudah subur & stabil. Berikan pupuk organik rutin untuk menjaga kesehatan tanah.")

        return {
            "status_kesehatan": status_kesehatan,
            "estimasi_hasil_panen_ton_ha": round(float(predicted_yield), 2),
            "confidence_score": round(confidence, 2),
            "parameters_analyzed": {
                "pH": ph,
                "kelembapan": kelembapan,
                "nitrogen": n,
                "fosfor": p,
                "kalium": k,
                "NDVI": ndvi
            },
            "rekomendasi_tindakan": rekomendasi_tindakan,
            "catatan_lokasi": (
                f"Dilatih pada {self._trained_rows} record dataset historis ML Cangkringan, Sleman, DIY."
                if not self._fallback_mode
                else "PERHATIAN: Dataset pelatihan historis tidak ditemukan; model berjalan pada fallback sintetik. Hubungi admin."
            )
        }

# Singleton instance
ml_engine = TanacakraMLEngine()
