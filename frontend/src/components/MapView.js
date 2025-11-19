// src/components/MapView.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Remove this import unless you actually render an L.Routing control component
// import "leaflet-routing-machine";

// Fix default marker icons in bundlers
import marker2x from "leaflet/dist/images/marker-icon-2x.png";
import marker from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: marker2x,
  iconUrl: marker,
  shadowUrl: markerShadow,
});

// Normalize inputs to [lat, lng]
const toLatLngTuple = (loc) => {
  if (!loc) return null;
  // {lat, lng}
  if (typeof loc.lat === "number" && typeof loc.lng === "number") {
    const a = Number(loc.lat), b = Number(loc.lng);
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  }
  // {coordinates:{lat,lng}}
  if (loc.coordinates && typeof loc.coordinates.lat === "number" && typeof loc.coordinates.lng === "number") {
    const a = Number(loc.coordinates.lat), b = Number(loc.coordinates.lng);
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  }
  // [lat, lng]
  if (Array.isArray(loc) && loc.length === 2) {
    const a = Number(loc[0]), b = Number(loc[1]);
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  }
  return null;
};

const MapView = ({ pickup, delivery, center, height = 400, zoom = 13 }) => {
  const defaultCenter = Array.isArray(center) && center.length === 2 ? center : [12.9716, 77.5946];
  const pA = toLatLngTuple(pickup);
  const pB = toLatLngTuple(delivery);

  const positions = [];
  if (pA) positions.push(pA);
  if (pB) positions.push(pB);

  return (
    <div className="rounded-lg shadow-lg" style={{ height }}>
      <MapContainer center={pA || pB || defaultCenter} zoom={zoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {pA && (
          <Marker position={pA}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {pB && (
          <Marker position={pB}>
            <Popup>Delivery Location</Popup>
          </Marker>
        )}

        {positions.length === 2 && (
          <Polyline positions={positions} pathOptions={{ color: "blue", weight: 4 }} />
        )}
      </MapContainer>
    </div>
  );
};

export default MapView;
