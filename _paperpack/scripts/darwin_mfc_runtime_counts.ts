#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import * as fs from "node:fs";
import * as path from "node:path";

type EntryRecord = Record<string, unknown>;

type DuplicateItem = {
  id: string;
  count: number;
  sample_names: string[];
  raw_ids: string[];
  origins: string[];
};

type MissingIdItem = {
  index: number;
  reason: "missing_id" | "empty_id";
  sample_name: string;
  raw_id_value: string | null;
  origins: string[];
};

type AnalyzeResult = {
  raw_count: number;
  unique_count_by_id: number;
  duplicates_report: DuplicateItem[];
  missing_id_report: MissingIdItem[];
};

type OriginBuildResult = {
  objectOrigins: Map<object, Set<string>>;
  idOrigins: Map<string, Set<string>>;
  importErrors: Array<{ file: string; error: string }>;
};

function toPosix(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function normalizeId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function getStringField(obj: EntryRecord, keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function safeGit(cwd: string, args: string[]): string {
  try {
    return execSync(`git ${args.join(" ")}`, { cwd, encoding: "utf8" }).trim();
  } catch {
    return "NOT_AVAILABLE";
  }
}

function getSubmoduleCommit(repoRoot: string): string {
  const status = safeGit(repoRoot, ["submodule", "status", "darwin-MFC"]);
  if (status === "NOT_AVAILABLE" || !status) return "NOT_AVAILABLE";
  const token = status.split(/\s+/)[0] || "";
  const cleaned = token.replace(/^[+\-U ]+/, "");
  return cleaned || "NOT_AVAILABLE";
}

function listTsFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(abs);
      } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        files.push(abs);
      }
    }
  }

  return files.sort();
}

function addOrigin(map: Map<string, Set<string>>, id: string, origin: string): void {
  if (!map.has(id)) map.set(id, new Set<string>());
  map.get(id)?.add(origin);
}

function collectIdOrigins(files: string[], repoRoot: string): Map<string, Set<string>> {
  const idOrigins = new Map<string, Set<string>>();
  const idRegex = /\bid\s*:\s*(['"`])([^'"`\r\n]+)\1/g;

  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    const relative = toPosix(path.relative(repoRoot, file));
    let match: RegExpExecArray | null;
    while ((match = idRegex.exec(text)) !== null) {
      const normalized = normalizeId(match[2]);
      if (normalized) {
        addOrigin(idOrigins, normalized, relative);
      }
    }
  }

  return idOrigins;
}

function addObjectOrigin(map: Map<object, Set<string>>, obj: object, origin: string): void {
  if (!map.has(obj)) map.set(obj, new Set<string>());
  map.get(obj)?.add(origin);
}

async function installDarwinAliasResolver(darwinRoot: string): Promise<void> {
  const moduleNs = (await import("node:module")) as unknown as {
    _resolveFilename?: (...args: unknown[]) => string;
    default?: { _resolveFilename?: (...args: unknown[]) => string };
  };
  const moduleObj = (moduleNs.default ?? moduleNs) as {
    _resolveFilename?: (...args: unknown[]) => string;
  };

  if (typeof moduleObj._resolveFilename !== "function") return;
  const currentResolve = moduleObj._resolveFilename;
  if ((currentResolve as { __darwinAliasPatched?: boolean }).__darwinAliasPatched) return;

  const originalResolve = currentResolve.bind(moduleObj);
  const patchedResolve = ((request: unknown, parent: unknown, isMain: unknown, options: unknown) => {
    if (typeof request === "string" && request.startsWith("@/")) {
      const mapped = path.join(darwinRoot, request.slice(2));
      try {
        return originalResolve(mapped, parent, isMain, options);
      } catch {
        // fall through to original request
      }
    }
    return originalResolve(request, parent, isMain, options);
  }) as typeof currentResolve & { __darwinAliasPatched?: boolean };
  patchedResolve.__darwinAliasPatched = true;
  moduleObj._resolveFilename = patchedResolve;
}

async function collectOrigins(files: string[], repoRoot: string): Promise<OriginBuildResult> {
  const objectOrigins = new Map<object, Set<string>>();
  const importErrors: Array<{ file: string; error: string }> = [];
  const idOrigins = collectIdOrigins(files, repoRoot);

  for (const file of files) {
    const relative = toPosix(path.relative(repoRoot, file));
    try {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
      for (const [exportName, value] of Object.entries(mod)) {
        if (!Array.isArray(value)) continue;
        for (const item of value) {
          if (item && typeof item === "object") {
            addObjectOrigin(objectOrigins, item as object, `${relative}#${exportName}`);
          }
        }
      }
    } catch (error) {
      importErrors.push({
        file: relative,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    objectOrigins,
    idOrigins,
    importErrors,
  };
}

function getOriginsForEntry(
  entry: unknown,
  normalizedId: string | null,
  objectOrigins: Map<object, Set<string>>,
  idOrigins: Map<string, Set<string>>,
): string[] {
  const origins = new Set<string>();
  if (entry && typeof entry === "object") {
    const mapped = objectOrigins.get(entry as object);
    if (mapped) {
      for (const origin of mapped) origins.add(origin);
    }
  }
  if (normalizedId) {
    const fallback = idOrigins.get(normalizedId);
    if (fallback) {
      for (const origin of fallback) origins.add(origin);
    }
  }
  return [...origins].sort();
}

function analyzeEntries(
  entries: unknown[],
  objectOrigins: Map<object, Set<string>>,
  idOrigins: Map<string, Set<string>>,
  namePriority: string[],
): AnalyzeResult {
  const byNormalizedId = new Map<
    string,
    { count: number; sampleNames: Set<string>; rawIds: Set<string>; origins: Set<string> }
  >();
  const missingIdReport: MissingIdItem[] = [];

  entries.forEach((entry, index) => {
    const asRecord: EntryRecord = entry && typeof entry === "object" ? (entry as EntryRecord) : {};
    const hasId = Object.prototype.hasOwnProperty.call(asRecord, "id");
    const rawId = hasId ? asRecord.id : null;
    const normalizedId = normalizeId(rawId);
    const sampleName = getStringField(asRecord, namePriority) || "(unnamed)";
    const origins = getOriginsForEntry(entry, normalizedId, objectOrigins, idOrigins);

    if (!normalizedId) {
      missingIdReport.push({
        index,
        reason: hasId ? "empty_id" : "missing_id",
        sample_name: sampleName,
        raw_id_value: rawId === null || rawId === undefined ? null : String(rawId),
        origins,
      });
      return;
    }

    if (!byNormalizedId.has(normalizedId)) {
      byNormalizedId.set(normalizedId, {
        count: 0,
        sampleNames: new Set<string>(),
        rawIds: new Set<string>(),
        origins: new Set<string>(),
      });
    }

    const bucket = byNormalizedId.get(normalizedId);
    if (!bucket) return;
    bucket.count += 1;
    if (sampleName !== "(unnamed)") bucket.sampleNames.add(sampleName);
    if (rawId !== null && rawId !== undefined && String(rawId).trim()) {
      bucket.rawIds.add(String(rawId).trim());
    }
    for (const origin of origins) bucket.origins.add(origin);
  });

  const duplicatesReport: DuplicateItem[] = [...byNormalizedId.entries()]
    .filter(([, item]) => item.count > 1)
    .map(([id, item]) => ({
      id,
      count: item.count,
      sample_names: [...item.sampleNames].sort().slice(0, 5),
      raw_ids: [...item.rawIds].sort(),
      origins: [...item.origins].sort(),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.id.localeCompare(b.id);
    });

  missingIdReport.sort((a, b) => a.index - b.index);

  return {
    raw_count: entries.length,
    unique_count_by_id: byNormalizedId.size,
    duplicates_report: duplicatesReport,
    missing_id_report: missingIdReport,
  };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildDuplicatesCsv(diseaseDuplicates: DuplicateItem[], medDuplicates: DuplicateItem[]): string {
  const header = [
    "kind(disease/med)",
    "id",
    "count",
    "sample_names",
    "origins(if detectable)",
  ];
  const rows: string[] = [header.join(",")];

  const pushRows = (kind: "disease" | "med", items: DuplicateItem[]): void => {
    for (const item of items) {
      rows.push(
        [
          kind,
          item.id,
          String(item.count),
          item.sample_names.join(" | "),
          item.origins.join(" | "),
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  };

  pushRows("disease", diseaseDuplicates);
  pushRows("med", medDuplicates);
  return `${rows.join("\n")}\n`;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected array export "${label}" but received ${typeof value}`);
  }
  return value;
}

function scriptHash(scriptPath: string): string {
  const content = fs.readFileSync(scriptPath);
  return createHash("sha256").update(content).digest("hex");
}

async function main(): Promise<void> {
  const scriptPath = path.resolve(process.argv[1] ?? "_paperpack/scripts/darwin_mfc_runtime_counts.ts");
  const scriptsDir = path.dirname(scriptPath);
  const packDir = path.resolve(scriptsDir, "..");
  const repoRoot = path.resolve(packDir, "..");
  const derivedDir = path.join(packDir, "derived");
  fs.mkdirSync(derivedDir, { recursive: true });

  const darwinRoot = path.join(repoRoot, "darwin-MFC");
  const doencasIndexPath = path.join(darwinRoot, "lib", "data", "doencas", "index.ts");
  const medicamentosIndexPath = path.join(darwinRoot, "lib", "data", "medicamentos", "index.ts");

  await installDarwinAliasResolver(darwinRoot);

  const doencasModule = (await import(pathToFileURL(doencasIndexPath).href)) as Record<string, unknown>;
  const medicamentosModule = (await import(pathToFileURL(medicamentosIndexPath).href)) as Record<string, unknown>;

  const todasDoencas = asArray(doencasModule.todasDoencas, "todasDoencas");
  const todosMedicamentos = asArray(medicamentosModule.todosMedicamentos, "todosMedicamentos");

  const doencasSourceFiles = [
    path.join(darwinRoot, "lib", "data", "doencas.ts"),
    ...listTsFiles(path.join(darwinRoot, "lib", "data", "doencas")),
  ].filter((file, index, arr) => fs.existsSync(file) && arr.indexOf(file) === index);

  const medicamentosSourceFiles = [
    path.join(darwinRoot, "lib", "data", "medicamentos.ts"),
    path.join(darwinRoot, "lib", "data", "medicamentos-expanded.ts"),
    ...listTsFiles(path.join(darwinRoot, "lib", "data", "medicamentos")),
  ].filter((file, index, arr) => fs.existsSync(file) && arr.indexOf(file) === index);

  const doencasOrigins = await collectOrigins(doencasSourceFiles, repoRoot);
  const medicamentosOrigins = await collectOrigins(medicamentosSourceFiles, repoRoot);

  const diseases = analyzeEntries(
    todasDoencas,
    doencasOrigins.objectOrigins,
    doencasOrigins.idOrigins,
    ["titulo", "nome", "name"],
  );
  const medications = analyzeEntries(
    todosMedicamentos,
    medicamentosOrigins.objectOrigins,
    medicamentosOrigins.idOrigins,
    ["nomeGenerico", "nome", "name"],
  );

  const documentedDiseaseCount = 368;
  const documentedMedicationCount = 690;
  const diseaseMatches = diseases.unique_count_by_id === documentedDiseaseCount;
  const medicationMatches = medications.unique_count_by_id === documentedMedicationCount;

  const outputJsonPath = path.join(derivedDir, "darwin_mfc_runtime_counts.json");
  const outputCsvPath = path.join(derivedDir, "darwin_mfc_duplicates.csv");

  const payload = {
    timestamp_utc: new Date().toISOString(),
    repo_commit: safeGit(repoRoot, ["rev-parse", "HEAD"]),
    submodule_commit: getSubmoduleCommit(repoRoot),
    node_version: process.version,
    script_path: toPosix(path.relative(repoRoot, scriptPath)),
    script_hash_sha256: scriptHash(scriptPath),
    source_indexes: {
      diseases: toPosix(path.relative(repoRoot, doencasIndexPath)),
      medications: toPosix(path.relative(repoRoot, medicamentosIndexPath)),
    },
    diseases,
    medications,
    documented_targets: {
      diseases: documentedDiseaseCount,
      medications: documentedMedicationCount,
      diseases_match: diseaseMatches,
      medications_match: medicationMatches,
    },
    diagnostics: {
      disease_origin_import_errors: doencasOrigins.importErrors,
      medication_origin_import_errors: medicamentosOrigins.importErrors,
    },
  };

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const csv = buildDuplicatesCsv(diseases.duplicates_report, medications.duplicates_report);
  fs.writeFileSync(outputCsvPath, csv, "utf8");

  console.log(`wrote_json: ${toPosix(path.relative(repoRoot, outputJsonPath))}`);
  console.log(`wrote_csv: ${toPosix(path.relative(repoRoot, outputCsvPath))}`);
  console.log(
    `diseases_raw_vs_unique: ${diseases.raw_count} vs ${diseases.unique_count_by_id} (target ${documentedDiseaseCount}; match=${diseaseMatches})`,
  );
  console.log(
    `medications_raw_vs_unique: ${medications.raw_count} vs ${medications.unique_count_by_id} (target ${documentedMedicationCount}; match=${medicationMatches})`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
  console.error(message);
  process.exit(1);
});
