import React, { useState } from 'react';
import { getAllKits } from '../constants/kitsConfig';

const KitSelector = ({ currentKit, loadKit }) => {
  const kits = getAllKits();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleKitChange = (kit) => {
    loadKit(kit);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="kit-selector">
      <h3>Drum kit: {currentKit.name}</h3>
      <div className={`custom-dropdown ${isOpen ? 'show' : ''}`}>
        <div 
          className="custom-dropdown-toggle"
          onClick={toggleDropdown}
        >
          {currentKit.name}
        </div>
        <div className="custom-dropdown-menu">
          {kits.map(kit => (
            <div
              key={kit.id}
              className={`custom-dropdown-item ${currentKit.id === kit.id ? 'selected' : ''}`}
              onClick={() => handleKitChange(kit)}
            >
              {kit.name}
            </div>
          ))}
        </div>
      </div>
      <div 
        className="tooltip-container"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`tooltip ${showTooltip ? 'show' : ''}`}>
          {currentKit.description}
        </div>
      </div>
    </div>
  );
};

export default KitSelector;
