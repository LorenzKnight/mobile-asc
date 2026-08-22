import { useEffect } from "react";

export default function useWebSocketListener(userId, logoutCallback) {
    useEffect(() => {
        if (!userId) return;

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;

        // Construye la URL correcta para WS
        const wsUrl =
            hostname === "localhost"
                ? "ws://localhost:3001"
                : `${protocol === "https:" ? "wss" : "ws"}://${hostname}/ws`;

        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Solo actuamos si el mensaje es "force_logout" y coincide user_id
                if (data.message === "force_logout" && Number(data.user_id) === Number(userId)) {
                    logoutCallback(); // Ejecuta el cierre de sesión
                }
            } catch (err) {
                console.error("WS Error:", err);
            }
        };

        ws.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            if (
                ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING
            ) {
                ws.close();
            }
        };
    }, [userId, logoutCallback]);
}