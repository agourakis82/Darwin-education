import SwiftUI

struct RootTabView: View {
    @EnvironmentObject private var appStore: AppStore

    var body: some View {
        TabView {
            NavigationStack {
                HomeView(
                    viewModel: HomeViewModel(
                        examsRepository: appStore.dependencies.examsRepository,
                        flashcardsRepository: appStore.dependencies.flashcardsRepository,
                        performanceRepository: appStore.dependencies.performanceRepository
                    )
                )
            }
            .tabItem {
                Label("Inicio", systemImage: "house")
            }

            NavigationStack {
                ExamsView(viewModel: ExamsViewModel(repository: appStore.dependencies.examsRepository))
            }
            .tabItem {
                Label("Simulados", systemImage: "doc.text.magnifyingglass")
            }

            NavigationStack {
                AdaptiveExamView()
            }
            .tabItem {
                Label("Adaptativo", systemImage: "brain")
            }

            NavigationStack {
                FlashcardsView()
            }
            .tabItem {
                Label("Flashcards", systemImage: "rectangle.stack")
            }

            NavigationStack {
                ContentView(viewModel: ContentViewModel(repository: appStore.dependencies.medicalContentRepository))
            }
            .tabItem {
                Label("Conteudo", systemImage: "book")
            }

            NavigationStack {
                PerformanceView(repository: appStore.dependencies.performanceRepository)
            }
            .tabItem {
                Label("Desempenho", systemImage: "chart.line.uptrend.xyaxis")
            }

            NavigationStack {
                TrailsView()
            }
            .tabItem {
                Label("Trilhas", systemImage: "map")
            }

            NavigationStack {
                CIPView()
            }
            .tabItem {
                Label("CIP", systemImage: "puzzlepiece.extension")
            }

            NavigationStack {
                AccountView()
            }
            .tabItem {
                Label("Conta", systemImage: "person.circle")
            }
        }
        .background(DarwinMaterial.chrome)
    }
}

#Preview {
    RootTabView()
        .environmentObject(AppStore())
}
