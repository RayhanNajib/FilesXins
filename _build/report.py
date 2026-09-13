import json, os, sys

T = os.path.join(os.environ["LOCALAPPDATA"], "Temp")
for f in sys.argv[1:] or ["DESKTOP", "TABLET", "MOBILE"]:
    p = os.path.join(T, "qa_%s.json" % f)
    print("=== %s ===" % f)
    if not os.path.exists(p):
        print("  (no file)"); continue
    t = open(p, encoding="utf-8", errors="replace").read()
    i = t.find("{")
    if i < 0:
        print("  raw:", t[:300]); continue
    try:
        j = json.loads(t[i:])
    except Exception as exc:
        print("  parse fail:", exc, t[:200]); continue
    print("  errors", j["errors"], "failed", j["failed"])
    print("  scrollX", j["canScrollX"], "| emDash", j["emDash"], "| broken", len(j["broken"]), j["broken"][:4])
    print("  reveal", j["reveal"], "| symbols", j["symbols"], "missingUse", j["missingUse"])
    print("  order[0]", j["order"][0][:26], "| order[7]", j["order"][7][:30])
    print("  rails moved:", [r["movedTo"] for r in j["rails"]])
    print("  empty band % :", [r["bandPct"] for r in j["rails"]])
    print("  height spread:", [r["heightSpread"] for r in j["rails"]])
    print("  rail scroll  :", [r["scrollable"] for r in j["rails"]], "maxScroll", [r["maxScroll"] for r in j["rails"]])
    print("  tiles        :", [r["tiles"] for r in j["rails"]])
    print("  pageOverflow :", [r["overflowingPage"] for r in j["rails"]])
    print("  playerBox:", [p["boxRatio"] for p in j["players"]])
    print("  playerIcons:", [p["btnIcons"] for p in j["players"]])
    print("  yt:", j["yt"])
    print("  certs:", j["certs"])
    print("  lightbox opened/step/close:", not j["lightbox"]["opened"]["hidden"], j["lightbox"]["changed"], j["lightbox"]["closed"])
    print("  lang:", j["lang"]["first"]["code"], "->", j["lang"]["second"]["code"], "->", j["lang"]["back"])
    print("  certsNav:", j["certsNav"])
    print("  autoScrollProof:", j["autoScrollProof"])
    for st in j.get("structure", []):
        print("   card %s media kids: %s" % (st["num"], st["mediaKids"]))
        if st["videoGridKids"]:
            print("           video grid: %s" % st["videoGridKids"])
    print("  column fill (card: containerH emptyTail infoH mediaH):")
    for f in j.get("fill", []):
        flag = "  <-- EMPTY TAIL" if f["emptyTail"] > 90 else ""
        print("    %-4s h=%-5d tail=%-5d info=%-5d media=%-5d%s" % (f["num"], f["containerH"], f["emptyTail"], f["infoH"], f["mediaH"], flag))
