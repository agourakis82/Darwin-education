import { View, Text, ScrollView, TouchableOpacity } from 'react-native'

const EXAM_TYPES = [
  { id: 'full', label: 'Simulado Completo', questions: 100, time: '5h', difficulty: 'Misto' },
  { id: 'quick', label: 'Simulado Rápido', questions: 25, time: '1h15', difficulty: 'Médio' },
  { id: 'area', label: 'Por Área', questions: 20, time: '1h', difficulty: 'Variável' },
]

export default function SimuladoScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#020617' }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
        Selecione o tipo de simulado para começar
      </Text>

      <View style={{ gap: 12 }}>
        {EXAM_TYPES.map((exam) => (
          <TouchableOpacity
            key={exam.id}
            activeOpacity={0.7}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>
              {exam.label}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Tag label={`${exam.questions} questões`} />
              <Tag label={exam.time} />
              <Tag label={exam.difficulty} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Attempts */}
      <View style={{ marginTop: 32 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 }}>
          Histórico Recente
        </Text>
        <View
          style={{
            backgroundColor: '#0f172a',
            borderRadius: 12,
            padding: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#1e293b',
          }}
        >
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Nenhum simulado realizado ainda
          </Text>
        </View>
      </View>
    </ScrollView>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: '#1e293b',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 12, color: '#94a3b8' }}>{label}</Text>
    </View>
  )
}
