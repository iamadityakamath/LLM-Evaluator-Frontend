'use client'

import { useState } from 'react'
import { AppShell } from '@/components/evalforge/app-shell'
import { EmptyState } from '@/components/evalforge/empty-state'
import { usePrompts } from '@/hooks/use-evalforge-storage'
import { Prompt } from '@/lib/evalforge-types'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  FileText, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Loader2
} from 'lucide-react'

interface PromptFormData {
  name: string
  text: string
  tags: string
}

const initialFormData: PromptFormData = {
  name: '',
  text: '',
  tags: '',
}

export default function PromptsPage() {
  const { prompts, addPrompt, updatePrompt, deletePrompt, isLoaded } = usePrompts()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<PromptFormData>(initialFormData)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const persistPromptToLocalFile = async (
    name: string,
    text: string,
    tags: string[],
    source: 'create' | 'update'
  ) => {
    const response = await fetch('/api/prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, text, tags, source }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to save prompt file.' }))
      throw new Error(errorData.error || 'Failed to save prompt file.')
    }
  }

  const handleOpenForm = (prompt?: Prompt) => {
    if (prompt) {
      setEditingId(prompt.id)
      setFormData({
        name: prompt.name,
        text: prompt.text,
        tags: prompt.tags.join(', '),
      })
    } else {
      setEditingId(null)
      setFormData(initialFormData)
    }
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData(initialFormData)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.text.trim()) return

    setSaveError(null)
    setIsSaving(true)

    const tags = formData.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    const name = formData.name.trim()
    const text = formData.text.trim()

    try {
      await persistPromptToLocalFile(name, text, tags, editingId ? 'update' : 'create')

      if (editingId) {
        updatePrompt(editingId, {
          name,
          text,
          tags,
        })
      } else {
        addPrompt({
          name,
          text,
          tags,
        })
      }

      handleCloseForm()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save prompt file.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    deletePrompt(id)
    setDeleteConfirmId(null)
  }

  if (!isLoaded) {
    return (
      <AppShell title="Prompts" description="Manage your evaluation prompts">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Prompts" description="Manage your evaluation prompts">
      {/* Add Button */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Prompt
        </button>
      </div>

      {saveError && (
        <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Form Modal/Panel */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                {editingId ? 'Edit Prompt' : 'New Prompt'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Prompt Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Accuracy Evaluation v1"
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Prompt Text
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter your evaluation prompt here..."
                  rows={8}
                  className="w-full resize-none rounded-lg border border-border bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Tags <span className="text-muted-foreground">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., accuracy, v1, production"
                  className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseForm}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.text.trim() || isSaving}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
                  formData.name.trim() && formData.text.trim() && !isSaving
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'cursor-not-allowed bg-secondary text-muted-foreground'
                )}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Prompt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prompts Grid */}
      {prompts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-foreground line-clamp-1">{prompt.name}</h3>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => handleOpenForm(prompt)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {deleteConfirmId === prompt.id ? (
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(prompt.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="mb-4 font-mono text-xs text-muted-foreground line-clamp-3">
                {prompt.text}
              </p>

              {prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {prompt.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No prompts yet"
          description="Create your first evaluation prompt to get started. Prompts define how your models will be evaluated."
          action={
            <button
              onClick={() => handleOpenForm()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create First Prompt
            </button>
          }
        />
      )}
    </AppShell>
  )
}
