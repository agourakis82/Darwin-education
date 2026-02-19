# Darwin Education iOS Native

Base do app nativo iOS em SwiftUI + UIKit para publicar na Apple App Store.

## Requisitos

- macOS + Xcode 16+
- XcodeGen (`brew install xcodegen`)
- Apple Developer Program ativo
- Deployment target: iOS 18+

> Observação: a extensão Swift no editor ajuda no autocomplete, mas não substitui a toolchain completa do Xcode/macOS para compilar.

## Gerar projeto

```bash
cd apps/ios-native
xcodegen generate
open DarwinEducation.xcodeproj
```

## Checklist local de build (1-2-3)

1. `swift --version` para validar a toolchain instalada.
2. `xcodegen generate` para materializar `DarwinEducation.xcodeproj`.
3. `open DarwinEducation.xcodeproj` e faça `Product -> Build` no simulador.

No Linux sem macOS não é possível validar build iOS, então use esse fluxo no seu Mac.

## Configuracao inicial no Xcode

1. Em `Signing & Capabilities`, selecione seu time.
2. Ajuste `Bundle Identifier` final.
3. Configure chave `DARWIN_SUPABASE_ANON_KEY` nas Build Settings.
4. Defina icone e splash.
5. Rode no simulador e depois em dispositivo real.

## Arquitetura

- `DarwinEducation/App`: bootstrap, roteamento, tabs e shell global.
- `DarwinEducation/AppState`: stores de tema, feature flags e dependencias.
- `DarwinEducation/DesignSystem`: tokens, tema, materiais e espacamento.
- `DarwinEducation/CoreUI`: componentes reutilizaveis, states, haptics e bridge UIKit.
- `DarwinEducation/Data`: modelos, cliente Supabase REST e repositorios tipados.
- `DarwinEducation/Networking`: cliente HTTP e compatibilidade com endpoints web.
- `DarwinEducation/Features`: telas nativas (Home, Simulados, Flashcards, Conteudo, Desempenho, CIP, Trilhas, Conta).

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
