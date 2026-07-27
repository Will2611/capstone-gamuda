import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// const IsDev = import.meta.env.VITE_IS_DEV;

function PWABadge({ children }: { children: ReactNode }) {
  // check for updates every hour
  const period = 60 * 60 * 1000;
  // Mounting

  useState<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r) {
        if (r?.active?.state === "activated") {
          registerPeriodicSync(period, swUrl, r);
          requestNotificationPermission(r);
        } else if (r?.installing) {
          r.installing.addEventListener("statechange", (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === "activated") {
              registerPeriodicSync(period, swUrl, r);
              requestNotificationPermission(r);
            }
          });
        }
      }
    },
    onRegisterError(err) {
      console.log("Error registering Service Worker", err);
    },
  });

  function close() {
    // setOfflineReady(false);
    setNeedRefresh(false);
  }
  const display = useMemo(() => {
    return needRefresh || true;
  }, [needRefresh]);
  return (
    <>
      {children}
      <div
        className="sticky bottom-0 right-0 z-10 bg-gray-200 shadow-lg p-4 border border-red-100 opacity-50 hover:opacity-100"
        role="alert"
        aria-labelledby="toast-message"
      >
        {/* <span>Is it Offline :{`${isOffline}`}</span> */}
        {display && (
          <div className="PWABadge-toast">
            <div className="text-right">
              <span id="toast-message">
                New content available, click on reload button to update.
              </span>
            </div>
            <div className="text-right px-4">
              <button className="p-4" onClick={() => updateServiceWorker(true)}>
                Reload
              </button>
              <button
                className="bg-black-600 text-white-600"
                onClick={() => close()}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default PWABadge;

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(
  period: number,
  swUrl: string,
  r: ServiceWorkerRegistration,
) {
  if (period <= 0) return;

  setInterval(async () => {
    if ("onLine" in navigator && !navigator.onLine) return;

    const resp = await fetch(swUrl, {
      cache: "no-store",
      headers: {
        cache: "no-store",
        "cache-control": "no-cache",
      },
    });

    if (resp?.status === 200) await r.update();
  }, period);
}

// src/App.tsx or a dedicated hook
const requestNotificationPermission = async (
  registration: ServiceWorkerRegistration | undefined,
) => {
  if (!registration) return;
  if (!("Notification" in window)) return;
  // if (!import.meta.env.VITE_VAPID_PUB_KEY) return;
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    // console.log("Notification permission granted.");

    // Register for push (requires a VAPID key from your backend)

    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.log("existingsub", existingSub.toJSON());
      return;
    }
    const bytesKeys = urlBase64ToUint8Array(
      "BK6J_i98HLZDQpDhR_eoyFDnWaFCV9kNMmV32c6BTtyrFLQ5Y-nzTDcWHXI8F7_oCyqb4YVUSDp6s7UdD6fzcOc",
    );

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytesKeys,
    });
    const a = subscription.toJSON();
    console.log("subscription", a);
    // console.log("Push Subscription:", subscription);
    // console.log("Push Subscription:", subscription);
    // Send 'subscription' to your backend server here
  }
};

// Helper to convert VAPID key
const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
