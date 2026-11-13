"""
Keplerian Orbital Mechanics Service (Python)
Solves Kepler's Equation and performs 3D coordinate transformations
to the J2000 Heliocentric Ecliptic frame.
"""

import math
from typing import Dict, Any

ASTRONOMICAL_UNIT_KM = 149597870.7
HELIOCENTRIC_MU_AU_DAY = 0.0002959122082855911  # G * M_sun in AU^3 / day^2

# Standard J2000 Keplerian Elements for the 8 Major Planets
PLANET_ELEMENTS_J2000: Dict[str, Dict[str, Any]] = {
    "mercury": {
        "id": "mercury", "name": "Mercury", "naifId": 199,
        "a": 0.38709893, "e": 0.20563069, "I": 7.00487,
        "L": 252.250845, "longPeri": 77.45645, "node": 48.33167,
        "periodDays": 87.969
    },
    "venus": {
        "id": "venus", "name": "Venus", "naifId": 299,
        "a": 0.72333199, "e": 0.00677323, "I": 3.39471,
        "L": 181.97973, "longPeri": 131.53298, "node": 76.68069,
        "periodDays": 224.701
    },
    "earth": {
        "id": "earth", "name": "Earth", "naifId": 399,
        "a": 1.00000011, "e": 0.01671022, "I": 0.00005,
        "L": 100.46435, "longPeri": 102.94719, "node": 0.0,
        "periodDays": 365.256
    },
    "mars": {
        "id": "mars", "name": "Mars", "naifId": 499,
        "a": 1.52366231, "e": 0.09341233, "I": 1.85061,
        "L": -4.553432, "longPeri": 336.04084, "node": 49.57854,
        "periodDays": 686.980
    },
    "jupiter": {
        "id": "jupiter", "name": "Jupiter", "naifId": 599,
        "a": 5.20336301, "e": 0.04839266, "I": 1.30530,
        "L": 34.40438, "longPeri": 14.75385, "node": 100.55615,
        "periodDays": 4332.589
    },
    "saturn": {
        "id": "saturn", "name": "Saturn", "naifId": 699,
        "a": 9.53707032, "e": 0.05415060, "I": 2.48446,
        "L": 49.94424, "longPeri": 92.43194, "node": 113.71504,
        "periodDays": 10759.22
    },
    "uranus": {
        "id": "uranus", "name": "Uranus", "naifId": 799,
        "a": 19.19126393, "e": 0.04716771, "I": 0.76986,
        "L": 313.23218, "longPeri": 170.96424, "node": 74.22988,
        "periodDays": 30685.4
    },
    "neptune": {
        "id": "neptune", "name": "Neptune", "naifId": 899,
        "a": 30.06896348, "e": 0.00858587, "I": 1.76917,
        "L": -55.120029, "longPeri": 44.97135, "node": 131.72169,
        "periodDays": 60189.0
    },
}

def solve_kepler_equation(mean_anomaly_rad: float, eccentricity: float, tolerance: float = 1e-12) -> float:
    """Solves Kepler's Equation M = E - e * sin(E) using Newton-Raphson iteration."""
    # Good initial guess
    E = mean_anomaly_rad + eccentricity * math.sin(mean_anomaly_rad)
    for _ in range(30):
        f = E - eccentricity * math.sin(E) - mean_anomaly_rad
        f_prime = 1.0 - eccentricity * math.cos(E)
        dE = f / f_prime
        E -= dE
        if abs(dE) < tolerance:
            break
    return E

def compute_heliocentric_state(planet_id: str, days_from_j2000: float = 0.0) -> Dict[str, Any]:
    """Computes high-accuracy Cartesian state vectors and dynamics for a given planet."""
    elem = PLANET_ELEMENTS_J2000.get(planet_id.lower())
    if not elem:
        raise ValueError(f"Unknown planet ID: {planet_id}")

    a = elem["a"]
    e = elem["e"]
    I_rad = math.radians(elem["I"])
    node_rad = math.radians(elem["node"])
    long_peri_rad = math.radians(elem["longPeri"])
    omega_rad = long_peri_rad - node_rad  # argument of perihelion

    # Mean motion n (rad/day)
    n = math.sqrt(HELIOCENTRIC_MU_AU_DAY / (a ** 3))
    
    # Mean anomaly M at epoch + dt
    M0_rad = math.radians(elem["L"]) - long_peri_rad
    M_rad = (M0_rad + n * days_from_j2000) % (2.0 * math.pi)

    # Solve Kepler's Equation for Eccentric Anomaly E
    E_rad = solve_kepler_equation(M_rad, e)

    # Orbital plane coordinates
    x_prime = a * (math.cos(E_rad) - e)
    y_prime = a * math.sqrt(1.0 - e * e) * math.sin(E_rad)
    
    # Distance r in AU
    r_au = math.sqrt(x_prime * x_prime + y_prime * y_prime)
    r_km = r_au * ASTRONOMICAL_UNIT_KM

    # True anomaly nu
    nu_rad = math.atan2(y_prime, x_prime)

    # 3D Rotation to J2000 Ecliptic Frame
    # R = Rz(-node) * Rx(-I) * Rz(-omega)
    cos_o = math.cos(omega_rad)
    sin_o = math.sin(omega_rad)
    cos_n = math.cos(node_rad)
    sin_n = math.sin(node_rad)
    cos_i = math.cos(I_rad)
    sin_i = math.sin(I_rad)

    # Unit vector P along perihelion
    px = cos_n * cos_o - sin_n * sin_o * cos_i
    py = sin_n * cos_o + cos_n * sin_o * cos_i
    pz = sin_o * sin_i

    # Unit vector Q along semiminor axis
    qx = -cos_n * sin_o - sin_n * cos_o * cos_i
    qy = -sin_n * sin_o + cos_n * cos_o * cos_i
    qz = cos_o * sin_i

    # Position in J2000 Ecliptic
    X = x_prime * px + y_prime * qx
    Y = x_prime * py + y_prime * qy
    Z = x_prime * pz + y_prime * qz

    # Velocity in orbital plane (AU/day)
    # v_x' = -sqrt(mu * a) / r * sin(E)
    # v_y' =  sqrt(mu * a * (1 - e^2)) / r * cos(E)
    sqrt_mu_a = math.sqrt(HELIOCENTRIC_MU_AU_DAY * a)
    vx_prime = -sqrt_mu_a / r_au * math.sin(E_rad)
    vy_prime = sqrt_mu_a * math.sqrt(1.0 - e * e) / r_au * math.cos(E_rad)

    VX = vx_prime * px + vy_prime * qx
    VY = vx_prime * py + vy_prime * qy
    VZ = vx_prime * pz + vy_prime * qz

    au_day_to_km_s = ASTRONOMICAL_UNIT_KM / 86400.0
    vx_km_s = VX * au_day_to_km_s
    vy_km_s = VY * au_day_to_km_s
    vz_km_s = VZ * au_day_to_km_s
    total_speed_km_s = math.sqrt(vx_km_s**2 + vy_km_s**2 + vz_km_s**2)

    return {
        "planetId": elem["id"],
        "name": elem["name"],
        "naifId": elem["naifId"],
        "semiMajorAxisAU": a,
        "eccentricity": e,
        "inclinationDeg": elem["I"],
        "orbitalPeriodDays": elem["periodDays"],
        "currentDistanceAU": r_au,
        "currentDistanceKm": r_km,
        "positionAU": {"x": X, "y": Y, "z": Z},
        "positionKm": {"x": X * ASTRONOMICAL_UNIT_KM, "y": Y * ASTRONOMICAL_UNIT_KM, "z": Z * ASTRONOMICAL_UNIT_KM},
        "velocityAuPerDay": {"x": VX, "y": VY, "z": VZ},
        "velocityKmPerSec": {"x": vx_km_s, "y": vy_km_s, "z": vz_km_s},
        "totalSpeedKmPerSec": total_speed_km_s,
        "trueAnomalyDeg": math.degrees(nu_rad) % 360.0,
        "meanAnomalyDeg": math.degrees(M_rad) % 360.0,
        "eccentricAnomalyDeg": math.degrees(E_rad) % 360.0,
    }
