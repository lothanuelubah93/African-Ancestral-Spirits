import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Wallet, Play, Info, X, Star, Zap, Users } from 'lucide-react';

const AncestralSpiritsMainMenu = (props) => {
  const [screen, setScreen] = useState('splash'); // splash, menu, countryInfo
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Auto-transition from splash to menu
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setScreen('menu');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Initialize Google Maps when menu screen loads
  useEffect(() => {
    if (screen === 'menu' && mapRef.current && !mapInstanceRef.current) {
      initGoogleMap();
    }
  }, [screen]);

  // Game data
  const gameTitle = "ANCESTRAL SPIRITS";
  const gameSubtitle = "Journey Through Ancient Africa";

  const countries = {
    egypt: {
      id: 'egypt',
      name: 'Egypt',
      flag: '🇪🇬',
      color: '#FFD700',
      coordinates: { lat: 26.8206, lng: 30.8025 }, // Cairo
      region: 'North Africa',
      venue: 'The Pyramids of Giza & Ancient Tombs',
      image: '🏜️',
      story: `Journey to the land of pharaohs, where ancient pyramids pierce the desert sky. In the dead of night, the spirits of Egypt's mighty gods still wander the sacred tombs. As darkness falls, Ra's light fades and the spirits of Ammit, Apep, and Ba emerge from the afterlife.`,
      people: 'Ancient Egyptians - Builders of the pyramids, masters of the afterlife, and keepers of divine knowledge for over 3,000 years.',
      gameplay: '2D top-down exploration through haunted pyramids. Collect spirit NFTs of Egyptian deities and call upon Ra\'s blessing to attract souls.',
      difficulty: 'Easy',
      gameStyle: '2D Exploration',
      spirits: ['Ammit', 'Apep', 'Ba'],
      power: 'Ra\'s Blessing',
      rewards: '10-50 HBAR per spirit'
    },
    ethiopia: {
      id: 'ethiopia',
      name: 'Ethiopia',
      flag: '🇪🇹',
      color: '#4682B4',
      coordinates: { lat: 12.1307, lng: 37.7184 }, // Lalibela
      region: 'Horn of Africa',
      venue: 'Rock-Hewn Churches of Lalibela',
      image: '⛪',
      story: `Venture into the ancient highlands where King Lalibela carved magnificent churches from solid rock in the 12th century. These sacred halls, illuminated only by candlelight, harbor the spirits of centuries of faithful worshippers. The ancestral guardians still protect these holy grounds.`,
      people: 'Ethiopian Orthodox Christians - Guardians of ancient traditions, living in one of the world\'s oldest continuous Christian civilizations since the 4th century.',
      gameplay: '3D first-person exploration of carved stone churches. Navigate candlelit corridors, view sacred Ethiopian art, and capture Zar, Wuqabi, and Buda spirits.',
      difficulty: 'Medium',
      gameStyle: '3D First-Person',
      spirits: ['Zar', 'Wuqabi', 'Buda'],
      power: 'Sacred Prayer',
      rewards: '10-60 HBAR per spirit'
    },
    senegal: {
      id: 'senegal',
      name: 'Senegal',
      flag: '🇸🇳',
      color: '#00853F',
      coordinates: { lat: 14.7167, lng: -3.0000 }, // Dogon Country, Mali border
      region: 'West Africa',
      venue: 'Dogon Cliff Dwellings & Ancient Observatories',
      image: '⭐',
      story: `Journey to the mystical homeland of the Dogon people, ancient astronomers who mapped the stars thousands of years ago. The Dogon possess knowledge of the Sirius star system that baffles modern scientists. Under the vast African night sky, collect celestial spirits and unlock the secrets of the cosmos.`,
      people: 'Dogon People - Master astronomers who tracked the Sirius B star (invisible to the naked eye) centuries before modern telescopes. Their creation myths speak of visitors from the stars.',
      gameplay: 'Astronomy discovery game! Navigate the night sky, discover constellations, and track star movements. The more stars you discover, the more HBAR you earn. Find hidden Dogon astronomical knowledge.',
      difficulty: 'Medium',
      gameStyle: 'Star Discovery',
      spirits: ['Nommo (Star Beings)', 'Amma (Creator)', 'Celestial Guides'],
      power: 'Cosmic Vision',
      rewards: '20-100 HBAR per star discovery'
    },
    nigeria: {
      id: 'nigeria',
      name: 'Nigeria',
      flag: '🇳🇬',
      color: '#008751',
      coordinates: { lat: 6.5244, lng: 3.3792 }, // Lagos
      region: 'West Africa',
      venue: '4 Ancient Sites: Eshu Temple, Anyanwu Temple, Oba Palace, Kano',
      image: '👑',
      story: `Explore the diverse spiritual landscape of Nigeria, from Yoruba crossroads to Igbo sun temples, from the magnificent Benin bronze halls to the ancient clay cities of Hausaland. Each location holds unique spirits and cultural treasures from Nigeria\'s rich history.`,
      people: 'Yoruba, Igbo, Edo, and Hausa peoples - Nigeria\'s major ethnic groups, each with distinct spiritual traditions, art forms, and kingdoms spanning over 2,000 years.',
      gameplay: '3D first-person exploration with 4 playable temples. Collect cultural artifacts (portraits, kola nuts, traditional clothing) and regional spirits as NFTs.',
      difficulty: 'Medium',
      gameStyle: '3D Multi-Location',
      spirits: ['Eshu', 'Anyanwu', 'Egungun', 'Bori'],
      power: 'Ancestor Drums',
      rewards: '15-60 HBAR per item'
    },
    kenya: {
      id: 'kenya',
      name: 'Kenya',
      flag: '🇰🇪',
      color: '#FF8C00',
      coordinates: { lat: -1.2921, lng: 36.8219 }, // Nairobi
      region: 'East Africa',
      venue: 'Masai Mara, Great Rift Valley, Swahili Coast',
      image: '🦁',
      story: `Become a legendary Maasai warrior and survive the untamed wilderness of East Africa. Hunt through golden savannas where lions roam, traverse volcanic rift valleys, and explore ancient Swahili trading posts on the coast. Only the bravest warriors collect the sacred artifacts while battling wild beasts.`,
      people: 'Maasai warriors and Swahili traders - Fierce pastoralists known for their bravery and distinctive red clothing, living alongside coastal merchants who connected Africa to the world.',
      gameplay: '3D action survival game! Play as a Maasai warrior with spear combat. Dodge dangerous animals, throw spears, activate warrior power, and collect ancient Kenyan treasures.',
      difficulty: 'Hard - Combat Focus',
      gameStyle: '3D Action/Survival',
      spirits: ['Wild Beasts', 'Coastal Spirits'],
      power: 'Warrior Rage',
      rewards: '35-60 HBAR per artifact'
    },

    
  };

  const stats = {
    totalSpirits: 25,
    totalArtifacts: 40,
    maxHbar: 3500,
    levels: 5
  };

  // Initialize Google Maps
  const initGoogleMap = async () => {
    if (!window.google) {
      // Load Google Maps script dynamically
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => createMap();
      document.head.appendChild(script);
    } else {
      createMap();
    }
  };

  const createMap = () => {
    if (!mapRef.current || !window.google) return;

    // Create map centered on Africa
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 5.0, lng: 20.0 }, // Center of Africa
      zoom: 4,
      mapTypeId: 'terrain',
      styles: [
        {
          featureType: 'all',
          stylers: [{ saturation: -20 }, { lightness: 10 }]
        },
        {
          featureType: 'water',
          stylers: [{ color: '#1e3a5f' }]
        },
        {
          featureType: 'landscape',
          stylers: [{ color: '#2a4a2a' }]
        }
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true
    });

    mapInstanceRef.current = map;

    // Add markers for each country
    Object.values(countries).forEach(country => {
      const marker = new window.google.maps.Marker({
        position: country.coordinates,
        map: map,
        title: country.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 15,
          fillColor: country.color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        animation: window.google.maps.Animation.DROP
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedCountry(country.id);
        setScreen('countryInfo');
        if (audioEnabled) playClickSound();
      });

      // Add hover effect
      marker.addListener('mouseover', () => {
        setHoveredCountry(country.id);
        marker.setAnimation(window.google.maps.Animation.BOUNCE);
      });

      marker.addListener('mouseout', () => {
        setHoveredCountry(null);
        marker.setAnimation(null);
      });

      markersRef.current.push(marker);
    });
  };

  const connectWallet = () => {
    setWalletConnected(true);
    if (audioEnabled) playClickSound();
  };

  const playClickSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

 const startGame = (countryId) => {
  if (audioEnabled) playClickSound();
  if (props.onStartGame) {
     props.onStartGame(countryId);
   }
};

const [flash, setFlash] = useState(false);

useEffect(() => {
  // ⏳ Extend splash delay (10s)
  const splashTimer = setTimeout(() => {
    setScreen('menu'); // or whatever next screen you want
  }, 100000);

  // ⚡ Random lightning effect
  const flashInterval = setInterval(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }, Math.random() * 4000 + 2000);

  return () => {
    clearTimeout(splashTimer);
    clearInterval(flashInterval);
  };
}, []);


  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-orange-500"
              style={{
                width: Math.random() * 3 + 1 + 'px',
                height: Math.random() * 3 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animation: `twinkle ${Math.random() * 3 + 2}s infinite`
              }}
            />
          ))}
        </div>
      </div>

 {screen === 'splash' && (
  <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-black text-white relative h-screen w-screen">
    {/* 🌌 Full gradient base */}
    <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-gray-900 to-black animate-spookyGlow"></div>

    {/* ⚡ Lightning flash overlay */}
    <div
      className={`absolute inset-0 bg-white transition-opacity duration-100 mix-blend-overlay ${
        flash ? "opacity-60" : "opacity-0"
      }`}
    ></div>

    {/* 🌫️ Constant fog that covers entire screen */}
    <div className="absolute inset-0 bg-[url('/assets/spirits/fog.png')] bg-cover bg-center bg-no-repeat opacity-30 mix-blend-screen animate-fogMove"></div>

    {/* 👻 Ghostly spirits across all layers */}
    <div className="absolute inset-0 opacity-35 grayscale contrast-125 mix-blend-lighten">
      <img
        src="/assets/spirits/alien.jpg"
        alt="Eshu Elegba"
        className="absolute w-[28rem] left-10 top-5 animate-fadeMove"
      />
      <img
        src="/assets/spirits/amon.jpg"
        alt="Amun Ra"
        className="absolute w-[30rem] right-10 top-10 animate-fadeMoveSlow"
      />
      <img
        src="/assets/spirits/dogon.jpg"
        alt="Dogon Alien"
        className="absolute w-[26rem] left-1/3 top-1/3 animate-fadeMove"
      />
      <img
        src="/assets/spirits/pharoah.jpg"
        alt="Pharaoh"
        className="absolute w-[22rem] right-1/3 bottom-8 animate-fadeMoveSlow"
      />
      <img
        src="/assets/spirits/oba.png"
        alt="Oba"
        className="absolute w-[22rem] left-1/4 bottom-10 animate-fadeMove"
      />
      <img
        src="/assets/spirits/ra.jpg"
        alt="Ra"
        className="absolute w-[24rem] left-1/2 top-1/2 animate-fadeMoveSlow"
      />
      <img
        src="/assets/spirits/yemoja.jpg"
        alt="Yemoja"
        className="absolute w-[26rem] right-1/2 bottom-0 animate-fadeMove"
      />
    </div>

    {/* 🕯️ Title & tagline */}
    <div className="text-center z-10 flex flex-col items-center justify-center h-full">
      <h1 className="text-8xl font-bold mb-6 bg-gradient-to-r from-gray-100 via-white to-gray-400 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_25px_#ffffff66]">
        {gameTitle}
      </h1>
      <p className="text-3xl text-gray-300 font-light tracking-widest animate-pulse mb-8">
        {gameSubtitle}
      </p>
      <div className="flex items-center justify-center gap-4 text-gray-400">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-ping"></div>
        <p className="text-lg italic">Summoning Ancient Guardians…</p>
        <div
          className="w-2 h-2 bg-gray-400 rounded-full animate-ping"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </div>
  </div>
)}



      {/* Main Menu */}
      {screen === 'menu' && (
        <div className="relative min-h-screen flex flex-col">
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b-2 border-orange-900 bg-black bg-opacity-80">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {gameTitle}
              </h1>
              <p className="text-sm text-gray-400 mt-1">{gameSubtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                {audioEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
              <button
                onClick={() => setShowCredits(true)}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                <Info size={24} />
              </button>
              <button
                onClick={connectWallet}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition ${
                  walletConnected ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'
                }`}
              >
                <Wallet size={20} />
                {walletConnected ? 'Connected' : 'Connect Wallet'}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-6xl w-full">
              <div className="text-center mb-8">
                <h2 className="text-5xl font-bold mb-4 text-orange-400">
                  Select Your Journey
                </h2>
                <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                  Explore 4 ancient African realms, collect mystical spirits as NFTs, and earn HBAR rewards. 
                  Each location offers unique challenges and cultural treasures.
                </p>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-4 text-center border-2 border-purple-500">
                  <div className="text-3xl mb-2">🌍</div>
                  <div className="text-2xl font-bold text-purple-300">{stats.levels}</div>
                  <div className="text-sm text-gray-300">Countries</div>
                </div>
                <div className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-lg p-4 text-center border-2 border-orange-500">
                  <div className="text-3xl mb-2">👻</div>
                  <div className="text-2xl font-bold text-orange-300">{stats.totalSpirits}+</div>
                  <div className="text-sm text-gray-300">Unique Spirits</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg p-4 text-center border-2 border-yellow-500">
                  <div className="text-3xl mb-2">🎨</div>
                  <div className="text-2xl font-bold text-yellow-300">{stats.totalArtifacts}+</div>
                  <div className="text-sm text-gray-300">Cultural NFTs</div>
                </div>
                <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-4 text-center border-2 border-green-500">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-2xl font-bold text-green-300">{stats.maxHbar}+</div>
                  <div className="text-sm text-gray-300">Max HBAR</div>
                </div>
              </div>

              {/* Interactive Africa Map */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border-4 border-orange-600 shadow-2xl">
                <h3 className="text-3xl font-bold text-center mb-6 text-orange-400">
                  🗺️ Interactive Map of Africa
                </h3>
                
                <div className="relative bg-gradient-to-br from-blue-900 to-green-900 rounded-xl overflow-hidden"
                     style={{ 
                       backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(34, 139, 34, 0.3) 0%, rgba(139, 69, 19, 0.3) 40%, rgba(210, 180, 140, 0.2) 70%)',
                       boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
                     }}>
                  {/* Realistic Africa Map with Texture */}
                  <svg 
                    viewBox="0 0 1000 1100" 
                    className="w-full"
                    style={{ filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.5))' }}
                  >
                    <defs>
                      {/* Terrain gradient for realistic look */}
                      <radialGradient id="terrainGrad" cx="50%" cy="40%">
                        <stop offset="0%" style={{ stopColor: '#8B7355', stopOpacity: 1 }} />
                        <stop offset="30%" style={{ stopColor: '#6B8E23', stopOpacity: 1 }} />
                        <stop offset="60%" style={{ stopColor: '#D2B48C', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#8FBC8F', stopOpacity: 1 }} />
                      </radialGradient>
                      
                      {/* Shadow for 3D effect */}
                      <filter id="shadow">
                        <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.5"/>
                      </filter>

                      {/* Pattern for terrain texture */}
                      <pattern id="terrain" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#6B5D4F" opacity="0.1"/>
                        <circle cx="12" cy="8" r="1" fill="#5D7F3E" opacity="0.1"/>
                        <circle cx="18" cy="15" r="1" fill="#8B7355" opacity="0.1"/>
                      </pattern>
                    </defs>

                    {/* Ocean/Water background */}
                    <rect x="0" y="0" width="1000" height="1100" fill="#1e3a5f" opacity="0.3"/>

                    {/* More detailed, realistic Africa continent shape */}
                    <path
                      d="M 520 80 
                         C 540 85, 560 95, 570 110
                         L 590 140
                         C 595 155, 600 175, 605 195
                         L 620 240
                         C 625 265, 635 290, 638 315
                         L 645 360
                         C 648 390, 650 420, 655 450
                         L 658 490
                         C 660 520, 658 550, 655 580
                         L 648 630
                         C 640 670, 625 705, 605 740
                         L 580 780
                         C 560 810, 535 835, 505 855
                         L 465 880
                         C 435 895, 400 905, 365 908
                         L 315 910
                         C 275 908, 235 900, 200 885
                         L 160 865
                         C 130 845, 105 820, 85 790
                         L 65 750
                         C 50 715, 42 675, 40 635
                         L 38 585
                         C 38 545, 42 505, 50 465
                         L 60 420
                         C 68 380, 80 340, 95 305
                         L 115 265
                         C 130 230, 150 200, 175 175
                         L 205 145
                         C 230 120, 260 100, 295 88
                         L 340 75
                         C 375 68, 410 65, 445 68
                         L 485 72
                         C 500 74, 510 77, 520 80 Z"
                      fill="url(#terrainGrad)"
                      stroke="#4a3a2a"
                      strokeWidth="3"
                      filter="url(#shadow)"
                      className="transition-all duration-300"
                    />

                    {/* Terrain texture overlay */}
                    <path
                      d="M 520 80 C 540 85, 560 95, 570 110 L 590 140 C 595 155, 600 175, 605 195 L 620 240 C 625 265, 635 290, 638 315 L 645 360 C 648 390, 650 420, 655 450 L 658 490 C 660 520, 658 550, 655 580 L 648 630 C 640 670, 625 705, 605 740 L 580 780 C 560 810, 535 835, 505 855 L 465 880 C 435 895, 400 905, 365 908 L 315 910 C 275 908, 235 900, 200 885 L 160 865 C 130 845, 105 820, 85 790 L 65 750 C 50 715, 42 675, 40 635 L 38 585 C 38 545, 42 505, 50 465 L 60 420 C 68 380, 80 340, 95 305 L 115 265 C 130 230, 150 200, 175 175 L 205 145 C 230 120, 260 100, 295 88 L 340 75 C 375 68, 410 65, 445 68 L 485 72 C 500 74, 510 77, 520 80 Z"
                      fill="url(#terrain)"
                      opacity="0.6"
                    />

                    {/* Geographic features - Sahara Desert (North) */}
                    <ellipse cx="380" cy="180" rx="180" ry="80" fill="#DEB887" opacity="0.4"/>
                    <text x="380" y="185" textAnchor="middle" fill="#8B7355" fontSize="14" opacity="0.5" fontStyle="italic">Sahara</text>

                    {/* Great Rift Valley indicator */}
                    <line x1="600" y1="350" x2="620" y2="550" stroke="#654321" strokeWidth="8" opacity="0.3"/>

                    {/* Congo Rainforest (Central) */}
                    <ellipse cx="380" cy="480" rx="120" ry="90" fill="#2F4F2F" opacity="0.4"/>
                    <text x="380" y="485" textAnchor="middle" fill="#1a3a1a" fontSize="12" opacity="0.5" fontStyle="italic">Congo Basin</text>

                    {/* Coastline highlights */}
                    <path
                      d="M 520 80 C 540 85, 560 95, 570 110 L 590 140"
                      fill="none"
                      stroke="#87CEEB"
                      strokeWidth="2"
                      opacity="0.6"
                    />

                    {/* Mediterranean coast */}
                    <path d="M 340 75 L 520 80" stroke="#87CEEB" strokeWidth="3" opacity="0.5"/>

                    {/* Indian Ocean coast */}
                    <path d="M 590 140 L 658 490 L 655 580" stroke="#4682B4" strokeWidth="3" opacity="0.5"/>

                    {/* Atlantic Ocean coast */}
                    <path d="M 85 790 L 160 865 L 200 885" stroke="#4682B4" strokeWidth="3" opacity="0.5"/>

                    {/* Country Borders (subtle) */}
                    <path d="M 520 80 L 380 280" stroke="#4a3a2a" strokeWidth="1" strokeDasharray="3,3" opacity="0.3"/>
                    <path d="M 380 280 L 300 480" stroke="#4a3a2a" strokeWidth="1" strokeDasharray="3,3" opacity="0.3"/>
                    <path d="M 520 200 L 600 400" stroke="#4a3a2a" strokeWidth="1" strokeDasharray="3,3" opacity="0.3"/>

                    {/* Country Labels (subtle) */}
                    <text x="250" y="200" fill="#6B5D4F" fontSize="11" opacity="0.4" fontStyle="italic">Morocco</text>
                    <text x="420" y="250" fill="#6B5D4F" fontSize="11" opacity="0.4" fontStyle="italic">Libya</text>
                    <text x="280" y="380" fill="#6B5D4F" fontSize="11" opacity="0.4" fontStyle="italic">Chad</text>
                    <text x="480" y="420" fill="#6B5D4F" fontSize="11" opacity="0.4" fontStyle="italic">Somalia</text>
                    <text x="250" y="580" fill="#6B5D4F" fontSize="11" opacity="0.4" fontStyle="italic">Angola</text>
                    <text x="500" y="750" fill="#6B5D4F" fontSize="11" opacity="0.4" fontStyle="italic">South Africa</text>

                    {/* Playable Country Markers with enhanced styling */}
                    {Object.values(countries).map((country) => {
                      let x, y;
                      
                      // Realistic positioning on the map
                      if (country.id === 'egypt') {
                        x = 520; y = 180; // North, by Mediterranean
                      } else if (country.id === 'ethiopia') {
                        x = 600; y = 380; // Horn of Africa
                      } else if (country.id === 'senegal') {
                        x = 250; y = 320; // ADD THIS - West Africa, below Morocco
                      } else if (country.id === 'nigeria') {
                        x = 300; y = 420; // West Africa
                      } else if (country.id === 'kenya') {
                        x = 620; y = 470; // East Africa, near coast
                      }

                      const isHovered = hoveredCountry === country.id;
                      const isSelected = selectedCountry === country.id;

                      return (
                        <g
                          key={country.id}
                          onMouseEnter={() => setHoveredCountry(country.id)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          onClick={() => {
                            setSelectedCountry(country.id);
                            setScreen('countryInfo');
                            if (audioEnabled) playClickSound();
                          }}
                          className="cursor-pointer transition-all duration-300"
                          style={{ 
                            transform: isHovered ? 'scale(1.3)' : 'scale(1)', 
                            transformOrigin: `${x}px ${y}px`,
                            transition: 'transform 0.3s ease'
                          }}
                        >
                          {/* Outer glow (animated) */}
                          {(isHovered || isSelected) && (
                            <>
                              <circle
                                cx={x}
                                cy={y}
                                r="45"
                                fill={country.color}
                                opacity="0.15"
                                className="animate-ping"
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="38"
                                fill={country.color}
                                opacity="0.25"
                                className="animate-pulse"
                              />
                            </>
                          )}
                          
                          {/* Pin shadow */}
                          <circle
                            cx={x + 2}
                            cy={y + 2}
                            r="26"
                            fill="#000"
                            opacity="0.3"
                          />

                          {/* Main pin background */}
                          <circle
                            cx={x}
                            cy={y}
                            r="26"
                            fill={country.color}
                            stroke="#fff"
                            strokeWidth="4"
                            filter="url(#shadow)"
                          />

                          {/* Inner circle */}
                          <circle
                            cx={x}
                            cy={y}
                            r="20"
                            fill={isHovered ? '#fff' : country.color}
                            opacity={isHovered ? 0.9 : 1}
                          />
                          
                          {/* Flag emoji */}
                          <text
                            x={x}
                            y={y + 10}
                            textAnchor="middle"
                            fontSize="28"
                            className="pointer-events-none"
                            filter="url(#shadow)"
                          >
                            {country.flag}
                          </text>

                          {/* Country name label with background */}
                          <rect
                            x={x - 45}
                            y={y - 55}
                            width="90"
                            height="28"
                            fill="#000"
                            opacity="0.8"
                            rx="4"
                          />
                          <text
                            x={x}
                            y={y - 35}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="18"
                            fontWeight="bold"
                            className="pointer-events-none"
                          >
                            {country.name}
                          </text>

                          {/* Pulsing ring on hover */}
                          {isHovered && (
                            <>
                              <circle
                                cx={x}
                                cy={y}
                                r="32"
                                fill="none"
                                stroke={country.color}
                                strokeWidth="3"
                                opacity="0.8"
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="38"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="2"
                                className="animate-ping"
                              />
                            </>
                          )}

                          {/* Location indicator lines */}
                          {isHovered && (
                            <>
                              <line x1={x} y1={y - 30} x2={x} y2={y - 60} stroke={country.color} strokeWidth="2" strokeDasharray="4,2"/>
                              <circle cx={x} cy={y - 65} r="4" fill={country.color}/>
                            </>
                          )}
                        </g>
                      );
                    })}

                    {/* Journey path connecting countries */}
                    <path
                      d="M 520 180 Q 560 280, 600 380 Q 460 400, 300 420 Q 460 445, 620 470"
                      stroke="#FFD700"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      fill="none"
                      opacity="0.4"
                      strokeLinecap="round"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="24"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </path>

                    {/* Compass rose */}
                    <g transform="translate(900, 100)" opacity="0.6">
                      <circle cx="0" cy="0" r="40" fill="#2a2a2a" stroke="#FFD700" strokeWidth="2"/>
                      <text x="0" y="-25" textAnchor="middle" fill="#FFD700" fontSize="20" fontWeight="bold">N</text>
                      <text x="0" y="32" textAnchor="middle" fill="#ccc" fontSize="16">S</text>
                      <text x="28" y="5" textAnchor="middle" fill="#ccc" fontSize="16">E</text>
                      <text x="-28" y="5" textAnchor="middle" fill="#ccc" fontSize="16">W</text>
                      <polygon points="0,-30 -5,-10 0,-15 5,-10" fill="#FFD700"/>
                    </g>

                    {/* Scale indicator */}
                    <g transform="translate(100, 1000)">
                      <line x1="0" y1="0" x2="100" y2="0" stroke="#fff" strokeWidth="3"/>
                      <line x1="0" y1="-5" x2="0" y2="5" stroke="#fff" strokeWidth="3"/>
                      <line x1="100" y1="-5" x2="100" y2="5" stroke="#fff" strokeWidth="3"/>
                      <text x="50" y="20" textAnchor="middle" fill="#fff" fontSize="12">~2000 km</text>
                    </g>
                  </svg>

                  {/* Hover Info Box */}
                  {hoveredCountry && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-gray-900 to-gray-800 border-3 rounded-xl p-5 w-96 shadow-2xl"
                         style={{ borderColor: countries[hoveredCountry].color, borderWidth: '3px' }}>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-5xl">{countries[hoveredCountry].image}</span>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold" style={{ color: countries[hoveredCountry].color }}>
                            {countries[hoveredCountry].name} {countries[hoveredCountry].flag}
                          </h4>
                          <p className="text-sm text-gray-400">{countries[hoveredCountry].region}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">{countries[hoveredCountry].venue}</p>
                      <div className="flex gap-2 mb-2">
                        <span className="text-xs bg-purple-600 px-3 py-1 rounded-full font-bold">{countries[hoveredCountry].gameStyle}</span>
                        <span className="text-xs bg-orange-600 px-3 py-1 rounded-full font-bold">{countries[hoveredCountry].difficulty}</span>
                      </div>
                      <p className="text-sm text-yellow-400 font-bold mt-3 flex items-center gap-2">
                        <span className="text-xl">👆</span> Click to explore this realm
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-center mt-6 text-gray-300">
                  <p className="text-lg font-semibold mb-2">🎮 Choose Your Adventure</p>
                  <p className="text-sm text-gray-400">Hover over countries to preview • Click to begin your quest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Country Info Screen */}
      {screen === 'countryInfo' && selectedCountry && (
        <div className="relative min-h-screen flex items-center justify-center p-8">
          <button
            onClick={() => {
              setScreen('menu');
              setSelectedCountry(null);
            }}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} /> Back to Map
          </button>

          <div className="max-w-5xl w-full">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden border-4 shadow-2xl"
                 style={{ borderColor: countries[selectedCountry].color }}>
              
              {/* Header */}
              <div className="p-8 text-center"
                   style={{ backgroundColor: `${countries[selectedCountry].color}22` }}>
                <div className="text-8xl mb-4">{countries[selectedCountry].image}</div>
                <h2 className="text-5xl font-bold mb-2"
                    style={{ color: countries[selectedCountry].color }}>
                  {countries[selectedCountry].flag} {countries[selectedCountry].name}
                </h2>
                <p className="text-xl text-gray-300">{countries[selectedCountry].region}</p>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Venue */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2"
                      style={{ color: countries[selectedCountry].color }}>
                    📍 Sacred Location
                  </h3>
                  <p className="text-xl text-gray-200 mb-2">{countries[selectedCountry].venue}</p>
                </div>

                {/* Story */}
                <div className="mb-6 bg-gray-800 p-6 rounded-lg border-2"
                     style={{ borderColor: `${countries[selectedCountry].color}88` }}>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2"
                      style={{ color: countries[selectedCountry].color }}>
                    📖 The Legend
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-lg">
                    {countries[selectedCountry].story}
                  </p>
                </div>

                {/* People & Culture */}
                <div className="mb-6 bg-gray-800 p-6 rounded-lg border-2"
                     style={{ borderColor: `${countries[selectedCountry].color}88` }}>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2"
                      style={{ color: countries[selectedCountry].color }}>
                    <Users size={24} /> The People
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {countries[selectedCountry].people}
                  </p>
                </div>

                {/* Gameplay */}
                <div className="mb-6 bg-gray-800 p-6 rounded-lg border-2"
                     style={{ borderColor: `${countries[selectedCountry].color}88` }}>
                  <h3 className="text-2xl font-bold mb-3 flex items-center gap-2"
                      style={{ color: countries[selectedCountry].color }}>
                    🎮 Gameplay
                  </h3>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {countries[selectedCountry].gameplay}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong className="text-orange-400">Style:</strong> {countries[selectedCountry].gameStyle}
                    </div>
                    <div>
                      <strong className="text-orange-400">Difficulty:</strong> {countries[selectedCountry].difficulty}
                    </div>
                    <div>
                      <strong className="text-orange-400">Power:</strong> {countries[selectedCountry].power}
                    </div>
                    <div>
                      <strong className="text-orange-400">Rewards:</strong> {countries[selectedCountry].rewards}
                    </div>
                  </div>
                </div>

                {/* Spirits */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold mb-4"
                      style={{ color: countries[selectedCountry].color }}>
                    👻 Spirits to Collect
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {countries[selectedCountry].spirits.map((spirit, i) => (
                      <div key={i} className="bg-gray-700 px-4 py-2 rounded-lg border-2"
                           style={{ borderColor: countries[selectedCountry].color }}>
                        {spirit}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={() => startGame(selectedCountry)}
                  className="w-full py-6 rounded-xl text-2xl font-bold transition transform hover:scale-105 flex items-center justify-center gap-3"
                  style={{ backgroundColor: countries[selectedCountry].color, color: '#000' }}
                >
                  <Play size={32} />
                  Begin Quest in {countries[selectedCountry].name}
                  <Zap size={32} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credits Modal */}
      {showCredits && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-2xl border-4 border-orange-600">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-3xl font-bold text-orange-400">About the Game</h3>
              <button
                onClick={() => setShowCredits(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 text-gray-300">
              <p>
                <strong className="text-orange-400">Ancestral Spirits</strong> is a cultural journey through 
                ancient Africa, combining spooky atmosphere with authentic African heritage.
              </p>
              
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-xl font-bold text-orange-400 mb-2">Built For:</h4>
                <p>🎃 Hackeroos Spooky Reddit Game Jam</p>
                <p>🌍 Hedera Africa - Blockchain Gaming Track</p>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-xl font-bold text-orange-400 mb-2">Technologies:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>React + Three.js for 3D graphics</li>
                  <li>Hedera Hashgraph for blockchain NFTs</li>
                  <li>ElevenLabs for authentic audio</li>
                  <li>Reddit Devvit WebView platform</li>
                </ul>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-xl font-bold text-orange-400 mb-2">Features:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>✅ 4 Unique Countries</div>
                  <div>✅ 20+ Collectible Spirits</div>
                  <div>✅ 32+ Cultural NFTs</div>
                  <div>✅ Play-to-Earn HBAR</div>
                  <div>✅ 2D & 3D Gameplay</div>
                  <div>✅ Action Combat</div>
                  <div>✅ Cultural Education</div>
                  <div>✅ Authentic Art</div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 text-center">
                <p className="text-sm text-gray-400">
                  Created with respect for African cultures and traditions
                </p>
                <p className="text-xl mt-2">🌍 ❤️ 🎮</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AncestralSpiritsMainMenu;