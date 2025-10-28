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
	const navigate = useNavigate();

	useEffect(() => {
		const fetchShippingInfo = async () => {
			try {
				const token = localStorage.getItem("authToken");
				if (!token) throw new Error("No se encontró el token de autenticación.");

				// ✅ Extraemos company_id del token
				const decoded = decodeJWT(token);
				const companyId = decoded?.company_id;

				if (!companyId) throw new Error("No se encontró el ID de la compañía en el token.");

				const response = await fetch(
					`https://www.allstockcontrol.com/api/get_shippings.php?search=${encodeURIComponent(
						data
					)}&company=${companyId}`, // 👈 agregamos company
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						credentials: "include",
					}
				);

				const result = await response.json();

				if (result.success && result.data.length > 0) {
					setShippingInfo(result.data[0]);
				} else {
					setError(result.message || "No se encontró información para este código.");
				}
			} catch (err) {
				console.error("Error al obtener información del QR:", err);
				setError(err.message || "Error al conectar con el servidor.");
			} finally {
				setLoading(false);
			}
		};

		fetchShippingInfo();
	}, [data]);

	return (
		<div className="scan-result-page">
			<Header />
			<main style={{ padding: "16px" }}>
				<h2>Resultado del Escaneo</h2>

				{loading && <p>Cargando información...</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}

				{shippingInfo && (
					<div className="info-box">
						<h3>📦 Envío #{shippingInfo.shipping_no}</h3>
						<p>
							<strong>Destino:</strong> {shippingInfo.destination || "N/A"}
						</p>
						<p>
							<strong>Estado:</strong> {shippingInfo.status || "Desconocido"}
						</p>
						<p>
							<strong>Fecha:</strong> {shippingInfo.delivery_date || "Sin fecha"}
						</p>

						{/* 🧱 Loads */}
						{shippingInfo.loads?.length > 0 && (
							<div className="loads-section">
								<h4>Cargas asociadas:</h4>
								{shippingInfo.loads.map((load) => (
									<div key={load.load_id} className="load-card">
										<p>
											<strong>Carga:</strong> {load.load_no}
										</p>
										<p>
											<strong>Cliente:</strong> {load.customer?.full_name || "N/A"}
										</p>
										<p>
											<strong>Destino:</strong> {load.destination || "N/A"}
										</p>

										{/* 📦 Productos */}
										{load.products?.length > 0 && (
											<div className="products-list">
												<h5>Productos:</h5>
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

				<button className="btn-volver" onClick={() => navigate("/scanner")}>
					🔁 Escanear otro código
				</button>
			</main>
		</div>
	);
};

export default ScanResult;