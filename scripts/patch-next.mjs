import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")

const searchPaths = [
  path.join(repoRoot, "node_modules", "next", "dist", "export", "routes", "app-page.js"),
  path.join(repoRoot, "node_modules", "@zcatalyst", "nextjs-plugin", "node_modules", "next", "dist", "export", "routes", "app-page.js"),
  path.join(repoRoot, "apps", "web", "node_modules", "next", "dist", "export", "routes", "app-page.js"),
]

let filePath
for (const p of searchPaths) {
  if (fs.existsSync(p)) {
    filePath = p
    break
  }
}

if (!filePath) {
  process.exit(0)
}

let content = fs.readFileSync(filePath, "utf8")

const search = 'if (page === _entryconstants.UNDERSCORE_GLOBAL_ERROR_ROUTE_ENTRY) {'
const replace =
  search +
  " return { cacheControl: { revalidate: 0, expire: undefined }, fetchMetrics: undefined, hasStaticRsc: false, hasPostponed: false, metadata: {} };"

if (content.includes(search)) {
  content = content.replace(search, replace)
  fs.writeFileSync(filePath, content)
}
