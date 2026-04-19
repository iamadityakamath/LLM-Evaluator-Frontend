"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/evalforge/app-shell"
import { cn } from "@/lib/utils"

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "custom", label: "Custom" },
]

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].value)
  const [keyInput, setKeyInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch("/api/apikeys")
      .then((res) => res.json())
      .then((data) => setApiKeys(data.keys || {}))
  }, [])

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, key: keyInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save API key.")
      setApiKeys(data.keys)
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(false), 2000)
      return () => clearTimeout(t)
    }
  }, [success])

  return (
    <AppShell title="API Keys" description="Manage your model provider API keys securely on this device.">
      <div className="max-w-xl mx-auto mt-10 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Add or Update API Key</h2>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Provider</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-foreground">API Key</label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter API key..."
              className="w-full rounded-lg border border-border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !keyInput.trim()}
            className={cn(
              "w-full rounded-lg px-4 py-3 font-medium transition-colors",
              keyInput.trim() && !loading
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-secondary text-muted-foreground"
            )}
          >
            {loading ? "Saving..." : "Save API Key"}
          </button>
          {error && <div className="mt-4 text-sm text-destructive">{error}</div>}
          {success && <div className="mt-4 text-sm text-green-600">Saved!</div>}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Saved API Keys</h2>
          <ul className="space-y-2">
            {PROVIDERS.map((p) => (
              <li key={p.value} className="flex items-center justify-between">
                <span className="font-medium text-foreground">{p.label}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {apiKeys[p.value] ? "••••••••••" : <span className="italic">Not set</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}
