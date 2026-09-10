// ====================== FLAPPY BIRD CLONE ======================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM elements
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const currentScoreEl = document.getElementById('currentScore');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const scoreHistoryEl = document.getElementById('scoreHistory');
const downloadScoreBtn = document.getElementById('downloadScoreBtn');
const clearScoreBtn = document.getElementById('clearScoreBtn');

// Game constants
const GRAVITY = 0.45;
const JUMP = -7.5;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.8;
const BIRD_SIZE = 28;

// Game state
let bird = { x: 80, y: 250, velocity: 0 };
let pipes = [];
let score = 0;
let bestScore = 0;
let gameRunning = false;
let animationId = null;
let frameCount = 0;

// ====================== SCORE MANAGEMENT ======================
function loadScores() {
    const saved = localStorage.getItem('flappyScores');
    if (saved) {
        return JSON.parse(saved);
    }
    return [];
}

function saveScore(newScore) {
    let scores = loadScores();
    const now = new Date();
    const timeStr = now.toLocaleString('vi-VN');
    
    scores.unshift({
        score: newScore,
        time: timeStr
    });
    
    // Chỉ giữ 50 điểm gần nhất
    if (scores.length > 50) {
        scores = scores.slice(0, 50);
    }
    
    localStorage.setItem('flappyScores', JSON.stringify(scores));
    
    // Cập nhật điểm cao nhất
    bestScore = Math.max(bestScore, newScore);
    localStorage.setItem('flappyBestScore', bestScore);
    
    updateScoreDisplay();
}

function updateScoreDisplay() {
    const scores = loadScores();
    bestScore = parseInt(localStorage.getItem('flappyBestScore') || '0');
    
    bestScoreEl.textContent = bestScore;
    
    scoreHistoryEl.innerHTML = '';
    if (scores.length === 0) {
        scoreHistoryEl.innerHTML = '<li>Chưa có điểm nào</li>';
        return;
    }
    
    scores.slice(0, 15).forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${item.score} điểm — ${item.time}`;
        scoreHistoryEl.appendChild(li);
    });
}

function downloadScoreTxt() {
    const scores = loadScores();
    let content = '=== LỊCH SỬ ĐIỂM FLAPPY BIRD ===\n';
    content += `Điểm cao nhất: ${bestScore}\n`;
    content += `Tổng số lần chơi: ${scores.length}\n`;
    content += '================================\n\n';
    
    if (scores.length === 0) {
        content += 'Chưa có điểm nào được ghi nhận.\n';
    } else {
        scores.forEach((item, index) => {
            content += `${index + 1}. ${item.score} điểm | ${item.time}\n`;
        });
    }
    
    content += '\n--- File được tạo tự động từ game Flappy Bird ---\n';
    
    // Tạo file và tải về
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Score.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function clearScores() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử điểm?')) {
        localStorage.removeItem('flappyScores');
        localStorage.removeItem('flappyBestScore');
        bestScore = 0;
        updateScoreDisplay();
        alert('Đã xóa lịch sử điểm!');
    }
}

// ====================== GAME LOGIC ======================
function resetGame() {
    bird = { x: 80, y: 250, velocity: 0 };
    pipes = [];
    score = 0;
    frameCount = 0;
    currentScoreEl.textContent = '0';
    gameOverScreen.classList.add('hidden');
}

function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight - 40; // 40 = ground
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        passed: false
    });
}

function jump() {
    if (gameRunning) {
        bird.velocity = JUMP;
    }
}

function update() {
    if (!gameRunning) return;
    
    // Bird physics
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Create pipes
    frameCount++;
    if (frameCount % 90 === 0) {
        createPipe();
    }
    
    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        
        // Scoring
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].passed = true;
            score++;
            currentScoreEl.textContent = score;
        }
        
        // Remove off-screen pipes
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }
    
    // Collision detection
    // Ground & ceiling
    if (bird.y + BIRD_SIZE > canvas.height - 40 || bird.y < 0) {
        endGame();
        return;
    }
    
    // Pipes
    for (let pipe of pipes) {
        if (
            bird.x + BIRD_SIZE > pipe.x &&
            bird.x < pipe.x + PIPE_WIDTH &&
            (bird.y < pipe.topHeight || bird.y + BIRD_SIZE > pipe.bottomY)
        ) {
            endGame();
            return;
        }
    }
}

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sky gradient already set by CSS, but we draw everything
    
    // Draw pipes
    ctx.fillStyle = '#2ecc71';
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        // Top pipe cap
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, PIPE_WIDTH + 8, 20);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY - 40);
        // Bottom pipe cap
        ctx.fillRect(pipe.x - 4, pipe.bottomY, PIPE_WIDTH + 8, 20);
    });
    
    // Ground
    ctx.fillStyle = '#d35400';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(0, canvas.height - 40, canvas.width, 12);
    
    // Bird
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + BIRD_SIZE / 2 + 6, bird.y + BIRD_SIZE / 2 - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird beak
    ctx.fillStyle = '#e67e22';
    ctx.beginPath();
    ctx.moveTo(bird.x + BIRD_SIZE, bird.y + BIRD_SIZE / 2);
    ctx.lineTo(bird.x + BIRD_SIZE + 12, bird.y + BIRD_SIZE / 2 - 4);
    ctx.lineTo(bird.x + BIRD_SIZE + 12, bird.y + BIRD_SIZE / 2 + 4);
    ctx.closePath();
    ctx.fill();
    
    // Score on canvas
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width / 2, 50);
}

function gameLoop() {
    update();
    draw();
    if (gameRunning) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    resetGame();
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameRunning = true;
    gameLoop();
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Lưu điểm
    saveScore(score);
    
    finalScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    gameOverScreen.classList.remove('hidden');
}

// ====================== EVENT LISTENERS ======================
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

downloadScoreBtn.addEventListener('click', downloadScoreTxt);
clearScoreBtn.addEventListener('click', clearScores);

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning && startScreen.classList.contains('hidden') === false) {
            startGame();
        } else if (!gameRunning && !gameOverScreen.classList.contains('hidden')) {
            startGame();
        } else {
            jump();
        }
    }
});

// Mouse / Touch
canvas.addEventListener('click', () => {
    if (gameRunning) {
        jump();
    }
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        jump();
    }
});

// Khởi tạo
updateScoreDisplay();
draw(); // Vẽ màn hình chờ
