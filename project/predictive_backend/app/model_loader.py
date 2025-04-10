# predictive_backend/app/model_loader.py

import joblib
import os
from dotenv import load_dotenv
from sklearn.impute import SimpleImputer
import xgboost as xgb
from typing import Any, Optional, Tuple

# Load environment variables from .env file
load_dotenv()

# --- Global variables to hold loaded objects ---
loaded_breach_model: Optional[Any] = None
loaded_admission_model: Optional[Any] = None
loaded_waiting_model: Optional[Any] = None  # Use Any or a more specific type if desired
loaded_imputer: Optional[SimpleImputer] = None

# --- Constants for default model paths ---
DEFAULT_BREACH_MODEL_PATH = "models/breach_model.pkl"
DEFAULT_ADMISSION_MODEL_PATH = "models/admission_model.pkl"
DEFAULT_WAITING_MODEL_PATH = "models/waiting_model.pkl"
DEFAULT_IMPUTER_PATH = "models/breach_imputer.pkl"  # Assuming the same imputer for all

def load_objects() -> Tuple[Optional[Any], Optional[Any], Optional[Any], Optional[SimpleImputer]]:
    """
    Loads the three ML models (breach, admission, waiting) and the fitted imputer
    from .pkl files using joblib.
    """
    global loaded_breach_model, loaded_admission_model, loaded_waiting_model, loaded_imputer

    # Prevent repeated loading attempts.
    if hasattr(load_objects, '_loaded_attempted') and load_objects._loaded_attempted:
         print("Loading already attempted.")
         return loaded_breach_model, loaded_admission_model, loaded_waiting_model, loaded_imputer

    print("Attempting to load models and imputer...")

    def _load_single_object(file_path: str, object_name: str, expected_type: Optional[type] = None) -> Optional[Any]:
        absolute_path = os.path.join(os.getcwd(), file_path)
        print(f"Attempting to load {object_name} from: {absolute_path}")
        loaded_object = None
        if not os.path.exists(absolute_path):
            print(f"!!! ERROR: {object_name} file not found at {absolute_path} !!!")
        else:
            try:
                loaded_object = joblib.load(absolute_path)
                print(f"{object_name} loaded successfully using joblib from {absolute_path}.")
                print(f"Loaded {object_name} type: {type(loaded_object)}")
                if expected_type and not isinstance(loaded_object, expected_type):
                     print(f"!!! WARNING: Loaded {object_name} type ({type(loaded_object)}) does not match expected type ({expected_type}) !!!")
            except Exception as e:
                print(f"!!! ERROR: Failed to load {object_name} using joblib from {absolute_path}: {e} !!!")
                loaded_object = None
        return loaded_object

    # Load Breach Model
    if loaded_breach_model is None:
        model_path = os.getenv("BREACH_MODEL_PATH", DEFAULT_BREACH_MODEL_PATH)
        loaded_breach_model = _load_single_object(model_path, "Breach Model")
    # Load Admission Model
    if loaded_admission_model is None:
        model_path = os.getenv("ADMISSION_MODEL_PATH", DEFAULT_ADMISSION_MODEL_PATH)
        loaded_admission_model = _load_single_object(model_path, "Admission Model")
    # Load Waiting Time Model
    if loaded_waiting_model is None:
        model_path = os.getenv("WAITING_MODEL_PATH", DEFAULT_WAITING_MODEL_PATH)
        loaded_waiting_model = _load_single_object(model_path, "Waiting Time Model")
    # Load Imputer
    if loaded_imputer is None:
        imputer_path = os.getenv("IMPUTER_PATH", DEFAULT_IMPUTER_PATH)
        loaded_imputer = _load_single_object(imputer_path, "Imputer", expected_type=SimpleImputer)
        if loaded_imputer is None:
             print("!!! Imputer loading failed or file not found. Imputation step will be skipped or use fallback. !!!")

    load_objects._loaded_attempted = True  # Mark that loading has been attempted
    print("Model and imputer loading attempt finished.")
    return loaded_breach_model, loaded_admission_model, loaded_waiting_model, loaded_imputer

def get_model_objects() -> Tuple[Optional[Any], Optional[Any], Optional[Any], Optional[SimpleImputer]]:
    """Returns the loaded model and imputer instances."""
    if not hasattr(load_objects, '_loaded_attempted') or not load_objects._loaded_attempted:
         print("get_model_objects attempting initial load...")
         load_objects()  # Trigger initial load if not yet attempted
    return loaded_breach_model, loaded_admission_model, loaded_waiting_model, loaded_imputer
