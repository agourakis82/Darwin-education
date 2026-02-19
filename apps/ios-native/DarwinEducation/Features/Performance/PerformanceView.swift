import SwiftUI

struct PerformanceView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: PerformanceViewModel

    init(repository: PerformanceRepository) {
        _viewModel = StateObject(wrappedValue: PerformanceViewModel(repository: repository))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.md) {
                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                        Text("Resumo")
                            .font(.headline)
                        metricRow(title: "Dominio Geral", value: String(format: "%.1f%%", viewModel.summary.masteryPercent * 100))
                        metricRow(title: "Minutos na semana", value: "\(viewModel.summary.weeklyMinutes)")
                        metricRow(title: "Questoes respondidas", value: "\(viewModel.summary.answeredQuestions)")
                    }
                }

                if let errorMessage = viewModel.errorMessage {
                    DarwinErrorView(title: "Falha ao carregar", message: errorMessage)
                }
            }
            .padding(DarwinSpacing.md)
        }
        .background(AppBackground())
        .navigationTitle("Desempenho")
        .overlay {
            if viewModel.isLoading {
                DarwinLoadingView(title: "Carregando indicadores...")
                    .background(.ultraThinMaterial)
            }
        }
        .task {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
        .refreshable {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
    }

    private func metricRow(title: String, value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value).fontWeight(.semibold)
        }
    }
}

#Preview {
    NavigationStack {
        PerformanceView(repository: LivePerformanceRepository())
            .environmentObject(SessionStore())
    }
}
