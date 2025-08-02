// Main application entry point
class F4ERWRApp {
  constructor() {
    this.isInitialized = false;
    this.components = {};
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing F-4E RWR Application...');
      
      // Initialize theme
      this.initializeTheme();
      
      // Initialize core components
      await this.initializeComponents();
      
      // Load and display data
      await this.loadApplicationData();
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Application initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showErrorMessage('Failed to load application. Please refresh the page.');
    }
  }

  initializeTheme() {
    const savedTheme = window.StorageService.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME);
    
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  async initializeComponents() {
    // Initialize core services
    window.APP_STATE.audioManager = new window.AudioManager();
    window.APP_STATE.dataLoader = new window.DataLoader();
    window.APP_STATE.soundDisplay = new window.SoundDisplay(window.APP_STATE.audioManager);
    window.APP_STATE.symbolFilter = new window.SymbolFilter();

    // Initialize UI components
    this.components.volumeControl = new window.UIComponents.VolumeControl(
      window.APP_STATE.audioManager
    );
    this.components.progressIndicator = new window.UIComponents.ProgressIndicator();

    // Initialize sound display
    window.APP_STATE.soundDisplay.initialize();

    // Load collapsed groups from storage
    window.APP_STATE.collapsedGroups = window.StorageService.getJSON(
      window.APP_CONFIG.STORAGE_KEYS.COLLAPSED_GROUPS, 
      []
    );
  }

  async loadApplicationData() {
    try {
      this.components.progressIndicator.show();
      
      // Load all data
      const data = await window.APP_STATE.dataLoader.loadAllData();
      
      // Populate symbol filter
      window.APP_STATE.symbolFilter.populate(data.soundMeta);
      
      // Display initial sounds
      window.APP_STATE.soundDisplay.displaySounds(
        data.soundMeta,
        '',
        window.APP_STATE.symbolFilter.getSelectedSymbols()
      );
      
    } catch (error) {
      console.error('❌ Failed to load application data:', error);
      this.showErrorMessage('Failed to load sound data. Please check your connection and refresh.');
    }
  }

  setupGlobalEventListeners() {
    // Global control buttons
    const buttons = {
      'play-all-btn': () => window.APP_STATE.audioManager.playAllSounds(),
      'stop-all-btn': () => window.APP_STATE.audioManager.stopAllSounds(),
      'toggle-theme-btn': () => this.toggleTheme(),
      'expand-all-btn': () => window.APP_STATE.soundDisplay.expandAllGroups(),
      'collapse-all-btn': () => window.APP_STATE.soundDisplay.collapseAllGroups(),
      'show-radar-info-btn': () => window.APP_STATE.soundDisplay.showAllRadarInfo(),
      'hide-radar-info-btn': () => window.APP_STATE.soundDisplay.hideAllRadarInfo()
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', handler);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Page visibility changes (pause audio when page hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        window.APP_STATE.audioManager.stopAllSounds();
      }
    });

    // Before page unload cleanup
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  handleKeyboardShortcuts(e) {
    // Only handle shortcuts when not typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    switch (e.key.toLowerCase()) {
      case ' ': // Spacebar - stop all
        e.preventDefault();
        window.APP_STATE.audioManager.stopAllSounds();
        break;
      case 'escape': // Escape - stop all and close dropdowns
        e.preventDefault();
        window.APP_STATE.audioManager.stopAllSounds();
        window.APP_STATE.symbolFilter.hideDropdown();
        break;
      case 'f': // F - focus search
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        break;
      case 't': // T - toggle theme
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.toggleTheme();
        }
        break;
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    window.StorageService.setItem(window.APP_CONFIG.STORAGE_KEYS.THEME, newTheme);
    
    console.log(`🎨 Theme changed to: ${newTheme}`);
  }

  showErrorMessage(message) {
    const container = document.getElementById('audio-list');
    if (container) {
      container.innerHTML = `
        <div class="loading-message" style="color: var(--danger-color);">
          ❌ ${message}
        </div>
      `;
    }
  }

  // Get application statistics
  getAppStats() {
    const audioStats = window.APP_STATE.audioManager?.getMemoryInfo() || {};
    const displayStats = window.APP_STATE.soundDisplay?.getStats() || {};
    const filterStats = window.APP_STATE.symbolFilter?.getStats() || {};

    return {
      audio: audioStats,
      display: displayStats,
      filter: filterStats,
      performance: {
        loadedDataSets: window.APP_STATE.dataLoader?.loadedData.size || 0,
        totalGroups: Object.keys(window.APP_STATE.groupsData).length,
        totalRadarInfo: Object.keys(window.APP_STATE.alr46Info).length
      }
    };
  }

  // Export application state for debugging
  exportState() {
    return {
      config: window.APP_CONFIG,
      state: {
        soundMeta: window.APP_STATE.soundMeta.length,
        groupsData: Object.keys(window.APP_STATE.groupsData).length,
        alr46Info: Object.keys(window.APP_STATE.alr46Info).length,
        radarSymbolMap: Object.keys(window.APP_STATE.radarSymbolMap).length,
        selectedSymbols: Array.from(window.APP_STATE.symbolFilter?.getSelectedSymbols() || []),
        collapsedGroups: window.APP_STATE.collapsedGroups
      },
      stats: this.getAppStats()
    };
  }

  // Reset application to defaults
  async reset() {
    try {
      // Stop all audio
      window.APP_STATE.audioManager.stopAllSounds();
      
      // Clear storage
      window.StorageService.clear();
      
      // Reset state
      window.APP_STATE.collapsedGroups = [];
      window.APP_STATE.selectedSymbols.clear();
      
      // Reset theme to system preference
      this.initializeTheme();
      
      // Reset volume
      this.components.volumeControl.setVolume(window.APP_CONFIG.AUDIO.DEFAULT_VOLUME);
      
      // Clear search
      window.APP_STATE.soundDisplay.clearSearch();
      
      // Reset symbol filter
      window.APP_STATE.symbolFilter.selectAll();
      
      console.log('🔄 Application reset to defaults');
      
    } catch (error) {
      console.error('❌ Failed to reset application:', error);
    }
  }

  cleanup() {
    try {
      // Cleanup audio resources
      if (window.APP_STATE.audioManager) {
        window.APP_STATE.audioManager.cleanup();
      }
      
      // Clear data cache
      if (window.APP_STATE.dataLoader) {
        window.APP_STATE.dataLoader.clearCache();
      }
      
      console.log('🧹 Application cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Create global app instance
  window.F4EApp = new F4ERWRApp();
  
  try {
    await window.F4EApp.initialize();
  } catch (error) {
    console.error('❌ Failed to start application:', error);
  }
});

// Development helpers (only available in console)
if (typeof window !== 'undefined') {
  window.DevHelpers = {
    getStats: () => window.F4EApp?.getAppStats(),
    exportState: () => window.F4EApp?.exportState(),
    reset: () => window.F4EApp?.reset(),
    
    // Quick access to components
    get audio() { return window.APP_STATE.audioManager; },
    get display() { return window.APP_STATE.soundDisplay; },
    get filter() { return window.APP_STATE.symbolFilter; },
    get data() { return window.APP_STATE.dataLoader; },
    
    // Debugging utilities
    logState: () => console.table(window.F4EApp?.exportState()),
    clearStorage: () => window.StorageService.clear(),
    
    // Performance testing
    testAudioLoad: async (count = 5) => {
      const sounds = window.APP_STATE.soundMeta.slice(0, count);
      const start = performance.now();
      
      try {
        await Promise.all(sounds.map(s => window.APP_STATE.audioManager.loadSound(s.file)));
        const duration = performance.now() - start;
        console.log(`✅ Loaded ${count} sounds in ${duration.toFixed(2)}ms`);
        return { success: true, duration, count };
      } catch (error) {
        console.error('❌ Audio load test failed:', error);
        return { success: false, error };
      }
    }
  };
  
  // Log helper availability
  console.log('🛠️ Development helpers available via window.DevHelpers');
  console.log('   Example: DevHelpers.getStats(), DevHelpers.logState()');
}