import numpy as np
from sklearn.ensemble import RandomForestClassifier
import logging

logger = logging.getLogger(__name__)

class TanacakraMLEngine:
    """
    Data Science Pipeline independen berbasis Scikit-learn.
    Memprediksi status kesehatan tanah, rekomendasi pupuk, dan tingkat risiko lahan pertanian Cangkringan.
    """
    def __init__(self):
        self._is_trained = False
        self.model = RandomForestClassifier(n_estimators=10, random_state=42)
        self.classes_labels = ["Sangat Baik", "Perlu Pembenahan pH", "Kurang Nutrisi NPK", "Kritis / Kering"]
        self._train_dummy_model()

    def _train_dummy_model(self):
        """
        Latih model Random Forest dengan dataset dasar parameter tanah:
        Feature vector: [pH, Kelembapan(%), N(ppm), P(ppm), K(ppm)]
        """
        X = np.array([
            [6.5, 70, 120, 45, 150], # Optimal -> 0 (Sangat Baik)
            [6.8, 65, 110, 40, 140], # Optimal -> 0
            [5.2, 60, 100, 35, 120], # pH Rendah -> 1 (Perlu Pembenahan pH)
            [4.8, 55, 90, 30, 110],  # pH Asam -> 1
            [6.5, 60, 30, 15, 40],   # Nutrisi Rendah -> 2 (Kurang Nutrisi NPK)
            [6.2, 55, 40, 20, 50],   # Nutrisi Rendah -> 2
            [5.0, 20, 20, 10, 20],   # Kritis -> 3 (Kritis / Kering)
            [4.5, 25, 25, 15, 30],   # Kritis -> 3
        ])
        y = np.array([0, 0, 1, 1, 2, 2, 3, 3])
        self.model.fit(X, y)
        self._is_trained = True

    def predict(self, input_parameters: dict) -> dict:
        """
        Mengeksekusi inferensi Scikit-learn berdasarkan dictionary parameter tanah.
        """
        ph = float(input_parameters.get('pH', input_parameters.get('ph', 6.5)))
        kelembapan = float(input_parameters.get('kelembapan', input_parameters.get('moisture', 60)))
        n = float(input_parameters.get('nitrogen', input_parameters.get('n', 100)))
        p = float(input_parameters.get('fosfor', input_parameters.get('p', 35)))
        k = float(input_parameters.get('kalium', input_parameters.get('k', 130)))

        features = np.array([[ph, kelembapan, n, p, k]])
        pred_idx = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        confidence = float(np.max(probabilities))

        status_kesehatan = self.classes_labels[pred_idx]

        # Logika Rekomendasi Berbasis Hasil ML & Parameter Cangkringan
        rekomendasi_tindakan = []
        if ph < 6.0:
            rekomendasi_tindakan.append(f"Aplikasi Kapur Kapur Dolomit: {round((6.5 - ph) * 200, 0)} kg/ha untuk menaikkan pH tanah.")
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
            "confidence_score": round(confidence, 2),
            "parameters_analyzed": {
                "pH": ph,
                "kelembapan": kelembapan,
                "nitrogen": n,
                "fosfor": p,
                "kalium": k
            },
            "rekomendasi_tindakan": rekomendasi_tindakan,
            "catatan_lokasi": "Disesuaikan untuk karakteristik tanah vulkanik Cangkringan, Sleman, DIY."
        }

# Singleton instance
ml_engine = TanacakraMLEngine()
