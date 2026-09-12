"""Render Blender scenes for the portfolio, with QA on every shot.

Runs the renderer in Blender, then inspects each PNG outside Blender (where PIL
is available) and re-renders the bad ones:

  * a *flat* image (one single colour) means the scene camera sits inside the
    mesh or points at nothing -> re-render from an auto-framed outside camera.
  * a very *dark* image is a valid interior/night shot that the scene's own
    lighting cannot read -> keep the artist's camera, replace the lighting.

Blender prints its own summary lines (RENDERED/RETRIED/FAILED); this script adds
the measured verdict so a "successful" render that is actually a grey rectangle
never reaches the portfolio.
"""

import numpy as np
import os
import subprocess
import sys
from pathlib import Path

from PIL import Image

BLENDER = r"C:\Program Files\Blender Foundation\Blender 4.1\blender.exe"
BUILD = Path(__file__).parent
SCRIPT = BUILD / "blender_render.py"

FLAT_STD = 3.0      # below this the frame is a single colour
DARK_MEAN = 26.0    # below this (0-255) the frame is unreadably dark


def measure(png):
    with Image.open(png) as im:
        arr = np.asarray(im.convert("RGB").resize((320, 200)), dtype=np.float32)
    lum = arr.mean(axis=2)
    return float(lum.mean()), float(lum.std())


def run(out_dir, blends, mode="normal", timeout=1800):
    env = dict(os.environ, BLENDER_RENDER_MODE=mode)
    cmd = [BLENDER, "-b", "-P", str(SCRIPT), "--", str(out_dir)] + [str(b) for b in blends]
    proc = subprocess.run(cmd, capture_output=True, text=True, errors="replace", timeout=timeout, env=env)
    for line in proc.stdout.splitlines():
        if any(k in line for k in ("RENDERED", "RETRIED", "FAILED", "FLAT", "DARK")):
            print("   blender:", line.strip())


def render(out_dir, blends):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    print("== pass 1: scene cameras, artist lighting")
    run(out_dir, blends)

    verdicts = {}
    for b in blends:
        png = out_dir / (Path(b).stem.replace(" ", "_") + ".png")
        if not png.exists():
            verdicts[Path(b).stem] = ("missing", None, None)
            print("   %-16s MISSING" % Path(b).stem)
            continue
        mean, std = measure(png)
        state = "ok" if (std >= FLAT_STD and mean >= DARK_MEAN) else ("flat" if std < FLAT_STD else "dark")
        verdicts[Path(b).stem] = (state, mean, std)
        print("   %-16s %-6s mean=%6.1f std=%6.1f" % (Path(b).stem, state, mean, std))

    flat = [b for b in blends if verdicts[Path(b).stem][0] in ("flat", "missing")]
    dark = [b for b in blends if verdicts[Path(b).stem][0] == "dark"]

    if dark:
        print("== pass 2: relight %d dark scene(s), original cameras" % len(dark))
        run(out_dir, dark, mode="relight")
    if flat:
        print("== pass 3: outside camera + relight %d scene(s)" % len(flat))
        run(out_dir, flat, mode="outside")

    print("== final verdicts")
    bad = []
    for b in blends:
        png = out_dir / (Path(b).stem.replace(" ", "_") + ".png")
        if not png.exists():
            bad.append(Path(b).stem)
            continue
        mean, std = measure(png)
        state = "ok" if (std >= FLAT_STD and mean >= DARK_MEAN) else "BAD"
        if state == "BAD":
            bad.append(Path(b).stem)
        print("   %-16s %-4s mean=%6.1f std=%6.1f" % (Path(b).stem, state, mean, std))
    return bad


if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 2:
        raise SystemExit("usage: render_all.py <out_dir> <blend> [<blend> ...]")
    bad = render(args[0], args[1:])
    if bad:
        print("\nSTILL BAD:", ", ".join(bad))
        sys.exit(1)
    print("\nall renders readable")
