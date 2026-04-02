import React, { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icons broken by Vite/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

const originIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const destIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Coords {
  lat: number
  lng: number
  label: string
}

async function geocode(place: string): Promise<Coords | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
      { headers: { "Accept-Language": "es" } }
    )
    const data = await res.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: place }
  } catch {
    return null
  }
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length >= 2) {
      map.fitBounds(coords as L.LatLngBoundsExpression, { padding: [40, 40] })
    } else if (coords.length === 1) {
      map.setView(coords[0], 7)
    }
  }, [coords, map])
  return null
}

interface TripMapProps {
  origin: string
  destination: string
}

export const TripMap: React.FC<TripMapProps> = ({ origin, destination }) => {
  const [originCoords, setOriginCoords] = useState<Coords | null>(null)
  const [destCoords, setDestCoords] = useState<Coords | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!origin || !destination) return
    setLoading(true)
    Promise.all([geocode(origin), geocode(destination)]).then(([o, d]) => {
      setOriginCoords(o)
      setDestCoords(d)
      setLoading(false)
    })
  }, [origin, destination])

  if (loading) {
    return (
      <div className="h-48 rounded-2xl bg-slate-50 flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!originCoords && !destCoords) return null

  const points: [number, number][] = [
    ...(originCoords ? [[originCoords.lat, originCoords.lng] as [number, number]] : []),
    ...(destCoords ? [[destCoords.lat, destCoords.lng] as [number, number]] : []),
  ]

  return (
    <div className="rounded-2xl overflow-hidden ring-1 ring-slate-100 shadow-sm">
      <MapContainer
        center={points[0] ?? [40, -3]}
        zoom={5}
        style={{ height: "220px", width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© OpenStreetMap'
        />
        <FitBounds coords={points} />

        {originCoords && (
          <Marker position={[originCoords.lat, originCoords.lng]} icon={originIcon}>
            <Popup>
              <span className="font-bold text-violet-700">Origen: {originCoords.label}</span>
            </Popup>
          </Marker>
        )}

        {destCoords && (
          <Marker position={[destCoords.lat, destCoords.lng]} icon={destIcon}>
            <Popup>
              <span className="font-bold text-rose-600">Destino: {destCoords.label}</span>
            </Popup>
          </Marker>
        )}

        {originCoords && destCoords && (
          <Polyline
            positions={points}
            pathOptions={{ color: "#7c3aed", weight: 2, dashArray: "6 6", opacity: 0.7 }}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-slate-50 text-xs font-bold">
        <span className="flex items-center gap-1.5 text-violet-600">
          <span className="h-2 w-2 rounded-full bg-violet-500" /> {origin}
        </span>
        <span className="text-slate-300">→</span>
        <span className="flex items-center gap-1.5 text-rose-500">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> {destination}
        </span>
      </div>
    </div>
  )
}
