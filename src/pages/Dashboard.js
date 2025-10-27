import React from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaClipboardList, FaUsersCog, FaChartLine } from "react-icons/fa";
import Header from "../components/Header";
import '../assets/styles/dashboard.css';

const Dashboard = () => {
	const navigate = useNavigate();

	return (
		<div className="dashboard-container">
			<Header />

			<main className="dashboard-main">
				<h1 className="dashboard-title">Welcome to the Dashboard</h1>

				<div className="button-group">
					<button className="dash-btn" onClick={() => navigate("/scanner")}>
						<FaQrcode size={22} />
						<span>Scanner</span>
					</button>

					<button className="dash-btn" onClick={() => navigate("/preorder")}>
						<FaClipboardList size={22} />
						<span>Pre-order</span>
					</button>

					<button className="dash-btn" onClick={() => navigate("/collaborators")}>
						<FaUsersCog size={22} />
						<span>Collaborator access</span>
					</button>

					<button className="dash-btn" onClick={() => navigate("/reports")}>
						<FaChartLine size={22} />
						<span>Reports</span>
					</button>
				</div>
			</main>
		</div>
	);
};

export default Dashboard;