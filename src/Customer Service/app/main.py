from fastapi import FastAPI, Request, Response
from app.api.endpoints import customers
from app.config import settings
from app.database import engine
import logging
import time
from sqlalchemy import text
from psycopg2 import OperationalError as PsycopgOperationalError
from sqlalchemy.exc import OperationalError as SQLAlchemyOperationalError
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi.middleware.cors import CORSMiddleware
from opentelemetry import trace
from opentelemetry.exporter.zipkin.json import ZipkinExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from dapr.ext.fastapi import DaprApp
from dapr.clients import DaprClient

# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)
DB_CONNECTION_FAILURES = Counter(
    'db_connection_failures_total',
    'Database connection failure count'
)
DAPR_OPERATIONS = Counter(
    'dapr_operations_total',
    'Dapr operations count',
    ['operation_type', 'status']
)
DAPR_LATENCY = Histogram(
    'dapr_operation_duration_seconds',
    'Dapr operation latency',
    ['operation_type']
)

# Initialize tracing
trace.set_tracer_provider(TracerProvider())
zipkin_exporter = ZipkinExporter(
    endpoint="http://zipkin.monitoring:9411/api/v2/spans"
)
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(zipkin_exporter)
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="API for customer management system"
)

# Initialize Dapr
dapr_app = DaprApp(app)

# Initialize FastAPI instrumentation
FastAPIInstrumentor.instrument_app(app)
SQLAlchemyInstrumentor().instrument(engine=engine)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware for metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Health check endpoint
@app.get("/healthz")
async def health_check():
    return {"status": "healthy"}

# Dapr subscription endpoints
@dapr_app.subscribe(pubsub_name='pubsub', topic='customer-events')
async def customer_events_handler(event_data: dict):
    try:
        logger.info(f"Received customer event: {event_data}")
        DAPR_OPERATIONS.labels(
            operation_type='pubsub_receive',
            status='success'
        ).inc()
        return {"success": True}
    except Exception as e:
        logger.error(f"Error processing customer event: {str(e)}")
        DAPR_OPERATIONS.labels(
            operation_type='pubsub_receive',
            status='error'
        ).inc()
        raise

# Include routers
app.include_router(
    customers.router,
    prefix=f"{settings.API_V1_STR}/customers",
    tags=["customers"]
)

def wait_for_db(max_retries=5, retry_interval=5):
    """Wait for database to be ready with retries."""
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database connection successful")
                return True
        except (SQLAlchemyOperationalError, PsycopgOperationalError) as e:
            DB_CONNECTION_FAILURES.inc()
            if attempt == max_retries - 1:
                logger.error(f"Database connection failed after {max_retries} attempts")
                raise
            logger.warning(f"Database connection attempt {attempt + 1} failed, retrying in {retry_interval} seconds...")
            time.sleep(retry_interval)
    return False

async def init_dapr():
    """Initialize Dapr components and verify connectivity."""
    try:
        with DaprClient() as d:
            # Ping state store
            await d.save_state(
                store_name="statestore",
                key="health-check",
                value="ok"
            )
            logger.info("Dapr state store connection successful")
            DAPR_OPERATIONS.labels(
                operation_type='init',
                status='success'
            ).inc()
    except Exception as e:
        logger.error(f"Dapr initialization failed: {str(e)}")
        DAPR_OPERATIONS.labels(
            operation_type='init',
            status='error'
        ).inc()
        raise

@app.on_event("startup")
async def startup():
    """Startup event handler."""
    try:
        wait_for_db()
        Base.metadata.create_all(bind=engine)
        await init_dapr()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event handler."""
    logger.info("Application shutting down")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )