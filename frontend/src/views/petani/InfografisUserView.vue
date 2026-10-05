<template>
  <div class="infografis-page">
    <!-- Print / Download Button -->
    <div class="action-bar no-print">
      <button class="btn-back" @click="$router.back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Kembali
      </button>
      <button class="btn-print" @click="printPoster()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Cetak / Simpan PDF
      </button>
    </div>

    <!-- POSTER LANDSCAPE -->
    <div class="poster" id="poster-user">
      <!-- ===== HEADER ===== -->
      <div class="poster-header">
        <div class="header-left">
          <div class="logo-wrap">
            <img src="/src/assets/tanacakra-icon.svg" alt="Tanacakra" class="logo-icon" />
          </div>
          <div class="header-text">
            <div class="header-eyebrow">PANDUAN PENGGUNAAN</div>
            <h1 class="header-title">Tanacakra <span class="role-badge user">Petani</span></h1>
            <p class="header-sub">Sistem Presisi Tani — Cangkringan, Sleman, Yogyakarta</p>
          </div>
        </div>
        <div class="header-right">
          <div class="step-count-wrap">
            <span class="step-count-num">5</span>
            <span class="step-count-label">Fitur Utama<br/>Petani</span>
          </div>
        </div>
      </div>

      <!-- ===== STEPS GRID ===== -->
      <div class="steps-grid">

        <!-- STEP 1 — Landing -->
        <div class="step-card">
          <div class="step-number">01</div>
          <div class="step-icon">🌐</div>
          <div class="step-content">
            <h3 class="step-title">Buka Halaman Utama</h3>
            <p class="step-desc">Akses <strong>tanacakra.app</strong> — baca fitur, cara kerja, dan statistik lahan aktif sebelum masuk ke dashboard.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/user/landing.png" alt="Landing Page Tanacakra" class="ss-img" />
            <div class="ss-label">Landing Page</div>
          </div>
        </div>

        <!-- STEP 2 — Dashboard -->
        <div class="step-card">
          <div class="step-number">02</div>
          <div class="step-icon">🏠</div>
          <div class="step-content">
            <h3 class="step-title">Dashboard Petani</h3>
            <p class="step-desc">Pantau cuaca BMKG real-time, kondisi lahan Anda hari ini, dan peta interaktif 113 petak lahan Cangkringan.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/user/dashboard.png" alt="Dashboard Petani" class="ss-img" />
            <div class="ss-label">Dashboard Beranda</div>
          </div>
        </div>

        <!-- STEP 3 — Catat Lahan -->
        <div class="step-card">
          <div class="step-number">03</div>
          <div class="step-icon">📋</div>
          <div class="step-content">
            <h3 class="step-title">Catat Data Lahan</h3>
            <p class="step-desc">Input parameter lahan (pH, kelembapan, komoditas, koordinat) melalui form 3-langkah yang mudah diikuti.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/user/catat lahan.png" alt="Catat Lahan" class="ss-img" />
            <div class="ss-label">Form Catat Lahan</div>
          </div>
        </div>

        <!-- STEP 4 — Prediksi Pasar -->
        <div class="step-card">
          <div class="step-number">04</div>
          <div class="step-icon">📈</div>
          <div class="step-content">
            <h3 class="step-title">Prediksi & Pasar</h3>
            <p class="step-desc">Lihat rekomendasi AI, proyeksi harga komoditas 3 bulan ke depan, dan grafik tren berbasis data Scikit-learn.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/user/prediksi harga.png" alt="Prediksi Harga" class="ss-img" />
            <div class="ss-label">Prediksi & Pasar</div>
          </div>
        </div>

        <!-- STEP 5 — Warta Tani -->
        <div class="step-card">
          <div class="step-number">05</div>
          <div class="step-icon">📰</div>
          <div class="step-content">
            <h3 class="step-title">Warta & Kabar Tani</h3>
            <p class="step-desc">Baca peringatan dini hama, info harga pasar Yogyakarta, dan rekomendasi agronomi berbasis AI yang diterbitkan penyuluh.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/user/wara tani.png" alt="Warta Tani" class="ss-img" />
            <div class="ss-label">Kabar & Warta Tani</div>
          </div>
        </div>

      </div>

      <!-- ===== FOOTER ===== -->
      <div class="poster-footer">
        <div class="footer-tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Butuh bantuan? Hubungi <strong>Penyuluh Pertanian</strong> Kec. Cangkringan atau Admin Kelompok Tani.
        </div>
        <div class="footer-brand">
          <img src="/src/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="footer-logo" />
          <span class="footer-copy">© 2026 Tanacakra · Sistem Presisi Tani Lereng Merapi</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
function printPoster() {
  window.print()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

/* ===== ROOT ===== */
.infografis-page {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #f0ede8;
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
}

/* ===== ACTION BAR ===== */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto 20px;
  gap: 12px;
}

.btn-back, .btn-print {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-back {
  background: white;
  color: #3d2b1f;
  border: 1.5px solid #d9cfc7;
}

.btn-back:hover { background: #f5f0eb; }

.btn-print {
  background: #2d5a27;
  color: white;
}

.btn-print:hover { background: #1f3f1b; transform: translateY(-1px); }

/* ===== POSTER ===== */
.poster {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  position: relative;
}

/* ===== HEADER ===== */
.poster-header {
  background: linear-gradient(135deg, #1a3a17 0%, #2d5a27 40%, #3d7a35 70%, #8b4513 100%);
  padding: 32px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.poster-header::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 300px;
  height: 300px;
  background: rgba(255,255,255,0.04);
  border-radius: 50%;
}

.poster-header::after {
  content: '';
  position: absolute;
  bottom: -80px;
  left: 30%;
  width: 200px;
  height: 200px;
  background: rgba(255,255,255,0.03);
  border-radius: 50%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.logo-wrap {
  background: rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 14px;
  backdrop-filter: blur(4px);
}

.logo-icon {
  width: 48px;
  height: 48px;
  filter: brightness(0) invert(1);
}

.header-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.5px;
  color: rgba(255,255,255,0.65);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.header-title {
  font-size: 36px;
  font-weight: 900;
  color: white;
  margin: 0 0 6px;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-badge {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 999px;
  letter-spacing: 0.5px;
}

.role-badge.user {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 1.5px solid rgba(255,255,255,0.4);
}

.header-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  margin: 0;
  font-weight: 500;
}

.header-right {
  position: relative;
  z-index: 1;
}

.step-count-wrap {
  background: rgba(255,255,255,0.15);
  border: 1.5px solid rgba(255,255,255,0.25);
  border-radius: 16px;
  padding: 16px 24px;
  text-align: center;
  backdrop-filter: blur(4px);
}

.step-count-num {
  display: block;
  font-size: 48px;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.step-count-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin-top: 4px;
  line-height: 1.4;
}

/* ===== STEPS GRID ===== */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  background: #f8f5f0;
}

.step-card {
  background: white;
  border-right: 1px solid #ede8e2;
  border-bottom: 1px solid #ede8e2;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  transition: box-shadow 0.2s;
}

.step-card:last-child {
  border-right: none;
}

.step-number {
  font-size: 36px;
  font-weight: 900;
  color: #e8e0d5;
  line-height: 1;
  position: absolute;
  top: 16px;
  right: 16px;
}

.step-icon {
  font-size: 28px;
  margin-bottom: 2px;
}

.step-title {
  font-size: 14px;
  font-weight: 800;
  color: #1a2e1a;
  margin: 0;
  line-height: 1.3;
}

.step-desc {
  font-size: 11.5px;
  color: #6b6b6b;
  line-height: 1.6;
  margin: 0;
}

/* ===== SCREENSHOT FRAME ===== */
.ss-frame {
  margin-top: 6px;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e8e2db;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ss-img {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
  object-position: top;
  display: block;
}

.ss-label {
  background: #f5f1ec;
  padding: 6px 10px;
  font-size: 10.5px;
  font-weight: 700;
  color: #5a4a3a;
  letter-spacing: 0.3px;
  text-align: center;
  border-top: 1px solid #e8e2db;
}

/* ===== FOOTER ===== */
.poster-footer {
  background: #1a3a17;
  padding: 16px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.footer-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.7);
  font-weight: 500;
}

.footer-tip strong { color: #a8d5a2; }
.footer-tip svg { color: #a8d5a2; flex-shrink: 0; }

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-logo {
  height: 22px;
  filter: brightness(0) invert(1);
  opacity: 0.85;
}

.footer-copy {
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}

/* ===== PRINT ===== */
@media print {
  .no-print { display: none !important; }
  .infografis-page { padding: 0; background: white; }
  .poster {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
    page-break-inside: avoid;
  }
  @page { size: A3 landscape; margin: 8mm; }
}
</style>
