'use client'

import Link from 'next/link'
import { AppShell } from '@/components/evalforge/app-shell'
import { useEvaluations } from '@/hooks/use-evalforge-storage'
import { History, Play, Loader2, Clock, Zap, CheckCircle, XCircle } from 'lucide-react'

export default function HistoryPage() {
  const { evaluations, isLoaded } = useEvaluations()

  if (!isLoaded) {
    return (
      <AppShell title="Evaluation History" description="View past evaluation runs">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      default:
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'failed':
        return 'Failed'
      case 'running':
        return 'Running'
      default:
        return 'Pending'
    }
  }

  if (evaluations.length === 0) {
    return (
      <AppShell title="Evaluation History" description="View past evaluation runs">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 px-6 py-20 text-center">
          {/* Empty State Illustration */}
          <div className="relative mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
              <History className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
          </div>

          <h3 className="mb-2 text-xl font-semibold text-foreground">
            No evaluations run yet
          </h3>
          <p className="mb-8 max-w-md text-muted-foreground">
            Configure and run your first evaluation from the Home page. Your evaluation history 
            will appear here once you start running tests.
          </p>

          {/* Stats Preview */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-secondary/30 px-6 py-4">
              <p className="font-mono text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Total Runs</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 px-6 py-4">
              <p className="font-mono text-2xl font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 px-6 py-4">
              <p className="font-mono text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Models Tested</p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            Run First Evaluation
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Evaluation History" description="View past evaluation runs">
      <div className="space-y-4">
        {evaluations
          .slice()
          .reverse()
          .map((evaluation) => (
          <div
            key={evaluation.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {evaluation.datasetName}
                    </h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {evaluation.model}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Prompt: {evaluation.promptName} • Type: {evaluation.evaluationType}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  {getStatusIcon(evaluation.status)}
                  <span className="text-sm font-medium text-foreground">
                    {getStatusLabel(evaluation.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(evaluation.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
