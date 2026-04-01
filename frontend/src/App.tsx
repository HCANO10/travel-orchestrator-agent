import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { LandingPage } from "./pages/LandingPage"
import { LoginPage } from "./pages/LoginPage"
import { AuthCallbackPage } from "./pages/AuthCallbackPage"
import { PlannerPage } from "./pages/PlannerPage"
import { ResultsPage } from "./pages/ResultsPage"
import { ItineraryPage } from "./pages/ItineraryPage"
import { MyTripsPage } from "./pages/MyTripsPage"
import { ErrorPage } from "./pages/ErrorPage"

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* App routes with Layout */}
            <Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
              <Route index element={<LandingPage />} />
              <Route
                path="planner"
                element={<ProtectedRoute><PlannerPage /></ProtectedRoute>}
              />
              <Route
                path="mission/:id"
                element={<ProtectedRoute><ResultsPage /></ProtectedRoute>}
              />
              <Route
                path="mission/:id/itinerary"
                element={<ProtectedRoute><ItineraryPage /></ProtectedRoute>}
              />
              <Route
                path="my-trips"
                element={<ProtectedRoute><MyTripsPage /></ProtectedRoute>}
              />
              <Route path="*" element={<ErrorPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
