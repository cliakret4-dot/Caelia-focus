// ==========================
// Caelia Focus 🍅
// V 1.1
// ==========================

// Durées en secondes
const FOCUS_TIME = 25*60; // 25 minutes
const BREAK_TIME = 5*60; // 5 minutes
const LONG_BREAK_TIME = 15*60; // 15 minutes

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

    openBrowserBtn.classList.remove("hidden");

    openBrowserBtn.addEventListener("click", () => {

        const url = new URL(window.location.href);

        url.searchParams.delete("embed");

        window.open(url.toString(), "_blank");

    });

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

let dailyFocusCount = 0;
let focusCycleCount = 0;

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

const themeButtons = document.querySelectorAll(".theme-dot");

const resetModal = document.getElementById("resetModal");
const confirmResetBtn = document.getElementById("confirmReset");
const cancelResetBtn = document.getElementById("cancelReset");

const dailyFocusDisplay = document.getElementById("dailyFocus");
const openBrowserBtn = document.getElementById("openBrowser");

// Si les deux anciens compteurs existent encore dans le HTML,
// on retire automatiquement l'ancien pour n'en garder qu'un.
const legacyStreakDisplay = document.getElementById("streak");

if (
    legacyStreakDisplay &&
    dailyFocusDisplay &&
    legacyStreakDisplay !== dailyFocusDisplay
) {
    legacyStreakDisplay.remove();
}

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
        currentMode,
        totalTime,
        timeLeft,
        hasStarted
    };

    localStorage.setItem("caeliaFocusState", JSON.stringify(state));
}


// --------------------------
// Récupération de la sauvegarde
// --------------------------

function loadState() {
    const savedState = localStorage.getItem("caeliaFocusState");

    if (!savedState) return;

    try {
        const state = JSON.parse(savedState);

        currentMode = state.currentMode || "focus";
        totalTime = Number(state.totalTime) || FOCUS_TIME;
        timeLeft = Number.isFinite(Number(state.timeLeft))
            ? Number(state.timeLeft)
            : totalTime;
        hasStarted = Boolean(state.hasStarted);
    } catch (error) {
        console.warn("Sauvegarde du minuteur illisible, réinitialisation.", error);
        localStorage.removeItem("caeliaFocusState");
        return;
    }

    // Le chrono revient toujours en pause après un rechargement.
    running = false;
    timerInterval = null;

    if (currentMode === "break") {
        modeTitle.textContent =
            totalTime === LONG_BREAK_TIME
                ? "Longue pause 🌿"
                : "Pause ☕";
    } else {
        modeTitle.textContent = "Focus Time 🍅";
    }
}

function getPlantIcon() {
    let currentIcon = plantStages[0].icon;

    plantStages.forEach((stage) => {
        if (dailyFocusCount >= stage.min) {
            currentIcon = stage.icon;
        }
    });

    return currentIcon;
}

function animatePlantGrowth() {
    dailyFocusDisplay.classList.remove("plant-grow");

    // Force le navigateur à réinitialiser l’animation
    void dailyFocusDisplay.offsetWidth;

    dailyFocusDisplay.classList.add("plant-grow");
}

function animatePlantLevelUp() {
    dailyFocusDisplay.classList.remove("plant-level-up");

    void dailyFocusDisplay.offsetWidth;

    dailyFocusDisplay.classList.add("plant-level-up");
}

// --------------------------
// Affichage du compteur journalier
// --------------------------

function updateDailyFocusDisplay() {
    if (!dailyFocusDisplay) return;

    const plantIcon = getPlantIcon();
    dailyFocusDisplay.textContent =
        `${plantIcon} Aujourd’hui : ${dailyFocusCount} Focus`;
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

function performReset() {

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
    playFinishSound();

    if (currentMode === "focus") {
        // Vérifie que le compteur appartient toujours à aujourd'hui.
        resetDailyFocusIfNeeded();

        const previousIcon = getPlantIcon();

        dailyFocusCount++;
        focusCycleCount++;

        saveDailyFocus();

        const isLongBreak = focusCycleCount >= 4;

        if (isLongBreak) {
            totalTime = LONG_BREAK_TIME;
            timeLeft = LONG_BREAK_TIME;

            // La prochaine série repart de zéro après la longue pause.
            focusCycleCount = 0;
        } else {
            totalTime = BREAK_TIME;
            timeLeft = BREAK_TIME;
        }

        currentMode = "break";
        saveFocusCycle();

        const newIcon = getPlantIcon();
        updateDailyFocusDisplay();

        if (previousIcon !== newIcon) {
            animatePlantLevelUp();
        } else {
            animatePlantGrowth();
        }

        saveState();
        showFocusSuccess(isLongBreak);
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

function showFocusSuccess(isLongBreak = false) {
    showView(messageView, timerView);

    modeTitle.textContent = "Focus terminé 🍅";
    messageTitle.textContent = getRandomCongratulations();

    if (isLongBreak) {
        messageText.textContent =
            "Quatre Focus terminés ! Une longue pause de 15 minutes t’attend pour recharger les batteries 🌿";
        nextButton.textContent = "▶ Commencer la longue pause";
    } else {
        messageText.textContent =
            "Tu viens de terminer un cycle de concentration. Prends maintenant une pause bien méritée 🌿";
        nextButton.textContent = "▶ Commencer la pause";
    }

    nextButton.onclick = startBreak;
}


// --------------------------
// Lancer la pause
// --------------------------

function startBreak() {
    currentMode = "break";

    // La durée a déjà été choisie dans finishCycle().
    // On ne la remplace surtout pas par BREAK_TIME ici.
    if (totalTime !== BREAK_TIME && totalTime !== LONG_BREAK_TIME) {
        totalTime = BREAK_TIME;
    }

    if (timeLeft <= 0 || timeLeft > totalTime) {
        timeLeft = totalTime;
    }

    running = false;
    hasStarted = false;

    clearInterval(timerInterval);
    timerInterval = null;

    modeTitle.textContent =
        totalTime === LONG_BREAK_TIME
            ? "Longue pause 🌿"
            : "Pause ☕";

    showView(timerView, messageView);

    updateDisplay();
    updateStartButton();
    saveState();

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

function getTodayKey() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function resetDailyFocusIfNeeded() {
    const savedDate = localStorage.getItem("caeliaDailyFocusDate");
    const today = getTodayKey();

    if (savedDate !== today) {
        dailyFocusCount = 0;

        localStorage.setItem("caeliaDailyFocusDate", today);
        localStorage.setItem("caeliaDailyFocusCount", "0");

        updateDailyFocusDisplay();
    }
}

function loadDailyFocus() {
    const savedDate = localStorage.getItem("caeliaDailyFocusDate");
    const today = getTodayKey();

    if (savedDate === today) {
        dailyFocusCount =
            Number(localStorage.getItem("caeliaDailyFocusCount")) || 0;
    } else {
        dailyFocusCount = 0;

        localStorage.setItem("caeliaDailyFocusDate", today);
        localStorage.setItem("caeliaDailyFocusCount", "0");
    }

    updateDailyFocusDisplay();
}

function saveDailyFocus() {
    localStorage.setItem("caeliaDailyFocusDate", getTodayKey());
    localStorage.setItem(
        "caeliaDailyFocusCount",
        dailyFocusCount.toString()
    );
}

function loadFocusCycle() {
    focusCycleCount =
        Number(localStorage.getItem("caeliaFocusCycleCount")) || 0;

    // Sécurité en cas d'ancienne valeur incohérente.
    if (focusCycleCount < 0 || focusCycleCount > 3) {
        focusCycleCount = 0;
        saveFocusCycle();
    }
}

function saveFocusCycle() {
    localStorage.setItem(
        "caeliaFocusCycleCount",
        focusCycleCount.toString()
    );
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
resetBtn.addEventListener("click", () => {
    resetModal.classList.remove("hidden");
});
cancelResetBtn.addEventListener("click", () => {
    resetModal.classList.add("hidden");
});
confirmResetBtn.addEventListener("click", () => {

    resetModal.classList.add("hidden");

    performReset();

});
resetModal.addEventListener("click", (e) => {

    if (e.target === resetModal) {
        resetModal.classList.add("hidden");
    }

});

// --------------------------
// Affichage initial
// --------------------------

loadTheme();
loadDailyFocus();
loadFocusCycle();
loadState();

updateDisplay();
updateProgress();
updateDailyFocusDisplay();
updateStartButton();
