import asyncio
from typing import List, Type, Dict
from playwright.async_api import async_playwright
from langchain.tools import BaseTool
from pydantic import BaseModel, Field

from src.core.cache.redis_client import with_cache

class ResearchInput(BaseModel):
    destination: str = Field(..., description="The travel destination to research")

class DestinationResearchTool(BaseTool):
    name: str = "destination_researcher"
    description: str = "Researches best neighborhoods, airports, and hubs for a destination."
    args_schema: Type[BaseModel] = ResearchInput

    async def _run(self, destination: str) -> str:
        return await self._run_research(destination)

    @with_cache(ttl=86400)
    async def _run_research(self, destination: str) -> str:
        async with async_playwright() as p:
            print(f"DEBUG: RESEARCHING Logistical details for {destination}...")
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            query = f"mejor zona alojamiento {destination} aeropuertos y transporte"
            url = f"https://www.google.com/search?q={query}"
            
            content = "Research failed to fetch remote data. (Expert: No inventions allowed)"
            try:
                await page.goto(url, wait_until="networkidle")
                # Extract text from the page
                snippet_el = await page.query_selector('div.VwiC3b') # Google search snippets
                if snippet_el:
                    content = await snippet_el.inner_text()
                    
                # Optionally search for distance to hubs
                # This could be more sophisticated
                
            except Exception as e:
                print(f"Research tool error: {e}")
                
            await browser.close()
            return content
