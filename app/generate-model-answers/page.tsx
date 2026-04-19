
"use client"

import { useRef, useState, useEffect } from "react"
import { usePrompts } from "@/hooks/use-evalforge-storage"
import { AppShell } from "@/components/evalforge/app-shell"
import { cn } from "@/lib/utils"
import { Upload, FileJson, Save, X, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
const MODELS = [
  { value: 'openai', label: 'OpenAI', provider: 'OpenAI' },
  { value: 'groq', label: 'Groq', provider: 'Groq' },
]
interface ApiKeyOption {
  provider: string
  key: string
}

interface UploadPreview {
  records: Record<string, unknown>[]
  filename: string
}



export default function GenerateModelAnswersPage() {
  const { prompts, addPrompt, isLoaded: promptsLoaded } = usePrompts();
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [prompt, setPrompt] = useState("")
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [isAddingPrompt, setIsAddingPrompt] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedDataset, setSelectedDataset] = useState<string>("")
  const [datasetIndex, setDatasetIndex] = useState<any[]>([]);

  useEffect(() => {
    fetch('/data/dataset/index.json')
      .then(res => res.json())
      .then(data => setDatasetIndex(data))
      .catch(() => setDatasetIndex([]));
  }, []);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].value)

  // API key selection removed

  // Dropdowns for question and answer fields
  const [questionField, setQuestionField] = useState<string>("")
  const [answerField, setAnswerField] = useState<string>("")

  // Test result state (must be at top level)
  const [testResult, setTestResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Removed API key fetching effect

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const records = Array.isArray(data) ? data : [data]
      setUploadPreview({ records, filename: file.name.replace('.json', '') })
    } catch {
      setUploadError('Invalid JSON file. Please upload a valid JSON array.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCancelUpload = () => {
    setUploadPreview(null)
    setUploadError(null)
  }

  return (
    <AppShell title="Generate Model Answers" description="Input a prompt and upload questions with ground truth answers to generate model answers.">
      <div className="max-w-2xl mx-auto mt-10 space-y-8">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Model</h2>
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            className="w-full rounded-lg border border-border bg-input px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MODELS.map(model => (
              <option key={model.value} value={model.value}>{model.label} ({model.provider})</option>
            ))}
          </select>
        </div>
        {/* API Key section removed */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Select Questions & Ground Truth Answers</h2>
          <div className="flex gap-4 items-center mb-4">
            <select
              value={selectedDataset}
              onChange={async (e) => {
                const val = e.target.value;
                setSelectedDataset(val);
                setUploadError(null);
                if (val) {
                  try {
                    const res = await fetch(`/${val}`);
                    const data = await res.json();
                    const records = Array.isArray(data) ? data : [data];
                    setUploadPreview({ records, filename: val.split("/").pop()?.replace('.json', '') || "dataset" });
                  } catch {
                    setUploadError("Failed to load dataset.");
                  }
                } else {
                  setUploadPreview(null);
                }
              }}
              className="rounded-lg border border-border bg-input px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select from existing datasets</option>
              {datasetIndex.map((ds) => (
                <option key={ds.filePath} value={ds.filePath}>{ds.name} ({ds.recordCount} records)</option>
              ))}
            </select>
            <span className="text-muted-foreground text-xs">or</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Upload className="h-4 w-4" />
              Upload JSON
            </button>
          </div>
          {uploadError && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {uploadError}
            </div>
          )}
          {uploadPreview && (
            <>
              <div className="mt-6 rounded-lg border border-border bg-secondary/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">{uploadPreview.filename}.json</span>
                  </div>
                  <button onClick={handleCancelUpload} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-foreground mb-2">Preview (first 3 records):</p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        {Object.keys(uploadPreview.records[0] || {}).slice(0, 5).map((key) => (
                          <th key={key} className="px-4 py-2.5 text-left font-mono text-xs font-medium text-muted-foreground">{key}</th>
                        ))}
                        {Object.keys(uploadPreview.records[0] || {}).length > 5 && (
                          <th className="px-4 py-2.5 text-left font-mono text-xs font-medium text-muted-foreground">...</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadPreview.records.slice(0, 3).map((record, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {Object.values(record).slice(0, 5).map((value, j) => (
                            <td key={j} className="px-4 py-2.5 font-mono text-xs text-foreground">
                              <span className="line-clamp-1">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                            </td>
                          ))}
                          {Object.keys(record).length > 5 && (
                            <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">...</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Dropdowns for selecting question and answer fields */}
              <div className="flex gap-4 mt-6">
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium text-foreground">Question Field</label>
                  <select
                    value={questionField}
                    onChange={e => setQuestionField(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select field</option>
                    {Object.keys(uploadPreview.records[0] || {}).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block mb-1 text-sm font-medium text-foreground">Ground Truth Answer Field</label>
                  <select
                    value={answerField}
                    onChange={e => setAnswerField(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Select field</option>
                    {Object.keys(uploadPreview.records[0] || {}).map((key) => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Prompt</h2>
          <div className="mb-4 flex gap-4 items-center">
            <select
              value={selectedPromptId}
              onChange={e => {
                const val = e.target.value;
                setSelectedPromptId(val);
                if (val === "__add_new__") {
                  setIsAddingPrompt(true);
                  setPrompt("");
                } else {
                  setIsAddingPrompt(false);
                  const found = prompts.find(p => p.id === val);
                  setPrompt(found ? found.text : "");
                }
              }}
              className="flex-1 rounded-lg border border-border bg-input px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select existing prompt</option>
              {prompts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="__add_new__">Add new prompt...</option>
            </select>
            {/* Show preview and view full prompt if a prompt is selected */}
            {selectedPromptId && selectedPromptId !== "__add_new__" && (
              <>
                <span className="ml-2 text-xs text-muted-foreground max-w-xs truncate block" title={prompt}>
                  {prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt}
                </span>
                <Dialog>
                  <DialogContent>
                    <DialogTitle>Prompt Preview</DialogTitle>
                    <div className="whitespace-pre-wrap font-mono text-sm text-foreground max-h-96 overflow-auto">
                      {prompt}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
          {(isAddingPrompt || selectedPromptId === "" || selectedPromptId === "__add_new__") && (
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={5}
              className="w-full rounded-lg border border-border bg-input px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>
        {/* Generate Answers Section */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Generate Answers</h2>
          <p className="mb-4 text-sm text-muted-foreground">Test the answer generation on a sample record (first row of your uploaded data).</p>
          {/* Top row: Test on Sample (left) and Preview (right) */}
          <div className="flex flex-row gap-4 items-start">
            <button
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={
                !uploadPreview || !questionField || !answerField || !prompt || uploadPreview.records.length === 0
              }
              onClick={async () => {
                if (!uploadPreview || !questionField || !answerField || !prompt) return;
                const sample = uploadPreview.records[0];
                // Determine model_type based on selectedModel
                let model_type = 'openai';
                if (selectedModel.toLowerCase().includes('groq')) {
                  model_type = 'groq';
                }
                // Prepare payload
                const payload = {
                  question: sample[questionField],
                  prompt: prompt,
                  model_type: model_type
                };
                setTestResult('Loading...');
                try {
                  const res = await fetch('http://127.0.0.1:8000/model_answer', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  if (!res.ok) throw new Error('API error');
                  const data = await res.json();
                  setTestResult({
                    question: payload.question,
                    groundTruth: sample[answerField],
                    modelAnswer: data.answer || data.model_answer || data.output || JSON.stringify(data, null, 2),
                    raw: data
                  });
                } catch (e) {
                  setTestResult({ error: 'Error generating answer.' });
                }
              }}
            >
              Test on Sample Record
            </button>
            {testResult && !testResult.error && testResult !== 'Loading...' && testResult.modelAnswer && (
              <button
                className="rounded bg-secondary px-4 py-2 text-foreground font-medium border border-border hover:bg-secondary/80"
                onClick={() => setShowPreview(true)}
              >
                Preview Result
              </button>
            )}
          </div>
          {/* Second row: Send All Records and Save */}
          <div className="flex flex-row gap-4 items-center mt-4">
            <button
              className="rounded-xl bg-blue-600 px-8 py-4 text-white text-lg font-bold shadow-lg transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={
                !uploadPreview || !questionField || !answerField || !prompt || uploadPreview.records.length === 0
              }
              onClick={async () => {
                if (!uploadPreview || !questionField || !answerField || !prompt) return;
                // Prepare questions array
                let model_type = 'openai';
                if (selectedModel.toLowerCase().includes('groq')) {
                  model_type = 'groq';
                }
                const questions = uploadPreview.records.map((rec) => rec[questionField]);
                const batchPayload = {
                  questions,
                  prompt,
                  model_type
                };
                setTestResult('Loading...');
                try {
                  const res = await fetch('http://127.0.0.1:8000/model_answer_batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batchPayload)
                  });
                  if (!res.ok) throw new Error('API error');
                  const data = await res.json();
                  setTestResult({
                    allResults: data,
                    count: questions.length
                  });
                } catch (e) {
                  setTestResult({ error: 'Error sending all records.' });
                }
              }}
            >
              Send All Records
            </button>
            {testResult && !testResult.error && testResult !== 'Loading...' && testResult.allResults && (
              <div className="ml-4 text-foreground text-sm">
                Sent {testResult.count} records. Backend response: <span className="font-mono">{typeof testResult.allResults === 'string' ? testResult.allResults : JSON.stringify(testResult.allResults)}</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            {testResult && !testResult.error && testResult !== 'Loading...' && testResult.modelAnswer && (
              <button
                className="rounded bg-secondary px-4 py-2 text-foreground font-medium border border-border hover:bg-secondary/80"
                onClick={() => setShowPreview(true)}
              >
                Preview Result
              </button>
            )}
            {testResult && !testResult.error && testResult !== 'Loading...' && testResult.allResults && (
              <div className="mt-4 text-foreground text-sm">
                Sent {testResult.count} records. Backend response: <span className="font-mono">{typeof testResult.allResults === 'string' ? testResult.allResults : JSON.stringify(testResult.allResults)}</span>
              </div>
            )}
            {testResult === 'Loading...' && (
              <div className="text-sm text-muted-foreground">Loading...</div>
            )}
            {testResult && testResult.error && (
              <div className="text-sm text-destructive">{testResult.error}</div>
            )}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
              <DialogContent className="max-w-3xl w-full p-0 overflow-hidden">
                <DialogHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-2 border-b border-border">
                  <DialogTitle className="text-2xl">Model Answer Preview</DialogTitle>
                  <DialogClose className="ml-auto" />
                </DialogHeader>
                {testResult && !testResult.error && (
                  <div className="px-8 pb-8 pt-4 max-h-[80vh] overflow-y-auto">
                    <div className="font-semibold text-xl text-foreground mb-6">{testResult.question}</div>
                    <div className="flex flex-wrap gap-6 w-full">
                      <div className="flex-1 bg-card rounded-lg p-6 border border-border min-w-[250px] max-w-full">
                        <div className="font-medium text-muted-foreground mb-2">Ground Truth Answer</div>
                        <div className="whitespace-pre-wrap text-foreground text-base">{testResult.groundTruth}</div>
                      </div>
                      <div className="flex-1 bg-card rounded-lg p-6 border border-border min-w-[250px] max-w-full">
                        <div className="font-medium text-muted-foreground mb-2">Model Answer</div>
                        <div className="whitespace-pre-wrap text-foreground text-base">{testResult.modelAnswer}</div>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
