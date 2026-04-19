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
          <div className="mb-4 flex gap-4">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="rounded-lg border border-border bg-input px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {PROVIDERS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder="Enter API key"
              className="flex-1 rounded-lg border border-border bg-input px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSave}
              disabled={loading || !keyInput}
              className={cn("rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium transition-colors hover:bg-primary/90", loading && "opacity-60 cursor-not-allowed")}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
          {error && <div className="text-destructive text-sm mb-2">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-2">Saved!</div>}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Saved API Keys</h2>
          <ul className="space-y-2">
            {Object.entries(apiKeys).length === 0 && <li className="text-muted-foreground text-sm">No API keys saved.</li>}
            {Object.entries(apiKeys).map(([provider, key]) => (
              <li key={provider} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{provider}:</span>
                <span className="font-mono bg-muted px-2 py-1 rounded">{key.slice(0, 6)}...{key.slice(-4)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  )
}