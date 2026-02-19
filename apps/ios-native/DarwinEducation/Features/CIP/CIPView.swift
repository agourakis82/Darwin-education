import SwiftUI

struct CIPView: View {
    var body: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.md) {
                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.xs) {
                        Label("Clinical Integration Puzzle", systemImage: "puzzlepiece.extension")
                            .font(.headline)
                        Text("Fluxo nativo para hipoteses, achados e conduta com feedback imediato.")
                            .foregroundStyle(.secondary)
                    }
                }

                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.xs) {
                        Text("Estados mapeados")
                            .font(.headline)
                        Text("Pronto para telas loading, vazio, erro, offline e unauthorized no modulo CIP.")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .padding(DarwinSpacing.md)
        }
        .navigationTitle("CIP")
        .background(AppBackground())
    }
}

#Preview {
    NavigationStack {
        CIPView()
    }
}
