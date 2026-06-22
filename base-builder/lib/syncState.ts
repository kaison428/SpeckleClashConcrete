let lastSync: string | null = null;

export function getLastSync(): string | null {
  return lastSync;
}

export function setLastSync(ts: string): void {
  lastSync = ts;
}
