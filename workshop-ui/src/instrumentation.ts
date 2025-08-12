import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';
import { registerOTel } from '@vercel/otel';

export async function register() {
  registerOTel({
    serviceName: 'ai-workshop-chat',
    traceExporter: <any>new AzureMonitorTraceExporter({
      connectionString: process.env.APP_INSIGHTS_CONNECTION_STRING,
    }),
  });
}