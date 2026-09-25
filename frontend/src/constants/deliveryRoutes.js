export const PREDEFINED_DELIVERY_ROUTES = [
  {
    id: 'route-colombo-central',
    name: 'Route 1 - Colombo Central Express',
    shortName: 'Colombo Central (Col 01-03)',
    corridor: 'Fort, Pettah, Slave Island, Kollupitiya, Galle Face',
    zones: ['Fort', 'Pettah', 'Slave Island', 'Kollupitiya', 'Galle Face'],
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
    zones: ['Bambalapitiya', 'Wellawatte', 'Dehiwala', 'Mount Lavinia', 'Ratmalana'],
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
    zones: ['Cinnamon Gardens', 'Borella', 'Rajagiriya', 'Battaramulla', 'Pelawatte'],
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
    zones: ['Maradana', 'Grandpass', 'Peliyagoda', 'Kelaniya', 'Wattala'],
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
    zones: ['Nugegoda', 'Kohuwala', 'Maharagama', 'Kottawa', 'Pannipitiya'],
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
    defaultVehicle: 'WP BDC-1212 (Express Motorbike)',
    estimatedTransitMins: 50,
    transitTime: '~50 mins',
    color: '#0891b2'
  }
];
