import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TbTruck, TbPlane } from "react-icons/tb";
import { FiSearch } from "react-icons/fi";
import { formatNotificationDate } from "../utils/functions";
import Header from "../components/Header";

import "../assets/styles/shipping-status.css";
import "../assets/styles/global.css";

const ShippingStatus = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [shippings, setShippings] = useState([]);
    const [error, setError] = useState("");
    const [openShipping, setOpenShipping] = useState(null);
	const [statusFilter, setStatusFilter] = useState("1");
	const [searchText, setSearchText] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            navigate("/");
            return;
        }

        fetchShippingStatus();
    }, []);

    const fetchShippingStatus = async () => {
        try {
            const token = localStorage.getItem("authToken");

            const response = await fetch("https://www.allstockcontrol.com/api/get_shippings.php", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                }
            });

            const data = await response.json();
            // console.log("Shipping status:", data);

            if (!data.success) {
                setError(data.message || "Error loading shipping status");
            } else {
                setShippings(data.data || []);
            }
        } catch (err) {
            console.error(err);
            setError("Error loading shipping status");
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        0: "#ef4444",  // red
        1: "#f97316",  // orange
        2: "#22c55e",  // green
        3: "#0ea5e9",  // sky blue
    };

	const filteredShippings = shippings.filter(ship => {
		const matchesStatus =
        statusFilter === "" || String(ship.status) === statusFilter;

		const matchesSearch =
        searchText.trim() === "" ||
        ship.shipping_no?.toLowerCase().includes(searchText.toLowerCase());

    	return matchesStatus && matchesSearch;
	});

    return (
        <div className="dashboard-container">
            <Header />

            <main className="dashboard-main">
                <h1 className="dashboard-title">Shipping Status</h1>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {!loading && !error && (
					<>
						{/* 🔹 SELECT FILTRO DE STATUS */}
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
									placeholder="Search by Shipping No." 
									value={searchText}
									onChange={(e) => setSearchText(e.target.value)}
									className="search-input" 
								/>
							</div>

							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="status-filter"
							>
								<option value="">All Shippings</option>
								<option value="0">Cancelled</option>
								<option value="1">Pending</option>
								<option value="2">In transit</option>
								<option value="3">Delivered</option>
							</select>
						</div>

						<div className="shipping-status-list">
							{filteredShippings.length === 0 ? (
								<p style={{
									textAlign: "center",
									marginTop: "50px",
									color: "#fff"
								}}>No shipping records found.</p>
							) : (
								filteredShippings.map(shipping => {
									const shippingMethodIcon = shipping.shipping_method === "2" ? ( <TbPlane size={36} color="#3b82f6" /> ) : ( <TbTruck size={36} color="#3b82f6" /> );
									const statusColor = statusColors[shipping.status] || "#6b7280";
									const shippingTracking = shipping.tracking?.checkpoint_name || "No tracking available";

									return (
										<div key={shipping.shippings_id} className="shipping-card"
												onClick={() =>
													setOpenShipping(
														openShipping === shipping.shippings_id
															? null
															: shipping.shippings_id
													)
												}
												style={{ cursor: "pointer" }}
											>
											<table>
												<tbody>
													<tr>
														{/* Left icon */}
														<td width="12%" align="center" valign="middle">
															<div className="shipping-profile">{shippingMethodIcon}</div>
														</td>

														{/* Info */}
														<td width="78%" align="left" valign="top">
															<div style={{ padding: "0 5px" }}>
																<p>
																	Shipping No.:{" "}
																	<strong>{shipping.shipping_no || '—'}</strong>
																</p>

																<p>
																	Status:{" "}
																	<strong style={{ color: statusColor }}>{shipping.status_text || ""}</strong>
																</p>

																<p className="mini-title">{shippingTracking}</p>
															</div>
														</td>

														{/* Date */}
														<td width="10%" align="center" valign="middle">
															<strong>{formatNotificationDate(shipping.created_at)}</strong>
														</td>
													</tr>
												</tbody>
											</table>

											{/* ──────────────── Expand Loads ──────────────── */}
											{openShipping === shipping.shippings_id && (
												<div className="shipping-expand">
													{shipping.loads?.length === 0 ? (
														<p>No loads found.</p>
													) : (
														shipping.loads.map(load => (
															<div key={load.load_id} className="load-card">
																<h4>
																	Load #{load.load_no} — {load.customer.full_name}
																</h4>

																{/* Products inside the load */}
																<div className="products-list">
																	{load.products.map(prod => (
																		<div key={prod.product_id} className="product-row">
																			<img
																				src={
																					prod.image
																						? `https://www.allstockcontrol.com/images/products/${prod.image}`
																						: "https://www.allstockcontrol.com/images/sys-img/NonImage.png"
																				}
																				alt="product"
																				className="product-thumb"
																			/>

																			<div className="product-info">
																				<strong>{prod.name}</strong>
																				<p>
																					{prod.mark_name} / {prod.model_name} /{" "}
																					{prod.submodel_name}
																				</p>
																				<p>{prod.quantity} pcs — {prod.total_weight} kg</p>
																			</div>
																		</div>
																	))}
																</div>
															</div>
														))
													)}
												</div>
											)}
										</div>
									);
								})
							)}
						</div>
					</>
                )}
            </main>
        </div>
    );
};

export default ShippingStatus;