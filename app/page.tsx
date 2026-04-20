
'use client'
import { useCallback, useEffect, useState } from 'react'
import { AppShell } from '@/components/evalforge/app-shell'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HomePage() {

  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDataset, setSelectedDataset] = useState('')
  const [selectedDatasetFile, setSelectedDatasetFile] = useState('')
  const [evaluationType, setEvaluationType] = useState('math-metric')
  const [columns, setColumns] = useState<string[]>([])
  const [questionCol, setQuestionCol] = useState('')
  const [groundedCol, setGroundedCol] = useState('')
  const [modelCol, setModelCol] = useState('')

  const EVALUATION_TYPES = [
    { value: 'metric-free', label: 'Metric (free)', description: 'Custom or free-form metric evaluation' },
  ]

  // Fetch datasets list
  useEffect(() => {
    async function fetchDatasets() {
      setLoading(true)
      try {
        const indexRes = await fetch('/data/dataset/index.json')
        const index = await indexRes.json()
        setDatasets(index)
        // Hardcode default dataset selection to 'Agribench Task (20 records)' if present, and only if not already set
        if (!selectedDataset && !selectedDatasetFile) {
          const agribench = index.find((d: any) => d.name === 'Agribench Task' && d.recordCount === 20)
          if (agribench) {
            setSelectedDataset(agribench.id)
            setSelectedDatasetFile(agribench.fileName)
          } else if (index && index.length > 0) {
            setSelectedDataset(index[0].id)
            setSelectedDatasetFile(index[0].fileName)
          }
        }
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
      if (!selectedDatasetFile) {
        setColumns([])
        setQuestionCol('')
        setGroundedCol('')
        setModelCol('')
        return
      }
      try {
        const res = await fetch(`/data/dataset/${selectedDatasetFile}`)
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const keys = Object.keys(data[0])
          setColumns(keys)
          // Hardcode default selection to 'question', 'answer', 'model_answer'
          setQuestionCol('question')
          setGroundedCol('answer')
          setModelCol('model_answer')
        } else {
          setColumns([])
        }
      } catch {
        setColumns([])
      }
    }
    fetchColumns()
  }, [selectedDatasetFile])


  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [resultPreview, setResultPreview] = useState<any[] | null>(null)
  const [showTable, setShowTable] = useState(false)

  // Store loaded dataset records
  const [datasetRecords, setDatasetRecords] = useState<any[]>([])

  // Fetch records when dataset file changes
  useEffect(() => {
    async function fetchRecords() {
      if (!selectedDatasetFile) {
        setDatasetRecords([])
        return
      }
      try {
        const res = await fetch(`/data/dataset/${selectedDatasetFile}`)
        const data = await res.json()
        if (Array.isArray(data)) setDatasetRecords(data)
        else setDatasetRecords([])
      } catch {
        setDatasetRecords([])
      }
    }
    fetchRecords()
  }, [selectedDatasetFile])

  const handleContinue = async () => {
    setSending(true)
    setSendError(null)
    setSendSuccess(false)
    setResultPreview(null)
    try {
      // Prepare payload
      const payload = datasetRecords.map((row) => ({
        question: row[questionCol],
        model_answer: row[modelCol],
        grounded_answer: row[groundedCol],
      }))
      const res = await fetch('https://retrorsely-uncondensational-bentlee.ngrok-free.dev/metric_evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: payload }),
      })
      if (!res.ok) throw new Error('Failed to send data')
      const result = await res.json()
      // Assume result.results is the array
      setResultPreview(Array.isArray(result.results) ? result.results : [])
      setSendSuccess(true)
    } catch (e: any) {
      setSendError(e.message || 'Failed to send data')
    } finally {
      setSending(false)
    }
  }

  function downloadCSV() {
    if (!resultPreview || resultPreview.length === 0) return
    const keys = Object.keys(resultPreview[0])
    const csvRows = [keys.join(',')]
    for (const row of resultPreview) {
      csvRows.push(keys.map(k => '"' + String(row[k]).replace(/"/g, '""') + '"').join(','))
    }
    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'metric_evaluation_results.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell title="Evaluation Setup" description="Select dataset and evaluation type">
      <div className="max-w-xl mx-auto mt-16 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-2">Dataset</h2>
          <select
            value={selectedDataset}
            onChange={e => {
              const id = e.target.value;
              setSelectedDataset(id);
              const ds = datasets.find((d) => d.id === id);
              setSelectedDatasetFile(ds ? ds.fileName : '');
            }}
            className="w-full rounded-lg border border-border bg-input px-4 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a dataset...</option>
            {datasets.map((dataset: any) => (
              <option key={dataset.id} value={dataset.id}>{dataset.name} ({dataset.recordCount} records)</option>
            ))}
          </select>
        </div>

        {columns.length > 0 && (
          <>
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
          </>
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
            disabled={!selectedDataset || !questionCol || !modelCol || !groundedCol || sending}
            onClick={handleContinue}
            className={cn(
              'w-full rounded-xl px-8 py-4 font-semibold transition-all',
              selectedDataset && questionCol && modelCol && groundedCol && !sending
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {sending ? 'Sending...' : 'Continue'}
          </button>
          {sendError && <div className="mt-2 text-sm text-destructive">{sendError}</div>}
          {resultPreview && resultPreview.length > 0 && (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowTable((v) => !v)}
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90"
                >
                  {showTable ? 'Hide Preview' : 'Preview'}
                </button>
                <button
                  onClick={downloadCSV}
                  className="rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90"
                >
                  Download CSV
                </button>
              </div>
              {showTable && (
                <div className="overflow-x-auto overflow-y-auto border rounded bg-muted/30 max-h-96">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        {Object.keys(resultPreview[0]).map((k) => (
                          <th key={k} className="px-2 py-1 font-bold text-left border-b">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultPreview.map((row, i) => (
                        <tr key={i} className="border-b last:border-b-0">
                          {Object.keys(resultPreview[0]).map((k) => (
                            <td key={k} className="px-2 py-1 whitespace-pre-line">{String(row[k])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
