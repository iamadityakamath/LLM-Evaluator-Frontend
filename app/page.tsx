
'use client'
import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '@/components/evalforge/app-shell'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {

  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDataset, setSelectedDataset] = useState('')
  const [evaluationType, setEvaluationType] = useState('math-metric')
  const [columns, setColumns] = useState<string[]>([])
  const [questionCol, setQuestionCol] = useState('')
  const [groundedCol, setGroundedCol] = useState('')
  const [modelCol, setModelCol] = useState('')

  const EVALUATION_TYPES = [
    { value: 'math-metric', label: 'Math metric', description: 'Manual or quantitative math evaluation' },
    { value: 'semantic-match', label: 'Semantic Match', description: 'Check for semantic similarity' },
  ]

  // Fetch datasets list
  useEffect(() => {
    async function fetchDatasets() {
      setLoading(true)
      try {
        const indexRes = await fetch('/data/dataset/index.json')
        const index = await indexRes.json()
        setDatasets(index)
      } catch (e) {
        setDatasets([])
      } finally {
        setLoading(false)
      }
    }
    fetchDatasets()
  }, [])

  // Fetch columns when dataset changes
  useEffect(() => {
    async function fetchColumns() {
      if (!selectedDataset) {
        setColumns([])
        setQuestionCol('')
        setGroundedCol('')
        setModelCol('')
        return
      }
      try {
        const ds = datasets.find((d) => d.id === selectedDataset)
        if (!ds) return setColumns([])
        const res = await fetch(`/data/dataset/${selectedDataset}.json`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const keys = Object.keys(data[0])
          setColumns(keys)
          setQuestionCol(keys[0] || '')
          setGroundedCol(keys[1] || '')
          setModelCol(keys[2] || '')
        } else {
          setColumns([])
        }
      } catch {
        setColumns([])
      }
    }
    fetchColumns()
  }, [selectedDataset, datasets])

  if (loading) {
    return (
      <AppShell title="Evaluation Setup" description="Select dataset and evaluation type">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Evaluation Setup" description="Select dataset and evaluation type">
      <div className="max-w-xl mx-auto mt-16 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-2">Dataset</h2>
          <select
            value={selectedDataset}
            onChange={e => setSelectedDataset(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a dataset...</option>
            {datasets.map((dataset: any) => (
              <option key={dataset.id} value={dataset.id}>{dataset.name} ({dataset.recordCount} records)</option>
            ))}
          </select>
        </div>

        {columns.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <div>
              <label className="block mb-1 font-medium">Question column</label>
              <select
                value={questionCol}
                onChange={e => setQuestionCol(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-4 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Grounded answer column</label>
              <select
                value={groundedCol}
                onChange={e => setGroundedCol(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-4 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Model answer column</label>
              <select
                value={modelCol}
                onChange={e => setModelCol(e.target.value)}
                className="w-full rounded-lg border border-border bg-input px-4 py-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-2">Evaluation Type</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {EVALUATION_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setEvaluationType(type.value)}
                className={cn(
                  'rounded-lg border p-4 text-left transition-all',
                  evaluationType === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/30 hover:border-muted-foreground'
                )}
              >
                <p className={cn(
                  'font-medium',
                  evaluationType === type.value ? 'text-primary' : 'text-foreground'
                )}>{type.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{type.description}</p>
              </button>
            ))}
          </div>
        </div>
        <div>
          <button
            disabled={!selectedDataset}
            className={cn(
              'w-full rounded-xl px-8 py-4 font-semibold transition-all',
              selectedDataset ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            Continue
          </button>
        </div>
      </div>
    </AppShell>
  )
}
