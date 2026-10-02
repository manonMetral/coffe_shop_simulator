export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${path}`);
  }
  return (await response.json()) as T;
}
