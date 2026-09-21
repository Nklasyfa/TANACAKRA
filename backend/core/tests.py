from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from core.models import User, DatasetInput, EngineOutput, VisualizationConfig, AuditLog
from core.services.ml_engine import ml_engine
from core.services.plotly_engine import plotly_engine

class TanacakraModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(username="test_petani", email="petani@test.id", role="PETANI")

    def test_create_user(self):
        self.assertEqual(self.user.username, "test_petani")
        self.assertEqual(self.user.role, "PETANI")

    def test_create_dataset_and_engine_output(self):
        dataset = DatasetInput.objects.create(
            user=self.user,
            input_parameters={"pH": 6.5, "kelembapan": 70, "nitrogen": 120, "fosfor": 45, "kalium": 150}
        )
        engine_output = EngineOutput.objects.create(
            dataset=dataset,
            prediction_result={"status_kesehatan": "Kondisi Optimal"},
            execution_time=0.012
        )
        vis_config = VisualizationConfig.objects.create(
            engine_output=engine_output,
            plotly_json_schema={"data": [], "layout": {}}
        )

        self.assertEqual(dataset.user, self.user)
        self.assertEqual(engine_output.prediction_result["status_kesehatan"], "Kondisi Optimal")
        self.assertIsNotNone(vis_config.id)

class TanacakraMLEngineTests(TestCase):
    def test_ml_prediction_optimal(self):
        input_data = {"pH": 6.5, "kelembapan": 70, "nitrogen": 100, "fosfor": 35, "kalium": 130}
        res = ml_engine.predict(input_data)
        self.assertIn("status_kesehatan", res)
        self.assertIn("rekomendasi_tindakan", res)
        self.assertIn("estimasi_hasil_panen_ton_ha", res)

    def test_ml_prediction_acidic_soil(self):
        input_data = {"pH": 5.0, "kelembapan": 30, "nitrogen": 40, "fosfor": 15, "kalium": 50}
        res = ml_engine.predict(input_data)
        self.assertEqual(res["status_kesehatan"], "Perlu Pembenahan pH")
        self.assertTrue(any("Dolomit" in r for r in res["rekomendasi_tindakan"]))

class TanacakraPlotlyEngineTests(TestCase):
    def test_radar_chart_generation(self):
        input_data = {"pH": 6.5, "kelembapan": 65, "nitrogen": 100, "fosfor": 35, "kalium": 130}
        schema = plotly_engine.generate_soil_radar_chart(input_data)
        self.assertIn("data", schema)
        self.assertIn("layout", schema)
        self.assertEqual(schema["data"][0]["type"], "scatterpolar")

    def test_trend_chart_generation(self):
        mock_history = [
            {"created_at": "2026-09-14T00:00:00Z", "input_parameters": {"pH": 6.5, "kelembapan": 70}}
        ]
        schema = plotly_engine.generate_history_trend_chart(mock_history)
        self.assertIn("data", schema)
        self.assertEqual(len(schema["data"]), 2)

class TanacakraAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.petani = User.objects.create_user(
            username="petani_test", email="petani_test@test.id", password="password123", role="PETANI"
        )
        self.admin = User.objects.create_user(
            username="admin_test", email="admin_test@test.id", password="adminpass", role="ADMIN"
        )

    def _login(self, username, password):
        return self.client.post(
            reverse('auth-login'),
            {"username": username, "password": password},
            format='json'
        )

    def test_auth_login_valid(self):
        response = self._login("petani_test", "password123")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("token", response.data)
        self.assertEqual(response.data["user"]["role"], "PETANI")

    def test_auth_login_wrong_password(self):
        response = self._login("petani_test", "salah-password")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auth_login_rejects_unknown_user(self):
        response = self._login("bukan_user", "password123")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_auth_login_ignores_role_claim(self):
        # Role diabaikan: klien mengaku ADMIN tetapi user aslinya PETANI
        response = self._login("petani_test", "password123")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resp2 = self.client.post(
            reverse('auth-login'),
            {"username": "petani_test", "password": "password123", "role": "ADMIN"},
            format='json'
        )
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)
        self.assertEqual(resp2.data["user"]["role"], "PETANI")

    def test_unauthenticated_access_rejected(self):
        response = self.client.get(reverse('lahan-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_input_lahan_requires_auth(self):
        payload = {"pH": 6.5, "kelembapan": 65, "nitrogen": 100, "fosfor": 35, "kalium": 130}
        response = self.client.post(reverse('input-lahan', kwargs={'lahan_id': 'CGK001'}), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_input_lahan_valid(self):
        self.client.force_authenticate(user=self.petani)
        payload = {"pH": 6.5, "kelembapan": 65, "nitrogen": 100, "fosfor": 35, "kalium": 130}
        response = self.client.post(reverse('input-lahan', kwargs={'lahan_id': 'CGK001'}), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("engine_output", response.data)

    def test_input_lahan_invalid_schema(self):
        self.client.force_authenticate(user=self.petani)
        payload = {"pH": 99.0} # pH > 14 is invalid
        response = self.client.post(reverse('input-lahan', kwargs={'lahan_id': 'CGK001'}), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_lahan_list_endpoint(self):
        self.client.force_authenticate(user=self.petani)
        response = self.client.get(reverse('lahan-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_audit_logs_admin_only(self):
        # Petani ditolak
        self.client.force_authenticate(user=self.petani)
        response = self.client.get(reverse('audit-logs-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Admin diizinkan
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(reverse('audit-logs-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_users_admin_only(self):
        self.client.force_authenticate(user=self.petani)
        response = self.client.get(reverse('users-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_broadcast_admin_only(self):
        self.client.force_authenticate(user=self.petani)
        response = self.client.post(reverse('broadcast-alert'), {"pesan": "uji"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)