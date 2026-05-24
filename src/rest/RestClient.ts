// ─── Errors ───────────────────────────────────────────────────────────────────

export class BotApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BotApiError';
  }
}

export class BotServerError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BotServerError';
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class RestClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    // Token always stored without "Bot " prefix — header is built here
    this.authHeader = `Bot ${token}`;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    // 204 No Content — return undefined
    if (response.status === 204) return undefined as T;

    if (!response.ok) {
      let message = response.statusText;
      try {
        const json = (await response.json()) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        // ignore parse error, use statusText
      }

      if (response.status >= 500) throw new BotServerError(response.status, message);
      throw new BotApiError(response.status, message);
    }

    return response.json() as Promise<T>;
  }

  get<T = unknown>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  put<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T = unknown>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
