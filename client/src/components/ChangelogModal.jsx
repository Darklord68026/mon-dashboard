import React from 'react';

export default function ChangelogModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    // Tes données de mise à jour (Tu pourras en ajouter ici plus tard)
    const updates = [
        {
            version: "2.0.0 - La Révolution React",
            date: "9 Janvier 2026",
            features: [
                "🚀 Migration complète vers React (SPA).",
                "⚡ Performances accrues et navigation fluide.",
                "🖱️ Ajout du Drag & Drop pour trier les tâches.",
                "🔒 Sécurité renforcée (Rate Limiting API)."
            ]
        },
        {
            version: "1.5.0 - Fonctionnalités Avancées",
            date: "8 Janvier 2026",
            features: [
                "🐍 Ajout du mode secret 'Snake' (Konami Code).",
                "🌦️ Widget Météo avec géolocalisation précise.",
                "🎨 Fond d'écran dynamique selon la météo locale."
            ]
        }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🚀 Nouveautés <span className="new-tag">LIVE</span></h2>
                    <button onClick={onClose} className="btn-icon">&times;</button>
                </div>
                
                <p className="modal-desc">Voici les dernières améliorations déployées en production.</p>

                <div className="changelog-timeline">
                    {updates.map((update, index) => (
                        <div key={index} className="changelog-item">
                            <span className="changelog-date">{update.date}</span>
                            <h3 className="changelog-title">{update.version}</h3>
                            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                                {update.features.map((feat, i) => (
                                    <li key={i} className="changelog-desc">{feat}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={onClose} 
                    style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#333', border: 'none', color: 'white', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Génial, j'ai compris ! 👍
                </button>
            </div>
        </div>
    );
}