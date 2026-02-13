// Audio playback management
class AudioManager {
  constructor() {
    this.playingSources = [];
    this.audioContext = null;
    this.gainNode = null;
    this.soundBuffers = {};
    this.currentPlayAllSession = 0;
  }

  async initialize() {
    this.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  async startLoop(file) {
    this.stopLoop(file); // Ensure a file only has one active loop at a time.

    const button = document.querySelector(`.play-button[data-file="${file}"]`);
    button?.classList.add("loading");

    try {
      const buffer = await this.loadSoundBuffer(file);
      this.playSoundBuffer(file, buffer);

      button?.classList.remove("loading");
      button?.classList.add("active");
    } catch (error) {
      console.error(`❌ Error loading or playing ${file}:`, error);
      button?.classList.remove("loading", "active");
      throw error;
    }
  }

  async loadSoundBuffer(file) {
    if (this.soundBuffers[file]) {
      return this.soundBuffers[file];
    }

    const response = await fetch(file);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    this.soundBuffers[file] = audioBuffer;

    return audioBuffer;
  }

  playSoundBuffer(file, buffer) {
    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;
    sourceNode.connect(this.gainNode);
    sourceNode.start(0);

    this.playingSources.push({ file, node: sourceNode });
    return sourceNode;
  }

  stopLoop(file) {
    this.playingSources = this.playingSources.filter((src) => {
      if (src.file !== file) {
        return true;
      }

      this.stopSourceNode(src.node);
      return false;
    });

    document.querySelectorAll(".play-button").forEach((button) => {
      if (button.dataset.file === file) {
        button.classList.remove("active", "loading");
      }
    });
  }

  stopSourceNode(sourceNode) {
    try {
      sourceNode.stop();
      sourceNode.disconnect();
    } catch (error) {
      console.error(error);
    }
  }

  stopAll() {
    this.currentPlayAllSession += 1;

    this.playingSources.forEach(({ node }) => {
      this.stopSourceNode(node);
    });
    this.playingSources = [];

    // Reset visual buttons so UI always matches playback state.
    document
      .querySelectorAll(".play-button, .global-button")
      .forEach((button) => {
        button.classList.remove("active", "loading");
      });
  }

  async playAll(soundMeta) {
    this.stopAll();

    this.currentPlayAllSession += 1;
    const sessionId = this.currentPlayAllSession;

    const playAllButton = document.getElementById("play-all-btn");
    if (playAllButton) {
      playAllButton.classList.add("loading");
      playAllButton.disabled = true;
    }

    // Preload all buffers first to make multi-play start more consistent.
    try {
      await Promise.all(
        soundMeta.map(({ file }) => this.loadSoundBuffer(file)),
      );
    } catch (error) {
      console.error("❌ Error during preload:", error);
    }

    if (sessionId !== this.currentPlayAllSession) {
      console.warn("⚠️ Play All session was cancelled before playback.");
      if (playAllButton) {
        playAllButton.classList.remove("loading");
        playAllButton.disabled = false;
      }
      return;
    }

    soundMeta.forEach(({ file }) => {
      try {
        const buffer = this.soundBuffers[file];
        if (!buffer) {
          return;
        }

        this.playSoundBuffer(file, buffer);

        const button = document.querySelector(
          `.play-button[data-file="${file}"]`,
        );
        button?.classList.remove("loading");
        button?.classList.add("active");
      } catch (error) {
        console.error(`❌ Failed to play ${file}:`, error);
      }
    });

    if (sessionId === this.currentPlayAllSession && playAllButton) {
      playAllButton.classList.remove("loading");
      playAllButton.classList.add("active");
      playAllButton.disabled = false;
    }
  }
}
