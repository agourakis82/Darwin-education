'use client';

import { memo, useCallback } from 'react';
import type { ENAMEDArea } from '@darwin-education/shared';
import { AREA_COLORS, AREA_LABELS } from '@/lib/area-colors';
import { EnamedAreaIcon } from '@/components/icons/EnamedAreaIcon';

const ALL_AREAS: ENAMEDArea[] = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
];

interface AreaSelectionGridProps {
  selectedAreas: ENAMEDArea[];
  onToggle: (area: ENAMEDArea) => void;
}

/**
 * Memoized grid component for selecting ENAMED areas.
 * Prevents unnecessary re-renders of all buttons when only one changes.
 */
export const AreaSelectionGrid = memo(function AreaSelectionGrid({
  selectedAreas,
  onToggle,
}: AreaSelectionGridProps) {
  const handleToggle = useCallback(
    (area: ENAMEDArea) => {
      onToggle(area);
    },
    [onToggle]
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" role="group" aria-label="Áreas do conhecimento">
      {ALL_AREAS.map((area) => {
        const isSelected = selectedAreas.includes(area);
        const colors = AREA_COLORS[area];

        return (
          <AreaButton
            key={area}
            area={area}
            isSelected={isSelected}
            colors={colors}
            onToggle={handleToggle}
          />
        );
      })}
    </div>
  );
});

interface AreaButtonProps {
  area: ENAMEDArea;
  isSelected: boolean;
  colors: { bg: string; text: string; border: string };
  onToggle: (area: ENAMEDArea) => void;
}

/**
 * Individual memoized area button.
 * Only re-renders when its own selection state changes.
 */
const AreaButton = memo(function AreaButton({
  area,
  isSelected,
  colors,
  onToggle,
}: AreaButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(area)}
      aria-pressed={isSelected}
      aria-label={`${AREA_LABELS[area]} ${isSelected ? 'selecionada' : 'não selecionada'}`}
      className={`darwin-focus-ring darwin-nav-link relative p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? `${colors.bg} ${colors.text} ${colors.border} border-current shadow-inner-shine`
          : 'bg-surface-2/50 border-separator hover:border-surface-4 text-label-secondary'
      }`}
    >
      {isSelected && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-current/20">
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </span>
      )}
      <div className="flex flex-col items-center text-center">
        <div className={`mb-2 ${isSelected ? '' : 'text-label-tertiary'}`}>
          <EnamedAreaIcon area={area} />
        </div>
        <span className="text-sm font-medium">{AREA_LABELS[area]}</span>
      </div>
    </button>
  );
});
