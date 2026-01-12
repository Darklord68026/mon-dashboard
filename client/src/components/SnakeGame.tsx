import { useEffect, useRef, useState } from 'react';

interface Point {
    x: number;
    y: number;
}

export default function SnakeGame() {
    const [isOpen, setIsOpen] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);

    // --- 1. GESTION DU KONAMI CODE ---
    useEffect(() => {
        const secretCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
        let inputSequence: string[] = [];

        const handleKeyDown = (e: KeyboardEvent) => {
            inputSequence.push(e.key);
            if (inputSequence.length > secretCode.length) inputSequence.shift();
            
            if (JSON.stringify(inputSequence) === JSON.stringify(secretCode)) {
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // --- 2. LOGIQUE DU JEU ---
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const boxSize = 20;
        let snake: Point[] = [{x: 10 * boxSize, y: 10 * boxSize}];
        let food: Point = {x: 100, y: 100}; // Temporaire
        let direction = 'LEFT';
        let gameInterval: number;
        let currentScore = 0;

        // Fonction pour spawn la nourriture
        const spawnFood = () => {
            food = {
                x: Math.floor(Math.random() * (canvas.width / boxSize)) * boxSize,
                y: Math.floor(Math.random() * (canvas.height / boxSize)) * boxSize
            };
        };
        spawnFood();

        // Direction
        const changeDirection = (e: KeyboardEvent) => {
            const key = e.key;
            if (key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
            else if (key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
            else if (key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
            else if (key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
        };
        window.addEventListener('keydown', changeDirection);

        // Boucle de jeu
        const drawGame = () => {
            // Fond noir
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Mouvement
            let snakeX = snake[0].x;
            let snakeY = snake[0].y;

            if (direction === 'LEFT') snakeX -= boxSize;
            if (direction === 'UP') snakeY -= boxSize;
            if (direction === 'RIGHT') snakeX += boxSize;
            if (direction === 'DOWN') snakeY += boxSize;

            // Collisions Murs
            if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height) {
                clearInterval(gameInterval);
                alert("GAME OVER 💀 - Score : " + currentScore);
                setIsOpen(false);
                return;
            }

            // Manger
            if (snakeX === food.x && snakeY === food.y) {
                currentScore++;
                setScore(currentScore);
                spawnFood();
            } else {
                snake.pop();
            }

            const newHead: Point = { x: snakeX, y: snakeY };

            // Collision Soi-même
            if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                clearInterval(gameInterval);
                alert("GAME OVER 💀 - Score : " + currentScore);
                setIsOpen(false);
                return;
            }
            snake.unshift(newHead);

            // Dessin Serpent
            snake.forEach((segment, i) => {
                ctx.fillStyle = (i === 0) ? "#0f0" : "#00aa00";
                ctx.fillRect(segment.x, segment.y, boxSize, boxSize);
                ctx.strokeStyle = "#000";
                ctx.strokeRect(segment.x, segment.y, boxSize, boxSize);
            });

            // Dessin Pomme
            ctx.fillStyle = "red";
            ctx.fillRect(food.x, food.y, boxSize, boxSize);
        };

        gameInterval = setInterval(drawGame, 100);

        return () => {
            clearInterval(gameInterval);
            window.removeEventListener('keydown', changeDirection);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div id="game-overlay">
            <div className="game-box">
                <div className="game-header">
                    <h2 style={{color: '#0f0', fontFamily: 'Courier New'}}>🐍 SECRET MODE</h2>
                    <button id="close-game-btn" onClick={() => setIsOpen(false)}>QUITTER</button>
                </div>
                <canvas ref={canvasRef} id="game-canvas" width="400" height="400"></canvas>
                <p style={{color: '#0f0', marginTop: '10px'}}>Score : <span id="game-score">{score}</span></p>
                <p style={{color: '#666', fontSize: '0.8rem'}}>Utilise les flèches pour jouer</p>
            </div>
        </div>
    );
}