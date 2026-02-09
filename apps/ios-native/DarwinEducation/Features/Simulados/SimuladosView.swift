import SwiftUI

struct SimuladosView: View {
    var body: some View {
        List {
            Section("Simulados") {
                Text("Fluxo nativo em construcao.")
                    .foregroundStyle(.secondary)
                Text("Proximos passos: setup, prova, revisao e resultado.")
            }

            Section("Roadmap imediato") {
                Label("Adaptive setup", systemImage: "slider.horizontal.3")
                Label("Tela de questao", systemImage: "list.bullet.clipboard")
                Label("Resultado TRI", systemImage: "chart.bar.doc.horizontal")
            }
        }
        .navigationTitle("Simulados")
    }
}

#Preview {
    NavigationStack {
        SimuladosView()
    }
}
