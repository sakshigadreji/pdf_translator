# 🛡️ Universal Offline PDF Translator (Privacy-Focused)

A high-performance, browser-based PDF translation tool that processes documents 100% offline. Built using Transformers.js and Meta's NLLB-200 AI model, this tool ensures your sensitive data never leaves your machine.

# Key Features

 100% Private & Offline: No external APIs, no server uploads. Translation happens entirely in the user's browser.
   No-Freeze UI:** Utilizes Web Workers to offload heavy AI model inference (600MB+), ensuring the main thread stays responsive.
  Layout Preservation:** Combines PDF.js and HTML5 Canvas to capture original layouts and overlay translated text seamlessly.
   Client-Side Generation:** Uses jsPDF for generating and downloading translated documents without any server-side processing.
   Smart Detection:** Intelligent line-spacing logic to detect paragraphs and maintain document flow.

#Tech Stack
Core:JavaScript (ES6+), HTML5, CSS3
AI Engine: [Transformers.js](https://huggingface.co/docs/transformers.js/)
Model: `Xenova/nllb-200-distilled-600M` (Meta's "No Language Left Behind")
Libraries: `PDF.js` (Text extraction & Page rendering)
`jsPDF` (PDF document creation)

---

# How it Works

The application architecture is designed for performance and reliability:

1.  Extraction Layer:`PDF.js` reads the file and extracts text while `Canvas` takes a snapshot of the page for layout integrity.
2.  Background Processing:The main thread sends data to a Web Worker.
3.  Inference Layer: The worker loads the 600MB AI model and performs line-by-line translation.
4.  Reconstruction: `jsPDF` merges the translated text back onto the original visual layout for download.

---

# Getting Started

# Prerequisites
Since this project uses ES Modules and Web Workers, it requires a local server to run (due to CORS policy).
# Project Structure

```text
├── index.html              # Modern UI & Container
├── style.css               # Responsive design & animations
├── script.js               # Main logic, PDF analysis & Worker management
├── translator-worker.js    # AI Model loading & background translation
└── README.md               # Documentation
