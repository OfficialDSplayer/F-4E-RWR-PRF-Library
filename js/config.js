// Application configuration and constants
window.APP_CONFIG = {
  // API endpoints
  ENDPOINTS: {
    WAV_LIST: "jsons/wav_list.json",
    CUSTOM_WAV_LIST: "jsons/custom_wav_list.json",
    GROUPS: "jsons/groups.json",
    GROUPS_CUSTOM: "jsons/groups_custom.json",
    ALR46_INFO: "jsons/alr_46_threat_info.json",
    ALR46_INFO_CUSTOM: "jsons/alr_46_threat_info_custom.json",
    EMITTER_DATA: "jsons/emitter_id_data.json",
    EMITTER_DATA_CUSTOM: "jsons/emitter_id_data_custom.json"
  },

  // Storage keys
  STORAGE_KEYS: {
    THEME: 'theme',
    VOLUME: 'volumeLevel',
    COLLAPSED_GROUPS: 'collapsedGroups'
  },

  // CSS classes
  CSS_CLASSES: {
    LOADING: 'loading',
    ACTIVE: 'active',
    COLLAPSED: 'collapsed',
    VISIBLE: 'visible'
  },

  // UI settings
  UI: {
    ANIMATION_DURATION: 400,
    GRID_MIN_WIDTH: 250,
    VOLUME_STEP: 5,
    SEARCH_DEBOUNCE: 300,
    PROGRESS_FADE_DELAY: 300
  },

  // Audio settings
  AUDIO: {
    DEFAULT_VOLUME: 50,
    MAX_CONCURRENT_SOUNDS: 50,
    SUPPORTED_FORMATS: ['.wav', '.mp3']
  },

  // Symbol to image mapping
  SYMBOL_TO_IMAGE_MAP: {
    ai_group_1: "rwr_flat_triangle_symbol",
    ai_group_2: "rwr_triangle_symbol",
    ai_group_3: "rwr_two_triangle_symbol",
    two: "rwr_two_symbol",
    two_bar: "rwr_two_slashed_symbol",
    three: "rwr_three_symbol",
    four: "rwr_four_symbol",
    five: "rwr_five_symbol",
    six: "rwr_six_symbol",
    seven: "rwr_seven_symbol",
    eight: "rwr_eight_symbol",
    nine: "rwr_nine_symbol",
    ten: "rwr_ten_symbol",
    eleven: "rwr_eleven_symbol",
    fifteen: "rwr_15_symbol",
    nineteen: "rwr_19_symbol",
    a_bar: "rwr_a_symbol",
    a_dot: "rwr_a_one_dot_symbol",
    a_two_dot: "rwr_a_two_dot_symbol",
    a_three_dot: "rwr_a_three_dot_symbol",
    c: "rwr_c_symbol",
    g: "rwr_g_symbol",
    h: "rwr_h_symbol",
    l: "rwr_l_symbol",
    p_bar: "rwr_p_slashed_symbol",
    r: "rwr_r_symbol",
    search: "rwr_s_symbol",
    unknown_low: "rwr_u_one_dot_symbol",
    unknown_medium: "rwr_u_two_dot_symbol",
    unknown_high: "rwr_u_three_dot_symbol",
    uncorrelated_missile_launch: "rwr_uncorr_msl"
  },

  // Source name mapping
  SOURCE_NAME_MAP: {
    ai_file_entries: "Air Intercept Table",
    new_land_file: "Land-based Radar Table",
    new_sea_file: "Sea-based Radar Table"
  },

  // Frequency band definitions
  FREQUENCY_BANDS: {
    HF: { min: 0.003, max: 0.03, name: "HF" },
    VHF: { min: 0.03, max: 0.3, name: "VHF" },
    UHF: { min: 0.3, max: 1, name: "UHF" },
    L: { min: 1, max: 2, name: "L" },
    S: { min: 2, max: 4, name: "S" },
    C: { min: 4, max: 8, name: "C" },
    X: { min: 8, max: 12, name: "X" },
    Ku: { min: 12, max: 18, name: "Ku" },
    K: { min: 18, max: 27, name: "K" },
    Ka: { min: 27, max: 40, name: "Ka" },
    V: { min: 40, max: 75, name: "V" },
    W: { min: 75, max: 110, name: "W" },
    mm: { min: 110, max: 300, name: "mm or G" }
  }
};

// Global application state
window.APP_STATE = {
  audioManager: null,
  dataLoader: null,
  soundDisplay: null,
  symbolFilter: null,
  soundMeta: [],
  groupsData: {},
  alr46Info: {},
  radarSymbolMap: {},
  selectedSymbols: new Set(),
  collapsedGroups: [],
  currentPlayAllSession: 0
};