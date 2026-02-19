import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: HomeViewModel

    init(viewModel: HomeViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.md) {
                hero
                metrics
                quickActions

                if let errorMessage = viewModel.errorMessage {
                    DarwinErrorView(title: "Falha ao sincronizar", message: errorMessage)
                }
            }
            .padding(DarwinSpacing.md)
        }
        .background(AppBackground())
        .navigationTitle("Darwin Education")
        .task {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
        .refreshable {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
    }

    private var hero: some View {
        DarwinCard {
            VStack(alignment: .leading, spacing: DarwinSpacing.xs) {
                Text("Preparacao ENAMED")
                    .font(.title2.bold())
                Text("Arquitetura nativa Apple com paridade comportamental com a web.")
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var metrics: some View {
        HStack(spacing: DarwinSpacing.sm) {
            metricCard(title: "Simulados", value: "\(viewModel.examsCount)", icon: "doc.text")
            metricCard(title: "Revisoes", value: "\(viewModel.dueDecksCount)", icon: "rectangle.stack")
            metricCard(title: "Dominio", value: String(format: "%.0f%%", viewModel.masteryPercent * 100), icon: "chart.line.uptrend.xyaxis")
        }
    }

    private var quickActions: some View {
        DarwinCard {
            VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                Text("Acesso rapido")
                    .font(.headline)

                Label("Iniciar simulado", systemImage: "play.circle")
                Label("Revisar flashcards", systemImage: "rectangle.stack")
                Label("Abrir conteudo medico", systemImage: "book")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func metricCard(title: String, value: String, icon: String) -> some View {
        DarwinCard {
            VStack(alignment: .leading, spacing: 6) {
                Image(systemName: icon)
                    .font(.headline)
                    .foregroundStyle(DarwinColor.accent)
                Text(value)
                    .font(.title3.bold())
                Text(title)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#Preview {
    NavigationStack {
        HomeView(
            viewModel: HomeViewModel(
                examsRepository: LiveExamsRepository(),
                flashcardsRepository: LiveFlashcardsRepository(),
                performanceRepository: LivePerformanceRepository()
            )
        )
        .environmentObject(SessionStore())
    }
}
