import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/functions";
import { FaArrowLeft, FaBars } from "react-icons/fa";
import Modal from "./Modal";
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
				const data = await apiFetch(
					"https://www.allstockcontrol.com/api/get_my_info.php",
					{ method: "GET" }
				);

				if (!data) return;

				if (data.success) {
					const activeToken = Array.isArray(data.data.tokens) ? data.data.tokens[0] : null;
					const userLocation = activeToken?.location || "Unknown";

					setUserInfo({
						name: `${data.data.name} ${data.data.surname || ""}`.trim(),
						location: userLocation,
					});

					await Promise.all([
						loadSystemPermissions(token),
						hierarchyPermissions(token)
					]);
				}
			} catch (error) {
				console.error("Error al obtener info del usuario:", error);
			}
		};

		const loadSystemPermissions = async (token) => {
			try {
				const permissionsToCheck = [
					"shipping_access",

					"scanner_access",
					"preorder_access",
					"collaborators_access",
					"reports_access"
				];

				let userPermissions = {};

				for (const name of permissionsToCheck) {
					const data = await apiFetch(
						`https://www.allstockcontrol.com/api/check_service_rights.php?service_name=${encodeURIComponent(name)}`
					);

					if (!data) return;
					// console.log("Permission check:", name, data);
					userPermissions[name] = data.success && data.data?.can_access === true;
				}

				// Guardar permisos en localStorage para reutilizarlos en las pages
				localStorage.setItem("userPermissions", JSON.stringify(userPermissions));

				window.dispatchEvent(new Event("permissionsUpdated"));
			} catch (error) {
				console.error("Error loading permissions:", error);
			}
		};

		const hierarchyPermissions = async (token) => {
            try {
                const hierarchyPermissionsToCheck = [
                    "root_access",
					"system_admin",
					"platform_admin",
					"ops_controller",
					"data_controller",
					"data_handler",
					"process_handler",
					"sales_handler",
					"read_advanced",
					"read_only"
                ];

                let systemPerms = {};

                for (const name of hierarchyPermissionsToCheck) {
					const data = await apiFetch(
						`https://www.allstockcontrol.com/api/check_permission.php?permission=${encodeURIComponent(name)}`
					);

					if (!data) return;
					// console.log("Permission check:", name, data);
                    systemPerms[name] = data.success && data.has_permission === true;
                }

                localStorage.setItem("userSystemPermissions", JSON.stringify(systemPerms));
                window.dispatchEvent(new Event("systemPermissionsUpdated"));
            } catch (error) {
                console.error("Error loading system permissions:", error);
            }
        };

		fetchUser();
	}, []);

	const handleBack = () => {
		window.dispatchEvent(new Event("stopCamera"));

		if (window.history.length > 1) {
			navigate(-1);
		} else {
			navigate("/dashboard");
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		localStorage.removeItem("camera_permission");
		localStorage.removeItem("userPermissions");
		localStorage.removeItem("userSystemPermissions");

		setUserInfo(null);
		// setMenuOpen(false);

		window.dispatchEvent(new Event("permissionsUpdated"));
		window.dispatchEvent(new Event("systemPermissionsUpdated"));

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
			<Modal
				show={menuOpen}
				title="Menú principal"
				onClose={() => setMenuOpen(false)}
			>
				<button
					className="asc-btn"
					onClick={() => {
						setMenuOpen(false);
						navigate("/settings");
					}}
				>
					Settings
				</button>

				<button className="asc-btn" onClick={handleLogout}>
					Log out
				</button>
			</Modal>
		</>
	);
};

export default Header;