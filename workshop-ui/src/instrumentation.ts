export async function register() {
  // Only register OpenTelemetry in Node.js runtime, not in edge runtime (middleware)
  // Skip initialization if we're in edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  try {
    const { AzureMonitorTraceExporter } = await import('@azure/monitor-opentelemetry-exporter');
    const { registerOTel } = await import('@vercel/otel');

    registerOTel({
      serviceName: 'ai-workshop-chat',
      traceExporter: <any>new AzureMonitorTraceExporter({
        connectionString: process.env.APP_INSIGHTS_CONNECTION_STRING,
      }),
    });
  } catch (error) {
    console.warn('Failed to initialize OpenTelemetry:', error);
  }
}