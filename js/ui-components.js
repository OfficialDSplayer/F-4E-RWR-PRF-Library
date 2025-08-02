// UI Components and theme management
class UIComponents {
  static initializeTheme() {
    const savedTheme = StorageService.getTheme();
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  static toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    StorageService.setTheme(newTheme);
  }

  static initializeVolumeControl(audioManager) {
    const volumeSlider = document.getElementById("volume-slider");
    const savedVolume = StorageService.getVolumeLevel();
    
    volumeSlider.value = savedVolume;
    audioManager.setVolume(savedVolume / 100);

    volumeSlider.addEventListener("input", function() {
      const volume = parseInt(this.value) / 100;
      audioManager.setVolume(volume);
      StorageService.setVolumeLevel(this.value);
    });
  }

  static createSymbolWithLabel(symbolValue, symbolNumber, isUnknown = false) {
    const imageFileName = Config.SYMBOL_TO_IMAGE_MAP[symbolValue];
    if (!imageFileName) return null;

    const isKnownUnknownSymbol = [
      "unknown_low",
      "unknown_medium", 
      "unknown_high",
    ].includes(symbolValue);

    const symbolWrapper = document.createElement("div");
    symbolWrapper.style.display = "flex";
    symbolWrapper.style.flexDirection = "column";
    symbolWrapper.style.alignItems = "center";
    symbolWrapper.style.gap = "4px";

    const label = document.createElement("div");
    if (isUnknown) {
      label.textContent = "Unknown";
    } else if (isKnownUnknownSymbol) {
      label.textContent = `Unknown Symbol ${symbolNumber}`;
    } else {
      label.textContent = `Symbol ${symbolNumber}`;
    }

    label.style.fontSize = "0.8em";
    label.style.fontWeight = "bold";
    label.style.color = isUnknown || isKnownUnknownSymbol ? "#ff6b35" : "var(--highlight)";
    label.style.textAlign = "center";

    const img = document.createElement("img");
    img.src = `assets/rwr-symbols/${imageFileName}.jpg`;
    img.alt = isUnknown || isKnownUnknownSymbol 
      ? `Unknown RWR Symbol: ${symbolValue}` 
      : `RWR Symbol ${symbolNumber}: ${symbolValue}`;
    img.className = "radar-symbol-img";
    img.style.maxHeight = "65px";
    img.style.border = isUnknown || isKnownUnknownSymbol 
      ? "2px solid #ff6b35" 
      : "1px solid var(--highlight)";
    img.style.borderRadius = "1px";
    img.style.background = "white";
    img.style.padding = "1px";
    
    img.onerror = () => {
      console.warn(`❌ Failed to load symbol image:`, img.src);
      symbolWrapper.style.display = "none";
    };

    symbolWrapper.appendChild(label);
    symbolWrapper.appendChild(img);
    return symbolWrapper;
  }

  static createWarningDisplay(warnings) {
    if (!warnings || warnings.length === 0) return null;

    const warningContainer = document.createElement("div");
    warningContainer.style.marginTop = "8px";

    warnings.forEach((warning, index) => {
      const warningText = document.createElement("div");
      warningText.innerHTML = `<b style="color: #ff6b35;"></b> ${warning}`;
      warningText.style.fontSize = "0.85em";
      warningText.style.marginTop = index > 0 ? "4px" : "0px";
      warningText.style.color = "#ff6b35";
      warningText.style.textAlign = "center";
      warningText.style.backgroundColor = "rgba(255, 107, 53, 0.1)";
      warningText.style.padding = "8px";
      warningText.style.borderRadius = "4px";
      warningText.style.border = "1px solid rgba(255, 107, 53, 0.3)";
      warningContainer.appendChild(warningText);
    });

    return warningContainer;
  }

  static expandAllGroups() {
    document.querySelectorAll(".audio-grid").forEach((grid) => {
      grid.classList.remove("collapsed");
      grid.style.transform = "scaleY(0)";
      grid.style.opacity = "0";
      requestAnimationFrame(() => {
        grid.style.transform = "scaleY(1)";
        grid.style.opacity = "1";
      });
    });
    StorageService.setCollapsedGroups([]);
  }

  static collapseAllGroups() {
    document.querySelectorAll(".audio-grid").forEach((grid) => {
      grid.style.transform = "scaleY(0)";
      grid.style.opacity = "0";
      setTimeout(() => {
        grid.classList.add("collapsed");
      }, 400);
    });
    
    const collapsedGroups = Array.from(document.querySelectorAll(".group-title"))
      .map((title) => title.textContent.trim());
    StorageService.setCollapsedGroups(collapsedGroups);
  }

  static showAllRadarInfo() {
    document.querySelectorAll(".extra-info").forEach((info) => {
      info.style.display = "block";
    });
  }

  static hideAllRadarInfo() {
    document.querySelectorAll(".extra-info").forEach((info) => {
      info.style.display = "none";
    });
  }
}