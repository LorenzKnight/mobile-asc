import React, { useState, useRef, useEffect } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { apiFetch } from "../utils/functions";
import Modal from "../components/Modal";
import Header from "../components/Header";
import "../assets/styles/scan-product.css";

const ScanProduct = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [scannedCode, setScannedCode] = useState(null);
    const [product, setProduct] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState(1);
    const [error, setError] = useState(null);

    const streamRef = useRef(null);
    const cameraStarted = useRef(false);

    // 🔵 Verificar permiso de la cámara
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const saved = localStorage.getItem("camera_permission");
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

                // Browser real permission
                if (navigator.permissions && navigator.permissions.query) {
                    const res = await navigator.permissions.query({ name: "camera" });
                    if (res.state === "granted") {
                        setHasPermission(true);
                        if (!isIOS) startCamera();
                        return;
                    }
                }

                // Saved permission of app
                if (saved === "granted") {
                    setHasPermission(true);
                    if (!isIOS) startCamera();
                    return;
                }

                setHasPermission(false);
            } catch {
                setHasPermission(false);
            }
        };

        checkPermission();
        return () => stopCamera();
    }, []);

    // 🔴 Apagar cámara por completo
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        const vid = document.querySelector(".qr-scanner video");
        if (vid && vid.srcObject) {
            vid.srcObject.getTracks().forEach(t => t.stop());
            vid.srcObject = null;
        }

        cameraStarted.current = false;
    };

    // 🟢 Encender cámara
    const startCamera = async () => {
        try {
            if (cameraStarted.current) return;
            cameraStarted.current = true;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            streamRef.current = stream;
            setHasPermission(true);
            localStorage.setItem("camera_permission", "granted");
        } catch (err) {
            setError("Cannot access the camera.");
            setHasPermission(false);
        }
    };

    const playBeep = () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    };

    const handleScan = async (code) => {
        if (!code || loading) return;

        playBeep();
        navigator.vibrate?.(120);

        stopCamera();
        setScannedCode(code);
        setLoading(true);

        // 🔎 Buscar en API si existe el producto con ese código
        try {
            const data = await apiFetch(
                `https://www.allstockcontrol.com/api/get_products.php?barcode=${code}`
            );

            if (data.success && data.product) {
                setProduct(data.product);
                setNotFound(false);
            } else if (data.success && data.product === null) {
                setProduct(null);
                setNotFound(true);
            } else {
                setProduct(null);
                setNotFound(true);
            }
        } catch (err) {
            console.error("Error loading product", err);
            setProduct(null);
            setNotFound(true);
        }

        setLoading(false);
    };

    const addStock = async (amount = 1) => {
        try {
            const body = new URLSearchParams({
                product_id: product.product_id,
                amount: amount
            });

            const res = await apiFetch(
                "https://www.allstockcontrol.com/api/add_stock.php",
                {
                    method: "POST",
                    body
                }
            );

            if (res.success) {
                alert("Stock updated!");
            } else {
                alert("Error updating stock.");
            }
        } catch (err) {
            console.error("Error saving stock", err);
        }
    };

    const resetScanner = () => {
        stopCamera();
        setScannedCode(null);
        setProduct(null);
        setNotFound(false);
        setLoading(false);
        setTimeout(() => setHasPermission(true), 250);
    };

    return (
        <div className="scanner-container">
            <Header />

            <main className="scanner-main">
                <h2 className="scanner-title">Scan Product</h2>

                {/* 🔒 Modal si NO tiene permiso de cámara */}
                <Modal
                    show={!hasPermission}
                    title="Allow Camera Access"
                    message="We need access to your camera to scan products."
                >
                    <button
                        className="asc-btn"
                        onClick={() => {
                            navigator.mediaDevices.getUserMedia({ video: true })
                                .then(() => {
                                    setHasPermission(true);
                                    localStorage.setItem("camera_permission", "granted");
                                    startCamera();
                                })
                                .catch(() => setError("Camera permission denied."));
                        }}
                    >
                        Allow Access
                    </button>

                    {error && <p className="error-message">{error}</p>}
                </Modal>

                {/* 🟢 Scanner visible SOLO cuando no se ha escaneado código */}
                {/* hasPermission && */ !scannedCode && (
                
                    <div className="scanner-box">
                        <QrScanner
                            onDecode={(result) => handleScan(result)}
                            onError={(error) => console.error(error?.message)}
                        />
                    </div>
                )}

                {/* ⏳ Loading */}
                {loading && <p className="loading-text">Searching...</p>}

                {/* 🟦 Producto encontrado */}
                {product && (() => {
                    const unitImg =
                        product.sale_unit_type === "1" || product.sale_unit_type === null
                            ? "images/sys-img/papel-box.png"
                            : "images/sys-img/wooden-box.png";
                    return (
                        <>
                            <div className="product-box">
                                {console.log(product)}
                                <div className="product-pic">
                                    {product.product_image ? (
                                        <img
                                            src={`https://www.allstockcontrol.com/images/products/${product.product_image}`}
                                            alt={product.product_name}
                                        />
                                    ) : (
                                        <img
                                            src={`https://www.allstockcontrol.com/${unitImg}`}
                                            alt={product.product_name}
                                            className="grayscale-img"
                                        />
                                    )}
                                </div>
                                <div className="product-desc">
                                    <table width="90%" align="center" cellSpacing="0">
                                        <tbody>
                                            <tr valign="baseline">
                                                <td style={{ width: "50%", height: "10px" }}>
                                                    <strong style={{ margin: "10px 0 0" }}>{product.product_name}</strong>
                                                    <p className="mini-title" style={{ margin: 0 }}>
                                                        {product.hs_code || ""}
                                                    </p>
                                                </td>

                                                <td style={{ width: "50%", height: "10px" }} align="right">
                                                    <p style={{ margin: "10px 0 0" }}>
                                                        Qty: <strong>{product.quantity || ""}</strong>
                                                    </p>
                                                    <p className="mini-title" style={{ margin: 0 }}>
                                                        {product.purpose_text || ""}
                                                    </p>
                                                </td>
                                            </tr>

                                            <tr valign="baseline">
                                                <td colSpan="6" style={{ height: "10px" }}>
                                                    <h3>
                                                        <strong>{product.mark_name} - {product.model_name}</strong>
                                                    </h3>
                                                </td>
                                            </tr>

                                            <tr valign="baseline">
                                                <td colSpan="6" style={{ height: "10px" }}>
                                                    {product.submodel_name || ""}
                                                </td>
                                            </tr>

                                            <tr valign="baseline">
                                                <td style={{ width: "50%", borderTop: "1px solid #CCC" }}>
                                                    <p>
                                                        Year<br />
                                                        <strong>
                                                            {product.product_year === 0 || product.product_year == null
                                                                ? "N/E"
                                                                : product.product_year}
                                                        </strong>
                                                    </p>
                                                </td>

                                                <td style={{ width: "50%", borderTop: "1px solid #CCC" }}>
                                                    <p>
                                                        Price<br />
                                                        <strong>
                                                            {product.price
                                                                ? `$${product.price} ${product.currency}`
                                                                : ""}
                                                        </strong>
                                                    </p>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="product-input-container">
                                <div className="amount-box">   
                                    <label htmlFor="amount">Amount to Add: </label>
                                    <input
                                        id="amount"
                                        type="number"
                                        min="1"
                                        value={amountToAdd}
                                        onChange={(e) => setAmountToAdd(e.target.value)}
                                        className="amount-input"
                                    />
                                </div>
                            </div>
                            <div className="product-button-container">
                                <button
                                    className="scan-btn"
                                    onClick={() => addStock(amountToAdd)}
                                >
                                    + Add {amountToAdd} to Stock
                                </button>

                                <button className="scan-btn" onClick={resetScanner}>
                                    Scan Another Product
                                </button>
                            </div>
                        </>
                    );
                })()}

                {/* 🟥 Producto NO encontrado → formulario de creación */}
                {notFound && (
                    <>
                        <div className="notfound-box">
                            <span style={{ fontSize: "36px" }}>⚠️</span>
                            <h2>
                                No product found
                            </h2>
                            <p>New barcode: <strong>{scannedCode}</strong></p>

                            
                        </div>
                        <div className="product-button-container">
                            <a
                                href={`/create-product?barcode=${scannedCode}`}
                                className="scan-btn"
                            >
                                Create New Product
                            </a>

                            <button className="scan-btn" onClick={resetScanner}>
                                Scan Again
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ScanProduct;