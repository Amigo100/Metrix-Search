# app/schemas.py
from pydantic import BaseModel, Field
from typing import Literal
import datetime

class PredictionInput(BaseModel):
    age: int = Field(..., gt=0, description="Patient Age (Ordinal, Positive Integer)")
    dateTime: datetime.datetime = Field(..., description="Full date/time of arrival (ISO format)")
    gender: Literal['male','female','other','unknown']
    referralSource: Literal['gp','self','ambulance','clinic','other']
    triageCode: int = Field(..., ge=1, le=5)
    patientsAhead: int = Field(..., ge=0)
    patientsInED: int = Field(..., ge=0)
    alteredMentalStatus: bool
    isAccident: bool
    hasFever: bool

    class Config:
        schema_extra = {
            "example": {
                "age": 55,
                "dateTime": "2024-04-06T10:30:00",
                "gender": "female",
                "referralSource": "gp",
                "triageCode": 3,
                "patientsAhead": 4,
                "patientsInED": 50,
                "alteredMentalStatus": False,
                "isAccident": True,
                "hasFever": False
            }
        }

class PredictionOutput(BaseModel):
    wait3h: float = Field(..., ge=0, le=100)
    wait4h: float = Field(..., ge=0, le=100)
    wait5h: float = Field(..., ge=0, le=100)
    wait6h: float = Field(..., ge=0, le=100)
    admissionLikelihood: float = Field(..., ge=0, le=100)
    predictedWaitMinutes: int = Field(..., ge=0)
