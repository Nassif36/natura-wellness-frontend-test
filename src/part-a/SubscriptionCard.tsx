import { useCallback, useEffect, useState } from "react";
import { ApiError, type Subscription } from "../api/types";
import { getSubscription, skipNextShipment } from "../api/mockApi";
import "./SubscriptionCard.css";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));

const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return "This subscription changed while you were viewing it. Refresh the details before trying again.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "We couldn't find this subscription. Please try again or contact customer care.";
  }
  return "We couldn't load your subscription right now. Check your connection and try again.";
}

export function SubscriptionCard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkipping, setIsSkipping] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);
    try {
      setSubscription(await getSubscription());
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const confirmSkip = async () => {
    if (!subscription?.nextChargeAt || isSkipping) return;

    setIsSkipping(true);
    setActionError(null);
    setNotice(null);
    setShowConfirmation(false);
    try {
      const updated = await skipNextShipment({
        subscriptionId: subscription.id,
        expectedUpdatedAt: subscription.updatedAt,
      });
      setSubscription(updated);
      setNotice("Shipment skipped. Your next charge date has been updated.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setActionError(
          "This subscription changed while you were viewing it, so your shipment wasn't skipped. Refresh the details before trying again.",
        );
      } else {
        setActionError(
          "Your shipment wasn't skipped. Please try again when you're ready.",
        );
      }
    } finally {
      setIsSkipping(false);
    }
  };

  if (isLoading && !subscription) {
    return (
      <main className="subscription-page">
        <section className="subscription-card subscription-loading" aria-live="polite">
          <span className="subscription-eyebrow">YOUR ACCOUNT</span>
          <h1>Manage your subscription</h1>
          <p>Loading your subscription details…</p>
        </section>
      </main>
    );
  }

  if (!subscription) {
    return (
      <main className="subscription-page">
        <section className="subscription-card subscription-error" aria-live="polite">
          <span className="subscription-eyebrow">YOUR ACCOUNT</span>
          <h1>Manage your subscription</h1>
          <p>{loadError ?? "Your subscription details are unavailable."}</p>
          <button className="subscription-button" onClick={() => void loadSubscription()}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  const isActive = subscription.status === "active";
  const statusLabel =
    subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1);
  const nextChargeDate = subscription.nextChargeAt
    ? formatDate(subscription.nextChargeAt)
    : null;

  return (
    <main className="subscription-page">
      <section className="subscription-card" aria-labelledby="subscription-title">
        <header className="subscription-header">
          <div>
            <span className="subscription-eyebrow">YOUR ACCOUNT</span>
            <h1 id="subscription-title">Manage your subscription</h1>
          </div>
          <span className={`subscription-status status-${subscription.status}`}>
            <span className="status-dot" aria-hidden="true" />
            {statusLabel}
          </span>
        </header>

        {isActive && nextChargeDate && subscription.nextChargeTotalCents !== null && (
          <section className="next-shipment" aria-label="Next shipment">
            <span className="section-label">YOUR NEXT SHIPMENT</span>
            <div className="shipment-summary">
              <div>
                <span className="summary-label">Ships &amp; charges on</span>
                <strong className="shipment-date">{nextChargeDate}</strong>
              </div>
              <div className="shipment-total">
                <span className="summary-label">You’ll pay</span>
                <strong>{formatPrice(subscription.nextChargeTotalCents)}</strong>
              </div>
            </div>
          </section>
        )}

        {subscription.status === "paused" && subscription.pausedUntil && (
          <div className="subscription-state-message">
            <strong>Your subscription is paused</strong>
            <span>
              No shipments or charges while paused. Your pause is scheduled through{" "}
              {formatDate(subscription.pausedUntil)}.
            </span>
          </div>
        )}

        {subscription.status === "cancelled" && subscription.cancelledAt && (
          <div className="subscription-state-message">
            <strong>Your subscription has been cancelled</strong>
            <span>
              Cancelled on {formatDate(subscription.cancelledAt)}. You won’t receive
              or be charged for future shipments.
            </span>
          </div>
        )}

        <section className="subscription-products" aria-labelledby="products-title">
          <div className="products-heading">
            <h2 id="products-title">In your subscription</h2>
            <span>Every {subscription.intervalDays} days</span>
          </div>
          <ul className="product-list">
            {subscription.items.map((item) => (
              <li className="subscription-product" key={item.sku}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="product-thumbnail" />
                ) : (
                  <div className="product-thumbnail product-placeholder" aria-hidden="true">
                    NW
                  </div>
                )}
                <span className="product-name">{item.name}</span>
                <span className="product-quantity">Qty {item.quantity}</span>
              </li>
            ))}
          </ul>
        </section>

        {isActive && (
          <div className="skip-section">
            {notice && (
              <p className="subscription-notice" role="status">
                <span aria-hidden="true">✓</span> {notice}
              </p>
            )}
            {actionError && (
              <div className="subscription-action-error" role="alert">
                <p>{actionError}</p>
                {actionError.includes("Refresh the details") ? (
                  <button
                    className="text-button"
                    onClick={() => void loadSubscription()}
                    disabled={isLoading}
                  >
                    {isLoading ? "Refreshing…" : "Refresh subscription"}
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => setShowConfirmation(true)}
                    disabled={isSkipping}
                  >
                    Try skipping again
                  </button>
                )}
              </div>
            )}
            <button
              className="skip-button"
              onClick={() => setShowConfirmation(true)}
              disabled={isSkipping || isLoading}
            >
              {isSkipping ? "Skipping shipment…" : "Skip next shipment"}
            </button>
            <p className="skip-caption">
              Your next charge will move to the following {subscription.intervalDays}-day cycle.
            </p>
          </div>
        )}

        {loadError && subscription && (
          <p className="inline-load-error" role="alert">
            {loadError}{" "}
            <button className="text-button" onClick={() => void loadSubscription()}>
              Try refreshing
            </button>
          </p>
        )}
      </section>

      {showConfirmation && nextChargeDate && subscription.nextChargeAt && (
        <div
          className="confirmation-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowConfirmation(false);
          }}
        >
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="skip-dialog-title"
            aria-describedby="skip-dialog-description"
          >
            <span className="subscription-eyebrow">PLEASE CONFIRM</span>
            <h2 id="skip-dialog-title">Skip this shipment?</h2>
            <p id="skip-dialog-description">
              We won’t ship or charge you on {nextChargeDate}. Your next shipment and
              charge will move to{" "}
              {formatDate(
                new Date(
                  Date.parse(subscription.nextChargeAt) +
                    subscription.intervalDays * 24 * 60 * 60 * 1000,
                ).toISOString(),
              )}
              .
            </p>
            <div className="confirmation-actions">
              <button
                className="cancel-skip-button"
                onClick={() => setShowConfirmation(false)}
                disabled={isSkipping}
              >
                Keep this shipment
              </button>
              <button
                className="subscription-button"
                onClick={() => void confirmSkip()}
                disabled={isSkipping}
              >
                {isSkipping ? "Skipping…" : "Yes, skip shipment"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
