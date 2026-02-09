import SwiftUI

struct RootTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                HomeView()
            }
            .tabItem {
                Label("Inicio", systemImage: "house")
            }

            NavigationStack {
                SimuladosView()
            }
            .tabItem {
                Label("Simulados", systemImage: "doc.text.magnifyingglass")
            }

            NavigationStack {
                FlashcardsView()
            }
            .tabItem {
                Label("Flashcards", systemImage: "rectangle.stack")
            }

            NavigationStack {
                PerformanceView()
            }
            .tabItem {
                Label("Desempenho", systemImage: "chart.line.uptrend.xyaxis")
            }

            NavigationStack {
                AccountView()
            }
            .tabItem {
                Label("Conta", systemImage: "person.circle")
            }
        }
    }
}

#Preview {
    RootTabView()
}
