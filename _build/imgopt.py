# -*- coding: utf-8 -*-
"""Image optimizer for filesxins-portfolio.

- Reads every <img>/<link> image reference from index.html + index.template.html
- Writes compressed copies under assets/opt/ (originals untouched)
- Rewrites the references in BOTH html files
- favicons/apple-touch-icon stay PNG (resized) for browser compatibility
"""
import os, re, io, urllib.parse
from PIL import Image, ImageOps

P = r"C:\CODE\filesxins-portfolio"
OPT = "assets/opt"

def files():
    return [os.path.join(P, "index.html"), os.path.join(P, "index.template.html")]

def load(p): return open(p, encoding="utf-8").read()

REF_RE = re.compile(r'(?:src|poster|href)="([^"]+\.(?:png|jpe?g|webp|svg))"', re.I)

def collect(html):
    out = set()
    for m in REF_RE.finditer(html):
        out.add(urllib.parse.unquote(m.group(1)))
    return out

def opt_path(ref):
    stem = os.path.splitext(os.path.basename(ref))[0]
    d = os.path.dirname(ref)              # e.g. assets/shots
    return f"{OPT}/{d.split('/')[-1]}/{stem}"

def convert(ref):
    """Return NEW ref (without quotes) or None to leave as-is."""
    fs = os.path.join(P, ref.replace("/", os.sep))
    if not os.path.isfile(fs) or ref.lower().endswith(".svg"):
        return None
    name = os.path.basename(ref).lower()
    im = ImageOps.exif_transpose(Image.open(fs))
    w, h = im.size

    # keep PNG where the format requirement is real
    if "favicon" in name:
        target, size = ".png", 64
    elif "apple-touch" in name:
        target, size = ".png", 180
    else:
        target, size = ".webp", None

    maxw = size or (96 if "logo-mark" in name else 800 if "portrait" in name else 1000)
    if w > maxw:
        im = im.resize((maxw, round(h * maxw / w)), Image.LANCZOS)

    out_dir = os.path.join(P, OPT, ("profile" if "icon" in name or "favicon" in name else
                                    "logo" if "logo" in name else "shots"))
    os.makedirs(out_dir, exist_ok=True)
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", os.path.splitext(os.path.basename(ref))[0]).strip("-")
    new_ref = f"{OPT}/{os.path.basename(out_dir)}/{stem}{target}"
    new_fs = os.path.join(out_dir, stem + target)

    has_alpha = im.mode in ("RGBA", "LA", "PA") or (im.mode == "P" and "transparency" in im.info)
    buf = io.BytesIO()
    if target == ".png":
        im.convert("RGBA" if has_alpha else "RGB").save(buf, "PNG", optimize=True)
    else:
        im.convert("RGBA" if has_alpha else "RGB").save(buf, "WEBP", quality=78, method=6)
    data = buf.getvalue()

    now = os.path.getsize(fs)
    # only replace if it actually saves >8KB (icons: replace anyway if smaller)
    if now - len(data) < 8 * 1024 and "logo" not in name and "favicon" not in name:
        return None
    with open(new_fs, "wb") as f:
        f.write(data)
    print(f"  {ref}  {now//1024}KB -> {new_ref}  {len(data)//1024}KB")
    return new_ref

def main():
    # build map old->new from union of refs in both files
    m = {}
    refs = set()
    for p in files():
        refs |= collect(load(p))
    for r in sorted(refs):
        n = convert(r)
        if n:
            m[r] = n
    print(f"\n{len(m)} of {len(refs)} refs optimized")

    for p in files():
        html = load(p)
        cnt = 0
        def sub(mm):
            nonlocal cnt
            full = mm.group(0)
            old = mm.group(1)
            if old in m:
                cnt += 1
                new = m[old].replace(" ", "%20")
                return full.replace('"' + old + '"', '"' + new + '"')
            return full
        html = REF_RE.sub(sub, html)
        open(p, "w", encoding="utf-8").write(html)
        print(f"  rewrote {cnt} refs in {os.path.basename(p)}")

main()
