# 🏗️ PostgreSQL no SEU Cluster + Next.js na Nuvem

## Arquitetura Híbrida Recomendada

```yaml
Seu Cluster (On-Premise/Casa):
  ✅ PostgreSQL 16
  ✅ Backups automáticos
  ✅ Controle total
  ✅ Custo: R$ 0 (já tem o hardware)

Next.js (Nuvem):
  ✅ Vercel Free (frontend + API)
  ✅ Conecta ao seu PostgreSQL via internet segura
  ✅ Custo: R$ 0

Total: R$ 0/mês! 🎉
```

---

## 🔒 Como Conectar de Forma SEGURA

### Opção 1: Cloudflare Tunnel (RECOMENDADO - Grátis e Seguro)

**Por que é a melhor opção:**
- ✅ 100% Grátis
- ✅ SSL automático
- ✅ Não expõe seu IP público
- ✅ Não precisa abrir portas no roteador
- ✅ Zero configuração de firewall

**Setup (15 minutos):**

```bash
# 1. Instalar PostgreSQL no seu cluster
# (Proxmox LXC, VM Ubuntu, ou Docker)
docker run -d \
  --name darwin-postgres \
  -e POSTGRES_DB=darwin_education \
  -e POSTGRES_USER=darwin_user \
  -e POSTGRES_PASSWORD=senha_segura_aqui \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Instalar Cloudflare Tunnel
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
sudo mv cloudflared /usr/local/bin/
sudo chmod +x /usr/local/bin/cloudflared

# 3. Fazer login no Cloudflare
cloudflared tunnel login

# 4. Criar tunnel para PostgreSQL
cloudflared tunnel create darwin-db

# 5. Configurar tunnel
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: darwin-db
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: db.seudominio.com.br
    service: tcp://localhost:5432
  - service: http_status:404
EOF

# 6. Iniciar tunnel (ou criar systemd service)
cloudflared tunnel run darwin-db
```

**Conectar do Vercel:**
```bash
# .env no Vercel
DATABASE_URL=postgresql://darwin_user:senha@db.seudominio.com.br:5432/darwin_education?sslmode=require
```

**Custo: R$ 0/mês**

---

### Opção 2: Tailscale VPN (Para múltiplos serviços)

**Quando usar:**
- Você tem vários serviços no cluster
- Quer acessar de vários lugares (celular, notebook, Vercel)
- Precisa de uma "rede privada na nuvem"

**Setup (10 minutos):**

```bash
# 1. Instalar Tailscale no cluster
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# 2. Instalar Tailscale no Vercel (via Subnet Router)
# Criar VM pequena como gateway:
docker run -d \
  --name tailscale-subnet \
  --cap-add=NET_ADMIN \
  --device=/dev/net/tun \
  -e TS_AUTHKEY=<sua-chave> \
  -e TS_ROUTES=100.64.0.0/10 \
  tailscale/tailscale

# 3. PostgreSQL acessível via IP Tailscale
# Exemplo: 100.101.102.103:5432
```

**Conectar do Vercel:**
```bash
# Usar Vercel Edge Config ou Supabase como proxy
# Ou VM pequena na cloud como gateway Tailscale
```

**Custo: R$ 0/mês (até 100 dispositivos)**

---

### Opção 3: SSH Tunnel (Simples, mas menos elegante)

**Setup:**

```bash
# No cluster, garantir SSH habilitado
sudo systemctl enable ssh
sudo systemctl start ssh

# Do Vercel (via Vercel Function startup):
# Criar tunnel SSH reverso
ssh -R 5432:localhost:5432 user@seu-cluster-ip
```

**Limitação:** Vercel Serverless não mantém conexões SSH persistentes. 
Melhor usar Cloudflare Tunnel.

---

### Opção 4: IP Público + SSL (Se tem IP fixo)

**Setup:**

```bash
# 1. Configurar PostgreSQL para aceitar conexões remotas
# postgresql.conf:
listen_addresses = '*'

# pg_hba.conf:
hostssl all all 0.0.0.0/0 scram-sha-256

# 2. Gerar certificado SSL
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt \
  -keyout server.key \
  -subj "/CN=db.seudominio.com.br"

sudo cp server.crt /var/lib/postgresql/data/
sudo cp server.key /var/lib/postgresql/data/
sudo chown postgres:postgres /var/lib/postgresql/data/server.*

# 3. Abrir porta no roteador
# Porta 5432 → IP do cluster
# Ou usar porta customizada (ex: 54320) para segurança

# 4. Firewall para permitir apenas IPs do Vercel
sudo ufw allow from 76.76.21.0/24 to any port 5432
sudo ufw allow from 76.76.19.0/24 to any port 5432
# (Verificar IPs atuais do Vercel)
```

**Conectar do Vercel:**
```bash
DATABASE_URL=postgresql://darwin_user:senha@seu-ip-publico:5432/darwin_education?sslmode=require
```

**Custo: R$ 0/mês (se já tem IP fixo)**

⚠️ **Menos seguro** que Cloudflare Tunnel!

---

## 🏗️ Configuração do Cluster

### Opção A: Docker Compose (Mais Simples)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: darwin-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: darwin_education
      POSTGRES_USER: darwin_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U darwin_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backup automático
  pg-backup:
    image: prodrigestivill/postgres-backup-local
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      POSTGRES_HOST: postgres
      POSTGRES_DB: darwin_education
      POSTGRES_USER: darwin_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      SCHEDULE: "@daily"
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
      BACKUP_KEEP_MONTHS: 6
    volumes:
      - ./backups:/backups

volumes:
  postgres_data:
```

**Iniciar:**
```bash
echo "DB_PASSWORD=sua_senha_aqui" > .env
docker-compose up -d
```

---

### Opção B: Proxmox LXC (Performance Máxima)

```bash
# 1. Criar LXC Ubuntu 24.04
pct create 100 local:vztmpl/ubuntu-24.04-standard_24.04-1_amd64.tar.zst \
  --hostname darwin-postgres \
  --memory 2048 \
  --cores 2 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp

# 2. Iniciar e acessar
pct start 100
pct enter 100

# 3. Instalar PostgreSQL
apt update && apt install -y postgresql-16

# 4. Configurar
sudo -u postgres createdb darwin_education
sudo -u postgres createuser darwin_user -P

# 5. Configurar acesso remoto
nano /etc/postgresql/16/main/postgresql.conf
# listen_addresses = '*'

nano /etc/postgresql/16/main/pg_hba.conf
# host all all 0.0.0.0/0 scram-sha-256

# 6. Reiniciar
systemctl restart postgresql
```

---

## 📊 Comparação de Opções

| Método | Segurança | Complexidade | Custo | Recomendado |
|--------|-----------|--------------|-------|-------------|
| **Cloudflare Tunnel** | 🟢 Excelente | 🟢 Baixa | R$ 0 | ✅ **SIM** |
| **Tailscale VPN** | 🟢 Excelente | 🟡 Média | R$ 0 | ✅ Para múltiplos serviços |
| **SSH Tunnel** | 🟡 Boa | 🟡 Média | R$ 0 | ⚠️ Não ideal para Serverless |
| **IP Público + SSL** | 🔴 Média | 🔴 Alta | R$ 0 | ❌ Só se necessário |

---

## 🔥 Arquitetura Completa Recomendada

```yaml
# SEU CLUSTER (Casa/Escritório)
Proxmox/Docker Host:
  PostgreSQL 16:
    - Darwin Education DB (produção)
    - Backups automáticos diários
    - Retenção: 7 dias, 4 semanas, 6 meses
  
  Cloudflare Tunnel:
    - Expõe PostgreSQL como db.seudominio.com.br
    - SSL automático
    - Zero configuração de firewall
  
  Opcional - PgAdmin:
    - Interface web para gerenciar DB
    - Acessível via tunnel também

# VERCEL (Nuvem)
Frontend + API:
  - Next.js 15 com App Router
  - Edge Functions para performance
  - Conecta ao seu PostgreSQL via Cloudflare Tunnel
  - Deploy automático do GitHub

# CUSTOS
Total: R$ 0/mês! 🎉
  Seu cluster: R$ 0 (já tem)
  PostgreSQL: R$ 0 (self-hosted)
  Cloudflare Tunnel: R$ 0 (grátis)
  Vercel: R$ 0 (free tier)
```

---

## ⚙️ Script de Deploy Completo

```bash
#!/bin/bash
# deploy-postgres-cluster.sh

set -e

echo "🚀 Instalando PostgreSQL no seu cluster..."

# 1. Instalar PostgreSQL via Docker
docker run -d \
  --name darwin-postgres \
  --restart unless-stopped \
  -e POSTGRES_DB=darwin_education \
  -e POSTGRES_USER=darwin_user \
  -e POSTGRES_PASSWORD=${DB_PASSWORD:-ChangeMeInProduction} \
  -v $(pwd)/postgres-data:/var/lib/postgresql/data \
  -v $(pwd)/backups:/backups \
  -p 5432:5432 \
  postgres:16-alpine

echo "✅ PostgreSQL iniciado!"

# 2. Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL..."
sleep 10

# 3. Rodar migrations
docker exec -i darwin-postgres psql -U darwin_user -d darwin_education < infrastructure/supabase/schema.sql

echo "✅ Migrations aplicadas!"

# 4. Instalar Cloudflare Tunnel
if ! command -v cloudflared &> /dev/null; then
    echo "📦 Instalando Cloudflare Tunnel..."
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
    sudo mv cloudflared /usr/local/bin/
    sudo chmod +x /usr/local/bin/cloudflared
fi

# 5. Configurar tunnel (manual - precisa autenticar)
echo "🔐 Configure o Cloudflare Tunnel:"
echo "1. Execute: cloudflared tunnel login"
echo "2. Execute: cloudflared tunnel create darwin-db"
echo "3. Configure config.yml conforme documentação"

# 6. Criar backup automático
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec darwin-postgres pg_dump -U darwin_user darwin_education | gzip > backups/darwin_$DATE.sql.gz
find backups -name "darwin_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Agendar cron
(crontab -l 2>/dev/null; echo "0 3 * * * $(pwd)/backup.sh") | crontab -

echo "✅ Backup automático configurado (diário às 3h)"

echo ""
echo "🎉 PostgreSQL no seu cluster está pronto!"
echo ""
echo "📝 Próximos passos:"
echo "1. Configure o Cloudflare Tunnel para expor db.seudominio.com.br"
echo "2. Adicione no Vercel: DATABASE_URL=postgresql://darwin_user:senha@db.seudominio.com.br:5432/darwin_education"
echo "3. Deploy no Vercel!"
```

---

## 🎯 Vantagens da Sua Solução

✅ **Custo: R$ 0/mês** (vs R$ 125/mês Supabase Pro)
✅ **Controle total** do banco de dados
✅ **Performance local** (se acessar de casa/escritório)
✅ **Sem limites** de armazenamento (além do seu HD)
✅ **Backups locais** (você controla)
✅ **Dados no Brasil** (privacidade)

⚠️ **Desvantagens**:

❌ Você gerencia backups
❌ Você gerencia updates
❌ Depende da sua internet (uptime)
❌ Latência se Vercel estiver longe (adicionar caching)

---

## 🚀 Próximos Passos

1. **Você já tem cluster Proxmox/Docker rodando?**
   - SIM → Qual? (Proxmox, Docker, Kubernetes, VM?)
   - NÃO → Posso ajudar a configurar

2. **Qual método de exposição prefere?**
   - Cloudflare Tunnel (recomendado)
   - Tailscale VPN
   - IP Público

3. **Internet da sua casa/escritório é estável?**
   - SIM → Ótimo para self-hosted
   - NÃO → Melhor usar Vercel + Supabase

**Me diga essas 3 coisas e eu crio o script de deploy completo para você!** 🎯
