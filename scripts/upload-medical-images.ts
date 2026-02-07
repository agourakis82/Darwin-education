/**
 * Upload Medical Images to Supabase Storage
 * ===========================================
 * Downloads open-license medical images from Wikimedia Commons
 * and uploads them to the Supabase `medical-images` bucket.
 *
 * Run: pnpm tsx scripts/upload-medical-images.ts
 *
 * Prerequisites:
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local
 * - `medical-images` bucket must exist in Supabase Storage
 * - Run scripts/cip-image-explanations-schema.sql first (adds image_attribution column)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env from apps/web/.env.local
const envPath = path.resolve(__dirname, '../apps/web/.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx)
        const value = trimmed.slice(eqIdx + 1)
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

const BUCKET = 'medical-images'
const STORAGE_BASE = `${supabaseUrl}/storage/v1/object/public/${BUCKET}`

// ============================================
// Image Source Map
// ============================================
// Each entry maps a case title_pt to:
//   - wikimedia: Wikimedia Commons filename (stable identifiers)
//   - attribution: License + source text
//   - filename: Local filename for storage

interface ImageSource {
  titlePt: string
  wikimedia: string
  attribution: string
  filename: string
}

const IMAGE_SOURCES: ImageSource[] = [
  // --- X-RAY (5) ---
  {
    titlePt: 'Pneumonia lobar',
    wikimedia: 'File:Pneumonia x-ray.jpg',
    attribution:
      'Pneumonia chest X-ray. Wikimedia Commons, public domain (CDC/Dr. Thomas Hooten).',
    filename: 'xray-pneumonia-lobar.jpg',
  },
  {
    titlePt: 'Pneumotórax espontâneo',
    wikimedia: 'File:Rt sided pneumothorax.jpg',
    attribution:
      'Right-sided pneumothorax on chest X-ray. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'xray-pneumothorax.jpg',
  },
  {
    titlePt: 'Insuficiência cardíaca congestiva',
    wikimedia: 'File:Chest radiograph of a patient with CHF - annotated (CardioNetworks ECHOpedia).jpg',
    attribution:
      'Chest X-ray showing cardiomegaly and pulmonary congestion. CardioNetworks ECHOpedia, CC BY-SA 3.0.',
    filename: 'xray-icc-cardiomegalia.jpg',
  },
  {
    titlePt: 'Derrame pleural volumoso',
    wikimedia: 'File:Massive Left Pleural effusion.jpg',
    attribution:
      'Massive left pleural effusion on chest X-ray. Wikimedia Commons, CC BY-SA 4.0.',
    filename: 'xray-derrame-pleural.jpg',
  },
  {
    titlePt: 'Fratura de arcos costais',
    wikimedia: 'File:Broken rib.jpg',
    attribution:
      'Rib fracture on chest X-ray. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'xray-fratura-costela.jpg',
  },
  // --- EKG (5) ---
  {
    titlePt: 'IAM com supra de ST em parede inferior',
    wikimedia: 'File:12 Lead EKG ST Elevation tracing color coded.jpg',
    attribution:
      'ECG showing ST-elevation myocardial infarction. Wikimedia Commons, CC BY-SA 3.0 (CardioNetworks).',
    filename: 'ekg-iam-stemi.jpg',
  },
  {
    titlePt: 'Fibrilação atrial',
    wikimedia: 'File:Afib ECG.jpg',
    attribution:
      'ECG showing atrial fibrillation. Wikimedia Commons, public domain.',
    filename: 'ekg-fibrilacao-atrial.jpg',
  },
  {
    titlePt: 'Bloqueio AV 2º grau Mobitz II',
    wikimedia: 'File:ECG Mobitz II.jpg',
    attribution:
      'ECG showing Mobitz type II second-degree AV block. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'ekg-bav-mobitz2.jpg',
  },
  {
    titlePt: 'Taquicardia ventricular monomórfica',
    wikimedia: 'File:Ventricular tachycardia ECG.jpg',
    attribution:
      'ECG showing monomorphic ventricular tachycardia. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'ekg-tv-monomorfica.jpg',
  },
  {
    titlePt: 'Flutter atrial típico',
    wikimedia: 'File:Atrial flutter34.svg',
    attribution:
      'ECG showing typical atrial flutter with sawtooth pattern. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'ekg-flutter-atrial.svg',
  },
  // --- CT (4) ---
  {
    titlePt: 'AVC isquêmico agudo',
    wikimedia: 'File:MCA-Stroke-CT.jpg',
    attribution:
      'CT scan showing MCA territory ischemic stroke. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'ct-avc-isquemico.jpg',
  },
  {
    titlePt: 'Tromboembolismo pulmonar agudo',
    wikimedia: 'File:Saddle PE.PNG',
    attribution:
      'CT pulmonary angiography showing pulmonary embolism. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'ct-tep.png',
  },
  {
    titlePt: 'Apendicite aguda',
    wikimedia: 'File:Apendicitis.jpg',
    attribution:
      'CT scan showing acute appendicitis. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'ct-apendicite.jpg',
  },
  {
    titlePt: 'Hemorragia subaracnoide aguda',
    wikimedia: 'File:SubasachBlworr.jpg',
    attribution:
      'CT scan showing subarachnoid hemorrhage. Wikimedia Commons, public domain.',
    filename: 'ct-hsa.jpg',
  },
  // --- ULTRASOUND (3) ---
  {
    titlePt: 'Colecistite aguda calculosa',
    wikimedia: 'File:Gallbladder stone.jpg',
    attribution:
      'Ultrasound showing gallstone with acoustic shadow. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'usg-colecistite.jpg',
  },
  {
    titlePt: 'Gestação ectópica tubária',
    wikimedia: 'File:Ectopic pregnancy on ultrasound.jpg',
    attribution:
      'Transvaginal ultrasound showing ectopic pregnancy. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'usg-ectopica.jpg',
  },
  {
    titlePt: 'Urolitíase com hidronefrose',
    wikimedia: 'File:Hydronephrosis.jpg',
    attribution:
      'Ultrasound showing hydronephrosis. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'usg-hidronefrose.jpg',
  },
  // --- MRI (3) ---
  {
    titlePt: 'Hérnia discal lombar L4-L5',
    wikimedia: 'File:Lumbar disc herniation MRI.jpg',
    attribution:
      'MRI showing lumbar disc herniation. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'mri-hernia-discal.jpg',
  },
  {
    titlePt: 'Tumor cerebral de alto grau',
    wikimedia: 'File:Glioblastoma - MR sagittal with contrast.jpg',
    attribution:
      'MRI with gadolinium showing glioblastoma. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'mri-glioblastoma.jpg',
  },
  {
    titlePt: 'Esclerose múltipla',
    wikimedia: 'File:MS Demyelinisation CD68 10xv2.jpg',
    attribution:
      'MRI showing multiple sclerosis plaques. Wikimedia Commons, CC BY-SA 3.0.',
    filename: 'mri-esclerose-multipla.jpg',
  },
]

// ============================================
// Wikimedia Commons API Helper
// ============================================

async function getWikimediaImageUrl(
  filename: string
): Promise<string | null> {
  const apiUrl = new URL('https://commons.wikimedia.org/w/api.php')
  apiUrl.searchParams.set('action', 'query')
  apiUrl.searchParams.set('titles', filename)
  apiUrl.searchParams.set('prop', 'imageinfo')
  apiUrl.searchParams.set('iiprop', 'url|size|mime')
  apiUrl.searchParams.set('format', 'json')

  try {
    const res = await fetch(apiUrl.toString(), {
      headers: { 'User-Agent': 'DarwinEducation/1.0 (educational platform)' },
    })
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null

    for (const pageId of Object.keys(pages)) {
      if (pageId === '-1') return null
      const info = pages[pageId]?.imageinfo?.[0]
      if (info?.url) return info.url
    }
  } catch (err) {
    console.error(`  API error for ${filename}:`, err)
  }
  return null
}

/**
 * Search Wikimedia Commons for a medical image by keyword.
 * Fallback when exact filename doesn't match.
 */
async function searchWikimediaImage(
  query: string
): Promise<{ url: string; title: string } | null> {
  const apiUrl = new URL('https://commons.wikimedia.org/w/api.php')
  apiUrl.searchParams.set('action', 'query')
  apiUrl.searchParams.set('generator', 'search')
  apiUrl.searchParams.set('gsrsearch', query)
  apiUrl.searchParams.set('gsrnamespace', '6') // File namespace
  apiUrl.searchParams.set('gsrlimit', '3')
  apiUrl.searchParams.set('prop', 'imageinfo')
  apiUrl.searchParams.set('iiprop', 'url|size|mime')
  apiUrl.searchParams.set('format', 'json')

  try {
    const res = await fetch(apiUrl.toString(), {
      headers: { 'User-Agent': 'DarwinEducation/1.0 (educational platform)' },
    })
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null

    for (const pageId of Object.keys(pages)) {
      const page = pages[pageId]
      const info = page?.imageinfo?.[0]
      if (info?.url && info.mime?.startsWith('image/')) {
        return { url: info.url, title: page.title }
      }
    }
  } catch (err) {
    console.error(`  Search error for "${query}":`, err)
  }
  return null
}

// ============================================
// Download + Upload
// ============================================

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'DarwinEducation/1.0 (educational platform)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function uploadToStorage(
  filename: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  // Remove existing file if present (idempotent)
  await supabase.storage.from(BUCKET).remove([filename])

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, data, {
      contentType,
      upsert: true,
    })

  if (error) throw new Error(`Upload error for ${filename}: ${error.message}`)
  return `${STORAGE_BASE}/${filename}`
}

function guessMimeType(url: string, filename: string): string {
  const ext = (filename.split('.').pop() || url.split('.').pop() || 'jpg').toLowerCase()
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    gif: 'image/gif',
    webp: 'image/webp',
  }
  return mimeMap[ext] || 'image/jpeg'
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('=== Darwin CIP: Medical Image Upload ===\n')

  const results: { title: string; status: string; url?: string }[] = []
  let successCount = 0
  let failCount = 0

  for (const source of IMAGE_SOURCES) {
    console.log(`[${source.filename}] ${source.titlePt}`)

    try {
      // Step 1: Get download URL from Wikimedia
      let downloadUrl = await getWikimediaImageUrl(source.wikimedia)

      if (!downloadUrl) {
        // Fallback: search by case title + modality
        console.log(`  Exact file not found, searching...`)
        const modality = source.filename.split('-')[0] // xray, ekg, ct, etc.
        const searchTerms: Record<string, string> = {
          'xray-pneumonia-lobar.jpg': 'chest xray pneumonia lobar',
          'xray-pneumothorax.jpg': 'chest xray pneumothorax',
          'xray-icc-cardiomegalia.jpg': 'chest xray cardiomegaly heart failure',
          'xray-derrame-pleural.jpg': 'chest xray pleural effusion',
          'xray-fratura-costela.jpg': 'xray rib fracture',
          'ekg-iam-stemi.jpg': 'ECG STEMI ST elevation',
          'ekg-fibrilacao-atrial.jpg': 'ECG atrial fibrillation',
          'ekg-bav-mobitz2.jpg': 'ECG Mobitz type II AV block',
          'ekg-tv-monomorfica.jpg': 'ECG ventricular tachycardia',
          'ekg-flutter-atrial.svg': 'ECG atrial flutter sawtooth',
          'ct-avc-isquemico.jpg': 'CT brain ischemic stroke MCA',
          'ct-tep.png': 'CT pulmonary embolism angiography',
          'ct-apendicite.jpg': 'CT acute appendicitis',
          'ct-hsa.jpg': 'CT subarachnoid hemorrhage',
          'usg-colecistite.jpg': 'ultrasound gallstone cholecystitis',
          'usg-ectopica.jpg': 'ultrasound ectopic pregnancy',
          'usg-hidronefrose.jpg': 'ultrasound hydronephrosis kidney',
          'mri-hernia-discal.jpg': 'MRI lumbar disc herniation',
          'mri-glioblastoma.jpg': 'MRI glioblastoma gadolinium',
          'mri-esclerose-multipla.jpg': 'MRI multiple sclerosis periventricular',
        }

        const searchQuery =
          searchTerms[source.filename] || `${modality} medical ${source.titlePt}`
        const result = await searchWikimediaImage(searchQuery)

        if (result) {
          downloadUrl = result.url
          console.log(`  Found: ${result.title}`)
        }
      }

      if (!downloadUrl) {
        console.log(`  SKIP: No image found on Wikimedia Commons`)
        results.push({ title: source.titlePt, status: 'skip' })
        failCount++
        continue
      }

      // Step 2: Download image
      console.log(`  Downloading...`)
      const imageData = await downloadImage(downloadUrl)
      console.log(`  Downloaded ${(imageData.length / 1024).toFixed(0)} KB`)

      // Step 3: Upload to Supabase Storage
      const contentType = guessMimeType(downloadUrl, source.filename)
      console.log(`  Uploading to ${BUCKET}/${source.filename}...`)
      const publicUrl = await uploadToStorage(
        source.filename,
        imageData,
        contentType
      )
      console.log(`  Uploaded: ${publicUrl}`)

      // Step 4: Update database
      const { error: updateError } = await supabase
        .from('cip_image_cases')
        .update({
          image_url: publicUrl,
          image_attribution: source.attribution,
        })
        .eq('title_pt', source.titlePt)

      if (updateError) {
        console.log(`  DB update error: ${updateError.message}`)
        results.push({
          title: source.titlePt,
          status: 'uploaded-no-db',
          url: publicUrl,
        })
        failCount++
      } else {
        console.log(`  DB updated`)
        results.push({ title: source.titlePt, status: 'ok', url: publicUrl })
        successCount++
      }
    } catch (err: any) {
      console.log(`  ERROR: ${err.message}`)
      results.push({ title: source.titlePt, status: 'error' })
      failCount++
    }

    // Rate limit: wait 500ms between Wikimedia API requests
    await new Promise((r) => setTimeout(r, 500))
    console.log()
  }

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Total: ${IMAGE_SOURCES.length}`)
  console.log(`Success: ${successCount}`)
  console.log(`Failed/Skipped: ${failCount}`)
  console.log()

  for (const r of results) {
    const icon = r.status === 'ok' ? '+' : r.status === 'skip' ? '-' : '!'
    console.log(`  [${icon}] ${r.title}: ${r.status}${r.url ? ` (${r.url})` : ''}`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
