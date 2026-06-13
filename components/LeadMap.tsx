"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Lead } from "@/lib/types";

// Component to automatically fit the map bounds to all lead pins
function MapBoundsFitter({ leads }: { leads: Lead[] }) {
  const map = useMap();

  useEffect(() => {
    const validLeads = leads.filter(
      (l) => typeof l.lat === "number" && typeof l.lng === "number" && !isNaN(l.lat)
    );

    if (validLeads.length > 0) {
      const bounds = L.latLngBounds(validLeads.map((l) => [l.lat, l.lng]));
      // Fit bounds with a nice padding and a smooth animation
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16, duration: 1.5 });
    }
  }, [leads, map]);

  return null;
}

export default function LeadMap({
  leads,
  hoveredLeadId,
}: {
  leads: Lead[];
  hoveredLeadId?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[320px] rounded-lg border border-dashed border-border bg-card/50"></div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="h-[320px] rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
        Map appears once leads are scraped
      </div>
    );
  }

  // Create a dynamic custom icon based on whether it is currently hovered in the sidebar
  const createCustomIcon = (isHovered: boolean) => {
    return L.divIcon({
      className: "custom-map-pin",
      html: `
        <div class="pin-wrapper ${isHovered ? "hovered" : ""}">
          <div class="pin-drop"></div>
          <div class="pin-pulse"></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30], // Anchor at the bottom center of the pin
      popupAnchor: [0, -32], // Popup opens just above the pin
    });
  };

  const validLeads = leads.filter(
    (l) => typeof l.lat === "number" && typeof l.lng === "number" && !isNaN(l.lat)
  );

  return (
    <div className="h-[320px] rounded-lg overflow-hidden border border-border shadow-inner relative z-0">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        {/* Sleek light map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapBoundsFitter leads={validLeads} />

        {/* Group markers that are close together */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
          showCoverageOnHover={false}
        >
          {validLeads.map((l) => (
            <Marker
              key={l.id}
              position={[l.lat, l.lng]}
              icon={createCustomIcon(l.id === hoveredLeadId)}
              zIndexOffset={l.id === hoveredLeadId ? 1000 : 0}
            >
              <Popup className="premium-popup">
                <div className="flex flex-col gap-1 p-1 min-w-[180px]">
                  <div className="font-bold text-sm leading-tight text-foreground">{l.name}</div>
                  
                  {l.rating && (
                    <div className="flex items-center gap-1 text-xs mt-1">
                      <span className="text-[#FFB800] text-sm">★</span>
                      <span className="font-semibold text-foreground">{l.rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">({l.reviewsCount})</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {l.address}
                  </div>
                  
                  {l.phone && (
                    <div className="text-xs font-medium text-foreground mt-2 border-t border-border pt-2">
                      {l.phone}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
