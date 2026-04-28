import { Routes, Route } from "react-router-dom";
import Home from "./Home";
import Customer from "./pages/Customer";
import Chef from "./pages/Chef";
import Admin from "./pages/Admin";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./pages/customer/Profile";
import Orders from "./pages/chef/Orders";
import Daily from "./pages/chef/Daily";
import Subscription from "./pages/chef/Subscription";
import Ready from "./pages/chef/Ready";

import CustomerDaily from "./pages/customer/Daily";
import CustomerSubscription from "./pages/customer/Subscription";
import CustomerReady from "./pages/customer/Ready";
import Cart from "./pages/customer/Cart";

function App() {
  return (
    <Routes>

      <Route path="/" element={<Home />} />

      {/* CUSTOMER */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute role="customer">
            <Customer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/profile"
        element={
          <ProtectedRoute role="customer">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/daily"
        element={
          <ProtectedRoute role="customer">
            <CustomerDaily />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/subscription"
        element={
          <ProtectedRoute role="customer">
            <CustomerSubscription />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/ready"
        element={
          <ProtectedRoute role="customer">
            <CustomerReady />
          </ProtectedRoute>
        }
      />

      <Route
        path="/customer/cart"
        element={
          <ProtectedRoute role="customer">
            <Cart />
          </ProtectedRoute>
        }
      />

      {/* CHEF */}
      <Route
        path="/chef"
        element={
          <ProtectedRoute role="chef">
            <Chef />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chef/daily"
        element={
          <ProtectedRoute role="chef">
            <Daily />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chef/subscription"
        element={
          <ProtectedRoute role="chef">
            <Subscription />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chef/ready"
        element={
          <ProtectedRoute role="chef">
            <Ready />
          </ProtectedRoute>
        }
      />

      <Route
        path="/chef/orders"
        element={
          <ProtectedRoute role="chef">
            <Orders />
          </ProtectedRoute>
        }
      />
      
      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Admin />
          </ProtectedRoute>
        }
      />

<Route path="/customer/cart/:type" element={
  <ProtectedRoute role="customer">
    <Cart />
  </ProtectedRoute>
} />
    </Routes>
  );
}

export default App;