"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

interface MapMarker {
  id: string
  lat: number
  lng: number
  label?: string
  risk?: number
  color?: string
  size?: number
  detail?: string
}

interface MapboxMapProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: number
  interactive?: boolean
  onMarkerClick?: (marker: MapMarker) => void
}

export type { MapMarker }

export function MapboxMap({
  markers,
  center: defaultCenter = [77.6, 12.97],
  zoom: defaultZoom = 5,
  height = 400,
  interactive = true,
  onMarkerClick,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const configRef = useRef({ center: defaultCenter, zoom: defaultZoom, interactive })
  const [loaded, setLoaded] = useState(false)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!token || !mapContainer.current || mapRef.current) return
    const cfg = configRef.current
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: cfg.center,
      zoom: cfg.zoom,
      interactive: cfg.interactive,
      attributionControl: false,
    })
    map.addControl(new mapboxgl.NavigationControl(), "bottom-right")
    map.on("load", () => setLoaded(true))
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [token])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !loaded) return
    markers.forEach((m) => {
      const el = document.createElement("div")
      el.className = "relative group cursor-pointer"
      el.style.width = "28px"
      el.style.height = "28px"
      el.innerHTML = `<div style="
        width: ${m.size ?? 28}px;
        height: ${m.size ?? 28}px;
        border-radius: 50%;
        background: ${m.color ?? "#7B241C"};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">${m.risk ?? ""}</div>`
      if (m.detail) {
        const tooltip = document.createElement("div")
        tooltip.className = "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
        tooltip.style.cssText = "background: white; border: 1px solid #E7DDD1; border-radius: 8px; padding: 6px 10px; font-size: 12px; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
        tooltip.textContent = `${m.label ?? ""}${m.detail ? ` — ${m.detail}` : ""}`
        el.appendChild(tooltip)
      }
      if (onMarkerClick) {
        el.addEventListener("click", () => onMarkerClick(m))
      }
      new mapboxgl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map)
    })
  }, [markers, loaded, onMarkerClick])

  if (!token) {
    return (
      <div
        className="flex items-center justify-center bg-surface border border-card-border rounded-xl text-sm text-muted-foreground"
        style={{ height }}
      >
        Set NEXT_PUBLIC_MAPBOX_TOKEN in .env to enable the map
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className="rounded-xl overflow-hidden border border-card-border"
      style={{ height, width: "100%" }}
    />
  )
}
