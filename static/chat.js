// static/js/chat.js – UPDATED WITH DOWNLOAD BUTTON FOR BOT IMAGES!
const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const queryInput = document.getElementById("query");
const imageInput = document.getElementById("image");
const micButton = document.getElementById("mic-button");
const imagePreview = document.getElementById("image-preview");
const modelSelect = document.getElementById("model-select"); // ✅ NEW: Model dropdown

const pdfInput = document.getElementById("file");
const extractedBox = document.getElementById("extracted-box");
const copyBtn = document.getElementById("copy-btn");
const summarizeBtn = document.getElementById("summarize-btn");

const audioForm = document.getElementById("audio-form");
const speakBtn = document.getElementById("speak-btn");
const urduAudio = document.getElementById("urdu-audio");

const searchInput = document.getElementById("search");
const chatSearch = document.getElementById("chat-search");

let currentChat;
let pinned = JSON.parse(localStorage.getItem("pinned") || "[]");

// ---------- Speech Recognition ----------
const recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    ? new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    : null;

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
}

// ---------- Text-to-Speech ----------
const synth = window.speechSynthesis;
let isSpeaking = false;
let selectedVoice = "male";

function loadVoices() {
    const voices = synth.getVoices();
    return selectedVoice === "male"
        ? voices.find(v => v.name.includes("Male") || v.gender === "male") || voices[0]
        : voices.find(v => v.name.includes("Female") || v.gender === "female") || voices[0];
}

// ---------- DB HELPERS ----------
async function fetchUserChats() {
    try {
        const res = await fetch("/api/chats");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.chats || [];
    } catch (e) {
        console.error("fetchUserChats error:", e);
        return [];
    }
}

async function fetchChatMessages(chatId) {
    try {
        const res = await fetch(`/api/chat/${chatId}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data.messages || [];
    } catch (e) {
        console.error("fetchChatMessages error:", e);
        return [];
    }
}

async function deleteChat(chatId) {
    if (!confirm("Delete this chat? This cannot be undone.")) return;
    try {
        const res = await fetch(`/api/delete_chat/${chatId}`, { method: "DELETE" });
        if (res.ok) {
            pinned = pinned.filter(id => id !== chatId);
            localStorage.setItem("pinned", JSON.stringify(pinned));
            await renderChatHistory();
            if (currentChat === chatId) await newChat();
        }
    } catch (e) {
        alert("Error deleting chat");
    }
}

/* -------------------------------------------------
   LOAD A PREVIOUS CHAT (clear UI first!)
   ------------------------------------------------- */
async function loadChat(chatId) {
    if (chatContainer) chatContainer.innerHTML = "";

    currentChat = chatId;
    const messages = await fetchChatMessages(chatId);

    messages.forEach(msg => {
        addMessage(msg.text, msg.sender, msg.image, msg.file_name, false);
    });

    await fetch(`/load_chat/${chatId}`, { method: "POST" });
    sessionStorage.setItem("lastActiveChat", chatId);
    await renderChatHistory();
}

/* -------------------------------------------------
   SAVE ONE MESSAGE TO MONGO (via Flask)
   ------------------------------------------------- */
async function saveChatMessage(sender, text, image = null, fileName = null) {
    if (!currentChat) return;
    try {
        await fetch("/api/save_message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: currentChat,
                sender,
                text,
                image,
                file_name: fileName
            })
        });
    } catch (e) {
        console.error("saveChatMessage error:", e);
    }
}

/* -------------------------------------------------
   RENDER CHAT-HISTORY SIDEBAR - FIXED PIN/UNPIN
   ------------------------------------------------- */
async function renderChatHistory() {
    const chatHistoryDiv = document.getElementById("chat-history");
    const pinnedDiv = document.getElementById("pinned-history");
    if (!chatHistoryDiv || !pinnedDiv) return;

    chatHistoryDiv.innerHTML = '<div class="loading">Loading chats...</div>';
    pinnedDiv.innerHTML = "";

    const chats = await fetchUserChats();
    chatHistoryDiv.innerHTML = "";
    pinnedDiv.innerHTML = "";

    const pinnedChats = chats.filter(chat => isChatPinned(chat.chat_id));
    const regularChats = chats.filter(chat => !isChatPinned(chat.chat_id));

    pinnedChats.forEach(chat => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.padding = "8px";
        wrapper.style.borderBottom = "1px solid var(--border-color)";

        const btn = document.createElement("button");
        const chatId = chat.chat_id.split('_').pop() || chat.chat_id;
        btn.innerHTML = `<div style="text-align:left;flex:1;"><span class="chat-id">ID: ${chatId}</span></div>`;
        btn.className = "load-btn";
        if (chat.chat_id === currentChat) btn.classList.add("active");
        btn.onclick = () => loadChat(chat.chat_id);
        btn.style.width = "100%";
        btn.style.textAlign = "left";
        btn.style.padding = "10px";
        btn.style.border = "none";
        btn.style.background = "none";

        const pinBtn = document.createElement("button");
        pinBtn.innerHTML = '<i class="fa-solid fa-thumbtack" style="color: #ffd700;"></i>';
        pinBtn.classList.add("pin-btn");
        pinBtn.style.marginLeft = "5px";
        pinBtn.style.background = "none";
        pinBtn.style.border = "none";
        pinBtn.style.color = "var(--text-color)";
        pinBtn.style.cursor = "pointer";
        pinBtn.title = "Unpin chat";
        pinBtn.onclick = (e) => { e.stopPropagation(); togglePin(chat.chat_id, true); };

        const delBtn = document.createElement("button");
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.classList.add("delete-btn");
        delBtn.style.marginLeft = "5px";
        delBtn.style.background = "none";
        delBtn.style.border = "none";
        delBtn.style.color = "var(--text-color)";
        delBtn.style.cursor = "pointer";
        delBtn.title = "Delete chat";
        delBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.chat_id); };

        wrapper.appendChild(btn);
        wrapper.appendChild(pinBtn);
        wrapper.appendChild(delBtn);
        pinnedDiv.appendChild(wrapper);
    });

    regularChats.forEach(chat => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.padding = "8px";
        wrapper.style.borderBottom = "1px solid var(--border-color)";

        const btn = document.createElement("button");
        const chatId = chat.chat_id.split('_').pop() || chat.chat_id;
        btn.innerHTML = `<div style="text-align:left;flex:1;"><span class="chat-id">ID: ${chatId}</span></div>`;
        btn.className = "load-btn";
        if (chat.chat_id === currentChat) btn.classList.add("active");
        btn.onclick = () => loadChat(chat.chat_id);
        btn.style.width = "100%";
        btn.style.textAlign = "left";
        btn.style.padding = "10px";
        btn.style.border = "none";
        btn.style.background = "none";

        const pinBtn = document.createElement("button");
        pinBtn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        pinBtn.classList.add("pin-btn");
        pinBtn.style.marginLeft = "5px";
        pinBtn.style.background = "none";
        pinBtn.style.border = "none";
        pinBtn.style.color = "var(--text-color)";
        pinBtn.style.cursor = "pointer";
        pinBtn.title = "Pin chat";
        pinBtn.onclick = (e) => { e.stopPropagation(); togglePin(chat.chat_id, false); };

        const delBtn = document.createElement("button");
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.classList.add("delete-btn");
        delBtn.style.marginLeft = "5px";
        delBtn.style.background = "none";
        delBtn.style.border = "none";
        delBtn.style.color = "var(--text-color)";
        delBtn.style.cursor = "pointer";
        delBtn.title = "Delete chat";
        delBtn.onclick = (e) => { e.stopPropagation(); deleteChat(chat.chat_id); };

        wrapper.appendChild(btn);
        wrapper.appendChild(pinBtn);
        wrapper.appendChild(delBtn);
        chatHistoryDiv.appendChild(wrapper);
    });

    if (pinnedChats.length === 0) {
        pinnedDiv.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-style: italic; text-align: center;">No pinned chats yet</div>';
    }

    if (regularChats.length === 0 && pinnedChats.length === 0) {
        chatHistoryDiv.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-style: italic; text-align: center;">No chat history yet</div>';
    }

    filterHistory();
}

/* -------------------------------------------------
   NEW CHAT – CALL SERVER TO CREATE A FRESH SESSION
   ------------------------------------------------- */
async function newChat() {
    try {
        const res = await fetch("/api/new_chat", { method: "POST" });
        const data = await res.json();
        if (!data.success) throw new Error("Failed to create new chat");

        currentChat = data.chat_id;
        if (chatContainer) chatContainer.innerHTML = "";
        addMessage("New chat started.", "system", null, null, false);

        sessionStorage.setItem("lastActiveChat", currentChat);
        await renderChatHistory();
    } catch (e) {
        console.error("newChat error:", e);
        currentChat = `chat_${Date.now()}`;
        if (chatContainer) chatContainer.innerHTML = "";
        sessionStorage.setItem("lastActiveChat", currentChat);
        await renderChatHistory();
    }
}

/* -------------------------------------------------
   MESSAGE BUBBLE HELPERS - 🔥 UPDATED WITH DOWNLOAD BUTTON!
   ------------------------------------------------- */
function addMessage(text, sender, imageBase64 = null, fileName = null, save = true) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);

    let html = '';

    if (imageBase64 && sender === "user") {
        html += `
            <img src="data:image/jpeg;base64,${imageBase64}" 
                 style="max-width: 300px; border-radius: 8px; margin-bottom: 8px; display: block;">
        `;
    }
    
    if (imageBase64 && sender === "bot") {
        html += `
            <img src="data:image/jpeg;base64,${imageBase64}" 
                 style="max-width: 300px; border-radius: 8px; margin-bottom: 8px; display: block;">
            <a href="data:image/jpeg;base64,${imageBase64}" download="generated_image.jpg" class="download-btn">
                <i class="fa-solid fa-download"></i> Download
            </a>
        `;
    }
    
    if (fileName && !imageBase64) {
        html += `<span style="color: var(--text-muted);">📎 ${fileName}</span><br>`;
    }
    
    if (text) {
        html += `<span style="line-height: 1.5;">${text}</span>`;
    }

    bubble.innerHTML = html;

    if (sender === "bot" && text) {
        const btns = document.createElement("div");
        btns.className = "button-container";

        const copyBtn = document.createElement("button");
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyBtn.className = "action-btn copy-btn";
        copyBtn.onclick = () => navigator.clipboard.writeText(text).then(() => alert("Copied!"));
        btns.appendChild(copyBtn);

        const speakBtn = document.createElement("button");
        speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        speakBtn.className = "speak-again-btn";
        speakBtn.onclick = () => synth && speakText(text);
        btns.appendChild(speakBtn);

        const stopBtn = document.createElement("button");
        stopBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        stopBtn.className = "stop-btn";
        stopBtn.onclick = () => { if (synth && isSpeaking) { synth.cancel(); isSpeaking = false; } };
        btns.appendChild(stopBtn);

        const voiceToggle = document.createElement("button");
        voiceToggle.textContent = selectedVoice === "male" ? "♂" : "♀";
        voiceToggle.onclick = () => { selectedVoice = selectedVoice === "male" ? "female" : "male"; voiceToggle.textContent = selectedVoice === "male" ? "♂" : "♀"; };
        btns.appendChild(voiceToggle);

        bubble.appendChild(btns);
    }

    if (chatContainer) {
        chatContainer.appendChild(bubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    if (save) saveChatMessage(sender, text, imageBase64, fileName);
    return bubble;
}

function typeMessage(text, sender, save = false) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);
    if (chatContainer) chatContainer.appendChild(bubble);

    let i = 0;
    const interval = setInterval(() => {
        bubble.innerHTML = `<span>${text.slice(0, i++)}</span>`;
        if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        if (i > text.length) {
            clearInterval(interval);
            if (sender === "bot" && text && synth) speakText(text);
            if (sender === "bot" && text) {
                const btns = document.createElement("div");
                btns.className = "button-container";

                const copyBtn = document.createElement("button");
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                copyBtn.className = "action-btn copy-btn";
                copyBtn.onclick = () => navigator.clipboard.writeText(text).then(() => alert("Copied!"));
                btns.appendChild(copyBtn);

                const speakBtn = document.createElement("button");
                speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
                speakBtn.className = "speak-again-btn";
                speakBtn.onclick = () => synth && speakText(text);
                btns.appendChild(speakBtn);

                const stopBtn = document.createElement("button");
                stopBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
                stopBtn.className = "stop-btn";
                stopBtn.onclick = () => { if (synth && isSpeaking) { synth.cancel(); isSpeaking = false; } };
                btns.appendChild(stopBtn);

                const voiceToggle = document.createElement("button");
                voiceToggle.textContent = selectedVoice === "male" ? "♂" : "♀";
                voiceToggle.onclick = () => { selectedVoice = selectedVoice === "male" ? "female" : "male"; voiceToggle.textContent = selectedVoice === "male" ? "♂" : "♀"; };
                btns.appendChild(voiceToggle);

                bubble.appendChild(btns);
            }
            if (save) saveChatMessage(sender, text);
        }
    }, 12);
}

/* -------------------------------------------------
   TEXT-TO-SPEECH (English)
   ------------------------------------------------- */
function speakText(text) {
    if (isSpeaking || !synth) return;
    isSpeaking = true;
    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = loadVoices();
    utter.lang = "en-US";
    utter.onend = () => (isSpeaking = false);
    synth.speak(utter);
}

/* -------------------------------------------------
   URDU TTS (via your /speak_urdu endpoint)
   ------------------------------------------------- */
  /* -------------------------------------------------
   URDU TTS (via your /speak_urdu endpoint) – FIXED: SPEAKS LATEST MESSAGE
   ------------------------------------------------- */
/* -------------------------------------------------
   URDU TTS – 100% WORKING WITH DEBUG + ERROR HANDLING
   ------------------------------------------------- */
   async function speakUrdu(text) {
    const speakBtn = document.getElementById("speak-btn");
    const urduAudio = document.getElementById("urdu-audio");
    if (!speakBtn || !urduAudio || !text.trim()) return;

    speakBtn.disabled = true;
    speakBtn.innerHTML = 'Generating...';

    try {
        const formData = new FormData();
        formData.append("text", text);

        console.log("Sending to /speak_urdu:", text); // DEBUG: See what is sent

        // THIS IS THE ONLY LINE YOU NEEDED TO KEEP
        const response = await fetch("/speak_urdu", {
            method: "POST",
            body: formData
        });

        // Check HTTP errors (404, 500, etc.)
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server responded with error:", response.status, errorText);
            throw new Error(`Server error: ${response.status}`);
        }

        // Parse JSON safely
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error("Failed to parse JSON from server:", jsonError);
            throw new Error("Invalid response format");
        }

        // Check backend error
        if (data.error) {
            console.error("Backend TTS Error:", data.error);
            throw new Error(data.error);
        }

        // Must have audio
        if (!data.audio_base64) {
            console.error("No audio_base64 in response:", data);
            throw new Error("Audio not generated");
        }

        // Play audio
        const audioSrc = `data:${data.mime_type || 'audio/mpeg'};base64,${data.audio_base64}`;
        urduAudio.src = audioSrc;
        console.log("Audio ready. Playing...");

        await urduAudio.play();

        speakBtn.innerHTML = 'Playing...';

        // Reset button when done
        urduAudio.onended = () => {
            speakBtn.innerHTML = 'اردو میں بولو!';
            speakBtn.disabled = false;
        };

        // Handle playback error
        urduAudio.onerror = () => {
            console.error("Audio playback failed");
            alert("Audio failed to play. Check internet or console.");
            speakBtn.innerHTML = 'اردو میں بولو!';
            speakBtn.disabled = false;
        };

    } catch (error) {
        console.error("Urdu TTS Failed:", error);
        alert(`Urdu speech failed: ${error.message}`);
        speakBtn.innerHTML = 'اردو میں بولو!';
        speakBtn.disabled = false;
    }
}
/* -------------------------------------------------
   UI HELPERS
   ------------------------------------------------- */
function showSpeakButton() {
    if (speakBtn) speakBtn.style.display = "block";
}
function showUploadedFile(file, type) {
    const fileName = file.name;
    let url = null;
    if (type === "image" && imagePreview) {
        url = URL.createObjectURL(file);
        imagePreview.innerHTML = `<img src="${url}" style="max-width:100px;border-radius:8px;margin-top:8px;">`;
    } else if (fileName) {
        addMessage(null, "user", null, fileName, false);
    }
}
function clearImagePreview() {
    if (imagePreview) imagePreview.innerHTML = "";
}
function hideSidebar() {
    const rs = document.querySelector(".right-sidebar");
    rs && rs.classList.remove("active");
    extractedBox && (extractedBox.innerText = "");
    copyBtn && (copyBtn.style.display = "none");
    summarizeBtn && (summarizeBtn.style.display = "none");
}

/* -------------------------------------------------
   MICROPHONE (Speech-to-Text)
   ------------------------------------------------- */
let isRecording = false;
if (micButton && recognition) {
    micButton.addEventListener("click", () => {
        if (isRecording) {
            recognition.stop();
            micButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            micButton.style.background = "var(--button-bg)";
        } else {
            recognition.start();
            micButton.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
            micButton.style.background = "var(--button-hover-bg)";
            queryInput.value = "";
            queryInput.placeholder = "Listening...";
        }
        isRecording = !isRecording;
    });

    recognition.onresult = e => {
        const transcript = Array.from(e.results)
            .map(r => r[0].transcript)
            .join("");
        queryInput.value = transcript;
    };

    recognition.onend = () => {
        if (isRecording) {
            isRecording = false;
            micButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            micButton.style.background = "var(--button-bg)";
            queryInput.placeholder = "Type your message...";
            if (queryInput.value.trim()) chatForm.dispatchEvent(new Event("submit"));
        }
    };

    recognition.onerror = e => {
        console.error("SpeechRecognition error:", e.error);
        queryInput.placeholder = "Type your message...";
        isRecording = false;
        micButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        micButton.style.background = "var(--button-bg)";
        alert("Speech recognition error: " + e.error);
    };
} else if (micButton) {
    micButton.style.display = "none";
}

/* -------------------------------------------------
   IMAGE INPUT
   ------------------------------------------------- */
if (imageInput) {
    imageInput.addEventListener("change", () => {
        const f = imageInput.files[0];
        f ? showUploadedFile(f, "image") : clearImagePreview();
    });
}

/* -------------------------------------------------
   SEND MESSAGE (text or image) - ✅ FIXED WITH IMAGE_BASE64!
   ------------------------------------------------- */
if (chatForm) {
    chatForm.addEventListener("submit", async e => {
        e.preventDefault();
        const query = queryInput.value.trim();
        const imgFile = imageInput.files[0];
        if (!query && !imgFile) return;

        if (query) addMessage(query, "user", null, null, false);
        else if (imgFile) addMessage("Image uploaded", "user", null, imgFile.name, false);

        queryInput.value = "";
        imageInput.value = "";
        clearImagePreview();

        const loading = document.createElement("div");
        loading.className = "bubble bot loading";
        loading.innerHTML = '<div class="spinner"></div>';
        chatContainer.appendChild(loading);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        let data;
        
        const model = modelSelect ? modelSelect.value : "gemini";
        if (imgFile) {
            const fd = new FormData();
            fd.append("query", query || "What is this?");
            fd.append("image", imgFile);
            const r = await fetch("/ask_with_image", { method: "POST", body: fd });
            data = await r.json();
            loading.remove();
            addMessage(query || "What is this?", "user", data.image_base64, imgFile.name, false);
            typeMessage(data.answer || "Error", "bot", false);
        } else if (model === "cloudflare") {
            const r = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, model })
            });
            data = await r.json();
            loading.remove();
            const botReply = data.answer || "Error";
            addMessage(botReply, "bot", data.image_base64, null, false);

            // UPDATE URDU SPEAK BUTTON
            const speakBtn = document.getElementById("speak-btn");
            if (speakBtn && botReply.trim()) {
                speakBtn.style.display = "block";
                speakBtn.onclick = () => speakUrdu(botReply);
                speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> اردو میں بولو!';
            }
        } else {
            const r = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, model })
            });
            data = await r.json();
            loading.remove();
            const botReply = data.answer || "Error";
            typeMessage(botReply, "bot", false);

// UPDATE URDU SPEAK BUTTON WITH LATEST BOT REPLY
const speakBtn = document.getElementById("speak-btn");
if (speakBtn && botReply && botReply.trim()) {
    speakBtn.style.display = "block";
    speakBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> اردو میں بولو!';
    
    // REMOVE OLD LISTENER FIRST
    speakBtn.onclick = null;
    
    // ADD NEW ONE
    speakBtn.onclick = () => {
        console.log("Urdu Speak Button Clicked! Text:", botReply);
        speakUrdu(botReply);
    };
}
        }
    });
}

/* -------------------------------------------------
   PDF UPLOAD & SUMMARIZE - ✅ UPDATED WITH MODEL SUPPORT
   ------------------------------------------------- */
if (pdfInput) {
    pdfInput.addEventListener("change", async e => {
        const f = e.target.files[0];
        if (!f) return;
        showUploadedFile(f, "pdf");
        document.querySelector(".right-sidebar").classList.add("active");
        const fd = new FormData();
        fd.append("pdf", f);
        try {
            const r = await fetch("/upload_pdf", { method: "POST", body: fd });
            const d = await r.json();
            extractedBox.innerText = d.text || d.error || "No response";
            copyBtn.style.display = "inline-block";
            summarizeBtn.style.display = "inline-block";
            setTimeout(hideSidebar, 30_000);
        } catch (err) {
            console.error(err);
            extractedBox.innerText = "Error uploading PDF";
        }
    });
}

if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async () => {
        summarizeBtn.disabled = true;
        summarizeBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Summarizing...';
        try {
            const model = modelSelect ? modelSelect.value : "gemini";
            const r = await fetch("/summarize_pdf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model })
            });
            const d = await r.json();
            if (d.summary) {
                addMessage("Summarize my PDF", "user", null, null, false);
                typeMessage(d.summary, "bot", false);
                setTimeout(hideSidebar, 30_000);
            } else {
                alert(d.error || "Summarize failed");
            }
        } catch (err) {
            console.error(err);
            alert("Summarize error");
        }
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = "Summarize";
    });
}

/* -------------------------------------------------
   AUDIO UPLOAD & PROCESS
   ------------------------------------------------- */
if (audioForm) {
    audioForm.addEventListener("submit", async e => {
        e.preventDefault();
        const file = document.getElementById("audio")?.files[0];
        const lang = document.getElementById("lang")?.value || "en";
        if (!file) return;
        showUploadedFile(file, "audio");
        const fd = new FormData();
        fd.append("audio", file);
        fd.append("lang", lang);
        try {
            const r = await fetch("/upload_audio", { method: "POST", body: fd });
            const d = await r.json();
            if (d.error) {
                addMessage("Error: " + d.error, "bot", null, null, false);
            } else {
                addMessage("[Audio transcript] " + (d.transcript || ""), "user", null, null, false);
                typeMessage(d.summary || "", "bot", false);
                showSpeakButton();
            }
        } catch (err) {
            console.error(err);
            addMessage("Audio upload error", "bot", null, null, false);
        }
    });
}

/* -------------------------------------------------
   COPY EXTRACTED TEXT
   ------------------------------------------------- */
if (copyBtn) {
    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(extractedBox.innerText);
        alert("Copied!");
        setTimeout(hideSidebar, 30_000);
    });
}

/* -------------------------------------------------
   CLOSE SIDEBAR
   ------------------------------------------------- */
document.querySelector(".close-sidebar")?.addEventListener("click", hideSidebar);

/* -------------------------------------------------
   SEARCH / FILTER
   ------------------------------------------------- */
function filterHistory() {
    const term = searchInput.value.toLowerCase();
    document.querySelectorAll(".chat-history > div, .pinned-history > div").forEach(w => {
        const btn = w.querySelector(".load-btn");
        if (btn && btn.textContent.toLowerCase().includes(term)) {
            w.style.display = "flex";
        } else {
            w.style.display = "none";
        }
    });
}
searchInput.addEventListener("input", filterHistory);

if (chatSearch) {
    chatSearch.addEventListener("input", e => {
        const term = e.target.value.toLowerCase();
        document.querySelectorAll(".bubble").forEach(b => {
            const txt = b.querySelector("span")?.innerText.toLowerCase() || "";
            b.classList.toggle("highlighted", term && txt.includes(term));
        });
    });
}

/* -------------------------------------------------
   NEW-CHAT BUTTON (now points to the fixed function)
   ------------------------------------------------- */
document.getElementById("new-chat")?.addEventListener("click", newChat);

/* -------------------------------------------------
   CLEAR-ALL HISTORY
   ------------------------------------------------- */
document.getElementById("clear-all")?.addEventListener("click", async () => {
    if (!confirm("Clear all chat history?")) return;
    try {
        const chats = await fetchUserChats();
        for (const c of chats) {
            await fetch(`/api/delete_chat/${c.chat_id}`, { method: "DELETE" });
        }
        pinned = [];
        localStorage.setItem("pinned", "[]");
        await renderChatHistory();
        await newChat();
    } catch (e) {
        alert("Error clearing history");
    }
});

/* -------------------------------------------------
   THEME / MODE TOGGLE
   ------------------------------------------------- */
document.getElementById("mode-toggle")?.addEventListener("click", () => {
    const path = window.location.pathname;
    if (path === "/chat") window.location.href = "/light";
    else if (path === "/light") window.location.href = "/chat";
});

/* -------------------------------------------------
   SIDEBAR TOGGLES (hamburger icons)
   ------------------------------------------------- */
const leftSidebar = document.querySelector(".left-sidebar");
const rightSidebar = document.querySelector(".right-sidebar");
document.getElementById("left-toggle")?.addEventListener("click", () => leftSidebar.classList.toggle("collapsed"));
document.getElementById("right-toggle")?.addEventListener("click", () => rightSidebar.classList.toggle("active"));

/* -------------------------------------------------
   RESPONSIVE COLLAPSE
   ------------------------------------------------- */
window.addEventListener("resize", () => {
    if (window.innerWidth < 768) {
        leftSidebar.classList.add("collapsed");
        rightSidebar.classList.remove("active");
    } else {
        leftSidebar.classList.remove("collapsed");
    }
});
if (window.innerWidth < 768) {
    leftSidebar.classList.add("collapsed");
    rightSidebar.classList.remove("active");
}

/* -------------------------------------------------
   INITIAL LOAD
   ------------------------------------------------- */
async function initializeChat() {
    await renderChatHistory();
    const last = sessionStorage.getItem("lastActiveChat");
    if (last) await loadChat(last);
    else await newChat();
}

/* -------------------------------------------------
   DOM READY – theme, file-label animation, scroll-observer
   ------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    await initializeChat();

    const saved = localStorage.getItem("theme");
    if (saved) document.body.setAttribute("data-theme", saved);
    document.getElementById("mode-toggle")?.addEventListener("click", () => {
        const cur = document.body.getAttribute("data-theme") || "dark";
        const nxt = cur === "dark" ? "light" : "dark";
        document.body.setAttribute("data-theme", nxt);
        localStorage.setItem("theme", nxt);
    });

    document.querySelectorAll('input[type="file"]').forEach(inp => {
        inp.addEventListener("change", e => {
            const name = e.target.files[0]?.name;
            if (!name) return;
            const lbl = document.querySelector(`label[for="${e.target.id}"]`);
            if (lbl) {
                const orig = lbl.innerHTML;
                lbl.innerHTML = `<i class="fa-solid fa-check"></i> ${name}`;
                setTimeout(() => (lbl.innerHTML = orig), 3000);
            }
        });
    });
});

// ---------- PINNING HELPERS ----------
function togglePin(chatId, isPinned) {
    if (isPinned) {
        pinned = pinned.filter(id => id !== chatId);
    } else {
        if (!pinned.includes(chatId)) {
            pinned.push(chatId);
            if (pinned.length > 10) pinned = pinned.slice(-10);
        }
    }
    localStorage.setItem("pinned", JSON.stringify(pinned));
    renderChatHistory();
}

function isChatPinned(chatId) {
    return pinned.includes(chatId);
}


