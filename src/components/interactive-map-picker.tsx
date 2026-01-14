"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { MapPin, LocateFixed } from "lucide-react";

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface InteractiveMapPickerProps {
  initialLat: number;
  initialLng: number;
  onSelect: (lat: number, lng: number, radius: number) => void;
  onCancel: () => void;
  initialRadius?: number;
}

export default function InteractiveMapPicker({
  initialLat,
  initialLng,
  onSelect,
  onCancel,
  initialRadius = 500,
}: InteractiveMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [position, setPosition] = useState({
    lat: initialLat,
    lng: initialLng,
  });
  const [radius, setRadius] = useState(initialRadius);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([position.lat, position.lng], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Create draggable marker
    const marker = L.marker([position.lat, position.lng], {
      draggable: true,
    }).addTo(map);

    // Create radius circle
    const circle = L.circle([position.lat, position.lng], {
      radius: radius,
      color: "#dc2626",
      fillColor: "#dc2626",
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);

    // Handle marker drag
    marker.on("dragend", () => {
      const latlng = marker.getLatLng();
      setPosition({ lat: latlng.lat, lng: latlng.lng });
      circle.setLatLng(latlng);
    });

    // Handle map click to move marker
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      circle.setLatLng([lat, lng]);
      setPosition({ lat, lng });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker/circle when position changes via input
  useEffect(() => {
    if (markerRef.current && circleRef.current && mapInstanceRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
      circleRef.current.setLatLng([position.lat, position.lng]);
      mapInstanceRef.current.setView([position.lat, position.lng]);
    }
  }, [position.lat, position.lng]);

  // Update circle radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          alert("Could not get your location: " + err.message);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <strong>Drag the marker</strong> or <strong>click on the map</strong> to
        set the location. Adjust the <strong>radius</strong> to set the
        geofence.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Latitude</label>
          <Input
            type="number"
            step="0.000001"
            value={position.lat}
            onChange={(e) =>
              setPosition({ ...position, lat: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Longitude</label>
          <Input
            type="number"
            step="0.000001"
            value={position.lng}
            onChange={(e) =>
              setPosition({ ...position, lng: parseFloat(e.target.value) || 0 })
            }
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Radius (meters)</label>
          <Input
            type="number"
            min="100"
            max="1000"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value) || 100)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={handleLocateMe}
        >
          <LocateFixed className="h-4 w-4 mr-2" />
          Locate Me
        </Button>
      </div>

      {/* Interactive Leaflet Map */}
      <div
        ref={mapRef}
        className="w-full h-[350px] border rounded-lg overflow-hidden z-0 shadow-inner"
      />

      <div className="flex items-center gap-2 text-sm bg-zinc-50 p-2 rounded-md border border-zinc-100">
        <div className="w-3 h-3 rounded-full bg-red-600/30 border border-red-600" />
        <span className="text-zinc-600 font-medium">
          Target Geofence:{" "}
          <span className="text-red-600 font-bold">{radius}m</span> radius
        </span>
      </div>

      <DialogFooter className="pt-2 border-t mt-4 gap-2 sm:gap-0">
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          className="bg-red-600 hover:bg-red-700 w-full sm:w-auto shadow-sm"
          onClick={() => onSelect(position.lat, position.lng, radius)}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Confirm & Save
        </Button>
      </DialogFooter>
    </div>
  );
}
