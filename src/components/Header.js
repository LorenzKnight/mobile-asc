import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaBars } from "react-icons/fa";
import "../assets/styles/components/header.css";

const Header = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [userInfo, setUserInfo] = useState(null);
	const [menuOpen, setMenuOpen] = useState(false);

	const isDashboard = location.pathname === "/dashboard";

	useEffect(() => {
		// 🔹 Intentar cargar la info del usuario desde el backend o localStorage
		const token = localStorage.getItem("authToken");
		if (!token) return;

		const fetchUser = async () => {
			try {
				const response = await fetch("https://www.allstockcontrol.com/api/get_my_info.php", {
				method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				const data = await response.json();
				if (data.success) {
					setUserInfo({
						name: `${data.data.name} ${data.data.surname || ""}`.trim(),
						location: data.data.package_info?.package_name || "Unknown",
					});
				}
			} catch (error) {
				console.error("Error al obtener info del usuario:", error);
			}
		};

		fetchUser();
	}, []);

	const handleBack = () => {
		navigate("/dashboard");
	};

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		navigate("/");
	};

	return (
		<>
			<header className="asc-header">
				{/* 🔙 Botón Back */}
				{!isDashboard ? (
					<button className="header-btn back" onClick={handleBack}>
						<FaArrowLeft size={18} />
					</button>
				) : (
					<div className="header-placeholder"></div>
				)}

				{/* 👤 Nombre y ubicación */}
				<div className="header-center">
					<h2 className="user-name">{userInfo?.name || "Cargando..."}</h2>
					<p className="user-location">{userInfo?.location || "Ubicación desconocida"}</p>
				</div>

				{/* ☰ Botón menú */}
				<button className="header-btn menu" onClick={() => setMenuOpen(!menuOpen)}>
					<FaBars size={18} />
				</button>
			</header>

			{/* 🌙 Modal centrado */}
			{menuOpen && (
				<div className="menu-overlay">
					<div className="menu-modal">
						<h3>Menú</h3>
						<button className="menu-item" onClick={() => { setMenuOpen(false); navigate("/settings"); }}>Settings</button>
						<button className="menu-item" onClick={handleLogout}>Log out</button>
						<button className="close-btn" onClick={() => setMenuOpen(false)}>✕</button>
					</div>
				</div>
			)}
		</>
	);
};

export default Header;