import { useState, useEffect } from "react";
import { Home } from "./pages/Home/Home";
import api from "./utils/api";
import { Checkout } from "./pages/Checkout/Checkout";
import { Orders } from "./pages/Orders/Orders";
import { Tracking } from "./pages/Tracking/Tracking";

import { Routes, Route } from "react-router";
import "./App.css";
// import { Header } from "./components/Header/Header";

function App() {
  const [cartItems, setCartItems] = useState([]);

  async function loadCart() {
    const response = await api.get("/api/cart-items?expand=product");
    setCartItems(response.data);
  }

  useEffect(() => {
    loadCart();
  }, []);

  

  return (
    <Routes>
      <Route path="/" element={<Home cartItems={cartItems} loadCart={loadCart} />} />
      <Route path="/checkout" element={<Checkout cartItems={cartItems} loadCart={loadCart} />} />
      <Route path="/orders" element={<Orders cartItems={cartItems}   />} />
      <Route path="/tracking" element={<Tracking />} />
    </Routes>
  );
}

export default App;
