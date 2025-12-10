import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaBarcode, FaClipboardList, FaUsersCog, FaChartLine } from "react-icons/fa";
import { TbShip } from "react-icons/tb";
import Header from "../components/Header";

import '../assets/styles/dashboard.css';
import '../assets/styles/global.css';

const Dashboard = () => {
	const navigate = useNavigate();
	const [permissions, setPermissions] = useState({});
	const [systemPerms, setSystemPerms] = useState({});

	useEffect(() => {
		const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/");
            return;
        }

		const loadPermissions = () => {
			const stored = localStorage.getItem("userPermissions");
			if (stored) setPermissions(JSON.parse(stored));
		};

		const loadSystemPermissions = () => {
			const stored = localStorage.getItem("userSystemPermissions");
			if (stored) setSystemPerms(JSON.parse(stored));
		};

		loadPermissions();
		loadSystemPermissions();

		window.addEventListener("permissionsUpdated", loadPermissions);
		window.addEventListener("systemPermissionsUpdated", loadSystemPermissions);

		return () => {
			window.removeEventListener("permissionsUpdated", loadPermissions);
			window.removeEventListener("systemPermissionsUpdated", loadSystemPermissions);
		};
	}, [navigate]);

	return (
		<div className="dashboard-container">
			<Header />

			<main className="list-wrapp">
				<h1 className="dashboard-title">Welcome to the Dashboard</h1>

				<div className="button-group">
					{/* Scanner */}
					{permissions.shipping_access && systemPerms.process_handler && (
						<button className="dash-btn" onClick={() => navigate("/scanner")}>
							<FaQrcode size={22} />
							<span>Scanner</span>
						</button>
					)}

					{/* Shipping Status */}
					{permissions.shipping_access && systemPerms.process_handler && (
						<button className="dash-btn" onClick={() => navigate("/shipping-status")}>
							<TbShip size={22} />
							<span>Shipping Status</span>
						</button>
					)}

					{/* Scan / Add Products */}
					{permissions.shipping_access && systemPerms.process_handler && (
						<button className="dash-btn" onClick={() => navigate("/scan-add-product")}>
							<FaBarcode size={22} />
							<span>Scan / Add Products</span>
						</button>
					)}

					{/* Pre-order */}
					{permissions.preorder_access && (
						<button className="dash-btn" onClick={() => navigate("/preorder")}>
							<FaClipboardList size={22} />
							<span>Pre-order</span>
						</button>
					)}

					{/* Collaborators */}
					{systemPerms.platform_admin && (
						<button className="dash-btn" onClick={() => navigate("/collaborators")}>
							<FaUsersCog size={22} />
							<span>Collaborators access</span>
						</button>
					)}

					{/* Reports */}
					{permissions.reports_access && (
						<button className="dash-btn" onClick={() => navigate("/reports")}>
							<FaChartLine size={22} />
							<span>Reports</span>
						</button>
					)}

				</div>
			</main>
		</div>
	);
};

export default Dashboard;