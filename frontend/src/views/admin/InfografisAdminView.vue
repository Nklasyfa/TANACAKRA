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
    <div class="poster" id="poster-admin">
      <!-- ===== HEADER ===== -->
      <div class="poster-header">
        <div class="header-left">
          <div class="logo-wrap">
            <img src="/src/assets/tanacakra-icon.svg" alt="Tanacakra" class="logo-icon" />
          </div>
          <div class="header-text">
            <div class="header-eyebrow">PANDUAN KONSOL PENGELOLA</div>
            <h1 class="header-title">Tanacakra <span class="role-badge admin">Admin</span></h1>
            <p class="header-sub">Konsol Pengelola & Kelompok Tani — Cangkringan, Sleman, Yogyakarta</p>
          </div>
        </div>
        <div class="header-right">
          <div class="step-count-wrap">
            <span class="step-count-num">5</span>
            <span class="step-count-label">Modul<br/>Pengelola</span>
          </div>
        </div>
      </div>

      <!-- ===== INTRO STRIP ===== -->
      <div class="intro-strip">
        <div class="intro-item">
          <span class="intro-icon">🔐</span>
          <span>Akses Penuh RBAC</span>
        </div>
        <div class="intro-divider"></div>
        <div class="intro-item">
          <span class="intro-icon">🤖</span>
          <span>AI + Scikit-Learn Engine</span>
        </div>
        <div class="intro-divider"></div>
        <div class="intro-item">
          <span class="intro-icon">🗄️</span>
          <span>PostgreSQL Supabase Real-time</span>
        </div>
        <div class="intro-divider"></div>
        <div class="intro-item">
          <span class="intro-icon">📡</span>
          <span>Telemetri Merapi 420 mdpl</span>
        </div>
      </div>

      <!-- ===== STEPS GRID ===== -->
      <div class="steps-grid">

        <!-- STEP 1 — Dashboard Admin -->
        <div class="step-card">
          <div class="step-number">01</div>
          <div class="step-icon">📊</div>
          <div class="step-content">
            <h3 class="step-title">Dashboard Pengelola</h3>
            <p class="step-desc">Pantau KPI utama: total panen, estimasi pendapatan, cuaca BMKG, dan rekomendasi AI Scikit-Learn untuk seluruh wilayah Cangkringan.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/admin/dashboard admin.png" alt="Dashboard Admin" class="ss-img" />
            <div class="ss-label">Dashboard Pengelola</div>
          </div>
        </div>

        <!-- STEP 2 — Manajemen Lahan -->
        <div class="step-card">
          <div class="step-number">02</div>
          <div class="step-icon">🌾</div>
          <div class="step-content">
            <h3 class="step-title">Manajemen Lahan</h3>
            <p class="step-desc">Kelola 113 petak lahan — cari, edit, hapus, ekspor CSV, atau tambahkan sample ML baru. Filter per desa dan pantau status pH tanah.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/admin/manajemen lahan.png" alt="Manajemen Lahan" class="ss-img" />
            <div class="ss-label">Lahan & Sensor</div>
          </div>
        </div>

        <!-- STEP 3 — Master Data Excel -->
        <div class="step-card">
          <div class="step-number">03</div>
          <div class="step-icon">📂</div>
          <div class="step-content">
            <h3 class="step-title">Master Data Excel</h3>
            <p class="step-desc">Unggah file <code>.xlsx</code> master data lahan, iklim, hama, dan harga lelang. Sistem auto-index ke Scikit-Learn pipeline AI secara otomatis.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/admin/master excel.png" alt="Master Data Excel" class="ss-img" />
            <div class="ss-label">Olah Master Data</div>
          </div>
        </div>

        <!-- STEP 4 — Warta Tani Admin -->
        <div class="step-card">
          <div class="step-number">04</div>
          <div class="step-icon">📢</div>
          <div class="step-content">
            <h3 class="step-title">Warta & Broadcast AI</h3>
            <p class="step-desc">Buat dan publikasikan warta menggunakan generator AI (Llama 3.1). Pilih kategori, tingkat urgensi, dan broadcast ke seluruh petani.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/admin/wara tani admin.png" alt="Warta Admin" class="ss-img" />
            <div class="ss-label">Warta & Kabar Tani</div>
          </div>
        </div>

        <!-- STEP 5 — Pengaturan Sistem -->
        <div class="step-card">
          <div class="step-number">05</div>
          <div class="step-icon">⚙️</div>
          <div class="step-content">
            <h3 class="step-title">Pengaturan Sistem</h3>
            <p class="step-desc">Kelola model AI RandomForest, pantau metrik akurasi (MAPE 8.4%), referensi REST API, dan konfigurasi jadwal eksekusi model otomatis.</p>
          </div>
          <div class="ss-frame">
            <img src="/src/assets/ss/admin/setting admin.png" alt="Pengaturan Sistem" class="ss-img" />
            <div class="ss-label">Pengaturan & AI Engine</div>
          </div>
        </div>

      </div>

      <!-- ===== ROLE PERMISSIONS TABLE ===== -->
      <div class="permissions-bar">
        <div class="perm-label">Hak Akses Admin:</div>
        <div class="perm-item full">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Dashboard Pengelola
        </div>
        <div class="perm-item full">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Kelola Semua Lahan
        </div>
        <div class="perm-item full">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Upload Master Data Excel
        </div>
        <div class="perm-item full">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Publish Warta AI
        </div>
        <div class="perm-item full">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Kontrol Model AI & Log Audit
        </div>
      </div>

      <!-- ===== FOOTER ===== -->
      <div class="poster-footer">
        <div class="footer-tip">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Akun Admin hanya diberikan ke <strong>Kelompok Tani & Penyuluh</strong> yang terdaftar resmi di Kec. Cangkringan.
        </div>
        <div class="footer-brand">
          <img src="/src/assets/tanacakra-wordmark.svg" alt="Tanacakra" class="footer-logo" />
          <span class="footer-copy">© 2026 Tanacakra · Konsol Pengelola Lereng Merapi</span>
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
  background: #1a1a2e;
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
  background: rgba(255,255,255,0.1);
  color: white;
  border: 1.5px solid rgba(255,255,255,0.2);
}

.btn-back:hover { background: rgba(255,255,255,0.18); }

.btn-print {
  background: #8b4513;
  color: white;
}

.btn-print:hover { background: #6b3410; transform: translateY(-1px); }

/* ===== POSTER ===== */
.poster {
  max-width: 1400px;
  margin: 0 auto;
  background: #0f1117;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.06);
}

/* ===== HEADER ===== */
.poster-header {
  background: linear-gradient(135deg, #0a0e1a 0%, #1a2a4a 40%, #2a1a4a 70%, #4a1a0a 100%);
  padding: 32px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.poster-header::before {
  content: '';
  position: absolute;
  top: -80px; right: -80px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(139,69,19,0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.poster-header::after {
  content: '';
  position: absolute;
  bottom: -60px; left: 20%;
  width: 200px; height: 200px;
  background: radial-gradient(circle, rgba(42,26,74,0.3) 0%, transparent 70%);
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
  background: rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 14px;
  border: 1px solid rgba(255,255,255,0.12);
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
  color: rgba(255,255,255,0.45);
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

.role-badge.admin {
  background: linear-gradient(135deg, #8b4513, #c0612a);
  color: white;
  border: 1.5px solid rgba(255,255,255,0.2);
}

.header-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin: 0;
  font-weight: 500;
}

.header-right {
  position: relative;
  z-index: 1;
}

.step-count-wrap {
  background: rgba(139,69,19,0.2);
  border: 1.5px solid rgba(139,69,19,0.4);
  border-radius: 16px;
  padding: 16px 24px;
  text-align: center;
}

.step-count-num {
  display: block;
  font-size: 48px;
  font-weight: 900;
  color: #e87a40;
  line-height: 1;
}

.step-count-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  margin-top: 4px;
  line-height: 1.4;
}

/* ===== INTRO STRIP ===== */
.intro-strip {
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 14px 48px;
  display: flex;
  align-items: center;
  gap: 0;
}

.intro-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.6);
  flex: 1;
}

.intro-icon { font-size: 18px; }

.intro-divider {
  width: 1px;
  height: 24px;
  background: rgba(255,255,255,0.1);
  margin: 0 20px;
}

/* ===== STEPS GRID ===== */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
  background: #0f1117;
}

.step-card {
  background: #13171f;
  border-right: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
}

.step-card:last-child {
  border-right: none;
}

.step-number {
  font-size: 36px;
  font-weight: 900;
  color: rgba(255,255,255,0.05);
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
  color: #f0ede8;
  margin: 0;
  line-height: 1.3;
}

.step-desc {
  font-size: 11.5px;
  color: rgba(255,255,255,0.5);
  line-height: 1.65;
  margin: 0;
}

.step-desc code {
  background: rgba(255,255,255,0.08);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  color: #e87a40;
}

/* ===== SCREENSHOT FRAME ===== */
.ss-frame {
  margin-top: 6px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
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
  background: rgba(255,255,255,0.05);
  padding: 6px 10px;
  font-size: 10.5px;
  font-weight: 700;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.3px;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.06);
}

/* ===== PERMISSIONS BAR ===== */
.permissions-bar {
  background: rgba(139,69,19,0.12);
  border-top: 1px solid rgba(139,69,19,0.2);
  border-bottom: 1px solid rgba(139,69,19,0.2);
  padding: 12px 48px;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.perm-label {
  font-size: 11px;
  font-weight: 800;
  color: #e87a40;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-right: 8px;
}

.perm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.65);
}

.perm-item.full svg { color: #4ade80; }

/* ===== FOOTER ===== */
.poster-footer {
  background: #080b10;
  padding: 16px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.footer-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  font-weight: 500;
}

.footer-tip strong { color: #e87a40; }
.footer-tip svg { color: #e87a40; flex-shrink: 0; }

.footer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.footer-logo {
  height: 22px;
  filter: brightness(0) invert(1);
  opacity: 0.5;
}

.footer-copy {
  font-size: 11px;
  color: rgba(255,255,255,0.25);
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
    background: white;
    page-break-inside: avoid;
  }
  @page { size: A3 landscape; margin: 8mm; }
}
</style>
