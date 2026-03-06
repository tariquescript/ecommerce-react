import api from "../../utils/api";
import { useState, useEffect } from "react";
import { Header } from "../../components/Header/Header";
import { ProductGrid } from "../../pages/Home/ProductGrid";
// import { formatMoney } from "../../utils/money";
// import { products } from "../../../products.js";
import "./Home.css";

export function Home({ cartItems, loadCart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchproducts() {
      const response = await api.get("/api/products");
      setProducts(response.data);
    }
    fetchproducts();
  }, []);

  return (
    <>
      <Header cartItems={cartItems} />
      <div class="home-page">
        <ProductGrid products={products} loadCart={loadCart} />
      </div>
    </>
  );
}
