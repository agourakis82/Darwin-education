'use client'

import { useState } from 'react'
import { Calendar, Globe } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardGlobal } from './LeaderboardGlobal'
import { LeaderboardWeekly } from './LeaderboardWeekly'

type LeaderboardTab = 'global' | 'weekly'

export function LeaderboardTabs() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('weekly')

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeaderboardTab)}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="weekly" className="inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Semanal
        </TabsTrigger>
        <TabsTrigger value="global" className="inline-flex items-center gap-1.5">
          <Globe className="w-4 h-4" /> Global
        </TabsTrigger>
      </TabsList>

      <TabsContent value="weekly" className="mt-6">
        <LeaderboardWeekly />
      </TabsContent>

      <TabsContent value="global" className="mt-6">
        <LeaderboardGlobal />
      </TabsContent>
    </Tabs>
  )
}
