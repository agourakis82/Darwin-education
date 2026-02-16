import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

type DarwinMfcRuntimeCounts = {
  timestamp_utc?: string
  repo_commit?: string
  submodule_commit?: string
  node_version?: string
  script_path?: string
  script_hash_sha256?: string
  source_indexes?: { diseases?: string; medications?: string }
  diseases?: { raw_count?: number; unique_count_by_id?: number }
  medications?: { raw_count?: number; unique_count_by_id?: number }
}

function safeReadJson(filePath: string): DarwinMfcRuntimeCounts | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    if (!raw) return null
    return JSON.parse(raw) as DarwinMfcRuntimeCounts
  } catch {
    return null
  }
}

let cachedRuntimeCounts: DarwinMfcRuntimeCounts | null | undefined

export function getDarwinMfcProvenance(): DarwinMfcRuntimeCounts {
  if (cachedRuntimeCounts !== undefined) return cachedRuntimeCounts ?? {}

  const candidates = [
    // If the app is started from repo root.
    path.join(process.cwd(), '_paperpack', 'derived', 'darwin_mfc_runtime_counts.json'),
    // Typical monorepo path when Next.js runs from apps/web.
    path.join(process.cwd(), '..', '..', '_paperpack', 'derived', 'darwin_mfc_runtime_counts.json'),
  ]

  for (const candidate of candidates) {
    const parsed = safeReadJson(candidate)
    if (parsed) {
      cachedRuntimeCounts = parsed
      return parsed
    }
  }

  cachedRuntimeCounts = null
  return {}
}
