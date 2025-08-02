// Local storage management
class StorageService {
  static getTheme() {
    return localStorage.getItem("theme");
  }

  static setTheme(theme) {
    localStorage.setItem("theme", theme);
  }

  static getCollapsedGroups() {
    return JSON.parse(localStorage.getItem("collapsedGroups") || "[]");
  }

  static setCollapsedGroups(groups) {
    localStorage.setItem("collapsedGroups", JSON.stringify(groups));
  }

  static getVolumeLevel() {
    const saved = localStorage.getItem("volumeLevel");
    return saved !== null ? parseInt(saved) : 50;
  }

  static setVolumeLevel(level) {
    localStorage.setItem("volumeLevel", level);
  }
}