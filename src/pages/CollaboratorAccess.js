import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../utils/functions";
import Header from "../components/Header";
import "../assets/styles/collaborator-access.css";

const CollaboratorAccess = () => {
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState({});
	const [error, setError] = useState("");

	useEffect(() => {
		 const loadEverything = async () => {
            await loadUser();
            await loadPermissions();
            setLoading(false);
        };

        loadEverything();
	}, []);

	const loadUser = async () => {
		try {
			const data = await apiFetch(
				`https://www.allstockcontrol.com/api/get_users.php?id=${id}`
			);

			if (!data.success) {
				setError(data.message);
				return;
			}
			setUser(data.user);

		} catch (err) {
			setError("Error loading user.");
		}
	};

    // 🟩 Obtener permisos actuales del usuario
	const loadPermissions = async () => {
		try {
			const res = await apiFetch(
				`https://www.allstockcontrol.com/api/get_co_workers_rights.php?user_id=${id}`
			);

			if (res.success) {
				setPermissions(res.data || {});
			} else {
				setPermissions({});
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

    // 🟧 Cambiar un permiso (toggle)
	const togglePermission = async (key) => {
        const newValue = !permissions[key];

        setPermissions((prev) => ({
            ...prev,
            [key]: newValue,
        }));

        // Guardar en servidor
        try {
            const body = new URLSearchParams({
                user_id: id,
                [key]: newValue ? "1" : "0"
            });

            const data = await apiFetch(
                "https://www.allstockcontrol.com/api/update_co_workers_rights.php",
                {
                    method: "POST",
                    body
                }
            );

            if (!data.success) {
                alert("Error saving permission");
            }

        } catch (err) {
            console.error("Error updating permission", err);
        }
    };

	return (
        <div className="dashboard-container">
            <Header />

            <main className="list-wrapp">
                <h1 className="dashboard-title">User Access Options</h1>

                {loading && <p>Loading...</p>}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {!loading && user && (
                    <div className="access-card">

                        {/* Perfil */}
                        <div className="profile-section">
                            <div 
                                className={`profile-avatar ${
                                    Number(user.status) === 1 ? "avatar-active" : "avatar-inactive"
                                }`}
                            >
                                {user.image ? (
                                    <img
                                        src={`https://www.allstockcontrol.com/images/profile/${user.image}`}
                                        alt={user.full_name}
                                    />
                                ) : (
                                    <img
                                        src={`https://www.allstockcontrol.com/images/sys-img/NonProfilePic.png`}
                                        alt={user.full_name}
                                    />
                                )}
                            </div>

                            <div className="profile-info">
                                <h2>{user.full_name}</h2>
                                <p>{user.email}</p>
                                <p>Role: {user.rank_text}</p>
                            </div>
                        </div>

                        {/* PERMISOS */}
                        <div className="access-rights-form">
                            <input type="hidden" name="user_id" value={id} />

                            <table style={{ margin: "0 auto" }} width="95%" cellSpacing="0">
                                <tbody>
                                    {/* SHIPPING ACCESS */}
                                    <tr className="form_height" valign="baseline">
                                        <td
                                            width="70%"
                                            style={{
                                                borderBottom: "1px solid var(--clr-border)",
                                                padding: "15px 10px"
                                            }}
                                        >
                                            <span style={{ display: "block" }}>Shipping Access</span>
                                        </td>

                                        <td
                                            width="30%"
                                            style={{
                                                borderBottom: "1px solid var(--clr-border)",
                                                padding: "15px 10px",
                                                textAlign: "right"
                                            }}
                                        >
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={!!permissions.shipping_access}
                                                    onChange={() => togglePermission("shipping_access")}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </td>
                                    </tr>

                                    {/* SALE ACCESS */}
                                    <tr className="form_height" valign="baseline">
                                        <td
                                            width="70%"
                                            style={{
                                                borderBottom: "1px solid var(--clr-border)",
                                                padding: "15px 10px"
                                            }}
                                        >
                                            <span style={{ display: "block" }}>Sale Access</span>
                                        </td>

                                        <td
                                            width="30%"
                                            style={{
                                                borderBottom: "1px solid var(--clr-border)",
                                                padding: "15px 10px",
                                                textAlign: "right"
                                            }}
                                        >
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={!!permissions.sale_access}
                                                    onChange={() => togglePermission("sale_access")}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </td>
                                    </tr>

                                    {/* SUBSECTION: MOBILE */}
                                    <tr className="form_height" valign="baseline">
                                        <td
                                            colSpan="6"
                                            style={{
                                                borderBottom: "1px solid var(--clr-neutral-dark)",
                                                textAlign: "center"
                                            }}
                                        >
                                            <h4 style={{
                                                marginBottom: "10px"
                                            }}>Mobile</h4>
                                        </td>
                                    </tr>

                                    {/* SHIPPING STATUS NOTICE */}
                                    <tr className="form_height" valign="baseline">
                                        <td
                                            width="70%"
                                            style={{
                                                borderBottom: "1px solid var(--clr-border)",
                                                padding: "15px 10px"
                                            }}
                                        >
                                            <span style={{ display: "block" }}>Shipping Status Notice</span>
                                        </td>

                                        <td
                                            width="30%"
                                            style={{
                                                borderBottom: "1px solid var(--clr-border)",
                                                padding: "15px 10px",
                                                textAlign: "right"
                                            }}
                                        >
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={!!permissions.shipping_status_notice}
                                                    onChange={() => togglePermission("shipping_status_notice")}
                                                />
                                                <span className="slider round"></span>
                                            </label>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CollaboratorAccess;