#!/bin/bash
# ============================================================
# DDL TEST PAGE SETUP SCRIPT
# Execute no Claude Code para adicionar a página de teste
# ============================================================

echo "🚀 Configurando página de teste DDL..."

# Verificar diretório
cd ~/Darwin-education/apps/web || { echo "❌ Diretório não encontrado"; exit 1; }

# 1. Criar diretório da página de teste
echo "📁 Criando diretórios..."
mkdir -p src/app/ddl/test
mkdir -p src/app/api/ddl/questions
mkdir -p src/app/api/ddl/responses
mkdir -p src/app/api/ddl/feedback/\[id\]

# 2. Os arquivos devem ser copiados manualmente ou via Claude Code:
# 
# ARQUIVOS A CRIAR:
#
# src/app/ddl/test/page.tsx          <- ddl-test-page.tsx
# src/app/api/ddl/questions/route.ts <- ddl-questions-route.ts
# src/app/api/ddl/responses/route.ts <- ddl-responses-route.ts
# src/app/api/ddl/feedback/[id]/route.ts <- ddl-feedback-id-route.ts

echo "✅ Estrutura de diretórios criada!"
echo ""
echo "📋 Próximos passos no Claude Code:"
echo ""
echo "1. Criar src/app/ddl/test/page.tsx com o conteúdo de ddl-test-page.tsx"
echo "2. Criar src/app/api/ddl/questions/route.ts com o conteúdo de ddl-questions-route.ts"
echo "3. Criar src/app/api/ddl/responses/route.ts com o conteúdo de ddl-responses-route.ts"
echo "4. Criar src/app/api/ddl/feedback/[id]/route.ts com o conteúdo de ddl-feedback-id-route.ts"
echo ""
echo "5. Instalar uuid se necessário:"
echo "   pnpm add uuid @types/uuid"
echo ""
echo "6. Adicionar variável de ambiente para teste:"
echo "   DDL_TEST_USER_ID=<uuid-de-um-usuário-existente>"
echo ""
echo "7. Acessar: http://localhost:3001/ddl/test"
echo ""
echo "🎯 Comandos para Claude Code:"
echo ""
cat << 'EOF'
# No Claude Code, execute:

# 1. Criar página de teste
cat > apps/web/src/app/ddl/test/page.tsx << 'ENDFILE'
# [Cole aqui o conteúdo de ddl-test-page.tsx]
ENDFILE

# 2. Criar API de questões
cat > apps/web/src/app/api/ddl/questions/route.ts << 'ENDFILE'
# [Cole aqui o conteúdo de ddl-questions-route.ts]
ENDFILE

# 3. Criar API de respostas
cat > apps/web/src/app/api/ddl/responses/route.ts << 'ENDFILE'
# [Cole aqui o conteúdo de ddl-responses-route.ts]
ENDFILE

# 4. Criar API de feedback
mkdir -p apps/web/src/app/api/ddl/feedback/\[id\]
cat > 'apps/web/src/app/api/ddl/feedback/[id]/route.ts' << 'ENDFILE'
# [Cole aqui o conteúdo de ddl-feedback-id-route.ts]
ENDFILE
EOF
