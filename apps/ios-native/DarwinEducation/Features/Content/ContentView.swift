import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel: ContentViewModel

    init(viewModel: ContentViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                DarwinLoadingView(title: "Carregando conteudo medico...")
            } else if let errorMessage = viewModel.errorMessage {
                DarwinErrorView(title: "Falha ao carregar", message: errorMessage) {
                    Task { await viewModel.load(accessToken: sessionStore.accessToken) }
                }
            } else {
                ScrollView {
                    VStack(spacing: DarwinSpacing.md) {
                        searchBar

                        DarwinCard {
                            VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                                Label("Doencas", systemImage: "cross.case")
                                    .font(.headline)
                                ForEach(viewModel.diseases.prefix(8)) { disease in
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(disease.title)
                                            .font(.subheadline.weight(.semibold))
                                        Text(disease.summary)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(2)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                        }

                        DarwinCard {
                            VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                                Label("Medicamentos", systemImage: "pills")
                                    .font(.headline)
                                ForEach(viewModel.medications.prefix(8)) { medication in
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(medication.genericName)
                                            .font(.subheadline.weight(.semibold))
                                        Text(medication.summary)
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                            .lineLimit(2)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                        }
                    }
                    .padding(DarwinSpacing.md)
                }
                .background(AppBackground())
            }
        }
        .navigationTitle("Conteudo")
        .task {
            await viewModel.load(accessToken: sessionStore.accessToken)
        }
    }

    private var searchBar: some View {
        DarwinCard {
            HStack(spacing: DarwinSpacing.xs) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(.secondary)
                TextField("Buscar doencas e medicamentos", text: $viewModel.query)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                if !viewModel.query.isEmpty {
                    Button {
                        viewModel.query = ""
                        Task { await viewModel.load(accessToken: sessionStore.accessToken) }
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.tertiary)
                    }
                }
            }
        }
        .onSubmit {
            DarwinHaptics.tap()
            Task {
                await viewModel.load(accessToken: sessionStore.accessToken)
            }
        }
    }
}

#Preview {
    NavigationStack {
        ContentView(viewModel: ContentViewModel(repository: LiveMedicalContentRepository()))
            .environmentObject(SessionStore())
    }
}
