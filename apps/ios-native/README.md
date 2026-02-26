# Darwin Education iOS

App nativo SwiftUI (iOS 18+) para publicar na Apple App Store.

## Pré-requisitos

| Ferramenta | Instalação |
|---|---|
| Xcode 16+ | App Store do Mac |
| XcodeGen | `brew install xcodegen` |
| Apple Developer Program | [developer.apple.com](https://developer.apple.com) |

## Setup em 5 passos (primeira vez)

### 1. Clone o repositório
```bash
git clone https://github.com/agourakis82/Darwin-education.git
cd Darwin-education/apps/ios-native
```

### 2. Configure o segredo Supabase
```bash
cp Secrets.xcconfig.template Secrets.xcconfig
```
Abra `Secrets.xcconfig` e substitua `REPLACE_WITH_YOUR_SUPABASE_ANON_KEY` pela sua chave real (encontre em: [Supabase Dashboard → Project Settings → API → anon key](https://app.supabase.com)).

> **Nunca** faça commit de `Secrets.xcconfig` — ele já está no `.gitignore`.

### 3. Gere o projeto Xcode
```bash
xcodegen generate
```
Isso cria `DarwinEducation.xcodeproj` a partir do `project.yml`.

### 4. Abra no Xcode
```bash
open DarwinEducation.xcodeproj
```

### 5. Configure Signing & Capabilities
- Selecione o target **DarwinEducation** na barra lateral
- Aba **Signing & Capabilities**
- Em **Team**, selecione sua conta Apple Developer
- O Bundle ID `org.darwineducation.ios` é configurável se necessário

## Rodar no simulador

`Cmd+R` → selecione qualquer simulador de iPhone

## Rodar em dispositivo físico

1. Conecte o iPhone via USB
2. Confie no computador (aparece no iPhone)
3. Selecione o dispositivo no seletor do Xcode
4. `Cmd+R`

## Publicar no TestFlight

1. `Product → Archive` (selecione um dispositivo real, não simulador)
2. Na janela **Organizer** → **Distribute App**
3. **App Store Connect** → **Upload**
4. Acesse [App Store Connect](https://appstoreconnect.apple.com) → TestFlight

## Atualizar após mudanças em `project.yml`

```bash
xcodegen generate   # re-executa sempre que project.yml mudar
```

**Não** commit `DarwinEducation.xcodeproj/` — está no `.gitignore` e é sempre regenerado.

## Arquitetura

| Pasta | Conteúdo |
|---|---|
| `App/` | Entry point, RootView, RootTabView, tabs |
| `AppState/` | AppStore, AppDependencies, ThemeStore, FeatureFlags |
| `DesignSystem/` | DarwinTheme, tokens, espaçamento, materiais |
| `CoreUI/` | Componentes reutilizáveis, StateViews, Haptics, UIKit bridge |
| `Core/Auth/` | AuthService, SessionStore, KeychainStore |
| `Data/Models/` | CDMModels, FlashcardModels, QuestionModels, FeatureModels |
| `Data/Repositories/` | LiveRepositories, RepositoryProtocols |
| `Networking/` | DarwinAPIClient, HTTPClient, APIError |
| `Features/` | Home, Exams (+ Adaptive), Flashcards (+ Study), Performance (+ CDM), Content, Account |

## Features implementadas

| Feature | Status | Tela |
|---|---|---|
| Auth (email/senha) | ✅ | `LoginView` |
| Simulados (fixos) | ✅ | `ExamsView → ExamDetailView → ExamReviewView` |
| **Simulado Adaptativo (CDM-CAT)** | ✅ **novo** | `AdaptiveExamView` |
| **Flashcard Study Session** | ✅ **novo** | `FlashcardStudyView` |
| **Diagnóstico CDM** | ✅ **novo** | `CDMDashboardView` (em Desempenho) |
| Desempenho geral | ✅ | `PerformanceView` |
| Conteúdo médico | ✅ | `ContentView` |
| Conta / Tema | ✅ | `AccountView` |
| Trilhas | 🔜 stub | `TrailsView` |
| CIP | 🔜 stub | `CIPView` |

## Variáveis de ambiente (build settings via Secrets.xcconfig)

| Variável | Descrição |
|---|---|
| `DARWIN_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `DARWIN_API_BASE_URL` | URL base da API web (ex: `https://darwinhub.org`) |
| `DARWIN_SUPABASE_URL` | URL do projeto Supabase |
