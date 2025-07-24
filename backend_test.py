import requests
import sys
import json
from datetime import datetime

class ShopBillingAPITester:
    def __init__(self, base_url="https://aa04b7b2-c235-4584-94ac-225f984adfad.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = []
        self.created_bills = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_valid(self):
        """Test login with valid credentials"""
        success, response = self.run_test(
            "Login with valid credentials",
            "POST",
            "auth/login",
            200,
            data={"username": "VVR", "password": "Vvr9704585785"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_invalid(self):
        """Test login with invalid credentials"""
        success, _ = self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            data={"username": "wrong", "password": "wrong"}
        )
        return success

    def test_auth_verify(self):
        """Test token verification"""
        success, response = self.run_test(
            "Verify authentication token",
            "GET",
            "auth/verify",
            200
        )
        return success

    def test_create_item(self):
        """Test creating a new item"""
        item_data = {
            "name": f"Test Item {datetime.now().strftime('%H%M%S')}",
            "cost_price": 100.0,
            "customer_price": 150.0,
            "carpenter_price": 130.0
        }
        success, response = self.run_test(
            "Create new item",
            "POST",
            "items",
            200,
            data=item_data
        )
        if success and 'id' in response:
            self.created_items.append(response['id'])
            return True
        return False

    def test_get_items(self):
        """Test getting all items"""
        success, response = self.run_test(
            "Get all items",
            "GET",
            "items",
            200
        )
        if success:
            print(f"   Found {len(response)} items")
        return success

    def test_search_items(self):
        """Test item search functionality"""
        success, response = self.run_test(
            "Search items",
            "GET",
            "items/search/Test",
            200
        )
        if success:
            print(f"   Found {len(response)} items matching 'Test'")
        return success

    def test_update_item(self):
        """Test updating an item"""
        if not self.created_items:
            print("❌ No items to update")
            return False
            
        item_id = self.created_items[0]
        update_data = {
            "name": f"Updated Test Item {datetime.now().strftime('%H%M%S')}",
            "customer_price": 160.0
        }
        success, response = self.run_test(
            "Update item",
            "PUT",
            f"items/{item_id}",
            200,
            data=update_data
        )
        return success

    def test_create_bill_paid(self):
        """Test creating a paid bill"""
        if not self.created_items:
            print("❌ No items available for bill")
            return False

        # First get item details
        success, items = self.run_test("Get items for bill", "GET", "items", 200)
        if not success or not items:
            return False

        item = items[0]
        bill_data = {
            "items": [{
                "item_id": item['id'],
                "item_name": item['name'],
                "cost_price": item['cost_price'],
                "sale_price": item['customer_price'],
                "quantity": 2,
                "subtotal": item['customer_price'] * 2,
                "profit": (item['customer_price'] - item['cost_price']) * 2
            }],
            "pricing_mode": "customer",
            "total_amount": item['customer_price'] * 2,
            "amount_paid": item['customer_price'] * 2,
            "bill_type": "paid"
        }
        
        success, response = self.run_test(
            "Create paid bill",
            "POST",
            "bills",
            200,
            data=bill_data
        )
        if success and 'id' in response:
            self.created_bills.append(response['id'])
            print(f"   Bill number: {response.get('bill_number', 'N/A')}")
        return success

    def test_create_bill_credit(self):
        """Test creating a credit bill"""
        if not self.created_items:
            print("❌ No items available for bill")
            return False

        # Get item details
        success, items = self.run_test("Get items for credit bill", "GET", "items", 200)
        if not success or not items:
            return False

        item = items[0]
        bill_data = {
            "items": [{
                "item_id": item['id'],
                "item_name": item['name'],
                "cost_price": item['cost_price'],
                "sale_price": item['carpenter_price'],
                "quantity": 1,
                "subtotal": item['carpenter_price'],
                "profit": item['carpenter_price'] - item['cost_price']
            }],
            "pricing_mode": "carpenter",
            "total_amount": item['carpenter_price'],
            "amount_paid": item['carpenter_price'] * 0.5,  # Partial payment
            "bill_type": "credit",
            "customer_name": "Test Customer",
            "customer_phone": "9876543210"
        }
        
        success, response = self.run_test(
            "Create credit bill",
            "POST",
            "bills",
            200,
            data=bill_data
        )
        if success and 'id' in response:
            self.created_bills.append(response['id'])
            print(f"   Bill number: {response.get('bill_number', 'N/A')}")
            print(f"   Remaining balance: ₹{response.get('remaining_balance', 0)}")
        return success

    def test_get_bills(self):
        """Test getting all bills"""
        success, response = self.run_test(
            "Get all bills",
            "GET",
            "bills",
            200
        )
        if success:
            print(f"   Found {len(response)} bills")
        return success

    def test_today_stats(self):
        """Test getting today's statistics"""
        success, response = self.run_test(
            "Get today's statistics",
            "GET",
            "bills/today-stats",
            200
        )
        if success:
            print(f"   Today's sales: ₹{response.get('today_sales', 0)}")
            print(f"   Today's profit: ₹{response.get('today_profit', 0)}")
            print(f"   Outstanding: ₹{response.get('outstanding_amount', 0)}")
            print(f"   Bills count: {response.get('bills_count', 0)}")
        return success

    def test_delete_item(self):
        """Test deleting an item"""
        if not self.created_items:
            print("❌ No items to delete")
            return False
            
        item_id = self.created_items.pop()  # Remove from list
        success, response = self.run_test(
            "Delete item",
            "DELETE",
            f"items/{item_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Shop Billing System API Tests")
    print("=" * 50)
    
    tester = ShopBillingAPITester()
    
    # Authentication Tests
    print("\n📋 AUTHENTICATION TESTS")
    print("-" * 30)
    if not tester.test_login_valid():
        print("❌ Login failed, stopping tests")
        return 1
    
    tester.test_login_invalid()
    tester.test_auth_verify()
    
    # Item Management Tests
    print("\n📦 ITEM MANAGEMENT TESTS")
    print("-" * 30)
    tester.test_create_item()
    tester.test_get_items()
    tester.test_search_items()
    tester.test_update_item()
    
    # Bill Management Tests
    print("\n🧾 BILL MANAGEMENT TESTS")
    print("-" * 30)
    tester.test_create_bill_paid()
    tester.test_create_bill_credit()
    tester.test_get_bills()
    tester.test_today_stats()
    
    # Cleanup Tests
    print("\n🧹 CLEANUP TESTS")
    print("-" * 30)
    tester.test_delete_item()
    
    # Final Results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())