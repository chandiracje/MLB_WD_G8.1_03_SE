export const PREDEFINED_DELIVERY_ROUTES = [
  {
    id: 'route-colombo-central',
    name: 'Route 1 - Colombo Central Express',
    shortName: 'Colombo Central (Col 01-03)',
    corridor: 'Fort, Pettah, Slave Island, Kollupitiya, Galle Face',
    zones: ['Fort', 'Pettah', 'Slave Island', 'Kollupitiya', 'Galle Face', 'Colombo 01', 'Colombo 02', 'Colombo 03'],
    keywords: ['fort', 'pettah', 'slave island', 'kollupitiya', 'colpetty', 'galle face', 'colombo 01', 'colombo 1', 'colombo 02', 'colombo 2', 'colombo 03', 'colombo 3', 'col 01', 'col 1', 'col 02', 'col 2', 'col 03', 'col 3', 'union place', 'darley road', 'york street', 'chatham street'],
    defaultVehicle: 'WP BCD-4589 (Express Motorbike)',
    estimatedTransitMins: 40,
    transitTime: '~40 mins',
    color: '#0284c7'
  },
  {
    id: 'route-colombo-south',
    name: 'Route 2 - Colombo South Coastal Corridor',
    shortName: 'Colombo South Coastal (Col 04-06, Dehiwala, Mt Lavinia)',
    corridor: 'Bambalapitiya, Wellawatte, Dehiwala, Mount Lavinia, Ratmalana',
    zones: ['Bambalapitiya', 'Wellawatte', 'Dehiwala', 'Mount Lavinia', 'Ratmalana', 'Moratuwa'],
    keywords: ['bambalapitiya', 'bamba', 'wellawatte', 'wellawatta', 'dehiwala', 'dehiwela', 'mount lavinia', 'mt lavinia', 'ratmalana', 'rathmalana', 'moratuwa', 'angulana', 'lunawa', 'colombo 04', 'colombo 4', 'colombo 05', 'colombo 5', 'colombo 06', 'colombo 6', 'col 04', 'col 4', 'col 05', 'col 5', 'col 06', 'col 6', 'havelock', 'marine drive', 'duplication road'],
    defaultVehicle: 'WP CAH-2311 (Chilled Van)',
    estimatedTransitMins: 55,
    transitTime: '~55 mins',
    color: '#059669'
  },
  {
    id: 'route-colombo-east',
    name: 'Route 3 - Colombo East Metro Hub',
    shortName: 'Colombo East Metro (Col 07-08, Rajagiriya, Battaramulla)',
    corridor: 'Cinnamon Gardens, Borella, Rajagiriya, Battaramulla, Pelawatte',
    zones: ['Cinnamon Gardens', 'Borella', 'Rajagiriya', 'Battaramulla', 'Pelawatte', 'Kotte', 'Nawala'],
    keywords: ['cinnamon gardens', 'borella', 'rajagiriya', 'battaramulla', 'pelawatte', 'pelawatta', 'kotte', 'sri jayawardenepura', 'nawala', 'colombo 07', 'colombo 7', 'colombo 08', 'colombo 8', 'col 07', 'col 7', 'col 08', 'col 8', 'torrington', 'ward place', 'gregory'],
    defaultVehicle: 'WP BDK-8890 (Eco Motorbike)',
    estimatedTransitMins: 45,
    transitTime: '~45 mins',
    color: '#7c3aed'
  },
  {
    id: 'route-colombo-north',
    name: 'Route 4 - Colombo North Industrial Metro',
    shortName: 'Colombo North (Col 10-15, Kelaniya, Wattala)',
    corridor: 'Maradana, Grandpass, Peliyagoda, Kelaniya, Wattala',
    zones: ['Maradana', 'Grandpass', 'Peliyagoda', 'Kelaniya', 'Wattala', 'Ja-Ela', 'Kiribathgoda'],
    keywords: ['maradana', 'grandpass', 'peliyagoda', 'kelaniya', 'wattala', 'hendala', 'ja-ela', 'ja ela', 'kandana', 'ragama', 'mahara', 'kiribathgoda', 'dalugama', 'hunupitiya', 'colombo 10', 'colombo 11', 'colombo 12', 'colombo 13', 'colombo 14', 'colombo 15', 'col 10', 'col 11', 'col 12', 'col 13', 'col 14', 'col 15', 'kotahena', 'bloemendhal', 'negombo road'],
    defaultVehicle: 'WP CAC-9042 (Bulk Cargo Van)',
    estimatedTransitMins: 60,
    transitTime: '~60 mins',
    color: '#ea580c'
  },
  {
    id: 'route-outer-ring',
    name: 'Route 5 - Greater Colombo Outer Ring',
    shortName: 'Greater Colombo Outer Ring (Nugegoda, Maharagama, Kottawa)',
    corridor: 'Nugegoda, Kohuwala, Maharagama, Kottawa, Pannipitiya',
    zones: ['Nugegoda', 'Kohuwala', 'Maharagama', 'Kottawa', 'Pannipitiya', 'Homagama', 'Piliyandala'],
    keywords: ['nugegoda', 'kohuwala', 'maharagama', 'kottawa', 'pannipitiya', 'homagama', 'piliyandala', 'boralesgamuwa', 'mirihana', 'delkanda', 'wijerama', 'kesbewa', 'rukmalgama', 'thalawathugoda', 'godagama', 'high level road'],
    defaultVehicle: 'WP CAG-7712 (Multi-Temp Van)',
    estimatedTransitMins: 65,
    transitTime: '~65 mins',
    color: '#db2777'
  },
  {
    id: 'route-suburban-tech',
    name: 'Route 6 - Tech & Suburban Hub',
    shortName: 'Suburban Tech Hub (Malabe, Kaduwela, Athurugiriya)',
    corridor: 'Malabe IT Hub, Koswatte, Thalahena, Kaduwela, Athurugiriya',
    zones: ['Malabe IT Hub', 'Koswatte', 'Thalahena', 'Kaduwela', 'Athurugiriya'],
    keywords: ['malabe', 'koswatte', 'thalahena', 'kaduwela', 'athurugiriya', 'hokandara', 'pittugala', 'sliit', 'arugambay', 'habarakada', 'korathota', 'kaduwela road'],
    defaultVehicle: 'WP BDC-1212 (Express Motorbike)',
    estimatedTransitMins: 50,
    transitTime: '~50 mins',
    color: '#0891b2'
  }
];

const CUSTOM_ROUTES_STORAGE_KEY = 'lankafresh_custom_delivery_routes';

// Retrieve user-created custom routes from localStorage
export function getStoredCustomRoutes() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read custom delivery routes from localStorage:", err);
    return [];
  }
}

// Save a newly created custom route
export function saveCustomDeliveryRoute(newRouteData) {
  try {
    const existing = getStoredCustomRoutes();
    const routeId = newRouteData.id || `route-custom-${Date.now()}`;
    const formattedRoute = {
      id: routeId,
      name: newRouteData.name.trim(),
      shortName: newRouteData.shortName?.trim() || newRouteData.name.trim(),
      corridor: newRouteData.corridor.trim(),
      zones: Array.isArray(newRouteData.zones)
        ? newRouteData.zones
        : newRouteData.corridor.split(/[,;]/).map(z => z.trim()).filter(Boolean),
      keywords: (newRouteData.corridor || '')
        .toLowerCase()
        .split(/[,;]/)
        .map(s => s.trim())
        .filter(Boolean),
      defaultVehicle: newRouteData.defaultVehicle?.trim() || 'WP BCD-4589 (Express Motorbike)',
      estimatedTransitMins: Number(newRouteData.estimatedTransitMins) || 45,
      transitTime: newRouteData.transitTime || `~${newRouteData.estimatedTransitMins || 45} mins`,
      color: newRouteData.color || '#10b981',
      isCustom: true
    };

    // Filter out if duplicate ID exists, then append
    const updated = [...existing.filter(r => r.id !== routeId), formattedRoute];
    localStorage.setItem(CUSTOM_ROUTES_STORAGE_KEY, JSON.stringify(updated));
    return formattedRoute;
  } catch (err) {
    console.error("Could not save custom delivery route:", err);
    throw err;
  }
}

// Delete custom route by ID
export function deleteCustomDeliveryRoute(routeId) {
  try {
    const existing = getStoredCustomRoutes();
    const updated = existing.filter(r => r.id !== routeId);
    localStorage.setItem(CUSTOM_ROUTES_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error("Could not delete custom delivery route:", err);
    return getStoredCustomRoutes();
  }
}

// Retrieve combined list of predefined + user-created routes
export function getAllDeliveryRoutes() {
  const customRoutes = getStoredCustomRoutes();
  return [...PREDEFINED_DELIVERY_ROUTES, ...customRoutes];
}

// Automatically match delivery route based on address text or GPS
export function findOptimalRouteForAddress(addressText) {
  if (!addressText || typeof addressText !== 'string') return null;

  const normalized = addressText.toLowerCase().trim();
  const allRoutes = getAllDeliveryRoutes();

  // 1. Try keyword matching against all routes (custom routes checked first for priority)
  const prioritizedRoutes = [...allRoutes].reverse();
  for (const route of prioritizedRoutes) {
    const keywords = route.keywords || [];
    for (const kw of keywords) {
      if (kw && kw.length >= 3 && normalized.includes(kw.toLowerCase())) {
        return route;
      }
    }

    // Check corridor name and zone names directly
    if (route.zones && Array.isArray(route.zones)) {
      for (const zone of route.zones) {
        if (zone && zone.length >= 3 && normalized.includes(zone.toLowerCase())) {
          return route;
        }
      }
    }
  }

  // 2. Check for GPS coordinates embedded in address: [GPS: lat, lng]
  const gpsMatch = addressText.match(/\[GPS:\s*([0-9.-]+),\s*([0-9.-]+)\]/i);
  if (gpsMatch) {
    const lat = parseFloat(gpsMatch[1]);
    const lng = parseFloat(gpsMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      // Find closest route hub
      const hubs = [
        { lat: 6.9344, lng: 79.8428, routeId: 'route-colombo-central' },
        { lat: 6.8905, lng: 79.8580, routeId: 'route-colombo-south' },
        { lat: 6.9100, lng: 79.8700, routeId: 'route-colombo-east' },
        { lat: 6.9650, lng: 79.8900, routeId: 'route-colombo-north' },
        { lat: 6.8650, lng: 79.8970, routeId: 'route-outer-ring' },
        { lat: 6.9040, lng: 79.9540, routeId: 'route-suburban-tech' }
      ];

      let closest = hubs[0];
      let minDist = Infinity;
      hubs.forEach(h => {
        const d = Math.hypot(h.lat - lat, h.lng - lng);
        if (d < minDist) {
          minDist = d;
          closest = h;
        }
      });
      return allRoutes.find(r => r.id === closest.routeId) || PREDEFINED_DELIVERY_ROUTES[0];
    }
  }

  // 3. Fallback: if address specifies Colombo but no specific zone, default to Central
  if (normalized.includes('colombo') || normalized.includes('western province')) {
    return PREDEFINED_DELIVERY_ROUTES[0];
  }

  return null;
}
