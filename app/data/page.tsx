'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/evalforge/app-shell'
import { Loader2 } from 'lucide-react'




export default function DataPage() {
  const [datasets, setDatasets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null)
  useEffect(() => {
    async function fetchDatasets() {
      setLoading(true)
      try {
        const indexRes = await fetch('/data/dataset/index.json')
        const index = await indexRes.json()
        const loaded = await Promise.all(index.map(async (entry: any) => {
          const fileRes = await fetch(`/${entry.filePath}`)
          const records = await fileRes.json()
          return { ...entry, records }
        }))
        setDatasets(loaded)
      } catch (e) {
        setDatasets([])
      } finally {
        setLoading(false)
      }
    }
    fetchDatasets()
  }, [])

  if (loading) {
    return (
      <AppShell title="Data" description="Manage your evaluation datasets">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Data" description="Manage your evaluation datasets">
      {datasets.length > 0 ? (
        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="flex items-center justify-between p-5">
                <div className="flex flex-1 items-center gap-4 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    {/* icon placeholder */}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{dataset.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {dataset.recordCount} records • Uploaded {new Date(dataset.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedDataset(expandedDataset === dataset.id ? null : dataset.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {expandedDataset === dataset.id ? 'Hide' : 'Show'}
                </button>
              </div>
              {expandedDataset === dataset.id && (
                <div className="border-t border-border bg-secondary/20 p-5">
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    Preview (up to 10 rows)
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <div className="overflow-x-auto">
                      {(() => {
                        const allKeys = Array.from(new Set(dataset.records.flatMap((r: any) => Object.keys(r))));
                        return (
                          <table className="min-w-max">
                            <thead>
                              <tr className="border-b border-border bg-secondary/50">
                                {allKeys.map((key) => (
                                  <th
                                    key={key}
                                    className="px-4 py-2.5 text-left font-mono text-xs font-medium text-muted-foreground whitespace-nowrap"
                                  >
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dataset.records.slice(0, 10).map((record: any, i: number) => (
                                <tr key={i} className="border-b border-border last:border-0">
                                  {allKeys.map((key, j) => (
                                    <td
                                      key={j}
                                      className="px-4 py-2.5 font-mono text-xs text-foreground whitespace-nowrap max-w-[200px]"
                                    >
                                      <span className="line-clamp-2">
                                        {typeof record[key] === 'object' && record[key] !== null
                                          ? JSON.stringify(record[key])
                                          : record[key] !== undefined
                                            ? String(record[key])
                                            : ''}
                                      </span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No datasets found in public/data/dataset.
        </div>
      )}
    </AppShell>
  );
}
