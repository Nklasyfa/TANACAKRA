from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('PETANI', 'Petani'),
        ('ADMIN', 'Admin / Kelompok Tani / Penyuluh'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='PETANI')

    def __str__(self):
        return f"{self.username} ({self.role})"

class DatasetInput(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='datasets')
    input_parameters = models.JSONField(help_text="Simpan parameter tanah seperti pH, kelembapan, dsb.")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dataset {self.id} by {self.user.username}"

class EngineOutput(models.Model):
    dataset = models.OneToOneField(DatasetInput, on_delete=models.CASCADE, related_name='output')
    prediction_result = models.JSONField(help_text="Hasil rekomendasi/prediksi dari Scikit-learn")
    execution_time = models.FloatField(help_text="Lama eksekusi dalam detik", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Output for Dataset {self.dataset.id}"

class VisualizationConfig(models.Model):
    engine_output = models.OneToOneField(EngineOutput, on_delete=models.CASCADE, related_name='visualization')
    plotly_json_schema = models.JSONField(help_text="Skema JSON untuk dirender oleh Plotly.js di frontend Vue")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Visualization Config for Output {self.engine_output.id}"

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=255)
    endpoint = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"
