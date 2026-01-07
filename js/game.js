// Séquence du KONAMI CODE : Haut, Haut, Bas, Bas, Gauche, Droite, Gauche, Droite, B, A
const secretCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let inputSequence = [];

// Variables du jeu
let canvas, ctx;
let gameInterval;
let snake = [];
let food = {};
let direction = 'RIGHT';
let score = 0;
const boxSize = 20; // Taille d'un carré du serpent

document.addEventListener('DOMContentLoaded', () => {
    // 1. Écouteur pour le CODE SECRET
    document.addEventListener('keydown', (e) => {
        // On ajoute la touche appuyée à la liste
        inputSequence.push(e.key);

        // On garde seulement les X dernières touches (taille du code)
        if (inputSequence.length > secretCode.length) {
            inputSequence.shift();
        }

        // On vérifie si ça correspond au code secret
        if (JSON.stringify(inputSequence) === JSON.stringify(secretCode)) {
            launchGame();
        }
    });

    // 2. Bouton Quitter
    document.getElementById('close-game-btn').addEventListener('click', closeGame);
});

function launchGame() {
    const overlay = document.getElementById('game-overlay');
    overlay.classList.remove('hidden');
    
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Reset du jeu
    snake = [{x: 10 * boxSize, y: 10 * boxSize}]; // Serpent au milieu
    score = 0;
    direction = 'RIGHT';
    document.getElementById('game-score').textContent = score;
    spawnFood();

    // Écouteur pour diriger le serpent
    document.addEventListener('keydown', changeDirection);

    // Lance la boucle du jeu (Vitesse : 100ms)
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(drawGame, 100);
}

function closeGame() {
    document.getElementById('game-overlay').classList.add('hidden');
    clearInterval(gameInterval); // On arrête le moteur du jeu
    document.removeEventListener('keydown', changeDirection); // On arrête d'écouter les flèches
    inputSequence = []; // On reset le code secret pour pouvoir le refaire
}

function changeDirection(event) {
    const key = event.key;
    if (key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    else if (key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    else if (key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
    else if (key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
}

function drawGame() {
    // 1. Fond noir
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Position de la tête
    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === 'LEFT') snakeX -= boxSize;
    if (direction === 'UP') snakeY -= boxSize;
    if (direction === 'RIGHT') snakeX += boxSize;
    if (direction === 'DOWN') snakeY += boxSize;

    // 3. Gestion des murs (Collision = GAME OVER)
        if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height) {
            clearInterval(gameInterval); // On arrête le temps
            alert("GAME OVER 💥 (Tu as pris le mur) - Score : " + score);
            closeGame(); // On ferme et reset
            return; // On arrête la fonction ici
        }

    // 4. Manger la pomme
    if (snakeX === food.x && snakeY === food.y) {
        score++;
        document.getElementById('game-score').textContent = score;
        spawnFood();
    } else {
        // On enlève la queue (si on n'a pas mangé)
        snake.pop();
    }

    // 5. Nouvelle tête
    const newHead = { x: snakeX, y: snakeY };

    // 6. Collision avec soi-même (Game Over)
    if (collision(newHead, snake)) {
        clearInterval(gameInterval);
        alert("GAME OVER 💀 - Score : " + score);
        closeGame();
        return;
    }

    snake.unshift(newHead);

    // 7. Dessiner le serpent
    for (let i = 0; i < snake.length; i++) {
        ctx.fillStyle = (i === 0) ? "#0f0" : "#00aa00"; // Tête vert clair, corps vert foncé
        ctx.fillRect(snake[i].x, snake[i].y, boxSize, boxSize);
        
        ctx.strokeStyle = "#000"; // Petit contour pour voir les cases
        ctx.strokeRect(snake[i].x, snake[i].y, boxSize, boxSize);
    }

    // 8. Dessiner la pomme
    ctx.fillStyle = "red";
    ctx.fillRect(food.x, food.y, boxSize, boxSize);
}

function spawnFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / boxSize)) * boxSize,
        y: Math.floor(Math.random() * (canvas.height / boxSize)) * boxSize
    };
    // On vérifie que la pomme n'apparaît pas SUR le serpent
    if (collision(food, snake)) spawnFood();
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) {
            return true;
        }
    }
    return false;
}