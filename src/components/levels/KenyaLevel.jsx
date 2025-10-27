import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Wallet, Trophy, Info, Heart, Zap } from 'lucide-react';
import * as THREE from 'three';

const AncestralSpiritsKenya3D = ({ autoStart = false }) => {
  const mountRef = useRef(null);
  const [gameState, setGameState] = useState(autoStart ? 'locationSelect' : 'menu'); // menu, mapView, locationSelect, playing, paused, gameOver
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [score, setScore] = useState(0);
  const [hbarEarned, setHbarEarned] = useState(0);
  const [collectedSpirits, setCollectedSpirits] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [health, setHealth] = useState(100);
  const [spearCharges, setSpearCharges] = useState(5);
  const [warriorPowerActive, setWarriorPowerActive] = useState(false);
  const [warriorCooldown, setWarriorCooldown] = useState(0);

  // Three.js refs
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const playerRef = useRef(null);
  const enemiesRef = useRef([]);
  const nftsRef = useRef([]);
  const keysPressed = useRef({});
  const mouseMovement = useRef({ x: 0, y: 0 });
  const gameTimeRef = useRef(0);

  // Kenyan locations
  const kenyanLocations = [
    {
      id: 'masai_mara',
      name: 'Masai Mara Savanna',
      description: 'Hunt through the golden grasslands of the Masai Mara. Dodge wild beasts and collect ancient Maasai artifacts.',
      difficulty: 'Medium',
      color: '#DAA520',
      enemies: ['hyena', 'buffalo', 'snake'],
      nfts: [
        { name: 'Maasai Spear', type: 'weapon', hbar: 50 },
        { name: 'Shuka Cloth', type: 'clothing', hbar: 40 },
        { name: 'Enkaji Hut', type: 'structure', hbar: 35 }
      ]
    },
    {
      id: 'great_rift',
      name: 'Great Rift Valley',
      description: 'Navigate the ancient volcanic landscape where spirits roam among the rocks and flamingos.',
      difficulty: 'Hard',
      color: '#CD853F',
      enemies: ['leopard', 'cobra', 'vulture'],
      nfts: [
        { name: 'Rift Stone Carving', type: 'artifact', hbar: 60 },
        { name: 'Flamingo Feather', type: 'treasure', hbar: 45 },
        { name: 'Volcanic Mask', type: 'artifact', hbar: 55 }
      ]
    },
    {
      id: 'swahili_coast',
      name: 'Swahili Coast Ruins',
      description: 'Explore ancient coastal ruins where Swahili traders once prospered. Beware of sea creatures.',
      difficulty: 'Medium',
      color: '#4682B4',
      enemies: ['crab', 'jellyfish', 'seagull'],
      nfts: [
        { name: 'Dhow Boat Model', type: 'artifact', hbar: 50 },
        { name: 'Coral Jewelry', type: 'treasure', hbar: 40 },
        { name: 'Ancient Coin', type: 'treasure', hbar: 55 }
      ]
    }
  ];

  // Enemy types
  const enemyTypes = {
    hyena: { speed: 0.08, damage: 10, health: 30, color: 0x8b7355, size: 0.6 },
    buffalo: { speed: 0.05, damage: 20, health: 50, color: 0x2f2f2f, size: 1.2 },
    snake: { speed: 0.12, damage: 15, health: 20, color: 0x556b2f, size: 0.4 },
    leopard: { speed: 0.1, damage: 25, health: 40, color: 0xffd700, size: 0.8 },
    cobra: { speed: 0.09, damage: 30, health: 25, color: 0x000000, size: 0.5 },
    vulture: { speed: 0.07, damage: 12, health: 15, color: 0x4a4a4a, size: 0.5 },
    crab: { speed: 0.06, damage: 8, health: 25, color: 0xff6347, size: 0.5 },
    jellyfish: { speed: 0.04, damage: 18, health: 20, color: 0x9370db, size: 0.6 },
    seagull: { speed: 0.11, damage: 10, health: 18, color: 0xf0f0f0, size: 0.5 }
  };

  // Initialize Three.js
  useEffect(() => {
    if (!mountRef.current || gameState !== 'playing') return;

      // Clear previous content
  if (mountRef.current.firstChild) {
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
  }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87ceeb, 20, 100);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const sunLight = new THREE.DirectionalLight(0xffd700, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffa500, 0.6);
    scene.add(ambientLight);

    // Create environment
    createEnvironment(scene);

    // Create Maasai warrior player
    createMaasaiWarrior(scene);

    // Spawn enemies and NFTs
    spawnEnemies(scene);
    spawnNFTs(scene);

    // Mouse controls
    const handleMouseMove = (e) => {
      if (gameState !== 'playing') return;
      mouseMovement.current.x += e.movementX * 0.002;
      mouseMovement.current.y -= e.movementY * 0.002;
      mouseMovement.current.y = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, mouseMovement.current.y));
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
  }, [gameState, selectedLocation]);

  // Create environment
  const createEnvironment = (scene) => {
    const location = kenyanLocations.find(l => l.id === selectedLocation);
    
    if (location.id === 'masai_mara') {
      createSavanna(scene);
    } else if (location.id === 'great_rift') {
      createRiftValley(scene);
    } else if (location.id === 'swahili_coast') {
      createCoastalRuins(scene);
    }
  };

  // Savanna environment
  const createSavanna = (scene) => {
    // Golden grassland
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xdaa520,
      roughness: 0.9 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grass clumps
    for (let i = 0; i < 100; i++) {
      const grass = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 1.5, 8),
        new THREE.MeshStandardMaterial({ color: 0x6b8e23 })
      );
      grass.position.set(
        (Math.random() - 0.5) * 180,
        0.75,
        (Math.random() - 0.5) * 180
      );
      scene.add(grass);
    }

    // Acacia trees
    for (let i = 0; i < 15; i++) {
      createAcaciaTree(scene, 
        (Math.random() - 0.5) * 150,
        (Math.random() - 0.5) * 150
      );
    }

    // Rocks
    for (let i = 0; i < 30; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(Math.random() * 2 + 1),
        new THREE.MeshStandardMaterial({ color: 0x8b7355 })
      );
      rock.position.set(
        (Math.random() - 0.5) * 180,
        rock.geometry.parameters.radius / 2,
        (Math.random() - 0.5) * 180
      );
      rock.castShadow = true;
      scene.add(rock);
    }
  };

  // Rift Valley environment
  const createRiftValley = (scene) => {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Volcanic rocks
    for (let i = 0; i < 50; i++) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(Math.random() * 3 + 1),
        new THREE.MeshStandardMaterial({ color: 0x2f1f1f })
      );
      rock.position.set(
        (Math.random() - 0.5) * 180,
        rock.geometry.parameters.radius / 2,
        (Math.random() - 0.5) * 180
      );
      rock.castShadow = true;
      scene.add(rock);
    }

    // Cliffs
    for (let i = 0; i < 8; i++) {
      const cliff = new THREE.Mesh(
        new THREE.BoxGeometry(10, 15, 5),
        new THREE.MeshStandardMaterial({ color: 0xcd853f })
      );
      cliff.position.set(
        (Math.random() - 0.5) * 160,
        7.5,
        (Math.random() - 0.5) * 160
      );
      scene.add(cliff);
    }
  };

  // Coastal ruins
  const createCoastalRuins = (scene) => {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0xf4a460, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Water (ocean)
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 200),
      new THREE.MeshStandardMaterial({ 
        color: 0x1e90ff,
        transparent: true,
        opacity: 0.7,
        metalness: 0.8
      })
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(75, 0.1, 0);
    scene.add(water);

    // Ancient ruins
    for (let i = 0; i < 10; i++) {
      const ruin = new THREE.Mesh(
        new THREE.BoxGeometry(3, 8, 3),
        new THREE.MeshStandardMaterial({ color: 0xd3d3d3 })
      );
      ruin.position.set(
        Math.random() * 40 - 20,
        4,
        (Math.random() - 0.5) * 150
      );
      scene.add(ruin);
    }

    // Palm trees
    for (let i = 0; i < 12; i++) {
      createPalmTree(scene,
        Math.random() * 50 - 25,
        (Math.random() - 0.5) * 150
      );
    }
  };

  // Create Acacia tree
  const createAcaciaTree = (scene, x, z) => {
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    trunk.position.set(x, 3, z);
    scene.add(trunk);

    // Canopy (flat-topped)
    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(4, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x228b22 })
    );
    canopy.position.set(x, 7, z);
    scene.add(canopy);
  };

  // Create Palm tree
  const createPalmTree = (scene, x, z) => {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x8b7355 })
    );
    trunk.position.set(x, 4, z);
    scene.add(trunk);

    // Palm leaves
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leaf = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 3, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x228b22 })
      );
      leaf.position.set(
        x + Math.cos(angle) * 0.5,
        8,
        z + Math.sin(angle) * 0.5
      );
      leaf.rotation.z = angle;
      leaf.rotation.x = -0.5;
      scene.add(leaf);
    }
  };

  // Create Maasai warrior
  const createMaasaiWarrior = (scene) => {
    const warrior = new THREE.Group();

    // Body (red shuka cloth)
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.6, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    body.position.y = 1.2;
    warrior.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.4),
      new THREE.MeshStandardMaterial({ color: 0x3a2010 })
    );
    head.position.y = 2.2;
    warrior.add(head);

    // Headdress (beaded)
    const headdress = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.3, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    headdress.position.y = 2.6;
    warrior.add(headdress);

    // Spear
    const spear = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    spear.position.set(0.7, 1.5, 0);
    spear.rotation.z = -Math.PI / 6;
    warrior.add(spear);

    // Spear tip
    const spearTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x696969 })
    );
    spearTip.position.set(0.7 + Math.sin(Math.PI / 6) * 1.5, 1.5 + Math.cos(Math.PI / 6) * 1.5, 0);
    spearTip.rotation.z = -Math.PI / 6;
    warrior.add(spearTip);

    // Shield
    const shield = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x8b0000 })
    );
    shield.position.set(-0.8, 1.5, 0);
    shield.rotation.z = Math.PI / 2;
    warrior.add(shield);

    // Shield pattern (white)
    const pattern = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    pattern.position.set(-0.8, 1.5, 0);
    pattern.rotation.z = Math.PI / 2;
    warrior.add(pattern);

    warrior.position.set(0, 0, 0);
    scene.add(warrior);
    playerRef.current = warrior;
  };

  // Spawn enemies
  const spawnEnemies = (scene) => {
    const location = kenyanLocations.find(l => l.id === selectedLocation);
    
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const enemyType = location.enemies[Math.floor(Math.random() * location.enemies.length)];
        createEnemy(scene, enemyType);
      }, i * 3000);
    }
  };

  // Create enemy
  const createEnemy = (scene, type) => {
    if (!scene) return;

    const enemyData = enemyTypes[type];
    const enemy = new THREE.Mesh(
      new THREE.SphereGeometry(enemyData.size),
      new THREE.MeshStandardMaterial({ 
        color: enemyData.color,
        emissive: 0xff0000,
        emissiveIntensity: 0.2
      })
    );

    // Random spawn at edge
    const angle = Math.random() * Math.PI * 2;
    enemy.position.set(
      Math.cos(angle) * 50,
      enemyData.size,
      Math.sin(angle) * 50
    );

    enemy.userData = {
      type: type,
      health: enemyData.health,
      speed: enemyData.speed,
      damage: enemyData.damage
    };

    scene.add(enemy);
    enemiesRef.current.push(enemy);
  };

  // Spawn NFTs
  const spawnNFTs = (scene) => {
    const location = kenyanLocations.find(l => l.id === selectedLocation);
    
    location.nfts.forEach((nftData, i) => {
      setTimeout(() => {
        createNFT(scene, nftData);
      }, i * 5000);
    });
  };

  // Create NFT collectible
  const createNFT = (scene, nftData) => {
    if (!scene) return;

    const nft = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.6),
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.6,
        metalness: 0.8
      })
    );

    nft.position.set(
      (Math.random() - 0.5) * 80,
      2,
      (Math.random() - 0.5) * 80
    );

    nft.userData = nftData;

    scene.add(nft);
    nftsRef.current.push(nft);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
      
      // Throw spear
      if (e.key === ' ' && gameState === 'playing' && spearCharges > 0) {
        throwSpear();
      }
      
      // Warrior power
      if (e.key === 'Shift' && gameState === 'playing' && warriorCooldown === 0) {
        activateWarriorPower();
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
  }, [gameState, spearCharges, warriorCooldown]);

  // Throw spear
  const throwSpear = () => {
    if (spearCharges <= 0) return;
    
    setSpearCharges(prev => prev - 1);
    
    const scene = sceneRef.current;
    const player = playerRef.current;
    
    if (!scene || !player) return;

    // Create spear projectile
    const spearProjectile = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 2),
      new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    );
    
    spearProjectile.position.copy(player.position);
    spearProjectile.position.y += 1.5;
    
    const direction = new THREE.Vector3(
      Math.sin(mouseMovement.current.x),
      0,
      Math.cos(mouseMovement.current.x)
    );
    
    spearProjectile.userData = {
      velocity: direction.multiplyScalar(0.5),
      lifespan: 100
    };
    
    scene.add(spearProjectile);

    if (audioEnabled) playSpearSound();

    // Replenish spear after 5 seconds
    setTimeout(() => {
      setSpearCharges(prev => Math.min(prev + 1, 5));
    }, 5000);
  };

  // Activate warrior power
  const activateWarriorPower = () => {
    setWarriorPowerActive(true);
    setWarriorCooldown(20);

    if (audioEnabled) playWarCrySound();

    setTimeout(() => {
      setWarriorPowerActive(false);
    }, 5000);
  };

  // Cooldown timer
  useEffect(() => {
    if (warriorCooldown > 0) {
      const timer = setTimeout(() => {
        setWarriorCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [warriorCooldown]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const player = playerRef.current;

    if (!scene || !camera || !renderer || !player) return;

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      gameTimeRef.current += delta;

      // Player movement
      const moveSpeed = 8 * delta;
      const direction = new THREE.Vector3();

      if (keysPressed.current['w'] || keysPressed.current['ArrowUp']) direction.z -= 1;
      if (keysPressed.current['s'] || keysPressed.current['ArrowDown']) direction.z += 1;
      if (keysPressed.current['a'] || keysPressed.current['ArrowLeft']) direction.x -= 1;
      if (keysPressed.current['d'] || keysPressed.current['ArrowRight']) direction.x += 1;

      if (direction.length() > 0) {
        direction.normalize();
        const rotatedDirection = direction.applyAxisAngle(
          new THREE.Vector3(0, 1, 0),
          mouseMovement.current.x
        );
        
        player.position.x += rotatedDirection.x * moveSpeed;
        player.position.z += rotatedDirection.z * moveSpeed;
        
        // Boundaries
        player.position.x = Math.max(-90, Math.min(90, player.position.x));
        player.position.z = Math.max(-90, Math.min(90, player.position.z));
      }

      // Player rotation
      player.rotation.y = mouseMovement.current.x;

      // Camera follow
      camera.position.x = player.position.x - Math.sin(mouseMovement.current.x) * 10;
      camera.position.z = player.position.z - Math.cos(mouseMovement.current.x) * 10;
      camera.position.y = player.position.y + 5;
      camera.lookAt(player.position);

      // Update enemies
      enemiesRef.current.forEach((enemy, index) => {
        if (!enemy.parent) return;

        // Move towards player
        const dx = player.position.x - enemy.position.x;
        const dz = player.position.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist > 1) {
          enemy.position.x += (dx / dist) * enemy.userData.speed;
          enemy.position.z += (dz / dist) * enemy.userData.speed;
        }

        // Rotate enemy
        enemy.rotation.y += 0.05;

        // Check collision with player
        if (dist < 1.5 && !warriorPowerActive) {
          setHealth(prev => {
            const newHealth = prev - enemy.userData.damage;
            if (newHealth <= 0) {
              setGameState('gameOver');
            }
            return Math.max(0, newHealth);
          });
          
          scene.remove(enemy);
          enemiesRef.current.splice(index, 1);
          
          if (audioEnabled) playHitSound();
        }

        // Warrior power kills enemies instantly
        if (warriorPowerActive && dist < 3) {
          scene.remove(enemy);
          enemiesRef.current.splice(index, 1);
          setScore(prev => prev + 20);
          setHbarEarned(prev => prev + 5);
        }
      });

      // Update spear projectiles
      scene.children.forEach(child => {
        if (child.userData.velocity) {
          child.position.add(child.userData.velocity);
          child.userData.lifespan--;
          
          if (child.userData.lifespan <= 0) {
            scene.remove(child);
          }

          // Check hit with enemies
          enemiesRef.current.forEach((enemy, index) => {
            const dist = child.position.distanceTo(enemy.position);
            if (dist < 1) {
              enemy.userData.health -= 50;
              
              if (enemy.userData.health <= 0) {
                scene.remove(enemy);
                enemiesRef.current.splice(index, 1);
                setScore(prev => prev + 30);
                setHbarEarned(prev => prev + 10);
                
                if (audioEnabled) playKillSound();
              }
              
              scene.remove(child);
            }
          });
        }
      });

      // Update NFTs
      nftsRef.current.forEach((nft, index) => {
        if (!nft.parent) return;

        // Rotate and float
        nft.rotation.y += 0.02;
        nft.position.y = 2 + Math.sin(gameTimeRef.current * 2 + index) * 0.3;

        // Check collection
        const dist = player.position.distanceTo(nft.position);
        if (dist < 2) {
          scene.remove(nft);
          nftsRef.current.splice(index, 1);
          
          setCollectedSpirits(prev => [...prev, {
            ...nft.userData,
            color: 0xffd700,
            rarity: 'artifact'
          }]);
          setScore(prev => prev + nft.userData.hbar);
          setHbarEarned(prev => prev + nft.userData.hbar);
          
          if (audioEnabled) playCollectionSound();
        }
      });

      // Spawn new enemies periodically
      if (Math.floor(gameTimeRef.current) % 10 === 0 && gameTimeRef.current > 1) {
        const location = kenyanLocations.find(l => l.id === selectedLocation);
        const enemyType = location.enemies[Math.floor(Math.random() * location.enemies.length)];
        createEnemy(scene, enemyType);
      }

      // Spawn new NFTs periodically
      if (Math.floor(gameTimeRef.current) % 15 === 0 && gameTimeRef.current > 1) {
        const location = kenyanLocations.find(l => l.id === selectedLocation);
        const nftData = location.nfts[Math.floor(Math.random() * location.nfts.length)];
        createNFT(scene, nftData);
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [gameState, selectedLocation, audioEnabled, warriorPowerActive]);

  // Sound effects
  const playCollectionSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const playSpearSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 300;
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playWarCrySound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
    oscillator.type = 'triangle';
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  };

  const playHitSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 100;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  const playKillSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    oscillator.type = 'sawtooth';
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const connectWallet = () => {
    setWalletConnected(true);
    alert('Wallet Connected! (Demo mode)\n\nIn production, this would connect to your Hedera wallet via HashConnect.');
  };

  const startGame = (locationId) => {
    setSelectedLocation(locationId);
    setGameState('playing');
    setScore(0);
    setHbarEarned(0);
    setCollectedSpirits([]);
    setHealth(100);
    setSpearCharges(5);
    enemiesRef.current = [];
    nftsRef.current = [];
    gameTimeRef.current = 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 to-black text-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-orange-400">🇰🇪 Ancestral Spirits</h1>
          <span className="text-sm bg-orange-600 px-3 py-1 rounded">Kenya Level (3D Action)</span>
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
        <div className="absolute top-20 bg-gray-800 border-2 border-orange-500 rounded-lg p-6 max-w-md z-10">
          <h3 className="text-xl font-bold mb-3 text-orange-400">How to Play (Action)</h3>
          <ul className="space-y-2 text-sm">
            <li>🎮 <strong>Move:</strong> WASD or Arrow keys</li>
            <li>🖱️ <strong>Look:</strong> Click and move mouse</li>
            <li>⚔️ <strong>Throw Spear:</strong> Press SPACEBAR (5 charges)</li>
            <li>💥 <strong>Warrior Power:</strong> Hold SHIFT (kills nearby enemies)</li>
            <li>🏃 <strong>Dodge:</strong> Move away from enemies!</li>
            <li>💎 <strong>Collect NFTs:</strong> Walk near golden artifacts</li>
            <li>❤️ <strong>Health:</strong> Don't let enemies touch you!</li>
          </ul>
          <div className="mt-4 p-3 bg-red-900 bg-opacity-30 border-l-4 border-red-500 rounded">
            <p className="text-xs text-red-200">
              <strong>⚠️ Warning:</strong> This is a survival game! Kill enemies with spears, dodge attacks, 
              and collect ancient Kenyan artifacts. Your health decreases when enemies hit you!
            </p>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-4 w-full bg-orange-600 hover:bg-orange-500 py-2 rounded"
          >
            Close
          </button>
        </div>
      )}

      {/* Game Area */}
      <div className="relative">
        <div
          ref={mountRef}
          className="border-4 border-orange-600 rounded-lg shadow-2xl bg-black"
          style={{ width: 800, height: 600 }}
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-4xl font-bold mb-4 text-orange-400">Maasai Warrior Quest</h2>
            <p className="text-gray-300 mb-8 text-center max-w-md">
              Survive the wilderness as a Maasai warrior. Hunt beasts and collect ancient treasures!
            </p>
            <button
              onClick={() => setGameState('mapView')}
              className="bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              🗺️ View Map
            </button>
          </div>
        )}

        {/* Map View */}
        {gameState === 'mapView' && (
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900 to-black bg-opacity-95 flex flex-col items-center justify-center rounded-lg p-6 overflow-auto">
            <h2 className="text-3xl font-bold mb-6 text-orange-400">Kenya - East Africa</h2>
            
            <svg width="300" height="400" viewBox="0 0 300 400" className="mb-6">
              <path
                d="M 150 20 L 160 30 L 170 50 L 180 80 L 185 110 L 190 140 L 195 180 L 200 220 L 205 260 L 200 300 L 190 330 L 170 360 L 140 380 L 100 390 L 60 385 L 30 370 L 15 340 L 10 300 L 20 260 L 30 220 L 35 180 L 40 140 L 50 100 L 65 70 L 85 45 L 110 25 L 130 18 Z"
                fill="#2a4a2a"
                stroke="#4a6a4a"
                strokeWidth="2"
              />
              
              <g className="animate-pulse">
                <path
                  d="M 165 145 L 175 150 L 178 165 L 172 180 L 162 185 L 155 175 L 157 160 Z"
                  fill="#FF8C00"
                  stroke="#FFD700"
                  strokeWidth="3"
                />
                <circle cx="167" cy="170" r="3" fill="#FF4500" />
                <text x="167" y="170" textAnchor="middle" fill="#fff" fontSize="8" dy="20">🇰🇪</text>
              </g>
              
              <line x1="167" y1="170" x2="200" y2="100" stroke="#FF8C00" strokeWidth="2" />
              <circle cx="200" cy="100" r="4" fill="#FF8C00" />
              <text x="205" y="95" fill="#FF8C00" fontSize="14" fontWeight="bold">Kenya</text>
              <text x="205" y="110" fill="#ccc" fontSize="10">East Africa</text>
            </svg>

            <div className="bg-gray-800 border-2 border-orange-500 rounded-lg p-6 max-w-md mb-6">
              <h3 className="text-xl font-bold mb-3 text-orange-300">📍 Location</h3>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Country:</strong> Republic of Kenya
              </p>
              <p className="text-sm text-gray-300 mb-2">
                <strong>Regions:</strong> Savanna, Rift Valley, Coast
              </p>
              <p className="text-sm text-gray-300">
                <strong>Warriors:</strong> Maasai people - legendary fighters
              </p>
            </div>

            <button
              onClick={() => setGameState('locationSelect')}
              className="bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              Choose Battleground ➜
            </button>
          </div>
        )}

        {/* Location Selection */}
        {gameState === 'locationSelect' && (
          <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center rounded-lg p-4 overflow-auto">
            <h2 className="text-3xl font-bold mb-4 text-orange-400 mt-4">Choose Your Hunt</h2>
            <p className="text-gray-300 mb-6 text-center max-w-2xl">
              Select a location to begin your warrior quest. Each has different enemies and treasures!
            </p>

            <div className="grid grid-cols-1 gap-4 max-w-2xl">
              {kenyanLocations.map((location) => (
                <div
                  key={location.id}
                  className="bg-gray-800 border-2 rounded-lg p-6 hover:scale-105 transition cursor-pointer"
                  style={{ borderColor: location.color }}
                  onClick={() => startGame(location.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">
                      {location.id === 'masai_mara' && '🦁'}
                      {location.id === 'great_rift' && '🌋'}
                      {location.id === 'swahili_coast' && '🏖️'}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-2" style={{ color: location.color }}>
                        {location.name}
                      </h3>
                      
                      <p className="text-sm text-gray-300 mb-3 leading-relaxed">
                        {location.description}
                      </p>

                      <div className="flex gap-2 mb-3">
                        <span className={`text-xs px-3 py-1 rounded ${
                          location.difficulty === 'Easy' ? 'bg-green-600' :
                          location.difficulty === 'Medium' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}>
                          {location.difficulty}
                        </span>
                        <span className="text-xs px-3 py-1 rounded bg-gray-700">
                          {location.enemies.length} Enemy Types
                        </span>
                        <span className="text-xs px-3 py-1 rounded bg-yellow-700">
                          {location.nfts.length} NFTs
                        </span>
                      </div>

                      <div className="text-xs text-gray-400 mb-2">
                        <strong>Enemies:</strong> {location.enemies.join(', ')}
                      </div>

                      <div className="text-xs text-gray-400">
                        <strong>Treasures:</strong> {location.nfts.map(n => n.name).join(', ')}
                      </div>
                    </div>
                  </div>

                  <button
                    className="w-full mt-4 py-3 rounded font-bold text-lg hover:opacity-80 transition"
                    style={{ backgroundColor: location.color }}
                  >
                    Begin Hunt →
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setGameState('mapView')}
              className="mt-6 text-gray-400 hover:text-gray-200 text-sm"
            >
              ← Back to Map
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-3xl font-bold mb-6">Paused</h2>
            <button
              onClick={() => setGameState('playing')}
              className="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded-lg font-bold mb-3"
            >
              Resume Hunt
            </button>
            <button
              onClick={() => {
                setGameState('locationSelect');
                setSelectedLocation(null);
              }}
              className="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded-lg font-bold"
            >
              Change Location
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-4xl font-bold mb-4 text-red-500">Defeated!</h2>
            <p className="text-xl text-gray-300 mb-6">The beasts have won this battle...</p>
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <p className="text-lg mb-2">Final Score: <span className="text-orange-400 font-bold">{score}</span></p>
              <p className="text-lg mb-2">HBAR Earned: <span className="text-purple-400 font-bold">{hbarEarned}</span></p>
              <p className="text-lg">NFTs Collected: <span className="text-yellow-400 font-bold">{collectedSpirits.length}</span></p>
            </div>
            <button
              onClick={() => {
                setGameState('locationSelect');
                setHealth(100);
              }}
              className="bg-orange-600 hover:bg-orange-500 px-8 py-4 rounded-lg text-xl font-bold"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Crosshair */}
        {gameState === 'playing' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-6 h-6">
              <div className="absolute w-2 h-0.5 bg-white left-1/2 top-1/2 -translate-x-1/2"></div>
              <div className="absolute w-0.5 h-2 bg-white left-1/2 top-1/2 -translate-y-1/2"></div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {gameState === 'playing' && (
        <div className="w-full max-w-4xl mt-4 grid grid-cols-5 gap-3">
          <div className="bg-gray-800 border-2 border-orange-600 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="text-orange-400" size={18} />
              <span className="font-bold text-sm">Score</span>
            </div>
            <div className="text-xl font-bold text-orange-400">{score}</div>
          </div>
          
          <div className="bg-gray-800 border-2 border-purple-600 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">💎</span>
              <span className="font-bold text-sm">HBAR</span>
            </div>
            <div className="text-xl font-bold text-purple-400">{hbarEarned}</div>
          </div>
          
          <div className={`bg-gray-800 border-2 rounded-lg p-3 ${health > 50 ? 'border-green-600' : health > 20 ? 'border-yellow-600' : 'border-red-600 animate-pulse'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="text-red-500" size={18} />
              <span className="font-bold text-sm">Health</span>
            </div>
            <div className="text-xl font-bold" style={{ color: health > 50 ? '#4ade80' : health > 20 ? '#fbbf24' : '#ef4444' }}>
              {health}%
            </div>
          </div>
          
          <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">⚔️</span>
              <span className="font-bold text-sm">Spears</span>
            </div>
            <div className="text-xl font-bold text-gray-300">{spearCharges}/5</div>
          </div>
          
          <div className={`bg-gray-800 border-2 rounded-lg p-3 ${warriorPowerActive ? 'border-orange-400 animate-pulse' : warriorCooldown > 0 ? 'border-gray-600' : 'border-orange-600'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="text-orange-400" size={18} />
              <span className="font-bold text-sm">Power</span>
            </div>
            <div className={`text-lg font-bold ${warriorPowerActive ? 'text-orange-400' : warriorCooldown > 0 ? 'text-gray-500' : 'text-orange-400'}`}>
              {warriorPowerActive ? 'ACTIVE!' : warriorCooldown > 0 ? `${warriorCooldown}s` : 'READY'}
            </div>
          </div>
        </div>
      )}

      {/* Collected NFTs Gallery */}
      {collectedSpirits.length > 0 && gameState === 'playing' && (
        <div className="w-full max-w-4xl mt-4 bg-gray-800 border-2 border-orange-600 rounded-lg p-4">
          <h3 className="text-xl font-bold mb-3 text-orange-400">Collected Artifacts</h3>
          <div className="grid grid-cols-6 gap-2">
            {collectedSpirits.slice(-12).map((artifact, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded p-2 text-center border-2 border-yellow-500 hover:scale-105 transition"
              >
                <div className="text-2xl mb-1">
                  {artifact.type === 'weapon' ? '⚔️' : 
                   artifact.type === 'clothing' ? '👘' :
                   artifact.type === 'structure' ? '🏠' : '💎'}
                </div>
                <div className="text-xs font-bold">{artifact.name}</div>
                <div className="text-xs text-yellow-400">{artifact.hbar} HBAR</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-400">
        <p>Built for Hackeroos Spooky Reddit Jam × Hedera Africa</p>
        <p className="mt-1">Egypt (2D) ✅ | Ethiopia (3D) ✅ | Nigeria (3D) ✅ | Kenya (3D Action) ✅</p>
        <p className="mt-1 text-green-400 font-bold">🎮 ALL 4 LEVELS COMPLETE! 🎮</p>
      </div>
    </div>
  );
};

export default AncestralSpiritsKenya3D;