// Utility functions
class Utils {
  static normalizeRadarName(str) {
    return str
      .toLowerCase()
      .replace(/[\s\-\/\\]+/g, "_") // spaces, slashes, dashes → underscore
      .replace(/[^a-z0-9_]/g, "") // remove remaining special chars
      .replace(/_+/g, "_") // collapse multiple underscores
      .trim();
  }

  static getBandDesignation(freqGHz) {
    if (freqGHz >= 0.003 && freqGHz < 0.03) return "HF";
    if (freqGHz >= 0.03 && freqGHz < 0.3) return "VHF";
    if (freqGHz >= 0.3 && freqGHz < 1) return "UHF";
    if (freqGHz >= 1 && freqGHz < 2) return "L";
    if (freqGHz >= 2 && freqGHz < 4) return "S";
    if (freqGHz >= 4 && freqGHz < 8) return "C";
    if (freqGHz >= 8 && freqGHz < 12) return "X";
    if (freqGHz >= 12 && freqGHz < 18) return "Ku";
    if (freqGHz >= 18 && freqGHz < 27) return "K";
    if (freqGHz >= 27 && freqGHz < 40) return "Ka";
    if (freqGHz >= 40 && freqGHz < 75) return "V";
    if (freqGHz >= 75 && freqGHz < 110) return "W";
    if (freqGHz >= 110 && freqGHz <= 300) return "mm or G";
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