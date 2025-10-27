import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "@yudiel/react-qr-scanner";
import Header from "../components/Header";
import "../assets/styles/scanner.css";

const Scanner = () => {
    const [hasPermission, setHasPermission] = useState(false);
	const [scanResult, setScanResult] = useState(null);
	const [error, setError] = useState(null);
    const navigate = useNavigate();

    const requestCameraPermission = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ video: true });
			if (stream) {
				setHasPermission(true);
				stream.getTracks().forEach(track => track.stop()); // cerramos el flujo para no duplicar
			}
		} catch (err) {
			console.error("Error solicitando permisos de cámara:", err);
			setError("No se pudo acceder a la cámara. Verifica los permisos en tu navegador.");
		}
	};

    const unmounted = useRef(false);

    useEffect(() => {
        return () => { unmounted.current = true; };
    }, []);

    const playBeep = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        oscillator.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.15);
    };

	const handleScan = (data) => {
		if (data) {
            playBeep(); // sonido generado
            navigator.vibrate?.(150);
			setScanResult(data);
			console.log("QR Detectado:", data);
            setHasPermission(false);

            navigate(`/scan-result/${encodeURIComponent(data)}`);
		}
	};

	const handleError = (err) => {
		console.error("Error de cámara:", err);
		setError("No se pudo acceder a la cámara. Revisa permisos.");
	};

    const handleClose = () => {
		navigate("/dashboard");
	};

	return (
		<div className="scanner-container">
			<Header />

			<main className="scanner-main">
				<h2 className="scanner-title">Escanear Código QR</h2>

                {/* Si aún no tiene permisos */}
				{!hasPermission ? (
					<div className="permission-overlay">
						<div className="permission-modal">
							<h3>Permitir acceso a la cámara</h3>
							<p>Necesitamos tu autorización para poder escanear códigos QR.</p>

							<button onClick={requestCameraPermission} className="btn-permitir">
								📸 Permitir acceso
							</button>

							{error && <p className="error-message">{error}</p>}

                            <button className="btn-close" onClick={handleClose}>
								X
							</button>
						</div>
					</div>
				) : (
                    <div className="camera-view">
                        <QrScanner
                            onDecode={handleScan}
                            onError={handleError}
                            scanDelay={200}
                            style={{ width: "100%", height: "100%" }}
                            constraints={{
                                facingMode: "environment", // Cámara trasera
                                aspectRatio: 1,            // Mantiene proporción cuadrada
                            }}
                            video={{ muted: true }}
                        />
                    </div>
                )}

				{/* 🔹 Mostrar resultado */}
				{scanResult && (
					<div className="scan-result">
						<h3>Resultado:</h3>
						<p>{scanResult}</p>
					</div>
				)}

				{/* 🔹 Mostrar error */}
				{error && <p className="error-message">{error}</p>}
			</main>
		</div>
	);
};

export default Scanner;