import SwiftUI

enum ThemePreference: String, CaseIterable, Identifiable {
    case system
    case light
    case dark

    var id: String { rawValue }

    var title: String {
        switch self {
        case .system: return "Sistema"
        case .light: return "Claro"
        case .dark: return "Escuro"
        }
    }

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max"
        case .dark: return "moon.stars"
        }
    }

    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

enum DarwinSpacing {
    static let xxs: CGFloat = 4
    static let xs: CGFloat = 8
    static let sm: CGFloat = 12
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 32
}

enum DarwinRadius {
    static let md: CGFloat = 14
    static let lg: CGFloat = 20
    static let xl: CGFloat = 28
}

enum DarwinColor {
    static let accent = Color(red: 0.09, green: 0.65, blue: 0.5)
    static let accentSecondary = Color(red: 0.24, green: 0.56, blue: 0.95)
    static let warning = Color(red: 0.97, green: 0.66, blue: 0.24)
}

enum DarwinMaterial {
    static let panel: Material = .regularMaterial
    static let chrome: Material = .ultraThinMaterial
    static let card: Material = .thinMaterial
}
