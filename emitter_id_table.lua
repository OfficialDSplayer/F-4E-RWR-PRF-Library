HIGHEST_PRIORITY = 100 --100% Higher can be set if required
LOWEST_PRIORITY = 0.1 --0.1%

function AppendTrackRadars( file_table, unit, symbol1, symbol2, priority, alt_type )

    if units[unit] == nil then
        return
    end

    for i,v in ipairs(units[unit].radars) do
        -- Check if Radar exists
        if radars[v] ~= nil then
            -- If Radar exists add it to the list if it can track
            if radars[v].type == TRACK_ONLY or radars[v].type == SEARCH_AND_TRACK then

                local found = false
                -- Check if it already exists
                for _, record in ipairs(file_table) do
                    if record[1] == v then
                        found = true
                        break
                    end
                end

                if not found then
                    table.insert(file_table, {v, symbol1, symbol2, priority, alt_type})
                end
            end 
        end
    end


end


TYPE_NIL = 0 -- No change in priority
TYPE_AAA = 1 -- Prioritised in Low Alt
TYPE_SAM = 2 -- Prioritised with Low Alt off.

local function append_entries(file, entries)
    for i,v in ipairs(entries) do
        table.insert(file, v)
    end
end

-- Airborne Intercept entries present in both sea and land files
local ai_file_entries = {
    -- AWACS
    {"Shmel",               "ai_group_1",       "ai_group_1",   1,          TYPE_NIL}, -- A-50
    {"AN/APS-138",          "ai_group_1",       "ai_group_1",   1,          TYPE_NIL}, -- E-2
    {"AN_APY_1",            "ai_group_1",       "ai_group_1",   1,          TYPE_NIL}, -- E-3
    --{"AESA_KJ2000_1",       "ai_group_1",       "ai_group_1",   1,          TYPE_NIL}, -- KJ-2000, not detectable by ALR-46

    -- Potential Modern Threats
    {"AN/APG-71",           "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- F-14
    {"AN/APG-63",           "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- F-15C
    {"AN_APG_70",           "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- F-15E
    {"AN/APG-68",           "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- F-16
    {"AN/APG-73",           "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- F-18C
    {"KLJ-7",               "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- Jeff
    {"RDI",                 "ai_group_2",       "ai_group_2",   28,         TYPE_NIL}, -- M-2000C
    {"N-019",               "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- MiG-29
    {"N_001",               "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- SU-27
    {"BRLS-8B",             "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- MiG-31
    {"ARI 23274",           "ai_group_2",       "ai_group_2",   30,         TYPE_NIL}, -- Tornado IDS/GR4

    -- Potential Threats
    {"AIDA_2",              "ai_group_3",       "ai_group_3",   26,         TYPE_NIL}, -- F-1Ax
    {"RDY",                 "ai_group_3",       "ai_group_3",   26,         TYPE_NIL}, -- F-1Cx
    {"PS-37A",              "ai_group_3",       "ai_group_3",   22,         TYPE_NIL}, -- AJS37
    {"AN/APQ-120",          "ai_group_3",       "ai_group_3",   26,         TYPE_NIL}, -- F-4E
    {"RP_5_track",          "ai_group_3",       "ai_group_3",   25,         TYPE_NIL}, -- MiG-19
    {"RP_22SMA",            "ai_group_3",       "ai_group_3",   25,         TYPE_NIL}, -- MiG-21
    {"N-008",               "ai_group_3",       "ai_group_3",   28,         TYPE_NIL}, -- MiG-23
    {"N-005",               "ai_group_3",       "ai_group_3",   28,         TYPE_NIL}, -- MiG-23
    {"AN/APQ-159",          "a_bar",            "ai_group_3",   26,         TYPE_NIL}, -- F-5E-3

    -- Missiles
    {"AIM_120_Seeker", "uncorrelated_missile_launch", "uncorrelated_missile_launch", 32, TYPE_NIL}, -- AIM-120
    {"AIM_54_Seeker", "uncorrelated_missile_launch", "uncorrelated_missile_launch", 32, TYPE_NIL},  -- AIM-54
    {"R-77_Seeker", "uncorrelated_missile_launch", "uncorrelated_missile_launch", 32, TYPE_NIL},    -- R-77
}


-- Table Limit is 64 Entries
-- RADAR - Radar Characteristics to be put into table, it is radar name not unit name, see rwr.lua
-- Symbol One/Two, Symbols to alternate between, Choose the same where there is no ID ambiguity.
-- Priority 1 - 32, 32 is most Dangerous
-- Alt Type - Defines what is prioritised with the Low Alt Setting
new_land_file = {
    --|RADAR                | Symbol One        | Symbol Two    | Priority  | Alt Type
    {"fan_song",            "two",              "two",          26,         TYPE_SAM},
    {"amazonka",            "two_bar",          "two_bar",      22,         TYPE_SAM},
    {"snr s-125 tr",        "three",            "three",        26,         TYPE_SAM},
    {"RPC S-200 TR",        "five",             "five",         23,         TYPE_SAM},
    {"sa_6_TR",             "six",              "six",          23,         TYPE_SAM},
    {"HQ-7 TR",             "seven",            "seven",        23,         TYPE_SAM},
    {"Osa 9A33 ln",         "eight",            "eight",        26,         TYPE_SAM},
    {"S-300PS 40B6M tr",    "ten",              "ten",          23,         TYPE_SAM},
    {"SA-11 Buk TR",        "eleven",           "eleven",       23,         TYPE_SAM},
    {"Tor 9A331",           "fifteen",          "fifteen",      26,         TYPE_SAM},
    {"2S6 Tunguska",        "nineteen",         "nineteen",     26,         TYPE_SAM},
    {"Hawk tr",             "h",                "h",            26,         TYPE_SAM},
    {"Rapier_Blindfire",    "r",                "r",            26,         TYPE_SAM},
    {"Roland ADS",          "r",                "r",            26,         TYPE_SAM},
    {"AN_MPQ_53",           "p_bar",            "p_bar",        23,         TYPE_SAM},

    {"ZSU-23-4 Shilka",     "a_bar",            "ai_group_3",   26,          TYPE_AAA},
    {"son-9 tr",            "a_dot",            "a_dot",        26,          TYPE_AAA},
    {"Gepard",              "a_three_dot",      "a_three_dot",  26,          TYPE_AAA},
    {"C_RAM_Phalanx_Track", "a_three_dot",      "a_three_dot",  26,          TYPE_AAA},


    -- Search
    {"Kub 1S91 str",        "search",           "search",       1,          TYPE_NIL},
    {"Roland Radar",        "search",           "search",       1,          TYPE_NIL},
    {"C_RAM_Phalanx",       "search",           "search",       1,          TYPE_NIL},
    {"Dog Ear radar",       "search",           "search",       1,          TYPE_NIL},
    {"HQ-7 SR",             "search",           "search",       1,          TYPE_NIL},
    {"Hawk_cwar",           "search",           "search",       1,          TYPE_NIL},
    --{"Hawk sr",             "search",           "search",       1,          TYPE_NIL}, -- Not detectable by ALR-46
    {"NASAMS_Radar_MPQ64F1","search",           "search",       1,          TYPE_NIL},
    {"RLS_19J6",            "search",           "search",       1,          TYPE_NIL},
    {"Rapier_Dagger",       "search",           "search",       1,          TYPE_NIL},
    {"SA_11_Snow_Drift",    "search",           "search",       1,          TYPE_NIL},
    {"S-300PS 40B6MD sr",   "search",           "search",       1,          TYPE_NIL},
    {"Big_bird",            "search",           "search",       1,          TYPE_NIL},
    -- END
}

append_entries(new_land_file, ai_file_entries)

new_sea_file = {
    --|RADAR                | Symbol One        | Symbol Two    | Priority  | Alt Type

    -- Search
    {"Head_Net_1",          "search",           "search",       1,          TYPE_NIL},
    {"Head_Net_2",          "search",           "search",       1,          TYPE_NIL},
    {"Cross_Sword_S",       "search",           "search",       1,          TYPE_NIL},
    --{"Cross_Sword_T",       "search",           "search",       1,          TYPE_NIL},
    --{"Type_1022",           "search",           "search",       1,          TYPE_NIL},
    {"Type_992",            "search",           "search",       1,          TYPE_NIL},
    {"Type_1006",           "search",           "search",       1,          TYPE_NIL},
    --{"Type_965",            "search",           "search",       1,          TYPE_NIL},
    {"Type_992Q",           "search",           "search",       1,          TYPE_NIL},
    --{"Big_Net",             "search",           "search",       1,          TYPE_NIL},
    --{"Top_Sail",            "search",           "search",       1,          TYPE_NIL},
    {"Top_Steer",           "search",           "search",       1,          TYPE_NIL},
    {"Palm_Frond",          "search",           "search",       1,          TYPE_NIL},
    --{"Top_Plate_L",         "search",           "search",       1,          TYPE_NIL},
    {"Top_Plate_S",         "search",           "search",       1,          TYPE_NIL},
    {"MR_350",              "search",           "search",       1,          TYPE_NIL},
    {"Strut_Curve",         "search",           "search",       1,          TYPE_NIL},
}

AppendTrackRadars(new_sea_file, "REZKY",            "four",     "four",     26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "ALBATROS",         "four",     "four",     26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "PIOTR",            "six",      "six",      26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "MOSCOW",           "six",      "six",      26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "Type_052C",        "six",      "six",      26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "Type_054A",        "seven",    "seven",    26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "Type_052B",        "seven",    "seven",    26, TYPE_SAM )

AppendTrackRadars(new_sea_file, "NEUSTRASH",        "nine",     "nine",     26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "KUZNECOW",         "nine",     "nine",     26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "CV_1143_5",        "nine",     "nine",     26, TYPE_SAM )

AppendTrackRadars(new_sea_file, "CVN_71",           "c",        "c",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "CVN_72",           "c",        "c",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "CVN_73",           "c",        "c",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "CVN_75",           "c",        "c",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "Stennis",          "c",        "c",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "Forrestal",        "c",        "c",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "LHA_Tarawa",       "c",        "c",        26, TYPE_SAM )

AppendTrackRadars(new_sea_file, "PERRY",            "g",        "g",        26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "La_Combattante_II","a_dot",    "a_dot",    26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "Type_071",         "a_two_dot","a_two_dot",26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "leander-gun-condell","a_two_dot","a_two_dot",26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "leander-gun-lynch","a_two_dot","a_two_dot",26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "BDK-775",          "a_three_dot","a_three_dot",26, TYPE_SAM )

AppendTrackRadars(new_sea_file, "leander-gun-achilles","l",     "l",     26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "leander-gun-andromeda","l",     "l",     26, TYPE_SAM )
AppendTrackRadars(new_sea_file, "leander-gun-ariadne", "l",     "l",     26, TYPE_SAM )


AppendTrackRadars(new_sea_file, "TICONDEROG",       "p_bar",    "p_bar",    30, TYPE_SAM )
AppendTrackRadars(new_sea_file, "USS_Arleigh_Burke_IIa","p_bar","p_bar",    30, TYPE_SAM )

append_entries(new_sea_file, ai_file_entries)


new_training_file = {

}

-- ========== JESTER RWR Calls ==========

symbol_to_jester_phrase_land_file = {
    two = "SAM/satwo",
    two_bar = "SAM/satwo",
    three = "SAM/sathree",
    -- five = "SAM/safive", -- TODO: add phrase
    six = "SAM/sasix",
    -- seven = "SAM/saseven", -- TODO: add phrase
    eight = "SAM/saeight",
    ten = "SAM/saten",
    eleven = "SAM/saeleven",
    fifteen = "SAM/safifteen",
    nineteen = "SAM/sanineteen",
    h = "SAM/hawk",
    r = "SAM",
    -- r = "rapier", -- TODO: add phrase
    -- r = "roland", -- TODO: use when rapier phrase added
    p_bar = "SAM/patriot",
    -- a_bar = "SAM/shilka", -- commented out for now as it's clashing with F-5 radar
    -- a_bar = "aircraft/ffive"
    a_dot = "SAM/aaa",
    a_three_dot = "SAM/aaa",
    -- a_three_dot = "SAM/gepard", -- TODO: use when phalanx phrase added
    -- a_three_dot = "SAM/phalanx", -- TODO: add phrase
    ai_group_1 = "aircraft",
    ai_group_2 = "aircraft",
    ai_group_3 = "aircraft",
    ai_group_4 = "aircraft",
    search = "SAM",
}

symbol_to_jester_phrase_sea_file = {
    search = "SAM",
    four = "SAM",
    six = "SAM",
    seven = "SAM",
    nine = "SAM",
    c = "SAM",
    g = "SAM",
    a_dot = "SAM",
    a_two_dot = "SAM",
    a_three_dot = "SAM",
    l = "SAM",
    p_bar = "SAM",
    ai_group_1 = "aircraft",
    ai_group_2 = "aircraft",
    ai_group_3 = "aircraft",
    ai_group_4 = "aircraft",
}

symbol_to_jester_phrase_training_file = {

}
