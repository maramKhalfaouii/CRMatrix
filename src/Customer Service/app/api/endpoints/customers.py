from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from dapr.clients import DaprClient
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, Customer as CustomerSchema

router = APIRouter()
STORE_NAME = "statestore"
PUBSUB_NAME = "pubsub"

# Helper function to get Dapr client
async def get_dapr_client():
    with DaprClient() as d:
        yield d

@router.post("/", response_model=CustomerSchema)
async def create_customer(
    customer: CustomerCreate, 
    db: Session = Depends(get_db),
    dapr: DaprClient = Depends(get_dapr_client)
):
    # Create customer in database
    db_customer = Customer(**customer.dict())
    try:
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        
        # Save to Dapr state store for caching
        await dapr.save_state(
            store_name=STORE_NAME,
            key=f"customer-{db_customer.id}",
            value=CustomerSchema.from_orm(db_customer).dict()
        )
        
        # Publish customer created event
        await dapr.publish_event(
            pubsub_name=PUBSUB_NAME,
            topic="customer-created",
            data=CustomerSchema.from_orm(db_customer).dict()
        )
        
        return db_customer
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{customer_id}", response_model=CustomerSchema)
async def read_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    dapr: DaprClient = Depends(get_dapr_client)
):
    # Try to get from Dapr state store first
    state = await dapr.get_state(
        store_name=STORE_NAME,
        key=f"customer-{customer_id}"
    )
    
    if state.data:
        return state.data
        
    # If not in state store, get from database
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Save to state store for future requests
    await dapr.save_state(
        store_name=STORE_NAME,
        key=f"customer-{customer_id}",
        value=CustomerSchema.from_orm(customer).dict()
    )
    
    return customer

@router.get("/", response_model=List[CustomerSchema])
def list_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    customers = db.query(Customer).offset(skip).limit(limit).all()
    return customers

@router.put("/{customer_id}", response_model=CustomerSchema)
async def update_customer(
    customer_id: int, 
    customer: CustomerUpdate, 
    db: Session = Depends(get_db),
    dapr: DaprClient = Depends(get_dapr_client)
):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    for key, value in customer.dict().items():
        setattr(db_customer, key, value)
    
    try:
        db.commit()
        db.refresh(db_customer)
        
        # Update state store
        await dapr.save_state(
            store_name=STORE_NAME,
            key=f"customer-{customer_id}",
            value=CustomerSchema.from_orm(db_customer).dict()
        )
        
        # Publish customer updated event
        await dapr.publish_event(
            pubsub_name=PUBSUB_NAME,
            topic="customer-updated",
            data=CustomerSchema.from_orm(db_customer).dict()
        )
        
        return db_customer
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int, 
    db: Session = Depends(get_db),
    dapr: DaprClient = Depends(get_dapr_client)
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    try:
        db.delete(customer)
        db.commit()
        
        # Delete from state store
        await dapr.delete_state(
            store_name=STORE_NAME,
            key=f"customer-{customer_id}"
        )
        
        # Publish customer deleted event
        await dapr.publish_event(
            pubsub_name=PUBSUB_NAME,
            topic="customer-deleted",
            data={"id": customer_id}
        )
        
        return {"message": "Customer deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# Add Dapr subscription endpoints
@router.post("/events/customer")
async def handle_customer_event(event_data: dict):
    print(f"Received customer event: {event_data}")
    return {"success": True}