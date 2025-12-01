export const formatNotificationDate = (dateString) => {
    if (!dateString) return "";

    const monthsAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dateObj = new Date(dateString);
    const now = new Date();

    const isToday = dateObj.toDateString() === now.toDateString();
    const isSameYear = dateObj.getFullYear() === now.getFullYear();

    if (isToday) {
        return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (isSameYear) {
        return `${dateObj.getDate()} ${monthsAbbr[dateObj.getMonth()]}`;
    } else {
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = String(dateObj.getFullYear()).slice(-2);
        return `${year}/${month}/${day}`;
    }
};

export async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) return false;

    try {
        const response = await fetch(
            "https://www.allstockcontrol.com/api/refresh_token.php",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    refresh_token: refreshToken
                })
            }
        );

        const data = await response.json();

        if (data.success && data.data?.token) {
            localStorage.setItem("authToken", data.data.token);
            return true;
        }

        return false;
    } catch (err) {
        return false;
    }
}

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("authToken");

    let response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    });

    // ✅ Si todo bien → retornar
    if (response.status !== 401) {
        return response.json();
    }

    // 🔁 Intentar refresh token
    let data = {};
    try {
        data = await response.json();
    } catch {}

    const refreshed = await refreshAccessToken();

    if (refreshed) {
        // 🔄 Reintentar request original
        const newToken = localStorage.getItem("authToken");

        response = await fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${newToken}`
            }
        });

        return response.json();
    }

    // ❌ Refresh falló → logout forzado
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");

    if (data.reason === "TOKEN_REVOKED") {
        alert("Sesión iniciada en otro dispositivo");
    } else {
        alert("Sesión expirada");
    }

    window.location.href = "/";
    return null;
}

export async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.warn("This browser does not support notifications");
        return false;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        console.warn("Notification permission denied");
        return false;
    }

    return true;
}

export async function getServiceWorker() {
    if (!("serviceWorker" in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;
    return registration;
}

export const VAPID_PUBLIC_KEY =
"BKqWcNgpm_rAhyuhrXKvDl7LksLNuhA-KQhanWJlBsOC34-ScYjy8p0xBb3h6YMOyT9kenbv_OTnEg5yWG-Kx5k";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeToPush() {
    const registration = await getServiceWorker();
    if (!registration) return null;

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    return subscription;
}

export async function sendSubscriptionToBackend(subscription) {
    const token = localStorage.getItem("authToken");
    if (!token) return false;

    const json = subscription.toJSON();

    return await apiFetch(
        "https://www.allstockcontrol.com/api/save_push_subscription.php",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                endpoint: json.endpoint,
                p256dh: json.keys.p256dh,
                auth: json.keys.auth,
                device_type: /mobile/i.test(navigator.userAgent) ? "mobile" : "desktop",
                device_name: navigator.userAgent
            })
        }
    );
}

export async function enablePushNotifications() {
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) return false;

    const subscription = await subscribeToPush();
    if (!subscription) return false;

    await sendSubscriptionToBackend(subscription);
    return true;
}