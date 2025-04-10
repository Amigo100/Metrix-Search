# predictive_backend/app/preprocessing.py

import pandas as pd
import numpy as np
from .schemas import PredictionInput
from sklearn.impute import SimpleImputer
from typing import Optional
import datetime

FEATURE_ORDER = [
    'Age (Ord0al)',
    'Sex',
    'Patients in ED at time of arrival',
    'Ahead in Queue',
    'Month (Sine)',
    'Month (Cosine)',
    'Day (Sine)',
    'Day (Cosine)',
    'Hours (Sine)',
    'Hours (Cosine)',
    'TC One',
    'TC Two',
    'TC Three',
    'TC Four',
    'TC Five',
    'Accident',
    'Ambulance',
    'Self Referral',
    'General Practitoner',
    'Medical Centre',
    'Civilian',
    'Hospital',
    'Other',
    'Temp or Fever',
    'Altered mental status / Confusion',
]

def preprocess_input(inputs: PredictionInput, imputer: Optional[SimpleImputer]) -> pd.DataFrame:
    print("Preprocessing input:", inputs.dict())
    try:
        feature_data = {}

        # Basic Mappings
        feature_data['Age (Ord0al)'] = inputs.age
        feature_data['Sex'] = 1 if inputs.gender == 'male' else 0
        feature_data['Patients in ED at time of arrival'] = inputs.patientsInED
        feature_data['Ahead in Queue'] = inputs.patientsAhead
        feature_data['Accident'] = 1 if inputs.isAccident else 0
        feature_data['Temp or Fever'] = 1 if inputs.hasFever else 0
        feature_data['Altered mental status / Confusion'] = 1 if inputs.alteredMentalStatus else 0

        # DateTime Featurization
        dt = inputs.dateTime
        month = dt.month
        day_of_week = dt.weekday() + 1  # Monday=0 => +1 for Monday=1
        hour = dt.hour
        feature_data['Month (Sine)'] = np.sin(2 * np.pi * month / 12.0)
        feature_data['Month (Cosine)'] = np.cos(2 * np.pi * month / 12.0)
        feature_data['Day (Sine)'] = np.sin(2 * np.pi * day_of_week / 7.0)
        feature_data['Day (Cosine)'] = np.cos(2 * np.pi * day_of_week / 7.0)
        feature_data['Hours (Sine)'] = np.sin(2 * np.pi * hour / 24.0)
        feature_data['Hours (Cosine)'] = np.cos(2 * np.pi * hour / 24.0)

        # Triage Code One-Hot Encoding (OHE)
        tc_map = {1: 'TC One', 2: 'TC Two', 3: 'TC Three', 4: 'TC Four', 5: 'TC Five'}
        for i in range(1, 6):
            col_name = tc_map[i]
            feature_data[col_name] = 1 if inputs.triageCode == i else 0

        # Referral Source OHE
        ref_map = {
            'ambulance': 'Ambulance',
            'self': 'Self Referral',
            'gp': 'General Practitoner',
            'clinic': 'Medical Centre',
            'other': 'Other'
        }
        possible_ref_cols = ['Ambulance', 'Self Referral', 'General Practitoner', 'Medical Centre', 'Civilian', 'Hospital', 'Other']
        for col in possible_ref_cols:
            feature_data[col] = 0
        if inputs.referralSource in ref_map:
            col = ref_map[inputs.referralSource]
            feature_data[col] = 1
        else:
            feature_data['Other'] = 1

        # Create DataFrame in the correct feature order
        df = pd.DataFrame([feature_data])
        df = df.reindex(columns=FEATURE_ORDER)

        # Apply imputation if an imputer is provided
        if imputer:
            df_array = imputer.transform(df)
            df = pd.DataFrame(df_array, columns=FEATURE_ORDER)
        else:
            if df.isnull().values.any():
                df = df.fillna(0)

        df = df.astype(float)
        return df

    except Exception as e:
        print(f"Preprocessing error: {e}")
        raise ValueError(f"Input preprocessing failed: {e}")
