from typing import List
import numpy as np
from src.agents.travel_agent.schemas import AccommodationDTO

def stratify_accommodations(accommodations: List[AccommodationDTO]) -> List[AccommodationDTO]:
    """Categorizes accommodations into Barato, Medio, and Caro based on price percentiles."""
    if not accommodations:
        return []
    
    prices = [acc.total_price_estancia for acc in accommodations]
    p33 = np.percentile(prices, 33)
    p66 = np.percentile(prices, 66)
    
    for acc in accommodations:
        if acc.total_price_estancia <= p33:
            acc.price_category = "Barato"
        elif acc.total_price_estancia <= p66:
            acc.price_category = "Medio"
        else:
            acc.price_category = "Caro"
            
    return accommodations
