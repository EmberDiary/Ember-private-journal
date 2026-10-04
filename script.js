// Load saved files without allowing malformed browser data to break startup.


    input.value = "";
    setCompanionBusy(true);
    renderCompanionMessages();
    persistCompanionState(file);
    const response = createCompanionReply(message);
    window.setTimeout(() => {
        const aiMessage = appendCompanionMessage("assistant", response);
        if (aiMessage) {
            persistCompanionState(file);
        }
        setCompanionBusy(false);
        renderCompanionMessages();
    }, 420);
}

function setCompanionBusy(isBusy) {
    companionBusy = isBusy;
    const input = document.getElementById("companion-input");
    const button = document.querySelector(".companion-send");
    const status = document.getElementById("companion-status");
    if (input) {
        input.disabled = isBusy;
        input.placeholder = isBusy ? "Companion is thinking..." : "Tell your companion what is on your mind...";
    }
    if (button) button.disabled = isBusy || !input?.value.trim();
    if (status) {
        status.classList.toggle("is-thinking", isBusy);
        status.innerHTML = `<i></i>${isBusy ? " Thinking" : " Ready"}`;
    }
}

function toggleCompanion(isOpen) {
    const panel = document.getElementById("companion-panel");
    const launcher = document.getElementById("companion-launcher");
    if (!panel || !launcher) return;
    panel.classList.toggle("is-open", isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));
    launcher.setAttribute("aria-expanded", String(isOpen));
    if (isOpen) window.setTimeout(() => document.getElementById("companion-input")?.focus(), 260);
}

function loadFiles() {
    try {
        const currentData = localStorage.getItem("ember_files");
        const legacyData = localStorage.getItem("inklock_files");
        const savedFiles = JSON.parse(currentData || legacyData);
        if (!currentData && legacyData) localStorage.setItem("ember_files", legacyData);
        if (!Array.isArray(savedFiles)) return [];
        savedFiles.forEach(file => {
            file.mood = moods[file.mood] ? file.mood : "neutral";
            file.createdAt = file.createdAt || new Date().toISOString();
            file.updatedAt = file.updatedAt || file.createdAt;
        });
        if (!currentData && legacyData) localStorage.setItem("ember_files", JSON.stringify(savedFiles));
        return savedFiles;
    } catch (error) {
        return [];
    }
}

// Check if user has set up a password yet
function checkFirstTimeUser() {
    const passcodeRecord = localStorage.getItem("ember_pass_record");
    const savedPass = passcodeRecord || localStorage.getItem("ember_pass") || localStorage.getItem("inklock_pass");
    if (!passcodeRecord && savedPass && !localStorage.getItem("ember_pass")) localStorage.setItem("ember_pass", savedPass);
    if (!savedPass) {
        switchScreen("setup-screen");
    } else {
        switchScreen("login-screen");
    }
}

// Utility to switch screens
function switchScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(screenId);
    if (target) target.classList.add("active");
}

function applyMoodTheme(mood) {
    const selectedMood = moods[mood] ? mood : "neutral";
    document.body.dataset.mood = selectedMood;
    document.querySelectorAll(".mood-option").forEach(option => {
        option.classList.toggle("selected", option.dataset.mood === selectedMood);
    });
}

function showMoodSelection(target = "new") {
    moodSelectionTarget = target;
    moodTransitioning = false;
    document.querySelectorAll(".mood-option").forEach(option => option.classList.remove("selected"));
    switchScreen("mood-screen");
}

function selectMood(mood) {
    if (!moods[mood] || moodTransitioning) return;
    moodTransitioning = true;
    applyMoodTheme(mood);
    const selected = document.querySelector(`.mood-option[data-mood="${mood}"]`);
    selected?.classList.add("selected");
    window.setTimeout(() => {
        if (moodSelectionTarget === "new") createNewFile("New Entry", mood);
        else openFile(moodSelectionTarget);
        moodTransitioning = false;
    }, 420);
}

function formatEntryDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

const passcodeIterations = 310000;

function bytesToHex(bytes) {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
    return new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
}

async function derivePasscodeHash(passcode, salt, iterations) {
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(passcode),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
        keyMaterial,
        256
    );
    return bytesToHex(new Uint8Array(bits));
}

async function createPasscodeRecord(passcode) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return {
        version: 1,
        iterations: passcodeIterations,
        salt: bytesToHex(salt),
        hash: await derivePasscodeHash(passcode, salt, passcodeIterations)
    };
}

function isValidPasscodeRecord(record) {
    return record?.version === 1
        && Number.isInteger(record.iterations)
        && record.iterations >= 100000
        && record.iterations <= 600000
        && /^[0-9a-f]{32}$/i.test(record.salt)
        && /^[0-9a-f]{64}$/i.test(record.hash);
}

async function verifyPasscodeRecord(passcode, record) {
    if (!isValidPasscodeRecord(record)) return false;
    const actualHash = await derivePasscodeHash(passcode, hexToBytes(record.salt), record.iterations);
    let difference = 0;
    for (let index = 0; index < actualHash.length; index += 1) {
        difference |= actualHash.charCodeAt(index) ^ record.hash.toLowerCase().charCodeAt(index);
    }
    return difference === 0;
}

function showSetupError(message) {
    const errorDiv = document.getElementById("setup-error");
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
}

async function saveNewPassword() {
    const p1 = document.getElementById("pass-create").value;
    const p2 = document.getElementById("pass-confirm").value;
    const hint = document.getElementById("pass-hint")?.value.trim() || "";
    const errorDiv = document.getElementById("setup-error");

    if (p1.length < 8) {
        showSetupError("Your code must be at least 8 characters.");
        return;
    }
    if (p1 !== p2) {
        showSetupError("Codes do not match. Try again.");
        return;
    }
    if (evaluatePassphraseStrength(p1).score < 2) {
        showSetupError("Choose a stronger passphrase with a mix of letters, numbers, and a memorable pattern.");
        return;
    }

    try {
        const record = await createPasscodeRecord(p1);
        localStorage.setItem("ember_pass_record", JSON.stringify(record));
        if (hint) localStorage.setItem("ember_pass_hint", hint);
        else localStorage.removeItem("ember_pass_hint");
        localStorage.removeItem("ember_email");
        localStorage.removeItem("ember_pass");
        localStorage.removeItem("inklock_pass");
        errorDiv.style.display = "none";
        document.getElementById("pass-create").value = "";
        document.getElementById("pass-confirm").value = "";
        document.getElementById("pass-hint").value = "";
        initDashboard();
    } catch (error) {
        showSetupError("Secure code storage is unavailable in this browser.");
    }
}

async function verifyPassword() {
    const input = document.getElementById("pass-input").value;
    const errorDiv = document.getElementById("login-error");

    if (!input) {
        errorDiv.textContent = "Enter your secret code.";
        errorDiv.style.display = "block";
        return;
    }

    try {
        const storedRecord = localStorage.getItem("ember_pass_record");
        const legacyPasscode = localStorage.getItem("ember_pass") || localStorage.getItem("inklock_pass");
        let verified = false;

        if (storedRecord) {
            const record = JSON.parse(storedRecord);
            verified = await verifyPasscodeRecord(input, record);
        } else if (legacyPasscode !== null) {
            verified = input === legacyPasscode;
        }

        if (!verified) {
            errorDiv.textContent = "Email or secret code is incorrect.";
            errorDiv.style.display = "block";
            return;
        }

        const record = storedRecord ? null : await createPasscodeRecord(input);
        if (record) localStorage.setItem("ember_pass_record", JSON.stringify(record));
        localStorage.removeItem("ember_email");
        localStorage.removeItem("ember_pass");
        localStorage.removeItem("inklock_pass");
        errorDiv.style.display = "none";
        document.getElementById("pass-input").value = "";
        initDashboard();
    } catch (error) {
        errorDiv.textContent = "Could not verify your code securely in this browser.";
        errorDiv.style.display = "block";
    }
}

// Start up the main journal interface
function initDashboard() {
    if (files.length === 0) {
        showMoodSelection();
    } else {
        switchScreen("dashboard-screen");
        loadSidebar();
        openFile(files[0].id);
    }
}

// Create a new diary file
function createNewFile(defaultTitle = "New Entry", mood = "neutral") {
    const now = new Date().toISOString();
    const newFile = {
        id: Date.now().toString(),
        title: defaultTitle,
        content: "",
        mood,
        createdAt: now,
        updatedAt: now,
        font: "sans",
        paperColor: "#1a1a1a"
    };
    files.push(newFile);
    switchScreen("dashboard-screen");
    saveToLocalStorage();
    loadSidebar();
    openFile(newFile.id);
}

// Render the sidebar file list
function loadSidebar() {
    const listContainer = document.getElementById("file-list");
    if (!listContainer) return;
    
    listContainer.innerHTML = "";
    
    files.forEach(file => {
        const div = document.createElement("div");
        const mood = moods[file.mood] || moods.neutral;
        div.className = `file-item mood-accent-${file.mood || "neutral"} ${file.id === currentFileId ? 'active' : ''}`;
        div.innerHTML = `<span class="file-item-title"></span><span class="file-item-meta">${mood.emoji} ${mood.label} · ${formatEntryDate(file.updatedAt || file.createdAt)}</span>`;
        div.querySelector(".file-item-title").textContent = file.title || "Untitled";
        div.onclick = () => openFile(file.id);
        listContainer.appendChild(div);
    });
}

// Open a specific file into the editor
function openFile(id) {
    currentFileId = id;
    const file = files.find(f => f.id === id);
    if (!file) return;

    const titleInput = document.getElementById("file-title-input");
    const textInput = document.getElementById("diary-text");
    const fontSelect = document.getElementById("font-select");
    const colorPicker = document.getElementById("paper-color-picker");
    const moodSelect = document.getElementById("mood-select");

    if (!titleInput || !textInput || !fontSelect || !colorPicker || !moodSelect) return;

    titleInput.value = file.title || "";
    textInput.value = file.content || "";
    fontSelect.value = file.font || "sans";
    colorPicker.value = file.paperColor || "#1a1a1a";
    moodSelect.value = moods[file.mood] ? file.mood : "neutral";
    applyMoodTheme(moodSelect.value);
    updateEntryMetadata(file);
    loadCompanionMessages(file);

    updateEditorStyles();
    loadSidebar();
}

// Automatically save changes as you type or change settings
function autoSaveCurrentFile() {
    const file = files.find(f => f.id === currentFileId);
    if (!file) return;

    const titleInput = document.getElementById("file-title-input");
    const textInput = document.getElementById("diary-text");
    const fontSelect = document.getElementById("font-select");
    const colorPicker = document.getElementById("paper-color-picker");
    const moodSelect = document.getElementById("mood-select");

    if (!titleInput || !textInput || !fontSelect || !colorPicker || !moodSelect) return;

    file.title = titleInput.value.trim() || "Untitled";
    file.content = textInput.value;
    file.font = fontSelect.value;
    file.paperColor = colorPicker.value;
    file.mood = moods[moodSelect.value] ? moodSelect.value : "neutral";
    file.updatedAt = new Date().toISOString();

    saveToLocalStorage();
    loadSidebar();
    applyMoodTheme(file.mood);
    updateEntryMetadata(file);
    showSaveStatus();
}

function showSaveStatus() {
    const status = document.getElementById("save-status");
    if (status) status.textContent = "Saved locally";
}

function updateEntryMetadata(file) {
    const mood = moods[file.mood] || moods.neutral;
    const label = document.getElementById("entry-mood-label");
    const date = document.getElementById("entry-date");
    if (label) {
        label.textContent = `${mood.emoji} ${mood.label}`;
        label.className = `entry-mood-label mood-text-${file.mood}`;
    }
    if (date) date.textContent = formatEntryDate(file.updatedAt || file.createdAt);
}

// Update the visual paper style (font & color)
function updateEditorStyles() {
    const file = files.find(f => f.id === currentFileId);
    if (!file) return;

    const paperSheet = document.getElementById("paper-sheet");
    const fontControl = document.getElementById("font-select");
    const colorControl = document.getElementById("paper-color-picker");
    if (!fontControl || !colorControl) return;

    const fontSelect = fontControl.value;
    const colorPicker = colorControl.value;

    if (paperSheet) {
        paperSheet.style.backgroundColor = colorPicker;
        paperSheet.className = "paper-sheet font-" + fontSelect;
    }

    file.font = fontSelect;
    file.paperColor = colorPicker;
    saveToLocalStorage();
}

// Helper to save state to localStorage
function saveToLocalStorage() {
    localStorage.setItem("ember_files", JSON.stringify(files));
}

function evaluatePassphraseStrength(password) {
    let score = 0;
    if (!password) return { score: 0, label: "Needs work", rating: "weak" };
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 1, label: "Needs work", rating: "weak" };
    if (score === 3) return { score: 2, label: "Good", rating: "medium" };
    if (score === 4) return { score: 3, label: "Strong", rating: "good" };
    return { score: 4, label: "Excellent", rating: "strong" };
}

function updatePassStrengthDisplay() {
    const input = document.getElementById("pass-create");
    const meter = document.getElementById("pass-strength");
    const text = document.getElementById("pass-strength-text");
    if (!input || !meter || !text) return;

    const result = evaluatePassphraseStrength(input.value);
    const segment = meter.querySelector("span");
    if (!segment) return;

    const widths = ["12%", "38%", "68%", "100%"];
    meter.dataset.level = result.rating;
    segment.style.width = widths[Math.min(result.score, widths.length - 1)];
    text.textContent = result.label;
    text.className = `strength-text ${result.rating}`;
}

function applyMemorySuggestion(suggestion) {
    const input = document.getElementById("pass-create");
    if (!input) return;
    input.value = suggestion;
    updatePassStrengthDisplay();
    input.focus();
}

function setupEditorEvents() {
    initializeTheme();
    detectBrowserLocale();
    initializeAiSettings();
    updateCompanionIdentity();
    document.getElementById("pass-create")?.addEventListener("input", updatePassStrengthDisplay);
    document.querySelectorAll(".memory-chip").forEach(button => button.addEventListener("click", () => applyMemorySuggestion(button.dataset.suggestion)));
    document.getElementById("new-file-button")?.addEventListener("click", () => showMoodSelection());
    document.querySelectorAll(".mood-option").forEach(option => option.addEventListener("click", () => selectMood(option.dataset.mood)));
    ["file-title-input", "diary-text", "mood-select", "font-select", "paper-color-picker"].forEach(id => {
        document.getElementById(id)?.addEventListener("input", () => {
            autoSaveCurrentFile();
            if (id === "font-select" || id === "paper-color-picker") updateEditorStyles();
        });
        document.getElementById(id)?.addEventListener("change", autoSaveCurrentFile);
    });
    document.getElementById("companion-form")?.addEventListener("submit", sendCompanionMessage);
    document.getElementById("companion-launcher")?.addEventListener("click", () => toggleCompanion(true));
    document.getElementById("companion-close")?.addEventListener("click", () => toggleCompanion(false));
    document.getElementById("companion-input")?.addEventListener("input", event => {
        const button = document.querySelector(".companion-send");
        if (button && !companionBusy) button.disabled = !event.target.value.trim();
    });
    document.getElementById("companion-input")?.addEventListener("keydown", event => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            document.getElementById("companion-form")?.requestSubmit();
        }
    });
    document.querySelectorAll(".secret-toggle").forEach(button => button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        if (!input) return;
        const isVisible = input.type === "password";
        input.type = isVisible ? "text" : "password";
        button.textContent = isVisible ? "Hide" : "Show";
        button.setAttribute("aria-pressed", String(isVisible));
        const label = button.dataset.target === "pass-input" ? "secret code" : button.dataset.target === "pass-confirm" ? "confirmation code" : "code";
        button.setAttribute("aria-label", `${isVisible ? "Hide" : "Show"} ${label}`);
    }));
}

document.addEventListener("DOMContentLoaded", () => {
    updatePassStrengthDisplay();
    setupEditorEvents();
});
