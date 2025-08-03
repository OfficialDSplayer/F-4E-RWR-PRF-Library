// Main application initialization
class App {
  constructor() {
    this.dataLoader = new DataLoader();
    this.audioManager = new AudioManager();
    this.soundDisplay = null;
    this.symbolFilter = null;
  }

  async initialize() {
    try {
      // Initialize theme
      UIComponents.initializeTheme();

      // Initialize audio context
      await this.audioManager.initialize();

      // Initialize UI components
      this.soundDisplay = new SoundDisplay(this.dataLoader, this.audioManager);
      this.symbolFilter = new SymbolFilter(this.soundDisplay);

      // Set up event listeners
      this.setupEventListeners();

      // Initialize volume control
      UIComponents.initializeVolumeControl(this.audioManager);

      // Load all data
      const soundMeta = await this.dataLoader.loadAllData();

      // Clear loading message
      document.getElementById("audio-list").innerHTML = "";

      // Populate symbol filter and display sounds
      this.symbolFilter.populateSymbolFilter(soundMeta);

      console.log("✅ Application initialized successfully");

    } catch (error) {
      console.error("❌ Error initializing application:", error);
      document.getElementById("audio-list").textContent = "❌ Failed to load application.";
    }
  }

  setupEventListeners() {
    // Global buttons
    document.getElementById("play-all-btn").addEventListener("click", () => {
      const soundMeta = this.dataLoader.getSoundMeta();
      this.audioManager.playAll(soundMeta);
    });

    document.getElementById("stop-all-btn").addEventListener("click", () => {
      this.audioManager.stopAll();
    });

    document.getElementById("toggle-dark-mode-btn").addEventListener("click", () => {
      UIComponents.toggleTheme();
    });

    document.getElementById("expand-all-btn").addEventListener("click", () => {
      UIComponents.expandAllGroups();
    });

    document.getElementById("collapse-all-btn").addEventListener("click", () => {
      UIComponents.collapseAllGroups();
    });

    document.getElementById("show-all-radar-btn").addEventListener("click", () => {
      UIComponents.showAllRadarInfo();
    });

    document.getElementById("hide-all-radar-btn").addEventListener("click", () => {
      UIComponents.hideAllRadarInfo();
    });

    // Search input
    document.getElementById("search-input").addEventListener("input", () => {
      this.symbolFilter.updateDisplay();
    });
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.initialize();
});