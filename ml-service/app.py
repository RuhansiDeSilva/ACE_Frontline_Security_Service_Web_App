from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib, numpy as np, sys, types, warnings

warnings.filterwarnings('ignore')

# ── Custom module fix (models save කරපු විදිහ නිසා) ──
import sklearn.ensemble
_mod = types.ModuleType('RandomForestClassifier')
_mod.RandomForestClassifier = sklearn.ensemble.RandomForestClassifier
_mod.dtype = np.dtype
sys.modules['RandomForestClassifier'] = _mod

app = FastAPI(title="Security Risk ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models load ──
pkg1 = joblib.load("final_model_package.pkl")
pkg2 = joblib.load("final_model2_package.pkl")

risk_model    = pkg1["model"]     # Classifier → 0,1,2
officer_model = pkg2["model"]     # Regressor
officer_scaler = pkg2["scaler"]   # StandardScaler

RISK_LABELS = {0: "Low", 1: "Medium", 2: "High"}

# ── Request schema ──
class SiteRequest(BaseModel):
    company_name: str        # Added for report metadata
    employee_count: int
    required_officers: int
    distance_to_city_km: float
    company_assets: float
    cctv_count: int
    company_type: str        # "Retail", "Healthcare", "Education" etc.
    urban_rural: str         # "urban" or "rural"
    night_activity: bool
    nearest_city: str        # "Kandy", "Galle", "Negombo" etc.
    major_event_nearby: bool
    cash_handling: bool

def build_vector(features_list, data: SiteRequest, risk_level: int = None):
    """Feature vector build කරන්න — features list order follow කරලා"""
    vec = {col: 0 for col in features_list}

    # Numeric
    if 'employee_count'              in vec: vec['employee_count']              = data.employee_count
    if 'required_officers'           in vec: vec['required_officers']           = data.required_officers
    if 'Distance to main city(Km)'   in vec: vec['Distance to main city(Km)']   = data.distance_to_city_km
    if 'company_assests'             in vec: vec['company_assests']             = data.company_assets
    if 'cctv_count'                  in vec: vec['cctv_count']                  = data.cctv_count

    # One-hot: company type
    ct_key = f"company_type_{data.company_type}"
    if ct_key in vec: vec[ct_key] = 1

    # One-hot: urban/rural
    if data.urban_rural.lower() == "urban" and 'Urban/Rural_urban' in vec:
        vec['Urban/Rural_urban'] = 1

    # One-hot: nearest city
    city_key = f"Nearest Main City_{data.nearest_city}"
    if city_key in vec: vec[city_key] = 1

    # Boolean flags
    if 'Night_activity_Yes'      in vec: vec['Night_activity_Yes']      = 1 if data.night_activity else 0
    if 'major_event_nearby_Yes'  in vec: vec['major_event_nearby_Yes']  = 1 if data.major_event_nearby else 0
    if 'cash_handling_Yes'       in vec: vec['cash_handling_Yes']       = 1 if data.cash_handling else 0

    # Model 2 ට risk level feature ඕනෑ
    if 'predicted_risk_level' in vec and risk_level is not None:
        vec['predicted_risk_level'] = risk_level

    return np.array([[vec[col] for col in features_list]])


@app.post("/predict")
def predict_all(data: SiteRequest):
    """Risk + Officer count එකට return කරනවා"""
    try:
        # Step 1: Risk prediction
        X1 = build_vector(pkg1["features"], data)
        risk_code = int(risk_model.predict(X1)[0])
        risk_label = RISK_LABELS[risk_code]
        
        # Diagnostic logging
        print(f"--- Prediction Request: {data.company_name} ---")
        print(f"X1 Vector (Risk): {X1.tolist()}")
        print(f"Non-zero features (X1): {np.count_nonzero(X1)}")

        # Step 2: Officer count (risk level ද pass කරනවා)
        X2 = build_vector(pkg2["features"], data, risk_level=risk_code)
        X2_scaled = officer_scaler.transform(X2)
        officer_count = int(round(float(officer_model.predict(X2_scaled)[0])))
        
        print(f"X2 Vector (Officers): {X2.tolist()}")
        print(f"Non-zero features (X2): {np.count_nonzero(X2)}")
        print(f"Result: {risk_label} risk, {officer_count} officers")

        return {
            "risk_level_code":  risk_code,
            "risk_level":       risk_label,
            "officer_count":    officer_count
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}