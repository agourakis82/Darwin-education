import SwiftUI

struct ExamsView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: ExamsViewModel

    init(viewModel: ExamsViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                DarwinLoadingView(title: "Carregando simulados...")
            } else if let errorMessage = viewModel.errorMessage {
                DarwinErrorView(title: "Falha ao carregar", message: errorMessage) {
                    Task { await viewModel.load(accessToken: sessionStore.accessToken) }
                }
            } else if viewModel.exams.isEmpty {
                ContentUnavailableView("Sem simulados", systemImage: "doc.text", description: Text("Nenhum simulado publico disponivel no momento."))
            } else {
                ScrollView {
                    LazyVStack(spacing: DarwinSpacing.sm) {
                        ForEach(viewModel.exams) { exam in
                            NavigationLink(value: exam) {
                                DarwinCard {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 6) {
                                            Text(exam.title)
                                                .font(.headline)
                                            Text("\(exam.questionCount) questoes • \(exam.timeLimitMinutes) min")
                                                .font(.footnote)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Image(systemName: "chevron.right")
                                            .foregroundStyle(.tertiary)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(DarwinSpacing.md)
                }
                .background(AppBackground())
            }
        }
        .navigationTitle("Simulados")
        .navigationDestination(for: ExamSummary.self) { exam in
            ExamDetailView(examId: exam.id, repository: viewModel.repository)
                .environmentObject(sessionStore)
        }
        .task {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
        .refreshable {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
    }
}

#Preview {
    NavigationStack {
        ExamsView(viewModel: ExamsViewModel(repository: LiveExamsRepository()))
            .environmentObject(SessionStore())
    }
}
