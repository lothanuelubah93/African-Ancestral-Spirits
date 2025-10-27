import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Wallet, Trophy, Info, Eye, Star, Sparkles, Crosshair, Zap, Skull, Users, Heart } from 'lucide-react';
import { useAudio } from '../shared/AudioPlayer'; // ADDED: Import audio hook

const DogonStarDiscovery = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [hbarEarned, setHbarEarned] = useState(0);
  const [discoveredStars, setDiscoveredStars] = useState([]);
  const [discoveredConstellations, setDiscoveredConstellations] = useState([]);
  const [aliensKilled, setAliensKilled] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [cosmicVisionActive, setCosmicVisionActive] = useState(false);
  const [cosmicCooldown, setCosmicCooldown] = useState(0);
  const [laserCharges, setLaserCharges] = useState(10);
  const [nightProgress, setNightProgress] = useState(0);
  const [twoPlayerMode, setTwoPlayerMode] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [player1Character, setPlayer1Character] = useState(null);
  const [player2Character, setPlayer2Character] = useState(null);
  const [player1Health, setPlayer1Health] = useState(100);
  const [player2Health, setPlayer2Health] = useState(100);

  // ADDED: Audio hook
  const { playSound, playAmbient, transitionAmbient, stopAmbient, setEnabled, preloadLevel, isLoading } = useAudio();

  const starsRef = useRef([]);
  const constellationsRef = useRef([]);
  const aliensRef = useRef([]);
  const lasersRef = useRef([]);
  const alienBulletsRef = useRef([]);
  const ghostsRef = useRef([]);
  const player1Ref = useRef({ x: 200, y: 500 });
  const player2Ref = useRef({ x: 600, y: 500 });
  const keysPressed = useRef({});
  const mousePos = useRef({ x: 0, y: 0 });
  const gameLoopRef = useRef(null);

  const characters = [
    {
      id: 'mansa_musa',
      name: 'Mansa Musa',
      emoji: '👑',
      color: '#FFD700',
      description: 'The Golden Emperor',
      ability: 'Gold Shield - 50% damage reduction',
      speed: 3,
      damageReduction: 0.5
    },
    {
      id: 'salif_keita',
      name: 'Salif Keita',
      emoji: '🎵',
      color: '#FF6B6B',
      description: 'The Golden Voice',
      ability: 'Sonic Speed - Fastest movement',
      speed: 5,
      damageReduction: 0
    },
    {
      id: 'sundiata',
      name: 'Sundiata Keita',
      emoji: '🦁',
      color: '#FF8C00',
      description: 'The Lion King',
      ability: 'Lion Rage - Balanced warrior',
      speed: 3.5,
      damageReduction: 0.2
    },
    {
      id: 'yennenga',
      name: 'Yennenga',
      emoji: '🏇',
      color: '#9D4EDD',
      description: 'The Warrior Princess',
      ability: 'Swift Strike - Speed & agility',
      speed: 4.5,
      damageReduction: 0.1
    }
  ];

  const dogonConstellations = [
    {
      name: 'Sirius System',
      stars: 8,
      pattern: 'sirius',
      hbar: 100,
      description: 'The Dogon knew of Sirius B!',
      knowledge: 'Sirius B orbits Sirius A every 50 years.'
    },
    {
      name: 'Pleiades',
      stars: 7,
      pattern: 'pleiades',
      hbar: 60,
      description: 'Seven Sisters - sacred to Dogon',
      knowledge: 'The Dogon calendar is based on Pleiades.'
    },
    {
      name: 'Orion',
      stars: 7,
      pattern: 'orion',
      hbar: 50,
      description: 'The Hunter constellation',
      knowledge: 'Orion aligns with Dogon structures.'
    }
  ];

  const starTypes = [
    { type: 'white', size: 2, brightness: 1, hbar: 10 },
    { type: 'blue', size: 3, brightness: 1.2, hbar: 15 },
    { type: 'red', size: 4, brightness: 0.8, hbar: 20 },
    { type: 'yellow', size: 2.5, brightness: 1, hbar: 12 }
  ];

  const alienTypes = [
    { 
      type: 'kanaga', 
      speed: 2, 
      health: 30, 
      hbar: 25, 
      color: '#8b4513',
      size: 25,
      shootChance: 0.02
    },
    { 
      type: 'satimbe', 
      speed: 1.5, 
      health: 60, 
      hbar: 50, 
      color: '#ff6b6b',
      size: 35,
      shootChance: 0.03
    },
    { 
      type: 'amma', 
      speed: 0.5, 
      health: 150, 
      hbar: 150, 
      color: '#9d4edd',
      size: 60,
      shootChance: 0.05
    }
  ];

  // ADDED: Start background music when playing
  useEffect(() => {
    if (gameState === 'playing') {
      // Preload sounds for this level
      preloadLevel('senegal');
      
      // Start calm ambient music
      playAmbient('senegal_ambient_start', true);
    } else {
      stopAmbient();
    }

    return () => stopAmbient();
  }, [gameState]);

  // ADDED: Sync audio enabled state
  useEffect(() => {
    setEnabled(audioEnabled);
  }, [audioEnabled]);

  // ADDED: Transition to intense music when things get spooky
  useEffect(() => {
    if (aliensKilled > 10 && gameState === 'playing') {
      transitionAmbient('senegal_ambient_start', 'senegal_ambient_intense', 3000);
    }
  }, [aliensKilled, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== 'playing') return;

    canvas.width = 800;
    canvas.height = 600;

    generateStars();
    generateConstellations();
    spawnAlien();
    spawnGhosts();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState]);

  const generateStars = () => {
    starsRef.current = [];
    for (let i = 0; i < 150; i++) {
      const starType = starTypes[Math.floor(Math.random() * starTypes.length)];
      starsRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        ...starType,
        twinkle: Math.random() * Math.PI * 2,
        discovered: false
      });
    }
  };

  const generateConstellations = () => {
    constellationsRef.current = [];
    dogonConstellations.forEach((constellation, index) => {
      const centerX = 150 + index * 250;
      const centerY = 100 + Math.random() * 400;
      const stars = [];

      if (constellation.pattern === 'sirius') {
        stars.push({ x: centerX, y: centerY, size: 6 });
        stars.push({ x: centerX + 20, y: centerY + 10, size: 2 });
      } else if (constellation.pattern === 'pleiades') {
        for (let i = 0; i < 7; i++) {
          const angle = (i / 7) * Math.PI * 2;
          stars.push({
            x: centerX + Math.cos(angle) * 30,
            y: centerY + Math.sin(angle) * 30,
            size: 3
          });
        }
      } else {
        stars.push({ x: centerX - 20, y: centerY - 30, size: 3 });
        stars.push({ x: centerX, y: centerY - 30, size: 3 });
        stars.push({ x: centerX + 20, y: centerY - 30, size: 3 });
        stars.push({ x: centerX - 30, y: centerY, size: 4 });
        stars.push({ x: centerX + 30, y: centerY, size: 4 });
        stars.push({ x: centerX - 15, y: centerY + 30, size: 3 });
        stars.push({ x: centerX + 15, y: centerY + 30, size: 3 });
      }

      constellationsRef.current.push({
        ...constellation,
        stars,
        discovered: false,
        starsFound: 0
      });
    });
  };

  const spawnGhosts = () => {
    ghostsRef.current = [];
    for (let i = 0; i < 8; i++) {
      ghostsRef.current.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 20 + Math.random() * 30,
        opacity: 0.3 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }
  };

  const spawnAlien = () => {
    const alienType = alienTypes[Math.floor(Math.random() * alienTypes.length)];
    const side = Math.random() > 0.5 ? 'left' : 'right';
    
    aliensRef.current.push({
      x: side === 'left' ? -50 : 850,
      y: 50 + Math.random() * 300,
      vx: (side === 'left' ? 1 : -1) * alienType.speed,
      vy: (Math.random() - 0.5) * 0.5,
      ...alienType,
      shootTimer: 0
    });

    // ADDED: Play alien appear sound
    if (audioEnabled) playSound('senegal_alien_appear', 0.4);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
      
      if (e.key === ' ' && gameState === 'playing' && player1Character) {
        e.preventDefault();
        fireLaser(player1Ref.current.x, player1Ref.current.y - 20, 1);
      }

      if (e.key === 'Enter' && gameState === 'playing' && player2Character && twoPlayerMode) {
        e.preventDefault();
        fireLaser(player2Ref.current.x, player2Ref.current.y - 20, 2);
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleClick = (e) => {
      if (gameState === 'playing') {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        checkStarClick(x, y);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    if (canvasRef.current) {
      canvasRef.current.addEventListener('click', handleClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, player1Character, player2Character, twoPlayerMode]);

  const fireLaser = (x, y, player) => {
    if (laserCharges <= 0) return;

    setLaserCharges(prev => prev - 1);

    let nearestAlien = null;
    let nearestDist = Infinity;

    aliensRef.current.forEach(alien => {
      const dist = Math.sqrt(Math.pow(alien.x - x, 2) + Math.pow(alien.y - y, 2));
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestAlien = alien;
      }
    });

    if (nearestAlien) {
      const char = player === 1 ? player1Character : player2Character;
      lasersRef.current.push({
        x,
        y,
        targetX: nearestAlien.x,
        targetY: nearestAlien.y,
        life: 20,
        color: char?.color || '#00ff00'
      });

      // CHANGED: Use ElevenLabs laser sound
      if (audioEnabled) playSound('senegal_laser_fire', 0.5);
    }

    setTimeout(() => {
      setLaserCharges(prev => Math.min(prev + 1, 10));
    }, 2000);
  };

  const checkStarClick = (x, y) => {
    starsRef.current.forEach((star) => {
      const dist = Math.sqrt(Math.pow(x - star.x, 2) + Math.pow(y - star.y, 2));
      
      if (dist < star.size * 5 && !star.discovered) {
        star.discovered = true;
        setDiscoveredStars(prev => [...prev, star]);
        setScore(prev => prev + star.hbar);
        setHbarEarned(prev => prev + star.hbar);
        
        // CHANGED: Use ElevenLabs star collect sound
        if (audioEnabled) playSound('senegal_star_collect', 0.6);
        
        checkConstellationCompletion(star);
      }
    });
  };

  const checkConstellationCompletion = (star) => {
    constellationsRef.current.forEach((constellation) => {
      if (constellation.discovered) return;

      constellation.stars.forEach((constellationStar) => {
        const dist = Math.sqrt(
          Math.pow(star.x - constellationStar.x, 2) +
          Math.pow(star.y - constellationStar.y, 2)
        );

        if (dist < 30) {
          constellation.starsFound++;
          
          if (constellation.starsFound >= constellation.stars.length) {
            constellation.discovered = true;
            setDiscoveredConstellations(prev => [...prev, constellation]);
            setScore(prev => prev + constellation.hbar);
            setHbarEarned(prev => prev + constellation.hbar);
            
            // CHANGED: Use ElevenLabs cosmic vision sound
            if (audioEnabled) playSound('senegal_cosmic_vision', 0.7);
          }
        }
      });
    });
  };

  useEffect(() => {
    if (gameState !== 'playing' || !player1Character) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#0a0015');
      gradient.addColorStop(0.5, '#1a0033');
      gradient.addColorStop(1, '#0a0015');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);

      // Fog
      ctx.save();
      ctx.globalAlpha = 0.2;
      const fogGradient = ctx.createRadialGradient(400, 300, 100, 400, 300, 400);
      fogGradient.addColorStop(0, '#4a0080');
      fogGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, 0, 800, 600);
      ctx.restore();

      // Ghosts
      ghostsRef.current.forEach((ghost) => {
        ghost.x += ghost.vx;
        ghost.y += ghost.vy;
        ghost.phase += 0.05;

        if (ghost.x < -50) ghost.x = 850;
        if (ghost.x > 850) ghost.x = -50;
        if (ghost.y < -50) ghost.y = 650;
        if (ghost.y > 650) ghost.y = -50;

        ctx.save();
        ctx.globalAlpha = ghost.opacity * (0.5 + Math.sin(ghost.phase) * 0.3);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${ghost.size}px Arial`;
        ctx.fillText('👻', ghost.x, ghost.y);
        ctx.restore();
      });

      // Stars
      starsRef.current.forEach((star) => {
        star.twinkle += 0.05;
        const twinkleEffect = Math.sin(star.twinkle) * 0.3 + 0.7;
        
        const colorMap = { white: '#ffffff', blue: '#4d9fff', red: '#ff4d4d', yellow: '#ffeb3b' };
        const starColor = colorMap[star.type] || '#ffffff';
        
        ctx.globalAlpha = star.brightness * twinkleEffect;
        ctx.fillStyle = starColor;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (star.discovered) {
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Player 1
      if (player1Character) {
        const speed = player1Character.speed;
        if (keysPressed.current['w']) player1Ref.current.y -= speed;
        if (keysPressed.current['s']) player1Ref.current.y += speed;
        if (keysPressed.current['a']) player1Ref.current.x -= speed;
        if (keysPressed.current['d']) player1Ref.current.x += speed;

        player1Ref.current.x = Math.max(30, Math.min(770, player1Ref.current.x));
        player1Ref.current.y = Math.max(30, Math.min(570, player1Ref.current.y));

        ctx.save();
        ctx.font = '40px Arial';
        ctx.fillText(player1Character.emoji, player1Ref.current.x - 20, player1Ref.current.y + 20);
        ctx.shadowBlur = 20;
        ctx.shadowColor = player1Character.color;
        ctx.strokeStyle = player1Character.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player1Ref.current.x, player1Ref.current.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = player1Character.color;
        ctx.font = '12px Arial';
        ctx.fillText('P1', player1Ref.current.x - 10, player1Ref.current.y - 30);
      }

      // Player 2
      if (player2Character && twoPlayerMode) {
        const speed = player2Character.speed;
        if (keysPressed.current['arrowup']) player2Ref.current.y -= speed;
        if (keysPressed.current['arrowdown']) player2Ref.current.y += speed;
        if (keysPressed.current['arrowleft']) player2Ref.current.x -= speed;
        if (keysPressed.current['arrowright']) player2Ref.current.x += speed;

        player2Ref.current.x = Math.max(30, Math.min(770, player2Ref.current.x));
        player2Ref.current.y = Math.max(30, Math.min(570, player2Ref.current.y));

        ctx.save();
        ctx.font = '40px Arial';
        ctx.fillText(player2Character.emoji, player2Ref.current.x - 20, player2Ref.current.y + 20);
        ctx.shadowBlur = 20;
        ctx.shadowColor = player2Character.color;
        ctx.strokeStyle = player2Character.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player2Ref.current.x, player2Ref.current.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = player2Character.color;
        ctx.font = '12px Arial';
        ctx.fillText('P2', player2Ref.current.x - 10, player2Ref.current.y - 30);
      }

      // Aliens
      aliensRef.current.forEach((alien, index) => {
        alien.x += alien.vx;
        alien.y += alien.vy;
        alien.shootTimer++;

        if (alien.y < 50) alien.vy = Math.abs(alien.vy);
        if (alien.y > 300) alien.vy = -Math.abs(alien.vy);

        // Shoot at players
        if (alien.shootTimer > 60 && Math.random() < alien.shootChance) {
          alien.shootTimer = 0;
          const targetPlayer = (twoPlayerMode && Math.random() > 0.5) ? player2Ref.current : player1Ref.current;
          
          alienBulletsRef.current.push({
            x: alien.x,
            y: alien.y,
            targetX: targetPlayer.x,
            targetY: targetPlayer.y,
            speed: 3,
            damage: 10
          });

          // CHANGED: Use ElevenLabs alien shoot sound
          if (audioEnabled) playSound('senegal_alien_shoot', 0.4);
        }

        // Draw alien
        ctx.save();
        ctx.translate(alien.x, alien.y);

        ctx.fillStyle = alien.color;
        if (alien.type === 'kanaga') {
          ctx.fillRect(-alien.size * 0.4, -alien.size * 0.6, alien.size * 0.8, alien.size * 0.3);
          ctx.fillRect(-alien.size * 0.1, -alien.size * 0.6, alien.size * 0.2, alien.size);
        } else if (alien.type === 'satimbe') {
          ctx.fillRect(-alien.size * 0.3, -alien.size, alien.size * 0.6, alien.size * 1.5);
        } else {
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const r = i % 2 === 0 ? alien.size * 0.8 : alien.size * 0.5;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-alien.size * 0.2, 0, alien.size * 0.1, 0, Math.PI * 2);
        ctx.arc(alien.size * 0.2, 0, alien.size * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Health bar
        const maxHealth = alienTypes.find(t => t.type === alien.type).health;
        ctx.fillStyle = '#333';
        ctx.fillRect(alien.x - 20, alien.y - alien.size - 15, 40, 4);
        ctx.fillStyle = alien.health > 30 ? '#0f0' : '#f00';
        ctx.fillRect(alien.x - 20, alien.y - alien.size - 15, (alien.health / maxHealth) * 40, 4);

        if (alien.x < -100 || alien.x > 900) {
          aliensRef.current.splice(index, 1);
        }
      });

      // Alien bullets
      alienBulletsRef.current.forEach((bullet, index) => {
        const dx = bullet.targetX - bullet.x;
        const dy = bullet.targetY - bullet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
          bullet.x += (dx / dist) * bullet.speed;
          bullet.y += (dy / dist) * bullet.speed;
        }

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Hit player 1
        if (player1Character) {
          const dist1 = Math.sqrt(
            Math.pow(bullet.x - player1Ref.current.x, 2) +
            Math.pow(bullet.y - player1Ref.current.y, 2)
          );
          
          if (dist1 < 30) {
            const damage = bullet.damage * (1 - player1Character.damageReduction);
            setPlayer1Health(prev => {
              const newHealth = Math.max(0, prev - damage);
              if (newHealth <= 0) {
                setTimeout(() => {
                  alert('💀 Player 1 Defeated!');
                  setGameState('menu');
                }, 100);
              }
              return newHealth;
            });
            alienBulletsRef.current.splice(index, 1);
            
            // CHANGED: Use ElevenLabs hit sound
            if (audioEnabled) playSound('senegal_player_hit', 0.6);
            return;
          }
        }

        // Hit player 2
        if (player2Character && twoPlayerMode) {
          const dist2 = Math.sqrt(
            Math.pow(bullet.x - player2Ref.current.x, 2) +
            Math.pow(bullet.y - player2Ref.current.y, 2)
          );
          
          if (dist2 < 30) {
            const damage = bullet.damage * (1 - player2Character.damageReduction);
            setPlayer2Health(prev => Math.max(0, prev - damage));
            alienBulletsRef.current.splice(index, 1);
            
            // CHANGED: Use ElevenLabs hit sound
            if (audioEnabled) playSound('senegal_player_hit', 0.6);
            return;
          }
        }

        if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
          alienBulletsRef.current.splice(index, 1);
        }
      });

      // Lasers
      lasersRef.current.forEach((laser, index) => {
        laser.life--;

        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = laser.color;
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(laser.x, laser.y);
        ctx.lineTo(laser.targetX, laser.targetY);
        ctx.stroke();
        ctx.restore();

        aliensRef.current.forEach((alien, alienIndex) => {
          const dist = Math.sqrt(
            Math.pow(laser.targetX - alien.x, 2) +
            Math.pow(laser.targetY - alien.y, 2)
          );

          if (dist < alien.size) {
            alien.health -= 20;

            if (alien.health <= 0) {
              aliensRef.current.splice(alienIndex, 1);
              setAliensKilled(prev => prev + 1);
              setScore(prev => prev + alien.hbar);
              setHbarEarned(prev => prev + alien.hbar);

              // CHANGED: Use ElevenLabs alien death sound
              if (audioEnabled) playSound('senegal_alien_death', 0.5);
            }

            lasersRef.current.splice(index, 1);
          }
        });

        if (laser.life <= 0) {
          lasersRef.current.splice(index, 1);
        }
      });

      setNightProgress(prev => Math.min(prev + 0.05, 100));

      if (Math.random() < 0.015 && aliensRef.current.length < 6) {
        spawnAlien();
      }

      gameLoopRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, player1Character, player2Character, twoPlayerMode, audioEnabled]);

  const connectWallet = () => {
    setWalletConnected(true);
  };

  const startCharacterSelect = (twoPlayer) => {
    setTwoPlayerMode(twoPlayer);
    setGameState('characterSelect');
    setPlayer1Character(null);
    setPlayer2Character(null);
    setPlayer1Health(100);
    setPlayer2Health(100);
  };

  const selectCharacter = (character, player) => {
    if (player === 1) {
      setPlayer1Character(character);
      if (!twoPlayerMode) {
        startGame();
      }
    } else {
      setPlayer2Character(character);
      if (player1Character) {
        startGame();
      }
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setHbarEarned(0);
    setDiscoveredStars([]);
    setDiscoveredConstellations([]);
    setAliensKilled(0);
    setNightProgress(0);
    setLaserCharges(10);
    player1Ref.current = { x: 200, y: 500 };
    player2Ref.current = { x: 600, y: 500 };
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-purple-400">👻 Dogon Star Wars: Spooky Edition</h1>
          <span className="text-sm bg-purple-600 px-3 py-1 rounded animate-pulse">🇸🇳 Senegal Stage</span>
          {isLoading && <span className="text-xs text-yellow-400">🎵 Loading sounds...</span>}
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
        <div className="absolute top-20 bg-gray-900 border-2 border-purple-500 rounded-lg p-6 max-w-md z-10">
          <h3 className="text-xl font-bold mb-3 text-purple-400">👻 Spooky Dogon Star Wars</h3>
          <ul className="space-y-2 text-sm">
            <li>🎮 <strong>Choose your hero</strong> - Mansa Musa, Salif Keita, Sundiata, or Yennenga!</li>
            <li>🖱️ <strong>Click stars</strong> to discover constellations</li>
            <li>👺 <strong>Dodge alien bullets</strong> - they shoot back!</li>
            <li>⚡ <strong>P1: WASD + SPACE</strong> to move and shoot</li>
            <li>⚡ <strong>P2: ARROWS + ENTER</strong> to move and shoot</li>
            <li>❤️ <strong>Protect your health</strong> - don't get hit!</li>
            <li>💰 <strong>Earn HBAR</strong> for killing spooky masked aliens!</li>
            <li>🎵 <strong>Powered by ElevenLabs AI Audio</strong></li>
          </ul>
          <div className="mt-4 p-3 bg-red-900 bg-opacity-30 border-l-4 border-red-500 rounded">
            <p className="text-xs text-red-200">
              <strong>👺 AFRICAN SPIRIT INVASION!</strong> Dogon ancestral masks have come alive! Dodge their cursed bullets and fight back!
            </p>
          </div>
          <button
            onClick={() => setShowInfo(false)}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-500 py-2 rounded"
          >
            Close
          </button>
        </div>
      )}

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-4 border-purple-600 rounded-lg shadow-2xl"
          style={{ cursor: gameState === 'playing' ? 'none' : 'default' }}
        />

        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center rounded-lg">
            <div className="text-8xl mb-4 animate-bounce">👻🌟</div>
            <h2 className="text-4xl font-bold mb-4 text-purple-400">Dogon Star Wars: Spooky Edition</h2>
            <p className="text-gray-300 mb-6 text-center max-w-md">
              Face the ancestral Dogon spirits! Choose your West African hero and survive the night!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => startCharacterSelect(false)}
                className="bg-purple-600 hover:bg-purple-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105 block w-64"
              >
                👤 Single Player
              </button>
              <button
                onClick={() => startCharacterSelect(true)}
                className="bg-pink-600 hover:bg-pink-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105 block w-64"
              >
                👥 Two Players
              </button>
            </div>
          </div>
        )}

        {gameState === 'characterSelect' && (
          <div className="absolute inset-0 bg-black bg-opacity-95 flex flex-col items-center justify-center rounded-lg overflow-y-auto p-4">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">
              {!player1Character ? '👤 Player 1: Choose Your Hero' : '👥 Player 2: Choose Your Hero'}
            </h2>
            <div className="grid grid-cols-2 gap-4 max-w-2xl">
              {characters.map(char => (
                <button
                  key={char.id}
                  onClick={() => selectCharacter(char, player1Character ? 2 : 1)}
                  className="bg-gray-800 hover:bg-gray-700 p-6 rounded-lg border-2 border-purple-500 transition transform hover:scale-105"
                >
                  <div className="text-6xl mb-3">{char.emoji}</div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: char.color }}>{char.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{char.description}</p>
                  <p className="text-xs text-yellow-400">{char.ability}</p>
                  <div className="mt-3 flex justify-between text-xs">
                    <span>Speed: {char.speed}</span>
                    <span>Defense: {char.damageReduction * 100}%</span>
                  </div>
                </button>
              ))}
            </div>
            {player1Character && twoPlayerMode && !player2Character && (
              <p className="mt-6 text-gray-400 text-center">
                Player 1 selected: {player1Character.emoji} {player1Character.name}
              </p>
            )}
          </div>
        )}

        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-4xl font-bold mb-6 text-yellow-400">⏸️ Paused</h2>
            <div className="space-y-3">
              <button
                onClick={() => setGameState('playing')}
                className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-bold transition block w-48"
              >
                Resume
              </button>
              <button
                onClick={() => setGameState('menu')}
                className="bg-red-600 hover:bg-red-500 px-8 py-3 rounded-lg font-bold transition block w-48"
              >
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-800 p-3 rounded-lg border-2 border-green-600">
          <div className="flex items-center gap-2 mb-1">
            <Star className="text-yellow-400" size={18} />
            <span className="text-sm text-gray-400">Score</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{score}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border-2 border-purple-600">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="text-purple-400" size={18} />
            <span className="text-sm text-gray-400">HBAR</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{hbarEarned}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border-2 border-red-600">
          <div className="flex items-center gap-2 mb-1">
            <Skull className="text-red-400" size={18} />
            <span className="text-sm text-gray-400">Kills</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{aliensKilled}</div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border-2 border-pink-600">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="text-pink-400" size={18} />
            <span className="text-sm text-gray-400">P1 HP</span>
          </div>
          <div className="text-2xl font-bold text-pink-400">{Math.floor(player1Health)}</div>
          <div className="w-full bg-gray-700 h-2 rounded-full mt-1">
            <div
              className="bg-pink-400 h-2 rounded-full transition-all"
              style={{ width: `${player1Health}%` }}
            />
          </div>
        </div>

        {twoPlayerMode && (
          <div className="bg-gray-800 p-3 rounded-lg border-2 border-cyan-600">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="text-cyan-400" size={18} />
              <span className="text-sm text-gray-400">P2 HP</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{Math.floor(player2Health)}</div>
            <div className="w-full bg-gray-700 h-2 rounded-full mt-1">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all"
                style={{ width: `${player2Health}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="w-full max-w-4xl mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gray-800 p-3 rounded-lg border-2 border-green-600">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="text-green-400" size={18} />
              <span className="text-sm font-bold">Laser Charges</span>
            </div>
            <span className="text-lg font-bold text-green-400">{laserCharges}/10</span>
          </div>
          <div className="text-xs text-gray-400">Auto recharge (2s)</div>
          <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all"
              style={{ width: `${(laserCharges / 10) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 p-3 rounded-lg border-2 border-indigo-600">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-indigo-400" size={18} />
            <span className="text-sm font-bold">Night Progress</span>
          </div>
          <div className="text-xs text-gray-400">Survive til dawn</div>
          <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
            <div
              className="bg-indigo-400 h-2 rounded-full transition-all"
              style={{ width: `${nightProgress}%` }}
            />
          </div>
        </div>
      </div>

      {discoveredConstellations.length > 0 && (
        <div className="w-full max-w-4xl mt-4 bg-gradient-to-r from-purple-900 to-pink-900 p-4 rounded-lg border-2 border-yellow-400">
          <h3 className="text-xl font-bold mb-3 text-yellow-400 flex items-center gap-2">
            <Trophy size={24} />
            Constellations Discovered
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {discoveredConstellations.map((constellation, index) => (
              <div
                key={index}
                className="bg-black bg-opacity-40 p-3 rounded-lg border border-yellow-400"
              >
                <div className="text-lg font-bold text-yellow-300">{constellation.name}</div>
                <div className="text-xs text-gray-300 mt-1">{constellation.description}</div>
                <div className="text-xs text-green-400 mt-2">+{constellation.hbar} HBAR</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {nightProgress >= 100 && (
        <div className="w-full max-w-4xl mt-4 bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-lg border-4 border-yellow-400 animate-pulse">
          <h2 className="text-3xl font-bold text-center text-white mb-2">🌅 DAWN HAS ARRIVED!</h2>
          <p className="text-center text-yellow-100">You survived the night! The spirits retreat to the shadows...</p>
          <p className="text-center text-white font-bold mt-3">SENEGAL STAGE COMPLETE! 🇸🇳</p>
        </div>
      )}
    </div>
  );
};

export default DogonStarDiscovery;