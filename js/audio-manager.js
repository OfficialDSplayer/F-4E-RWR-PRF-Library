// Audio management class
window.AudioManager = class AudioManager {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.soundBuffers = new Map();
    this.playingSources = [];
    this.currentPlayAllSession = 0;
    this.cancelledLoads = new Set();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      
      // Set initial volume
      const savedVolume = window.StorageService.getItem(
        window.APP_CONFIG.STORAGE_KEYS.VOLUME, 
        window.APP_CONFIG.AUDIO.DEFAULT_VOLUME
      );
      this.setVolume(parseInt(savedVolume));
      
      this.isInitialized = true;
      console.log('✅ AudioManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize AudioManager:', error);
      throw error;
    }
  }

  setVolume(volume) {
    if (!this.gainNode) return;
    const normalizedVolume = Math.max(0, Math.min(100, volume)) / 100;
    this.gainNode.gain.setValueAtTime(normalizedVolume, this.audioContext.currentTime);
    window.StorageService.setItem(window.APP_CONFIG.STORAGE_KEYS.VOLUME, volume.toString());
  }

  async loadSound(file) {
    if (this.soundBuffers.has(file)) {
      return this.soundBuffers.get(file);
    }

    try {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.soundBuffers.set(file, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`❌ Failed to load sound ${file}:`, error);
      throw error;
    }
  }

  async playSound(file) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Stop any existing instance
    this.stopSound(file);

    const button = document.querySelector(`.play-button[data-file="${file}"]`);
    if (button) {
      button.classList.add(window.APP_CONFIG.CSS_CLASSES.LOADING);
    }

    this.cancelledLoads.delete(file);

    try {
      // Load sound if not already loaded
      const buffer = await this.loadSound(file);
      
      // Check if load was cancelled
      if (this.cancelledLoads.has(file)) {
        console.log(`🚫 Sound load cancelled: ${file}`);
        return;
      }

      // Create and start source
      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = buffer;
      sourceNode.loop = true;
      sourceNode.connect(this.gainNode);
      sourceNode.start(0);

      // Track playing source
      this.playingSources.push({ file, node: sourceNode });

      // Update button state
      if (button) {
        button.classList.remove(window.APP_CONFIG.CSS_CLASSES.LOADING);
        button.classList.add(window.APP_CONFIG.CSS_CLASSES.ACTIVE);
      }

      console.log(`▶️ Playing: ${file}`);
    } catch (error) {
      console.error(`❌ Failed to play ${file}:`, error);
      if (button) {
        button.classList.remove(window.APP_CONFIG.CSS_CLASSES.LOADING, window.APP_CONFIG.CSS_CLASSES.ACTIVE);
      }
      throw error;
    }
  }

  stopSound(file) {
    this.playingSources = this.playingSources.filter(source => {
      if (source.file === file) {
        try {
          source.node.stop();
          source.node.disconnect();
        } catch (e) {
          console.warn('Error stopping source:', e);
        }
        return false;
      }
      return true;
    });

    // Update button state
    const button = document.querySelector(`.play-button[data-file="${file}"]`);
    if (button) {
      button.classList.remove(
        window.APP_CONFIG.CSS_CLASSES.ACTIVE,
        window.APP_CONFIG.CSS_CLASSES.LOADING
      );
    }

    console.log(`⏹️ Stopped: ${file}`);
  }

  stopAllSounds() {
    this.currentPlayAllSession++;

    // Stop all playing sources
    this.playingSources.forEach(source => {
      try {
        source.node.stop();
        source.node.disconnect();
      } catch (e) {
        console.warn('Error stopping source:', e);
      }
    });

    this.playingSources = [];

    // Reset all button states
    document.querySelectorAll('.play-button, .global-button').forEach(btn => {
      btn.classList.remove(
        window.APP_CONFIG.CSS_CLASSES.ACTIVE,
        window.APP_CONFIG.CSS_CLASSES.LOADING
      );
    });

    // Mark all loading sounds as cancelled
    window.APP_STATE.soundMeta.forEach(sound => {
      this.cancelledLoads.add(sound.file);
    });

    console.log('⏹️ All sounds stopped');
  }

  async playAllSounds() {
    this.stopAllSounds();
    this.cancelledLoads.clear();

    this.currentPlayAllSession++;
    const sessionId = this.currentPlayAllSession;

    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
      playAllBtn.classList.add(window.APP_CONFIG.CSS_CLASSES.LOADING);
      playAllBtn.disabled = true;
    }

    try {
      // Preload all sounds
      const soundFiles = window.APP_STATE.soundMeta.map(sound => sound.file);
      await Promise.all(soundFiles.map(file => this.loadSound(file)));

      // Check if session is still valid
      if (sessionId !== this.currentPlayAllSession) {
        console.warn('⚠️ Play All session cancelled');
        return;
      }

      // Play all sounds
      window.APP_STATE.soundMeta.forEach(sound => {
        try {
          const buffer = this.soundBuffers.get(sound.file);
          if (!buffer) return;

          const sourceNode = this.audioContext.createBufferSource();
          sourceNode.buffer = buffer;
          sourceNode.loop = true;
          sourceNode.connect(this.gainNode);
          sourceNode.start(0);

          this.playingSources.push({ file: sound.file, node: sourceNode });

          // Update button state
          const btn = document.querySelector(`.play-button[data-file="${sound.file}"]`);
          if (btn) {
            btn.classList.remove(window.APP_CONFIG.CSS_CLASSES.LOADING);
            btn.classList.add(window.APP_CONFIG.CSS_CLASSES.ACTIVE);
          }
        } catch (error) {
          console.error(`❌ Failed to play ${sound.file}:`, error);
        }
      });

      // Update Play All button
      if (sessionId === this.currentPlayAllSession && playAllBtn) {
        playAllBtn.classList.remove(window.APP_CONFIG.CSS_CLASSES.LOADING);
        playAllBtn.classList.add(window.APP_CONFIG.CSS_CLASSES.ACTIVE);
        playAllBtn.disabled = false;
      }

      console.log('▶️ Playing all sounds');
    } catch (error) {
      console.error('❌ Failed to play all sounds:', error);
      if (playAllBtn) {
        playAllBtn.classList.remove(window.APP_CONFIG.CSS_CLASSES.LOADING);
        playAllBtn.disabled = false;
      }
    }
  }

  // Preload sounds for better performance
  async preloadSounds(files, onProgress = null) {
    const total = files.length;
    let loaded = 0;

    const loadPromises = files.map(async (file) => {
      try {
        await this.loadSound(file);
        loaded++;
        if (onProgress) {
          onProgress(loaded, total, file);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to preload ${file}:`, error);
        loaded++;
        if (onProgress) {
          onProgress(loaded, total, file);
        }
      }
    });

    await Promise.allSettled(loadPromises);
    console.log(`✅ Preloaded ${this.soundBuffers.size}/${total} sounds`);
  }

  // Get memory usage info
  getMemoryInfo() {
    const bufferCount = this.soundBuffers.size;
    const playingCount = this.playingSources.length;
    
    // Estimate memory usage (rough calculation)
    let estimatedMemory = 0;
    this.soundBuffers.forEach(buffer => {
      estimatedMemory += buffer.length * buffer.numberOfChannels * 4; // 4 bytes per float32
    });

    return {
      loadedSounds: bufferCount,
      playingSounds: playingCount,
      estimatedMemoryMB: (estimatedMemory / (1024 * 1024)).toFixed(2),
      storageType: window.StorageService.getStorageType()
    };
  }

  // Cleanup resources
  cleanup() {
    this.stopAllSounds();
    this.soundBuffers.clear();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    
    this.isInitialized = false;
    console.log('🧹 AudioManager cleaned up');
  }
};