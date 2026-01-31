# Análise de Deployment na Locaweb para Darwin Education

## Pesquisa Realizada em 31/01/2026

### Resumo Executivo

A Locaweb oferece três opções principais para hospedar o Darwin Education:
1. **Hospedagem Compartilhada** (limitações significativas)
2. **VPS Linux** (recomendado - melhor custo-benefício)
3. **Hospedagem Dedicada** (overkill para projeto atual)

## 📊 Comparativo de Opções

### Opção 1: Hospedagem Compartilhada
**Preço**: A partir de ~R$ 15-30/mês (estimativa)

**PostgreSQL Disponível**:
- ✅ Até 3 bancos PostgreSQL de 10GB cada
- ❌ **Limite crítico: 30 conexões simultâneas**
- ❌ Acesso externo limitado a 1 conexão simultânea
- ❌ Não pode conectar de fora da Locaweb

**Node.js**:
- ⚠️ Instalação manual possível
- ❌ **Sem suporte oficial para Next.js 15**
- ❌ Sem acesso SSH (limitação crítica)
- ❌ Não recomendado para aplicações modernas

**Veredicto**: ❌ **NÃO RECOMENDADO**
- Limite de 30 conexões PostgreSQL é muito baixo para produção
- Sem SSH impossibilita deploy adequado de Next.js
- Falta de controle sobre ambiente Node.js

---

### Opção 2: VPS Linux (RECOMENDADO)
**Preço**: A partir de R$ 15,90/mês

**Configurações Disponíveis**:
```
Plano Base:     512 MB RAM, 1 vCPU,  20 GB SSD  - ~R$ 15,90/mês
Plano Médio:    2 GB RAM,   2 vCPU,  40 GB SSD  - ~R$ 40-60/mês (estimativa)
Plano Alto:     4 GB RAM,   4 vCPU,  80 GB SSD  - ~R$ 80-120/mês (estimativa)
Até:            64 GB RAM,  16 vCPU, XXX GB SSD
```

**PostgreSQL**:
- ✅ Instalação completa via apt
- ✅ PostgreSQL 15 ou 16 disponível
- ✅ **Sem limite de conexões** (baseado em RAM)
- ✅ Controle total sobre configuração
- ✅ Backup gerenciado via scripts próprios

**Node.js/Next.js**:
- ✅ Instalação completa via nvm
- ✅ Next.js 15 com Turbopack suportado
- ✅ PM2 para process management
- ✅ Nginx como reverse proxy
- ✅ Deploy via Git + CI/CD possível

**Recursos**:
- ✅ **Acesso SSH completo (root)**
- ✅ Escolha de OS (Ubuntu, Debian, CentOS)
- ✅ Transferência ilimitada
- ✅ SLA 99.5%
- ✅ Monitoramento de recursos (CPU, RAM, disco)
- ✅ Suporte 24/7 em português

**Recomendação de Plano para Darwin Education**:
```
2 GB RAM, 2 vCPU, 40-60 GB SSD (~R$ 40-60/mês)

Justificativa:
- Next.js build requer ~1 GB RAM
- PostgreSQL production: ~512 MB RAM
- Sistema operacional: ~256 MB RAM
- Buffer para picos: ~256 MB RAM
- Total: 2 GB confortável para iniciar
```

**Veredicto**: ✅ **ALTAMENTE RECOMENDADO**
- Controle total do ambiente
- Custo-benefício excelente
- Escalável conforme crescimento
- Suporte completo a stack moderno

---

### Opção 3: DBaaS (Database as a Service)
**Preço**: Não divulgado publicamente

**Limitações Críticas**:
- ❌ **Apenas SQL Server 2017** (não PostgreSQL!)
- ❌ Focado em aplicações Windows
- ❌ Máximo 1 GB por banco
- ❌ Infraestrutura compartilhada

**Veredicto**: ❌ **NÃO COMPATÍVEL**
- Não oferece PostgreSQL gerenciado
- Apenas SQL Server

---

## 🎯 Recomendação Final

### Solução Recomendada: VPS Linux 2GB

**Configuração Proposta**:
```yaml
Servidor:
  Provider: Locaweb VPS Linux
  Plano: 2 GB RAM, 2 vCPU, 40-60 GB SSD
  OS: Ubuntu 22.04 LTS ou 24.04 LTS
  Preço Estimado: R$ 40-60/mês

Stack Completo no Mesmo Servidor:
  - PostgreSQL 15
  - Next.js 15 (apps/web)
  - PM2 (process manager)
  - Nginx (reverse proxy + SSL)
  - Certbot (Let's Encrypt SSL)
```

**Custo Total Estimado**: R$ 40-60/mês
- Servidor VPS: R$ 40-60
- Banco de dados: Incluído
- SSL: Grátis (Let's Encrypt)
- Backup: Incluído (scripts próprios)

---

## 📝 Plano de Deploy

### Fase 1: Provisionar VPS (15 min)
1. Contratar VPS Linux 2GB na Locaweb
2. Escolher Ubuntu 24.04 LTS
3. Configurar chave SSH
4. Atualizar sistema: `apt update && apt upgrade -y`

### Fase 2: Instalar PostgreSQL (10 min)
```bash
# Instalar PostgreSQL 15
sudo apt install postgresql postgresql-contrib -y

# Criar banco darwin_education
sudo -u postgres createdb darwin_education

# Criar usuário
sudo -u postgres createuser darwin_user -P

# Rodar migrations
psql -U darwin_user -d darwin_education < infrastructure/supabase/schema.sql
```

### Fase 3: Instalar Node.js (10 min)
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20

# Instalar pnpm
npm install -g pnpm

# Instalar PM2
npm install -g pm2
```

### Fase 4: Deploy Aplicação (20 min)
```bash
# Clonar repositório
git clone https://github.com/agourakis82/darwin-education.git
cd darwin-education

# Instalar dependências
pnpm install

# Build
pnpm build

# Configurar .env
cp apps/web/.env.example apps/web/.env.production
# Editar DATABASE_URL, NEXTAUTH_SECRET, etc.

# Iniciar com PM2
pm2 start apps/web/.next/standalone/server.js --name darwin-web
pm2 save
pm2 startup
```

### Fase 5: Configurar Nginx (15 min)
```nginx
server {
    listen 80;
    server_name seudominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Fase 6: SSL com Let's Encrypt (5 min)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seudominio.com.br
```

**Tempo Total de Deploy**: ~75 minutos

---

## 🔒 Considerações de Segurança

### PostgreSQL
```bash
# Configurar pg_hba.conf para aceitar apenas localhost
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Adicionar: host all all 127.0.0.1/32 scram-sha-256

# Configurar firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Backup Automatizado
```bash
# Criar script de backup diário
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U darwin_user darwin_education | gzip > /backup/darwin_$DATE.sql.gz
# Manter últimos 7 dias
find /backup -name "darwin_*.sql.gz" -mtime +7 -delete
EOF

# Agendar cron (todo dia às 3h)
crontab -e
# Adicionar: 0 3 * * * /home/ubuntu/backup.sh
```

---

## 💰 Comparação de Custos

| Opção | Custo/mês | PostgreSQL | Next.js | Controle | Recomendado |
|-------|-----------|------------|---------|----------|-------------|
| **Hospedagem Compartilhada** | R$ 15-30 | ⚠️ Limitado | ❌ Sem suporte | ❌ Baixo | ❌ Não |
| **VPS Linux 2GB** | R$ 40-60 | ✅ Completo | ✅ Completo | ✅ Total | ✅ **SIM** |
| **Hospedagem Dedicada** | R$ 200+ | ✅ Completo | ✅ Completo | ✅ Total | ⚠️ Caro demais |
| **Vercel + Supabase** | R$ 0-100 | ✅ Gerenciado | ✅ Otimizado | ⚠️ Médio | ✅ Alternativa |

---

## 🚀 Alternativa: Vercel + Supabase (Grátis até escalar)

**Caso prefira não gerenciar servidor**:

```yaml
Frontend (Vercel):
  - Deploy automático do GitHub
  - Edge Functions globais
  - SSL incluído
  - Custo: R$ 0/mês (free tier) ou R$ 20/mês (Pro)

Backend (Supabase):
  - PostgreSQL 500 MB (free)
  - Row Level Security
  - Backups automáticos
  - Custo: R$ 0/mês (free tier) ou R$ 125/mês (Pro)

Total: R$ 0/mês (inicialmente) → R$ 145/mês (quando escalar)
```

**Prós da Alternativa**:
- Zero gerenciamento de servidor
- Deploy automático
- Escalabilidade global
- Backups gerenciados

**Contras**:
- Mais caro ao escalar (R$ 145/mês vs R$ 60/mês VPS)
- Menos controle
- Dados fora do Brasil (latência +50-100ms)

---

## 📊 Métricas de Decisão

### Para escolher VPS Locaweb:
- ✅ Você já paga Locaweb (centralizar custos)
- ✅ Quer controle total do ambiente
- ✅ Dados devem ficar no Brasil
- ✅ Conforto com Linux/SSH
- ✅ Custo fixo previsível

### Para escolher Vercel + Supabase:
- ✅ Prefere não gerenciar servidor
- ✅ Quer deploy automático do GitHub
- ✅ Planeja escala global (latência)
- ✅ Valoriza zero-downtime deploy
- ✅ OK com custo variável

---

## 🎓 Recomendação Final para Darwin Education

**Opção 1 (Recomendada)**: VPS Locaweb 2GB - R$ 40-60/mês
- Melhor custo-benefício
- Controle total
- Dados no Brasil
- Boa para aprender DevOps

**Opção 2 (Alternativa)**: Vercel + Supabase - R$ 0-145/mês
- Menos trabalho operacional
- Melhor DX (Developer Experience)
- Escala automática
- Bom para focar em features

---

## 📞 Próximos Passos

1. **Confirmar escolha**: VPS Locaweb ou Vercel+Supabase?
2. **Contratar plano** (se VPS Locaweb)
3. **Configurar DNS** do domínio
4. **Executar deploy** seguindo guia acima
5. **Configurar monitoramento** (uptime, erros)
6. **Testar fluxo completo** de produção

**Precisa de ajuda com alguma etapa específica?**

---

## 📚 Fontes da Pesquisa

- [Locaweb VPS Brasil](https://www.locaweb.com.br/servidor-vps/)
- [Locaweb Cloud Server](https://www.locaweb.com.br/locaweb-cloud/)
- [Como conectar ao PostgreSQL - Locaweb](https://www.locaweb.com.br/ajuda/wiki/como-conectar-ao-postgresql-hospedagem-de-sites/)
- [Como instalar Node.js - Locaweb](https://www.locaweb.com.br/ajuda/wiki/instalar-node/)
- [DBaaS Locaweb](https://www.locaweb.com.br/database-as-a-service/)
- [Hospedagem Compartilhada - Locaweb](https://www.locaweb.com.br/blog/produtos/hospedagem-de-sites/tudo-sobre-hospedagem-compartilhada/)
- [VPS Linux - Locaweb](https://www.locaweb.com.br/conteudos/vps-linux/)
