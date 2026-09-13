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
