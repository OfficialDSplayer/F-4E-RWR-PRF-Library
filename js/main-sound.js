// Main application initialization
class App {
  constructor() {
    this.dataLoader = new DataLoader();
    this.audioManager = new AudioManager();
    this.soundDisplay = null;
    this.symbolFilter = null;
    this.radarInfoFilter = null;
  }

  async initialize() {
    try {
      // Initialize theme
      // UIComponents.initializeTheme();
      // UIComponents.initTheme();

      // Initialize audio context
      await this.audioManager.initialize();

      // Initialize UI components
      this.soundDisplay = new SoundDisplay(this.dataLoader, this.audioManager);
      this.symbolFilter = new SymbolFilter(this.soundDisplay);
      this.radarInfoFilter = new RadarInfoFilter(this.dataLoader, this.soundDisplay);

      // Set up event listeners
      this.setupEventListeners();

      // Initialize volume control
      UIComponents.initializeVolumeControl(this.audioManager);

      // Load all data
      const soundMeta = await this.dataLoader.loadAllData();

      // Clear loading message
      document.getElementById("audio-list").innerHTML = "";

      // Populate both filters
      this.symbolFilter.populateSymbolFilter(soundMeta);
      this.radarInfoFilter.populateRadarInfoFilter(soundMeta);

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

    // Old deprecated dark mode button
    // document.getElementById("toggle-dark-mode-btn").addEventListener("click", () => {
    //   UIComponents.toggleTheme();
    // });

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
      this.updateDisplay();
    });

    // Listen for radar filter changes
    document.addEventListener("radarFilterChanged", () => {
      this.updateDisplay();
    });
  }

  updateDisplay() {
    const searchTerm = document.getElementById("search-input")?.value?.trim() || "";
    const soundMeta = this.dataLoader.getSoundMeta();

    // Filter sounds based on symbol filter, radar info filter, and text search
    const filteredSounds = soundMeta.filter((sound) => {
      // Text search filter
      const haystack = `${sound.name} ${sound.description}`.toLowerCase();
      const matchesText = haystack.includes(searchTerm.toLowerCase());
      if (!matchesText) return false;

      // Symbol filter
      const matchesSymbol = this.matchesSymbolFilter(sound);
      if (!matchesSymbol) return false;

      // Radar info filters
      const matchesRadarInfo = this.radarInfoFilter.matchesRadarInfoFilters(sound);
      return matchesRadarInfo;
    });

    // Get selected symbols from symbol filter for display
    const selectedSymbols = this.symbolFilter.getSelectedSymbols();
    this.soundDisplay.displayGroups(filteredSounds, searchTerm, selectedSymbols);
  }

  matchesSymbolFilter(sound) {
    const alr46Info = this.dataLoader.getAlr46Info();
    const radarInfo = alr46Info[sound.file];
    if (!radarInfo) return true; // Allow sounds without radar info

    const selectedSymbols = this.symbolFilter.getSelectedSymbols();
    const normalized = Utils.normalizeRadarName(
      sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
    );
    const radarEntry = window.radarSymbolMap?.[normalized];
    const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

    let matchesSymbol = radarEntries.some(
      (entry) => selectedSymbols.has(entry.symbol1) || selectedSymbols.has(entry.symbol2)
    );

    // Handle unknown fallback
    if (!matchesSymbol && radarEntries.length === 0 && radarInfo.band != null) {
      const freq = Number(radarInfo.band);
      const fallback = Utils.getUnknownSymbolFromFrequency(freq);
      matchesSymbol = fallback && selectedSymbols.has(fallback);
    }

    return matchesSymbol;
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // const currentPage = window.location.pathname.split("/").pop();
  // const navLinks = document.querySelectorAll(".nav-link");
  // navLinks.forEach((link) => {
  //   const linkPage = link.getAttribute("href");
  //   if (linkPage === currentPage) {
  //     link.classList.add("active");
  //   } else {
  //     link.classList.remove("active");
  //   }
  // });

  const app = new App();
  app.initialize();
});
