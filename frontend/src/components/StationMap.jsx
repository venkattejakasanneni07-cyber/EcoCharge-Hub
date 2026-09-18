import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom green marker
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Auto-fit map bounds to markers
const FitBounds = ({ stations }) => {
  const map = useMap();

  useEffect(() => {
    if (!stations || stations.length === 0) return;

    const valid = stations.filter(
      (s) =>
        s.latitude &&
        s.longitude &&
        !isNaN(parseFloat(s.latitude)) &&
        !isNaN(parseFloat(s.longitude))
    );

    if (valid.length === 0) return;

    try {
      const bounds = L.latLngBounds(
        valid.map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    } catch (err) {
      console.error('FitBounds error:', err);
    }
  }, [stations, map]);

  return null;
};

const StationMap = ({ stations = [], center = [22.5, 78.9], zoom = 5 }) => {
  // Filter valid stations with India coordinates
  const validStations = stations.filter(
    (s) =>
      s.latitude &&
      s.longitude &&
      !isNaN(parseFloat(s.latitude)) &&
      !isNaN(parseFloat(s.longitude)) &&
      parseFloat(s.latitude) >= 6 &&
      parseFloat(s.latitude) <= 38 &&
      parseFloat(s.longitude) >= 68 &&
      parseFloat(s.longitude) <= 98
  );

  return (
    <div
      style={{
        height: '600px',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid var(--border)',
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validStations.length > 0 && <FitBounds stations={validStations} />}

        {validStations.map((station) => (
          <Marker
            key={station.id}
            position={[
              parseFloat(station.latitude),
              parseFloat(station.longitude),
            ]}
            icon={greenIcon}
          >
            <Popup>
              <div
                style={{
                  padding: '8px',
                  minWidth: '220px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <strong
                    style={{
                      color: '#17201a',
                      fontSize: '14px',
                      fontWeight: '700',
                    }}
                  >
                    {station.operator || station.name || 'Station'}
                  </strong>
                </div>

                {station.name && station.name !== station.operator && (
                  <p
                    style={{
                      margin: '2px 0 6px 0',
                      fontSize: '11px',
                      color: '#8b9590',
                    }}
                  >
                    {station.name.substring(0, 70)}
                  </p>
                )}

                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '12px',
                    color: '#66736a',
                  }}
                >
                  📍{' '}
                  {[station.city, station.district, station.state]
                    .filter(Boolean)
                    .join(', ') || 'Unknown'}
                </p>

                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '11px',
                    color: '#66736a',
                  }}
                >
                  🔌 {station.chargerTypes || station.chargerType || 'Type-II'} • ⚡{' '}
                  {station.chargerRating || station.power || 'N/A'} kW •{' '}
                  {station.connectorCount || station.chargers || 0} connector
                  {(station.connectorCount || station.chargers || 0) !== 1 ? 's' : ''}
                </p>

                <button
                  style={{
                    marginTop: '8px',
                    width: '100%',
                    padding: '6px 12px',
                    background: '#238636',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    fontFamily: 'inherit',
                  }}
                  onClick={() => {
                    window.location.href = `/stations/${station.id}`;
                  }}
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Info badge */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          background: 'white',
          padding: '8px 14px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '13px',
          fontWeight: '600',
          color: '#17201a',
        }}
      >
        📍 {validStations.length} stations on map
      </div>
    </div>
  );
};

export default StationMap;