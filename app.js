// Lean Piramide Quiz - Hoofdapplicatie

class LeanQuizGame {
    constructor() {
        // Game state
        this.isHost = false;
        this.currentRound = 0;
        this.currentQuestionIndex = 0;
        this.timeLimit = 60;
        this.timerMode = 'auto'; // 'auto' of 'manual'
        this.timerInterval = null;
        this.timeRemaining = 0;
        this.score = 0;
        this.roundScore = 0;
        this.players = [];
        this.answers = {};
        this.currentQuestions = [];
        this.selectedAnswers = [];
        this.questionStartTime = 0;
        this.hasSubmittedAnswer = false;
        this.answersReceived = 0;
        this.pendingFeedback = null; // Opslaan voor later tonen

        // DOM elementen
        this.screens = {
            start: document.getElementById('start-screen'),
            join: document.getElementById('join-screen'),
            lobby: document.getElementById('lobby-screen'),
            waiting: document.getElementById('waiting-screen'),
            game: document.getElementById('game-screen'),
            feedback: document.getElementById('feedback-screen'),
            answerWaiting: document.getElementById('answer-waiting-screen'),
            ranking: document.getElementById('ranking-screen'),
            end: document.getElementById('end-screen')
        };

        this.initEventListeners();
        this.initPeerCallbacks();
    }

    // Initialiseer event listeners
    initEventListeners() {
        // Start scherm
        document.getElementById('btn-host').addEventListener('click', () => this.startHosting());
        document.getElementById('btn-join').addEventListener('click', () => this.showScreen('join'));

        // Join scherm
        document.getElementById('btn-connect').addEventListener('click', () => this.joinGame());
        document.getElementById('btn-back-join').addEventListener('click', () => this.showScreen('start'));

        // Lobby scherm
        document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());
        document.getElementById('time-limit').addEventListener('change', (e) => {
            this.timeLimit = parseInt(e.target.value) || 60;
        });

        // Game scherm
        document.getElementById('btn-submit-answer').addEventListener('click', () => this.submitAnswer());
        document.getElementById('btn-end-round').addEventListener('click', () => this.endRoundEarly());

        // Ranking scherm
        document.getElementById('btn-next-round').addEventListener('click', () => this.nextRound());

        // Eind scherm
        document.getElementById('btn-play-again').addEventListener('click', () => this.resetGame());
        document.getElementById('btn-replay-round6').addEventListener('click', () => this.replayRound6());

        // Enter toets voor inputs
        document.getElementById('game-code').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinGame();
        });
    }

    // Initialiseer peer callbacks
    initPeerCallbacks() {
        peerConnection.onPlayerJoined = (player) => {
            this.players.push(player);
            this.updatePlayerList();
        };

        peerConnection.onPlayerLeft = (player) => {
            this.players = this.players.filter(p => p.id !== player.id);
            this.updatePlayerList();
        };

        peerConnection.onMessage = (data) => this.handleMessage(data);

        peerConnection.onError = (err) => {
            console.error('Connection error:', err);
            this.showError('Verbindingsfout: ' + err.message);
        };
    }

    // Toon specifiek scherm
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    // Host: Start nieuw spel
    async startHosting() {
        try {
            const gameCode = await peerConnection.hostGame();
            this.isHost = true;
            document.getElementById('display-code').textContent = gameCode;
            this.showScreen('lobby');
        } catch (err) {
            this.showError('Kon spel niet starten: ' + err.message);
        }
    }

    // Speler: Verbind met spel
    async joinGame() {
        const gameCode = document.getElementById('game-code').value.trim();
        const playerName = document.getElementById('player-name').value.trim();

        if (!gameCode) {
            this.showError('Voer een spelcode in', 'join-status');
            return;
        }
        if (!playerName) {
            this.showError('Voer je naam in', 'join-status');
            return;
        }

        try {
            document.getElementById('join-status').textContent = 'Verbinden...';
            document.getElementById('join-status').className = 'status-message';

            await peerConnection.joinGame(gameCode, playerName);

            document.getElementById('join-status').textContent = 'Verbonden!';
            document.getElementById('join-status').className = 'status-message success';

            this.isHost = false;
            this.showScreen('waiting');
        } catch (err) {
            this.showError(err.message, 'join-status');
        }
    }

    // Update spelerslijst in lobby
    updatePlayerList() {
        const playerList = document.getElementById('player-list');
        const playerCount = document.getElementById('player-count');
        const startBtn = document.getElementById('btn-start-game');

        playerList.innerHTML = '';
        this.players.forEach(player => {
            const li = document.createElement('li');
            li.textContent = player.name;
            playerList.appendChild(li);
        });

        playerCount.textContent = this.players.length;
        startBtn.disabled = this.players.length < 1;
    }

    // Host: Start het spel
    startGame() {
        this.currentRound = 0;
        this.answers = {};

        // Lees timer modus
        this.timerMode = document.querySelector('input[name="timer-mode"]:checked').value;

        // Reset scores voor alle spelers
        this.players.forEach(p => p.score = 0);

        // Update totaal aantal rondes in UI
        document.getElementById('total-rounds').textContent = rondeConfig.length;

        // Broadcast naar alle spelers
        peerConnection.broadcast({
            type: 'game-start',
            timeLimit: this.timeLimit,
            timerMode: this.timerMode
        });

        this.startRound();
    }

    // Start een nieuwe ronde
    startRound() {
        this.currentRound++;
        this.roundScore = 0;
        this.currentQuestionIndex = 0;
        this.selectedAnswers = [];
        this.hasSubmittedAnswer = false;
        this.answersReceived = 0;
        // Reset hasAnswered voor alle spelers
        this.players.forEach(p => p.hasAnswered = false);

        if (this.currentRound > rondeConfig.length) {
            this.endGame();
            return;
        }

        const config = rondeConfig[this.currentRound - 1];
        this.generateQuestions(config);

        // Update UI
        document.getElementById('current-round').textContent = this.currentRound;

        // Verberg score voor host (speelt niet mee)
        const scoreDisplay = document.querySelector('.score-display');
        if (this.isHost) {
            scoreDisplay.style.display = 'none';
        } else {
            scoreDisplay.style.display = 'block';
            document.getElementById('current-score').textContent = this.score;
        }

        if (this.isHost) {
            // Broadcast ronde start
            peerConnection.broadcast({
                type: 'round-start',
                round: this.currentRound,
                config: config,
                questions: this.currentQuestions
            });
        }

        this.showScreen('game');
        this.showQuestion();
        this.startTimer();
    }

    // Genereer vragen voor huidige ronde
    generateQuestions(config) {
        this.currentQuestions = [];

        switch (config.type) {
            case 'aspecten': {
                // Shuffle aspecten voor de vraag
                const shuffledAspecten = [...gameData.aspecten].sort(() => Math.random() - 0.5);
                this.currentQuestions.push({
                    type: 'order',
                    items: shuffledAspecten,
                    correctOrder: gameData.aspecten.map(a => a.naam),
                    labels: ['Links (lichtgroen)', 'Midden (donkergroen)', 'Rechts (geel)']
                });
                break;
            }

            case 'treden': {
                // Shuffle treden voor de vraag
                const shuffledTreden = [...gameData.treden].sort(() => Math.random() - 0.5);
                this.currentQuestions.push({
                    type: 'order',
                    items: shuffledTreden,
                    correctOrder: gameData.treden.map(t => t.naam),
                    labels: ['Trede 1 (laag)', 'Trede 2', 'Trede 3', 'Trede 4', 'Trede 5', 'Trede 6 (hoog)']
                });
                break;
            }

            case 'bouwblokken-selectie': {
                // Vraag welke bouwblokken bij de doeltrede horen
                const tredeBlokken = gameData.getBouwblokkenByTrede(config.targetTrede);
                const andereBlokken = [...gameData.bouwblokken.filter(b => b.trede !== config.targetTrede)]
                    .sort(() => Math.random() - 0.5); // Shuffle foute opties
                const alleOpties = [...tredeBlokken, ...andereBlokken.slice(0, 5)].sort(() => Math.random() - 0.5);

                this.currentQuestions.push({
                    type: 'multi-select',
                    options: alleOpties.map(b => b.naam),
                    correctAnswers: tredeBlokken.map(b => b.naam),
                    targetTrede: config.targetTrede
                });
                break;
            }

            case 'bouwblokken-trede': {
                // Random bouwblokken, speler moet trede kiezen
                const tredes23 = gameData.getBouwblokkenByTredes(config.targetTredes);
                const shuffled = [...tredes23].sort(() => Math.random() - 0.5);
                const selected = shuffled.slice(0, config.aantalVragen);

                selected.forEach(blok => {
                    this.currentQuestions.push({
                        type: 'single-choice',
                        question: `Bij welke trede hoort "${blok.naam}"?`,
                        options: ['Beheersen (trede 2)', 'Verbeteren (trede 3)'],
                        correctAnswer: blok.trede === 2 ? 'Beheersen (trede 2)' : 'Verbeteren (trede 3)',
                        bouwblok: blok.naam
                    });
                });
                break;
            }

            case 'volwassenheid': {
                // Random bouwblokken met volwassenheidsniveau
                const randomBlokken = gameData.getRandomVolwassenheidVragen(config.aantalVragen);
                const alleBloknamen = gameData.getAllBouwblokNamen();

                randomBlokken.forEach(blok => {
                    // Selecteer 3 foute opties
                    const fouteOpties = alleBloknamen
                        .filter(n => n !== blok.naam)
                        .sort(() => Math.random() - 0.5)
                        .slice(0, 3);

                    const opties = [blok.naam, ...fouteOpties].sort(() => Math.random() - 0.5);

                    this.currentQuestions.push({
                        type: 'single-choice',
                        question: 'Bij welk bouwblok hoort dit volwassenheidsniveau?',
                        description: blok.volwassenheid,
                        options: opties,
                        correctAnswer: blok.naam
                    });
                });
                break;
            }
        }
    }

    // Toon huidige vraag
    showQuestion() {
        const config = rondeConfig[this.currentRound - 1];
        const question = this.currentQuestions[this.currentQuestionIndex];

        document.getElementById('question-text').textContent = config.beschrijving;
        document.getElementById('question-description').textContent = question.description || '';

        const container = document.getElementById('answers-container');
        container.innerHTML = '';

        const submitBtn = document.getElementById('btn-submit-answer');
        const hostControls = document.getElementById('host-controls');

        // Als host: toon controle-view in plaats van antwoordopties
        if (this.isHost) {
            submitBtn.style.display = 'none';
            hostControls.style.display = 'block';
            this.answersReceived = 0;
            document.getElementById('answers-received').textContent = '0';
            document.getElementById('total-players').textContent = this.players.length;

            // Toon de vraag info voor de host
            const infoDiv = document.createElement('div');
            infoDiv.className = 'host-info';
            infoDiv.innerHTML = `<h4>Huidige vraag voor spelers:</h4><p>${config.beschrijving}</p>`;
            if (question.description) {
                infoDiv.innerHTML += `<p><em>${question.description}</em></p>`;
            }
            container.appendChild(infoDiv);

            this.questionStartTime = Date.now();
            return;
        }

        // Voor spelers: toon normale antwoordopties
        hostControls.style.display = 'none';

        switch (question.type) {
            case 'order':
                // Dropdown voor elke positie
                question.labels.forEach((label, index) => {
                    const div = document.createElement('div');
                    div.className = 'answer-dropdown';

                    const labelEl = document.createElement('label');
                    labelEl.textContent = label + ':';

                    const select = document.createElement('select');
                    select.dataset.index = index;

                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = '-- Selecteer --';
                    select.appendChild(defaultOption);

                    question.items.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.naam;
                        option.textContent = item.naam;
                        select.appendChild(option);
                    });

                    div.appendChild(labelEl);
                    div.appendChild(select);
                    container.appendChild(div);
                });
                submitBtn.style.display = 'block';
                break;

            case 'multi-select':
                // Checkboxes voor meerdere selectie
                question.options.forEach(option => {
                    const div = document.createElement('div');
                    div.className = 'answer-option';
                    div.textContent = option;
                    div.dataset.value = option;

                    div.addEventListener('click', () => {
                        div.classList.toggle('selected');
                    });

                    container.appendChild(div);
                });
                submitBtn.style.display = 'block';
                break;

            case 'single-choice':
                // Radio-achtige selectie
                question.options.forEach(option => {
                    const div = document.createElement('div');
                    div.className = 'answer-option';
                    div.textContent = option;
                    div.dataset.value = option;

                    div.addEventListener('click', () => {
                        container.querySelectorAll('.answer-option').forEach(el => {
                            el.classList.remove('selected');
                        });
                        div.classList.add('selected');
                    });

                    container.appendChild(div);
                });
                submitBtn.style.display = 'block';
                break;
        }

        this.questionStartTime = Date.now();
    }

    // Dien antwoord in
    submitAnswer() {
        // Host speelt niet mee
        if (this.isHost) return;

        // Voorkom dubbele submits
        if (this.hasSubmittedAnswer) return;
        this.hasSubmittedAnswer = true;

        const question = this.currentQuestions[this.currentQuestionIndex];
        const config = rondeConfig[this.currentRound - 1];
        const container = document.getElementById('answers-container');
        const timeTaken = (Date.now() - this.questionStartTime) / 1000;

        let userAnswer = [];
        let isCorrect = false;
        let correctCount = 0;

        switch (question.type) {
            case 'order':
                const selects = container.querySelectorAll('select');
                userAnswer = Array.from(selects).map(s => s.value);

                correctCount = userAnswer.reduce((count, answer, index) => {
                    return count + (answer === question.correctOrder[index] ? 1 : 0);
                }, 0);

                isCorrect = correctCount === question.correctOrder.length;
                break;

            case 'multi-select':
                const selectedMulti = container.querySelectorAll('.answer-option.selected');
                userAnswer = Array.from(selectedMulti).map(el => el.dataset.value);

                const correctSet = new Set(question.correctAnswers);
                const userSet = new Set(userAnswer);

                correctCount = userAnswer.filter(a => correctSet.has(a)).length;
                const wrongCount = userAnswer.filter(a => !correctSet.has(a)).length;

                // Punten: correct antwoorden - foute antwoorden (minimum 0)
                correctCount = Math.max(0, correctCount - wrongCount);
                isCorrect = correctCount === question.correctAnswers.length && wrongCount === 0;
                break;

            case 'single-choice':
                const selectedSingle = container.querySelector('.answer-option.selected');
                userAnswer = selectedSingle ? selectedSingle.dataset.value : '';
                isCorrect = userAnswer === question.correctAnswer;
                correctCount = isCorrect ? 1 : 0;
                break;
        }

        // Bereken score met tijdsbonus
        const basePoints = config.puntenPerCorrect;
        const timeBonus = Math.max(0, 1 - (timeTaken / this.timeLimit));
        const questionScore = Math.round(correctCount * basePoints * (1 + timeBonus * 0.5));

        this.roundScore += questionScore;
        this.score += questionScore;

        // Stuur antwoord naar host als speler
        if (!this.isHost) {
            peerConnection.sendToHost({
                type: 'answer',
                round: this.currentRound,
                questionIndex: this.currentQuestionIndex,
                answer: userAnswer,
                score: questionScore,
                totalScore: this.score
            });
        }

        // Sla feedback data op voor later
        this.pendingFeedback = {
            question: question,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            points: questionScore
        };

        // Toon wacht-scherm in plaats van direct feedback
        this.showScreen('answerWaiting');
    }

    // Toon feedback na antwoord
    showFeedback(question, userAnswer, isCorrect, points) {
        const container = document.getElementById('feedback-content');
        container.innerHTML = '';

        document.getElementById('feedback-title').textContent =
            isCorrect ? 'Goed gedaan!' : 'Helaas...';

        switch (question.type) {
            case 'order':
                question.correctOrder.forEach((correct, index) => {
                    const div = document.createElement('div');
                    div.className = 'feedback-item ' + (userAnswer[index] === correct ? 'correct' : 'incorrect');
                    div.innerHTML = `
                        <span>${question.labels[index]}: ${userAnswer[index] || '(niet ingevuld)'}</span>
                        <span>${userAnswer[index] === correct ? '✓' : '✗ → ' + correct}</span>
                    `;
                    container.appendChild(div);
                });
                break;

            case 'multi-select':
                question.correctAnswers.forEach(correct => {
                    const div = document.createElement('div');
                    const wasSelected = userAnswer.includes(correct);
                    div.className = 'feedback-item ' + (wasSelected ? 'correct' : 'incorrect');
                    div.innerHTML = `
                        <span>${correct}</span>
                        <span>${wasSelected ? '✓ Geselecteerd' : '✗ Niet geselecteerd'}</span>
                    `;
                    container.appendChild(div);
                });
                break;

            case 'single-choice':
                const div = document.createElement('div');
                div.className = 'feedback-item ' + (isCorrect ? 'correct' : 'incorrect');
                div.innerHTML = `
                    <span>Jouw antwoord: ${userAnswer || '(niet ingevuld)'}</span>
                    <span>${isCorrect ? '✓' : '✗ Correct: ' + question.correctAnswer}</span>
                `;
                container.appendChild(div);
                break;
        }

        document.getElementById('round-score').textContent = `+${points} punten`;
        document.getElementById('current-score').textContent = this.score;

        this.showScreen('feedback');
        // Geen auto-timer meer - host bepaalt wanneer naar ranking
    }

    // Toon opgeslagen feedback
    showPendingFeedback() {
        if (this.pendingFeedback) {
            this.showFeedback(
                this.pendingFeedback.question,
                this.pendingFeedback.userAnswer,
                this.pendingFeedback.isCorrect,
                this.pendingFeedback.points
            );
            this.pendingFeedback = null;
        }
    }

    // Timer starten
    startTimer() {
        this.timeRemaining = this.timeLimit;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            if (this.timeRemaining <= 0) {
                clearInterval(this.timerInterval);
                // Alleen auto-submit als timerMode 'auto' is
                if (this.timerMode === 'auto') {
                    this.submitAnswer();
                }
                // Bij 'manual' mode: timer toont 0, wacht op host
            }
        }, 1000);
    }

    // Update timer weergave
    updateTimerDisplay() {
        const timerEl = document.getElementById('timer');
        timerEl.textContent = this.timeRemaining;

        timerEl.classList.remove('warning', 'danger');
        if (this.timeRemaining <= 10) {
            timerEl.classList.add('danger');
        } else if (this.timeRemaining <= 20) {
            timerEl.classList.add('warning');
        }
    }

    // Toon ranking
    showRanking() {
        clearInterval(this.timerInterval);

        // Toon feedback in ranking-scherm voor deelnemers (niet voor host)
        const feedbackSection = document.getElementById('player-feedback-section');
        if (!this.isHost && this.pendingFeedback) {
            const fb = this.pendingFeedback;
            const container = document.getElementById('player-feedback-content');
            container.innerHTML = '';

            document.getElementById('player-feedback-title').textContent =
                fb.isCorrect ? 'Jouw antwoorden - Goed gedaan!' : 'Jouw antwoorden - Helaas...';

            switch (fb.question.type) {
                case 'order':
                    fb.question.correctOrder.forEach((correct, index) => {
                        const div = document.createElement('div');
                        div.className = 'feedback-item ' + (fb.userAnswer[index] === correct ? 'correct' : 'incorrect');
                        div.innerHTML = `
                            <span>${fb.question.labels[index]}: ${fb.userAnswer[index] || '(niet ingevuld)'}</span>
                            <span>${fb.userAnswer[index] === correct ? '✓' : '✗ → ' + correct}</span>
                        `;
                        container.appendChild(div);
                    });
                    break;
                case 'multi-select':
                    fb.question.correctAnswers.forEach(correct => {
                        const div = document.createElement('div');
                        const wasSelected = fb.userAnswer.includes(correct);
                        div.className = 'feedback-item ' + (wasSelected ? 'correct' : 'incorrect');
                        div.innerHTML = `
                            <span>${correct}</span>
                            <span>${wasSelected ? '✓ Geselecteerd' : '✗ Niet geselecteerd'}</span>
                        `;
                        container.appendChild(div);
                    });
                    break;
                case 'single-choice':
                    const div = document.createElement('div');
                    div.className = 'feedback-item ' + (fb.isCorrect ? 'correct' : 'incorrect');
                    div.innerHTML = `
                        <span>Jouw antwoord: ${fb.userAnswer || '(niet ingevuld)'}</span>
                        <span>${fb.isCorrect ? '✓' : '✗ Correct: ' + fb.question.correctAnswer}</span>
                    `;
                    container.appendChild(div);
                    break;
            }

            document.getElementById('player-round-score').textContent = `+${fb.points} punten`;
            feedbackSection.style.display = 'block';
            this.pendingFeedback = null;
        } else {
            feedbackSection.style.display = 'none';
        }

        // Host haalt spelers op van peer connection
        if (this.isHost) {
            this.players = peerConnection.getPlayers();
        } else if (this.players.length === 0) {
            // Speler zonder data van host: toon eigen score
            const myPlayer = {
                id: 'self',
                name: peerConnection.playerName || 'Jij',
                score: this.score
            };
            this.players = [myPlayer];
        }

        // Sorteer op score
        const sorted = [...this.players].sort((a, b) => b.score - a.score);

        // Update podium
        this.updatePodium(sorted, 'podium');

        // Update volledige ranking
        const rankingEl = document.getElementById('full-ranking');
        rankingEl.innerHTML = '';

        sorted.slice(3).forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `
                <span class="ranking-position">${index + 4}</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${player.score}</span>
            `;
            rankingEl.appendChild(div);
        });

        // Toon volgende ronde knop alleen voor host EN als er nog rondes zijn
        const nextBtn = document.getElementById('btn-next-round');
        const isLastRound = this.currentRound >= rondeConfig.length;
        nextBtn.style.display = (this.isHost && !isLastRound) ? 'block' : 'none';

        // Dynamische titel: Tussenstand of Eindstand
        document.getElementById('ranking-title').textContent = isLastRound ? 'Eindstand' : 'Tussenstand';

        if (this.isHost) {
            peerConnection.broadcast({
                type: 'show-ranking',
                players: sorted
            });
        }

        this.showScreen('ranking');
    }

    // Update podium weergave
    updatePodium(sorted, prefix) {
        const positions = ['1', '2', '3'];
        positions.forEach((pos, index) => {
            const player = sorted[index];
            document.getElementById(`${prefix}-${pos}-name`).textContent = player?.name || '-';
            document.getElementById(`${prefix}-${pos}-score`).textContent = player?.score || 0;
        });
    }

    // Host: Ronde voortijdig afsluiten
    endRoundEarly() {
        if (!this.isHost) return;

        clearInterval(this.timerInterval);

        // Reset hasAnswered voor volgende ronde
        this.players.forEach(p => p.hasAnswered = false);

        // Broadcast naar alle spelers om naar ranking te gaan
        peerConnection.broadcast({
            type: 'force-end-round'
        });

        this.showRanking();
    }

    // Volgende ronde
    nextRound() {
        if (this.isHost) {
            peerConnection.broadcast({
                type: 'next-round'
            });
        }
        this.startRound();
    }

    // Einde spel
    endGame() {
        clearInterval(this.timerInterval);

        const sorted = [...this.players].sort((a, b) => b.score - a.score);

        this.updatePodium(sorted, 'final');

        // Update volledige ranking
        const rankingEl = document.getElementById('final-ranking');
        rankingEl.innerHTML = '';

        sorted.slice(3).forEach((player, index) => {
            const div = document.createElement('div');
            div.className = 'ranking-item';
            div.innerHTML = `
                <span class="ranking-position">${index + 4}</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${player.score}</span>
            `;
            rankingEl.appendChild(div);
        });

        if (this.isHost) {
            peerConnection.broadcast({
                type: 'game-end',
                players: sorted
            });
        }

        // Toon juiste knoppen voor host/speler
        if (this.isHost) {
            document.getElementById('end-buttons-host').style.display = 'flex';
            document.getElementById('end-message-player').style.display = 'none';
        } else {
            document.getElementById('end-buttons-host').style.display = 'none';
            document.getElementById('end-message-player').style.display = 'block';
        }

        this.showScreen('end');
    }

    // Replay alleen ronde 6
    replayRound6() {
        // Reset scores voor alle spelers
        this.players.forEach(p => p.score = 0);

        // Zet ronde op 5 zodat startRound() naar 6 gaat
        this.currentRound = rondeConfig.length - 1;

        peerConnection.broadcast({
            type: 'replay-round6'
        });

        this.startRound();
    }

    // Reset spel
    resetGame() {
        this.currentRound = 0;
        this.score = 0;
        this.players = [];
        clearInterval(this.timerInterval);
        peerConnection.disconnect();
        this.showScreen('start');
    }

    // Verwerk berichten van andere spelers/host
    handleMessage(data) {
        switch (data.type) {
            case 'join-confirmed':
                console.log('Verbinding bevestigd');
                break;

            case 'player-list':
                this.players = data.players;
                this.updatePlayerList();
                break;

            case 'game-start':
                this.timeLimit = data.timeLimit;
                this.timerMode = data.timerMode || 'auto';
                this.score = 0;
                this.currentRound = 0;
                // Update totaal aantal rondes
                document.getElementById('total-rounds').textContent = rondeConfig.length;
                break;

            case 'round-start':
                this.currentRound = data.round;
                this.currentQuestions = data.questions;
                this.currentQuestionIndex = 0;
                this.roundScore = 0;
                this.selectedAnswers = [];

                document.getElementById('current-round').textContent = this.currentRound;
                document.getElementById('current-score').textContent = this.score;

                this.showScreen('game');
                this.showQuestion();
                this.startTimer();
                break;

            case 'answer':
                // Host ontvangt antwoord van speler
                if (this.isHost) {
                    const player = this.players.find(p => p.id === data.playerId);
                    if (player) {
                        player.score = data.totalScore;
                        player.hasAnswered = true;
                        peerConnection.updatePlayerScore(data.playerId, data.totalScore);
                    }
                    // Update antwoorden teller
                    this.answersReceived = this.players.filter(p => p.hasAnswered).length;
                    document.getElementById('answers-received').textContent = this.answersReceived;

                    // Als alle spelers geantwoord hebben, ga automatisch naar ranking
                    if (this.answersReceived >= this.players.length) {
                        this.endRoundEarly();
                    }
                }
                break;

            case 'force-end-round':
                // Spelleider heeft ronde afgesloten
                clearInterval(this.timerInterval);
                // Als speler nog niet geantwoord heeft, submit leeg antwoord
                if (!this.hasSubmittedAnswer) {
                    this.submitAnswer();
                }
                // Feedback wordt gecombineerd getoond in showRanking() via show-ranking message
                break;

            case 'show-ranking':
                this.players = data.players;
                this.showRanking();
                break;

            case 'next-round':
                // Deelnemers hoeven hier niets te doen - ze ontvangen daarna 'round-start' met de vragen
                // Reset alleen hasSubmittedAnswer voor de volgende ronde
                this.hasSubmittedAnswer = false;
                break;

            case 'game-end':
                this.players = data.players;
                this.endGame();
                break;

            case 'replay-round6':
                // Host wil alleen ronde 6 opnieuw spelen
                this.score = 0;
                this.currentRound = rondeConfig.length - 1;
                this.hasSubmittedAnswer = false;
                break;
        }
    }

    // Toon foutmelding
    showError(message, elementId = null) {
        if (elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = message;
                el.className = 'status-message';
            }
        } else {
            alert(message);
        }
    }
}

// Start applicatie
document.addEventListener('DOMContentLoaded', () => {
    window.game = new LeanQuizGame();
});
