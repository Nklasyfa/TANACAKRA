<div align="center">

  <img src="frontend/src/assets/tanacakra-icon.svg" alt="Tanacakra Logo" width="96" height="96" />

  # TANACAKRA — Sistem Presisi Pertanian Lereng Merapi

  **Platform Manajemen Lahan, Prediksi Pasar, & Rekomendasi Komoditas Berbasis Machine Learning untuk Kelompok Tani Desa Cangkringan, Sleman, DIY.**

  [![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![Django REST](https://img.shields.io/badge/Django_REST-5.x-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
  [![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
  [![Vercel Status](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://tanacakra.vercel.app)

</div>

---

## 🌾 Tentang Tanacakra

**TANACAKRA** adalah platform digital *greenfield modular* yang dirancang untuk memberdayakan kelompok tani lokal di area **Kapanewon Cangkringan, Kabupaten Sleman, Yogyakarta** (Wukirsari, Argomulyo, Glagaharjo, Kepuharjo, dan Umbulharjo).

Mengombinasikan analisis hara tanah Regosol Vulkanik lereng Gunung Merapi dengan **Random Forest Machine Learning Engine**, Tanacakra memberikan rekomendasi tanam presisi, estimasi hasil panen (ton/ha), prediksi tren harga pasar komoditas, serta integrasi pemantauan cuaca mikroklimat secara *real-time*.

---

## ✨ Fitur-Fitur Utama

- 🤖 **Engine ML Scikit-Learn (Random Forest)**: Memprediksi kesuburan tanah (pH, N-P-K, kelembapan, elevasi) dan merekomendasikan komoditas pertanian ideal (Padi Rojolele, Cabai Merah, Salak Pondoh, Bawang Merah, Jagung, dll).
- 📊 **Visualisasi Interaktif Plotly.js**: Grafik tren harga pasar dinamis, perbandingan volume panen, dan diagram radar keseimbangan hara tanah.
- 🗺️ **Pemetaan Interaktif Leaflet**: Klasterisasi 108 petak lahan pertanian Cangkringan dengan indikator status kesehatan tanah (Subur vs Perlu Atensi).
- 🔒 **Sistem Akses Terkontrol (RBAC)**: Pembatasan hak akses berjenjang berbasis Supabase Auth & Django REST permissions:
  - **ADMIN / KELOMPOK TANI**: Akses penuh tata kelola lahan, konfigurasi parameter ML, audit log, dan ekspor data.
  - **PENYULUH LAPANGAN**: Akses operasional pendampingan petani & pencatatan sampel tanah.
  - **PETANI**: Akses mandiri catat lahan, lihat hasil rekomendasi AI, & pantau tren pasar komoditas.
- 📰 **Warta & Kabar Tani**: Agregasi informasi berita pertanian Cangkringan dan siaran otomatis rekomendasi cuaca BMKG.
- 📥 **Ekspor Data Excel (CSV UTF-8 BOM)**: Fitur unduh data lahan dan log aktivitas terformat rapi (`sep=,`) yang kompatibel langsung dengan Microsoft Excel.

---

## 🔄 Alur Kerja Sistem (System Workflow)

### 🌾 1. Alur Pengguna (Petani)

```mermaid
graph TD
    A(["Mulai (Buka Web TANACAKRA)"]) --> B{"Sudah Login?"}
    
    B -- "Belum" --> C["Halaman Login / Google OAuth"]
    C --> D["Verifikasi Auth Supabase"]
    D --> E["Tampilan Beranda Petani"]
    B -- "Sudah" --> E

    E --> F["Pantau Informasi Cuaca Mikroklimat Merapi"]
    E --> G["Pilih Menu 'Catat Lahan'"]
    E --> H["Pilih Menu 'Prediksi Pasar'"]

    subgraph "Proses Catat Lahan & Inferensi AI"
        G --> I["Step 1: Tentukan Lokasi di Peta Leaflet / GPS"]
        I --> J["Step 2: Input Parameter pH & Hara N-P-K"]
        J --> K["Step 3: Konfirmasi & Klik 'Kirim Data'"]
        K --> L["Eksekusi Model Machine Learning (Random Forest)"]
        L --> M["Tampil Rekomendasi Tanaman, Estimasi Ton/Ha & Dosis Pupuk"]
        M --> N["Data Tersimpan di 'Riwayat Lahan'"]
    end

    subgraph "Analisis Pasar"
        H --> O["Tampil Grafik Tren Harga Komoditas (Plotly.js)"]
        O --> P["Petani Mengetahui Estimasi Waktu Panen Terbaik"]
    end

    N --> Q(["Selesai / Kembali ke Beranda"])
    P --> Q
```

### 👨‍💼 2. Alur Pengelola (Admin / Penyuluh)

```mermaid
graph TD
    A1(["Mulai (Buka TANACAKRA Admin Console)"]) --> B1["Login Akun Admin / Penyuluh"]
    B1 --> C1{"Peran Terverifikasi?"}
    
    C1 -- "Role: PETANI" --> D1["Ditolak (Akses Terbatas)"]
    C1 -- "Role: ADMIN / PENYULUH" --> E1["Dashboard Pengelola"]

    subgraph "Tata Kelola Operasional"
        E1 --> F1["Peta Sebaran 108+ Petak Lahan Cangkringan"]
        E1 --> G1["Menu 'Manajemen Lahan'"]
        E1 --> H1["Menu 'Log Aktivitas'"]
        E1 --> I1["Menu 'Kabar Tani' & 'Pengaturan'"]
    end

    subgraph "Aksi Admin & Pelaporan"
        G1 --> J1["Tambah / Edit Data Lahan Anggota"]
        G1 --> K1["Klik 'Ekspor CSV'"]
        K1 --> L1["Unduh Berkas Laporan Excel (UTF-8 BOM)"]
        
        H1 --> M1["Pantau Audit Log & Eksekusi Sistem"]
        I1 --> N1["Buat Siaran Pengumuman / Kelola User"]
    end

    L1 --> O1(["Selesai / Sesi Berakhir"])
    M1 --> O1
    N1 --> O1
```

### ⚡ 3. Pemrosesan Data & Machine Learning Engine

```mermaid
graph LR
    Input["Input Parameter Lahan (pH, N, P, K, Elevasi)"] --> API["Django REST Framework API (/api/v1/lahan/input)"]
    API --> ML["Scikit-Learn ML Engine (Random Forest Regressor)"]
    API --> Audit["Audit Log Service (Pencatatan Audit Trail)"]
    
    ML --> Output["Hasil Prediksi: Komoditas + Estimasi Panen"]
    Output --> Plotly["Plotly Engine (JSON Radar & Line Schema)"]
    
    Audit --> DB[(Database PostgreSQL / Supabase)]
    Plotly --> JSON["Response JSON ke Frontend Vue 3"]
```

---

## 🛠️ Arsitektur & Teknologi

Sistem Tanacakra dibangun secara *decoupled* (Frontend & Backend terpisah sepenuhnya):

```
                       ┌───────────────────────────────────────┐
                       │           VUE 3 FRONTEND              │
                       │ (Vite + TypeScript + Tailwind CSS)    │
                       └──────────────────┬────────────────────┘
                                          │
                                   RESTful JSON API
                                          │
                       ┌──────────────────┴────────────────────┐
                       │           DJANGO REST BACKEND         │
                       │    (Python REST API Engine)           │
                       └──────────┬──────────────────┬─────────┘
                                  │                  │
                ┌─────────────────┴─┐              ┌─┴──────────────────┐
                │   Scikit-Learn    │              │  PostgreSQL        │
                │ Machine Learning  │              │  (Supabase BAAS)   │
                └───────────────────┘              └────────────────────┘
```

| Layer | Teknologi Utama |
|---|---|
| **Frontend UI/UX** | Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS |
| **Peta & Grafik** | Leaflet.js, Leaflet.markercluster, Plotly.js |
| **Backend REST API** | Django 5.x, Django REST Framework |
| **Machine Learning** | Scikit-learn (Random Forest Regressor & Classifier), Pandas, NumPy |
| **Database & Auth** | PostgreSQL via Supabase (BAAS), Supabase Auth |
| **Deployment** | Vercel (Frontend SPA), Render / Railway (Backend API) |

---

## 🚀 Panduan Memulai (Quick Start)

### Prasyarat
- **Node.js** >= 18.x & **npm** >= 9.x
- **Python** >= 3.10 & **pip**

### 1. Cloning Repositori
```bash
git clone https://github.com/Nklasyfa/TANACAKRA.git
cd TANACAKRA
```

### 2. Memulai Frontend (Vue 3)
```bash
cd frontend
npm install
npm run dev
```
Aplikasi frontend akan berjalan di `http://localhost:5173`.

### 3. Memulai Backend (Django REST)
```bash
cd ../backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
API backend akan berjalan di `http://127.0.0.1:8000/api/v1/`.

---

## 📋 Ringkasan API Endpoints Utama

| Method | Endpoint | Deskripsi | Akses |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Login user & dapatkan token DRF | Publik |
| `GET` | `/api/v1/lahan` | Mengambil seluruh data petak lahan Cangkringan | Authenticated |
| `POST` | `/api/v1/lahan/<id>/input` | Input telemetri tanah & jalankan inferensi ML | PETANI / ADMIN |
| `GET` | `/api/v1/dashboard/trends` | Mengambil agregat statistik & skema Plotly | Authenticated |
| `GET` | `/api/v1/audit-logs` | Mengambil riwayat log audit aktivitas sistem | ADMIN / PENYULUH |

---

## 👥 Tim Pengembang (Tanacakra Team)

- **Syafa (Nklasyfa)** — *Lead Software Engineer & Frontend Architect*
- **Tia** — *Project Manager*
- **Shoffie** — *Data Analyst & ML Specialist*
- **Nakula** — *Software Programmer*
- **VINIX7** — *Mitra Training & Development Partner*

---

## 📄 Lisensi & Hak Cipta

© 2026 **TANACAKRA Team & Kelompok Tani Desa Cangkringan, Sleman, DIY**. Hak cipta dilindungi undang-undang.
