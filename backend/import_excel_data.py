import os
import sys
import django
import pandas as pd

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tanacakra_backend.settings')
django.setup()

from core.models import User, DatasetInput, EngineOutput, VisualizationConfig, AuditLog, PlantingData, HarvestData, PriceData, CostData, WeatherData, PestDiseaseData, GISData

def import_data():
    print("=== STARTING FULL EXCEL DATA IMPORT TO DJANGO POSTGRESQL ===")

    data_dir = r"D:\TANACAKRA\data"
    inti_file = os.path.join(data_dir, "data inti", "TANACAKRA_Data_Inti.xlsx")

    admin_user, _ = User.objects.get_or_create(
        username="admin_cangkringan",
        defaults={"email": "admin@cangkringan.desa.id", "role": "ADMIN"}
    )
    admin_user.role = "ADMIN"
    admin_user.is_staff = True
    admin_user.is_superuser = False
    admin_user.set_password("tanacakra-admin-2026")
    admin_user.save()

    petani_user, _ = User.objects.get_or_create(
        username="petani_cangkringan",
        defaults={"email": "petani@cangkringan.desa.id", "role": "PETANI"}
    )
    petani_user.role = "PETANI"
    petani_user.set_password("tanacakra-petani-2026")
    petani_user.save()

    if not os.path.exists(inti_file):
        print(f"[!] File {inti_file} not found!")
        return

    xls = pd.ExcelFile(inti_file)

    # 1. Data Lahan
    if "Data_Lahan" in xls.sheet_names:
        df_lahan = pd.read_excel(xls, sheet_name="Data_Lahan")
        created_count = 0
        for _, row in df_lahan.iterrows():
            params = {
                "farm_id": str(row.get('farm_id')),
                "desa": str(row.get('desa')),
                "soil_type": str(row.get('soil_type')),
                "soil_ph": float(row.get('soil_ph', 6.5)),
                "organic_carbon": float(row.get('organic_carbon', 2.0)),
                "elevation_m": float(row.get('elevation_m', 600)),
                "area_ha": float(row.get('area_ha', 1.0)),
                "irrigation": str(row.get('irrigation')),
                "latitude": float(row.get('latitude', -7.66)),
                "longitude": float(row.get('longitude', 110.42))
            }
            exists = DatasetInput.objects.filter(input_parameters__farm_id=params["farm_id"]).exists()
            if not exists:
                DatasetInput.objects.create(
                    user=petani_user,
                    input_parameters=params
                )
                created_count += 1
        print(f"[+] Data_Lahan: {len(df_lahan)} loaded, {created_count} imported into DatasetInput.")

    # 2. Data Tanam
    if "Data_Tanam" in xls.sheet_names:
        df_tanam = pd.read_excel(xls, sheet_name="Data_Tanam")
        PlantingData.objects.all().delete()
        planting_objs = []
        for _, row in df_tanam.iterrows():
            d_val = row.get('date')
            d_date = pd.to_datetime(d_val).date() if pd.notnull(d_val) else None
            planting_objs.append(PlantingData(
                planting_id=str(row.get('planting_id')),
                farm_id=str(row.get('farm_id')),
                date=d_date,
                commodity=str(row.get('commodity')),
                variety=str(row.get('variety')) if pd.notnull(row.get('variety')) else '',
                season=str(row.get('season')) if pd.notnull(row.get('season')) else '',
                area_planted_ha=float(row.get('area_planted_ha', 0.0))
            ))
        PlantingData.objects.bulk_create(planting_objs)
        print(f"[+] Data_Tanam: {len(planting_objs)} records imported into PlantingData table.")

    # 3. Data Panen
    if "Data_Panen" in xls.sheet_names:
        df_panen = pd.read_excel(xls, sheet_name="Data_Panen")
        HarvestData.objects.all().delete()
        harvest_objs = []
        for _, row in df_panen.iterrows():
            d_val = row.get('date_harvest')
            d_date = pd.to_datetime(d_val).date() if pd.notnull(d_val) else None
            harvest_objs.append(HarvestData(
                harvest_id=str(row.get('harvest_id')),
                planting_id=str(row.get('planting_id')),
                date_harvest=d_date,
                commodity=str(row.get('commodity')),
                area_harvested_ha=float(row.get('area_harvested_ha', 0.0)),
                production_ton=float(row.get('production_ton', 0.0)),
                yield_ton_ha=float(row.get('yield_ton_ha', 0.0))
            ))
        HarvestData.objects.bulk_create(harvest_objs)
        print(f"[+] Data_Panen: {len(harvest_objs)} records imported into HarvestData table.")

    # 4. Data Harga
    if "Data_Harga" in xls.sheet_names:
        df_harga = pd.read_excel(xls, sheet_name="Data_Harga")
        PriceData.objects.all().delete()
        price_objs = []
        for _, row in df_harga.iterrows():
            d_val = row.get('date')
            d_date = pd.to_datetime(d_val).date() if pd.notnull(d_val) else None
            price_objs.append(PriceData(
                date=d_date,
                commodity=str(row.get('commodity')),
                price_rp_per_kg=float(row.get('price_rp_per_kg', 0.0))
            ))
        PriceData.objects.bulk_create(price_objs)
        print(f"[+] Data_Harga: {len(price_objs)} records imported into PriceData table.")

    # 5. Data Biaya
    if "Data_Biaya" in xls.sheet_names:
        df_biaya = pd.read_excel(xls, sheet_name="Data_Biaya")
        CostData.objects.all().delete()
        cost_objs = []
        for _, row in df_biaya.iterrows():
            d_val = row.get('expense_date')
            d_date = pd.to_datetime(d_val).date() if pd.notnull(d_val) else None
            cost_objs.append(CostData(
                planting_id=str(row.get('planting_id')),
                category=str(row.get('category')),
                amount=float(row.get('amount', 0.0)),
                expense_date=d_date,
                notes=str(row.get('notes')) if pd.notnull(row.get('notes')) else ''
            ))
        CostData.objects.bulk_create(cost_objs)
        print(f"[+] Data_Biaya: {len(cost_objs)} records imported into CostData table.")

    # Log Audit
    AuditLog.objects.create(
        user=admin_user,
        action="Import FULL master datasets (Lahan, Tanam, Panen, Harga, Biaya) dari Excel ke PostgreSQL",
        endpoint="/script/import_excel_data"
    )

    # 6. Data Cuaca (WeatherData) - from Data Pendukung
    pendukung_file = os.path.join(data_dir, "data pendukung", "TANACAKRA_Data_Pendukung.xlsx")
    if os.path.exists(pendukung_file):
        xls_pendukung = pd.ExcelFile(pendukung_file)
        
        if "Data_Cuaca" in xls_pendukung.sheet_names:
            df_cuaca = pd.read_excel(xls_pendukung, sheet_name="Data_Cuaca")
            WeatherData.objects.all().delete()
            cuaca_objs = []
            for _, row in df_cuaca.iterrows():
                d_val = row.get('date')
                d_date = pd.to_datetime(d_val).date() if pd.notnull(d_val) else None
                if d_date:
                    cuaca_objs.append(WeatherData(
                        date=d_date,
                        rainfall_mm=float(row.get('rainfall_mm', 0.0)),
                        temperature_c=float(row.get('temperature_C', 0.0)),
                        humidity_percent=float(row.get('humidity_percent', 0.0))
                    ))
            WeatherData.objects.bulk_create(cuaca_objs)
            print(f"[+] Data_Cuaca: {len(cuaca_objs)} records imported into WeatherData table.")

        if "Data_Hama_Penyakit" in xls_pendukung.sheet_names:
            df_hama = pd.read_excel(xls_pendukung, sheet_name="Data_Hama_Penyakit")
            PestDiseaseData.objects.all().delete()
            hama_objs = []
            for _, row in df_hama.iterrows():
                d_val = row.get('date')
                d_date = pd.to_datetime(d_val).date() if pd.notnull(d_val) else None
                if d_date:
                    hama_objs.append(PestDiseaseData(
                        date=d_date,
                        commodity=str(row.get('commodity')),
                        pest_disease=str(row.get('pest_disease')),
                        severity=str(row.get('severity'))
                    ))
            PestDiseaseData.objects.bulk_create(hama_objs)
            print(f"[+] Data_Hama_Penyakit: {len(hama_objs)} records imported into PestDiseaseData table.")

        if "Data_GIS" in xls_pendukung.sheet_names:
            df_gis = pd.read_excel(xls_pendukung, sheet_name="Data_GIS")
            GISData.objects.all().delete()
            gis_objs = []
            for _, row in df_gis.iterrows():
                gis_objs.append(GISData(
                    farm_id=str(row.get('farm_id')),
                    latitude=float(row.get('latitude', 0.0)),
                    longitude=float(row.get('longitude', 0.0)),
                    ndvi=float(row.get('NDVI', 0.0)),
                    land_cover=str(row.get('land_cover', 'Agriculture'))
                ))
            GISData.objects.bulk_create(gis_objs)
            print(f"[+] Data_GIS: {len(gis_objs)} records imported into GISData table.")

    print("=== FULL EXCEL DATA IMPORT COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    import_data()
