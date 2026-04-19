import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DATA_DIR = path.join(process.cwd(), 'data')
const APIKEYS_DIR = path.join(DATA_DIR, 'apikeys')
const APIKEYS_FILE = path.join(APIKEYS_DIR, 'apikeys.json')

async function readApiKeys(): Promise<Record<string, string>> {
  try {
    const fileContents = await readFile(APIKEYS_FILE, 'utf8')
    const parsed = JSON.parse(fileContents)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

async function writeApiKeys(keys: Record<string, string>) {
  await mkdir(APIKEYS_DIR, { recursive: true })
  await writeFile(APIKEYS_FILE, JSON.stringify(keys, null, 2), 'utf8')
}

export async function GET() {
  try {
    const keys = await readApiKeys()
    return NextResponse.json({ keys })
  } catch {
    return NextResponse.json({ error: 'Failed to read API keys.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { provider, key } = body
    if (!provider || typeof provider !== 'string' || !key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
    }
    // Map OpenAI to OPENAI_API_KEY
    if (provider.toLowerCase() === 'openai') {
      provider = 'OPENAI_API_KEY'
    }
    const keys = await readApiKeys()
    keys[provider] = key
    await writeApiKeys(keys)
    return NextResponse.json({ keys }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to save API key.' }, { status: 500 })
  }
}
