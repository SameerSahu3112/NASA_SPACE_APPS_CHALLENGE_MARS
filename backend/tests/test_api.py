"""
Automated Compatibility & Integration Test Suite for MIRA Python Backend
Tests:
- Health check
- NASA JPL Horizons proxy & parser
- AI Copilot chat & action recognition
- Keplerian orbital mechanics solver
- Mars elevation query
- Speech normalizer
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import unittest
from fastapi.testclient import TestClient
from app.main import app
from app.services.horizons_service import generate_synthetic_horizons_result
from app.utils.speech_normalizer import normalize_speech_text
from app.services.kepler_service import compute_heliocentric_state

client = TestClient(app)

class TestMiraBackend(unittest.TestCase):
    def test_health_check(self):
        response = client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["features"]["supabase_free"])

    def test_speech_normalization(self):
        raw = "Fly to **Jezero Crater** at 18.38° N, 77.58° E with speed 2.14 km/s!"
        spoken = normalize_speech_text(raw)
        self.assertNotIn("**", spoken)
        self.assertIn("kilometers per second", spoken)
        self.assertIn("18.38 degrees North", spoken)
        self.assertIn("77.58 degrees East", spoken)

    def test_keplerian_mars_solver(self):
        state = compute_heliocentric_state("mars", days_from_j2000=0.0)
        self.assertEqual(state["planetId"], "mars")
        self.assertEqual(state["name"], "Mars")
        self.assertAlmostEqual(state["semiMajorAxisAU"], 1.52366, places=3)
        self.assertAlmostEqual(state["orbitalPeriodDays"], 686.98, places=1)
        self.assertGreater(state["totalSpeedKmPerSec"], 20.0)
        self.assertLess(state["totalSpeedKmPerSec"], 30.0)

    def test_kepler_api_endpoints(self):
        res1 = client.get("/api/kepler/planet/mars")
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertEqual(data1["name"], "Mars")

        res2 = client.get("/api/kepler/system")
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertIn("mars", data2["planets"])
        self.assertIn("jupiter", data2["planets"])

    def test_elevation_api_ground_truth(self):
        res = client.get("/api/elevation?lat=18.38&lon=77.58")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["latitude"], 18.38)
        self.assertEqual(data["longitude"], 77.58)
        self.assertAlmostEqual(data["elevationMeters"], -2500.0, places=1)

    def test_horizons_api_fallback_or_live(self):
        res = client.get("/api/horizons?COMMAND='499'&START_TIME='2026-Jan-01'&STOP_TIME='2026-Jan-02'")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue("result" in data or "success" in data)

    def test_horizons_synthetic_fallback_no_crash(self):
        parsed, raw_json = generate_synthetic_horizons_result("499", "2026-Jan-01")
        self.assertEqual(parsed.commandId, "499")
        self.assertIn("$$SOE", raw_json["result"])
        self.assertIn("$$EOE", raw_json["result"])
        self.assertGreater(parsed.distanceAU, 1.0)

        sun_parsed, _ = generate_synthetic_horizons_result("10", "2026-Jan-01")
        self.assertIn("Sun", sun_parsed.targetName)
        self.assertEqual(sun_parsed.distanceAU, 0.0)

    def test_cors_preflight_headers(self):
        res = client.options(
            "/api/copilot/chat",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("access-control-allow-origin"), "http://localhost:5173")

    def test_copilot_navigation_intent(self):
        payload = {
            "prompt": "Fly me to Jezero Crater in terrain",
            "activeTab": "mars"
        }
        res = client.post("/api/copilot/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsNotNone(data["action"])
        self.assertEqual(data["action"]["type"], "NAVIGATE_TERRAIN")
        self.assertEqual(data["navigationTarget"]["name"], "Jezero Crater")
        self.assertIn("spokenText", data)
        self.assertGreater(len(data["spokenText"]), 0)

if __name__ == "__main__":
    unittest.main()
