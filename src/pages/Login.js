import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/login.css';
import logo from '../assets/images/sys-img/asc-logo.png';
import Loader from '../components/loader';

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		let loginSuccess = false;

		try {
			const response = await fetch('https://www.allstockcontrol.com/api/login.php', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					login_email: email,
					login_password: password,
					app_login: 'true' // Por si quieres distinguir desde el backend
				}),
			});

			const data = await response.json();
			console.log('Login response:', data);

			if (data.success && data.token) {
				loginSuccess = true;
				setErrorMessage('');
				// ✅ Guardar el token en el almacenamiento local
				localStorage.setItem('authToken', data.token);

				setTimeout(() => {
					setLoading(false); 
					navigate('/dashboard');
				}, 2000);
				return;
			} else {
				setErrorMessage(data.message || 'Incorrect credentials.');
			}

		} catch (error) {
			console.error('Error al hacer login:', error);
			setErrorMessage('Server connection error.');
		} finally {
			if (!loginSuccess) setLoading(false);
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