import React from 'react';
import { FaBolt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ChargerCard = ({ charger }) => {
  return (
    <div className="charger-card">
      <div className="charger-header">
        <h4>Charger #{charger.chargerNumber}</h4>
        <span className={`charger-status ${charger.status}`}>
          {charger.status === 'available' ? <FaCheckCircle /> : <FaTimesCircle />}
          {charger.status}
        </span>
      </div>
      <div className="charger-details">
        <p><strong>Type:</strong> {charger.type}</p>
        <p><strong>Power:</strong> {charger.power}</p>
        <p><strong>Price:</strong> {charger.pricePerKwh}</p>
      </div>
      <button className="btn btn-primary btn-sm">Book Now</button>
    </div>
  );
};

export default ChargerCard;