import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Wallet, Trophy, Info, Compass, Flame, Skull } from 'lucide-react';
import * as THREE from 'three';
import { useAudio } from '../shared/AudioPlayer'; // ADDED

const AncestralSpiritsEthiopia3D = () => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [hbarEarned, setHbarEarned] = useState(0);
  const [collectedSpirits, setCollectedSpirits] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [prayerActive, setPrayerActive] = useState(false);
  const [prayerCooldown, setPrayerCooldown] = useState(0);
  
  // ADDED: Boss battle states
  const [bossActive, setBossActive] = useState(false);
  const [bossHealth, setBossHealth] = useState(500);
  const [holyFireCharges, setHolyFireCharges] = useState(10);

  // ADDED: Audio hook
  const { playSound, playAmbient, transitionAmbient, stopAmbient, setEnabled, preloadLevel, isLoading } = useAudio();

  // Three.js refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const spiritMeshesRef = useRef([]);
  const bossRef = useRef(null); // ADDED
  const holyFiresRef = useRef([]); // ADDED
  const keysPressed = useRef({});
  const mouseMovement = useRef({ x: 0, y: 0 });

  const spiritTypes = [
    { name: 'Zar', color: 0x9370db, rarity: 'legendary', hbar: 50, description: 'Possessing spirit from the highlands' },
    { name: 'Wuqabi', color: 0x4682b4, rarity: 'rare', hbar: 30, description: 'Guardian spirit of sacred places' },
    { name: 'Buda', color: 0x8b0000, rarity: 'common', hbar: 10, description: 'Evil eye entity of the night' }
  ];

  // ADDED: Start ambient music
  useEffect(() => {
    if (gameState === 'playing') {
      preloadLevel('ethiopia');
      playAmbient('ethiopia_ambient_start', true);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [gameState]);

  // ADDED: Sync audio
  useEffect(() => {
    setEnabled(audioEnabled);
  }, [audioEnabled]);

  // ADDED: Boss battle music transition
  useEffect(() => {
    if (bossActive && gameState === 'playing') {
      transitionAmbient('ethiopia_ambient_start', 'ethiopia_ambient_intense', 3000);
    }
  }, [bossActive, gameState]);

  // ADDED: Spawn boss when player collects 5+ spirits
  useEffect(() => {
    if (collectedSpirits.length >= 5 && !bossActive && gameState === 'playing') {
      spawnBoss();
    }
  }, [collectedSpirits.length, gameState]);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1410, 5, 50);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 1.6, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0x3d2817, 0.3);
    scene.add(ambientLight);

    const torchLight = new THREE.PointLight(0xff8c00, 1.5, 15);
    torchLight.position.copy(camera.position);
    torchLight.castShadow = true;
    scene.add(torchLight);

    const candlePositions = [
      [-8, 1.5, -8], [8, 1.5, -8], [-8, 1.5, 8], [8, 1.5, 8],
      [0, 2, -15], [0, 2, 15]
    ];
    
    candlePositions.forEach(pos => {
      const candleLight = new THREE.PointLight(0xffa500, 0.8, 8);
      candleLight.position.set(...pos);
      scene.add(candleLight);
      
      const flicker = () => {
        candleLight.intensity = 0.6 + Math.random() * 0.4;
        setTimeout(flicker, 100 + Math.random() * 200);
      };
      flicker();
    });

    createChurch(scene);
    createCorridor(scene);

    spawnSpirit3D(scene);
    spawnSpirit3D(scene);
    spawnSpirit3D(scene);

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
  }, []);

  const createChurch = (scene) => {
    const stoneTexture = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a,
      roughness: 0.9,
      metalness: 0.1
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      stoneTexture
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallHeight = 8;
    const wallThickness = 0.5;

    const northWall = new THREE.Mesh(
      new THREE.BoxGeometry(40, wallHeight, wallThickness),
      stoneTexture
    );
    northWall.position.set(0, wallHeight / 2, -20);
    northWall.castShadow = true;
    scene.add(northWall);

    const southWall = northWall.clone();
    southWall.position.z = 20;
    scene.add(southWall);

    const eastWall = new THREE.Mesh(
      new THREE.BoxGeometry(wallThickness, wallHeight, 40),
      stoneTexture
    );
    eastWall.position.set(20, wallHeight / 2, 0);
    eastWall.castShadow = true;
    scene.add(eastWall);

    const westWall = eastWall.clone();
    westWall.position.x = -20;
    scene.add(westWall);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a, side: THREE.DoubleSide })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = wallHeight;
    scene.add(ceiling);

    const pillarPositions = [
      [-10, 0, -10], [10, 0, -10], [-10, 0, 10], [10, 0, 10]
    ];

    pillarPositions.forEach(pos => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, wallHeight, 8),
        new THREE.MeshStandardMaterial({ color: 0x6a5a4a })
      );
      pillar.position.set(pos[0], pos[1] + wallHeight / 2, pos[2]);
      pillar.castShadow = true;
      scene.add(pillar);
    });

    const crossMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: 0xd4af37,
      emissiveIntensity: 0.3
    });

    const crossVertical = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 3, 0.3),
      crossMaterial
    );
    crossVertical.position.set(0, 5, -19.5);
    scene.add(crossVertical);

    const crossHorizontal = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.3, 0.3),
      crossMaterial
    );
    crossHorizontal.position.set(0, 5.5, -19.5);
    scene.add(crossHorizontal);

    pillarPositions.forEach(pos => {
      const smallCross = crossVertical.clone();
      smallCross.scale.set(0.3, 0.3, 0.3);
      smallCross.position.set(pos[0], wallHeight - 0.5, pos[2]);
      scene.add(smallCross);
    });

    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    altar.position.set(0, 0.75, -17);
    altar.castShadow = true;
    scene.add(altar);

    for (let i = 0; i < 5; i++) {
      const stone = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a })
      );
      stone.position.set(
        (Math.random() - 0.5) * 15,
        0.3,
        (Math.random() - 0.5) * 15
      );
      scene.add(stone);
    }
  };

  const createCorridor = (scene) => {
    const corridorMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 1
    });

    const corridorWall1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 6, 15),
      corridorMaterial
    );
    corridorWall1.position.set(-3, 3, 27);
    scene.add(corridorWall1);

    const corridorWall2 = corridorWall1.clone();
    corridorWall2.position.x = 3;
    scene.add(corridorWall2);
  };

  const spawnSpirit3D = (scene) => {
    if (!scene) return;

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

    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: spiritType.color,
      transparent: true,
      opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
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
  };

  // ADDED: Spawn Ethiopian Devil Boss
  const spawnBoss = () => {
    const scene = sceneRef.current;
    if (!scene || bossRef.current) return;

    setBossActive(true);
    setBossHealth(500);

    // Create demonic boss
    const bossGroup = new THREE.Group();

    // Body (dark demonic sphere)
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(2, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1a0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.7,
        roughness: 0.3
      })
    );
    bossGroup.add(body);

    // Horns
    const hornGeometry = new THREE.ConeGeometry(0.3, 2, 8);
    const hornMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const hornLeft = new THREE.Mesh(hornGeometry, hornMaterial);
    hornLeft.position.set(-1, 2, 0);
    hornLeft.rotation.z = -0.3;
    bossGroup.add(hornLeft);

    const hornRight = new THREE.Mesh(hornGeometry, hornMaterial);
    hornRight.position.set(1, 2, 0);
    hornRight.rotation.z = 0.3;
    bossGroup.add(hornRight);

    // Glowing red eyes
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const eyeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), eyeMaterial);
    eyeLeft.position.set(-0.6, 0.5, 1.8);
    bossGroup.add(eyeLeft);

    const eyeRight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), eyeMaterial);
    eyeRight.position.set(0.6, 0.5, 1.8);
    bossGroup.add(eyeRight);

    // Demonic glow
    const demonicLight = new THREE.PointLight(0xff0000, 3, 15);
    bossGroup.add(demonicLight);

    // Position at altar
    bossGroup.position.set(0, 3, -15);

    bossGroup.userData = {
      health: 500,
      phase: 0,
      attackTimer: 0
    };

    scene.add(bossGroup);
    bossRef.current = bossGroup;

    // CHANGED: Play boss appear sound
    if (audioEnabled) playSound('ethiopia_boss_appear', 0.8);
  };

  // ADDED: Fire holy projectile
  const fireHolyShot = () => {
    if (holyFireCharges <= 0 || !bossActive) return;

    setHolyFireCharges(prev => prev - 1);

    const scene = sceneRef.current;
    const camera = cameraRef.current;

    if (!scene || !camera) return;

    // Create holy fire projectile
    const holyFire = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 1
      })
    );

    holyFire.position.copy(camera.position);

    const direction = new THREE.Vector3(
      Math.sin(mouseMovement.current.x) * Math.cos(mouseMovement.current.y),
      Math.sin(mouseMovement.current.y),
      Math.cos(mouseMovement.current.x) * Math.cos(mouseMovement.current.y)
    );

    holyFire.userData = {
      velocity: direction.multiplyScalar(0.5),
      lifespan: 100
    };

    // Golden light
    const fireLight = new THREE.PointLight(0xffd700, 2, 5);
    holyFire.add(fireLight);

    scene.add(holyFire);
    holyFiresRef.current.push(holyFire);

    // CHANGED: Play holy fire sound
    if (audioEnabled) playSound('ethiopia_holy_fire', 0.7);

    // Recharge after 3 seconds
    setTimeout(() => {
      setHolyFireCharges(prev => Math.min(prev + 1, 10));
    }, 3000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
      
      // CHANGED: Prayer power or Holy Fire
      if (e.key === ' ' && gameState === 'playing') {
        if (bossActive) {
          fireHolyShot();
        } else if (prayerCooldown === 0) {
          activatePrayer();
        }
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
  }, [gameState, prayerCooldown, bossActive, holyFireCharges]);

  const activatePrayer = () => {
    setPrayerActive(true);
    setPrayerCooldown(30);

    // CHANGED: Play prayer sound
    if (audioEnabled) playSound('ethiopia_prayer_power', 0.8);

    spiritMeshesRef.current.forEach(spirit => {
      spirit.userData.attracted = true;
    });

    setTimeout(() => {
      setPrayerActive(false);
      spiritMeshesRef.current.forEach(spirit => {
        spirit.userData.attracted = false;
      });
    }, 5000);
  };

  useEffect(() => {
    if (prayerCooldown > 0) {
      const timer = setTimeout(() => {
        setPrayerCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [prayerCooldown]);

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

      camera.rotation.y = mouseMovement.current.x;
      camera.rotation.x = mouseMovement.current.y;

      const moveSpeed = 5 * delta;
      const direction = new THREE.Vector3();

      if (keysPressed.current['w'] || keysPressed.current['ArrowUp']) {
        direction.z -= 1;
      }
      if (keysPressed.current['s'] || keysPressed.current['ArrowDown']) {
        direction.z += 1;
      }
      if (keysPressed.current['a'] || keysPressed.current['ArrowLeft']) {
        direction.x -= 1;
      }
      if (keysPressed.current['d'] || keysPressed.current['ArrowRight']) {
        direction.x += 1;
      }

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
      }

      const torchLight = scene.children.find(child => child instanceof THREE.PointLight && child.intensity === 1.5);
      if (torchLight) {
        torchLight.position.copy(camera.position);
      }

      // Update boss
      const boss = bossRef.current;
      if (boss && bossActive) {
        boss.userData.phase += 0.02;
        boss.position.y = 3 + Math.sin(boss.userData.phase) * 0.5;
        boss.rotation.y += 0.01;

        // Boss glow pulse
        const bossLight = boss.children.find(child => child instanceof THREE.PointLight);
        if (bossLight) {
          bossLight.intensity = 2 + Math.sin(boss.userData.phase * 3) * 1;
        }
      }

      // Update holy fire projectiles
      holyFiresRef.current.forEach((fire, index) => {
        fire.position.add(fire.userData.velocity);
        fire.userData.lifespan--;
        fire.rotation.y += 0.1;

        if (fire.userData.lifespan <= 0) {
          scene.remove(fire);
          holyFiresRef.current.splice(index, 1);
          return;
        }

        // Check collision with boss
        if (boss && bossActive) {
          const dist = fire.position.distanceTo(boss.position);
          if (dist < 2.5) {
            boss.userData.health -= 25;
            setBossHealth(prev => {
              const newHealth = Math.max(0, prev - 25);
              
              if (newHealth <= 0) {
                // Boss defeated!
                scene.remove(boss);
                bossRef.current = null;
                setBossActive(false);
                setScore(prev => prev + 500);
                setHbarEarned(prev => prev + 200);
                
                // CHANGED: Victory sound
                if (audioEnabled) playSound('ethiopia_boss_death', 1);
                
                setTimeout(() => {
                  alert('🙏 VICTORY! The devil has been vanquished by the Lord\'s power!\n\n+500 Score | +200 HBAR');
                }, 500);
              } else {
                // Boss hit sound
                if (audioEnabled) playSound('ethiopia_boss_hit', 0.6);
              }
              
              return newHealth;
            });

            scene.remove(fire);
            holyFiresRef.current.splice(index, 1);

            // Explosion effect
            for (let i = 0; i < 10; i++) {
              const particle = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffd700 })
              );
              particle.position.copy(fire.position);
              scene.add(particle);

              setTimeout(() => scene.remove(particle), 500);
            }
          }
        }
      });

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

          // CHANGED: Collection sound
          if (audioEnabled) playSound('ethiopia_collect_spirit', 0.6);

          setTimeout(() => spawnSpirit3D(scene), 3000);
        }
      });

      if (prayerActive) {
        const prayerLight = scene.children.find(
          child => child instanceof THREE.PointLight && child.intensity > 2
        );
        
        if (!prayerLight) {
          const light = new THREE.PointLight(0xffd700, 3, 20);
          light.position.copy(camera.position);
          scene.add(light);
        }
      } else {
        const prayerLight = scene.children.find(
          child => child instanceof THREE.PointLight && child.intensity > 2
        );
        if (prayerLight) {
          scene.remove(prayerLight);
        }
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState, audioEnabled, prayerActive, bossActive]);

  const connectWallet = () => {
    setWalletConnected(true);
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setHbarEarned(0);
    setCollectedSpirits([]);
    setBossActive(false);
    setBossHealth(500);
    setHolyFireCharges(10);
    
    const scene = sceneRef.current;
    if (scene) {
      spiritMeshesRef.current.forEach(spirit => scene.remove(spirit));
      spiritMeshesRef.current = [];
      
      if (bossRef.current) {
        scene.remove(bossRef.current);
        bossRef.current = null;
      }
      
      spawnSpirit3D(scene);
      spawnSpirit3D(scene);
      spawnSpirit3D(scene);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-blue-400">⛪ Ancestral Spirits</h1>
          <span className="text-sm bg-blue-600 px-3 py-1 rounded">Ethiopia Level (3D)</span>
          {isLoading && <span className="text-xs text-yellow-400">🎵 Loading...</span>}
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

      {showInfo && (
        <div className="absolute top-20 bg-gray-800 border-2 border-blue-500 rounded-lg p-6 max-w-md z-10">
          <h3 className="text-xl font-bold mb-3 text-blue-400">How to Play (3D)</h3>
          <ul className="space-y-2 text-sm">
            <li>🎮 <strong>Move:</strong> WASD or Arrow keys</li>
            <li>🖱️ <strong>Look:</strong> Click and move mouse</li>
            <li>👻 <strong>Collect:</strong> Walk near spirits (5 spirits spawn boss!)</li>
            <li>🙏 <strong>Prayer:</strong> Press SPACEBAR to attract spirits (30s cooldown)</li>
            <li>🔥 <strong>Holy Fire:</strong> Press SPACEBAR during boss fight to shoot!</li>
            <li>👹 <strong>Boss Battle:</strong> Defeat the Ethiopian devil with holy fire!</li>
            <li>💰 <strong>Earn:</strong> Each spirit gives HBAR rewards</li>
            <li>🎵 <strong>Ancient Orthodox Chants powered by AI</strong></li>
          </ul>
          <h4 className="text-lg font-bold mt-4 mb-2 text-blue-400">Ethiopian Spirits</h4>
          {spiritTypes.map(spirit => (
            <div key={spirit.name} className="text-xs mb-2">
              <strong>{spirit.name}</strong> ({spirit.rarity}) - {spirit.hbar} HBAR
              <br />
              <span className="text-gray-400">{spirit.description}</span>
            </div>
          ))}
          <div className="mt-4 p-3 bg-red-900 bg-opacity-30 border-l-4 border-red-500 rounded">
            <p className="text-xs text-red-200">
              <strong>⚠️ WARNING:</strong> After collecting 5 spirits, the Ethiopian devil will manifest! 
              Use the Lord's holy fire to destroy it!
            </p>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-500 py-2 rounded"
          >
            Close
          </button>
        </div>
      )}

      <div className="relative">
        <div
          ref={mountRef}
          className="border-4 border-blue-600 rounded-lg shadow-2xl"
          style={{ width: 800, height: 600 }}
        />

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-4xl font-bold mb-4 text-blue-400">Ancestral Spirits: Ethiopia</h2>
            <p className="text-gray-300 mb-8 text-center max-w-md">
              Journey to the ancient highlands of Ethiopia and explore the sacred rock-hewn churches
            </p>
            <button
              onClick={() => setGameState('mapView')}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              🗺️ View Map
            </button>
          </div>
        )}

        {gameState === 'mapView' && (
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black bg-opacity-95 flex flex-col items-center justify-center rounded-lg p-8 overflow-auto">
            <h2 className="text-3xl font-bold mb-6 text-blue-400">Ethiopia - Horn of Africa</h2>
            
            <svg width="300" height="400" viewBox="0 0 300 400" className="mb-6">
              <path
                d="M 150 20 L 160 30 L 170 50 L 180 80 L 185 110 L 190 140 L 195 180 L 200 220 L 205 260 L 200 300 L 190 330 L 170 360 L 140 380 L 100 390 L 60 385 L 30 370 L 15 340 L 10 300 L 20 260 L 30 220 L 35 180 L 40 140 L 50 100 L 65 70 L 85 45 L 110 25 L 130 18 Z"
                fill="#2a4a2a"
                stroke="#4a6a4a"
                strokeWidth="2"
              />
              
              <g className="animate-pulse">
                <path
                  d="M 175 85 L 185 95 L 190 110 L 188 125 L 180 135 L 170 130 L 165 115 L 168 95 Z"
                  fill="#FFD700"
                  stroke="#FF8C00"
                  strokeWidth="3"
                />
                <circle cx="178" cy="110" r="3" fill="#FF4500" />
                <text x="178" y="110" textAnchor="middle" fill="#fff" fontSize="8" dy="20">🇪🇹</text>
              </g>
              
              <line x1="178" y1="110" x2="220" y2="50" stroke="#FFD700" strokeWidth="2" />
              <circle cx="220" cy="50" r="4" fill="#FFD700" />
              <text x="225" y="45" fill="#FFD700" fontSize="14" fontWeight="bold">Ethiopia</text>
              <text x="225" y="60" fill="#ccc" fontSize="10">Horn of Africa</text>
            </svg>

            <div className="bg-gray-800 border-2 border-blue-500 rounded-lg p-6 max-w-md mb-6">
              <h3 className="text-xl font-bold mb-3 text-blue-300">📍 Location</h3>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Country:</strong> Federal Democratic Republic of Ethiopia
              </p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Region:</strong> Amhara, Northern Highlands
              </p>
              <p className="text-sm text-gray-300">
                <strong>Heritage Site:</strong> Rock-Hewn Churches of Lalibela
              </p>
            </div>

            <button
              onClick={() => setGameState('churchInfo')}
              className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              Continue to Lalibela ➜
            </button>
          </div>
        )}

        {gameState === 'churchInfo' && (
          <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center rounded-lg p-8 overflow-auto">
            <h2 className="text-3xl font-bold mb-4 text-blue-400">⛪ Rock-Hewn Churches of Lalibela</h2>
            
            <div className="relative mb-6">
              <svg width="400" height="200" viewBox="0 0 400 200" className="mb-4">
                <rect x="0" y="150" width="400" height="50" fill="#5a4a3a" />
                <rect x="50" y="100" width="300" height="50" fill="#3a2a1a" />
                
                <g>
                  <rect x="120" y="80" width="160" height="70" fill="#6a5a4a" stroke="#4a3a2a" strokeWidth="2" />
                  <rect x="190" y="50" width="20" height="40" fill="#d4af37" />
                  <rect x="175" y="65" width="50" height="15" fill="#d4af37" />
                  <rect x="140" y="100" width="15" height="30" fill="#2a1a0a" />
                  <rect x="245" y="100" width="15" height="30" fill="#2a1a0a" />
                  <rect x="192" y="105" width="16" height="25" fill="#2a1a0a" />
                  <rect x="185" y="120" width="30" height="30" fill="#1a0a00" />
                  <text x="200" y="115" textAnchor="middle" fill="#d4af37" fontSize="12">✦</text>
                </g>
                
                <circle cx="50" cy="30" r="2" fill="#fff" opacity="0.7" />
                <circle cx="350" cy="40" r="2" fill="#fff" opacity="0.7" />
                <circle cx="200" cy="20" r="2" fill="#fff" opacity="0.7" />
                <circle cx="320" cy="60" r="1.5" fill="#fff" opacity="0.7" />
              </svg>
            </div>

            <div className="bg-gray-800 border-2 border-blue-500 rounded-lg p-6 max-w-2xl">
              <h3 className="text-xl font-bold mb-3 text-blue-300">About the Churches</h3>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                The Rock-Hewn Churches of Lalibela are a UNESCO World Heritage Site located in the 
                Amhara Region of Ethiopia. Dating from the 12th-13th centuries, these magnificent 
                churches were carved downward into solid volcanic rock.
              </p>
              <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                <strong className="text-blue-400">Legend:</strong> King Lalibela commissioned these 
                churches after a divine vision, creating a "New Jerusalem" in Ethiopia. The churches 
                were carved by hand using only hammers and chisels.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                <div className="bg-gray-700 p-3 rounded">
                  <strong className="text-blue-300">Built:</strong> 12th-13th Century
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <strong className="text-blue-300">Method:</strong> Carved from single rock
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <strong className="text-blue-300">Churches:</strong> 11 monolithic structures
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <strong className="text-blue-300">Religion:</strong> Ethiopian Orthodox
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-900 bg-opacity-30 border-l-4 border-yellow-500 rounded">
                <p className="text-xs text-yellow-200">
                  ⚠️ <strong>Warning:</strong> These ancient halls are said to be haunted by ancestral 
                  spirits at night. The spirits of the faithful who prayed here for centuries still 
                  wander the sacred chambers...
                </p>
              </div>
            </div>

            <button
              onClick={startGame}
              className="mt-6 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105 flex items-center gap-2"
            >
              🕯️ Enter the Church
            </button>
            
            <button
              onClick={() => setGameState('mapView')}
              className="mt-3 text-gray-400 hover:text-gray-200 text-sm"
            >
              ← Back to Map
            </button>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-3xl font-bold mb-6">Paused</h2>
            <button
              onClick={() => setGameState('playing')}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg font-bold mb-3"
            >
              Resume
            </button>
            <button
              onClick={() => setGameState('menu')}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              Main Menu
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-4 h-4 border-2 border-white rounded-full opacity-50"></div>
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl mt-4 grid grid-cols-4 gap-4">
        <div className="bg-gray-800 border-2 border-blue-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-blue-400" size={20} />
            <span className="font-bold">Score</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">{score}</div>
        </div>
        <div className="bg-gray-800 border-2 border-purple-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💎</span>
            <span className="font-bold">HBAR</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{hbarEarned}</div>
        </div>
        <div className="bg-gray-800 border-2 border-green-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👻</span>
            <span className="font-bold">Spirits</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{collectedSpirits.length}</div>
        </div>
        <div className={`bg-gray-800 border-2 rounded-lg p-4 ${prayerActive ? 'border-blue-400 animate-pulse' : prayerCooldown > 0 ? 'border-gray-600' : 'border-blue-600'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{bossActive ? '🔥' : '🙏'}</span>
            <span className="font-bold text-sm">{bossActive ? 'Holy Fire' : 'Prayer'}</span>
          </div>
          <div className={`text-xl font-bold ${prayerActive ? 'text-blue-400' : prayerCooldown > 0 ? 'text-gray-500' : 'text-blue-400'}`}>
            {bossActive ? `${holyFireCharges}/10` : prayerActive ? 'ACTIVE!' : prayerCooldown > 0 ? `${prayerCooldown}s` : 'READY'}
          </div>
          {!prayerActive && prayerCooldown === 0 && !bossActive && (
            <div className="text-xs text-gray-400 mt-1">Press SPACE</div>
          )}
        </div>
      </div>

      {bossActive && (
        <div className="w-full max-w-4xl mt-4 bg-gradient-to-r from-red-900 to-black p-4 rounded-lg border-4 border-red-600 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skull className="text-red-400" size={32} />
              <div>
                <h3 className="text-2xl font-bold text-red-400">👹 ETHIOPIAN DEVIL</h3>
                <p className="text-sm text-gray-300">Use Holy Fire (SPACEBAR) to destroy it!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Boss Health</div>
              <div className="text-3xl font-bold text-red-400">{bossHealth}/500</div>
            </div>
          </div>
          <div className="w-full bg-gray-700 h-4 rounded-full mt-3">
            <div
              className="bg-red-500 h-4 rounded-full transition-all"
              style={{ width: `${(bossHealth / 500) * 100}%` }}
            />
          </div>
        </div>
      )}

      {collectedSpirits.length > 0 && (
        <div className="w-full max-w-4xl mt-4 bg-gray-800 border-2 border-blue-600 rounded-lg p-4">
          <h3 className="text-xl font-bold mb-3 text-blue-400">Your Spirit Collection</h3>
          <div className="grid grid-cols-6 gap-2">
            {collectedSpirits.slice(-12).map((spirit, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded p-2 text-center border-2 hover:scale-105 transition"
                style={{ borderColor: `#${spirit.color.toString(16).padStart(6, '0')}` }}
              >
                <div className="text-2xl mb-1">
                  {spirit.name === 'Zar' ? '👤' : spirit.name === 'Wuqabi' ? '🛡️' : '👁️'}
                </div>
                <div className="text-xs font-bold">{spirit.name}</div>
                <div className="text-xs text-gray-400">{spirit.hbar} HBAR</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Built for Hackeroos Spooky Reddit Jam × Hedera Africa</p>
        <p className="mt-1">🎵 Powered by ElevenLabs Ancient Ethiopian Chants</p>
      </div>
    </div>
  );
};

export default AncestralSpiritsEthiopia3D;