import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Authentication context
const AuthContext = React.createContext();

// Login Component
const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shop Billing System</h1>
          <p className="text-gray-600 mt-2">Hardware & Electrical Store</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-green-100 rounded-lg p-6 border-l-4 border-green-500">
        <h3 className="text-lg font-semibold text-green-800">Today's Sales</h3>
        <p className="text-3xl font-bold text-green-900">₹{stats.today_sales?.toFixed(2) || 0}</p>
      </div>
      <div className="bg-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-blue-800">Today's Profit</h3>
        <p className="text-3xl font-bold text-blue-900">₹{stats.today_profit?.toFixed(2) || 0}</p>
      </div>
      <div className="bg-orange-100 rounded-lg p-6 border-l-4 border-orange-500">
        <h3 className="text-lg font-semibold text-orange-800">Outstanding</h3>
        <p className="text-3xl font-bold text-orange-900">₹{stats.outstanding_amount?.toFixed(2) || 0}</p>
      </div>
      <div className="bg-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
        <h3 className="text-lg font-semibold text-purple-800">Bills Today</h3>
        <p className="text-3xl font-bold text-purple-900">{stats.bills_count || 0}</p>
      </div>
    </div>
  );
};

// Item Management Component
const ItemManagement = () => {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    cost_price: "",
    customer_price: "",
    carpenter_price: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = {
        ...formData,
        cost_price: parseFloat(formData.cost_price),
        customer_price: parseFloat(formData.customer_price),
        carpenter_price: parseFloat(formData.carpenter_price)
      };

      if (editingItem) {
        await axios.put(`${API}/items/${editingItem.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/items`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setFormData({ name: "", cost_price: "", customer_price: "", carpenter_price: "" });
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      cost_price: item.cost_price.toString(),
      customer_price: item.customer_price.toString(),
      carpenter_price: item.carpenter_price.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API}/items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Item Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingItem ? "Edit Item" : "Add New Item"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.customer_price}
                onChange={(e) => setFormData(prev => ({ ...prev, customer_price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carpenter Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={formData.carpenter_price}
                onChange={(e) => setFormData(prev => ({ ...prev, carpenter_price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md mr-2"
              >
                {editingItem ? "Update Item" : "Add Item"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({ name: "", cost_price: "", customer_price: "", carpenter_price: "" });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carpenter Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.cost_price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.customer_price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.carpenter_price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Bill Generation Component
const BillGeneration = ({ onBillCreated }) => {
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pricingMode, setPricingMode] = useState("customer");
  const [billType, setBillType] = useState("paid");
  const [customerDetails, setCustomerDetails] = useState({ name: "", phone: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [amountPaid, setAmountPaid] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const addItemToBill = (item) => {
    const salePrice = pricingMode === "customer" ? item.customer_price : item.carpenter_price;
    const newItem = {
      item_id: item.id,
      item_name: item.name,
      cost_price: item.cost_price,
      sale_price: salePrice,
      quantity: 1,
      subtotal: salePrice,
      profit: salePrice - item.cost_price
    };
    
    const existingIndex = selectedItems.findIndex(si => si.item_id === item.id);
    if (existingIndex >= 0) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].subtotal = updated[existingIndex].sale_price * updated[existingIndex].quantity;
      updated[existingIndex].profit = (updated[existingIndex].sale_price - updated[existingIndex].cost_price) * updated[existingIndex].quantity;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const updateItemQuantity = (index, quantity) => {
    const updated = [...selectedItems];
    updated[index].quantity = Math.max(1, quantity);
    updated[index].subtotal = updated[index].sale_price * updated[index].quantity;
    updated[index].profit = (updated[index].sale_price - updated[index].cost_price) * updated[index].quantity;
    setSelectedItems(updated);
  };

  const updateItemPrice = (index, price) => {
    const updated = [...selectedItems];
    updated[index].sale_price = Math.max(0, price);
    updated[index].subtotal = updated[index].sale_price * updated[index].quantity;
    updated[index].profit = (updated[index].sale_price - updated[index].cost_price) * updated[index].quantity;
    setSelectedItems(updated);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalProfit = selectedItems.reduce((sum, item) => sum + item.profit, 0);
  const finalAmountPaid = amountPaid ? parseFloat(amountPaid) : totalAmount;

  const generateBill = async () => {
    if (selectedItems.length === 0) {
      alert("Please add items to the bill");
      return;
    }

    if (billType === "credit" && (!customerDetails.name || !customerDetails.phone)) {
      alert("Please enter customer details for credit bills");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const billData = {
        items: selectedItems,
        pricing_mode: pricingMode,
        total_amount: totalAmount,
        amount_paid: finalAmountPaid,
        bill_type: billType,
        customer_name: billType === "credit" ? customerDetails.name : null,
        customer_phone: billType === "credit" ? customerDetails.phone : null
      };

      await axios.post(`${API}/bills`, billData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setSelectedItems([]);
      setCustomerDetails({ name: "", phone: "" });
      setAmountPaid("");
      onBillCreated();
      alert("Bill generated successfully!");
    } catch (error) {
      console.error("Error generating bill:", error);
      alert("Error generating bill. Please try again.");
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Generate Bill</h2>
        
        {/* Pricing Mode Toggle */}
        <div className="flex space-x-2">
          <button
            onClick={() => setPricingMode("customer")}
            className={`px-4 py-2 rounded-md ${pricingMode === "customer" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Customer
          </button>
          <button
            onClick={() => setPricingMode("carpenter")}
            className={`px-4 py-2 rounded-md ${pricingMode === "carpenter" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            Carpenter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Items</h3>
          
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="bg-white rounded-lg shadow max-h-96 overflow-y-auto">
            {filteredItems.map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-200 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    Price: ₹{pricingMode === "customer" ? item.customer_price.toFixed(2) : item.carpenter_price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => addItemToBill(item)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bill Summary</h3>
          
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {selectedItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items selected</p>
            ) : (
              <>
                {selectedItems.map((item, index) => (
                  <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.item_name}</h4>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="block text-gray-600">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.sale_price}
                          onChange={(e) => updateItemPrice(index, parseFloat(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-600">Total</label>
                        <p className="px-2 py-1 text-center font-medium">₹{item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-1">Profit: ₹{item.profit.toFixed(2)}</p>
                  </div>
                ))}

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span>Total Profit:</span>
                    <span>₹{totalProfit.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment Details */}
          {selectedItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h4 className="font-semibold">Payment Details</h4>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="paid"
                    checked={billType === "paid"}
                    onChange={(e) => setBillType(e.target.value)}
                    className="mr-2"
                  />
                  Paid
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="credit"
                    checked={billType === "credit"}
                    onChange={(e) => setBillType(e.target.value)}
                    className="mr-2"
                  />
                  Credit
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                <input
                  type="number"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={`Default: ₹${totalAmount.toFixed(2)}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {billType === "credit" && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  {finalAmountPaid < totalAmount && (
                    <div className="text-sm text-orange-600">
                      Remaining Balance: ₹{(totalAmount - finalAmountPaid).toFixed(2)}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={generateBill}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
              >
                Generate Bill
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchStats();
    }
    setLoading(false);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/bills/today-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    fetchStats();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setActiveTab("dashboard");
  };

  const handleBillCreated = () => {
    fetchStats();
    setActiveTab("dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shop Billing System</h1>
              <p className="text-sm text-gray-600">Hardware & Electrical Store</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.username}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "billing", label: "Generate Bill" },
              { id: "items", label: "Items" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
            <Dashboard stats={stats} />
          </div>
        )}
        
        {activeTab === "billing" && (
          <BillGeneration onBillCreated={handleBillCreated} />
        )}
        
        {activeTab === "items" && <ItemManagement />}
      </main>
    </div>
  );
};

export default App;