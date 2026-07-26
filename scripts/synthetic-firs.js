const TARGET_FIR_COUNT = 1000
const stations = [
  ["Koramangala Police Station", "Bengaluru Urban", 12.9352, 77.6245, ["4th Block", "80 Feet Road", "Sony Signal junction"]],
  ["MG Road Police Station", "Bengaluru Urban", 12.9756, 77.6067, ["MG Road commercial belt", "Brigade Road", "Trinity Circle"]],
  ["Indiranagar Police Station", "Bengaluru Urban", 12.9784, 77.6408, ["100 Feet Road", "Defence Colony", "CMH Road"]],
  ["Whitefield Police Station", "Bengaluru Urban", 12.9698, 77.75, ["ITPL Main Road", "Hope Farm junction", "EPIP Zone"]],
  ["Jayanagar Police Station", "Mysuru", 12.3052, 76.6552, ["Jayanagar locality", "Sayyaji Rao Road", "Devaraja Market area"]],
  ["Devaraja Police Station", "Mysuru", 12.3098, 76.6528, ["Devaraja Market", "Dhanvanthri Road", "K R Circle"]],
  ["Suburban Police Station", "Hubballi-Dharwad", 15.3647, 75.124, ["Gokul Road", "Keshwapur", "Old Hubballi market"]],
  ["Kadri Police Station", "Mangaluru", 12.8731, 74.856, ["Kadri Park Road", "Kankanady", "Hampankatta"]],
  ["Camp Police Station", "Belagavi", 15.8497, 74.4977, ["Camp area", "Khanapur Road", "Tilakwadi"]],
  ["Station Bazaar", "Kalaburagi", 17.3297, 76.8343, ["Station Bazaar", "Super Market Road", "GDA Layout"]],
]
const crimes = [
  ["Theft", "Theft", "BNS 303 / IPC 379", null, "an unknown person removed a mobile phone and wallet from the premises"],
  ["Vehicle Theft", "Motor Vehicle Theft", "BNS 303 / IPC 379", null, "a secured two-wheeler parked in the area was found missing"],
  ["Burglary", "House Breaking", "BNS 305 / IPC 457", "Screwdriver", "entry was gained into a locked property and valuables were reported missing"],
  ["Fraud", "Cheating", "BNS 318(4) / IPC 420", null, "a caller posing as a service representative induced an online transfer"],
  ["Cybercrime", "Cyber Fraud", "IT Act 66D / BNS 318(4)", null, "a fraudulent link and follow-up calls led to an unauthorised digital payment"],
  ["Assault", "Hurt", "BNS 115(2) / IPC 323", "Blunt Object", "following an argument, the complainant alleged physical assault and sought medical examination"],
  ["Robbery", "Robbery", "BNS 309 / IPC 392", "Knife", "cash and personal belongings were allegedly taken after threats of force"],
  ["Criminal Trespass", "Trespass", "BNS 329 / IPC 447", null, "unauthorised entry into a restricted property and damage to a boundary fixture were reported"],
]
const firstNames = ["Aarav", "Aditya", "Amit", "Anil", "Arjun", "Deepak", "Divya", "Ganesh", "Karthik", "Kavya", "Meera", "Naveen", "Pooja", "Rahul", "Sanjana", "Shreya", "Suman", "Varun"]
const lastNames = ["Bhat", "Gowda", "Gupta", "Hegde", "Jain", "Khan", "Kulkarni", "Kumar", "Naik", "Patel", "Rao", "Reddy", "Sharma", "Shetty", "Singh", "Verma"]

function generateSyntheticFirs(startAt) {
  let seed = 20250412
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296)
  const pick = (values) => values[Math.floor(random() * values.length)]
  const name = () => `${pick(firstNames)} ${pick(lastNames)}`
  const rows = []
  const earliest = Date.UTC(2024, 0, 1)
  const span = Date.UTC(2025, 3, 12) - earliest
  for (let number = startAt; number <= TARGET_FIR_COUNT; number += 1) {
    const [station, district, lat, lng, places] = pick(stations)
    const [crimeType, crimeGroup, section, weapon, detail] = pick(crimes)
    const date = new Date(earliest + Math.floor(random() * span))
    date.setUTCHours(Math.floor(random() * 24), Math.floor(random() * 60), 0, 0)
    const status = pick(["Under Investigation", "Under Investigation", "Solved", "Chargesheeted", "Pending"])
    const facts = `The complainant reported that ${detail} near ${pick(places)}.`
    rows.push({
      crimeNo: `FIR-2025-${String(number).padStart(3, "0")}`, date: date.toISOString(), crimeType, crimeGroup, station, district, status,
      lat: Number((lat + (random() - 0.5) * 0.018).toFixed(6)), lng: Number((lng + (random() - 0.5) * 0.018).toFixed(6)), weapon, section, facts,
      firText: `Synthetic training record for dashboard development. On ${date.toISOString().slice(0, 10)}, ${facts} Preliminary classification: ${crimeType}.`,
      accused: status === "Solved" || status === "Chargesheeted" || random() < 0.28 ? [{ name: name(), age: 20 + Math.floor(random() * 36), profile: "Synthetic suspect record for analytical demonstration" }] : [],
      victims: [{ name: name(), age: 19 + Math.floor(random() * 55), profile: "Synthetic complainant record for analytical demonstration" }],
    })
  }
  return rows
}

module.exports = { TARGET_FIR_COUNT, generateSyntheticFirs }
