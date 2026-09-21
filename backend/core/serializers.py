from rest_framework import serializers
from .models import User, DatasetInput, EngineOutput, VisualizationConfig, AuditLog, WeatherData, PestDiseaseData, GISData, PriceData, HarvestData, PlantingData, CostData

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class EngineOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineOutput
        fields = ['id', 'dataset', 'prediction_result', 'execution_time', 'created_at']

class VisualizationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualizationConfig
        fields = ['id', 'engine_output', 'plotly_json_schema', 'created_at']

class DatasetInputSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    output = EngineOutputSerializer(read_only=True)

    class Meta:
        model = DatasetInput
        fields = ['id', 'user', 'input_parameters', 'created_at', 'output']

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'endpoint', 'timestamp']

class WeatherDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherData
        fields = ['id', 'date', 'rainfall_mm', 'temperature_c', 'humidity_percent']

class PestDiseaseDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PestDiseaseData
        fields = ['id', 'date', 'commodity', 'pest_disease', 'severity']

class GISDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = GISData
        fields = ['id', 'farm_id', 'latitude', 'longitude', 'ndvi', 'land_cover']

class KabarTaniItemSerializer(serializers.Serializer):
    id = serializers.CharField()
    category = serializers.CharField()
    title = serializers.CharField()
    summary = serializers.CharField()
    metrics = serializers.DictField()
    severity = serializers.CharField()
    timestamp = serializers.DateTimeField()
    source = serializers.CharField()
    cta_url = serializers.CharField()

class KabarTaniFeaturedSerializer(serializers.Serializer):
    title = serializers.CharField()
    summary = serializers.CharField()
    category = serializers.CharField()
    metrics = serializers.DictField()
    timestamp = serializers.DateTimeField()
    cta_url = serializers.CharField()

class KabarTaniFeedSerializer(serializers.Serializer):
    featured = KabarTaniFeaturedSerializer()
    items = KabarTaniItemSerializer(many=True)
    categories = serializers.DictField()

class LandInputValidationSerializer(serializers.Serializer):
    pH = serializers.FloatField(min_value=0.0, max_value=14.0, required=False)
    soil_ph = serializers.FloatField(min_value=0.0, max_value=14.0, required=False)
    kelembapan = serializers.FloatField(min_value=0.0, max_value=100.0, required=False)
    humidity_percent = serializers.FloatField(min_value=0.0, max_value=100.0, required=False)
    nitrogen = serializers.FloatField(min_value=0.0, required=False)
    fosfor = serializers.FloatField(min_value=0.0, required=False)
    kalium = serializers.FloatField(min_value=0.0, required=False)
    kondisi_tanah = serializers.ChoiceField(choices=['Kering', 'Lembab', 'Basah'], required=False)

    def validate(self, data):
        # Validate at least pH or soil_ph exists
        if 'pH' not in data and 'soil_ph' not in data:
            data['pH'] = 6.5
        if 'kelembapan' not in data and 'humidity_percent' not in data:
            kondisi = data.get('kondisi_tanah')
            if kondisi == 'Kering':
                data['kelembapan'] = 30.0
            elif kondisi == 'Basah':
                data['kelembapan'] = 80.0
            else:
                data['kelembapan'] = 50.0
            if not kondisi:
                data['kondisi_tanah'] = 'Lembab'
        return data
