// Sound display and grouping
class SoundDisplay {
  constructor(dataLoader, audioManager) {
    this.dataLoader = dataLoader;
    this.audioManager = audioManager;
    this.collapsedGroups = StorageService.getCollapsedGroups();
  }

  displayGroups(sounds, searchTerm = "", selectedSymbols = new Set()) {
    const audioList = document.getElementById("audio-list");
    audioList.innerHTML = "";

    const grouped = {};
    for (const sound of sounds) {
      if (!grouped[sound.group]) {
        grouped[sound.group] = [];
      }
      grouped[sound.group].push(sound);
    }

    for (const groupName of Object.keys(grouped).sort()) {
      // Filter visible sounds
      const visibleSounds = grouped[groupName].filter((sound) => {
        if (sound.hidden) return false;
        const haystack = `${sound.name} ${sound.description}`.toLowerCase();
        const matchesText = haystack.includes(searchTerm.toLowerCase());

        const radarInfo = this.dataLoader.getAlr46Info()[sound.file];
        if (!radarInfo) return matchesText; // allow text-only match

        const normalized = Utils.normalizeRadarName(
          sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
        );
        const radarEntry = window.radarSymbolMap?.[normalized];
        const radarEntries = Array.isArray(radarEntry)
          ? radarEntry
          : radarEntry
          ? [radarEntry]
          : [];

        let matchesSymbol = radarEntries.some(
          (entry) => selectedSymbols.has(entry.symbol1) || selectedSymbols.has(entry.symbol2)
        );

        // Also handle unknown fallback
        if (!matchesSymbol && radarEntries.length === 0 && radarInfo.band != null) {
          const freq = Number(radarInfo.band);
          const fallback = Utils.getUnknownSymbolFromFrequency(freq);
          matchesSymbol = fallback && selectedSymbols.has(fallback);
        }

        return matchesText && matchesSymbol;
      });

      // Skip group if no visible sounds
      if (visibleSounds.length === 0) continue;

      // Sort visible sounds by their 'name'
      const sortedSounds = visibleSounds.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      );

      const groupTitle = document.createElement("h2");
      groupTitle.className = "group-title";
      groupTitle.textContent = groupName;

      const groupGrid = document.createElement("div");
      groupGrid.className = "audio-grid";

      if (this.collapsedGroups.includes(groupName)) {
        groupGrid.classList.add("collapsed");
        groupGrid.style.transform = "scaleY(0)";
        groupGrid.style.opacity = "0";
      }

      for (const sound of sortedSounds) {
        const card = this.createAudioCard(sound);
        groupGrid.appendChild(card);
      }

      groupTitle.addEventListener("click", () => {
        this.toggleGroup(groupName, groupGrid);
      });

      audioList.appendChild(groupTitle);
      audioList.appendChild(groupGrid);
    }
  }

  createAudioCard(sound) {
    const card = document.createElement("div");
    card.className = "audio-card";

    const name = document.createElement("div");
    name.className = "file-name";
    name.textContent = sound.name;

    const desc = document.createElement("div");
    desc.className = "file-description";
    desc.textContent = sound.description || "";

    const extraInfo = document.createElement("div");
    extraInfo.className = "extra-info";

    // Build extra info content
    this.buildExtraInfo(sound, extraInfo);

    // Toggle dropdown on name click
    name.style.cursor = "pointer";
    name.addEventListener("click", () => {
      const wasVisible = extraInfo.classList.contains("visible");
      extraInfo.classList.toggle("visible");

      // Update group height after animation completes
      setTimeout(() => {
        this.updateGroupHeight(card.closest(".audio-grid"));
      }, 300); // Match the CSS transition duration
    });

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const playButton = document.createElement("button");
    playButton.className = "play-button";
    playButton.dataset.file = sound.file;
    playButton.textContent = "Play";

    const stopButton = document.createElement("button");
    stopButton.className = "stop-button";
    stopButton.textContent = "Stop";

    playButton.onclick = () => this.audioManager.startLoop(sound.file);
    stopButton.onclick = () => this.audioManager.stopLoop(sound.file);

    buttonGroup.appendChild(playButton);
    buttonGroup.appendChild(stopButton);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(buttonGroup);
    card.appendChild(extraInfo);

    return card;
  }

  updateGroupHeight(groupGrid) {
    if (!groupGrid || groupGrid.classList.contains("collapsed")) return;

    // Remove any existing height constraints temporarily
    const originalHeight = groupGrid.style.height;
    const originalMaxHeight = groupGrid.style.maxHeight;

    groupGrid.style.height = "auto";
    groupGrid.style.maxHeight = "none";

    // Get the natural height
    const naturalHeight = groupGrid.scrollHeight;

    // Restore constraints but set appropriate max-height
    groupGrid.style.height = originalHeight;
    groupGrid.style.maxHeight = Math.max(naturalHeight + 100, 500) + "px"; // Add buffer for animations
  }

  buildExtraInfo(sound, extraInfo) {
    const fullPath = sound.file;
    const radarInfo = this.dataLoader.getAlr46Info()[fullPath];
    let prfText = "";

    if (radarInfo) {
      const parts = [];

      // Radar Frequency with band designation
      if (radarInfo.band != null) {
        const freqGHz = Number(radarInfo.band);
        const band = Utils.getBandDesignation(freqGHz);
        parts.push(`Radar Frequency: ${freqGHz.toFixed(2)} GHz (${band} band)`);
      }

      // Radar PRF logic
      this.addPRFInfo(parts, fullPath, radarInfo);

      // Radar launch warning
      if (radarInfo.has_cd_command_guidance === true) {
        parts.push(`Launch Warning: True`);
      } else {
        parts.push(`Launch Warning: False`);
      }

      // Radar type
      if (radarInfo.type == "SEARCH_ONLY") {
        parts.push(`Radar Type: Search`);
      } else if (radarInfo.type == "TRACK_ONLY") {
        parts.push(`Radar Type: Track`);
      } else if (radarInfo.type == "SEARCH_AND_TRACK") {
        parts.push(`Radar Type: Search and Track`);
      }

      prfText = parts.join("<br>");
    }

    extraInfo.innerHTML = prfText || "No extra info available.";

    // Add RWR symbol display
    this.addRWRSymbolDisplay(sound, extraInfo);
  }

  addPRFInfo(parts, fullPath, radarInfo) {
    if (fullPath.includes("SEARCH") && radarInfo.type == "SEARCH_ONLY") {
      parts.push(`PRF: ${Number(radarInfo.prf_search).toFixed(2)}`);
    } else if (
      fullPath.includes("SEARCH") &&
      radarInfo.type == "TRACK_ONLY" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      parts.push(`PRF (Acquisition): ${Number(radarInfo.prf_search).toFixed(2)}`);
      parts.push(`PRF (Track): ${Number(radarInfo.prf_track).toFixed(2)}`);
    } else if (
      fullPath.includes("TRACK") &&
      radarInfo.type == "TRACK_ONLY" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      parts.push(`PRF (Acquisition): ${Number(radarInfo.prf_search).toFixed(2)}`);
      parts.push(`PRF (Track): ${Number(radarInfo.prf_track).toFixed(2)}`);
    } else if (
      fullPath.includes("SEARCH") &&
      radarInfo.type == "SEARCH_ONLY" &&
      radarInfo.prf_search == radarInfo.prf_track
    ) {
      parts.push(`PRF: ${Number(radarInfo.prf_search).toFixed(2)}`);
    } else if (
      fullPath.includes("TRACK") &&
      radarInfo.type == "TRACK_ONLY" &&
      radarInfo.prf_search == radarInfo.prf_track
    ) {
      parts.push(`PRF: ${Number(radarInfo.prf_track).toFixed(2)}`);
    } else if (
      (fullPath.includes("SEARCH") || fullPath.includes("TRACK")) &&
      radarInfo.type == "SEARCH_AND_TRACK" &&
      radarInfo.prf_search == radarInfo.prf_track
    ) {
      parts.push(`PRF: ${Number(radarInfo.prf_track).toFixed(2)}`);
    } else if (
      (fullPath.includes("SEARCH") || fullPath.includes("TRACK")) &&
      radarInfo.type == "SEARCH_AND_TRACK" &&
      radarInfo.prf_search != radarInfo.prf_track
    ) {
      parts.push(`PRF (Search): ${Number(radarInfo.prf_search).toFixed(2)}`);
      parts.push(`PRF (Track): ${Number(radarInfo.prf_track).toFixed(2)}`);
    }
  }

  addRWRSymbolDisplay(sound, extraInfo) {
    const fullPath = sound.file;
    const strippedFile = fullPath
      .replace(/^imported_wavs\//i, "")
      .replace(/_(SEARCH|TRACK)\.wav$/i, "");

    // Try multiple normalization approaches
    const normalizedOptions = [
      Utils.normalizeRadarName(strippedFile + ".wav"),
      Utils.normalizeRadarName(strippedFile),
      Utils.normalizeRadarName(sound.name),
      Utils.normalizeRadarName(sound.description),
    ];

    let radarEntry = null;
    let matchedKey = null;

    // Try each normalization option
    for (const normalized of normalizedOptions) {
      if (window.radarSymbolMap?.[normalized]) {
        radarEntry = window.radarSymbolMap[normalized];
        matchedKey = normalized;
        break;
      }
    }

    // Also try partial matching if exact match fails
    if (!radarEntry && window.radarSymbolMap) {
      for (const [key, entry] of Object.entries(window.radarSymbolMap)) {
        if (normalizedOptions.some((opt) => key.includes(opt) || opt.includes(key))) {
          radarEntry = entry;
          matchedKey = key;
          break;
        }
      }
    }

    if (radarEntry) {
      this.displayKnownRadarSymbols(radarEntry, extraInfo);
    } else {
      this.displayUnknownRadarSymbol(sound, extraInfo);
    }
  }

  displayKnownRadarSymbols(radarEntry, extraInfo) {
    // Loop through each radarEntry
    for (const radarEntryVariant of Array.isArray(radarEntry) ? radarEntry : [radarEntry]) {
      const { symbol1, symbol2, source, warning, warning2 } = radarEntryVariant;

      const isManualUnknownSymbol =
        ["unknown_low", "unknown_medium", "unknown_high"].includes(symbol1) ||
        ["unknown_low", "unknown_medium", "unknown_high"].includes(symbol2);

      // Create container to hold all RWR symbols for this source
      const symbolContainer = document.createElement("div");
      symbolContainer.style.display = "flex";
      symbolContainer.style.gap = "16px";
      symbolContainer.style.justifyContent = "center";
      symbolContainer.style.alignItems = "flex-start";
      symbolContainer.style.marginTop = "8px";
      symbolContainer.style.flexWrap = "wrap";

      // Render first RWR symbol
      const symbol1Element = UIComponents.createSymbolWithLabel(symbol1, 1, isManualUnknownSymbol);
      if (symbol1Element) {
        symbolContainer.appendChild(symbol1Element);
      }

      // Render second RWR symbol (only if different from symbol1)
      if (symbol2 && symbol2 !== symbol1) {
        const isSymbol2Unknown = ["unknown_low", "unknown_medium", "unknown_high"].includes(
          symbol2
        );
        const symbol2Element = UIComponents.createSymbolWithLabel(symbol2, 2, isSymbol2Unknown);
        if (symbol2Element) {
          symbolContainer.appendChild(symbol2Element);
        }
      }

      // Append container only if it has at least one symbol
      if (symbolContainer.children.length > 0) {
        extraInfo.appendChild(symbolContainer);
      }

      // Display source info or frequency band info
      if (isManualUnknownSymbol) {
        this.addFrequencyBandInfo(extraInfo);
      } else {
        this.addSourceTableInfo(source, extraInfo);
      }

      // Display warnings if they exist
      const warnings = [];
      if (warning && warning.trim()) warnings.push(warning.trim());
      if (warning2 && warning2.trim()) warnings.push(warning2.trim());

      const warningDisplay = UIComponents.createWarningDisplay(warnings);
      if (warningDisplay) {
        extraInfo.appendChild(warningDisplay);
      }
    }
  }

  displayUnknownRadarSymbol(sound, extraInfo) {
    const radarInfo = this.dataLoader.getAlr46Info()[sound.file];
    let unknownSymbol = null;
    let frequencyBand = "Unknown";

    if (radarInfo && radarInfo.band != null) {
      const freqGHz = Number(radarInfo.band);
      unknownSymbol = Utils.getUnknownSymbolFromFrequency(freqGHz);

      if (freqGHz >= 2 && freqGHz < 4) frequencyBand = "Low band (2-4 GHz)";
      else if (freqGHz >= 4 && freqGHz < 8) frequencyBand = "Medium band (4-8 GHz)";
      else if (freqGHz >= 8 && freqGHz <= 20) frequencyBand = "High band (8-20 GHz)";
    }

    if (unknownSymbol) {
      // Create container for unknown symbol
      const symbolContainer = document.createElement("div");
      symbolContainer.style.display = "flex";
      symbolContainer.style.flexDirection = "column";
      symbolContainer.style.alignItems = "center";
      symbolContainer.style.marginTop = "8px";

      // Display unknown symbol
      const unknownElement = UIComponents.createSymbolWithLabel(unknownSymbol, null, true);
      if (unknownElement) {
        symbolContainer.appendChild(unknownElement);
      }

      // Add frequency band info
      const bandText = document.createElement("div");
      bandText.textContent = frequencyBand;
      bandText.style.fontSize = "0.75em";
      bandText.style.color = "#ff6b35";
      bandText.style.marginTop = "4px";
      bandText.style.textAlign = "center";
      symbolContainer.appendChild(bandText);

      extraInfo.appendChild(symbolContainer);

      // Warning message for unknown radar
      const warningText = document.createElement("div");
      warningText.innerHTML = `<b style="color: #ff6b35;">⚠️ WARNING:</b> This radar is not in the RWR symbol library.<br>Symbol assigned based on frequency band.`;
      warningText.style.fontSize = "0.85em";
      warningText.style.marginTop = "8px";
      warningText.style.color = "#ff6b35";
      warningText.style.textAlign = "center";
      warningText.style.backgroundColor = "rgba(255, 107, 53, 0.1)";
      warningText.style.padding = "8px";
      warningText.style.borderRadius = "4px";
      warningText.style.border = "1px solid rgba(255, 107, 53, 0.3)";
      extraInfo.appendChild(warningText);

      console.log("⚠️ Unknown radar with frequency-based symbol:", {
        file: sound.file,
        frequency: radarInfo?.band,
        frequencyBand,
        assignedSymbol: unknownSymbol,
      });
    } else {
      console.warn("❌ No radar symbol found (no frequency data available):", {
        file: sound.file,
        availableKeys: Object.keys(window.radarSymbolMap || {}).slice(0, 5),
      });
    }
  }

  addFrequencyBandInfo(extraInfo) {
    const radarInfo = this.dataLoader.getAlr46Info();
    let frequencyBand = "Unknown";

    // Add frequency band info for manually assigned unknown symbols
    const bandText = document.createElement("div");
    bandText.textContent = frequencyBand;
    bandText.style.fontSize = "0.75em";
    bandText.style.color = "#ff6b35";
    bandText.style.marginTop = "4px";
    bandText.style.textAlign = "center";
    extraInfo.appendChild(bandText);
  }

  addSourceTableInfo(source, extraInfo) {
    const friendlySourceName = Config.SOURCE_NAME_MAP[source] || source;
    const sourceText = document.createElement("div");
    sourceText.innerHTML = `<b>Source Table:</b> ${friendlySourceName}`;
    sourceText.style.fontSize = "0.85em";
    sourceText.style.marginTop = "8px";
    sourceText.style.color = "var(--highlight)";
    sourceText.style.textAlign = "center";
    extraInfo.appendChild(sourceText);
  }

  toggleGroup(groupName, groupGrid) {
    const isCollapsed = groupGrid.classList.contains("collapsed");

    if (!isCollapsed) {
      groupGrid.style.transform = "scaleY(0)";
      groupGrid.style.opacity = "0";
      setTimeout(() => {
        groupGrid.classList.add("collapsed");
        if (!this.collapsedGroups.includes(groupName)) {
          this.collapsedGroups.push(groupName);
        }
        StorageService.setCollapsedGroups(this.collapsedGroups);
      }, 400);
    } else {
      groupGrid.classList.remove("collapsed");
      groupGrid.style.transform = "scaleY(0)";
      groupGrid.style.opacity = "0";
      requestAnimationFrame(() => {
        groupGrid.style.transform = "scaleY(1)";
        groupGrid.style.opacity = "1";
        // Update height after expansion
        setTimeout(() => {
          this.updateGroupHeight(groupGrid);
        }, 50);
      });
      this.collapsedGroups = this.collapsedGroups.filter((name) => name !== groupName);
      StorageService.setCollapsedGroups(this.collapsedGroups);
    }
  }
}
