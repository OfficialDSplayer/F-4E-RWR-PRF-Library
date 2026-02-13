// Utility functions
class Utils {
  static BAND_DESIGNATIONS = [
    [0.003, 0.03, "HF"],
    [0.03, 0.3, "VHF"],
    [0.3, 1, "UHF"],
    [1, 2, "L"],
    [2, 4, "S"],
    [4, 8, "C"],
    [8, 12, "X"],
    [12, 18, "Ku"],
    [18, 27, "K"],
    [27, 40, "Ka"],
    [40, 75, "V"],
    [75, 110, "W"],
    [110, 300, "mm or G"],
  ];

  static normalizeRadarName(str) {
    return str
      .toLowerCase()
      .replace(/[\s\-/\\]+/g, "_") // spaces, slashes, dashes → underscore
      .replace(/[^a-z0-9_]/g, "") // remove remaining special chars
      .replace(/_+/g, "_") // collapse multiple underscores
      .trim();
  }

  static getBandDesignation(freqGHz) {
    for (const [min, max, band] of Utils.BAND_DESIGNATIONS) {
      if (freqGHz >= min && freqGHz < max) {
        return band;
      }
    }

    if (freqGHz === 300) {
      return "mm or G";
    }

    return "Unknown Band";
  }

  static getUnknownSymbolFromFrequency(freqGHz) {
    if (freqGHz >= 2 && freqGHz < 4) return "unknown_low"; // S-band
    if (freqGHz >= 4 && freqGHz < 8) return "unknown_medium"; // C-band
    if (freqGHz >= 8 && freqGHz <= 20) return "unknown_high"; // X-Ku band
    return null; // Outside supported frequency range
  }

  static hideProgressBar() {
    setTimeout(() => {
      const progressContainer = document.getElementById("progress-container");
      if (progressContainer) {
        progressContainer.style.display = "none";
      }
    }, 300);
  }

  static updateProgressBar(percentage) {
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
      progressBar.style.width = `${Math.floor(percentage)}%`;
    }
  }
}
