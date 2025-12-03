import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

import "../assets/styles/global.css";
import "../assets/styles/collaborators.css";

const Collaborators = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [collaborators, setCollaborators] = useState([]);

	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			navigate("/");
			return;
		}

		loadCollaborators();
	}, [navigate]);

	const loadCollaborators = async () => {
		try {
			// 🔜 luego conectamos con backend
			setCollaborators([]);
		} catch (error) {
			console.error("Error loading collaborators:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="dashboard-container">
			<Header />

			<main className="dashboard-main">
				<h1 className="dashboard-title">Collaborator access</h1>

				{loading && <p>Loading collaborators...</p>}

				{!loading && collaborators.length === 0 && (
					<p>No collaborators found.</p>
				)}

				{/* 👇 Aquí luego irá la tabla/lista */}
			</main>
		</div>
	);
};

export default Collaborators;