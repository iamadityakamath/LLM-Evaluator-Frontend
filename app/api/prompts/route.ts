import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type PromptPayload = {
  name: string
  text: string
  tags: string[]
  source: 'create' | 'update'
}

type StoredPrompt = {
  id: string
  name: string
  fileName: string
  filePath: string
  tags: string[]
  textLength: number
  savedAt: string
  source: 'create' | 'update'
}

const DATA_DIR = path.join(process.cwd(), 'data')
const PROMPTS_DIR = path.join(DATA_DIR, 'prompts')
const PROMPTS_INDEX_FILE = path.join(PROMPTS_DIR, 'index.json')

function normalizeFileName(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'prompt'
}

async function readStoredPrompts(): Promise<StoredPrompt[]> {
  try {
    const fileContents = await readFile(PROMPTS_INDEX_FILE, 'utf8')
    const parsed = JSON.parse(fileContents)
    return Array.isArray(parsed) ? (parsed as StoredPrompt[]) : []
  } catch {
    return []
  }
}

async function writeStoredPrompts(prompts: StoredPrompt[]) {
  await mkdir(PROMPTS_DIR, { recursive: true })
  await writeFile(PROMPTS_INDEX_FILE, JSON.stringify(prompts, null, 2), 'utf8')
}

export async function GET() {
  try {
    const prompts = await readStoredPrompts()
    return NextResponse.json({ prompts })
  } catch {
    return NextResponse.json({ error: 'Failed to read local prompts file.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PromptPayload>

    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const text = typeof body?.text === 'string' ? body.text.trim() : ''
    const tags = Array.isArray(body?.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === 'string')
      : []
    const source = body?.source === 'update' ? 'update' : 'create'

    if (!name || !text) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected name and text.' },
        { status: 400 }
      )
    }

    await mkdir(PROMPTS_DIR, { recursive: true })

    const timestamp = Date.now()
    const promptId = randomUUID()
    const fileName = `${normalizeFileName(name)}-${timestamp}.json`
    const absoluteFilePath = path.join(PROMPTS_DIR, fileName)
    const relativeFilePath = path.join('data', 'prompts', fileName).replace(/\\/g, '/')

    await writeFile(absoluteFilePath, JSON.stringify({ name, text, tags }, null, 2), 'utf8')

    const existing = await readStoredPrompts()
    const storedPrompt: StoredPrompt = {
      id: promptId,
      name,
      fileName,
      filePath: relativeFilePath,
      tags,
      textLength: text.length,
      savedAt: new Date().toISOString(),
      source,
    }

    await writeStoredPrompts([...existing, storedPrompt])

    return NextResponse.json({ prompt: storedPrompt }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to write local prompt file.' }, { status: 500 })
  }
}
