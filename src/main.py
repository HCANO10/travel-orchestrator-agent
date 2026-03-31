import asyncio
from src.agents.travel_agent.graph import compiled_graph
from langchain_core.messages import HumanMessage

async def main():
    print("--- Starting Travel Orchestrator Agent ---")
    
    # Input example prompt
    sample_input = {
        "messages": [HumanMessage(content="Busca apartamentos en Salerno para 6 adultos del 15 al 22 de junio de 2026")],
        "results": [],
        "iterations": 0
    }
    
    # Executing the Graph
    async for event in compiled_graph.astream(sample_input):
        for node_name, output in event.items():
            print(f"Node: {node_name}")
            if "request" in output and output["request"]:
                print(f"  Request Parsed: {output['request']}")
            if "results" in output and output["results"]:
                print(f"  Results Found: {len(output['results'])} accommodations.")
                for acc in output["results"]:
                    print(f"    - {acc.name}: {acc.price_eur} EUR (Rating: {acc.rating})")
            if "error" in output and output["error"]:
                print(f"  Error: {output['error']}")

if __name__ == "__main__":
    asyncio.run(main())
