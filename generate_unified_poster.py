import os
import math
import shutil
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ---------------------------------------------------------
# CANVAS SPECIFICATIONS (3840 x 2160 - 4K 16:9 LANDSCAPE)
# ---------------------------------------------------------
WIDTH = 3840
HEIGHT = 2160

FONT_DIR = "C:/Windows/Fonts/"

def get_font(name, size):
    try:
        return ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    except Exception:
        return ImageFont.load_default()

# Fonts hierarchy
font_hero_title = get_font("segoeuib.ttf", 54)
font_hero_sub = get_font("segoeui.ttf", 24)
font_pill = get_font("segoeuib.ttf", 20)
font_section = get_font("segoeuib.ttf", 22)

font_circle_num = get_font("segoeuib.ttf", 36)
font_card_title = get_font("segoeuib.ttf", 24)
font_card_tagline = get_font("segoeuib.ttf", 17)
font_card_desc = get_font("segoeui.ttf", 16)
font_card_bullet = get_font("segoeuib.ttf", 15)

font_footer = get_font("segoeuib.ttf", 20)

# COLOR PALETTE
BG_COLOR = (245, 241, 235)           # Soft warm parchment canvas
HEADER_BG = (22, 36, 20)             # Deep Forest Moss (#162414)
TERRACOTTA = (175, 68, 40)           # #AF4428 Warm Terracotta
EMERALD = (36, 75, 42)               # #244B2A Deep Emerald
YELLOW_CIRCLE = (247, 196, 48)       # #F7C430 Bright Yellow Step Circle
GOLD_TEXT = (235, 185, 75)           # #EBB94B Gold Accent
CARD_BG = (255, 255, 255)            # Crisp White
CARD_BORDER = (218, 208, 196)        # Neutral Sand Border
TEXT_DARK = (30, 24, 18)             # #1E1812 Dark Charcoal Text
TEXT_MUTED = (110, 100, 92)          # Muted Earth Text
BROWSER_HEADER_BG = (42, 50, 62)     # Dark Slate Gray for Browser Bar

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    x1, y1, x2, y2 = bbox
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=width)

def draw_pill(draw, x, y, text, font, bg_color, text_color, padding_x=18, padding_y=8):
    text_w = font.getlength(text)
    h = font.size + padding_y * 2
    w = text_w + padding_x * 2
    draw_rounded_rect(draw, (x, y, x + w, y + h), radius=h // 2, fill=bg_color)
    draw.text((x + padding_x, y + padding_y - 2), text, fill=text_color, font=font)
    return w

def draw_dotted_line(draw, pt1, pt2, color=(175, 68, 40), dot_radius=5, spacing=15):
    x1, y1 = pt1
    x2, y2 = pt2
    dist = math.hypot(x2 - x1, y2 - y1)
    if dist == 0:
        return
    num_dots = int(dist / spacing)
    for i in range(num_dots + 1):
        t = i / max(num_dots, 1)
        cx = x1 + t * (x2 - x1)
        cy = y1 + t * (y2 - y1)
        draw.ellipse([cx - dot_radius, cy - dot_radius, cx + dot_radius, cy + dot_radius], fill=color)

def make_browser_mockup(ss_img, width, height, title_url):
    """Creates a high-precision browser window frame with crop-to-fill image fitting."""
    frame = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(frame)
    
    # Outer Container Box
    draw_rounded_rect(draw, (0, 0, width - 1, height - 1), radius=12, fill=(255, 255, 255, 255), outline=(200, 190, 180, 255), width=2)
    
    # Header Bar
    header_h = 32
    draw.rectangle([0, 0, width - 1, header_h], fill=BROWSER_HEADER_BG)
    
    # Dots (Red, Yellow, Green)
    draw.ellipse([12, 11, 20, 19], fill=(255, 95, 86))
    draw.ellipse([26, 11, 34, 19], fill=(255, 189, 46))
    draw.ellipse([40, 11, 48, 19], fill=(39, 201, 63))
    
    # URL address bar
    url_w = width - 130
    draw_rounded_rect(draw, (65, 5, 65 + url_w, 27), radius=6, fill=(58, 68, 82))
    font_url = get_font("segoeui.ttf", 12)
    draw.text((75, 7), f"🔒 https://{title_url}", fill=(210, 220, 235), font=font_url)
    
    # Content Area Crop & Fit
    content_w = width - 4
    content_h = height - header_h - 4
    
    # Crop screenshot to cover content box (center crop)
    ss_w, ss_h = ss_img.size
    target_aspect = content_w / content_h
    ss_aspect = ss_w / ss_h
    
    if ss_aspect > target_aspect:
        # Crop sides
        crop_w = int(ss_h * target_aspect)
        crop_x = (ss_w - crop_w) // 2
        ss_cropped = ss_img.crop((crop_x, 0, crop_x + crop_w, ss_h))
    else:
        # Crop top/bottom
        crop_h = int(ss_w / target_aspect)
        crop_y = 0  # start from top to keep navigation
        ss_cropped = ss_img.crop((0, crop_y, ss_w, crop_y + crop_h))
        
    ss_resized = ss_cropped.resize((content_w, content_h), Image.Resampling.LANCZOS)
    frame.paste(ss_resized, (2, header_h + 2))
    
    # Add subtle drop shadow behind frame
    canvas_w = width + 20
    canvas_h = height + 20
    shadow = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    draw_rounded_rect(s_draw, (6, 6, canvas_w - 6, canvas_h - 6), radius=14, fill=(0, 0, 0, 35))
    shadow = shadow.filter(ImageFilter.GaussianBlur(6))
    
    output = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    output.paste(shadow, (0, 0), shadow)
    output.paste(frame, (4, 4), frame)
    return output

def build_infographic_poster():
    print("Generating High-Precision Aesthetic Infographic Poster...")
    
    poster = Image.new("RGBA", (WIDTH, HEIGHT), BG_COLOR + (255,))
    draw = ImageDraw.Draw(poster)
    
    # Add subtle background pattern (decorative grid lines)
    for x in range(0, WIDTH, 120):
        draw.line([(x, 0), (x, HEIGHT)], fill=(235, 229, 222, 120), width=1)
    for y in range(0, HEIGHT, 120):
        draw.line([(0, y), (WIDTH, y)], fill=(235, 229, 222, 120), width=1)

    # ---------------------------------------------------------
    # 1. HEADER SECTION (Height = 220px)
    # ---------------------------------------------------------
    header_h = 220
    draw.rectangle([0, 0, WIDTH, header_h], fill=HEADER_BG)
    draw.rectangle([0, header_h - 6, WIDTH, header_h], fill=TERRACOTTA)
    
    # Logo Box
    draw_rounded_rect(draw, (70, 35, 160, 125), radius=16, fill=TERRACOTTA)
    draw.text((92, 48), "TC", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 44))
    
    # Top Badges Row
    px = 180
    px += draw_pill(draw, px, 32, "TATA CARA PENGGUNAAN APLIKASI", font_pill, TERRACOTTA, (255, 255, 255)) + 12
    px += draw_pill(draw, px, 32, "PLATFORM TANACAKRA CANGKRINGAN", font_pill, EMERALD, (225, 245, 215)) + 12
    px += draw_pill(draw, px, 32, "MODUL PETANI & ADMIN CONSOLE", font_pill, YELLOW_CIRCLE, TEXT_DARK) + 12
    
    # Main Header Title & Subtitle
    draw.text((180, 78), "PANDUAN LENGKAP PLATFORM TANACAKRA", fill=(255, 255, 255), font=font_hero_title)
    draw.text((180, 148), "Alur Terpadu Penggunaan Modul Petani (Langkah 1–5) dan Modul Admin Console (Langkah 6–10)", fill=(185, 205, 170), font=font_hero_sub)

    # Right Header Glassmorphic Info Card
    box_r_x1 = WIDTH - 650
    box_r_y1 = 30
    box_r_x2 = WIDTH - 70
    box_r_y2 = 185
    draw_rounded_rect(draw, (box_r_x1, box_r_y1, box_r_x2, box_r_y2), radius=16, fill=(255, 255, 255, 20), outline=(255, 255, 255, 45), width=2)
    
    draw.text((box_r_x1 + 30, box_r_y1 + 18), "ALUR LENGKAP PENGGUNAAN", fill=GOLD_TEXT, font=get_font("segoeuib.ttf", 18))
    draw.text((box_r_x1 + 30, box_r_y1 + 45), "10 TAHAPAN UTAMA", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 36))
    draw.text((box_r_x1 + 30, box_r_y1 + 102), "📍 Desa Cangkringan, Sleman, Yogyakarta", fill=(225, 245, 215), font=get_font("segoeui.ttf", 18))

    # ---------------------------------------------------------
    # 2. SECTION BANNER STRIPS FOR ROW 1 & ROW 2
    # ---------------------------------------------------------
    # Row 1 Section Banner (Petani)
    r1_y = 245
    draw_rounded_rect(draw, (70, r1_y, 500, r1_y + 40), radius=10, fill=EMERALD)
    draw.text((90, r1_y + 8), "🌱 BAGIAN 1: MODUL UTAMA PETANI (1–5)", fill=(255, 255, 255), font=font_section)

    # Row 2 Section Banner (Admin)
    r2_y = 1150
    draw_rounded_rect(draw, (70, r2_y, 550, r2_y + 40), radius=10, fill=TERRACOTTA)
    draw.text((90, r2_y + 8), "⚙️ BAGIAN 2: MODUL ADMIN CONSOLE (6–10)", fill=(255, 255, 255), font=font_section)

    # ---------------------------------------------------------
    # 3. STEPS DATA DEFINITION
    # ---------------------------------------------------------
    ss_user = r"d:\TANACAKRA\frontend\src\assets\ss\user"
    ss_admin = r"d:\TANACAKRA\frontend\src\assets\ss\admin"

    steps = [
        # PETANI (1-5)
        {
            "num": "1",
            "role": "PETANI",
            "title": "Portal & Masuk Sesi",
            "tagline": "Akses Web & Auth Petani",
            "img": os.path.join(ss_user, "landing.png"),
            "url": "tanacakra.cangkringan.desa.id/login",
            "desc": "Petani mengakses portal Tanacakra & masuk akun via Supabase Auth.",
            "points": ["Buka portal Tanacakra Cangkringan.", "Klik 'Masuk Portal' atau 'Mulai'.", "Isi akun Petani terdaftar."]
        },
        {
            "num": "2",
            "role": "PETANI",
            "title": "Dasbor & Sensor IoT",
            "tagline": "Cuaca & Kesehatan Tanah",
            "img": os.path.join(ss_user, "dashboard.png"),
            "url": "tanacakra.cangkringan.desa.id/petani",
            "desc": "Pantau suhu, kelembapan, pH tanah, & sebaran petak pada Peta Spasial.",
            "points": ["Cek indikator cuaca BMKG.", "Pantau kesuburan & pH tanah.", "Lihat petak di Peta Spasial."]
        },
        {
            "num": "3",
            "role": "PETANI",
            "title": "Catat Lahan & AI",
            "tagline": "Rekomendasi Scikit-Learn",
            "img": os.path.join(ss_user, "catat lahan.png"),
            "url": "tanacakra.cangkringan.desa.id/input-lahan",
            "desc": "Formulir input parameter tanah (pH, N, P, K) untuk rekomendasi AI.",
            "points": ["Isi nilai pH, N, P, K tanah.", "Jalankan Rekomendasi AI.", "Terima dosis pemupukan presisi."]
        },
        {
            "num": "4",
            "role": "PETANI",
            "title": "Prediksi Harga Pasar",
            "tagline": "Grafik Analitis Plotly",
            "img": os.path.join(ss_user, "prediksi harga.png"),
            "url": "tanacakra.cangkringan.desa.id/prediksi-pasar",
            "desc": "Visualisasi grafik Plotly interaktif tren harga komoditas 2022–2026.",
            "points": ["Pilih komoditas pertanian.", "Amati grafik proyeksi Plotly.", "Atur jadwal tanam ideal."]
        },
        {
            "num": "5",
            "role": "PETANI",
            "title": "Warta & AI Warning",
            "tagline": "Peringatan Hama & Edukasi",
            "img": os.path.join(ss_user, "wara tani.png"),
            "url": "tanacakra.cangkringan.desa.id/kabar-tani",
            "desc": "Pusat informasi warta tani & peringatan hama dari NVIDIA AI.",
            "points": ["Baca berita peringatan cuaca.", "Pantau harga pasar Sleman.", "Terapkan rekomendasi solusi AI."]
        },
        # ADMIN (6-10)
        {
            "num": "6",
            "role": "ADMIN",
            "title": "Konsol Admin & Log",
            "tagline": "Statistik & Audit Log",
            "img": os.path.join(ss_admin, "dashboard admin.png"),
            "url": "tanacakra.cangkringan.desa.id/admin",
            "desc": "Pantauan statistik total petak, rasio kesuburan, & audit log eksekusi.",
            "points": ["Monitor total petak terdaftar.", "Pantau audit log real-time.", "Tinjau aktivitas penyuluh."]
        },
        {
            "num": "7",
            "role": "ADMIN",
            "title": "Manajemen Data Lahan",
            "tagline": "Verifikasi Spasial Poktan",
            "img": os.path.join(ss_admin, "manajemen lahan.png"),
            "url": "tanacakra.cangkringan.desa.id/admin/lahan",
            "desc": "Kelola data petak seluruh petani, filter desa, & inspeksi hara.",
            "points": ["Filter petak per Desa/Dusun.", "Inspeksi parameter pH & hara.", "Verifikasi kelayakan petak."]
        },
        {
            "num": "8",
            "role": "ADMIN",
            "title": "Master Data & Excel",
            "tagline": "Impor/Ekspor Spreadsheet",
            "img": os.path.join(ss_admin, "master excel.png"),
            "url": "tanacakra.cangkringan.desa.id/admin/master-data",
            "desc": "Kelola dataset komoditas masif & ekspor rekapitulasi Excel (.xlsx).",
            "points": ["Unduh template spreadsheet.", "Unggah dataset via Excel.", "Ekspor laporan kelompok tani."]
        },
        {
            "num": "9",
            "role": "ADMIN",
            "title": "Warta & Generator AI",
            "tagline": "NVIDIA Llama 3.1 Broadcast",
            "img": os.path.join(ss_admin, "wara tani admin.png"),
            "url": "tanacakra.cangkringan.desa.id/admin/kabar-tani",
            "desc": "Konsol siaran warta tani dengan generator berita NVIDIA AI Llama 3.1.",
            "points": ["Buat siaran peringatan dini.", "Generate berita via NVIDIA AI.", "Publikasikan ke dasbor Petani."]
        },
        {
            "num": "10",
            "role": "ADMIN",
            "title": "Setting & Security RBAC",
            "tagline": "Hak Akses & Ambang Sensor",
            "img": os.path.join(ss_admin, "setting admin.png"),
            "url": "tanacakra.cangkringan.desa.id/admin/pengaturan",
            "desc": "Konfigurasi peranan user (Admin, Penyuluh, Petani) & ambang sensor.",
            "points": ["Atur hak akses Supabase RBAC.", "Kalibrasi ambang pH & hara.", "Awasi sesi keamanan pengguna."]
        }
    ]

    # ---------------------------------------------------------
    # 4. DRAW CONNECTING DOTTED FLOW PATH (1 -> 10)
    # ---------------------------------------------------------
    margin_x = 70
    col_w = 700
    gap_x = 55
    
    card_r1_y = 300
    card_r2_y = 1205
    
    circle_r1_center_y = card_r1_y + 40
    circle_r2_center_y = card_r2_y + 40

    # Draw horizontal dots for Row 1 (Step 1 -> 2 -> 3 -> 4 -> 5)
    for i in range(4):
        c1 = margin_x + i * (col_w + gap_x) + 40
        c2 = margin_x + (i + 1) * (col_w + gap_x) + 40
        draw_dotted_line(draw, (c1 + 35, circle_r1_center_y), (c2 - 35, circle_r1_center_y), color=TERRACOTTA, dot_radius=5, spacing=14)

    # Snake Curve dots connecting Step 5 (top right) to Step 6 (bottom left)
    c5_x = margin_x + 4 * (col_w + gap_x) + 40
    c6_x = margin_x + 40
    
    p1 = (c5_x + 35, circle_r1_center_y)
    p2 = (c5_x + 120, circle_r1_center_y)
    p3 = (c5_x + 120, card_r1_y + 830)
    p4 = (c6_x - 100, card_r1_y + 830)
    p5 = (c6_x - 100, circle_r2_center_y)
    p6 = (c6_x - 35, circle_r2_center_y)
    
    draw_dotted_line(draw, p1, p2, color=TERRACOTTA, dot_radius=5, spacing=14)
    draw_dotted_line(draw, p2, p3, color=TERRACOTTA, dot_radius=5, spacing=14)
    draw_dotted_line(draw, p3, p4, color=TERRACOTTA, dot_radius=5, spacing=14)
    draw_dotted_line(draw, p4, p5, color=TERRACOTTA, dot_radius=5, spacing=14)
    draw_dotted_line(draw, p5, p6, color=TERRACOTTA, dot_radius=5, spacing=14)

    # Draw horizontal dots for Row 2 (Step 6 -> 7 -> 8 -> 9 -> 10)
    for i in range(4):
        c1 = margin_x + i * (col_w + gap_x) + 40
        c2 = margin_x + (i + 1) * (col_w + gap_x) + 40
        draw_dotted_line(draw, (c1 + 35, circle_r2_center_y), (c2 - 35, circle_r2_center_y), color=TERRACOTTA, dot_radius=5, spacing=14)

    # ---------------------------------------------------------
    # 5. RENDER THE 10 STEP CARDS WITH PERFECT PADDING & ALIGNMENT
    # ---------------------------------------------------------
    card_h = 820

    for i, step in enumerate(steps):
        is_row1 = (i < 5)
        col_idx = i if is_row1 else (i - 5)
        
        cx = margin_x + col_idx * (col_w + gap_x)
        cy = card_r1_y if is_row1 else card_r2_y
        
        role_theme = EMERALD if step['role'] == "PETANI" else TERRACOTTA
        
        # Outer Card Body
        draw_rounded_rect(draw, (cx, cy, cx + col_w, cy + card_h), radius=20, fill=CARD_BG, outline=CARD_BORDER, width=2)
        
        # Card Header Pill Accent Bar
        draw_rounded_rect(draw, (cx + 90, cy + 18, cx + col_w - 20, cy + 62), radius=10, fill=(245, 240, 235))
        
        # Role Pill Badge
        draw_rounded_rect(draw, (cx + 95, cy + 24, cx + 220, cy + 56), radius=8, fill=role_theme)
        draw.text((cx + 106, cy + 30), f"{step['role']} · STEP {step['num']}", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 13))

        # Step Title Text
        draw.text((cx + 230, cy + 24), step['title'], fill=TEXT_DARK, font=font_card_title)
        draw.text((cx + 230, cy + 49), f"• {step['tagline']}", fill=role_theme, font=font_card_tagline)

        # Step Yellow Circle Number Badge (Placed prominently at top-left)
        circle_cx = cx + 40
        circle_cy = cy + 40
        cr = 32
        
        # Shadow + Yellow Circle
        draw.ellipse([circle_cx - cr + 2, circle_cy - cr + 2, circle_cx + cr + 2, circle_cy + cr + 2], fill=(210, 160, 30))
        draw.ellipse([circle_cx - cr, circle_cy - cr, circle_cx + cr, circle_cy + cr], fill=YELLOW_CIRCLE, outline=(235, 185, 40), width=3)
        
        # Step Number String Centering
        n_str = step['num']
        font_num = get_font("segoeuib.ttf", 32 if len(n_str) == 1 else 24)
        n_w = font_num.getlength(n_str)
        draw.text((circle_cx - n_w / 2, circle_cy - 18 if len(n_str) == 1 else circle_cy - 14), n_str, fill=TEXT_DARK, font=font_num)

        # Device Mockup (Browser screenshot container)
        if os.path.exists(step['img']):
            ss_raw = Image.open(step['img'])
            mock_w = col_w - 40
            mock_h = 440
            mock_img = make_browser_mockup(ss_raw, mock_w, mock_h, step['url'])
            poster.paste(mock_img, (cx + 10, cy + 75), mock_img)

        # Card Content Box below screenshot
        desc_top_y = cy + 535
        
        # Description Box
        draw_rounded_rect(draw, (cx + 20, desc_top_y, cx + col_w - 20, desc_top_y + 70), radius=12, fill=(246, 242, 237))
        
        # Wrap description text nicely
        words = step['desc'].split()
        lines = []
        cur_l = ""
        for w in words:
            t = cur_l + " " + w if cur_l else w
            if font_card_desc.getlength(t) < (col_w - 65):
                cur_l = t
            else:
                lines.append(cur_l)
                cur_l = w
        if cur_l:
            lines.append(cur_l)
            
        for l_idx, line_str in enumerate(lines[:2]):
            draw.text((cx + 32, desc_top_y + 12 + l_idx * 24), line_str, fill=TEXT_DARK, font=font_card_desc)

        # Bullet List Checklist
        bullet_y = desc_top_y + 82
        for pt_str in step['points']:
            draw.ellipse([cx + 24, bullet_y + 3, cx + 40, bullet_y + 19], fill=role_theme)
            draw.text((cx + 28, bullet_y + 2), "✓", fill=(255, 255, 255), font=get_font("segoeuib.ttf", 11))
            draw.text((cx + 48, bullet_y + 1), pt_str, fill=TEXT_DARK, font=font_card_bullet)
            bullet_y += 28

    # ---------------------------------------------------------
    # 6. FOOTER BRANDING BAR
    # ---------------------------------------------------------
    footer_y = HEIGHT - 85
    draw.rectangle([0, footer_y, WIDTH, HEIGHT], fill=HEADER_BG)
    draw.rectangle([0, footer_y, WIDTH, footer_y + 5], fill=TERRACOTTA)
    
    draw.text((70, footer_y + 26), "TANACAKRA — SISTEM AGRONOMI PRESISI & HUB INFORMASI KELOMPOK TANI CANGKRINGAN", fill=(255, 255, 255), font=font_footer)
    
    social_text = "🌐 tanacakra.cangkringan.desa.id   |   📍 Sleman, Yogyakarta   |   ⚡ Scikit-Learn ML & NVIDIA AI"
    draw.text((WIDTH - 70 - font_footer.getlength(social_text), footer_y + 26), social_text, fill=(185, 205, 170), font=font_footer)

    # Save output JPG
    poster_rgb = poster.convert("RGB")
    
    out_root = r"d:\TANACAKRA\poster_infografis_tanacakra.jpg"
    out_asset = r"d:\TANACAKRA\frontend\src\assets\poster_infografis_tanacakra.jpg"
    
    poster_rgb.save(out_root, "JPEG", quality=96)
    shutil.copyfile(out_root, out_asset)
    
    print(f"SUCCESSFULLY GENERATED ULTRA-HIGH-PRECISION POSTER: {out_root}")

if __name__ == "__main__":
    build_infographic_poster()
