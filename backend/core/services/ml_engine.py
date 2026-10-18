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
        commodity = str(input_parameters.get('komoditas', input_parameters.get('commodity', 'Cabai Merah')))
        area_ha = float(input_parameters.get('area_ha', float(input_parameters.get('area_sqm', 10000)) / 10000.0))

        features = np.array([[ph, kelembapan, rainfall, temp, ndvi]])
        pred_class_idx = self.clf_model.predict(features)[0]
        base_predicted_yield = self.reg_model.predict(features)[0]
        
        # Benchmark yield normal per komoditas di lereng Cangkringan (ton/ha)
        COMMODITY_YIELD_CONFIG = {
            'Padi': {'base': 5.8, 'min': 4.5, 'max': 7.5, 'label': 'Padi'},
            'Jagung': {'base': 7.2, 'min': 5.5, 'max': 9.5, 'label': 'Jagung'},
            'Cabai Merah': {'base': 8.5, 'min': 6.0, 'max': 12.0, 'label': 'Cabai Merah'},
            'Bawang Merah': {'base': 9.8, 'min': 7.5, 'max': 13.5, 'label': 'Bawang Merah'},
            'Tomat': {'base': 18.5, 'min': 14.0, 'max': 25.0, 'label': 'Tomat'},
            'Salak Pondoh': {'base': 16.0, 'min': 12.0, 'max': 22.0, 'label': 'Salak Pondoh'},
            'Kacang Tanah': {'base': 2.8, 'min': 1.8, 'max': 3.8, 'label': 'Kacang Tanah'}
        }

        cfg = COMMODITY_YIELD_CONFIG.get(commodity)
        if not cfg:
            for k_com, v_com in COMMODITY_YIELD_CONFIG.items():
                if k_com.lower() in commodity.lower():
                    cfg = v_com
                    break
        if not cfg:
            cfg = COMMODITY_YIELD_CONFIG['Cabai Merah']

        # Penyesuaian dinamis agar hasil panen bervariasi sesuai parameter spesifik tanah
        ph_factor = 1.0 - (abs(ph - 6.5) * 0.05)
        hum_factor = 1.0 - (abs(kelembapan - 60) * 0.003)
        npk_factor = 1.0 + ((n - 140) * 0.0005) + ((p - 45) * 0.001) + ((k - 190) * 0.0005)
        
        health_multiplier = ph_factor * hum_factor * npk_factor
        predicted_yield = cfg['base'] * health_multiplier
        predicted_yield = max(cfg['min'], min(cfg['max'], predicted_yield))

        yield_min = round(max(cfg['min'], predicted_yield * 0.88), 1)
        yield_max = round(min(cfg['max'] * 1.1, predicted_yield * 1.12), 1)
        # Perhitungan panen proporsional terhadap luas lahan
        total_kg_est = round(predicted_yield * area_ha * 1000, 1)
        total_ton_est = round(predicted_yield * area_ha, 3)
        range_min_kg = round(yield_min * area_ha * 1000, 0)
        range_max_kg = round(yield_max * area_ha * 1000, 0)
        range_min_ton = round(yield_min * area_ha, 2)
        range_max_ton = round(yield_max * area_ha, 2)

        area_sqm = round(area_ha * 10000, 1)
        if area_ha < 1.0:
            panen_petak_str = f"{int(range_min_kg):,} - {int(range_max_kg):,} kg (est. ~{int(total_kg_est):,} kg)"
            ringkasan_luas = f"{int(area_sqm)} m² ({area_ha} Ha)"
        else:
            panen_petak_str = f"{range_min_ton} - {range_max_ton} ton (est. ~{total_ton_est} ton)"
            ringkasan_luas = f"{area_ha} Ha ({int(area_sqm)} m²)"

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
            "komoditas": commodity,
            "estimasi_hasil_panen_ton_ha": round(float(predicted_yield), 2),
            "range_hasil_panen_ton_ha": f"{yield_min} - {yield_max}",
            "estimasi_total_panen_ton": total_ton_est,
            "estimasi_total_panen_kg": total_kg_est,
            "panen_petak_str": panen_petak_str,
            "area_ha": round(area_ha, 3),
            "area_sqm": int(area_sqm),
            "confidence_score": round(confidence, 2),
            "parameters_analyzed": {
                "pH": ph,
                "kelembapan": kelembapan,
                "nitrogen": n,
                "fosfor": p,
                "kalium": k,
                "NDVI": ndvi,
                "komoditas": commodity,
                "area_ha": area_ha,
                "area_sqm": area_sqm
            },
            "rekomendasi_tindakan": rekomendasi_tindakan,
            "catatan_lokasi": (
                f"Prediksi panen {commodity} pada lahan {ringkasan_luas}: potensi {panen_petak_str} (produktivitas standar {yield_min}–{yield_max} ton/ha)."
            )
        }

# Singleton instance
ml_engine = TanacakraMLEngine()
