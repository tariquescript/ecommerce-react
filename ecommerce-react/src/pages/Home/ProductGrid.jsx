// import { formatMoney } from "../../utils/money";
// import axios from "axios";
// import { useState  } from "react";
import { Product } from "./Product";

export function ProductGrid({ products, loadCart }) {
    
  return (
    <div class="products-grid">
      {products.map((product) => {
        return <Product key={product.id} product={product} loadCart={loadCart} />;
      })}
    </div>
  );
}
