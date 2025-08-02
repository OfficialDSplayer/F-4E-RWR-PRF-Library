// Sound display management class
window.SoundDisplay = class SoundDisplay {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.container = document.getElementById('audio-list');
    this.soundGroups = new Map();
    this.currentSearchTerm = '';
    this.currentSelectedSymbols = new Set();
  }

  initialize() {
    this.setupEventListeners();
    console.log('✅ SoundDisplay initialized');
  }

  setupEventListeners() {
    // Listen for filter changes
    document.addEventListener('symbolFilterChange', (e) => {
      this.currentSelectedSymbols = e.detail.selectedSymbols;
      this.refresh();
    });

    // Search input with debouncing
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      const debouncedSearch = window.Utils.debounce((value) => {
        this.currentSearchTerm = value;
        this.refresh();
      }, window.APP_CONFIG.UI.SEARCH_DEBOUNCE);

      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value.trim());
      });
    }
  }

  displaySounds(soundMeta, searchTerm = '', selectedSymbols = new Set()) {
    this.currentSearchTerm = searchTerm;
    this.currentSelectedSymbols = selectedSymbols;
    
    // Clear existing display
    this.clearDisplay();

    // Get filtered sounds using DataLoader
    const filteredSounds = window.APP_STATE.dataLoader.getFilteredSounds(
      searchTerm, 
      selectedSymbols
    );

    // Group sounds
    const grouped = this.groupSounds(filteredSounds);

    // Create and render groups
    Object.keys(grouped)
      .sort()
      .forEach(groupName => {
        if (grouped[groupName].length === 0) return;

        const soundGroup = new window.UIComponents.SoundGroup(
          groupName, 
          grouped[groupName], 
          this.audioManager
        );
        
        const groupElement = soundGroup.render();
        this.container.appendChild(groupElement);
        this.soundGroups.set(groupName, soundGroup);
      });

    // Show message if no results
    if (Object.keys(grouped).length === 0) {
      this.showNoResultsMessage();
    }

    console.log(`📊 Displayed ${filteredSounds.length} sounds in ${Object.keys(grouped).length} groups`);
  }

  groupSounds(sounds) {
    const grouped = {};
    
    sounds.forEach(sound => {
      const groupName = sound.group || 'Other';
      if (!grouped[groupName]) {
        grouped[groupName] = [];
      }
      grouped[groupName].push(sound);
    });

    return grouped;
  }

  clearDisplay() {
    // Destroy existing groups
    this.soundGroups.forEach(group => group.destroy());
    this.soundGroups.clear();

    // Clear container
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  showNoResultsMessage() {
    const message = window.Utils.createElement('div', {
      className: 'loading-message',
      textContent: 'No sounds match your current filters.'
    });
    
    if (this.container) {
      this.container.appendChild(message);
    }
  }

  showLoadingMessage() {
    if (this.container) {
      this.container.innerHTML = '<div class="loading-message">Loading sounds...</div>';
    }
  }

  refresh() {
    this.displaySounds(
      window.APP_STATE.soundMeta,
      this.currentSearchTerm,
      this.currentSelectedSymbols
    );
  }

  // Group management methods
  expandAllGroups() {
    const promises = Array.from(this.soundGroups.values()).map(group => group.expand());
    return Promise.all(promises);
  }

  collapseAllGroups() {
    const promises = Array.from(this.soundGroups.values()).map(group => group.collapse());
    return Promise.all(promises);
  }

  showAllRadarInfo() {
    this.soundGroups.forEach(group => group.showAllRadarInfo());
  }

  hideAllRadarInfo() {
    this.soundGroups.forEach(group => group.hideAllRadarInfo());
  }

  // Search functionality
  setSearchTerm(term) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = term;
    }
    this.currentSearchTerm = term;
    this.refresh();
  }

  clearSearch() {
    this.setSearchTerm('');
  }

  // Get display statistics
  getStats() {
    const totalSounds = window.APP_STATE.soundMeta.length;
    const filteredSounds = window.APP_STATE.dataLoader.getFilteredSounds(
      this.currentSearchTerm,
      this.currentSelectedSymbols
    );
    
    const groupStats = {};
    this.soundGroups.forEach((group, name) => {
      groupStats[name] = {
        soundCount: group.sounds.length,
        isCollapsed: group.isCollapsed
      };
    });

    return {
      totalSounds,
      displayedSounds: filteredSounds.length,
      filteredOutSounds: totalSounds - filteredSounds.length,
      groupCount: this.soundGroups.size,
      groupStats,
      currentSearchTerm: this.currentSearchTerm,
      selectedSymbolCount: this.currentSelectedSymbols.size
    };
  }

  // Export current view configuration
  exportViewConfig() {
    return {
      searchTerm: this.currentSearchTerm,
      selectedSymbols: Array.from(this.currentSelectedSymbols),
      collapsedGroups: window.APP_STATE.collapsedGroups
    };
  }

  // Import view configuration
  importViewConfig(config) {
    if (config.searchTerm !== undefined) {
      this.setSearchTerm(config.searchTerm);
    }
    
    if (config.selectedSymbols && Array.isArray(config.selectedSymbols)) {
      if (window.APP_STATE.symbolFilter) {
        window.APP_STATE.symbolFilter.setSelectedSymbols(config.selectedSymbols);
      }
    }
    
    if (config.collapsedGroups && Array.isArray(config.collapsedGroups)) {
      window.APP_STATE.collapsedGroups = [...config.collapsedGroups];
      window.StorageService.setJSON(
        window.APP_CONFIG.STORAGE_KEYS.COLLAPSED_GROUPS,
        window.APP_STATE.collapsedGroups
      );
    }
  }
};

  