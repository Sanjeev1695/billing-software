from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# JWT Configuration
SECRET_KEY = "shop_billing_secret_key_2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Models
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class Item(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    cost_price: float
    customer_price: float
    carpenter_price: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ItemCreate(BaseModel):
    name: str
    cost_price: float
    customer_price: float
    carpenter_price: float

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    cost_price: Optional[float] = None
    customer_price: Optional[float] = None
    carpenter_price: Optional[float] = None

class BillItem(BaseModel):
    item_id: str
    item_name: str
    cost_price: float
    sale_price: float
    quantity: int
    subtotal: float
    profit: float

class Bill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_number: str
    items: List[BillItem]
    pricing_mode: str  # "customer" or "carpenter"
    total_amount: float
    amount_paid: float
    profit: float
    bill_type: str  # "paid" or "credit"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    remaining_balance: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BillCreate(BaseModel):
    items: List[BillItem]
    pricing_mode: str
    total_amount: float
    amount_paid: float
    bill_type: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

# Authentication functions
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def verify_credentials(username: str, password: str):
    # Hardcoded credentials as per requirements
    if username == "VVR" and password == "Vvr9704585785":
        return True
    return False

# Authentication routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    if not verify_credentials(login_request.username, login_request.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": login_request.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": login_request.username}
    }

@api_router.get("/auth/verify")
async def verify_auth(current_user: str = Depends(verify_token)):
    return {"user": current_user, "valid": True}

# Item management routes
@api_router.post("/items", response_model=Item)
async def create_item(item: ItemCreate, current_user: str = Depends(verify_token)):
    item_dict = item.dict()
    item_obj = Item(**item_dict)
    await db.items.insert_one(item_obj.dict())
    return item_obj

@api_router.get("/items", response_model=List[Item])
async def get_items(current_user: str = Depends(verify_token)):
    items = await db.items.find().sort("name", 1).to_list(1000)
    return [Item(**item) for item in items]

@api_router.get("/items/search/{query}")
async def search_items(query: str, current_user: str = Depends(verify_token)):
    regex_pattern = {"$regex": query, "$options": "i"}
    items = await db.items.find({"name": regex_pattern}).sort("name", 1).to_list(50)
    return [Item(**item) for item in items]

@api_router.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: str, item_update: ItemUpdate, current_user: str = Depends(verify_token)):
    existing_item = await db.items.find_one({"id": item_id})
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    update_data = {k: v for k, v in item_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.items.update_one({"id": item_id}, {"$set": update_data})
    updated_item = await db.items.find_one({"id": item_id})
    return Item(**updated_item)

@api_router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: str = Depends(verify_token)):
    result = await db.items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}

# Bill management routes
@api_router.post("/bills", response_model=Bill)
async def create_bill(bill: BillCreate, current_user: str = Depends(verify_token)):
    # Generate bill number
    today = datetime.utcnow()
    bill_count = await db.bills.count_documents({
        "created_at": {
            "$gte": datetime(today.year, today.month, today.day),
            "$lt": datetime(today.year, today.month, today.day) + timedelta(days=1)
        }
    })
    bill_number = f"BILL-{today.strftime('%Y%m%d')}-{bill_count + 1:03d}"
    
    # Calculate total profit from items
    total_profit = sum(item.profit for item in bill.items)
    
    # Calculate remaining balance for credit bills
    remaining_balance = None
    if bill.bill_type == "credit":
        remaining_balance = bill.total_amount - bill.amount_paid
    
    bill_dict = bill.dict()
    bill_dict["bill_number"] = bill_number
    bill_dict["profit"] = total_profit
    bill_dict["remaining_balance"] = remaining_balance
    
    bill_obj = Bill(**bill_dict)
    await db.bills.insert_one(bill_obj.dict())
    return bill_obj

@api_router.get("/bills", response_model=List[Bill])
async def get_bills(current_user: str = Depends(verify_token)):
    bills = await db.bills.find().sort("created_at", -1).to_list(1000)
    return [Bill(**bill) for bill in bills]

@api_router.get("/bills/today-stats")
async def get_today_stats(current_user: str = Depends(verify_token)):
    today = datetime.utcnow()
    start_of_day = datetime(today.year, today.month, today.day)
    end_of_day = start_of_day + timedelta(days=1)
    
    # Get today's bills
    today_bills = await db.bills.find({
        "created_at": {"$gte": start_of_day, "$lt": end_of_day}
    }).to_list(1000)
    
    total_sales = sum(bill.get("total_amount", 0) for bill in today_bills)
    total_profit = sum(bill.get("profit", 0) for bill in today_bills)
    
    # Get outstanding credit amount
    credit_bills = await db.bills.find({"bill_type": "credit", "remaining_balance": {"$gt": 0}}).to_list(1000)
    outstanding_amount = sum(bill.get("remaining_balance", 0) for bill in credit_bills)
    
    return {
        "today_sales": total_sales,
        "today_profit": total_profit,
        "outstanding_amount": outstanding_amount,
        "bills_count": len(today_bills)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()