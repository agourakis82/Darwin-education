import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

const FEATURES = [
  {
    title: 'Simulado ENAMED',
    description: 'Provas com correção TRI',
    route: '/(tabs)/simulado' as const,
    emoji: '📋',
  },
  {
    title: 'Flashcards',
    description: 'Revisão espaçada SM-2',
    route: '/(tabs)/flashcards' as const,
    emoji: '🃏',
  },
  {
    title: 'Desempenho',
    description: 'Análise de resultados',
    route: '/(tabs)/desempenho' as const,
    emoji: '📊',
  },
]

export default function HomeScreen() {
  const router = useRouter()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#020617' }}
      contentContainerStyle={{ padding: 20 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 }}>
          Darwin{' '}
          <Text style={{ color: '#10b981' }}>Education</Text>
        </Text>
        <Text style={{ fontSize: 14, color: '#94a3b8' }}>
          Preparação inteligente para o ENAMED
        </Text>
      </View>

      {/* Feature Cards */}
      <View style={{ gap: 16 }}>
        {FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature.title}
            onPress={() => router.push(feature.route)}
            activeOpacity={0.7}
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: '#1e293b',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 32 }}>{feature.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 }}>
                  {feature.title}
                </Text>
                <Text style={{ fontSize: 13, color: '#94a3b8' }}>
                  {feature.description}
                </Text>
              </View>
              <Text style={{ color: '#475569', fontSize: 20 }}>›</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Placeholder */}
      <View
        style={{
          marginTop: 32,
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: '#1e293b',
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 }}>
          Seu Progresso
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <StatItem label="Simulados" value="—" />
          <StatItem label="Flashcards" value="—" />
          <StatItem label="Sequência" value="—" />
        </View>
      </View>
    </ScrollView>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#10b981' }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</Text>
    </View>
  )
}
