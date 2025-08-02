// Utility functions used throughout the application
window.Utils = {
  // String normalization for radar names
  normalizeRadarName(str) {
    if (typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .replace(/[\s\-\/\\]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .trim();
  },

  // Debounce function for search input
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Lightweight createElement helper
  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (key === 'className') el.className = value;
      else if (key === 'textContent') el.textContent = value;
      else if (key.startsWith('data-')) el.setAttribute(key, value);
      else if (key in el) { try { el[key] = value; } catch (e) { el.setAttribute(key, value); } }
      else el.setAttribute(key, value);
    }
    if (!Array.isArray(children)) children = [children];
    for (const child of children) {
      if (child == null) continue;
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return el;
  },

  // Add cache busting to URLs
  addCacheBuster(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  },

  // Safe JSON parse with fallback
  safeJSONParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return fallback;
    }
  },

  // Frequency to unknown-symbol heuristic (returns null if unknown)
  getUnknownSymbolFromFrequency(freqGHz) {
    if (typeof freqGHz !== 'number' || !isFinite(freqGHz)) return null;
    if (freqGHz >= 2 && freqGHz < 4) return 'unknown_low';
    if (freqGHz >= 4 && freqGHz < 8) return 'unknown_medium';
    if (freqGHz >= 8 && freqGHz <= 20) return 'unknown_high';
    return null;
  }
};


// === Ported theme util from inline <script> ===
function toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
      }

      async function loadWavFiles() {
        const progressBar = document.getElementById("progress-bar");
        progressBar.style.width = "0%";

        try {
          // ✅ Fetch all metadata in parallel
          const [
            wavListResponse,
            customWavListResponse,
            groupsMainResponse,
            groupsCustomResponse,
            alr46ThreatInfoAutoResponse,
            alr46ThreatInfoCustomResponse,
          ] = await Promise.all([
            fetch("jsons/wav_list.json?v=" + Date.now()),
            fetch("jsons/custom_wav_list.json?v=" + Date.now()),
            fetch("jsons/groups.json?v=" + Date.now()),
            fetch("jsons/groups_custom.json?v=" + Date.now()),
            fetch("jsons/alr_46_threat_info.json?v=" + Date.now()),
            fetch("jsons/alr_46_threat_info_custom.json?v=" + Date.now()),
            buildRadarSymbolMap(),
          ]);

          const wavFiles = await wavListResponse.json();
          const customWavFiles = await customWavListResponse.json();
          const groupsMain = await groupsMainResponse.json();
          const groupsCustom = await groupsCustomResponse.json();
          // const alr46Info = await alr46InfoResponse.json();
          const alr46ThreatInfoAuto = await alr46ThreatInfoAutoResponse.json();
          const alr46ThreatInfoCustom = await alr46ThreatInfoCustomResponse.json();
          // alr46Info = await alr46InfoResponse.json();
          alr46Info = { ...alr46ThreatInfoAuto, ...alr46ThreatInfoCustom }
window.toggleDarkMode = toggleDarkMode;
