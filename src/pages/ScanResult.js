import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "../assets/styles/scanresult.css";

// ✅ Función para decodificar un JWT sin librerías externas
const decodeJWT = (token) => {
	try {
		const base64Url = token.split(".")[1];
		const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
		const jsonPayload = decodeURIComponent(
			atob(base64)
				.split("")
				.map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
				.join("")
		);
		return JSON.parse(jsonPayload);
	} catch {
		return null;
	}
};

const ScanResult = () => {
	const { data } = useParams();
	const [shippingInfo, setShippingInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [alreadyChecked, setAlreadyChecked] = useState(false);
	const navigate = useNavigate();

	const showTemporaryPopup = (message) => {
		const popup = document.createElement("div");
		popup.className = "check-popup";
		popup.textContent = message;
		document.body.appendChild(popup);
		setTimeout(() => popup.remove(), 2000);
	};

	useEffect(() => {
		const fetchShippingInfo = async () => {
			try {
				const token = localStorage.getItem("authToken");
				if (!token) throw new Error("Auth token not found.");

				const decoded = decodeJWT(token);
				const companyId = decoded?.company_id;

				if (!companyId) throw new Error("Company ID not found in token.");

				const response = await fetch(
					`https://www.allstockcontrol.com/api/get_shippings.php?search=${encodeURIComponent(
						data
					)}&company=${companyId}`,
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);

				const result = await response.json();

				if (result.success && result.data.length > 0) {
					const shipping = result.data[0];
					setShippingInfo(shipping);

					// 🚨 Validación de status del envío
					if (shipping.status >= 3) {
						setAlreadyChecked(true);
						showTemporaryPopup("Already checked ✅");
						return;
					}

					// 🧩 NUEVA VALIDACIÓN:
					// Verificar si este usuario ya está en shipping_tracking
					const trackRes = await fetch(
						`https://www.allstockcontrol.com/api/check_shipping.php`,
						{
							method: "POST",
							headers: {
								Authorization: `Bearer ${token}`,
							},
							body: (() => {
								const f = new FormData();
								f.append("shipping_id", shipping.shippings_id || shipping.shipping_id);
								f.append("test_mode", "check_only"); // 👈 no insertará nada
								return f;
							})(),
						}
					);

					const trackResult = await trackRes.json();
					if (
						trackResult.message?.includes("Already checked") ||
						trackResult.message?.includes("already delivered")
					) {
						setAlreadyChecked(true);
						showTemporaryPopup("Already checked ✅");
					}
				} else {
					setError(result.message || "No information found for this code.");
				}
			} catch (err) {
				console.error("Error getting information from QR:", err);
				setError(err.message || "Error connecting to the server.");
			} finally {
				setLoading(false);
			}
		};

		fetchShippingInfo();
	}, [data]);

    const handleCheck = async () => {
		if (!shippingInfo || alreadyChecked) return;

		try {
			const token = localStorage.getItem("authToken");
			if (!token) throw new Error("Auth token not found.");

			// Intentar obtener la ubicación actual
			let latitude = null;
			let longitude = null;
			try {
				const position = await new Promise((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: true,
						timeout: 5000,
					});
				});
				latitude = position.coords.latitude;
				longitude = position.coords.longitude;
			} catch {
				console.warn("No se pudo obtener la ubicación GPS.");
			}

			// Enviar datos al backend
			const formData = new FormData();
			formData.append("shipping_id", shippingInfo.shippings_id || shippingInfo.shipping_id);
			formData.append("latitude", latitude);
			formData.append("longitude", longitude);

			const res = await fetch("https://www.allstockcontrol.com/api/check_shipping.php", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			const result = await res.json();

			if (result.success) {
				// ✅ Mostrar popup temporal de éxito
				showTemporaryPopup("✔ Checked!");
				setTimeout(() => navigate("/scanner"), 2000);
			} else {
				// 🎯 Mostrar mensaje según tipo
				if (result.message.includes("Already checked")) {
					showTemporaryPopup("Already checked ✅");
					setAlreadyChecked(true);
				} else if (result.message.includes("already delivered")) {
					showTemporaryPopup("Already delivered ✅");
					setAlreadyChecked(true);
				} else {
					alert(result.message || "Error checking shipping.");
				}
			}
		} catch (err) {
			console.error("Error on check:", err);
			alert(err.message || "Unexpected error.");
		}
	};

	// 🧾 Mapeo de estados
	const getStatusText = (status) => {
		switch (parseInt(status)) {
			case 0:
			case 1:
				return "Pending";
			case 2:
				return "In transit";
			case 3:
				return "Delivered";
			default:
				return "Unknown";
		}
	};

	return (
		<div className="scan-result-page">
			<Header />
			<main style={{ padding: "16px" }}>
				{loading && <p>Loading information...</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}

				{shippingInfo && (
					<div className="info-box">
                        <div className="shipping-seccion">
                            <h3>📦 Shipping: {shippingInfo.shipping_no}</h3>
                            <p>
                                <strong>Destination:</strong> {shippingInfo.destination || "N/A"}
                            </p>
                            <p>
                                <strong>Status:</strong> {getStatusText(shippingInfo.status)}
                            </p>
                            <p>
                                <strong>Estimated arrival:</strong> {shippingInfo.delivery_date || "Sin fecha"}
                            </p>
                        </div>

						{/* 🧱 Loads */}
                        <h4>Associated loads:</h4>
						{shippingInfo.loads?.length > 0 && (
							<div className="loads-section">
								{shippingInfo.loads.map((load) => (
									<div key={load.load_id} className="load-card">
										<p>
											<strong>🧱 Load:</strong> {load.load_no}
										</p>
										<p>
											<strong>customer:</strong> {load.customer?.full_name || "N/A"}
										</p>
										<p>
											<strong>Destino:</strong> {load.destination || "N/A"}
										</p>

										{/* 📦 Productos */}
										{load.products?.length > 0 && (
											<div className="products-list">
												<h5>Products:</h5>
												<ul>
													{load.products.map((p) => (
														<li key={p.product_id}>
															{p.name} — {p.mark_name} {p.model_name} ({p.quantity} uds)
														</li>
													))}
												</ul>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}
                <div className="scan-btn-container">
                    <button className="scan-btn" onClick={() => navigate("/scanner")}>
                        Scan another code
                    </button>

                    {/* Solo muestra el botón si NO ha sido verificado */}
					{!alreadyChecked && (
						<button className="scan-btn" onClick={handleCheck}>
							Check ✅
						</button>
					)}
                </div>
			</main>
		</div>
	);
};

export default ScanResult;