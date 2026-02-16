import SwiftUI

struct ExamDetailView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: ExamDetailViewModel

    init(examId: UUID, repository: ExamsRepository) {
        _viewModel = StateObject(wrappedValue: ExamDetailViewModel(examId: examId, repository: repository))
    }

    var body: some View {
        Group {
            switch viewModel.phase {
            case .info:
                infoView
            case .exam:
                ExamQuestionView(viewModel: viewModel)
            case .review:
                ExamReviewView(viewModel: viewModel)
            }
        }
        .navigationBarBackButtonHidden(viewModel.phase != .info)
    }

    @ViewBuilder
    private var infoView: some View {
        if viewModel.isLoading {
            DarwinLoadingView(title: "Carregando simulado...")
        } else if let errorMessage = viewModel.errorMessage {
            DarwinErrorView(title: "Erro", message: errorMessage) {
                Task { await viewModel.loadDetail(accessToken: sessionStore.accessToken) }
            }
        } else if let detail = viewModel.examDetail {
            ScrollView {
                VStack(spacing: DarwinSpacing.lg) {
                    // Exam info card
                    DarwinCard {
                        VStack(spacing: DarwinSpacing.md) {
                            Image(systemName: "doc.text.fill")
                                .font(.system(size: 40))
                                .foregroundStyle(DarwinColor.accent)

                            Text(detail.title)
                                .font(.title2.bold())
                                .multilineTextAlignment(.center)

                            HStack(spacing: DarwinSpacing.lg) {
                                Label("\(detail.questionCount) questoes", systemImage: "list.number")
                                Label("\(detail.timeLimitMinutes) min", systemImage: "clock")
                            }
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                    }

                    // Start button
                    Button {
                        Haptics.impact(.medium)
                        Task { await viewModel.startExam(accessToken: sessionStore.accessToken) }
                    } label: {
                        Text("Iniciar Simulado")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, DarwinSpacing.sm)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(DarwinColor.accent)
                    .disabled(viewModel.isLoading)
                }
                .padding(DarwinSpacing.md)
            }
            .background(AppBackground())
        } else {
            Color.clear
                .task {
                    await viewModel.loadDetail(accessToken: sessionStore.accessToken)
                }
        }
    }
}
