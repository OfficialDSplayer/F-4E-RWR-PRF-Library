// Radar information filtering functionality (updated with sliders & yes/no launch)
// NOTE: This version aligns UI/UX patterns with symbol-filter.js: dropdown, outside-click close,
// and centralized update triggers. The dropdown is positioned directly beneath the toggle button.
class RadarInfoFilter {
  constructor(dataLoader, soundDisplay) {
    this.dataLoader = dataLoader;
    this.soundDisplay = soundDisplay;

    // Filter state
    this.radarFilters = {
      launchWarning: null, // null = Any, true = Yes, false = No
      radarType: new Set(["SEARCH_ONLY", "TRACK_ONLY", "SEARCH_AND_TRACK"]), // multi-select chips
      prfMin: null,
      prfMax: null,
      freqMin: null, // frequency (ghz)
      freqMax: null,
    };

    this.prfDomain = { min: 0, max: 0 };
    this.freqDomain = { min: 0, max: 0 };

    this.setupEventListeners();
  }

  setupEventListeners() {
    const toggleBtn = document.getElementById("radar-info-filter-toggle");
    const dropdown = document.getElementById("radar-info-filter-dropdown");

    if (toggleBtn && dropdown) {
      const updateDropdownPosition = () => {
        if (dropdown.classList.contains("visible")) {
          const rect = toggleBtn.getBoundingClientRect();
          const windowWidth = window.innerWidth;

          dropdown.style.position = "absolute";
          dropdown.style.zIndex = 1000;

          // If window is small (mobile-like), make dropdown full width and center it
          if (windowWidth < 768) {
            dropdown.style.top = rect.bottom + window.scrollY + "px";
            dropdown.style.left = "10px";
            dropdown.style.right = "10px";
            dropdown.style.width = "400px";
            dropdown.style.minWidth = "400px";
          } else {
            // Normal positioning below the button
            dropdown.style.top = rect.bottom + window.scrollY + "px";
            dropdown.style.left = rect.left + window.scrollX + "px";
            dropdown.style.right = "auto";
            dropdown.style.width = "auto";
            dropdown.style.minWidth = rect.width + "px";
          }
        }
      };

      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("visible");
        updateDropdownPosition();
      });

      // Update dropdown position when window is resized
      window.addEventListener("resize", updateDropdownPosition);

      document.addEventListener("click", (e) => {
        const wrapper = document.getElementById("radar-info-filter-wrapper");
        if (wrapper && !wrapper.contains(e.target)) {
          dropdown.classList.remove("visible");
        }
      });
    }
  }

  populateRadarInfoFilter(sounds) {
    this.initializeFilters(sounds);
    const container = document.getElementById("radar-info-filter-dropdown");
    if (!container) return;

    container.innerHTML = "";
    this.createRadarInfoContent(container);
  }

  triggerFilterUpdate() {
    // Trigger update via custom event
    document.dispatchEvent(new CustomEvent("radarFilterChanged"));
  }

  createRadarInfoContent(container) {
    container.style.display = "flex";
    container.style.flexDirection = "row";
    // container.style.gap = "16px";
    // container.style.padding = "8px";

    // container.style.alignItems = "stretch";
    // container.style.width = "100%";
    // container.style.width = "450px";
    container.style.height = "450px"; // make it square
    // container.style.resize = "both"; // make it resizable
    // container.style.overflow = "auto"; // allow scroll if content exceeds size

    container.style.gap = "16px";
    container.style.padding = "8px";
    container.style.minWidth = "260px";

    // container.style.maxWidth = "100%";

    // --- Combined Launch Warning and Radar Type row ---
    const topRow = document.createElement("div");
    topRow.style.display = "flex";
    topRow.style.flexDirection = "row";
    topRow.style.justifyContent = "center";
    topRow.style.alignItems = "center";
    topRow.style.gap = "24px"; // space between checkbox and radar chips

    // Launch Warnings checkbox
    // const launch = document.createElement("div");
    // const label = document.createElement("label");
    // label.style.display = "flex";
    // label.style.alignItems = "center";
    // label.style.gap = "6px";

    const launch = document.createElement("div");
    const label = document.createElement("label");

    // Apply chip-like box styling
    label.style.display = "flex";
    label.style.alignItems = "center";
    label.style.gap = "6px";
    label.style.padding = "6px 12px";
    label.style.border = "1px solid var(--border-color, #444)";
    label.style.borderRadius = "12px";
    label.style.cursor = "pointer";
    label.style.userSelect = "none";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = false;
    cb.addEventListener("change", () => {
      this.radarFilters.launchWarning = cb.checked ? true : null;
      this.triggerFilterUpdate();
    });

    const span = document.createElement("span");
    span.textContent = "Launch Warnings";

    label.appendChild(cb);
    label.appendChild(span);
    launch.appendChild(label);
    topRow.appendChild(launch);

    // Radar Type chips
    const type = document.createElement("div");
    const typeWrap = document.createElement("div");
    typeWrap.style.display = "flex";
    typeWrap.style.flexWrap = "wrap";
    typeWrap.style.gap = "8px";
    typeWrap.style.justifyContent = "center";

    [
      { value: "SEARCH_ONLY", label: "Search Only" },
      { value: "TRACK_ONLY", label: "Track Only" },
      { value: "SEARCH_AND_TRACK", label: "Search & Track" },
    ].forEach((opt) => {
      const lbl = document.createElement("label");
      lbl.style.display = "flex";
      lbl.style.alignItems = "center";
      lbl.style.gap = "6px";
      lbl.style.padding = "6px 12px";
      lbl.style.border = "1px solid var(--border-color, #444)";
      lbl.style.borderRadius = "12px";
      lbl.style.cursor = "pointer";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = this.radarFilters.radarType.has(opt.value);
      cb.addEventListener("change", () => {
        if (cb.checked) this.radarFilters.radarType.add(opt.value);
        else this.radarFilters.radarType.delete(opt.value);
        this.triggerFilterUpdate();
      });

      const span = document.createElement("span");
      span.textContent = opt.label;
      lbl.appendChild(cb);
      lbl.appendChild(span);
      typeWrap.appendChild(lbl);
    });

    type.appendChild(typeWrap);
    topRow.appendChild(type);

    // Append combined row to container
    container.appendChild(topRow);

    // PRF slider (Hz)
    const prf = document.createElement("div");
    const title3 = document.createElement("h4");
    title3.textContent = "PRF (Hz)";
    title3.style.margin = "4px 0";
    title3.style.textAlign = "center";
    title3.style.fontSize = "1em";
    prf.appendChild(title3);

    const prfWrap = document.createElement("div");
    prfWrap.style.display = "flex";
    prfWrap.style.flexDirection = "column";
    prfWrap.style.gap = "8px";
    // prfWrap.style.overflowX = "auto";
    prfWrap.style.overflow = "hidden";
    prfWrap.style.minWidth = "0";
    prfWrap.style.maxWidth = "100%";

    const prfMin = document.createElement("input");
    prfMin.type = "range";
    prfMin.min = String(this.prfDomain.min);
    prfMin.max = String(this.prfDomain.max);
    prfMin.value = String(this.prfDomain.min);

    const prfMax = document.createElement("input");
    prfMax.type = "range";
    prfMax.min = String(this.prfDomain.min);
    prfMax.max = String(this.prfDomain.max);
    prfMax.value = String(this.prfDomain.max);

    prfMin.style.width = "100%";
    prfMax.style.width = "100%";

    const prfMinLabel = document.createElement("div");
    const prfMaxLabel = document.createElement("div");

    const updatePRFLabels = () => {
      const a = Math.min(Number(prfMin.value), Number(prfMax.value));
      const b = Math.max(Number(prfMin.value), Number(prfMax.value));
      prfMinLabel.textContent = `Min: ${a} Hz`;
      prfMaxLabel.textContent = `Max: ${b} Hz`;
      this.radarFilters.prfMin = a;
      this.radarFilters.prfMax = b;
    };
    [prfMin, prfMax].forEach((el) => {
      el.addEventListener("input", () => {
        updatePRFLabels();
        this.triggerFilterUpdate();
      });
    });
    updatePRFLabels();

    prfWrap.appendChild(prfMinLabel);
    prfWrap.appendChild(prfMaxLabel);
    prfWrap.appendChild(prfMin);
    prfWrap.appendChild(prfMax);
    prf.appendChild(prfWrap);
    container.appendChild(prf);

    // Frequency slider (GHz) with band helper
    const freq = document.createElement("div");
    const title4 = document.createElement("h4");
    title4.textContent = "Emitter Frequency (GHz)";
    title4.style.margin = "4px 0";
    title4.style.textAlign = "center";
    title4.style.fontSize = "1em";
    freq.appendChild(title4);

    const freqWrap = document.createElement("div");
    freqWrap.style.display = "flex";
    freqWrap.style.flexDirection = "column";
    freqWrap.style.gap = "8px";
    // freqWrap.style.overflowX = "auto";
    freqWrap.style.overflow = "hidden";
    freqWrap.style.minWidth = "0";
    freqWrap.style.maxWidth = "100%";

    const fMin = document.createElement("input");
    fMin.type = "range";
    fMin.min = String(this.freqDomain.min);
    fMin.max = String(this.freqDomain.max);
    fMin.value = String(this.freqDomain.min);

    const fMax = document.createElement("input");
    fMax.type = "range";
    fMax.min = String(this.freqDomain.min);
    fMax.max = String(this.freqDomain.max);
    fMax.value = String(this.freqDomain.max);

    fMin.style.width = "100%";
    fMax.style.width = "100%";

    const fMinLabel = document.createElement("div");
    const fMaxLabel = document.createElement("div");

    const labelBand = (ghz) => {
      const band =
        typeof Utils !== "undefined" && Utils.getBandDesignation
          ? Utils.getBandDesignation(Number(ghz))
          : "";
      return `${ghz} GHz${band ? ` (${band} Band)` : ""}`;
    };

    const updateFreqLabels = () => {
      const a = Math.min(Number(fMin.value), Number(fMax.value));
      const b = Math.max(Number(fMin.value), Number(fMax.value));
      fMinLabel.textContent = `Min: ${labelBand(a)}`;
      fMaxLabel.textContent = `Max: ${labelBand(b)}`;
      this.radarFilters.freqMin = a;
      this.radarFilters.freqMax = b;
    };
    [fMin, fMax].forEach((el) => {
      el.addEventListener("input", () => {
        updateFreqLabels();
        this.triggerFilterUpdate();
      });
    });
    updateFreqLabels();

    freqWrap.appendChild(fMinLabel);
    freqWrap.appendChild(fMaxLabel);
    freqWrap.appendChild(fMin);
    freqWrap.appendChild(fMax);
    freq.appendChild(freqWrap);
    container.appendChild(freq);
  }

  // Initialize PRF & frequency domains from data
  initializeFilters(sounds) {
    const alr46Info = this.dataLoader.getALR46Info
      ? this.dataLoader.getALR46Info()
      : this.dataLoader.getAlr46Info();
    let prfMin = Infinity,
      prfMax = -Infinity;
    let freqMin = Infinity,
      freqMax = -Infinity;

    for (const sound of sounds) {
      const radarInfo = alr46Info[sound.file];
      if (!radarInfo) continue;

      // PRF domain
      if (radarInfo.prf_search != null) {
        const v = Number(radarInfo.prf_search);
        if (!Number.isNaN(v)) {
          prfMin = Math.min(prfMin, v);
          prfMax = Math.max(prfMax, v);
        }
      }
      if (radarInfo.prf_track != null) {
        const v = Number(radarInfo.prf_track);
        if (!Number.isNaN(v)) {
          prfMin = Math.min(prfMin, v);
          prfMax = Math.max(prfMax, v);
        }
      }

      // Frequency domain (ghz)
      if (radarInfo.band != null) {
        const f = Number(radarInfo.band);
        if (!Number.isNaN(f)) {
          freqMin = Math.min(freqMin, f);
          freqMax = Math.max(freqMax, f);
        }
      }
    }

    // Fall back to sensible defaults if not found
    if (!Number.isFinite(prfMin)) prfMin = 0;
    if (!Number.isFinite(prfMax)) prfMax = 20000;
    if (!Number.isFinite(freqMin)) freqMin = 0;
    if (!Number.isFinite(freqMax)) freqMax = 20000;

    this.prfDomain = { min: Math.floor(prfMin), max: Math.ceil(prfMax) };
    this.freqDomain = { min: Math.floor(freqMin), max: Math.ceil(freqMax) };

    // Initialize current filter range to full domain
    this.radarFilters.prfMin = this.prfDomain.min;
    this.radarFilters.prfMax = this.prfDomain.max;
    this.radarFilters.freqMin = this.freqDomain.min;
    this.radarFilters.freqMax = this.freqDomain.max;

    return null;
  }

  // Predicate used by SoundDisplay to filter sounds
  passes(sound) {
    const alr46Info = this.dataLoader.getALR46Info
      ? this.dataLoader.getALR46Info()
      : this.dataLoader.getAlr46Info();
    const radarInfo = alr46Info[sound.file];
    if (!radarInfo) return true; // no metadata → don't filter out

    // Launch warning
    if (this.radarFilters.launchWarning !== null) {
      const hasLaunch = radarInfo.has_cd_command_guidance === true;
      if (hasLaunch !== this.radarFilters.launchWarning) return false;
    }

    // Radar type (if any selected; if none selected, treat as allow all)
    if (this.radarFilters.radarType && this.radarFilters.radarType.size > 0 && radarInfo.type) {
      if (!this.radarFilters.radarType.has(radarInfo.type)) return false;
    }

    // PRF range
    const prf = this.getPRFForSound(sound, radarInfo);
    if (prf != null) {
      if (prf < this.radarFilters.prfMin || prf > this.radarFilters.prfMax) return false;
    }

    // Frequency range (band)
    if (radarInfo.band != null) {
      const f = Number(radarInfo.band);
      if (Number.isFinite(f)) {
        if (f < this.radarFilters.freqMin || f > this.radarFilters.freqMax) return false;
      }
    }

    return true;
  }

  getPRFForSound(sound, radarInfo) {
    const fullPath = sound.file || "";
    if (fullPath.includes("SEARCH") && radarInfo.type === "SEARCH_ONLY") {
      return Number(radarInfo.prf_search);
    } else if (fullPath.includes("TRACK") && radarInfo.type === "TRACK_ONLY") {
      return Number(radarInfo.prf_track);
    } else if (fullPath.includes("SEARCH") && radarInfo.type === "SEARCH_AND_TRACK") {
      return Number(radarInfo.prf_search);
    } else if (fullPath.includes("TRACK") && radarInfo.type === "SEARCH_AND_TRACK") {
      return Number(radarInfo.prf_track);
    } else {
      // default to whichever is present
      return radarInfo.prf_search != null
        ? Number(radarInfo.prf_search)
        : radarInfo.prf_track != null
        ? Number(radarInfo.prf_track)
        : null;
    }
  }

  // Backwards-compatible alias used elsewhere in the app
  matchesRadarInfoFilters(sound) {
    return this.passes(sound);
  }
}
