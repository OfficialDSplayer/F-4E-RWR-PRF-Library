// Main application initialization
class Site {
  async initialize() {
    try {
      // Initialize theme
      UIComponents.initializeTheme();
      // Initialize Navbar Scroll Effect
      UIComponents.initNavbarScrollEffect();
      // Initialize set active Navbar Link
      UIComponents.setActiveNavLink();

      this.bindThemeToggle();
      this.configureHeroVideo();
      this.bindMobileMenu();

      console.log("✅ Application initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing application:", error);
    }
  }

  bindThemeToggle() {
    const toggleBtn = document.querySelector(".theme-toggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", UIComponents.toggleTheme);
    }
  }

  configureHeroVideo() {
    const video = document.querySelector(".hero-video");
    if (!video) {
      return;
    }

    // Keep hero video autoplay-friendly across browsers.
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Autoplay failed:", error);
      });
    }
  }

  bindMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const menuClose = document.getElementById("menuClose");
    const navMenu = document.getElementById("navMenu");

    // Some pages don't include the mobile menu layout.
    if (!menuToggle || !menuClose || !navMenu) {
      return;
    }

    menuToggle.addEventListener("click", () => {
      navMenu.classList.add("menu-open");
    });

    menuClose.addEventListener("click", () => {
      navMenu.classList.remove("menu-open");
    });
  }
}

document.addEventListener("popstate", () => {
  UIComponents.setActiveNavLink();
});

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const site = new Site();
  site.initialize();
});
