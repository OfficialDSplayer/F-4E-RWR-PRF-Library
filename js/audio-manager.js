// Audio playback management
class AudioManager {
  constructor() {
    this.playingSources = [];
    this.audioContext = null;
    this.gainNode = null;
    this.soundBuffers = {};
    this.currentPlayAllSession = 0;
    this.cancelledLoads = new Set();
  }

  async initialize() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  async startLoop(file, sessionId = null) {
    this.stopLoop(file); // Stop any existing instance of this sound

    const btn = document.querySelector(`.play-button[data-file="${file}"]`);
    if (btn) btn.classList.add("loading");

    this.cancelledLoads.delete(file);

    try {
      // Lazy-load if needed
      if (!this.soundBuffers[file]) {
        const fetchResponse = await fetch(file);
        const arrayBuffer = await fetchResponse.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.soundBuffers[file] = audioBuffer;
      }

      const sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = this.soundBuffers[file];
      sourceNode.loop = true;
      sourceNode.connect(this.gainNode);
      sourceNode.start(0);
      this.playingSources.push({ file, node: sourceNode });

      // Apply play state
      if (btn) {
        btn.classList.remove("loading");
        btn.classList.add("active");
      }

      return Promise.resolve();
    } catch (error) {
      console.error(`❌ Error loading or playing ${file}:`, error);
      if (btn) btn.classList.remove("loading", "active");
      return Promise.reject(error);
    }
  }

  stopLoop(file) {
    this.playingSources = this.playingSources.filter((src) => {
      if (src.file === file) {
        try {
          src.node.stop();
          src.node.disconnect();
        } catch (e) {
          console.error(e);
        }
        return false;
      }
      return true;
    });
    
    document.querySelectorAll(".play-button").forEach((btn) => {
      if (btn.dataset.file === file) {
        btn.classList.remove("active");
        btn.classList.remove("loading");
      }
    });
  }

  stopAll() {
    this.currentPlayAllSession++;

    this.playingSources.forEach((src) => {
      try {
        src.node.stop();
        src.node.disconnect();
      } catch (e) {
        console.error(e);
      }
    });

    this.playingSources = [];

    // Reset visual buttons
    document.querySelectorAll(".play-button, .global-button").forEach((btn) => {
      btn.classList.remove("active", "loading");
    });

    // Mark all currently loading sounds as "cancelled"
    Object.keys(this.soundBuffers).forEach((file) => {
      this.cancelledLoads.add(file);
    });
  }

  async playAll(soundMeta) {
    this.stopAll(); // Clear running sounds
    this.cancelledLoads.clear(); // Reset the cancellation list

    this.currentPlayAllSession++;
    const thisSession = this.currentPlayAllSession;

    const playAllBtn = document.getElementById('play-all-btn');
    if (playAllBtn) {
      playAllBtn.classList.add("loading");
      playAllBtn.disabled = true;
    }

    // Step 1: Preload all sounds (but don't play yet)
    try {
      await Promise.all(
        soundMeta.map(async (sound) => {
          if (!this.soundBuffers[sound.file]) {
            const fetchResponse = await fetch(sound.file);
            const arrayBuffer = await fetchResponse.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.soundBuffers[sound.file] = audioBuffer;
          }
        })
      );
    } catch (error) {
      console.error("❌ Error during preload:", error);
    }

    // Step 2: Check session validity and play all
    if (thisSession !== this.currentPlayAllSession) {
      console.warn("⚠️ Play All session was cancelled before playback.");
      if (playAllBtn) {
        playAllBtn.classList.remove("loading");
        playAllBtn.disabled = false;
      }
      return;
    }

    soundMeta.forEach((sound) => {
      try {
        const buffer = this.soundBuffers[sound.file];
        if (!buffer) return;

        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = buffer;
        sourceNode.loop = true;
        sourceNode.connect(this.gainNode);
        sourceNode.start(0);
        this.playingSources.push({ file: sound.file, node: sourceNode });

        const btn = document.querySelector(`.play-button[data-file="${sound.file}"]`);
        if (btn) {
          btn.classList.remove("loading");
          btn.classList.add("active");
        }
      } catch (e) {
        console.error(`❌ Failed to play ${sound.file}:`, e);
      }
    });

    // Activate the Play All button
    if (thisSession === this.currentPlayAllSession && playAllBtn) {
      playAllBtn.classList.remove("loading");
      playAllBtn.classList.add("active");
      playAllBtn.disabled = false;
    }
  }
}