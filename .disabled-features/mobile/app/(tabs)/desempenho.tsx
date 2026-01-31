import { View, Text, ScrollView } from 'react-native'

const AREAS = [
  { label: 'Clínica Médica', pct: 0, color: '#3b82f6' },
  { label: 'Cirurgia', pct: 0, color: '#ef4444' },
  { label: 'Ginecologia e Obstetrícia', pct: 0, color: '#ec4899' },
  { label: 'Pediatria', pct: 0, color: '#22c55e' },
  { label: 'Saúde Coletiva', pct: 0, color: '#a855f7' },
]

export default function DesempenhoScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#020617' }}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Score Card */}
      <View
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 24,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#1e293b',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Pontuação TRI</Text>
        <Text style={{ fontSize: 48, fontWeight: '700', color: '#10b981' }}>—</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
          Faça um simulado para ver sua pontuação
        </Text>
      </View>

      {/* Area Performance */}
      <Text style={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 }}>
        Desempenho por Área
      </Text>
      <View style={{ gap: 10, marginBottom: 24 }}>
        {AREAS.map((area) => (
          <View
            key={area.label}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: '#e2e8f0' }}>{area.label}</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: area.color }}>
                {area.pct}%
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: '#1e293b',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.max(area.pct, 2)}%`,
                  backgroundColor: area.color,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        ))}
      </View>

      {/* Pass Prediction */}
      <View
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: '#1e293b',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 8 }}>
          Previsão de Aprovação
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b' }}>
          Complete simulados para receber uma previsão baseada em TRI
        </Text>
      </View>
    </ScrollView>
  )
}
