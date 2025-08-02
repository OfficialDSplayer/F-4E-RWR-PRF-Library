// Symbol filtering functionality
class SymbolFilter {
  constructor(soundDisplay) {
    this.soundDisplay = soundDisplay;
    this.selectedSymbols = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const toggleBtn = document.getElementById("symbol-filter-toggle");
    const dropdown = document.getElementById("symbol-filter-dropdown");

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("visible");
    });

    document.addEventListener("click", (e) => {
      const wrapper = document.getElementById("symbol-filter-wrapper");
      if (!wrapper.contains(e.target)) {
        dropdown.classList.remove("visible");
      }
    });
  }

  populateSymbolFilter(sounds) {
    const usedSymbols = new Set();
    const alr46Info = this.soundDisplay.dataLoader.getAlr46Info();

    for (const sound of sounds) {
      const fullPath = sound.file;
      const radarInfo = alr46Info[fullPath];
      if (!radarInfo) continue;

      const normalized = Utils.normalizeRadarName(
        fullPath.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
      );
      const radarEntry = window.radarSymbolMap?.[normalized];
      const radarEntries = Array.isArray(radarEntry)
        ? radarEntry
        : radarEntry
        ? [radarEntry]
        : [];

      for (const entry of radarEntries) {
        if (entry.symbol1) usedSymbols.add(entry.symbol1);
        if (entry.symbol2) usedSymbols.add(entry.symbol2);
      }

      if (!radarEntry && radarInfo.band != null) {
        const freq = Number(radarInfo.band);
        const fallback = Utils.getUnknownSymbolFromFrequency(freq);
        if (fallback) usedSymbols.add(fallback);
      }
    }

    const container = document.getElementById("symbol-filter-dropdown");
    container.innerHTML = "";
    
    const innerWrapper = document.createElement("div");
    innerWrapper.style.display = "flex";
    innerWrapper.style.flexDirection = "column";
    innerWrapper.style.alignItems = "center";
    innerWrapper.style.width = "100%";
    container.appendChild(innerWrapper);

    // Create grid to hold checkboxes
    const gridWrapper = document.createElement("div");
    gridWrapper.style.display = "flex";
    gridWrapper.style.flexWrap = "wrap";
    gridWrapper.style.justifyContent = "center";
    gridWrapper.style.gap = "8px";
    gridWrapper.style.marginTop = "8px";

    // Select All / Deselect All button
    const selectAllBtn = document.createElement("button");
    selectAllBtn.textContent = "Deselect All";
    selectAllBtn.className = "global-button";
    selectAllBtn.style.fontSize = "0.85em";
    selectAllBtn.style.padding = "6px 12px";
    selectAllBtn.style.margin = "4px auto 0";
    let allSelected = true;

    selectAllBtn.addEventListener("click", () => {
      allSelected = !allSelected;
      selectAllBtn.textContent = allSelected ? "Deselect All" : "Select All";

      const checkboxes = gridWrapper.querySelectorAll("input[type='checkbox']");
      checkboxes.forEach((cb) => {
        cb.checked = allSelected;
        if (allSelected) {
          this.selectedSymbols.add(cb.value);
        } else {
          this.selectedSymbols.delete(cb.value);
        }
      });

      this.updateDisplay();
    });

    innerWrapper.appendChild(selectAllBtn);
    innerWrapper.appendChild(gridWrapper);

    Object.keys(Config.SYMBOL_TO_IMAGE_MAP).forEach((symbol) => {
      if (!usedSymbols.has(symbol)) return;

      const imageFile = Config.SYMBOL_TO_IMAGE_MAP[symbol];
      if (!imageFile) return;

      const wrapper = document.createElement("label");
      wrapper.style.display = "inline-flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "flex-start";
      wrapper.style.width = "64px";
      wrapper.style.margin = "6px";
      wrapper.style.gap = "4px";
      wrapper.style.textAlign = "center";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = symbol;
      checkbox.checked = true;
      checkbox.style.accentColor = "#2196f3";
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.selectedSymbols.add(symbol);
        } else {
          this.selectedSymbols.delete(symbol);
        }

        // Recalculate if all are selected
        const checkboxes = gridWrapper.querySelectorAll("input[type='checkbox']");
        const checkedBoxes = gridWrapper.querySelectorAll("input[type='checkbox']:checked");

        allSelected = checkboxes.length === checkedBoxes.length;
        selectAllBtn.textContent = allSelected ? "Deselect All" : "Select All";

        this.updateDisplay();
      });

      const img = document.createElement("img");
      img.src = `assets/rwr-symbols/${imageFile}.jpg`;
      img.alt = symbol;
      img.title = symbol;
      img.style.height = "48px";
      img.style.maxWidth = "100%";
      img.style.display = "block";
      img.style.objectFit = "contain";
      img.style.margin = "0 auto";

      wrapper.appendChild(checkbox);
      wrapper.appendChild(img);
      gridWrapper.appendChild(wrapper);
    });

    // Initialize selectedSymbols with all checked symbols
    this.selectedSymbols.clear();
    container.querySelectorAll("input[type='checkbox']:checked").forEach((cb) => {
      this.selectedSymbols.add(cb.value);
    });

    // Trigger initial display update
    this.updateDisplay();
  }

  updateDisplay() {
    const searchTerm = document.getElementById("search-input")?.value?.trim() || "";
    const soundMeta = this.soundDisplay.dataLoader.getSoundMeta();
    this.soundDisplay.displayGroups(soundMeta, searchTerm, this.selectedSymbols);
  }

  getSelectedSymbols() {
    return this.selectedSymbols;
  }
}