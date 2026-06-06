# TalkToTextPro - Enterprise Multi-LLM Multimodal AI Assistant

TalkToTextPro is a feature-rich, production-grade AI platform built with Python that unifies text, vision, speech processing, and document intelligence into a single ecosystem. Powered by a flexible multi-LLM architecture, users can switch between world-class models seamlessly in real-time. It features a high-performance MongoDB data persistence layer supporting advanced session control, content indexing, and text-to-speech feedback mechanisms.

---

## Core Features

### Multi-LLM Routing & Hot Swapping
* **Model Orchestration:** Dynamic runtime switching between Google Gemini, Groq, Cloudflare Workers AI, and other custom LLM endpoints.
* **Optimized Inference:** Configured to handle specialized models for latency-critical text generation, deep reasoning, and high-fidelity vision tasks.

### Multimodal Core Interactions
* **Text & Vision Prompts:** Input descriptive text alongside complex imagery for real-time contextual analysis and data extraction.
* **Dual Output Engine:** Automatically streams back rich markdown text responses while simultaneously preparing audio streams for speech output.
* **AI Image Generation:** Embedded text-to-image capabilities to generate digital assets from structural text descriptions.

### Document & Audio Intelligence
* **PDF Core Insights:** Processes dense PDF documents to extract structural layouts, tables, and raw text for targeted semantic summaries.
* **Long-Form Audio Translation:** Industrial pipeline built using Pydub and FFmpeg capable of processing up to 30 minutes of continuous audio.
* **Meeting Intelligence Extraction:** Automatically translates foreign language meeting logs and separates executive action items, timelines, and key points.

### Advanced History & Chat Management Panel
* **Smart Session Controls:** Full-featured workspace sidebar allowing users to pin critical chats for quick access, unpin when completed, or delete records entirely.
* **Global & Local Search:** Built-in semantic indices allowing users to filter past chat titles or search specific keywords inside a live active conversation.
* **Utterance Controls:** Includes localized utilities inside the interface to instant-copy markdown text blocks or trigger the "Speak Again" playback routine for specific chatbot messages.

---

## Tech Stack & Core Libraries

* **Language & Runtime:** Python 3.10+
* **Models Supported:** Google Gemini API, Groq Cloud API, Cloudflare Workers AI
* **Audio & Speech Engine:** Pydub, FFmpeg, gTTS, Playsound
* **Database & Persistence:** MongoDB (PyMongo / Motor Ecosystem)
* **Document Parsing:** PyPDF2 / PDFPlumber

---

## Installation and Setup

### 1. Prerequisites
Ensure you have **FFmpeg** installed and configured correctly on your environment system variables path.

### 2. Clone the Repository
```bash
git clone [https://github.com/sidahad/TalkToTextPro-Multimodal-AI.git](https://github.com/sidahad/TalkToTextPro-Multimodal-AI.git)
cd TalkToTextPro-Multimodal-AI
