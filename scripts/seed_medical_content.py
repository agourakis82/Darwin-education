#!/usr/bin/env python3
"""
Extracts disease data from darwin-MFC TypeScript files and upserts into Supabase.
Uses regex parsing since the TS files use @/ path aliases not resolvable outside darwin-MFC.
"""

import os
import re
import json
import uuid
import sys
import glob
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://jpzkjkwcoudaxscrukye.supabase.co')
SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

if not SERVICE_KEY:
    # Use hardcoded key from env file
    env_path = os.path.join(os.path.dirname(__file__), '../apps/web/.env.local')
    if os.path.exists(env_path):
        for line in open(env_path):
            if 'SUPABASE_SERVICE_ROLE_KEY' in line:
                SERVICE_KEY = line.split('=', 1)[1].strip()

CATEGORIA_TO_AREA = {
    'cardiovascular': 'clinica_medica',
    'dermatologico': 'clinica_medica',
    'endocrino': 'clinica_medica',
    'gastrointestinal': 'cirurgia',
    'ginecologico': 'ginecologia_obstetricia',
    'obstetrico': 'ginecologia_obstetricia',
    'hematologico': 'clinica_medica',
    'infecciosas': 'clinica_medica',
    'metabolico': 'clinica_medica',
    'musculoesqueletico': 'clinica_medica',
    'neurologico': 'clinica_medica',
    'pediatrico': 'pediatria',
    'respiratorio': 'clinica_medica',
    'saude_mental': 'clinica_medica',
    'urologico': 'cirurgia',
    'nefrologico': 'clinica_medica',
    'reumatologico': 'clinica_medica',
    'oftalmologico': 'clinica_medica',
    'otorrinolaringologico': 'clinica_medica',
    'outros': 'saude_coletiva',
}

def to_enamed_area(categoria):
    if not categoria:
        return 'clinica_medica'
    norm = re.sub(r'[^a-z_]', '_', categoria.lower())
    return CATEGORIA_TO_AREA.get(norm, 'clinica_medica')

def extract_string(content, key):
    """Extract a string value for a given key from TS object literal."""
    pattern = rf"(?m)^\s*{key}:\s*'([^']+)'"
    m = re.search(pattern, content)
    if m:
        return m.group(1)
    pattern = rf'(?m)^\s*{key}:\s*"([^"]+)"'
    m = re.search(pattern, content)
    return m.group(1) if m else None

def extract_array(content, key):
    """Extract simple string array for a given key."""
    pattern = rf"(?s)\s{key}:\s*\[([^\]]*)\]"
    m = re.search(pattern, content)
    if not m:
        return []
    inner = m.group(1)
    items = re.findall(r"['\"]([^'\"]+)['\"]", inner)
    return items

def extract_diseases_from_file(filepath):
    """Parse diseases from a TS file using regex on object blocks."""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    diseases = []
    # Find all id occurrences (any indent level)
    id_pattern = re.compile(r"^\s{2,8}id:\s*'([^']+)'", re.MULTILINE)

    for id_match in id_pattern.finditer(content):
        disease_id = id_match.group(1)
        indent = len(id_match.group(0)) - len(id_match.group(0).lstrip())

        # Find the opening brace before this id (same or lesser indent)
        brace_pattern = re.compile(r'^\s{' + str(max(0, indent-4)) + r',' + str(indent) + r'}\{', re.MULTILINE)
        brace_matches = list(brace_pattern.finditer(content, 0, id_match.start()))
        start = brace_matches[-1].start() if brace_matches else id_match.start()

        # Find the matching closing brace
        depth = 0
        end = start
        for i in range(start, min(start + 50000, len(content))):
            if content[i] == '{':
                depth += 1
            elif content[i] == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break

        block = content[start:end]

        titulo = extract_string(block, 'titulo')
        if not titulo:
            continue

        categoria = extract_string(block, 'categoria')
        subcategoria = extract_string(block, 'subcategoria')
        cid10 = extract_array(block, 'cid10')
        sinonimos = extract_array(block, 'sinonimos')
        tags = extract_array(block, 'tags')

        # Extract summary from quickView.definicao
        summary_m = re.search(r"definicao:\s*'([^']{20,})'", block)
        if not summary_m:
            summary_m = re.search(r'definicao:\s*"([^"]{20,})"', block)
        summary = summary_m.group(1)[:500] if summary_m else f"{titulo} — doença com relevância clínica no contexto ENAMED."

        search_terms = ' '.join(filter(None, [titulo] + sinonimos + cid10 + tags + ([categoria] if categoria else []))).lower()

        diseases.append({
            'id': disease_id,
            'titulo': titulo,
            'categoria': categoria or 'outros',
            'subcategoria': subcategoria,
            'cid10': cid10,
            'sinonimos': sinonimos,
            'summary': summary,
            'search_terms': search_terms,
        })

    return diseases

def supabase_request(method, path, body=None):
    url = f"{SUPABASE_URL}{path}"
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
    }
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            return resp.status, resp.read().decode()
    except HTTPError as e:
        return e.code, e.read().decode()

def get_existing_titles():
    url = f"{SUPABASE_URL}/rest/v1/medical_diseases?select=title&limit=2000"
    headers = {
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}',
    }
    req = Request(url, headers=headers)
    with urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    return {r['title'].lower().strip() for r in data}

def main():
    base = os.path.join(os.path.dirname(__file__), '../darwin-MFC/lib/data')

    # Collect all TS disease files
    ts_files = []
    ts_files.append(os.path.join(base, 'doencas.ts'))
    ts_files.append(os.path.join(base, 'doencas-expanded.ts'))
    for f in glob.glob(os.path.join(base, 'doencas/**/*.ts'), recursive=True):
        if 'index.ts' not in f:
            ts_files.append(f)

    print(f"📂 Scanning {len(ts_files)} TypeScript files...\n")

    all_diseases = {}
    for filepath in ts_files:
        diseases = extract_diseases_from_file(filepath)
        for d in diseases:
            if d['id'] not in all_diseases:
                all_diseases[d['id']] = d

    print(f"📦 Found {len(all_diseases)} unique diseases in darwin-MFC\n")

    # Get existing titles
    print("📊 Fetching existing records from Supabase...")
    existing_titles = get_existing_titles()
    print(f"   Already in DB: {len(existing_titles)}\n")

    # Build rows to insert (skip existing)
    rows = []
    for d in all_diseases.values():
        if d['titulo'].lower().strip() in existing_titles:
            continue
        row = {
            'id': str(uuid.uuid4()),
            'title': d['titulo'],
            'enamed_area': to_enamed_area(d['categoria']),
            'categoria': d['categoria'],
            'subcategoria': d.get('subcategoria'),
            'cid10': d['cid10'],
            'summary': d['summary'],
            'search_terms': d['search_terms'],
            'payload': {
                'id': d['id'],
                'titulo': d['titulo'],
                'categoria': d['categoria'],
                'cid10': d['cid10'],
                'sinonimos': d['sinonimos'],
            },
        }
        rows.append(row)

    print(f"🆕 New diseases to insert: {len(rows)}")
    if not rows:
        print("✅ Nothing to seed — all diseases already present.")
        return

    # Insert in batches
    BATCH = 50
    inserted = 0
    errors = 0

    for i in range(0, len(rows), BATCH):
        batch = rows[i:i+BATCH]
        status, resp = supabase_request('POST', '/rest/v1/medical_diseases', batch)
        if status in (200, 201):
            inserted += len(batch)
            print(f"  ✅ Inserted batch {i//BATCH + 1}: {inserted}/{len(rows)}", flush=True)
        else:
            errors += 1
            print(f"  ❌ Batch {i//BATCH + 1} error ({status}): {resp[:200]}")

    print(f"\n✅ Done. Inserted: {inserted}, Batch errors: {errors}")

    # Final count
    _, resp = supabase_request('HEAD', '/rest/v1/medical_diseases?select=id')
    print(f"📊 Query Supabase for final count via dashboard to confirm.")

if __name__ == '__main__':
    main()
