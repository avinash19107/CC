"""
backend/app/models.py
Pydantic data schemas for API requests and responses.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class FlowRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    Destination_Port: float = Field(alias="Destination Port", default=80.0)
    Flow_Duration: float = Field(alias="Flow Duration", default=1000.0)
    Total_Fwd_Packets: float = Field(alias="Total Fwd Packets", default=1.0)
    Total_Backward_Packets: float = Field(alias="Total Backward Packets", default=1.0)
    Total_Length_of_Fwd_Packets: float = Field(alias="Total Length of Fwd Packets", default=100.0)
    Total_Length_of_Bwd_Packets: float = Field(alias="Total Length of Bwd Packets", default=200.0)
    Fwd_Packet_Length_Max: float = Field(alias="Fwd Packet Length Max", default=100.0)
    Fwd_Packet_Length_Min: float = Field(alias="Fwd Packet Length Min", default=0.0)
    Fwd_Packet_Length_Mean: float = Field(alias="Fwd Packet Length Mean", default=50.0)
    Bwd_Packet_Length_Max: float = Field(alias="Bwd Packet Length Max", default=200.0)
    Bwd_Packet_Length_Min: float = Field(alias="Bwd Packet Length Min", default=0.0)
    Bwd_Packet_Length_Mean: float = Field(alias="Bwd Packet Length Mean", default=100.0)
    Flow_Bytes_s: float = Field(alias="Flow Bytes/s", default=1000.0)
    Flow_Packets_s: float = Field(alias="Flow Packets/s", default=10.0)
    Flow_IAT_Mean: float = Field(alias="Flow IAT Mean", default=500.0)
    Flow_IAT_Max: float = Field(alias="Flow IAT Max", default=1000.0)
    Fwd_IAT_Mean: float = Field(alias="Fwd IAT Mean", default=500.0)
    Bwd_IAT_Mean: float = Field(alias="Bwd IAT Mean", default=500.0)
    FIN_Flag_Count: float = Field(alias="FIN Flag Count", default=0.0)
    SYN_Flag_Count: float = Field(alias="SYN Flag Count", default=0.0)
    RST_Flag_Count: float = Field(alias="RST Flag Count", default=0.0)
    PSH_Flag_Count: float = Field(alias="PSH Flag Count", default=0.0)
    ACK_Flag_Count: float = Field(alias="ACK Flag Count", default=1.0)
    URG_Flag_Count: float = Field(alias="URG Flag Count", default=0.0)
    Protocol: float = Field(alias="Protocol", default=6.0)

class ReplayRequest(BaseModel):
    batch_size: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

class IngestResponse(BaseModel):
    status: str
    total_received: int
    valid_count: int
    dropped_count: int
    message: str

class ReplayBatchResponse(BaseModel):
    total_available: int
    offset: int
    count: int
    flows: List[Dict[str, Any]]

class PredictionResult(BaseModel):
    flow_id: str
    prediction: int # 0: Benign, 1: Malicious
    label: str # "Benign" or "Malicious"
    malicious_probability: float
    risk_score: float
    risk_level: str # "Low", "Medium", "High"
    anomaly_score: float
    is_anomaly: bool
    top_features: List[Dict[str, Any]] = []
    alert_text: Optional[str] = None
    simulated_action: Optional[str] = None

class BatchPredictRequest(BaseModel):
    flows: List[Dict[str, Any]]

