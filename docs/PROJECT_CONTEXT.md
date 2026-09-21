# TANACAKRA — Bahan Konteks Proyek (untuk AI: Gemini/Stitch)

Dokumen ini melengkapi `DESIGN.md` (yang isinya token visual & spesifikasi nav). Dokumen ini
isinya **kenapa** sistem ini dibentuk begitu — supaya AI yang membaca tidak cuma mengikuti
SRS secara literal, tapi paham konteks nyata di baliknya dan bisa mengambil keputusan yang
konsisten saat detail tidak eksplisit disebutkan di prompt.

## 1. Apa ini dan kenapa dibuat

TANACAKRA adalah sistem pendukung keputusan (SPK) berbasis web untuk petani dan penyuluh
pertanian di **Desa Cangkringan**, lereng selatan **Gunung Merapi**, Sleman, DIY. Ini proyek
tugas kuliah Rekayasa Perangkat Lunak (S1 Teknik Informatika, UNESA), dikerjakan 3 orang
dalam waktu ~1 bulan (31 Agustus – 30 September 2026).

Masalah nyata yang coba diselesaikan: tanah di lereng Merapi jadi sangat subur karena abu
vulkanik dari letusan, tapi kondisinya juga berubah-ubah cepat (erosi pasir vulkanik, retensi
hara yang naik-turun, risiko lahar dingin saat hujan deras). Petani perlu bantuan mengambil
keputusan (kapan pupuk, kapan tanam, lahan mana yang berisiko) berdasarkan data, bukan cuma
insting. Sistem ini bukan sekadar CRUD pencatatan — inti nilainya ada di pipeline Data
Science (Scikit-learn) yang mengolah data mentah jadi rekomendasi konkret.

## 2. Siapa penggunanya, dan apa yang mereka butuhkan

**Petani** — akses dari HP di lapangan, kadang sinyal lemah, tidak semua fasih teknologi.
Butuh: interaksi besar & jelas, minim ketikan (slider/pilihan daripada isian bebas), fokus ke
SATU tugas per layar, bukan dashboard analitik padat. Perilaku: gunakan device gantian dalam
keluarga → butuh alur "ingat perangkat" dan fleksibilitas login.

**Admin/Penyuluh** — kerja dari laptop, terbiasa lihat data mentah, tapi juga cek dari HP
sela-sela kunjungan lapangan. Butuh: kepadatan informasi tinggi tapi tetap scannable cepat,
kemampuan intervensi cepat (siapa yang perlu dihubungi/dikunjungi duluan).

**Job utama sistem** (bukan sekadar "tampilkan data"): jawab cepat 3 pertanyaan — *lahan mana
yang bermasalah?*, *komoditas apa yang paling untung?*, *kapan waktu tanam yang tepat?*

## 3. Arsitektur & alur data (penting untuk desain yang realistis)

Vue (frontend) ↔ Django REST API (backend) ↔ Supabase/PostgreSQL (data+auth) ↔ Scikit-learn
(model prediksi, jalan di backend) → hasil divisualisasikan pakai Plotly di Vue.

Alur inti (UC-02 di SRS): Petani input parameter lahan di form Vue → dikirim ke API Django →
Django panggil pipeline Scikit-learn → hasil (prediction_result) dikirim balik sebagai
JSON/Plotly schema → Vue render sebagai grafik+rekomendasi interaktif.

**Ini penting untuk desain:** karena eksekusi model ML butuh waktu (bukan instan), form input
dan halaman hasil harus punya *loading state* yang jelas, bukan transisi instan seolah-olah
komputasinya trivial.

## 4. Skema data — SUMBER KEBENARAN untuk field apa saja yang boleh ada di UI

Dari SRS 8.1, entitas intinya cuma 5, dan field-nya TERBATAS — jangan menambah field di UI
yang tidak ada dasarnya di sini kecuali sudah didiskusikan & disepakati sebagai perluasan:

- **User (profiles):** id, username, email, role (Petani / Admin_KelompokTani_Penyuluh)
  → skema ini TIDAK punya nama lengkap atau nomor HP. Kalau UI menampilkan field itu, itu
  perluasan yang belum resmi masuk SRS — tandai eksplisit ke tim kalau prompt memintanya.
- **DatasetInput:** id, user_id, input_parameters (pH, kelembapan, nutrisi), created_at
- **EngineOutput:** id, dataset_id, prediction_result, execution_time
- **VisualizationConfig:** id, engine_output_id, plotly_json_schema
- **AuditLog:** id, user_id, action, endpoint, timestamp

Kalau sebuah halaman butuh field yang tidak ada di skema ini (misal "luas lahan", "koordinat",
"kualitas panen" yang muncul di beberapa iterasi desain sebelumnya), itu asumsi tambahan yang
masuk akal secara domain tapi **belum tentu match** dengan backend yang benar-benar akan
dibangun Nakula — desain tetap boleh jalan (untuk kebutuhan mockup/prototyping), tapi jangan
dianggap sebagai fakta pasti skema data final.

## 5. Pemetaan Functional Requirement → Halaman

| Requirement | Bunyi singkat | Halaman terkait |
|---|---|---|
| FR-01 | Login/Register via Supabase Auth | Login & Register |
| FR-02 | RBAC (Petani vs Admin) | Semua halaman (nav berbeda per role) |
| FR-03 | Admin kelola master data lahan & config pipeline | Manajemen Lahan |
| FR-04 | Petani input parameter lahan | Catat Data Lahan |
| FR-05 | Sistem eksekusi pipeline Scikit-learn | (proses backend, tampil sbg loading state di Catat Data Lahan) |
| FR-06 | Visualisasi Plotly interaktif | Dashboard Admin, Panel Dasbor (BUKAN Beranda — lihat §7) |
| FR-07 | REST API testable via Postman/Antigravity | Pengaturan → Referensi API |
| FR-08 | Audit log aktivitas | Log Aktivitas |

Halaman tambahan yang tidak eksplisit disebut FR tapi masuk akal secara UX dan sudah
disepakati: Beranda (ringkasan cepat Petani), Riwayat (histori submission Petani), Profil
(pengaturan akun).

## 6. Kenapa desainnya seperti ini — prinsip inti

**Ground di material lokal, bukan "eco-app" generik.** Palet warna diambil dari genteng
tanah liat, abu vulkanik, tanah subur, terasering — bukan hijau korporat khas SaaS
sustainability app. Alasan: kalau tidak di-ground ke konteks nyata, AI cenderung menghasilkan
tampilan yang bisa dipakai untuk aplikasi apa saja (logistik, HR, dsb) — kehilangan identitas.

**Satu sistem navigasi, tanpa variasi, di semua halaman.** Ini prinsip paling sering
dilanggar dalam proses iterasi: label menu, state aktif, footer sidebar, semuanya harus
identik string-per-string di semua halaman dan kedua breakpoint (mobile/desktop). Sekali ada
variasi (mis. mobile menyingkat "Manajemen Lahan" jadi "Lahan"), itu bug, bukan pilihan gaya.

**Beranda ≠ Dashboard/Panel Dasbor dalam kepadatan visual.** Beranda Petani didesain untuk
"sekali lirik" — status besar tunggal, satu CTA, list ringkas. Chart interaktif penuh
(dengan axis, hover, zoom) disimpan khusus untuk Dashboard Admin dan Panel Dasbor karena di
situlah orang benar-benar menganalisis, bukan sekadar mengecek.

**Tidak ada elemen yang "kelihatan pas" tapi tidak diminta.** AI generatif cenderung
menambahkan elemen dekoratif yang terasa tematik (badge kepercayaan, widget cuaca, mascot)
padahal tidak diminta di prompt manapun. Aturannya: setiap elemen visual harus bisa
ditelusuri balik ke SRS atau ke prompt eksplisit — bukan ke "kelihatan cocok temanya".

## 7. Pola kegagalan yang berulang selama iterasi — supaya tidak terulang

Selama proses desain, beberapa pola kegagalan yang sama muncul berkali-kali meski sudah
dilarang secara eksplisit. Ini dicatat supaya AI yang membaca paham *polanya*, bukan cuma
daftar larangan satu-satu:

1. **Instruksi teks kadang tidak cukup diingat lintas-generate.** Setiap kali sebuah halaman
   di-generate ulang sebagai task terpisah, sistem tidak selalu "ingat" halaman lain yang
   sudah dibuat sebelumnya — walau instruksinya sama persis. Solusinya: setiap prompt harus
   SELF-CONTAINED (ulangi token warna, spesifikasi nav, aturan keras di setiap prompt),
   jangan mengandalkan "seperti yang sudah dijelaskan sebelumnya".
2. **Nama task yang berbeda dianggap permintaan desain baru, bukan revisi.** Kalau mau
   merevisi halaman yang sudah ada, nama/judul task harus persis sama dengan sebelumnya.
   Nama berbeda sedikit saja (`_v2`, `_pre_auth`, dst) bisa membuat AI mengarang ulang dari
   nol, termasuk menambah elemen yang tidak diminta.
3. **Project/riwayat generate menumpuk versi lama dan baru bersamaan.** Saat export/ekspor
   hasil, versi-versi lama (draft, iterasi tengah) bisa ikut terbawa bersama versi final.
   Ini bukan kesalahan desain baru — tapi kalau tidak dibersihkan, terlihat seperti
   inkonsistensi padahal versi finalnya sebenarnya sudah benar.
4. **Rendering kadang rusak di breakpoint tertentu** (kolom kepenyet, teks tumpang tindih)
   tanpa sebab jelas dari sisi prompt — ini kegagalan render, perlu di-generate ulang untuk
   breakpoint yang rusak saja, bukan tanda ada yang salah dengan spesifikasinya.
5. **ALL CAPS dan card-notifikasi bergaya "border kiri + ikon bulat" adalah default yang
   sangat mudah muncul lagi** meski sudah dilarang berkali-kali — ini pola umum di banyak
   UI-kit generik yang kemungkinan besar ada di data latih. Perlu ditegaskan ulang di setiap
   prompt, bukan cukup sekali di awal.

## 8. Fitur teknis lengkap — Data Science Pipeline & pemetaannya ke halaman

Bagian ini menjelaskan SEMUA fitur teknis yang pernah dibahas di proyek ini — baik yang eksplisit
ada di draft SRS terbaru (skema sederhana: DatasetInput → EngineOutput) maupun elaborasi teknis
yang dipakai untuk desain UI supaya realistis. Tujuannya: AI yang membaca paham *apa yang
sebenarnya dihitung* di balik tiap chart/kartu, bukan cuma "taruh grafik di sini".

### 8.1 Tahap 1 — Cleaning + EDA
**Apa:** Sebelum data DatasetInput (pH, kelembapan, nutrisi) masuk ke model, dilakukan
standardisasi satuan (luas ke m², nominal ke IDR), penanganan nilai hilang (imputasi
median/modus), dan deteksi outlier (Interquartile Range/IQR) untuk mengurangi galat input
manual dari petani.
**Halaman terkait:** Tidak tampil langsung ke user — ini proses backend murni. Efeknya
terlihat tidak langsung di **Riwayat** (data yang ditampilkan sudah bersih) dan di kualitas
rekomendasi yang muncul di **Panel Dasbor**.

### 8.2 Tahap 2 — Feature Engineering
**Apa:** Variabel turunan yang dihitung sistem dari data mentah, bukan diinput manual:
- **Margin keuntungan** = (harga per unit × jumlah hasil panen) − total biaya operasional
- **Produktivitas** = jumlah hasil panen / luas lahan
- **Fitur musiman** — diturunkan dari bulan tanam, durasi siklus, dan status musim
  hujan/kemarau (kalau data cuaca eksternal dipakai, ini sumbernya; kalau tidak, cukup
  dari pola historis tanggal tanam)
- **Fitur historis (lag features)** — rata-rata performa lahan pada siklus sebelumnya,
  dipakai model buat "ingat" tren jangka panjang per lahan

**Halaman terkait:** Angka margin & produktivitas tampil di **Dashboard Admin** (strip angka
kunci) dan **Panel Dasbor** (ringkasan parameter). Fitur musiman & historis tidak tampil
langsung ke user — dipakai model di baliknya untuk menghasilkan `prediction_result` yang
lebih akurat.

### 8.3 Tahap 3a — Prediksi Runtun Waktu (Time Series Forecasting)
**Apa:** Model memproyeksikan **dua hal sekaligus** untuk periode ke depan (biasanya 3
bulan): tren harga komoditas DAN estimasi volume/tonase hasil panen. Untuk data historis
sedikit (awal proyek), dipakai model sederhana (regresi linier/moving average); begitu data
cukup, bisa naik ke ARIMA/exponential smoothing yang menangkap pola musiman.
**Kenapa dua-duanya penting:** rekomendasi "komoditas mana paling untung" butuh harga DAN
volume — kalau cuma volume yang diprediksi, sistem tidak bisa hitung margin proyeksi.
**Halaman terkait:** **Dashboard Admin** (chart "Tren Harga & Volume Panen", dua garis
overlay) dan **Panel Dasbor** (chart detail per-lahan dengan interval kepercayaan/confidence
band di sekitar garis prediksi).

### 8.4 Tahap 3b — Clustering + Deteksi Risiko Lahan
**Apa:** Dua model terpisah yang jalan atas data yang sama (fitur produktivitas +
efisiensi biaya per lahan), dan sama-sama menghasilkan pewarnaan/kategori per lahan:
- **Clustering (K-Means)** — mengelompokkan lahan ke beberapa klaster (biasanya 3) berdasar
  kesamaan produktivitas & efisiensi biaya. Ini pengelompokan "mirip mana dengan mana",
  bukan soal baik/buruk.
- **Risk Detection (Isolation Forest)** — algoritma anomaly detection terpisah yang menandai
  lahan yang datanya **menyimpang tajam** dari pola biasa (misal produktivitas anjlok
  drastis) — ini soal "ada yang tidak beres", beda dari sekadar clustering.

**Kenapa dua model terpisah, bukan satu:** clustering menjawab "lahan A mirip lahan mana",
risk detection menjawab "lahan mana yang butuh perhatian segera". Keduanya dibutuhkan
karena rekomendasi seperti "Lahan Blok B: produktivitas turun 3 bulan berturut" itu produk
dari risk detection, bukan dari clustering biasa.

**Halaman terkait:** **peta sebaran di Dashboard Admin** — ini implementasi visualnya. Setiap
titik lahan di peta diwarnai berdasar status gabungan kedua model: `terasering` (hijau
kusam) untuk lahan normal/sehat, `bahaya-lahar` (merah-coklat) untuk lahan yang ditandai
Risk Detection. Data teknis di balik peta: tiap lahan punya `lahan_id`, `latitude`,
`longitude` (dari registrasi awal), `klaster` (hasil K-Means), `status_risiko` (hasil
Isolation Forest) — semua digabung jadi satu dataframe lalu diplot pakai koordinat asli,
BUKAN dari API peta eksternal berbayar (lihat §8.6).

### 8.5 Tahap 4 — Evaluasi & Validasi Model
**Apa:** Sebelum model dipakai produksi, diukur akurasinya: **MAPE/RMSE** untuk model
forecasting (seberapa jauh prediksi meleset dari aktual), **Silhouette Score** untuk
clustering (seberapa jelas batas antar klaster). Data displit pakai time-based train-test
split (bukan random split) supaya urutan kronologis data tidak rusak.
**Halaman terkait:** Tidak tampil ke Petani/Admin biasa — ini metrik internal tim
dev/QA. Kalau mau ditampilkan, tempatnya di **Pengaturan** (bagian referensi teknis), bukan
di dashboard utama.

### 8.6 Peta / GIS — detail teknis
**Sumber koordinat:** diisi manual oleh Petani saat registrasi lahan pertama kali (form di
**Catat Data Lahan**, step "Identitas Lahan" — pin lokasi di map preview). Bukan hasil
geocoding otomatis dari alamat teks.
**Render peta dasar:** pakai tile OpenStreetMap gratis (`mapbox_style="open-street-map"`
kalau pakai Plotly) — TIDAK butuh API berbayar/API key, karena cuma menampilkan tile
background, titik-titik lahannya dari data sendiri.
**Kapan model di-run ulang:** clustering & risk detection idealnya dijadwalkan batch
(misal tiap malam/mingguan), BUKAN real-time tiap kali Admin buka Dashboard — supaya
memenuhi NFR-02 (respons < 3 detik). Hasilnya disimpan di tabel/field terpisah, tidak
dihitung ulang tiap request.

### 8.7 Tahap 5 — Insight & Rekomendasi Otomatis
**Apa:** Tahap akhir pipeline yang menerjemahkan hasil model (angka mentah dari forecasting,
clustering, risk detection) jadi **kalimat rekomendasi yang bisa langsung ditindak** —
bukan sekadar angka. Contoh nyata yang dipakai sebagai acuan gaya bahasa:
- "Komoditas CABAI di lahan Blok A memberikan margin tertinggi di musim kemarin."
- "Lahan Blok B menunjukkan tren produktivitas menurun 3 bulan berturut-turut, disarankan
  cek kondisi tanah/irigasi."
- "Waktu tanam optimal untuk TOMAT di lokasi ini adalah bulan November berdasarkan pola
  harga & curah hujan."

**Ini value proposition utama sistem** — tanpa tahap ini, sistem cuma jadi dashboard grafik
biasa, bukan "sistem pendukung KEPUTUSAN" sesuai namanya.
**Halaman terkait:** feed rekomendasi di **Dashboard Admin** (kolom kanan), kartu status
utama di **Beranda Petani**, dan blok "Hasil inferensi rekomendasi mesin" di **Panel
Dasbor**.

### 8.8 Ringkasan pemetaan fitur teknis → halaman

| Fitur teknis | Halaman utama | Halaman pendukung |
|---|---|---|
| Input data mentah (FR-04) | Catat Data Lahan | — |
| Cleaning + EDA | (backend, tidak tampil) | — |
| Feature engineering (margin, produktivitas) | Dashboard Admin (strip angka) | Panel Dasbor |
| Forecasting harga & volume | Dashboard Admin (chart tren) | Panel Dasbor (chart + confidence band) |
| Clustering + Risk Detection | Peta sebaran (Dashboard Admin) | Manajemen Lahan (kolom status) |
| Evaluasi model (MAPE/RMSE/Silhouette) | Pengaturan (referensi teknis) | — |
| Insight & rekomendasi otomatis | Dashboard Admin (feed), Beranda Petani (kartu status) | Panel Dasbor |
| Audit trail eksekusi pipeline | Log Aktivitas | — |
| Konfigurasi parameter pipeline (ambang batas dsb) | Pengaturan / Manajemen Lahan (drawer konfigurasi per lahan) | — |

## 9. Cara memakai dokumen ini bersama DESIGN.md

- `DESIGN.md` = kebenaran teknis untuk warna, font, spesifikasi nav persis, checklist
  anti-slop. Rujuk ini untuk detail implementasi visual.
- `PROJECT_CONTEXT.md` (dokumen ini) = kebenaran konteks untuk kenapa keputusan itu diambil,
  siapa penggunanya, apa yang sistem coba selesaikan, dan pola kegagalan yang harus dihindari.
- Kalau ada prompt baru yang detailnya tidak eksplisit disebutkan, AI sebaiknya menarik
  keputusan dari prinsip di dokumen ini (misal: "apakah halaman baru ini butuh chart penuh
  atau cukup ringkas?" → jawab berdasar §6, bukan menebak bebas).
