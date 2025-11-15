import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Routing component
const RoutingMachine = ({ pickup, delivery }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !pickup || !delivery) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(pickup.lat, pickup.lng),
        L.latLng(delivery.lat, delivery.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: '#4F46E5', weight: 4 }]
      },
      createMarker: () => null, // Don't create default markers
    }).addTo(map);

    return () => map.removeControl(routingControl);
  }, [map, pickup, delivery]);

  return null;
};

const MapView = ({ pickup, delivery, center }) => {
  const defaultCenter = center || [12.9716, 77.5946];

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
      
      {pickup && delivery && (
        <RoutingMachine pickup={pickup} delivery={delivery} />
      )}
    </MapContainer>
  );
};

export default MapView;
