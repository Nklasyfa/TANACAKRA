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

class PlantingData(models.Model):
    planting_id = models.CharField(max_length=50, primary_key=True)
    farm_id = models.CharField(max_length=50)
    date = models.DateField(null=True, blank=True)
    commodity = models.CharField(max_length=100)
    variety = models.CharField(max_length=100, null=True, blank=True)
    season = models.CharField(max_length=50, null=True, blank=True)
    area_planted_ha = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.planting_id} - {self.commodity} ({self.farm_id})"

class HarvestData(models.Model):
    harvest_id = models.CharField(max_length=50, primary_key=True)
    planting_id = models.CharField(max_length=50)
    date_harvest = models.DateField(null=True, blank=True)
    commodity = models.CharField(max_length=100)
    area_harvested_ha = models.FloatField(default=0.0)
    production_ton = models.FloatField(default=0.0)
    yield_ton_ha = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.harvest_id} - {self.commodity}"

class PriceData(models.Model):
    date = models.DateField(null=True, blank=True)
    commodity = models.CharField(max_length=100)
    price_rp_per_kg = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.commodity} - Rp {self.price_rp_per_kg}/kg ({self.date})"

class CostData(models.Model):
    planting_id = models.CharField(max_length=50)
    category = models.CharField(max_length=100)
    amount = models.FloatField(default=0.0)
    expense_date = models.DateField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.planting_id} - {self.category}: Rp {self.amount}"


class WeatherData(models.Model):
    date = models.DateField()
    rainfall_mm = models.DecimalField(max_digits=10, decimal_places=2)
    temperature_c = models.DecimalField(max_digits=6, decimal_places=2)
    humidity_percent = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Weather {self.date} - Rain: {self.rainfall_mm}mm, Temp: {self.temperature_c}°C, Humidity: {self.humidity_percent}%"


class PestDiseaseData(models.Model):
    date = models.DateField()
    commodity = models.CharField(max_length=50)
    pest_disease = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=[('Low', 'Low'), ('Medium', 'Medium'), ('High', 'High')])

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.commodity} - {self.pest_disease} ({self.severity}) on {self.date}"


class GISData(models.Model):
    farm_id = models.CharField(max_length=20)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    ndvi = models.DecimalField(max_digits=5, decimal_places=3)
    land_cover = models.CharField(max_length=100)

    class Meta:
        ordering = ['farm_id']

    def __str__(self):
        return f"GIS {self.farm_id} - NDVI: {self.ndvi}"

