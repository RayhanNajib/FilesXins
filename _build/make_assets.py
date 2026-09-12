"""Build the FilesXins portfolio static assets.

- screenshots  -> optimised WebP (project previews)
- certificates -> first page of each PDF rendered to WebP
"""
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import pymupdf

SHOTS = os.path.expandvars(r"%LOCALAPPDATA%\Temp\filesxins-shots")
CERT  = r"C:\Users\WA\Downloads\TUGAS PKKMB\Sertifikat"
PROJ  = r"C:\CODE\filesxins-portfolio"
PUB   = os.path.join(PROJ, "assets")

shot_out  = os.path.join(PUB, "shots")
cert_out  = os.path.join(PUB, "certs")
prof_out  = os.path.join(PUB, "profile")
port_out  = os.path.join(PUB, "thirdparty")
for d in (shot_out, cert_out, prof_out, port_out):
    os.makedirs(d, exist_ok=True)

def to_webp(src, dst, width=1400, quality=82, max_h=3000):
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    if im.height > max_h:                      # keep only the top of very long pages
        im = im.crop((0, 0, im.width, max_h))
    im.save(dst, "WEBP", quality=quality, method=6)
    return os.path.getsize(dst)

print("=== screenshots -> webp ===")
shots = {}
for p in sorted(glob.glob(os.path.join(SHOTS, "*.png"))):
    name = os.path.splitext(os.path.basename(p))[0]
    dst = os.path.join(shot_out, name + ".webp")
    shots[name] = to_webp(p, dst, width=1400, quality=80)
    print(f"  {name:24} {shots[name]/1024:8.0f} KB")

print("\n=== certificates -> webp ===")
SEL = {
 "hki-um-mart":      r"HKI UM MART\HKI_UM MART_Muhammad Rayhan Najib_240533600012.pdf",
 "hki-smart-rakaat": r"HKI Smart Rakaat\HKI_SMART RAKAAT_Muhammad Rayhan Najib_240533600012.pdf",
 "bootcamp-uiux":    r"Bootcamp UI_UX Design Done\Sertifikat UI_UX Design Intensive Camp - Muhammad Rayhan Najib.pdf",
 "bootcamp-figma":   r"Bootcamp UI_UX Design Done\Sertifikat FIGMA Camp - Muhammad Rayhan Najib.pdf",
 "bootcamp-excel":   r"Bootcamp Excel Done\Muhammad Rayhan Najib - E-Certif SC Data Visualization with Microsoft Excel MySkill.pdf",
 "cisco-ite":        r"Kegiatan Kursus CISCO ITE\IT_Essentials_certificate_muhammad-rayhan-2405336-students-um-ac-id_079f8c38-c21e-4aa6-9a44-c5f1df03bb5e.pdf",
 "pkm":              r"PKM\Sertifikat PKM.pdf",
 "pkkmb":            r"Kegiatan PKKMB Done\Sertifikat PKKMB.pdf",
 "asisten-lab":      r"ASISTEN LAB\Sertifikat Asisten Genap 2526 fix-17.pdf",
 "ukbing":           r"Pelatihan Bahasa Inggris UKBING\UKBing2405336000121.pdf",
 "diklat-nasional":  r"Kegiatan Diklat Nasional\Sertifikat Kegiatan DIklat Nasional_Muhammad Rayhan Najib.pdf",
 "webinar-iot":      r"Webinar IoT Rasberry Pi Done\Sertifikat Webinar IoT Rasberry Pi.pdf",
}
certs = {}
for name, rel in SEL.items():
    src = os.path.join(CERT, rel)
    if not os.path.exists(src):
        print(f"  MISSING {name}: {rel}"); continue
    doc = pymupdf.open(src)
    page = doc[0]
    pix = page.get_pixmap(dpi=130)
    tmp = os.path.join(cert_out, "_tmp.png")
    pix.save(tmp)
    dst = os.path.join(cert_out, name + ".webp")
    certs[name] = to_webp(tmp, dst, width=1100, quality=82)
    os.remove(tmp)
    doc.close()
    print(f"  {name:20} {certs[name]/1024:8.0f} KB")

# ---- third-party: nanggungan live site (screenshot provided separately) ----
print("\n=== done ===")

# ---- holographic profile placeholder (dark + neon ring + monogram) ----
def lerp(a, b, t): return tuple(int(x + (y - x) * t) for x, y in zip(a, b))
W = 640
img = Image.new("RGB", (W, W), (7, 8, 13))
d = ImageDraw.Draw(img)
cx = cy = W // 2
# conic-ish neon sweep using many arcs
CY, MG, VI = (0, 229, 255), (255, 0, 170), (124, 58, 237)
steps = 720
for i in range(steps):
    a0 = i * 360 / steps
    t = i / steps
    if t < 0.5:  col = lerp(CY, MG, t * 2)
    else:        col = lerp(MG, VI, (t - 0.5) * 2)
    d.arc([40, 40, W - 40, W - 40], a0, a0 + 1.2, fill=col, width=6)
ring = img.filter(ImageFilter.GaussianBlur(3))
img = Image.new("RGB", (W, W), (7, 8, 13))
img.paste(ring, (0, 0))
d = ImageDraw.Draw(img)
# inner disc
d.ellipse([70, 70, W - 70, W - 70], fill=(12, 15, 24))
# scanlines for the hologram feel
for y in range(72, W - 72, 4):
    d.line([(72, y), (W - 72, y)], fill=(0, 60, 80), width=1)
img.paste(img.filter(ImageFilter.GaussianBlur(0.4)))
d = ImageDraw.Draw(img)
# monogram
try:
    f = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 190)
    sf = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf", 34)
except Exception:
    f = sf = ImageFont.load_default()
txt = "MRN"
bbox = d.textbbox((0, 0), txt, font=f)
d.text((cx - (bbox[2]-bbox[0])/2, cy - (bbox[3]-bbox[1])/2 - 30), txt, font=f, fill=(0, 229, 255))
sub = "FILESXINS"
b2 = d.textbbox((0, 0), sub, font=sf)
d.text((cx - (b2[2]-b2[0])/2, cy + 120), sub, font=sf, fill=(255, 0, 170))
p = os.path.join(prof_out, "avatar.webp")
img.save(p, "WEBP", quality=88)
print("avatar:", p, os.path.getsize(p), "bytes")

import json
json.dump({"shots": shots, "certs": certs}, open(os.path.join(PROJ, "assets-manifest.json"), "w"), indent=1)
print("\ntotal assets KB:", round(sum(shots.values())/1024 + sum(certs.values())/1024, 1))
