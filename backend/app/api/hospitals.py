from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user_or_doctor

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

def haversine_distance(lat1, lon1, lat2, lon2):
    # Radius of the Earth in km
    R = 6371.0
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

@router.get("", response_model=List[schemas.HospitalResponse])
def get_hospitals(
    type: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    db: Session = Depends(get_db),
    current = Depends(get_current_user_or_doctor)
):
    query = db.query(models.Hospital)
    if type:
        query = query.filter(models.Hospital.type.ilike(type))
        
    results = query.all()
    
    # If coordinates are shared, compute distance and inject/sort
    # To return distance, we can dynamically add it or serialize it.
    # For now, if lat & lon are provided, we will calculate the distance
    # and sort the results by distance.
    if lat is not None and lon is not None:
        # Sort results based on distance
        results.sort(key=lambda h: haversine_distance(lat, lon, h.latitude, h.longitude))
        
    return results
