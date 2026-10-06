interface ApiErrorPayload {
  error?: unknown;
}

export const parseApiResponse = async <Payload>(
  response: Response,
  fallbackError: string
): Promise<Payload> => {
  let payload: Payload & ApiErrorPayload;
  if (typeof response.text === 'function') {
    const body = await response.text();
    if (!body) throw new Error(fallbackError);
    try {
      payload = JSON.parse(body) as Payload & ApiErrorPayload;
    } catch {
      throw new Error(fallbackError);
    }
  } else {
    try {
      payload = (await response.json()) as Payload & ApiErrorPayload;
    } catch {
      throw new Error(fallbackError);
    }
  }

  if (!response.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : fallbackError);
  }
  return payload;
};
