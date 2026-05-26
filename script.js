// Esperar a que Firebase esté listo
let firebaseReady = false;
let db = null;
let firestoreHelpers = null;

window.addEventListener('firebase-ready', () => {
    firebaseReady = true;
    db = window.db;
    firestoreHelpers = {
        collection: window.collection,
        query: window.query,
        orderBy: window.orderBy,
        limit: window.limit,
        getDocs: window.getDocs,
        addDoc: window.addDoc,
        serverTimestamp: window.serverTimestamp
    };
    console.log('✅ Firebase listo para usar');
    initApp();
});

// Si Firebase ya estaba listo antes del event listener
if (window.db) {
    firebaseReady = true;
    db = window.db;
    firestoreHelpers = {
        collection: window.collection,
        query: window.query,
        orderBy: window.orderBy,
        limit: window.limit,
        getDocs: window.getDocs,
        addDoc: window.addDoc,
        serverTimestamp: window.serverTimestamp
    };
    initApp();
}

function initApp() {
    if (typeof preguntasPorEdad === 'undefined') {
        console.error('❌ Error: preguntasPorEdad no está definido');
        alert('Error al cargar las preguntas.');
        return;
    }
    
    if (!db) {
        console.error('❌ Firebase no inicializado');
        alert('Error al conectar con la base de datos. Recarga la página.');
        return;
    }
    
    console.log('✅ Trivia iniciada correctamente con Firebase');
    
    // Variables del juego
    let currentLevel = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let waitingForNext = false;
    let currentQuestionData = null;
    let currentPlayerName = '';
    let currentRoundQuestions = [];
    
    let timerInterval = null;
    let timeLeft = 20;
    const TIME_LIMIT = 20;
    let hasAnswered = false;
    
    const ROUND_SIZE = 10;
    
    // Cargar puntajes desde Firebase
    async function loadGlobalScores(level) {
        const container = document.getElementById('leaderboardContent');
        if (!container) return;
        
        container.innerHTML = '<div class="loading">🌐 Cargando puntajes globales...</div>';
        
        try {
            const scoresRef = firestoreHelpers.collection(db, 'scores', level, 'entries');
            const q = firestoreHelpers.query(scoresRef, firestoreHelpers.orderBy('score', 'desc'), firestoreHelpers.limit(15));
            const querySnapshot = await firestoreHelpers.getDocs(q);
            
            const scores = [];
            querySnapshot.forEach(doc => {
                scores.push(doc.data());
            });
            
            if (scores.length === 0) {
                container.innerHTML = '<div class="loading">⭐ Aún no hay puntajes. ¡Sé el primero en jugar! ⭐</div>';
                return;
            }
            
            let html = '<table class="leaderboard-table">';
            html += '<thead><tr>';
            html += '<th>#</th><th>Jugador</th><th>Puntaje</th><th>Aciertos</th><th>%</th><th>Fecha</th>';
            html += '</tr></thead><tbody>';
            
            scores.forEach((entry, idx) => {
                let rankClass = '';
                if (idx === 0) rankClass = 'rank-1';
                if (idx === 1) rankClass = 'rank-2';
                if (idx === 2) rankClass = 'rank-3';
                
                html += `<tr>
                    <td class="${rankClass}">${idx + 1}</td>
                    <td><strong>${escapeHtml(entry.name)}</strong></td>
                    <td>${entry.score}</td>
                    <td>${entry.correct}/${entry.total}</td>
                    <td>${entry.percentage}%</td>
                    <td>${entry.date || 'Hoy'}</td>
                </tr>`;
            });
            
            html += '</tbody></table>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error cargando puntajes:', error);
            container.innerHTML = '<div class="loading">❌ Error al cargar puntajes. Verifica tu conexión a internet.</div>';
        }
    }
    
    // Guardar puntaje en Firebase
    async function saveScoreToFirebase(level, playerName, score, correct, total) {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = '💾 Guardando puntaje en la nube...';
            saveStatus.style.color = '#00D5FF';
            saveStatus.style.display = 'block';
        }
        
        try {
            const scoresRef = firestoreHelpers.collection(db, 'scores', level, 'entries');
            await firestoreHelpers.addDoc(scoresRef, {
                name: playerName,
                score: score,
                correct: correct,
                total: total,
                percentage: Math.round((correct / total) * 100),
                date: new Date().toLocaleDateString(),
                timestamp: firestoreHelpers.serverTimestamp()
            });
            
            if (saveStatus) {
                saveStatus.textContent = '✅ ¡Puntaje guardado globalmente!';
                saveStatus.style.color = '#C7F000';
                setTimeout(() => {
                    saveStatus.textContent = '';
                    saveStatus.style.display = 'none';
                }, 3000);
            }
            
            // Recargar tabla de posiciones
            await loadGlobalScores(level);
        } catch (error) {
            console.error('Error guardando puntaje:', error);
            if (saveStatus) {
                saveStatus.textContent = '⚠️ Error al guardar. ¿Tienes conexión a internet?';
                saveStatus.style.color = '#FF3366';
                setTimeout(() => {
                    saveStatus.textContent = '';
                    saveStatus.style.display = 'none';
                }, 3000);
            }
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function selectRandomQuestions(level) {
        const bank = preguntasPorEdad.levels[level].questions;
        const shuffled = [...bank];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, ROUND_SIZE);
    }
    
    function startGameWithName(level, playerName) {
        currentLevel = level;
        currentPlayerName = playerName;
        currentRoundQuestions = selectRandomQuestions(level);
        currentQuestionIndex = 0;
        score = 0;
        waitingForNext = false;
        hasAnswered = false;
        
        document.getElementById('scoreValue').textContent = '0';
        document.getElementById('playerNameDisplay').textContent = playerName;
        
        const levelData = preguntasPorEdad.levels[level];
        document.getElementById('levelBadge').textContent = `${levelData.icon} ${levelData.name}`;
        document.getElementById('totalQuestionsNum').textContent = ROUND_SIZE;
        
        showScreen('gameScreen');
        loadQuestion();
    }
    
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    function startTimer() {
        stopTimer();
        hasAnswered = false;
        timeLeft = TIME_LIMIT;
        updateTimerDisplay();
        
        const timerBar = document.getElementById('timerBar');
        timerBar.classList.remove('warning');
        timerBar.style.width = '100%';
        
        timerInterval = setInterval(() => {
            if (hasAnswered || waitingForNext) return;
            
            timeLeft--;
            updateTimerDisplay();
            
            const percent = (timeLeft / TIME_LIMIT) * 100;
            timerBar.style.width = `${percent}%`;
            
            if (timeLeft <= 5) {
                timerBar.classList.add('warning');
            }
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                hasAnswered = true;
                
                const feedbackMessage = document.getElementById('feedbackMessage');
                let correctDisplay = '';
                if (currentQuestionData.type === 'multiple') {
                    correctDisplay = currentQuestionData.correct;
                } else {
                    correctDisplay = currentQuestionData.correct === true ? 'Verdadero' : 'Falso';
                }
                feedbackMessage.textContent = `⏰ ¡TIEMPO AGOTADO! Respuesta correcta: ${correctDisplay}`;
                feedbackMessage.className = 'feedback-message timeout-feedback';
                
                disableOptions();
                
                setTimeout(() => {
                    endRound();
                }, 2000);
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const timerSeconds = document.getElementById('timerSeconds');
        if (timerSeconds) timerSeconds.textContent = timeLeft;
    }
    
    function disableOptions() {
        const container = document.getElementById('optionsContainer');
        if (!container) return;
        const buttons = container.querySelectorAll('button');
        buttons.forEach(btn => btn.disabled = true);
    }
    
    function handleAnswer(isCorrect, userAnswer) {
        if (hasAnswered || waitingForNext) return;
        
        stopTimer();
        hasAnswered = true;
        waitingForNext = true;
        
        const points = isCorrect ? 10 : 0;
        if (isCorrect) {
            score += points;
            document.getElementById('scoreValue').textContent = score;
        }
        
        const feedbackMessage = document.getElementById('feedbackMessage');
        
        if (isCorrect) {
            feedbackMessage.textContent = `✅ ¡Correcto! +${points} puntos`;
            feedbackMessage.className = 'feedback-message correct-feedback';
            
            disableOptions();
            
            setTimeout(() => {
                currentQuestionIndex++;
                if (currentQuestionIndex < ROUND_SIZE) {
                    loadQuestion();
                } else {
                    endRound();
                }
            }, 1500);
        } else {
            let correctDisplay = currentQuestionData.correct;
            if (currentQuestionData.type === 'truefalse') {
                correctDisplay = currentQuestionData.correct === true ? 'Verdadero' : 'Falso';
            }
            feedbackMessage.textContent = `❌ Incorrecto. Respuesta correcta: ${correctDisplay}`;
            feedbackMessage.className = 'feedback-message incorrect-feedback';
            
            disableOptions();
            
            setTimeout(() => {
                endRound();
            }, 2000);
        }
    }
    
    async function endRound() {
        stopTimer();
        
        const totalCorrect = currentQuestionIndex;
        const percentage = ROUND_SIZE > 0 ? Math.round((totalCorrect / ROUND_SIZE) * 100) : 0;
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('correctAnswers').textContent = totalCorrect;
        document.getElementById('incorrectAnswers').textContent = ROUND_SIZE - totalCorrect;
        document.getElementById('percentage').textContent = `${percentage}%`;
        document.getElementById('resultPlayerName').textContent = currentPlayerName;
        
        // Mostrar estado de guardado
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.style.display = 'block';
        
        // Guardar en Firebase
        await saveScoreToFirebase(currentLevel, currentPlayerName, score, totalCorrect, ROUND_SIZE);
        
        const resultIcon = document.getElementById('resultIcon');
        if (percentage >= 80) {
            resultIcon.textContent = '🏆🌟';
        } else if (percentage >= 60) {
            resultIcon.textContent = '🎉⚽';
        } else {
            resultIcon.textContent = '💪📚';
        }
        
        showScreen('resultScreen');
    }
    
    function loadQuestion() {
        if (currentQuestionIndex >= ROUND_SIZE) {
            endRound();
            return;
        }
        
        waitingForNext = false;
        hasAnswered = false;
        
        currentQuestionData = currentRoundQuestions[currentQuestionIndex];
        
        const currentNum = currentQuestionIndex + 1;
        
        document.getElementById('currentQuestionNum').textContent = currentNum;
        document.getElementById('progressBar').style.width = `${(currentNum / ROUND_SIZE) * 100}%`;
        document.getElementById('questionText').textContent = currentQuestionData.text;
        
        generateOptionsByType();
        
        const feedbackMessage = document.getElementById('feedbackMessage');
        feedbackMessage.textContent = '';
        feedbackMessage.className = 'feedback-message';
        
        startTimer();
    }
    
    function generateOptionsByType() {
        const container = document.getElementById('optionsContainer');
        if (!container) return;
        container.innerHTML = '';
        
        if (currentQuestionData.type === 'truefalse') {
            const trueBtn = document.createElement('button');
            trueBtn.className = 'option-btn';
            trueBtn.textContent = '✅ Verdadero';
            trueBtn.onclick = () => handleAnswer(true === currentQuestionData.correct, 'Verdadero');
            
            const falseBtn = document.createElement('button');
            falseBtn.className = 'option-btn';
            falseBtn.textContent = '❌ Falso';
            falseBtn.onclick = () => handleAnswer(false === currentQuestionData.correct, 'Falso');
            
            container.appendChild(trueBtn);
            container.appendChild(falseBtn);
        } 
        else if (currentQuestionData.type === 'multiple') {
            currentQuestionData.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = opt;
                btn.onclick = () => handleAnswer(opt === currentQuestionData.correct, opt);
                container.appendChild(btn);
            });
        }
    }
    
    function showScreen(screenId) {
        stopTimer();
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add('active');
    }
    
    function resetToMenu() {
        stopTimer();
        showScreen('startScreen');
        currentLevel = null;
        loadGlobalScores('preescolar');
    }
    
    // Event Listeners
    loadGlobalScores('preescolar');
    
    // Pestañas de la tabla de posiciones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const level = btn.dataset.tab;
            loadGlobalScores(level);
        });
    });
    
    // Selección de nivel
    document.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            currentLevel = card.dataset.level;
            showScreen('nameScreen');
        });
    });
    
    document.getElementById('startGameBtn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('playerName');
        const playerName = nameInput.value.trim();
        if (playerName === '') {
            alert('¡Por favor ingresa tu nombre para jugar!');
            return;
        }
        if (playerName.length > 20) {
            alert('El nombre no puede tener más de 20 caracteres');
            return;
        }
        if (currentLevel) {
            startGameWithName(currentLevel, playerName);
        }
    });
    
    document.getElementById('backToMenuBtn')?.addEventListener('click', resetToMenu);
    document.getElementById('playAgainBtn')?.addEventListener('click', () => {
        showScreen('nameScreen');
    });
    document.getElementById('homeFromResultBtn')?.addEventListener('click', resetToMenu);
    
    document.getElementById('playerName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('startGameBtn').click();
        }
    });
    
    console.log('✅ Trivia con Firebase lista - Rondas de 10 preguntas');
}