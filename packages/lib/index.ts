export function generateCrimeNo(
  categoryCode: string,
  districtCode: number,
  psCode: number,
  year: number,
  serial: number,
): string {
  const cat = categoryCode.padStart(1, "0");
  const dist = districtCode.toString().padStart(4, "0");
  const ps = psCode.toString().padStart(4, "0");
  const yr = year.toString().padStart(4, "0");
  const ser = serial.toString().padStart(5, "0");
  return `${cat}${dist}${ps}${yr}${ser}`;
}

export function generateCaseNo(
  year: number,
  psCode: number,
  serial: number,
): string {
  return `${year}/${psCode}/${serial}`;
}

export function parseCrimeNo(crimeNo: string): {
  categoryCode: string;
  districtCode: string;
  psCode: string;
  year: string;
  serial: string;
} {
  return {
    categoryCode: crimeNo.slice(0, 1),
    districtCode: crimeNo.slice(1, 5),
    psCode: crimeNo.slice(5, 9),
    year: crimeNo.slice(9, 13),
    serial: crimeNo.slice(13, 18),
  };
}

export function calculateAge(dob: Date): number {
  const diff = Date.now() - dob.getTime();
  return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(
    Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

export function generatePassword(length = 12): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;
  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDateTime(date: Date): string {
  return date.toISOString().replace("T", " ").split(".")[0];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function computeDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number,
): boolean {
  return computeDistance(lat1, lon1, lat2, lon2) <= radiusKm;
}
