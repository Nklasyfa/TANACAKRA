# TANACAKRA — Design Brief & Token System

## 0. Kenapa dokumen ini ada

Hasil generate pertama (lihat `stitch_tanacakra_agri_decision_portal/`) kena semua ciri khas
"AI dashboard slop":

- KPI card kotak sama rata, ikon dilingkarin di pojok kanan atas — pola SaaS-kit generik
- Sidebar ikon + label kiri, identik dengan template admin panel manapun (Notion/Linear/Vercel dsb)
- Label ALL CAPS di mana-mana ("TOTAL LAHAN", "HASIL PANEN", "MARGIN PROFIT")
- Card insight dengan border kiri berwarna + badge ikon bulat — pola notifikasi generik
- Garis chart putus-putus buat differentiate series (bukan pilihan visual yang berarti)
- Card "New Report" hijau solid dengan ikon plus — tombol CTA generik SaaS
- Foto avatar generik di pojok kiri atas — tidak menunjukkan siapa penggunanya

Masalah dasarnya: desain ini bisa dipakai buat dashboard apa aja — logistik, keuangan, HR.
Tidak ada satupun elemen yang bilang "ini soal petani di lereng Merapi mengelola lahan pasca-erupsi".
Dokumen ini nge-ground ulang desainnya ke subject matter aslinya.

## 0b. Larangan menambah elemen baru di luar spesifikasi

Percobaan sebelumnya membuktikan Stitch akan mengarang elemen baru begitu diberi nama file
yang beda dikit aja (contoh nyata yang benar-benar muncul: ikon maskot traktor sebagai logo,
bar cuaca/ketinggian "680 mdpl · Merapi Level II" di atas layar, badge kepercayaan palsu
"Enkripsi 256-Bit · Sinkronisasi Offline · Balai Sleman" di footer — semua ini TIDAK PERNAH
diminta di prompt manapun). Ini bukan insiden sekali, jadi aturan ini didokumentasikan
permanen di sini, bukan cuma diketik ulang manual tiap prompt:

- Setiap elemen visual di halaman manapun harus bisa ditelusuri balik ke SRS atau ke
  dokumen ini. Kalau tidak ada dasarnya, jangan dimunculkan — sekalipun "kelihatan pas"
  secara tema (misal info cuaca/ketinggian gunung terasa related tapi tidak diminta).
- Dilarang: mascot/ikon karakter, badge kepercayaan/keamanan yang dikarang ("256-bit",
  sertifikasi palsu), tagline marketing tambahan, widget cuaca/lokasi yang tidak diminta
  eksplisit, elemen dekoratif yang tidak fungsional.
- Saat merevisi halaman yang sudah ada, PAKAI NAMA/JUDUL TASK YANG PERSIS SAMA dengan
  sebelumnya. Nama berbeda (`_v2`, `_pre_auth`, dsb) akan ditangkap sebagai permintaan
  desain baru oleh Stitch, bukan revisi.

## 0c. Checklist anti-slop tambahan (di luar yang sudah ada di bagian 5)

- Tidak ada ikon check-circle generik berulang di semua kartu status
- Tidak ada gradient text atau efek glassmorphism/blur-transparan
- Tidak ada bentuk pill/rounded-full dipakai untuk semua hal (button, badge, tab, avatar)
  sekaligus dalam satu layar — pilih di mana bentuk itu punya makna (misal cuma di active
  tab bar), bukan diulang ke elemen lain sampai kehilangan arti
- Tidak ada headline/tagline generik ala marketing ("Solusi cerdas untuk masa depan
  pertanian!") — bahasa selalu deskriptif dan fungsional, bukan copywriting
- Tidak ada foto stok petani/sawah generik sebagai hero image kalau tidak diminta eksplisit
  di prompt halaman tersebut

**Dua pelanggaran yang TERBUKTI terulang berkali-kali meski sudah dilarang — perhatikan
khusus, jangan anggap aturan umum di atas cukup:**

1. Label section ALL CAPS tetap muncul berulang kali dalam berbagai bentuk: "PARAMETER
   MASUKAN TANAH TERAKHIR", "HASIL INFERENSI REKOMENDASI MESIN", "KONFIGURASI PIPELINE
   MODEL", "SARAN PENYULUH", "AKTIVITAS TERBARU". Semua judul section, di halaman manapun,
   ditulis dalam sentence case biasa ("Parameter masukan tanah terakhir", bukan versi
   kapital). Sebelum output final, cek ulang: kalau ada teks yang seluruhnya huruf besar
   dan bukan singkatan resmi (ID, API, NPK), itu harus diubah ke sentence case.
2. Card rekomendasi/insight dengan border kiri berwarna + ikon bulat di pojok tetap
   muncul berulang (termasuk di halaman Panel Dasbor, Dashboard Admin). Kartu hasil
   rekomendasi/insight cukup pakai: judul singkat sentence-case + isi kalimat lengkap +
   background netral atau tint tipis sesuai urgensi — TANPA garis vertikal berwarna di
   sisi kiri dan TANPA ikon dalam bentuk bulat/badge di pojok kiri atas card.

## 1. Subject, Audience, Job (harus dipegang di setiap iterasi)

**Subject nyata:** Desa Cangkringan ada di lereng selatan Gunung Merapi, Sleman — daerah yang
tanahnya justru jadi sangat subur karena abu vulkanik dari letusan (2010 & seterusnya), tapi juga
daerah yang rutin menghadapi risiko fisik (banjir lahar dingin, kekeringan pasca-erupsi, siklus
tanam yang harus dipantau ketat). Komoditas utama wilayah ini termasuk salak pondoh, cabai,
tomat, dan sayuran dataran tinggi. Rumah & lumbung tradisional di sana pakai atap genteng
tanah liat merah-coklat, dan kain lurik/batik lokal Sleman condong ke palet indigo-coklat-krem,
bukan hijau cerah korporat.

**Audiens:**
- Petani lapangan — akses dari HP, seringkali sinyal lemah, tidak semua fasih teknologi,
  butuh interaksi besar & jelas, bukan dashboard analitik padat data
- Admin/Penyuluh — kerja dari laptop/desktop, terbiasa lihat data mentah, butuh kepadatan
  informasi tinggi tapi tetap scannable dalam waktu cepat karena harus mantau banyak lahan

**Job utama:** Menjawab 3 pertanyaan konkret secepat mungkin — *"lahan mana yang lagi
bermasalah?"*, *"komoditas apa yang paling untung musim ini?"*, dan *"kapan waktu tanam yang
tepat?"* — bukan sekadar menampilkan grafik.

## 2. Palet Warna

**Revisi (menggantikan palet terracotta sebelumnya):** atas permintaan eksplisit, identitas
warna sekarang **butter (krem hangat) + hijau**, bukan lagi terracotta/abu vulkanik. Nama
token TETAP SAMA seperti sebelumnya (biar semua prompt lama yang sudah menyebut nama token
ini tidak perlu ditulis ulang total) — cuma nilai hex-nya yang berubah. Catatan: aturan lama
"jangan pakai hijau sebagai warna dominan" di bawah ini sudah TIDAK BERLAKU — sekarang hijau
justru warna identitas utama, ini keputusan sengaja bukan default yang tidak disadari.

| Nama token | Hex LAMA (terracotta) | Hex BARU (butter+hijau) | Peran |
|---|---|---|---|
| `abu-vulkanik` | `#3A3733` | `#3A3733` (tetap) | Warna teks utama & elemen gelap — tetap dark neutral, masih kebaca jelas di atas butter |
| `tanah-subur` | `#5C4A32` | `#2F4A2C` | Warna aksen sekunder / border kuat / ikon nav aktif — hijau tua |
| `terasering` | `#6B7A4F` | `#6FA05C` | Hijau sedang untuk status "sehat/baik" — beda saturasi dari hijau utama biar tetap kebeda |
| `genteng` | `#B3542C` | `#4C7A3F` | Warna identitas utama / CTA / nav aktif — hijau forest, PENGGANTI terracotta |
| `abu-letusan` | `#EFEAE0` | `#FFF9E8` | Latar utama — krem butter hangat, bukan putih polos |
| `bahaya-lahar` | `#8C2F1B` | `#B23A24` | Merah-rust untuk status risiko/peringatan — tetap kontras jelas dari hijau |

Aturan pakai (revisi):
- Warna identitas utama sekarang `genteng` (hijau forest `#4C7A3F`) — dipakai CTA utama,
  nav aktif, dan elemen brand.
- `terasering` (hijau sedang `#6FA05C`) tetap dipakai khusus untuk indikator status
  "sehat/baik" — meski satu keluarga hue dengan `genteng`, bedakan lewat saturasi/kecerahan
  supaya "tombol aksi" tidak tertukar visual dengan "status baik".
- `bahaya-lahar` (merah-rust) tetap jadi satu-satunya warna peringatan/risiko — kontras kuat
  dari keluarga hijau, jangan diganti ke warna lain.
- Satu warna aksen berani per layar, sisanya netral — jangan semua card dikasih warna beda.

## 3. Tipografi

Stitch pakai Inter buat semuanya (default paling gampang ketebak AI). Ganti jadi kombinasi
yang punya karakter tapi tetap kebaca jelas buat petani di HP:

- **Display/Heading:** *Fraunces* atau *Source Serif 4* — serif dengan sedikit karakter,
  dipakai di judul halaman & angka besar KPI. Ini ngasih kesan "dokumen resmi pertanian/dinas",
  bukan "app startup".
- **Body/UI:** *Plus Jakarta Sans* atau *Figtree* — sans-serif humanis, dipilih karena render
  jelas di layar kecil dan tidak terlalu geometris/dingin seperti Inter.
- **Data/angka (chart, tabel):** gunakan tabular figures dari font body yang sama — jangan
  tambah font monospace pihak ketiga hanya untuk angka (itu salah satu tanda template AI).

Jangan pakai ALL CAPS untuk label card. Ganti "TOTAL LAHAN" → "Total lahan terdaftar" (sentence
case). ALL CAPS cuma untuk hal yang memang perlu ditegaskan sebagai status singkat (misal badge
kecil "RISIKO").

## 3b. Beranda vs Panel Dasbor — kapan pakai chart penuh vs tabel ringan

Keputusan final: **Beranda TIDAK memakai chart interaktif penuh** di panel sekundernya.
Beranda adalah layar "sekali lirik langsung ngerti" (quick glance), bukan tempat analisis
mendalam — chart lengkap dengan axis/hover/zoom di sana cuma nambah beban visual yang tidak
perlu. Sebagai gantinya, panel sekunder Beranda memakai **tabel/list ringkas dengan bar
indikator inline** di belakang tiap nilai (tanggal — nilai — bar pendek yang menunjukkan
tren, bukan chart dengan sumbu).

Chart interaktif penuh (Plotly-style, hover tooltip, zoom, axis lengkap) HANYA dipakai di:
- Dashboard Admin/Penyuluh (tren harga & volume panen)
- Panel Dasbor / Detail Analisis (grafik prediksi dengan confidence interval)

Ini tetap memenuhi FR-06 (visualisasi Plotly interaktif) karena requirement itu terpenuhi
di halaman Dashboard & Panel Dasbor — bukan berarti setiap halaman wajib punya chart.

## 4. Prinsip Layout — per jenis pengguna

### Petani (mobile-first)
```
[ Header sederhana: nama musim tanam aktif ]
[ 1 kartu besar: status lahan hari ini — bukan grid angka ]
[ Tombol besar: "Catat kegiatan hari ini" — satu CTA jelas, bukan banyak tombol kecil ]
[ Rekomendasi terbaru (1-2 kalimat, bukan card generik) ]
[ Tab bar bawah: Beranda / Catat / Riwayat / Profil ]
```
Prinsip: satu fokus per layar. Petani buka app buat 1 tugas (input data / cek rekomendasi),
bukan buat "menjelajah dashboard". Jangan bikin banyak card kecil berdampingan di mobile.

### Admin/Penyuluh (desktop, data-dense tapi tetap terstruktur)
```
[ Konteks wilayah: "Desa Cangkringan — 4 Blok, 124 lahan terdaftar" sebagai kalimat, bukan cuma angka ]
[ Peta sebaran jadi elemen UTAMA di atas — bukan disembunyikan di menu terpisah ]
    (karena job utama = "lahan mana yang bermasalah", peta jawab ini lebih cepat dari tabel)
[ Di bawah peta: 2 kolom — tren harga/panen (kiri, lebih besar) | rekomendasi teks (kanan, lebih sempit) ]
[ Tabel lahan detail di bawah, bukan di layar terpisah yang butuh klik menu dulu ]
```
Prinsip: peta & insight teks yang jadi hero, bukan grid KPI card generik di paling atas.
KPI angka (total lahan, total biaya) cukup jadi 1 baris kecil di header, bukan 4 card besar
identik yang menghabiskan setengah layar pertama.

## 4b. Sistem Navigasi — SATU pola untuk SEMUA halaman

Masalah yang muncul di hasil generate kedua: halaman Beranda pakai sidebar kiri vertikal +
topbar terpisah, sedangkan halaman Catat Data Lahan pakai navbar horizontal di atas tanpa
sidebar. Dua pola berbeda untuk 1 sistem yang sama — user akan bingung karena posisi menu
"pindah" setiap ganti halaman. Ini jadi sumber kebenaran tunggal, wajib dipakai identik di
SEMUA halaman, tanpa terkecuali dan tanpa variasi per-role:

**Struktur navigasi (satu definisi, dipakai di setiap breakpoint secara konsisten):**

- **Desktop (≥1024px):** Sidebar kiri tetap (fixed), lebar ~240px, berisi logo "Tanacakra" di
  atas, lalu daftar menu vertikal: Beranda, Catat, Riwayat, Profil (Petani) atau Dashboard,
  Manajemen Lahan, Log Aktivitas, Pengaturan (Admin). TIDAK ADA topbar horizontal terpisah
  di atas sidebar — item seperti notifikasi, lokasi aktif, dan avatar profil masuk ke DALAM
  sidebar (di bagian bawah atau sebagai header kecil di dalam sidebar itu sendiri), bukan
  jadi bar kedua yang terpisah.
- **Tablet (768px–1023px):** Sidebar collapse jadi ikon-saja (lebar ~72px, label hilang,
  tooltip muncul saat hover), struktur & urutan menu tetap identik.
- **Mobile (<768px):** Sidebar berubah jadi bottom tab bar fixed di bawah, isinya PERSIS
  item yang sama dengan sidebar desktop, urutan sama. Untuk Admin yang punya menu >4 item,
  4 item utama di bottom bar + 1 item "Lainnya" yang membuka drawer/sheet untuk sisanya.
  Header atas di mobile HANYA berisi judul halaman + 1-2 ikon aksi (notifikasi/profil),
  bukan menu navigasi duplikat.

**Ukuran logo & kontras state aktif (aturan pasti, jangan diserahkan ke interpretasi bebas):**
- Logo "Tanacakra" di dalam sidebar: font-size setara heading kecil (~20-22px), Fraunces
  semi-bold — BUKAN display-size besar. Logo cuma penanda identitas kecil di pojok sidebar,
  bukan elemen hero. Kalau logo terasa lebih menonjol dari konten utama halaman, itu salah.
- Item menu nonaktif: teks `abu-vulkanik` dengan opacity penuh (kontras jelas, gampang
  dibaca) — BUKAN warna pudar/tint muda. Yang boleh lebih redup adalah ikon-nya sedikit
  (opacity ~70%), bukan tekstnya.
- Item menu AKTIF harus terlihat LEBIH tegas dari yang nonaktif, bukan lebih pudar: teks
  `genteng` solid (bukan tint pucat), latar `abu-letusan` sedikit lebih gelap dari
  background sekitarnya, garis aksen kiri `tanah-subur` setebal 3px.

**Spesifikasi PASTI — satu-satunya versi yang boleh dipakai (jangan variasikan sama sekali):**

Ini eksplisit karena percobaan sebelumnya, meski sudah dikasih instruksi teks yang sama,
tetap menghasilkan 4+ variasi berbeda untuk hal yang seharusnya identik. Anggap ini sebagai
spesifikasi kode, bukan saran gaya.

*Item menu — HARUS persis string ini, tidak ada variasi lain:*
- Petani: `Beranda`, `Catat`, `Riwayat`, `Profil` (4 item, titik).
- Admin/Penyuluh: `Dashboard`, `Manajemen Lahan`, `Log Aktivitas`, `Pengaturan` (4 item, titik).
  Item pertama Admin adalah "Dashboard", BUKAN "Beranda" — "Beranda" khusus milik Petani.
  Jangan pernah menaruh menu Petani (Beranda/Catat/Riwayat/Profil) di halaman Admin manapun.

*State aktif — HARUS pakai kombinasi ini, bukan salah satu saja:*
Background `abu-letusan` sedikit lebih gelap (fill penuh di belakang item, bukan cuma teks) +
garis aksen kiri `tanah-subur` 3px + teks/ikon `genteng` solid. Ketiga elemen ini WAJIB
muncul bersamaan di setiap halaman — tidak boleh ada versi "cuma garis tanpa fill" di satu
halaman dan "fill tanpa garis" di halaman lain.

*Footer sidebar (bagian paling bawah, di atas garis pemisah) — HARUS persis struktur ini:*
Satu baris berisi ikon profil kecil + nama user + role di bawahnya (contoh: "Admin Utama" /
"Admin/Penyuluh"), lalu di bawahnya satu baris "Keluar" dengan ikon logout. Tidak ada versi
lain (bukan cuma "Profil", bukan cuma "Bantuan + Keluar", bukan "Notifikasi + Keluar") — dua
baris ini persis, di semua halaman, semua role.

*Bottom tab bar mobile — state aktif HARUS:*
Ikon + label dalam pill/rounded-background `abu-letusan` gelap sedikit, ikon & teks `genteng`.
Item nonaktif: ikon & teks `abu-vulkanik` tanpa pill background. Satu treatment ini dipakai di
semua halaman mobile, tidak ada versi tanpa pill di halaman lain.

*Larangan menyingkat label di mobile — kegagalan baru yang teramati:*
Pada batch sebelumnya, sidebar Admin desktop menulis label lengkap ("Manajemen Lahan", "Log
Aktivitas") tapi bottom tab bar Admin di mobile malah menyingkatnya sendiri jadi "Lahan" dan
"Log" — sementara nav Petani di halaman lain tetap memakai label penuh. Label menu HARUS
sama persis di mobile maupun desktop, tidak ada pengecualian "disingkat karena layar
sempit" — kalau label kepanjangan untuk bottom tab bar, kecilkan ukuran font labelnya,
JANGAN mengubah teksnya.

**Aturan keras:**
- Jangan pernah render sidebar DAN navbar horizontal penuh di halaman yang sama — pilih satu
  kontainer navigasi per breakpoint sesuai definisi di atas.
- Urutan dan penamaan item menu harus identik persis di setiap halaman dan setiap breakpoint
  (jangan "Beranda" di satu halaman lalu "Home"/"Dashboard" di halaman lain untuk hal yang sama).
  Untuk Petani: Beranda, Catat, Riwayat, Profil.
  Untuk Admin/Penyuluh: Dashboard, Manajemen Lahan, Log Aktivitas, Pengaturan.
- State aktif ditandai dengan cara yang sama di semua halaman: latar `abu-letusan` sedikit
  lebih gelap + teks/ikon `genteng`, garis aksen tipis `tanah-subur` di sisi kiri item aktif.
- Logo & branding "Tanacakra" cuma muncul SEKALI per halaman (di dalam sidebar/nav utama),
  bukan diulang di dua tempat berbeda.

## 5. Yang harus dihindari (dari hasil Stitch kemarin, jadi checklist eksplisit)

- ❌ KPI card kotak identik berjajar dengan ikon dalam lingkaran di pojok kanan atas
- ❌ Sidebar generik ikon+label kiri tanpa identitas visual apapun
- ❌ Avatar foto generik di pojok atas tanpa konteks
- ❌ ALL CAPS untuk semua label card
- ❌ Card insight dengan border warna kiri + badge ikon bulat (pola notifikasi Bootstrap/Tailwind-kit)
- ❌ Garis chart putus-putus tanpa alasan visual yang jelas
- ❌ Warna hijau terang sebagai warna dominan brand
- ❌ Shadow abu-abu lembut generik (`rgba(0,0,0,.1)`) di semua card
- ❌ Border-radius yang sama persis di semua elemen tanpa hierarki

## 6. Yang harus ditegaskan sebagai identitas

- ✅ Peta sebaran lahan sebagai elemen hero di dashboard admin (bukan tab terpisah)
- ✅ Bahasa Indonesia natural, sentence case, kalimat aktif ("Lahan Blok B produktivitas turun" —
  bukan "PENURUNAN PRODUKTIVITAS")
- ✅ Rekomendasi ditulis sebagai kalimat penuh yang actionable, bukan judul + badge generik
- ✅ Palet terracotta-tanah-abu vulkanik sebagai identitas warna, hijau cuma untuk status
- ✅ Satu momen visual berani per layar (misal: peta besar di admin, atau 1 kartu status besar
  di petani) — sisanya tenang dan tidak berebut perhatian

## 6b. Daftar Lengkap Halaman (dari pembacaan ulang SRS penuh)

SRS 7.1 mewajibkan minimal: Login, Dashboard Utama (2 role), Form Input Parameter Lahan,
Panel Dasbor Plotly. Digabung dengan FR-03/07/08 dan item nav yang sudah disepakati
(Riwayat, Profil, Log Aktivitas, Pengaturan), daftar lengkapnya:

0. Guest Preview (pre-auth, read-only dashboard) — pengganti splash/gerbang login wajib
1. Login & Register — FR-01, FR-02 (dipicu kontekstual dari Guest Preview)
2. Beranda Petani — FR-06 (dashboard utama Petani)
3. Catat Data Lahan — FR-04 (form input parameter)
4. Riwayat (Petani) — riwayat DatasetInput & EngineOutput milik sendiri
5. Profil (Petani) — data akun, ganti kata sandi, info kontak
6. Dashboard Admin/Penyuluh — FR-06 (dashboard utama Admin)
7. Manajemen Lahan — FR-03 (master data lahan & konfigurasi pipeline)
8. Panel Dasbor / Detail Analisis — FR-06 (detail satu lahan, dipakai kedua role)
9. Log Aktivitas — FR-08 (audit log)
10. Pengaturan — FR-07 (referensi endpoint API) + konfigurasi pipeline umum

## 6c. Alur Guest Preview → Login kontekstual (bukan gerbang wajib di awal)

Login sebagai halaman pertama yang wajib dilewati kesannya kaku buat Petani yang butuh
fleksibilitas. Solusinya: buka app langsung ke **preview dashboard read-only** (bukan form
login kosong), baru diminta login saat user coba melakukan aksi yang butuh akun.

Alur: **Buka app → Guest Preview (dashboard read-only) → klik aksi yang butuh akun (misal
"Catat Data Lahan") → baru muncul Login/Register**.

**Guest Preview (halaman baru, pre-auth):**
- Menampilkan komponen visual yang sama dengan Dashboard asli (peta sebaran lahan, grafik
  tren) tapi read-only — tanpa kontrol interaktif yang butuh akun.
- SATU-SATUNYA pengecualian dari aturan "no separate horizontal topbar": karena belum ada
  role/sidebar yang relevan di sini, guest preview pakai topbar horizontal ringan berisi
  wordmark "Tanacakra" di kiri + tombol kecil "Masuk"/"Daftar" di kanan. Begitu user login,
  topbar ini hilang total dan digantikan sidebar sesuai aturan normal — jangan pernah
  campur topbar dengan sidebar di halaman manapun setelah login.
- Ada banner/card non-blocking yang mengajak login ("Masuk untuk mencatat data lahan Anda
  sendiri dan menerima rekomendasi personal") — bukan modal paksa yang menghalangi preview.
- Aksi yang butuh akun (Catat Data Lahan, klik detail lahan, dll) memicu Login/Register
  saat itu juga, bukan sebelum preview ditampilkan.

**Halaman Login/Register itu sendiri** tetap identik dengan spesifikasi sebelumnya (role
selector, email+password, dll) — cuma titik masuknya sekarang kontekstual, bukan wajib di
awal.

## 7. Prompt lanjutan buat Stitch (revisi)

Setelah token system ini disepakati, prompt ke Stitch berikutnya harus eksplisit menyertakan
hex/font di atas dan referensi ke checklist bagian 5 — supaya Stitch tidak balik lagi ke
default hijau-SaaS-card-kit miliknya sendiri.
