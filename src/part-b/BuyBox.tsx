import { useState } from "react";
import { copy } from "./copy";
import "./BuyBox.css";

type PurchaseOption = "one-time" | "subscription";

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

function TrustIcon() {
  return (
    <svg
      className="trust-icon"
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
    >
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="m6.5 10 2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BuyBox() {
  const [purchaseOption, setPurchaseOption] =
    useState<PurchaseOption>("subscription");
  const [quantity, setQuantity] = useState(1);
  const [frequency, setFrequency] = useState(
    copy.subscribe.frequencyOptions[0],
  );

  const isSubscription = purchaseOption === "subscription";
  const unitPrice = isSubscription
    ? copy.subscribe.priceCents
    : copy.oneTime.priceCents;
  const totalPrice = unitPrice * quantity;

  return (
    <main className="buy-box-page">
      <section className="buy-box" aria-label={`${copy.title} purchase options`}>
        <div className="buy-box-image">
          <img src="/product.jpg" alt={`${copy.title} supplement bottle`} />
        </div>

        <div className="buy-box-details">
          <header className="buy-box-product-header">
            <p className="buy-box-eyebrow">{copy.eyebrow}</p>
            <div className="buy-box-rating" aria-label={`${copy.rating} out of 5 stars`}>
              <span className="rating-stars" aria-hidden="true">
                ★★★★★
              </span>
              <strong>{copy.rating}</strong>
              <a href="#reviews">{copy.reviewCount}</a>
            </div>
            <h1>{copy.title}</h1>
            <p className="buy-box-subtitle">{copy.subtitle}</p>
          </header>

          <fieldset className="purchase-options">
            <legend className="visually-hidden">Choose a purchase option</legend>
            <label
              className={`purchase-option ${
                !isSubscription ? "purchase-option-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="purchase-option"
                value="one-time"
                checked={!isSubscription}
                onChange={() => setPurchaseOption("one-time")}
              />
              <span className="custom-radio" aria-hidden="true" />
              <span className="option-label">{copy.oneTime.label}</span>
              <span className="option-price">
                {formatPrice(copy.oneTime.priceCents)}
              </span>
            </label>

            <label
              className={`purchase-option purchase-option-subscription ${
                isSubscription ? "purchase-option-selected" : ""
              }`}
            >
              <input
                type="radio"
                name="purchase-option"
                value="subscription"
                checked={isSubscription}
                onChange={() => setPurchaseOption("subscription")}
              />
              <span className="custom-radio" aria-hidden="true" />
              <span className="option-label">{copy.subscribe.label}</span>
              <span className="option-badge">{copy.subscribe.badge}</span>
              <span className="option-price">
                {formatPrice(copy.subscribe.priceCents)}
                <del>{formatPrice(copy.subscribe.comparePriceCents)}</del>
              </span>

              <span className="subscription-option-details">
                <span className="frequency-control">
                  <span>{copy.subscribe.frequencyLabel}</span>
                  <select
                    aria-label="Delivery frequency"
                    value={frequency}
                    onChange={(event) => setFrequency(event.target.value)}
                  >
                    {copy.subscribe.frequencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </span>
                <span className="subscription-perks">
                  {copy.subscribe.perks.map((perk) => (
                    <span className="subscription-perk" key={perk}>
                      <span className="perk-check" aria-hidden="true">
                        ✓
                      </span>
                      {perk}
                    </span>
                  ))}
                </span>
              </span>
            </label>
          </fieldset>

          <div className="buy-box-actions">
            <div className="quantity-control" aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
              >
                −
              </button>
              <output aria-live="polite" aria-label={`Quantity: ${quantity}`}>
                {quantity}
              </output>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => current + 1)}
              >
                +
              </button>
            </div>
            <button type="button" className="add-to-cart">
              <span>{copy.addToCart}</span>
              <span className="cart-price-separator" aria-hidden="true">
                ·
              </span>
              <span>{formatPrice(totalPrice)}</span>
            </button>
          </div>

          <ul className="buy-box-trust">
            {copy.trust.map((item) => (
              <li key={item}>
                <TrustIcon />
                {item}
              </li>
            ))}
          </ul>

          {isSubscription && (
            <p className="buy-box-fine-print">
              Your subscription renews every {frequency} at{" "}
              {formatPrice(copy.subscribe.priceCents)} until you cancel. Skip or
              cancel anytime from your account.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
