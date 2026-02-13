// Data loading and processing
class DataLoader {
  constructor() {
    this.soundMeta = [];
    this.alr46Info = {};
    this.groupsData = {};
    this.radarSymbolMap = null;
  }

  async loadAllData() {
    Utils.updateProgressBar(0);

    try {
      // Fetch all metadata in parallel to reduce startup time.
      const [
        wavFiles,
        customWavFiles,
        groupsMain,
        groupsCustom,
        alr46ThreatInfoAuto,
        alr46ThreatInfoCustom,
      ] = await Promise.all([
        this.fetchJsonWithCacheBust(Config.API_ENDPOINTS.WAV_LIST),
        this.fetchJsonWithCacheBust(Config.API_ENDPOINTS.CUSTOM_WAV_LIST),
        this.fetchJsonWithCacheBust(Config.API_ENDPOINTS.GROUPS),
        this.fetchJsonWithCacheBust(Config.API_ENDPOINTS.CUSTOM_GROUPS),
        this.fetchJsonWithCacheBust(Config.API_ENDPOINTS.ALR46_THREAT_INFO),
        this.fetchJsonWithCacheBust(
          Config.API_ENDPOINTS.ALR46_THREAT_INFO_CUSTOM,
        ),
        this.buildRadarSymbolMap(),
      ]);

      this.alr46Info = { ...alr46ThreatInfoAuto, ...alr46ThreatInfoCustom };
      this.groupsData = { ...groupsMain, ...groupsCustom };

      const allFiles = [...wavFiles, ...customWavFiles].sort((a, b) =>
        a.localeCompare(b),
      );
      const allGroups = { ...groupsMain, ...groupsCustom };

      // Process sound metadata
      let processed = 0;
      const total = allFiles.length;

      for (const file of allFiles) {
        try {
          const meta = allGroups[file] || this.createDefaultMeta(file);

          // Skip hidden and undetectable sounds entirely.
          if (meta.hidden || this.alr46Info[file]?.undetectable === true) {
            continue;
          }

          if (this.shouldSkipFile(file, this.alr46Info[file])) {
            continue;
          }

          this.soundMeta.push({
            file,
            group: meta.group,
            name: meta.name,
            description: meta.description,
            hidden: false,
          });
        } catch (error) {
          console.error(`❌ Failed to process metadata for ${file}:`, error);
          continue;
        } finally {
          processed++;
          Utils.updateProgressBar((processed / total) * 100);
        }
      }

      return this.soundMeta;
    } catch (error) {
      console.error("❌ Error loading sound metadata:", error);
      throw error;
    } finally {
      Utils.hideProgressBar();
    }
  }

  async fetchJsonWithCacheBust(endpoint) {
    const response = await fetch(`${endpoint}?v=${Date.now()}`);
    return response.json();
  }

  createDefaultMeta(file) {
    return {
      group: "Other",
      name: file.split("/").pop(),
      description: "",
      hidden: false,
    };
  }

  shouldSkipFile(file, radarInfo) {
    if (!radarInfo) {
      return false;
    }

    const samePrf = radarInfo.prf_search === radarInfo.prf_track;
    const isSearchFile = file.includes("SEARCH");
    const isTrackFile = file.includes("TRACK");

    if (isSearchFile && radarInfo.type === "TRACK_ONLY" && samePrf) {
      console.log(
        `🔒 Skipped (SEARCH wav with TRACK_ONLY radar, same PRF): ${file}`,
      );
      return true;
    }

    if (isTrackFile && radarInfo.type === "SEARCH_ONLY") {
      console.log(`🔒 Skipped (TRACK wav with SEARCH_ONLY radar): ${file}`);
      return true;
    }

    if (isTrackFile && radarInfo.type === "SEARCH_AND_TRACK" && samePrf) {
      console.log(
        `🔒 Skipped (TRACK wav with SEARCH_AND_TRACK radar, same PRF): ${file}`,
      );
      return true;
    }

    return false;
  }

  async buildRadarSymbolMap() {
    if (this.radarSymbolMap) return;

    try {
      const [emitterDataMain, emitterDataCustom] = await Promise.all([
        this.fetchJsonWithCacheBust(Config.API_ENDPOINTS.EMITTER_ID_DATA),
        this.fetchJsonWithCacheBust(
          Config.API_ENDPOINTS.EMITTER_ID_DATA_CUSTOM,
        ),
      ]);

      this.radarSymbolMap = {};

      const addEntries = (entries, source, isCustom = false) => {
        for (const entry of entries) {
          const key = Utils.normalizeRadarName(entry.radar);
          const newEntry = {
            symbol1: entry.symbol1,
            symbol2: entry.symbol2,
            source,
            repeat: entry.repeat,
            warning: entry.warning,
            warning2: entry.warning2,
            isCustom,
          };

          if (!this.radarSymbolMap[key]) {
            this.radarSymbolMap[key] = [newEntry];
          } else {
            const existingEntries = this.radarSymbolMap[key];
            const existingIdx = existingEntries.findIndex(
              (e) => e.source === source,
            );

            if (existingIdx === -1) {
              existingEntries.push(newEntry);
            } else {
              const existing = existingEntries[existingIdx];
              const existingRepeat = existing.repeat;
              const currentRepeat = newEntry.repeat;

              let shouldReplace = false;

              if (isCustom && !existing.isCustom) {
                shouldReplace = true;
              } else if (!isCustom && existing.isCustom) {
                shouldReplace = false;
              } else {
                if (currentRepeat === 1) {
                  shouldReplace = true;
                } else if (
                  existingRepeat === false &&
                  typeof currentRepeat === "number"
                ) {
                  shouldReplace = true;
                } else if (
                  typeof existingRepeat === "number" &&
                  typeof currentRepeat === "number"
                ) {
                  shouldReplace = currentRepeat < existingRepeat;
                }
              }

              if (shouldReplace) {
                existingEntries[existingIdx] = newEntry;
              }
            }
          }
        }
      };

      // Process MAIN data first
      addEntries(
        emitterDataMain.ai_file_entries || [],
        "ai_file_entries",
        false,
      );
      addEntries(emitterDataMain.new_land_file || [], "new_land_file", false);
      addEntries(emitterDataMain.new_sea_file || [], "new_sea_file", false);

      // Process CUSTOM data second (will override main data)
      addEntries(
        emitterDataCustom.ai_file_entries || [],
        "ai_file_entries",
        true,
      );
      addEntries(emitterDataCustom.new_land_file || [], "new_land_file", true);
      addEntries(emitterDataCustom.new_sea_file || [], "new_sea_file", true);

      // Make it globally accessible
      window.radarSymbolMap = this.radarSymbolMap;

      console.log(
        "✅ Radar symbol map built with",
        Object.keys(this.radarSymbolMap).length,
        "entries (custom data takes precedence)",
      );
    } catch (e) {
      console.error("❌ Failed to load emitter_id_data.json:", e);
    }
  }

  getSoundMeta() {
    return this.soundMeta;
  }

  getAlr46Info() {
    return this.alr46Info;
  }

  getGroupsData() {
    return this.groupsData;
  }
}
