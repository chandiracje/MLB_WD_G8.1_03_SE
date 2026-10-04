import React, { useState, useEffect, useRef } from 'react';
import { IconMapPin, IconNavigation, IconX, IconCheck, IconSearch, IconAlert } from './Icons';
import { PREDEFINED_DELIVERY_ROUTES } from '../constants/deliveryRoutes';

// Sri Lanka / Western Province neighborhood coordinates & corridor matching
const SRI_LANKA_PRESET_HUBS = [
  { name: 'Colombo Fort (Col 01)', lat: 6.9344, lng: 79.8428, routeId: 'route-colombo-central', street: 'York Street, Fort, Colombo 01' },
  { name: 'Kollupitiya (Col 03)', lat: 6.9067, lng: 79.8528, routeId: 'route-colombo-central', street: 'Galle Road, Kollupitiya, Colombo 03' },
  { name: 'Bambalapitiya (Col 04)', lat: 6.8905, lng: 79.8580, routeId: 'route-colombo-south', street: 'Duplication Road, Bambalapitiya, Colombo 04' },
  { name: 'Wellawatte (Col 06)', lat: 6.8700, lng: 79.8600, routeId: 'route-colombo-south', street: 'Marine Drive, Wellawatte, Colombo 06' },
  { name: 'Dehiwala', lat: 6.8300, lng: 79.8800, routeId: 'route-colombo-south', street: 'Hill Street, Dehiwala' },
  { name: 'Mount Lavinia', lat: 6.8380, lng: 79.8630, routeId: 'route-colombo-south', street: '45/2 Galle Road, Mount Lavinia' },
  { name: 'Cinnamon Gardens (Col 07)', lat: 6.9100, lng: 79.8700, routeId: 'route-colombo-east', street: 'Havelock / Gregory\'s Road, Colombo 07' },
  { name: 'Rajagiriya & Kotte', lat: 6.9070, lng: 79.8950, routeId: 'route-colombo-east', street: 'Kotte Road, Rajagiriya' },
  { name: 'Battaramulla', lat: 6.8980, lng: 79.9190, routeId: 'route-colombo-east', street: 'Pannipitiya Road, Battaramulla' },
  { name: 'Peliyagoda / Wattala', lat: 6.9650, lng: 79.8900, routeId: 'route-colombo-north', street: 'Negombo Road, Wattala' },
  { name: 'Nugegoda & Kohuwala', lat: 6.8650, lng: 79.8970, routeId: 'route-outer-ring', street: 'Stanley Thilakarathne Mawatha, Nugegoda' },
  { name: 'Maharagama & Kottawa', lat: 6.8480, lng: 79.9260, routeId: 'route-outer-ring', street: 'High Level Road, Maharagama' },
  { name: 'Malabe IT Hub', lat: 6.9040, lng: 79.9540, routeId: 'route-suburban-tech', street: 'Kaduwela Road, Malabe' }
];

// Helper to calculate closest delivery route corridor based on coordinates
export function findOptimalRouteForCoords(lat, lng) {
  let closest = SRI_LANKA_PRESET_HUBS[0];
  let minDistance = Infinity;

  SRI_LANKA_PRESET_HUBS.forEach(hub => {
    const d = Math.hypot(hub.lat - lat, hub.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      closest = hub;
    }
  });

  const matchedRoute = PREDEFINED_DELIVERY_ROUTES.find(r => r.id === closest.routeId) || PREDEFINED_DELIVERY_ROUTES[1];
  return {
    route: matchedRoute,
    nearestHubName: closest.name,
    distanceKm: (minDistance * 111).toFixed(1)
  };
}

export const LocationPickerModal = ({
  isOpen,
  onClose,
  initialAddress = '',
  initialLat,
  initialLng,
  onConfirmLocation
}) => {
  // Parse initial coordinates if passed or in address string
  const defaultCoord = (() => {
    if (initialLat && initialLng) return { lat: Number(initialLat), lng: Number(initialLng) };
    if (initialAddress) {
      const match = initialAddress.match(/\[GPS:\s*([0-9.-]+),\s*([0-9.-]+)\]/i);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    // Default to Mount Lavinia / Colombo South
    return { lat: 6.8380, lng: 79.8630 };
  })();

  const [coords, setCoords] = useState(defaultCoord);
  const [addressDetails, setAddressDetails] = useState({
    streetName: initialAddress ? initialAddress.replace(/\[GPS:[^\]]+\]/gi, '').trim() : '45/2 Galle Road, Mount Lavinia',
    city: 'Mount Lavinia',
    postalCode: '10370',
    landmarkNote: ''
  });
  const [assignedRoute, setAssignedRoute] = useState(() => findOptimalRouteForCoords(defaultCoord.lat, defaultCoord.lng));
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!isOpen) return;

    let timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      const L = window.L;
      if (!L) {
        console.warn('Leaflet not yet ready in window');
        return;
      }

      // If map already initialized, just set view and marker
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
        if (markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([coords.lat, coords.lng]);
        }
        return;
      }

      // Create new Leaflet Map instance
      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 15,
        zoomControl: true
      });

      // Add OpenStreetMap Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Custom pulsing SVG Delivery Pin Icon
      const customPinHtml = `
        <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 22px; height: 22px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: pulsePin 1.5s infinite;"></div>
          <svg width="34" height="42" viewBox="0 0 24 24" fill="#059669" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="3" fill="#ffffff"/>
          </svg>
        </div>
      `;

      const pinIcon = L.divIcon({
        html: customPinHtml,
        className: 'custom-leaflet-pin',
        iconSize: [36, 44],
        iconAnchor: [18, 40],
        popupAnchor: [0, -36]
      });

      // Add Draggable Pin Marker
      const marker = L.marker([coords.lat, coords.lng], {
        draggable: true,
        icon: pinIcon
      }).addTo(map);

      marker.bindPopup('<strong>📍 Pinned Delivery Location</strong><br/>Drag to fine-tune your doorstep.').openPopup();

      // Click on map to reposition pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        marker.openPopup();
        handleUpdateCoords(lat, lng, true);
      });

      // Marker drag event
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        handleUpdateCoords(lat, lng, true);
      });

      mapInstanceRef.current = map;
      markerInstanceRef.current = marker;
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Clean up map when modal unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Update coordinates and resolve reverse geocoding
  const handleUpdateCoords = async (lat, lng, shouldReverseGeocode = true) => {
    const fixedLat = parseFloat(Number(lat).toFixed(6));
    const fixedLng = parseFloat(Number(lng).toFixed(6));
    setCoords({ lat: fixedLat, lng: fixedLng });
    setGeoError('');

    // Determine optimal delivery corridor
    const routeMatch = findOptimalRouteForCoords(fixedLat, fixedLng);
    setAssignedRoute(routeMatch);

    if (mapInstanceRef.current && markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([fixedLat, fixedLng]);
    }

    if (shouldReverseGeocode) {
      reverseGeocode(fixedLat, fixedLng, routeMatch.nearestHubName);
    }
  };

  // Reverse geocoding via OpenStreetMap Nominatim with local fallback
  const reverseGeocode = async (lat, lng, fallbackHubName) => {
    setIsResolvingAddress(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const a = data.address;
          const road = a.road || a.pedestrian || a.suburb || a.neighbourhood || fallbackHubName;
          const houseNo = a.house_number ? `${a.house_number}, ` : '';
          const suburb = a.suburb || a.city_district || a.town || a.city || 'Colombo';
          const postCode = a.postcode || '';

          setAddressDetails(prev => ({
            ...prev,
            streetName: `${houseNo}${road}, ${suburb}`.trim(),
            city: a.city || a.town || suburb || 'Colombo',
            postalCode: postCode || prev.postalCode
          }));
          return;
        }
      }
    } catch (e) {
      // Graceful fallback to nearest preset hub
      console.log('OSM reverse geocoding fallback used:', e.message);
    } finally {
      setIsResolvingAddress(false);
    }

    // Fallback if network lookup timed out
    setAddressDetails(prev => ({
      ...prev,
      streetName: prev.streetName || `${fallbackHubName}, Colombo District`
    }));
  };

  // Browser GPS Geolocation
  const handleUseLiveGPS = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS Geolocation is not supported by your browser.');
      return;
    }

    setIsGeolocating(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleUpdateCoords(latitude, longitude, true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 16, { animate: true, duration: 1.2 });
        }
        setIsGeolocating(false);
      },
      (err) => {
        setIsGeolocating(false);
        if (err.code === 1) {
          setGeoError('Location permission denied. Please allow location access or click on the map to pin.');
        } else {
          setGeoError('Could not acquire GPS fix. Please click anywhere on the map to drop your delivery pin.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Search Address / Landmark
  const handleSearchLocation = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setGeoError('');

    try {
      const q = encodeURIComponent(`${searchQuery.trim()}, Sri Lanka`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=lk&limit=1`, {
        headers: { 'Accept-Language': 'en' }
      });

      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const match = results[0];
          const lat = parseFloat(match.lat);
          const lng = parseFloat(match.lon);

          handleUpdateCoords(lat, lng, false);
          setAddressDetails(prev => ({
            ...prev,
            streetName: match.display_name.split(',').slice(0, 3).join(',').trim()
          }));

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          }
          setIsSearching(false);
          return;
        }
      }
      setGeoError(`No locations found for "${searchQuery}". Please select a preset hub or click on the map.`);
    } catch {
      setGeoError('Location search failed. You can directly click on the map to place your pin.');
    } finally {
      setIsSearching(false);
    }
  };

  // Preset Hub Selection
  const handleSelectPreset = (hub) => {
    handleUpdateCoords(hub.lat, hub.lng, false);
    setAddressDetails(prev => ({
      ...prev,
      streetName: hub.street
    }));

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([hub.lat, hub.lng], 16, { animate: true, duration: 1 });
    }
  };

  // Confirm and Return Pinned Location
  const handleConfirm = () => {
    const cleanStreet = addressDetails.streetName.trim() || 'Custom Delivery Location';
    const notePart = addressDetails.landmarkNote.trim() ? ` (Note: ${addressDetails.landmarkNote.trim()})` : '';
    const formatted = `${cleanStreet} [GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}]${notePart}`;

    if (onConfirmLocation) {
      onConfirmLocation({
        formattedAddress: formatted,
        streetAddress: cleanStreet,
        latitude: coords.lat,
        longitude: coords.lng,
        corridorRoute: assignedRoute.route.name,
        corridorRouteId: assignedRoute.route.id,
        notes: addressDetails.landmarkNote.trim()
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '860px', 
          width: '95%', 
          maxHeight: '92vh', 
          padding: '0', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 'var(--radius-lg, 16px)'
        }}
      >
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
              <IconMapPin size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>Pin Your Exact Delivery Location</h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click anywhere on the map, drag the pin to your doorstep, or use live GPS
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <IconX size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          
          {/* Top Controls: Search & GPS button */}
          <div style={{ padding: '14px 20px', background: 'var(--bg-main)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearchLocation} style={{ display: 'flex', gap: '8px', flex: '1', minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search street, apartment, or landmark (e.g. Majestic City, Bambalapitiya)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    paddingLeft: '34px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <IconSearch size={15} />
                </span>
              </div>
              <button 
                type="submit" 
                disabled={isSearching}
                className="btn-secondary" 
                style={{ padding: '8px 14px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleUseLiveGPS}
              disabled={isGeolocating}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                background: '#059669',
                borderColor: '#059669'
              }}
            >
              <IconNavigation size={15} />
              {isGeolocating ? 'Detecting GPS...' : 'Use My Live GPS'}
            </button>
          </div>

          {/* Quick Preset Hub Chips */}
          <div style={{ padding: '10px 20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Quick Hubs:</span>
            {SRI_LANKA_PRESET_HUBS.slice(0, 8).map((hub, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(hub)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-main)',
                  color: 'var(--text-main)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <IconMapPin size={11} style={{ color: 'var(--primary)' }} /> {hub.name.split('(')[0]}
              </button>
            ))}
          </div>

          {/* Error notification if geolocation or search fails */}
          {geoError && (
            <div style={{ margin: '10px 20px 0 20px', background: '#fee2e2', color: '#b91c1c', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fca5a5' }}>
              <IconAlert size={15} /> {geoError}
            </div>
          )}

          {/* Interactive Map Box */}
          <div style={{ position: 'relative', width: '100%', height: '360px', background: '#e2e8f0' }}>
            <div 
              ref={mapContainerRef} 
              style={{ width: '100%', height: '100%', zIndex: 1 }}
            />

            {/* Float badge on map showing live coordinates */}
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              <span><strong>Lat:</strong> {coords.lat.toFixed(5)}, <strong>Lng:</strong> {coords.lng.toFixed(5)}</span>
            </div>

            {/* Helpful map instruction banner at bottom */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.94)',
              color: '#0f172a',
              padding: '6px 16px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.08)',
              pointerEvents: 'none'
            }}>
              💡 Click anywhere or drag the green pin to pinpoint your location
            </div>
          </div>

          {/* Location Summary & Details Form */}
          <div style={{ padding: '16px 20px', background: 'var(--bg-card)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              
              {/* Street & House Details */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Street Address & Neighborhood *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    value={addressDetails.streetName}
                    onChange={(e) => setAddressDetails(prev => ({ ...prev, streetName: e.target.value }))}
                    placeholder="e.g. 45/2 Galle Road, Mount Lavinia"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                  {isResolvingAddress && (
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Locating...
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Landmark Notes */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginBottom: '4px' }}>
                  Delivery Instructions / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressDetails.landmarkNote}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, landmarkNote: e.target.value }))}
                  placeholder="e.g. Blue Gate, 2nd floor, Opposite Arpico Supercentre"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Calculated Delivery Route Corridor Banner */}
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-main)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconNavigation size={16} style={{ color: assignedRoute.route.color || 'var(--primary)' }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    Matched Delivery Corridor: <span style={{ color: assignedRoute.route.color || 'var(--primary)' }}>{assignedRoute.route.name}</span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Nearest Logistics Corridor: {assignedRoute.route.corridor} (~{assignedRoute.distanceKm} km from hub)
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px' }}>
                Transit: {assignedRoute.route.transitTime}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconCheck size={14} style={{ color: '#16a34a' }} />
            <span>Exact GPS coordinates will be attached for rider navigation</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '9px 18px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-primary"
              style={{ padding: '9px 22px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconCheck size={16} /> Confirm Pinned Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
