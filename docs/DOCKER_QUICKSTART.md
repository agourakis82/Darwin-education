# Darwin Education - Docker Quick Start Guide

## Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- (Optional) NVIDIA Docker runtime for GPU support

## Quick Start (Development)

### 1. Clone and Setup

```bash
cd Darwin-education
cp .env.docker.example .env
```

### 2. Edit `.env` File

Update the following critical values:
```bash
# Change default passwords
POSTGRES_PASSWORD=your_secure_postgres_password
REDIS_PASSWORD=your_secure_redis_password
JWT_SECRET=your_jwt_secret_minimum_32_characters

# Add your AI API keys
MINIMAX_API_KEY=your_minimax_key
ANTHROPIC_API_KEY=your_claude_key
OPENAI_API_KEY=your_gpt4_key
GROK_API_KEY=your_grok_key
```

### 3. Start Development Environment

```bash
# Start core services (PostgreSQL + Redis + Next.js)
docker-compose up -d

# View logs
docker-compose logs -f web

# Access application
open http://localhost:3000
```

### 4. Initialize Database

```bash
# Database is auto-initialized with schema.sql on first start
# To manually run migrations:
docker-compose exec postgres psql -U darwin -d darwin_education -f /docker-entrypoint-initdb.d/01-schema.sql
```

### 5. Seed Sample Data

```bash
# Seed 90 ENAMED 2025 questions
docker-compose exec postgres psql -U darwin -d darwin_education -f /docker-entrypoint-initdb.d/seed/05_enamed_2025_questions.sql
```

---

## Advanced Profiles

### With Supabase Self-Hosted

```bash
docker-compose --profile supabase up -d
```

This starts:
- Kong API Gateway (port 8000)
- GoTrue Auth (port 9999)
- All core services

**Access**:
- Supabase API: http://localhost:8000
- Auth API: http://localhost:9999

### With GPU (Local LLM)

```bash
# Ensure NVIDIA Docker runtime is installed
docker-compose --profile gpu up -d llm-api

# Check GPU availability
docker-compose exec llm-api nvidia-smi

# Test LLM inference
curl http://localhost:8001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen2.5-72b",
    "messages": [{"role": "user", "content": "Generate a medical question about diabetes"}],
    "max_tokens": 500
  }'
```

### With Monitoring

```bash
docker-compose --profile monitoring up -d

# Access dashboards
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana (admin/admin)
```

### Production-Like Setup

```bash
# Start all services including Nginx
docker-compose --profile production up -d

# Access via Nginx
open http://localhost  # Port 80
```

---

## Common Commands

### Start Services

```bash
# Start all core services
docker-compose up -d

# Start specific service
docker-compose up -d web

# Start with profile
docker-compose --profile gpu up -d
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 web
```

### Execute Commands

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U darwin -d darwin_education

# Redis CLI
docker-compose exec redis redis-cli -a darwin_redis_password

# Next.js shell
docker-compose exec web sh

# Run pnpm commands
docker-compose exec web pnpm type-check
docker-compose exec web pnpm lint
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build web

# Rebuild and restart
docker-compose up -d --build web

# Rebuild everything
docker-compose build
```

---

## Database Management

### Backup Database

```bash
docker-compose exec postgres pg_dump -U darwin darwin_education > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
cat backup_20240130.sql | docker-compose exec -T postgres psql -U darwin -d darwin_education
```

### Connect with psql

```bash
docker-compose exec postgres psql -U darwin -d darwin_education
```

### Useful SQL Queries

```sql
-- Check question count
SELECT COUNT(*) FROM questions;

-- Check exam attempts
SELECT COUNT(*) FROM exam_attempts;

-- Check user profiles
SELECT id, email, xp, level FROM profiles;

-- Reset database (WARNING: deletes all data)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i /docker-entrypoint-initdb.d/01-schema.sql
```

---

## Local LLM Setup (GPU Required)

### 1. Install NVIDIA Container Toolkit

```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### 2. Download Model (First Time Only)

```bash
# Create volume
docker volume create llm_models

# Download Qwen 2.5 72B (~140GB)
docker run --rm -v llm_models:/models \
  huggingface/transformers-pytorch-gpu \
  python -c "from transformers import AutoModel; AutoModel.from_pretrained('Qwen/Qwen2.5-72B-Instruct', cache_dir='/models')"
```

### 3. Start LLM Service

```bash
docker-compose --profile gpu up -d llm-api

# Wait for model to load (2-5 minutes)
docker-compose logs -f llm-api

# Test inference
curl http://localhost:8001/health
```

### 4. Update Next.js to Use Local LLM

```bash
# Edit .env
USE_LOCAL_LLM=true
LOCAL_LLM_URL=http://llm-api:8000

# Restart web service
docker-compose restart web
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000
sudo kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify connection string
docker-compose exec web env | grep DATABASE_URL

# Test connection
docker-compose exec web node -e "const { Client } = require('pg'); const client = new Client(process.env.DATABASE_URL); client.connect().then(() => console.log('Connected')).catch(console.error)"
```

### Next.js Not Building

```bash
# Clear cache and rebuild
docker-compose down
docker-compose build --no-cache web
docker-compose up -d web

# Check logs for errors
docker-compose logs web
```

### GPU Not Detected

```bash
# Verify NVIDIA runtime
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# Check Docker configuration
cat /etc/docker/daemon.json
# Should include:
# {
#   "runtimes": {
#     "nvidia": {
#       "path": "nvidia-container-runtime",
#       "runtimeArgs": []
#     }
#   }
# }
```

### Out of Memory

```bash
# Check container memory usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Preferences → Resources → Memory → 8GB+

# Or limit specific service in docker-compose.yml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## Production Deployment on Proxmox

### 1. Create VMs (as per SELF_HOSTING_ARCHITECTURE.md)

```bash
# VM1: Next.js
# VM2: Next.js (load balanced)
# VM3: Nginx
# VM4: PostgreSQL
# VM5: Redis
# VM7: LLM API
```

### 2. Deploy PostgreSQL (VM4)

```bash
# SSH to VM4
ssh root@100.x.x.20

# Install PostgreSQL
apt update
apt install -y postgresql-16 postgresql-contrib

# Configure /etc/postgresql/16/main/postgresql.conf
# (see SELF_HOSTING_ARCHITECTURE.md for tuning)

# Create database
sudo -u postgres psql
CREATE DATABASE darwin_education;
CREATE USER darwin WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE darwin_education TO darwin;
\q

# Run migrations
psql -U darwin -d darwin_education < schema.sql
```

### 3. Deploy Next.js (VM1, VM2)

```bash
# SSH to VM1
ssh root@100.x.x.11

# Clone repository
git clone https://github.com/your-org/Darwin-education.git
cd Darwin-education

# Copy production environment
cp .env.docker.example .env.production
# Edit .env.production with production values

# Build production image
docker build -t darwin-web:latest -f apps/web/Dockerfile --target runner .

# Run container
docker run -d \
  --name darwin-web \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  darwin-web:latest

# Repeat for VM2
```

### 4. Deploy Nginx Load Balancer (VM3)

```bash
# SSH to VM3
ssh root@100.x.x.10

# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Configure (see infrastructure/nginx/nginx.conf)
nano /etc/nginx/sites-available/darwin

# Enable site
ln -s /etc/nginx/sites-available/darwin /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Setup SSL with Let's Encrypt
certbot --nginx -d darwin.slmandic.edu.br
```

### 5. Verify Deployment

```bash
# Check all services
curl http://100.x.x.11:3000/api/health  # VM1
curl http://100.x.x.12:3000/api/health  # VM2
curl http://100.x.x.10/api/health       # Nginx

# Load test
ab -n 1000 -c 10 http://100.x.x.10/
```

---

## Performance Optimization

### PostgreSQL Tuning

```bash
# Edit postgresql.conf
docker-compose exec postgres nano /var/lib/postgresql/data/postgresql.conf

# Recommended settings for 64GB RAM (see SELF_HOSTING_ARCHITECTURE.md)
shared_buffers = 16GB
effective_cache_size = 48GB
work_mem = 40MB
maintenance_work_mem = 2GB
```

### Redis Tuning

```bash
# Edit redis.conf
docker-compose exec redis redis-cli CONFIG SET maxmemory 8gb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Next.js Optimization

```bash
# Enable standalone output in next.config.ts
output: 'standalone'

# Build optimized production image
docker-compose build --no-cache web

# Use production profile
NODE_ENV=production docker-compose up -d
```

---

## Monitoring Setup

### 1. Start Monitoring Stack

```bash
docker-compose --profile monitoring up -d
```

### 2. Configure Prometheus Targets

Edit `infrastructure/monitoring/prometheus.yml`:
```yaml
scrape_configs:
  - job_name: 'darwin-web'
    static_configs:
      - targets: ['web:3000']
  - job_name: 'darwin-postgres'
    static_configs:
      - targets: ['postgres:5432']
```

### 3. Import Grafana Dashboards

1. Login to Grafana: http://localhost:3001
2. Add Prometheus data source: http://prometheus:9090
3. Import dashboards from `infrastructure/monitoring/grafana-dashboards/`

### 4. Setup Alerts

```yaml
# Alertmanager configuration
route:
  receiver: 'email'
receivers:
  - name: 'email'
    email_configs:
      - to: 'admin@darwin.edu.br'
        from: 'alerts@darwin.edu.br'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@darwin.edu.br'
        auth_password: 'your_app_password'
```

---

## Next Steps

1. **Development**: Use docker-compose for local development
2. **Staging**: Deploy to single Proxmox VM with scaled-down resources
3. **Production**: Deploy to full multi-VM architecture on Proxmox
4. **Monitoring**: Set up Prometheus + Grafana
5. **Scaling**: Add more Next.js VMs behind load balancer as needed

For detailed architecture and production deployment, see [SELF_HOSTING_ARCHITECTURE.md](./SELF_HOSTING_ARCHITECTURE.md)
