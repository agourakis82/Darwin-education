import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#e2e8f0',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#020617' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="simulado/[examId]"
          options={{ title: 'Simulado', presentation: 'card' }}
        />
        <Stack.Screen
          name="flashcards/[deckId]"
          options={{ title: 'Flashcards', presentation: 'card' }}
        />
      </Stack>
    </>
  )
}
