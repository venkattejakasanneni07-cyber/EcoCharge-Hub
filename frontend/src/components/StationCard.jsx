import React from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaBolt, FaClock, FaStar } from 'react-icons/fa';

const StationCard = ({ station }) => {
  return (
    <div className="station-card">
      <div className="station-header">
        <h3>{station.name}</h3>
        <div className="rating">
          <FaStar className="star-icon" />
          <span>{station.rating || 4.5}</span>
        </div>
      </div>
      
      <div className="station-location">
        <FaMapMarkerAlt className="location-icon" />
        <span>{station.address || station.location}</span>
      </div>
      
      <div className="station-details">
        <div className="detail">
          <FaBolt className="detail-icon" />
          <span>{station.type || 'CCS'}</span>
        </div>
        <div className="detail">
          <FaClock className="detail-icon" />
          <span>{station.speed || '150kW'}</span>
        </div>
      </div>
      
      <div className="station-info">
        <div className="availability">
          <span className={`status ${station.available > 0 ? 'available' : 'full'}`}>
            {station.available > 0 ? '🟢' : '🔴'}
          </span>
          <span>{station.available || 0} of {station.total || 4} available</span>
        </div>
        <div className="price">
          <span>{station.price || '₹12/kWh'}</span>
        </div>
      </div>
      
      <div className="station-actions">
        <span className="distance">{station.distance || '2.5 km'} away</span>
        <Link to={`/stations/${station.id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default StationCard;