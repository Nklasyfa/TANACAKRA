from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import time

from .models import DatasetInput, EngineOutput, AuditLog, User
from .serializers import DatasetInputSerializer, EngineOutputSerializer

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
    Mock login endpoint. In production, this would be handled by Supabase Auth,
    and we would validate the JWT token here or via middleware.
    """
    # For now, just return a mock success
    return Response({
        "message": "Login berhasil",
        "token": "dummy-jwt-token-from-supabase",
        "user": {
            "id": 1,
            "username": "petani_demo",
            "role": "PETANI"
        }
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny]) # Change to IsAuthenticated later when auth is fully integrated
def input_lahan(request, lahan_id):
    """
    Input parameter masukan tanah lapangan oleh petani (pH, kelembapan, NPK).
    """
    # Simulate user for now
    user = User.objects.first()
    
    # Save input parameters
    dataset = DatasetInput.objects.create(
        user=user,
        input_parameters=request.data.get('parameters', {})
    )
    
    log_audit(user, f"Input dataset lahan baru (Petak {lahan_id})", f"/api/v1/lahan/{lahan_id}/input")
    
    serializer = DatasetInputSerializer(dataset)
    return Response({
        "message": f"Data parameter lahan {lahan_id} berhasil disimpan.",
        "data": serializer.data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def pipeline_infer(request):
    """
    Menjalankan inferensi model Scikit-learn Random Forest untuk menghasilkan rekomendasi pupuk dan tindakan.
    """
    user = User.objects.first()
    dataset_id = request.data.get('dataset_id')
    
    try:
        dataset = DatasetInput.objects.get(id=dataset_id)
    except DatasetInput.DoesNotExist:
        return Response({"error": "Dataset tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)
        
    start_time = time.time()
    
    # --- MOCK ML PIPELINE EXECUTION ---
    # In Epic 4, we will load the scikit-learn model here and call model.predict()
    prediction_result = {
        "status": "Perlu Retrain" if dataset.input_parameters.get('pH', 7) < 6 else "Optimal",
        "rekomendasi_pupuk": "Dolomit 150 kg/ha" if dataset.input_parameters.get('pH', 7) < 6 else "Pupuk NPK Standar",
        "confidence_score": 0.92
    }
    
    execution_time = round(time.time() - start_time, 2)
    
    engine_output = EngineOutput.objects.create(
        dataset=dataset,
        prediction_result=prediction_result,
        execution_time=execution_time
    )
    
    log_audit(user, "Inferensi rekomendasi pupuk", "/api/v1/pipeline/infer")
    
    serializer = EngineOutputSerializer(engine_output)
    return Response({
        "message": "Inferensi model berhasil",
        "data": serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def lahan_history(request, lahan_id):
    """
    Mengambil riwayat log data masukan dan tren 14 hari terakhir suatu petak.
    (Currently fetches all datasets for simplicity)
    """
    datasets = DatasetInput.objects.all().order_by('-created_at')[:10]
    serializer = DatasetInputSerializer(datasets, many=True)
    return Response({
        "lahan_id": lahan_id,
        "history": serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def pipeline_config(request):
    """
    Memperbarui konfigurasi parameter ambang batas pipeline ML secara global atau per petak.
    """
    log_audit(User.objects.first(), "Perbarui ambang batas pipeline", "/api/v1/pipeline/config")
    return Response({"message": "Konfigurasi pipeline berhasil diperbarui"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def tindakan_confirm(request):
    """
    Konfirmasi petani setelah melaksanakan rekomendasi lapang (misal penaburan dolomit).
    """
    log_audit(User.objects.first(), "Konfirmasi pelaksanaan rekomendasi", "/api/v1/tindakan/confirm")
    return Response({"message": "Tindakan berhasil dikonfirmasi"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def broadcast_alert(request):
    """
    Pengiriman peringatan dini risiko lahar dingin/anomali tanah ke kontak WhatsApp petani.
    """
    log_audit(User.objects.first(), "Kirim broadcast peringatan bahaya", "/api/v1/broadcast/alert")
    return Response({"message": "Broadcast peringatan berhasil dikirim"}, status=status.HTTP_200_OK)
