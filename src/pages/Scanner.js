import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QrScanner } from "@yudiel/react-qr-scanner";
import Modal from "../components/Modal";
import Header from "../components/Header";
import "../assets/styles/scanner.css";

const Scanner = () => {
    const [hasPermission, setHasPermission] = useState(false);
	const [error, setError] = useState(null);
    const [torchEnabled, setTorchEnabled] = useState(false);
	const [torchAvailable, setTorchAvailable] = useState(false);
    const streamRef = useRef(null);

    const navigate = useNavigate();
	const cameraStarted = useRef(false);

    useEffect(() => {
        const checkCameraPermission = async () => {
			try {
				const savedPermission = localStorage.getItem("camera_permission");
				const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

				// 🔍 Detectar permisos reales del navegador
				if (navigator.permissions && navigator.permissions.query) {
					const result = await navigator.permissions.query({ name: "camera" }).catch(() => null);
					if (result && result.state === "granted") {
						// console.log("✅ Permiso de cámara confirmado por el navegador");
						setHasPermission(true);
						if (!isIOS) startCamera(); // autoabrir si no es iOS
						return;
					}
				}

				// 🧭 Si el permiso fue guardado manualmente, intentar abrir cámara
				if (savedPermission === "granted") {
					setHasPermission(true);
					if (!isIOS) startCamera();
					return;
				}

				// 🚫 Si no tiene permiso guardado ni concedido, mostrar popup
				setHasPermission(false);
			} catch (err) {
				setHasPermission(false);
			}
		};

		checkCameraPermission();

		return () => {
			fullStopCamera();
		};
    }, []); // ✅ sin dependencias

	const fullStopCamera = () => {
		// 1️⃣ Detener track del stream local
		if (streamRef.current) {
			streamRef.current.getTracks().forEach(t => t.stop());
			streamRef.current = null;
		}

		// 2️⃣ Detener cualquier stream activo del navegador
		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then((tempStream) => {
				tempStream.getTracks().forEach((t) => t.stop());
			})
			.catch(() => {});

		// 3️⃣ Detener el video interno del QR Scanner
		const vid = document.querySelector(".qr-scanner video");
		if (vid && vid.srcObject) {
			vid.srcObject.getTracks().forEach((t) => t.stop());
			vid.srcObject = null;
		}

		// 4️⃣ Reset de torch y flags
		setTorchEnabled(false);
		cameraStarted.current = false;
	};

    const startCamera = async () => {
        try {
			if (cameraStarted.current) return;
			cameraStarted.current = true;

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            streamRef.current = newStream;
            setHasPermission(true);
            localStorage.setItem("camera_permission", "granted");

			const track = newStream.getVideoTracks()[0];
			const caps = track.getCapabilities();

			if (caps && caps.torch) {
				setTorchAvailable(true);
			} else {
				setTorchAvailable(false);
			}
        } catch (err) {
            console.error("Error accessing the camera:", err);
            setError("The camera could not be accessed. Please check your browser's permissions.");
            setHasPermission(false);
        }
    };

    const toggleTorch = async () => {
        if (!streamRef.current) return;

		try {
			const track = streamRef.getVideoTracks()[0];
			await track.applyConstraints({
				advanced: [{ torch: !torchEnabled }],
			});
			setTorchEnabled(!torchEnabled);
		} catch (err) {
			console.error("Error toggling torch", err);
		}
    };

    const playBeep = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const osc = ctx.createOscillator();
		osc.type = "square";
		osc.frequency.setValueAtTime(1000, ctx.currentTime);
		osc.connect(ctx.destination);
		osc.start();
		osc.stop(ctx.currentTime + 0.15);
    };

	const handleScan = (data) => {
		if (!data) return;
		playBeep();
		navigator.vibrate?.(120);

		fullStopCamera(); // detiene antes de ir a otra vista

		navigate(`/scan-result/${encodeURIComponent(data)}`);
	};

	const handleError = (err) => {
		console.error(err);
		setError("Camera error");
	};

    const handleClose = () => {
        fullStopCamera();
		navigate("/dashboard");
	};

	return (
		<div className="scanner-container">
			<Header />

			<main className="scanner-main">
				<h2 className="scanner-title">Scan QR Code</h2>

                {/* Modal para solicitar permiso de cámara */}
				<Modal
					show={!hasPermission}
					title="Permitir acceso a la cámara"
					message={
						/iPhone|iPad|iPod/i.test(navigator.userAgent)
							? "iOS will ask for your permission in the next window."
							: "We need your authorization to scan QR codes."
					}
					onClose={handleClose}
				>
					<button onClick={startCamera} className="asc-btn">
						Allow access
					</button>

					{error && <p className="error-message">{error}</p>}
				</Modal>
				
				{hasPermission && (
                    <div className="camera-view">
                        <QrScanner
                            onDecode={handleScan}
                            onError={handleError}
                            scanDelay={200}
							beep={false} // desactivado, usamos custom
                            style={{ width: "100%", height: "100%" }}
                            constraints={{
                                facingMode: "environment", // Cámara trasera
                                aspectRatio: 1,            // Mantiene proporción cuadrada
                            }}
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

				{error && <p className="error-message">{error}</p>}
			</main>
		</div>
	);
};

export default Scanner;