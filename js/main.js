// Main application initialization
class Site {
  constructor() {
    // this.dataLoader = new DataLoader();
    // this.audioManager = new AudioManager();
    // this.soundDisplay = null;
    // this.symbolFilter = null;
  }

  async initialize() {
    try {
      // Initialize theme
      UIComponents.initializeTheme();
      // UIComponents.initTheme();

      // Initialize Navbar Scroll Effect
      UIComponents.initNavbarScrollEffect();

      // Initialize set active Navbar Link
      UIComponents.setActiveNavLink();

      // Bind toggleTheme button click
      const toggleBtn = document.querySelector(".theme-toggle");
      if (toggleBtn) {
        toggleBtn.addEventListener("click", UIComponents.toggleTheme);
      }

      console.log("✅ Application initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing application:", error);
      // document.getElementById("audio-list").textContent = "❌ Failed to load application.";
    }
  }

  setupEventListeners() {
    // Global buttons
  }
}

document.addEventListener("popstate", () => {
  UIComponents.setActiveNavLink();
});

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // UIComponents.initNavbarScrollEffect();
  // UIComponents.initializeTheme();
  // UIComponents.setActiveNavLink();

  // Bind toggleTheme button click
  // const toggleBtn = document.querySelector(".theme-toggle");
  // if (toggleBtn) {
  //   toggleBtn.addEventListener("click", UIComponents.toggleTheme);
  // }

  const site = new Site();
  site.initialize();
});
