import SwiftUI

struct TrailsView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.md) {
                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.xs) {
                        Label("Trilhas adaptativas", systemImage: "map")
                            .font(.headline)
                        Text("Caminhos de estudo orientados por desempenho e lacunas do aluno.")
                            .foregroundStyle(.secondary)
                    }
                }

                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.xs) {
                        Text("Paridade comportamental")
                            .font(.headline)
                        Text("Abertura de trilha, progresso de modulo e recomendacoes seguem os mesmos contratos da web.")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(DarwinSpacing.md)
        }
        .navigationTitle("Trilhas")
        .background(AppBackground())
    }
}

#Preview {
    NavigationStack {
        TrailsView()
    }
}
