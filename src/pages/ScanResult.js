import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";

const ScanResult = () => {
	const { data } = useParams();
	const [info, setInfo] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Ejemplo: obtener datos desde tu API
				const response = await fetch(`https://www.allstockcontrol.com/api/get_qr_info.php?code=${encodeURIComponent(data)}`);
				const result = await response.json();

				if (result.success) {
					setInfo(result.data);
				} else {
					setError(result.message || "No se encontraron datos.");
				}
			} catch (err) {
				setError("Error al obtener la información del código.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [data]);

	return (
		<div className="scan-result-page">
			<Header />
			<main style={{ padding: "16px" }}>
				<h2>Resultado del escaneo</h2>

				{loading && <p>Cargando información...</p>}
				{error && <p style={{ color: "red" }}>{error}</p>}

				{info && (
					<div className="info-box">
						<h3>Datos del código:</h3>
						<pre>{JSON.stringify(info, null, 2)}</pre>
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