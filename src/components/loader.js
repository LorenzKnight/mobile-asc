import React from 'react';
import '../assets/styles/loader.css';

function Loader({ message = "Cargando..." }) {
	return (
		<div className="loader-overlay">
		<div className="loader-spinner"></div>
		<p className="loader-message">{message}</p>
		</div>
	);
}

export default Loader;