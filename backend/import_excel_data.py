import os
import sys
import django
import pandas as pd

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tanacakra_backend.settings')
django.setup()

from core.models import User, DatasetInput, EngineOutput, VisualizationConfig, AuditLog

def import_data():
    print("=== STARTING EXCEL DATA IMPORT TO DJANGO POSTGRESQL ===")

    data_dir = r"D:\TANACAKRA\data"
    inti_file = os.path.join(data_dir, "data inti", "TANACAKRA_Data_Inti.xlsx")
    analysis_file = os.path.join(data_dir, "data pendukung", "TANACAKRA_Data_Analysis.xlsx")

    # 1. Ensure Default Users Exist
    admin_user, _ = User.objects.get_or_create(
        username="admin_cangkringan",
        defaults={"email": "admin@cangkringan.desa.id", "role": "ADMIN"}
    )
    petani_user, _ = User.objects.get_or_create(
        username="petani_cangkringan",
        defaults={"email": "petani@cangkringan.desa.id", "role": "PETANI"}
    )

    # 2. Read Land Data (100 Farms)
    if os.path.exists(inti_file):
        df_lahan = pd.read_excel(inti_file, sheet_name="Data_Lahan")
        print(f"[+] Loaded {len(df_lahan)} farm land records from Data_Lahan.")

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

            # Check if dataset already exists for this farm
            exists = DatasetInput.objects.filter(input_parameters__farm_id=params["farm_id"]).exists()
            if not exists:
                DatasetInput.objects.create(
                    user=petani_user,
                    input_parameters=params
                )
                created_count += 1

        print(f"[+] Imported {created_count} new farm land records into DatasetInput table.")

    # 3. Log Audit
    AuditLog.objects.create(
        user=admin_user,
        action=f"Import master data {len(df_lahan)} lahan Desa Cangkringan dari Excel",
        endpoint="/script/import_excel_data"
    )

    print("=== EXCEL DATA IMPORT COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    import_data()
