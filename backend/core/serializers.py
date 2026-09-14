from rest_framework import serializers
from .models import User, DatasetInput, EngineOutput, VisualizationConfig, AuditLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']

class DatasetInputSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = DatasetInput
        fields = ['id', 'user', 'input_parameters', 'created_at']

class EngineOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = EngineOutput
        fields = ['id', 'dataset', 'prediction_result', 'execution_time', 'created_at']

class VisualizationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisualizationConfig
        fields = ['id', 'engine_output', 'plotly_json_schema', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'endpoint', 'timestamp']

class LandInputValidationSerializer(serializers.Serializer):
    pH = serializers.FloatField(min_value=0.0, max_value=14.0, required=False)
    soil_ph = serializers.FloatField(min_value=0.0, max_value=14.0, required=False)
    kelembapan = serializers.FloatField(min_value=0.0, max_value=100.0, required=False)
    humidity_percent = serializers.FloatField(min_value=0.0, max_value=100.0, required=False)
    nitrogen = serializers.FloatField(min_value=0.0, required=False)
    fosfor = serializers.FloatField(min_value=0.0, required=False)
    kalium = serializers.FloatField(min_value=0.0, required=False)

    def validate(self, data):
        # Validate at least pH or soil_ph exists
        if 'pH' not in data and 'soil_ph' not in data:
            data['pH'] = 6.5
        if 'kelembapan' not in data and 'humidity_percent' not in data:
            data['kelembapan'] = 60.0
        return data
