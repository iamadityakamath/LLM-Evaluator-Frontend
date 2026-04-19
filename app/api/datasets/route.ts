import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type DatasetRecord = Record<string, unknown>

type StoredDataset = {
  id: string
  name: string
  fileName: string
  filePath: string
  recordCount: number
  uploadedAt: string
  source: 'upload' | 'sample'
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATASET_DIR = path.join(DATA_DIR, 'dataset')
const DATASET_INDEX_FILE = path.join(DATASET_DIR, 'index.json')

function normalizeFileName(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'dataset'
}

async function readStoredDatasets(): Promise<StoredDataset[]> {
  try {
    const fileContents = await readFile(DATASET_INDEX_FILE, 'utf8')
    const parsed = JSON.parse(fileContents)
    return Array.isArray(parsed) ? (parsed as StoredDataset[]) : []
  } catch {
    return []
  }
}

async function writeStoredDatasets(datasets: StoredDataset[]) {
  await mkdir(DATASET_DIR, { recursive: true })
  await writeFile(DATASET_INDEX_FILE, JSON.stringify(datasets, null, 2), 'utf8')
}

export async function GET() {
  try {
    const datasets = await readStoredDatasets()
    return NextResponse.json({ datasets })
  } catch {
    return NextResponse.json({ error: 'Failed to read local dataset file.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    const records = Array.isArray(body?.records) ? (body.records as DatasetRecord[]) : null
    const source = body?.source === 'sample' ? 'sample' : 'upload'

    if (!name || !records) {
      return NextResponse.json(
        { error: 'Invalid payload. Expected name and records array.' },
        { status: 400 }
      )
    }

    await mkdir(DATASET_DIR, { recursive: true })

    const timestamp = Date.now()
    const datasetId = randomUUID()
    const fileName = `${normalizeFileName(name)}-${timestamp}.json`
    const absoluteFilePath = path.join(DATASET_DIR, fileName)
    const relativeFilePath = path.join('data', 'dataset', fileName).replace(/\\/g, '/')

    await writeFile(absoluteFilePath, JSON.stringify(records, null, 2), 'utf8')

    const existing = await readStoredDatasets()

    const storedDataset: StoredDataset = {
      id: datasetId,
      name,
      fileName,
      filePath: relativeFilePath,
      recordCount: records.length,
      uploadedAt: new Date().toISOString(),
      source,
    }

    await writeStoredDatasets([...existing, storedDataset])

    return NextResponse.json({ dataset: storedDataset }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to write local dataset file.' }, { status: 500 })
  }
}
