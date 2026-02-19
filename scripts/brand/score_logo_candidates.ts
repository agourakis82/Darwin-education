import fs from 'node:fs'
import path from 'node:path'

type WeightKey =
  | 'silhouette_distinctiveness'
  | 'legibility_24px'
  | 'dark_light_versatility'
  | 'non_cliche_uniqueness'
  | 'lockup_balance'
  | 'app_icon_fit'
  | 'production_readiness'

type CandidateRow = {
  candidate_id: string
  variant_file: string
  silhouette_distinctiveness: number
  legibility_24px: number
  dark_light_versatility: number
  non_cliche_uniqueness: number
  lockup_balance: number
  app_icon_fit: number
  production_readiness: number
  notes?: string
}

type ScoredCandidate = CandidateRow & {
  total_score: number
  grade: string
  status: 'APPROVED' | 'REVIEW' | 'REJECT' | 'FAIL_CRITICAL'
  critical_fail: boolean
}

const WEIGHTS: Record<WeightKey, number> = {
  silhouette_distinctiveness: 0.2,
  legibility_24px: 0.2,
  dark_light_versatility: 0.15,
  non_cliche_uniqueness: 0.15,
  lockup_balance: 0.1,
  app_icon_fit: 0.1,
  production_readiness: 0.1,
}

const REQUIRED_HEADERS = [
  'candidate_id',
  'variant_file',
  'silhouette_distinctiveness',
  'legibility_24px',
  'dark_light_versatility',
  'non_cliche_uniqueness',
  'lockup_balance',
  'app_icon_fit',
  'production_readiness',
  'notes',
] as const

type CliOptions = {
  input: string
  out?: string
  top: number
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    input: 'scripts/brand/logo_scorecard_template.csv',
    top: 10,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const nextArg = argv[index + 1]

    if (arg === '--input' && nextArg) {
      options.input = nextArg
      index += 1
      continue
    }

    if (arg === '--out' && nextArg) {
      options.out = nextArg
      index += 1
      continue
    }

    if (arg === '--top' && nextArg) {
      const parsedTop = Number(nextArg)
      if (!Number.isNaN(parsedTop) && parsedTop > 0) {
        options.top = Math.floor(parsedTop)
      }
      index += 1
      continue
    }
  }

  return options
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let value = ''
  let insideQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const nextChar = line[index + 1]

    if (char === '"' && insideQuotes && nextChar === '"') {
      value += '"'
      index += 1
      continue
    }

    if (char === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === ',' && !insideQuotes) {
      values.push(value.trim())
      value = ''
      continue
    }

    value += char
  }

  values.push(value.trim())
  return values
}

function parseScoreField(
  row: Record<string, string>,
  key: WeightKey,
  candidateId: string
): number {
  const rawValue = row[key]
  const parsed = Number(rawValue)

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value for "${key}" in candidate "${candidateId}": "${rawValue}"`)
  }

  if (parsed < 1 || parsed > 5) {
    throw new Error(`Score out of range for "${key}" in candidate "${candidateId}". Expected 1-5.`)
  }

  return parsed
}

function parseCsvFile(inputPath: string): CandidateRow[] {
  const content = fs.readFileSync(inputPath, 'utf8')
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  if (lines.length < 2) {
    throw new Error('CSV must include one header row and at least one candidate row.')
  }

  const headers = parseCsvLine(lines[0])
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header))

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}`)
  }

  const rows: CandidateRow[] = []

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    const values = parseCsvLine(lines[lineIndex])
    const rowMap: Record<string, string> = {}

    headers.forEach((header, headerIndex) => {
      rowMap[header] = values[headerIndex] ?? ''
    })

    const candidateId = rowMap.candidate_id || `row-${lineIndex}`

    rows.push({
      candidate_id: candidateId,
      variant_file: rowMap.variant_file,
      silhouette_distinctiveness: parseScoreField(rowMap, 'silhouette_distinctiveness', candidateId),
      legibility_24px: parseScoreField(rowMap, 'legibility_24px', candidateId),
      dark_light_versatility: parseScoreField(rowMap, 'dark_light_versatility', candidateId),
      non_cliche_uniqueness: parseScoreField(rowMap, 'non_cliche_uniqueness', candidateId),
      lockup_balance: parseScoreField(rowMap, 'lockup_balance', candidateId),
      app_icon_fit: parseScoreField(rowMap, 'app_icon_fit', candidateId),
      production_readiness: parseScoreField(rowMap, 'production_readiness', candidateId),
      notes: rowMap.notes,
    })
  }

  return rows
}

function getGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'E'
}

function scoreCandidate(candidate: CandidateRow): ScoredCandidate {
  const weightedScore =
    ((candidate.silhouette_distinctiveness / 5) * WEIGHTS.silhouette_distinctiveness +
      (candidate.legibility_24px / 5) * WEIGHTS.legibility_24px +
      (candidate.dark_light_versatility / 5) * WEIGHTS.dark_light_versatility +
      (candidate.non_cliche_uniqueness / 5) * WEIGHTS.non_cliche_uniqueness +
      (candidate.lockup_balance / 5) * WEIGHTS.lockup_balance +
      (candidate.app_icon_fit / 5) * WEIGHTS.app_icon_fit +
      (candidate.production_readiness / 5) * WEIGHTS.production_readiness) *
    100

  const totalScore = Number(weightedScore.toFixed(2))
  const criticalFail = candidate.silhouette_distinctiveness < 3 || candidate.legibility_24px < 3

  let status: ScoredCandidate['status']
  if (criticalFail) {
    status = 'FAIL_CRITICAL'
  } else if (totalScore >= 85) {
    status = 'APPROVED'
  } else if (totalScore >= 75) {
    status = 'REVIEW'
  } else {
    status = 'REJECT'
  }

  return {
    ...candidate,
    total_score: totalScore,
    grade: getGrade(totalScore),
    status,
    critical_fail: criticalFail,
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const inputPath = path.resolve(args.input)

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`)
  }

  const candidates = parseCsvFile(inputPath)
  const ranked = candidates.map(scoreCandidate).sort((left, right) => right.total_score - left.total_score)
  const preview = ranked.slice(0, args.top)

  console.log('\nDarwin Logo Scorecard Ranking\n')
  console.table(
    preview.map((candidate, index) => ({
      rank: index + 1,
      candidate_id: candidate.candidate_id,
      variant_file: candidate.variant_file,
      score: candidate.total_score,
      grade: candidate.grade,
      status: candidate.status,
      critical_fail: candidate.critical_fail ? 'yes' : 'no',
    }))
  )

  const approvedCount = ranked.filter((candidate) => candidate.status === 'APPROVED').length
  const reviewCount = ranked.filter((candidate) => candidate.status === 'REVIEW').length

  console.log(`Total candidates: ${ranked.length}`)
  console.log(`Approved: ${approvedCount}`)
  console.log(`Review: ${reviewCount}`)
  console.log(`Reject/Fail: ${ranked.length - approvedCount - reviewCount}`)

  if (args.out) {
    const outputPath = path.resolve(args.out)
    const outputDir = path.dirname(outputPath)

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const payload = {
      generated_at: new Date().toISOString(),
      input_file: args.input,
      weights: WEIGHTS,
      ranking: ranked,
    }

    fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
    console.log(`Results written to ${outputPath}`)
  }
}

main()

