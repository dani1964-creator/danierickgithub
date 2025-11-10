export default async function clientLog(level: string, message: string, context?: any) {
  try {
    // fire-and-forget, não aguardamos a resposta para não bloquear UI
    fetch('/api/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message, context }),
    }).catch(() => {
      // silenciar erros de envio para não poluir a UX
    });
  } catch (e) {
    // noop
  }
}
