import { formatMoney } from "../../utils/money";
import api from "../../utils/api";
import dayjs from "dayjs";

export function DeliveryOption({ deliveryOption, items,loadCart }) {
  return (
    <div class="delivery-options">
      <div class="delivery-options-title">Choose a delivery option:</div>

      {deliveryOption.map((deliveryOption) => {
        let priceString = "FREE Shipping";
        if (deliveryOption.priceCents > 0) {
          priceString = `${formatMoney(deliveryOption.priceCents)} - Shipping`;
        }
        const updateDeliveryOption = async() => {
          try {
            console.log('📦 Updating delivery option:', deliveryOption.id);
            await api.put(`/api/cart-items/${items.productId}`, {
              deliveryOptionId: deliveryOption.id
            });
            console.log('✅ Delivery option updated');
            await loadCart();
          } catch (error) {
            console.error('❌ Error updating delivery option:', error.message);
            alert('Failed to update delivery option: ' + error.message);
          }
        }
        return (
          <div key={deliveryOption.id} class="delivery-option " onClick={updateDeliveryOption}>
            <input
              type="radio"
              onChange={() => {}}
              checked={deliveryOption.id === items.deliveryOptionId}
              class="delivery-option-input"
              name={`delivery-option-${items.productId}`}
            />
            <div>
              <div class="delivery-option-date">
                {dayjs(deliveryOption.estimatedDeliveryTimeMs).format(
                  "dddd, MMMM D",
                )}
              </div>
              <div class="delivery-option-price">{priceString}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
