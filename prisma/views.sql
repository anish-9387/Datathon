-- Read-only view exposing FIR data with the flat column names the ML
-- assistant's NL-to-SQL generator targets (crime_type, date_time, district,
-- weapon, status). Apply with: pnpm db:views
DROP VIEW IF EXISTS fir;

CREATE VIEW fir AS
SELECT
  cm."CaseMasterID"                            AS id,
  cm."CrimeNo"                                 AS fir_no,
  CASE ch."CrimeGroupName"
    WHEN 'Murder'                 THEN 'Homicide'
    WHEN 'Motor Vehicle Theft'    THEN 'Vehicle Theft'
    WHEN 'Narcotics'              THEN 'Drug Offense'
    WHEN 'Cheating'               THEN 'Fraud'
    WHEN 'Rape'                   THEN 'Sexual Offense'
    WHEN 'Rioting'                THEN 'Riots'
    WHEN 'Kidnapping & Abduction' THEN 'Kidnapping'
    ELSE ch."CrimeGroupName"
  END                                          AS crime_type,
  ch."CrimeGroupName"                          AS crime_group,
  COALESCE(cm."IncidentFromDate", cm."CrimeRegisteredDate") AS date_time,
  d."DistrictName"                             AS district,
  u."UnitName"                                 AS police_station,
  cs."CaseStatusName"                          AS status,
  CASE
    WHEN cm."BriefFacts" ~* 'knife|dagger|blade'          THEN 'Knife'
    WHEN cm."BriefFacts" ~* 'pistol|gun|firearm|revolver' THEN 'Firearm'
    WHEN cm."BriefFacts" ~* 'acid'                        THEN 'Acid'
    WHEN cm."BriefFacts" ~* 'iron rod|rod|club|stick'     THEN 'Blunt Object'
    WHEN cm."BriefFacts" ~* 'poison'                      THEN 'Poison'
    ELSE NULL
  END                                          AS weapon,
  cm."BriefFacts"                              AS fir_text,
  cm.latitude                                  AS latitude,
  cm.longitude                                 AS longitude,
  (SELECT count(*) FROM "Accused" a WHERE a."CaseMasterID" = cm."CaseMasterID") AS accused_count,
  (SELECT count(*) FROM "Victim" v  WHERE v."CaseMasterID" = cm."CaseMasterID") AS victim_count
FROM "CaseMaster" cm
LEFT JOIN "CrimeHead" ch        ON ch."CrimeHeadID"   = cm."CrimeMajorHeadID"
LEFT JOIN "Unit" u              ON u."UnitID"         = cm."PoliceStationID"
LEFT JOIN "District" d          ON d."DistrictID"     = u."DistrictID"
LEFT JOIN "CaseStatusMaster" cs ON cs."CaseStatusID"  = cm."CaseStatusID";
