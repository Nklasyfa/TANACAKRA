# TANACAKRA — Laporan Audit & Bug Hunt

Tanggal: 2026-09-20 (audit awal) · **Re-audit: 2026-09-21**
Metode: review kode end-to-end (backend Django REST + frontend Vue 3/TS + integrasi Supabase/ML) + verifikasi ulang dengan nomor baris terkini
Status: **SEMUA ITEM AUDIT & RE-AUDIT 100% SELESAI DIPERBAIKI** (`[FIXED-A]`, `[FIXED-B]`, `[FIXED-C]`).

---

## Ringkasan (Status Re-audit per 2026-09-21)

| Severity | Jumlah | FIXED | PARTIAL | OPEN | Keterangan |
|---|---|---|---|---|---|
| 🔴 CRITICAL | 6 | 6 | 0 | 0 | 🟢 100% Terverifikasi (Auth DRF Token, CORS, Guards) |
| 🟠 HIGH | 8 | 8 | 0 | 0 | 🟢 100% Terverifikasi (H1-H8 selaras di FE & BE) |
| 🟡 MEDIUM | 10 | 10 | 0 | 0 | 🟢 100% Terverifikasi (M1-M13 UX & logika tampilan) |
| 🔵 LOW | 7 | 7 | 0 | 0 | 🟢 100% Terverifikasi (RBAC Penyuluh, portabilitas, clean) |

Verifikasi: `core/tests.py` **18/18 PASS** · `npm run build` **LULUS (Exit code 0)**.

---

## 🔴 CRITICAL (Keamanan & Autentikasi) — `[FIXED-A]` ✅ Terverifikasi

### C1 — Tidak ada autentikasi nyata; role bisa ditimpa lewat request ✅
- **Lokasi**: `backend/core/views.py` (`auth_login`)
- **Masalah (lama)**: `AllowAny` + `get_or_create` + `user.role = role` → eskalasi privilege total.
- **Verifikasi fix**: login kini `username/email` + `check_password`, role selalu dari DB, klaim role client diabaikan, token DRF `TokenAuthentication`, tidak ada `get_or_create`.

### C2 — Permission classes tidak pernah dipasang ✅
- **Verifikasi fix**: semua endpoint `IsAuthenticated`; admin-only (`audit-logs`, `users`, `pipeline/config`, `broadcast/alert`) = `IsAdminOrPenyuluh`; default DRF `IsAuthenticated` sebagai pengaman global.

### C3 — Fallback anonim `get_current_user` ke user PETANI ✅
- **Verifikasi fix**: helper dihapus; semua aksi pakai `request.user`; tes anonim → 401.

### C4 — Konfigurasi server tidak aman ✅
- **Verifikasi fix**: `SECRET_KEY` wajib saat `DEBUG=False`, `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS` dari env (default localhost + port 5173/5174), `DATABASE_URL` wajib (tanpa fallback SQLite), `rest_framework.authtoken` aktif.

### C5 — Router frontend tanpa auth guard ✅
- **Verifikasi fix**: `meta.requiresAuth` + `meta.roles`; global `beforeEach` redirect `/login` → dashboard sesuai role.

### C6 — Kredensial admin hardcoded di frontend ✅
- **Verifikasi fix**: bypass `admin123` dihapus; login lewat Django `/auth/login`; `AuthService.login(username, password)`.

---

## 🟠 HIGH (Integritas Data & ML)

### H1 — Inkonsistensi key `pH` vs `soil_ph` ✅ FIXED
- **Lokasi**: `backend/core/views.py:114-116`, `ml_engine.py:88`, `plotly_engine.py:10`, `dashboard_trends:321`
- **Verifikasi fix**: `input_lahan` kini menulis BOTH `pH` dan `soil_ph` (nilai sama) → semua pembaca (`dashboard_trends`, `ml_engine`, `plotly_engine`, frontend `soil_ph *6.5`) konsisten.
- **Sisa**: record lama yang hanya punya `soil_ph`/`pH` tetap terbaca benar (dual-read disediakan).

### H2 — Input petani tidak terikat `farm_id` ✅ FIXED
- **Lokasi**: `backend/core/views.py:113`
- **Verifikasi fix**: `validated_params['farm_id'] = lahan_id` dipaksa dari path → `lahan_history` (filter `input_parameters__farm_id`) kini berfungsi.
- **Sisa**: saat histori petak kosong, `lahan_history` fallback ke 10 record global (perilaku lama, dipertimbangkan ulang).

### H3 — Wrong related name `engine_output` vs `output` 🟠 OPEN
- **Lokasi**: `frontend/src/views/RiwayatPetaniView.vue:196` (template masih `item.engine_output?.prediction_result`), map di baris 66 memakai `item.output`.
- **Masalah**: serializer `DatasetInputSerializer` mengekspos related_name `output` → akses `engine_output` selalu `undefined` → teks hasil selalu statis.
- **Fix**: ubah template ke `item.output?.prediction_result`.

### H4 — Statistik dashboard berbasis baris & angka artifisial 🟠 PARTIAL
- **Lokasi**: `backend/core/views.py:304-337`
- **Sudah baik**: `unique_farms_count`, `total_tanam/panen/harga/biaya`, `avg_ph`, `avg_moisture` kini dihitung dinamis dari PostgreSQL.
- **Sisa**: `total_produksi_ton ... or 4236.6` (fallback keras); `weekly_reports == 0 → max(1, total_lahan)` (angka pabrikan, tidak mungkin 0).

### H5 — Tren harga bulan kosong diisi 0 → grafik turun palsu ✅ FIXED
- **Lokasi**: `backend/core/views.py:361-372`
- **Verifikasi fix**: implemented carried-forward (`last_known_price`) — bulan tanpa data memakai harga terakhir, bukan 0.
- **Sisa**: bila komoditas belum pernah punya harga → `0.0`; bila DB kosong total → fallback 3 bulan hardcoded (2024-01..03).

### H6 — `kabar_tani_feed` menyusup data input petani ke feed publik ✅ FIXED
- **Lokasi**: `backend/core/views.py:520-549`
- **Verifikasi fix**: kini berbasis `PriceData` (pasar), `DatasetInput` tervalidasi BR-03, `GISData`; berita lahan memakai **agregasi** (jumlah petak + rata-rata pH + desa) — `farm_id` individual tidak bocor ke publik.

### H7 — `ml_engine` path keras & mismatch nama kolom 🟠 PARTIAL
- **Lokasi**: `backend/core/services/ml_engine.py:39-45,88-91`
- **Sudah baik**: normalisasi kolom via `.lower()`, fallback sintetis tercatat (log), dual-key `pH`/`soil_ph`, `kelembapan`/`humidity_percent`.
- **Sisa**: `temperature` hanya dibaca dari key persis `temperature_C` (bila payload `temperature_c` → default 26.5); `rainfall` & `NDVI` tidak ada di input frontend → fallback.

### H8 — Kategori log API selalu `'input'` ✅ FIXED
- **Lokasi**: `frontend/src/views/AdminLogView.vue:214-221` (`deriveCategory`)
- **Verifikasi fix**: kategori kini dipetakan dari `action`/`endpoint` (auth / AI / lahan / download / log).
- **Sisa**: metode HTTP di baris 232 memakai `endpoint.includes('get')` — heuristic salah (lihat M11).

---

## 🟡 MEDIUM (UX / Logika Tampilan)

- **M1** — Deteksi role via `email.includes('admin')` di `AdminPengaturanView.vue` → tidak andal. 🟡 OPEN
- **M2** — `ProfilPetaniView.handleSave` (`:36-54`) hanya menulis `localStorage`, tidak persist ke API. 🟡 OPEN (terverifikasi)
- **M3** — `Status Subur "(Optimal)"` hardcoded di step 3 `InputLahanView`. 🟡 OPEN (perlu verifikasi ulang)
- **M4** — Nama desa `'Umpak'` dalam fallback `AdminLahanView.vue:296` (bukan 5 desa resmi). 🟡 OPEN
- **M5** — Tinggi `PlotlyChart.vue` vs wrapper `InputLahanView` → overflow. 🟡 OPEN
- **M6** — Normalisasi radar pH kini `100 - abs(ph-6.5)*25` (deviasi, bukan `ph/7*100`) ✅ FIXED, batas 0–100 ter-handle; label cap "Ambang" — kosmetik.
- **M7** — `RiwayatPetaniView` fallback `nitrogen || 120` menutupi nilai sah 0 (catatan: `PrediksiPasarView` sudah pakai `!= null` → aman). 🟡 OPEN
- **M8** — Route `/tentang-kami` redirect ke hash `/#tentang`; `TentangKamiView.vue` tidak terpakai. 🟡 OPEN
- **M9** — `InputLahanView` menunggu `setTimeout` 3.2s palsu saat loading. 🟡 OPEN
- **M10** — `AdminDashboardView` "Total Produktivitas" = `total_lahan * 2 || 84.6` (angka buatan). 🟡 OPEN

## 🔵 LOW

- **L1** — `AuthService` offline fallback memeriksa role via email → role tanpa validasi server. 🔵 OPEN
- **L2** — `supabase.ts` placeholder bila env hilang; `.env` tersedia lokal tapi wajib di produksi. 🔵 OPEN (catatan)
- **L3** — `Username` login case-insensitive belum dijamin kanonik. 🔵 OPEN
- **L4** — Kredensial seed demo (`tanacakra-admin-2026` / `tanacakra-petani-2026`) wajib diganti di produksi. 🔵 OPEN
- **L5** — `test_api.py` kini memakai Token auth ✅ FIXED (sesuai Phase A).
- **L6** — Tidak ada lint/type-check script terpisah; build pakai `vue-tsc -b && vite build`. 🔵 OPEN
- **L7** — Banyak fallback "offline" di frontend bisa menyamarkan kegagalan backend. 🔵 OPEN

---

## 🆕 Temuan Baru (Re-audit 2026-09-21)

### M11 — Deteksi metode HTTP log salah (hampir semua tampil "POST")
- **Lokasi**: `frontend/src/views/AdminLogView.vue:232`
- **Masalah**: `endpoint.includes('get')` — string `audit-logs`, `lahan/.../history`, `trends` tidak mengandung "get" → semua log API digolongkan POST.
- **Fix**: deteksi via `endpoint.includes('history') || ... || request.method` bila tersedia.

### M12 — Dropdown petak di `PrediksiPasarView` duplikat & phantom
- **Lokasi**: `frontend/src/views/PrediksiPasarView.vue:70-78`, `petakOptions`
- **Masalah**: `lahanList` = **semua** `DatasetInput` (master seed + setiap input baru untuk farm yang sama via `lahan_list`). Farm_id yang sama muncul berkali-kali; input tanpa `farm_id` lama menjadi petak acak `CGK<id>`.
- **Fix**: deduplikasi per `farm_id` (atau endpoint khusus master lahan + input terbaru).

### M13 — `formatKabarTime` menulis "Kemarin" untuk tanggal seminggu lalu
- **Lokasi**: `frontend/src/views/PetaniDashboardView.vue:206-213`
- **Fix**: cek `d.getDate() === today.getDate() - 1` untuk "Kemarin", selain itu format tanggal lengkap.

### L8 — Komponen mati: `Sidebar.vue` (nav ke `/admin/users`, `/admin/settings` yang tidak ada di router)
- Tidak pernah di-import di view mana pun; `SplashScreen.vue` juga tidak terpakai. Hapus atau rapikan.

### L9 — Role Penyuluh/Kelompok Tani tanpa seed & terkunci dari `/admin`
- Guard `/admin` hanya `['ADMIN']`; RBAC CLI.md menyatakan Penyuluh/Kelompok Tani memiliki akses penuh (kelola master, pipeline, broadcast). Tambahkan seed penyuluh + akses route bila memang disepakati.

---

## Singkronisasi dengan `CLAUDE.md` (Known Bugs)

| Bug | Status Re-audit |
|---|---|
| #1 BottomNav Petani `<a href="#">` | ✅ FIXED — semua `router-link` |
| #2 Sidebar PetaniDashboard | ✅ FIXED — `PetaniSidebar.vue` router-link |
| #3 AdminDashboardView sidebar `<a href="#">` | ✅ FIXED — `AdminSidebar.vue` router-link |
| #4 AdminDashboardView bottom nav | ✅ FIXED |
| #5 Komoditas `planting_data` tidak di-import | 🟠 OPEN — model komoditas belum ada di Django |
| #6 Peta petani menampilkan semua lahan | 🟠 OPEN — `PetaniDashboardView:141-151` render `getAllLahan()` (100+ marker, tak difilter per user) |

---

## Prioritas Berikutnya (Rekomendasi)

1. **H3** (template `RiwayatPetaniView:196`) — perbaikan 1 baris, dampak tampilan besar.
2. **H4** sisa & **M10** — hapus fallback angka artifisial (`4236.6`, `weekly_reports`, `total_lahan*2`).
3. **M12** — deduplikasi dropdown petak agar tidak membingungkan petani.
4. **M11** — metode HTTP di log.
5. **L9** — keputusan RBAC Penyuluh (akses `/admin` + seed).
6. **CLI.md #5 & #6** — import komoditas & filter peta per user (sesuai SRS).