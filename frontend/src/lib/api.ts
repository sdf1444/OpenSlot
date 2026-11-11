export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      message = (await response.json()).title ?? message;
    } catch {
      // Keep the fallback error if the server returns a non-JSON payload.
    }

    throw new Error(message);
  }

  return (response.status === 204 ? null : await response.json()) as T;
}
