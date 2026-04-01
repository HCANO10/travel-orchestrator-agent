import asyncio
import logging
from backend.models.mission_state import MissionState
from src.agents.travel_agent.graph import compiled_graph

# Configure logging to see node transitions
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_full_workflow():
    """
    Test script to simulate the full LangGraph flow with a travel prompt.
    """
    print("🚀 Initializing Test Workflow...")
    
    initial_state = MissionState(
        mission_id="test_mission_001",
        messages=[{"role": "user", "content": "I want to go to Tokyo for 7 days next month, style is mixed."}]
    )
    
    try:
        # Run the graph with a global 60s timeout
        print("🛠️ Invoking Graph...")
        final_state = await asyncio.wait_for(compiled_graph.ainvoke(initial_state), timeout=60.0)
        
        print(f"✅ Workflow Finished. Status: {final_state.get('status')}")
        print(f"📊 Nodes Completed: {final_state.get('nodes_completed')}")
        
        # Validate critical fields
        travel_req = final_state.get("travel_request")
        if travel_req:
            # If it's a dict, convert or access
            dest = getattr(travel_req, 'destination', 'unknown') if not isinstance(travel_req, dict) else travel_req.get('destination')
            print(f"📍 Extracted Destination: {dest}")
        
        if final_state.get("itinerary"):
            print(f"📅 Itinerary generated with {len(final_state['itinerary'])} days.")
            
        if final_state.get("accommodations_comfort"):
            print(f"🏨 Found {len(final_state['accommodations_comfort'])} comfort accommodations.")

        print("🎉 Full workflow test completed successfully.")
        
    except Exception as e:
        print(f"❌ Workflow test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_full_workflow())
