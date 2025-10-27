// src/components/shared/AudioPlayer.jsx
import { useEffect, useRef, useState } from 'react';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Voice IDs for different sound types
const VOICES = {
  narrator: 'pNInz6obpgDQGcFmaJgB', // Deep male - for ambience descriptions
  spirit: '21m00Tcm4TlvDq8ikWAM',   // Female ethereal - for spirits
  warrior: 'TX3LPaxmHKxFdv7VOQHJ',  // Strong male - for actions
  ambient: 'EXAVITQu4vr4xnSDxMaL'   // Soft female - for background
};

// AUDIO PROMPTS - These generate actual SOUNDS, not voice
export const AUDIO_PROMPTS = {
  // ===== EGYPT LEVEL =====
  // Background ambience (looping)
  egypt_ambient_start: "Low rumbling stone temple ambience with faint Egyptian whispers echoing in dark corridors, creaking ancient doors, sand blowing through cracks",
  egypt_ambient_intense: "Intense haunted pyramid atmosphere with louder ghostly wails, footsteps approaching, heavy breathing echoes, ominous bass rumble",
  
  // Sound effects
  egypt_collect_spirit: "Mystical magical chime sound like catching ancient Egyptian soul, ethereal whoosh with golden sparkles",
  egypt_ra_power: "Powerful divine sun god energy blast, deep resonating golden beam with heavenly choir background",
  egypt_footstep: "Heavy footstep on ancient stone floor with dust falling echo",
  egypt_spirit_appear: "Ghostly Egyptian spirit materializing with eerie whisper and wind gust",
  
  // ===== ETHIOPIA LEVEL - WITH BOSS BATTLE =====
  // Background ambience (looping)
  ethiopia_ambient_start: "Ethiopian rock-hewn church atmosphere with distant orthodox chanting echoing through stone chambers, dripping water, wind howling through ancient halls, peaceful monastery bells",
  ethiopia_ambient_intense: "INTENSE Ethiopian boss battle music with fast orthodox war chants getting louder, demonic growling mixed with holy singing, thunder crashing, chains breaking, spiritual warfare energy",
  
  // Sound effects
  ethiopia_collect_spirit: "Sacred Ethiopian bell chime with holy reverb, angelic hum, blessed energy",
  ethiopia_prayer_power: "Powerful Ethiopian Orthodox prayer chant activation, deep male choir voices in ancient Ge'ez language, divine light energy building, holy power surge",
  ethiopia_footstep: "Footstep echoing in massive stone church chamber with reverb",
  ethiopia_spirit_appear: "Ethiopian spirit manifesting with church bell toll and ghostly moan",
  ethiopia_candle_flicker: "Candles flickering in darkness with soft wax crackling",
  
  // BOSS BATTLE SOUNDS
  ethiopia_boss_appear: "TERRIFYING Ethiopian devil manifesting with demonic roar, evil laughter echoing in church, chains rattling violently, thunder crash, unholy energy explosion",
  ethiopia_holy_fire: "Holy fire projectile launching with powerful Orthodox chant burst, golden divine energy whoosh, blessed flames crackling, righteous power",
  ethiopia_boss_hit: "Devil taking damage with demonic scream of pain, unholy flesh burning, evil energy dissipating with holy light sizzle",
  ethiopia_boss_death: "EPIC devil destruction with massive demonic death roar fading into silence, chains breaking apart, evil collapsing, triumphant Orthodox choir singing victory, holy bells ringing in celebration, light conquering darkness",
  
  // ===== SENEGAL/DOGON LEVEL =====
  // Background ambience (looping)
  senegal_ambient_start: "Spooky Dogon village night atmosphere with crickets, distant tribal drums, rustling grass, hyena howls far away",
  senegal_ambient_intense: "Intense alien invasion atmosphere with UFO humming, electronic interference, panicked drums, screaming in distance",
  
  // Sound effects
  senegal_laser_fire: "Futuristic energy weapon laser firing with electric zap and cosmic reverb",
  senegal_alien_appear: "Creepy alien UFO materializing with electronic warbling and ominous hum",
  senegal_alien_shoot: "Alien weapon firing cursed energy bolt with demonic screech",
  senegal_player_hit: "Player taking alien damage with painful grunt and ghostly echo",
  senegal_alien_death: "Alien exploding with electronic screech and energy dissipating",
  senegal_star_collect: "Discovering constellation with magical twinkle and wonder chime",
  senegal_cosmic_vision: "Cosmic vision activating with deep space whoosh and mystical energy",
  
  // ===== NIGERIA LEVEL =====
  // Background ambience (looping)
  nigeria_ambient_start: "Ancient Nigerian temple atmosphere with distant ceremonial drumming, jungle sounds, ancestral whispers, torch flames crackling",
  nigeria_ambient_intense: "Haunted Nigerian palace with intense tribal drums, spirit possession screams, bronze artifacts clanging, evil chanting",
  
  // Sound effects
  nigeria_collect_spirit: "Traditional Nigerian xylophone-like instrument sound with mystical echo and ancestral voice hum",
  nigeria_drum_power: "Powerful ancestral drum call with deep bass boom and spirit energy wave",
  nigeria_spirit_appear: "Nigerian ancestral spirit appearing with tribal chant and smoke whoosh",
  nigeria_artifact_collect: "Collecting Nigerian artifact with bronze clang and ancient power hum",
  nigeria_footstep: "Footstep on ancient palace floor with bronze plaque rattle",
  
  // ===== KENYA LEVEL =====
  // Background ambience (looping)
  kenya_ambient_start: "Kenyan savanna night with crickets, distant lion roars, hyena cackles, wind through grass, campfire crackling",
  kenya_ambient_intense: "Intense survival atmosphere with close predator growls, running footsteps, panicked breathing, war drums approaching",
  
  // Sound effects
  kenya_spear_throw: "Maasai spear whooshing through air with wind cutting sound and thud impact",
  kenya_spear_hit: "Spear striking beast with flesh impact, animal roar, and bone crack",
  kenya_war_cry: "Powerful Maasai warrior battle cry, fierce masculine shout with echo",
  kenya_warrior_power: "Warrior rage mode activating with intense war chant and energy pulse",
  kenya_beast_attack: "Wild beast attacking with aggressive growl, claws slashing, teeth snapping",
  kenya_player_hit: "Player taking damage with painful grunt and body impact",
  kenya_beast_death: "Beast dying with final roar, body falling, and dust impact",
  kenya_artifact_collect: "Collecting Kenyan artifact with traditional instrument ping and tribal blessing"
};

class AudioManager {
  constructor() {
    this.audioCache = new Map();
    this.currentAmbient = null;
    this.enabled = true;
    this.ambientVolume = 0.3;
    this.sfxVolume = 0.6;
  }

  // Generate sound using ElevenLabs Sound Effects API
  async generateSound(prompt, isAmbient = false) {
    const cacheKey = `${prompt}_${isAmbient}`;
    
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey);
    }

    try {
      // Use ElevenLabs Sound Effects API (not text-to-speech!)
      const response = await fetch(
        'https://api.elevenlabs.io/v1/sound-generation',
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: prompt,
            duration_seconds: isAmbient ? 30 : 3, // Longer for ambience
            prompt_influence: 0.8
          })
        }
      );

      if (!response.ok) {
        console.error('ElevenLabs error:', response.status);
        return this.generateFallbackSound(isAmbient);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Cache the audio
      this.audioCache.set(cacheKey, audio);
      
      return audio;
    } catch (error) {
      console.error('Error generating audio:', error);
      return this.generateFallbackSound(isAmbient);
    }
  }

  // Fallback to Web Audio API if ElevenLabs fails
  generateFallbackSound(isAmbient = false) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (isAmbient) {
      // Low rumble for ambience
      oscillator.frequency.value = 60;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    } else {
      // Beep for SFX
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    }
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + (isAmbient ? 30 : 0.3));
    
    return null;
  }

  // Play sound effect (one-shot)
  async playSound(promptKey, volume = null) {
    if (!this.enabled) return;

    const prompt = AUDIO_PROMPTS[promptKey];
    if (!prompt) {
      console.warn(`No audio prompt for: ${promptKey}`);
      return;
    }

    try {
      const audio = await this.generateSound(prompt, false);
      if (audio) {
        audio.volume = volume !== null ? volume : this.sfxVolume;
        audio.play();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  // Play ambient background (looping)
  async playAmbient(promptKey, loop = true) {
    if (!this.enabled) return;

    // Stop current ambient
    if (this.currentAmbient) {
      this.currentAmbient.pause();
      this.currentAmbient.currentTime = 0;
    }

    const prompt = AUDIO_PROMPTS[promptKey];
    if (!prompt) {
      console.warn(`No ambient prompt for: ${promptKey}`);
      return;
    }

    try {
      const audio = await this.generateSound(prompt, true);
      if (audio) {
        audio.volume = this.ambientVolume;
        audio.loop = loop;
        audio.play();
        this.currentAmbient = audio;
      }
    } catch (error) {
      console.error('Error playing ambient:', error);
    }
  }

  // Transition ambient from calm to intense
  async transitionAmbient(fromKey, toKey, duration = 2000) {
    if (!this.enabled) return;

    // Fade out current
    if (this.currentAmbient) {
      const fadeSteps = 20;
      const fadeInterval = duration / fadeSteps;
      let step = 0;

      const fadeOut = setInterval(() => {
        step++;
        this.currentAmbient.volume = this.ambientVolume * (1 - step / fadeSteps);
        
        if (step >= fadeSteps) {
          clearInterval(fadeOut);
          this.currentAmbient.pause();
          this.playAmbient(toKey);
        }
      }, fadeInterval);
    } else {
      // No current ambient, just start new
      this.playAmbient(toKey);
    }
  }

  stopAmbient() {
    if (this.currentAmbient) {
      this.currentAmbient.pause();
      this.currentAmbient.currentTime = 0;
      this.currentAmbient = null;
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    }
  }

  setVolume(ambient, sfx) {
    this.ambientVolume = ambient;
    this.sfxVolume = sfx;
    
    if (this.currentAmbient) {
      this.currentAmbient.volume = ambient;
    }
  }

  // Preload sounds for a level (call on level start)
  async preloadLevel(level) {
    const levelSounds = Object.keys(AUDIO_PROMPTS).filter(key => 
      key.startsWith(level.toLowerCase())
    );

    console.log(`🎵 Preloading ${levelSounds.length} sounds for ${level}...`);

    // Load in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < levelSounds.length; i += batchSize) {
      const batch = levelSounds.slice(i, i + batchSize);
      await Promise.all(
        batch.map(soundKey => 
          this.generateSound(AUDIO_PROMPTS[soundKey], soundKey.includes('ambient'))
        )
      );
    }

    console.log(`✅ ${level} sounds ready!`);
  }
}

// Singleton instance
export const audioManager = new AudioManager();

// React hook for easy usage in components
export const useAudio = () => {
  const audioRef = useRef(audioManager);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current.stopAmbient();
    };
  }, []);

  return {
    // Play one-shot sound effect
    playSound: (sound, volume) => audioRef.current.playSound(sound, volume),
    
    // Play looping ambient background
    playAmbient: (sound, loop) => audioRef.current.playAmbient(sound, loop),
    
    // Smoothly transition ambient (calm -> intense)
    transitionAmbient: (from, to, duration) => 
      audioRef.current.transitionAmbient(from, to, duration),
    
    // Stop ambient
    stopAmbient: () => audioRef.current.stopAmbient(),
    
    // Enable/disable all audio
    setEnabled: (enabled) => audioRef.current.setEnabled(enabled),
    
    // Set volume levels
    setVolume: (ambient, sfx) => audioRef.current.setVolume(ambient, sfx),
    
    // Preload level sounds (call on level mount)
    preloadLevel: async (level) => {
      setIsLoading(true);
      await audioRef.current.preloadLevel(level);
      setIsLoading(false);
    },
    
    isLoading
  };
};

export default AudioManager;