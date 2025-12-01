/* eslint-disable no-restricted-globals */
/* global clients */

self.addEventListener("push", function (event) {
    let data = {};

    try {
        data = event.data.json();
    } catch {
        data = {
            title: "Notification",
            body: event.data?.text() || "You have a new notification"
        };
    }

    const options = {
        body: data.body,
        icon: "/logo192.png",
        badge: "/logo192.png",
        data: {
            url: data.url || "/"
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            data.title || "AllStockControl",
            options
        )
    );
});


self.addEventListener("notificationclick", function (event) {
    event.notification.close();

    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window" }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === targetUrl && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});