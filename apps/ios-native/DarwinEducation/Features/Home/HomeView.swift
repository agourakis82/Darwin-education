import SwiftUI

struct HomeView: View {
    var body: some View {
        List {
            Section("Darwin Education") {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Preparacao ENAMED")
                        .font(.headline)
                    Text("Versao nativa iOS em SwiftUI.")
                        .foregroundStyle(.secondary)
                }
                .padding(.vertical, 4)
            }

            Section("Acesso rapido") {
                Label("Iniciar Simulado", systemImage: "play.circle")
                Label("Revisar Flashcards", systemImage: "rectangle.stack")
                Label("Ver desempenho", systemImage: "chart.line.uptrend.xyaxis")
            }
        }
        .navigationTitle("Inicio")
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
