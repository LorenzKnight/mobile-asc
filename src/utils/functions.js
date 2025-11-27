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

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("authToken");

    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
    });

    if (response.status === 401) {
        let data = {};

        try {
            data = await response.json();
        } catch (e) {}

        localStorage.removeItem("authToken");

        if (data.reason === "TOKEN_REVOKED") {
            alert("Sesión iniciada en otro dispositivo");
        } else {
            alert("Sesión expirada");
        }

        window.location.href = "/";
        return null;
    }

    return response.json();
}