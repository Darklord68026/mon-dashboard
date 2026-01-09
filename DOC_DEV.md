# 📘 Documentation Technique - Dashboard Perso (vFinale)

## 1. 🏗️ Architecture Globale

Le projet est une **Single Page Application (SPA)** modulaire en "Vanilla JS". Il ne repose sur aucun framework frontend (React, Vue), mais utilise une architecture basée sur les modules ES6 natifs.

* **Frontend :** JavaScript (ES6 Modules), HTML5, CSS3.
* **Backend :** Node.js / Express.
* **Base de Données :** MongoDB (via Mongoose).
* **Temps Réel :** Socket.io (Websockets).
* **Authentification :** JWT (JSON Web Token) stocké en `localStorage`.

---

## 2. 📂 Structure du Frontend (`/js`)

Le code est découpé en modules fonctionnels pour assurer la maintenabilité et éviter un fichier monolithique.

| Fichier | Rôle Principal |
| :--- | :--- |
| **`app.js`** | **Chef d'orchestre.** Point d'entrée principal. Il initialise les modules, gère l'état global (`currentUser`), vérifie l'auth au chargement et gère les événements globaux (sidebar, modales). |
| **`api.js`** | **Client HTTP.** Wrapper autour de `fetch`. Gère l'injection automatique du token `Bearer`, le parsing JSON et la gestion centralisée des erreurs (Toasts, Logout forcé 401). |
| **`auth.js`** | **Authentification.** Contient les fonctions de Login, Register, Logout et mise à jour de mot de passe. |
| **`chat.js`** | **Messagerie.** Gère l'UI du chat, le tri des messages (privé/public) et le système de notifications intelligentes (badges/toasts) si le chat est fermé. |
| **`config.js`** | **Configuration.** Exporte `API_URL` et `SOCKET_URL` en détectant automatiquement l'environnement (Localhost vs Prod). |
| **`game.js`** | **Easter Egg.** Logique du jeu Snake qui s'active via le Konami Code. Gère le canvas, la boucle de jeu et les collisions. |
| **`socket.js`** | **WebSockets.** Écoute les événements serveur (`taskAdded`, `chatMessage`, `newSuggestion`) et délègue l'action aux modules UI correspondants. |
| **`ui.js`** | **Vue / DOM.** Contient toutes les fonctions de rendu HTML (`renderTasks`, `showToast`, `updateWeatherUI`), la gestion des filtres et du cache local des tâches. |
| **`weather.js`** | **Météo.** Gère la géolocalisation, l'appel à l'API OpenMeteo et la mise à jour dynamique du background en fonction du code météo. |

---

## 3. ⚙️ Fonctionnalités Clés & Implémentation

### A. Gestion des Tâches (CRUD Temps Réel)
* **Lecture :** `loadTasks` appelle l'API via `api.js`. Les tâches sont mises en cache dans `allTasksCache` (dans `ui.js`) pour permettre le filtrage et le tri instantané sans recharger.
* **Tri & Filtres :** Supporte le tri par date d'échéance (Urgent), date de création (Récent) et filtrage par tags. La logique de tri gère les tâches sans date.
* **Temps Réel :** Lorsqu'une tâche est ajoutée/supprimée/modifiée, le serveur émet un événement Socket. `socket.js` le reçoit et met à jour l'UI directement via `appendTaskToUI`, `removeTaskFromUI` ou `updateTaskInUI`.

### B. Chat & Notifications Intelligentes
Le système de chat est hybride (Général + Privé).
1.  **Réception (`socket.js`) :** Reçoit l'événement `chatMessage` et passe le relais à `chat.js`.
2.  **Filtrage (`chat.js`) :** La fonction `handleIncomingMessage` décide de l'action :
    * Si le message vient de moi (`currentUserId`) : Ignore la notif.
    * Si le chat est fermé OU qu'on regarde une autre conversation : **Notification** (Toast + Badge rouge incrémenté).
    * Si on regarde la bonne conversation : **Affichage direct** (`addMessageToUI`).

### C. Météo & Background
* Utilise l'API **Open-Meteo** (pas de clé API requise).
* Récupère : Température, Vent, Code Météo.
* Envoie le `weatherCode` au backend (`/background`) pour récupérer une image de fond adaptée via Unsplash.

### D. Mode Admin & Suggestions
* Les utilisateurs avec le rôle `admin` voient un bouton "📂 Boîte de réception" dans la sidebar.
* Lorsqu'un utilisateur envoie une suggestion, l'Admin reçoit un Toast spécial en temps réel via Socket (`newSuggestion`).

### E. Sécurité (Frontend)
* **XSS :** Utilisation systématique de `.textContent` pour afficher les données utilisateur (chat, tâches, suggestions) au lieu de `.innerHTML` pour prévenir les injections de scripts.
* **Token :** Le JWT est stocké dans `localStorage` et envoyé automatiquement via le header `Authorization: Bearer` par `api.js`.

---

## 4. 🔌 API Reference (Endpoints utilisés)

### `/auth`
* `POST /login` : Connexion.
* `POST /register` : Inscription.
* `PUT /updatePassword` : Modification du mot de passe.

### `/user`
* `GET /me` : Infos profil + Rôle + Tags.
* `GET /all` : Liste des utilisateurs (pour le sélecteur de chat).
* `PUT /tags` : Mise à jour des catégories/couleurs.

### `/tasks`
* `GET /` : Récupérer toutes les tâches.
* `POST /` : Créer une tâche.
* `PUT /:id` : Modifier une tâche.
* `DELETE /:id` : Supprimer une tâche.

### `/chat`
* `GET /?contactId=...` : Historique des messages (Général ou Privé).
* `POST /` : Envoyer un message (`receiverId` null = Général).

### `/suggestions`
* `POST /` : Envoyer une suggestion.
* `GET /` : (Admin) Lire les suggestions.
* `DELETE /:id` : (Admin) Supprimer.

---

## 5. 🎮 Easter Egg (Snake)
Le jeu est caché et ne se charge pas au démarrage pour optimiser les performances.
* **Activation :** Écouteur global sur `keydown` dans `game.js`.
* **Séquence (Konami Code) :** `ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, b, a`.
* **Logique :** Canvas 2D. Collision avec les murs ou la queue déclenche un Game Over.

---

## 6. 🚀 Déploiement & Environnement

Le fichier `config.js` gère automatiquement l'URL de l'API :
* Si le hostname est `localhost` ou `127.0.0.1` -> API sur `http://127.0.0.1:3000`.
* Sinon (Prod) -> API sur `/api` (Relatif, géré par un proxy inverse comme Nginx).

# 🧱 Documentation Technique - Backend (API & Data)

Cette section détaille l'architecture serveur (Node.js) et la structure des données (MongoDB).

## 1. 🛡️ Sécurité & Middlewares (`server/middleware/`)

Les middlewares sont des fonctions qui s'exécutent **avant** que la requête n'arrive à la logique finale (la route). Ils servent à sécuriser l'application.

### `auth.js` (Authentification)
* **Rôle :** Vérifie l'identité de l'utilisateur sur chaque requête protégée.
* **Fonctionnement :**
    1.  Récupère le token JWT dans le header HTTP `Authorization: Bearer <TOKEN>`.
    2.  Vérifie la signature du token avec `JWT_SECRET`.
    3.  Si valide : Ajoute les infos décryptées dans `req.user` et laisse passer (`next()`).
    4.  Si invalide ou absent : Renvoie une erreur `401 Unauthorized`.

### `admin.js` (Autorisation Admin)
* **Rôle :** Bloque l'accès aux routes sensibles (ex: voir toutes les suggestions).
* **Dépendance :** Doit être placé **après** `auth.js`.
* **Fonctionnement :**
    1.  Utilise `req.user._id` (fourni par `auth.js`) pour chercher l'utilisateur en BDD.
    2.  Vérifie si `user.role === 'admin'`.
    3.  Si non : Renvoie une erreur `403 Forbidden`.
    4.  Si oui : Laisse passer.

---

## 2. 🗄️ Base de Données (Modèles Mongoose)

Les données sont stockées dans **MongoDB**. Nous utilisons **Mongoose** pour définir des schémas stricts.

### 👤 Modèle `User` (`models/User.js`)
Représente un utilisateur inscrit.

| Champ | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `username` | String | `unique`, `required` | Identifiant de connexion. |
| `password` | String | `required` | Mot de passe hashé (bcrypt). |
| `role` | String | Default: `'user'` | Rôle de l'utilisateur (`'user'` ou `'admin'`). |
| `tags` | Array | Default: `[...]` | Liste des catégories perso (`{ name, color }`). Par défaut : Général, Urgent, Devoirs. |

### ✅ Modèle `Task` (`models/Task.js`)
Représente une tâche à faire.

| Champ | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `text` | String | `required` | Contenu de la tâche. |
| `isDone` | Boolean | Default: `false` | État de la tâche. |
| `category` | String | Default: `'Général'` | Nom du tag associé. |
| `dueDate` | Date | - | Date limite (optionnelle). |
| `owner` | ObjectId | Ref: `'User'` | Lien vers l'utilisateur qui a créé la tâche. |
| *Timestamps* | Date | Auto | `createdAt` et `updatedAt` gérés automatiquement. |

### 💬 Modèle `Message` (`models/Message.js`)
Représente un message de chat (Public ou Privé).

| Champ | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `text` | String | `required` | Contenu du message. |
| `sender` | ObjectId | Ref: `'User'` | Auteur du message. |
| `senderName` | String | - | Pseudo de l'auteur (cache pour affichage rapide). |
| `receiver` | ObjectId | Ref: `'User'`, Default: `null` | Destinataire. Si `null`, le message est **Public** (Général). |
| *Timestamps* | Date | Auto | Date d'envoi (`createdAt`). |

### 💡 Modèle `Suggestion` (`models/Suggestion.js`)
Représente une idée envoyée par un utilisateur pour améliorer l'app.

| Champ | Type | Options | Description |
| :--- | :--- | :--- | :--- |
| `text` | String | `required` | Contenu de l'idée. |
| `author` | String | `required` | Pseudo de l'utilisateur (on ne stocke que le string ici). |
| `isRead` | Boolean | Default: `false` | Permet à l'admin de marquer comme lu. |
| `createdAt` | Date | Default: `Date.now` | Date de soumission. |

## 3. 🔌 Routes API (`server/routes/`)

Toutes les routes sont préfixées par `/api` dans `server.js`.
Les réponses sont toujours au format JSON.

### 🔐 Authentification (`routes/auth.js`)
Gestion des comptes et des sessions.

| Méthode | Endpoint | Middleware | Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | - | `{ username, password }` | Crée un nouvel utilisateur (hash du mot de passe via bcrypt). |
| `POST` | `/login` | - | `{ username, password }` | Vérifie les identifiants et retourne un **Token JWT** (durée 24h). |
| `PUT` | `/updatePassword` | `auth` | `{ newPassword }` | Modifie le mot de passe de l'utilisateur connecté. |

### 👤 Utilisateurs (`routes/user.js`)
Gestion du profil et des préférences.

| Méthode | Endpoint | Middleware | Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/me` | `auth` | - | Retourne les infos du profil (Pseudo, Rôle, Tags) sans le mot de passe. |
| `GET` | `/all` | `auth` | - | Retourne la liste `_id` et `username` de tous les utilisateurs (pour le sélecteur de chat). |
| `PUT` | `/tags` | `auth` | `{ tags: [{name, color}] }` | Met à jour la liste des catégories personnalisées de l'utilisateur. |

### ✅ Tâches (`routes/tasks.js`)
CRUD complet des tâches personnelles.

| Méthode | Endpoint | Middleware | Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `auth` | - | Récupère toutes les tâches de l'utilisateur (triées par création récente). |
| `POST` | `/` | `auth` | `{ text, category, dueDate }` | Crée une tâche. **Socket:** Émet `taskAdded` au client. |
| `PUT` | `/:id` | `auth` | `{ text }` | Modifie le texte d'une tâche. **Socket:** Émet `taskUpdated`. |
| `DELETE` | `/:id` | `auth` | - | Supprime une tâche. **Socket:** Émet `taskDeleted`. |

### 💬 Chat (`routes/chat.js`)
Messagerie instantanée (Général et Privé).

| Méthode | Endpoint | Middleware | Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | `auth` | `?contactId=...` | Récupère les 50 derniers messages. Si `contactId` est absent ou 'general', renvoie le chat public. Sinon, renvoie la conversation privée. |
| `POST` | `/` | `auth` | `{ text, receiverId }` | Envoie un message. Si `receiverId` est null, c'est public. **Socket:** Émet `chatMessage` à tous les clients connectés (le filtrage d'affichage se fait côté front). |

### 💡 Suggestions (`routes/suggestions.js`)
Boîte à idées (Admin).

| Méthode | Endpoint | Middleware | Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | `auth` | `{ text }` | Envoie une idée (Max 250 cars). **Socket:** Émet `newSuggestion` (visible uniquement par les admins). |
| `GET` | `/` | `auth` + `admin` | - | Récupère toutes les suggestions (Admin seulement). |
| `DELETE` | `/:id` | `auth` + `admin` | - | Supprime une suggestion (Admin seulement). |

### 🌤️ Utilitaires (`routes/weather.js`)
Proxy vers API externe (Unsplash).

| Méthode | Endpoint | Middleware | Body / Query | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/background` | - | `?code=WMO_CODE` | Appelle l'API Unsplash pour trouver une image de fond correspondant au code météo (ex: pluie, soleil). Possède un mode "Mock" pour le dev sans clé API. |

## 4. 🚀 Point d'Entrée Serveur (`server/server.js`)

Le fichier `server.js` est le cœur de l'application Backend. Il initialise tous les services et fait le lien entre eux.

### 🛠️ Initialisation & Configuration
* **Dépendances :** Utilise `express` pour le framework web, `cors` pour autoriser les requêtes cross-origin, et `dotenv` pour sécuriser les variables d'environnement.
* **CORS :** Configuré pour accepter toutes les origines (`origin: '*'`) en développement, avec les méthodes `GET, POST, PUT, DELETE, OPTIONS` autorisées.
* **Parsing :** Utilise `express.json()` pour lire les corps de requêtes au format JSON.

### ⚡ WebSocket (Socket.io)
Le serveur est "hybride" (HTTP + WebSocket).
1.  Création d'un serveur HTTP natif via `http.createServer(app)`.
2.  Attachement de Socket.io à ce serveur (`new Server(server, ...)`).
3.  **Middleware Magique :** Injection de l'instance `io` dans chaque requête Express (`req.io = io`). Cela permet aux fichiers de routes (ex: `tasks.js`) d'émettre des événements temps réel sans avoir à réimporter Socket.io.

### 🗄️ Connexion Base de Données
Connecte l'application au cluster **MongoDB Atlas** via Mongoose en utilisant l'URL stockée dans `process.env.MONGO_URL`.

### 🚦 Routage (Traffic Controller)
Centralise toutes les routes API et leur attribue des préfixes :

| Préfixe URL | Fichier Route | Rôle |
| :--- | :--- | :--- |
| `/api` | `authRoutes` | Login, Register, UpdatePassword. |
| `/api/tasks` | `taskRoutes` | Gestion des tâches (CRUD). |
| `/api/user` | `userRoutes` | Profil utilisateur, Tags, Liste contacts. |
| `/api/chat` | `chatRoutes` | Messages et Historique. |
| `/api/suggestions` | `suggestionRoutes` | Boîte à idées Admin. |
| `/api` | `weatherRoutes` | Météo et Background dynamique. |

### 🏁 Démarrage
Le serveur écoute sur le port défini (par défaut `3000`) et affiche un log de confirmation au lancement