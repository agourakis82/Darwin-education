import SwiftUI

struct PerformanceView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: PerformanceViewModel
    @StateObject private var cdmViewModel: CDMDashboardViewModel

    init(repository: PerformanceRepository) {
        _viewModel = StateObject(wrappedValue: PerformanceViewModel(repository: repository))
        _cdmViewModel = StateObject(wrappedValue: CDMDashboardViewModel(accessToken: nil))
    }

    var body: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.md) {
                // Performance summary
                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                        Text("Resumo")
                            .font(.headline)
                        metricRow(title: "Domínio Geral", value: String(format: "%.1f%%", viewModel.summary.masteryPercent * 100))
                        metricRow(title: "Minutos na semana", value: "\(viewModel.summary.weeklyMinutes)")
                        metricRow(title: "Questões respondidas", value: "\(viewModel.summary.answeredQuestions)")
                    }
                }

                // CDM Dashboard
                DarwinCard {
                    CDMDashboardView(viewModel: cdmViewModel)
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
            cdmViewModel.accessToken = sessionStore.accessToken
            await withTaskGroup(of: Void.self) { group in
                group.addTask { await self.viewModel.load(accessToken: self.sessionStore.accessToken) }
                group.addTask { await self.cdmViewModel.load() }
            }
        }
        .refreshable {
            cdmViewModel.accessToken = sessionStore.accessToken
            await withTaskGroup(of: Void.self) { group in
                group.addTask { await self.viewModel.load(accessToken: self.sessionStore.accessToken) }
                group.addTask { await self.cdmViewModel.load() }
            }
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
