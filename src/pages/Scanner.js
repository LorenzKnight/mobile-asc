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
	const cameraStartedRef = useRef(false);

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
				console.warn("Error verificando permiso de cámara:", err);
				setHasPermission(false);
			}
		};

		checkCameraPermission();

		const stopCameraHandler = () => {
			if (stream) {
				stream.getTracks().forEach((t) => t.stop());
				console.log("📷 Cámara detenida desde Header");
			}

			if (videoRef.current) videoRef.current.srcObject = null;
			cameraStartedRef.current = false;
		};

		window.addEventListener("stopCamera", stopCameraHandler);

		return () => {
			if (stream) {
				stream.getTracks().forEach((t) => t.stop());
				console.log("📷 Cámara detenida al desmontar Scanner");
			}

			cameraStartedRef.current = false;
			window.removeEventListener("stopCamera", stopCameraHandler);
		};
    }, []); // ✅ sin dependencias

	useEffect(() => {
		const blockBeepAudio = () => {
			// 1️⃣ Eliminar cualquier <audio> que intente cargar scanner-beep
			document.querySelectorAll('audio[src*="scanner-beep"]').forEach((audio) => {
				console.log("🧹 Eliminando intento de beep interno");
				audio.pause();
				audio.removeAttribute("src");
				audio.load();
				audio.remove();
			});

			// 2️⃣ Interceptar futuras creaciones del audio
			const observer = new MutationObserver(() => {
				const audios = document.querySelectorAll('audio[src*="scanner-beep"]');
				if (audios.length > 0) {
					audios.forEach((a) => {
						console.log("🚫 Bloqueado beep interno antes de cargar");
						a.pause();
						a.removeAttribute("src");
						a.load();
						a.remove();
					});
				}
			});

			observer.observe(document.body, { childList: true, subtree: true });
			return observer;
		};

		const observer = blockBeepAudio();
		return () => observer.disconnect();
	}, []);

    const startCamera = async () => {
        try {
			if (cameraStartedRef.current) return;
			cameraStartedRef.current = true;

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            setStream(newStream);
            setHasPermission(true);
            localStorage.setItem("camera_permission", "granted");

			const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
			if (isIOS) {
				setTorchAvailable(false);
				return;
			}

            if (videoRef.current) {
				videoRef.current.srcObject = newStream;

				videoRef.current.onloadedmetadata = () => {
					const track = newStream.getVideoTracks()[0];
					const capabilities = track.getCapabilities();
					if (capabilities && capabilities.torch) {
						console.log("💡 Torch disponible en este dispositivo");
						setTorchAvailable(true);
					} else {
						console.log("❌ Torch no disponible");
					}
				};
			}
        } catch (err) {
            console.error("Error accessing the camera:", err);
            setError("The camera could not be accessed. Please check your browser's permissions.");
            setHasPermission(false);
        }
    };

    const toggleTorch = async () => {
        try {
            if (!stream) return;

            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (!capabilities.torch) {
                alert("Your device does not have a compatible flashlight.");
                return;
            }

            await track.applyConstraints({
                advanced: [{ torch: !torchEnabled }],
            });
            setTorchEnabled(!torchEnabled);
        } catch (err) {
            console.error("Error controlling flashlight:", err);
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
		console.error("Camera error:", err);
		setError("The camera could not be accessed. Check permissions.");
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
						<h3>Result:</h3>
						<p>{scanResult}</p>
					</div>
				)}

				{error && <p className="error-message">{error}</p>}
			</main>
		</div>
	);
};

export default Scanner;