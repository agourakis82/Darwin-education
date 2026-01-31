#!/bin/bash
#
# Setup PostgreSQL 16 no Proxmox para Darwin Education
# Uso: bash SETUP_PROXMOX_POSTGRES.sh
#

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  PostgreSQL 16 para Darwin Education - Proxmox Setup        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Configurações (AJUSTE CONFORME NECESSÁRIO)
CTID=200  # Container ID (ajuste se já existir)
HOSTNAME="darwin-postgres"
MEMORY=2048  # 2GB RAM
CORES=2
DISK_SIZE=20  # 20GB
BRIDGE="vmbr0"
STORAGE="local-lvm"  # Ajuste conforme seu storage

echo "📋 Configurações:"
echo "   Container ID: $CTID"
echo "   Hostname: $HOSTNAME"
echo "   RAM: ${MEMORY}MB"
echo "   CPU Cores: $CORES"
echo "   Disk: ${DISK_SIZE}GB"
echo ""
read -p "Pressione ENTER para continuar ou CTRL+C para cancelar..."

# ============================================================================
# PARTE 1: CRIAR LXC CONTAINER (RODAR NO PROXMOX HOST)
# ============================================================================

echo ""
echo "🔧 PARTE 1: Comandos para rodar no HOST Proxmox"
echo "────────────────────────────────────────────────"
echo ""

cat << 'EOFPROXMOX'
# 1. Baixar template Ubuntu 24.04 (se ainda não tiver)
pveam update
pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst

# 2. Criar LXC Container
pct create 200 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname darwin-postgres \
  --memory 2048 \
  --cores 2 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp,firewall=1 \
  --features nesting=1 \
  --unprivileged 1 \
  --onboot 1 \
  --description "PostgreSQL 16 - Darwin Education Database"

# 3. Iniciar container
pct start 200

# 4. Aguardar boot
sleep 10

# 5. Entrar no container
pct enter 200

# Agora você está DENTRO do container!
# Continue com a PARTE 2 abaixo...
EOFPROXMOX

echo ""
read -p "Execute os comandos acima no Proxmox host e pressione ENTER quando estiver DENTRO do container..."

# ============================================================================
# PARTE 2: SETUP POSTGRESQL (DENTRO DO CONTAINER)
# ============================================================================

echo ""
echo "🐘 PARTE 2: Instalando PostgreSQL 16..."
echo "────────────────────────────────────────────────"
echo ""

# Atualizar sistema
apt update && apt upgrade -y

# Instalar PostgreSQL 16
apt install -y postgresql-16 postgresql-contrib-16

# Instalar ferramentas úteis
apt install -y curl wget nano htop net-tools

echo "✅ PostgreSQL 16 instalado!"

# ============================================================================
# PARTE 3: CONFIGURAR POSTGRESQL
# ============================================================================

echo ""
echo "⚙️  PARTE 3: Configurando PostgreSQL..."
echo "────────────────────────────────────────────────"

# Gerar senha aleatória segura
DB_PASSWORD=$(openssl rand -base64 32)

# Criar banco e usuário
sudo -u postgres psql << EOFSQL
-- Criar usuário
CREATE USER darwin_user WITH PASSWORD '$DB_PASSWORD';

-- Criar banco
CREATE DATABASE darwin_education OWNER darwin_user;

-- Garantir privilégios
GRANT ALL PRIVILEGES ON DATABASE darwin_education TO darwin_user;

-- Conectar ao banco e dar permissões no schema public
\c darwin_education
GRANT ALL ON SCHEMA public TO darwin_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO darwin_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO darwin_user;

-- Configurar default privileges para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO darwin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO darwin_user;

\q
EOFSQL

echo "✅ Banco darwin_education criado!"

# Configurar PostgreSQL para aceitar conexões via Cloudflare Tunnel (localhost)
cat >> /etc/postgresql/16/main/postgresql.conf << EOFCONF

# Darwin Education Settings
listen_addresses = 'localhost,127.0.0.1'
max_connections = 100
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 2621kB
min_wal_size = 1GB
max_wal_size = 4GB
EOFCONF

# Configurar autenticação
cat >> /etc/postgresql/16/main/pg_hba.conf << EOFHBA

# Darwin Education - Localhost only (via Cloudflare Tunnel)
host    darwin_education    darwin_user    127.0.0.1/32    scram-sha-256
host    darwin_education    darwin_user    ::1/128         scram-sha-256
EOFHBA

# Reiniciar PostgreSQL
systemctl restart postgresql

echo "✅ PostgreSQL configurado!"

# ============================================================================
# PARTE 4: BACKUP AUTOMÁTICO
# ============================================================================

echo ""
echo "💾 PARTE 4: Configurando backup automático..."
echo "────────────────────────────────────────────────"

# Criar diretório de backup
mkdir -p /var/backups/postgres

# Script de backup
cat > /usr/local/bin/backup-postgres.sh << 'EOFBACKUP'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgres"
DB_NAME="darwin_education"

# Fazer backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/darwin_${DATE}.sql.gz

# Manter últimos 7 backups diários
find $BACKUP_DIR -name "darwin_*.sql.gz" -mtime +7 -delete

# Log
echo "$(date): Backup concluído - darwin_${DATE}.sql.gz" >> /var/log/postgres-backup.log
EOFBACKUP

chmod +x /usr/local/bin/backup-postgres.sh

# Agendar backup diário às 3h
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-postgres.sh") | crontab -

echo "✅ Backup automático configurado (diário às 3h)"

# ============================================================================
# PARTE 5: CLOUDFLARE TUNNEL
# ============================================================================

echo ""
echo "☁️  PARTE 5: Instalando Cloudflare Tunnel..."
echo "────────────────────────────────────────────────"

# Instalar cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
mv cloudflared /usr/local/bin/
chmod +x /usr/local/bin/cloudflared

echo "✅ Cloudflare Tunnel instalado!"

# ============================================================================
# PARTE 6: SALVAR CREDENCIAIS
# ============================================================================

echo ""
echo "🔐 PARTE 6: Salvando credenciais..."
echo "────────────────────────────────────────────────"

# Salvar credenciais
cat > /root/.darwin-credentials << EOFCRED
# Darwin Education - PostgreSQL Credentials
# $(date)

DB_HOST=localhost
DB_PORT=5432
DB_NAME=darwin_education
DB_USER=darwin_user
DB_PASSWORD=$DB_PASSWORD

# Connection String (Local - via Cloudflare Tunnel)
DATABASE_URL=postgresql://darwin_user:$DB_PASSWORD@localhost:5432/darwin_education

# Para Vercel (após configurar Cloudflare Tunnel):
# DATABASE_URL=postgresql://darwin_user:$DB_PASSWORD@db.seudominio.com.br:5432/darwin_education?sslmode=require
EOFCRED

chmod 600 /root/.darwin-credentials

echo "✅ Credenciais salvas em /root/.darwin-credentials"

# ============================================================================
# CONCLUSÃO
# ============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ PostgreSQL instalado com sucesso!                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Informações:"
echo "   Container ID: $CTID"
echo "   IP Container: $(hostname -I | awk '{print $1}')"
echo "   Banco: darwin_education"
echo "   Usuário: darwin_user"
echo ""
echo "🔐 Credenciais salvas em: /root/.darwin-credentials"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo ""
echo "1. Configurar Cloudflare Tunnel:"
echo "   cloudflared tunnel login"
echo "   cloudflared tunnel create darwin-db"
echo ""
echo "2. Criar config do tunnel:"
echo "   mkdir -p /root/.cloudflared"
echo "   nano /root/.cloudflared/config.yml"
echo ""
echo "   Conteúdo do config.yml:"
echo "   ─────────────────────────────────────"
cat << 'EOFCONFIG'
tunnel: darwin-db
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: db.seudominio.com.br
    service: tcp://localhost:5432
  - service: http_status:404
EOFCONFIG
echo "   ─────────────────────────────────────"
echo ""
echo "3. Iniciar tunnel como serviço:"
echo "   cloudflared service install"
echo "   systemctl enable cloudflared"
echo "   systemctl start cloudflared"
echo ""
echo "4. Adicionar no Vercel a variável:"
echo "   Ver credenciais com: cat /root/.darwin-credentials"
echo ""
echo "5. Rodar migrations:"
echo "   Copie infrastructure/supabase/schema.sql para o container"
echo "   psql -U darwin_user -d darwin_education < schema.sql"
echo ""
echo "✅ Setup completo!"
