import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/login.css';
import logo from '../assets/images/sys-img/asc-logo.png';
import Loader from '../components/loader';
import { enablePushNotifications } from "../utils/functions";

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setErrorMessage('');

		try {
			if (!navigator.onLine) {
				throw new Error('No internet connection.');
			}

			localStorage.removeItem("authToken");
			localStorage.removeItem("refreshToken");

			const response = await fetch('https://www.allstockcontrol.com/api/login.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'X-App-Client': 'mobile',
				},
				body: new URLSearchParams({
					login_email: email,
					login_password: password,
					app_login: 'true' // Por si quieres distinguir desde el backend
				}),
			});

			const data = await response.json();
			// console.log('Login response:', data);

			if (data.success && data.token) {
				// ✅ Guardar el token en el almacenamiento local
				localStorage.setItem('authToken', data.token);

				if (data.refresh_token) {
					localStorage.setItem("refreshToken", data.refresh_token);
				}

				enablePushNotifications().catch(() => {});

				setTimeout(() => {
					setLoading(false); 
					navigate('/dashboard');
				}, 1000);
			} else {
				setLoading(false);
				setErrorMessage(data.message || 'Incorrect credentials.');
			}

		} catch (error) {
			setLoading(false);

			if (error.message === 'No internet connection.') {
				setErrorMessage('No internet connection. Check Wi-Fi or mobile data.');
			} else if (error.message.includes('Failed to fetch')) {
				setErrorMessage('Unable to reach the server.');
			} else {
				setErrorMessage("Unexpected error. Try again.");
			}
		}
	};

	return (
		<>
			{loading && <Loader message="Entering..." />}

			<div className="page-wrapper">
				<div className="logo-container">
					<img src={logo} alt="AllStock Logo" className="logo-image" />
				</div>
				<div className="login-container">
					<form className="login-form" onSubmit={handleSubmit}>
						<h2 className="login-title">Login</h2>

						<input
							className='form-input-style'
							type="email"
							placeholder="Email"
							value={email}
							required
							onChange={(e) => setEmail(e.target.value)}
						/>

						<input
							className='form-input-style'
							type="password"
							placeholder="Password"
							value={password}
							required
							onChange={(e) => setPassword(e.target.value)}
						/>

						<button className='button-style-agree' type="submit">
							{loading ? 'Entering...' : 'Login'}
						</button>

						{errorMessage && (
							<p className="error-message">{errorMessage}</p>
						)}
					</form>
				</div>
			</div>
		</>
	);
}

export default Login;