# 🌍 Travel Orchestrator Agent v4.0.0

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688?logo=fastapi&style=flat-square)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&style=flat-square)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-38B2AC?logo=tailwindcss&style=flat-square)](https://tailwindcss.com)

**Travel Orchestrator Agent** is an advanced AI-powered platform for intelligent trip planning and agentic execution. It leverages high-performance Large Language Models (LLMs) and real-time data scraping to deliver verified itineraries, premium logistics, and actionable travel insights through a state-of-the-art interactive interface.

---

## ✨ Key Features

- **🤖 Intelligent Orchestration**: Uses AI agents (powered by Groq/LangChain) to coordinate between different research tasks (flights, hotels, activities).
- **✈️ Real-time Flight Search**: Scrapes live data from top platforms (Skyscanner, Google Flights, Kayak, Kiwi) with robust fallback mechanisms.
- **🏨 Accommodation Sourcing**: Finds verified hotel options through Booking, Airbnb, and Google Hotels, stratified by price tiers.
- **🎭 Activity Discovery**: Tailors cultural, adventure, and culinary recommendations based on user interests.
- **🌦️ Weather Intelligence**: Provides monthly weather summaries for target destinations.
- **⚡ Performance First**: Strict timeout enforcement (8s) on network requests to ensure a responsive UX.
- **📱 Premium Frontend**: Built with React 19, Vite 8, and Framer Motion for a fluid, glassmorphic design.

---

## 🛠️ Tech Stack

### Backend

- **Core**: Python 3.10+, FastAPI.
- **AI/LLM**: LangChain, Groq API.
- **Networking**: Asynchronous `aiohttp` for high-performance scraping.
- **Caching**: Flexible caching layer for search results and weather data.

### Frontend

- **Framework**: React 19 (Vite 8).
- **Styling**: Tailwind CSS v4, Lucide Icons.
- **Animations**: Framer Motion.
- **State/Routing**: React Router Dom, Axios.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com/)

### Backend Setup

1. Navigate to the root directory:

   ```bash
   cd travel-orchestrator-agent
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

5. Start the server:

   ```bash
   python main.py
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:

   ```bash
   cd travel-orchestrator-agent/frontend
   ```

2. Install packages:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

---

## 🗺️ Roadmap

- [ ] Support for multi-destination trips.
- [ ] Integration with Google Calendar for itinerary export.
- [ ] Offline caching for mobile users.
- [ ] Advanced budget tracking and price alerts.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

Developed with ❤️ by **Hugo Cano**
