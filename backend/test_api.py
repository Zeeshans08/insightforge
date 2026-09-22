import sys
import os
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_backend_pipeline():
    print("Testing Backend Pipeline...")
    
    # 1. Health check
    res = client.get("/health")
    assert res.status_code == 200
    print("[OK] Health Check:", res.json())

    # 2. Demo dataset loader
    res = client.get("/api/demo")
    assert res.status_code == 200
    demo_data = res.json()
    dataset_id = demo_data["dataset_id"]
    print("[OK] Demo Loader dataset_id:", dataset_id)

    # 3. Clean dataset
    res = client.post(f"/api/clean/{dataset_id}")
    assert res.status_code == 200
    clean_res = res.json()
    print(f"[OK] Data Cleaning Actions: {len(clean_res['report']['actions'])} actions executed.")

    # 4. EDA computation
    res = client.post(f"/api/eda/{dataset_id}")
    assert res.status_code == 200
    eda_res = res.json()
    print(f"[OK] EDA Numeric summary columns: {list(eda_res['numeric_summary'].keys())}")

    # 5. Export PDF report
    res = client.get(f"/api/export-pdf/{dataset_id}")
    assert res.status_code == 200
    # 6. Test Excel Upload, Clean, and Download Format
    import pandas as pd
    import io
    excel_buf = io.BytesIO()
    test_df = pd.DataFrame({"Product": ["Chair", "Chair", "Desk"], "Price": [50.0, 50.0, None]})
    with pd.ExcelWriter(excel_buf, engine="openpyxl") as writer:
        test_df.to_excel(writer, index=False)
    excel_buf.seek(0)

    res = client.post("/api/upload", files={"file": ("test_sales.xlsx", excel_buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert res.status_code == 200
    xlsx_id = res.json()["dataset_id"]

    res = client.post(f"/api/clean/{xlsx_id}")
    assert res.status_code == 200

    res = client.get(f"/api/download-cleaned/{xlsx_id}")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert "cleaned_test_sales.xlsx" in res.headers["content-disposition"]
    # 7. Test Admin API Authentication & Endpoints
    # 7a. Unauthenticated request should fail with 401
    res = client.get("/api/admin/stats")
    assert res.status_code == 401
    print("[OK] Unauthenticated Admin Request properly rejected with 401 Unauthorized")

    # 7b. Invalid login
    res = client.post("/api/admin/login", json={"username": "admin", "password": "wrong_password"})
    assert res.status_code == 401

    # 7c. Valid login
    res = client.post("/api/admin/login", json={"username": "admin", "password": "insightforge123"})
    assert res.status_code == 200
    token = res.json()["token"]
    print("[OK] Admin Login successful, token received.")

    # 7d. Authenticated request with X-Admin-Token header
    headers = {"X-Admin-Token": token}
    res = client.get("/api/admin/stats", headers=headers)
    assert res.status_code == 200
    stats_data = res.json()
    assert "total_datasets" in stats_data
    print("[OK] Authenticated Admin Stats:", stats_data)

    res = client.get("/api/admin/datasets", headers=headers)
    assert res.status_code == 200
    assert "datasets" in res.json()
    print(f"[OK] Admin Datasets count: {len(res.json()['datasets'])}")

    res = client.get("/api/admin/sessions", headers=headers)
    assert res.status_code == 200
    assert "sessions" in res.json()

    # Delete test dataset with header
    res = client.delete(f"/api/admin/dataset/{xlsx_id}", headers=headers)
    assert res.status_code == 200
    print(f"[OK] Admin Dataset Deletion verified for ID: {xlsx_id}")

    print("\nALL BACKEND API TESTS PASSED!")


if __name__ == "__main__":
    test_backend_pipeline()
