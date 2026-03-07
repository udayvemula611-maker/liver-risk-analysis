# 🔬 HepatoScope: Hybrid AI Clinical Decision Support System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Local_LLM-white.svg?style=flat&logo=ollama)](https://ollama.ai/)

**HepatoScope** is a multi-tiered Clinical Decision Support System (CDSS) designed to assist in the early detection, risk stratification, and patient-friendly communication of liver diseases. By bridging the gap between raw biomarker data (Liver Function Tests) and actionable clinical intelligence, it provides a comprehensive 360-degree workflow for Admins, Doctors, and Patients.

---

## 🌟 Key Features

1. **Deterministic Risk Engine**: A fully explainable, rule-based inference engine that evaluates 10+ clinical biomarkers (such as AST, ALT, Bilirubin, Albumin, ALP) and symptoms to assign clinical risk scores and levels (Low, Moderate, High, Critical) in real-time.
2. **Generative AI Medical Synthesis**: Integrated with **Ollama** natively to instantly translate dense numeric lab data and risk scores into a cohesive, plain-English patient narrative. 
3. **Role-Based Access Control (RBAC)**: Secure multi-tenant portal natively separating logic and views for:
   - **Administrators**: User/Role management and platform analytics.
   - **Doctors**: Patient tracking, risk assessment, LLM generation, and prescription attachments.
   - **Patients**: Read-only access to their personal medical reports and AI summaries.
4. **Hospital-Grade Data Isolation**: Patient data logic is strictly secured at the database kernel level using **Supabase Row-Level Security (RLS)**, completely preventing horizontal data leaks.
5. **PDF Export**: Instant conversion of medical dashboards into hospital-branded, standardized PDF reports via `html2pdf.js`.

---

## 🏗️ System Architecture

HepatoScope employs a modern, HIPAA-conscious three-tier web architecture:

*   **Presentation Tier (Frontend)**: Developed in **Next.js 14** (App Router) using React, styled with **Tailwind CSS** and **Shadcn/ui** components for a responsive and clinical aesthetic.
*   **Business Logic Tier (API)**: Next.js Serverless API routes mediate all logic. The core component, `riskEngine.ts`, runs deterministically under 10ms. A secondary route hits a local/remote instance of **Ollama** (e.g., Llama 3 or Mistral) for prompt-engineered medical synthesis.
*   **Data Persistence Tier (Backend)**: **Supabase** (PostgreSQL). Employs JWT session-based Auth managed by Next.js Middleware. All five primary tables (`users`, `patients`, `doctors`, `liver_reports`, `prescriptions`) are bound by explicit RLS policies.

### The Pipeline Flow
1. **Clinical Input**: A doctor submits Liver Function Test (LFT) values.
2. **Heuristic Engine**: `riskEngine.ts` maps biomarker values against threshold ranges to compute a risk level.
3. **LLM Synthesis**: The numbers + score are packaged into a structured prompt and fired to Ollama.
4. **Secure Delivery**: The resulting Markdown explanation is appended to the patient's record on Supabase, making the analysis instantly available on the Doctor's and Patient's dashboards.

---

## 🧪 Scientific Validation (Indian Liver Patient Dataset)

While the live production application employs a **100% Explainable Deterministic Engine**, the scoring weights corresponding to those logic branches (e.g., ALT, AST, Bilirubin, ALP) were empirically validated through an offline Machine Learning study.

Using the **Indian Liver Patient Dataset (ILPD)** from the UCI Machine Learning Repository, we trained and evaluated 5 parallel classifiers:
*   **Random Forest** *(Top Performer: 78.4% Accuracy, 0.849 AUC-ROC)*
*   **XGBoost**
*   **Support Vector Machine (SVM)**
*   **Logistic Regression**
*   **K-Nearest Neighbours (KNN)**

*Note: The ML research scripts can be found in the associated research papers or offline pipeline files. The results directly informed the feature-importance hierarchy baked into `riskEngine.ts`.*

---

## 🛠️ Tech Stack Integration

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (React) | SSR, Routing, API endpoints |
| **Language** | TypeScript | Strong typing for medical data schemas |
| **Styling** | Tailwind CSS & Shadcn/ui | Clinical UI, accessible components |
| **Database** | Supabase (PostgreSQL) | Persistence, Realtime, RLS |
| **Auth** | Supabase Auth | Role-based JWT issuance |
| **Generative AI**| Ollama (Local) | Secure, private LLM patient summaries |
| **Forms/Validation**| React Hook Form & Zod | Strict enforcement of lab value ranges |

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Supabase Project (Database & Auth enabled)
*   Ollama (Installed locally or hosted remotely)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/hepatoscope.git
cd hepatoscope
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file at the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Service role needed for Admin capabilities and backend overrides
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Set this to your Ollama deployment IP/Host if not running on localhost
OLLAMA_API_URL=http://localhost:11434/api/generate
```

### 4. Database Setup
Run the provided SQL initialization scripts (found in your setup files) in your Supabase SQL Editor to create the `users`, `patients`, `doctors`, `liver_reports`, `templates`, and `prescriptions` tables, along with all associated Triggers and RLS policies.

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*HepatoScope was developed as a hybrid Clinical Decision Support System, emphasizing the fusion of 100% explainable algorithmic safety with Generative AI communication.*
