# 🚀 Darwin Education no Proxmox - Guia Completo

## Arquitetura Final

```
┌─────────────────────────────────────────────────────────────┐
│ SEU PROXMOX                                                 │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ LXC 200: darwin-postgres (Ubuntu 24.04)              │  │
│  │                                                       │  │
│  │  • PostgreSQL 16                                     │  │
│  │  • 2GB RAM, 2 vCPU, 20GB disco                      │  │
│  │  • Backup automático diário                          │  │
│  │  • IP: 192.168.X.X (DHCP)                           │  │
│  │                                                       │  │
│  │  Cloudflare Tunnel ──────────────► Internet         │  │
│  │  (expõe db.seudominio.com.br)                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        ▲
                        │ Conexão Segura (HTTPS/TLS)
                        │
┌─────────────────────────────────────────────────────────────┐
│ VERCEL (Nuvem)                                              │
│                                                             │
│  Next.js 15 + API Routes                                   │
│  Conecta: postgresql://user:pass@db.seudominio.com.br      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Custo Total: R$ 0/mês** (assumindo que você já tem Proxmox rodando)

---

## 📋 Pré-requisitos

- ✅ Proxmox 8.x instalado e funcionando
- ✅ Acesso SSH ao host Proxmox
- ✅ Storage disponível (local-lvm ou outro)
- ✅ Conta Cloudflare (grátis)
- ✅ Domínio configurado no Cloudflare

---

## 🎯 Passo 1: Criar LXC Container

**No host Proxmox via SSH:**

```bash
# 1. Baixar template Ubuntu 24.04
pveam update
pveam available | grep ubuntu
pveam download local ubuntu-24.04-standard_24.04-2_amd64.tar.zst

# 2. Criar container LXC
pct create 200 local:vztmpl/ubuntu-24.04-standard_24.04-2_amd64.tar.zst \
  --hostname darwin-postgres \
  --memory 2048 \
  --cores 2 \
  --rootfs local-lvm:20 \
  --net0 name=eth0,bridge=vmbr0,ip=dhcp,firewall=1 \
  --features nesting=1 \
  --unprivileged 1 \
  --onboot 1 \
  --description "PostgreSQL 16 - Darwin Education"

# 3. Iniciar container
pct start 200

# 4. Verificar IP atribuído
pct exec 200 -- hostname -I

# 5. Entrar no container
pct enter 200
```

**Ajustes se necessário:**
- Se container ID 200 já existe, use outro (201, 202, etc.)
- Se storage não é `local-lvm`, ajuste para seu storage (ex: `local`, `data`, etc.)
- Para IP fixo em vez de DHCP: `ip=192.168.1.50/24,gw=192.168.1.1`

---

## 🐘 Passo 2: Instalar PostgreSQL 16

**Dentro do container (após `pct enter 200`):**

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar PostgreSQL 16
apt install -y postgresql-16 postgresql-contrib-16

# Instalar ferramentas
apt install -y curl wget nano htop net-tools

# Verificar instalação
systemctl status postgresql
```

---

## ⚙️ Passo 3: Configurar PostgreSQL

```bash
# Gerar senha segura
DB_PASSWORD=$(openssl rand -base64 32)
echo "Senha gerada: $DB_PASSWORD"
echo "GUARDE ESTA SENHA!"

# Criar banco e usuário
sudo -u postgres psql << 'EOFSQL'
-- Criar usuário
CREATE USER darwin_user WITH PASSWORD 'COLE_A_SENHA_AQUI';

-- Criar banco
CREATE DATABASE darwin_education OWNER darwin_user;

-- Garantir privilégios
GRANT ALL PRIVILEGES ON DATABASE darwin_education TO darwin_user;

-- Conectar ao banco
\c darwin_education

-- Permissões no schema
GRANT ALL ON SCHEMA public TO darwin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO darwin_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO darwin_user;

\q
EOFSQL
```

**Configurar PostgreSQL para performance:**

```bash
# Editar postgresql.conf
nano /etc/postgresql/16/main/postgresql.conf

# Adicionar no final:
listen_addresses = 'localhost,127.0.0.1'
max_connections = 100
shared_buffers = 512MB
effective_cache_size = 1536MB
work_mem = 2621kB
maintenance_work_mem = 128MB
```

**Configurar autenticação:**

```bash
# Editar pg_hba.conf
nano /etc/postgresql/16/main/pg_hba.conf

# Adicionar no final:
host    darwin_education    darwin_user    127.0.0.1/32    scram-sha-256
host    darwin_education    darwin_user    ::1/128         scram-sha-256
```

**Reiniciar PostgreSQL:**

```bash
systemctl restart postgresql

# Testar conexão
psql -U darwin_user -d darwin_education -h localhost
# Digite a senha quando solicitado
# Se conectou: \q para sair
```

---

## 💾 Passo 4: Backup Automático

```bash
# Criar diretório
mkdir -p /var/backups/postgres

# Criar script de backup
cat > /usr/local/bin/backup-postgres.sh << 'EOFBACKUP'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/postgres"
DB_NAME="darwin_education"

# Backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_DIR/darwin_${DATE}.sql.gz

# Manter últimos 7 dias
find $BACKUP_DIR -name "darwin_*.sql.gz" -mtime +7 -delete

# Log
echo "$(date): Backup darwin_${DATE}.sql.gz" >> /var/log/postgres-backup.log
EOFBACKUP

chmod +x /usr/local/bin/backup-postgres.sh

# Testar backup
/usr/local/bin/backup-postgres.sh
ls -lh /var/backups/postgres/

# Agendar cron (diário às 3h)
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-postgres.sh") | crontab -
crontab -l
```

---

## ☁️ Passo 5: Cloudflare Tunnel

**Instalar cloudflared:**

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
mv cloudflared /usr/local/bin/
chmod +x /usr/local/bin/cloudflared

# Verificar instalação
cloudflared --version
```

**Autenticar com Cloudflare:**

```bash
cloudflared tunnel login
```

Isso abre um link no navegador. Faça login na Cloudflare e autorize.

**Criar tunnel:**

```bash
cloudflared tunnel create darwin-db
```

Anote o **Tunnel ID** exibido (algo como: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

**Criar configuração:**

```bash
mkdir -p /root/.cloudflared

# Listar tunnels para pegar o ID
cloudflared tunnel list

# Criar config.yml (SUBSTITUA <TUNNEL-ID> pelo ID real!)
cat > /root/.cloudflared/config.yml << 'EOFCONFIG'
tunnel: darwin-db
credentials-file: /root/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: db.seudominio.com.br
    service: tcp://localhost:5432
  - service: http_status:404
EOFCONFIG

# Editar e substituir <TUNNEL-ID>
nano /root/.cloudflared/config.yml
```

**Criar DNS record na Cloudflare:**

```bash
cloudflared tunnel route dns darwin-db db.seudominio.com.br
```

**Instalar como serviço:**

```bash
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
systemctl status cloudflared
```

**Verificar funcionamento:**

```bash
# Ver logs
journalctl -u cloudflared -f

# Deve mostrar: "Connection established"
```

---

## 🗄️ Passo 6: Rodar Migrations

**Copiar schema.sql para o container:**

```bash
# Do seu PC/notebook:
scp infrastructure/supabase/schema.sql root@IP-DO-PROXMOX:/tmp/

# No host Proxmox:
pct push 200 /tmp/schema.sql /tmp/schema.sql

# Dentro do container:
pct enter 200

# Rodar migrations
psql -U darwin_user -d darwin_education -h localhost < /tmp/schema.sql

# Verificar tabelas criadas
psql -U darwin_user -d darwin_education -h localhost -c "\dt"
```

---

## 🚀 Passo 7: Configurar Vercel

**No Vercel (Settings → Environment Variables):**

```bash
DATABASE_URL=postgresql://darwin_user:SUA_SENHA_AQUI@db.seudominio.com.br:5432/darwin_education?sslmode=require
```

**Deploy:**

```bash
# No seu repositório local
git add .
git commit -m "Add PostgreSQL connection"
git push origin main

# Vercel faz deploy automático
```

**Testar conexão:**

Crie uma API route de teste:

```typescript
// apps/web/app/api/test-db/route.ts
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('questions')
    .select('count')
    .limit(1)
  
  return Response.json({ 
    success: !error,
    data,
    error: error?.message 
  })
}
```

Acesse: `https://seu-app.vercel.app/api/test-db`

---

## 🔒 Passo 8: Segurança Adicional (Opcional)

**Firewall no container:**

```bash
apt install -y ufw

# Permitir apenas SSH e PostgreSQL local
ufw allow 22/tcp
ufw default deny incoming
ufw default allow outgoing
ufw enable

# PostgreSQL só aceita localhost (já configurado)
```

**Monitoramento:**

```bash
# Instalar pgBadger (análise de logs)
apt install -y pgbadger

# Script de análise semanal
cat > /usr/local/bin/postgres-report.sh << 'EOFREPORT'
#!/bin/bash
LOG_FILE="/var/log/postgresql/postgresql-16-main.log"
REPORT_DIR="/var/www/html/reports"
DATE=$(date +%Y%m%d)

mkdir -p $REPORT_DIR
pgbadger -f stderr $LOG_FILE -o $REPORT_DIR/report_${DATE}.html
EOFREPORT

chmod +x /usr/local/bin/postgres-report.sh

# Agendar (domingo às 23h)
(crontab -l; echo "0 23 * * 0 /usr/local/bin/postgres-report.sh") | crontab -
```

---

## 📊 Monitoramento e Manutenção

**Ver tamanho do banco:**

```bash
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('darwin_education'));"
```

**Ver conexões ativas:**

```bash
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='darwin_education';"
```

**Ver últimos backups:**

```bash
ls -lht /var/backups/postgres/ | head -10
```

**Restaurar backup:**

```bash
# Parar aplicação (para não ter conexões ativas)
# No container:
gunzip < /var/backups/postgres/darwin_YYYYMMDD_HHMMSS.sql.gz | \
  psql -U darwin_user -d darwin_education -h localhost
```

**Ver logs Cloudflare Tunnel:**

```bash
journalctl -u cloudflared -f
```

**Ver logs PostgreSQL:**

```bash
tail -f /var/log/postgresql/postgresql-16-main.log
```

---

## 🎯 Checklist Final

- [ ] Container LXC criado e iniciado
- [ ] PostgreSQL 16 instalado
- [ ] Banco `darwin_education` criado
- [ ] Usuário `darwin_user` configurado
- [ ] Backup automático funcionando
- [ ] Cloudflare Tunnel instalado
- [ ] DNS `db.seudominio.com.br` criado
- [ ] Tunnel rodando como serviço
- [ ] Migrations aplicadas
- [ ] Vercel configurado com DATABASE_URL
- [ ] Teste de conexão funcionando

---

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs do container
pct enter 200
journalctl -xe
```

### PostgreSQL não aceita conexões

```bash
# Verificar se está rodando
systemctl status postgresql

# Verificar configuração
psql -U postgres -c "SHOW listen_addresses;"

# Testar conexão local
psql -U darwin_user -d darwin_education -h localhost
```

### Cloudflare Tunnel não conecta

```bash
# Ver logs detalhados
cloudflared tunnel --loglevel debug run darwin-db

# Verificar config
cat /root/.cloudflared/config.yml

# Verificar se tunnel existe
cloudflared tunnel list
```

### Vercel não conecta ao banco

```bash
# Testar DNS
nslookup db.seudominio.com.br

# Testar porta
telnet db.seudominio.com.br 5432
# (Deve conectar via Cloudflare)

# Ver logs Vercel
# Vercel Dashboard → Deployments → Logs
```

---

## 💰 Custos

```yaml
Proxmox: R$ 0 (já tem)
PostgreSQL: R$ 0 (self-hosted)
Cloudflare Tunnel: R$ 0 (free tier)
Vercel: R$ 0 (free tier)
Domínio: R$ 40/ano (se não tiver)

Total: R$ 0-40/ano!
```

**vs Alternativas:**
- Supabase Pro: R$ 125/mês = R$ 1.500/ano
- VPS Locaweb: R$ 40-60/mês = R$ 480-720/ano

**Economia: R$ 480-1.500/ano!** 🎉

---

## 📚 Próximos Passos

1. **SSL/TLS**: Cloudflare Tunnel já fornece!
2. **Réplica**: Configurar standby para alta disponibilidade
3. **Monitoring**: Prometheus + Grafana
4. **Tuning**: Otimizar PostgreSQL para sua carga

---

## 🎓 Recursos Adicionais

- [PostgreSQL 16 Docs](https://www.postgresql.org/docs/16/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Proxmox LXC Guide](https://pve.proxmox.com/wiki/Linux_Container)

**Dúvidas? Problemas? Me avise que eu ajudo!** 🚀
