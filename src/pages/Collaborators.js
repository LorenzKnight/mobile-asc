import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { apiFetch } from "../utils/functions";
import Header from "../components/Header";

import "../assets/styles/global.css";
import "../assets/styles/collaborators.css";

const Collaborators = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [collaborators, setCollaborators] = useState([]);
	const [error, setError] = useState("");
	const [searchText, setSearchText] = useState("");

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
            const data = await apiFetch(
                "https://www.allstockcontrol.com/api/get_users.php",
                {
                    method: "GET"
                }
            );

            if (!data) return;

            if (!data.success) {
                setError(data.message || "Error loading collaborators");
                setCollaborators([]);
            } else {
                setCollaborators(data.users || []);
            }
        } catch (error) {
            setError("Error loading collaborators:", error);
        } finally {
            setLoading(false);
        }
	};

	const filteredCollaborators = collaborators.filter(user => {
		const search = searchText.trim().toLowerCase();

		if (search === "") return true;

		return (
			user.full_name?.toLowerCase().includes(search) ||
			user.email?.toLowerCase().includes(search) ||
			user.rank_text?.toLowerCase().includes(search)
		);
	});

	return (
		<div className="dashboard-container">
			<Header />

			<main className="list-wrapp">
				<h1 className="dashboard-title">Collaborator access</h1>

				{loading && <p>Loading...</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}

				{!loading && !error && (
					<>
						<div className="filter-container">
							<div style={{ position: "relative", flex: 1 }}>
								<FiSearch
									size={18}
									color="#555"
									style={{
										position: "absolute",
										left: "12px",
										top: "50%",
										transform: "translateY(-50%)"
									}}
								/>
								<input 
									type="text"
									placeholder="Search Collaborator" 
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									className="big-search-input" 
								/>
							</div>
						</div>

						<div className="collaborator-list">
							{filteredCollaborators.length === 0 ? (
								<p>No collaborators found.</p>
							) : (
								filteredCollaborators.map((user) => (
									<div
										key={user.user_id}
										className="collaborator-card"
									>
										<table>
											<tbody>
												<tr>
													{/* Avatar */}
													<td width="12%" align="center" valign="middle">
														<div className="collaborator-avatar">
															{user.name?.charAt(0)}
														</div>
													</td>

													{/* Info */}
													<td width="78%" align="left" valign="top">
														<div style={{ padding: "0 5px" }}>
															<p>
																<strong>{user.full_name}</strong>
															</p>

															<p className="mini-text">
																{user.email}
															</p>

															<p className="mini-title">
																Role: {user.rank_text}
															</p>
														</div>
													</td>

													{/* Status */}
													<td width="10%" align="center" valign="middle">
														<strong
															style={{
																color: user.status ? "#27ae60" : "#c0392b"
															}}
														>
															{user.status ? "Active" : "Inactive"}
														</strong>
													</td>
												</tr>
											</tbody>
										</table>
									</div>
								))
							)}
						</div>
					</>
				)}
			</main>
		</div>
	);
};

export default Collaborators;