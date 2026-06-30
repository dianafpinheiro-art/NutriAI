export function logger(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  if (level === "error") {
    console.error(`[${timestamp}] [ERROR] ${message}${metaStr}`);
  } else if (level === "warn") {
    console.warn(`[${timestamp}] [WARN] ${message}${metaStr}`);
  } else {
    console.log(`[${timestamp}] [INFO] ${message}${metaStr}`);
  }
}
