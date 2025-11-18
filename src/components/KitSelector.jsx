import React, { useState, useEffect, useRef } from 'react';
import { getAllKits } from '../constants/kitsConfig';

const KitSelector = ({ currentKit, loadKit }) => {
  const kits = getAllKits();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef(null);

  const handleKitChange = (kit) => {
    loadKit(kit);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="kit-selector">
      <h3>Drum kit: {currentKit.name}</h3>
      <div className={`custom-dropdown ${isOpen ? 'show' : ''}`} ref={dropdownRef}>
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
