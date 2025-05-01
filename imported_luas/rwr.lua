dofile(LockOn_Options.script_path.."Scripts/RWR/radars.lua")
dofile(LockOn_Options.script_path.."Scripts/RWR/rwr_utils.lua")
dofile(LockOn_Options.script_path.."Scripts/deepcopy.lua")


-- Schema
-- name -> DCS object name
-- radars -> list of radars this unit has
--      radar name (optional)
--      band -> Carrier frequency, GHz
--      beam_height -> Angular height of the beam, degrees
--      beam_width -> Angular width of beam, degrees
--      antenna_speed -> Rotation Speed of Antenna in degrees/second
--      search_pattern -> How the antenna moves in search mode
--                        {az, el, instant} Are waypoints which will be scanned at the antenna_speed
--                        Because it's ambiguous how the antenna would move once you get to the last point
--                        The antenna will simply teleport back to the start so please make sure your
--                        paths are continuous (ie they start and end at the same point).
--                        Instant (true | false) says starting with this point the radar moves instantly to the next point. This is to
--                        approximate radars speeding up to do the vertical movement on bars. It can be omitted for non instant legs.
--		scan_pattern -> How the beam scans at the given antenna direction, used for AESA and frequency scanning radars.
--                      {type=<SCAN_PATTERN_AESA|SCAN_PATTERN_FREQ>, azimuth = <sector width (degrees)>, elevation = <sector height (degrees)>, dwell_time = <dwell time in ms>}.
--						NOTE: dwell_time must be greater than 5 ms due to aliasing.
--                      If elevation or azimuth are nil the AESA will be a partial AESA and only randomly move the beam in the defined direction, if both are
--                      nil then the scan_pattern is ignored.
--      relative_pattern (optional) -> How the antenna moves relative to the beam axis. Think for conscan/sweeping
--	        			type -> conscan, sweep in either elevation or azimuth
--	        			offset_angle -> angle from antenna axis
--	        			frequency -> rate that the antenna performs this action frequency of the full cycle not the antenna passing through the axis
--      prf_search -> pulse repetition frequency while searching in Hz
--      prf_track -> pulse repetition frequency while tracking in Hz
--      peak_power -> Peak power of the radar in kW
--      antenna_gain -> Isotropic Gain of the antenna (dbi)
--      type ->specifies whether this radar is search, search and track or just track
--		relevant_range -> used for symbol positioning on the scope


-- Bands in GHz
-- Use these when you know the band but not the exact carrier frequency
BAND_L = 1.5
BAND_S = 3.0
BAND_C = 6.0
BAND_X = 10.0
BAND_Ku = 15.0
BAND_K = 22.5
BAND_V = 57.5

REL_CONSCAN = 0
REL_SWEEP_EL = 1
REL_SWEEP_AZ = 2

SEARCH_ONLY = 0
SEARCH_AND_TRACK = 1
TRACK_ONLY = 2
FIXED_ANTENNA = 3 -- Fixes antenna to forwards (for range only radars)

SCAN_PATTERN_NONE = 0
SCAN_PATTERN_AESA = 1
SCAN_PATTERN_FREQ = 2

--

CW_PRF = 20000

aesa_dwell_time = 5		-- ms

-- math.randomseed(821967)		-- Makes the random stuff the same for everyone


-- Give unit a radar
function ReplaceTypes()

    local radar_types = {
        ["SEARCH_ONLY"] = SEARCH_ONLY,
        ["SEARCH_AND_TRACK"] = SEARCH_AND_TRACK,
        ["TRACK_ONLY"] = TRACK_ONLY,
    }

    for i,v in pairs(radars) do
        type_str = v.type
        v.type = radar_types[type_str]
    end
end
ReplaceTypes()



---------------     Ground     ---------------

CreateRadar("fan_song",{ 				-- SA-2 Fan Song
    type = TRACK_ONLY,
    band = 4.950,
    beam_height = 1.7,
    beam_width = 1.7,
    antenna_speed = 92.8,
	search_pattern = { 	{ -2.9, 0 },	--7.5 deg total
						{  2.9, 0 },
						{ -2.9, 0 } },
    prf_search = 1750,
    prf_track = 3575,
    peak_power = 750,
    antenna_gain = 42,
	relevant_range = 43000*2,
    has_cd_command_guidance = true,
})
ReplaceUnitRadar("SNR_75V", "snr s-125 tr", "fan_song")

CreateRadar("amazonka", {
	type = SEARCH_AND_TRACK,
    band = 11.488,
    beam_width = 0.9,
    beam_height = 1.2,
	antenna_speed = 69,
	search_pattern = { 	{ 0, 0 },
						{ 0, 0 } 
						},
    prf_search = 1500,
    prf_track = 1500,
    peak_power = 500.0,
    antenna_gain = 46.0,
	relevant_range = 43000*2,
})
ReplaceUnitRadar("RD_75", "snr s-125 tr", "amazonka")

CreateRadar("Hawk_cwar", {
	type = SEARCH_ONLY,
    band = 14.536,
	beam_width = 0.6,
    beam_height = 8,
	antenna_speed = 120,
    prf_search = CW_PRF,
    prf_track = CW_PRF,
    peak_power = 0.4,
    antenna_gain = 39,
	search_pattern = PatternRotating(3),
	relevant_range = 45000*2,
})
ReplaceUnitRadar("Hawk cwar", "Hawk sr", "Hawk_cwar")

OverrideRadar("Hawk sr", {				-- AN/MPQ-50
    type = SEARCH_ONLY,
    band = 1.27,
	beam_width = 2.5,
    beam_height = 45,
    antenna_speed = 120,
    search_pattern = PatternRotating(45/2),
    prf_search = 800,
    prf_track = 800,
    peak_power = 550,
    antenna_gain = 26,
	relevant_range = 45000*2,
})

OverrideRadar("Hawk tr", {				-- AN/MPQ-46
    type = TRACK_ONLY,
    band = 10.125,
	beam_width = 1.7,
    beam_height = 1.7,
    antenna_speed = 120,
	search_pattern = { 	{ 0, 0 },	
						{ 0, 0 }
						},
    prf_search = CW_PRF,
    prf_track = CW_PRF,
    peak_power = 3,
    antenna_gain = 42,
	relevant_range = 45000*2,
})

OverrideRadar("Mys-M1_SR", {			-- Mys-M1
    type = SEARCH_ONLY,
    band = 10.611,
	beam_width = 1,
    beam_height = 20,
    antenna_speed = 36,
	search_pattern = PatternRotating(9.5),
    prf_search = 600,
    prf_track = 600,
    peak_power = 200,
    antenna_gain = 33,
})

OverrideRadar("snr s-125 tr", {			-- SA-3
    type = TRACK_ONLY,
    band = 9.250,
	beam_width = 1,
    beam_height = 1,
    antenna_speed = 375,
	search_pattern = { 	{ 0, 0 },
						{ 0, 0 } },
    prf_search = 1750,
    prf_track = 3575,
    peak_power = 210,
    antenna_gain = 46,
	relevant_range = 18000*2,
	has_cd_command_guidance = true,
})

OverrideRadar("p-19 s-125 sr", {		-- Flat Face
    type = SEARCH_ONLY,
    band = 0.870,
	beam_width = 4.5,
    beam_height = 13,
    antenna_speed = 72,
    search_pattern = PatternRotating(6),
    prf_search = 445,
    prf_track = 445,
    peak_power = 500,
    antenna_gain = 29,
	relevant_range = 100000,
})
CreateRadar("p_19_beam_2",{
	type = SEARCH_ONLY,
    band = 0.860,
    beam_width = 4.5,
    beam_height = 13,
    antenna_speed = 72,
    search_pattern = PatternRotating(17.5),
    prf_search = 445,
    prf_track = 445,
    peak_power = 500,
    antenna_gain = 29,
	relevant_range = 100000,
})
AddUnitRadar("p-19 s-125 sr","p_19_beam_2")
-- 					*--* 					--

OverrideRadar("son-9 tr", {				-- Son-9
    type = SEARCH_AND_TRACK,
    band = 2.730,
    beam_height = 5,
    beam_width = 5,
    antenna_speed = 144.0,
    search_pattern = PatternRotating(1),

    --relative_pattern = {
        --type = REL_CONSCAN,
        --offset_angle = 4.0,
        --frequency = 24.0,
    --},

    prf_search = 1875,
    prf_track = 1875,
    peak_power = 250.0,
    antenna_gain = 32.0,
	relevant_range = 20000*2,
})

OverrideRadar("Kub 1S91 str", {			-- SA-6
    type = SEARCH_AND_TRACK,			-- Search
    band = 8.550,
	beam_width = 1,
    beam_height = 20,
    antenna_speed = 90.0,
    search_pattern = PatternRotating(10),
    prf_search = 2000,
    prf_track = 2000,
    peak_power = 600,
    antenna_gain = 33,
	relevant_range = 80000*2,
})
CreateRadar("sa_6_TR",{
	type = TRACK_ONLY,				-- Track
    band = 9.060,
	beam_width = 1,
    beam_height = 1,
    antenna_speed = 90.0,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 2000,
    prf_track = 2000,
    peak_power = 270,
    antenna_gain = 46,
	relevant_range = 40000*2,
	has_cd_command_guidance = true, -- not confirmed
})
AddUnitRadar("Kub 1S91 str","sa_6_TR")
-- 					*--* 					--

OverrideRadar("Osa 9A33 ln", {			-- SA-8
    type = TRACK_ONLY,				-- Track
    band = 14.528,
	beam_width = 1,
    beam_height = 1,
    antenna_speed = 200,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 2800,
    prf_track = 2800,
    peak_power = 250,
    antenna_gain = 46,
	relevant_range = 13000*2,
    has_cd_command_guidance = true, -- not confirmed
})
CreateRadar("sa_8_Search_low",{			-- Lower/Small beam
	type = SEARCH_ONLY,
    band = 6.814,
	beam_width = 1.23,
    beam_height = 4,
    antenna_speed = 200.0,
    search_pattern = { 	{   0, 2 },	
						{ 360, 2, true},
						{   0, 6 },
						{ 360, 6, true },
						{   0, -89 },
						{ 360, -89 }, 
						},
    prf_search = 2800,  
    prf_track = 2800,
    peak_power = 250,
    antenna_gain = 39,
	relevant_range = 23000*2,
})
CreateRadar("sa_8_Search_high",{		-- Upper/large beam
	type = SEARCH_ONLY,
    band = 6.814,
	beam_width = 1.4,
    beam_height = 19,
    antenna_speed = 200.0,
    search_pattern = { 	{   0, -89 },	
						{ 360, -89, true },
						{   0, -89 },
						{ 360, -89, true },
						{   0, 17.5},
						{ 360, 17.5}, 
						},
    prf_search = 2800,
    prf_track = 2800,
    peak_power = 250,
    antenna_gain = 32,
	relevant_range = 23000*2,
})
AddUnitRadar("Osa 9A33 ln","sa_8_Search_low")
AddUnitRadar("Osa 9A33 ln","sa_8_Search_high")
-- 					*--* 					--

OverrideRadar("S-300PS 40B6MD sr", {	-- SA-10 - Clam Shell
    type = SEARCH_ONLY,
    band = 10.562,
	beam_width = 1,
    beam_height = 6,
    antenna_speed = 120,
    search_pattern = PatternRotating(2.5),
    prf_search = CW_PRF,
    prf_track = CW_PRF,
    peak_power = 1.4,
    antenna_gain = 38,
	relevant_range = 60000,
})

CreateRadar("Big_bird",{				-- SA-10 Big Bird	--
	type = SEARCH_ONLY,
    band = 2.217,
	beam_width = 1.3,
    beam_height = 1.3,
    antenna_speed = 30*2,	-- back-to-back antennas
    search_pattern = PatternRotating(25),
	scan_pattern = {
        type = SCAN_PATTERN_AESA,
        azimuth = 90,
        elevation = 60,
        dwell_time = aesa_dwell_time,
    },
    prf_search = 50000,
    prf_track = 50000,
    peak_power = 700,
    antenna_gain = 44,
	relevant_range = 160000,
})
ReplaceUnitRadar("S-300PS 64H6E sr", "S-300PS 40B6MD sr", "Big_bird")

OverrideRadar("S-300PS 40B6M tr",{		-- Flap Lid
	type = TRACK_ONLY,
    band = 14.516,
	beam_width = 1,
    beam_height = 1,
    antenna_speed = 30,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
	-- scan_pattern = {
        -- type = SCAN_PATTERN_AESA,
        -- azimuth = 50,
        -- elevation = 50,
        -- dwell_time = aesa_dwell_time,
    -- },
    prf_search = 100000,
    prf_track = 100000,
    peak_power = 150,
    antenna_gain = 46,
	relevant_range = 120000*2,
})
--					*--* 					--

CreateRadar("SA_11_Snow_Drift",{	-- Snow Drift
	type = SEARCH_ONLY,
    band = 7.674,
	beam_width = 3,
    beam_height = 3,
    antenna_speed = 30,
    search_pattern = PatternRotating(27.5),
    scan_pattern = {
		type = SCAN_PATTERN_AESA,
		azimuth = 90,
		elevation = 55,
		dwell_time = aesa_dwell_time,
	},
    prf_search = 30000,
    prf_track = 30000,
    peak_power = 150,
    antenna_gain = 37,
	relevant_range = 100000,
})
ReplaceUnitRadar("SA-11 Buk SR 9S18M1", "SA-11 Buk SR 9S18M1", "SA_11_Snow_Drift")

OverrideRadar("SA-11 Buk TR",{			-- Fire Dome
	type = TRACK_ONLY,
    band = 11.052,
	beam_width = 2.5,
    beam_height = 1.3,
    antenna_speed = 70,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 40000,
    prf_track = 40000,
    peak_power = 200,
    antenna_gain = 41,
	relevant_range = 35000*2,
})

-- CreateRadar("SA_11_TR_Illum",{			-- Fire Dome Illum
	-- type = TRACK_ONLY,
    -- band = 10.973,
	-- beam_width = 1.4,
    -- beam_height = 2.65,
    -- antenna_speed = 70,
    -- search_pattern = { 	{ 0, 0 },	
						-- { 0, 0 } },
    -- prf_search = CW_PRF,
    -- prf_track = CW_PRF,
    -- peak_power = 2,
    -- antenna_gain = 40,
	-- relevant_range = 35000*2,
-- })
-- AddUnitRadar("SA-11 Buk LN 9A310M1","SA_11_TR_Illum")

-- CreateRadar("Snap_Shot",{				-- SA-13	-- Not in unit list, won't work
	-- type = TRACK_ONLY,
    -- band = 25.814,
	-- beam_width = 1.3,
    -- beam_height = 1.3,
    -- antenna_speed = 30,
    -- search_pattern = { 	{ 0, 0 },	
						-- { 0, 0 } },
    -- prf_search = 4700,
    -- prf_track = 4700,
    -- peak_power = 50,
    -- antenna_gain = 44,
	-- relevant_range = 69420,
-- })
-- AddUnitRadar("Strela-10M3","Snap_Shot")

OverrideRadar("Dog Ear radar", {		-- Dog Ear
    band = 2.284,
	beam_width = 5.5,
    beam_height = 30,
    antenna_speed = 180.0,
    search_pattern = PatternRotating(14),
    prf_search = 1900,
    prf_track = 1900,
    peak_power = 200,
    antenna_gain = 24,
})

OverrideRadar("Tor 9A331", {			-- Scrum Half, track
	type = TRACK_ONLY,
	band = 7.314,
	beam_width = 1.5,
    beam_height = 1.5,
    antenna_speed = 180.0,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 1400,
    prf_track = 1400,
    peak_power = 100,
    antenna_gain = 43,
	relevant_range = 25000*2,
	has_cd_command_guidance = true, -- not confirmed
})

CreateRadar("Scrum_Half_Search_1",{		-- Scrum Half, Search
	type = SEARCH_ONLY,
    band = 3.094,
	beam_width = 3.5,
    beam_height = 4,
    antenna_speed = 360,
    search_pattern = { 	{   0, 2 },
						{ 360, 2, true },
						{   0, 2 },
						{ 360, 2, true },
						{   0, 6 },
						{ 360, 6, true } },
    prf_search = 1400,
    prf_track = 1400,
    peak_power = 150,
    antenna_gain = 35,
	relevant_range = 25000*2,
})
CreateRadarFromBase("Scrum_Half_Search_2", "Scrum_Half_Search_1")
OverrideRadar("Scrum_Half_Search_2", {
	band = 3.144,
	search_pattern = { 	{   0, 10 },
						{ 360, 10, true },
						{   0, 14 },
						{ 360, 14, true },
						{   0, 18 },
						{ 360, 18, true } },
})
CreateRadarFromBase("Scrum_Half_Search_3", "Scrum_Half_Search_1")
OverrideRadar("Scrum_Half_Search_3", {
	band = 3.044,
	search_pattern = { 	{   0, 22 },
						{ 360, 22, true },
						{   0, 26 },
						{ 360, 26, true },
						{   0, 30 },
						{ 360, 30, true } },
})
AddUnitRadar("Tor 9A331", "Scrum_Half_Search_1")
AddUnitRadar("Tor 9A331", "Scrum_Half_Search_2")
AddUnitRadar("Tor 9A331", "Scrum_Half_Search_3")
-- 					*--* 					--

OverrideRadar("2S6 Tunguska", {			-- Hot Shot, track
    type = TRACK_ONLY,
    band = 15.667,
	beam_width = 2.6,
    beam_height = 2.6,
    antenna_speed = 360,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 8300,
    prf_track = 8300,
    peak_power = 150,
    antenna_gain = 38,
})

CreateRadar("Hot_Shot_search",{
	type = SEARCH_ONLY,
    band = 2.273,
	beam_width = 4.5,
    beam_height = 15,
    antenna_speed = 360,
    search_pattern = PatternRotating(15/2 -.5),
    prf_search = 7500,
    prf_track = 7500,
    peak_power = 10,
    antenna_gain = 28,
	relevant_range = 18000*2,
})
AddUnitRadar("2S6 Tunguska","Hot_Shot_search")
-- 					*--* 					--

OverrideRadar("HQ-7 TR", {				-- HQ-7 TR
    band = 17.423,
	beam_width = 1.1,
    beam_height = 1.1,
    antenna_speed = 360,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 7200,
    prf_track = 7200,
    peak_power = 30,
    antenna_gain = 45,
	relevant_range = 15000*2,
})

OverrideRadar("HQ-7 SR", {				-- HQ-7 SR
    band = 2.257,
	beam_width = 2.8,
    beam_height = 27,
    antenna_speed = 360,
    search_pattern = PatternRotating(27/2 -.2),
    prf_search = 1600,
    prf_track = 1600,
    peak_power = 40,
    antenna_gain = 28,
	relevant_range = 30000,
})


OverrideRadar("ZSU-23-4 Shilka", {		-- ZSU-23-4
    band = 16.539,
	beam_width = 2,
    beam_height = 2,
    antenna_speed = 20,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 1800,
    prf_track = 3600,
    peak_power = 110,
    antenna_gain = 40,
	relevant_range = 5000*2,
})

OverrideRadar("NASAMS_Radar_MPQ64F1", {	-- AN/MPQ-64F1
    band = 10.925,
	beam_width = 2.1,
    beam_height = 1.9,
    antenna_speed = 180,
    search_pattern = PatternRotating(17.5),
    scan_pattern = {
		type = SCAN_PATTERN_AESA,
		azimuth = 90,
		elevation = 65,
		dwell_time = aesa_dwell_time,
	},
    prf_search = 80000,
    prf_track = 80000,
    peak_power = 23,
    antenna_gain = 40,
	relevant_range = 25000*2,
})

CreateRadar("Rapier_Dagger", {			-- Dagger
    type = SEARCH_ONLY,
	band = 4.063,
	beam_width = 11,
    beam_height = 30,
    antenna_speed = 360,
    search_pattern = PatternRotating(30/2 -.5),
    prf_search = 4500,
    prf_track = 4500,
    peak_power = 10,
    antenna_gain = 21,
	relevant_range = 10000*2,
})
ReplaceUnitRadar("rapier_fsa_launcher", "Roland Radar", "Rapier_Dagger")

CreateRadar("Rapier_Blindfire", {		-- Blindfire
    type = TRACK_ONLY,
	band = 38.694,
	beam_width = 0.5,
    beam_height = 1.1,
    antenna_speed = 360,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 8000,
    prf_track = 8000,
    peak_power = 40,
    antenna_gain = 49,
	relevant_range = 10000*2,
})
ReplaceUnitRadar("rapier_fsa_blindfire_radar", "Tor 9A331", "Rapier_Blindfire")

CreateRadar("AN_MPQ_53", {				-- AN/MPQ-53
    type = SEARCH_AND_TRACK,
	band = 7.374,
	beam_width = 1.4,
    beam_height = 1.4,
    antenna_speed = 120,
    search_pattern = { 	{ 0, 32.5 },	
						{ 0, 32.5 } },
    scan_pattern = {
		type = SCAN_PATTERN_AESA,
		azimuth = 95,
		elevation = 65,
		dwell_time = aesa_dwell_time,
	},
    prf_search = 60000,
    prf_track = 75000,
    peak_power = 10,
    antenna_gain = 43,
	relevant_range = 110000*2,
})
ReplaceUnitRadar("Patriot str", "Patriot str", "AN_MPQ_53")

OverrideRadar("Roland ADS", {			-- Roland, track
    type = TRACK_ONLY,
	band = 16.350,
	beam_width = 2.6,
    beam_height = 1.1,
    antenna_speed = 360,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 6500,
    prf_track = 6500,
    peak_power = 10,
    antenna_gain = 42,
	relevant_range = 12000*2,
})

CreateRadar("Roland_MPDR_16", {			-- Roland, search
    type = SEARCH_ONLY,
	band = 1.132,
	beam_width = 4.8,
    beam_height = 30,
    antenna_speed = 360,
    search_pattern = PatternRotating(30/2 -.2),
    prf_search = 6500,
    prf_track = 6500,
    peak_power = 10,
    antenna_gain = 42,
	relevant_range = 12000*2,
})
AddUnitRadar("Roland ADS", "Roland_MPDR_16")

OverrideRadar("Roland Radar", {			-- Roland EWR
    type = SEARCH_ONLY,
	band = 2.358,
	beam_width = 1.1,
    beam_height = 45,
    antenna_speed = 240,
    search_pattern = PatternRotating(45/2 -.2),
    prf_search = 5000,
    prf_track = 5000,
    peak_power = 10,
    antenna_gain = 30,
	relevant_range = 35000,
})

OverrideRadar("Gepard", {				-- Gepard, track
    type = TRACK_ONLY,
	band = 16.013,
	beam_width = 2.4,
    beam_height = 2.4,
    antenna_speed = 240,
    search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = 10000,
    prf_track = 10000,
    peak_power = 10,
    antenna_gain = 39,
	relevant_range = 6000*2,
})
CreateRadar("MPDR_12",{
	type = SEARCH_ONLY,
	band = 1.132,
	beam_width = 4.8,
    beam_height = 30,
    antenna_speed = 360,
    search_pattern = PatternRotating(14),
    prf_search = 5000,
    prf_track = 5000,
    peak_power = 25,
    antenna_gain = 25,
	relevant_range = 6000*3,
})
AddUnitRadar("Gepard", "MPDR_12")

-- CreateRadar("VPS_2",{					-- Vulcan M-113		-- Not in unit list, won't work
	-- type = TRACK_ONLY,
	-- band = 9.225,
	-- beam_width = 4.1,
    -- beam_height = 4.3,
    -- antenna_speed = 360,
    -- search_pattern = { 	{ 0, 0 },	
						-- { 0, 0 } },
    -- prf_search = 19986,
    -- prf_track = 19986,
    -- peak_power = 1,
    -- antenna_gain = 33,
	-- relevant_range = 69420,
-- })
-- AddUnitRadar("Vulcan", "VPS_2")

OverrideRadar("1L13 EWR", {				-- Box Spring
    type = SEARCH_ONLY,
	band = 0.220,
	beam_width = 6,
    beam_height = 30,
    antenna_speed = 36,
    search_pattern = PatternRotating(30/2 -.2),
    prf_search = 300,
    prf_track = 300,
    peak_power = 140,
    antenna_gain = 24,
})

OverrideRadar("55G6 EWR", {				-- Tall Rack
    type = SEARCH_ONLY,
	band = 0.118,
	beam_width = 5,
    beam_height = 16,
    antenna_speed = 36,
    search_pattern = PatternRotating(16/2 -.2),
    prf_search = 200,
    prf_track = 200,
    peak_power = 500,
    antenna_gain = 27,
})

CreateRadar("FPS_117", {	-- AN/FPS-117
    type = SEARCH_ONLY,
	band = 1.260,
	beam_width = 3.4,
    beam_height = 2.7,
    antenna_speed = 36,
    search_pattern = PatternRotating(7),
    scan_pattern = {
		type = SCAN_PATTERN_AESA,
		azimuth = 30,
		elevation = 26,
		dwell_time = 10,
	},
    prf_search = 250,
    prf_track = 250,
    peak_power = 24.6,
    antenna_gain = 37,
	relevant_range = 470000,
})
ReplaceUnitRadar("FPS-117", 	 "FPS-117", "FPS_117")
ReplaceUnitRadar("FPS-117 Dome", "FPS-117", "FPS_117")

OverrideRadar("C_RAM_Phalanx", {		-- C-RAM
    type = SEARCH_ONLY,
    band = 13.341,
	beam_width = 2.5,
    beam_height = 24,
    antenna_speed = 540,
	search_pattern = { 	{ -180, 11 },	
						{  180, 11 }
						},
    prf_search = 12000,
    prf_track = 18000,
    peak_power = 30,
    antenna_gain = 31,
	relevant_range = 6000*2,
})
CreateRadarFromBase("C_RAM_Phalanx_search_2", "C_RAM_Phalanx")
OverrideRadar("C_RAM_Phalanx_search_2",{
	search_pattern = PatternRotating(34),
})
CreateRadarFromBase("C_RAM_Phalanx_search_3", "C_RAM_Phalanx")
OverrideRadar("C_RAM_Phalanx_search_3",{
	search_pattern = PatternRotating(57),
})
CreateRadarFromBase("C_RAM_Phalanx_Track", "C_RAM_Phalanx")
OverrideRadar("C_RAM_Phalanx_Track",{
	type = TRACK_ONLY,
	search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    antenna_gain = 41,
})
AddUnitRadar("HEMTT_C-RAM_Phalanx","C_RAM_Phalanx_search_2")
AddUnitRadar("HEMTT_C-RAM_Phalanx","C_RAM_Phalanx_search_3")
AddUnitRadar("HEMTT_C-RAM_Phalanx","C_RAM_Phalanx_Track")
-- 					*--* 					--

OverrideRadar("RPC S-200 TR", {			-- SA-5
    type = TRACK_ONLY,
    band = 7.795,
	beam_width = 1.4,
    beam_height = 1.4,
    antenna_speed = 540,
	search_pattern = { 	{ 0, 0 },	
						{ 0, 0 } },
    prf_search = CW_PRF,
    prf_track = CW_PRF,
    peak_power = 100,
    antenna_gain = 49,
	relevant_range = 225000*2,
})

OverrideRadar("RLS_19J6", {				-- Tin Shield
    band = 3.050,
	beam_width = 0.5,
    beam_height = 6,
    antenna_speed = 36,
	search_pattern = { 	{ 0,   0 },	
						{ 360, 0, true },
						{ 0,   9 },
						{ 360, 9, true } },
    prf_search = 750,
    prf_track = 750,
    peak_power = 350,
    antenna_gain = 42,
})
CreateRadarFromBase("RLS_19J6_Beam_2","RLS_19J6")
OverrideRadar("RLS_19J6_Beam_2", {
	band = 3.150,
	search_pattern = { 	{ 0,   0 },	
						{ 360, 0, true },
						{ 0,   15},
						{ 360, 15, true} },
})
CreateRadarFromBase("RLS_19J6_Beam_3","RLS_19J6")
OverrideRadar("RLS_19J6_Beam_3", {
	band = 3.100,
	search_pattern = { 	{ 0,   0.2},	
						{ 360, 0.2, true},
						{ 0,   21},
						{ 360, 21, true} },
})
CreateRadarFromBase("RLS_19J6_Beam_4","RLS_19J6")
OverrideRadar("RLS_19J6_Beam_4", {
	band = 3.200,
	search_pattern = { 	{ 0,   0.2 },	
						{ 360, 0.2, true },
						{ 0,   27},
						{ 360, 27, true} },
})
AddUnitRadar("RLS_19J6", "RLS_19J6_Beam_2")
AddUnitRadar("RLS_19J6", "RLS_19J6_Beam_3")
AddUnitRadar("RLS_19J6", "RLS_19J6_Beam_4")
AddUnitRadar("S-300PS 40B6MD sr_19J6", "RLS_19J6_Beam_2")      -- Tin Shield on mast
AddUnitRadar("S-300PS 40B6MD sr_19J6", "RLS_19J6_Beam_3")      -- Tin Shield on mast
AddUnitRadar("S-300PS 40B6MD sr_19J6", "RLS_19J6_Beam_4")      -- Tin Shield on mast
-- 					*--* 					--


---------------     Aircraft     ---------------
OverrideRadar("PS-37A", {				-- AJS37
    type = SEARCH_ONLY,
    band = 9.050,
    beam_height = 8,
    beam_width = 8,
    antenna_speed = 110,
    search_pattern = BarScan(123, -1, 0, {1,1}),
    prf_search = 475,
    prf_track = 1900,
    peak_power = 200,
    antenna_gain = 28,
	relevant_range = 15000*2,
})

CreateRadar("AIDA_2", {					-- Mirage F1A
    type = SEARCH_AND_TRACK,
    band = 10.200,
    beam_height = 16,
    beam_width  = 16,
    antenna_speed = 95,
    search_pattern = {	{ 0, 0 },	
						{ 0, 0 } 
						},
    prf_search = 1200,
    prf_track  = 1200,
    peak_power = 90,
    antenna_gain = 18,
	relevant_range = 10000*2,
})
ReplaceUnitRadar("Mirage-F1AD", "RDY", "AIDA_2")
ReplaceUnitRadar("Mirage-F1AZ", "RDY", "AIDA_2")

OverrideRadar("RDY", {					-- Mirage F1C
    type = SEARCH_AND_TRACK,
    band = 9.300,
    beam_height = 4,
    beam_width  = 4,
    antenna_speed = 95,
    search_pattern = BarScan(114, 3, 2, {1,3,2,4}),
    prf_search = 660,
    prf_track  = 660,
    peak_power = 300,
    antenna_gain = 34,
	relevant_range = 20000*2,
})

CreateRadar("RP_5_track", {				-- MiG-19P
        type = TRACK_ONLY,
        band = 9.383,
		beam_width = 10,
        beam_height = 10,
        antenna_speed = 1080,
        search_pattern = { 	{ 0, 0 },	
							{ 0, 0 } 
							},
        prf_search = 2125,
        prf_track = 2125,
        peak_power = 75,
        antenna_gain = 26,
		relevant_range = 15000*2,
})
CreateRadar("RP_5_search", {						--
    type = SEARCH_AND_TRACK,
    band = 9.330,
	beam_width = 4.5,
    beam_height = 11.2,
    antenna_speed = 1080*2,		-- Two antennas back to back
    search_pattern = { 	{  0, -10.4},
						{360, -10.4, true}, 
						{  0, -6   }, 
						{360, -6  , true }, 
						{  0, -1.6 }, 
						{360, -1.6, true },
						{  0,  2.8 }, 
						{360,  2.8, true },
						{  0,  7.2 }, 
						{360,  7.2, true },
						{  0,  11.6}, 
						{360,  11.6, true},
						{  0,  16  }, 
						{360,  16, true  },
						{  0,  20.4}, 
						{360,  20.4, true} 
						},
    prf_search = 1990,
    prf_track = 1990,
    peak_power = 75,
    antenna_gain = 29,
	relevant_range = 12000*2,
})
ReplaceUnitRadar("MiG-19P", "N-008", "RP_5_search")
AddUnitRadar("MiG-19P", "RP_5_track")


OverrideRadar("AN/APS-138", {			-- E-2C
    type = SEARCH_ONLY,
    band = 0.430,
	beam_width = 6.6,
    beam_height = 20,
    antenna_speed = 30,
    search_pattern = PatternRotating(-20/2 +2),
    prf_search = 302,
    prf_track = 302,
    peak_power = 1000,
    antenna_gain = 25,
})
CreateRadarFromBase("AN/APS-138_2", "AN/APS-138")
OverrideRadar("AN/APS-138_2", {
	prf_search = 420,
})
CreateRadarFromBase("AN/APS-138_3", "AN/APS-138")
OverrideRadar("AN/APS-138_3", {
	prf_search = 760,
})
AddUnitRadar("E-2C", "AN/APS-138_2")
AddUnitRadar("E-2C", "AN/APS-138_3")
-- 					*--* 					--

CreateRadar("RP_22SMA", {				-- MiG-21BIS 	
    type = SEARCH_AND_TRACK,
    band = 13.049,
	beam_width = 2.8,	
    beam_height = 2.8,	
    antenna_speed = 200,
    search_pattern = BarScan_NS(53.2, 16.6, 1.8555, {1,2,4,6,8,10,9,7,5,3}),
    prf_search = 1650,
    prf_track = 1790,
    peak_power = 250,
    antenna_gain = 33,
	relevant_range = 20000*2,
})
ReplaceUnitRadar("MiG-21Bis", "N-008", "RP_22SMA")

CreateRadar("AN_APY_1", {		-- E-3
    type = SEARCH_ONLY,
    band = 2.520,
    beam_width = 0.9,
    beam_height = 3,
    antenna_speed = 72,
    search_pattern = PatternRotating(-12.5),
	scan_pattern = {
        type = SCAN_PATTERN_AESA,
        azimuth = 2,
        elevation = 35,
        dwell_time = aesa_dwell_time,
    },
    prf_search = 20000,
    prf_track = 20000,
    peak_power = 1000,
    antenna_gain = 42,
	relevant_range = 370000,
})
ReplaceUnitRadar("E-3A", "AN/APY-1", "AN_APY_1")

OverrideRadar("AN/APG-71", {			-- F-14
    type = SEARCH_AND_TRACK,
    band = 9.420,
    beam_height = 2.3,
    beam_width = 2.3,
    antenna_speed = 80,
    search_pattern = BarScan(130, 1.3, 1.3, {4,3,2,1}),
    prf_search = 250000,
    prf_track = 307000,
    peak_power = 10.2,
    antenna_gain = 39,
	relevant_range = 140000*2,
})

OverrideRadar("AN/APG-78", {			-- AH-64D
    type = SEARCH_ONLY,
    band = 34.934,
    beam_width = 0.6,
    beam_height = 5,
    antenna_speed = 68.5,
	search_pattern = BarScan(92.5, -2.7, 3, {1,2}),
    prf_search = 10000,
    prf_track = 10000,
    peak_power = 0.2,
    antenna_gain = 41,
})

OverrideRadar("AN/APQ-120", {			-- F-4E		
    type = SEARCH_AND_TRACK,
    band = 9.470,
    beam_height = 6.7,		-- 3.7 IRL, 6.7 with conscan
    beam_width 	= 6.7, 
    antenna_speed 	= 120,
    search_pattern 	= BarScan(120, 2, 3.75, {1,2}),
    prf_search 	= 330,
    prf_track 	= 330,
    peak_power 	= 165,
    antenna_gain = 35,
	relevant_range = 25000*2,
})
ReplaceUnitRadar("F-4E-45MC", "HB_ANAPQ_120", "AN/APQ-120")

-- CreateRadar("AN_APG_30", {			-- F-86		-- Not in unit list, won't work
    -- type = SEARCH_AND_TRACK,
    -- band = 9.080,
    -- beam_height = 18,
    -- beam_width 	= 18, 
    -- antenna_speed 	= 120,
    -- search_pattern 	= { { 0, 0},	
						-- { 0, 0}
						-- },
    -- prf_search 	= 600,
    -- prf_track 	= 600,
    -- peak_power 	= 200,
    -- antenna_gain = 19,
-- })
-- AddUnitRadar("F-86F Sabre", "AN_APG_30")

CreateRadar("ARI 23274", {			-- Tornado
    type = SEARCH_AND_TRACK,
    band = 16.275,
    beam_width 	= 2.6,
    beam_height = 2.6,
    antenna_speed 	= 90,
    search_pattern 	= BarScan(120, -1, 0, {1,1}),
    prf_search 	= 2200,
    prf_track 	= 3800,
    peak_power 	= 30,
    antenna_gain = 38,
	relevant_range = 15000*2,
})
ReplaceUnitRadar("Tornado GR4", "Tornado SS radar", "ARI 23274")
ReplaceUnitRadar("Tornado IDS", "Tornado SS radar", "ARI 23274")

OverrideRadar("AN/APQ-153", {			-- F-5E
    type = SEARCH_AND_TRACK,
    band = 9.320,
    beam_width 	= 5.2,
    beam_height = 7, 
    antenna_speed 	= 85,
    search_pattern 	= BarScan(90, 1, 3, {2,1}),
    prf_search 	= 2500,
    prf_track 	= 2500,
    peak_power 	= 80,
    antenna_gain = 28,
	relevant_range = 15000*2,
})

OverrideRadar("AN/APQ-159", {			-- F-5E-3
    type = SEARCH_AND_TRACK,
    band = 9.320,
    beam_width 	= 5,
    beam_height = 8, 
    antenna_speed 	= 85,
    search_pattern 	= BarScan(90, 1, 3, {2,1}),
    prf_search 	= 2500,
    prf_track 	= 2500,
    peak_power 	= 80,
    antenna_gain = 29,
	relevant_range = 15000*2,
})

OverrideRadar("AN/APG-63", {			-- F-15C
    type = SEARCH_AND_TRACK,
    band = 9.674,
    beam_height = 3,
    beam_width 	= 3, 
    antenna_speed 	= 70,
    search_pattern 	= BarScan(120, 1.3, 1.3, {4,3,2,1}),
    prf_search 	= 220000,
    prf_track 	= 22500,
    peak_power 	= 12.975,
    antenna_gain = 37,
	relevant_range = 90000*2,
})

CreateRadarFromBase("AN_APG_70", "AN/APG-63") -- F-15E
OverrideRadar("AN_APG_70", {
	band = 9.772,
})
ReplaceUnitRadar("F-15E", "AN/APG-63", "AN_APG_70")
ReplaceUnitRadar("F-15ESE", "AN/APG-63", "AN_APG_70")

OverrideRadar("AN/APG-68", {			-- F-16C
    type = SEARCH_AND_TRACK,
    band = 9.825,
	beam_width 	= 3.3,
    beam_height = 4.6,
    antenna_speed 	= 65,
    search_pattern 	= BarScan(120, 2.2, 2.2, {1,2,3,4}),
    prf_search 	= 300000,
    prf_track 	= 25000,
    peak_power 	= 17.5,
    antenna_gain = 34,
	relevant_range = 90000*2,
})

OverrideRadar("AN/APG-73", {			-- F-18C
    type = SEARCH_AND_TRACK,
    band = 9.016,
	beam_width 	= 3.3,
    beam_height = 3.3,
    antenna_speed 	= 62.5,
    search_pattern 	= BarScan(120, 1.3, 1.3, {4,3,2,1}),
    prf_search 	= 260000,
    prf_track 	= 24000,
    peak_power 	= 20,
    antenna_gain = 36,
	relevant_range = 90000*2,
})

OverrideRadar("KLJ-7", {				-- JF-17
    type = SEARCH_AND_TRACK,
    band = 9.743,
	beam_width 	= 3.1,
    beam_height = 3.9,
    antenna_speed 	= 60,
    search_pattern 	= BarScan(120, 1.5, 1.5, {4,3,2,1}),
    prf_search 	= 275000,
    prf_track 	= 28000,
    peak_power 	= 15,
    antenna_gain = 35,
	relevant_range = 90000*2,
})

CreateRadar("RDI", {					-- M2000C
    type = SEARCH_AND_TRACK,
    band = 9.796,
	beam_width 	= 3.5,
    beam_height = 3.5,
    antenna_speed 	= 100,
    search_pattern 	= BarScan(120, 3, 2.5, {4,3,2,1}),
    prf_search 	= 75000,
    prf_track 	= 22000,
    peak_power 	= 4,
    antenna_gain = 35,
	relevant_range = 50000*2,
})
ReplaceUnitRadar("M-2000C", "RDY", "RDI")

-- CreateRadar("AN_APG_53", {			-- A-4E
    -- type = SEARCH_ONLY,
    -- band = 9.126,
	-- beam_width 	= 5,
    -- beam_height = 5,
    -- antenna_speed 	= 60,
    -- search_pattern 	= BarScan(60, -6, 0, {1,1}),
    -- prf_search 	= 3000,
    -- prf_track 	= 3000,
    -- peak_power 	= 7,
    -- antenna_gain = 32,
-- })
-- AddUnitRadar("A-4E-C", "AN_APG_53")

OverrideRadar("Shmel", {				-- A-50
    band = 0.878,
	beam_width 	= 2.4,
    beam_height = 30,
    antenna_speed 	= 36,
    search_pattern 	= PatternRotating(-15),
    prf_search 	= 270,
    prf_track 	= 270,
    peak_power 	= 1000,
    antenna_gain = 28,
})

CreateRadar("AESA_KJ2000_1", {			-- KJ-2000
        type = SEARCH_ONLY,
        band = 1.351,
		beam_width 	= 1.5,
        beam_height = 5,
        antenna_speed 	= 5,
        search_pattern 	= { { 0, -17.5},	
							{ 0, -17.5}},
        scan_pattern = {
			type = SCAN_PATTERN_AESA,
			azimuth = 120,
			elevation = 45,
			dwell_time = aesa_dwell_time,
		},
        prf_search 	= 40000,
        prf_track 	= 40000,
        peak_power 	= 600,
        antenna_gain = 34,
		relevant_range = 420000,
})
ReplaceUnitRadar("KJ-2000", "AESA_KJ2000", "AESA_KJ2000_1")
CreateRadarFromBase("AESA_KJ2000_2", "AESA_KJ2000_1")
OverrideRadar("AESA_KJ2000_2",{
	band = 1.311,
	search_pattern 	= { { 120, -17.5},	
						{ 120, -17.5}},
})
CreateRadarFromBase("AESA_KJ2000_3", "AESA_KJ2000_1")
OverrideRadar("AESA_KJ2000_3",{
	band = 1.331,
	search_pattern 	= { { 240, -17.5},	
						{ 240, -17.5}},
})
AddUnitRadar("KJ-2000", "AESA_KJ2000_2")
AddUnitRadar("KJ-2000", "AESA_KJ2000_3")
-- 					*--* 					--

OverrideRadar("N-008", {				-- MiG-23
        type = SEARCH_AND_TRACK,
        band = 9.208,
		beam_width 	= 2.4,
        beam_height = 2.4,
        antenna_speed 	= 60,
        search_pattern 	= BarScan(60, 2, 2, {2,3,1,2,3,1}),
        prf_search 	= 1000,
        prf_track 	= 2500,
        peak_power 	= 40,
        antenna_gain = 39,
		relevant_range = 50000*2,
})

OverrideRadar("N-005", {				-- MiG-25
        type = SEARCH_AND_TRACK,
        band = 10.853,
		beam_width 	= 2.4,
        beam_height = 2.4,
        antenna_speed 	= 80,
        search_pattern 	= BarScan(120, 2, 2, {2,3,1,2,3,1}),
        prf_search 	 = 1200,
        prf_track 	 = 2300,
        peak_power 	 = 600,
        antenna_gain = 40,
		relevant_range = 40000*2,
})

OverrideRadar("N-019", {				-- MiG-29
        type = SEARCH_AND_TRACK,
        band = 10.718,
		beam_width 	= 3.5,
        beam_height = 3.5,
        antenna_speed 	= 57,
        search_pattern 	= { { -25, 3.0},	-- Front
							{  25, 3.0},
							{  25, 1.0},
							{ -25, 1.0},
							{ -25,-1.0},
							{  25,-1.0},
							{ -25,-3.0},
							{  25,-3.0},
							
							{ -65, 3.0},	-- Left
							{  15, 3.0},
							{  15, 1.0},
							{ -65, 1.0},
							{ -65,-1.0},
							{  15,-1.0},
							{ -65,-3.0},
							{  15,-3.0},
							
							{  15, 3.0},	-- Right
							{  65, 3.0},
							{  15, 1.0},
							{  65, 1.0},
							{  15,-1.0},
							{  65,-1.0},
							{  15,-3.0},
							{  65,-3.0}
							},
        prf_search 	 = 180000,
        prf_track 	 = 22000,
        peak_power 	 = 6.5,
        antenna_gain = 35,
		relevant_range = 60000*2,
})

ReplaceUnitRadar("MiG-29S", "N-019M", "N-019")

CreateRadarFromBase("N_001", "N-019")
OverrideRadar("N_001",{
		beam_width 	= 2,
        beam_height = 2,
        peak_power 	 = 4,
        antenna_gain = 40,
})
ReplaceUnitRadar("Su-27", "N-001", "N_001")
ReplaceUnitRadar("J-11A", "N-001", "N_001")

ReplaceUnitRadar("Su-30", "N-011M", "N_001")
ReplaceUnitRadar("Su-33", "N-001", 	"N_001")
ReplaceUnitRadar("Su-34", "N-011M", "N_001")

CreateRadarFromBase("AN_APS_124", "AN/APS-142")	-- SH-60B
OverrideRadar("AN_APS_124", {
	band = 9.171,
	beam_width = 1.2,
	beam_height = 20,
	prf_search = 940,
	search_pattern = PatternRotating(-8),
	antenna_speed = 72,
	antenna_gain = 32,
	peak_power = 350,
})
ReplaceUnitRadar("SH-60B", "AN/APS-142", "AN_APS_124")

OverrideRadar("Rubidy MM", {
	band = 2.910,
	beam_width = 2.5,
	beam_height = 30,
	prf_search = 416,
	search_pattern = BarScan(45, -15, 0, {1,1}),
	antenna_speed = 72,
	antenna_gain = 28,
	peak_power = 500,
})

OverrideRadar("PNA-D Leninets",{
	
	peak_power = 130,
	relevant_range = 300000*2,
})


---------------     Naval     ---------------

-- Radars
CreateRadar("Type_1022",{
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.218,
	beam_width 	= 2.3,
    beam_height = 20,
    antenna_speed 	= 36,
    search_pattern 	= PatternRotating(10),
    prf_search 	= 360,
    prf_track 	= 360,
    peak_power 	= 150,
    antenna_gain = 30,
	relevant_range = 410000,
})

CreateRadar("Type_909",{
	type = TRACK_ONLY,
    band = 7.314,
	beam_width 	= 1.5,
    beam_height = 1.5,
    antenna_speed 	= 360,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= CW_PRF,
    prf_track 	= CW_PRF,
    peak_power 	= 30,
    antenna_gain = 43,
	relevant_range = 70000,
})

CreateRadar("Type_992",{
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.472,
	beam_width 	= 2,
    beam_height = 15,
    antenna_speed 	= 180,
    search_pattern 	= PatternRotating(6),
    prf_search 	= 833,
    prf_track 	= 833,
    peak_power 	= 2000,
    antenna_gain = 40,
	relevant_range = 70000,
})

CreateRadar("Type_1006",{
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 9.445,
	beam_width 	= 0.8,
    beam_height = 8,
    antenna_speed 	= 180,
    search_pattern 	= PatternRotating(5),
    prf_search 	= 800,
    prf_track 	= 800,
    peak_power 	= 25,
    antenna_gain = 36,
	relevant_range = 60000,
})

CreateRadar("Type_965",{
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 0.104,
	beam_width 	= 12,
    beam_height = 40,
    antenna_speed 	= 60,
    search_pattern 	= PatternRotating(20),
    prf_search 	= 200,
    prf_track 	= 200,
    peak_power 	= 450,
    antenna_gain = 20,
	relevant_range = 370000,
})

CreateRadar("Type_992Q",{
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.298,
	beam_width 	= 1.2,
    beam_height = 15,
    antenna_speed 	= 180,
    search_pattern 	= PatternRotating(6),
    prf_search 	= 833,
    prf_track 	= 833,
    peak_power 	= 2000,
    antenna_gain = 38,
	relevant_range = 70000,
})

CreateRadar("Type_903",{
	type = TRACK_ONLY,
    band = 9.050,
	beam_width 	= 2,
    beam_height = 2,
    antenna_speed 	= 270,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 3000,
    prf_track 	= 3000,
    peak_power 	= 50,
    antenna_gain = 40,
	relevant_range = 30000,
	has_cd_command_guidance = true,
})

CreateRadar("Big_Net",{
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 0.838,
	beam_width 	= 3.4,
    beam_height = 15,
    antenna_speed 	= 36,
    search_pattern 	= PatternRotating(8),
    prf_search 	= 290,
    prf_track 	= 290,
    peak_power 	= 1000,
    antenna_gain = 29,
	relevant_range = 300000,
})

CreateFrqScanRadar("Top_Sail",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.701,
	beam_width 	= 2.3,
    beam_height = 1.9,
    antenna_speed 	= 36,
    search_pattern 	= frqScan(360, 2.3, -5, 55),
    prf_search 	= 30000,
    prf_track 	= 30000,
    peak_power 	= 600,
    antenna_gain = 40,
	relevant_range = 370000,
})

CreateRadar("Top_Steer",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.239,
	beam_width 	= 1.5,
    beam_height = 70,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(40),
    prf_search 	= 2200,
    prf_track 	= 2200,
    peak_power 	= 300,
    antenna_gain = 27,
	relevant_range = 150000,
})

CreateRadar("Palm_Frond",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 9.089,
	beam_width 	= 1.1,
    beam_height = 10,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(-3.5),
    prf_search 	= 3200,
    prf_track 	= 3200,
    peak_power 	= 20,
    antenna_gain = 36,
	relevant_range = 46000,
})

CreateRadarFromBase("Top_Dome", "S-300PS 40B6M tr")

CreateRadarFromBase("Pop_Group_T", "Osa 9A33 ln")

CreateRadar("Bass_Tilt",{	
	type = TRACK_ONLY,
    band = 10.777,
	beam_width 	= 2.2,
    beam_height = 2.2,
    antenna_speed 	= 90,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 10000,
    prf_track 	= 10000,
    peak_power 	= 30,
    antenna_gain = 39,
	relevant_range = 22000,
})

CreateFrqScanRadar("Top_Plate_L",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.218,
	beam_width 	= 3.0,
    beam_height = 3.7,
    antenna_speed = 90,
    search_pattern = frqScan(360, 3.0, -5, 55),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 60,
    antenna_gain = 36,
	relevant_range = 300000,
})

CreateFrqScanRadar("Top_Plate_S",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.463,
	beam_width 	= 1.5,
    beam_height = 2.4,
    antenna_speed = 90,
    search_pattern = frqScan(360, 1.5, -5, 55),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 60,
    antenna_gain = 40,
	relevant_range = 300000,
})

CreateRadar("MR_350",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 17.309,
	beam_width 	= 0.3,
    beam_height = 5,
    antenna_speed 	= 60*2,		-- Two antennas back to back
    search_pattern 	= PatternRotating(-1),
    prf_search 	= 1200,
    prf_track 	= 1200,
    peak_power 	= 30,
    antenna_gain = 44,
	relevant_range = 35000,
})

CreateRadar("Head_Net_1",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.810,
	beam_width 	= 1.2,
    beam_height = 40,
    antenna_speed 	= 72,		-- Two antennas back to back
    search_pattern 	= PatternRotating(0),
    prf_search 	 = 670,
    prf_track 	 = 670,
    peak_power 	 = 1000,
    antenna_gain = 44,
	relevant_range = 200000,
})
CreateRadarFromBase("Head_Net_2", "Head_Net_1")
OverrideRadar("Head_Net_2",{
	band = 2.780,
	search_pattern = {  {-180, 25},	
						{ 180, 25},
						{-180, 25}
						},
})

CreateRadar("Cross_Sword_S",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 6.599,
	beam_width 	= 1.5,
    beam_height = 4,
    antenna_speed 	= 180*2,		-- Two antennas back to back
    search_pattern 	= PatternRotating(-0.3),
    prf_search 	= 2600,
    prf_track 	= 2600,
    peak_power 	= 40,
    antenna_gain = 38,
	relevant_range = 45000,
})

CreateRadar("Cross_Sword_T",{		
	type = TRACK_ONLY,
    band = 26.989,
	beam_width 	= 0.6,
    beam_height = 0.4,
    antenna_speed 	= 180*2,		-- Two antennas back to back
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 1400,
    prf_track 	= 1400,
    peak_power 	= 100,
    antenna_gain = 52,
	relevant_range = 45000,
})

CreateRadar("Strut_Curve",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.884,
	beam_width 	= 1.4,
    beam_height = 5,
    antenna_speed 	= 36,
    search_pattern 	= PatternRotating(3),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 500,
    antenna_gain = 38,
	relevant_range = 280000,
})

CreateRadarFromBase("Strut_Pair_1", "Strut_Curve")
OverrideRadar("Strut_Pair_1",{
})
CreateRadarFromBase("Strut_Pair_2", "Strut_Curve")
OverrideRadar("Strut_Pair_2",{
	search_pattern 	= { {-180, 0},	
						{ 180, 0}
						},
})

CreateRadarFromBase("Tomb_Stone", "S-300PS 40B6M tr")
OverrideRadar("Tomb_Stone",{	
    band = 11.512,
    antenna_gain = 46,
})

CreateRadar("Hot_Flash_T",{		
	type = TRACK_ONLY,
    band = 26.339,
	beam_width 	= 1.4,
    beam_height = 0.6,
    antenna_speed 	= 36,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 9100,
    prf_track 	= 9100,
    peak_power 	= 150,
    antenna_gain = 47,
	relevant_range = 18000,
})

CreateRadar("Kite_Screech",{		
	type = TRACK_ONLY,
    band = 8.083,
	beam_width 	= 1.2,
    beam_height = 1.2,
    antenna_speed 	= 1/24,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 1700,
    prf_track 	= 3150,
    peak_power 	= 30,
    antenna_gain = 45,
	relevant_range = 75000,
})

CreateRadar("Muff_Cob",{		
	type = TRACK_ONLY,
    band = 6.544,
	beam_width 	= 2.5,
    beam_height = 2.5,
    antenna_speed 	= 1/24,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 1700,
    prf_track 	= 3150,
    peak_power 	= 30,
    antenna_gain = 38,
	relevant_range = 22000,
})

CreateRadar("Peel_Pair",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 10.665,
	beam_width 	= 1,
    beam_height = 20,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(10),
    prf_search 	= 800,
    prf_track 	= 800,
    peak_power 	= 80,
    antenna_gain = 33,
	relevant_range = 45000,
})

CreateRadar("AN_SPS_49",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.243,
	beam_width 	= 3.3,
    beam_height = 11,
    antenna_speed 	= 60,
    search_pattern 	= PatternRotating(6),
    prf_search 	= 800,
    prf_track 	= 800,
    peak_power 	= 280,
    antenna_gain = 31,
	relevant_range = 470000,
})

CreateRadar("AN_SPS_55",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 9.730,
	beam_width 	= 1.5,
    beam_height = 20,
    antenna_speed 	= 94.7,
    search_pattern 	= PatternRotating(10),
    prf_search 	= 750,
    prf_track 	= 750,
    peak_power 	= 130,
    antenna_gain = 33,
	relevant_range = 190000,
})

CreateRadar("AN_SPG_60",{		
	type = TRACK_ONLY,
    band = 11.509,
	beam_width 	= 1.2,
    beam_height = 1.2,
    antenna_speed 	= 94.7,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 27000,
    prf_track 	= 27000,
    peak_power 	= 5.5,
    antenna_gain = 44,
	relevant_range = 110000,
})

CreateRadar("BridgeMaster_E",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.050,
	beam_width 	= 2,
    beam_height = 30,
    antenna_speed 	= 48,
    search_pattern 	= PatternRotating(0),
    prf_search 	= 785,
    prf_track 	= 785,
    peak_power 	= 30,
    antenna_gain = 26,
	relevant_range = 180000,
})

CreateRadar("Mark_92_S",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 10.641,
	beam_width 	= 0.7,
    beam_height = 8,
    antenna_speed 	= 360,
    search_pattern 	= PatternRotating(5),
    prf_search 	= 1800,
    prf_track 	= 3600,
    peak_power 	= 200,
    antenna_gain = 39,
	relevant_range = 35000,
})

CreateRadar("Mark_92_T",{		
	type = TRACK_ONLY,
    band = 11.509,
	beam_width 	= 1,
    beam_height = 1,
    antenna_speed 	= 360,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= CW_PRF,
    prf_track 	= CW_PRF,
    peak_power 	= 200,
    antenna_gain = 46,
	relevant_range = 35000,
})

CreateFrqScanRadar("AN_SPS_48E",{			
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.042,
	beam_width 	= 1.5,
    beam_height = 1.5,
    antenna_speed = 90,
    search_pattern = frqScan(360, 1.5, 0, 65),
    prf_search 	= 550,
    prf_track 	= 550,
    peak_power 	= 2200,
    antenna_gain = 42,
	relevant_range = 400000,
})

CreateRadar("AN_SPQ_9B_1",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 8.793,
	beam_width 	= 1.35,
    beam_height = 3,
    antenna_speed 	= 180,
    search_pattern 	= { { 0, 0},	
						{ 360, 0}
						},
    prf_search 	= 3000,
    prf_track 	= 3000,
    peak_power 	= 1.2,
    antenna_gain = 39,
	relevant_range = 18000,
})
CreateRadarFromBase("AN_SPQ_9B_2", "AN_SPQ_9B_1")
OverrideRadar("AN_SPQ_9B_2",{
    search_pattern 	= { { -180, 3},	
						{  180, 3},
						{ -180, 3},
						{ -180, 9},
						{  180, 9},
						{ -180, 9},
						{ -180, 15},	
						{  180, 15},
						{ -180, 15},
						{ -180, 21},	
						{  180, 21},
						{ -180, 21}
						},
})
CreateRadarFromBase("AN_SPQ_9B_3", "AN_SPQ_9B_1")
OverrideRadar("AN_SPQ_9B_3",{
    search_pattern 	= { { -180, 6},	
						{  180, 6},
						{ -180, 6},
						{ -180, 12},
						{  180, 12},
						{ -180, 12},
						{ -180, 18},	
						{  180, 18},
						{ -180, 18},
						{ -180, 24},	
						{  180, 24},
						{ -180, 24}
						},
})

CreateRadar("AN_SPN_43C",{			
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.645,
	beam_width 	= 1.5,
    beam_height = 15,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(9), 
    prf_search 	= 1000,
    prf_track 	= 1000,
    peak_power 	= 850,
    antenna_gain = 33,
	relevant_range = 90000,
})

CreateRadar("AN_SPN_41_Az",{			
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 15.550,
	beam_width 	= 2,
    beam_height = 10,
    antenna_speed 	= 100,
    search_pattern 	= { { 146, 3},	
						{ 186, 3},
						{ 146, 3}
						}, 
    prf_search 	= 1000,
    prf_track 	= 1000,
    peak_power 	= 2,
    antenna_gain = 31,
	relevant_range = 19000,
})

CreateRadar("AN_SPN_41_El",{			
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 15.580,
	beam_width 	= 40,
    beam_height = 1.3,
    antenna_speed 	= 25,
    search_pattern 	= { { 166, 0},	
						{ 166, 10},
						{ 166, 0}
						}, 
    prf_search 	= 1000,
    prf_track 	= 1000,
    peak_power 	= 2,
    antenna_gain = 25,
	relevant_range = 19000,
})

CreateRadar("Mk_95",{			
	type = TRACK_ONLY,
    band = 10.608,
	beam_width 	= 2.4,
    beam_height = 2.4,
    antenna_speed 	= 25,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						}, 
    prf_search 	= CW_PRF,
    prf_track 	= CW_PRF,
    peak_power 	= 2,
    antenna_gain = 39,
	relevant_range = 120000,
})

CreateFrqScanRadar("AN_SPS_48C",{		
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.042,
	beam_width 	= 1.5,
    beam_height = 1.5,
    antenna_speed = 90,
    search_pattern = frqScan(360, 1.5, 0, 65), 
    prf_search 	= 400,
    prf_track 	= 400,
    peak_power 	= 1100,
    antenna_gain = 42,
	relevant_range = 460000,
})

CreateRadar("AN_SPS_67",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 5.638,
	beam_width 	= 1.5,
    beam_height = 12,
    antenna_speed 	= 24,
    search_pattern 	= PatternRotating(),
    prf_search 	= 750,
    prf_track 	= 750,
    peak_power 	= 280,
    antenna_gain = 34,
	relevant_range = 100000,
})

CreateRadar("AN_SPG_62",{	
	type = TRACK_ONLY,
    band = 11.509,
	beam_width 	= 1,
    beam_height = 1,
    antenna_speed 	= 24,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= CW_PRF,
    prf_track 	= CW_PRF,
    peak_power 	= 10,
    antenna_gain = 46,
	relevant_range = 46000,
})

CreateRadar("AN_SPS_73",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 10.794,
	beam_width 	= 1.5,
    beam_height = 5,
    antenna_speed 	= 144,
    search_pattern 	= PatternRotating(-2.5),
    prf_search 	= 800,
    prf_track 	= 800,
    peak_power 	= 25,
    antenna_gain = 39,
	relevant_range = 180000,
})

CreateRadar("TAS_MK_23",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.195,
	beam_width 	= 2,
    beam_height = 30,
    antenna_speed 	= 180,
    search_pattern 	= PatternRotating(15),
    prf_search 	= 750,
    prf_track 	= 750,
    peak_power 	= 100,
    antenna_gain = 29,
	relevant_range = 200000,
})

CreateRadar("AN_SPS_40",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 0.374,
	beam_width 	= 10.5,
    beam_height = 19,
    antenna_speed 	= 45,
    search_pattern 	= PatternRotating(8.5),
    prf_search 	= 257,
    prf_track 	= 257,
    peak_power 	= 250,
    antenna_gain = 23,
	relevant_range = 370000,
})

CreateRadar("AN_SPS_64V9",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 9.420,
	beam_width 	= 1.2,
    beam_height = 20.7,
    antenna_speed 	= 198,
    search_pattern 	= PatternRotating(10),
    prf_search 	= 900,
    prf_track 	= 900,
    peak_power 	= 20,
    antenna_gain = 30,
	relevant_range = 120000,
})

CreateRadar("AN_SPY_1_front",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.367,
	beam_width 	= 1.7,
    beam_height = 1.7,
    antenna_speed 	= 5,
    search_pattern 	= { { 0, 45},	
						{ 0, 45}
						}, 
    scan_pattern = {
			type = SCAN_PATTERN_AESA,
			azimuth = 90,
			elevation = 90,
			dwell_time = aesa_dwell_time,
		},
    prf_search 	= 85000,
    prf_track 	= 85000,
    peak_power 	= 6000,
    antenna_gain = 44.3,
	relevant_range = 370000,
})
CreateRadarFromBase("AN_SPY_1_right", "AN_SPY_1_front")
OverrideRadar("AN_SPY_1_right", {
	search_pattern 	= { { 90, 45},	
						{ 90, 45}
						},
})
CreateRadarFromBase("AN_SPY_1_rear", "AN_SPY_1_front")
OverrideRadar("AN_SPY_1_right", {
	search_pattern 	= { { 180, 45},	
						{ 180, 45}
						},
})
CreateRadarFromBase("AN_SPY_1_left", "AN_SPY_1_front")
OverrideRadar("AN_SPY_1_right", {
	search_pattern 	= { { 270, 45},	
						{ 270, 45}
						},
})

CreateRadar("Type_364",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.239,
	beam_width 	= 2,
    beam_height = 25,
    antenna_speed 	= 180,
    search_pattern 	= PatternRotating(20),
    prf_search 	= 2000,
    prf_track 	= 2000,
    peak_power 	= 60,
    antenna_gain = 38,
	relevant_range = 75000,
})

CreateRadar("Front_Dome",{	
	type = TRACK_ONLY,
    band = 11.052,
	beam_width 	= 2.5,
    beam_height = 1.3,
    antenna_speed 	= 150,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 2000,
    prf_track 	= CW_PRF,
    peak_power 	= 2,
    antenna_gain = 41,
	relevant_range = 30000,
})

CreateRadar("Band_Stand",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 28.259,
	beam_width 	= 0.5,
    beam_height = 0.5,
    antenna_speed 	= 150,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 80000,
    prf_track 	= 80000,
    peak_power 	= 20,
    antenna_gain = 52,
	relevant_range = 250000,
})

CreateRadar("Type_344",{	
	type = TRACK_ONLY,
    band = 18.891,
	beam_width 	= 0.7,
    beam_height = 0.7,
    antenna_speed 	= 150,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 40000,
    prf_track 	= 40000,
    peak_power 	= 90,
    antenna_gain = 49,
	relevant_range = 50000,
})

CreateRadar("Rice_Bowl",{	
	type = TRACK_ONLY,
    band = 11.054,
	beam_width 	= 1.8,
    beam_height = 1.8,
    antenna_speed 	= 150,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 52000,
    prf_track 	= 52000,
    peak_power 	= 150,
    antenna_gain = 41,
	relevant_range = 40000,
})

CreateRadar("Type_346_Search_Front_right",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.245,
	beam_width 	= 1.7,
    beam_height = 1.7,
    antenna_speed 	= 5,
    search_pattern 	= { { 45, 45},	
						{ 45, 45}
						},
    scan_pattern = {
			type = SCAN_PATTERN_AESA,
			azimuth = 120,
			elevation = 90,
			dwell_time = aesa_dwell_time,
		},
    prf_search 	= 50000,
    prf_track 	= 50000,
    peak_power 	= 25,
    antenna_gain = 42,
	relevant_range = 450000,
})

CreateRadarFromBase("Type_346_Search_Front_left", "Type_346_Search_Front_right")
OverrideRadar("Type_346_Search_Front_left",{  
    search_pattern 	= { { 315, 45},	
						{ 315, 45}
						},
})

CreateRadarFromBase("Type_346_Search_Rear_right", "Type_346_Search_Front_right")
OverrideRadar("Type_346_Search_Rear_right",{
    search_pattern 	= { { 135, 45},	
						{ 135, 45}
						},
})

CreateRadarFromBase("Type_346_Search_Rear_left", "Type_346_Search_Front_right")
OverrideRadar("Type_346_Search_Rear_left",{
    search_pattern 	= { { 225, 45},	
						{ 225, 45}
						},
})

CreateRadar("Type_346_Track",{	
	type = TRACK_ONLY,
    band = 5.650,
	beam_width 	= 4.7,
    beam_height = 4.7,
    antenna_speed 	= 36,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 25,
    antenna_gain = 33,
	relevant_range = 450000,
})

CreateRadar("Type_517",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 0.112,
	beam_width 	= 5,
    beam_height = 30,
    antenna_speed 	= 36,
    search_pattern 	= PatternRotating(15),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 25,
    antenna_gain = 25,
	relevant_range = 350000, 
})

CreateRadar("Type_382_Large",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.218,
	beam_width 	= 2.9,
    beam_height = 3.7,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(15),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 60,
    antenna_gain = 36,
	relevant_range = 300000,
})

CreateRadar("Type_382_Small",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 3.463,
	beam_width 	= 1.8,
    beam_height = 2.4,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(15),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 60,
    antenna_gain = 40,
	relevant_range = 300000,
})

CreateRadar("Type_360",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.531,
	beam_width 	= 1.5,
    beam_height = 17,
    antenna_speed 	= 180,
    search_pattern 	= PatternRotating(8),
    prf_search 	= 900,
    prf_track 	= 900,
    peak_power 	= 140,
    antenna_gain = 28,
	relevant_range = 250000,
})

CreateRadar("RM_1290",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 9.421,
	beam_width 	= 1.3,
    beam_height = 23,
    antenna_speed 	= 156.5,
    search_pattern 	= PatternRotating(10),
    prf_search 	= 1300,
    prf_track 	= 1300,
    peak_power 	= 16,
    antenna_gain = 29,
	relevant_range = 120000,
})

CreateRadar("Triton_S",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.280,
	beam_width 	= 3,
    beam_height = 22,
    antenna_speed 	= 240,
    search_pattern 	= PatternRotating(5),
    prf_search 	= 6000,
    prf_track 	= 6000,
    peak_power 	= 10,
    antenna_gain = 28,
	relevant_range = 30000,
})

CreateRadar("Castor_2",{	
	type = TRACK_ONLY,
    band = 11.399,
	beam_width 	= 1.2,
    beam_height = 1.2,
    antenna_speed 	= 240,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 3600,
    prf_track 	= 7200,
    peak_power 	= 80,
    antenna_gain = 45,
	relevant_range = 25000,
})

CreateRadar("Don_2",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 10.665,
	beam_width 	= 1,
    beam_height = 20,
    antenna_speed 	= 120,
    search_pattern 	= PatternRotating(9),
    prf_search 	= 1670,
    prf_track 	= 1670,
    peak_power 	= 80,
    antenna_gain = 33,
	relevant_range = 46000,
})

CreateRadar("DA_08",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.736,
	beam_width 	= 1.6,
    beam_height = 12,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(9),
    prf_search 	= 600,
    prf_track 	= 600,
    peak_power 	= 145,
    antenna_gain = 33,
	relevant_range = 190000,
})

CreateRadar("DA_02",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 4.245,
	beam_width 	= 2,
    beam_height = 30,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(18),
    prf_search 	= 1100,
    prf_track 	= 1100,
    peak_power 	= 600,
    antenna_gain = 29,
	relevant_range = 110000,
})

CreateRadar("LW_01",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 1.280,
	beam_width 	= 2,
    beam_height = 20,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(10),
    prf_search 	= 900,
    prf_track 	= 900,
    peak_power 	= 600,
    antenna_gain = 31,
	relevant_range = 260000,
})

CreateRadar("LW_08",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 2.045,
	beam_width 	= 2.2,
    beam_height = 20,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(15),
    prf_search 	= 500,
    prf_track 	= 500,
    peak_power 	= 150,
    antenna_gain = 30,
	relevant_range = 270000,
})

CreateRadar("ZW_01",{	
	type = SEARCH_ONLY, -- SEARCH_AND_TRACK
    band = 12.335,
	beam_width 	= 2.2,
    beam_height = 5,
    antenna_speed 	= 90,
    search_pattern 	= PatternRotating(0),
    prf_search 	= 1400,
    prf_track 	= 140,
    peak_power 	= 150,
    antenna_gain = 36,
	relevant_range = 74000,
})

-- hms_invincible
ReplaceUnitRadar("hms_invincible",	"carrier search radar"	, "Type_1022")
ReplaceUnitRadar("hms_invincible",	"rezki search radar"	, "Type_992")
ReplaceUnitRadar("hms_invincible",	"Osa 9A33 ln"			, "Type_1006")
AddUnitRadar(	 "hms_invincible", 	"Type_909")

-- leander-gun-achilles
ReplaceUnitRadar("leander-gun-achilles",	"Patriot str"	, "Type_965")
AddUnitRadar("leander-gun-achilles", 	"Type_992Q")
AddUnitRadar("leander-gun-achilles", 	"Type_903")
-- leander-gun-andromeda
ReplaceUnitRadar("leander-gun-andromeda",	"Patriot str"	, "Type_965")
AddUnitRadar("leander-gun-andromeda", 	"Type_992Q")
AddUnitRadar("leander-gun-andromeda", 	"Type_903")
-- leander-gun-ariadne
ReplaceUnitRadar("leander-gun-ariadne",	"Patriot str"		, "Type_965")
AddUnitRadar("leander-gun-ariadne", 	"Type_992Q")	
AddUnitRadar("leander-gun-ariadne", 	"Type_903")	
-- leander-gun-condell	
ReplaceUnitRadar("leander-gun-condell",	"Patriot str"		, "Type_965")
AddUnitRadar("leander-gun-condell", 	"Type_992Q")	
AddUnitRadar("leander-gun-condell", 	"Type_903")
AddUnitRadar("leander-gun-condell", 	"C_RAM_Phalanx")
AddUnitRadar("leander-gun-condell", 	"C_RAM_Phalanx_search_2")
AddUnitRadar("leander-gun-condell", 	"C_RAM_Phalanx_search_3")
AddUnitRadar("leander-gun-condell", 	"C_RAM_Phalanx_Track")
-- leander-gun-lynch
ReplaceUnitRadar("leander-gun-lynch",	"Patriot str"		, "Type_965")
AddUnitRadar("leander-gun-lynch", 		"Type_992Q")
AddUnitRadar("leander-gun-lynch", 		"Type_903")
AddUnitRadar("leander-gun-lynch", 	    "C_RAM_Phalanx")
AddUnitRadar("leander-gun-lynch", 	    "C_RAM_Phalanx_search_2")
AddUnitRadar("leander-gun-lynch", 	    "C_RAM_Phalanx_search_3")
AddUnitRadar("leander-gun-lynch", 	    "C_RAM_Phalanx_Track")

-- Moskva
ReplaceUnitRadar("MOSCOW",	"S-300PS 40B6M tr navy"	, "Big_Net")
ReplaceUnitRadar("MOSCOW",	"Osa 9A33 ln"			, "Top_Sail")
ReplaceUnitRadar("MOSCOW",	"moskva search radar"	, "Top_Steer")
AddUnitRadar	("MOSCOW", 	"Palm_Frond")
AddUnitRadar	("MOSCOW", 	"Pop_Group_T")
AddUnitRadar	("MOSCOW", 	"Top_Dome")
AddUnitRadar	("MOSCOW", 	"Bass_Tilt")

-- Kuznetsov -OLD
ReplaceUnitRadar("KUZNECOW",	"Tor 9A331"				, "Top_Plate_L")
ReplaceUnitRadar("KUZNECOW",	"2S6 Tunguska"			, "Top_Plate_S")
ReplaceUnitRadar("KUZNECOW",	"carrier search radar"	, "MR_350")
AddUnitRadar	("KUZNECOW", 	"Palm_Frond")
AddUnitRadar	("KUZNECOW", 	"Cross_Sword_S")
AddUnitRadar	("KUZNECOW", 	"Cross_Sword_T")

-- Kuznetsov -NEW
ReplaceUnitRadar("CV_1143_5",	"Tor 9A331"				, "Top_Plate_L")
ReplaceUnitRadar("CV_1143_5",	"2S6 Tunguska"			, "Top_Plate_S")
ReplaceUnitRadar("CV_1143_5",	"carrier search radar"	, "MR_350")
AddUnitRadar	("CV_1143_5", 	"Palm_Frond")
AddUnitRadar	("CV_1143_5", 	"Cross_Sword_S")
AddUnitRadar	("CV_1143_5", 	"Cross_Sword_T")

-- PIOTR
ReplaceUnitRadar("PIOTR",	"S-300PS 40B6M tr navy"			, "Big_Net")
ReplaceUnitRadar("PIOTR",	"Tor 9A331"						, "Top_Sail")
ReplaceUnitRadar("PIOTR",	"2S6 Tunguska"					, "Top_Plate_L")
ReplaceUnitRadar("PIOTR",	"piotr velikiy search radar"	, "Top_Plate_S")
AddUnitRadar	("PIOTR", 	"Strut_Pair_1")
AddUnitRadar	("PIOTR", 	"Strut_Pair_2")
AddUnitRadar	("PIOTR", 	"Palm_Frond")
AddUnitRadar	("PIOTR", 	"Top_Dome")
AddUnitRadar	("PIOTR", 	"Tomb_Stone")
AddUnitRadar	("PIOTR", 	"Cross_Sword_S")
AddUnitRadar	("PIOTR", 	"Cross_Sword_T")
AddUnitRadar	("PIOTR", 	"Hot_Flash_T")
AddUnitRadar	("PIOTR", 	"Kite_Screech")

-- Grisha
ReplaceUnitRadar("ALBATROS",	"Osa 9A33 ln"				, "Strut_Curve")
ReplaceUnitRadar("ALBATROS",	"albatros search radar"		, "Pop_Group_T")
AddUnitRadar	("ALBATROS", 	"Muff_Cob")

-- Rezky
ReplaceUnitRadar("REZKY",		"Osa 9A33 ln"				, "Head_Net_1")
ReplaceUnitRadar("REZKY",		"rezki search radar"		, "Head_Net_2")
AddUnitRadar	("REZKY", 		"Volga")
AddUnitRadar	("REZKY", 		"Don_2")
AddUnitRadar	("REZKY", 		"Kite_Screech")
AddUnitRadar	("REZKY", 		"Pop_Group_T")

-- Molniya/Tarantul
ReplaceUnitRadar("MOLNIYA",		"molniya search radar"		, "Bass_Tilt")
AddUnitRadar	("MOLNIYA", 	"Peel_Pair")
AddUnitRadar	("MOLNIYA", 	"Pop_Group_T")

-- Neustrashimy
ReplaceUnitRadar("NEUSTRASH",	"Tor 9A331"					, "Top_Plate_L")
ReplaceUnitRadar("NEUSTRASH",	"2S6 Tunguska"				, "Top_Plate_S")
ReplaceUnitRadar("NEUSTRASH",	"neustrashimy search radar"	, "Palm_Frond")
AddUnitRadar	("NEUSTRASH", 	"Cross_Sword_S")
AddUnitRadar	("NEUSTRASH", 	"Cross_Sword_T")
AddUnitRadar	("NEUSTRASH", 	"Kite_Screech")

-- USS_Arleigh_Burke_IIa
ReplaceUnitRadar("USS_Arleigh_Burke_IIa",	"AEGIS_search_radar"			, "BridgeMaster_E")
ReplaceUnitRadar("USS_Arleigh_Burke_IIa",	"ticonderoga search radar"		, "AN_SPG_62")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPY_1_front")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPY_1_right")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPY_1_rear")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPY_1_left")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPQ_9B_1")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPQ_9B_2")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPQ_9B_3")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"AN_SPS_73")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"C_RAM_Phalanx")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"C_RAM_Phalanx_search_2")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"C_RAM_Phalanx_search_3")
AddUnitRadar	("USS_Arleigh_Burke_IIa", 	"C_RAM_Phalanx_Track")

-- OHP
ReplaceUnitRadar("PERRY",	"Patriot str"				, "AN_SPS_49")
ReplaceUnitRadar("PERRY",	"perry search radar"		, "AN_SPS_55")
AddUnitRadar	("PERRY", 	"AN_SPG_60")
AddUnitRadar	("PERRY", 	"Mark_92_S")
AddUnitRadar	("PERRY", 	"Mark_92_T")
AddUnitRadar	("PERRY", 	"C_RAM_Phalanx")
AddUnitRadar	("PERRY", 	"C_RAM_Phalanx_search_2")
AddUnitRadar	("PERRY", 	"C_RAM_Phalanx_search_3")
AddUnitRadar	("PERRY", 	"C_RAM_Phalanx_Track")

-- Stennis
ReplaceUnitRadar("Stennis",		"seasparrow tr"			, "AN_SPS_48E")
ReplaceUnitRadar("Stennis",		"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("Stennis", 	"AN_SPQ_9B_1")
AddUnitRadar	("Stennis", 	"AN_SPQ_9B_2")
AddUnitRadar	("Stennis", 	"AN_SPQ_9B_3")
AddUnitRadar	("Stennis", 	"AN_SPN_43C")
AddUnitRadar	("Stennis", 	"AN_SPN_41_Az")
AddUnitRadar	("Stennis", 	"AN_SPN_41_El")
AddUnitRadar	("Stennis", 	"Mk_95")
AddUnitRadar	("Stennis", 	"C_RAM_Phalanx")
AddUnitRadar	("Stennis", 	"C_RAM_Phalanx_search_2")
AddUnitRadar	("Stennis", 	"C_RAM_Phalanx_search_3")
AddUnitRadar	("Stennis", 	"C_RAM_Phalanx_Track")

-- Carl Vinson
ReplaceUnitRadar("VINSON",		"seasparrow tr"			, "AN_SPS_48E")
ReplaceUnitRadar("VINSON",		"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("VINSON", 		"AN_SPQ_9B_1")
AddUnitRadar	("VINSON", 		"AN_SPQ_9B_2")
AddUnitRadar	("VINSON", 		"AN_SPQ_9B_3")
AddUnitRadar	("VINSON", 		"AN_SPN_43C")
AddUnitRadar	("VINSON", 		"AN_SPN_41_Az")
AddUnitRadar	("VINSON", 		"AN_SPN_41_El")
AddUnitRadar	("VINSON", 		"Mk_95")
AddUnitRadar	("VINSON", 		"C_RAM_Phalanx")
AddUnitRadar	("VINSON", 		"C_RAM_Phalanx_search_2")
AddUnitRadar	("VINSON", 		"C_RAM_Phalanx_search_3")
AddUnitRadar	("VINSON", 		"C_RAM_Phalanx_Track")

-- Theodore Roosevelt
ReplaceUnitRadar("CVN_71",		"seasparrow tr"			, "AN_SPS_48E")
ReplaceUnitRadar("CVN_71",		"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("CVN_71", 		"AN_SPQ_9B_1")
AddUnitRadar	("CVN_71", 		"AN_SPQ_9B_2")
AddUnitRadar	("CVN_71", 		"AN_SPQ_9B_3")
AddUnitRadar	("CVN_71", 		"AN_SPN_43C")
AddUnitRadar	("CVN_71", 		"AN_SPN_41_Az")
AddUnitRadar	("CVN_71", 		"AN_SPN_41_El")
AddUnitRadar	("CVN_71", 		"Mk_95")
AddUnitRadar	("CVN_71", 		"C_RAM_Phalanx")
AddUnitRadar	("CVN_71", 		"C_RAM_Phalanx_search_2")
AddUnitRadar	("CVN_71", 		"C_RAM_Phalanx_search_3")
AddUnitRadar	("CVN_71", 		"C_RAM_Phalanx_Track")

-- Abraham Lincoln
ReplaceUnitRadar("CVN_72",		"seasparrow tr"			, "AN_SPS_48E")
ReplaceUnitRadar("CVN_72",		"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("CVN_72", 		"AN_SPQ_9B_1")
AddUnitRadar	("CVN_72", 		"AN_SPQ_9B_2")
AddUnitRadar	("CVN_72", 		"AN_SPQ_9B_3")
AddUnitRadar	("CVN_72", 		"AN_SPN_43C")
AddUnitRadar	("CVN_72", 		"AN_SPN_41_Az")
AddUnitRadar	("CVN_72", 		"AN_SPN_41_El")
AddUnitRadar	("CVN_72", 		"Mk_95")
AddUnitRadar	("CVN_72", 		"C_RAM_Phalanx")
AddUnitRadar	("CVN_72", 		"C_RAM_Phalanx_search_2")
AddUnitRadar	("CVN_72", 		"C_RAM_Phalanx_search_3")
AddUnitRadar	("CVN_72", 		"C_RAM_Phalanx_Track")

-- George Washington
ReplaceUnitRadar("CVN_73",		"seasparrow tr"			, "AN_SPS_48E")
ReplaceUnitRadar("CVN_73",		"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("CVN_73", 		"AN_SPQ_9B_1")
AddUnitRadar	("CVN_73", 		"AN_SPQ_9B_2")
AddUnitRadar	("CVN_73", 		"AN_SPQ_9B_3")
AddUnitRadar	("CVN_73", 		"AN_SPN_43C")
AddUnitRadar	("CVN_73", 		"AN_SPN_41_Az")
AddUnitRadar	("CVN_73", 		"AN_SPN_41_El")
AddUnitRadar	("CVN_73", 		"Mk_95")
AddUnitRadar	("CVN_73", 		"C_RAM_Phalanx")
AddUnitRadar	("CVN_73", 		"C_RAM_Phalanx_search_2")
AddUnitRadar	("CVN_73", 		"C_RAM_Phalanx_search_3")
AddUnitRadar	("CVN_73", 		"C_RAM_Phalanx_Track")

-- Harry S. Truman
ReplaceUnitRadar("CVN_75",		"seasparrow tr"			, "AN_SPS_48E")
ReplaceUnitRadar("CVN_75",		"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("CVN_75", 		"AN_SPQ_9B_1")
AddUnitRadar	("CVN_75", 		"AN_SPQ_9B_2")
AddUnitRadar	("CVN_75", 		"AN_SPQ_9B_3")
AddUnitRadar	("CVN_75", 		"AN_SPN_43C")
AddUnitRadar	("CVN_75", 		"AN_SPN_41_Az")
AddUnitRadar	("CVN_75", 		"AN_SPN_41_El")
AddUnitRadar	("CVN_75", 		"Mk_95")
AddUnitRadar	("CVN_75", 		"C_RAM_Phalanx")
AddUnitRadar	("CVN_75", 		"C_RAM_Phalanx_search_2")
AddUnitRadar	("CVN_75", 		"C_RAM_Phalanx_search_3")
AddUnitRadar	("CVN_75", 		"C_RAM_Phalanx_Track")

-- Forrestal
ReplaceUnitRadar("Forrestal",	"seasparrow tr"			, "AN_SPS_48C")
ReplaceUnitRadar("Forrestal",	"carrier search radar"	, "AN_SPS_49")
AddUnitRadar	("Forrestal", 	"AN_SPS_67")
AddUnitRadar	("Forrestal", 	"Mk_95")
AddUnitRadar	("Forrestal", 	"C_RAM_Phalanx")
AddUnitRadar	("Forrestal", 	"C_RAM_Phalanx_search_2")
AddUnitRadar	("Forrestal", 	"C_RAM_Phalanx_search_3")
AddUnitRadar	("Forrestal", 	"C_RAM_Phalanx_Track")

-- Ticonderoga
ReplaceUnitRadar("TICONDEROG",	"AEGIS_search_radar"		, "AN_SPG_62")
ReplaceUnitRadar("TICONDEROG",	"ticonderoga search radar"	, "AN_SPS_49")
AddUnitRadar	("TICONDEROG", 	"AN_SPY_1_front")
AddUnitRadar	("TICONDEROG", 	"AN_SPY_1_right")
AddUnitRadar	("TICONDEROG", 	"AN_SPY_1_rear")
AddUnitRadar	("TICONDEROG", 	"AN_SPY_1_left")
AddUnitRadar	("TICONDEROG", 	"AN_SPS_73")
AddUnitRadar	("TICONDEROG", 	"AN_SPQ_9B_1")
AddUnitRadar	("TICONDEROG", 	"AN_SPQ_9B_2")
AddUnitRadar	("TICONDEROG", 	"AN_SPQ_9B_3")
AddUnitRadar	("TICONDEROG", 	"C_RAM_Phalanx")
AddUnitRadar	("TICONDEROG", 	"C_RAM_Phalanx_search_2")
AddUnitRadar	("TICONDEROG", 	"C_RAM_Phalanx_search_3")
AddUnitRadar	("TICONDEROG", 	"C_RAM_Phalanx_Track")

-- Tarawa
ReplaceUnitRadar("LHA_Tarawa",	"seasparrow tr"				, "TAS_MK_23")
ReplaceUnitRadar("LHA_Tarawa",	"carrier search radar"		, "AN_SPS_67")
AddUnitRadar	("LHA_Tarawa", 	"AN_SPS_40")
AddUnitRadar	("LHA_Tarawa", 	"AN_SPS_48E")
AddUnitRadar	("LHA_Tarawa", 	"AN_SPS_64V9")
AddUnitRadar	("LHA_Tarawa", 	"AN_SPN_43C")
AddUnitRadar	("LHA_Tarawa", 	"C_RAM_Phalanx")
AddUnitRadar	("LHA_Tarawa", 	"C_RAM_Phalanx_search_2")
AddUnitRadar	("LHA_Tarawa", 	"C_RAM_Phalanx_search_3")
AddUnitRadar	("LHA_Tarawa", 	"C_RAM_Phalanx_Track")

-- Type 052B
ReplaceUnitRadar("Type_052B",	"PLAN Search Radar B"	, "Type_364")
ReplaceUnitRadar("Type_052B",	"052B SAM SR"			, "Top_Plate_L")
ReplaceUnitRadar("Type_052B",	"052B SAM TR"			, "Top_Plate_S")
AddUnitRadar	("Type_052B", 	"Front_Dome")
AddUnitRadar	("Type_052B", 	"Band_Stand")
AddUnitRadar	("Type_052B", 	"Type_344")
AddUnitRadar	("Type_052B", 	"Rice_Bowl")

-- Type_052C
ReplaceUnitRadar("Type_052C",	"PLAN Search Radar A"	, "Type_346_Search_Front_right")
ReplaceUnitRadar("Type_052C",	"052C SAM STR"			, "Type_346_Search_Front_left")
AddUnitRadar	("Type_052C", 	"Type_346_Search_Rear_right")
AddUnitRadar	("Type_052C", 	"Type_346_Search_Rear_left")
AddUnitRadar	("Type_052C", 	"Type_346_Track")
AddUnitRadar	("Type_052C", 	"Type_517")
AddUnitRadar	("Type_052C", 	"Type_364")
AddUnitRadar	("Type_052C", 	"Type_344")
AddUnitRadar	("Type_052C", 	"Rice_Bowl")
AddUnitRadar	("Type_052C", 	"Band_Stand")

-- Type_054A
ReplaceUnitRadar("Type_054A",	"PLAN Search Radar B"	, "Type_382_Large")
ReplaceUnitRadar("Type_054A",	"052B SAM TR"			, "Type_382_Small")
AddUnitRadar	("Type_054A", 	"Type_344")
AddUnitRadar	("Type_054A", 	"Front_Dome")
AddUnitRadar	("Type_054A", 	"Type_360")
AddUnitRadar	("Type_054A", 	"RM_1290")

-- Type_071
ReplaceUnitRadar("Type_071",	"PLAN Search Radar B"	, "Type_360")
AddUnitRadar	("Type_071", 	"Type_364")
AddUnitRadar	("Type_071", 	"Type_344")

-- La Combattante IIa
ReplaceUnitRadar("La_Combattante_II",	"molniya search radar"	, "Triton_S")
AddUnitRadar	("La_Combattante_II", 	"Castor_2")

-- Ropucha
ReplaceUnitRadar("BDK-775",		"rezki search radar"	, "Muff_Cob")
AddUnitRadar	("BDK-775", 	"Strut_Curve")
AddUnitRadar	("BDK-775", 	"Don_2")

-- Vienticinco de Mayo
ReplaceUnitRadar("ara_vdm",		"Osa 9A33 ln"				, "DA_08")
ReplaceUnitRadar("ara_vdm",		"rezki search radar"		, "DA_02")
ReplaceUnitRadar("ara_vdm",		"carrier search radar"		, "LW_01")
AddUnitRadar	("ara_vdm", 	"LW_08")
AddUnitRadar	("ara_vdm", 	"ZW_01")


---------------     Missiles     ---------------

CreateRadar("AIM_54_Seeker",{		
	type = TRACK_ONLY,
    band = 9.34,
	beam_width 	= 6,
    beam_height = 6,
    antenna_speed 	= 360,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 250000,
    prf_track 	= 250000,
    peak_power 	= 0.075,
    antenna_gain = 31,
    relevant_range = 15000*2
})

units["AIM_54A_Mk47"] = {
    DisplayName = "AIM-54A MK-47",
    radars = { "AIM_54_Seeker" },
    type = "AIM_54A_Mk47"
}

units["AIM_54A_Mk60"] = {
    DisplayName = "AIM-54A MK-60",
    radars = { "AIM_54_Seeker" },
    type = "AIM_54A_Mk60"
}

units["AIM_54C_Mk47"] = {
    DisplayName = "AIM-54C MK-47",
    radars = { "AIM_54_Seeker" },
    type = "AIM_54C_Mk47"
}

units["AIM_54C_Mk60"] = {
    DisplayName = "AIM-54C MK-60",
    radars = { "AIM_54_Seeker" },
    type = "AIM_54C_Mk60"
}

CreateRadar("AIM_120_Seeker",{		
    type = TRACK_ONLY,
    band = 8.39,
	beam_width 	= 12.6,
    beam_height = 12.6,
    antenna_speed 	= 360,
    search_pattern 	= { { 0, 0},	
                        { 0, 0}
    },
    prf_search 	= 300000,
    prf_track 	= 300000,
    peak_power 	= 0.5,
    antenna_gain = 24,
    relevant_range = 18000*2
})

units["AIM_120C"] = {
    DisplayName = "AIM-120C",
    radars = { "AIM_120_Seeker" },
    type = "AIM_120C"
}

units["AIM_120"] = {
    DisplayName = "AIM-120B",
    radars = { "AIM_120_Seeker" },
    type = "AIM_120"
}

CreateRadar("R-77_Seeker",{		
	type = TRACK_ONLY,
    band = 8.29,
	beam_width 	= 12.6,
    beam_height = 12.6,
    antenna_speed 	= 360,
    search_pattern 	= { { 0, 0},	
						{ 0, 0}
						},
    prf_search 	= 200000,
    prf_track 	= 200000,
    peak_power 	= 0.1,
    antenna_gain = 24,
    relevant_range = 15000*2
})

units["P_77"] = {
    DisplayName = "R-77",
    radars = { "R-77_Seeker" },
    type = "P_77"
}


-- CreateRadar("Rb04_Seeker",{		
	-- type = SEARCH_AND_TRACK,
    -- band = 13.07,
	-- beam_width 	= 4.5,
    -- beam_height = 9,
    -- antenna_speed 	= 112,
    -- search_pattern 	= { { -28, 0},	
						-- {  28, 0},
						-- { -28, 0}
						-- },
    -- prf_search 	= 3000,
    -- prf_track 	= 3000,
    -- peak_power 	= 0.002,
    -- antenna_gain = 30,
-- })

-- CreateRadar("Rb15_Seeker",{		
	-- type = SEARCH_AND_TRACK,
    -- band = 15.29,
	-- beam_width 	= 2,
    -- beam_height = 7,
    -- antenna_speed 	= 140,
    -- search_pattern 	= { { -35, 0},	
						-- {  35, 0},
						-- { -35, 0}
						-- },
    -- prf_search 	= 5000,
    -- prf_track 	= 5000,
    -- peak_power 	= 0.002,
    -- antenna_gain = 35,
-- })

-- CreateRadar("AGM_84_Seeker",{		
	-- type = SEARCH_AND_TRACK,
    -- band = 16.26,
	-- beam_width 	= 5.7,
    -- beam_height = 5.7,
    -- antenna_speed 	= 180,
    -- search_pattern 	= { { -45, 0},	
						-- {  45, 0},
						-- { -45, 0}
						-- },
    -- prf_search 	 = 2500,
    -- prf_track 	 = 2500,
    -- peak_power 	 = 35,
    -- antenna_gain = 31,
-- })

-- ---------------     Pods     ---------------

-- --AN/AAQ-13 - LANTIRN
-- CreateRadar("AN_APN_237",{		
	-- type = SEARCH_ONLY,
    -- band = 11.11,
	-- beam_width 	= 6,
    -- beam_height = 6,
    -- antenna_speed 	= 360,
    -- search_pattern 	= { { 0, 0},	
						-- { 0, 0}
						-- },
    -- prf_search 	= 250000,
    -- prf_track 	= 250000,
    -- peak_power 	= 0.075,
    -- antenna_gain = 31,
-- })


--- TEST ---
-- ReplaceUnitRadar("Hawk sr", "Hawk sr", "Top_Plate_S")	-- Use MQP-50 in-game

dofile(LockOn_Options.script_path.."Scripts/RWR/emitter_id_table.lua") -- Do this Last so it can use the radar Data
need_to_be_closed = true