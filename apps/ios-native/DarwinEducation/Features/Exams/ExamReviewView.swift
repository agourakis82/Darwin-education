import SwiftUI

struct ExamReviewView: View {
    @ObservedObject var viewModel: ExamDetailViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Score summary
            scoreSummary
                .padding(DarwinSpacing.md)

            Divider()

            // Questions list
            ScrollView {
                LazyVStack(spacing: DarwinSpacing.md) {
                    ForEach(Array(viewModel.questions.enumerated()), id: \.element.id) { index, question in
                        questionReviewCard(index: index, question: question)
                    }
                }
                .padding(DarwinSpacing.md)
            }
        }
        .background(AppBackground())
        .navigationTitle("Revisao")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var scoreSummary: some View {
        DarwinCard {
            HStack(spacing: DarwinSpacing.lg) {
                VStack {
                    Text("\(viewModel.correctCount)/\(viewModel.questions.count)")
                        .font(.title.bold())
                        .foregroundStyle(DarwinColor.accent)
                    Text("Acertos")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                let percent = viewModel.questions.isEmpty ? 0 :
                    Double(viewModel.correctCount) / Double(viewModel.questions.count) * 100

                VStack {
                    Text("\(Int(percent))%")
                        .font(.title.bold())
                        .foregroundStyle(percent >= 60 ? DarwinColor.accent : .red)
                    Text("Aproveitamento")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                VStack {
                    Text("\(viewModel.questions.count - viewModel.correctCount)")
                        .font(.title.bold())
                        .foregroundStyle(.red)
                    Text("Erros")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    @ViewBuilder
    private func questionReviewCard(index: Int, question: ExamQuestion) -> some View {
        let userAnswer = viewModel.answers[question.id]
        let isCorrect = userAnswer == question.correctIndex

        DarwinCard {
            VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                // Header
                HStack {
                    Text("Questao \(index + 1)")
                        .font(.subheadline.weight(.semibold))

                    Spacer()

                    Image(systemName: isCorrect ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .foregroundStyle(isCorrect ? .green : .red)
                }

                // Stem
                Text(question.stem)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .lineLimit(3)

                // Options
                VStack(spacing: DarwinSpacing.xs) {
                    ForEach(Array(question.options.enumerated()), id: \.offset) { idx, option in
                        let isUserChoice = userAnswer == idx
                        let isCorrectOption = question.correctIndex == idx

                        HStack(spacing: DarwinSpacing.xs) {
                            Text(option.letter)
                                .font(.caption.weight(.semibold))
                                .frame(width: 22, height: 22)
                                .background(
                                    isCorrectOption ? Color.green.opacity(0.2) :
                                    isUserChoice ? Color.red.opacity(0.2) : Color.clear
                                )
                                .foregroundStyle(
                                    isCorrectOption ? .green :
                                    isUserChoice ? .red : .secondary
                                )
                                .clipShape(Circle())
                                .overlay(
                                    Circle().stroke(
                                        isCorrectOption ? Color.green :
                                        isUserChoice ? Color.red : Color.secondary.opacity(0.2),
                                        lineWidth: 1
                                    )
                                )

                            Text(option.text)
                                .font(.caption)
                                .foregroundStyle(
                                    isCorrectOption ? .green :
                                    isUserChoice ? .red : .primary
                                )
                                .lineLimit(2)

                            Spacer()

                            if isCorrectOption {
                                Image(systemName: "checkmark")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(.green)
                            } else if isUserChoice {
                                Image(systemName: "xmark")
                                    .font(.caption2.weight(.bold))
                                    .foregroundStyle(.red)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // Explanation
                if let explanation = question.explanation, !explanation.isEmpty {
                    Divider()

                    VStack(alignment: .leading, spacing: DarwinSpacing.xs) {
                        Label("Explicacao", systemImage: "lightbulb.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(DarwinColor.accent)

                        if let attributed = try? AttributedString(markdown: explanation) {
                            Text(attributed)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            Text(explanation)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
    }
}
