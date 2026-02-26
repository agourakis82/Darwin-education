import SwiftUI

struct CDMDashboardView: View {
    @ObservedObject var viewModel: CDMDashboardViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
            // Section header
            HStack {
                Label("Diagnóstico Cognitivo CDM", systemImage: "brain")
                    .font(.headline)
                Spacer()
                Button {
                    Task { await viewModel.classify() }
                } label: {
                    if viewModel.isClassifying {
                        ProgressView().scaleEffect(0.75)
                    } else {
                        Text("Classificar")
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(DarwinColor.accent.opacity(0.15))
                            .foregroundStyle(DarwinColor.accent)
                            .clipShape(Capsule())
                    }
                }
                .disabled(viewModel.isClassifying)
            }

            if let msg = viewModel.classifyMessage {
                Text(msg)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .padding(.bottom, 2)
            }

            if let profile = viewModel.profileData?.profile {
                // Stats row
                statsRow(profile: profile, summary: viewModel.profileData?.summary)

                // Attribute bars
                ForEach(profile.attributeBreakdown) { attr in
                    attributeRow(attr: attr)
                }
            } else if viewModel.isLoading {
                ProgressView("Carregando perfil CDM…").frame(maxWidth: .infinity)
            } else {
                emptyState
            }
        }
    }

    // MARK: - Stats row

    private func statsRow(profile: CDMProfile, summary: CDMSummary?) -> some View {
        HStack(spacing: 0) {
            statCell(
                value: "\(summary?.masteredCount ?? 0) / 6",
                label: "Dominados",
                color: .green
            )
            Divider().frame(height: 40)
            statCell(
                value: String(format: "%.2f", profile.posteriorEntropy),
                label: "Entropia",
                color: DarwinColor.accentSecondary
            )
            Divider().frame(height: 40)
            statCell(
                value: profile.classificationConfidence.map { String(format: "%.0f%%", $0 * 100) } ?? "—",
                label: "Confiança",
                color: .purple
            )
        }
        .padding(.vertical, DarwinSpacing.xs)
        .background(Color.secondary.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: DarwinRadius.md))
    }

    private func statCell(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.headline.monospacedDigit()).foregroundStyle(color)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, DarwinSpacing.xs)
    }

    // MARK: - Attribute bar

    private func attributeRow(attr: AttributeBreakdown) -> some View {
        let barColor: Color = attr.eap >= 0.70 ? .green : attr.eap >= 0.40 ? DarwinColor.warning : .red

        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(attr.labelPt)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.primary)
                Spacer()
                Image(systemName: attr.mastered ? "checkmark.circle.fill" : "xmark.circle")
                    .font(.caption)
                    .foregroundStyle(attr.mastered ? .green : .red)
                Text(String(format: "%.0f%%", attr.eap * 100))
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(barColor)
                    .frame(width: 36, alignment: .trailing)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.secondary.opacity(0.15)).frame(height: 6)
                    Capsule()
                        .fill(barColor)
                        .frame(width: geo.size.width * attr.eap, height: 6)
                        .animation(.spring(response: 0.5, dampingFraction: 0.7), value: attr.eap)
                }
            }
            .frame(height: 6)
        }
        .padding(.vertical, 2)
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: DarwinSpacing.xs) {
            Image(systemName: "chart.bar.xaxis").font(.title2).foregroundStyle(.secondary)
            Text("Perfil CDM não disponível")
                .font(.subheadline).foregroundStyle(.secondary)
            Text("Complete pelo menos 20 questões e toque em Classificar.")
                .font(.caption).foregroundStyle(.tertiary).multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(DarwinSpacing.md)
    }
}
