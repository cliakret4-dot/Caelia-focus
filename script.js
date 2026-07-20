// ==========================
// Caelia Focus 🍅
// V 1.0
// ==========================

// Durées en secondes
const FOCUS_TIME = 25*60; // 25 minutes
const BREAK_TIME = 5*60; // 5 minutes

// Messages affichés à la fin d'un focus
const congratulationsMessages = [
    "Bien joué ! ✨",
    "Excellent travail 🌸",
    "Une session de plus accomplie 🍅",
    "Tu avances, petit à petit 💪",
    "Mission focus réussie 🚀",
    "Tu peux être fière de toi 💛"
];

const plantStages = [
    { min: 0, icon: "🌱" },
    { min: 3, icon: "🌿" },
    { min: 6, icon: "🪴" },
    { min: 10, icon: "🍅" },
    { min: 25, icon: "🍅✨" }
];

// --------------------------
// Mode embed (Notion)
// --------------------------

const isEmbed =
    new URLSearchParams(window.location.search)
        .get("embed") === "true";

if (isEmbed) {
    document.body.classList.add("embed");
}

// Mode actuel : "focus" ou "break"
let currentMode = "focus";

// Temps total et temps restant du cycle actuel
let totalTime = FOCUS_TIME;
let timeLeft = FOCUS_TIME;

// État du minuteur
let running = false;
let timerInterval = null;
let hasStarted = false;

// Nombre de focus terminés
let focusStreak = 0;

// Éléments HTML
const modeTitle = document.getElementById("modeTitle");

const timerView = document.getElementById("timerView");
const messageView = document.getElementById("messageView");

const timerDisplay = document.getElementById("timer");
const progressFill = document.getElementById("progressFill");

const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");

const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const nextButton = document.getElementById("nextButton");

const streakDisplay = document.getElementById("streak");
const themeButtons = document.querySelectorAll(".theme-dot");

function showView(viewToShow, viewToHide) {
    viewToHide.classList.add("hidden");
    viewToShow.classList.remove("hidden");

    viewToShow.style.animation = "none";

    void viewToShow.offsetWidth;

    viewToShow.style.animation = "";
}

// --------------------------
// Sauvegarde locale
// --------------------------

function saveState() {
    const state = {
        currentMode: currentMode,
        totalTime: totalTime,
        timeLeft: timeLeft,
        hasStarted: hasStarted,
        focusStreak: focusStreak
    };

    localStorage.setItem("caeliaFocusState", JSON.stringify(state));
}


// --------------------------
// Récupération de la sauvegarde
// --------------------------

function loadState() {
    const savedState = localStorage.getItem("caeliaFocusState");

    if (!savedState) return;

    const state = JSON.parse(savedState);

    currentMode = state.currentMode || "focus";
    totalTime = state.totalTime || FOCUS_TIME;
    timeLeft = state.timeLeft ?? FOCUS_TIME;
    hasStarted = state.hasStarted || false;
    focusStreak = state.focusStreak || 0;

    // Le chrono revient toujours en pause après un rechargement
    running = false;
    timerInterval = null;

    if (currentMode === "break") {
        modeTitle.textContent = "Pause ☕";
    } else {
        modeTitle.textContent = "Focus Time 🍅";
    }
}

function getPlantIcon() {
    let currentIcon = plantStages[0].icon;

    plantStages.forEach((stage) => {
        if (focusStreak >= stage.min) {
            currentIcon = stage.icon;
        }
    });

    return currentIcon;
}

function animatePlantGrowth() {
    streakDisplay.classList.remove("plant-grow");

    // Force le navigateur à réinitialiser l’animation
    void streakDisplay.offsetWidth;

    streakDisplay.classList.add("plant-grow");
}

function animatePlantLevelUp() {
    streakDisplay.classList.remove("plant-level-up");

    void streakDisplay.offsetWidth;

    streakDisplay.classList.add("plant-level-up");
}

// --------------------------
// Affichage du compteur
// --------------------------

function updateStreakDisplay() {
    const plantIcon = getPlantIcon();

    streakDisplay.textContent =
        `${plantIcon} ${focusStreak} Focus`;

    saveState();
}


// --------------------------
// Barre de progression
// --------------------------

function updateProgress() {
    const elapsedTime = totalTime - timeLeft;
    const percentage = (elapsedTime / totalTime) * 100;

    progressFill.style.width = `${percentage}%`;
}


// --------------------------
// Affichage du temps
// --------------------------

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    updateProgress();
    saveState();
}


// --------------------------
// Texte du bouton principal
// --------------------------

function updateStartButton() {
    if (running) {
        startBtn.textContent = "▶ En cours";
        startBtn.disabled = true;

        pauseBtn.disabled = false;
        return;
    }

    startBtn.disabled = false;
    pauseBtn.disabled = true;

    if (hasStarted && timeLeft < totalTime && timeLeft > 0) {
        startBtn.textContent = "▶ Reprendre";
    } else {
        startBtn.textContent = "▶ Commencer";
    }
}


// --------------------------
// Démarrer ou reprendre
// --------------------------

function animateTimer() {
    timerDisplay.classList.remove("timer-running");

    // Force le navigateur à réinitialiser l'animation
    void timerDisplay.offsetWidth;

    timerDisplay.classList.add("timer-running");
}

function startTimer() {
    if (running) return;

    running = true;
    hasStarted = true;

    updateStartButton();
    animateTimer();

    timerInterval = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        }

        if (timeLeft <= 0) {
            finishCycle();
        }
    }, 1000);
}


// --------------------------
// Mettre en pause
// --------------------------

function pauseTimer() {
    if (!running) return;

    clearInterval(timerInterval);

    timerInterval = null;
    running = false;

    updateStartButton();
}


// --------------------------
// Réinitialiser le cycle
// --------------------------

function resetTimer() {
    const confirmReset = confirm(
        "Réinitialiser le cycle et revenir à un Focus de 25 minutes ?"
    );

    if (!confirmReset) {
        return;
    }

    clearInterval(timerInterval);
    timerInterval = null;

    currentMode = "focus";

    totalTime = FOCUS_TIME;
    timeLeft = FOCUS_TIME;

    running = false;
    hasStarted = false;

    modeTitle.textContent = "Focus Time 🍅";

    showView(timerView, messageView);

    updateDisplay();
    updateStartButton();

    saveState();
}

function playFinishSound() {
    const AudioContext =
        window.AudioContext || window.webkitAudioContext;

    const audioContext = new AudioContext();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
        660,
        audioContext.currentTime
    );

    oscillator.frequency.setValueAtTime(
        880,
        audioContext.currentTime + 0.15
    );

    gainNode.gain.setValueAtTime(
        0.15,
        audioContext.currentTime
    );

    gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.6
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.6);
}

// --------------------------
// Fin d'un cycle
// --------------------------

function finishCycle() {
    clearInterval(timerInterval);

    timerInterval = null;
    running = false;
    hasStarted = false;
    timeLeft = 0;

    updateDisplay();
    updateStartButton();
    updateProgress();

    playFinishSound();

    if (currentMode === "focus") {
        const previousIcon = getPlantIcon();
        focusStreak++;
        const newIcon = getPlantIcon();
        updateStreakDisplay();
        if (previousIcon !== newIcon) {
        animatePlantLevelUp();
    } else {
        animatePlantGrowth();
    }
        showFocusSuccess();
    } else {
        showBreakSuccess();
    }
}


function getRandomCongratulations() {
    const randomIndex = Math.floor(
        Math.random() * congratulationsMessages.length
    );

    return congratulationsMessages[randomIndex];
}

// --------------------------
// Écran "Bien joué"
// --------------------------

function showFocusSuccess() {
    console.log("Affichage de l’écran Bien joué");

    showView(messageView, timerView);

    modeTitle.textContent = "Focus terminé 🍅";
    messageTitle.textContent = getRandomCongratulations();

    messageText.textContent =
        "Tu viens de terminer un cycle de concentration. Prends maintenant une pause bien méritée 🌿";

    nextButton.textContent = "▶ Commencer la pause";
    nextButton.onclick = startBreak;
}


// --------------------------
// Lancer la pause
// --------------------------

function startBreak() {
    currentMode = "break";

    totalTime = BREAK_TIME;
    timeLeft = BREAK_TIME;

    running = false;
    hasStarted = false;

    clearInterval(timerInterval);
    timerInterval = null;

    modeTitle.textContent = "Pause ☕";

    showView(timerView, messageView);

    updateDisplay();
    updateStartButton();

    startTimer();
}


// --------------------------
// Écran "C'est reparti"
// --------------------------

function showBreakSuccess() {
    showView(messageView, timerView);

    modeTitle.textContent = "Pause terminée ☕";

    messageTitle.textContent = "C’est reparti ! 🚀";

    messageText.textContent =
        "Ta pause est terminée. Tu peux lancer un nouveau cycle de concentration.";

    nextButton.textContent = "▶ Lancer un nouveau focus";

    nextButton.onclick = startNewFocus;
}


// --------------------------
// Nouveau Pomodoro
// --------------------------

function startNewFocus() {
    currentMode = "focus";

    totalTime = FOCUS_TIME;
    timeLeft = FOCUS_TIME;

    running = false;
    hasStarted = false;

    clearInterval(timerInterval);
    timerInterval = null;

    modeTitle.textContent = "Focus Time 🍅";

    showView(timerView, messageView);

    updateDisplay();
    updateStartButton();
}

function applyTheme(theme) {
    document.body.dataset.theme = theme;

    themeButtons.forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.theme === theme
        );
    });

    localStorage.setItem("caeliaFocusTheme", theme);
}

function loadTheme() {
    const savedTheme =
        localStorage.getItem("caeliaFocusTheme") || "pink";

    applyTheme(savedTheme);
}

themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
        applyTheme(button.dataset.theme);
    });
});

// --------------------------
// Boutons
// --------------------------

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);


// --------------------------
// Affichage initial
// --------------------------

loadTheme();
loadState();

updateDisplay();
updateStreakDisplay();
updateStartButton();
