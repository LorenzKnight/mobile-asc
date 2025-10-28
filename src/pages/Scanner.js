import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "@yudiel/react-qr-scanner";
import Modal from "../components/Modal";
import Header from "../components/Header";
import "../assets/styles/scanner.css";

const Scanner = () => {
    const [hasPermission, setHasPermission] = useState(false);
	const [scanResult, setScanResult] = useState(null);
	const [error, setError] = useState(null);
    const [torchEnabled, setTorchEnabled] = useState(false);
	const [torchAvailable, setTorchAvailable] = useState(false);
    const [stream, setStream] = useState(null);
    const navigate = useNavigate();
    
    const videoRef = useRef(null);

    useEffect(() => {
        const savedPermission = localStorage.getItem("camera_permission");
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (!isIOS && savedPermission === "granted") {
            startCamera();
        }

		const stopCameraHandler = () => {
			if (stream) {
				stream.getTracks().forEach((t) => t.stop());
				console.log("📷 Cámara detenida desde Header");
			}

			if (videoRef.current) {
				videoRef.current.srcObject = null;
			}
		};

		window.addEventListener("stopCamera", stopCameraHandler);

		return () => {
			if (stream) {
				stream.getTracks().forEach((t) => t.stop());
				console.log("📷 Cámara detenida al desmontar Scanner");
			}

			window.removeEventListener("stopCamera", stopCameraHandler);
		};
    }, []); // ✅ sin dependencias

    const startCamera = async () => {
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });
            setStream(newStream);
            setHasPermission(true);
            localStorage.setItem("camera_permission", "granted");

            const track = newStream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (capabilities.torch) setTorchAvailable(true);
        } catch (err) {
            console.error("Error accediendo a la cámara:", err);
            setError("No se pudo acceder a la cámara. Verifica los permisos en tu navegador.");
            setHasPermission(false);
        }
    };

    const toggleTorch = async () => {
        try {
            if (!stream) return;

            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (!capabilities.torch) {
                alert("Tu dispositivo no tiene linterna compatible.");
                return;
            }

            await track.applyConstraints({
                advanced: [{ torch: !torchEnabled }],
            });
            setTorchEnabled(!torchEnabled);
        } catch (err) {
            console.error("Error al controlar la linterna:", err);
        }
    };

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

            navigate(`/scan-result/${encodeURIComponent(data)}`);
		}
	};

	const handleError = (err) => {
		console.error("Error de cámara:", err);
		setError("No se pudo acceder a la cámara. Revisa permisos.");
	};

    const handleClose = () => {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
        }
		navigate("/dashboard");
	};

	return (
		<div className="scanner-container">
			<Header />

			<main className="scanner-main">
				<h2 className="scanner-title">Escanear Código QR</h2>

                {/* Modal para solicitar permiso de cámara */}
				<Modal
					show={!hasPermission}
					title="Permitir acceso a la cámara"
					message={
						/iPhone|iPad|iPod/i.test(navigator.userAgent)
							? "iOS te pedirá permiso en la siguiente ventana."
							: "Necesitamos tu autorización para poder escanear códigos QR."
					}
					onClose={handleClose}
				>
					<button onClick={startCamera} className="asc-btn">
						📸 Permitir acceso
					</button>

					{error && <p className="error-message">{error}</p>}
				</Modal>
				
				{hasPermission && (
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
                            video={{ ref: videoRef }}
                        />

                        {/* 💡 Botón de linterna */}
						{torchAvailable && (
                            <button
                                className={`flash-toggle ${torchEnabled ? "on" : "off"}`}
                                onClick={toggleTorch}
                            >
                                {torchEnabled ? "💡 Apagar" : "🔦 Encender"}
                            </button>
                        )}
                    </div>
                )}

				{/* 🔹 Mostrar resultado */}
				{scanResult && (
					<div className="scan-result">
						<h3>Resultado:</h3>
						<p>{scanResult}</p>
					</div>
				)}

				{error && <p className="error-message">{error}</p>}
			</main>
		</div>
	);
};

export default Scanner;