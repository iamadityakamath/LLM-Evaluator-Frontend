export interface Prompt {
  id: string
  name: string
  text: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Dataset {
  id: string
  name: string
  records: Record<string, unknown>[]
  recordCount: number
  uploadedAt: string
}

export interface EvaluationEntry {
  id: string
  timestamp: string
  datasetId: string
  datasetName: string
  model: string
  promptId: string
  promptName: string
  evaluationType: EvaluationType
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export type EvaluationType = 'accuracy' | 'relevance' | 'hallucination' | 'custom'

export const MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet', provider: 'Anthropic' },
  { value: 'claude-haiku', label: 'Claude Haiku', provider: 'Anthropic' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'Google' },
  { value: 'custom', label: 'Custom', provider: 'Custom' },
] as const

export const EVALUATION_TYPES: { value: EvaluationType; label: string; description: string }[] = [
  { value: 'accuracy', label: 'Accuracy', description: 'Measure correctness of responses' },
  { value: 'relevance', label: 'Relevance', description: 'Assess response relevance to input' },
  { value: 'hallucination', label: 'Hallucination Detection', description: 'Identify factual inaccuracies' },
  { value: 'custom', label: 'Custom Rubric', description: 'Use a custom evaluation rubric' },
]

export const STORAGE_KEYS = {
  PROMPTS: 'evalforge_prompts',
  DATASETS: 'evalforge_datasets',
  API_KEY: 'evalforge_api_key',
  EVALUATIONS: 'evalforge_evaluations',
} as const
