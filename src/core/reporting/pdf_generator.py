from fpdf import FPDF
from datetime import date
from typing import List
from src.agents.travel_agent.schemas import AccommodationDTO

class TravelReportPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 15)
        self.cell(0, 10, 'Travel Orchestrator Agent - Mission Report', 0, 1, 'C')
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

def generate_accommodation_report(dest_name: str, accommodations: List[AccommodationDTO], output_path: str):
    pdf = TravelReportPDF()
    pdf.add_page()
    
    # Mission Info
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 10, f'Mission: {dest_name}', 0, 1)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 10, f'Date: {date.today().strftime("%Y-%m-%d")}', 0, 1)
    pdf.ln(5)
    
    # Accommodations
    for i, acc in enumerate(accommodations, 1):
        pdf.set_font('Helvetica', 'B', 11)
        pdf.cell(0, 10, f'{i}. {acc.name}', 0, 1)
        
        pdf.set_font('Helvetica', '', 10)
        pdf.cell(0, 8, f'Price: {acc.total_price_estancia} EUR', 0, 1)
        pdf.cell(0, 8, f'Rating: {acc.rating} ({acc.review_count} reviews)', 0, 1)
        pdf.cell(0, 8, f'Distance to Hub: {acc.distance_to_transport}m', 0, 1)
        pdf.cell(0, 8, f'Property Type: {"Apartment/Villa" if acc.is_apartment_or_villa else "Other"}', 0, 1)
        
        # Link
        pdf.set_text_color(0, 0, 255)
        pdf.cell(0, 8, 'View on Website', link=acc.url, ln=1)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        
    pdf.output(output_path)
