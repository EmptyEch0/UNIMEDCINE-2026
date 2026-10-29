import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { MapPin, Phone, Compass, Star, Navigation, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Hospital } from '../types';

// Fallback visual database for Vizianagaram / JNTU-GV Campus
const fallbackHospitals: Hospital[] = [
  {
    id: 1,
    name: "Venkata Padma Hospital",
    type: "Hospital",
    address: "Three Lamps Junction, AG Road, Vizianagaram",
    phone: "+91 90002 67654",
    image_url: 'https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=400',
    rating: 4.4,
    latitude: 18.1088126,
    longitude: 83.4173236,
    is_open: true
  },
  {
    id: 2,
    name: "Queens NRI Hospital",
    type: "Hospital",
    address: "D.No. 5-1-11, Opp SBI Main Branch, Near NCS Theatre, Vizianagaram",
    phone: "08922 251777",
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
    rating: 4.5,
    latitude: 18.1160657,
    longitude: 83.4029738,
    is_open: true
  },
  {
    id: 3,
    name: "Mahendra Hospitals",
    type: "Hospital",
    address: "Beside Swimming Pool, RCM Church Road, Cantonment, Vizianagaram",
    phone: "08922 222555",
    image_url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce8?w=400',
    rating: 4.2,
    latitude: 18.1159,
    longitude: 83.4025,
    is_open: true
  },
  {
    id: 4,
    name: "Maharaja District Hospital",
    type: "Hospital",
    address: "RCM Church Road, Vizianagaram",
    phone: "08922 228800",
    image_url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
    rating: 4.0,
    latitude: 18.1409,
    longitude: 83.2987,
    is_open: true
  },
  {
    id: 5,
    name: "Venkata Rama Hospital",
    type: "Hospital",
    address: "Opp RTC Complex, Vizianagaram",
    phone: "08922 273777",
    image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400',
    rating: 4.3,
    latitude: 18.1185,
    longitude: 83.4045,
    is_open: true
  },
  {
    id: 6,
    name: "Pushpagiri Eye Hospital",
    type: "Hospital",
    address: "Near TTD Kalyana Mandapam, Alaknagar, Vizianagaram",
    phone: "08922 270070",
    image_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400',
    rating: 4.6,
    latitude: 18.115508,
    longitude: 83.411954,
    is_open: true
  },
  {
    id: 7,
    name: "Vamsi Children Hospital",
    type: "Hospital",
    address: "Vizianagaram",
    phone: "9440193885",
    image_url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=400',
    rating: 4.1,
    latitude: 18.1170,
    longitude: 83.3990,
    is_open: true
  },
  {
    id: 8,
    name: "PG Star Hospital",
    type: "Hospital",
    address: "Rangala Street, Ramanaidu Road, Vizianagaram",
    phone: "08922 272727",
    image_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400',
    rating: 4.3,
    latitude: 18.1115,
    longitude: 83.4060,
    is_open: true
  },
  {
    id: 9,
    name: "A J Global Health Care Hospital",
    type: "Hospital",
    address: "Beside Bhashyam School, 100 Feet Ring Road, Vinayaka Nagar, Vizianagaram",
    phone: "08922 299911",
    image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400',
    rating: 4.2,
    latitude: 18.1300,
    longitude: 83.3880,
    is_open: true
  },
  {
    id: 10,
    name: "MIMS Hospital, Nellimarla",
    type: "Hospital",
    address: "Nellimarla, Vizianagaram",
    phone: "08922 240777",
    image_url: 'https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=400',
    rating: 4.5,
    latitude: 18.146964,
    longitude: 83.445320,
    is_open: true
  },
  {
    id: 11,
    name: "Apollo Pharmacy - MG Road",
    type: "Shop",
    address: "Sri Sai Complex, MG Road, Vizianagaram",
    phone: "08922 279999",
    image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400',
    rating: 4.5,
    latitude: 18.1244906,
    longitude: 83.3874123,
    is_open: true
  },
  {
    id: 12,
    name: "MedPlus Pharmacy - Vizianagaram",
    type: "Shop",
    address: "Near Market Area, Vizianagaram",
    phone: "08922 278888",
    image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400',
    rating: 4.4,
    latitude: 18.1017172,
    longitude: 83.3927211,
    is_open: true
  },
  {
    id: 13,
    name: "Datta Pharmacy",
    type: "Shop",
    address: "D.No. 5-15-14, Kothagraharam, Vizianagaram Market",
    phone: "08922 270123",
    image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400',
    rating: 4.1,
    latitude: 18.1105,
    longitude: 83.4008,
    is_open: true
  },
  {
    id: 14,
    name: "MS Satyanarayana Pharmacy",
    type: "Shop",
    address: "Near SKP Temple, Vizianagaram Market",
    phone: "08922 271234",
    image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400',
    rating: 4.2,
    latitude: 18.1110,
    longitude: 83.4020,
    is_open: true
  },
  {
    id: 15,
    name: "Pradhan Mantri Bhartiya Janaushadhi Kendra - Bodduvari Junction",
    type: "Shop",
    address: "MRO Office Road, Bodduvari Junction, Vizianagaram",
    phone: "08922 276543",
    image_url: 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400',
    rating: 4.3,
    latitude: 18.1150,
    longitude: 83.3965,
    is_open: true
  }
];

export default function Nearby() {
  const { token } = useStore();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locPermission, setLocPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Default coordinates (JNTU-GV Campus)
  const defaultCoords = { lat: 18.1364, lon: 83.4019 };

  // JS Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getGeoLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLocPermission('denied');
      setUserLocation(defaultCoords);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocPermission('granted');
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
        setLoading(false);
      },
      () => {
        setLocPermission('denied');
        setUserLocation(defaultCoords);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    getGeoLocation();
  }, []);

  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      if (!userLocation) return;
      
      setLoading(true);
      try {
        let url = `http://localhost:8000/api/hospitals?lat=${userLocation.lat}&lon=${userLocation.lon}`;
        if (filterType !== 'All') {
          url += `&type=${filterType}`;
        }
        
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setHospitals(data);
            setIsOffline(false);
          } else {
            useFallbackData();
          }
        } else {
          useFallbackData();
        }
      } catch (e) {
        console.error("Backend offline. Loading local Coastal database.");
        useFallbackData();
      } finally {
        setLoading(false);
      }
    };

    const useFallbackData = () => {
      setIsOffline(true);
      // Filter type matching
      let list = [...fallbackHospitals];
      if (filterType !== 'All') {
        list = list.filter(h => h.type.toLowerCase() === filterType.toLowerCase());
      }
      
      // Calculate distances client-side
      list.forEach((h: any) => {
        h.distance = calculateDistance(userLocation!.lat, userLocation!.lon, h.latitude, h.longitude);
      });
      
      // Sort by proximity
      list.sort((a: any, b: any) => a.distance - b.distance);
      setHospitals(list);
    };

    fetchHospitals();
  }, [userLocation, filterType, token]);

  // Leaflet map initialization
  useEffect(() => {
    if (!userLocation || hospitals.length === 0) return;

    const L = (window as any).L;
    if (!L) return;

    // Check if map container is already initialized to avoid re-init error
    const container = L.DomUtil.get('map-container');
    if (!container) return;
    
    // Clear previous map instance if cached
    const mapContainer = container as any;
    if (mapContainer._leaflet_id) {
      return;
    }

    const map = L.map('map-container').setView([userLocation.lat, userLocation.lon], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // User pin
    const userIcon = L.divIcon({
      html: `<div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white animate-pulse shadow-md"></div>`,
      className: 'custom-user-pin',
      iconSize: [16, 16]
    });
    L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
      .addTo(map)
      .bindPopup('Your Current Location')
      .openPopup();

    // Facilities pins
    hospitals.forEach((h) => {
      L.marker([h.latitude, h.longitude])
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; padding: 4px;">
            <b style="font-size: 13px; color: #1D1D1F;">${h.name}</b><br/>
            <span style="font-size: 10px; color: #6E6E73; text-transform: uppercase;">${h.type}</span><br/>
            <span style="font-size: 11px; font-weight: bold; color: #22c55e;">Rating: ⭐ ${h.rating}</span>
          </div>
        `);
    });

    return () => {
      map.remove();
    };
  }, [userLocation, hospitals]);

  const handleDirections = (hospital: Hospital) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;
    window.open(url, '_blank');
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const filteredHospitals = hospitals.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 24/7 Campus Ambulance Dispatch Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-amber-600 rounded-3xl p-5 text-white shadow-xl shadow-rose-600/15 flex flex-col md:flex-row items-center justify-between gap-4 border border-rose-400/20">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 animate-pulse">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                24/7 EMERGENCY DISPATCH
              </span>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            </div>
            <h3 className="text-lg font-black font-poppins text-white mt-0.5 m-0">
              Campus & Vizianagaram Ambulance Dispatch (108)
            </h3>
            <p className="text-xs text-rose-100 font-medium">
              Immediate paramedic response for trauma, severe chest pain, or sudden emergency.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => window.open('tel:108')}
            className="flex-1 md:flex-none px-5 py-3 bg-white hover:bg-slate-100 text-rose-600 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            Call 108 Emergency
          </button>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-poppins m-0">
            Nearby Healthcare Facilities
          </h2>
          <p className="text-xs text-slate-400">
            Showing emergency services and clinics in Vizianagaram.
          </p>
        </div>

        {/* GPS location & Offline states */}
        <div className="flex items-center gap-3">
          {isOffline && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3.5 py-2 rounded-2xl text-xs font-semibold border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
              Offline Local Database Active
            </div>
          )}
          {locPermission === 'granted' ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3.5 py-2 rounded-2xl text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Live GPS Location Active
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 px-3.5 py-2 rounded-2xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              Default: Vizianagaram Coords
            </div>
          )}
          
          <button
            onClick={getGeoLocation}
            className="bg-primary hover:bg-primary-dark text-white font-semibold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" />
            Refresh GPS
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals, shops, clinics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Hospital', 'Clinic', 'Shop', 'Diagnostics'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === type
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Viewport - Splitted Side-by-Side Map */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch min-h-[500px]">
        
        {/* Left Column: Cards List */}
        <div className="lg:col-span-6 space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="glass-card rounded-3xl h-36 animate-pulse bg-white/30 dark:bg-slate-900/30"></div>
            ))
          ) : filteredHospitals.length > 0 ? (
            filteredHospitals.map((hospital) => {
              const distanceVal = (hospital as any).distance;
              return (
                <div 
                  key={hospital.id} 
                  className="glass-card rounded-3xl overflow-hidden p-4 flex gap-4 hover:shadow-2xl transition-all duration-300 group hover:-translate-y-0.5 border border-slate-100 dark:border-slate-850"
                >
                  {/* Photo Thumbnail */}
                  <div className="w-28 h-28 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden flex-shrink-0 relative">
                    <img 
                      src={hospital.image_url || "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=200"} 
                      alt={hospital.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>

                  {/* Content details */}
                  <div className="flex-1 flex flex-col justify-between text-left">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                          {hospital.type}
                        </span>
                        
                        {/* Proximity Distance */}
                        {distanceVal !== undefined && (
                          <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                            🚗 {distanceVal.toFixed(1)} km away
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white leading-tight font-poppins">
                        {hospital.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold truncate max-w-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        {hospital.address}
                      </p>
                      
                      {/* Rating block */}
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-extrabold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {hospital.rating.toFixed(1)}
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                      {hospital.phone && (
                        <button
                          onClick={() => handleCall(hospital.phone!)}
                          className="flex-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center justify-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDirections(hospital)}
                        className="flex-1 py-1.5 bg-primary hover:bg-primary-dark text-white text-[10px] font-bold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Directions
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-slate-400 font-semibold text-xs">
              No matching medical locations found.
            </div>
          )}
        </div>

        {/* Right Column: Visual Leaflet Map */}
        <div className="lg:col-span-6 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-lg relative min-h-[300px]">
          <div id="map-container" className="absolute inset-0 w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            {/* Visual radar fallback loading in case leafelt CDN isn't compiled yet */}
            <span className="text-slate-400 text-xs font-semibold">Initializing Coastal Map...</span>
          </div>
        </div>

      </div>
    </div>
  );
}
