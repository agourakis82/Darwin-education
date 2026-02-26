import SwiftUI

struct FlashcardStudyView: View {
    @StateObject private var viewModel: FlashcardStudyViewModel
    @Environment(\.dismiss) private var dismiss

    let deckTitle: String

    init(cards: [FlashcardDueCard], deckTitle: String, accessToken: String?) {
        self.deckTitle = deckTitle
        _viewModel = StateObject(wrappedValue: FlashcardStudyViewModel(
            cards: cards,
            accessToken: accessToken
        ))
    }

    var body: some View {
        ZStack {
            AppBackground().ignoresSafeArea()

            switch viewModel.phase {
            case .done:
                doneView
            default:
                studyView
            }
        }
        .navigationTitle(deckTitle)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Study view

    private var studyView: some View {
        VStack(spacing: DarwinSpacing.lg) {
            // Progress
            progressBar

            Spacer()

            // Card
            if let card = viewModel.currentCard {
                flashcard(card: card)
                    .onTapGesture { viewModel.flip() }

                if viewModel.phase == .back {
                    ratingButtons
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }

            Spacer()

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }
        }
        .padding(DarwinSpacing.md)
    }

    // MARK: - Flashcard

    private func flashcard(card: FlashcardDueCard) -> some View {
        ZStack {
            // Front face
            cardFace(text: card.front, isFront: true)
                .opacity(viewModel.isFlipped ? 0 : 1)
                .rotation3DEffect(.degrees(viewModel.isFlipped ? -90 : 0), axis: (0, 1, 0))

            // Back face
            cardFace(text: card.back, isFront: false)
                .opacity(viewModel.isFlipped ? 1 : 0)
                .rotation3DEffect(.degrees(viewModel.isFlipped ? 0 : 90), axis: (0, 1, 0))
        }
        .frame(maxWidth: .infinity, minHeight: 220)
        .animation(.spring(response: 0.4, dampingFraction: 0.75), value: viewModel.isFlipped)
    }

    private func cardFace(text: String, isFront: Bool) -> some View {
        DarwinCard {
            VStack(spacing: DarwinSpacing.sm) {
                if isFront {
                    Label("Frente", systemImage: "questionmark.circle")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                } else {
                    Label("Verso", systemImage: "lightbulb.fill")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(DarwinColor.accent)
                }
                Text(text)
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                if isFront {
                    Text("Toque para revelar")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .padding(.top, 4)
                }
            }
            .padding(DarwinSpacing.sm)
        }
    }

    // MARK: - Rating buttons

    private var ratingButtons: some View {
        HStack(spacing: DarwinSpacing.xs) {
            ratingButton(label: "De novo", rating: 1, color: .red)
            ratingButton(label: "Difícil", rating: 2, color: DarwinColor.warning)
            ratingButton(label: "Bom",     rating: 3, color: DarwinColor.accent)
            ratingButton(label: "Fácil",   rating: 4, color: .green)
        }
        .disabled(viewModel.isSubmitting)
    }

    private func ratingButton(label: String, rating: Int, color: Color) -> some View {
        Button {
            Haptics.tap()
            Task { await viewModel.rate(rating) }
        } label: {
            VStack(spacing: 2) {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(color)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, DarwinSpacing.sm)
            .background(color.opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: DarwinRadius.md))
        }
    }

    // MARK: - Progress bar

    private var progressBar: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Revisados: \(viewModel.reviewedCount)")
                    .font(.caption2).foregroundStyle(.secondary)
                Spacer()
                Text("Restantes: \(viewModel.remaining)")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            let total = viewModel.reviewedCount + viewModel.remaining
            let progress = total > 0 ? Double(viewModel.reviewedCount) / Double(total) : 0
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.2)).frame(height: 4)
                    Capsule().fill(DarwinColor.accent).frame(width: geo.size.width * progress, height: 4)
                }
            }
            .frame(height: 4)
        }
    }

    // MARK: - Done view

    private var doneView: some View {
        VStack(spacing: DarwinSpacing.lg) {
            Spacer()
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 64))
                .foregroundStyle(DarwinColor.accent)
            Text("Sessão concluída!")
                .font(.title2.bold())
            Text("Revisados \(viewModel.reviewedCount) cartão\(viewModel.reviewedCount == 1 ? "" : "ões").")
                .foregroundStyle(.secondary)
            Spacer()
            Button("Fechar") { dismiss() }
                .buttonStyle(.borderedProminent)
                .tint(DarwinColor.accent)
        }
        .padding(DarwinSpacing.md)
    }
}
