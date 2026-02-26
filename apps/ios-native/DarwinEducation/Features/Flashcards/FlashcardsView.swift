import SwiftUI

struct FlashcardsView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = FlashcardsViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                DarwinLoadingView(title: "Carregando decks...")
            } else if let errorMessage = viewModel.errorMessage {
                DarwinErrorView(title: "Falha ao carregar", message: errorMessage) {
                    Task { await viewModel.load(accessToken: sessionStore.accessToken) }
                }
            } else if viewModel.deckGroups.isEmpty {
                ContentUnavailableView("Sem revisões pendentes", systemImage: "checkmark.circle")
            } else {
                ScrollView {
                    LazyVStack(spacing: DarwinSpacing.sm) {
                        ForEach(viewModel.deckGroups) { group in
                            NavigationLink {
                                FlashcardStudyView(
                                    cards: group.cards,
                                    deckTitle: group.deckName,
                                    accessToken: sessionStore.accessToken
                                )
                            } label: {
                                DarwinCard {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(group.deckName)
                                                .font(.headline)
                                                .foregroundStyle(.primary)
                                            Text("\(group.dueCount) pendente\(group.dueCount == 1 ? "" : "s")")
                                                .font(.subheadline)
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
        FlashcardsView()
            .environmentObject(SessionStore())
    }
}
