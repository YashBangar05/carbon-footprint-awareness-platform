# 🌍 EcoTrace: Carbon Footprint Awareness Platform

Welcome to **EcoTrace**! EcoTrace is an interactive, gamified web tool designed to help you understand, track, and reduce your daily carbon footprint. 

Whether you are looking to make small lifestyle shifts or simply curious about how your daily choices impact the planet, EcoTrace makes sustainability fun, accessible, and rewarding.

---

## 🌟 What is a Carbon Footprint? (For Beginners)
Every time we travel, eat, turn on the lights, shop, or throw away trash, greenhouse gases (like Carbon Dioxide, or $CO_2$) are released into the atmosphere. This is called your **Carbon Footprint**. 

EcoTrace measures this footprint in **kilograms of $CO_2$ equivalent ($kg\ CO_2e$)**. Our target daily budget is **10.0 kg**, which represents a sustainable daily baseline. The lower your score, the better it is for our planet!

---

## 🚀 Key Features

### 1. 📝 Step-by-Step Intake Quiz
When you first open EcoTrace, you will walk through a friendly **5-step questionnaire** that assesses:
*   🚗 **Commute:** How you get to work or school (e.g., SUV, Hybrid car, Public Transit, or walking/cycling).
*   🍔 **Diet:** Your typical food choices (e.g., frequent meat consumption vs. vegetarian or vegan).
*   ⚡ **Energy:** What powers your home (standard electricity, solar panels, energy-saving thermostats).
*   🛍️ **Shopping:** How frequently you buy new clothes, gadgets, and home goods.
*   🗑️ **Waste:** How you handle garbage (throwing everything in landfills vs. recycling and composting).

At the end of the quiz, EcoTrace calculates your custom **Daily baseline carbon footprint**.

### 2. 📊 Tracker Dashboard & Charts
See your environmental impact at a glance with a clean, modern dashboard:
*   **Total Emissions Today:** A clear readout of your current daily footprint.
*   **Visual Target Bar:** Watch the bar fill up as a percentage of your daily 10.0 kg budget.
*   **Emissions Breakdown Chart:** A colorful, easy-to-read chart showing exactly which parts of your lifestyle (like transport or diet) contribute the most emissions.
*   **Eco-Leaderboard:** See how you rank against friends and other community members based on your eco-points.

### 3. 🌱 Daily Habits Checklist (Real-Time Impact!)
Ready to lower your score? EcoTrace lists easy daily activities you can complete. Every time you check a habit off, **your daily emissions score drops immediately**, and you earn **Eco Points**:
*   *Ate a plant-based lunch* 🥗 (Reduces footprint by 1.5 kg)
*   *Unplugged "vampire" electronics* 🔌 (Reduces footprint by 0.5 kg)
*   *Walked or biked instead of driving* 🚴 (Reduces footprint by 2.0 kg)
*   *Used reusable bags and bottles* 🛍️ (Reduces footprint by 0.4 kg)
*   *Took a short 5-minute shower* 🚿 (Reduces footprint by 0.8 kg)

### 4. 🔥 Streaks & Ecological Badges
*   **Daily Streaks:** Complete at least 3 green habits in a day to build a streak. The longer your streak, the higher your point multiplier!
*   **Unlockable Badges:** Earn permanent badges like **Eco Initiate** 🎓, **Herbivore** 🥗, **Vampire Slayer** 🔌, **Green Commuter** 🚴, or **Carbon Defender** 🏆.

### 5. 🌍 Community Offset Ledger
Sustainability is a group effort! Share your carbon-offsetting accomplishments on the community feed, and read about what others are doing (e.g., *"Sophia Leaf installed a 400W solar panel array!"*).

### 6. 🔮 Annual Impact Simulator
Ever wondered how much difference a small change makes over a year? Adjust our sliders to simulate:
*   Commuting green a few days a week.
*   Eating more plant-based meals.
*   Adjusting your thermostat.
The simulator will instantly show you **how many kilograms of carbon you would avoid** and **how many trees you would save** in a year!

---

## 🛠️ How to Open and Run EcoTrace (No Coding Required!)

You do not need to install complex databases or programming systems to use EcoTrace. It runs directly inside your web browser.

### Option A: Quick Open (For Everyone)
1. Download the project folder to your computer.
2. Double-click the file named **`index.html`** (this will open it in Chrome, Safari, Edge, Firefox, or any browser of your choice).
3. That's it! Start taking the quiz and tracking your footprint.

### Option B: Local Server (For Developers)
If you want to run a local development environment:
1. Make sure you have [Node.js](https://nodejs.org) installed.
2. Open your terminal/command prompt in this folder.
3. Install dependencies by typing:
   ```bash
   npm install
   ```
4. Start the local server:
   ```bash
   npm run dev
   ```

---

## 🔒 Privacy & Data Security
We respect your privacy. EcoTrace saves all your data **locally in your browser** (using a technology called `localStorage`). None of your personal answers or information are sent to external databases or stored on public servers. Your data stays entirely on your computer!

---

## ⚙️ Simple Tech Stack
If you are curious about what makes this application tick:
*   **HTML5:** The structural framework of the app.
*   **Tailwind CSS:** The engine behind the sleek dark mode, animations, and layouts.
*   **Vanilla JavaScript:** The logic engine that calculates scores, updates charts, awards badges, and handles page transitions.
*   **Chart.js:** Draws the interactive carbon footprint breakdown pie charts.
*   **Sentry:** Tracks internal errors so that developers can keep the app running smoothly.

---

*Thank you for taking a step towards protecting our planet! Let's trace, reduce, and make a difference together.* 🌿
