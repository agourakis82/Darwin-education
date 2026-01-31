import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#64748b',
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#e2e8f0',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="simulado"
        options={{
          title: 'Simulado',
          tabBarIcon: ({ color, size }) => <TabIcon name="exam" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: 'Flashcards',
          tabBarIcon: ({ color, size }) => <TabIcon name="cards" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="desempenho"
        options={{
          title: 'Desempenho',
          tabBarIcon: ({ color, size }) => <TabIcon name="chart" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}

/**
 * Simple text-based icon placeholder.
 * Replace with @expo/vector-icons or a custom icon set in production.
 */
function TabIcon({
  name,
  color,
  size,
}: {
  name: 'home' | 'exam' | 'cards' | 'chart'
  color: string
  size: number
}) {
  const icons: Record<string, string> = {
    home: '🏠',
    exam: '📋',
    cards: '🃏',
    chart: '📊',
  }

  return (
    <_Text style={{ fontSize: size - 4, color, textAlign: 'center' }}>
      {icons[name] ?? '•'}
    </_Text>
  )
}

// Inline minimal Text to avoid importing react-native at top level for tree-shaking
import { Text as _Text } from 'react-native'
