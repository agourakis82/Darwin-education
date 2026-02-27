# Prompt para Claude — Setup Xcode (copie e cole no Claude)

Cole o texto abaixo no Claude Code (no Mac) ou no claude.ai:

---

Preciso de ajuda para configurar e rodar meu app iOS pela primeira vez no Xcode. Sou iniciante no Xcode.

## Meu projeto

- Repositório: `~/work/darwin-education` (já clonado)
- App iOS: `apps/ios-native/` — SwiftUI, iOS 18+, Swift 5.10
- O projeto usa **XcodeGen** — `project.yml` gera o `.xcodeproj`
- Segredos ficam em `Secrets.xcconfig` (gitignored), template em `Secrets.xcconfig.template`
- Tenho conta Apple Developer Program ativa

## O que preciso que você faça (passo a passo)

1. Verifique se tenho Xcode 16+ instalado (`xcodebuild -version`)
2. Verifique se tenho XcodeGen instalado (`xcodegen --version`), se não: `brew install xcodegen`
3. Vá para `~/work/darwin-education/apps/ios-native/`
4. Copie `Secrets.xcconfig.template` para `Secrets.xcconfig` (se ainda não existe)
5. Me pergunte minha chave Supabase anon key e coloque no `Secrets.xcconfig`
6. Rode `xcodegen generate` para criar o `DarwinEducation.xcodeproj`
7. Abra o projeto no Xcode: `open DarwinEducation.xcodeproj`
8. Me guie para:
   - Selecionar o simulador iPhone 16
   - Rodar com Cmd+R
   - Ver se o app abre sem erros
9. Se der erro de build, me ajude a resolver
10. Depois que funcionar no simulador, me guie para rodar no meu iPhone físico:
    - Configurar Signing & Capabilities com meu Apple Developer Team
    - Conectar o iPhone e confiar no computador
    - Buildar e instalar no dispositivo

## Contexto técnico

- O `project.yml` já inclui `configFiles` apontando para `Secrets.xcconfig`
- A variável `DARWIN_SUPABASE_ANON_KEY` é lida via `$(DARWIN_SUPABASE_ANON_KEY)` no Info.plist
- O `.xcodeproj` é gitignored — sempre regenerar com `xcodegen generate`
- O app tem esses targets/features: Auth, Simulados, Simulado Adaptativo (CDM-CAT), Flashcards com estudo, Desempenho com diagnóstico CDM, Conteúdo Médico
- API base URL: https://darwinhub.org
- Supabase URL: https://jpzkjkwcoudaxscrukye.supabase.co

## Regras

- Me explique cada passo como se eu nunca tivesse usado Xcode
- Se algo der errado, me ajude a debugar
- Não modifique código Swift a menos que seja necessário para corrigir um erro de build
- Fale comigo em português
