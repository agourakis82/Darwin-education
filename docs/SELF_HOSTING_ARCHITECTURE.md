# Darwin Education: Self-Hosted Architecture on Proxmox

## Overview

This document describes the self-hosted deployment architecture for Darwin Education on a 5-node Proxmox cluster with 100Gbps networking, 47TB storage, and 68GB GPU memory.

## Infrastructure Specifications

- **Cluster**: 5 nodes Proxmox VE
- **Networking**: 100Gbps internal
- **Storage**: 47TB total
- **GPU**: 68GB total memory
- **AI APIs**: Grok, GPT-4 Pro, Claude 20x subscriptions

---

## VM Architecture

### Node 1-2: Web Application Layer

**VM1: Next.js App Server 1**
- **vCPU**: 8 cores
- **RAM**: 32GB
- **Storage**: 100GB SSD
- **Network**: 10Gbps bonded
- **Services**: Next.js (production build), Node.js 20+
- **Port**: 3000

**VM2: Next.js App Server 2** (Load Balanced)
- Same specs as VM1
- Provides redundancy and load distribution

**VM3: Nginx Reverse Proxy & Load Balancer**
- **vCPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB
- **Services**: Nginx, Certbot (SSL), fail2ban
- **Ports**: 80, 443
- **Load balancing**: Round-robin between VM1 and VM2

### Node 3: Database & Caching Layer

**VM4: PostgreSQL Database**
- **vCPU**: 16 cores
- **RAM**: 64GB
- **Storage**: 10TB (ZFS pool for redundancy)
- **Services**: PostgreSQL 16, pgvector, pg_trgm
- **Backup**: Daily snapshots to 47TB storage pool
- **Port**: 5432 (internal only, not exposed)

**VM5: Redis Cache & Sessions**
- **vCPU**: 4 cores
- **RAM**: 16GB
- **Storage**: 100GB SSD
- **Services**: Redis 7+
- **Purpose**: Session storage, API response caching, queue management
- **Port**: 6379 (internal only)

**VM6: Supabase Self-Hosted (Optional)**
- **vCPU**: 8 cores
- **RAM**: 32GB
- **Storage**: 500GB
- **Services**: Supabase stack (Realtime, Auth, Storage, REST API)
- **Alternative**: Use custom auth with PostgreSQL directly

### Node 4-5: AI & Compute Layer

**VM7: GPU Compute - LLM Inference**
- **vCPU**: 16 cores
- **RAM**: 64GB
- **GPU**: 48GB VRAM (passthrough or vGPU)
- **Storage**: 2TB NVMe (for models)
- **Services**:
  - vLLM or ollama for LLM serving
  - Qwen 2.5 72B Instruct (~140GB model)
  - FastAPI wrapper for inference API
- **Port**: 8000

**VM8: GPU Compute - ML Training & Batch Processing**
- **vCPU**: 12 cores
- **RAM**: 48GB
- **GPU**: 20GB VRAM (remaining allocation)
- **Storage**: 1TB
- **Services**:
  - Python 3.11+ with PyTorch/TensorFlow
  - IRT calibration workers (R or Python)
  - PDF extraction pipeline (vision models)
  - Question validation model training
- **Port**: 8001

**VM9: Background Workers & Job Queue**
- **vCPU**: 8 cores
- **RAM**: 16GB
- **Storage**: 200GB
- **Services**:
  - BullMQ or similar job queue
  - Cron jobs (IRT recalibration, report generation)
  - Email service (SendGrid/Postfix)
- **Port**: 3001

---

## Network Architecture

```
Internet
   ↓
[Proxmox Firewall] → 100.x.x.1
   ↓
[VM3: Nginx] 100.x.x.10 :80, :443
   ↓ (load balance)
   ├─→ [VM1: Next.js] 100.x.x.11 :3000
   └─→ [VM2: Next.js] 100.x.x.12 :3000
        ↓
        ├─→ [VM4: PostgreSQL] 100.x.x.20 :5432
        ├─→ [VM5: Redis] 100.x.x.21 :6379
        ├─→ [VM7: LLM API] 100.x.x.30 :8000
        └─→ [VM9: Workers] 100.x.x.31 :3001
```

**Firewall Rules**:
- External → VM3 (Nginx): Allow 80, 443
- VM1/VM2 → VM4 (PostgreSQL): Allow 5432
- VM1/VM2 → VM5 (Redis): Allow 6379
- VM1/VM2/VM9 → VM7 (LLM): Allow 8000
- All internal VMs: 100Gbps network
- Block all other external access

---

## Storage Strategy

### ZFS Pools

**Pool 1: Database** (10TB, RAID-10)
- PostgreSQL data directory
- High IOPS, redundancy critical
- Daily snapshots, 30-day retention

**Pool 2: Application Storage** (5TB, RAID-1)
- Next.js builds
- User uploads (images, PDFs)
- Static assets

**Pool 3: AI Models** (3TB, RAID-0 for speed)
- LLM models (Qwen, Llama)
- Fine-tuned models
- Training datasets

**Pool 4: Backups** (29TB, RAID-6)
- Database backups (daily full, hourly incremental)
- Application backups
- Log archives
- 90-day retention

---

## Deployment Strategy

### Development Environment

Use docker-compose on local machine with same stack:
```yaml
services:
  postgres:
    image: postgres:16-alpine
  redis:
    image: redis:7-alpine
  app:
    build: ./apps/web
  gpu-api:
    build: ./services/llm-api
    runtime: nvidia
```

### Staging Environment

Single Proxmox node with scaled-down VMs:
- 1x Next.js VM (4 vCPU, 8GB RAM)
- 1x PostgreSQL VM (4 vCPU, 16GB RAM)
- 1x Redis VM (2 vCPU, 4GB RAM)
- Deploy from `main` branch automatically

### Production Environment

Full multi-node setup as described above:
- Deploy from tagged releases only
- Blue-green deployment for zero downtime
- Automated health checks before switching

---

## Database Setup

### PostgreSQL Configuration

**postgresql.conf** (tuned for 64GB RAM):
```ini
max_connections = 200
shared_buffers = 16GB
effective_cache_size = 48GB
maintenance_work_mem = 2GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 41943kB
min_wal_size = 2GB
max_wal_size = 8GB
max_worker_processes = 16
max_parallel_workers_per_gather = 4
max_parallel_workers = 16
```

**Schema Migration**:
```bash
# Use existing migrations from infrastructure/supabase/
psql -h 100.x.x.20 -U darwin -d darwin_education < infrastructure/supabase/schema.sql
```

**Extensions**:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Fuzzy search
CREATE EXTENSION IF NOT EXISTS "pgvector";     -- Vector embeddings
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Query monitoring
```

### Backup Strategy

**Daily Full Backup** (4 AM):
```bash
pg_dump -h 100.x.x.20 -U darwin darwin_education | \
  gzip > /mnt/backup/darwin_$(date +%Y%m%d).sql.gz
```

**Hourly Incremental** (WAL archiving):
```bash
wal_level = replica
archive_mode = on
archive_command = 'cp %p /mnt/backup/wal/%f'
```

**Retention**: 90 days, ~500GB estimated

---

## Authentication Strategy

### Option 1: Supabase Self-Hosted (Recommended)

**Pros**:
- Already integrated in codebase
- Includes Auth, Realtime, Storage
- ROW-level security policies work as-is

**Setup**:
```bash
git clone https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

**VM6 Services**:
- Kong (API Gateway)
- GoTrue (Auth)
- PostgREST (REST API)
- Realtime (WebSockets)
- Storage (S3-compatible)

### Option 2: Custom Auth

**Pros**:
- Full control
- Lighter weight
- No vendor lock-in

**Stack**:
- NextAuth.js for authentication
- PostgreSQL for session storage
- JWT tokens for API authentication

**Migration needed**:
- Replace `@supabase/supabase-js` with custom client
- Implement RLS policies in application code
- ~3-5 days development effort

**Recommendation**: Start with Supabase self-hosted, migrate to custom later if needed.

---

## Local LLM Setup (VM7)

### Install vLLM

```bash
# On VM7 (GPU compute)
sudo apt update
sudo apt install -y python3.11 python3.11-venv nvidia-driver-535
python3.11 -m venv /opt/vllm-env
source /opt/vllm-env/bin/activate
pip install vllm torch

# Download Qwen 2.5 72B Instruct
huggingface-cli download Qwen/Qwen2.5-72B-Instruct --local-dir /mnt/models/qwen2.5-72b

# Start vLLM server
python -m vllm.entrypoints.openai.api_server \
  --model /mnt/models/qwen2.5-72b \
  --host 0.0.0.0 \
  --port 8000 \
  --tensor-parallel-size 2 \
  --dtype bfloat16
```

**Expected Performance**:
- 68GB VRAM should fit Qwen 2.5 72B (requires ~140GB in FP16, ~70GB in bfloat16 with quantization)
- Inference speed: 20-30 tokens/sec
- Concurrent requests: 4-8 depending on context length

### API Wrapper

Create FastAPI wrapper at `/services/llm-api/main.py`:
```python
from fastapi import FastAPI
from openai import OpenAI

app = FastAPI()
client = OpenAI(base_url="http://localhost:8000/v1", api_key="dummy")

@app.post("/v1/chat/completions")
async def chat_completion(request: dict):
    response = client.chat.completions.create(
        model="qwen2.5-72b",
        messages=request["messages"],
        temperature=request.get("temperature", 0.7),
        max_tokens=request.get("max_tokens", 2048)
    )
    return response.model_dump()
```

### Integration with Codebase

Update `apps/web/lib/ai/minimax.ts` to support local LLM:
```typescript
const isLocal = process.env.USE_LOCAL_LLM === 'true'
const baseURL = isLocal
  ? 'http://100.x.x.30:8000/v1'
  : 'https://api.minimax.chat/v1'
```

---

## Hybrid AI Strategy

### Question Generation Pipeline

**Priority Order**:
1. **Local Qwen (VM7)** - Free, 500-700 questions
   - Generate overnight (8-10 hours)
   - Best for bulk generation
   - Portuguese medical content quality: Excellent

2. **Grok API** - Fast, cheap, 200-300 questions
   - Rate limit: ~60 requests/minute
   - Generate in 4-5 hours
   - Quality: Very good

3. **Claude API** - Premium, 100-200 questions
   - Use for highest-quality questions
   - Use for validation and refinement
   - Already integrated

**Parallelization**:
```bash
# Run all three in parallel (VM9)
node scripts/generate-questions-batch.ts --source local --count 700 &
node scripts/generate-questions-batch.ts --source grok --count 300 &
node scripts/generate-questions-batch.ts --source claude --count 200 &
wait
```

**Result**: 1200 questions in 10-12 hours

---

## PDF Extraction Pipeline (VM8)

### Vision Model Setup

```bash
# Install Qwen2-VL or similar
pip install transformers torch pillow pdf2image

# Download model
huggingface-cli download Qwen/Qwen2-VL-7B-Instruct --local-dir /mnt/models/qwen2-vl
```

### Extraction Script

```python
from transformers import Qwen2VLForConditionalGeneration, AutoProcessor
from pdf2image import convert_from_path

model = Qwen2VLForConditionalGeneration.from_pretrained(
    "/mnt/models/qwen2-vl", device_map="auto"
)
processor = AutoProcessor.from_pretrained("/mnt/models/qwen2-vl")

def extract_questions_from_pdf(pdf_path):
    images = convert_from_path(pdf_path)
    questions = []

    for img in images:
        prompt = "Extract all ENAMED exam questions from this image, including options and correct answer."
        inputs = processor(text=prompt, images=img, return_tensors="pt")
        output = model.generate(**inputs, max_new_tokens=2048)
        questions.append(processor.decode(output[0]))

    return questions
```

**Target**: Extract 2000-5000 questions from historic ENAMED PDFs (2005-2024)

---

## IRT Calibration System (VM8)

### Real-Time Calibration

After every 20 exam attempts, trigger recalibration:

```python
# Schedule with BullMQ on VM9
from bullmq import Queue, Worker

calibration_queue = Queue('irt-calibration', connection=redis_conn)

async def calibrate_questions(job):
    # Export response data from PostgreSQL
    responses = fetch_recent_responses(limit=1000)

    # Run IRT estimation (Bayesian MCMC)
    from pymc import sample
    new_params = run_irt_estimation(responses)

    # Update database
    update_question_parameters(new_params)

worker = Worker('irt-calibration', calibrate_questions)
```

**Trigger**:
- Nightly at 3 AM
- After every 20 exam completions
- Manual trigger from admin panel

---

## Monitoring & Observability

### Prometheus + Grafana

**VM10: Monitoring Stack** (optional, can run on Node 3)
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **Loki**: Log aggregation
- **Alertmanager**: Alerts

**Metrics to Track**:
- API response times (p50, p95, p99)
- Database connection pool usage
- LLM inference latency
- GPU utilization
- Question generation throughput
- Student active users (DAU, WAU)
- Exam completion rate

### Sentry for Error Tracking

```typescript
// apps/web/instrumentation.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

---

## Estimated Costs

### Hardware Costs
- **Already owned**: Proxmox cluster, GPUs, storage
- **Recurring**: Electricity (~R$500-1000/month depending on usage)

### API Costs
- **Local LLM**: R$0 (free inference)
- **Grok**: Included in subscription (unlimited?)
- **Claude**: 20x subscriptions (check limits)
- **Estimated savings**: R$5000+/year vs all-cloud

### Personnel
- **1 DevOps**: Infrastructure maintenance (20h/month)
- **1 Developer**: Feature development (full-time)
- **2-3 Faculty**: Question validation (10h/week)

---

## Security Considerations

### Network Security
- All VMs in private network (100.x.x.0/24)
- Only Nginx exposed to internet
- Firewall rules between VMs
- VPN access for administrators

### Data Security
- PostgreSQL encrypted at rest (LUKS)
- Backups encrypted (GPG)
- SSL/TLS for all connections
- Regular security updates

### Compliance
- LGPD (Brazilian GDPR) compliance
- Medical education data handling
- Student data protection
- Audit logs for access

---

## Migration Path from Supabase Cloud

### Phase 1: Parallel Deployment
1. Set up self-hosted infrastructure
2. Run in parallel with Supabase cloud
3. Test thoroughly

### Phase 2: Data Migration
1. Export data from Supabase cloud
2. Import to self-hosted PostgreSQL
3. Verify data integrity

### Phase 3: Cutover
1. Update DNS to point to Proxmox
2. Monitor for issues
3. Keep Supabase cloud as backup for 30 days

**Estimated Timeline**: 2-3 weeks for complete migration

---

## Next Steps

1. **Week 0**: Set up VM templates on Proxmox
2. **Week 0**: Install PostgreSQL and restore schema
3. **Week 0**: Deploy Next.js to VM1/VM2
4. **Week 0**: Set up local LLM on VM7
5. **Week 1-4**: Continue Phase 1 implementation as planned
6. **Week 5**: Migrate from Supabase cloud to self-hosted

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| API Response Time (p95) | < 300ms | 100Gbps network advantage |
| Database Query Time | < 50ms | 64GB RAM, NVMe storage |
| LLM Inference | 20-30 tok/sec | Qwen 2.5 72B on 68GB GPU |
| Question Generation | 1000/day | Parallel generation |
| Concurrent Users | 200+ | Load balanced VMs |
| Uptime | 99.9% | Redundant VMs |

---

## Comparison: Self-Hosted vs Cloud

| Aspect | Self-Hosted (Proxmox) | Cloud (Vercel/Supabase) |
|--------|----------------------|------------------------|
| **Control** | Full control | Limited |
| **Data Sovereignty** | On-premise | Cloud provider |
| **Costs (1 year)** | ~R$10k (electricity) | ~R$50-100k |
| **LLM Costs** | R$0 (local) | R$20-50k/year |
| **Scalability** | Up to 200 users | Unlimited |
| **Maintenance** | 20h/month DevOps | Managed |
| **Performance** | 100Gbps network | Internet-dependent |
| **Compliance** | Full control | Vendor-dependent |

**Recommendation**: Self-hosted for pilot and initial deployment, evaluate cloud for scale beyond 500 users.
