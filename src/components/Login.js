import React, { useState } from 'react';
import '../assets/styles/login.css';
import logo from '../assets/images/sys-img/asc-logo.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login data:', { email, password });

    setLoading(true);

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
        // ✅ Guardar el token en el almacenamiento local
        localStorage.setItem('authToken', data.token);

        // ✅ Aquí puedes redirigir al dashboard o setear estado login
        alert("Login exitoso");
        // ejemplo: navigate('/dashboard'); si usas React Router
      } else {
        alert(data.message || 'Credenciales incorrectas');
      }

    } catch (error) {
      console.error('Error al hacer login:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
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

                <button className='button-style-agree' type="submit">Login</button>

                {loading ? 'Ingresando...' : 'Login'}
            </form>
        </div>
    </div>
  );
}

export default Login;