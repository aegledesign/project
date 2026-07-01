import { promises as fs } from 'fs';
import path from 'path';
const dataDir = path.join(process.cwd(), 'data');
const writeQueues = new Map<string, Promise<void>>();

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { const raw = await fs.readFile(path.join(dataDir, file), 'utf8'); return JSON.parse(raw) as T; }
  catch { return fallback; }
}

export async function writeJson<T>(file: string, data: T): Promise<void> {
  const previous = writeQueues.get(file) ?? Promise.resolve();
  const operation = previous.catch(() => undefined).then(async () => {
    await fs.mkdir(dataDir, { recursive: true });
    const target = path.join(dataDir, file);
    const temporary = `${target}.${process.pid}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(data, null, 2));
    await fs.rename(temporary, target);
  });
  writeQueues.set(file, operation);
  try {
    await operation;
  } finally {
    if (writeQueues.get(file) === operation) writeQueues.delete(file);
  }
}
