"""Export the live PHP API responses as static JSON fixtures.

The UM-MART front end talks to `../api/...php` endpoints. For a static demo we
snapshot the real responses (from the local Laragon stack, with real database
rows) so the pages render with genuine content instead of empty states.

Run:  python _build/export_fixtures.py
"""
import json, os, urllib.request, urllib.error

BASE = "http://ummart-test.test/"
OUT  = r"C:\CODE\filesxins-portfolio\_build\_api-fixtures"

ENDPOINTS = [
    "api/public/get_homepage_data.php",
    "api/public/get_products.php",
    "api/public/get_categories.php",
    "api/public/get_banners.php",
    "api/public/get_showcase_banners.php",
    "api/public/get_active_promo.php",
    "api/public/get_settings.php",
    "api/public/get_recommendations.php",
    "api/public/get_transactions.php",
    "api/public/get_transaction_settings.php",
    "api/admin/get_statistics.php",
    "api/admin/get_chart_data.php",
    "api/admin/manage_products.php",
    "api/admin/manage_categories.php",
    "api/admin/manage_horizontal_categories.php",
    "api/admin/manage_banners.php",
    "api/admin/manage_showcase_banners.php",
    "api/admin/manage_vouchers.php",
    "api/admin/manage_statuses.php",
    "api/admin/manage_settings.php",
]

def main():
    ok, fail = [], []
    for ep in ENDPOINTS:
        url = BASE + ep
        try:
            with urllib.request.urlopen(url, timeout=25) as r:
                body = r.read().decode("utf-8", "replace")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = {"success": False, "raw": body[:400]}
            dst = os.path.join(OUT, ep.replace("api/", "", 1))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(dst, "w", encoding="utf-8") as f:
                json.dump(parsed, f, ensure_ascii=False, indent=1)
            size = os.path.getsize(dst)
            shape = len(parsed.get("data", [])) if isinstance(parsed, dict) and isinstance(parsed.get("data"), list) else "-"
            ok.append((ep, size, shape))
            print(f"  OK   {ep:52} {size/1024:7.1f} KB  items={shape}")
        except Exception as e:
            fail.append((ep, str(e)[:90]))
            print(f"  FAIL {ep:52} {str(e)[:80]}")
    print(f"\n{len(ok)} exported, {len(fail)} failed")
    return fail

if __name__ == "__main__":
    main()
