import jinja2
import os
from typing import List, Dict
from playwright.async_api import async_playwright
from src.agents.travel_agent.schemas import TravelProposalDTO, AccommodationDTO

async def render_professional_pdf(proposal: TravelProposalDTO, output_path: str):
    """Renders a professional PDF using Jinja2 and Playwright for a full Travel Proposal."""
    
    # 1. Prepare Data for Template (Optional grouping logic if still needed)
    # The template now handles the proposal object directly.
    
    # 2. Render HTML with Jinja2
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    env = jinja2.Environment(loader=jinja2.FileSystemLoader(template_dir))
    template = env.get_template("report_template.html")
    
    html_content = template.render(
        proposal=proposal
    )
    
    # 3. Use Playwright to Print to PDF
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.set_content(html_content, wait_until="networkidle")
        
        # High fidelity PDF settings (Margins handled by CSS @page)
        await page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"}
        )
        await browser.close()
