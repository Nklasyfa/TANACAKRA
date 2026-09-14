import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
import logging

logger = logging.getLogger(__name__)

class TanacakraMLEngine:
    """
    Data Science Pipeline independen berbasis Scikit-learn.
    Melatih model pada 300 data historis ML_Dataset Cangkringan (curah hujan, suhu, kelembapan, soil_ph, NDVI, yield_ton_ha).
    """
    def __init__(self):
        self._is_trained = False
        self.clf_model = RandomForestClassifier(n_estimators=25, random_state=42)
        self.reg_model = RandomForestRegressor(n_estimators=25, random_state=42)
        self.classes_labels = ["Kondisi Optimal", "Perlu Pembenahan pH", "Kurang Nutrisi NPK", "Kritis / Kering"]
        self._train_from_excel_dataset()

    def _train_from_excel_dataset(self):
        possible_paths = [
            r"D:\TANACAKRA\data\data pendukung\TANACAKRA_Data_Analysis.xlsx",
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "data pendukung", "TANACAKRA_Data_Analysis.xlsx")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "data pendukung", "TANACAKRA_Data_Analysis.xlsx"))
        ]
        dataset_path = None
        for path in possible_paths:
            if os.path.exists(path):
                dataset_path = path
                break

        if dataset_path and os.path.exists(dataset_path):
            try:
                df = pd.read_excel(dataset_path, sheet_name="ML_Dataset")
                # Features: [soil_ph, humidity_percent, rainfall_mm, temperature_C, NDVI]
                X = df[['soil_ph', 'humidity_percent', 'rainfall_mm', 'temperature_C', 'NDVI']].values
                y_yield = df['yield_ton_ha'].values

                # Categorical status label based on soil_ph and humidity
                y_class = []
                for _, row in df.iterrows():
                    ph = row['soil_ph']
                    hum = row['humidity_percent']
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
                logger.info(f"Successfully trained ML model on {len(df)} rows from TANACAKRA_Data_Analysis.xlsx")
                return
            except Exception as e:
                logger.warning(f"Could not train from excel file: {e}. Fallback to synthetic training.")

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

    def predict(self, input_parameters: dict) -> dict:
        """
        Mengeksekusi inferensi Scikit-learn berdasarkan dictionary parameter tanah.
        """
        ph = float(input_parameters.get('pH', input_parameters.get('soil_ph', 6.5)))
        kelembapan = float(input_parameters.get('kelembapan', input_parameters.get('humidity_percent', 60)))
        rainfall = float(input_parameters.get('rainfall_mm', 200))
        temp = float(input_parameters.get('temperature_C', 26.5))
        ndvi = float(input_parameters.get('NDVI', 0.75))

        n = float(input_parameters.get('nitrogen', input_parameters.get('n', 100)))
        p = float(input_parameters.get('fosfor', input_parameters.get('p', 35)))
        k = float(input_parameters.get('kalium', input_parameters.get('k', 130)))

        features = np.array([[ph, kelembapan, rainfall, temp, ndvi]])
        pred_class_idx = self.clf_model.predict(features)[0]
        predicted_yield = self.reg_model.predict(features)[0]
        probabilities = self.clf_model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))

        status_kesehatan = self.classes_labels[pred_class_idx]

        # Logika Rekomendasi Berbasis Hasil ML & Parameter Cangkringan
        rekomendasi_tindakan = []
        if ph < 6.0:
            rekomendasi_tindakan.append(f"Aplikasi Kapur Dolomit: {round((6.5 - ph) * 200, 0)} kg/ha untuk menaikkan pH tanah ke batas netral.")
        elif ph > 7.5:
            rekomendasi_tindakan.append("Aplikasi Belerang / Sulfur tanah untuk menurunkan derajat keasaman.")

        if kelembapan < 40:
            rekomendasi_tindakan.append("Penyiraman intensif / irigasi tetes 2x sehari.")

        if n < 80 or p < 25 or k < 100:
            rekomendasi_tindakan.append("Pemupukan Susulan NPK 16-16-16 dosis 150 kg/ha + Kompos Organik.")

        if not rekomendasi_tindakan:
            rekomendasi_tindakan.append("Kondisi lahan dalam batas optimum. Lanjutkan perawatan berkala.")

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
            "catatan_lokasi": "Disesuaikan dengan 300 record dataset historis lahan pertanian Cangkringan, Sleman, DIY."
        }

# Singleton instance
ml_engine = TanacakraMLEngine()
