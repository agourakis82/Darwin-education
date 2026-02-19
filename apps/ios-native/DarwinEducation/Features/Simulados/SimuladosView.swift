import SwiftUI

// Kept for backward compatibility while new native exams flow uses ExamsView.
struct SimuladosView: View {
    var body: some View {
        ContentUnavailableView(
            "Fluxo migrado",
            systemImage: "arrow.triangle.2.circlepath",
            description: Text("Use a aba Simulados para o novo fluxo nativo com dados Supabase.")
        )
        .navigationTitle("Simulados")
    }
}

#Preview {
    NavigationStack {
        SimuladosView()
    }
}
