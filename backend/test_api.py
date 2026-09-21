import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoint(name, url, method="GET", data=None, token=None):
    req = urllib.request.Request(f"{BASE_URL}{url}", method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    if token:
        req.add_header('Authorization', f'Token {token}')

    if data:
        req.data = json.dumps(data).encode('utf-8')

    try:
        start = time.time()
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_body = response.read().decode('utf-8')
            elapsed = time.time() - start
            print(f"[{method}] {url} -> {status_code} OK ({elapsed*1000:.0f}ms)")
            try:
                print(json.dumps(json.loads(response_body), indent=2))
            except Exception:
                print(response_body)
            return json.loads(response_body)
    except urllib.error.HTTPError as e:
        response_body = e.read().decode('utf-8')
        print(f"[{method}] {url} -> {e.code} ERROR")
        print(response_body)
        return None
    except Exception as e:
        print(f"[{method}] {url} -> FAILED: {e}")
        return None

def get_token():
    res = test_endpoint(
        "Login",
        "/auth/login",
        method="POST",
        data={"username": "petani_cangkringan", "password": "tanacakra-petani-2026"}
    )
    if res and res.get('token'):
        return res['token']
    print("[!] Gagal login. Pastikan user seed & password sudah diatur (jalankan import_excel_data.py).")
    return None

if __name__ == "__main__":
    print("=== TESTING API ENDPOINTS (dengan Token Auth) ===\n")

    token = get_token()
    if not token:
        raise SystemExit(1)

    print("\n" + "-" * 40 + "\n")

    # 1. Test Input Lahan (Petak 14)
    print("1. Testing Input Lahan (Petak 14):")
    import traceback
    input_payload = {
        "parameters": {
            "pH": 5.2,
            "kelembapan": 45,
            "nitrogen": 120, "fosfor": 40, "kalium": 60
        }
    }
    input_res = test_endpoint("Input Lahan", "/lahan/14/input", method="POST", data=input_payload, token=token)
    print("\n" + "-" * 40 + "\n")

    # 2. Test Lahan History (Petak 14)
    print("2. Testing Lahan History (Petak 14):")
    test_endpoint("Lahan History", "/lahan/14/history", method="GET", token=token)
    print("\n" + "-" * 40 + "\n")

    # 3. Test Audit Logs (hanya ADMIN)
    print("3. Testing Audit Logs (harus pakai admin):")
    admin_token = None
    admin_res = test_endpoint(
        "Login Admin",
        "/auth/login",
        method="POST",
        data={"username": "admin_cangkringan", "password": "tanacakra-admin-2026"}
    )
    if admin_res and admin_res.get('token'):
        admin_token = admin_res['token']
        test_endpoint("Audit Logs", "/audit-logs", method="GET", token=admin_token)
    else:
        print("Skipping audit logs: login admin gagal.")
    print("\n" + "-" * 40 + "\n")

    # 4. Test akses tanpa token ditolak
    print("4. Testing akses tanpa token (harus 401/403):")
    test_endpoint("Lahan tanpa token", "/lahan", method="GET")
    print("\n" + "-" * 40 + "\n")

    print("=== API TESTING COMPLETE ===")