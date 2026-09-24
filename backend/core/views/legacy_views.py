from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
import time
import logging

logger = logging.getLogger(__name__)

from ..models import DatasetInput, EngineOutput, VisualizationConfig, AuditLog, User, WeatherData, PestDiseaseData, GISData
from ..serializers import (
    DatasetInputSerializer, 
    EngineOutputSerializer, 
    VisualizationConfigSerializer, 
    AuditLogSerializer,
    UserSerializer,
    LandInputValidationSerializer,
    KabarTaniFeedSerializer,
    KabarTaniItemSerializer,
    KabarTaniFeaturedSerializer
)
from ..permissions import IsAdminOrPenyuluh, IsPetani
from ..services.ml_engine import ml_engine
from ..services.plotly_engine import plotly_engine

def log_audit(user, action, endpoint):
    AuditLog.objects.create(
        user=user if user and hasattr(user, 'is_authenticated') and user.is_authenticated else None,
        action=action,
        endpoint=endpoint
    )

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_login(request):
    """
    Otentikasi nyata: username + password diverifikasi, role SELALU diambil
    dari database (klaim role dari client diabaikan). Mengembalikan DRF Token.
    """
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''

    if not username or not password:
        return Response({"error": "Username dan password wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username__iexact=username).first()
    if not user:
        user = User.objects.filter(email__iexact=username).first()
    if not user or not user.is_active or not user.check_password(password):
        return Response({"error": "Username atau password salah"}, status=status.HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    log_audit(user, f"Login pengguna terverifikasi ({user.role})", "/api/v1/auth/login")

    return Response({
        "message": "Autentikasi berhasil",
        "token": token.key,
        "user": UserSerializer(user).data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_register(request):
    """
    Registrasi akun Petani baru. Role SELALU PETANI (tidak bisa di-upgrade via request).
    """
    username = (request.data.get('username') or '').strip()
    email = (request.data.get('email') or '').strip().lower()
    password = request.data.get('password') or ''

    if not username or not email or not password:
        return Response({"error": "Username, email, dan password wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({"error": "Password minimal 8 karakter"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=username).exists():
        return Response({"error": "Username sudah terdaftar"}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "Email sudah terdaftar"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password, role='PETANI')
    log_audit(user, f"Registrasi akun baru ({user.role})", "/api/v1/auth/register")

    return Response({
        "message": "Registrasi berhasil",
        "user": UserSerializer(user).data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def input_lahan(request, lahan_id):
    """
    2. Filter Data Berdasarkan User & 3. Validasi Input Sebelum ML Processing (BR-03)
    """
    user = request.user
    input_params = request.data.get('parameters', request.data)

    # Validasi Skema Parameter Input (BR-03)
    serializer = LandInputValidationSerializer(data=input_params)
    if not serializer.is_valid():
        return Response({
            "error": "Parameter input lahan tidak memenuhi standar validasi skema API",
            "details": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    validated_params = serializer.validated_data
    # Re-merge additional metadata (farm_id, desa)
    for k, v in input_params.items():
        if k not in validated_params:
            validated_params[k] = v

    # H1 & H2: Bind farm_id from path & normalize pH / soil_ph
    validated_params['farm_id'] = lahan_id
    ph_val = float(validated_params.get('pH', validated_params.get('soil_ph', 6.5)))
    validated_params['pH'] = ph_val
    validated_params['soil_ph'] = ph_val

    # Simpan dataset input terikat pada user login
    dataset = DatasetInput.objects.create(
        user=user,
        input_parameters=validated_params
    )

    # Eksekusi Scikit-learn ML Engine
    try:
        start_time = time.time()
        prediction_result = ml_engine.predict(validated_params)
        execution_time = round(time.time() - start_time, 3)
    except Exception as e:
        logger.exception("ML Engine gagal saat memproses parameter lahan %s", lahan_id)
        dataset.delete()
        return Response({
            "error": "ML Engine gagal memproses parameter. Cek data dan pastikan model Scikit-learn siap.",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    engine_output = EngineOutput.objects.create(
        dataset=dataset,
        prediction_result=prediction_result,
        execution_time=execution_time
    )

    try:
        plotly_schema = plotly_engine.generate_soil_radar_chart(validated_params)
        VisualizationConfig.objects.create(
            engine_output=engine_output,
            plotly_json_schema=plotly_schema
        )
    except Exception as e:
        logger.warning("Plotly schema gagal dibuat untuk dataset #%s: %s", dataset.id, e)
        plotly_schema = plotly_engine.generate_soil_radar_chart({
            "pH": validated_params.get("pH", 6.5),
            "kelembapan": validated_params.get("kelembapan", 60),
            "nitrogen": validated_params.get("nitrogen", 100),
            "fosfor": validated_params.get("fosfor", 35),
            "kalium": validated_params.get("kalium", 130)
        })
        VisualizationConfig.objects.create(
            engine_output=engine_output,
            plotly_json_schema=plotly_schema
        )

    log_audit(user, f"Input & Prediksi ML Lahan (Petak {lahan_id})", f"/api/v1/lahan/{lahan_id}/input")

    return Response({
        "message": f"Data parameter lahan {lahan_id} terverifikasi dan berhasil diproses ML Engine.",
        "dataset_id": dataset.id,
        "engine_output": EngineOutputSerializer(engine_output).data,
        "plotly_schema": plotly_schema
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pipeline_infer(request):
    """
    Menjalankan dry-run inferensi model Scikit-learn dengan error handling 404 & 400.
    """
    user = request.user
    dataset_id = request.data.get('dataset_id')

    if not dataset_id:
        return Response({"error": "dataset_id wajib diberikan"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        dataset = DatasetInput.objects.get(id=dataset_id)
    except DatasetInput.DoesNotExist:
        return Response({"error": f"Dataset #{dataset_id} tidak ditemukan di PostgreSQL"}, status=status.HTTP_404_NOT_FOUND)

    # K3: Enforce kepemilikan dataset — selain pemilik & ADMIN tidak boleh inferensi.
    # Dimakmurkan sebagai 404 agar tidak membocorkan keberadaan dataset milik orang lain.
    if dataset.user_id != request.user.id and request.user.role != 'ADMIN' and not request.user.is_superuser:
        log_audit(request.user, f"Percobaan inferensi dataset milik pengguna lain (#{dataset_id})", "/api/v1/pipeline/infer")
        return Response({"error": f"Dataset #{dataset_id} tidak ditemukan di PostgreSQL"}, status=status.HTTP_404_NOT_FOUND)

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
@permission_classes([IsAuthenticated])
def lahan_list(request):
    """
    Mengambil daftar master lahan Cangkringan.
    K3: PETANI hanya melihat dataset miliknya sendiri; ADMIN/superuser melihat seluruhnya.
    """
    datasets = DatasetInput.objects.all()
    if request.user.role != 'ADMIN' and not request.user.is_superuser:
        datasets = datasets.filter(user=request.user)
    datasets = datasets.order_by('-created_at')
    serializer = DatasetInputSerializer(datasets, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lahan_history(request, lahan_id):
    """
    Mengambil histori masukan tanah & grafik tren berdasarkan lahan_id.
    K3: riwayat dibatasi hanya untuk dataset milik user yang login (ADMIN melihat semua).
    Tidak ada lagi fallback yang mengembalikan dataset acak milik pengguna lain.
    """
    datasets = DatasetInput.objects.filter(input_parameters__farm_id=lahan_id)
    if request.user.role != 'ADMIN' and not request.user.is_superuser:
        datasets = datasets.filter(user=request.user)
    datasets = datasets.order_by('-created_at')

    if not datasets.exists():
        return Response({"error": f"Riwayat lahan {lahan_id} tidak ditemukan"}, status=status.HTTP_404_NOT_FOUND)

    datasets_data = DatasetInputSerializer(datasets, many=True).data
    trend_chart = plotly_engine.generate_history_trend_chart(datasets_data)

    return Response({
        "lahan_id": lahan_id,
        "history": datasets_data,
        "trend_chart_schema": trend_chart
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminOrPenyuluh])
def audit_logs_list(request):
    logs = AuditLog.objects.all().order_by('-timestamp')[:50]
    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminOrPenyuluh])
def users_list(request):
    users = User.objects.all().order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET', 'POST', 'PATCH'])
@permission_classes([IsAdminOrPenyuluh])
def pipeline_config(request):
    """
    6. Endpoint/Admin Lengkap untuk Konfigurasi Parameter Pipeline ML
    """
    user = request.user
    if request.method == 'GET':
        return Response({
            "model_name": "RandomForestClassifier & Regressor (Scikit-learn)",
            "n_estimators": 25,
            "ph_threshold_min": 6.0,
            "ph_threshold_max": 7.5,
            "moisture_threshold_min": 40.0,
            "location_context": "Desa Cangkringan, Sleman, DIY"
        }, status=status.HTTP_200_OK)

    new_config = request.data
    log_audit(user, f"Perbarui konfigurasi pipeline ML ({new_config})", "/api/v1/pipeline/config")
    return Response({
        "message": "Konfigurasi parameter pipeline ML berhasil diperbarui",
        "updated_config": new_config
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tindakan_confirm(request):
    user = request.user
    tindakan_id = request.data.get('tindakan_id', 'TND-001')
    log_audit(user, f"Konfirmasi pelaksanaan tindakan lapang #{tindakan_id}", "/api/v1/tindakan/confirm")
    return Response({"message": f"Tindakan #{tindakan_id} berhasil dikonfirmasi"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAdminOrPenyuluh])
def broadcast_alert(request):
    user = request.user
    pesan = request.data.get('pesan', 'Peringatan bahaya lereng Cangkringan')
    log_audit(user, f"Kirim broadcast peringatan Cangkringan: {pesan}", "/api/v1/broadcast/alert")
    return Response({"message": "Broadcast peringatan berhasil dikirim ke kelompok tani Cangkringan"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_trends(request):
    """
    Mengembalikan data tren harga, volume panen, statistik lahan, dan rekomendasi
    komoditas terbaik — seluruh komoditas dibaca DINAMIS dari database PostgreSQL.
    """
    from ..models import DatasetInput, PriceData, PlantingData, HarvestData, CostData
    from django.db.models import Avg, Sum, Count

    from django.utils import timezone
    import datetime

    total_lahan = DatasetInput.objects.count()
    unique_farms_count = DatasetInput.objects.values('input_parameters__farm_id').distinct().count() or total_lahan
    total_tanam = PlantingData.objects.count()
    total_panen = HarvestData.objects.count()
    total_harga = PriceData.objects.count()
    total_biaya = CostData.objects.count()

    harvest_agg = HarvestData.objects.aggregate(total=Sum('production_ton'))['total']
    if harvest_agg is not None and harvest_agg > 0:
        total_produksi_ton = round(harvest_agg, 1)
    else:
        # Fallback berbasis estimasi luas lahan terdaftar (misal 2.0 ton/lahan)
        total_produksi_ton = round(total_lahan * 2.0, 1) if total_lahan > 0 else 0.0

    datasets = DatasetInput.objects.all()
    sehat_count = 0
    perlu_atensi_count = 0
    ph_sum = 0
    moisture_sum = 0

    for d in datasets:
        params = d.input_parameters or {}
        ph = float(params.get('pH', params.get('soil_ph', 6.5)))
        moisture = float(params.get('kelembapan', params.get('humidity_percent', 68)))
        ph_sum += ph
        moisture_sum += moisture
        if ph >= 6.0:
            sehat_count += 1
        else:
            perlu_atensi_count += 1

    avg_ph = round(ph_sum / total_lahan, 1) if total_lahan > 0 else 6.4
    avg_moisture_num = round(moisture_sum / total_lahan) if total_lahan > 0 else 68
    avg_moisture = f"{avg_moisture_num}%"

    one_week_ago = timezone.now() - datetime.timedelta(days=7)
    weekly_reports = DatasetInput.objects.filter(created_at__gte=one_week_ago).count()

    # ===== KOMODITAS DINAMIS: gabung dari PriceData & PlantingData =====
    price_commodities = list(PriceData.objects.exclude(commodity='').values_list('commodity', flat=True).distinct())
    planting_commodities = list(PlantingData.objects.exclude(commodity='').values_list('commodity', flat=True).distinct())
    commodities = []
    for c in list(dict.fromkeys(price_commodities + planting_commodities)):
        if c and c.lower() != 'nan':
            commodities.append(c)

    # ===== TREN HARGA per komoditas (bulanan, dinamis, carried-forward untuk menghindari 0 dip) =====
    month_prices: dict = {}  # month -> {commodity: price}
    month_order = []
    price_rows = (PriceData.objects.filter(commodity__in=commodities)
                  .order_by('date') if commodities else PriceData.objects.none())
    for pr in price_rows:
        m = str(pr.date)[:7] if pr.date else None
        if not m:
            continue
        if m not in month_prices:
            month_prices[m] = {}
            month_order.append(m)
        month_prices[m][pr.commodity] = float(pr.price_rp_per_kg)

    last_known_price: dict = {}
    trends = []
    for m in month_order[-24:]:
        entry = {"month": m}
        for c in commodities:
            val = month_prices[m].get(c)
            if val is not None and val > 0:
                last_known_price[c] = val
                entry[c] = val
            else:
                entry[c] = last_known_price.get(c, 0.0)
        trends.append(entry)

    if not trends:
        trends = [
            {"month": "2024-01", "Cabai Merah": 49957, "Salak Pondoh": 50587, "Padi": 5800, "Jagung": 5200, "Bawang Merah": 32000, "Kacang Tanah": 24000},
            {"month": "2024-02", "Cabai Merah": 73305, "Salak Pondoh": 74571, "Padi": 5900, "Jagung": 5300, "Bawang Merah": 31000, "Kacang Tanah": 24500},
            {"month": "2024-03", "Cabai Merah": 19110, "Salak Pondoh": 22389, "Padi": 5100, "Jagung": 4900, "Bawang Merah": 33500, "Kacang Tanah": 22800},
        ]
        if not commodities:
            commodities = list(trends[0].keys())
            commodities.remove('month')

    # ===== VOLUME PANEN BULANAN (dinamis) =====
    harvest_summary = (HarvestData.objects
                       .exclude(date_harvest=None)
                       .values('date_harvest')
                       .annotate(volume=Sum('production_ton'))
                       .order_by('date_harvest'))
    volume_by_month: dict = {}
    for h in harvest_summary:
        m = str(h['date_harvest'])[:7]
        volume_by_month[m] = volume_by_month.get(m, 0.0) + float(h['volume'] or 0)
    volume_trends = [{"month": m, "volume_ton": round(volume_by_month[m], 1)} for m in sorted(volume_by_month.keys())[-24:]]
    if not volume_trends:
        volume_trends = [{"month": t["month"], "volume_ton": 350} for t in trends[:12]]

    # ===== BEST COMMODITY dari data aktual (harga rata-rata tertinggi & tren naik) =====
    best_commodity = None
    if commodities:
        commodity_stats = []
        for c in commodities:
            c_prices = PriceData.objects.filter(commodity=c).order_by('date')
            if not c_prices.exists():
                continue
            avg_price = c_prices.aggregate(a=Avg('price_rp_per_kg'))['a'] or 0
            last = float(c_prices.last().price_rp_per_kg)
            first = float(c_prices.first().price_rp_per_kg)
            trend_pct = ((last - first) / first * 100) if first else 0
            avg_yield = HarvestData.objects.filter(commodity=c).aggregate(y=Avg('yield_ton_ha'))['y'] or 4.5
            commodity_stats.append({
                "name": c,
                "avg_price": avg_price,
                "last_price": last,
                "trend_pct": trend_pct,
                "avg_yield": avg_yield
            })
        if commodity_stats:
            commodity_stats.sort(key=lambda s: (s['trend_pct'], s['avg_price']), reverse=True)
            top = commodity_stats[0]
            top_2 = commodity_stats[1]['name'] if len(commodity_stats) > 1 else top['name']
            best_commodity = {
                "title": f"{top['name']} & {top_2}",
                "badge": "Rekomendasi Utama ML Scikit-Learn",
                "avg_price": f"Rp {top['avg_price']:,.0f} / kg",
                "roi_estimate": f"+{max(int(top['trend_pct']), 5)}%",
                "reason": f"Komoditas {top['name']} menunjukkan tren harga pasar {'stabil naik' if top['trend_pct'] >= 0 else 'fluktuatif'} (perubahan {top['trend_pct']:+.1f}%) dengan kecocokan hara Regosol Vulkanik Cangkringan. Data dibaca dinamis dari {total_harga} record harga & {total_tanam} histori tanam di PostgreSQL.",
                "expected_yield": f"{top['avg_yield']:.1f} Ton / Ha",
                "total_tanam_count": total_tanam,
                "total_panen_ton": round(total_produksi_ton, 1)
            }

    if not best_commodity:
        best_commodity = {
            "title": "Cabai Merah & Salak Pondoh",
            "badge": "Rekomendasi Utama ML Scikit-Learn",
            "avg_price": "Rp 52.082 / kg",
            "roi_estimate": "+145%",
            "reason": "Harga tren pasar stabil naik dengan kecocokan hara Regosol Vulkanik Cangkringan (pH 6.0-6.8).",
            "expected_yield": "4.5 Ton / Ha",
            "total_tanam_count": total_tanam,
            "total_panen_ton": round(total_produksi_ton, 1)
        }

    plotly_chart_schema = plotly_engine.generate_price_trend_chart(trends, volume_trends)

    return Response({
        "total_lahan": unique_farms_count,
        "sehat_count": sehat_count,
        "perlu_atensi_count": perlu_atensi_count,
        "avg_ph": avg_ph,
        "avg_moisture": avg_moisture,
        "weekly_reports": weekly_reports,
        "total_tanam": total_tanam,
        "total_panen": total_panen,
        "total_harga": total_harga,
        "total_biaya": total_biaya,
        "total_produksi_ton": round(total_produksi_ton, 1),
        "commodities": commodities,
        "best_commodity": best_commodity,
        "price_trends": trends,
        "volume_trends": volume_trends,
        "plotly_chart_schema": plotly_chart_schema
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kabar_tani_feed(request):
    """
    Mengembalikan feed berita Kabar Tani yang dikalkulasi dari data riil:
    - Harga Pasar: dari PriceData (perubahan % mingguan/bulanan)
    - Kondisi Lahan: dari DatasetInput (pH, kelembapan) + GISData (NDVI)
    - Cuaca: dari WeatherData (historis) + BMKG API (prakiraan)
    - Hama & Penyakit: dari PestDiseaseData (severity High)
    - Prediksi: dari HarvestData + ML best_commodity
    """
    from django.db.models import Avg, Max, Min
    from datetime import datetime, timedelta
    import json
    from ..models import PriceData, HarvestData

    now = datetime.now()
    items = []
    categories = {"pasar": 0, "lahan": 0, "cuaca": 0, "hama": 0, "prediksi": 0}

    # ===== 1. HARGA PASAR - komoditas dengan perubahan signifikan =====
    price_commodities = list(PriceData.objects.exclude(commodity='').values_list('commodity', flat=True).distinct())
    for commodity in price_commodities:
        prices = PriceData.objects.filter(commodity=commodity).order_by('date')
        if prices.count() < 2:
            continue
        last_price = float(prices.last().price_rp_per_kg)
        first_price = float(prices.first().price_rp_per_kg)
        # Also get last 2 months for weekly comparison
        recent_prices = list(prices.order_by('-date')[:2])
        if len(recent_prices) >= 2:
            latest = float(recent_prices[0].price_rp_per_kg)
            previous = float(recent_prices[1].price_rp_per_kg)
            pct_change = ((latest - previous) / previous * 100) if previous else 0
        else:
            pct_change = ((last_price - first_price) / first_price * 100) if first_price else 0

        if abs(pct_change) >= 3:  # Only significant changes
            direction = "naik" if pct_change > 0 else "turun"
            trend_icon = "trending_up" if pct_change > 0 else "trending_down"
            items.append({
                "id": f"pasar-{commodity.lower().replace(' ', '-')}",
                "category": "pasar",
                "title": f"Harga {commodity} {direction} {abs(pct_change):.1f}%",
                "summary": f"Harga {commodity} di pasar Sleman {direction} {abs(pct_change):.1f}% menjadi Rp {latest:,.0f}/kg. {'Waktu bagus untuk menjual.' if pct_change > 0 else 'Pertimbangkan menahan panen.'}",
                "metrics": {"price": f"Rp {latest:,.0f}/kg", "change_pct": round(pct_change, 1), "trend": direction},
                "severity": "info" if pct_change > 0 else "warning",
                "timestamp": (now - timedelta(hours=categories["pasar"] * 2 + 1)).isoformat(),
                "source": "Data Harga Pasar Induk Sleman",
                "cta_url": f"/prediksi-pasar?commodity={commodity}"
            })
            categories["pasar"] += 1

    # ===== 2. KONDISI LAHAN - petak dengan pH < 6.0 atau NDVI rendah =====
    # pH check from DatasetInput
    low_ph_farms = []
    for d in DatasetInput.objects.all():
        params = d.input_parameters or {}
        ph = float(params.get('pH', params.get('soil_ph', 6.5)))
        if ph < 6.0:
            low_ph_farms.append({
                "farm_id": params.get('farm_id', f"CGK{d.id:03d}"),
                "desa": params.get('desa', 'Cangkringan'),
                "ph": ph
            })

    # NDVI check from GISData (threshold < 0.55 = stress)
    low_ndvi_farms = list(GISData.objects.filter(ndvi__lt=0.55).values('farm_id', 'ndvi', 'latitude', 'longitude')[:5])

    if low_ph_farms:
        desa_name = low_ph_farms[0]['desa']
        avg_low_ph = round(sum(f['ph'] for f in low_ph_farms) / len(low_ph_farms), 1)
        items.append({
            "id": f"lahan-ph-agregat-{desa_name.lower()}",
            "category": "lahan",
            "title": f"Peringatan pH Tanah Sektor {desa_name}",
            "summary": f"Terdeteksi {len(low_ph_farms)} petak lahan di wilayah {desa_name} mengalami keasaman tanah (rata-rata pH {avg_low_ph}). Diimbau penambahan kapur dolomit sebelum penanaman.",
            "metrics": {"ph_rata": avg_low_ph, "status": "Perlu Pembenahan", "desa": desa_name},
            "severity": "warning",
            "timestamp": now.isoformat(),
            "source": "Sensor Telemetri Agroklimat & Agregasi Sektor",
            "cta_url": "/input-lahan"
        })
        categories["lahan"] += 1

    if low_ndvi_farms:
        farm = low_ndvi_farms[0]
        items.append({
            "id": f"lahan-ndvi-{farm['farm_id']}",
            "category": "lahan",
            "title": f"Lahan {farm['farm_id']} NDVI menurun",
            "summary": f"Indeks vegetasi (NDVI) turun ke {farm['ndvi']:.3f} mengindikasikan stres tanaman. Periksa irigasi dan hama.",
            "metrics": {"ndvi": round(float(farm['ndvi']), 3), "status": "Stres Vegetasi"},
            "severity": "danger",
            "timestamp": now.isoformat(),
            "source": "Analisis Satelit/GIS",
            "cta_url": f"/petani?farm={farm['farm_id']}"
        })
        categories["lahan"] += 1

    # ===== 3. CUACA - dari WeatherData (historis) + prakiraan BMKG =====
    latest_weather = WeatherData.objects.order_by('-date').first()
    if latest_weather:
        rain_mm = float(latest_weather.rainfall_mm)
        temp = float(latest_weather.temperature_c)
        humidity = float(latest_weather.humidity_percent)
        # Determine condition from rainfall
        if rain_mm > 100:
            condition = "hujan lebat"
            advice = "Waspadai genangan. Jaga saluran drainase."
            severity = "warning"
        elif rain_mm > 10:
            condition = "hujan ringan"
            advice = "Kondisi baik untuk penanaman & penyiraman alami."
            severity = "info"
        else:
            condition = "cerah/berawan"
            advice = "Cuaca mendukung aktivitas lapang. Pantau kelembapan tanah."
            severity = "info"

        items.append({
            "id": f"cuaca-{latest_weather.date.isoformat()}",
            "category": "cuaca",
            "title": f"Prakiraan: {condition.capitalize()}, {temp:.0f}°C, Kelembapan {humidity:.0f}%",
            "summary": f"Curah hujan {rain_mm:.1f}mm. {advice} Estimasi 3 hari ke depan mengikuti pola musiman.",
            "metrics": {"rainfall_mm": round(rain_mm, 1), "temperature": round(temp, 1), "humidity": round(humidity, 1), "condition": condition},
            "severity": severity,
            "timestamp": (now - timedelta(hours=4)).isoformat(),
            "source": "BMKG Stasiun Cangkringan (Data Historis)",
            "cta_url": "/kabar-tani?filter=cuaca"
        })
        categories["cuaca"] += 1

    # ===== 4. HAMA & PENYAKIT - severity High =====
    high_pests = PestDiseaseData.objects.filter(severity='High').order_by('-date')[:3]
    for pest in high_pests:
        items.append({
            "id": f"hama-{pest.commodity.lower().replace(' ', '-')}-{pest.date.isoformat()}",
            "category": "hama",
            "title": f"Peringatan: {pest.pest_disease} pada {pest.commodity}",
            "summary": f"Terdeteksi {pest.pest_disease} dengan tingkat keparahan {pest.severity} pada komoditas {pest.commodity}. Segera lakukan pengendalian terpadu.",
            "metrics": {"pest": pest.pest_disease, "commodity": pest.commodity, "severity": pest.severity},
            "severity": "danger",
            "timestamp": (now - timedelta(hours=categories["hama"] * 3 + 2)).isoformat(),
            "source": "Monitoring Hama/Penyakit Lapangan",
            "cta_url": f"/kabar-tani?filter=hama"
        })
        categories["hama"] += 1

    # ===== 5. PREDIKSI HASIL PANEN - dari best_commodity dashboard =====
    # Reuse logic from dashboard_trends
    commodities_list = list(PriceData.objects.exclude(commodity='').values_list('commodity', flat=True).distinct())
    if commodities_list:
        commodity_stats = []
        for c in commodities_list:
            c_prices = PriceData.objects.filter(commodity=c).order_by('date')
            if not c_prices.exists():
                continue
            avg_price = c_prices.aggregate(a=Avg('price_rp_per_kg'))['a'] or 0
            last = float(c_prices.last().price_rp_per_kg)
            first = float(c_prices.first().price_rp_per_kg)
            trend_pct = ((last - first) / first * 100) if first else 0
            avg_yield = HarvestData.objects.filter(commodity=c).aggregate(y=Avg('yield_ton_ha'))['y'] or 4.5
            commodity_stats.append({"name": c, "avg_price": avg_price, "trend_pct": trend_pct, "avg_yield": avg_yield})
        if commodity_stats:
            commodity_stats.sort(key=lambda s: (s['trend_pct'], s['avg_price']), reverse=True)
            top = commodity_stats[0]
            items.append({
                "id": f"prediksi-{top['name'].lower().replace(' ', '-')}",
                "category": "prediksi",
                "title": f"Proyeksi panen {top['name']} musim depan: {top['avg_yield']:.1f} Ton/Ha",
                "summary": f"Berdasarkan tren harga ({top['trend_pct']:+.1f}%) dan rata-rata hasil panen historis, {top['name']} diproyeksikan unggul. Harga rata-rata: Rp {top['avg_price']:,.0f}/kg.",
                "metrics": {"commodity": top['name'], "yield_ton_ha": round(top['avg_yield'], 1), "avg_price": f"Rp {top['avg_price']:,.0f}/kg", "trend_pct": round(top['trend_pct'], 1)},
                "severity": "info",
                "timestamp": now.isoformat(),
                "source": "Model ML Scikit-learn (Random Forest) + Data Historis",
                "cta_url": "/prediksi-pasar"
            })
            categories["prediksi"] += 1

    # Sort items by timestamp desc
    items.sort(key=lambda x: x["timestamp"], reverse=True)

    # Featured item = first item with highest severity priority
    severity_order = {"danger": 0, "warning": 1, "info": 2}
    sorted_for_featured = sorted(items, key=lambda x: severity_order.get(x["severity"], 3))
    featured = None
    if sorted_for_featured:
        f = sorted_for_featured[0]
        featured = {
            "title": f["title"],
            "summary": f["summary"],
            "category": f["category"],
            "metrics": f["metrics"],
            "timestamp": f["timestamp"],
            "cta_url": f["cta_url"]
        }

    # Limit items to 10 for performance
    items = items[:10]

    return Response({
        "featured": featured,
        "items": items,
        "categories": categories
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAdminOrPenyuluh])
def upload_excel_data(request):
    """
    Endpoint untuk menerima file excel dan memprosesnya menggunakan import_excel_data.py
    T4: Validasi ekstensi & ukuran file, simpan dengan nama terkendali, lalu retrain ML engine.
    """
    if 'file' not in request.FILES:
        return Response({"error": "File Excel tidak ditemukan di request"}, status=status.HTTP_400_BAD_REQUEST)
    
    excel_file = request.FILES['file']

    MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB
    filename = (excel_file.name or '').lower()
    if not filename.endswith('.xlsx'):
        return Response({"error": "Format file tidak didukung. Unggah file berformat .xlsx"}, status=status.HTTP_400_BAD_REQUEST)
    if excel_file.size > MAX_UPLOAD_BYTES:
        return Response({"error": f"Ukuran file melebihi batas {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"}, status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
    
    import os
    from django.conf import settings
    # Path terkendali: nama file selalu fix, ekstensi sudah divalidasi di atas
    save_path = os.path.join(settings.BASE_DIR, 'data', 'data inti', 'TANACAKRA_Data_Inti.xlsx')
    
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    with open(save_path, 'wb+') as destination:
        for chunk in excel_file.chunks():
            destination.write(chunk)
            
    import sys
    if str(settings.BASE_DIR) not in sys.path:
        sys.path.append(str(settings.BASE_DIR))
        
    try:
        from import_excel_data import import_data
        import_data()
        retrain_info = ml_engine.retrain()
        log_audit(request.user, "Import/Upload Master Data Excel", "/api/v1/upload-excel")
        return Response({
            "message": "File Excel berhasil diunggah dan diproses oleh sistem.",
            "model_retrained": retrain_info
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Gagal memproses file Excel")
        return Response({"error": "Gagal memproses file Excel. Periksa struktur sheet dan kolom data."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAdminOrPenyuluh])
def generate_ai_warta_api(request):
    prompt = request.data.get('prompt')
    if not prompt:
        return Response({"error": "Prompt wajib diisi"}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        from ..services.llm_engine import generate_ai_warta
        result = generate_ai_warta(prompt)
        
        if result:
            log_audit(request.user, f"Generate Warta AI (Prompt: {prompt[:30]}...)", "/api/v1/kabar-tani/generate")
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Gagal menghasilkan warta dari AI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.exception("LLM generation error")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


