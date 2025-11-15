import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MapView = ({ pickup, delivery, center }) => {
  const defaultCenter = center || [12.9716, 77.5946]; // Bangalore coordinates
  
  const positions = [];
  if (pickup) positions.push([pickup.lat, pickup.lng]);
  if (delivery) positions.push([delivery.lat, delivery.lng]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg shadow-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]}>
          <Popup>Pickup Location</Popup>
        </Marker>
      )}
      
      {delivery && (
        <Marker position={[delivery.lat, delivery.lng]}>
          <Popup>Delivery Location</Popup>
        </Marker>
      )}
      
      {positions.length === 2 && (
        <Polyline positions={positions} color="blue" />
      )}
    </MapContainer>
  );
};

export default MapView;
