import SwiftUI

struct PerformanceView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = PerformanceViewModel()

    var body: some View {
        List {
            Section("Resumo") {
                MetricRow(
                    title: "Dominio Geral",
                    value: String(format: "%.1f%%", viewModel.summary.overallMastery * 100)
                )
                MetricRow(
                    title: "Minutos na semana",
                    value: "\(viewModel.summary.weeklyStudyMinutes)"
                )
                MetricRow(
                    title: "Questoes respondidas",
                    value: "\(viewModel.summary.answeredQuestions)"
                )
            }

            if let errorMessage = viewModel.errorMessage {
                Section("Aviso") {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Desempenho")
        .overlay {
            if viewModel.isLoading {
                ProgressView("Carregando indicadores...")
            }
        }
        .task {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
        .refreshable {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
    }
}

private struct MetricRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
        }
    }
}

#Preview {
    NavigationStack {
        PerformanceView()
            .environmentObject(SessionStore())
    }
}
