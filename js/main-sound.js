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
      // Initialize audio context early so controls can work immediately.
      await this.audioManager.initialize();

      // Create feature modules.
      this.soundDisplay = new SoundDisplay(this.dataLoader, this.audioManager);
      this.symbolFilter = new SymbolFilter(this.soundDisplay);
      this.radarInfoFilter = new RadarInfoFilter(
        this.dataLoader,
        this.soundDisplay,
      );

      this.setupEventListeners();
      UIComponents.initializeVolumeControl(this.audioManager);

      const soundMeta = await this.dataLoader.loadAllData();

      const audioList = document.getElementById("audio-list");
      if (audioList) {
        audioList.innerHTML = "";
      }

      // Populate filters once metadata is available.
      this.symbolFilter.populateSymbolFilter(soundMeta);
      this.radarInfoFilter.populateRadarInfoFilter(soundMeta);

      console.log("✅ Application initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing application:", error);
      const audioList = document.getElementById("audio-list");
      if (audioList) {
        audioList.textContent = "❌ Failed to load application.";
      }
    }
  }

  setupEventListeners() {
    const actions = [
      [
        "play-all-btn",
        () => this.audioManager.playAll(this.dataLoader.getSoundMeta()),
      ],
      ["stop-all-btn", () => this.audioManager.stopAll()],
      ["expand-all-btn", () => UIComponents.expandAllGroups()],
      ["collapse-all-btn", () => UIComponents.collapseAllGroups()],
      ["show-all-radar-btn", () => UIComponents.showAllRadarInfo()],
      ["hide-all-radar-btn", () => UIComponents.hideAllRadarInfo()],
    ];

    actions.forEach(([id, handler]) => this.bindAction(id, handler));

    const searchInput = document.getElementById("search-input");
    searchInput?.addEventListener("input", () => {
      this.updateDisplay();
    });

    document.addEventListener("radarFilterChanged", () => {
      this.updateDisplay();
    });
  }

  bindAction(id, handler) {
    const element = document.getElementById(id);
    if (!element) {
      // Some pages reuse script bundles but do not include every control.
      return;
    }
    element.addEventListener("click", handler);
  }

  updateDisplay() {
    const searchTerm =
      document.getElementById("search-input")?.value?.trim() || "";
    const searchTermLower = searchTerm.toLowerCase();
    const soundMeta = this.dataLoader.getSoundMeta();

    // Filter sounds based on symbol filter, radar info filter, and text search.
    const filteredSounds = soundMeta.filter((sound) => {
      const haystack = `${sound.name} ${sound.description}`.toLowerCase();
      if (!haystack.includes(searchTermLower)) {
        return false;
      }

      if (!this.matchesSymbolFilter(sound)) {
        return false;
      }

      return this.radarInfoFilter.matchesRadarInfoFilters(sound);
    });

    const selectedSymbols = this.symbolFilter.getSelectedSymbols();
    this.soundDisplay.displayGroups(
      filteredSounds,
      searchTerm,
      selectedSymbols,
    );
  }

  matchesSymbolFilter(sound) {
    const alr46Info = this.dataLoader.getAlr46Info();
    const radarInfo = alr46Info[sound.file];
    if (!radarInfo) {
      return true; // Allow sounds without radar info.
    }

    const selectedSymbols = this.symbolFilter.getSelectedSymbols();
    const normalized = Utils.normalizeRadarName(
      sound.file
        .replace(/^imported_wavs\//i, "")
        .replace(/_(SEARCH|TRACK)\.wav$/i, ""),
    );

    const radarEntry = window.radarSymbolMap?.[normalized];
    const radarEntries = Array.isArray(radarEntry)
      ? radarEntry
      : radarEntry
        ? [radarEntry]
        : [];

    let matchesSymbol = radarEntries.some(
      (entry) =>
        selectedSymbols.has(entry.symbol1) ||
        selectedSymbols.has(entry.symbol2),
    );

    // Handle unknown fallback when no symbol mapping exists.
    if (!matchesSymbol && radarEntries.length === 0 && radarInfo.band != null) {
      const fallback = Utils.getUnknownSymbolFromFrequency(
        Number(radarInfo.band),
      );
      matchesSymbol = Boolean(fallback && selectedSymbols.has(fallback));
    }

    return matchesSymbol;
  }
}

// Initialize the application when the DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.initialize();
});
