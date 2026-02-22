'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCATStore } from '@/lib/stores/catStore';
import type { ENAMEDArea } from '@darwin-education/shared';
import { DEFAULT_CAT_CONFIG } from '@darwin-education/shared';

const ALL_AREAS: ENAMEDArea[] = [
  'clinica_medica',
  'cirurgia',
  'ginecologia_obstetricia',
  'pediatria',
  'saude_coletiva',
];

interface ValidationErrors {
  minItems?: string;
  maxItems?: string;
}

export interface UseAdaptiveSetupReturn {
  // State
  selectedAreas: ENAMEDArea[];
  minItemsInput: string;
  maxItemsInput: string;
  loading: boolean;
  error: string | null;
  validationErrors: ValidationErrors;
  isValid: boolean;
  
  // Actions
  toggleArea: (area: ENAMEDArea) => void;
  setMinItemsInput: (value: string) => void;
  setMaxItemsInput: (value: string) => void;
  handleMinBlur: () => void;
  handleMaxBlur: () => void;
  handleStart: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for managing adaptive exam setup state and logic.
 * Separates business logic from UI presentation.
 */
export function useAdaptiveSetup(): UseAdaptiveSetupReturn {
  const router = useRouter();
  const { startCAT } = useCATStore();

  const [selectedAreas, setSelectedAreas] = useState<ENAMEDArea[]>([...ALL_AREAS]);
  const [minItemsInput, setMinItemsInput] = useState(DEFAULT_CAT_CONFIG.minItems.toString());
  const [maxItemsInput, setMaxItemsInput] = useState(DEFAULT_CAT_CONFIG.maxItems.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  /**
   * Validate inputs and return whether they are valid
   */
  const validateInputs = useCallback((): boolean => {
    const min = parseInt(minItemsInput, 10);
    const max = parseInt(maxItemsInput, 10);
    const errors: ValidationErrors = {};

    if (isNaN(min) || min < DEFAULT_CAT_CONFIG.minItems) {
      errors.minItems = `Mínimo de ${DEFAULT_CAT_CONFIG.minItems} questões`;
    }
    if (isNaN(max) || max > DEFAULT_CAT_CONFIG.maxItems) {
      errors.maxItems = `Máximo de ${DEFAULT_CAT_CONFIG.maxItems} questões`;
    }
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.minItems = 'Mínimo deve ser menor ou igual ao máximo';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [minItemsInput, maxItemsInput]);

  // Validate on input changes
  useEffect(() => {
    validateInputs();
  }, [validateInputs]);

  const isValid = Object.keys(validationErrors).length === 0;

  const toggleArea = useCallback((area: ENAMEDArea) => {
    setSelectedAreas((prev) => {
      if (prev.includes(area)) {
        // Prevent deselecting all areas
        if (prev.length === 1) return prev;
        return prev.filter((a) => a !== area);
      }
      return [...prev, area];
    });
  }, []);

  const handleMinBlur = useCallback(() => {
    let val = parseInt(minItemsInput, 10);
    if (isNaN(val)) val = DEFAULT_CAT_CONFIG.minItems;
    const maxVal = parseInt(maxItemsInput, 10) || DEFAULT_CAT_CONFIG.maxItems;
    val = Math.max(DEFAULT_CAT_CONFIG.minItems, Math.min(val, maxVal));
    setMinItemsInput(val.toString());
  }, [minItemsInput, maxItemsInput]);

  const handleMaxBlur = useCallback(() => {
    let val = parseInt(maxItemsInput, 10);
    if (isNaN(val)) val = DEFAULT_CAT_CONFIG.maxItems;
    const minVal = parseInt(minItemsInput, 10) || DEFAULT_CAT_CONFIG.minItems;
    val = Math.max(minVal, Math.min(val, DEFAULT_CAT_CONFIG.maxItems));
    setMaxItemsInput(val.toString());
  }, [maxItemsInput, minItemsInput]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleStart = useCallback(async () => {
    if (!validateInputs()) {
      setError('Por favor, corrija os erros de validação');
      return;
    }

    setLoading(true);
    setError(null);

    // Generate idempotency key for this attempt
    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await fetch('/api/cat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areas: selectedAreas,
          minItems: parseInt(minItemsInput, 10),
          maxItems: parseInt(maxItemsInput, 10),
          idempotencyKey,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao iniciar o simulado adaptativo');
      }

      const data = await response.json();

      startCAT({
        examId: data.examId,
        attemptId: data.attemptId,
        sessionId: data.sessionId,
        config: data.config,
        firstQuestion: data.question,
      });

      router.push(`/simulado/adaptive/${data.examId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar o simulado adaptativo');
    } finally {
      setLoading(false);
    }
  }, [selectedAreas, minItemsInput, maxItemsInput, router, startCAT, validateInputs]);

  return {
    selectedAreas,
    minItemsInput,
    maxItemsInput,
    loading,
    error,
    validationErrors,
    isValid,
    toggleArea,
    setMinItemsInput,
    setMaxItemsInput,
    handleMinBlur,
    handleMaxBlur,
    handleStart,
    clearError,
  };
}
