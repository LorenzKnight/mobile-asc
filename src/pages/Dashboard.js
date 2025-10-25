import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const token = localStorage.getItem('authToken');

		if (!token) {
			navigate('/');
			return;
		}

		try {
			const [, payloadBase64] = token.split('.');
			const payload = JSON.parse(atob(payloadBase64));
			const isExpired = payload.exp * 1000 < Date.now();
			if (isExpired) {
				console.warn("Token expirado (frontend)");
				localStorage.removeItem('authToken');
				navigate('/');
				return;
			}
		} catch {
			localStorage.removeItem('authToken');
			navigate('/');
			return;
		}

		const fetchUserInfo = async () => {
			try {
				const response = await fetch('https://www.allstockcontrol.com/api/get_my_info.php', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
				},
				credentials: 'include' // 🔥 IMPORTANTE: permite enviar cookies/sesiones al backend
				});

				const data = await response.json();
				console.log("User info:", data);

				if (data.message && data.message.toLowerCase().includes('expired')) {
					console.warn("Token expirado (backend)");
					localStorage.removeItem('authToken');
					navigate('/');
					return;
				}

				if (data.success) {
					setUser(data.data);
					
					const fullName = `${data.data.name} ${data.data.surname}`;
					localStorage.setItem('userName', fullName);
					console.log('Usuario logeado:', fullName);
				} else {
					console.warn('No se pudo obtener la información del usuario:', data.message);
				}
			} catch (err) {
				console.error("Error al obtener datos del usuario:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchUserInfo();
	}, [navigate]);

	if (loading) return <p>Cargando información...</p>;
	if (!user) return <p>No se pudo obtener la información del usuario.</p>;

	return (
		<div>
		<h1>Dashboard</h1>
		<p>Bienvenido, <strong>{user.name} {user.surname}</strong></p>
		<p>Email: {user.email}</p>
		<p>Plan: {user.package_info?.package_name || 'Sin plan'}</p>

		<button onClick={() => {
			localStorage.removeItem('authToken');
			navigate('/');
		}}>
			Cerrar sesión
		</button>
		</div>
	);
}

export default Dashboard;