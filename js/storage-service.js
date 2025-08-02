// Storage service with fallback to in-memory storage
window.StorageService = {
  // In-memory fallback storage
  memoryStorage: new Map(),
  
  // Check if localStorage is available
  isLocalStorageAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Get item with fallback
  getItem(key, defaultValue = null) {
    try {
      if (this.isLocalStorageAvailable()) {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
      } else {
        return this.memoryStorage.get(key) || defaultValue;
      }
    } catch (e) {
      console.warn('Storage getItem failed:', e);
      return this.memoryStorage.get(key) || defaultValue;
    }
  },

  // Set item with fallback
  setItem(key, value) {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, value);
      } else {
        this.memoryStorage.set(key, value);
      }
    } catch (e) {
      console.warn('Storage setItem failed, using memory fallback:', e);
      this.memoryStorage.set(key, value);
    }
  },

  // Remove item with fallback
  removeItem(key) {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      } else {
        this.memoryStorage.delete(key);
      }
    } catch (e) {
      console.warn('Storage removeItem failed:', e);
      this.memoryStorage.delete(key);
    }
  },

  // Get parsed JSON with fallback
  getJSON(key, defaultValue = null) {
    const value = this.getItem(key);
    if (value === null) return defaultValue;
    return window.Utils.safeJSONParse(value, defaultValue);
  },

  // Set JSON with fallback
  setJSON(key, value) {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Failed to stringify JSON for storage:', e);
    }
  },

  // Clear all storage
  clear() {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.clear();
      }
      this.memoryStorage.clear();
    } catch (e) {
      console.warn('Storage clear failed:', e);
      this.memoryStorage.clear();
    }
  },

  // Get storage type being used
  getStorageType() {
    return this.isLocalStorageAvailable() ? 'localStorage' : 'memory';
  }
};