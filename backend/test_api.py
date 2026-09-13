import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_endpoint(name, url, method="GET", data=None):
    req = urllib.request.Request(f"{BASE_URL}{url}", method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Accept', 'application/json')
    
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
            except:
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

if __name__ == "__main__":
    print("=== TESTING API ENDPOINTS ===\n")
    
    # 1. Test Login
    print("1. Testing Auth Login:")
    test_endpoint("Login", "/auth/login", method="POST")
    print("\n" + "-"*40 + "\n")
    
    # 2. Test Input Lahan
    print("2. Testing Input Lahan (Petak 14):")
    input_payload = {
        "parameters": {
            "pH": 5.2,
            "kelembapan": 45,
            "N": 120, "P": 40, "K": 60
        }
    }
    input_res = test_endpoint("Input Lahan", "/lahan/14/input", method="POST", data=input_payload)
    print("\n" + "-"*40 + "\n")
    
    # 3. Test Pipeline Infer
    print("3. Testing Pipeline Infer:")
    if input_res and 'data' in input_res:
        dataset_id = input_res['data']['id']
        infer_payload = {"dataset_id": dataset_id}
        test_endpoint("Pipeline Infer", "/pipeline/infer", method="POST", data=infer_payload)
    else:
        print("Skipping pipeline infer due to failed input lahan.")
    print("\n" + "-"*40 + "\n")
    
    # 4. Test Lahan History
    print("4. Testing Lahan History (Petak 14):")
    test_endpoint("Lahan History", "/lahan/14/history", method="GET")
    print("\n" + "-"*40 + "\n")
    
    print("=== API TESTING COMPLETE ===")
