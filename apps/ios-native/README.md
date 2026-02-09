# Darwin Education iOS Native

Base do app nativo iOS em SwiftUI para publicar na Apple App Store.

## Requisitos

- macOS + Xcode 16+
- XcodeGen (`brew install xcodegen`)
- Apple Developer Program ativo

## Gerar projeto

```bash
cd apps/ios-native
xcodegen generate
open DarwinEducation.xcodeproj
```

## Configuracao inicial no Xcode

1. Em `Signing & Capabilities`, selecione seu time.
2. Ajuste `Bundle Identifier` final.
3. Configure chave `DARWIN_SUPABASE_ANON_KEY` nas Build Settings.
4. Defina icone e splash.
5. Rode no simulador e depois em dispositivo real.

## Arquitetura inicial

- `DarwinEducation/App`: bootstrap, roteamento e tabs.
- `DarwinEducation/Core`: configuracao, sessao e persistencia.
- `DarwinEducation/Networking`: cliente HTTP e integracao com API.
- `DarwinEducation/Features`: telas nativas (Home, Simulados, Flashcards, Desempenho, Conta).

## Mapeamento Web -> iOS nativo

- `/` -> `HomeView`
- `/simulado` -> `SimuladosView`
- `/flashcards` -> `FlashcardsView`
- `/desempenho` -> `PerformanceView`
- `/(auth)/login` -> `LoginView`

## Observacoes

- Este scaffold evita WebView: toda UI e navegacao sao nativas SwiftUI.
- A autenticacao usa Supabase Auth REST para login por email/senha.
- Endpoints protegidos devem receber `Authorization: Bearer <token>`.
