// Symbol filter component
window.SymbolFilter = class SymbolFilter {
  constructor() {
    this.selectedSymbols = new Set();
    this.allSymbols = new Set();
    this.toggleButton = document.getElementById('symbol-filter-toggle');
    this.dropdown = document.getElementById('symbol-filter-dropdown');
    this.isVisible = false;
    this.allSelected = true;
    this.selectAllButton = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle dropdown
    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const wrapper = document.getElementById('symbol-filter-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }

  populate(soundMeta) {
    this.extractUsedSymbols(soundMeta);
    this.renderDropdown();
    this.initializeSelectedSymbols();
  }

  extractUsedSymbols(soundMeta) {
    this.allSymbols.clear();

    soundMeta.forEach(sound => {
      const radarInfo = window.APP_STATE.alr46Info[sound.file];
      if (!radarInfo) return;

      const normalized = window.Utils.normalizeRadarName(
        sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
      );
      
      const radarEntry = window.APP_STATE.radarSymbolMap[normalized];
      const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

      // Add known symbols
      radarEntries.forEach(entry => {
        if (entry.symbol1) this.allSymbols.add(entry.symbol1);
        if (entry.symbol2) this.allSymbols.add(entry.symbol2);
      });

      // Add unknown fallback symbols
      if (radarEntries.length === 0 && radarInfo.band != null) {
        const freq = Number(radarInfo.band);
        const fallback = window.Utils.getUnknownSymbolFromFrequency(freq);
        if (fallback) this.allSymbols.add(fallback);
      }
    });

    console.log('✅ Found', this.allSymbols.size, 'unique symbols');
  }

  renderDropdown() {
    if (!this.dropdown) return;

    this.dropdown.innerHTML = '';

    // Create wrapper for better layout
    const wrapper = window.Utils.createElement('div', {
      style: 'display: flex; flex-direction: column; align-items: center; width: 100%;'
    });

    // Select All button
    this.selectAllButton = window.Utils.createElement('button', {
      className: 'global-button',
      textContent: 'Deselect All',
      style: 'font-size: 0.85em; padding: 6px 12px; margin: 4px auto 8px;'
    });

    this.selectAllButton.addEventListener('click', () => {
      this.toggleSelectAll();
    });

    // Grid for symbol checkboxes
    const grid = window.Utils.createElement('div', {
      style: 'display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 8px;'
    });

    // Create symbol checkboxes
    Array.from(this.allSymbols)
      .sort()
      .forEach(symbol => {
        const symbolElement = this.createSymbolCheckbox(symbol);
        if (symbolElement) {
          grid.appendChild(symbolElement);
        }
      });

    wrapper.appendChild(this.selectAllButton);
    wrapper.appendChild(grid);
    this.dropdown.appendChild(wrapper);
  }

  createSymbolCheckbox(symbol) {
    const imageFile = window.APP_CONFIG.SYMBOL_TO_IMAGE_MAP[symbol];
    if (!imageFile) return null;

    const wrapper = window.Utils.createElement('label', {
      style: `
        display: inline-flex; 
        flex-direction: column; 
        align-items: center; 
        width: 64px; 
        margin: 6px; 
        gap: 4px; 
        text-align: center; 
        cursor: pointer;
      `
    });

    const checkbox = window.Utils.createElement('input', {
      type: 'checkbox',
      value: symbol,
      checked: true,
      style: 'accent-color: var(--primary-color);'
    });

    checkbox.addEventListener('change', (e) => {
      this.handleSymbolToggle(symbol, e.target.checked);
    });

    const img = window.Utils.createElement('img', {
      src: `assets/rwr-symbols/${imageFile}.jpg`,
      alt: symbol,
      title: symbol,
      style: `
        height: 48px; 
        max-width: 100%; 
        display: block; 
        object-fit: contain; 
        margin: 0 auto;
        border: 1px solid white;
        border-radius: 2px;
      `
    });

    img.onerror = () => {
      console.warn(`❌ Failed to load symbol image: ${img.src}`);
      wrapper.style.display = 'none';
    };

    wrapper.appendChild(checkbox);
    wrapper.appendChild(img);
    
    return wrapper;
  }

  handleSymbolToggle(symbol, checked) {
    if (checked) {
      this.selectedSymbols.add(symbol);
    } else {
      this.selectedSymbols.delete(symbol);
    }

    this.updateSelectAllButton();
    this.notifyFilterChange();
  }

  toggleSelectAll() {
    this.allSelected = !this.allSelected;
    
    const checkboxes = this.dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.allSelected;
      this.handleSymbolToggle(checkbox.value, this.allSelected);
    });

    this.updateSelectAllButton();
  }

  updateSelectAllButton() {
    if (!this.selectAllButton) return;

    const checkboxes = this.dropdown.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = this.dropdown.querySelectorAll('input[type="checkbox"]:checked');

    this.allSelected = checkboxes.length === checkedBoxes.length;
    this.selectAllButton.textContent = this.allSelected ? 'Deselect All' : 'Select All';
  }

  initializeSelectedSymbols() {
    // Start with all symbols selected
    this.selectedSymbols.clear();
    this.allSymbols.forEach(symbol => {
      this.selectedSymbols.add(symbol);
    });
    
    this.allSelected = true;
    this.updateSelectAllButton();
  }

  showDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.add(window.APP_CONFIG.CSS_CLASSES.VISIBLE);
      this.isVisible = true;
    }
  }

  hideDropdown() {
    if (this.dropdown) {
      this.dropdown.classList.remove(window.APP_CONFIG.CSS_CLASSES.VISIBLE);
      this.isVisible = false;
    }
  }

  toggleDropdown() {
    if (this.isVisible) {
      this.hideDropdown();
    } else {
      this.showDropdown();
    }
  }

  getSelectedSymbols() {
    return new Set(this.selectedSymbols);
  }

  setSelectedSymbols(symbols) {
    this.selectedSymbols = new Set(symbols);
    
    // Update checkbox states
    const checkboxes = this.dropdown.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = this.selectedSymbols.has(checkbox.value);
    });
    
    this.updateSelectAllButton();
    this.notifyFilterChange();
  }

  selectAll() {
    this.setSelectedSymbols(Array.from(this.allSymbols));
  }

  deselectAll() {
    this.setSelectedSymbols([]);
  }

  notifyFilterChange() {
    // Dispatch custom event for filter changes
    const event = new CustomEvent('symbolFilterChange', {
      detail: { selectedSymbols: this.getSelectedSymbols() }
    });
    document.dispatchEvent(event);
  }

  // Get filter statistics
  getStats() {
    return {
      totalSymbols: this.allSymbols.size,
      selectedSymbols: this.selectedSymbols.size,
      unselectedSymbols: this.allSymbols.size - this.selectedSymbols.size,
      selectionPercentage: ((this.selectedSymbols.size / this.allSymbols.size) * 100).toFixed(1)
    };
  }
};