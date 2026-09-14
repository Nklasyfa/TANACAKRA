import pandas as pd
import os

data_dir = r"D:\TANACAKRA\data"

files = [
    ("Data Inti", os.path.join(data_dir, "data inti", "TANACAKRA_Data_Inti.xlsx")),
    ("Data Analysis", os.path.join(data_dir, "data pendukung", "TANACAKRA_Data_Analysis.xlsx")),
    ("Data Pendukung", os.path.join(data_dir, "data pendukung", "TANACAKRA_Data_Pendukung.xlsx"))
]

for label, file_path in files:
    if os.path.exists(file_path):
        print(f"\n==========================================")
        print(f"FILE [{label}]: {os.path.basename(file_path)}")
        print(f"==========================================")
        excel_file = pd.ExcelFile(file_path)
        for sheet in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet)
            print(f"\nSheet: [{sheet}] | Rows: {len(df)}")
            print(f"Columns: {list(df.columns)}")
            print("Sample Row 0:")
            print(df.iloc[0].to_dict() if len(df) > 0 else {})
