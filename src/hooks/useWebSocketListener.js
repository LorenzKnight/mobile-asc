import { useEffect } from "react";

export default function useWebSocketListener(userId, logoutCallback) {
    useEffect(() => {
        if (!userId) return;

        const hostname = window.location.hostname;

        // Construye la URL correcta para WS
        const wsUrl =
            hostname === "localhost"
                ? "ws://localhost:3001"
                : `ws://${hostname}:3001`;

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

        return () => ws.close();
    }, [userId, logoutCallback]);
}