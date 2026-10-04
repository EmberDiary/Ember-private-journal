// Load saved files without allowing malformed browser data to break startup.
let files = loadFiles();
let currentFileId = null;
let moodSelectionTarget = "new";
let moodTransitioning = false;
let aiSettings;
let companionMessages = [];
let companionBusy = false;

const moods = {
    happy: { label: "Happy", emoji: "😊" },
    neutral: { label: "Neutral", emoji: "😐" },
    sad: { label: "Sad", emoji: "😢" },
    angry: { label: "Angry", emoji: "😡" }
};

const mbtiGroups = {
    analysts: {
        label: "Analysts",
        color: "purple",
        types: [
            ["INTJ", "Architect", "Independent, strategic, and quietly focused on what could work better."],
            ["INTP", "Logician", "Curious, precise, and drawn to untangling complicated ideas."],
            ["ENTJ", "Commander", "Decisive, candid, and energized by turning a direction into action."],
            ["ENTP", "Debater", "Inventive, questioning, and comfortable exploring more than one angle."]
        ]
    },
    diplomats: {
        label: "Diplomats",
        color: "green",
        types: [
            ["INFJ", "Advocate", "Thoughtful, values-led, and attentive to the meaning beneath events."],
            ["INFP", "Mediator", "Reflective, sincere, and interested in what feels true and worthwhile."],
            ["ENFJ", "Protagonist", "Warm, perceptive, and naturally interested in helping people connect."],
            ["ENFP", "Campaigner", "Open-minded, curious, and quick to notice possibility in a situation."]
        ]
    },
    sentinels: {
        label: "Sentinels",
        color: "blue",
        types: [
            ["ISTJ", "Logistician", "Steady, practical, and attentive to what has actually been said or done."],
            ["ISFJ", "Defender", "Considerate, grounded, and alert to the details that make people feel safe."],
            ["ESTJ", "Executive", "Organized, direct, and inclined to make a useful next step concrete."],
            ["ESFJ", "Consul", "Engaged, considerate, and interested in the effect choices have on others."]
        ]
    },
    explorers: {
        label: "Explorers",
        color: "yellow",
        types: [
            ["ISTP", "Virtuoso", "Observant, adaptable, and interested in what can be tried right now."],
            ["ISFP", "Adventurer", "Sensitive to experience, genuine, and open to finding a personal way through."],
            ["ESTP", "Entrepreneur", "Energetic, pragmatic, and willing to address the immediate reality."],
            ["ESFP", "Entertainer", "Present, expressive, and good at finding the human detail in a moment."]
        ]
    }
};

const mbtiPersonalities = {
    INTJ: { group: "Analysts", communication: "clear, composed, and future-aware", adviceStyle: "map the situation into options and likely consequences", emotionalStyle: "acknowledge feelings precisely without letting them disappear into vagueness", humorStyle: "dry and lightly understated", questioningStyle: "ask one sharp question that clarifies the real objective", disagreementStyle: "challenge assumptions directly but fairly", energy: "measured", reflection: "briefly identify the pattern before suggesting a next move" },
    INTP: { group: "Analysts", communication: "curious, exact, and exploratory", adviceStyle: "separate evidence, assumptions, and possible explanations", emotionalStyle: "show care by making confusing feelings easier to understand", humorStyle: "wry and idea-driven", questioningStyle: "offer a surprising angle or ask what evidence would change the view", disagreementStyle: "treat disagreement as a hypothesis to examine", energy: "quietly engaged", reflection: "linger on the interesting ambiguity before narrowing it" },
    ENTJ: { group: "Analysts", communication: "decisive, candid, and organized", adviceStyle: "turn the problem into a practical sequence of choices", emotionalStyle: "respect the emotion, then help restore agency", humorStyle: "confident and sparing", questioningStyle: "ask what outcome the user is willing to act toward", disagreementStyle: "name the conflict and propose a direct conversation", energy: "focused and assertive", reflection: "identify the leverage point quickly" },
    ENTP: { group: "Analysts", communication: "quick, flexible, and intellectually playful", adviceStyle: "test the situation from several competing angles", emotionalStyle: "validate without assuming the first interpretation is complete", humorStyle: "playful, clever, and responsive to the user's tone", questioningStyle: "ask a provocative but useful either-or question", disagreementStyle: "keep the debate curious rather than personal", energy: "lively but controlled", reflection: "open up possibilities before choosing one" },
    INFJ: { group: "Diplomats", communication: "quietly perceptive and meaning-focused", adviceStyle: "connect the immediate event to values and longer-term needs", emotionalStyle: "name the emotional subtext gently and specifically", humorStyle: "soft, observant, and occasional", questioningStyle: "ask what the situation may be revealing about a need", disagreementStyle: "seek the honest meaning beneath the stated positions", energy: "calm and attentive", reflection: "pause over what is unsaid before offering direction" },
    INFP: { group: "Diplomats", communication: "sincere, reflective, and non-presumptive", adviceStyle: "protect the user's values while exploring realistic choices", emotionalStyle: "make room for the feeling without romanticizing it", humorStyle: "gentle, personal, and never dismissive", questioningStyle: "ask what would feel authentic rather than merely acceptable", disagreementStyle: "hold boundaries while keeping the person's humanity in view", energy: "warm and unhurried", reflection: "reflect the emotional truth before moving to action" },
    ENFJ: { group: "Diplomats", communication: "warm, clear, and relational", adviceStyle: "consider both the user's needs and the relationship dynamics", emotionalStyle: "express care openly and help the user feel less alone in the decision", humorStyle: "encouraging and socially aware", questioningStyle: "ask what each person may need to hear", disagreementStyle: "move toward an honest, repairing conversation", energy: "engaged and supportive", reflection: "connect the feeling to the people involved" },
    ENFP: { group: "Diplomats", communication: "open, imaginative, and grounded when stakes are high", adviceStyle: "offer a few humane paths without forcing one answer", emotionalStyle: "match the user's feeling, then widen the sense of possibility", humorStyle: "bright when invited, serious when needed", questioningStyle: "ask an expansive question that reveals what the user wants", disagreementStyle: "protect honesty and connection without avoiding tension", energy: "expressive and responsive", reflection: "notice possibilities while staying with the actual problem" },
    ISTJ: { group: "Sentinels", communication: "steady, concrete, and careful with facts", adviceStyle: "focus on what happened, what is known, and the next dependable step", emotionalStyle: "show steadiness rather than overstatement", humorStyle: "understated and situational", questioningStyle: "ask for the specific detail that changes the decision", disagreementStyle: "return to commitments, evidence, and clear boundaries", energy: "calm and practical", reflection: "establish the facts before interpreting them" },
    ISFJ: { group: "Sentinels", communication: "considerate, detailed, and reassuring without sugarcoating", adviceStyle: "protect the user's wellbeing through small, workable steps", emotionalStyle: "notice personal impact and offer quiet validation", humorStyle: "gentle and familiar", questioningStyle: "ask what support would make the next hour easier", disagreementStyle: "encourage firm kindness and specific boundaries", energy: "softly attentive", reflection: "notice the details that made the event hurt" },
    ESTJ: { group: "Sentinels", communication: "direct, orderly, and action-oriented", adviceStyle: "define the problem, responsibility, and an executable next step", emotionalStyle: "take the feeling seriously without letting it obscure the task", humorStyle: "plainspoken and situational", questioningStyle: "ask what can be done today", disagreementStyle: "address the issue plainly and set a standard", energy: "decisive", reflection: "compress the situation into what needs attention first" },
    ESFJ: { group: "Sentinels", communication: "warm, practical, and socially attentive", adviceStyle: "balance the user's needs with the health of the relationship", emotionalStyle: "offer visible care and concrete reassurance", humorStyle: "friendly and lightly playful", questioningStyle: "ask how the user wants the other person to understand them", disagreementStyle: "favor clear repair over silent resentment", energy: "engaged and encouraging", reflection: "consider how the interaction affected everyone involved" },
    ISTP: { group: "Explorers", communication: "concise, observant, and unflustered", adviceStyle: "look for a workable experiment or immediate action", emotionalStyle: "respect the feeling without crowding it with language", humorStyle: "dry and situational", questioningStyle: "ask what can be tested or changed next", disagreementStyle: "cut through posturing and focus on what is actually happening", energy: "low-key and alert", reflection: "notice the concrete detail others may have missed" },
    ISFP: { group: "Explorers", communication: "gentle, genuine, and present-focused", adviceStyle: "honor the user's lived experience while keeping choices open", emotionalStyle: "respond with warmth and sensory specificity", humorStyle: "quiet and human", questioningStyle: "ask what feels right in the immediate reality", disagreementStyle: "protect authenticity without making the conflict bigger", energy: "calm and personal", reflection: "stay close to the moment before generalizing" },
    ESTP: { group: "Explorers", communication: "energetic, candid, and reality-based", adviceStyle: "identify the move that changes the situation rather than rehearsing it", emotionalStyle: "acknowledge the intensity and help turn it into agency", humorStyle: "bold but never at the user's expense", questioningStyle: "ask what the user wants to try or say next", disagreementStyle: "prefer a direct, timely confrontation to prolonged guessing", energy: "active and confident", reflection: "get to the live pressure point quickly" },
    ESFP: { group: "Explorers", communication: "expressive, warm, and attentive to the human moment", adviceStyle: "make the next step approachable and emotionally honest", emotionalStyle: "bring warmth without forcing cheerfulness", humorStyle: "playful when welcomed and quick to soften tension", questioningStyle: "ask what would make the situation feel more real or manageable", disagreementStyle: "encourage directness with care for the relationship", energy: "social and responsive", reflection: "focus on the feeling and interaction the user is actually living" }
};

const friendReactions = {
    INTJ: { everyday: "That is oddly specific. I’m listening.", conflict: "I suspect there is a missing variable here, but the behavior still sounds inconsiderate.", awkward: "Painful. Also, objectively, a very efficient way to create a memory you did not order.", achievement: "Good. You put in the work and the result finally bothered to show up." },
    INTP: { everyday: "Interesting. ‘Weird’ is doing a lot of work in that sentence.", conflict: "There are at least two plausible explanations, and one of them is probably less dramatic than the first one.", awkward: "That is the kind of social glitch that deserves a tiny postmortem.", achievement: "The evidence is in: you are, in fact, capable of doing the thing." },
    ENTJ: { everyday: "All right, give me the incident report.", conflict: "Being ignored is not a communication strategy I would recommend, frankly.", awkward: "You survived. Next objective: never let them forget how confidently you waved.", achievement: "There we go. Take the win; you earned it." },
    ENTP: { everyday: "Weird in the fun way, or weird in the ‘someone needs to explain themselves’ way?", conflict: "I have a theory, but I want the messy version before I prosecute anyone.", awkward: "Excellent. A tiny social disaster with excellent replay value.", achievement: "Look at you, collecting evidence against your own imposter syndrome." },
    INFJ: { everyday: "Weird how? The harmless kind, or the kind that changes the temperature of the whole day?", conflict: "I wonder what happened underneath the silence, though ignoring you still landed badly.", awkward: "I can feel why that would stick with you. It is also a little funny from the outside, gently.", achievement: "That sounds like a moment worth letting yourself actually enjoy." },
    INFP: { everyday: "Weird how? I want the version with all the small details.", conflict: "I don’t want to invent a motive for them, but I also don’t think you should pretend it did not hurt.", awkward: "Oh no. I’m laughing with you, not at you. Social life is a strange little theater.", achievement: "That is lovely. I hope you let the good feeling stay for a minute." },
    ENFJ: { everyday: "Okay, tell me everything. Who was there and what was the vibe?", conflict: "That kind of silence can make a room feel much colder than it needs to be.", awkward: "You poor thing. Still, the confidence of the wave is almost admirable.", achievement: "Yes! I’m genuinely pleased for you. What part are you proudest of?" },
    ENFP: { everyday: "Weird how? Harmless-weird, hilarious-weird, or ‘this becomes a story later’ weird?", conflict: "I want the full context before we decide whether your friends were careless or just distracted.", awkward: "I’m sorry, but that is spectacularly human. I would absolutely remember it too.", achievement: "Wait, really? That is fantastic. I want the unnecessarily detailed celebration version." },
    ISTJ: { everyday: "What specifically happened? ‘Weird’ needs a few facts attached to it.", conflict: "If they had a reason, they should have said so. Silence leaves too much room for guesswork.", awkward: "Uncomfortable, yes. Fatal, no. The record can show you recovered.", achievement: "That is a clear result from consistent effort. You should count it properly." },
    ISFJ: { everyday: "Tell me what happened. I’m curious about the part that stayed with you.", conflict: "That was not very considerate of them, whatever the reason turned out to be.", awkward: "Oh, I know that exact kind of embarrassment. You are allowed to laugh at it now.", achievement: "I’m glad something you worked for came back with a little proof that it mattered." },
    ESTJ: { everyday: "Give me the short version first, then the part that actually matters.", conflict: "If they wanted space, they could have communicated that. Ignoring someone is lazy conflict management.", awkward: "Not ideal. Recoverable. We move.", achievement: "Good. Mark the win and then decide what the next target is." },
    ESFJ: { everyday: "Oh? Weird how? I need the social context immediately.", conflict: "That would bother me too. People can be busy without making you feel invisible.", awkward: "No, because why does the body commit to a wave before the brain checks the evidence?", achievement: "That is wonderful. Who gets to hear the good news first?" },
    ISTP: { everyday: "Define weird. What was the actual event?", conflict: "Could be careless, could be nothing. Either way, you noticed it for a reason.", awkward: "A clean social misfire. Happens. Pretend it was deliberate and keep walking.", achievement: "Nice. A result you can point at instead of merely hope for." },
    ISFP: { everyday: "Weird how? I’m picturing the scene now.", conflict: "That kind of quiet can feel surprisingly loud. I would not brush it off too quickly.", awkward: "Oh, that hurts in the very specific way only public awkwardness can.", achievement: "That is a good little moment. Let it be good without interrogating it." },
    ESTP: { everyday: "Weird how? Give me the part where everything went sideways.", conflict: "If they have a problem, they can use words. Guessing games are boring.", awkward: "Incredible. Commit to the wave next time and make it a performance.", achievement: "There it is. Enjoy the win before you start looking for the next thing." },
    ESFP: { everyday: "Weird how? Funny-weird or ‘I need to sit down’ weird?", conflict: "That would make me want to ask them straight out what was going on.", awkward: "I’m sorry, but the accidental wave is objectively adorable and devastating.", achievement: "You did it! I hope you celebrated at least a little, even if it was just internally." }
};

const friendQuestions = {
    INTJ: "What outcome would make the most sense to pursue from here?", INTP: "What else could explain it, and which explanation actually fits the evidence?", ENTJ: "What do you want to happen next, and what move gets you closer?", ENTP: "Which interpretation is most interesting, and which one is most likely?", INFJ: "What do you think this revealed about the relationship underneath it?", INFP: "What would feel honest to you, even if it is not the easiest option?", ENFJ: "What would you want them to understand if you talked about it plainly?", ENFP: "What do you actually want from this situation now?", ISTJ: "What fact would clarify the next step?", ISFJ: "What would make the next part of the day easier on you?", ESTJ: "What can you do about it today?", ESFJ: "Do you want to understand them, be understood, or both?", ISTP: "What can you test or change instead of guessing?", ISFP: "What feels right in the situation as it actually is?", ESTP: "What are you going to do about it?", ESFP: "What would make this feel less awkward or heavy right now?"
};

function loadAiSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem("ember_ai_settings") || "{}");
        return {
            presentation: ["male", "female", "robot"].includes(saved.presentation) ? saved.presentation : "robot",
            mbti: Object.values(mbtiGroups).some(group => group.types.some(type => type[0] === saved.mbti)) ? saved.mbti : "INFP",
            personality: typeof saved.personality === "string" ? saved.personality : ""
        };
    } catch (error) {
        return { presentation: "robot", mbti: "INFP", personality: "" };
    }
}

aiSettings = loadAiSettings();

function isValidColor(value) {
    return /^#[0-9a-f]{6}$/i.test(value);
}

function applyTextColor(color) {
    if (!isValidColor(color)) return;
    document.documentElement.style.setProperty("--text-color", color);
    localStorage.setItem("ember_text_color", color);
    const picker = document.getElementById("text-color-picker");
    if (picker) picker.value = color;
    document.querySelectorAll("[data-text-color]").forEach(swatch => {
        swatch.classList.toggle("active", swatch.dataset.textColor.toLowerCase() === color.toLowerCase());
    });
}

function initializeTheme() {
    const savedColor = localStorage.getItem("ember_text_color");
    applyTextColor(isValidColor(savedColor) ? savedColor : "#f4eadf");
    document.getElementById("text-color-picker")?.addEventListener("input", event => applyTextColor(event.target.value));
    document.querySelectorAll("[data-text-color]").forEach(swatch => {
        swatch.addEventListener("click", () => applyTextColor(swatch.dataset.textColor));
    });
}

function detectBrowserLocale() {
    const locale = navigator.language || "en-US";
    document.documentElement.lang = locale.split("-")[0];
    return locale;
}

function renderMbtiGroups() {
    const container = document.getElementById("mbti-groups");
    if (!container) return;
    container.innerHTML = Object.entries(mbtiGroups).map(([key, group]) => `
        <fieldset class="mbti-group mbti-${group.color}">
            <legend>${group.label}</legend>
            <div class="mbti-options">
                ${group.types.map(([type, name, description]) => `
                    <button type="button" class="mbti-option ${aiSettings.mbti === type ? "selected" : ""}" data-mbti="${type}" title="${description}">
                        <strong>${type}</strong><span>${name}</span>
                    </button>`).join("")}
            </div>
        </fieldset>`).join("");
    container.querySelectorAll("[data-mbti]").forEach(button => button.addEventListener("click", () => {
        aiSettings.mbti = button.dataset.mbti;
        container.querySelectorAll("[data-mbti]").forEach(option => option.classList.toggle("selected", option === button));
    }));
}

function initializeAiSettings() {
    const presentation = document.getElementById("ai-presentation");
    const personality = document.getElementById("ai-personality");
    if (!presentation || !personality) return;
    presentation.value = aiSettings.presentation;
    personality.value = aiSettings.personality;
    renderMbtiGroups();
    document.getElementById("save-ai-settings")?.addEventListener("click", saveAiSettings);
}

function saveAiSettings() {
    aiSettings.presentation = document.getElementById("ai-presentation")?.value || "robot";
    aiSettings.personality = document.getElementById("ai-personality")?.value.trim() || "";
    localStorage.setItem("ember_ai_settings", JSON.stringify(aiSettings));
    updateCompanionIdentity();
    renderCompanionMessages();
    const status = document.getElementById("ai-settings-status");
    if (status) status.textContent = "AI settings saved locally.";
}

function updateCompanionIdentity() {
    const identity = document.getElementById("companion-identity");
    if (!identity) return;
    const presentation = { male: "Male", female: "Female", robot: "Neutral Robot" }[aiSettings.presentation];
    const profile = getMbtiProfile();
    const panel = document.getElementById("companion-panel");
    const avatar = document.getElementById("companion-avatar");
    if (panel) panel.dataset.mbtiGroup = profile.group.toLowerCase();
    if (avatar) avatar.textContent = { male: "◌", female: "✦", robot: "⌁" }[aiSettings.presentation];
    identity.textContent = `${presentation} · ${aiSettings.mbti}`;
}

function normalizeCompanionMessage(role, text) {
    const content = String(text || "").trim();
    if (!content) return null;
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: role === "assistant" ? "assistant" : "user",
        text: content,
        createdAt: new Date().toISOString()
    };
}

function appendCompanionMessage(role, text) {
    const message = normalizeCompanionMessage(role, text);
    if (!message) return null;
    const recent = companionMessages.slice(-10);
    const duplicate = recent.some(entry => entry.role === message.role && entry.text === message.text && Math.abs(new Date(entry.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000);
    if (duplicate) return null;
    companionMessages.push(message);
    return message;
}

function summarizeCompanionHistory(messages) {
    const recent = (messages || []).filter(message => message && typeof message.text === "string" && message.text.trim()).slice(-10);
    if (!recent.length) return "No earlier context yet.";
    const userSummaries = recent.filter(message => message.role === "user").map(message => message.text.trim());
    const assistantSummaries = recent.filter(message => message.role === "assistant").map(message => message.text.trim());
    const highlights = [];
    if (userSummaries.length) highlights.push(`Recent user context: ${userSummaries.slice(-3).join(" • ")}`);
    if (assistantSummaries.length) highlights.push(`Recent assistant context: ${assistantSummaries.slice(-2).join(" • ")}`);
    return highlights.join(" | ");
}

function buildCompanionHistoryMessages(messages = companionMessages) {
    const safeHistory = (messages || []).filter(message => message && typeof message.text === "string" && message.text.trim()).slice(-18);
    const profile = getMbtiProfile();
    const summary = summarizeCompanionHistory(safeHistory);
    const systemPrompt = [
        "You are a human-like diary companion.",
        "Keep track of the current conversation and update your understanding when the user corrects earlier statements or changes topics.",
        "Use the chat history, including earlier assistant messages, to continue naturally without repeating the same point.",
        `Current personality profile: ${profile.type} (${profile.group}) with communication style: ${profile.communication}; advice style: ${profile.adviceStyle}; emotional style: ${profile.emotionalStyle}; humor: ${profile.humorStyle}; question style: ${profile.questioningStyle}.`,
        `Custom personality: ${aiSettings.personality || "No extra personality instructions."}`,
        "Do not act like a therapist or emergency service; be conversational, warm, curious, and grounded.",
        "Avoid repeating the exact same validation or question unless it is necessary for clarity.",
        "Move the discussion forward with a relevant reaction, insight, practical suggestion, or natural follow-up."
    ].join(" ");

    const promptMessages = [{ role: "system", content: systemPrompt }];
    if (summary !== "No earlier context yet.") promptMessages.push({ role: "system", content: `Conversation continuity: ${summary}` });
    safeHistory.forEach(message => {
        promptMessages.push({ role: message.role, content: message.text.trim() });
    });
    return promptMessages;
}

function loadCompanionMessages(file) {
    const loaded = Array.isArray(file?.companionMessages) ? file.companionMessages.filter(message => message && typeof message.text === "string") : [];
    companionMessages = loaded.map(message => ({
        id: message.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: message.role === "assistant" ? "assistant" : "user",
        text: message.text.trim(),
        createdAt: message.createdAt || new Date().toISOString()
    }));
    if (!companionMessages.length) {
        const greetings = {
            Analysts: "I’m awake and appropriately curious. What happened?",
            Diplomats: "I’m here. Give me the unedited version, including the small detail you almost left out.",
            Sentinels: "All right, I’m listening. Start with what actually happened.",
            Explorers: "I’m in. What kind of day has it been?"
        };
        companionMessages = [{
            id: `welcome-${Date.now()}`,
            role: "assistant",
            text: greetings[getMbtiProfile().group] || greetings.Diplomats,
            createdAt: new Date().toISOString()
        }];
    }
    renderCompanionMessages();
}

function renderCompanionMessages() {
    const container = document.getElementById("companion-messages");
    if (!container) return;
    container.innerHTML = "";
    companionMessages.forEach(message => {
        const bubble = document.createElement("div");
        bubble.className = `companion-message ${message.role}`;
        bubble.textContent = message.text;
        container.appendChild(bubble);
    });
    if (companionBusy) {
        const typing = document.createElement("div");
        typing.className = "companion-message assistant typing-message";
        typing.innerHTML = "<span></span><span></span><span></span>";
        container.appendChild(typing);
    }
    container.scrollTop = container.scrollHeight;
}

function getMbtiProfile() {
    const base = Object.values(mbtiGroups).flatMap(group => group.types).find(type => type[0] === aiSettings.mbti) || mbtiGroups.diplomats.types[1];
    return { type: base[0], name: base[1], description: base[2], ...mbtiPersonalities[base[0]] };
}

function buildCompanionContext() {
    const profile = getMbtiProfile();
    return {
        role: "You are a supportive diary companion, not a therapist, authority, or emergency service.",
        mbti: profile.type,
        communication: profile.communication,
        advice: profile.adviceStyle,
        emotional: profile.emotionalStyle,
        humor: profile.humorStyle,
        questions: profile.questioningStyle,
        disagreement: profile.disagreementStyle,
        customPersonality: aiSettings.personality || "No extra personality instructions."
    };
}

function createCompanionReply(message) {
    const text = String(message || "").trim();
    const lower = text.toLowerCase();
    const profile = getMbtiProfile();
    const context = buildCompanionContext();
    const priorMessages = companionMessages.slice(-12);
    const userHistory = priorMessages.filter(entry => entry.role === "user").map(entry => entry.text);
    const lastUser = userHistory[userHistory.length - 1] || "";
    const priorAssistant = priorMessages.filter(entry => entry.role === "assistant").map(entry => entry.text);
    const previousTopic = userHistory.slice(-2).join(" ");
    const isCorrection = /(actually|no,|not my|not .*friend|not .*teacher|i meant|i was|i wasn't|other friend|someone from|forget what|that was|wrong person|it wasn't|wasn't me|not what happened)/i.test(lower) || /(actually|not my|other friend|someone from|wrong person|i meant)/i.test(lastUser);
    const isTopicShift = /(anyway|by the way|speaking of|also|moving on|switching gears|i want to buy|i watched|movie|keyboard|game|show|book|trip|song)/i.test(lower) || /(keyboard|movie|show|game|book|trip|song)/i.test(previousTopic);
    const isTeacherIssue = /(teacher|class|name|called me|wrong name|called by the wrong name)/i.test(lower) || /(teacher|class|name|wrong name)/i.test(previousTopic);
    const isFriendIssue = /(friend|ignored|left out|ignored me|kept talking)/i.test(lower) || /(friend|ignored|left out)/i.test(previousTopic);
    const isConflict = /(argument|fight|angry|furious|hate|betray|lied|cheated|ignored|left out|not nice|bad vibe|disrespect)/i.test(lower) || /(argument|fight|angry|ignored|left out)/i.test(previousTopic);
    const isAwkward = /(embarrass|awkward|mistake|regret|waved back|wrong person|call me by the wrong name|nervous|red face)/i.test(lower);
    const isAchievement = /(passed|got the job|finished|won|proud|succeeded|aced|get a grade|good grade)/i.test(lower);
    const isCasual = /(weird|random|funny|lol|haha|guess what|ridiculous|odd)/i.test(lower);
    const asksForHelp = /(what should|advice|do i|should i|how can|help me|what do you think|what would you do)/i.test(lower);
    const reaction = friendReactions[profile.type] || friendReactions.INFP;

    let reply;
    if (isCorrection) {
        if (isTeacherIssue) {
            reply = `${reaction.everyday} That actually makes more sense now. A teacher calling you by the wrong name is a weird little social glitch, and it explains why that moment felt off.`;
        } else if (isFriendIssue) {
            reply = `${reaction.conflict} Okay, that changes the picture. If it was someone from class rather than a friend, then the emotional weight is different, and it makes sense to reset the story.`;
        } else {
            reply = `${reaction.everyday} Got it — thanks for clarifying that. I’m going to use the corrected version of the story instead of the earlier one.`;
        }
    } else if (isTeacherIssue) {
        reply = `${reaction.awkward || reaction.everyday} That is a surprisingly specific kind of embarrassment. A teacher mixing up your name can make an entire room feel suddenly weird, especially if it happened in a public moment.`;
    } else if (isTopicShift) {
        reply = `${reaction.everyday} Nice pivot. I’m glad you brought that up. What kind of keyboard are you looking at, and what matters most to you — feel, sound, layout, or just whether it looks good on your desk?`;
    } else if (isAchievement) {
        reply = `${reaction.achievement} That is worth celebrating. Walk me through what actually went right, because that kind of win deserves more than a quick shrug.`;
    } else if (isAwkward) {
        reply = `${reaction.awkward} Oh, that is the kind of thing that can live in your head for a while. I can see why it stuck with you, and honestly the social details are what make it memorable.`;
    } else if (isConflict) {
        reply = `${reaction.conflict} That sounds like the kind of situation that keeps replaying in your head. I want the version where you tell me what actually happened, not just the feeling around it.`;
    } else if (isCasual) {
        reply = `${reaction.everyday} That’s the kind of detail that feels both ridiculous and somehow very personal. Tell me the exact version, because the tiny weirdness is usually where the story gets interesting.`;
    } else {
        reply = `${reaction.everyday} I’m with you on that. What part of it felt most frustrating or confusing, and what did you notice that made it stick in your head?`;
    }

    if (asksForHelp) {
        const actionable = {
            Analysts: "My read is to separate the story you are telling yourself from the part you can verify.",
            Diplomats: "My instinct is to protect what matters to you without pretending the uncomfortable part isn’t there.",
            Sentinels: "The practical move is to pin down what happened and pick one clear next step.",
            Explorers: "I’d stop replaying it for a second and try the smallest move that gives you new information."
        }[profile.group];
        reply += ` ${actionable} ${friendQuestions[profile.type] || friendQuestions.INFP}`;
    } else if (!isTopicShift && !isAchievement && !isAwkward && !isCorrection) {
        reply += ` ${friendQuestions[profile.type] || friendQuestions.INFP}`;
    }

    if (context.customPersonality && context.customPersonality !== "No extra personality instructions.") {
        const custom = context.customPersonality.toLowerCase();
        if (/funny|sarcastic|playful/.test(custom) && (isAwkward || isCasual)) {
            reply += " I’m trying very hard not to make the obvious joke here.";
        }
        if (/honest|direct/.test(custom) && /(conflict|ignored|argument|fight|not my friend|teacher)/i.test(lower)) {
            reply += " My honest read is that the issue is the behavior, not your overreaction to it.";
        }
        if (/curious/.test(custom) && !asksForHelp) {
            reply += " I want the part you left out, because that is usually where the real meaning is.";
        }
    }

    const historyTrim = priorAssistant.slice(-2).join(" ");
    if (historyTrim && historyTrim.includes(reply.slice(0, 40))) {
        reply = reply.replace(/\s+$/, "");
    }
    return reply;
}

function persistCompanionState(file) {
    if (!file) return;
    file.companionMessages = companionMessages.map(message => ({
        id: message.id,
        role: message.role,
        text: message.text,
        createdAt: message.createdAt
    }));
    file.updatedAt = new Date().toISOString();
    saveToLocalStorage();
    loadSidebar();
    updateEntryMetadata(file);
}

function sendCompanionMessage(event) {
    event.preventDefault();
    const input = document.getElementById("companion-input");
    const message = input?.value.trim();
    const file = files.find(item => item.id === currentFileId);
    if (!message || !file || companionBusy) return;

    const userMessage = appendCompanionMessage("user", message);
    if (!userMessage) return;
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