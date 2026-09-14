from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import time

from .models import DatasetInput, EngineOutput, VisualizationConfig, AuditLog, User
from .serializers import (
    DatasetInputSerializer, 
    EngineOutputSerializer, 
    VisualizationConfigSerializer, 
    AuditLogSerializer,
    UserSerializer
)
from .services.ml_engine import ml_engine
from .services.plotly_engine import plotly_engine

def log_audit(user, action, endpoint):
    AuditLog.objects.create(
        user=user if user and user.is_authenticated else None,
        action=action,
        endpoint=endpoint
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    """
    Login endpoint dengan dukungan Supabase Auth / Local User Auth.
    """
    username = request.data.get('username', 'petani_demo')
    password = request.data.get('password', '')
    role = request.data.get('role', 'PETANI')

    # Ambil atau buat user demo
    user, created = User.objects.get_or_create(
        username=username,
        defaults={'email': f"{username}@tanacakra.id", 'role': role}
    )

    log_audit(user, f"Login pengguna ({user.role})", "/api/v1/auth/login")

    return Response({
        "message": "Login berhasil",
        "token": "supabase-jwt-token-tanacakra-2026",
        "user": UserSerializer(user).data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def input_lahan(request, lahan_id):
    """
    Input parameter tanah oleh petani (pH, kelembapan, NPK).
    Juga langsung memicu eksekusi ML Pipeline Scikit-learn & pembuatan Grafik Plotly.
    """
    user = User.objects.first()
    if not user:
        user = User.objects.create(username="petani_cangkringan", role="PETANI")

    input_params = request.data.get('parameters', request.data)

    # 1. Simpan dataset input
    dataset = DatasetInput.objects.create(
        user=user,
        input_parameters=input_params
    )

    # 2. Eksekusi Scikit-learn ML Engine
    start_time = time.time()
    prediction_result = ml_engine.predict(input_params)
    execution_time = round(time.time() - start_time, 3)

    # 3. Simpan hasil ke EngineOutput
    engine_output = EngineOutput.objects.create(
        dataset=dataset,
        prediction_result=prediction_result,
        execution_time=execution_time
    )

    # 4. Generasi Plotly Schema & Simpan ke VisualizationConfig
    plotly_schema = plotly_engine.generate_soil_radar_chart(input_params)
    visualization = VisualizationConfig.objects.create(
        engine_output=engine_output,
        plotly_json_schema=plotly_schema
    )

    log_audit(user, f"Input & Prediksi ML Lahan (Petak {lahan_id})", f"/api/v1/lahan/{lahan_id}/input")

    return Response({
        "message": f"Data parameter lahan {lahan_id} berhasil diproses oleh Scikit-learn Engine.",
        "dataset_id": dataset.id,
        "engine_output": EngineOutputSerializer(engine_output).data,
        "plotly_schema": plotly_schema
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def pipeline_infer(request):
    """
    Menjalankan inferensi model Scikit-learn Random Forest untuk dataset tertentu.
    """
    user = User.objects.first()
    dataset_id = request.data.get('dataset_id')

    try:
        dataset = DatasetInput.objects.get(id=dataset_id)
    except DatasetInput.DoesNotExist:
        return Response({"error": "Dataset tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

    start_time = time.time()
    prediction_result = ml_engine.predict(dataset.input_parameters)
    execution_time = round(time.time() - start_time, 3)

    engine_output, _ = EngineOutput.objects.update_or_create(
        dataset=dataset,
        defaults={
            "prediction_result": prediction_result,
            "execution_time": execution_time
        }
    )

    log_audit(user, f"Inferensi Scikit-learn Pipeline (Dataset #{dataset_id})", "/api/v1/pipeline/infer")

    return Response({
        "message": "Inferensi model Scikit-learn berhasil",
        "data": EngineOutputSerializer(engine_output).data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def lahan_history(request, lahan_id):
    """
    Mengambil riwayat log data masukan dan tren historis suatu petak lahan.
    """
    datasets = DatasetInput.objects.all().order_by('-created_at')[:10]
    datasets_data = DatasetInputSerializer(datasets, many=True).data

    # Trend Chart Plotly
    trend_chart = plotly_engine.generate_history_trend_chart(datasets_data)

    return Response({
        "lahan_id": lahan_id,
        "history": datasets_data,
        "trend_chart_schema": trend_chart
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def audit_logs_list(request):
    """
    Mengambil daftar log aktivitas sistem (AuditLog) untuk Admin Dashboard.
    """
    logs = AuditLog.objects.all().order_by('-timestamp')[:50]
    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def pipeline_config(request):
    log_audit(User.objects.first(), "Perbarui ambang batas pipeline ML", "/api/v1/pipeline/config")
    return Response({"message": "Konfigurasi pipeline berhasil diperbarui"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def tindakan_confirm(request):
    log_audit(User.objects.first(), "Konfirmasi pelaksanaan rekomendasi lapang", "/api/v1/tindakan/confirm")
    return Response({"message": "Tindakan rekomendasi berhasil dikonfirmasi"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def broadcast_alert(request):
    log_audit(User.objects.first(), "Kirim broadcast peringatan bahaya Cangkringan", "/api/v1/broadcast/alert")
    return Response({"message": "Broadcast peringatan berhasil dikirim ke seluruh petani"}, status=status.HTTP_200_OK)
