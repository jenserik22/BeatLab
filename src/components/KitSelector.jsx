import React from 'react';
import { getAllKits } from '../constants/kitsConfig';

const KitSelector = ({ currentKit, loadKit }) => {
  const kits = getAllKits();

  const handleKitChange = (e) => {
    const kitId = e.target.value;
    const selectedKit = kits.find(kit => kit.id === kitId);
    if (selectedKit) {
      loadKit(selectedKit);
    }
  };

  return (
    <div className="kit-selector">
      <h3>Kit: {currentKit.name}</h3>
      <select value={currentKit.id} onChange={handleKitChange}>
        {kits.map(kit => (
          <option key={kit.id} value={kit.id}>
            {kit.name}
          </option>
        ))}
      </select>
      <p className="kit-description">{currentKit.description}</p>
    </div>
  );
};

export default KitSelector;
