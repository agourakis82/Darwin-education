import SwiftUI

struct FlashcardsView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: FlashcardsViewModel

    init(repository: FlashcardsRepository) {
        _viewModel = StateObject(wrappedValue: FlashcardsViewModel(repository: repository))
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                DarwinLoadingView(title: "Carregando decks...")
            } else if let errorMessage = viewModel.errorMessage {
                DarwinErrorView(title: "Falha ao carregar", message: errorMessage) {
                    Task { await viewModel.load(accessToken: sessionStore.accessToken) }
                }
            } else if viewModel.decks.isEmpty {
                ContentUnavailableView("Sem revisoes pendentes", systemImage: "checkmark.circle")
            } else {
                ScrollView {
                    LazyVStack(spacing: DarwinSpacing.sm) {
                        ForEach(viewModel.decks) { deck in
                            DarwinCard {
                                HStack {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(deck.title)
                                            .font(.headline)
                                        Text("Pendentes: \(deck.dueCount)")
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .foregroundStyle(.tertiary)
                                }
                            }
                        }
                    }
                    .padding(DarwinSpacing.md)
                }
                .background(AppBackground())
            }
        }
        .navigationTitle("Flashcards")
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
        FlashcardsView(repository: LiveFlashcardsRepository())
            .environmentObject(SessionStore())
    }
}
