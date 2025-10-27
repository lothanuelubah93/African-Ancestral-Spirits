import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Wallet, Trophy, Info } from 'lucide-react';

const AncestralSpiritsEgypt = ({ autoStart = false }) => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(autoStart ? 'playing' : 'menu'); // menu, playing, paused
  const [score, setScore] = useState(0);
  const [hbarEarned, setHbarEarned] = useState(0);
  const [collectedSpirits, setCollectedSpirits] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [raActive, setRaActive] = useState(false);
  const [raCooldown, setRaCooldown] = useState(0);
  const gameLoopRef = useRef(null);
  const keysPressed = useRef({});

  // Game objects
  const playerRef = useRef({
    x: 400,
    y: 300,
    width: 40,
    height: 60,
    speed: 4,
    direction: 'down'
  });

  const spiritsRef = useRef([]);
  const particlesRef = useRef([]);
  const starsRef = useRef([]);

  // Spirit types (Egyptian mythology)
  const spiritTypes = [
    { name: 'Ammit', color: '#8B4513', rarity: 'legendary', hbar: 50, description: 'Devourer of souls - crocodile, lion, and hippo hybrid' },
    { name: 'Apep', color: '#2F4F4F', rarity: 'rare', hbar: 30, description: 'Serpent of chaos from the underworld' },
    { name: 'Ba', color: '#FFD700', rarity: 'common', hbar: 10, description: 'Soul bird spirit of the deceased' }
  ];

  // Initialize game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 800;
    canvas.height = 600;

    // Initialize stars for background
    starsRef.current = Array.from({ length: 100 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      size: Math.random() * 2,
      opacity: Math.random()
    }));

    // Spawn initial spirits
    spawnSpirit();
    spawnSpirit();
    spawnSpirit();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      keysPressed.current[e.key] = true;
      if (e.key === 'Escape' && gameState === 'playing') {
        setGameState('paused');
      }
      // Activate Ra's blessing with spacebar
      if (e.key === ' ' && gameState === 'playing' && raCooldown === 0) {
        activateRa();
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
  }, [gameState]);

  // Spawn spirit
  const spawnSpirit = () => {
    const spiritType = spiritTypes[Math.floor(Math.random() * spiritTypes.length)];
    const spirit = {
      id: Date.now() + Math.random(),
      ...spiritType,
      x: Math.random() * 700 + 50,
      y: Math.random() * 500 + 50,
      size: 50,
      angle: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 0.5,
      glowPhase: Math.random() * Math.PI * 2
    };
    spiritsRef.current.push(spirit);
  };

  // Activate Ra's blessing
  const activateRa = () => {
    setRaActive(true);
    setRaCooldown(30); // 30 second cooldown
    
    // Attract all spirits towards player
    spiritsRef.current.forEach(spirit => {
      spirit.attracted = true;
    });
    
    // Play Ra sound
    if (audioEnabled) {
      playRaSound();
    }
    
    // Deactivate after 5 seconds
    setTimeout(() => {
      setRaActive(false);
      spiritsRef.current.forEach(spirit => {
        spirit.attracted = false;
      });
    }, 5000);
  };

  // Cooldown timer
  useEffect(() => {
    if (raCooldown > 0) {
      const timer = setTimeout(() => {
        setRaCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [raCooldown]);

  // Create particles
  const createParticles = (x, y, color) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color
      });
    }
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const player = playerRef.current;

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#0a0e27';
      ctx.fillRect(0, 0, 800, 600);

      // Draw background deities
      drawBackgroundDeities(ctx);

      // Draw stars
      starsRef.current.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.opacity = 0.3 + Math.sin(Date.now() * 0.001 + star.x) * 0.3;
      });

      // Draw pyramids in background
      drawPyramids(ctx);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;

        if (particle.life > 0) {
          ctx.fillStyle = particle.color.replace(')', `, ${particle.life})`).replace('rgb', 'rgba');
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
          ctx.fill();
          return true;
        }
        return false;
      });

      // Move player
      let moved = false;
      if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) {
        player.y = Math.max(0, player.y - player.speed);
        player.direction = 'up';
        moved = true;
      }
      if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) {
        player.y = Math.min(600 - player.height, player.y + player.speed);
        player.direction = 'down';
        moved = true;
      }
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) {
        player.x = Math.max(0, player.x - player.speed);
        player.direction = 'left';
        moved = true;
      }
      if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) {
        player.x = Math.min(800 - player.width, player.x + player.speed);
        player.direction = 'right';
        moved = true;
      }

      // Draw player (Egyptian explorer)
      drawPlayer(ctx, player);

      // Update and draw spirits
      spiritsRef.current.forEach((spirit, index) => {
        // If Ra is active, attract spirits to player
        if (spirit.attracted) {
          const dx = player.x + player.width / 2 - (spirit.x + spirit.size / 2);
          const dy = player.y + player.height / 2 - (spirit.y + spirit.size / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            spirit.x += (dx / dist) * 3;
            spirit.y += (dy / dist) * 3;
          }
        } else {
          // Floating animation
          spirit.angle += 0.02;
          spirit.y += Math.sin(spirit.angle) * 0.5;
          spirit.x += Math.cos(spirit.angle * 0.7) * 0.3;
        }

        // Keep spirits in bounds
        if (spirit.x < 0) spirit.x = 0;
        if (spirit.x > 750) spirit.x = 750;
        if (spirit.y < 0) spirit.y = 0;
        if (spirit.y > 550) spirit.y = 550;

        // Draw spirit glow
        spirit.glowPhase += 0.05;
        const glowSize = spirit.size + Math.sin(spirit.glowPhase) * 10;
        const gradient = ctx.createRadialGradient(
          spirit.x + spirit.size / 2,
          spirit.y + spirit.size / 2,
          0,
          spirit.x + spirit.size / 2,
          spirit.y + spirit.size / 2,
          glowSize
        );
        gradient.addColorStop(0, spirit.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(spirit.x + spirit.size / 2, spirit.y + spirit.size / 2, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw spirit icon
        drawSpirit(ctx, spirit);

        // Collision detection
        if (
          player.x < spirit.x + spirit.size &&
          player.x + player.width > spirit.x &&
          player.y < spirit.y + spirit.size &&
          player.y + player.height > spirit.y
        ) {
          // Collect spirit
          createParticles(spirit.x + spirit.size / 2, spirit.y + spirit.size / 2, spirit.color);
          setCollectedSpirits(prev => [...prev, spirit]);
          setScore(prev => prev + spirit.hbar);
          setHbarEarned(prev => prev + spirit.hbar);
          spiritsRef.current.splice(index, 1);
          
          // Play collection sound (if audio enabled)
          if (audioEnabled) {
            playCollectionSound();
          }

          // Spawn new spirit
          setTimeout(spawnSpirit, 2000);
        }
      });

      // Draw fog overlay
      const fogGradient = ctx.createLinearGradient(0, 0, 0, 600);
      fogGradient.addColorStop(0, 'rgba(20, 20, 40, 0.3)');
      fogGradient.addColorStop(1, 'rgba(20, 20, 40, 0.6)');
      ctx.fillStyle = fogGradient;
      ctx.fillRect(0, 0, 800, 600);

      // Draw Ra's blessing effect if active
      if (raActive) {
        drawRaBlessing(ctx, player);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, audioEnabled]);

  // Draw background deities (Amun and Re)
  const drawBackgroundDeities = (ctx) => {
    // Amun on the left (hidden god, mysterious)
    ctx.save();
    ctx.globalAlpha = 0.15;
    
    // Amun's silhouette
    ctx.fillStyle = '#1a4d6d';
    ctx.beginPath();
    // Crown
    ctx.rect(50, 80, 60, 40);
    ctx.fill();
    // Head
    ctx.beginPath();
    ctx.arc(80, 140, 30, 0, Math.PI * 2);
    ctx.fill();
    // Body
    ctx.fillRect(65, 160, 30, 80);
    // Staff
    ctx.strokeStyle = '#1a4d6d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(50, 170);
    ctx.lineTo(50, 280);
    ctx.stroke();
    
    ctx.restore();

    // Re (Ra) on the right (sun god)
    ctx.save();
    ctx.globalAlpha = 0.15;
    
    // Sun disk
    const sunGradient = ctx.createRadialGradient(720, 100, 0, 720, 100, 50);
    sunGradient.addColorStop(0, '#FFD700');
    sunGradient.addColorStop(1, '#FF8C00');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(720, 100, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun rays
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(720 + Math.cos(angle) * 45, 100 + Math.sin(angle) * 45);
      ctx.lineTo(720 + Math.cos(angle) * 65, 100 + Math.sin(angle) * 65);
      ctx.stroke();
    }
    
    // Re's figure (falcon-headed)
    ctx.fillStyle = '#8B4513';
    // Head (falcon)
    ctx.beginPath();
    ctx.arc(720, 160, 25, 0, Math.PI * 2);
    ctx.fill();
    // Beak
    ctx.beginPath();
    ctx.moveTo(735, 160);
    ctx.lineTo(750, 160);
    ctx.lineTo(740, 165);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillRect(705, 180, 30, 70);
    
    ctx.restore();
  };

  // Draw Ra's blessing effect
  const drawRaBlessing = (ctx, player) => {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Golden aura expanding from player
    const time = Date.now() * 0.003;
    for (let i = 0; i < 3; i++) {
      const radius = 50 + i * 30 + Math.sin(time + i) * 20;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 140, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Sun rays from player
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + time;
      ctx.beginPath();
      ctx.moveTo(centerX + Math.cos(angle) * 30, centerY + Math.sin(angle) * 30);
      ctx.lineTo(centerX + Math.cos(angle) * 80, centerY + Math.sin(angle) * 80);
      ctx.stroke();
    }
    
    // Ra's Eye of Horus above player
    const eyeY = player.y - 40;
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    
    // Eye outline
    ctx.beginPath();
    ctx.ellipse(centerX, eyeY, 20, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX, eyeY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye markings
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX + 20, eyeY);
    ctx.lineTo(centerX + 30, eyeY + 5);
    ctx.stroke();
  };

  // Play Ra sound
  const playRaSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Divine, powerful sound
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.5);
    oscillator.type = 'triangle';
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  // Draw pyramids
  const drawPyramids = (ctx) => {
    // Large pyramid
    ctx.fillStyle = '#3a3a2a';
    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.lineTo(50, 350);
    ctx.lineTo(250, 350);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#2a2a1a';
    ctx.beginPath();
    ctx.moveTo(150, 200);
    ctx.lineTo(250, 350);
    ctx.lineTo(150, 350);
    ctx.closePath();
    ctx.fill();

    // Small pyramid
    ctx.fillStyle = '#4a4a3a';
    ctx.beginPath();
    ctx.moveTo(700, 250);
    ctx.lineTo(650, 350);
    ctx.lineTo(750, 350);
    ctx.closePath();
    ctx.fill();
  };

  // Draw player
  const drawPlayer = (ctx, player) => {
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX, player.y + player.height, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Egyptian robe)
    ctx.fillStyle = '#e8d5b5';
    ctx.fillRect(player.x + 10, player.y + 20, 20, 30);

    // Head
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(centerX, player.y + 15, 12, 0, Math.PI * 2);
    ctx.fill();

    // Headdress (Egyptian style)
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(player.x + 8, player.y + 5, 24, 8);
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 16, player.y + 3, 8, 4);

    // Torch (glowing)
    const torchX = player.direction === 'left' ? player.x : player.x + player.width;
    const torchY = player.y + 25;
    
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(torchX, torchY);
    ctx.lineTo(torchX + (player.direction === 'left' ? -8 : 8), torchY - 10);
    ctx.stroke();

    // Flame
    const flameGradient = ctx.createRadialGradient(
      torchX + (player.direction === 'left' ? -8 : 8),
      torchY - 10,
      0,
      torchX + (player.direction === 'left' ? -8 : 8),
      torchY - 10,
      15
    );
    flameGradient.addColorStop(0, '#FFA500');
    flameGradient.addColorStop(0.5, '#FF4500');
    flameGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGradient;
    ctx.beginPath();
    ctx.arc(torchX + (player.direction === 'left' ? -8 : 8), torchY - 15, 12 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw spirit based on type
  const drawSpirit = (ctx, spirit) => {
    const cx = spirit.x + spirit.size / 2;
    const cy = spirit.y + spirit.size / 2;

    if (spirit.name === 'Ammit') {
      // Hybrid creature (simplified)
      ctx.fillStyle = spirit.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 5, 3, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 5, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (spirit.name === 'Apep') {
      // Serpent
      ctx.strokeStyle = spirit.color;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.quadraticCurveTo(cx, cy - 15, cx + 20, cy);
      ctx.stroke();
      
      // Head
      ctx.fillStyle = spirit.color;
      ctx.beginPath();
      ctx.arc(cx + 20, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ba (bird)
      ctx.fillStyle = spirit.color;
      // Body
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      
      // Wings
      ctx.beginPath();
      ctx.ellipse(cx - 15, cy, 10, 5, -Math.PI / 4, 0, Math.PI * 2);
      ctx.ellipse(cx + 15, cy, 10, 5, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spirit name
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(spirit.name, cx, spirit.y - 10);
  };

  // Play collection sound (placeholder - would use ElevenLabs in production)
  const playCollectionSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Connect wallet (placeholder)
  const connectWallet = () => {
    // In production, this would use HashConnect for Hedera wallet
    setWalletConnected(true);
    alert('Wallet Connected! (Demo mode)\n\nIn production, this would connect to your Hedera wallet via HashConnect.');
  };

  // Start game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setHbarEarned(0);
    setCollectedSpirits([]);
    spiritsRef.current = [];
    spawnSpirit();
    spawnSpirit();
    spawnSpirit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-yellow-400">⚱️ Ancestral Spirits</h1>
          <span className="text-sm bg-yellow-600 px-3 py-1 rounded">Egypt Level</span>
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
        <div className="absolute top-20 bg-gray-800 border-2 border-yellow-500 rounded-lg p-6 max-w-md z-10">
          <h3 className="text-xl font-bold mb-3 text-yellow-400">How to Play</h3>
          <ul className="space-y-2 text-sm">
            <li>🎮 <strong>Move:</strong> Arrow keys or WASD</li>
            <li>👻 <strong>Collect:</strong> Walk into spirits to capture them as NFTs</li>
            <li>⚡ <strong>Ra's Blessing:</strong> Press SPACEBAR to attract all spirits (30s cooldown)</li>
            <li>💰 <strong>Earn:</strong> Each spirit gives HBAR rewards</li>
            <li>🏆 <strong>Rarity:</strong> Legendary spirits are worth more!</li>
          </ul>
          <h4 className="text-lg font-bold mt-4 mb-2 text-yellow-400">Egyptian Spirits</h4>
          {spiritTypes.map(spirit => (
            <div key={spirit.name} className="text-xs mb-2">
              <strong>{spirit.name}</strong> ({spirit.rarity}) - {spirit.hbar} HBAR
              <br />
              <span className="text-gray-400">{spirit.description}</span>
            </div>
          ))}
          <button
            onClick={() => setShowInfo(false)}
            className="mt-4 w-full bg-yellow-600 hover:bg-yellow-500 py-2 rounded"
          >
            Close
          </button>
        </div>
      )}

      {/* Game Area */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-4 border-yellow-600 rounded-lg shadow-2xl"
        />

        {/* Menu Overlay */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-4xl font-bold mb-4 text-yellow-400">Curse of the Pharaohs</h2>
            <p className="text-gray-300 mb-8 text-center max-w-md">
              Explore the haunted pyramids of ancient Egypt and collect mystical spirits as NFTs. 
              Earn HBAR rewards for each spirit you capture!
            </p>
            <button
              onClick={startGame}
              className="bg-yellow-600 hover:bg-yellow-500 px-8 py-4 rounded-lg text-xl font-bold transition transform hover:scale-105"
            >
              ▶ Start Quest
            </button>
          </div>
        )}

        {/* Pause Overlay */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-3xl font-bold mb-6">Paused</h2>
            <button
              onClick={() => setGameState('playing')}
              className="bg-yellow-600 hover:bg-yellow-500 px-6 py-3 rounded-lg font-bold mb-3"
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
      </div>

      {/* Stats Bar */}
      <div className="w-full max-w-4xl mt-4 grid grid-cols-4 gap-4">
        <div className="bg-gray-800 border-2 border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-yellow-400" size={20} />
            <span className="font-bold">Score</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{score}</div>
        </div>
        <div className="bg-gray-800 border-2 border-purple-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">💎</span>
            <span className="font-bold">HBAR Earned</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">{hbarEarned}</div>
        </div>
        <div className="bg-gray-800 border-2 border-green-600 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👻</span>
            <span className="font-bold">Spirits Collected</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{collectedSpirits.length}</div>
        </div>
        <div className={`bg-gray-800 border-2 rounded-lg p-4 ${raActive ? 'border-yellow-400 animate-pulse' : raCooldown > 0 ? 'border-gray-600' : 'border-yellow-600'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">☀️</span>
            <span className="font-bold text-sm">Ra's Blessing</span>
          </div>
          <div className={`text-xl font-bold ${raActive ? 'text-yellow-400' : raCooldown > 0 ? 'text-gray-500' : 'text-yellow-400'}`}>
            {raActive ? 'ACTIVE!' : raCooldown > 0 ? `${raCooldown}s` : 'READY'}
          </div>
          {!raActive && raCooldown === 0 && (
            <div className="text-xs text-gray-400 mt-1">Press SPACE</div>
          )}
        </div>
      </div>

      {/* Collected Spirits Gallery */}
      {collectedSpirits.length > 0 && (
        <div className="w-full max-w-4xl mt-4 bg-gray-800 border-2 border-yellow-600 rounded-lg p-4">
          <h3 className="text-xl font-bold mb-3 text-yellow-400">Your Spirit Collection</h3>
          <div className="grid grid-cols-6 gap-2">
            {collectedSpirits.slice(-12).map((spirit, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded p-2 text-center border-2 hover:scale-105 transition"
                style={{ borderColor: spirit.color }}
              >
                <div className="text-2xl mb-1">
                  {spirit.name === 'Ammit' ? '🐊' : spirit.name === 'Apep' ? '🐍' : '🦅'}
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
        <p>Built for Hackeroos Spooky Reddit Jam × Hedera Africa</p>
        <p className="mt-1">Next Level: Ancient Ethiopia (3D) 🇪🇹</p>
      </div>
    </div>
  );
};

export default AncestralSpiritsEgypt;