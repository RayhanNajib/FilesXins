"""Fetch official open-source icons (Iconify: Lucide / Simple Icons / Logos)
and substitute them into the HTML templates.

Usage
-----
    python _build/icons.py fetch        # refresh the local cache
    python _build/icons.py build        # render index.template.html -> index.html

Templates use  {{icon:lucide:mail}}  or  {{icon:simple-icons:php|#8993BE}}.
Inline SVG is used (not a sprite) so icons inherit `currentColor` and cost
no extra network request.
"""

import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "_build", "_icons.json")
TEMPLATE = os.path.join(ROOT, "index.template.html")
TARGET = os.path.join(ROOT, "index.html")

# ---------------------------------------------------------------- icon sets
# Only sets with a licence that allows redistribution without attribution
# requirements beyond the licence notice: Lucide (ISC) for UI, Simple Icons
# (CC0) for technology marks, Logos (CC0) where Simple Icons has no entry.
ICONS = [
    # --- UI / Lucide -------------------------------------------------------
    "lucide:mail", "lucide:phone", "lucide:map-pin", "lucide:arrow-up-right",
    "lucide:external-link", "lucide:github", "lucide:code-2", "lucide:server",
    "lucide:database", "lucide:layout-dashboard", "lucide:graduation-cap",
    "lucide:award", "lucide:badge-check", "lucide:landmark", "lucide:gamepad-2",
    "lucide:box", "lucide:palette", "lucide:layers", "lucide:terminal",
    "lucide:git-branch", "lucide:cloud", "lucide:shield-check", "lucide:check",
    "lucide:chart-column", "lucide:briefcase", "lucide:file-text",
    "lucide:users", "lucide:sparkles", "lucide:quote", "lucide:target",
    "lucide:pen-tool", "lucide:monitor-smartphone", "lucide:circle-check",
    "lucide:lock", "lucide:zap", "lucide:menu", "lucide:x", "lucide:chevron-left",
    "lucide:chevron-right", "lucide:search", "lucide:clock", "lucide:calendar-check",
    # --- technology marks --------------------------------------------------
    "simple-icons:php", "simple-icons:mysql", "simple-icons:javascript",
    "simple-icons:html5", "simple-icons:css3", "simple-icons:figma",
    "simple-icons:blender", "simple-icons:git", "simple-icons:github",
    "simple-icons:whatsapp", "simple-icons:googlechrome",
    "simple-icons:adobephotoshop", "simple-icons:composer",
    "simple-icons:apache", "simple-icons:vite",
    "logos:laravel", "vscode-icons:file-type-blade",
]


def fetch(force=False):
    cache = {}
    if os.path.exists(CACHE):
        cache = json.load(open(CACHE, encoding="utf-8"))
    missing = [i for i in ICONS if i not in cache]
    for key in missing:
        setname, name = key.split(":", 1)
        url = f"https://api.iconify.design/{setname}/{name}.svg"
        body = None
        for attempt in range(5):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "filesxins-build"})
                body = urllib.request.urlopen(req, timeout=30).read().decode()
                if not body.startswith("<svg"):
                    raise ValueError(body[:80])
                break
            except Exception as exc:                  # noqa: BLE001
                body = None
                if attempt == 4:
                    print(f"  FAILED  {key}: {exc}")
                else:
                    time.sleep(2.5 * (attempt + 1))   # Iconify rate-limits hard
        if body:
            cache[key] = body
            json.dump(cache, open(CACHE, "w", encoding="utf-8"), indent=0)
            print(f"  fetched {key}  ({len(body)}b)")
            time.sleep(0.9)
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    json.dump(cache, open(CACHE, "w", encoding="utf-8"), indent=0)
    print(f"cache: {len(cache)} icons -> {CACHE}")
    return cache


def inline(svg, size=None, colour=None, extra_class="ico"):
    """Normalise an Iconify SVG for inline use."""
    svg = re.sub(r'\s(width|height)="[^"]*"', "", svg, count=2)
    style = []
    if size:
        style.append(f"--ico:{size}")
    if colour:
        style.append(f"color:{colour}")
    attrs = f'class="{extra_class}" aria-hidden="true"'
    if style:
        attrs += f' style="{";".join(style)}"'
    if "currentColor" not in svg:
        svg = svg.replace("<svg", '<svg fill="currentColor"', 1)
    return svg.replace("<svg", f"<svg {attrs}", 1)


def build():
    cache = fetch(force=False)
    html = open(TEMPLATE, encoding="utf-8").read()
    missing = set()

    def sub(m):
        key = m.group(1)
        colour, size = None, None
        if "|" in key:
            key, rest = key.split("|", 1)
            for part in rest.split(","):
                part = part.strip()
                if part.startswith("#"):
                    colour = part
                elif part.endswith("px") or part.isdigit():
                    size = part if part.endswith("px") else part + "px"
        if key not in cache:
            missing.add(key)
            return ""
        return inline(cache[key], size=size, colour=colour)

    out = re.sub(r"\{\{icon:([^}]+)\}\}", sub, html)
    open(TARGET, "w", encoding="utf-8", newline="\n").write(out)
    print(f"wrote {TARGET}  ({len(out)//1024} KB)")
    if missing:
        print("MISSING ICONS:", ", ".join(sorted(missing)))
        return 1
    print("all icons resolved")
    return 0


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "build"
    if cmd == "fetch":
        fetch()
    else:
        sys.exit(build())
