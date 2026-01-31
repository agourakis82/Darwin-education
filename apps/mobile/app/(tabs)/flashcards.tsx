import { View, Text, ScrollView, TouchableOpacity } from 'react-native'

export default function FlashcardsScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#020617' }}
      contentContainerStyle={{ padding: 20 }}
    >
      <Text style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>
        Seus baralhos de revisão espaçada
      </Text>

      {/* Empty State */}
      <View
        style={{
          backgroundColor: '#0f172a',
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#1e293b',
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🃏</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 }}>
          Nenhum baralho ainda
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
          Crie seu primeiro baralho de flashcards para começar a revisar com o método SM-2
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{
            backgroundColor: '#10b981',
            borderRadius: 10,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
            Criar Baralho
          </Text>
        </TouchableOpacity>
      </View>

      {/* Study Stats */}
      <View style={{ marginTop: 32 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 12 }}>
          Estatísticas de Revisão
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <StatCard label="Aprendendo" value="0" color="#f59e0b" />
          <StatCard label="Revisando" value="0" color="#3b82f6" />
          <StatCard label="Maduras" value="0" color="#10b981" />
        </View>
      </View>
    </ScrollView>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1e293b',
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{label}</Text>
    </View>
  )
}
