// Data loading and processing class
window.DataLoader = class DataLoader {
  constructor() {
    this.loadedData = new Map();
  }

  async loadJSON(url) {
    const cacheKey = url;
    if (this.loadedData.has(cacheKey)) {
      return this.loadedData.get(cacheKey);
    }

    try {
      const response = await fetch(window.Utils.addCacheBuster(url));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.loadedData.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`❌ Failed to load JSON from ${url}:`, error);
      throw error;
    }
  }

  async loadAllData() {
    const config = window.APP_CONFIG.ENDPOINTS;
    const progressBar = document.getElementById('progress-bar');
    
    try {
      progressBar.style.width = '0%';

      // Load all JSON files in parallel
      const [
        wavFiles,
        customWavFiles,
        groupsMain,
        groupsCustom,
        alr46ThreatInfoAuto,
        alr46ThreatInfoCustom
      ] = await Promise.all([
        this.loadJSON(config.WAV_LIST),
        this.loadJSON(config.CUSTOM_WAV_LIST),
        this.loadJSON(config.GROUPS),
        this.loadJSON(config.GROUPS_CUSTOM),
        this.loadJSON(config.ALR46_INFO),
        this.loadJSON(config.ALR46_INFO_CUSTOM)
      ]);

      progressBar.style.width = '50%';

      // Build radar symbol map
      await this.buildRadarSymbolMap();
      
      progressBar.style.width = '75%';

      // Combine data
      const allFiles = [...wavFiles, ...customWavFiles].sort();
      window.APP_STATE.groupsData = { ...groupsMain, ...groupsCustom };
      window.APP_STATE.alr46Info = { ...alr46ThreatInfoAuto, ...alr46ThreatInfoCustom };

      // Process sound metadata
      window.APP_STATE.soundMeta = this.processSoundMetadata(allFiles);
      
      progressBar.style.width = '100%';

      console.log('✅ All data loaded successfully');
      return {
        soundMeta: window.APP_STATE.soundMeta,
        groupsData: window.APP_STATE.groupsData,
        alr46Info: window.APP_STATE.alr46Info
      };
    } catch (error) {
      console.error('❌ Failed to load application data:', error);
      throw error;
    } finally {
      // Hide progress bar after delay
      setTimeout(() => {
        document.getElementById('progress-container').style.display = 'none';
      }, window.APP_CONFIG.UI.PROGRESS_FADE_DELAY);
    }
  }

  processSoundMetadata(allFiles) {
    const soundMeta = [];
    let processed = 0;
    const total = allFiles.length;

    for (const file of allFiles) {
      try {
        const meta = window.APP_STATE.groupsData[file] || {
          group: "Other",
          name: file.split("/").pop(),
          description: "",
          hidden: false
        };

        const radarInfo = window.APP_STATE.alr46Info[file];
        const isUndetectable = radarInfo?.undetectable === true;

        // Skip hidden and undetectable sounds
        if (meta.hidden || isUndetectable) {
          continue;
        }

        // Apply radar-based filtering logic
        if (this.shouldSkipSound(file, radarInfo)) {
          continue;
        }

        soundMeta.push({
          file,
          group: meta.group,
          name: meta.name,
          description: meta.description,
          hidden: false
        });

      } catch (error) {
        console.error(`❌ Failed to process metadata for ${file}:`, error);
      } finally {
        processed++;
      }
    }

    console.log(`✅ Processed ${soundMeta.length} sound files`);
    return soundMeta;
  }

  shouldSkipSound(file, radarInfo) {
    if (!radarInfo) return false;

    // Skip SEARCH wav files for TRACK_ONLY radars with same PRF
    if (file.includes("SEARCH") && 
        radarInfo.type === "TRACK_ONLY" && 
        radarInfo.prf_search === radarInfo.prf_track) {
      console.log(`🔒 Skipped (SEARCH wav with TRACK_ONLY radar, same PRF): ${file}`);
      return true;
    }

    // Skip TRACK wav files for SEARCH_ONLY radars
    if (file.includes("TRACK") && radarInfo.type === "SEARCH_ONLY") {
      console.log(`🔒 Skipped (TRACK wav with SEARCH_ONLY radar): ${file}`);
      return true;
    }

    // Skip TRACK wav files for SEARCH_AND_TRACK radars with same PRF
    if (file.includes("TRACK") && 
        radarInfo.type === "SEARCH_AND_TRACK" && 
        radarInfo.prf_search === radarInfo.prf_track) {
      console.log(`🔒 Skipped (TRACK wav with SEARCH_AND_TRACK radar, same PRF): ${file}`);
      return true;
    }

    return false;
  }

  async buildRadarSymbolMap() {
    if (window.APP_STATE.radarSymbolMap && Object.keys(window.APP_STATE.radarSymbolMap).length > 0) {
      return;
    }

    try {
      const config = window.APP_CONFIG.ENDPOINTS;
      const [mainResponse, customResponse] = await Promise.all([
        this.loadJSON(config.EMITTER_DATA),
        this.loadJSON(config.EMITTER_DATA_CUSTOM)
      ]);

      window.APP_STATE.radarSymbolMap = {};

      // Process main data first, then custom data (custom takes precedence)
      this.addRadarEntries(mainResponse, false);
      this.addRadarEntries(customResponse, true);

      console.log('✅ Radar symbol map built with', 
        Object.keys(window.APP_STATE.radarSymbolMap).length, 
        'entries (custom data takes precedence)');

    } catch (error) {
      console.error('❌ Failed to build radar symbol map:', error);
      window.APP_STATE.radarSymbolMap = {};
    }
  }

  addRadarEntries(emitterData, isCustom = false) {
    const sources = ['ai_file_entries', 'new_land_file', 'new_sea_file'];
    
    sources.forEach(source => {
      const entries = emitterData[source] || [];
      
      entries.forEach(entry => {
        const key = window.Utils.normalizeRadarName(entry.radar);
        const newEntry = {
          symbol1: entry.symbol1,
          symbol2: entry.symbol2,
          source,
          repeat: entry.repeat,
          warning: entry.warning,
          warning2: entry.warning2,
          isCustom
        };

        if (!window.APP_STATE.radarSymbolMap[key]) {
          window.APP_STATE.radarSymbolMap[key] = [newEntry];
        } else {
          const existingEntries = window.APP_STATE.radarSymbolMap[key];
          const existingIdx = existingEntries.findIndex(e => e.source === source);

          if (existingIdx === -1) {
            existingEntries.push(newEntry);
          } else {
            // Determine if we should replace based on priority
            const existing = existingEntries[existingIdx];
            if (this.shouldReplaceEntry(existing, newEntry)) {
              existingEntries[existingIdx] = newEntry;
            }
          }
        }
      });
    });
  }

  shouldReplaceEntry(existing, newEntry) {
    // Custom data always takes precedence over main data
    if (newEntry.isCustom && !existing.isCustom) {
      return true;
    }
    
    // Never replace custom data with main data
    if (!newEntry.isCustom && existing.isCustom) {
      return false;
    }

    // Within same data source type, use priority logic
    if (newEntry.repeat === 1) {
      return true;
    }
    
    if (existing.repeat === false && typeof newEntry.repeat === "number") {
      return true;
    }
    
    if (typeof existing.repeat === "number" && typeof newEntry.repeat === "number") {
      return newEntry.repeat < existing.repeat;
    }

    return false;
  }

  // Get filtered sound data
  getFilteredSounds(searchTerm = '', selectedSymbols = new Set()) {
    return window.APP_STATE.soundMeta.filter(sound => {
      if (sound.hidden) return false;
      
      // Text search
      const haystack = `${sound.name} ${sound.description}`.toLowerCase();
      const matchesText = haystack.includes(searchTerm.toLowerCase());

      // Symbol filter
      const matchesSymbol = this.soundMatchesSymbolFilter(sound, selectedSymbols);

      return matchesText && matchesSymbol;
    });
  }

  soundMatchesSymbolFilter(sound, selectedSymbols) {
    if (selectedSymbols.size === 0) return true;

    const radarInfo = window.APP_STATE.alr46Info[sound.file];
    if (!radarInfo) return true;

    const normalized = window.Utils.normalizeRadarName(
      sound.file.replace(/^imported_wavs\//i, "").replace(/_(SEARCH|TRACK)\.wav$/i, "")
    );
    
    const radarEntry = window.APP_STATE.radarSymbolMap[normalized];
    const radarEntries = Array.isArray(radarEntry) ? radarEntry : radarEntry ? [radarEntry] : [];

    // Check if any radar entry symbols match selected symbols
    const matchesSymbol = radarEntries.some(entry => 
      selectedSymbols.has(entry.symbol1) || selectedSymbols.has(entry.symbol2)
    );

    // Handle unknown fallback symbols
    if (!matchesSymbol && radarEntries.length === 0 && radarInfo.band != null) {
      const freq = Number(radarInfo.band);
      const fallback = window.Utils.getUnknownSymbolFromFrequency(freq);
      return fallback && selectedSymbols.has(fallback);
    }

    return matchesSymbol;
  }

  // Clear cache
  clearCache() {
    this.loadedData.clear();
    console.log('🧹 Data cache cleared');
  }
};