export const AREA_COLORS: Record<string, {
  bg: string; text: string; ring: string; border: string; badge: string;
  solid: string; hex: string;
}> = {
  clinica_medica:          { bg: 'bg-blue-500/10',    text: 'text-blue-400',    ring: 'ring-blue-500/30',    border: 'border-blue-500/30',    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',    solid: 'bg-blue-500',    hex: '#3B82F6' },
  cirurgia:                { bg: 'bg-red-500/10',     text: 'text-red-400',     ring: 'ring-red-500/30',     border: 'border-red-500/30',     badge: 'bg-red-500/20 text-red-400 border-red-500/30',     solid: 'bg-red-500',     hex: '#EF4444' },
  ginecologia_obstetricia: { bg: 'bg-pink-500/10',    text: 'text-pink-400',    ring: 'ring-pink-500/30',    border: 'border-pink-500/30',    badge: 'bg-pink-500/20 text-pink-400 border-pink-500/30',    solid: 'bg-pink-500',    hex: '#EC4899' },
  pediatria:               { bg: 'bg-amber-500/10',   text: 'text-amber-400',   ring: 'ring-amber-500/30',   border: 'border-amber-500/30',   badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',   solid: 'bg-amber-500',   hex: '#F59E0B' },
  saude_coletiva:          { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', solid: 'bg-emerald-500', hex: '#10B981' },
}

export const AREA_LABELS: Record<string, string> = {
  clinica_medica:          'Clínica Médica',
  cirurgia:                'Cirurgia',
  ginecologia_obstetricia: 'Ginecologia e Obstetrícia',
  pediatria:               'Pediatria',
  saude_coletiva:          'Saúde Coletiva',
}
