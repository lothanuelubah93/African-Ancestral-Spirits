import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Wallet, Trophy, Info, MapPin, ArrowLeft } from 'lucide-react';
import * as THREE from 'three';
import { useAudio } from '../shared/AudioPlayer';

const AncestralSpiritsNigeria3D = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [score, setScore] = useState(0);
  const [hbarEarned, setHbarEarned] = useState(0);
  const [collectedSpirits, setCollectedSpirits] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [ancestorPowerActive, setAncestorPowerActive] = useState(false);
  const [ancestorCooldown, setAncestorCooldown] = useState(0);

  // Audio hook
  const { 
    playSound, 
    playAmbient, 
    transitionAmbient, 
    stopAmbient, 
    setEnabled, 
    preloadLevel,
    isLoading 
  } = useAudio();

  // Three.js refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const spiritMeshesRef = useRef([]);
  const keysPressed = useRef({});
  const mouseMovement = useRef({ x: 0, y: 0 });

  // Nigerian temples/sites data
  const nigerianSites = [
    {
      id: 'eshu',
      name: 'Eshu Temple',
      location: 'Yorubaland, Southwest Nigeria',
      deity: 'Eshu (Trickster & Crossroads Guardian)',
      period: '15th-19th Century',
      description: 'Sacred shrine to Eshu, the divine messenger and guardian of crossroads. Known for his cunning and ability to open or close paths between worlds.',
      color: '#8B0000',
      spiritTypes: [
        { name: 'Eshu', color: 0x8b0000, rarity: 'legendary', hbar: 60, description: 'Divine trickster of the crossroads' },
        { name: 'Elegba', color: 0xdc143c, rarity: 'rare', hbar: 35, description: 'Keeper of destiny and fate' },
        { name: 'Ako', color: 0xff4500, rarity: 'common', hbar: 15, description: 'Spirit of mischief and change' }
      ],
      environment: 'crossroads'
    },
    {
      id: 'anyanwu',
      name: 'Anyanwu Temple',
      location: 'Igboland, Southeast Nigeria',
      deity: 'Anyanwu (Sun Deity)',
      period: '12th-18th Century',
      description: 'Temple dedicated to Anyanwu, the radiant sun goddess who brings light, warmth, and life. Worshipped as the eye of Chukwu (Supreme God).',
      color: '#FFD700',
      spiritTypes: [
        { name: 'Anyanwu', color: 0xffd700, rarity: 'legendary', hbar: 60, description: 'Sun goddess of illumination' },
        { name: 'Chi', color: 0xffa500, rarity: 'rare', hbar: 35, description: 'Personal guardian spirit' },
        { name: 'Agwu', color: 0xff8c00, rarity: 'common', hbar: 15, description: 'Spirit of divination' }
      ],
      environment: 'sun_temple'
    },
    {
      id: 'oba_palace',
      name: 'Ancient Oba Palace',
      location: 'Benin City, Edo State',
      deity: 'Oba & Royal Ancestors',
      period: '13th-19th Century (Benin Empire)',
      description: 'Magnificent palace of the Oba of Benin, adorned with legendary bronze plaques and sculptures. Center of the powerful Benin Empire.',
      color: '#CD7F32',
      spiritTypes: [
        { name: 'Egungun', color: 0x8b4513, rarity: 'legendary', hbar: 60, description: 'Ancestral masquerade spirit' },
        { name: 'Olokun', color: 0x4682b4, rarity: 'rare', hbar: 35, description: 'Spirit of wealth and ocean' },
        { name: 'Ogun', color: 0x696969, rarity: 'common', hbar: 15, description: 'Spirit of iron and war' }
      ],
      environment: 'bronze_palace'
    },
    {
      id: 'kano',
      name: 'Ancient Kano Sites',
      location: 'Kano, Northern Nigeria',
      deity: 'Ancient Spirits of Hausaland',
      period: '10th-19th Century',
      description: 'Historic sites of ancient Kano, a major center of trans-Saharan trade and Islamic learning. Clay mosques and earthen walls tell stories of centuries past.',
      color: '#D2691E',
      spiritTypes: [
        { name: 'Bori', color: 0xd2691e, rarity: 'legendary', hbar: 60, description: 'Possession spirit of Hausa tradition' },
        { name: 'Inna', color: 0xdaa520, rarity: 'rare', hbar: 35, description: 'Mother spirit of the land' },
        { name: 'Dan Galadima', color: 0xcd853f, rarity: 'common', hbar: 15, description: 'Noble spirit warrior' }
      ],
      environment: 'desert_city'
    }
  ];

  // Preload audio when level starts
  useEffect(() => {
    if (gameState === 'playing' && selectedTemple) {
      preloadLevel('nigeria');
      
      // Start ambient sound based on temple
      setTimeout(() => {
        playAmbient('nigeria_ambient_start', true);
      }, 500);
    }
    
    return () => {
      stopAmbient();
    };
  }, [gameState, selectedTemple]);

  // Toggle audio enabled/disabled
  useEffect(() => {
    setEnabled(audioEnabled);
  }, [audioEnabled, setEnabled]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || gameState !== 'playing') return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x2a1a0a, 5, 50);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 1.6, 5);
    camera.userData = {}; // For footstep tracking
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting based on temple type
    setupLighting(scene);

    // Create environment based on selected temple
    createEnvironment(scene, selectedTemple);

    // Spawn spirits
    const spiritTypes = nigerianSites.find(s => s.id === selectedTemple).spiritTypes;
    spiritTypes.forEach((_, i) => {
      setTimeout(() => spawnSpirit3D(scene, spiritTypes), i * 1000);
    });

    // Mouse controls
    const handleMouseMove = (e) => {
      if (gameState !== 'playing') return;
      mouseMovement.current.x += e.movementX * 0.002;
      mouseMovement.current.y -= e.movementY * 0.002;
      mouseMovement.current.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseMovement.current.y));
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('click', () => {
      renderer.domElement.requestPointerLock();
    });

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameState, selectedTemple]);

  // Setup lighting based on temple
  const setupLighting = (scene) => {
    const temple = nigerianSites.find(s => s.id === selectedTemple);
    
    if (temple.id === 'anyanwu') {
      // Bright sun lighting
      const sunLight = new THREE.DirectionalLight(0xffd700, 1);
      sunLight.position.set(5, 10, 5);
      sunLight.castShadow = true;
      scene.add(sunLight);
      
      const ambientLight = new THREE.AmbientLight(0xffa500, 0.6);
      scene.add(ambientLight);
    } else if (temple.id === 'kano') {
      // Desert warm lighting
      const desertLight = new THREE.DirectionalLight(0xffa500, 0.8);
      desertLight.position.set(3, 8, 3);
      scene.add(desertLight);
      
      const ambientLight = new THREE.AmbientLight(0xd2691e, 0.4);
      scene.add(ambientLight);
    } else {
      // Torch/fire lighting
      const ambientLight = new THREE.AmbientLight(0x3d2817, 0.3);
      scene.add(ambientLight);
      
      // Torch light
      const torchLight = new THREE.PointLight(0xff6600, 1.5, 15);
      torchLight.position.set(0, 1.6, 5);
      torchLight.castShadow = true;
      scene.add(torchLight);
    }

    // Fire braziers
    const brazierPositions = [[-8, 1.5, -8], [8, 1.5, -8], [-8, 1.5, 8], [8, 1.5, 8]];
    brazierPositions.forEach(pos => {
      const fireLight = new THREE.PointLight(0xff4500, 0.8, 8);
      fireLight.position.set(...pos);
      scene.add(fireLight);
    });
  };

  // Create environment based on temple
  const createEnvironment = (scene, templeId) => {
    const temple = nigerianSites.find(s => s.id === templeId);
    
    if (temple.environment === 'crossroads') {
      createEshuCrossroads(scene);
    } else if (temple.environment === 'sun_temple') {
      createAnyanwuTemple(scene);
    } else if (temple.environment === 'bronze_palace') {
      createObaPalace(scene);
    } else if (temple.environment === 'desert_city') {
      createKanoCity(scene);
    }
  };

  // Eshu Temple - Crossroads
  const createEshuCrossroads = (scene) => {
    // Floor (dirt crossroads)
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Crossroads paths
    const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x6a5a4a });
    const pathNS = new THREE.Mesh(new THREE.PlaneGeometry(4, 40), pathMaterial);
    pathNS.rotation.x = -Math.PI / 2;
    pathNS.position.y = 0.01;
    scene.add(pathNS);

    const pathEW = new THREE.Mesh(new THREE.PlaneGeometry(40, 4), pathMaterial);
    pathEW.rotation.x = -Math.PI / 2;
    pathEW.position.y = 0.01;
    scene.add(pathEW);

    // Eshu statue at center
    const statueMaterial = new THREE.MeshStandardMaterial({ color: 0x8b0000, metalness: 0.3 });
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 3, 8), statueMaterial);
    statue.position.set(0, 1.5, 0);
    scene.add(statue);

    // Cowrie shells around statue
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xfff5ee })
      );
      shell.position.set(Math.cos(angle) * 2, 0.1, Math.sin(angle) * 2);
      scene.add(shell);
    }

    // Add Eshu Portrait with traditional clothing
    createEshuPortrait(scene);

    // Add Kola Nut offerings
    createKolaNuts(scene, [-3, 0.2, -3], [3, 0.2, -3]);

    // Walls with Yoruba patterns
    createWallsWithPatterns(scene, 0x5a4a3a);
  };

  // Anyanwu Temple - Sun Temple
  const createAnyanwuTemple = (scene) => {
    // Golden floor
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355, metalness: 0.2 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Sun disk at center (raised platform)
    const sunDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3.5, 0.5, 32),
      new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.5
      })
    );
    sunDisk.position.y = 0.25;
    scene.add(sunDisk);

    // Sun rays (pillars)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0xffa500 })
      );
      pillar.position.set(Math.cos(angle) * 6, 2, Math.sin(angle) * 6);
      scene.add(pillar);

      // Golden tips
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 1, 8),
        new THREE.MeshStandardMaterial({ 
          color: 0xffd700,
          emissive: 0xffd700,
          emissiveIntensity: 0.3
        })
      );
      tip.position.set(Math.cos(angle) * 6, 4.5, Math.sin(angle) * 6);
      scene.add(tip);
    }

    // Add Igbo cultural portraits and wrapper cloth art
    createAnyanwuPortrait(scene);
    createIgboWrapperCloth(scene);

    createWallsWithPatterns(scene, 0xdaa520);
  };

  // Oba Palace - Bronze Hall
  const createObaPalace = (scene) => {
    // Rich floor
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.8 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Bronze plaques on walls
    createBronzePlaques(scene);

    // Throne
    const throne = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0xcd7f32, metalness: 0.7 })
    );
    throne.position.set(0, 1, -15);
    scene.add(throne);

    // Coral beads decoration
    for (let i = 0; i < 20; i++) {
      const bead = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xff6347, metalness: 0.5 })
      );
      bead.position.set(
        (Math.random() - 0.5) * 15,
        Math.random() * 3,
        -14 + Math.random() * 2
      );
      scene.add(bead);
    }

    // Add Oba portrait in royal regalia
    createObaPortrait(scene);

    // Add Edo traditional clothing display
    createEdoClothing(scene);

    createWallsWithPatterns(scene, 0x4a3a2a);
  };

  // Kano City - Desert Architecture
  const createKanoCity = (scene) => {
    // Sandy floor
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Clay walls (earthen architecture)
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xd2691e });
    
    // Create rounded walls (Hausa architecture)
    for (let i = 0; i < 4; i++) {
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 6, 16, 1, true, 0, Math.PI),
        wallMaterial
      );
      wall.rotation.y = (i * Math.PI) / 2;
      wall.position.set(
        i % 2 === 0 ? 0 : (i === 1 ? 15 : -15),
        3,
        i % 2 === 1 ? 0 : (i === 0 ? -15 : 15)
      );
      scene.add(wall);
    }

    // Minaret-style tower
    const minaret = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xcd853f })
    );
    minaret.position.set(-10, 4, -10);
    scene.add(minaret);

    // Add Hausa traditional clothing and portraits
    createHausaPortrait(scene);
    createHausaTextile(scene);

    // Arabic patterns
    createWallsWithPatterns(scene, 0xd2691e);
  };

  // Create walls with cultural patterns
  const createWallsWithPatterns = (scene, color) => {
    const wallHeight = 8;
    const wallMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });

    // Four walls
    const walls = [
      { pos: [0, wallHeight / 2, -20], size: [40, wallHeight, 0.5] },
      { pos: [0, wallHeight / 2, 20], size: [40, wallHeight, 0.5] },
      { pos: [20, wallHeight / 2, 0], size: [0.5, wallHeight, 40] },
      { pos: [-20, wallHeight / 2, 0], size: [0.5, wallHeight, 40] }
    ];

    walls.forEach(({ pos, size }) => {
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(...size),
        wallMaterial
      );
      wall.position.set(...pos);
      wall.castShadow = true;
      scene.add(wall);
    });

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: color - 0x202020, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    scene.add(ceiling);
  };

  // Create bronze plaques (Benin art)
  const createBronzePlaques = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#CD7F32';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 236);

    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.arc(128, 100, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(98, 60, 60, 20);
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(100 + i * 15, 60);
      ctx.lineTo(107 + i * 15, 45);
      ctx.lineTo(114 + i * 15, 60);
      ctx.fill();
    }

    ctx.fillRect(88, 130, 80, 100);

    ctx.fillStyle = '#D4AF37';
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        ctx.beginPath();
        ctx.arc(50 + x * 40, 160 + y * 20, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    const plaqueMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.6,
      roughness: 0.4
    });

    const plaquePositions = [
      [0, 4, -19.4],
      [-8, 4, -19.4],
      [8, 4, -19.4]
    ];

    plaquePositions.forEach(pos => {
      const plaque = new THREE.Mesh(
        new THREE.BoxGeometry(3, 4, 0.2),
        plaqueMaterial
      );
      plaque.position.set(...pos);
      scene.add(plaque);
    });
  };

  // Create Eshu Portrait
  const createEshuPortrait = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.fillStyle = '#3a2010';
    ctx.beginPath();
    ctx.arc(256, 200, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#DC143C';
    ctx.fillRect(176, 120, 160, 40);
    
    ctx.fillStyle = '#FFF5EE';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(190 + i * 25, 140, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(176, 270, 160, 180);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(230, 280, 52, 160);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(220, 190 + i * 10);
      ctx.lineTo(235, 190 + i * 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(277, 190 + i * 10);
      ctx.lineTo(292, 190 + i * 10);
      ctx.stroke();
    }

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(150, 350);
    ctx.lineTo(150, 480);
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('ESHU - Guardian of Crossroads', 256, 490);

    createInteractiveArt(scene, canvas, [-10, 4, -19.4], 'Eshu Portrait');
  };

  // Create Anyanwu Portrait
  const createAnyanwuPortrait = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 10;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(angle) * 200, 256 + Math.sin(angle) * 200);
      ctx.stroke();
    }

    ctx.fillStyle = '#2a1810';
    ctx.beginPath();
    ctx.arc(256, 220, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.arc(256, 220, 100, 0, Math.PI * 2);
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(186, 280, 140, 160);
    
    ctx.fillStyle = '#FFD700';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 7; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(190 + x * 20, 285 + y * 20, 18, 18);
        }
      }
    }

    ctx.fillStyle = '#FF6347';
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(216 + i * 8, 280, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#000';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('ANYANWU - Sun Goddess', 256, 480);

    createInteractiveArt(scene, canvas, [10, 4, -19.4], 'Anyanwu Portrait');
  };

  // Create Igbo Wrapper Cloth
  const createIgboWrapperCloth = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 512, 512);
    gradient.addColorStop(0, '#FF6347');
    gradient.addColorStop(0.5, '#FFD700');
    gradient.addColorStop(1, '#32CD32');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    
    for (let y = 0; y < 512; y += 50) {
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 25) {
        ctx.lineTo(x, y + (x % 50 === 0 ? 0 : 20));
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#FFF';
    for (let y = 1; y < 10; y++) {
      for (let x = 1; x < 10; x++) {
        ctx.beginPath();
        ctx.moveTo(x * 55, y * 55 - 10);
        ctx.lineTo(x * 55 + 10, y * 55);
        ctx.lineTo(x * 55, y * 55 + 10);
        ctx.lineTo(x * 55 - 10, y * 55);
        ctx.closePath();
        ctx.fill();
      }
    }

    createInteractiveArt(scene, canvas, [19.4, 4, 0], 'Igbo Wrapper Cloth', true);
  };

  // Create Oba Portrait
  const createObaPortrait = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#CD7F32';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 20;
    ctx.strokeRect(15, 15, 482, 482);

    ctx.fillStyle = '#2a1510';
    ctx.beginPath();
    ctx.arc(256, 220, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF6347';
    ctx.fillRect(181, 130, 150, 50);
    
    ctx.fillStyle = '#FFF5EE';
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 10; x++) {
        ctx.beginPath();
        ctx.arc(190 + x * 15, 145 + y * 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = '#FF6347';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(190 + i * 12, 180);
      ctx.lineTo(190 + i * 12, 250);
      ctx.stroke();
    }

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(156, 285, 200, 180);

    ctx.fillStyle = '#FF6347';
    for (let y = 0; y < 9; y++) {
      for (let x = 0; x < 13; x++) {
        ctx.beginPath();
        ctx.arc(162 + x * 15, 290 + y * 20, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#FFF5EE';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(216 + i * 10, 285);
      ctx.lineTo(219 + i * 10, 295);
      ctx.lineTo(213 + i * 10, 295);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('OBA of BENIN', 256, 485);

    createInteractiveArt(scene, canvas, [0, 4, -19.4], 'Oba Portrait');
  };

  // Create Edo Clothing
  const createEdoClothing = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#5a3a2a';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#8B0000';
    ctx.fillRect(100, 100, 312, 350);

    ctx.fillStyle = '#FF6347';
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y) % 3 === 0) {
          ctx.beginPath();
          ctx.arc(110 + x * 20, 110 + y * 20, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 8;
    ctx.strokeRect(100, 100, 312, 350);

    createInteractiveArt(scene, canvas, [-19.4, 4, 0], 'Edo Regalia', true);
  };

  // Create Hausa Portrait
  const createHausaPortrait = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 15;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.fillStyle = '#2a1810';
    ctx.beginPath();
    ctx.arc(256, 210, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F5F5F5';
    ctx.fillRect(186, 130, 140, 50);
    ctx.fillRect(216, 110, 80, 30);

    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(186, 140 + i * 8);
      ctx.lineTo(326, 140 + i * 8);
      ctx.stroke();
    }

    const robeGradient = ctx.createLinearGradient(156, 280, 356, 480);
    robeGradient.addColorStop(0, '#4682B4');
    robeGradient.addColorStop(1, '#1E90FF');
    ctx.fillStyle = robeGradient;
    ctx.fillRect(156, 280, 200, 190);

    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(256, 290);
    ctx.lineTo(256, 460);
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.arc(230, 300 + i * 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(282, 300 + i * 20, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#8B4513';
    ctx.font = 'bold 24px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hausa Traditional Attire', 256, 485);

    createInteractiveArt(scene, canvas, [10, 4, 19.4], 'Hausa Portrait');
  };

  // Create Hausa Textile
  const createHausaTextile = (scene) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#191970';
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#F5F5F5';
    
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x + y) % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(x * 32, y * 32);
          ctx.lineTo(x * 32 + 16, y * 32 + 28);
          ctx.lineTo(x * 32 + 32, y * 32);
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.fillStyle = '#FFD700';
    for (let y = 1; y < 8; y++) {
      for (let x = 1; x < 8; x++) {
        ctx.beginPath();
        ctx.arc(x * 64, y * 64, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    createInteractiveArt(scene, canvas, [-10, 4, 19.4], 'Hausa Textile', true);
  };

  // Create Kola Nuts
  const createKolaNuts = (scene, ...positions) => {
    positions.forEach(pos => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();

      const nutPositions = [
        [128, 80], [100, 120], [156, 120], [128, 160]
      ];

      nutPositions.forEach(([x, y]) => {
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(x, y, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y - 15);
        ctx.lineTo(x, y + 15);
        ctx.stroke();
      });

      const texture = new THREE.CanvasTexture(canvas);
      const nutMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0x3a2010,
        emissiveIntensity: 0.2
      });

      const nutPlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.1, 32),
        nutMaterial
      );
      nutPlate.position.set(...pos);
      nutPlate.rotation.x = -Math.PI / 2;
      
      nutPlate.userData = {
        type: 'collectible',
        name: 'Sacred Kola Nuts',
        hbar: 25,
        description: 'Traditional Yoruba offering symbolizing respect and hospitality'
      };

      scene.add(nutPlate);
    });
  };

  // Create Interactive Art
  const createInteractiveArt = (scene, canvas, position, name, isVertical = false) => {
    const texture = new THREE.CanvasTexture(canvas);
    const artMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      emissive: 0x3a2a1a,
      emissiveIntensity: 0.3
    });

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      artMaterial
    );

    if (isVertical) {
      art.rotation.y = position[0] > 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    
    art.position.set(...position);
    
    art.userData = {
      type: 'collectible',
      name: name,
      hbar: 40,
      description: `Authentic Nigerian cultural artifact - ${name}`
    };

    scene.add(art);

    const spotlight = new THREE.SpotLight(0xffd700, 0.6, 8, Math.PI / 6);
    spotlight.position.set(position[0], position[1] + 2, position[2] + (isVertical ? 0 : 2));
    spotlight.target = art;
    scene.add(spotlight);
  };

  // Spawn spirit
  const spawnSpirit3D = (scene, spiritTypes) => {
    if (!scene || !spiritTypes) return;

    const spiritType = spiritTypes[Math.floor(Math.random() * spiritTypes.length)];
    
    const spiritGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const spiritMaterial = new THREE.MeshStandardMaterial({
      color: spiritType.color,
      emissive: spiritType.color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.8
    });

    const spirit = new THREE.Mesh(spiritGeometry, spiritMaterial);
    spirit.position.set(
      (Math.random() - 0.5) * 30,
      1 + Math.random() * 3,
      (Math.random() - 0.5) * 30
    );

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshBasicMaterial({
        color: spiritType.color,
        transparent: true,
        opacity: 0.2
      })
    );
    spirit.add(glow);

    const spiritLight = new THREE.PointLight(spiritType.color, 0.8, 5);
    spirit.add(spiritLight);

    spirit.userData = {
      ...spiritType,
      floatPhase: Math.random() * Math.PI * 2,
      rotationSpeed: 0.01 + Math.random() * 0.02,
      originalY: spirit.position.y
    };

    scene.add(spirit);
    spiritMeshesRef.current.push(spirit);
    
    // Play spirit appear sound
    playSound('nigeria_spirit_appear', 0.4);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
      if (e.key === ' ' && gameState === 'playing' && ancestorCooldown === 0) {
        activateAncestorPower();
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, ancestorCooldown]);

  // Activate ancestor power
  const activateAncestorPower = () => {
    setAncestorPowerActive(true);
    setAncestorCooldown(30);

    // Play powerful Nigerian drum power sound
    playSound('nigeria_drum_power');
    
    // Transition to intense ambient
    transitionAmbient('nigeria_ambient_start', 'nigeria_ambient_intense', 2000);

    spiritMeshesRef.current.forEach(spirit => {
      spirit.userData.attracted = true;
    });

    setTimeout(() => {
      setAncestorPowerActive(false);
      spiritMeshesRef.current.forEach(spirit => {
        spirit.userData.attracted = false;
      });
      
      // Fade back to calm ambient after power ends
      transitionAmbient('nigeria_ambient_intense', 'nigeria_ambient_start', 3000);
    }, 5000);
  };

  // Cooldown timer
  useEffect(() => {
    if (ancestorCooldown > 0) {
      const timer = setTimeout(() => {
        setAncestorCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [ancestorCooldown]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return;

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();

      // Camera rotation
      camera.rotation.y = mouseMovement.current.x;
      camera.rotation.x = mouseMovement.current.y;

      // Player movement
      const moveSpeed = 5 * delta;
      const direction = new THREE.Vector3();
      let isMoving = false;

      if (keysPressed.current['w'] || keysPressed.current['ArrowUp']) { direction.z -= 1; isMoving = true; }
      if (keysPressed.current['s'] || keysPressed.current['ArrowDown']) { direction.z += 1; isMoving = true; }
      if (keysPressed.current['a'] || keysPressed.current['ArrowLeft']) { direction.x -= 1; isMoving = true; }
      if (keysPressed.current['d'] || keysPressed.current['ArrowRight']) { direction.x += 1; isMoving = true; }

      if (direction.length() > 0) {
        direction.normalize();
        const rotatedDirection = direction.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          camera.rotation.y
        );
        camera.position.x += rotatedDirection.x * moveSpeed;
        camera.position.z += rotatedDirection.z * moveSpeed;
        camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
        camera.position.z = Math.max(-18, Math.min(18, camera.position.z));
        
        // Play footstep sound periodically while moving
        if (!camera.userData.lastFootstep || Date.now() - camera.userData.lastFootstep > 500) {
          playSound('nigeria_footstep', 0.3);
          camera.userData.lastFootstep = Date.now();
        }
      }

      // Update spirits
      spiritMeshesRef.current.forEach((spirit, index) => {
        if (!spirit.parent) return;

        const userData = spirit.userData;
        userData.floatPhase += 0.02;
        spirit.position.y = userData.originalY + Math.sin(userData.floatPhase) * 0.3;
        spirit.rotation.y += userData.rotationSpeed;

        const glow = spirit.children[0];
        if (glow) {
          glow.scale.setScalar(1 + Math.sin(userData.floatPhase * 2) * 0.2);
        }

        if (userData.attracted) {
          const dx = camera.position.x - spirit.position.x;
          const dz = camera.position.z - spirit.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist > 0.5) {
            spirit.position.x += (dx / dist) * 0.1;
            spirit.position.z += (dz / dist) * 0.1;
          }
        }

        const distance = camera.position.distanceTo(spirit.position);
        if (distance < 1.5) {
          scene.remove(spirit);
          spiritMeshesRef.current.splice(index, 1);
          
          setCollectedSpirits(prev => [...prev, userData]);
          setScore(prev => prev + userData.hbar);
          setHbarEarned(prev => prev + userData.hbar);

          // Play collection sound
          playSound('nigeria_collect_spirit');

          const temple = nigerianSites.find(s => s.id === selectedTemple);
          setTimeout(() => spawnSpirit3D(scene, temple.spiritTypes), 3000);
        }
      });

      // Check for art/artifact collection
      scene.children.forEach((object) => {
        if (object.userData && object.userData.type === 'collectible') {
          const dist = camera.position.distanceTo(object.position);
          if (dist < 2) {
            // Show collection prompt
            object.material.emissiveIntensity = 0.6;
            
            // Collect on spacebar
            if (keysPressed.current[' ']) {
              scene.remove(object);
              setCollectedSpirits(prev => [...prev, {
                name: object.userData.name,
                hbar: object.userData.hbar,
                color: 0xffd700,
                rarity: 'artifact',
                description: object.userData.description
              }]);
              setScore(prev => prev + object.userData.hbar);
              setHbarEarned(prev => prev + object.userData.hbar);
              
              // Play artifact collection sound
              playSound('nigeria_artifact_collect');
            }
          } else {
            object.material.emissiveIntensity = 0.3;
          }
        }
      });

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameState, ancestorPowerActive, selectedTemple]);

  const connectWallet = () => {
    setWalletConnected(true);
    alert('Wallet Connected! (Demo mode)\n\nIn production, this would connect to your Hedera wallet via HashConnect.');
  };

  const startGame = (templeId) => {
    setSelectedTemple(templeId);
    setGameState('playing');
    setScore(0);
    setHbarEarned(0);
    setCollectedSpirits([]);
    spiritMeshesRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-green-400">🇳🇬 Ancestral Spirits</h1>
          <span className="text-sm bg-green-600 px-3 py-1 rounded">Nigeria Level (3D)</span>
          {isLoading && <span className="text-xs text-yellow-400 animate-pulse">🎵 Loading Afrobeat sounds...</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            <Info size={20} />
          </button>
          <button
            onClick={connectWallet}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              walletConnected ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'
            }`}
          >
            <Wallet size={18} />
            {walletConnected ? 'Connected' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="absolute top-20 bg-gray-800 border-2 border-green-500 rounded-lg p-6 max-w-md z-10">
          <h3 className="text-xl font-bold mb-3 text-green-400">🎵 Afro-Spooky Nigeria</h3>
          <ul className="space-y-2 text-sm">
            <li>🎮 <strong>Move:</strong> WASD or Arrow keys</li>
            <li>🖱️ <strong>Look:</strong> Click and move mouse</li>
            <li>👻 <strong>Collect Spirits:</strong> Walk near spirits to capture them</li>
            <li>🖼️ <strong>Collect Art:</strong> Approach portraits/artifacts and press SPACEBAR</li>
            <li>🥁 <strong>Ancestor Call:</strong> Press SPACEBAR (in open area) to attract spirits (30s cooldown)</li>
            <li>💰 <strong>Earn:</strong> Each spirit/artifact gives HBAR rewards</li>
            <li>🎵 <strong>Audio:</strong> Yoruba drums, Shekere, Afrobeat & ElevenLabs AI</li>
          </ul>
          <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-500 rounded">
            <p className="text-xs text-yellow-200">
              <strong>💡 Tip:</strong> Each temple has unique sounds! Listen for Dundun talking drums, Fela Kuti-style saxophone riffs, and haunted ceremonial chants as you explore Nigerian heritage sites!
            </p>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-4 w-full bg-green-600 hover:bg-green-500 py-2 rounded"
          >
            Close
          </button>
        </div>
      )}

      {/* Game Area */}
      <div className="relative">
        <div
          ref={mountRef}
          className="border-4 border-green-600 rounded-lg shadow-2xl bg-black"
          style={{ width: 800, height: 600 }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-4xl font-bold mb-4 text-green-400">🥁 Ancestral Spirits: Nigeria</h2>
            <p className="text-gray-300 mb-8 text-center max-w-md">
              Journey through ancient Nigerian sites with Afrobeat & Yoruba drums
            </p>
            <button
              onClick={() => setGameState('mapView')}
              className="bg-green-600 hover:bg-green-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              🗺️ View Map
            </button>
          </div>
        )}

        {/* Map View */}
        {gameState === 'mapView' && (
          <div className="absolute inset-0 bg-gradient-to-b from-green-900 to-black bg-opacity-95 flex flex-col items-center justify-center rounded-lg p-6 overflow-auto">
            <h2 className="text-3xl font-bold mb-6 text-green-400">Nigeria - West Africa</h2>
            
            {/* SVG Map */}
            <svg width="300" height="400" viewBox="0 0 300 400" className="mb-6">
              <path
                d="M 150 20 L 160 30 L 170 50 L 180 80 L 185 110 L 190 140 L 195 180 L 200 220 L 205 260 L 200 300 L 190 330 L 170 360 L 140 380 L 100 390 L 60 385 L 30 370 L 15 340 L 10 300 L 20 260 L 30 220 L 35 180 L 40 140 L 50 100 L 65 70 L 85 45 L 110 25 L 130 18 Z"
                fill="#2a4a2a"
                stroke="#4a6a4a"
                strokeWidth="2"
              />
              
              <g className="animate-pulse">
                <path
                  d="M 90 160 L 100 155 L 110 160 L 115 170 L 110 180 L 95 182 L 85 175 L 87 165 Z"
                  fill="#008751"
                  stroke="#FFD700"
                  strokeWidth="3"
                />
                <circle cx="100" cy="170" r="3" fill="#FF4500" />
                <text x="100" y="170" textAnchor="middle" fill="#fff" fontSize="8" dy="20">🇳🇬</text>
              </g>
              
              <line x1="100" y1="170" x2="150" y2="100" stroke="#008751" strokeWidth="2" />
              <circle cx="150" cy="100" r="4" fill="#008751" />
              <text x="155" y="95" fill="#008751" fontSize="14" fontWeight="bold">Nigeria</text>
              <text x="155" y="110" fill="#ccc" fontSize="10">West Africa</text>
            </svg>

            <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-6 max-w-md mb-6">
              <h3 className="text-xl font-bold mb-3 text-green-300">📍 Location</h3>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Country:</strong> Federal Republic of Nigeria
              </p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Regions:</strong> Southwest, Southeast, North
              </p>
              <p className="text-sm text-gray-300">
                <strong>Heritage:</strong> Ancient temples, kingdoms & trade centers
              </p>
            </div>

            <button
              onClick={() => setGameState('templeSelect')}
              className="bg-green-600 hover:bg-green-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              Explore Sites ➜
            </button>
          </div>
        )}

        {/* Temple Selection */}
        {gameState === 'templeSelect' && (
          <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center rounded-lg p-4 overflow-auto">
            <button
              onClick={() => setGameState('mapView')}
              className="absolute top-4 left-4 flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft size={20} /> Back to Map
            </button>
            
            <h2 className="text-3xl font-bold mb-4 text-green-400 mt-8">Choose Your Destination</h2>
            <p className="text-gray-300 mb-6 text-center max-w-2xl">
              Select an ancient Nigerian site to explore and collect unique spirits as NFTs
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-4xl">
              {nigerianSites.map((site) => (
                <div
                  key={site.id}
                  className="bg-gray-800 border-2 rounded-lg p-4 hover:scale-105 transition cursor-pointer"
                  style={{ borderColor: site.color }}
                  onClick={() => startGame(site.id)}
                >
                  <div className="w-full h-32 mb-3 rounded flex items-center justify-center text-6xl"
                       style={{ backgroundColor: `${site.color}22` }}>
                    {site.id === 'eshu' && '🔱'}
                    {site.id === 'anyanwu' && '☀️'}
                    {site.id === 'oba_palace' && '👑'}
                    {site.id === 'kano' && '🕌'}
                  </div>

                  <h3 className="text-xl font-bold mb-2" style={{ color: site.color }}>
                    {site.name}
                  </h3>
                  
                  <div className="text-xs text-gray-400 mb-2">
                    <MapPin size={12} className="inline mr-1" />
                    {site.location}
                  </div>

                  <div className="text-sm mb-3">
                    <strong className="text-gray-300">Deity:</strong>
                    <span className="text-gray-400 ml-1">{site.deity}</span>
                  </div>

                  <div className="text-sm mb-3">
                    <strong className="text-gray-300">Period:</strong>
                    <span className="text-gray-400 ml-1">{site.period}</span>
                  </div>

                  <p className="text-xs text-gray-300 mb-4 leading-relaxed">
                    {site.description}
                  </p>

                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <p className="text-xs font-bold text-gray-300 mb-2">Spirits Available:</p>
                    <div className="flex gap-1">
                      {site.spiritTypes.map((spirit, i) => (
                        <div
                          key={i}
                          className="text-xs px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `#${spirit.color.toString(16).padStart(6, '0')}33`,
                            color: `#${spirit.color.toString(16).padStart(6, '0')}`
                          }}
                        >
                          {spirit.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="w-full mt-4 py-2 rounded font-bold hover:opacity-80 transition"
                    style={{ backgroundColor: site.color }}
                  >
                    Enter Temple →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-3xl font-bold mb-6">Paused</h2>
            <button
              onClick={() => setGameState('playing')}
              className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-bold mb-3"
            >
              Resume
            </button>
            <button
              onClick={() => {
                setGameState('templeSelect');
                setSelectedTemple(null);
              }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              Change Temple
            </button>
          </div>
        )}

        {/* Crosshair */}
        {gameState === 'playing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-4 h-4 border-2 border-white rounded-full opacity-50"></div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {gameState === 'playing' && (
        <div className="w-full max-w-4xl mt-4 grid grid-cols-4 gap-4">
          <div className="bg-gray-800 border-2 border-green-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="text-green-400" size={20} />
              <span className="font-bold">Score</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{score}</div>
          </div>
          <div className="bg-gray-800 border-2 border-purple-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">💎</span>
              <span className="font-bold">HBAR</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{hbarEarned}</div>
          </div>
          <div className="bg-gray-800 border-2 border-yellow-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">👻</span>
              <span className="font-bold">Spirits</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{collectedSpirits.length}</div>
          </div>
          <div className={`bg-gray-800 border-2 rounded-lg p-4 ${ancestorPowerActive ? 'border-green-400 animate-pulse' : ancestorCooldown > 0 ? 'border-gray-600' : 'border-green-600'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🥁</span>
              <span className="font-bold text-sm">Drum Call</span>
            </div>
            <div className={`text-xl font-bold ${ancestorPowerActive ? 'text-green-400' : ancestorCooldown > 0 ? 'text-gray-500' : 'text-green-400'}`}>
              {ancestorPowerActive ? 'ACTIVE!' : ancestorCooldown > 0 ? `${ancestorCooldown}s` : 'READY'}
            </div>
            {!ancestorPowerActive && ancestorCooldown === 0 && (
              <div className="text-xs text-gray-400 mt-1">Press SPACE</div>
            )}
          </div>
        </div>
      )}

      {/* Collected Spirits Gallery */}
      {collectedSpirits.length > 0 && gameState === 'playing' && (
        <div className="w-full max-w-4xl mt-4 bg-gray-800 border-2 border-green-600 rounded-lg p-4">
          <h3 className="text-xl font-bold mb-3 text-green-400">Your Spirit Collection</h3>
          <div className="grid grid-cols-6 gap-2">
            {collectedSpirits.slice(-12).map((spirit, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded p-2 text-center border-2 hover:scale-105 transition"
                style={{ borderColor: `#${spirit.color.toString(16).padStart(6, '0')}` }}
              >
                <div className="text-2xl mb-1">
                  {spirit.name.includes('Eshu') || spirit.name.includes('Elegba') || spirit.name.includes('Ako') ? '🔱' : 
                   spirit.name.includes('Anyanwu') || spirit.name.includes('Chi') || spirit.name.includes('Agwu') ? '☀️' :
                   spirit.name.includes('Egungun') || spirit.name.includes('Olokun') || spirit.name.includes('Ogun') ? '👑' : 
                   spirit.name.includes('Bori') || spirit.name.includes('Inna') || spirit.name.includes('Dan') ? '🕌' : '🖼️'}
                </div>
                <div className="text-xs font-bold">{spirit.name}</div>
                <div className="text-xs text-gray-400">{spirit.hbar} HBAR</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>🎵 Powered by ElevenLabs AI Audio | Yoruba Afrobeat Experience</p>
        <p className="mt-1">Built for Hackeroos Spooky Reddit Jam × Hedera Africa</p>
        <p className="mt-1">Egypt (2D) ✅ | Ethiopia (3D) ✅ | Senegal (2D Dogon) ✅ | Nigeria (3D Multi-Temple) ✅</p>
        <p className="mt-1 text-green-400">Next: Kenya 🇰🇪 Maasai Warriors</p>
      </div>
    </div>
  );
};

export default AncestralSpiritsNigeria3D;