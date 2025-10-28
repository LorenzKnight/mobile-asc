import React from "react";
import "../assets/styles/components/modal.css";

const Modal = ({
	title,
	message,
	children,
	onClose,
	show = false,
	showCloseButton = true,
}) => {
	if (!show) return null; // 👈 no renderiza si no está activo

	return (
		<div className="asc-overlay">
			<div className="asc-modal">
				{title && <h3>{title}</h3>}
				{message && <p>{message}</p>}

				{/* contenido adicional (botones, texto, etc.) */}
				{children}

				{showCloseButton && (
					<button className="asc-btn-close" onClick={onClose}>
						✕
					</button>
				)}
			</div>
		</div>
	);
};

export default Modal;