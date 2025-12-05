import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/functions";
import Header from "../components/Header";
// import "../assets/styles/collaborator-access.css";

const CollaboratorAccess = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		loadUser();
	}, []);

	const loadUser = async () => {
		try {
			const data = await apiFetch(
				`https://www.allstockcontrol.com/api/get_user.php?id=${id}`,
				{ method: "GET" }
			);

			if (!data.success) {
				setError(data.message);
				return;
			}

			setUser(data.user);
		} catch (err) {
			setError("Error loading user.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="dashboard-container">
			<Header />

			<main className="list-wrapp">
				<h1 className="dashboard-title">User Access Options</h1>

				{loading && <p>Loading...</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}

				{!loading && user && (
					<div className="access-card">
						<div className="profile-section">
							<div className="profile-avatar">
								<img
									src={`https://www.allstockcontrol.com/images/profile/${user.image || "NonProfilePic.png"}`}
									alt={user.full_name}
								/>
							</div>

							<div className="profile-info">
								<h2>{user.full_name}</h2>
								<p>{user.email}</p>
								<p>Role: {user.rank_text}</p>
							</div>
						</div>

						<div className="access-options">
							<h3>Access Permissions</h3>

							<div className="access-item">
								<span>Shipping Access</span>
								<label className="switch">
									<input type="checkbox" />
									<span className="slider round"></span>
								</label>
							</div>

							<div className="access-item">
								<span>Scanner Access</span>
								<label className="switch">
									<input type="checkbox" />
									<span className="slider round"></span>
								</label>
							</div>

							<div className="access-item">
								<span>Reports Access</span>
								<label className="switch">
									<input type="checkbox" />
									<span className="slider round"></span>
								</label>
							</div>

							<button className="asc-btn" style={{ marginTop: "20px" }}>
								Save Changes
							</button>
						</div>
					</div>
				)}
			</main>
		</div>
	);
};

export default CollaboratorAccess;