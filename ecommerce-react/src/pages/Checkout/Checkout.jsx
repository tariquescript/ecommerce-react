import { useState, useEffect } from "react";
import api from "../../utils/api";
import { Header } from "../../components/Header/Header";

import "./Checkout.css";
import { OrderSummary } from "./OrderSummary";
import { PaymentSummary } from "./PaymentSummary";
// import './CheckoutHeaders.css'

export function Checkout({ cartItems, loadCart }) {
  const [deliveryOption, setDeliveryOption] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);

  useEffect(() => {
    const fetchCheckoutData = async () => {
      let response = await api.get(
        "/api/delivery-options?expand=estimatedDeliveryTime",
      );
      setDeliveryOption(response.data);

      response = await api.get("/api/payment-summary");
      setPaymentSummary(response.data);
    };

    fetchCheckoutData();
  }, [cartItems]);

  return (
    <>
      {/* <div class="checkout-header">
        <div class="header-content">
          <div class="checkout-header-left-section">
            <a href="index.html">
              <img class="logo" src="images/logo.png" />
              <img class="mobile-logo" src="images/mobile-logo.png" />
            </a>
          </div>

          <div class="checkout-header-middle-section">
            Checkout (
            <a class="return-to-home-link" href="index.html">
              3 items
            </a>
            )
          </div>

          <div class="checkout-header-right-section">
            <img src="images/icons/checkout-lock-icon.png" />
          </div>
        </div>
      </div> */}

      <Header cartItems={cartItems} />

      <div class="checkout-page">
        <div class="page-title">Review your order</div>

        <div class="checkout-grid">
          <OrderSummary cartItems={cartItems} deliveryOption={deliveryOption} loadCart={loadCart} />

          <PaymentSummary paymentSummary={paymentSummary} loadCart={loadCart} />
        </div>
      </div>
      {/* </div> */}
    </>
  );
}
