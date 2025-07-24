from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
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
import pandas as pd
import io
import csv

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

class BillUpdate(BaseModel):
    items: Optional[List[BillItem]] = None
    pricing_mode: Optional[str] = None
    total_amount: Optional[float] = None
    amount_paid: Optional[float] = None
    bill_type: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    bill_id: str
    customer_phone: str
    customer_name: str
    amount: float
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class PaymentCreate(BaseModel):
    bill_id: str
    amount: float
    notes: Optional[str] = None

class CreditCustomer(BaseModel):
    customer_phone: str
    customer_name: str
    total_amount: float
    paid_amount: float
    remaining_balance: float
    last_payment_date: Optional[datetime] = None
    bill_count: int
    bills: List[str]  # List of bill IDs

class AnalyticsQuery(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    period: str = "today"  # "today", "week", "month", "year", "custom"

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

def get_date_range(period: str, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None):
    now = datetime.utcnow()
    
    if period == "custom" and start_date and end_date:
        return start_date, end_date
    elif period == "today":
        start = datetime(now.year, now.month, now.day)
        end = start + timedelta(days=1)
    elif period == "week":
        start = now - timedelta(days=now.weekday())
        start = datetime(start.year, start.month, start.day)
        end = start + timedelta(days=7)
    elif period == "month":
        start = datetime(now.year, now.month, 1)
        if now.month == 12:
            end = datetime(now.year + 1, 1, 1)
        else:
            end = datetime(now.year, now.month + 1, 1)
    elif period == "year":
        start = datetime(now.year, 1, 1)
        end = datetime(now.year + 1, 1, 1)
    else:
        # Default to today
        start = datetime(now.year, now.month, now.day)
        end = start + timedelta(days=1)
    
    return start, end

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

# Import/Export routes
@api_router.post("/items/import")
async def import_items(file: UploadFile = File(...), current_user: str = Depends(verify_token)):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="File must be CSV or Excel format")
    
    try:
        content = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        required_columns = ['name', 'cost_price', 'customer_price', 'carpenter_price']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"Missing required columns: {required_columns}")
        
        items_created = 0
        for _, row in df.iterrows():
            item_data = {
                'name': str(row['name']),
                'cost_price': float(row['cost_price']),
                'customer_price': float(row['customer_price']),
                'carpenter_price': float(row['carpenter_price'])
            }
            item_obj = Item(**item_data)
            await db.items.insert_one(item_obj.dict())
            items_created += 1
        
        return {"message": f"Successfully imported {items_created} items"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/items/export")
async def export_items(current_user: str = Depends(verify_token)):
    items = await db.items.find().to_list(1000)
    
    # Create DataFrame
    df_data = []
    for item in items:
        df_data.append({
            'name': item['name'],
            'cost_price': item['cost_price'],
            'customer_price': item['customer_price'],
            'carpenter_price': item['carpenter_price'],
            'created_at': item['created_at'].strftime('%Y-%m-%d %H:%M:%S')
        })
    
    df = pd.DataFrame(df_data)
    
    # Convert to CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=items_export.csv"}
    )

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
    
    # Check if customer already has credit bills (merge logic)
    if bill.bill_type == "credit" and bill.customer_phone:
        existing_bills = await db.bills.find({
            "customer_phone": bill.customer_phone,
            "bill_type": "credit",
            "remaining_balance": {"$gt": 0}
        }).to_list(100)
        
        if existing_bills:
            # Update customer name if provided
            if bill.customer_name:
                await db.bills.update_many(
                    {"customer_phone": bill.customer_phone},
                    {"$set": {"customer_name": bill.customer_name}}
                )
    
    bill_dict = bill.dict()
    bill_dict["bill_number"] = bill_number
    bill_dict["profit"] = total_profit
    bill_dict["remaining_balance"] = remaining_balance
    
    bill_obj = Bill(**bill_dict)
    await db.bills.insert_one(bill_obj.dict())
    return bill_obj

@api_router.get("/bills", response_model=List[Bill])
async def get_bills(
    search: Optional[str] = None,
    bill_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: str = Depends(verify_token)
):
    query = {}
    
    if search:
        query["$or"] = [
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"customer_phone": {"$regex": search, "$options": "i"}},
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"items.item_name": {"$regex": search, "$options": "i"}}
        ]
    
    if bill_type:
        query["bill_type"] = bill_type
    
    if start_date and end_date:
        query["created_at"] = {"$gte": start_date, "$lte": end_date}
    
    bills = await db.bills.find(query).sort("created_at", -1).to_list(1000)
    return [Bill(**bill) for bill in bills]

@api_router.get("/bills/{bill_id}", response_model=Bill)
async def get_bill(bill_id: str, current_user: str = Depends(verify_token)):
    bill = await db.bills.find_one({"id": bill_id})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return Bill(**bill)

@api_router.put("/bills/{bill_id}", response_model=Bill)
async def update_bill(bill_id: str, bill_update: BillUpdate, current_user: str = Depends(verify_token)):
    existing_bill = await db.bills.find_one({"id": bill_id})
    if not existing_bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    update_data = {k: v for k, v in bill_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # Recalculate profit if items are updated
    if "items" in update_data:
        total_profit = sum(item["profit"] for item in update_data["items"])
        update_data["profit"] = total_profit
    
    # Recalculate remaining balance if amounts are updated
    if "total_amount" in update_data or "amount_paid" in update_data:
        total_amount = update_data.get("total_amount", existing_bill["total_amount"])
        amount_paid = update_data.get("amount_paid", existing_bill["amount_paid"])
        if existing_bill["bill_type"] == "credit":
            update_data["remaining_balance"] = total_amount - amount_paid
    
    await db.bills.update_one({"id": bill_id}, {"$set": update_data})
    updated_bill = await db.bills.find_one({"id": bill_id})
    return Bill(**updated_bill)

@api_router.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str, current_user: str = Depends(verify_token)):
    result = await db.bills.delete_one({"id": bill_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"message": "Bill deleted successfully"}

# Credit management routes
@api_router.get("/credits/customers", response_model=List[CreditCustomer])
async def get_credit_customers(current_user: str = Depends(verify_token)):
    # Aggregate credit customers
    pipeline = [
        {"$match": {"bill_type": "credit", "customer_phone": {"$ne": None}}},
        {
            "$group": {
                "_id": "$customer_phone",
                "customer_name": {"$first": "$customer_name"},
                "total_amount": {"$sum": "$total_amount"},
                "paid_amount": {"$sum": "$amount_paid"},
                "remaining_balance": {"$sum": "$remaining_balance"},
                "last_payment_date": {"$max": "$updated_at"},
                "bill_count": {"$sum": 1},
                "bills": {"$push": "$id"}
            }
        },
        {"$match": {"remaining_balance": {"$gt": 0}}},
        {"$sort": {"remaining_balance": -1}}
    ]
    
    result = await db.bills.aggregate(pipeline).to_list(100)
    
    customers = []
    for customer in result:
        customers.append(CreditCustomer(
            customer_phone=customer["_id"],
            customer_name=customer["customer_name"] or "Unknown",
            total_amount=customer["total_amount"],
            paid_amount=customer["paid_amount"],
            remaining_balance=customer["remaining_balance"],
            last_payment_date=customer["last_payment_date"],
            bill_count=customer["bill_count"],
            bills=customer["bills"]
        ))
    
    return customers

@api_router.post("/credits/payment", response_model=Payment)
async def add_payment(payment: PaymentCreate, current_user: str = Depends(verify_token)):
    # Get the bill
    bill = await db.bills.find_one({"id": payment.bill_id})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    if bill["bill_type"] != "credit":
        raise HTTPException(status_code=400, detail="Payment can only be added to credit bills")
    
    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")
    
    current_balance = bill.get("remaining_balance", 0)
    if payment.amount > current_balance:
        raise HTTPException(status_code=400, detail="Payment amount cannot exceed remaining balance")
    
    # Create payment record
    payment_obj = Payment(
        bill_id=payment.bill_id,
        customer_phone=bill["customer_phone"],
        customer_name=bill["customer_name"] or "Unknown",
        amount=payment.amount,
        notes=payment.notes
    )
    
    await db.payments.insert_one(payment_obj.dict())
    
    # Update bill
    new_paid_amount = bill["amount_paid"] + payment.amount
    new_remaining_balance = bill["total_amount"] - new_paid_amount
    
    await db.bills.update_one(
        {"id": payment.bill_id},
        {
            "$set": {
                "amount_paid": new_paid_amount,
                "remaining_balance": new_remaining_balance,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    return payment_obj

@api_router.get("/credits/payments/{customer_phone}")
async def get_customer_payments(customer_phone: str, current_user: str = Depends(verify_token)):
    payments = await db.payments.find({"customer_phone": customer_phone}).sort("payment_date", -1).to_list(100)
    return [Payment(**payment) for payment in payments]

# Analytics routes
@api_router.post("/analytics/stats")
async def get_analytics_stats(query: AnalyticsQuery, current_user: str = Depends(verify_token)):
    start_date, end_date = get_date_range(query.period, query.start_date, query.end_date)
    
    # Get bills in date range
    bills = await db.bills.find({
        "created_at": {"$gte": start_date, "$lt": end_date}
    }).to_list(1000)
    
    total_sales = sum(bill.get("total_amount", 0) for bill in bills)
    total_profit = sum(bill.get("profit", 0) for bill in bills)
    paid_bills = [bill for bill in bills if bill.get("bill_type") == "paid"]
    credit_bills = [bill for bill in bills if bill.get("bill_type") == "credit"]
    
    # Get overall outstanding amount (not just for this period)
    all_credit_bills = await db.bills.find({"bill_type": "credit", "remaining_balance": {"$gt": 0}}).to_list(1000)
    outstanding_amount = sum(bill.get("remaining_balance", 0) for bill in all_credit_bills)
    
    return {
        "period": query.period,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_sales": total_sales,
        "total_profit": total_profit,
        "outstanding_amount": outstanding_amount,
        "bills_count": len(bills),
        "paid_bills_count": len(paid_bills),
        "credit_bills_count": len(credit_bills),
        "paid_bills_amount": sum(bill.get("total_amount", 0) for bill in paid_bills),
        "credit_bills_amount": sum(bill.get("total_amount", 0) for bill in credit_bills),
        "average_bill_amount": total_sales / len(bills) if bills else 0,
        "profit_margin": (total_profit / total_sales * 100) if total_sales > 0 else 0
    }

@api_router.get("/analytics/top-items")
async def get_top_selling_items(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 10,
    current_user: str = Depends(verify_token)
):
    query = {}
    if start_date and end_date:
        query["created_at"] = {"$gte": start_date, "$lte": end_date}
    
    bills = await db.bills.find(query).to_list(1000)
    
    # Aggregate item sales
    item_stats = {}
    for bill in bills:
        for item in bill.get("items", []):
            item_name = item["item_name"]
            if item_name not in item_stats:
                item_stats[item_name] = {
                    "name": item_name,
                    "quantity_sold": 0,
                    "total_revenue": 0,
                    "total_profit": 0
                }
            
            item_stats[item_name]["quantity_sold"] += item["quantity"]
            item_stats[item_name]["total_revenue"] += item["subtotal"]
            item_stats[item_name]["total_profit"] += item["profit"]
    
    # Sort by revenue and return top items
    top_items = sorted(item_stats.values(), key=lambda x: x["total_revenue"], reverse=True)[:limit]
    
    return top_items

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=10000, reload=True)
