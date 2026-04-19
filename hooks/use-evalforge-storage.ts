
'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Prompt, 
  Dataset, 
  EvaluationEntry, 
  STORAGE_KEYS 
} from '@/lib/evalforge-types'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
    }
    setIsLoaded(true)
  }, [key])

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue, isLoaded] as const
}

export function usePrompts() {
  const [prompts, setPrompts, isLoaded] = useLocalStorage<Prompt[]>(STORAGE_KEYS.PROMPTS, [])

  const addPrompt = useCallback((prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPrompt: Prompt = {
      ...prompt,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPrompts(prev => [...prev, newPrompt])
    return newPrompt
  }, [setPrompts])

  const updatePrompt = useCallback((id: string, updates: Partial<Omit<Prompt, 'id' | 'createdAt'>>) => {
    setPrompts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    ))
  }, [setPrompts])

  const deletePrompt = useCallback((id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id))
  }, [setPrompts])

  return { prompts, addPrompt, updatePrompt, deletePrompt, isLoaded }
}

export function useDatasets() {
  const [datasets, setDatasets, isLoaded] = useLocalStorage<Dataset[]>(STORAGE_KEYS.DATASETS, [])

  const addDataset = useCallback((name: string, records: Record<string, unknown>[]) => {
    const newDataset: Dataset = {
      id: crypto.randomUUID(),
      name,
      records,
      recordCount: records.length,
      uploadedAt: new Date().toISOString(),
    }
    setDatasets(prev => [...prev, newDataset])
    return newDataset
  }, [setDatasets])

  const deleteDataset = useCallback((id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id))
  }, [setDatasets])

  return { datasets, addDataset, deleteDataset, isLoaded }
}

export function useApiKey() {
  const [apiKey, setApiKey, isLoaded] = useLocalStorage<string>(STORAGE_KEYS.API_KEY, '')
  return { apiKey, setApiKey, isLoaded }
}

export function useEvaluations() {
  const [evaluations, setEvaluations, isLoaded] = useLocalStorage<EvaluationEntry[]>(STORAGE_KEYS.EVALUATIONS, [])

  const addEvaluation = useCallback((evaluation: Omit<EvaluationEntry, 'id' | 'timestamp'>) => {
    const newEvaluation: EvaluationEntry = {
      ...evaluation,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    setEvaluations(prev => [...prev, newEvaluation])
    return newEvaluation
  }, [setEvaluations])

  return { evaluations, addEvaluation, isLoaded }
}
