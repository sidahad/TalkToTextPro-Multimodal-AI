const chatContainer = document.getElementById("chat-container");
const chatForm = document.getElementById("chat-form");
const queryInput = document.getElementById("query");
const imageInput = document.getElementById("image");
const micButton = document.getElementById("mic-button");
const imagePreview = document.getElementById("image-preview");

const pdfInput = document.getElementById("file");
const extractedBox = document.getElementById("extracted-box");
const copyBtn = document.getElementById("copy-btn");
const summarizeBtn = document.getElementById("summarize-btn");

const audioForm = document.getElementById("audio-form");

const searchInput = document.getElementById("search");
const chatSearch = document.getElementById("chat-search");

let currentChat = "chat_" + Date.now();
let pinned = JSON.parse(localStorage.getItem("pinned") || "[]");

const recognition = window.SpeechRecognition || window.webkitSpeechRecognition ?
    new (window.SpeechRecognition || window.webkitSpeechRecognition)() : null;

if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
}

const synth = window.speechSynthesis;
let isSpeaking = false;
let selectedVoice = 'male';

function loadVoices() {
    const voices = synth.getVoices();
    return selectedVoice === 'male' ? voices.find(v => v.name.includes('Male') || v.gender === 'male') || voices[0] : voices.find(v => v.name.includes('Female') || v.gender === 'female') || voices[0];
}

let isRecording = false;

function addMessage(text, sender, imageUrl = null, fileName = null) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);
    if (imageUrl && sender === "user") {
        const img = document.createElement("img");
        img.src = imageUrl;
        img.style.maxWidth = "200px";
        img.style.borderRadius = "8px";
        bubble.appendChild(img);
    }
    if (fileName) {
        const fileSpan = document.createElement("span");
        fileSpan.innerHTML = `Uploaded: ${fileName}<br>`;
        bubble.appendChild(fileSpan);
    }
    if (text) {
        const textSpan = document.createElement("span");
        textSpan.innerHTML = text;
        bubble.appendChild(textSpan);
    }
    if (sender === "bot" && text) {
        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("button-container");

        const copyButton = document.createElement("button");
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyButton.classList.add("action-btn", "copy-btn"); // multiple classes

        copyButton.onclick = () => {
            navigator.clipboard.writeText(text).then(() => alert("Copied!"));
        };
        buttonContainer.appendChild(copyButton);

        const speakAgainButton = document.createElement("button");
        speakAgainButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        speakAgainButton.classList.add("speak-again-btn");

        speakAgainButton.onclick = () => {
            if (synth) speakText(text);
        };
        buttonContainer.appendChild(speakAgainButton);

       const stopButton = document.createElement("button");

// Font Awesome stop icon
stopButton.innerHTML = '<i class="fa-solid fa-stop"></i>';

stopButton.classList.add("stop-btn");

        stopButton.className = "stop-btn";
        stopButton.onclick = () => {
            if (synth && isSpeaking) {
                synth.cancel();
                isSpeaking = false;
            }
        };
        buttonContainer.appendChild(stopButton);

        const voiceToggle = document.createElement("button");
        voiceToggle.textContent = selectedVoice === 'male' ? "♂" : "♀";
        voiceToggle.onclick = () => {
            selectedVoice = selectedVoice === 'male' ? 'female' : 'male';
            voiceToggle.textContent = selectedVoice === 'male' ? "♂" : "♀";
        };
        buttonContainer.appendChild(voiceToggle);

        bubble.appendChild(buttonContainer);
    }
    if (chatContainer) {
        chatContainer.appendChild(bubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    saveChatLocal(currentChat, sender, text, imageUrl, fileName);
}

function typeMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble", sender);
    if (chatContainer) {
        chatContainer.appendChild(bubble);
    }
    let i = 0;
    const interval = setInterval(() => {
        bubble.textContent = text.slice(0, i++);
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        if (i > text.length) {
            clearInterval(interval);
            if (sender === "bot" && text && synth) {
                speakText(text);
            }
            if (sender === "bot" && text) {
                const buttonContainer = document.createElement("div");
                buttonContainer.classList.add("button-container");

                    const copyButton = document.createElement("button");
        copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyButton.classList.add("action-btn", "copy-btn");
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
                };
                buttonContainer.appendChild(copyButton);

               const speakAgainButton = document.createElement("button");
        speakAgainButton.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        speakAgainButton.classList.add("speak-again-btn");
                speakAgainButton.onclick = () => {
                    if (synth) speakText(text);
                };
                buttonContainer.appendChild(speakAgainButton);

               const stopButton = document.createElement("button");

// Font Awesome stop icon
stopButton.innerHTML = '<i class="fa-solid fa-stop"></i>';

stopButton.classList.add("stop-btn");
                stopButton.onclick = () => {
                    if (synth && isSpeaking) {
                        synth.cancel();
                        isSpeaking = false;
                    }
                };
                buttonContainer.appendChild(stopButton);

                const voiceToggle = document.createElement("button");
                voiceToggle.textContent = selectedVoice === 'male' ? "♂" : "♀";
                voiceToggle.onclick = () => {
                    selectedVoice = selectedVoice === 'male' ? 'female' : 'male';
                    voiceToggle.textContent = selectedVoice === 'male' ? "♂" : "♀";
                };
                buttonContainer.appendChild(voiceToggle);

                bubble.appendChild(buttonContainer);
            }
            saveChatLocal(currentChat, sender, text);
        }
    }, 12);
}

function speakText(text) {
    if (isSpeaking || !synth) return;
    isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = loadVoices();
    utterance.lang = 'en-US';
    utterance.onend = () => {
        isSpeaking = false;
    };
    synth.speak(utterance);
}

function showUploadedFile(file, type) {
    const fileName = file.name;
    let imageUrl = null;
    if (type === "image" && imagePreview) {
        imageUrl = URL.createObjectURL(file);
        imagePreview.innerHTML = `<img src="${imageUrl}" style="max-width: 100px; border-radius: 8px; margin-top: 8px;">`;
    } else if (fileName) {
        addMessage(null, "user", null, fileName);
    }
}

function clearImagePreview() {
    if (imagePreview) {
        imagePreview.innerHTML = "";
    }
}

function hideSidebar() {
    const rightSidebar = document.querySelector('.right-sidebar');
    rightSidebar.classList.remove('active');
    if (extractedBox) extractedBox.innerText = "";
    if (copyBtn) copyBtn.style.display = "none";
    if (summarizeBtn) summarizeBtn.style.display = "none";
}

if (micButton && recognition) {
    micButton.addEventListener("click", () => {
        if (isRecording) {
            recognition.stop();
            micButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            micButton.style.background = 'var(--button-bg)';
        } else {
            recognition.start();
            micButton.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
            micButton.style.background = 'var(--button-hover-bg)';
            queryInput.value = '';
            queryInput.placeholder = 'Listening...';
        }
        isRecording = !isRecording;
    });

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
        queryInput.value = transcript;
    };

    recognition.onend = () => {
        if (isRecording) {
            isRecording = false;
            micButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
            micButton.style.background = 'var(--button-bg)';
            queryInput.placeholder = 'Type your message...';
            if (queryInput.value.trim()) {
                chatForm.dispatchEvent(new Event('submit'));
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        queryInput.placeholder = 'Type your message...';
        isRecording = false;
        micButton.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        micButton.style.background = 'var(--button-bg)';
        alert('Speech recognition error: ' + event.error);
    };
} else {
    if (micButton) micButton.style.display = 'none';
}

if (imageInput) {
    imageInput.addEventListener("change", () => {
        const imageFile = imageInput.files[0];
        if (imageFile) {
            showUploadedFile(imageFile, "image");
        } else {
            clearImagePreview();
        }
    });
}

if (chatForm) {
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = queryInput.value.trim();
        const imageFile = imageInput.files[0];
        if (!query && !imageFile) return;
        if (imageFile && query) {
            const imageUrl = URL.createObjectURL(imageFile);
            addMessage(query, "user", imageUrl, imageFile.name);
        } else if (query) {
            addMessage(query, "user");
        } else if (imageFile) {
            addMessage("Image uploaded", "user", URL.createObjectURL(imageFile), imageFile.name);
        }
        queryInput.value = "";
        imageInput.value = "";
        clearImagePreview();

        const loadingBubble = document.createElement("div");
        loadingBubble.classList.add("bubble", "bot", "loading");
        loadingBubble.innerHTML = '<div class="spinner"></div>';
        if (chatContainer) {
            chatContainer.appendChild(loadingBubble);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        let data;
        if (imageFile) {
            const fd = new FormData();
            fd.append("query", query || "Image uploaded");
            fd.append("image", imageFile);
            const res = await fetch("/ask_with_image", { method: "POST", body: fd });
            data = await res.json();
        } else if (query) {
            const res = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });
            data = await res.json();
        }

        loadingBubble.remove();
        typeMessage(data.answer || "Error", "bot");
    });
}

if (pdfInput) {
    pdfInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showUploadedFile(file, "pdf");
        const rightSidebar = document.querySelector('.right-sidebar');
        rightSidebar.classList.add('active');
        const fd = new FormData();
        fd.append("pdf", file);
        try {
            const res = await fetch("/upload_pdf", { method: "POST", body: fd });
            const data = await res.json();
            extractedBox.innerText = data.text || data.error || "No response";
            copyBtn.style.display = "inline-block";
            summarizeBtn.style.display = "inline-block";
            setTimeout(hideSidebar, 30000);
        } catch (error) {
            console.error('PDF upload error:', error);
            extractedBox.innerText = "Error uploading PDF";
        }
    });
}

if (summarizeBtn) {
    summarizeBtn.addEventListener("click", async () => {
        summarizeBtn.disabled = true;
        try {
            const res = await fetch("/summarize_pdf", { method: "POST" });
            const data = await res.json();
            if (data.summary) {
                addMessage("Summarize my PDF", "user");
                typeMessage(data.summary, "bot");
                setTimeout(hideSidebar, 30000);
            } else {
                alert(data.error || "Error summarizing PDF");
            }
        } catch (error) {
            console.error('PDF summarize error:', error);
            alert("Error summarizing PDF");
        }
        summarizeBtn.disabled = false;
    });
}

if (audioForm) {
    audioForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const file = document.getElementById("audio")?.files[0];
        const lang = document.getElementById("lang")?.value || "en";
        if (!file) {
            console.error('No audio file selected');
            return;
        }
        showUploadedFile(file, "audio");
        const fd = new FormData();
        fd.append("audio", file);
        fd.append("lang", lang);
        try {
            const res = await fetch("/upload_audio", { method: "POST", body: fd });
            const data = await res.json();
            if (data.error) {
                addMessage("Error: " + data.error, "bot");
            } else {
                addMessage("[Audio transcript] " + (data.transcript || ""), "user");
                typeMessage(data.summary || "", "bot");
            }
        } catch (error) {
            console.error('Audio upload error:', error);
            addMessage("Error uploading audio", "bot");
        }
    });
}

if (copyBtn) {
    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(extractedBox.innerText);
        alert("Copied!");
        setTimeout(hideSidebar, 30000);
    });
}

const closeSidebarBtn = document.querySelector('.close-sidebar');
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', hideSidebar);
}

function saveChatLocal(chatId, sender, text, image = null, fileName = null) {
    let chats = JSON.parse(localStorage.getItem("chats") || "{}");
    if (!chats[chatId]) chats[chatId] = [];
    chats[chatId].push({ sender, text, image, fileName });
    localStorage.setItem("chats", JSON.stringify(chats));
    renderChatHistory();
}

function loadChat(chatId) {
    if (chatContainer) {
        chatContainer.innerHTML = "";
    }
    currentChat = chatId;
    let chats = JSON.parse(localStorage.getItem("chats") || "{}");
    (chats[chatId] || []).forEach(m => addMessage(m.text, m.sender, m.image, m.fileName));
}

function deleteChat(chatId) {
    let chats = JSON.parse(localStorage.getItem("chats") || "{}");
    delete chats[chatId];
    localStorage.setItem("chats", JSON.stringify(chats));
    let pinnedList = JSON.parse(localStorage.getItem("pinned") || "[]");
    pinnedList = pinnedList.filter(id => id !== chatId);
    localStorage.setItem("pinned", JSON.stringify(pinnedList));
    renderChatHistory();
    if (currentChat === chatId) {
        currentChat = "chat_" + Date.now();
        if (chatContainer) {
            chatContainer.innerHTML = "";
        }
        saveChatLocal(currentChat, "system", "New chat started.");
    }
}

function renderChatHistory() {
    const chatHistoryDiv = document.getElementById("chat-history");
    const pinnedDiv = document.getElementById("pinned-history");
    chatHistoryDiv.innerHTML = "";
    pinnedDiv.innerHTML = "";
    let chats = JSON.parse(localStorage.getItem("chats") || "{}");
    let pinned = JSON.parse(localStorage.getItem("pinned") || "[]");

    Object.keys(chats).forEach(id => {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        const btn = document.createElement("button");
        btn.textContent = id;
        btn.className = "load-btn";
        btn.onclick = () => loadChat(id);
        const pinBtn = document.createElement("button");
        pinBtn.innerHTML = pinned.includes(id)
            ? '<i class="fa-solid fa-thumbtack"></i>'
            : '<i class="fa-regular fa-bookmark"></i>';
        pinBtn.classList.add("pin-btn");
        pinBtn.style.marginLeft = "5px";
        pinBtn.style.padding = "8px";
        pinBtn.onclick = (e) => { e.stopPropagation(); togglePin(id); };
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';

        deleteBtn.classList.add("delete-btn");
        deleteBtn.style.marginLeft = "5px";
        deleteBtn.style.padding = "8px";
        deleteBtn.onclick = (e) => { e.stopPropagation(); if (confirm("Delete this chat?")) deleteChat(id); };

        wrapper.appendChild(btn);
        wrapper.appendChild(pinBtn);
        wrapper.appendChild(deleteBtn);

        if (pinned.includes(id)) pinnedDiv.appendChild(wrapper); else chatHistoryDiv.appendChild(wrapper);
    });
    filterHistory();
}

function togglePin(id) {
    let pinned = JSON.parse(localStorage.getItem("pinned") || "[]");
    if (pinned.includes(id)) pinned = pinned.filter(x => x !== id); else pinned.push(id);
    localStorage.setItem("pinned", JSON.stringify(pinned));
    renderChatHistory();
}

document.getElementById("new-chat").addEventListener("click", () => {
    currentChat = "chat_" + Date.now();
    if (chatContainer) {
        chatContainer.innerHTML = "";
    }
    saveChatLocal(currentChat, "system", "New chat started.");
});

document.getElementById("clear-all").addEventListener("click", () => {
    if (confirm("Clear all chat history?")) {
        localStorage.removeItem("chats");
        localStorage.removeItem("pinned");
        renderChatHistory();
        currentChat = "chat_" + Date.now();
        if (chatContainer) {
            chatContainer.innerHTML = "";
        }
        saveChatLocal(currentChat, "system", "New chat started.");
    }
});

function filterHistory() {
    const term = searchInput.value.toLowerCase();
    const wrappers = document.querySelectorAll('.chat-history > div');
    wrappers.forEach(wrapper => {
        const btn = wrapper.querySelector('.load-btn');
        if (btn.textContent.toLowerCase().includes(term)) {
            wrapper.style.display = 'flex';
        } else {
            wrapper.style.display = 'none';
        }
    });
}
searchInput.addEventListener('input', filterHistory);

if (chatSearch) {
    chatSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const bubbles = document.querySelectorAll('.bubble');
        bubbles.forEach(bubble => {
            const textSpan = bubble.querySelector('span');
            const text = textSpan ? textSpan.innerText.toLowerCase() : '';
            if (term && text.includes(term)) {
                bubble.classList.add('highlighted');
            } else {
                bubble.classList.remove('highlighted');
            }
        });
    });
}

document.getElementById('mode-toggle').addEventListener('click', () => {
    const currentPath = window.location.pathname;
    if (currentPath === '/chat') {
        window.location.href = '/light';
    } else if (currentPath === '/light') {
        window.location.href = '/chat';
    }
});

const leftSidebar = document.querySelector('.left-sidebar');
const rightSidebar = document.querySelector('.right-sidebar');
const leftHamburger = document.getElementById('left-toggle');
const rightHamburger = document.getElementById("right-toggle");

if (leftHamburger) {
    leftHamburger.onclick = () => leftSidebar.classList.toggle('collapsed');
}

if (rightHamburger) {
    rightHamburger.onclick = () => rightSidebar.classList.toggle('active');
}

renderChatHistory();

window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        leftSidebar.classList.add('collapsed');
        rightSidebar.classList.remove('active');
    } else {
        leftSidebar.classList.remove('collapsed');
    }
});
if (window.innerWidth < 768) {
    leftSidebar.classList.add('collapsed');
    rightSidebar.classList.remove('active');
}


















// Enhanced UI functionality for TechWiz Chatbot

// Theme switching with persistence
document.addEventListener('DOMContentLoaded', function () {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }

    // Enhanced theme toggle
    const themeToggle = document.getElementById('mode-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeButton(newTheme);
        });
    }

    function updateThemeButton(theme) {
        const themeToggle = document.getElementById('mode-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
        }
    }

    // Enhanced file upload preview
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function (e) {
            const fileName = e.target.files[0]?.name;
            if (fileName) {
                const label = document.querySelector(`label[for="${e.target.id}"]`);
                if (label) {
                    const originalText = label.innerHTML;
                    label.innerHTML = `<i class="fa-solid fa-check"></i> ${fileName}`;

                    // Reset after 3 seconds
                    setTimeout(() => {
                        label.innerHTML = originalText;
                    }, 3000);
                }
            }
        });
    });

    // Smooth scrolling for chat container
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Auto-scroll to bottom when new messages are added
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes.length) {
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            });
        });

        observer.observe(chatContainer, { childList: true });
    }

    // Enhanced microphone button with visual feedback
    const micButton = document.getElementById('mic-button');
    if (micButton && recognition) {
        micButton.addEventListener('click', function () {
            this.classList.toggle('recording');
        });
    }

    // Tooltip functionality
    const buttons = document.querySelectorAll('button, .upload-btn');
    buttons.forEach(button => {
        const title = button.getAttribute('title');
        if (title) {
            button.addEventListener('mouseenter', function (e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = title;
                tooltip.style.position = 'absolute';
                tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = 'white';
                tooltip.style.padding = '5px 10px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '12px';
                tooltip.style.zIndex = '1000';
                tooltip.style.top = (e.clientY - 30) + 'px';
                tooltip.style.left = (e.clientX + 10) + 'px';

                document.body.appendChild(tooltip);

                button.addEventListener('mouseleave', function () {
                    document.body.removeChild(tooltip);
                });
            });
        }
    });
});

// Enhanced message sending with animation
const originalAddMessage = addMessage;
window.addMessage = function (text, sender, imageUrl = null, fileName = null) {
    const bubble = originalAddMessage(text, sender, imageUrl, fileName);
    if (bubble) {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(20px)';

        setTimeout(() => {
            bubble.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateY(0)';
        }, 10);
    }
    return bubble;
};

// Enhanced typing animation
const originalTypeMessage = typeMessage;
window.typeMessage = function (text, sender) {
    const bubble = originalTypeMessage(text, sender);
    if (bubble) {
        bubble.style.opacity = '0';
        bubble.style.transform = 'translateY(20px)';

        setTimeout(() => {
            bubble.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            bubble.style.opacity = '1';
            bubble.style.transform = 'translateY(0)';
        }, 10);
    }
    return bubble;
};