import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Layout } from "./components/Layout"
import { LandingPage } from "./pages/LandingPage"
import { PlannerPage } from "./pages/PlannerPage"
import { ResultsPage } from "./pages/ResultsPage"
import { ItineraryPage } from "./pages/ItineraryPage"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="mission/:id" element={<ResultsPage />} />
          <Route path="mission/:id/itinerary" element={<ItineraryPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
