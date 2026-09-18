import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FaSearch, FaMapMarkerAlt, FaBolt, FaStar, FaFilter, 
  FaList, FaMap, FaTimes, FaLocationArrow, FaChargingStation, 
  FaBuilding, FaPlug, FaChevronDown, FaChevronUp, FaSync,
  FaDirections
} from 'react-icons/fa';
import { db } from '../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import StationMap from '../components/StationMap';
import { 
  getUserLocation, 
  sortStationsByDistance, 
  formatDistance 
} from '../utils/distance';

// ============================================================
// HELPER: Clean text values
// ============================================================
const cleanText = (text) => {
  if (!text) return '';
  let cleaned = String(text)
    .trim()
    .replace(/^re\s+/i, '')
    .replace(/^r\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  const nameMap = {
    'sri potti sriramulu nellore': 'Nellore',
    'sri potti sriramulu': 'Nellore',
    'potti sriramulu nellore': 'Nellore',
    'sp sriramulu nellore': 'Nellore',
    'spsr nellore': 'Nellore',
    'ysr kadapa': 'Kadapa',
    'ysr district': 'Kadapa',
    'vizag': 'Visakhapatnam',
  };

  return nameMap[cleaned.toLowerCase()] || cleaned;
};

// ============================================================
// HELPER: Open Google Maps directions
// ============================================================
const openDirections = (station, userLocation) => {
  const destLat = parseFloat(station.latitude);
  const destLng = parseFloat(station.longitude);

  if (isNaN(destLat) || isNaN(destLng)) {
    alert('This station has no valid coordinates');
    return;
  }

  let url;

  if (userLocation) {
    // Directions from user's location to station
    url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destLat},${destLng}&travelmode=driving`;
  } else {
    // Just show the station on Google Maps
    url = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
};

const Stations = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [stations, setStations] = useState([]);
  const [filteredStations, setFilteredStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [nearestStation, setNearestStation] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    state: true,
    city: true,
    chargerType: true,
    power: true,
    features: true
  });

  const [filters, setFilters] = useState({
    states: [],
    cities: [],
    chargerTypes: [],
    powers: [],
    fastCharging: false,
    availableOnly: false,
    solarOnly: false,
    onlyNearby: false
  });

  // ================= FETCH STATIONS =================
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const q = query(collection(db, 'stations'), limit(500));
        const querySnapshot = await getDocs(q);
        const data = [];
        querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
        setStations(data);
        setFilteredStations(data);
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
      setLoading(false);
    };
    fetchStations();
  }, []);

  // ================= GET USER LOCATION =================
  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const location = await getUserLocation();
      setUserLocation(location);

      const sorted = sortStationsByDistance(stations, location.lat, location.lng);
      if (sorted.length > 0) {
        setNearestStation(sorted[0]);
      }
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocationLoading(false);
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
    setNearestStation(null);
    setLocationError(null);
    setFilters((prev) => ({ ...prev, onlyNearby: false }));
  };

  // ================= DYNAMIC FILTER OPTIONS =================
  const filterOptions = useMemo(() => {
    const states = new Set();
    const cities = new Set();
    const chargerTypes = new Set();

    stations.forEach((s) => {
      const state = cleanText(s.state);
      const city = cleanText(s.city);
      const district = cleanText(s.district);

      if (state) states.add(state);
      if (city) cities.add(city);
      if (district) cities.add(district);

      const ct = s.chargerTypes || s.chargerType;
      if (ct) {
        ct.split(',').forEach((t) => {
          const trimmed = t.trim();
          if (trimmed) chargerTypes.add(trimmed);
        });
      }
    });

    return {
      states: [...states].sort(),
      cities: [...cities].sort().slice(0, 30),
      chargerTypes: [...chargerTypes].sort().slice(0, 15),
      powers: ['3.3 kW', '7.4 kW', '22 kW', '30 kW', '60 kW', '60 kW+']
    };
  }, [stations]);

  // ================= APPLY FILTERS =================
  useEffect(() => {
    let result = [...stations];

    if (userLocation) {
      result = sortStationsByDistance(result, userLocation.lat, userLocation.lng);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((s) => {
        const text = [
          s.name, s.operator, s.city, s.district, s.state, s.address
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(term);
      });
    }

    if (filters.states.length > 0) {
      result = result.filter((s) => {
        const state = cleanText(s.state);
        return filters.states.includes(state);
      });
    }

    if (filters.cities.length > 0) {
      result = result.filter((s) => {
        const city = cleanText(s.city);
        const district = cleanText(s.district);
        return filters.cities.includes(city) || filters.cities.includes(district);
      });
    }

    if (filters.chargerTypes.length > 0) {
      result = result.filter((s) => {
        const types = ((s.chargerTypes || s.chargerType || '') + '').toLowerCase();
        return filters.chargerTypes.some((t) => types.includes(t.toLowerCase()));
      });
    }

    if (filters.powers.length > 0) {
      result = result.filter((s) => {
        const rating = parseFloat(
          String(s.chargerRating || s.power || '0').replace(/[^\d.]/g, '')
        );
        if (isNaN(rating)) return false;
        return filters.powers.some((p) => {
          if (p === '3.3 kW') return rating <= 3.3;
          if (p === '7.4 kW') return rating > 3.3 && rating <= 7.4;
          if (p === '22 kW') return rating > 7.4 && rating <= 22;
          if (p === '30 kW') return rating > 22 && rating <= 30;
          if (p === '60 kW') return rating > 30 && rating <= 60;
          if (p === '60 kW+') return rating > 60;
          return false;
        });
      });
    }

    if (filters.fastCharging) {
      result = result.filter((s) => {
        const p = parseFloat(
          String(s.chargerRating || s.power || '0').replace(/[^\d.]/g, '')
        );
        return p >= 22;
      });
    }

    if (filters.availableOnly) {
      result = result.filter((s) => {
        const c = parseInt(s.connectorCount || s.chargers || 0);
        return c > 0;
      });
    }

    if (filters.solarOnly) {
      result = result.filter((s) => {
        const text = `${s.name || ''} ${s.operator || ''}`.toLowerCase();
        return text.includes('solar') || s.solar === true;
      });
    }

    if (filters.onlyNearby && userLocation) {
      result = result.filter((s) => {
        return s.distance !== undefined && s.distance !== Infinity && s.distance <= 25;
      });
    }

    setFilteredStations(result);
  }, [searchTerm, filters, stations, userLocation]);

  const toggleArrayFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const resetFilters = () => {
    setFilters({
      states: [],
      cities: [],
      chargerTypes: [],
      powers: [],
      fastCharging: false,
      availableOnly: false,
      solarOnly: false,
      onlyNearby: false
    });
    setSearchTerm('');
    clearLocation();
  };

  const activeFilterCount =
    filters.states.length +
    filters.cities.length +
    filters.chargerTypes.length +
    filters.powers.length +
    (filters.fastCharging ? 1 : 0) +
    (filters.availableOnly ? 1 : 0) +
    (filters.solarOnly ? 1 : 0) +
    (filters.onlyNearby ? 1 : 0);

  if (loading) return <div className="spinner"></div>;

  return (
    <div className="stations-page">
      {/* HEADER */}
      <div className="stations-header">
        <div className="container">
          <div className="search-bar-container">
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by operator, city, district or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  <FaTimes />
                </button>
              )}
            </div>

            {userLocation ? (
              <button
                className="location-btn active"
                onClick={clearLocation}
                title="Click to clear location"
              >
                <FaSync />
                <span>Clear Location</span>
              </button>
            ) : (
              <button
                className="location-btn"
                onClick={handleUseMyLocation}
                disabled={locationLoading}
              >
                <FaLocationArrow />
                <span>{locationLoading ? 'Detecting...' : 'Use My Location'}</span>
              </button>
            )}
          </div>

          {locationError && (
            <div className="location-error">⚠️ {locationError}</div>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="container">
        {/* NEAREST STATION BANNER */}
        {nearestStation && userLocation && (
          <div className="nearest-banner">
            <div className="nearest-icon">📍</div>
            <div className="nearest-info">
              <span className="nearest-label">Nearest Charging Station</span>
              <h3 className="nearest-name">
                {nearestStation.operator || nearestStation.name || 'Charging Station'}
                <span className="nearest-distance">
                  {formatDistance(nearestStation.distance)} away
                </span>
              </h3>
              <p className="nearest-address">
                {[
                  cleanText(nearestStation.city),
                  cleanText(nearestStation.district),
                  nearestStation.state
                ].filter(Boolean).join(', ') || nearestStation.address}
              </p>
            </div>
            <div className="nearest-actions">
              <button
                className="btn btn-white"
                onClick={() => openDirections(nearestStation, userLocation)}
              >
                <FaDirections /> Get Directions
              </button>
              <Link 
                to={`/stations/${nearestStation.id}`} 
                className="btn btn-primary-light"
              >
                View Details →
              </Link>
            </div>
          </div>
        )}

        <div className="stations-layout">
          {/* FILTERS SIDEBAR */}
          <aside className={`filters-sidebar ${showMobileFilters ? 'mobile-show' : ''}`}>
            <div className="filters-header">
              <h3><FaFilter /> Filters</h3>
              {activeFilterCount > 0 && (
                <button className="reset-filters" onClick={resetFilters}>
                  Reset ({activeFilterCount})
                </button>
              )}
              <button
                className="close-mobile-filters"
                onClick={() => setShowMobileFilters(false)}
              >
                <FaTimes />
              </button>
            </div>

            {userLocation && (
              <div className="location-info-box">
                <span className="location-info-icon">📍</span>
                <div>
                  <span className="location-info-title">Location Active</span>
                  <span className="location-info-sub">Sorted by distance</span>
                </div>
              </div>
            )}

            {/* STATE */}
            {filterOptions.states.length > 0 && (
              <div className="filter-group">
                <button className="filter-group-header" onClick={() => toggleSection('state')}>
                  <h4>State</h4>
                  {expandedSections.state ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.state && (
                  <div className="checkbox-group scrollable">
                    {filterOptions.states.slice(0, 15).map((state) => (
                      <label key={state} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={filters.states.includes(state)}
                          onChange={() => toggleArrayFilter('states', state)}
                        />
                        <span className="checkbox-custom"></span>
                        <span>{state}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CITY */}
            {filterOptions.cities.length > 0 && (
              <div className="filter-group">
                <button className="filter-group-header" onClick={() => toggleSection('city')}>
                  <h4>City / District</h4>
                  {expandedSections.city ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.city && (
                  <div className="checkbox-group scrollable">
                    {filterOptions.cities.slice(0, 15).map((city) => (
                      <label key={city} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={filters.cities.includes(city)}
                          onChange={() => toggleArrayFilter('cities', city)}
                        />
                        <span className="checkbox-custom"></span>
                        <span>{city}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHARGER TYPE */}
            {filterOptions.chargerTypes.length > 0 && (
              <div className="filter-group">
                <button className="filter-group-header" onClick={() => toggleSection('chargerType')}>
                  <h4>Charger Type</h4>
                  {expandedSections.chargerType ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {expandedSections.chargerType && (
                  <div className="checkbox-group scrollable">
                    {filterOptions.chargerTypes.slice(0, 15).map((type) => (
                      <label key={type} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={filters.chargerTypes.includes(type)}
                          onChange={() => toggleArrayFilter('chargerTypes', type)}
                        />
                        <span className="checkbox-custom"></span>
                        <span>{type.length > 35 ? type.substring(0, 35) + '...' : type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* POWER */}
            <div className="filter-group">
              <button className="filter-group-header" onClick={() => toggleSection('power')}>
                <h4>Charging Power</h4>
                {expandedSections.power ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.power && (
                <div className="checkbox-group">
                  {filterOptions.powers.map((power) => (
                    <label key={power} className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={filters.powers.includes(power)}
                        onChange={() => toggleArrayFilter('powers', power)}
                      />
                      <span className="checkbox-custom"></span>
                      <span>⚡ {power}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* FEATURES */}
            <div className="filter-group">
              <button className="filter-group-header" onClick={() => toggleSection('features')}>
                <h4>Features</h4>
                {expandedSections.features ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {expandedSections.features && (
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={filters.fastCharging}
                      onChange={(e) => setFilters({ ...filters, fastCharging: e.target.checked })}
                    />
                    <span className="checkbox-custom"></span>
                    <span>⚡ Fast Charging (22kW+)</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={filters.availableOnly}
                      onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                    />
                    <span className="checkbox-custom"></span>
                    <span>🟢 Available Connectors</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={filters.solarOnly}
                      onChange={(e) => setFilters({ ...filters, solarOnly: e.target.checked })}
                    />
                    <span className="checkbox-custom"></span>
                    <span>☀️ Solar / Green</span>
                  </label>
                </div>
              )}
            </div>

            <button
              className="btn btn-primary apply-filters-btn"
              onClick={() => setShowMobileFilters(false)}
            >
              Show {filteredStations.length} Results
            </button>
          </aside>

          {showMobileFilters && (
            <div className="mobile-filter-overlay" onClick={() => setShowMobileFilters(false)}></div>
          )}

          {/* MAIN CONTENT */}
          <main className="stations-content">
            {userLocation && (
              <div className="nearby-toggle-row">
                <label className="toggle-option">
                  <input
                    type="checkbox"
                    checked={filters.onlyNearby}
                    onChange={(e) => setFilters({ ...filters, onlyNearby: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    Show only stations within 25 km of my location
                  </span>
                </label>
              </div>
            )}

            <div className="results-header">
              <div className="results-info">
                <h2>Charging Stations</h2>
                <span className="results-count">
                  {filteredStations.length.toLocaleString()} stations found
                  {userLocation && !filters.onlyNearby && ' • sorted by distance'}
                  {userLocation && filters.onlyNearby && ' • within 25 km'}
                </span>
              </div>

              <div className="view-controls">
                <button className="mobile-filter-btn" onClick={() => setShowMobileFilters(true)}>
                  <FaFilter /> Filters
                  {activeFilterCount > 0 && (
                    <span className="filter-badge">{activeFilterCount}</span>
                  )}
                </button>

                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <FaList /> <span>List</span>
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'map' ? 'active' : ''}`}
                    onClick={() => setViewMode('map')}
                  >
                    <FaMap /> <span>Map</span>
                  </button>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="active-filters">
                <span className="filter-label">Active:</span>
                {userLocation && (
                  <span className="filter-chip location-chip">
                    📍 Sorted by Distance
                    <button onClick={clearLocation}><FaTimes /></button>
                  </span>
                )}
                {filters.onlyNearby && (
                  <span className="filter-chip">
                    📏 Within 25 km
                    <button onClick={() => setFilters({ ...filters, onlyNearby: false })}>
                      <FaTimes />
                    </button>
                  </span>
                )}
                {filters.states.map((s) => (
                  <span key={`state-${s}`} className="filter-chip">
                    🗺️ {s}
                    <button onClick={() => toggleArrayFilter('states', s)}><FaTimes /></button>
                  </span>
                ))}
                {filters.cities.map((c) => (
                  <span key={`city-${c}`} className="filter-chip">
                    🏙️ {c}
                    <button onClick={() => toggleArrayFilter('cities', c)}><FaTimes /></button>
                  </span>
                ))}
                {filters.chargerTypes.map((t) => (
                  <span key={`type-${t}`} className="filter-chip">
                    🔌 {t.substring(0, 20)}
                    <button onClick={() => toggleArrayFilter('chargerTypes', t)}><FaTimes /></button>
                  </span>
                ))}
                {filters.powers.map((p) => (
                  <span key={`power-${p}`} className="filter-chip">
                    ⚡ {p}
                    <button onClick={() => toggleArrayFilter('powers', p)}><FaTimes /></button>
                  </span>
                ))}
                <button className="clear-all-btn" onClick={resetFilters}>Clear All</button>
              </div>
            )}

            {filteredStations.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
                <h3>No stations found</h3>
                <p>Try adjusting your filters or search term</p>
                <button className="btn btn-primary" onClick={resetFilters}>Clear All Filters</button>
              </div>
            ) : viewMode === 'map' ? (
              <StationMap 
                stations={filteredStations} 
                zoom={userLocation ? 11 : 5} 
                center={userLocation ? [userLocation.lat, userLocation.lng] : [22.5, 78.9]} 
              />
            ) : (
              <div className="stations-list">
                {filteredStations.map((station) => (
                  <StationListItem 
                    key={station.id} 
                    station={station}
                    userLocation={userLocation}
                    isNearest={nearestStation?.id === station.id}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <style jsx>{`
        .stations-page { min-height: 100vh; background: var(--bg); }

        .stations-header {
          background: var(--surface); padding: 20px 0;
          box-shadow: var(--shadow-sm); position: sticky;
          top: 70px; z-index: 100; border-bottom: 1px solid var(--border);
        }
        .search-bar-container { display: flex; gap: 12px; }
        .search-bar {
          flex: 1; display: flex; align-items: center;
          background: var(--bg); border-radius: 12px;
          padding: 4px 4px 4px 16px; border: 2px solid var(--border);
          transition: all 0.3s;
        }
        .search-bar:focus-within { border-color: var(--primary); background: var(--surface); }
        .search-icon { color: var(--primary); font-size: 16px; margin-right: 10px; }
        .search-bar input {
          flex: 1; border: none; outline: none; padding: 12px 0;
          font-size: 15px; background: transparent; color: var(--text); font-family: inherit;
        }
        .clear-search { background: none; border: none; color: var(--text-subtle); cursor: pointer; padding: 8px; }

        .location-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px; background: var(--primary); color: white;
          border: none; border-radius: 12px; font-weight: 600;
          cursor: pointer; white-space: nowrap; font-family: inherit; font-size: 14px;
          transition: all 0.3s;
        }
        .location-btn:hover:not(:disabled) { background: var(--primary-dark); }
        .location-btn:disabled { opacity: 0.6; cursor: wait; }
        .location-btn.active {
          background: var(--primary-light);
          color: var(--primary);
          border: 2px solid var(--primary);
        }

        .location-error {
          margin-top: 12px; padding: 10px 16px;
          background: var(--status-unavailable-bg);
          color: var(--status-unavailable);
          border-radius: 8px; font-size: 13px; font-weight: 500;
        }

        /* ============ NEAREST BANNER ============ */
        .nearest-banner {
          display: flex; align-items: center; gap: 20px;
          padding: 20px 24px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white; border-radius: 16px;
          margin: 20px 0;
          box-shadow: 0 8px 30px rgba(35, 134, 54, 0.3);
          animation: slideDown 0.4s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .nearest-icon { font-size: 40px; flex-shrink: 0; }
        .nearest-info { flex: 1; min-width: 0; }
        .nearest-label {
          display: block; font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.1em;
          opacity: 0.9; margin-bottom: 4px;
        }
        .nearest-name {
          font-size: 22px; font-weight: 800; color: white;
          margin-bottom: 4px; display: flex; align-items: baseline;
          gap: 12px; flex-wrap: wrap;
        }
        .nearest-distance {
          font-size: 16px; font-weight: 700;
          background: rgba(255,255,255,0.2);
          padding: 4px 12px; border-radius: 20px; white-space: nowrap;
        }
        .nearest-address {
          font-size: 13px; color: rgba(255,255,255,0.85);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .nearest-actions {
          display: flex; gap: 10px; align-items: center; flex-shrink: 0;
        }
        .btn-white {
          background: white; color: var(--primary-dark);
          padding: 12px 20px; border-radius: 10px;
          font-weight: 700; font-size: 14px;
          border: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-white:hover { background: rgba(255,255,255,0.9); transform: translateY(-1px); }
        .btn-primary-light {
          background: rgba(255,255,255,0.15); color: white;
          padding: 12px 20px; border-radius: 10px;
          font-weight: 700; font-size: 14px;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.3);
          display: inline-flex; align-items: center; gap: 6px;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-primary-light:hover { background: rgba(255,255,255,0.25); }

        /* ============ LAYOUT ============ */
        .stations-layout {
          display: grid; grid-template-columns: 300px 1fr;
          gap: 30px; padding: 20px 0 30px; align-items: start;
        }

        .filters-sidebar {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px; height: fit-content;
          position: sticky; top: 160px; box-shadow: var(--shadow-md);
          max-height: calc(100vh - 180px); overflow-y: auto;
        }
        .filters-sidebar::-webkit-scrollbar { width: 6px; }
        .filters-sidebar::-webkit-scrollbar-thumb {
          background: var(--border-strong); border-radius: 3px;
        }

        .location-info-box {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; background: var(--primary-light);
          border-radius: 10px; margin-bottom: 16px;
          border: 1px solid var(--border);
        }
        .location-info-icon { font-size: 20px; }
        .location-info-title {
          display: block; font-size: 13px; font-weight: 700; color: var(--primary);
        }
        .location-info-sub {
          display: block; font-size: 11px; color: var(--text-muted);
        }

        .filters-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px; padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; background: var(--surface);
          z-index: 2; padding-top: 4px;
        }
        .filters-header h3 {
          display: flex; align-items: center; gap: 8px;
          color: var(--text); font-size: 16px; margin: 0; font-weight: 700;
        }
        .reset-filters {
          background: var(--status-unavailable-bg); color: var(--status-unavailable);
          border: none; padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; cursor: pointer;
        }
        .close-mobile-filters {
          display: none; background: none; border: none;
          font-size: 20px; cursor: pointer; color: var(--text-muted);
        }
        .filter-group {
          margin-bottom: 16px; padding-bottom: 16px;
          border-bottom: 1px solid var(--border);
        }
        .filter-group:last-of-type { border-bottom: none; }
        .filter-group-header {
          display: flex; justify-content: space-between; align-items: center;
          width: 100%; background: none; border: none;
          padding: 4px 0; cursor: pointer;
          font-family: inherit; color: var(--text-muted); transition: color 0.2s;
        }
        .filter-group-header:hover { color: var(--text); }
        .filter-group-header h4 {
          color: var(--text); font-size: 12px; font-weight: 700;
          margin: 0; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .filter-group-header svg { font-size: 12px; color: var(--text-subtle); }
        .checkbox-group { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .checkbox-group.scrollable {
          max-height: 180px; overflow-y: auto; padding-right: 6px;
        }
        .checkbox-group.scrollable::-webkit-scrollbar { width: 4px; }
        .checkbox-group.scrollable::-webkit-scrollbar-thumb {
          background: var(--border-strong); border-radius: 2px;
        }
        .checkbox-option {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; font-size: 13px; color: var(--text);
          padding: 3px 0; transition: color 0.2s;
        }
        .checkbox-option:hover { color: var(--primary); }
        .checkbox-option input { display: none; }
        .checkbox-custom {
          width: 16px; height: 16px;
          border: 2px solid var(--border-strong);
          border-radius: 4px; position: relative;
          flex-shrink: 0; transition: all 0.2s;
        }
        .checkbox-option input:checked + .checkbox-custom {
          border-color: var(--primary); background: var(--primary);
        }
        .checkbox-option input:checked + .checkbox-custom::after {
          content: '✓'; position: absolute;
          top: 50%; left: 50%; transform: translate(-50%, -50%);
          color: white; font-size: 10px; font-weight: bold;
        }
        .apply-filters-btn { display: none; width: 100%; padding: 12px; margin-top: 16px; }

        /* ============ NEARBY TOGGLE ============ */
        .nearby-toggle-row {
          display: flex; align-items: center;
          padding: 12px 16px;
          background: var(--primary-light);
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid var(--border);
        }
        .toggle-option {
          display: flex; align-items: center; gap: 12px;
          cursor: pointer; width: 100%;
        }
        .toggle-option input { display: none; }
        .toggle-slider {
          position: relative;
          width: 40px; height: 22px;
          background: var(--border-strong);
          border-radius: 22px;
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .toggle-slider::after {
          content: '';
          position: absolute;
          top: 2px; left: 2px;
          width: 18px; height: 18px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s;
        }
        .toggle-option input:checked + .toggle-slider {
          background: var(--primary);
        }
        .toggle-option input:checked + .toggle-slider::after {
          transform: translateX(18px);
        }
        .toggle-label {
          font-size: 14px; font-weight: 600; color: var(--text);
        }

        /* ============ RESULTS ============ */
        .stations-content { min-width: 0; }
        .results-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px; flex-wrap: wrap; gap: 15px;
        }
        .results-info h2 {
          color: var(--text); font-size: 24px; margin-bottom: 4px; font-weight: 700;
        }
        .results-count { color: var(--text-muted); font-size: 14px; }

        .view-controls { display: flex; gap: 12px; align-items: center; }
        .mobile-filter-btn {
          display: none; align-items: center; gap: 8px;
          padding: 10px 16px; background: var(--surface);
          border: 2px solid var(--border); border-radius: 10px;
          font-weight: 600; cursor: pointer; font-size: 14px;
          color: var(--text); font-family: inherit; position: relative;
        }
        .filter-badge {
          background: var(--primary); color: white;
          font-size: 11px; padding: 2px 6px; border-radius: 10px;
        }
        .view-toggle {
          display: flex; background: var(--surface); border-radius: 10px;
          padding: 4px; box-shadow: var(--shadow-sm); border: 1px solid var(--border);
        }
        .view-btn {
          padding: 8px 16px; border: none; background: transparent;
          border-radius: 6px; font-weight: 600; font-size: 14px;
          color: var(--text-muted); cursor: pointer;
          display: flex; align-items: center; gap: 6px; font-family: inherit;
        }
        .view-btn.active { background: var(--primary); color: white; }

        .active-filters {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 20px; flex-wrap: wrap;
          padding: 12px 16px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 12px;
        }
        .filter-label { font-size: 13px; color: var(--text-muted); font-weight: 600; }
        .filter-chip {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; background: var(--primary-light); color: var(--primary);
          border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .filter-chip.location-chip {
          background: var(--primary); color: white;
        }
        .filter-chip button {
          background: none; border: none; color: inherit;
          cursor: pointer; display: flex; align-items: center;
          font-size: 9px; padding: 2px;
        }
        .clear-all-btn {
          background: none; border: none; color: var(--status-unavailable);
          font-size: 13px; font-weight: 600; cursor: pointer; margin-left: auto;
        }

        .stations-list { display: flex; flex-direction: column; gap: 16px; }
        .empty-state {
          text-align: center; padding: 60px 20px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px;
        }
        .empty-state h3 { color: var(--text); margin-bottom: 16px; }

        @media (max-width: 992px) {
          .stations-layout { grid-template-columns: 260px 1fr; gap: 20px; }
        }
        @media (max-width: 768px) {
          .nearest-banner {
            flex-direction: column; align-items: flex-start; padding: 16px;
          }
          .nearest-name { font-size: 18px; }
          .nearest-actions { width: 100%; flex-direction: column; }
          .btn-white, .btn-primary-light { width: 100%; justify-content: center; }

          .stations-layout { grid-template-columns: 1fr; gap: 0; }
          .filters-sidebar {
            display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            z-index: 1001; border-radius: 0; max-height: 100vh;
            overflow-y: auto; padding: 20px;
          }
          .filters-sidebar.mobile-show { display: block; }
          .close-mobile-filters { display: block; }
          .apply-filters-btn { display: block; }
          .mobile-filter-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
          }
          .mobile-filter-btn { display: flex; }
          .search-bar-container { flex-direction: column; }
          .location-btn { width: 100%; justify-content: center; }
          .results-header { flex-direction: column; align-items: flex-start; }
          .view-controls { width: 100%; justify-content: space-between; }
        }
        @media (max-width: 480px) {
          .view-btn { padding: 8px 12px; font-size: 13px; }
          .view-btn span { display: none; }
          .results-info h2 { font-size: 20px; }
        }
      `}</style>
    </div>
  );
};

// ================= STATION LIST ITEM =================
const StationListItem = ({ station, userLocation, isNearest }) => {
  const operator = station.operator || 'Unknown Operator';
  const ownership = station.ownership || '';
  const stationName = station.name || '';
  const city = cleanText(station.city);
  const district = cleanText(station.district);
  const state = station.state || '';

  const chargerType = station.chargerTypes || station.chargerType || 'Unknown';
  const chargerRating = station.chargerRating || station.power || 'N/A';
  const connectorCount =
    station.connectorCount || station.chargers || station.totalChargers || 0;

  const available = parseInt(connectorCount) || 0;
  let statusClass = 'available';
  let statusText = '🟢 Available';
  if (available === 0) {
    statusClass = 'unavailable';
    statusText = '🔴 Unavailable';
  } else if (available < 2) {
    statusClass = 'limited';
    statusText = '🟠 Limited';
  }

  const location =
    [city, district, state].filter(Boolean).join(', ') ||
    station.address ||
    'Unknown';

  return (
    <div className={`station-item ${isNearest ? 'nearest' : ''}`}>
      {isNearest && <div className="nearest-tag">📍 Nearest Station</div>}
      
      <div className="station-item-icon">
        <FaChargingStation />
      </div>

      <div className="station-item-details">
        <div className="station-item-header">
          <div>
            <h3>{operator}</h3>
            {stationName && stationName !== operator && (
              <p className="station-item-name">{stationName}</p>
            )}
          </div>
          <div className="header-right">
            {station.distance !== undefined && station.distance !== Infinity && (
              <span className="distance-badge">
                📍 {formatDistance(station.distance)} away
              </span>
            )}
            <span className={`status-badge ${statusClass}`}>{statusText}</span>
          </div>
        </div>

        <p className="station-item-address">
          <FaMapMarkerAlt /> {location}
        </p>

        <div className="station-item-meta">
          <span className="meta-chip"><FaPlug /> {chargerType}</span>
          <span className="meta-chip"><FaBolt /> {chargerRating} kW</span>
          <span className="meta-chip">
            <FaChargingStation /> {connectorCount} connector
            {connectorCount !== 1 ? 's' : ''}
          </span>
          {ownership && (
            <span className="meta-chip"><FaBuilding /> {ownership}</span>
          )}
        </div>

        <div className="station-item-bottom">
          <div className="station-item-stats">
            <div className="stat">
              <span className="stat-value">{connectorCount}</span>
              <span className="stat-label">Connectors</span>
            </div>
            <div className="station-item-rating">
              <FaStar />
              <span>{station.averageRating || station.rating || '4.5'}</span>
            </div>
          </div>

          <div className="station-item-price-action">
            <div className="price">
              <span className="price-value">₹{station.price || '15'}</span>
              <span className="price-unit">/kWh</span>
            </div>
            
            <button
              className="btn btn-secondary directions-btn"
              onClick={() => openDirections(station, userLocation)}
              title="Open in Google Maps"
            >
              <FaDirections /> Directions
            </button>
            
            <Link to={`/stations/${station.id}`} className="btn btn-primary">
              View Details
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .station-item {
          position: relative;
          display: flex; gap: 20px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 16px;
          padding: 20px; box-shadow: var(--shadow-md); transition: all 0.3s;
        }
        .station-item.nearest {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light), var(--shadow-md);
        }
        .nearest-tag {
          position: absolute;
          top: -10px; left: 20px;
          background: var(--primary); color: white;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 20px;
          letter-spacing: 0.05em;
        }
        .station-item:hover {
          border-color: var(--primary); box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }
        .station-item-icon {
          width: 60px; height: 60px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          border-radius: 14px; display: flex; align-items: center;
          justify-content: center; font-size: 26px; color: white; flex-shrink: 0;
        }
        .station-item-details { flex: 1; min-width: 0; }
        .station-item-header {
          display: flex; justify-content: space-between;
          align-items: flex-start; gap: 15px; margin-bottom: 8px;
        }
        .station-item-header h3 {
          color: var(--text); font-size: 18px; font-weight: 700;
        }
        .station-item-name {
          color: var(--text-subtle); font-size: 12px;
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; max-width: 500px;
        }
        .header-right {
          display: flex; gap: 8px; align-items: center;
          flex-wrap: wrap; justify-content: flex-end;
        }
        .distance-badge {
          display: inline-flex; align-items: center;
          padding: 4px 10px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 20px;
          font-size: 12px; font-weight: 700;
          white-space: nowrap;
        }
        .station-item-address {
          color: var(--text-muted); font-size: 13px;
          display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
        }
        .station-item-address svg { color: var(--primary); }
        .station-item-meta {
          display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px;
        }
        .meta-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; background: var(--bg); color: var(--text);
          border-radius: 6px; font-size: 12px; font-weight: 500;
          border: 1px solid var(--border);
        }
        .meta-chip svg { color: var(--primary); font-size: 11px; }
        .station-item-bottom {
          display: flex; justify-content: space-between;
          align-items: flex-end; gap: 15px; flex-wrap: wrap;
          padding-top: 12px; border-top: 1px solid var(--border);
        }
        .station-item-stats { display: flex; gap: 25px; align-items: center; }
        .stat { display: flex; flex-direction: column; }
        .stat-value { font-size: 18px; font-weight: 800; color: var(--text); }
        .stat-label {
          font-size: 11px; color: var(--text-muted); text-transform: uppercase;
        }
        .station-item-rating {
          display: flex; gap: 4px; color: #f59e0b; font-weight: 700; font-size: 14px;
        }
        .station-item-price-action {
          display: flex; align-items: center; gap: 10px;
          flex-wrap: wrap;
        }
        .price { display: flex; align-items: baseline; gap: 2px; margin-right: 5px; }
        .price-value { font-size: 20px; font-weight: 800; color: var(--primary); }
        .price-unit { font-size: 12px; color: var(--text-muted); }
        
        .directions-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 13px;
        }
        
        @media (max-width: 768px) {
          .station-item { flex-direction: column; padding: 16px; }
          .station-item-icon { width: 50px; height: 50px; font-size: 22px; }
          .station-item-header { flex-direction: column; gap: 8px; }
          .header-right { justify-content: flex-start; }
          .station-item-bottom { flex-direction: column; align-items: stretch; }
          .station-item-price-action {
            justify-content: space-between;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Stations;