import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------
# SETUP CANVAS DIMENSIONS (3840 x 2160 - 4K Landscape 16:9)
# ---------------------------------------------------------
WIDTH = 3840
HEIGHT = 2160

# FONTS SETUP
FONT_DIR = "C:/Windows/Fonts/"

def get_font(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    except Exception:
        return ImageFont.load_default()

font_title = get_font("segoeuib.ttf", 52)
font_subtitle = get_font("segoeui.ttf", 26)
font_badge = get_font("segoeuib.ttf", 22)
font_step_num = get_font("segoeuib.ttf", 24)
font_step_title = get_font("segoeuib.ttf", 32)
font_step_tagline = get_font("segoeuib.ttf", 22)
font_body = get_font("segoeui.ttf", 20)
font_bullet = get_font("segoeuib.ttf", 19)
font_footer = get_font("segoeuib.ttf", 22)

# COLOR PALETTE
BG_COLOR = (244, 239, 234)        # #F4EFEA Warm Parchment
HEADER_BG1 = (27, 42, 24)         # #1B2A18 Deep Moss
HEADER_BG2 = (36, 51, 25)         # #243319 Brand Green
ACCENT_ORANGE = (168, 69, 42)      # #A8452A Burned Orange CTA
ACCENT_GOLD = (217, 161, 59)      # #D9A13B Gold Accent
TEXT_DARK = (35, 26, 16)          # #231A10 Dark Earth
TEXT_MUTED = (100, 93, 88)        # #645D58 Muted Earth
CARD_BG = (255, 255, 255)         # White
BORDER_COLOR = (216, 206, 196)    # #D8CEC4 Border
BROWSER_BAR = (45, 55, 72)        # Dark Gray for Browser Window Header

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = bbox
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def make_browser_frame(ss_img, width, height, title_url="tanacakra.cangkringan.desa.id"):
    # Create browser container image
    frame = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    
    # Outer box
    draw_rounded_rect(draw, (0, 0, width-1, height-1), radius=16, fill=(255, 255, 255, 255), outline=(200, 190, 180, 255), width=2)
    
    # Top Browser Header Bar (height = 38px)
    header_h = 38
    draw.rectangle([0, 0, width-1, header_h], fill=BROWSER_BAR)
    
    # Top left dots (Red, Yellow, Green)
    draw.ellipse([14, 13, 24, 23], fill=(255, 95, 86))
    draw.ellipse([30, 13, 40, 23], fill=(255, 189, 46))
    draw.ellipse([46, 13, 56, 23], fill=(39, 201, 63))
    
    # URL bar in middle
    url_box_w = width - 200
    url_box_x = 100
    draw_rounded_rect(draw, (url_box_x, 8, url_box_x + url_box_w, 30), radius=6, fill=(60, 72, 88))
    font_url = get_font("segoeui.ttf", 14)
    draw.text((url_box_x + 12, 11), f"🔒 https://{title_url}", fill=(200, 210, 225), font=font_url)
    
    # Fit screenshot inside content region below header bar
    content_w = width - 4
    content_h = height - header_h - 4
    
    # Resize screenshot preserving aspect ratio
    ss_aspect = ss_img.width / ss_img.height
    box_aspect = content_w / content_h
    
    if ss_aspect > box_aspect:
        new_w = content_w
        new_h = int(content_w / ss_aspect)
    else:
        new_h = content_h
        new_w = int(content_h * ss_aspect)
        
    ss_resized = ss_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Paste centered in content area
    paste_x = 2 + (content_w - new_w) // 2
    paste_y = header_h + 2 + (content_h - new_h) // 2
    
    frame.paste(ss_resized, (paste_x, paste_y))
    return frame

def create_poster(poster_type, title, subtitle, steps_data, output_jpg_path):
    print(f"Generating {poster_type} Poster -> {output_jpg_path}...")
    
    # Base canvas
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # ---------------------------------------------------------
    # 1. HEADER SECTION (Height = 240px)
    # ---------------------------------------------------------
    header_height = 240
    # Gradient header bar
    for y in range(header_height):
        r = int(HEADER_BG1[0] + (HEADER_BG2[0] - HEADER_BG1[0]) * (y / header_height))
        g = int(HEADER_BG1[1] + (HEADER_BG2[1] - HEADER_BG1[1]) * (y / header_height))
        b = int(HEADER_BG1[2] + (HEADER_BG2[2] - HEADER_BG1[2]) * (y / header_height))
        draw.line([(0, y), (WIDTH, y)], fill=(r, g, b))
        
    # Accent bottom line on header
    draw.rectangle([0, header_height - 8, WIDTH, header_height], fill=ACCENT_ORANGE)
    
    # Header Left Logo & Title
    logo_bg_box = (80, 40, 160, 120)
    draw_rounded_rect(draw, logo_bg_box, radius=16, fill=ACCENT_ORANGE)
    draw.text((100, 52), "TC", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 44))
    
    # Badge Pill above title
    draw_rounded_rect(draw, (180, 36, 520, 68), radius=16, fill=ACCENT_ORANGE)
    draw.text((195, 41), f"POSTER LANDSCAPE · {poster_type.upper()}", fill=(255, 255, 255), font=font_badge)
    
    draw_rounded_rect(draw, (535, 36, 820, 68), radius=16, fill=(255, 255, 255, 40))
    draw.text((550, 41), "DESA CANGKRINGAN", fill=(213, 233, 195), font=font_badge)

    draw_rounded_rect(draw, (835, 36, 1220, 68), radius=16, fill=(255, 255, 255, 40))
    draw.text((850, 41), "100% TANGKAPAN LAYAR RIIL", fill=(255, 255, 255), font=font_badge)
    
    # Title Text
    draw.text((180, 80), title, fill=(255, 255, 255), font=font_title)
    draw.text((180, 152), subtitle, fill=(186, 205, 168), font=font_subtitle)
    
    # Right Header Info Card
    draw_rounded_rect(draw, (WIDTH - 640, 40, WIDTH - 80, 180), radius=20, fill=(255, 255, 255, 25), outline=(255, 255, 255, 60), width=2)
    draw.text((WIDTH - 610, 56), "ALUR LENGKAP PENGGUNAAN", fill=(186, 205, 168), font=get_font("segoeuib.ttf", 18))
    draw.text((WIDTH - 610, 85), "5 TAHAPAN UTAMA", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 36))
    draw.text((WIDTH - 610, 134), "✓ Modul Panduan Resmi Tanacakra Cangkringan", fill=(255, 255, 255), font=get_font("segoeui.ttf", 18))

    # ---------------------------------------------------------
    # 2. 5 STEP COLUMNS GRID (Width = 3840px, Height = 1780px)
    # ---------------------------------------------------------
    margin_x = 70
    top_y = header_height + 40
    card_width = 700
    card_gap = 55
    card_height = 1730

    for i, step in enumerate(steps_data):
        cx = margin_x + i * (card_width + card_gap)
        cy = top_y
        
        # Step Outer Card Background
        draw_rounded_rect(draw, (cx, cy, cx + card_width, cy + card_height), radius=24, fill=CARD_BG, outline=BORDER_COLOR, width=3)
        
        # Card Header Pill
        header_pill_h = 76
        draw_rounded_rect(draw, (cx, cy, cx + card_width, cy + header_pill_h), radius=24, fill=HEADER_BG2)
        draw.rectangle([cx, cy + header_pill_h - 20, cx + card_width, cy + header_pill_h], fill=HEADER_BG2)
        
        # Step Number Badge
        draw_rounded_rect(draw, (cx + 20, cy + 14, cx + 180, cy + 62), radius=12, fill=ACCENT_ORANGE)
        draw.text((cx + 34, cy + 22), f"LANGKAH {step['num']}", fill=(255, 255, 255), font=font_step_num)
        
        # Category Tag
        draw.text((cx + 200, cy + 25), step['badge'].upper(), fill=(186, 205, 168), font=font_step_tagline)
        
        # Step Title
        draw.text((cx + 24, cy + header_pill_h + 18), step['title'], fill=TEXT_DARK, font=font_step_title)
        
        # Tagline
        draw.text((cx + 24, cy + header_pill_h + 64), f"• {step['tagline']}", fill=ACCENT_ORANGE, font=font_step_tagline)
        
        # Screenshot Image Browser Frame
        ss_path = step['img_path']
        if os.path.exists(ss_path):
            ss_raw = Image.open(ss_path)
            frame_w = card_width - 48
            frame_h = 470
            b_frame = make_browser_frame(ss_raw, frame_w, frame_h, step.get('url', 'tanacakra.cangkringan.desa.id'))
            img.paste(b_frame, (cx + 24, cy + header_pill_h + 105), b_frame)
        
        # Description text box below screenshot
        desc_y = cy + header_pill_h + 105 + 470 + 24
        
        draw_rounded_rect(draw, (cx + 24, desc_y, cx + card_width - 24, desc_y + 110), radius=14, fill=(245, 240, 235))
        
        # Wrap description text
        words = step['desc'].split()
        lines = []
        cur_line = ""
        for w in words:
            test = cur_line + " " + w if cur_line else w
            if font_body.getlength(test) < (card_width - 70):
                cur_line = test
            else:
                lines.append(cur_line)
                cur_line = w
        if cur_line:
            lines.append(cur_line)
            
        for l_idx, line in enumerate(lines[:3]):
            draw.text((cx + 40, desc_y + 14 + l_idx * 28), line, fill=TEXT_DARK, font=font_body)
            
        # Bullet Points Section
        bullets_y = desc_y + 130
        draw.line([(cx + 24, bullets_y), (cx + card_width - 24, bullets_y)], fill=BORDER_COLOR, width=2)
        
        draw.text((cx + 24, bullets_y + 14), "LANGKAH OPERASIONAL:", fill=HEADER_BG2, font=get_font("segoeuib.ttf", 20))
        
        b_item_y = bullets_y + 50
        for bullet in step['points']:
            # Bullet checkmark circle
            draw.ellipse([cx + 24, b_item_y + 3, cx + 46, b_item_y + 25], fill=HEADER_BG2)
            draw.text((cx + 30, b_item_y + 2), "✓", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 15))
            
            # Bullet text line wrap
            b_words = bullet.split()
            b_lines = []
            b_cur = ""
            for bw in b_words:
                b_test = b_cur + " " + bw if b_cur else bw
                if font_bullet.getlength(b_test) < (card_width - 100):
                    b_cur = b_test
                else:
                    b_lines.append(b_cur)
                    b_cur = bw
            if b_cur:
                b_lines.append(b_cur)
                
            for bl_idx, bline in enumerate(b_lines):
                draw.text((cx + 56, b_item_y + bl_idx * 26), bline, fill=TEXT_DARK, font=font_bullet)
                
            b_item_y += len(b_lines) * 26 + 18

    # ---------------------------------------------------------
    # 3. FOOTER SECTION (Height = 90px)
    # ---------------------------------------------------------
    footer_y = HEIGHT - 90
    draw.rectangle([0, footer_y, WIDTH, HEIGHT], fill=HEADER_BG1)
    draw.rectangle([0, footer_y, WIDTH, footer_y + 4], fill=ACCENT_ORANGE)
    
    draw.text((70, footer_y + 28), "TANACAKRA — SISTEM INFORMASI & PRESISI AGRONOMI DESA CANGKRINGAN, SLEMAN, YOGYAKARTA", fill=(255, 255, 255), font=font_footer)
    
    # Tech stack badges on right
    badges_str = "ENGINE: SCIKIT-LEARN  |  VISUALISASI: PLOTLY  |  AI: NVIDIA LLAMA 3.1  |  AUTH: SUPABASE RBAC"
    draw.text((WIDTH - 70 - font_footer.getlength(badges_str), footer_y + 28), badges_str, fill=(186, 205, 168), font=font_footer)
    
    # Save as high-quality JPG
    img.save(output_jpg_path, "JPEG", quality=95)
    print(f"SUCCESS: Created {output_jpg_path}")


# ---------------------------------------------------------
# DATA DEFINITIONS FOR USER & ADMIN POSTERS
# ---------------------------------------------------------
SS_USER_DIR = r"d:\TANACAKRA\frontend\src\assets\ss\user"
SS_ADMIN_DIR = r"d:\TANACAKRA\frontend\src\assets\ss\admin"

user_steps = [
    {
        "num": "01",
        "badge": "Akses Portal",
        "title": "Portal & Masuk Sesi",
        "tagline": "Masuk Sesi Akun Petani",
        "img_path": os.path.join(SS_USER_DIR, "landing.png"),
        "url": "tanacakra.cangkringan.desa.id/login",
        "desc": "Petani mengakses portal utama Tanacakra untuk memulai sesi pengawasan dan analisis pertanian Cangkringan.",
        "points": [
            "Buka web Tanacakra Cangkringan via browser.",
            "Klik tombol 'Masuk Portal' atau 'Mulai Sekarang'.",
            "Input nama pengguna & kata sandi terdaftar.",
            "Sistem memverifikasi hak akses Supabase Auth."
        ]
    },
    {
        "num": "02",
        "badge": "Monitoring IoT",
        "title": "Dasbor Ringkasan Lahan",
        "tagline": "Pantau Kesehatan & Cuaca",
        "img_path": os.path.join(SS_USER_DIR, "dashboard.png"),
        "url": "tanacakra.cangkringan.desa.id/petani",
        "desc": "Halaman utama Petani menyajikan indikator cuaca BMKG, nilai pH tanah, kelembapan, dan Peta Spasial petak.",
        "points": [
            "Pantau suhu, kelembapan & curah hujan harian.",
            "Cek indikator kesuburan tanah (Subur / Atensi).",
            "Lihat sebaran lokasi petak pada Peta Spasial.",
            "Dapatkan rekomendasi aksi pupuk harian."
        ]
    },
    {
        "num": "03",
        "badge": "AI Recommendation",
        "title": "Catat & Analisis AI",
        "tagline": "Rekomendasi Komoditas Tanam",
        "img_path": os.path.join(SS_USER_DIR, "catat lahan.png"),
        "url": "tanacakra.cangkringan.desa.id/input-lahan",
        "desc": "Formulir input sampel tanah (pH, N, P, K, Kelembapan) untuk dihitung oleh Machine Learning Scikit-Learn.",
        "points": [
            "Pilih petak lahan & koordinat lokasi.",
            "Isi nilai pH, Nitrogen, Fosfor, & Kalium.",
            "Klik 'Jalankan Rekomendasi AI Tanacakra'.",
            "Terima saran komoditas & dosis pemupukan."
        ]
    },
    {
        "num": "04",
        "badge": "Plotly Analytics",
        "title": "Prediksi Harga Pasar",
        "tagline": "Grafik Proyeksi Komoditas",
        "img_path": os.path.join(SS_USER_DIR, "prediksi harga.png"),
        "url": "tanacakra.cangkringan.desa.id/prediksi-pasar",
        "desc": "Panel visualisasi grafik Plotly interaktif untuk menganalisis tren harga pasar cabai, bawang, dan tomat 2022–2026.",
        "points": [
            "Pilih jenis komoditas pertanian unggulan.",
            "Amati grafik tren Plotly 2022–2026.",
            "Bandingkan estimasi margin keuntungan panen.",
            "Atur jadwal tanam sesuai proyeksi pasar."
        ]
    },
    {
        "num": "05",
        "badge": "NVIDIA AI Warning",
        "title": "Warta Tani & AI Warning",
        "tagline": "Peringatan Hama & Edukasi",
        "img_path": os.path.join(SS_USER_DIR, "wara tani.png"),
        "url": "tanacakra.cangkringan.desa.id/kabar-tani",
        "desc": "Pusat informasi berita pertanian & siaran peringatan hama otomatis menggunakan NVIDIA AI berbasis kondisi lapangan.",
        "points": [
            "Baca kabar peringatan cuaca & serangan hama.",
            "Pelajari artikel edukasi budidaya tanaman.",
            "Pantau update harga pasar komoditas Sleman.",
            "Terapkan rekomendasi tindakan pencegahan."
        ]
    }
]

admin_steps = [
    {
        "num": "01",
        "badge": "Admin Console",
        "title": "Konsol Monitoring Admin",
        "tagline": "Statistik Sistem & Audit Log",
        "img_path": os.path.join(SS_ADMIN_DIR, "dashboard admin.png"),
        "url": "tanacakra.cangkringan.desa.id/admin",
        "desc": "Panel kontrol utama Admin untuk mengawasi total petak lahan, rasio kesehatan tanah, audit log, & aktivitas penyuluh.",
        "points": [
            "Monitor total petak terdaftar & rasio tanah.",
            "Pantau audit log eksekusi sistem real-time.",
            "Tinjau statistik aktivitas penyuluh lapangan.",
            "Pantau integrasi keamanan Supabase RBAC."
        ]
    },
    {
        "num": "02",
        "badge": "Spasial Control",
        "title": "Kelola Data Lahan Poktan",
        "tagline": "Verifikasi Spasial & Evaluasi",
        "img_path": os.path.join(SS_ADMIN_DIR, "manajemen lahan.png"),
        "url": "tanacakra.cangkringan.desa.id/admin/lahan",
        "desc": "Modul pengawasan terpusat untuk memantau data tanah, memverifikasi masukan petani, & evaluasi teknis.",
        "points": [
            "Filter petak lahan per Desa di Cangkringan.",
            "Inspeksi detail parameter pH & hara tanah.",
            "Tinjau riwayat observasi & evaluasi teknis.",
            "Kelola status verifikasi kelayakan petak."
        ]
    },
    {
        "num": "03",
        "badge": "Data Integration",
        "title": "Master Data & Excel",
        "tagline": "Impor/Ekspor File Spreadsheet",
        "img_path": os.path.join(SS_ADMIN_DIR, "master excel.png"),
        "url": "tanacakra.cangkringan.desa.id/admin/master-data",
        "desc": "Fasilitas manajemen data masif untuk mengunggah dataset komoditas & ekspor rekapitulasi Excel (.xlsx).",
        "points": [
            "Unduh template spreadsheet resmi Tanacakra.",
            "Unggah dataset komoditas masif via Excel.",
            "Ekspor laporan rekapitulasi kelompok tani.",
            "Sinkronkan database PostgreSQL Supabase."
        ]
    },
    {
        "num": "04",
        "badge": "NVIDIA AI Engine",
        "title": "Warta & Generator AI",
        "tagline": "Broadcast Berita & Warning Hama",
        "img_path": os.path.join(SS_ADMIN_DIR, "wara tani admin.png"),
        "url": "tanacakra.cangkringan.desa.id/admin/kabar-tani",
        "desc": "Konsol penerbitan warta tani dengan AI Article Generator (NVIDIA Llama 3.1) untuk draf siaran otomatis.",
        "points": [
            "Buat warta edukasi & siaran peringatan dini.",
            "Gunakan AI Generator untuk draf berita otomatis.",
            "Kelola kategori berita (Cuaca, Hama, Pasar).",
            "Publikasikan pengumuman ke dasbor Petani."
        ]
    },
    {
        "num": "05",
        "badge": "RBAC Security",
        "title": "Pengaturan Sistem & User",
        "tagline": "Hak Akses & Ambang Sensor",
        "img_path": os.path.join(SS_ADMIN_DIR, "setting admin.png"),
        "url": "tanacakra.cangkringan.desa.id/admin/pengaturan",
        "desc": "Konfigurasi hak akses pengguna (Admin, Kelompok Tani, Penyuluh, Petani), batasan sensor, & audit trail.",
        "points": [
            "Atur peran pengguna (Role-Based Access Control).",
            "Kalibrasi batas ambang ideal pH & kelembapan.",
            "Kelola data organisasi & akun penyuluh.",
            "Awasi sesi keamanan & log aktivitas akses."
        ]
    }
]

if __name__ == "__main__":
    # Generate User Poster
    out_user = r"d:\TANACAKRA\poster_infografis_user.jpg"
    out_user_asset = r"d:\TANACAKRA\frontend\src\assets\poster_infografis_user.jpg"
    create_poster(
        poster_type="PETANI / KELOMPOK TANI",
        title="PANDUAN PENGGUNAAN PLATFORM TANACAKRA",
        subtitle="Sistem Informasi & Presisi Agronomi Lereng Merapi untuk Kelompok Tani Desa Cangkringan",
        steps_data=user_steps,
        output_jpg_path=out_user
    )
    # Also save copy to assets folder
    import shutil
    shutil.copyfile(out_user, out_user_asset)

    # Generate Admin Poster
    out_admin = r"d:\TANACAKRA\poster_infografis_admin.jpg"
    out_admin_asset = r"d:\TANACAKRA\frontend\src\assets\poster_infografis_admin.jpg"
    create_poster(
        poster_type="ADMIN & PENGELOLA POKTAN",
        title="PANDUAN CONSOLE ADMIN & POKTAN TANACAKRA",
        subtitle="Konsol Pengawasan Spasial, Master Data Excel, Broadcast AI & Hak Akses Pengguna (RBAC)",
        steps_data=admin_steps,
        output_jpg_path=out_admin
    )
    # Also save copy to assets folder
    shutil.copyfile(out_admin, out_admin_asset)

    print("\nALL POSTERS CREATED SUCCESSFULLY!")
