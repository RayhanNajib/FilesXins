#!/usr/bin/env python
"""Build one A4 PDF: biodata page + portfolio links (with QR) + KRS + KTM + KTP."""
import os
import io
import segno
from PIL import Image
import pymupdf

D = r"C:\Users\WA\AppData\Local\hermes\attachments"
P = r"C:\CODE\filesxins-portfolio"
OUT = os.environ.get("BIODATA_OUT") or r"C:\CODE\filesxins-portfolio\_out\Biodata_Muhammad_Rayhan_Najib_240533600012.pdf"
os.makedirs(os.path.dirname(OUT), exist_ok=True)
TMP = os.path.join(os.environ["LOCALAPPDATA"], "Temp", "biodata")
os.makedirs(TMP, exist_ok=True)

A4 = pymupdf.paper_rect("a4")
W, H = A4.width, A4.height
doc = pymupdf.open()

INK = (0.06, 0.09, 0.16)
MUTED = (0.38, 0.42, 0.49)
PRIMARY = (0.05, 0.55, 0.72)
LINE = (0.82, 0.85, 0.88)

F = "helv"      # Helvetica
FB = "hebo"     # Helvetica-Bold
FM = "cour"     # Courier (mono accents)


def txt(page, x, y, s, size=9, font=F, color=INK):
    page.insert_text((x, y), s, fontname=font, fontsize=size, color=color, render_mode=0)


def line(page, x0, y0, x1, y1, color=LINE, w=0.6):
    page.draw_line(pymupdf.Point(x0, y0), pymupdf.Point(x1, y1), color=color, width=w)


def fit_image(src, box_w, box_h):
    """Return PNG bytes of src scaled to fit inside the box, preserving ratio."""
    im = Image.open(src)
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (255, 255, 255))
        im = im.convert("RGBA")
        bg.paste(im, mask=im.split()[-1])
        im = bg
    else:
        im = im.convert("RGB")
    r = min(box_w / im.width, box_h / im.height)
    im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "PNG")
    return buf.getvalue(), im.width, im.height


def page_number(page, n, total=4):
    label = f"{n} / {total}"
    wpx = pymupdf.get_text_length(label, fontname=FM, fontsize=7.5)
    txt(page, W - M - wpx, H - M - 10, label, 7.5, FM, MUTED)


# =====================================================================
# PAGE 1: BIODATA
# =====================================================================
pg = doc.new_page(width=W, height=H)
M = 42                      # margin
CW = W - 2 * M              # content width
y = M + 4

# --- header -----------------------------------------------------------
logo = os.path.join(P, "assets", "logo", "logo-mark.png")
if os.path.exists(logo):
    png, iw, ih = fit_image(logo, 30, 30)
    pg.insert_image(pymupdf.Rect(M, y - 2, M + iw, y - 2 + ih), stream=png)

txt(pg, M + 38, y + 10, "FilesXins", 15, FB, INK)
txt(pg, M + 38, y + 23, "Portofolio & Biodata Mahasiswa", 8, F, MUTED)

# photo, top right
photo = os.path.join(P, "assets", "profile", "portrait.webp")
PH_W = 78
png, iw, ih = fit_image(photo, PH_W, 98)
px, py = W - M - iw, y - 2
pg.insert_image(pymupdf.Rect(px, py, px + iw, py + ih), stream=png)
pg.draw_rect(pymupdf.Rect(px, py, px + iw, py + ih), color=(0.75, 0.80, 0.84), width=0.6)

y += 40
line(pg, M, y, W - M, y, PRIMARY, 1.2)
y += 22

# --- identity block ---------------------------------------------------
txt(pg, M, y, "MUHAMMAD RAYHAN NAJIB", 20, FB, INK)
y += 16
txt(pg, M, y, "S1 Pendidikan Teknik Informatika  |  Universitas Negeri Malang", 9.5, F, MUTED)
y += 18

# two-column detail table
rows_left = [
    ("NIM", "240533600012"),
    ("Kelas / Semester", "B  /  Gasal 2026-2027"),
    ("Program Studi", "S1 Pendidikan Teknik Informatika"),
    ("Fakultas", "Fakultas Teknik (FT)"),
]
rows_right = [
    ("Domisili", "Kediri, Jawa Timur, Indonesia"),
    ("Zona Waktu", "UTC+7 (WIB)"),
    ("Email", "muhammad.rayhan.2405336@students.um.ac.id"),
    ("GitHub", "github.com/RayhanNajib"),
]
col_w = CW / 2
ROW_H = 16
for i, ((k1, v1), (k2, v2)) in enumerate(zip(rows_left, rows_right)):
    yy = y + i * ROW_H
    txt(pg, M, yy, k1, 7.5, FM, MUTED)
    txt(pg, M + 74, yy, v1, 8.5, F, INK)
    txt(pg, M + col_w, yy, k2, 7.5, FM, MUTED)
    # value slot ends before the photo column (photo starts at x=475)
    slot_right = 470
    avail = slot_right - (M + col_w + 62)
    size = 8.5
    while pymupdf.get_text_length(v2, fontname=F, fontsize=size) > avail and size > 6.5:
        size -= 0.25
    txt(pg, M + col_w + 62, yy, v2, size, F, INK)
y += 4 * ROW_H + 10

# --- portfolio links --------------------------------------------------
line(pg, M, y, W - M, y, LINE, 0.8)
y += 16
txt(pg, M, y, "PORTOFOLIO ONLINE", 8.5, FB, PRIMARY)
y += 4
txt(pg, M, y + 10, "Karya lengkap, proyek, sertifikat, dan demo aplikasi tersedia pada tautan berikut.", 8.5, F, MUTED)
y += 24

links = [
    ("Portofolio utama (web)", "https://filesxins.vercel.app"),
    ("Demo UM-MART (e-commerce kampus)", "https://ummart-demo.vercel.app"),
    ("Demo UM-MART (versi statis)", "https://filesxins.vercel.app/site/ummart/"),
    ("Demo Klinik Pratama UM", "https://filesxins.vercel.app/site/klinikum/"),
    ("Portal Desa Nanggungan Digdaya", "https://nanggungan-digdaya.page.gd/"),
    ("Game TEXUM (RPG Maker MZ)", "https://filesxinss.itch.io/texum"),
    ("GitHub", "https://github.com/RayhanNajib"),
]

# link list in the left column, QR codes stacked in the right column (never overlapping)
QR_BOX = 62
QR_COL = QR_BOX + 18                     # reserved column width on the right
list_w = CW - QR_COL
for i, (label, url) in enumerate(links):
    yy = y + i * 24
    txt(pg, M, yy, label, 8, F, INK)
    txt(pg, M, yy + 13, url, 7, FM, PRIMARY)

# --- QR codes, aligned to the top of the list ---------------------------------
qr_items = [("Portofolio", links[0][1])]
qx = W - M - QR_BOX
qy = y - 4
for i, (cap, url) in enumerate(qr_items):
    top = qy + i * (QR_BOX + 34)
    q = segno.make(url, error="m")
    buf = io.BytesIO()
    q.save(buf, kind="png", scale=10, border=0, dark="#0b3d4d", light="#ffffff")
    png = buf.getvalue()
    pg.insert_image(pymupdf.Rect(qx, top, qx + QR_BOX, top + QR_BOX), stream=png)
    pg.draw_rect(pymupdf.Rect(qx, top, qx + QR_BOX, top + QR_BOX), color=(0.80, 0.84, 0.88), width=0.5)
    txt(pg, qx + 6, top + QR_BOX + 11, cap, 7, FB, MUTED)
    txt(pg, qx, top + QR_BOX + 22, "Pindai QR", 6.5, FM, MUTED)

y += len(links) * 24 + 6

# --- profile summary + skills + stats (fills the sheet; all figures are the
#     ones published on the portfolio itself) ---------------------------------
def wrap(text, font, size, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if pymupdf.get_text_length(t, fontname=font, fontsize=size) <= width:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines


y += 6
line(pg, M, y, W - M, y, LINE, 0.8)
y += 14

txt(pg, M, y, "RINGKASAN PROFIL", 8.5, FB, PRIMARY)
y += 13
summary = ("Mahasiswa Teknologi Informasi dan web developer dengan pengalaman mengantarkan tiga "
           "aplikasi web produksi: platform e-commerce kebutuhan pokok, sistem manajemen klinik "
           "berbasis peran, dan portal desa publik yang melayani lalu lintas aktif. Nyaman bekerja "
           "lintas stack: PHP dan Laravel di sisi server, MySQL untuk pemodelan data, serta "
           "JavaScript murni di sisi front end. Dua karya terdaftar sebagai kekayaan intelektual "
           "di Kementerian Hukum Republik Indonesia.")
for ln in wrap(summary, F, 8.3, CW):
    txt(pg, M, y, ln, 8.3, F, INK)
    y += 11.2

y += 8
txt(pg, M, y, "KEAHLIAN", 8.5, FB, PRIMARY)
y += 13

skills = [
    ("Web Development", "PHP 8, Laravel 11/12, React JS, Inertia, MySQL 8, Vanilla JS, CSS3"),
    ("UI/UX & Design", "Figma Prototyping, Design System, Design Tokens, Layout Responsif"),
    ("Game & 3D Animation", "RPG Maker MZ, Blender 4.1, Cycles, Eevee"),
    ("Video, Media & IoT", "Premiere Pro, Photoshop, ESP32, Sensor, Fritzing"),
]
for k, v in skills:
    txt(pg, M, y, k, 8.2, FB, INK)
    size = 8.2
    while pymupdf.get_text_length(v, fontname=F, fontsize=size) > (CW - 128) and size > 6.8:
        size -= 0.2
    txt(pg, M + 128, y, v, size, F, MUTED)
    y += 12.6

y += 8
line(pg, M, y, W - M, y, LINE, 0.8)
y += 14

# stats strip
stats = [("3", "Aplikasi terkirim"), ("2", "HKI terdaftar"), ("8", "Proyek"), ("12", "Sertifikasi")]
sw = CW / len(stats)
for i, (num, lab) in enumerate(stats):
    cx = M + i * sw
    txt(pg, cx, y + 12, num, 15, FB, PRIMARY)
    txt(pg, cx, y + 24, lab, 7.5, FM, MUTED)
y += 40

# --- footer note ------------------------------------------------------
line(pg, M, H - 68, W - M, H - 68, LINE, 0.8)
txt(pg, M, H - 56, "Dokumen ini memuat biodata, portofolio, KRS, KTM, dan KTP.", 7.5, F, MUTED)
txt(pg, M, H - 44, "Disusun 13 September 2026  |  Muhammad Rayhan Najib (FilesXins)", 7.5, FM, MUTED)
page_number(pg, 1)

# =====================================================================
# PAGE 2: QR PORTFOLIO SHEET (only if useful space is left; else skip)
# =====================================================================
# (skip - keep the document tight at 4 pages: biodata, KRS, KTM, KTP)

# =====================================================================
# PAGE 2: KRS
# =====================================================================
krs = pymupdf.open(os.path.join(D, "krs_240533600012__2026.pdf"))
for src_page in krs:
    rect = src_page.rect
    scale = min((W - 2 * M) / rect.width, (H - 2 * M - 40) / rect.height)
    w2, h2 = rect.width * scale, rect.height * scale
    new = doc.new_page(width=W, height=H)
    txt(new, M, M + 6, "KARTU RENCANA STUDI (KRS)", 11, FB, PRIMARY)
    txt(new, M, M + 18, "Semester Gasal 2026/2027  |  NIM 240533600012", 8, FM, MUTED)
    x0 = (W - w2) / 2
    y0 = M + 32
    new.show_pdf_page(pymupdf.Rect(x0, y0, x0 + w2, y0 + h2), krs, src_page.number)
    page_number(new, 2)

# =====================================================================
# PAGE 3: KTM, PAGE 4: KTP
# =====================================================================
for n, (fname, title, sub, note) in enumerate([
    ("KTM_MUHAMMAD RAYHAN NAJIB.jpg", "KARTU TANDA MAHASISWA (KTM)",
     "Universitas Negeri Malang  |  NIM 240533600012",
     "Kartu ini diterbitkan oleh Universitas Negeri Malang dan berlaku selama masa studi."),
    ("KTP_MUHAMMAD RAYHAN NAJIB.jpg", "KARTU TANDA PENDUDUK (KTP)",
     "Identitas resmi sesuai data kependudukan",
     "Sesuai ketentuan, KTP-el berlaku seumur hidup dan tidak memiliki masa kedaluwarsa."),
], start=3):
    src = os.path.join(D, fname)
    pg2 = doc.new_page(width=W, height=H)
    txt(pg2, M, M + 6, title, 11, FB, PRIMARY)
    txt(pg2, M, M + 18, sub, 8, FM, MUTED)
    line(pg2, M, M + 28, W - M, M + 28, LINE, 0.8)

    # the card is landscape on a portrait sheet: centre it in the free area and add a
    # caption underneath, so the page reads as a deliberate sheet instead of a half-empty one
    area_top = M + 46
    area_bottom = H - 96
    png, iw, ih = fit_image(src, W - 2 * M, area_bottom - area_top)
    x0 = (W - iw) / 2
    y0 = area_top + ((area_bottom - area_top) - ih) / 2
    pg2.insert_image(pymupdf.Rect(x0, y0, x0 + iw, y0 + ih), stream=png)
    pg2.draw_rect(pymupdf.Rect(x0, y0, x0 + iw, y0 + ih), color=(0.72, 0.78, 0.82), width=0.8)
    txt(pg2, x0, y0 + ih + 14, fname.split("_")[0] + " asli", 7, FM, MUTED)
    txt(pg2, x0, y0 + ih + 24, f"Ukuran berkas: {iw} x {ih} px", 7, FM, MUTED)

    # closing note at the foot of the sheet
    line(pg2, M, H - 82, W - M, H - 82, LINE, 0.8)
    for k, ln in enumerate(wrap(note, F, 7.5, CW)):
        txt(pg2, M, H - 70 + k * 10, ln, 7.5, F, MUTED)
    txt(pg2, M, H - 44, "Lampiran dokumen - Muhammad Rayhan Najib (240533600012)", 7.5, FM, MUTED)
    page_number(pg2, n)

doc.set_metadata({
    "title": "Biodata dan Portofolio Muhammad Rayhan Najib (240533600012)",
    "author": "Muhammad Rayhan Najib",
    "subject": "Biodata mahasiswa, portofolio, KRS, KTM, KTP",
    "keywords": "biodata, portofolio, FilesXins, KRS, KTM, KTP, Universitas Negeri Malang",
})
doc.save(OUT, garbage=4, deflate=True)
doc.close()
print("WROTE", OUT, os.path.getsize(OUT), "bytes")
