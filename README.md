# 🌍 EcoTrace: Carbon Footprint Awareness Platform

Welcome to **EcoTrace**! EcoTrace is an interactive, gamified web tool designed to help you understand, track, and reduce your daily carbon footprint. 

---

## 📌 Chosen Vertical
*   **Vertical:** Sustainability & Green Tech (Environmental Action)
*   **Target Audience:** General public / Non-technical individuals seeking to understand and lower their everyday carbon impact.

---

## ⚙️ Approach and Logic
EcoTrace uses a single-page application (SPA) architecture designed to minimize resource consumption and provide a highly interactive, responsive experience.

1.  **State Management:** Built using a custom vanilla JavaScript `StateManager` class that saves the user's progress dynamically to `localStorage`. This ensures data persistence across browser reloads without requiring a backend database, making the solution zero-maintenance and high-performance.
2.  **Modular Logic:** The application logic is separated into independent modules:
    *   **Intake Quiz:** Computes the carbon baseline.
    *   **Dashboard Visualizer:** Renders emissions statistics using Chart.js.
    *   **Habit Tracker:** Calculates real-time emissions reductions.
    *   **Impact Simulator:** Uses reactive sliders to project long-term carbon offsets.
3.  **Error Telemetry:** Integrates Sentry error-reporting to catch and display diagnostic logs gracefully to developers or users.

---

## 🚀 How the Solution Works

1.  **Baseline Generation (Intake Quiz):**
    *   The user completes a 5-step questionnaire about daily commuting, diet, home energy utility, shopping, and waste management.
    *   The app calculates an initial baseline carbon score in kilograms of $CO_2$ equivalent ($kg\ CO_2e$).
2.  **Interactive Habit tracking:**
    *   Checking daily eco-friendly actions (like taking short showers or eating plant-based) reduces the baseline score in real-time.
    *   Completing habits grants **Eco Points** adjusted by a **Streak Multiplier** (streaks increment when 3+ habits are logged daily).
3.  **Visualizations:**
    *   A responsive pie chart (powered by Chart.js) details the footprint distribution by category.
    *   A target tracking bar monitors daily emissions against the baseline.
4.  **Annual Impact Simulation:**
    *   Users can manipulate sliders (green commuting days, plant-based meals, thermostat offsets) to project annual $CO_2$ savings and equivalent trees planted.

---

## 💡 Assumptions Made
*   **Baseline Daily Budget:** Assumed a standard maximum target threshold of **10.0 kg $CO_2e$/day** for sustainable personal emissions based on global climate action guidelines.
*   **Carbon Conversion Factors:** Used global benchmark coefficients derived from EPA/Carbon Trust standards:
    *   *Commute:* Single Car Gas ($8.0$ kg), Hybrid ($3.0$ kg), Transit ($1.5$ kg), Active/Remote ($0.1$ kg).
    *   *Diet:* Heavy Meat ($7.5$ kg), Balanced ($4.0$ kg), Vegetarian ($2.5$ kg), Vegan ($1.2$ kg).
    *   *Energy:* Fossil Grid ($6.5$ kg), Smart Thermostat ($4.5$ kg), Green Tariff ($2.0$ kg), Solar ($0.5$ kg).
    *   *Shopping:* Heavy ($4.0$ kg), Average ($2.0$ kg), Minimalist ($0.8$ kg), Zero-waste ($0.2$ kg).
    *   *Waste:* Landfill ($3.0$ kg), Recycled ($1.8$ kg), Composted ($0.7$ kg), Zero Waste ($0.2$ kg).
*   **Local Storage Availability:** Assumed the host browser supports and allows HTML5 Local Storage.

---

## 🛠️ Installation and Running

### Option A: Quick Open (For Everyone)
1. Double-click the file named **`index.html`** to open the app in any web browser.

### Option B: Local Server (For Developers)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm run dev
   ```

---

## 🔒 Privacy & Data Security
EcoTrace saves all data **locally in your browser** (`localStorage`). Your choices, inputs, and points are never shared or sent to external servers, keeping your information private.
