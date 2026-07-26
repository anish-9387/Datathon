const { Pool } = require("pg")
const bcrypt = require("bcryptjs")
const { TARGET_FIR_COUNT, generateSyntheticFirs } = require("./synthetic-firs")
const fs = require("fs")
const path = require("path")

function loadLocalEnv() {
  const envPath = path.join(__dirname, "..", ".env")
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "")
    }
  }
}

loadLocalEnv()

const TARGET_DB_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/crime_intel"
const defaultRootUrl = new URL(TARGET_DB_URL)
defaultRootUrl.pathname = "/postgres"
const ROOT_DB_URL = process.env.DATABASE_ROOT_URL || defaultRootUrl.toString()

async function seed() {
  console.log("--> Connecting to PostgreSQL server...")
  const rootPool = new Pool({ connectionString: ROOT_DB_URL })
  
  try {
    const res = await rootPool.query("SELECT 1 FROM pg_database WHERE datname = 'crime_intel'")
    if (res.rowCount === 0) {
      console.log("--> Creating database 'crime_intel'...")
      await rootPool.query("CREATE DATABASE crime_intel")
    } else {
      console.log("--> Database 'crime_intel' already exists.")
    }
  } catch (err) {
    console.error("Error creating database:", err.message)
  } finally {
    await rootPool.end()
  }

  console.log("--> Connecting to 'crime_intel' database...")
  const pool = new Pool({ connectionString: TARGET_DB_URL })

  try {
    console.log("--> Creating tables...")

    await pool.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        district_name VARCHAR(255) UNIQUE NOT NULL,
        code VARCHAR(50),
        urbanization_pct FLOAT DEFAULT 75.0,
        literacy_rate FLOAT DEFAULT 82.0,
        population INT DEFAULT 1000000
      );

      CREATE TABLE IF NOT EXISTS police_stations (
        id SERIAL PRIMARY KEY,
        unit_name VARCHAR(255) UNIQUE NOT NULL,
        district_id INT REFERENCES districts(id) ON DELETE CASCADE,
        officers INT DEFAULT 15,
        rate FLOAT DEFAULT 70.0
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'ANALYST',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS firs (
        id SERIAL PRIMARY KEY,
        crime_no VARCHAR(255) UNIQUE NOT NULL,
        date_time TIMESTAMP,
        crime_type VARCHAR(255) NOT NULL,
        crime_group VARCHAR(255),
        district_id INT REFERENCES districts(id) ON DELETE SET NULL,
        police_station_id INT REFERENCES police_stations(id) ON DELETE SET NULL,
        status VARCHAR(100) DEFAULT 'Under Investigation',
        latitude FLOAT,
        longitude FLOAT,
        brief_facts TEXT,
        weapon VARCHAR(255),
        section_law VARCHAR(255),
        fir_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accused (
        id SERIAL PRIMARY KEY,
        fir_id INT REFERENCES firs(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        age INT,
        profile TEXT
      );

      CREATE TABLE IF NOT EXISTS victims (
        id SERIAL PRIMARY KEY,
        fir_id INT REFERENCES firs(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        age INT,
        profile TEXT
      );

      CREATE TABLE IF NOT EXISTS gangs (
        id SERIAL PRIMARY KEY,
        gang_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        leader VARCHAR(255),
        area VARCHAR(255),
        members INT DEFAULT 5,
        influence FLOAT DEFAULT 50.0,
        status VARCHAR(50) DEFAULT 'active',
        formed VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS criminals (
        id SERIAL PRIMARY KEY,
        criminal_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        age INT,
        crimes INT DEFAULT 1,
        influence FLOAT DEFAULT 50.0,
        betweenness FLOAT DEFAULT 0.5,
        repeat BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'active',
        gang_name VARCHAR(255),
        last_arrest DATE
      );

      CREATE TABLE IF NOT EXISTS forecasts (
        id SERIAL PRIMARY KEY,
        forecast_date DATE NOT NULL,
        probability FLOAT NOT NULL,
        crime_type VARCHAR(255) NOT NULL,
        confidence VARCHAR(50) DEFAULT 'medium',
        district VARCHAR(255),
        station VARCHAR(255),
        explanation TEXT,
        model VARCHAR(50) DEFAULT 'xgboost-v1'
      );

      CREATE TABLE IF NOT EXISTS hotspots (
        id SERIAL PRIMARY KEY,
        hotspot_code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        lat FLOAT NOT NULL,
        lng FLOAT NOT NULL,
        risk FLOAT DEFAULT 50.0,
        incidents INT DEFAULT 1,
        trend VARCHAR(50) DEFAULT 'stable'
      );

      CREATE TABLE IF NOT EXISTS anomalies (
        id SERIAL PRIMARY KEY,
        anomaly_code VARCHAR(50) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        score FLOAT DEFAULT 50.0,
        date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'investigating'
      );

      CREATE TABLE IF NOT EXISTS trends (
        id SERIAL PRIMARY KEY,
        crime_type VARCHAR(255) UNIQUE NOT NULL,
        recent_count INT DEFAULT 0,
        historical_avg FLOAT DEFAULT 0,
        spike_ratio FLOAT DEFAULT 1.0,
        severity VARCHAR(50) DEFAULT 'normal'
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    console.log("--> Creating 'fir' view for NL->SQL assistant...")
    await pool.query(`
      CREATE OR REPLACE VIEW fir AS
      SELECT 
        f.id,
        f.crime_no AS fir_no,
        f.crime_no,
        f.date_time,
        f.crime_type,
        f.crime_group,
        f.status,
        f.brief_facts,
        f.latitude,
        f.longitude,
        d.district_name AS district,
        ps.unit_name AS police_station,
        f.weapon,
        f.section_law,
        f.fir_text
      FROM firs f
      LEFT JOIN police_stations ps ON f.police_station_id = ps.id
      LEFT JOIN districts d ON ps.district_id = d.id;
    `)

    console.log("--> Seeding Districts...")
    const districtsData = [
      { name: "Bengaluru Urban", code: "D-001", urbanization: 88.5, literacy: 88.0, pop: 12000000 },
      { name: "Mysuru", code: "D-002", urbanization: 74.2, literacy: 84.0, pop: 1300000 },
      { name: "Hubballi-Dharwad", code: "D-003", urbanization: 68.0, literacy: 80.5, pop: 950000 },
      { name: "Mangaluru", code: "D-004", urbanization: 78.4, literacy: 89.2, pop: 620000 },
      { name: "Belagavi", code: "D-005", urbanization: 52.1, literacy: 73.5, pop: 1100000 },
      { name: "Kalaburagi", code: "D-006", urbanization: 48.6, literacy: 65.2, pop: 850000 },
    ]

    const districtIds = {}
    for (const dist of districtsData) {
      const res = await pool.query(
        `INSERT INTO districts (district_name, code, urbanization_pct, literacy_rate, population)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (district_name) DO UPDATE SET urbanization_pct = EXCLUDED.urbanization_pct
         RETURNING id`,
        [dist.name, dist.code, dist.urbanization, dist.literacy, dist.pop]
      )
      districtIds[dist.name] = res.rows[0].id
    }

    console.log("--> Seeding Police Stations...")
    const stationsData = [
      { name: "Koramangala Police Station", district: "Bengaluru Urban", officers: 24, rate: 78.5 },
      { name: "MG Road Police Station", district: "Bengaluru Urban", officers: 20, rate: 72.0 },
      { name: "Indiranagar Police Station", district: "Bengaluru Urban", officers: 18, rate: 81.2 },
      { name: "Whitefield Police Station", district: "Bengaluru Urban", officers: 22, rate: 66.4 },
      { name: "Jayanagar Police Station", district: "Mysuru", officers: 15, rate: 85.0 },
      { name: "Devaraja Police Station", district: "Mysuru", officers: 14, rate: 79.1 },
      { name: "Suburban Police Station", district: "Hubballi-Dharwad", officers: 16, rate: 74.0 },
      { name: "Kadri Police Station", district: "Mangaluru", officers: 17, rate: 82.3 },
      { name: "Camp Police Station", district: "Belagavi", officers: 12, rate: 69.5 },
      { name: "Station Bazaar", district: "Kalaburagi", officers: 14, rate: 63.8 },
    ]

    const stationIds = {}
    for (const st of stationsData) {
      const distId = districtIds[st.district]
      const res = await pool.query(
        `INSERT INTO police_stations (unit_name, district_id, officers, rate)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (unit_name) DO UPDATE SET rate = EXCLUDED.rate
         RETURNING id`,
        [st.name, distId, st.officers, st.rate]
      )
      stationIds[st.name] = res.rows[0].id
    }

    console.log("--> Seeding Users...")
    const passwordHash = await bcrypt.hash("Password@123", 10)
    const usersData = [
      { name: "Super Admin", email: "admin@karnatakapolice.gov.in", role: "SUPER_ADMIN" },
      { name: "SCRB Lead Analyst", email: "scrbanalyst@karnatakapolice.gov.in", role: "SCRB_ANALYST" },
      { name: "Bengaluru SP", email: "sp.bengaluru@karnatakapolice.gov.in", role: "DISTRICT_SP" },
      { name: "Senior Analyst", email: "analyst@karnatakapolice.gov.in", role: "ANALYST" },
    ]

    for (const u of usersData) {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [u.name, u.email, passwordHash, u.role]
      )
    }

    console.log("--> Seeding FIRs, Accused, Victims...")
    const firTemplates = [
      {
        crimeNo: "FIR-2025-001",
        date: "2025-04-12T14:30:00Z",
        crimeType: "Burglary",
        crimeGroup: "Burglary",
        station: "Koramangala Police Station",
        district: "Bengaluru Urban",
        status: "Under Investigation",
        lat: 12.9352,
        lng: 77.6245,
        weapon: "Knife",
        section: "IPC 457 / BNS 305",
        facts: "Forced entry through rear window and electronics stolen from a residential flat in 4th Block Koramangala.",
        accused: [{ name: "Ravi Kumar", age: 34, profile: "Known repeat burglar" }],
        victims: [{ name: "Anita Sharma", age: 41, profile: "Resident" }],
      },
      {
        crimeNo: "FIR-2025-002",
        date: "2025-04-10T11:15:00Z",
        crimeType: "Fraud",
        crimeGroup: "Cheating",
        station: "MG Road Police Station",
        district: "Bengaluru Urban",
        status: "Chargesheeted",
        lat: 12.9756,
        lng: 77.6067,
        weapon: null,
        section: "IPC 420 / BNS 318",
        facts: "Impersonation through a fake bank call centre siphoning funds from senior citizens via phishing links.",
        accused: [{ name: "Suresh Patel", age: 29, profile: "Cyber syndicate operator" }],
        victims: [{ name: "Priya Gupta", age: 68, profile: "Pensioner" }],
      },
      {
        crimeNo: "FIR-2025-003",
        date: "2025-04-08T19:45:00Z",
        crimeType: "Theft",
        crimeGroup: "Theft",
        station: "Jayanagar Police Station",
        district: "Mysuru",
        status: "Solved",
        lat: 12.9308,
        lng: 77.5848,
        weapon: null,
        section: "IPC 379 / BNS 303",
        facts: "Motorcycle snatching reported near a crowded market lane during evening peak hours.",
        accused: [{ name: "Rajesh Kumar", age: 26, profile: "Vehicle thief" }],
        victims: [{ name: "Deepa Reddy", age: 32, profile: "Commuter" }],
      },
      {
        crimeNo: "FIR-2025-004",
        date: "2025-04-05T22:10:00Z",
        crimeType: "Assault",
        crimeGroup: "Hurt",
        station: "Indiranagar Police Station",
        district: "Bengaluru Urban",
        status: "Under Investigation",
        lat: 12.9784,
        lng: 77.6408,
        weapon: "Blunt Object",
        section: "IPC 324 / BNS 117",
        facts: "Physical altercation outside a pub following an argument over vehicle parking.",
        accused: [{ name: "Vijay Singh", age: 41, profile: "Local gang associate" }],
        victims: [{ name: "Sunil Verma", age: 29, profile: "IT professional" }],
      },
      {
        crimeNo: "FIR-2025-005",
        date: "2025-04-02T03:30:00Z",
        crimeType: "Vehicle Theft",
        crimeGroup: "Motor Vehicle Theft",
        station: "Whitefield Police Station",
        district: "Bengaluru Urban",
        status: "Pending",
        lat: 12.9698,
        lng: 77.7500,
        weapon: null,
        section: "IPC 379 / BNS 303",
        facts: "Luxury SUV stolen from apartment basement parking using frequency signal amplifiers.",
        accused: [{ name: "Mohammed Ali", age: 38, profile: "Interstate vehicle theft network" }],
        victims: [{ name: "Kavita Joshi", age: 45, profile: "Business owner" }],
      },
      {
        crimeNo: "FIR-2025-006",
        date: "2025-03-29T16:00:00Z",
        crimeType: "Cybercrime",
        crimeGroup: "Cheating",
        station: "Kadri Police Station",
        district: "Mangaluru",
        status: "Under Investigation",
        lat: 12.8731,
        lng: 74.8560,
        weapon: null,
        section: "IT Act 66D / IPC 420",
        facts: "Cryptocurrency investment scam defrauding local investors of multi-lakh sums.",
        accused: [{ name: "Suresh Patel", age: 29, profile: "Cyber operative" }],
        victims: [{ name: "Ramesh Bhat", age: 52, profile: "Trader" }],
      },
      {
        crimeNo: "FIR-2025-007",
        date: "2025-03-25T21:00:00Z",
        crimeType: "Robbery",
        crimeGroup: "Robbery",
        station: "Suburban Police Station",
        district: "Hubballi-Dharwad",
        status: "Under Investigation",
        lat: 15.3647,
        lng: 75.1240,
        weapon: "Knife",
        section: "IPC 392 / BNS 309",
        facts: "Waylaid a pedestrian near highway junction and robbed cash and mobile phone at knifepoint.",
        accused: [{ name: "Ravi Kumar", age: 34, profile: "Armed robbery suspect" }],
        victims: [{ name: "Anand Kulkarni", age: 35, profile: "Sales executive" }],
      },
      {
        crimeNo: "FIR-2025-008",
        date: "2025-03-20T10:30:00Z",
        crimeType: "Rioting",
        crimeGroup: "Rioting",
        station: "Station Bazaar",
        district: "Kalaburagi",
        status: "Chargesheeted",
        lat: 17.3297,
        lng: 76.8343,
        weapon: "Iron Rod",
        section: "IPC 147 / BNS 189",
        facts: "Clash between rival vendor groups leading to stone pelting and property damage near station premises.",
        accused: [{ name: "Vijay Singh", age: 41, profile: "Group leader" }],
        victims: [{ name: "Public Property", age: null, profile: "State assets" }],
      },
    ]

    // The first eight are curated examples; the rest are deterministic synthetic
    // training records so the dashboard has a representative analytical volume.
    const allFirs = [...firTemplates, ...generateSyntheticFirs(firTemplates.length + 1)]
    console.log(`--> Seeding ${allFirs.length} FIRs, Accused, Victims...`)

    if (allFirs.length !== TARGET_FIR_COUNT) {
      throw new Error(`Expected ${TARGET_FIR_COUNT} FIR seed records, received ${allFirs.length}`)
    }

    const firRows = await pool.query(
      `INSERT INTO firs (
         crime_no, date_time, crime_type, crime_group, district_id, police_station_id,
         status, latitude, longitude, brief_facts, weapon, section_law, fir_text
       )
       SELECT * FROM UNNEST(
         $1::varchar[], $2::timestamp[], $3::varchar[], $4::varchar[], $5::int[], $6::int[],
         $7::varchar[], $8::float8[], $9::float8[], $10::text[], $11::varchar[], $12::varchar[], $13::text[]
       ) AS seed(
         crime_no, date_time, crime_type, crime_group, district_id, police_station_id,
         status, latitude, longitude, brief_facts, weapon, section_law, fir_text
       )
       ON CONFLICT (crime_no) DO UPDATE SET
         date_time = EXCLUDED.date_time, crime_type = EXCLUDED.crime_type,
         crime_group = EXCLUDED.crime_group, district_id = EXCLUDED.district_id,
         police_station_id = EXCLUDED.police_station_id, status = EXCLUDED.status,
         latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
         brief_facts = EXCLUDED.brief_facts, weapon = EXCLUDED.weapon,
         section_law = EXCLUDED.section_law, fir_text = EXCLUDED.fir_text
       RETURNING id, crime_no`,
      [
        allFirs.map((f) => f.crimeNo), allFirs.map((f) => f.date), allFirs.map((f) => f.crimeType), allFirs.map((f) => f.crimeGroup),
        allFirs.map((f) => districtIds[f.district]), allFirs.map((f) => stationIds[f.station]), allFirs.map((f) => f.status),
        allFirs.map((f) => f.lat), allFirs.map((f) => f.lng), allFirs.map((f) => f.facts), allFirs.map((f) => f.weapon),
        allFirs.map((f) => f.section), allFirs.map((f) => f.firText || f.facts),
      ]
    )
    const firIdsByNumber = Object.fromEntries(firRows.rows.map((row) => [row.crime_no, row.id]))

    async function insertPeople(table, people) {
      if (people.length === 0) return
      await pool.query(
        `WITH input AS (
           SELECT * FROM UNNEST($1::int[], $2::varchar[], $3::int[], $4::text[])
           AS seed(fir_id, name, age, profile)
         )
         INSERT INTO ${table} (fir_id, name, age, profile)
         SELECT fir_id, name, age, profile FROM input i
         WHERE NOT EXISTS (
           SELECT 1 FROM ${table} p
           WHERE p.fir_id = i.fir_id AND p.name = i.name
             AND p.age IS NOT DISTINCT FROM i.age AND p.profile IS NOT DISTINCT FROM i.profile
         )`,
        [people.map((p) => p.firId), people.map((p) => p.name), people.map((p) => p.age), people.map((p) => p.profile)]
      )
    }

    const accusedRows = allFirs.flatMap((f) => f.accused.map((person) => ({ ...person, firId: firIdsByNumber[f.crimeNo] })))
    const victimRows = allFirs.flatMap((f) => f.victims.map((person) => ({ ...person, firId: firIdsByNumber[f.crimeNo] })))
    await Promise.all([insertPeople("accused", accusedRows), insertPeople("victims", victimRows)])

    // A bounded batch keeps remote PostgreSQL seeding fast without overwhelming
    // the connection pool.
    if (process.env.SEED_FIR_ROW_BY_ROW === "true") {
    for (let offset = 0; offset < allFirs.length; offset += 50) {
      await Promise.all(allFirs.slice(offset, offset + 50).map(async (f) => {
      const stId = stationIds[f.station]
      const distId = districtIds[f.district]
      const firRes = await pool.query(
        `INSERT INTO firs (crime_no, date_time, crime_type, crime_group, district_id, police_station_id, status, latitude, longitude, brief_facts, weapon, section_law, fir_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (crime_no) DO UPDATE SET status = EXCLUDED.status
         RETURNING id`,
        [f.crimeNo, f.date, f.crimeType, f.crimeGroup, distId, stId, f.status, f.lat, f.lng, f.facts, f.weapon, f.section, f.firText || f.facts]
      )
      const firId = firRes.rows[0].id

      for (const acc of f.accused) {
        await pool.query(
          `INSERT INTO accused (fir_id, name, age, profile)
           SELECT $1::int, $2::varchar, $3::int, $4::text
           WHERE NOT EXISTS (
             SELECT 1 FROM accused
             WHERE fir_id = $1::int AND name = $2::varchar AND age IS NOT DISTINCT FROM $3::int AND profile IS NOT DISTINCT FROM $4::text
           )`,
          [firId, acc.name, acc.age, acc.profile]
        )
      }
      for (const vic of f.victims) {
        await pool.query(
          `INSERT INTO victims (fir_id, name, age, profile)
           SELECT $1::int, $2::varchar, $3::int, $4::text
           WHERE NOT EXISTS (
             SELECT 1 FROM victims
             WHERE fir_id = $1::int AND name = $2::varchar AND age IS NOT DISTINCT FROM $3::int AND profile IS NOT DISTINCT FROM $4::text
           )`,
          [firId, vic.name, vic.age, vic.profile]
        )
      }
      }))
    }
    }

    console.log("--> Seeding Gangs...")
    const gangsData = [
      { code: "G-001", name: "Koramangala Cartel", leader: "Ravi Kumar", area: "Koramangala", members: 12, influence: 88.0, status: "active", formed: "2023-06" },
      { code: "G-002", name: "Whitefield Network", leader: "Suresh Patel", area: "Whitefield", members: 9, influence: 76.5, status: "active", formed: "2023-09" },
      { code: "G-003", name: "MG Road Syndicate", leader: "Vijay Singh", area: "MG Road", members: 15, influence: 92.0, status: "active", formed: "2022-03" },
      { code: "G-004", name: "Indiranagar Crew", leader: "Rajesh Kumar", area: "Indiranagar", members: 7, influence: 61.0, status: "emerging", formed: "2024-01" },
    ]

    for (const g of gangsData) {
      await pool.query(
        `INSERT INTO gangs (gang_code, name, leader, area, members, influence, status, formed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (gang_code) DO NOTHING`,
        [g.code, g.name, g.leader, g.area, g.members, g.influence, g.status, g.formed]
      )
    }

    console.log("--> Seeding Criminals...")
    const criminalsData = [
      { code: "C-001", name: "Ravi Kumar", age: 34, crimes: 24, influence: 88.0, betweenness: 0.76, repeat: true, status: "active", gang: "Koramangala Cartel", lastArrest: "2025-02-15" },
      { code: "C-002", name: "Vijay Singh", age: 41, crimes: 31, influence: 92.0, betweenness: 0.82, repeat: true, status: "active", gang: "MG Road Syndicate", lastArrest: "2025-01-20" },
      { code: "C-003", name: "Suresh Patel", age: 29, crimes: 18, influence: 76.5, betweenness: 0.65, repeat: true, status: "active", gang: "Whitefield Network", lastArrest: "2025-03-10" },
      { code: "C-004", name: "Rajesh Kumar", age: 26, crimes: 12, influence: 61.0, betweenness: 0.54, repeat: false, status: "active", gang: "Indiranagar Crew", lastArrest: "2025-04-01" },
      { code: "C-005", name: "Mohammed Ali", age: 38, crimes: 8, influence: 45.0, betweenness: 0.38, repeat: true, status: "inactive", gang: null, lastArrest: "2024-11-05" },
    ]

    for (const c of criminalsData) {
      await pool.query(
        `INSERT INTO criminals (criminal_code, name, age, crimes, influence, betweenness, repeat, status, gang_name, last_arrest)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (criminal_code) DO NOTHING`,
        [c.code, c.name, c.age, c.crimes, c.influence, c.betweenness, c.repeat, c.status, c.gang, c.lastArrest]
      )
    }

    console.log("--> Seeding Forecasts...")
    const forecastsData = [
      { date: "2025-04-13", prob: 78.5, type: "Burglary", conf: "high", dist: "Bengaluru Urban", st: "Koramangala Police Station", exp: "Elevated movement and nighttime activity", model: "xgboost-v1" },
      { date: "2025-04-14", prob: 64.2, type: "Fraud", conf: "medium", dist: "Bengaluru Urban", st: "MG Road Police Station", exp: "Recent phishing patterns detected", model: "xgboost-v1" },
      { date: "2025-04-15", prob: 52.8, type: "Cybercrime", conf: "medium", dist: "Mangaluru", st: "Kadri Police Station", exp: "Investment scam campaigns identified", model: "lightgbm-v2" },
      { date: "2025-04-16", prob: 71.3, type: "Assault", conf: "high", dist: "Bengaluru Urban", st: "Indiranagar Police Station", exp: "Weekend high-density entertainment cluster", model: "xgboost-v1" },
    ]

    for (const fc of forecastsData) {
      await pool.query(
        `INSERT INTO forecasts (forecast_date, probability, crime_type, confidence, district, station, explanation, model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [fc.date, fc.prob, fc.type, fc.conf, fc.dist, fc.st, fc.exp, fc.model]
      )
    }

    console.log("--> Seeding Hotspots...")
    const hotspotsData = [
      { code: "H-001", name: "Koramangala 4th Block", district: "Bengaluru Urban", lat: 12.9352, lng: 77.6245, risk: 92.0, incidents: 45, trend: "increasing" },
      { code: "H-002", name: "MG Road Commercial Belt", district: "Bengaluru Urban", lat: 12.9756, lng: 77.6067, risk: 87.5, incidents: 38, trend: "stable" },
      { code: "H-003", name: "Indiranagar 100ft Road", district: "Bengaluru Urban", lat: 12.9784, lng: 77.6408, risk: 78.0, incidents: 32, trend: "increasing" },
      { code: "H-004", name: "Whitefield IT Corridor", district: "Bengaluru Urban", lat: 12.9698, lng: 77.7500, risk: 74.2, incidents: 28, trend: "stable" },
      { code: "H-005", name: "Jayanagar Shopping Complex", district: "Mysuru", lat: 12.9308, lng: 77.5848, risk: 65.0, incidents: 22, trend: "decreasing" },
    ]

    for (const hs of hotspotsData) {
      await pool.query(
        `INSERT INTO hotspots (hotspot_code, name, district, lat, lng, risk, incidents, trend)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (hotspot_code) DO NOTHING`,
        [hs.code, hs.name, hs.district, hs.lat, hs.lng, hs.risk, hs.incidents, hs.trend]
      )
    }

    console.log("--> Seeding Anomalies...")
    const anomaliesData = [
      { code: "A-001", type: "Spatial", desc: "Unusual concentration of burglaries in Koramangala 4th Block", score: 94.0, date: "2025-04-12", status: "investigating" },
      { code: "A-002", type: "Temporal", desc: "Spike in cybercrime reports during evening hours (6-9PM)", score: 88.5, date: "2025-04-11", status: "confirmed" },
      { code: "A-003", type: "Modus", desc: "New MO pattern detected in vehicle thefts - signal amplifier method", score: 82.0, date: "2025-04-10", status: "investigating" },
      { code: "A-004", type: "Network", desc: "Unusual communication pattern between known repeat offenders", score: 76.2, date: "2025-04-09", status: "pending" },
    ]

    for (const an of anomaliesData) {
      await pool.query(
        `INSERT INTO anomalies (anomaly_code, type, description, score, date, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (anomaly_code) DO NOTHING`,
        [an.code, an.type, an.desc, an.score, an.date, an.status]
      )
    }

    console.log("--> Seeding Trends...")
    const trendsData = [
      { type: "Burglary", recent: 12, hist: 6.5, spike: 1.85, severity: "elevated" },
      { type: "Fraud", recent: 15, hist: 5.0, spike: 3.00, severity: "critical" },
      { type: "Theft", recent: 20, hist: 18.0, spike: 1.11, severity: "normal" },
      { type: "Assault", recent: 8, hist: 7.5, spike: 1.07, severity: "normal" },
      { type: "Vehicle Theft", recent: 10, hist: 4.0, spike: 2.50, severity: "critical" },
    ]

    for (const tr of trendsData) {
      await pool.query(
        `INSERT INTO trends (crime_type, recent_count, historical_avg, spike_ratio, severity)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (crime_type) DO UPDATE SET recent_count = EXCLUDED.recent_count, spike_ratio = EXCLUDED.spike_ratio`,
        [tr.type, tr.recent, tr.hist, tr.spike, tr.severity]
      )
    }

    console.log("--> Seeding Notifications...")
    const notificationsData = [
      { title: "Critical Trend Alert: Cyber Fraud Spike", message: "Phishing fraud incidents in MG Road area jumped by 300% over the past 14 days." },
      { title: "Hotspot Warning: Koramangala 4th Block", message: "Night burglary risk score elevated to 92.0. Recommend increased patrol deployment." },
      { title: "New Case Review Required", message: "FIR-2025-001 (Burglary) tagged with high MO fingerprint similarity to regional serial cases." },
    ]

    for (const n of notificationsData) {
      await pool.query(
        `INSERT INTO notifications (title, message) VALUES ($1, $2)`,
        [n.title, n.message]
      )
    }

    console.log("--> Database seeding completed successfully!")
  } catch (err) {
    console.error("--> Error seeding database:", err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seed()
