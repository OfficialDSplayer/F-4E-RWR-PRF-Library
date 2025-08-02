// Configuration constants
const Config = {
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
    unknown_low: "rwr_u_one_dot_symbol", // 2-4 GHz
    unknown_medium: "rwr_u_two_dot_symbol", // 4-8 GHz
    unknown_high: "rwr_u_three_dot_symbol", // 8-20 GHz
    uncorrelated_missile_launch: "rwr_uncorr_msl",
  },

  SOURCE_NAME_MAP: {
    ai_file_entries: "Air Intercept Table",
    new_land_file: "Land-based Radar Table",
    new_sea_file: "Sea-based Radar Table",
  },

  API_ENDPOINTS: {
    WAV_LIST: "jsons/wav_list.json",
    CUSTOM_WAV_LIST: "jsons/custom_wav_list.json",
    GROUPS: "jsons/groups.json",
    CUSTOM_GROUPS: "jsons/groups_custom.json",
    ALR46_THREAT_INFO: "jsons/alr_46_threat_info.json",
    ALR46_THREAT_INFO_CUSTOM: "jsons/alr_46_threat_info_custom.json",
    EMITTER_ID_DATA: "jsons/emitter_id_data.json",
    EMITTER_ID_DATA_CUSTOM: "jsons/emitter_id_data_custom.json"
  }
};