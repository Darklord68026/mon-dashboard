import { useEffect, useState } from 'react';
import { apiCall } from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Chargement des données utilisateur au montage
        async function loadUser() {
            const userData = await apiCall('/user/me');
            if (!userData) {
                navigate('/'); // Si pas de user, retour au login
            } else {
                setUser(userData);
            }
        }
        loadUser();
    }, [navigate]);

    if (!user) return <div className="login-container"><div className="login-box">Chargement...</div></div>;

    return (
        <div id="dashboard-screen">
            <header>
                <button className="burger-icon">☰</button>
                <div className="clock-floating">
                    {/* On remettra l'heure plus tard */}
                    12:00
                </div>
            </header>

            <main className="dashboard-container">
                <section className="widget">
                    <h2>Bienvenue, {user.username} 👋</h2>
                    <p>Migration React en cours...</p>
                    <button onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/');
                    }} className="delete-btn" style={{marginTop: '20px'}}>
                        Déconnexion
                    </button>
                </section>
            </main>
        </div>
    );
}