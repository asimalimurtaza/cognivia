# Cognivia

> AI-powered learning and teaching platform designed to make education more intelligent, personalized, and accessible.

Cognivia is a full-stack educational platform that combines traditional learning management features with **AI-powered tools** to help students learn more effectively and help teachers create and manage educational content.

The platform brings together classroom management, assignments, quizzes, notes, learning resources, and AI assistance within a single application.

---

## Overview

Traditional learning platforms often separate educational content, classroom management, assessments, and intelligent assistance across different tools.

Cognivia explores how these workflows can be brought together into a single AI-enhanced platform.

Students can use Cognivia to:

* Access classes and learning resources
* Complete assignments
* Take quizzes
* Generate AI-powered study material
* Interact with an AI chatbot
* Create and review notes
* Get personalized assistance

Teachers can use the platform to:

* Manage classes
* Create assignments
* Create quizzes
* Manage students
* Organize educational content
* Use AI to assist with content creation

The goal is to provide an educational environment where AI works alongside traditional learning workflows rather than replacing them.

---

## Core Features

### AI-Powered Learning

Cognivia integrates AI directly into the learning experience.

AI capabilities include:

* AI-generated quizzes
* AI-generated notes
* AI chatbot
* Educational content assistance
* Learning support
* Personalized study assistance

The AI layer is designed to provide useful assistance while keeping the learner in control of the learning process.

---

### AI Chatbot

Students can interact with an AI-powered chatbot to ask questions and receive explanations.

The chatbot can assist with:

* Understanding concepts
* Explaining difficult topics
* Answering questions
* Study assistance
* Learning guidance

The goal is to make educational assistance available directly inside the learning platform.

---

### AI-Generated Quizzes

Cognivia can use AI to generate quizzes based on educational content.

This reduces the amount of manual work required to create assessment material and provides students with additional opportunities to practice.

A simplified workflow:

```text
Learning Content
       │
       ▼
   AI Processing
       │
       ▼
Question Generation
       │
       ▼
Quiz
       │
       ▼
Student Assessment
```

---

### AI-Generated Notes

AI can help transform educational material into structured notes.

This can be useful for:

* Reviewing lessons
* Summarizing content
* Creating study material
* Preparing for assessments

---

## Learning Management

Cognivia combines AI functionality with conventional educational workflows.

### Classes

Teachers can create and manage classes and organize students around learning activities.

### Assignments

Teachers can create assignments while students can access and complete them through the platform.

### Quizzes

Quizzes provide structured assessment and practice.

### Notes

Students can create and manage notes as part of their learning workflow.

### Student Management

Teachers can manage students and organize their educational activities within classes.

---

## Platform Architecture

Cognivia follows a full-stack application architecture where the frontend, backend services, database, authentication, and AI functionality work together.

A simplified conceptual architecture:

```text
                         Cognivia
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
            Student UI            Teacher UI
                 │                     │
                 └──────────┬──────────┘
                            │
                            ▼
                    Application Layer
                            │
             ┌──────────────┼──────────────┐
             │              │              │
             ▼              ▼              ▼
        User / Class     Learning       AI Services
        Management       Services           │
             │              │               │
             └──────────────┼───────────────┘
                            │
                            ▼
                         Database
```

The architecture allows AI capabilities to be integrated into existing educational workflows rather than existing as an isolated service.

---

## AI Architecture

Cognivia's AI functionality is integrated into specific product workflows.

Instead of presenting AI as a standalone chatbot, the platform uses AI where it can provide direct value to learners and teachers.

Examples include:

```text
                  Educational Content
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
          Quiz Gen    Note Gen    AI Chat
             │           │           │
             └───────────┼───────────┘
                         │
                         ▼
                 Learning Experience
```

This architecture can be expanded with additional AI-powered learning features over time.

---

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Modern component-based UI architecture

### Backend

* API-based backend services
* Serverless/backend integrations where applicable

### Database

* MongoDB
* Firebase services where applicable

### AI

* Google Gemini
* LLM-powered content generation
* AI chatbot
* AI-assisted educational content creation

### Authentication & Services

* Firebase Authentication
* Application-level authentication and authorization

### Development

* TypeScript
* JavaScript
* Git
* npm

---

## Application Areas

Cognivia is organized around several major areas of functionality.

```text
Cognivia
│
├── Authentication
│
├── Student Experience
│   ├── Classes
│   ├── Assignments
│   ├── Quizzes
│   ├── Notes
│   └── AI Assistant
│
├── Teacher Experience
│   ├── Classes
│   ├── Students
│   ├── Assignments
│   ├── Quizzes
│   └── Content
│
└── AI Services
    ├── Quiz Generation
    ├── Note Generation
    └── AI Chat
```

---

## Example AI Workflow

A simplified AI-powered learning workflow:

```text
User
 │
 ▼
Learning Context
 │
 ├── Course
 ├── Lesson
 ├── Assignment
 └── Learning Material
 │
 ▼
AI Service
 │
 ▼
LLM
 │
 ▼
Structured Educational Output
 │
 ├── Quiz
 ├── Notes
 └── Explanation
 │
 ▼
Student Experience
```

The application's AI capabilities can therefore operate within the context of the user's learning activity.

---

## Design Goals

Cognivia is built around several principles.

### AI Should Be Useful

AI features should solve actual educational problems rather than exist simply because an application contains an LLM.

### Keep the Learner in Control

AI-generated material should assist students rather than replace their own learning and reasoning.

### Integrate AI Into Workflows

AI should be available where students and teachers already perform tasks.

### Keep the Platform Extensible

The architecture should allow additional AI capabilities to be introduced without rebuilding the entire application.

---

## Potential Future Features

Cognivia provides a foundation for additional intelligent learning capabilities.

Potential future improvements include:

* Personalized learning paths
* AI tutoring
* Adaptive quizzes
* Difficulty adjustment
* Learning progress analysis
* AI study plans
* Course recommendations
* Semantic search across learning material
* Retrieval-Augmented Generation
* Teacher AI assistant
* Automated assignment feedback
* Learning analytics
* Student performance insights

---

## Getting Started

### Prerequisites

Install:

* Node.js
* npm
* Git

### Clone the repository

```bash
git clone https://github.com/AsimAliMurtaza/cognivia.git

cd cognivia
```

### Install dependencies

```bash
npm install
```

### Environment Variables

Create the appropriate environment configuration for the application.

Example:

```env
GEMINI_API_KEY
GEMINI_PRIMARY_MODEL
GEMINI_FALLBACK_MODEL
UPSTASH_REDIS_REST_TOKEN
UPSTASH_REDIS_REST_URL
NEXTAUTH_URL
MONGODB_URI
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GEMINI_API_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
AGORA_PRIMARY_CERTIFICATE
AGORA_APP_ID
AGORA_APP_CERT
NEXT_PUBLIC_AGORA_APP_ID
```

Never commit API keys, credentials, or other secrets to the repository.

### Run the development server

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:3000
```

---

## Project Status

**Active Development**

Cognivia is an evolving AI-powered education platform.

The project is focused on exploring how AI can be integrated into real educational workflows while maintaining a practical full-stack application architecture.

---

## What This Project Demonstrates

Cognivia demonstrates experience with:

* Full-stack application development
* AI product integration
* LLM-powered features
* Educational application architecture
* Role-based application experiences
* Database-backed workflows
* API integration
* AI-generated content
* User-focused AI features

It represents an exploration of how AI can become part of a complete product rather than functioning as an isolated model demonstration.

---

## Author

**Asim Ali Murtaza**

## Team

**Rida Mushtaq**
**Rafiya Rehan**
**Ayesha Shafqat**

Software Engineer focused on AI engineering and full-stack development.

* GitHub: https://github.com/AsimAliMurtaza
* LinkedIn: https://www.linkedin.com/in/asimalimurtaza/
* Portfolio: https://asimalimurtaza.lovable.app/

---

## License

This project is currently under active development. Licensing and contribution guidelines may be added as the project matures.
