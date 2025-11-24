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