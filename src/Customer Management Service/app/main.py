from fastapi import FastAPI
from dapr.ext.fastapi import DaprFastAPI
from .api.endpoints import customers
from .config import settings
from .database import engine, Base
import logging
import time
from sqlalchemy import text
from psycopg2 import OperationalError as PsycopgOperationalError
from sqlalchemy.exc import OperationalError as SQLAlchemyOperationalError

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
dapr_app = DaprFastAPI(app)

# Include routers
app.include_router(
    customers.router,
    prefix=f"{settings.API_V1_STR}/customers",
    tags=["customers"]
)

# Dapr pub/sub name and topic
PUBSUB_NAME = "pubsub"
PUBSUB_TOPIC = "customer-events"

def wait_for_db(max_retries=5, retry_interval=5):
    """Wait for database to be ready with retries."""
    for attempt in range(max_retries):
        try:
            # Verify database connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("Database connection successful")
                return True
        except (SQLAlchemyOperationalError, PsycopgOperationalError) as e:
            if attempt == max_retries - 1:
                logger.error(f"Database connection failed after {max_retries} attempts")
                raise
            logger.warning(f"Database connection attempt {attempt + 1} failed, retrying in {retry_interval} seconds...")
            time.sleep(retry_interval)
    return False

@app.on_event("startup")
async def startup():
    """Startup event handler."""
    try:
        # Wait for database to be ready
        wait_for_db()
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Log Dapr initialization
        logger.info("Dapr sidecar initialized")
    except Exception as e:
        logger.error(f"Startup failed: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event handler."""
    logger.info("Application shutting down")

# Dapr service invocation endpoint example
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "customer-management"}

# Example of Dapr state management
@app.get("/dapr-state/{key}")
async def get_state(key: str):
    """Get state using Dapr state management."""
    state = await dapr_app.state.get_state(
        store_name="statestore",
        key=key
    )
    return {"key": key, "data": state.data if state else None}

@app.post("/dapr-state/{key}")
async def save_state(key: str, data: dict):
    """Save state using Dapr state management."""
    await dapr_app.state.save_state(
        store_name="statestore",
        key=key,
        value=data
    )
    return {"status": "saved", "key": key}

# Example of Dapr pub/sub
@app.post("/publish-event")
async def publish_event(data: dict):
    """Publish event using Dapr pub/sub."""
    await dapr_app.publish.publish(
        pubsub_name=PUBSUB_NAME,
        topic=PUBSUB_TOPIC,
        data=data
    )
    return {"status": "published", "topic": PUBSUB_TOPIC}

# Subscribe to events
@app.post("/events-subscriber")
@dapr_app.subscribe(pubsub_name=PUBSUB_NAME, topic=PUBSUB_TOPIC)
async def events_subscriber(event_data: dict):
    """Subscribe to events using Dapr pub/sub."""
    logger.info(f"Received event: {event_data}")
    return {"success": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )