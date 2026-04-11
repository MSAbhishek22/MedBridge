# MedBridge AI 🏥

**Bridging the gap between messy handwriting and medical clarity.**

MedBridge is a next-generation AI platform designed to decode handwritten medical prescriptions instantly. Using Google Vision AI for high-accuracy OCR and Groq LLaMA 3.1 for medical entity extraction, it transforms confusion into a simple, multi-lingual care guide.

![MedBridge Hero](https://images.unsplash.com/photo-1576091160550-217359f488d7?q=80&w=2070&auto=format&fit=crop) *(Mockup image placeholder)*

## ✨ Features

- 👁️ **Medical OCR Vision**: Scans and digitizes even the messiest doctor's handwriting.
- 💊 **FDA Interaction Checker**: Automatically flags dangerous drug-drug interactions using live OpenFDA data.
- 🌐 **Native Translation**: Instantly translate medical instructions into Hindi, Bengali, Tamil, Telugu, and more.
- 📍 **Live Pharmacy Locator**: Find and route to the nearest open pharmacies based on your geolocation.
- 🎨 **Premium UI/UX**: Built with React, Tailwind CSS, and Framer Motion for a stunning, glassmorphic experience.

## 🚀 Tech Stack

- **Frontend**: React.js, Tailwind CSS, Framer Motion, Lucide React, Leaflet.js
- **Backend**: Flask (Python), Groq LLaMA 3.1 (LLM Inference), Google Vision API, Google Translate API
- **Data**: OpenFDA API

## 🛠️ Installation & Setup

### 1. Prerequisites
- Python 3.8+
- Node.js & npm
- API Keys for: [Google Cloud](https://console.cloud.google.com/) (Vision/Translate) and [Groq Cloud](https://console.groq.com/).

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your API keys
python app.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 🧪 Testing with Fake Prescription
We have included a `fake_prescription.png` in the root directory for you to test the platform's vision and parsing capabilities immediately.

## 🔒 Security
Your API keys are secured. This repository includes a `.gitignore` to prevent sensitive credentials from being leaked. **Never commit your `.env` file.**

## 📄 License
MIT License. Created for a better, clearer healthcare future.
