import SwiftUI

struct ExamQuestionView: View {
    @ObservedObject var viewModel: ExamDetailViewModel

    var body: some View {
        VStack(spacing: 0) {
            // Progress bar
            ProgressView(value: Double(viewModel.answeredCount), total: Double(viewModel.questions.count))
                .tint(DarwinColor.accent)
                .padding(.horizontal, DarwinSpacing.md)
                .padding(.top, DarwinSpacing.xs)

            // Question counter
            HStack {
                Text("Questao \(viewModel.currentIndex + 1) de \(viewModel.questions.count)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(viewModel.answeredCount)/\(viewModel.questions.count) respondidas")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, DarwinSpacing.md)
            .padding(.vertical, DarwinSpacing.xs)

            if let question = viewModel.currentQuestion {
                ScrollView {
                    VStack(alignment: .leading, spacing: DarwinSpacing.md) {
                        // Area badge
                        if let area = question.area {
                            Text(areaLabel(area))
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(.ultraThinMaterial)
                                .clipShape(Capsule())
                        }

                        // Stem
                        Text(question.stem)
                            .font(.body)
                            .fixedSize(horizontal: false, vertical: true)

                        // Options
                        VStack(spacing: DarwinSpacing.sm) {
                            ForEach(Array(question.options.enumerated()), id: \.offset) { index, option in
                                optionButton(question: question, index: index, option: option)
                            }
                        }
                    }
                    .padding(DarwinSpacing.md)
                }
            }

            // Navigation bar
            HStack(spacing: DarwinSpacing.md) {
                Button {
                    Haptics.impact(.light)
                    viewModel.previousQuestion()
                } label: {
                    Label("Anterior", systemImage: "chevron.left")
                }
                .disabled(viewModel.currentIndex == 0)

                Spacer()

                if viewModel.answeredCount == viewModel.questions.count {
                    Button {
                        Haptics.notification(.success)
                        viewModel.finishExam()
                    } label: {
                        Text("Finalizar")
                            .fontWeight(.semibold)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(DarwinColor.accent)
                }

                Spacer()

                Button {
                    Haptics.impact(.light)
                    viewModel.nextQuestion()
                } label: {
                    Label("Proxima", systemImage: "chevron.right")
                        .labelStyle(.titleAndIcon)
                }
                .disabled(viewModel.currentIndex >= viewModel.questions.count - 1)
            }
            .padding(DarwinSpacing.md)
            .background(.ultraThinMaterial)
        }
        .background(AppBackground())
        .navigationTitle("Simulado")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func optionButton(question: ExamQuestion, index: Int, option: QuestionOption) -> some View {
        let isSelected = viewModel.answers[question.id] == index

        Button {
            Haptics.impact(.light)
            viewModel.selectAnswer(index)
        } label: {
            HStack(alignment: .top, spacing: DarwinSpacing.sm) {
                Text(option.letter)
                    .font(.subheadline.weight(.semibold))
                    .frame(width: 28, height: 28)
                    .background(isSelected ? DarwinColor.accent : Color.clear)
                    .foregroundStyle(isSelected ? .white : .secondary)
                    .clipShape(Circle())
                    .overlay(
                        Circle()
                            .stroke(isSelected ? DarwinColor.accent : Color.secondary.opacity(0.3), lineWidth: 1.5)
                    )

                Text(option.text)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(DarwinSpacing.sm)
            .background(isSelected ? DarwinColor.accent.opacity(0.1) : Color.clear)
            .clipShape(RoundedRectangle(cornerRadius: DarwinRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: DarwinRadius.md, style: .continuous)
                    .stroke(isSelected ? DarwinColor.accent : Color.secondary.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func areaLabel(_ area: String) -> String {
        switch area {
        case "clinica_medica": return "Clinica Medica"
        case "cirurgia": return "Cirurgia"
        case "ginecologia_obstetricia": return "GO"
        case "pediatria": return "Pediatria"
        case "saude_coletiva": return "Saude Coletiva"
        default: return area.capitalized
        }
    }
}
