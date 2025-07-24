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

// Enhanced Dashboard Component with Period Selection
const Dashboard = ({ stats, onPeriodChange, selectedPeriod }) => {
  const periods = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
              selectedPeriod === period.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-green-100 rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-green-800">Total Sales</h3>
          <p className="text-3xl font-bold text-green-900">₹{stats.total_sales?.toFixed(2) || 0}</p>
          <p className="text-sm text-green-700 mt-1">{stats.bills_count || 0} bills</p>
        </div>
        <div className="bg-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-blue-800">Total Profit</h3>
          <p className="text-3xl font-bold text-blue-900">₹{stats.total_profit?.toFixed(2) || 0}</p>
          <p className="text-sm text-blue-700 mt-1">{stats.profit_margin?.toFixed(1) || 0}% margin</p>
        </div>
        <div className="bg-orange-100 rounded-lg p-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-semibold text-orange-800">Outstanding</h3>
          <p className="text-3xl font-bold text-orange-900">₹{stats.outstanding_amount?.toFixed(2) || 0}</p>
          <p className="text-sm text-orange-700 mt-1">{stats.credit_bills_count || 0} credit bills</p>
        </div>
        <div className="bg-purple-100 rounded-lg p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-purple-800">Avg Bill Amount</h3>
          <p className="text-3xl font-bold text-purple-900">₹{stats.average_bill_amount?.toFixed(2) || 0}</p>
          <p className="text-sm text-purple-700 mt-1">Per transaction</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Bills:</span>
              <span className="font-medium">₹{stats.paid_bills_amount?.toFixed(2) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Bills:</span>
              <span className="font-medium">₹{stats.credit_bills_amount?.toFixed(2) || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collection Rate:</span>
              <span className="font-medium">
                {stats.total_sales > 0 ? ((stats.paid_bills_amount || 0) / stats.total_sales * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Bill Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Bills:</span>
              <span className="font-medium">{stats.paid_bills_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Bills:</span>
              <span className="font-medium">{stats.credit_bills_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Bills:</span>
              <span className="font-medium">{stats.bills_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Item Management Component with Import/Export
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
  const [importing, setImporting] = useState(false);

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

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('file', file);

      await axios.post(`${API}/items/import`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert("Items imported successfully!");
      fetchItems();
    } catch (error) {
      alert(`Import failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/items/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'items_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Export failed: " + error.message);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Item Management</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className={`px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md cursor-pointer text-sm ${importing ? 'opacity-50' : ''}`}
          >
            {importing ? "Importing..." : "Import CSV/Excel"}
          </label>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
          >
            {showForm ? "Cancel" : "Add Item"}
          </button>
        </div>
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
        <div className="overflow-x-auto">
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
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.cost_price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.customer_price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.carpenter_price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
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
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    name: "",
    cost_price: "",
    customer_price: "",
    carpenter_price: ""
  });

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

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const data = {
        ...quickAddData,
        cost_price: parseFloat(quickAddData.cost_price),
        customer_price: parseFloat(quickAddData.customer_price),
        carpenter_price: parseFloat(quickAddData.carpenter_price)
      };

      await axios.post(`${API}/items`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQuickAddData({ name: "", cost_price: "", customer_price: "", carpenter_price: "" });
      setShowQuickAdd(false);
      fetchItems();
      alert("Item added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Error adding item. Please try again.");
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
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-bold">Generate Bill</h2>
        
        <div className="flex flex-wrap gap-2">
          {/* Pricing Mode Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setPricingMode("customer")}
              className={`px-4 py-2 rounded-md text-sm ${pricingMode === "customer" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Customer
            </button>
            <button
              onClick={() => setPricingMode("carpenter")}
              className={`px-4 py-2 rounded-md text-sm ${pricingMode === "carpenter" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            >
              Carpenter
            </button>
          </div>
          
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
          >
            Quick Add Item
          </button>
        </div>
      </div>

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Add Item</h3>
          <form onSubmit={handleQuickAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={quickAddData.name}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
              <input
                type="number"
                step="0.01"
                value={quickAddData.cost_price}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, cost_price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Price</label>
              <input
                type="number"
                step="0.01"
                value={quickAddData.customer_price}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, customer_price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carpenter Price</label>
              <input
                type="number"
                step="0.01"
                value={quickAddData.carpenter_price}
                onChange={(e) => setQuickAddData(prev => ({ ...prev, carpenter_price: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md mr-2"
              >
                Add Item
              </button>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

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
                  <p className="text-xs text-gray-500">
                    Profit: ₹{(pricingMode === "customer" ? item.customer_price - item.cost_price : item.carpenter_price - item.cost_price).toFixed(2)}
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
            {filteredItems.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No items found
              </div>
            )}
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
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{item.item_name}</h4>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <label className="block text-gray-600 text-xs">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 text-xs">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.sale_price}
                            onChange={(e) => updateItemPrice(index, parseFloat(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-600 text-xs">Total</label>
                          <p className="px-2 py-1 text-center font-medium text-xs">₹{item.subtotal.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 mt-1">Profit: ₹{item.profit.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

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
                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
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

// Bill History Component
const BillHistory = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('bill_type', filterType);

      const response = await axios.get(`${API}/bills?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBills(response.data);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchBills();
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filterType]);

  const handleEdit = (bill) => {
    setSelectedBill(bill);
    setShowEditModal(true);
  };

  const handleDelete = async (billId) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API}/bills/${billId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchBills();
        alert("Bill deleted successfully!");
      } catch (error) {
        console.error("Error deleting bill:", error);
        alert("Error deleting bill. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bill History</h2>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Search by customer name, phone, bill number, or item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Bill Types</option>
          <option value="paid">Paid Bills</option>
          <option value="credit">Credit Bills</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.bill_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(bill.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.customer_name || 'Walk-in'}
                      {bill.customer_phone && (
                        <div className="text-xs text-gray-500">{bill.customer_phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{bill.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ₹{bill.profit.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.bill_type === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {bill.bill_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bill.bill_type === 'credit' && bill.remaining_balance > 0 ? (
                        <span className="text-red-600">₹{bill.remaining_balance.toFixed(2)}</span>
                      ) : (
                        <span className="text-green-600">Paid</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(bill)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                      No bills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {showEditModal && selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Bill Details - {selectedBill.bill_number}</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Date:</strong> {new Date(selectedBill.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Type:</strong> <span className={`px-2 py-1 rounded text-sm ${
                      selectedBill.bill_type === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>{selectedBill.bill_type}</span>
                  </div>
                  {selectedBill.customer_name && (
                    <>
                      <div>
                        <strong>Customer:</strong> {selectedBill.customer_name}
                      </div>
                      <div>
                        <strong>Phone:</strong> {selectedBill.customer_phone}
                      </div>
                    </>
                  )}
                  <div>
                    <strong>Total Amount:</strong> ₹{selectedBill.total_amount.toFixed(2)}
                  </div>
                  <div>
                    <strong>Amount Paid:</strong> ₹{selectedBill.amount_paid.toFixed(2)}
                  </div>
                  <div>
                    <strong>Profit:</strong> <span className="text-green-600">₹{selectedBill.profit.toFixed(2)}</span>
                  </div>
                  {selectedBill.remaining_balance > 0 && (
                    <div>
                      <strong>Remaining Balance:</strong> <span className="text-red-600">₹{selectedBill.remaining_balance.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <strong>Items:</strong>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-left">Qty</th>
                          <th className="px-3 py-2 text-left">Price</th>
                          <th className="px-3 py-2 text-left">Total</th>
                          <th className="px-3 py-2 text-left">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBill.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">{item.item_name}</td>
                            <td className="px-3 py-2">{item.quantity}</td>
                            <td className="px-3 py-2">₹{item.sale_price.toFixed(2)}</td>
                            <td className="px-3 py-2">₹{item.subtotal.toFixed(2)}</td>
                            <td className="px-3 py-2 text-green-600">₹{item.profit.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Credit Management Component
const CreditManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedBillId, setSelectedBillId] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/credits/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchCustomerPayments = async (customerPhone) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/credits/payments/${customerPhone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const handlePayment = async (customer) => {
    setSelectedCustomer(customer);
    setSelectedBillId(customer.bills[0]); // Default to first bill
    setShowPaymentModal(true);
    fetchCustomerPayments(customer.customer_phone);
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/credits/payment`, {
        bill_id: selectedBillId,
        amount: parseFloat(paymentAmount),
        notes: paymentNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPaymentAmount("");
      setPaymentNotes("");
      setShowPaymentModal(false);
      fetchCustomers();
      fetchCustomerPayments(selectedCustomer.customer_phone);
      alert("Payment added successfully!");
    } catch (error) {
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Credit Management</h2>
        <div className="text-sm text-gray-600">
          Total Outstanding: ₹{customers.reduce((sum, c) => sum + c.remaining_balance, 0).toFixed(2)}
        </div>
      </div>

      {/* Credit Customers */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bills</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.customer_phone} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.customer_phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{customer.total_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₹{customer.paid_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <span className="text-red-600">₹{customer.remaining_balance.toFixed(2)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.bill_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.last_payment_date ? new Date(customer.last_payment_date).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handlePayment(customer)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Add Payment
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No credit customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add Payment - {selectedCustomer.customer_name}</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Form */}
                <div>
                  <form onSubmit={submitPayment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Bill</label>
                      <select
                        value={selectedBillId}
                        onChange={(e) => setSelectedBillId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        {selectedCustomer.bills.map((billId, index) => (
                          <option key={billId} value={billId}>Bill #{index + 1}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        max={selectedCustomer.remaining_balance}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Max: ₹{selectedCustomer.remaining_balance.toFixed(2)}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                      <textarea
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Payment notes..."
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                      >
                        Add Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentModal(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
                
                {/* Payment History */}
                <div>
                  <h4 className="font-semibold mb-3">Payment History</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {payments.length > 0 ? payments.map((payment) => (
                      <div key={payment.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">₹{payment.amount.toFixed(2)}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                        )}
                      </div>
                    )) : (
                      <p className="text-gray-500 text-sm">No payments found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchStats("today");
    }
    setLoading(false);
  }, []);

  const fetchStats = async (period = "today") => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/analytics/stats`, 
        { period },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    fetchStats("today");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setActiveTab("dashboard");
  };

  const handleBillCreated = () => {
    fetchStats(selectedPeriod);
    setActiveTab("dashboard");
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    fetchStats(period);
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
          <div className="flex space-x-8 overflow-x-auto">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "billing", label: "Generate Bill" },
              { id: "items", label: "Items" },
              { id: "bills", label: "Bill History" },
              { id: "credits", label: "Credits" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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
            <Dashboard 
              stats={stats} 
              onPeriodChange={handlePeriodChange}
              selectedPeriod={selectedPeriod}
            />
          </div>
        )}
        
        {activeTab === "billing" && (
          <BillGeneration onBillCreated={handleBillCreated} />
        )}
        
        {activeTab === "items" && <ItemManagement />}
        
        {activeTab === "bills" && <BillHistory />}
        
        {activeTab === "credits" && <CreditManagement />}
      </main>
    </div>
  );
};

export default App;