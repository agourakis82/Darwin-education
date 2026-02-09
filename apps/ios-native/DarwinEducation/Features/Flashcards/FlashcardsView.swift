import SwiftUI

struct FlashcardsView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = FlashcardsViewModel()

    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView("Carregando decks...")
            } else if let errorMessage = viewModel.errorMessage {
                ContentUnavailableView("Falha ao carregar", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
            } else if viewModel.decks.isEmpty {
                ContentUnavailableView("Sem revisoes pendentes", systemImage: "checkmark.circle")
            } else {
                List(viewModel.decks) { deck in
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
                    .padding(.vertical, 4)
                }
                .listStyle(.insetGrouped)
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
