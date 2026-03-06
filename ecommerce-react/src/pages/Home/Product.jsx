import { formatMoney } from "../../utils/money";
import api from "../../utils/api";
import { useState } from "react";

export function Product({ product, loadCart }) {
  const [quantity, setQuantity] = useState(1);

   const addToCart = async () => {
    try {
      console.log('🛒 Adding to cart:', product.id);
      await api.post("/api/cart-items", {
        productId: product.id,
        quantity: quantity,
      });
      console.log('✅ Added to cart');
      await loadCart();
    } catch (error) {
      console.error('❌ Error adding to cart:', error.message);
      alert('Failed to add to cart: ' + error.message);
    }
  };

  const selectQuantity = (event) => {
    const quantitySelected = Number(event.target.value);
    setQuantity(quantitySelected);
  };
  
  return (
    <div class="product-container">
      <div class="product-image-container">
        <img class="product-image" src={product.image} />
      </div>

      <div class="product-name limit-text-to-2-lines">{product.name}</div>

      <div class="product-rating-container">
        <img
          class="product-rating-stars"
          src={`images/ratings/rating-${product.rating.stars * 10}.png`}
        />
        <div class="product-rating-count link-primary">
          {product.rating.count}
        </div>
      </div>

      <div class="product-price">{formatMoney(product.priceCents)}</div>

      <div class="product-quantity-container">
        <select value={quantity} onChange={selectQuantity}>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
      </div>

      <div class="product-spacer"></div>

      <div class="added-to-cart">
        <img src="images/icons/checkmark.png" />
        Added
      </div>

      <button class="add-to-cart-button button-primary" onClick={addToCart}>
        Add to Cart
      </button>
    </div>
  );
}
