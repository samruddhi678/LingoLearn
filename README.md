# 🌍 LingoLearn – AI-Powered Language Learning Agent

> **An intelligent, AI-powered language learning platform built with Google Gemini 2.5 Flash, React, Express, Firebase Firestore, and the Model Context Protocol (MCP).**

---

# 📖 Overview

LingoLearn is a full-stack, AI-powered language learning platform designed to provide a personalized and immersive learning experience. It combines conversational AI, intelligent translations, adaptive quizzes, vocabulary management, and cloud-based progress tracking into a single application.

Powered by **Google Gemini 2.5 Flash** and **Model Context Protocol (MCP)**, LingoLearn goes beyond traditional language learning applications by acting as an intelligent AI agent capable of reasoning, using tools, and maintaining long-term learning progress.

The platform supports learning multiple languages such as **Marathi, Spanish, Hindi**, and more through native-language instruction, contextual explanations, pronunciation guidance, and interactive practice.

---

# 🎯 Problem Statement

Learning a new language often requires switching between multiple applications for tutoring, translation, vocabulary building, quizzes, and progress tracking. Most existing platforms provide static content with little personalization and cannot remember or adapt to a learner's progress.

LingoLearn addresses these challenges by integrating AI tutoring, cloud-based persistence, adaptive assessments, and personalized learning analytics into one intelligent platform.

---

# 💡 Why AI Agents?

LingoLearn is built around an AI Agent rather than a traditional chatbot.

Instead of simply answering questions, the AI agent can reason about user requests and perform meaningful actions using external tools.

The agent is capable of:

- Explaining grammar concepts
- Translating words and sentences
- Conducting interactive conversations
- Generating personalized quizzes
- Saving vocabulary automatically
- Updating user experience points (XP)
- Tracking learning streaks
- Retrieving previous learning statistics

Using **Gemini Function Calling** and the **Model Context Protocol (MCP)**, the agent continuously updates the learner's progress while delivering personalized responses.

---

# ✨ Features

## 🤖 AI Tutor & Conversation Partner

- Personalized language tutoring
- Grammar explanations
- Context-aware translations
- Pronunciation guidance
- Interactive roleplay conversations
- Real-time grammar correction
- Natural response suggestions

## 🌐 Smart Translation Engine

- Translate words, sentences, and paragraphs
- Native-language explanations
- Phonetic pronunciation guides
- Parts of speech
- Contextual example sentences
- Bidirectional translation support

## 📚 Personalized Vocabulary Dictionary

- Save translated words instantly
- Organize vocabulary into personal collections
- Track learning progress
- Update vocabulary status (Learning, Practicing, Mastered)
- Cloud synchronization using Firebase Firestore

## 📝 AI Quiz Generator

- AI-generated multiple-choice quizzes
- Beginner, Intermediate, and Advanced difficulty levels
- Category-based quizzes
- Automatic scoring
- Experience Point (XP) rewards
- Learning progress updates

## 📊 Progress Analytics

- Experience Points (XP)
- Learning Rank
- Active Learning Streak
- Quiz Performance History
- Progress Trend Graphs
- Vocabulary Statistics

---

# 🎨 User Experience

LingoLearn follows a clean and modern interface designed for focused learning.

### Highlights

- Responsive and intuitive layout
- Dedicated learning, translation, vocabulary, quiz, and analytics panels
- Clean typography and high-contrast design
- Smooth micro-interactions
- Visual milestone indicators
- Responsive design across devices

---

# 🏗️ System Architecture

```text
                      User
                        │
                        ▼
             React 18 + Vite Frontend
                        │
                 REST / JSON API
                        │
                        ▼
          Express API Gateway (Port 3000)
                        │
        ┌───────────────┴────────────────┐
        ▼                                ▼
 Google Gemini 2.5 Flash        LingoLearn MCP Server
    (Function Calling)               (Port 3001)
                                          │
       ┌──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
 Save Vocabulary   Update XP    Quiz Logging   Streak Tracking
                                          │
                                          ▼
                              Firebase Firestore
```

---

# ⚙️ Technical Architecture

### Frontend

- React 18
- TypeScript
- Vite

### Backend

- Express.js
- Node.js
- REST API Gateway

### AI

- Google Gemini 2.5 Flash
- Function Calling

### Agent Framework

- Model Context Protocol (MCP)

### Database

- Firebase Firestore

---

# 🔄 Agent Workflow

1. User sends a request through the React interface.
2. Express API Gateway securely forwards the request to Gemini 2.5 Flash.
3. Gemini determines whether external tools are required.
4. If necessary, Gemini invokes MCP tools through Function Calling.
5. MCP executes database operations such as:
   - Save Vocabulary
   - Update XP
   - Log Quiz Results
   - Update Learning Streak
6. Firebase Firestore stores user progress.
7. Updated results are returned to the user in real time.

---

# 📂 Project Structure

```text
LingoLearn/
│
├── assets/
├── mcp-servers/
├── src/
├── server.ts
├── firebase-app-config.json
├── firestore.rules
├── package.json
├── vite.config.ts
├── tsconfig.json
├── README.md
└── .env.example
```

---

# 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Express.js, Node.js |
| AI Model | Google Gemini 2.5 Flash |
| AI Platform | Google AI Studio |
| Agent Framework | Model Context Protocol (MCP) |
| Database | Firebase Firestore |

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/samruddhi678/LingoLearn.git
```

## Install Dependencies

```bash
npm install
```

## Configure Environment Variables

Copy `.env.example` to `.env`

```env
GEMINI_API_KEY=your_api_key
FIREBASE_API_KEY=your_key
FIREBASE_PROJECT_ID=your_project
```

> **Do not commit API keys or secrets to GitHub.**

## Run the Application

```bash
npm run dev
```

---

# 📸 Screenshots

### Home Page
 <img width="1365" height="638" alt="Screenshot 2026-06-30 193631" src="https://github.com/user-attachments/assets/aa2466b0-6748-4ce8-9ac2-98decfc1826c" />

### Translation Engine
 <img width="1364" height="645" alt="Screenshot 2026-06-30 194208" src="https://github.com/user-attachments/assets/4430c0a6-424c-48b5-9631-aa9f67472d21" />

### Vocabulary Dictionary
 <img width="1365" height="632" alt="Screenshot 2026-06-30 201201" src="https://github.com/user-attachments/assets/39e80f3c-97e9-444e-92ba-2e80b0a18c11" />

### AI Quiz Generator
 <img width="1365" height="631" alt="Screenshot 2026-06-30 201223" src="https://github.com/user-attachments/assets/48e7a93c-314e-4ed8-a24a-a6e1cf0baf15" /> 

### Analytics Dashboard
 <img width="1365" height="631" alt="Screenshot 2026-06-30 201247" src="https://github.com/user-attachments/assets/d9789597-9355-4630-aabf-368f0e6f7327" />

### AI Tutor
 <img width="1365" height="630" alt="Screenshot 2026-06-30 201404" src="https://github.com/user-attachments/assets/3993e792-c32f-48a0-8284-842bd2f24877" />


---

# 🎥 Demo

The demonstration showcases:

https://ai.studio/apps/c812043d-be49-4e8c-958b-88b4223e28f1?fullscreenApplet=true

---

# 🔮 Future Enhancements

- Voice conversations
- Speech recognition
- AI pronunciation evaluation
- Offline learning mode
- Mobile application
- Personalized learning recommendations
- Multi-agent collaboration

---

# 👨‍💻 Developed For

**AI Agents: Intensive Vibe Coding Capstone Project Hackathon**

---

# 📄 License

This project was developed for educational and hackathon purposes.
