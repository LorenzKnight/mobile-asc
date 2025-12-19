import React, { useState, useRef, useEffect } from "react";
import { QrScanner } from "@yudiel/react-qr-scanner";
import { apiFetch } from "../utils/functions";
import Modal from "../components/Modal";
import Header from "../components/Header";

const ScanProduct = () => {
    const [hasPermission, setHasPermission] = useState(false);
    const [scannedCode, setScannedCode] = useState(null);
    const [product, setProduct] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState(1);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);

	const [showCreateModal, setShowCreateModal] = useState(false);
	// Imagen
	const [productImage, setProductImage] = useState(null);

	// Tipo de unidad
	const [unitType, setUnitType] = useState("1");

	// Unidades por paquete (solo si unitType === 2)
	const [units, setUnits] = useState(1);

	// Peso por unidad
	const [weightUnit, setWeightUnit] = useState("");

	// Peso total (auto calculado)
	const [totalWeight, setTotalWeight] = useState("");

	// Datos del producto
	const [productName, setProductName] = useState("");
	const [hsCode, setHsCode] = useState("");
	const [productType, setProductType] = useState("");
	const [productYear, setProductYear] = useState("");
	const [productMark, setProductMark] = useState("");
	const [productModel, setProductModel] = useState("");
	const [productSubModel, setProductSubModel] = useState("");
	const [productPurpose, setProductPurpose] = useState("");
	const [quantity, setQuantity] = useState(0);
	const [minQty, setMinQty] = useState(0);
	const [currency, setCurrency] = useState("");
	const [price, setPrice] = useState("");
	const [description, setDescription] = useState("");
	const [creating, setCreating] = useState(false);

    const [error, setError] = useState(null);

    const streamRef = useRef(null);
    const cameraStarted = useRef(false);

	useEffect(() => {
		if (unitType === "2" && weightUnit && units) {
			setTotalWeight((parseFloat(weightUnit) * parseInt(units)).toFixed(2));
		} else {
			setTotalWeight(weightUnit || "");
		}
	}, [unitType, weightUnit, units]);

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

            const response = await fetch(
                "https://www.allstockcontrol.com/api/update_product_stock.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                    },
                    body
                }
            );

            const text = await response.text();
            let res = {};

            try {
                res = JSON.parse(text);
            } catch (err) {
                console.error("❌ ERROR: Backend devolvió texto no-JSON:", text);
                alert("Server returned an invalid response.");
                return;
            }

            if (res.success) {
				setSuccessData(res.data);
				setShowSuccessModal(true);
            } else {
                alert(`Error: ${res.message}`);
            }

        } catch (err) {
            console.error("❌ Error saving stock", err);
            alert("Error saving stock");
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

	const createProduct = async () => {
		if (!productName.trim()) {
			alert("Product name is required.");
			return;
		}

		setCreating(true);

		const body = new URLSearchParams({
			product_name: productName,
			quantity: quantity,
			hs_code: scannedCode, // o barcode si tu DB usa ese campo
		});

		try {
			const response = await fetch(
				"https://www.allstockcontrol.com/api/create_product.php",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						"Authorization": `Bearer ${localStorage.getItem("authToken")}`
					},
					body
				}
			);

			const text = await response.text();
			let res = {};

			try {
				res = JSON.parse(text);
			} catch (err) {
				console.error("❌ Invalid JSON:", text);
				alert("Server error.");
				return;
			}

			if (res.success) {
				alert("Product created successfully!");

				// Reset fields
				setProductName("");
				setQuantity(0);
				setShowCreateModal(false);

				// Restart scanning
				resetScanner();
				setTimeout(() => startCamera(), 300);

			} else {
				alert("Error: " + res.message);
			}

		} catch (err) {
			console.error(err);
			alert("Network error.");
		}

		setCreating(false);
	};

	const handleImageUpload = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = () => {
			setProductImage(reader.result); // base64 para preview
		};
		reader.readAsDataURL(file);
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
                
                    <div className="camera-view">
                        <QrScanner
                            onDecode={(result) => handleScan(result)}
                            onError={(error) => console.error(error?.message)}
                        />
                    </div>
                )}

                {/* ⏳ Loading */}
                {loading && <p>Searching...</p>}

                {/* 🟦 Producto encontrado */}
                {product && (() => {
                    const unitImg =
                        product.sale_unit_type === "1" || product.sale_unit_type === null
                            ? "images/sys-img/papel-box.png"
                            : "images/sys-img/wooden-box.png";
                    return (
                        <>
                            <div className="product-box">
                                {/* {console.log(product)} */}
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
							{/* <button 
								className="scan-btn"
								onClick={() => setShowCreateModal(true)}
							>
								Create New Product
							</button> */}

                            <button className="scan-btn" onClick={resetScanner}>
                                Scan Again
                            </button>
                        </div>
                    </>
                )}
            </main>

            <Modal
				show={showSuccessModal}
				title="Stock Updated!"
				showCloseButton={false}
				onClose={() => setShowSuccessModal(false)}
			>
				{successData && (
					<div style={{ textAlign: "center" }}>
						<p><strong>Previous stock:</strong> {successData.previous_stock}</p>
						<p><strong>Added:</strong> {successData.added_amount}</p>
						<p><strong>New stock:</strong> {successData.new_stock}</p>

						<button
							className="asc-btn"
							style={{ marginTop: "15px" }}
							onClick={() => {
								setShowSuccessModal(false);
								setAmountToAdd(1);
								resetScanner();
								setTimeout(() => {
									startCamera();
								}, 300);
							}}
						>
							OK
						</button>
					</div>
				)}
			</Modal>

			<Modal
				show={showCreateModal}
				title="Create New Product"
				showCloseButton={true}
				onClose={() => setShowCreateModal(false)}
			>
				<div className="scroll-form">
					<table width="100%" align="center" cellSpacing="0">
						<tbody>

							{/* IMAGE UPLOAD */}
							<tr valign="baseline" className="form_height">
								<td colSpan="6" align="center">
									<div className="drop-area" id="drop-product-area">
										<img
											className="image-preview"
											src={productImage || ""}
											alt="Product img Preview"
										/>
										<p>Drop image here or click to select</p>
										<input
											type="file"
											accept="image/*"
											id="product_image"
											style={{ display: "none" }}
											onChange={handleImageUpload}
										/>
									</div>
								</td>
							</tr>

							{/* TYPE SELECTION */}
							<tr valign="baseline" className="form_height">
								<td colSpan="3" align="center">
									<div className="modal-medium-input">
										<input
											type="radio"
											id="unit_type_1"
											name="unit_type"
											value="1"
											checked={unitType === "1"}
											onChange={() => setUnitType("1")}
										/>
										<label htmlFor="unit_type_1">Single Unit</label>
									</div>
								</td>

								<td colSpan="3" align="center">
									<div className="modal-medium-input">
										<input
											type="radio"
											id="unit_type_2"
											name="unit_type"
											value="2"
											checked={unitType === "2"}
											onChange={() => setUnitType("2")}
										/>
										<label htmlFor="unit_type_2">Multi Pack</label>
									</div>
								</td>
							</tr>

							{/* UNITS / WEIGHT */}
							<tr valign="baseline" className="form_height">
								<td colSpan="2" align="center">
									<label>Units:</label>
									<input
										className="modal-medium-input"
										type="number"
										placeholder="1 unit"
										disabled={unitType === "1"}
										value={units}
										onChange={(e) => setUnits(e.target.value)}
									/>
								</td>

								<td colSpan="2" align="center">
									<label>Weight/unit (kg):</label>
									<input
										className="modal-medium-input"
										type="text"
										value={weightUnit}
										onChange={(e) => setWeightUnit(e.target.value)}
									/>
								</td>

								<td colSpan="2" align="center">
									<label>Total Weight (kg):</label>
									<input
										className="modal-medium-input"
										type="text"
										value={totalWeight}
										disabled
									/>
								</td>
							</tr>

							{/* NAME + HS CODE */}
							<tr valign="baseline" className="form_height">
								<td colSpan="3" align="center">
									<label>Name:</label>
									<input
										className="modal-medium-input"
										type="text"
										value={productName}
										onChange={(e) => setProductName(e.target.value)}
									/>
								</td>

								<td colSpan="3" align="center">
									<label>Tariff fraction (HS Code):</label>
									<input
										className="modal-medium-input"
										type="text"
										value={scannedCode}
										onChange={(e) => setHsCode(e.target.value)}
									/>
								</td>
							</tr>

							{/* TYPE + YEAR */}
							<tr valign="baseline" className="form_height">
								<td colSpan="3" align="center">
									<label>Type:</label>
									<select
										className="modal-medium-input"
										value={productType}
										onChange={(e) => setProductType(e.target.value)}
									>
										
									</select>
								</td>

								<td colSpan="3" align="center">
									<label>Year:</label>
									<input
										className="modal-medium-input"
										type="number"
										value={productYear}
										onChange={(e) => setProductYear(e.target.value)}
									/>
								</td>
							</tr>

							{/* MARK / MODEL / SUBMODEL */}
							<tr valign="baseline" className="form_height">
								<td colSpan="2" align="center">
									<label>Mark:</label>
									<select
										className="modal-medium-input"
										value={productMark}
										onChange={(e) => setProductMark(e.target.value)}
									/>
								</td>

								<td colSpan="2" align="center">
									<label>Model:</label>
									<select
										className="modal-medium-input"
										value={productModel}
										onChange={(e) => setProductModel(e.target.value)}
									/>
								</td>

								<td colSpan="2" align="center">
									<label>Sub-model:</label>
									<select
										className="modal-medium-input"
										value={productSubModel}
										onChange={(e) => setProductSubModel(e.target.value)}
									/>
								</td>
							</tr>

							{/* PURPOSE / QTY / MIN QTY */}
							<tr valign="baseline" className="form_height">
								<td colSpan="2" align="center">
									<label>Purpose:</label>
									<select
										className="modal-medium-input"
										value={productPurpose}
										onChange={(e) => setProductPurpose(e.target.value)}
									/>
								</td>

								<td colSpan="2" align="center">
									<label>Quantity:</label>
									<input
										className="modal-medium-input"
										type="number"
										value={quantity}
										onChange={(e) => setQuantity(e.target.value)}
									/>
								</td>

								<td colSpan="2" align="center">
									<label>Min Qty:</label>
									<input
										className="modal-medium-input"
										type="number"
										value={minQty}
										onChange={(e) => setMinQty(e.target.value)}
									/>
								</td>
							</tr>

							{/* CURRENCY + PRICE */}
							<tr valign="baseline" className="form_height">
								<td colSpan="3" align="center">
									<label>Currency:</label>
									<select
										className="modal-medium-input"
										value={currency}
										onChange={(e) => setCurrency(e.target.value)}
									/>
								</td>

								<td colSpan="3" align="center">
									<label>Price:</label>
									<input
										className="modal-medium-input"
										type="number"
										value={price}
										onChange={(e) => setPrice(e.target.value)}
									/>
								</td>
							</tr>

							{/* DESCRIPTION */}
							<tr valign="baseline" className="form_height">
								<td colSpan="6" align="center">
									<label>Description:</label>
									<textarea
										className="modal-big-input"
										rows="3"
										value={description}
										onChange={(e) => setDescription(e.target.value)}
									></textarea>
								</td>
							</tr>

						</tbody>
					</table>
				</div>
					<button
						className="asc-btn"
						disabled={creating}
						onClick={createProduct}
					>
						{creating ? "Saving..." : "Save Product"}
					</button>
			</Modal>
        </div>
    );
};

export default ScanProduct;