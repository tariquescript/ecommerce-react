import dayjs from "dayjs";
import api from "../../utils/api";
import { formatMoney } from "../../utils/money";
import "./Checkout.css";
import { DeliveryOption } from "./DeliveryOption";

export function OrderSummary({ cartItems, deliveryOption, loadCart }) {
  return (
    <div class="order-summary">
      {deliveryOption.length > 0 &&
        cartItems.map((items) => {
          const selectedDeliveryOption = deliveryOption.find(
            (deliveryOption) => {
              return deliveryOption.id === items.deliveryOptionId;
            },
          );

          const deleteCartItem = async() => {
            await api.delete(`/api/cart-items/${items.productId}`);
            await loadCart();
          }

          return (
            <div class="cart-item-container">
              <div class="delivery-date">
                Delivery date:{" "}
                {dayjs(selectedDeliveryOption.estimatedDeliveryTimeMs).format(
                  "dddd, MMMM D",
                )}
              </div>

              <div class="cart-item-details-grid">
                <img class="product-image" src={items.product.image} />

                <div class="cart-item-details">
                  <div class="product-name">{items.product.name}</div>
                  <div class="product-price">
                    {formatMoney(items.product.priceCents)}
                  </div>
                  <div class="product-quantity">
                    <span>
                      Quantity:{" "}
                      <span class="quantity-label">{items.quantity}</span>
                    </span>
                    <span class="update-quantity-link link-primary">
                      Update
                    </span>
                    <span class="delete-quantity-link link-primary" onClick={deleteCartItem}>
                      Delete
                    </span>
                  </div>
                </div>

                <DeliveryOption deliveryOption={deliveryOption} items={items} loadCart={loadCart} />
              </div>
            </div>
          );
        })}
    </div>
  );
}
