import { useEffect, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

// const IsDev = import.meta.env.VITE_IS_DEV;

function PWABadge({ children }: { children: ReactNode }) {
  // check for updates every hour
  const period = 60 * 60 * 1000;
  // Mounting

  const {
    // offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (period <= 0) return;
      if (r) {
        if (r?.active?.state === "activated") {
          registerPeriodicSync(period, swUrl, r);
        } else if (r?.installing) {
          r.installing.addEventListener("statechange", (e) => {
            const sw = e.target as ServiceWorker;
            if (sw.state === "activated")
              registerPeriodicSync(period, swUrl, r);
          });
        }
      }
    },
    onRegisterError(err) {
      console.log("Error registering Service Worker", err);
    },
  });

  const [isOffline, setIsOffline] = useState<boolean>(false);
  useEffect(() => {
    const handleSetToOffline = () => {
      setIsOffline(true);
    };
    const handleSetToOnline = () => {
      setIsOffline(false);
    };
    window.addEventListener("offline", handleSetToOffline);
    window.addEventListener("online", handleSetToOnline);

    return () => {
      window.removeEventListener("offline", handleSetToOffline);
      window.removeEventListener("online", handleSetToOnline);
    };
  }, []);

  function close() {
    // setOfflineReady(false);
    setNeedRefresh(false);
  }

  return (
    <>
      <div className="PWABadge" role="alert" aria-labelledby="toast-message">
        {/* <span>Is it Offline :{`${isOffline}`}</span> */}
        {needRefresh && (
          <div className="PWABadge-toast">
            <div className="PWABadge-message">
              <span id="toast-message">
                New content available, click on reload button to update.
              </span>
            </div>
            <div className="PWABadge-buttons">
              <button
                className="PWABadge-toast-button"
                onClick={() => updateServiceWorker(true)}
              >
                Reload
              </button>
              <button className="PWABadge-toast-button" onClick={() => close()}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      {children}
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

function subscribeNotifications(r: ServiceWorkerRegistration) {
  r.pushManager
    .subscribe({ userVisibleOnly: true, applicationServerKey: "" })
    .then((subscription) => {
      // Send the subscription to your server
      // const response = await fetch('/api/subscribe', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(subscription),
      // });
    });
}
