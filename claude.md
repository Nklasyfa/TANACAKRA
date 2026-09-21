# TANACAKRA — Claude Agent Context & Memory

Dokumen ini berfungsi sebagai panduan dan memori utama agen (Claude) agar pengerjaan proyek tetap selaras dengan kebutuhan sistem dan arsitektur yang disepakati. Selalu rujuk dokumen ini sebelum mengambil keputusan teknis.

## Lingkup Proyek (Scope)
- **Lokasi Utama**: Desa Cangkringan, Kecamatan Cangkringan, Kabupaten Sleman, DIY
- **Konteks**: Sistem pendukung keputusan pengelolaan lahan pertanian berbasis Data Science Pipeline, memberdayakan kelompok tani lokal di kawasan lereng Gunung Merapi
- **Desa yang tercakup**: Wukirsari, Argomulyo, Umbulharjo, Kepuharjo, Glagaharjo

## 1. Tech Stack
| Layer | Teknologi |
|---|---|
| Frontend | Vue 3 (Vite + TypeScript) |
| Styling | Tailwind CSS (desain kustom token Tanacakra) |
| Backend | Django (Python) — REST API |
| Database & Auth | PostgreSQL via Supabase (BaaS) |
| Data Science Engine | Scikit-learn (Random Forest) |
| Visualisasi | Plotly |
| API Testing | Postman / Antigravity |

## 2. Arsitektur (Decoupled)
- Frontend (Vue) dan Backend (Django) sepenuhnya terpisah
- Komunikasi via RESTful API berbasis JSON
- Backend: `http://127.0.0.1:8000/api/v1/`
- Frontend: `http://localhost:5173/` atau `:5174/`

## 3. RBAC (Role-Based Access Control)
1. **Admin / Kelompok Tani / Penyuluh** — akses penuh: kelola master data lahan, konfigurasi pipeline ML, pantau audit log, broadcast peringatan
2. **Petani** — akses terbatas: lihat data lahan milik sendiri, input parameter tanah, lihat rekomendasi Scikit-learn & grafik Plotly

## 4. Database Schema (PostgreSQL)
Berdasarkan `data/tanacakra_database.sql`:

| Tabel | Deskripsi |
|---|---|
| `land_data` | Master data 100 petak lahan (farm_id, desa, lat/lng, elevasi, luas, tipe tanah, pH, karbon organik, irigasi) |
| `planting_data` | Data tanam (480 record): komoditas, varietas, musim, luas tanam — FK ke land_data |
| `harvest_data` | Data panen (480 record): produksi, yield — FK ke planting_data |
| `cost_data` | Biaya usaha tani per komoditas |
| `price_data` | Harga komoditas bulanan (360 record) |
| `weather_data` | Data cuaca (60 record): curah hujan, suhu, kelembapan |
| `pest_disease_data` | Data hama & penyakit (30 record) |
| `gis_data` | Data GIS: NDVI, tutupan lahan — FK ke land_data |
| `profiles` | User profil Supabase Auth (id UUID, username, email, role) |
| `audit_logs` | Log aktivitas sistem |

### Dataset Excel yang tersedia (`data/`):
- `data inti/TANACAKRA_Data_Inti.xlsx`: Data_Lahan (100), Data_Tanam (480), Data_Biaya (6), Data_Panen (480), Data_Harga (360)
- `data pendukung/TANACAKRA_Data_Analysis.xlsx`: ML_Dataset (300 baris untuk training), Evaluasi_Komoditas, Evaluasi_Tahunan, Weather/Pest/GIS
- `data pendukung/TANACAKRA_Data_Pendukung.xlsx`: Data_Cuaca, Data_Hama_Penyakit, Data_GIS

### Komoditas yang tercakup:
Padi, Cabai Merah, Jagung, Salak Pondoh, Bawang Merah, Kacang Tanah

## 5. Halaman Frontend (Vue Router)

### Petani Side:
| Path | View | Status |
|---|---|---|
| `/` | LoginView | ✅ |
| `/petani` | PetaniDashboardView | ⚠️ Masih hardcoded, belum terhubung API |
| `/input-lahan` | InputLahanView | ✅ Terhubung API + ML |
| `/riwayat` | RiwayatPetaniView | ⚠️ Data masih hardcoded |
| `/profil` | ProfilPetaniView | ⚠️ Data masih hardcoded |

### Admin Side:
| Path | View | Status |
|---|---|---|
| `/admin` | AdminDashboardView | ⚠️ Sidebar nav pakai `<a href="#">` bukan router-link |
| `/admin/lahan` | AdminLahanView | ✅ Terhubung API, 100 data lahan |
| `/admin/log` | AdminLogView | ✅ Terhubung API |
| `/admin/pengaturan` | AdminPengaturanView | ⚠️ Belum terhubung API |

## 6. Known Bugs & Issues
1. **BottomNav Petani**: Item "Riwayat" dan "Profil" masih `<a href="#">` — tidak navigasi ke `/riwayat` dan `/profil`
2. **Sidebar PetaniDashboard**: Item "Riwayat" dan "Profil" masih `<a href="#">`
3. **AdminDashboardView sidebar**: Item "Manajemen Lahan", "Log Aktivitas", "Pengaturan" masih `<a href="#">` bukan `<router-link>`
4. **AdminDashboardView bottom nav**: Sama, masih `<a href="#">`
5. **Komoditas tidak tercatat**: Data `planting_data` (480 record) dengan kolom commodity & variety belum di-import ke database Django
6. **Peta lahan**: Hanya ditampilkan di AdminDashboard — seharusnya Petani juga bisa melihat peta lahan miliknya

## 7. Aturan Penting (Golden Rules)
1. **Wajib PostgreSQL**: Database bertumpu pada Supabase PostgreSQL
2. **Desain Premium**: Frontend harus indah, responsive, sesuai design token Tailwind Tanacakra
3. **Pemisahan Logika ML**: Logika Machine Learning di `core/services/` — JANGAN di views.py
4. **Logging**: Setiap eksekusi (terutama prediksi) harus dicatat ke AuditLog
5. **Jangan slop**: Selalu rujuk SRS (`docs/srs.txt`) dan schema SQL (`data/tanacakra_database.sql`) sebelum membuat keputusan

## 8. Status Epic Tracker
- [x] EPIC 1: SRS Finalization & Arsitektur
- [x] EPIC 2: UI/UX Frontend Vue
- [x] EPIC 3: Backend Django & Supabase Auth RBAC
- [x] EPIC 4: Integrasi Pipeline Scikit-learn
- [x] EPIC 5: Integrasi Visualisasi Plotly
- [x] EPIC 6: API Testing Suite & Postman Collection
- [x] EPIC 7: E2E Integration & QA Validation

## 9. REST API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login Supabase Auth |
| GET | `/api/v1/lahan` | List semua data lahan (100) |
| POST | `/api/v1/lahan/:id/input` | Input parameter tanah + ML infer |
| GET | `/api/v1/lahan/:id/history` | Histori input & tren Plotly |
| POST | `/api/v1/pipeline/infer` | Dry-run inferensi ML |
| GET | `/api/v1/audit-logs` | Daftar audit log |
| GET/PATCH | `/api/v1/pipeline/config` | Konfigurasi pipeline ML |
| POST | `/api/v1/tindakan/confirm` | Konfirmasi tindakan lapang |
| POST | `/api/v1/broadcast/alert` | Broadcast peringatan |
