// UI Components and theme management
class UIComponents {
  // static initializeTheme() {
  //   const savedTheme = StorageService.getTheme();
  //   if (savedTheme) {
  //     document.documentElement.setAttribute("data-theme", savedTheme);
  //   } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
  //     document.documentElement.setAttribute("data-theme", "dark");
  //   } else {
  //     document.documentElement.setAttribute("data-theme", "light");
  //   }
  // }

  // static toggleTheme() {
  //   const currentTheme = document.documentElement.getAttribute("data-theme");
  //   const newTheme = currentTheme === "dark" ? "light" : "dark";
  //   document.documentElement.setAttribute("data-theme", newTheme);
  //   StorageService.setTheme(newTheme);
  // }

  static initializeVolumeControl(audioManager) {
    const volumeSlider = document.getElementById("volume-slider");
    const savedVolume = StorageService.getVolumeLevel();

    volumeSlider.value = savedVolume;
    audioManager.setVolume(savedVolume / 100);

    volumeSlider.addEventListener("input", function () {
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
    label.style.color =
      isUnknown || isKnownUnknownSymbol ? "#ff6b35" : "var(--highlight)";
    label.style.textAlign = "center";

    const img = document.createElement("img");
    img.src = `assets/rwr-symbols/${imageFileName}.jpg`;
    img.alt =
      isUnknown || isKnownUnknownSymbol
        ? `Unknown RWR Symbol: ${symbolValue}`
        : `RWR Symbol ${symbolNumber}: ${symbolValue}`;
    img.className = "radar-symbol-img";
    img.style.maxHeight = "65px";
    img.style.border =
      isUnknown || isKnownUnknownSymbol
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

  static updateAllGroupHeights() {
    // Helper function to update all group heights after bulk operations
    document.querySelectorAll(".audio-grid:not(.collapsed)").forEach((grid) => {
      UIComponents.updateGroupHeight(grid);
    });
  }

  static updateGroupHeight(groupGrid) {
    if (!groupGrid || groupGrid.classList.contains("collapsed")) return;

    // Temporarily remove max-height to measure natural height
    groupGrid.style.maxHeight = "none";

    // Get the natural height
    const naturalHeight = groupGrid.scrollHeight;

    // Set appropriate max-height with buffer for smooth animations and content changes
    groupGrid.style.maxHeight = Math.max(naturalHeight + 200, 1500) + "px";
  }

  static expandAllGroups() {
    document.querySelectorAll(".audio-grid").forEach((grid) => {
      grid.classList.remove("collapsed");
      // Update height immediately after removing collapsed class
      requestAnimationFrame(() => {
        UIComponents.updateGroupHeight(grid);
      });
    });
    StorageService.setCollapsedGroups([]);
  }

  static collapseAllGroups() {
    document.querySelectorAll(".audio-grid").forEach((grid) => {
      // First set current height to enable smooth transition
      const currentHeight = grid.scrollHeight;
      grid.style.maxHeight = currentHeight + "px";

      // Force reflow
      grid.offsetHeight;

      // Then collapse
      requestAnimationFrame(() => {
        grid.classList.add("collapsed");
      });
    });

    const collapsedGroups = Array.from(
      document.querySelectorAll(".group-title"),
    ).map((title) => title.textContent.trim());
    StorageService.setCollapsedGroups(collapsedGroups);
  }

  static showAllRadarInfo() {
    document.querySelectorAll(".extra-info").forEach((info) => {
      info.classList.add("visible");
    });

    // Update all group heights after showing radar info
    setTimeout(() => {
      UIComponents.updateAllGroupHeights();
    }, 300); // Wait for CSS transitions to complete
  }

  static hideAllRadarInfo() {
    document.querySelectorAll(".extra-info").forEach((info) => {
      info.classList.remove("visible");
    });

    // Update all group heights after hiding radar info
    setTimeout(() => {
      UIComponents.updateAllGroupHeights();
    }, 300); // Wait for CSS transitions to complete
  }
  static initNavbarScrollEffect() {
    const nav = document.getElementById("navbar");
    if (!nav) return;

    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 80);
    });
  }

  static updateThemeToggleButton(currentTheme = null) {
    const toggleBtn = document.querySelector(".theme-toggle");
    if (!toggleBtn) return;

    const theme =
      currentTheme || document.documentElement.getAttribute("data-theme");
    toggleBtn.textContent = theme === "dark" ? "Dark Mode" : "Light Mode";
  }

  static toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    UIComponents.updateThemeToggleButton(next);
  }

  // static initTheme() {
  static initializeTheme() {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    UIComponents.updateThemeToggleButton();
  }

  static setActiveNavLink() {
    const currentFile =
      window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll(".nav-links a");

    navLinks.forEach((link) => {
      const linkHref = link.getAttribute("href");
      link.classList.toggle(
        "active",
        linkHref === currentFile ||
          (currentFile === "" && linkHref === "index.html") ||
          (currentFile === "index.html" && linkHref === "index.html") ||
          (currentFile === "sounds.html" && linkHref === "sounds.html"),
      );
    });
  }
}

// Attach to window for access across other files/pages if needed
window.UIComponents = UIComponents;

// Create a global namespace if not exists
// window.UIComponents = window.UIComponents || {};

// /**
//  * Adds or removes the 'scrolled' class on the navbar based on scroll position.
//  */
// UIComponents.initNavbarScrollEffect = function () {
//   const nav = document.getElementById("navbar");
//   if (!nav) return;

//   window.addEventListener("scroll", () => {
//     if (window.scrollY > 80) {
//       nav.classList.add("scrolled");
//     } else {
//       nav.classList.remove("scrolled");
//     }
//   });
// };

// /**
//  * Toggles the site theme between light and dark.
//  */
// UIComponents.toggleTheme = function () {
//   const current = document.documentElement.getAttribute("data-theme");
//   const next = current === "dark" ? "light" : "dark";
//   document.documentElement.setAttribute("data-theme", next);
//   localStorage.setItem("theme", next);
// };

// /**
//  * Initializes the theme on page load from localStorage.
//  */
// UIComponents.initTheme = function () {
//   const saved = localStorage.getItem("theme");
//   if (saved === "dark") {
//     document.documentElement.setAttribute("data-theme", "dark");
//   }
// };

// /**
//  * Sets active state on current navigation link.
//  */
// UIComponents.setActiveNavLink = function () {
//   const currentPage = window.location.pathname;
//   const currentFile = currentPage.split("/").pop() || "index.html";

//   const navLinks = document.querySelectorAll(".nav-links a");
//   navLinks.forEach((link) => {
//     link.classList.remove("active");
//   });

//   navLinks.forEach((link) => {
//     const linkHref = link.getAttribute("href");
//     if (
//       linkHref === currentFile ||
//       (currentFile === "" && linkHref === "index.html") ||
//       (currentFile === "index.html" && linkHref === "index.html") ||
//       (currentFile === "sounds.html" && linkHref === "sounds.html")
//     ) {
//       link.classList.add("active");
//     }
//   });
// };
