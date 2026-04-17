import { API_BASE } from '../constants/api';

export async function streamAdvisorResponse(
  question,
  token,
  onToken,
  onDone,
  onError,
  signal
) {
  const controller = signal ? null : new AbortController();
  const abortSignal = signal || controller.signal;

  // Auto-abort after 120 seconds if no external signal
  let timeoutId;
  if (!signal && controller) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000);
  }

  try {
    const response = await fetch(`${API_BASE}/advisor/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({ question: question || '' }),
      signal: abortSignal,
    });

    if (!response.ok) {
      let errMsg = `Server error: ${response.status}`;
      try {
        const errData = await response.json();
        if (errData.detail) errMsg = String(errData.detail);
      } catch (_) {}
      throw new Error(errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split on double newlines (SSE event boundaries)
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice('data:'.length).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const payload = JSON.parse(jsonStr);

          if (payload.error) {
            onError && onError(new Error(payload.error));
            return;
          }

          if (payload.token !== undefined) {
            onToken && onToken(payload.token);
          }

          if (payload.done === true) {
            onDone && onDone({
              tokens: payload.tokens || 0,
              model: payload.model || 'gpt-oss:120b',
            });
            return;
          }
        } catch (parseErr) {
          // Skip malformed JSON lines
        }
      }
    }

    // Stream ended without explicit done event
    onDone && onDone({ tokens: 0, model: 'gpt-oss:120b' });
  } catch (err) {
    if (err.name === 'AbortError') {
      onError && onError(new Error('Request timed out. The AI advisor took too long to respond.'));
    } else {
      onError && onError(err);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
