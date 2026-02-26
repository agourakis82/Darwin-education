import SwiftUI

struct AdaptiveExamView: View {
    @EnvironmentObject private var sessionStore: SessionStore
    @StateObject private var viewModel = AdaptiveExamViewModel(accessToken: nil)

    var body: some View {
        ZStack {
            AppBackground().ignoresSafeArea()

            switch viewModel.phase {
            case .setup:   setupView
            case .loading: DarwinLoadingView(title: "Selecionando questão…")
            case .question: questionView
            case .done:    resultsView
            }
        }
        .navigationTitle("Simulado Adaptativo")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { viewModel.accessToken = sessionStore.accessToken }
        .alert("Erro", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK") { viewModel.errorMessage = nil }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
    }

    // MARK: - Setup

    private var setupView: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.lg) {
                // Area chips
                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                        Text("Áreas do conhecimento")
                            .font(.headline)
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            ForEach(Array(viewModel.areaLabels.keys.sorted()), id: \.self) { key in
                                areaChip(key: key)
                            }
                        }
                    }
                }

                // Item count config
                DarwinCard {
                    VStack(alignment: .leading, spacing: DarwinSpacing.sm) {
                        Text("Número de questões")
                            .font(.headline)
                        Stepper("Mínimo: \(viewModel.minItems)", value: $viewModel.minItems, in: 10...viewModel.maxItems)
                        Stepper("Máximo: \(viewModel.maxItems)", value: $viewModel.maxItems, in: viewModel.minItems...120)
                    }
                }

                // How it works
                DarwinCard {
                    HStack(alignment: .top, spacing: DarwinSpacing.sm) {
                        Image(systemName: "brain").foregroundStyle(DarwinColor.accent)
                        Text("O simulado adaptativo seleciona questões com base no seu perfil cognitivo CDM, maximizando a redução de entropia posterior a cada resposta.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Button {
                    Haptics.success()
                    Task { await viewModel.start() }
                } label: {
                    Label("Iniciar Simulado Adaptativo", systemImage: "play.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(DarwinColor.accent)
                .disabled(viewModel.selectedAreas.isEmpty)
            }
            .padding(DarwinSpacing.md)
        }
    }

    private func areaChip(key: String) -> some View {
        let selected = viewModel.selectedAreas.contains(key)
        return Button {
            Haptics.tap()
            if selected {
                if viewModel.selectedAreas.count > 1 { viewModel.selectedAreas.remove(key) }
            } else {
                viewModel.selectedAreas.insert(key)
            }
        } label: {
            Text(viewModel.areaLabels[key] ?? key)
                .font(.caption.weight(.medium))
                .multilineTextAlignment(.center)
                .padding(.horizontal, 8)
                .padding(.vertical, 6)
                .frame(maxWidth: .infinity)
                .background(selected ? DarwinColor.accent.opacity(0.2) : Color.secondary.opacity(0.1))
                .foregroundStyle(selected ? DarwinColor.accent : .secondary)
                .clipShape(RoundedRectangle(cornerRadius: DarwinRadius.md))
                .overlay(
                    RoundedRectangle(cornerRadius: DarwinRadius.md)
                        .stroke(selected ? DarwinColor.accent : Color.clear, lineWidth: 1)
                )
        }
    }

    // MARK: - Question

    private var questionView: some View {
        VStack(spacing: 0) {
            VStack(spacing: 4) {
                let progress = viewModel.maxItems > 0
                    ? Double(viewModel.itemsAnswered) / Double(viewModel.maxItems) : 0
                ProgressView(value: progress).tint(DarwinColor.accent)
                HStack {
                    Text("Questão \(viewModel.itemsAnswered + 1) de até \(viewModel.maxItems)")
                        .font(.caption).foregroundStyle(.secondary)
                    Spacer()
                    Text("\(viewModel.correctCount) acerto\(viewModel.correctCount == 1 ? "" : "s")")
                        .font(.caption).foregroundStyle(.tertiary)
                }
            }
            .padding(.horizontal, DarwinSpacing.md)
            .padding(.vertical, DarwinSpacing.xs)

            if let question = viewModel.currentQuestion {
                ScrollView {
                    VStack(alignment: .leading, spacing: DarwinSpacing.md) {
                        if let area = question.area {
                            Text(areaLabel(area))
                                .font(.caption.weight(.medium))
                                .padding(.horizontal, 10).padding(.vertical, 4)
                                .background(.ultraThinMaterial).clipShape(Capsule())
                        }
                        Text(question.stem).font(.body).fixedSize(horizontal: false, vertical: true)
                        VStack(spacing: DarwinSpacing.sm) {
                            ForEach(Array(question.options.enumerated()), id: \.offset) { idx, opt in
                                adaptiveOptionButton(question: question, index: idx, option: opt)
                            }
                        }
                    }
                    .padding(DarwinSpacing.md)
                }
            }
        }
        .background(AppBackground())
    }

    @ViewBuilder
    private func adaptiveOptionButton(question: ExamQuestion, index: Int, option: QuestionOption) -> some View {
        Button {
            Haptics.impact(.light)
            Task { await viewModel.answer(index) }
        } label: {
            HStack(alignment: .top, spacing: DarwinSpacing.sm) {
                Text(option.letter)
                    .font(.subheadline.weight(.semibold))
                    .frame(width: 28, height: 28)
                    .foregroundStyle(.secondary)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(Color.secondary.opacity(0.3), lineWidth: 1.5))
                Text(option.text)
                    .font(.subheadline).foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(DarwinSpacing.sm)
            .clipShape(RoundedRectangle(cornerRadius: DarwinRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: DarwinRadius.md, style: .continuous)
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }

    private func areaLabel(_ area: String) -> String {
        switch area {
        case "clinica_medica": return "Clínica Médica"
        case "cirurgia": return "Cirurgia"
        case "ginecologia_obstetricia": return "GO"
        case "pediatria": return "Pediatria"
        case "saude_coletiva": return "Saúde Coletiva"
        default: return area.capitalized
        }
    }

    // MARK: - Results

    private var resultsView: some View {
        ScrollView {
            VStack(spacing: DarwinSpacing.lg) {
                // Score card
                DarwinCard {
                    VStack(spacing: DarwinSpacing.md) {
                        Text("Resultado")
                            .font(.title2.bold())

                        HStack(spacing: DarwinSpacing.xl) {
                            statColumn(
                                value: "\(viewModel.correctCount)/\(viewModel.itemsAnswered)",
                                label: "Acertos",
                                color: DarwinColor.accent
                            )
                            let pct = viewModel.itemsAnswered > 0
                                ? Double(viewModel.correctCount) / Double(viewModel.itemsAnswered) * 100 : 0
                            statColumn(
                                value: "\(Int(pct))%",
                                label: "Aproveitamento",
                                color: pct >= 60 ? DarwinColor.accent : .red
                            )
                            statColumn(
                                value: "\(viewModel.itemsAnswered - viewModel.correctCount)",
                                label: "Erros",
                                color: .red
                            )
                        }

                        let pct = viewModel.itemsAnswered > 0
                            ? Double(viewModel.correctCount) / Double(viewModel.itemsAnswered) * 100 : 0
                        Label(
                            pct >= 60 ? "Acima da média" : "Abaixo da média",
                            systemImage: pct >= 60 ? "checkmark.seal.fill" : "exclamationmark.circle"
                        )
                        .foregroundStyle(pct >= 60 ? DarwinColor.accent : .red)
                        .font(.subheadline.weight(.semibold))
                    }
                }

                // CDM note
                DarwinCard {
                    HStack(alignment: .top, spacing: DarwinSpacing.sm) {
                        Image(systemName: "brain").foregroundStyle(DarwinColor.accent)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Perfil CDM atualizado")
                                .font(.subheadline.weight(.semibold))
                            Text("Acesse Desempenho → CDM para ver a reclassificação de seus atributos cognitivos.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                Button("Nova sessão") {
                    viewModel.phase = .setup
                }
                .buttonStyle(.bordered)
                .tint(DarwinColor.accent)
            }
            .padding(DarwinSpacing.md)
        }
        .background(AppBackground())
    }

    private func statColumn(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title.bold()).foregroundStyle(color)
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
    }
}
