import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import reportRoutes from './routes/reportRoutes';
import promClient from 'prom-client';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

// Prometheus metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();

collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

// Initialize tracing
const provider = new NodeTracerProvider();
const exporter = new ZipkinExporter({
    url: 'http://zipkin.monitoring:9411/api/v2/spans',
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

registerInstrumentations({
    instrumentations: [
        new ExpressInstrumentation(),
        new MongoDBInstrumentation(),
    ],
});

const app = express();

app.use(cors());
app.use(express.json());

// Metrics middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        httpRequestDuration
            .labels(req.method, req.path, res.statusCode.toString())
            .observe(duration / 1000);
    });
    next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

app.use('/api/reports', reportRoutes);

export default app;