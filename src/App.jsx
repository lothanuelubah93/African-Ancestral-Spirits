import React, { useState } from 'react';

import MainMenu from './components/MainMenu';
import EgyptLevel from './components/levels/EgyptLevel';
import EthiopiaLevel from './components/levels/EthiopiaLevel';
import SenegalLevel from './components/levels/SenegalLevel';
import NigeriaLevel from './components/levels/NigeriaLevel';
import KenyaLevel from './components/levels/KenyaLevel';

function App() {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleStartGame = (countryId) => {
    setSelectedCountry(countryId);
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
    setSelectedCountry(null);
  };

  return (
    <div className="App">
      {currentScreen === 'menu' && (
        <MainMenu onStartGame={handleStartGame} />
      )}
      
      {currentScreen === 'game' && selectedCountry === 'egypt' && (
        <EgyptLevel autoStart={true} onBack={handleBackToMenu} />
      )}
      
      {currentScreen === 'game' && selectedCountry === 'ethiopia' && (
        <EthiopiaLevel autoStart={true} onBack={handleBackToMenu} />
      )}
      
      {currentScreen === 'game' && selectedCountry === 'senegal' && (
        <SenegalLevel autoStart={true} onBack={handleBackToMenu} />
      )}
      
      {currentScreen === 'game' && selectedCountry === 'nigeria' && (
        <NigeriaLevel autoStart={true} onBack={handleBackToMenu} />
      )}
      
      {currentScreen === 'game' && selectedCountry === 'kenya' && (
        <KenyaLevel autoStart={true} onBack={handleBackToMenu} />
      )}
    </div>
  );
}

export default App;