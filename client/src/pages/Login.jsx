import { useState } from "react";
import { apiCall } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        // appel API basé sur auth.js
        const data = await apiCall('/login', 'POST', { username, password });

        if (data && data.token) {
            localStorage.setItem('token', data.token);
            navigate('/dashboard');
        } else {
            setError('Nom d\'utilisateur ou mot de passe incorrect.');
        }
    };
    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Bienvenue</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Utilisateur"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                    />
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />

                    <div className="auth-buttons">
                        <button type="submit">Se connecter</button>
                        {/* //TODO: implement register page */}
                        <button type="button" className="secondary-btn">S'inscrire</button>
                    </div>
                    {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
                </form>
            </div>
        </div>
    );
}