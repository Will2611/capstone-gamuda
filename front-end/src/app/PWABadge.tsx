import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// const IsDev = import.meta.env.VITE_IS_DEV;
interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
const NotificationContext = createContext<{
  notification: PushSubscription | null;
} | null>(null);
const VITE_VAPID_PUB_KEY = import.meta.env.VITE_VAPID_PUB_KEY ?? "";
function PWABadge({ children }: { children: ReactNode }) {
  // check for updates every hour
  const period = 60 * 60 * 1000;
  // Mounting

  const [sWorker, setWorker] = useState<ServiceWorkerRegistration | null>(null);
  const [canNotify, setCanNotify] = useState(false);
  const [notification, setNotification] = useState<PushSubscription | null>(
    null,
  );
  const [isStandalone, setIsStandalone] = useState(false);
  const [isTScreen, setIsTScreen] = useState(false);

  useEffect(() => {
    // Check if running as a PWA (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsStandalone(true);
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((v) =>
        v?.pushManager.getSubscription().then((exisiting) => {
          if (exisiting) {
            const { endpoint, keys } = exisiting.toJSON();
            const { p256dh, auth } = keys || {};
            if (endpoint && p256dh && auth) {
              setNotification({ endpoint, keys: { p256dh, auth } });
            }
          }
        }),
      );
    }
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    // Check for touch capability
    const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTScreen(isMobile || hasTouch);
  }, []);

  useEffect(() => {
    if (sWorker) {
      sWorker.pushManager.getSubscription().then((subRaw) => {
        if (!subRaw) return;
        const sub = subRaw.toJSON();
        const { endpoint, keys } = sub;
        const { p256dh, auth } = keys || {};
        if (endpoint && p256dh && auth) {
          setNotification({ endpoint, keys: { p256dh, auth } });
        }
      });
    }
  }, [sWorker, canNotify]);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r) {
        if (r?.active?.state === "activated") {
          registerPeriodicSync(period, swUrl, r);

          requestNotificationPermission(r).then((v) => {
            if (v) {
              setCanNotify(true);
            }
          });
        } else if (r?.installing) {
          r.installing.addEventListener("statechange", (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === "activated") {
              registerPeriodicSync(period, swUrl, r);

              requestNotificationPermission(r).then((v) => {
                if (v) {
                  setCanNotify(true);
                }
              });
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
    setCanNotify(true);
    setIsStandalone(false);
  }

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((r) => {
        if (r) {
          setWorker(r);
        }
      });
    }
  }, []);

  const display = useMemo(() => {
    return needRefresh || (!canNotify && isStandalone) || isTScreen;
  }, [needRefresh, canNotify, isStandalone, isTScreen]);
  return (
    <NotificationContext.Provider value={{ notification }}>
      {children}
      <div
        className={`sticky bottom-0 right-0 z-10 bg-gray-200 shadow-lg p-4 border border-red-100 opacity-50 hover:opacity-100 [@media(hover:none)]:opacity-100 md:-mt-10 z-100 ${display ? "" : "hidden"}`}
        role="alert"
        aria-labelledby="toast-message"
      >
        {JSON.stringify(display)}
        {JSON.stringify(notification)}
        {/* <span>Is it Offline :{`${isOffline}`}</span> */}

        {display && (
          <>
            {isTScreen && !isStandalone ? (
              <div className="p-5">
                <h3>Enable Notifications</h3>
                <p>
                  To receive notifications on iOS, please add this app to your
                  Home Screen first:
                </p>
                <ol>
                  <li>
                    Tap the <strong>Share</strong> icon in Safari.
                  </li>
                  <li>
                    Select <strong>Add to Home Screen</strong>.
                  </li>
                  <li>
                    Open the app from your Home Screen and tap the button below.
                  </li>
                </ol>
                <button
                  className="bg-blue-600 text-white px-2 py-2 mx-2"
                  onClick={() => setIsTScreen(false)}
                >
                  Closer
                </button>
              </div>
            ) : (
              <div>
                <div className="text-right">
                  {!canNotify && isStandalone ? (
                    <span id="toast-message">
                      Enable push notification for a better experience
                    </span>
                  ) : (
                    <span id="toast-message">
                      New content available, click on reload button to update.
                    </span>
                  )}
                </div>
                <div className="text-right px-4">
                  {!canNotify && isStandalone ? (
                    <button
                      className="bg-blue-600 text-white px-2 py-2 mx-2"
                      onClick={() =>
                        requestNotificationPermission(sWorker)
                          .then((v) => {
                            if (v) {
                              const { endpoint, keys } = v;
                              const { p256dh, auth } = keys || {};
                              if (endpoint && p256dh && auth) {
                                setNotification({
                                  endpoint,
                                  keys: { p256dh, auth },
                                });
                              }
                            }
                          })
                          .finally(() => setCanNotify(true))
                      }
                    >
                      Enable Push Notifications
                    </button>
                  ) : (
                    <button
                      className="bg-blue-600 text-white px-2 py-2 mx-2"
                      onClick={() => updateServiceWorker(true)}
                    >
                      Reload
                    </button>
                  )}
                  <button
                    className="bg-red-600 text-white px-2 py-2 mx-2"
                    onClick={() => close()}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {isStandalone && !canNotify && <></>}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within PWABadge");
  }
  return context;
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

const requestNotificationPermission = async (
  registration: ServiceWorkerRegistration | undefined | null,
) => {
  if (!registration) return;
  if (!("Notification" in window)) return;

  // if (!import.meta.env.VITE_VAPID_PUB_KEY) return;
  try {
    // 1. Request standard Notification permission

    let permission = Notification.permission;

    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }
    if (permission === "granted") {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        return existingSub.toJSON();
      }
      // // 2. If granted, get the FCM token

      const bytesKeys = urlBase64ToUint8Array(VITE_VAPID_PUB_KEY);

      const subscription = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: bytesKeys,
      });

      await subscription;
      // const newSub = subscription.toJSON();
      // return newSub;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error requesting permission:", error);
    return null;
  }
};
