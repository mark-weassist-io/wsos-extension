import { join } from "path"

export const config = {
  port: parseInt(Bun.env.PORT || "3000", 10),
  host: Bun.env.HOST || "0.0.0.0",
  dbPath: Bun.env.DB_PATH || join(import.meta.dir, "..", "data", "wsos-extension.db"),
  nodeEnv: Bun.env.NODE_ENV || "development",
} as const

if (config.port < 1 || config.port > 65535) {
  throw new Error(`Invalid PORT: ${config.port}`)
}
