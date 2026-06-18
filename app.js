/**
 * EcoTrace - Carbon Footprint Awareness Platform
 * Core Single Page Application (SPA) Engine
 */

// Initialize Sentry SDK using onLoad hook to handle asynchronous CDN loading
window.sentryOnLoad = function () {
  try {
    const activeIntegrations = [];
    if (typeof Sentry.browserTracingIntegration === 'function') {
      activeIntegrations.push(Sentry.browserTracingIntegration());
    } else if (Sentry.BrowserTracing) {
      activeIntegrations.push(new Sentry.BrowserTracing());
    }

    if (typeof Sentry.replayIntegration === 'function') {
      activeIntegrations.push(Sentry.replayIntegration());
    } else if (Sentry.Replay) {
      activeIntegrations.push(new Sentry.Replay());
    }

    Sentry.init({
      dsn: "", // Disabled ingest to resolve 403 error caused by invalid CDN URL used as DSN
      integrations: activeIntegrations,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (err) {
    console.error("Sentry initialization failed:", err);
  }
};

// Bind error handlers for telemetry and mock UI diagnostics
window.addEventListener("error", function (event) {
  if (window.Sentry && typeof Sentry.captureException === 'function') {
    Sentry.captureException(event.error || new Error(event.message));
  }
  displaySentryCrashModal(event.error || new Error(event.message));
});
window.addEventListener("unhandledrejection", function (event) {
  if (window.Sentry && typeof Sentry.captureException === 'function') {
    Sentry.captureException(event.reason || new Error("Unhandled Promise Rejection"));
  }
  displaySentryCrashModal(event.reason || new Error("Unhandled Promise Rejection"));
});

// Global Constants & Environmental Coefficients (EPA Carbon Factors in kg CO₂e/day)
const CARBON_FACTORS = {
  commute: {
    car_suv: 8.0,
    car_hybrid: 3.0,
    public: 1.5,
    active: 0.1
  },
  diet: {
    heavy_meat: 7.5,
    balanced: 4.0,
    vegetarian: 2.5,
    vegan: 1.2
  },
  energy: {
    coal_gas: 6.5,
    smart_thermostat: 4.5,
    nuclear_wind: 2.0,
    solar: 0.5
  },
  shopping: {
    heavy: 4.0,
    average: 2.0,
    minimal: 0.8,
    minimalist: 0.2
  },
  waste: {
    landfill: 3.0,
    recycle: 1.8,
    compost: 0.7,
    zerowaste: 0.2
  }
};

// Default Daily Target Baseline
const BASELINE_BUDGET = 10.0; // kg CO₂e

// Actionable Habits details (reduces score in real-time)
const ActionableHabits = [
  { id: 'habit-plant', label: 'Ate a fully plant-based lunch', reduction: 1.5, points: 100, badgeId: 'badge-herbivore' },
  { id: 'habit-vampire', label: 'Unplugged vampire electronics', reduction: 0.5, points: 100, badgeId: 'badge-vampire' },
  { id: 'habit-commute', label: 'Walked or cycled instead of driving (5km)', reduction: 2.0, points: 150, badgeId: 'badge-commuter' },
  { id: 'habit-bags', label: 'Used reusable bags and bottles today', reduction: 0.4, points: 80, badgeId: null },
  { id: 'habit-shower', label: 'Took a short 5-minute shower', reduction: 0.8, points: 100, badgeId: null }
];

// Badge Milestones
const BadgesList = [
  { id: 'badge-initiate', name: 'Eco Initiate', desc: 'Completed the baseline intake quiz.', icon: '🎓', color: 'from-emerald-500/20 to-teal-500/20' },
  { id: 'badge-herbivore', name: 'Herbivore', desc: 'Ate a fully plant-based lunch.', icon: '🥗', color: 'from-green-500/20 to-emerald-500/20' },
  { id: 'badge-vampire', name: 'Vampire Slayer', desc: 'Eliminated household phantom energy draw.', icon: '🔌', color: 'from-blue-500/20 to-indigo-500/20' },
  { id: 'badge-commuter', name: 'Green Commuter', desc: 'Substituted active travel for a driving commute.', icon: '🚴', color: 'from-yellow-500/20 to-orange-500/20' },
  { id: 'badge-champion', name: 'Carbon Defender', desc: 'Reduced daily emissions below 5.0 kg CO₂e.', icon: '🏆', color: 'from-purple-500/20 to-pink-500/20' }
];

// Base Leaderboard competitors
const BaseLeaderboard = [
  { name: 'Sophia Leaf', points: 1450, rank: 1, isUser: false },
  { name: 'Ethan Eco', points: 1200, rank: 2, isUser: false },
  { name: 'Aria Green', points: 950, rank: 3, isUser: false },
  { name: 'Leo Solar', points: 800, rank: 4, isUser: false },
  { name: 'Marcus Clean', points: 600, rank: 5, isUser: false }
];

// Initial mock ledger activities
const BaseLedgerFeed = [
  { user: 'Sophia Leaf', action: 'Installed 400W solar panel array', category: 'Energy', offset: 3.5, timestamp: '10 mins ago' },
  { user: 'Aria Green', action: 'Biked to work instead of SUV', category: 'Transport', offset: 2.2, timestamp: '34 mins ago' },
  { user: 'Leo Solar', action: 'Prepped weekly batch vegan boxes', category: 'Diet', offset: 1.8, timestamp: '1 hour ago' },
  { user: 'Marcus Clean', action: 'Sorted and recycled 4kg of paper/metal', category: 'Waste', offset: 1.2, timestamp: '3 hours ago' },
  { user: 'Ethan Eco', action: 'Set home HVAC thermostat to 78°F', category: 'Energy', offset: 1.5, timestamp: '5 hours ago' }
];

// Central Reactive State Manager
class StateManager {
  constructor() {
    this.loadState();
  }

  loadState() {
    const defaultState = {
      quizCompleted: false,
      quizAnswers: { commute: '', diet: '', energy: '', shopping: '', waste: '' },
      quizBaseScore: 0.0,
      currentDailyScore: 0.0,
      ecoPoints: 0,
      streakCount: 0,
      lastStreakCheckDate: null,
      habitsCompleted: [],
      unlockedBadges: [],
      ledgerEntries: [...BaseLedgerFeed],
      leaderboard: [...BaseLeaderboard]
    };

    const stored = localStorage.getItem('ecotrace_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // Prevent silent data corruption by validating schema keys
        const requiredKeys = ['quizCompleted', 'quizAnswers', 'quizBaseScore', 'currentDailyScore', 'ecoPoints', 'streakCount', 'habitsCompleted', 'unlockedBadges'];
        const hasAllKeys = requiredKeys.every(key => key in parsed);
        
        if (!hasAllKeys) {
          throw new SyntaxError("Local Storage state is corrupted or missing schema attributes.");
        }
        
        this.state = parsed;

        // Ensure initial mock states are present if not found
        if (!this.state.ledgerEntries || this.state.ledgerEntries.length === 0) {
          this.state.ledgerEntries = [...BaseLedgerFeed];
        }
        if (!this.state.leaderboard || this.state.leaderboard.length === 0) {
          this.state.leaderboard = [...BaseLeaderboard];
        }
      } catch (e) {
        console.error("Failed to parse local storage state. Reverting to default.", e);
        this.state = defaultState;
        this.saveState(); // Overwrite corrupted state with valid default
      }
    } else {
      this.state = defaultState;
    }
  }

  saveState() {
    localStorage.setItem('ecotrace_state', JSON.stringify(this.state));
  }

  reset() {
    localStorage.removeItem('ecotrace_state');
    this.loadState();
    this.saveState();
  }
}

// Instantiate global state
const State = new StateManager();

// Global variable for Chart.js instance to handle clean updates
let emissionsChartInstance = null;

// DOMContentLoaded Entrypoint
document.addEventListener("DOMContentLoaded", () => {
  // Bind SPA Navigation routing tabs
  const navButtons = {
    'nav-quiz': 'panel-quiz',
    'nav-dashboard': 'panel-dashboard',
    'nav-insights': 'panel-insights',
    'nav-ledger': 'panel-ledger'
  };

  Object.entries(navButtons).forEach(([btnId, panelId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => {
        // Enforce quiz completion block
        if (panelId !== 'panel-quiz' && !State.state.quizCompleted) {
          alert("Please complete the initial Intake Quiz to unlock the Tracker Dashboard, Habits checklist, and Ledger!");
          navigateToPanel('panel-quiz');
          return;
        }
        navigateToPanel(panelId);
      });
    }
  });

  // Quiz Navigation Buttons
  const nextBtn = document.getElementById('quiz-btn-next');
  const prevBtn = document.getElementById('quiz-btn-prev');
  let currentStep = 1;

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < 5) {
        currentStep++;
        showStep(currentStep);
      } else {
        // Evaluate quiz inputs and submit
        submitQuiz();
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    });
  }

  // Dashboard Re-take Quiz
  const retakeQuizBtn = document.getElementById('dashboard-retake-quiz-btn');
  if (retakeQuizBtn) {
    retakeQuizBtn.addEventListener('click', () => {
      if (confirm("Are you sure you want to recalculate your baseline? Your daily scores will reset to baseline levels.")) {
        State.state.quizCompleted = false;
        State.state.habitsCompleted = [];
        State.state.currentDailyScore = 0.0;
        State.state.quizBaseScore = 0.0;
        State.saveState();
        currentStep = 1;
        showStep(1);
        updateScoreHeaders();
        navigateToPanel('panel-quiz');
      }
    });
  }

  // Ledger filter buttons
  const filterBtns = document.querySelectorAll('.ledger-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white');
        b.classList.add('bg-slate-800', 'text-slate-400', 'hover:text-white');
      });
      btn.classList.add('bg-emerald-600', 'text-white');
      btn.classList.remove('bg-slate-800', 'text-slate-400', 'hover:text-white');
      
      const filter = btn.getAttribute('data-ledger-filter');
      renderLedgerStream(filter);
    });
  });

  // Ledger Submission Form
  const ledgerForm = document.getElementById('ledger-submission-form');
  if (ledgerForm) {
    ledgerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      submitLedgerAction();
    });
  }

  // Impact Simulator Sliders
  const sliders = ['sim-commute-slider', 'sim-diet-slider', 'sim-temp-slider'];
  sliders.forEach(id => {
    const slider = document.getElementById(id);
    if (slider) {
      slider.addEventListener('input', updateSimulatorCalculations);
    }
  });

  // Developer control tools at the footer
  const clearCacheBtn = document.getElementById('btn-clear-cache');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      if (confirm("Reset application local storage cache? This clears all quiz data, points, habits, and user rankings.")) {
        State.reset();
        window.location.reload();
      }
    });
  }

  const resetWeekBtn = document.getElementById('btn-reset-week');
  if (resetWeekBtn) {
    resetWeekBtn.addEventListener('click', () => {
      // Re-initialize weekly scores
      State.state.leaderboard = [...BaseLeaderboard];
      // reset user score in leaderboard
      const userRankObj = State.state.leaderboard.find(p => p.isUser);
      if (userRankObj) {
        userRankObj.points = State.state.ecoPoints;
      }
      State.saveState();
      renderLeaderboard();
      alert("Weekly Leaderboard competitor scores have reset to base levels!");
    });
  }

  const triggerCrashBtn = document.getElementById('btn-trigger-crash');
  if (triggerCrashBtn) {
    triggerCrashBtn.addEventListener('click', () => {
      console.log("[Simulation] Instigating a reference exception to test Sentry capturing...");
      // Intentionally cause an exception by calling an undefined global function
      triggerMockSentryCrashException();
    });
  }

  // Sentry crash modal controls
  const sentryModalClose = document.getElementById('sentry-modal-close');
  if (sentryModalClose) {
    sentryModalClose.addEventListener('click', () => {
      const modal = document.getElementById('sentry-crash-modal');
      if (modal) modal.classList.add('hidden');
    });
  }

  // Initial application render check
  bootApp();
});

// Function to handle step visibility in Quiz Form
function showStep(step) {
  const steps = document.querySelectorAll('.quiz-step');
  steps.forEach(el => {
    const s = parseInt(el.getAttribute('data-step'));
    if (s === step) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Update Progress Bar UI
  const progressLine = document.getElementById('quiz-progress-line');
  if (progressLine) {
    progressLine.style.width = `${(step - 1) * 25}%`;
  }

  // Update Dots colors
  const dots = document.querySelectorAll('.step-dot');
  dots.forEach((dot, index) => {
    if (index < step) {
      dot.classList.add('bg-emerald-500', 'text-white');
      dot.classList.remove('bg-slate-800', 'text-slate-400');
    } else {
      dot.classList.remove('bg-emerald-500', 'text-white');
      dot.classList.add('bg-slate-800', 'text-slate-400');
    }
  });

  // Enable/Disable next/previous buttons
  const prevBtn = document.getElementById('quiz-btn-prev');
  const nextBtn = document.getElementById('quiz-btn-next');
  
  if (prevBtn) prevBtn.disabled = (step === 1);
  if (nextBtn) {
    if (step === 5) {
      nextBtn.textContent = 'Calculate Footprint';
      nextBtn.classList.remove('bg-emerald-600');
      nextBtn.classList.add('bg-emerald-500', 'animate-pulse');
    } else {
      nextBtn.textContent = 'Next Step';
      nextBtn.classList.add('bg-emerald-600');
      nextBtn.classList.remove('bg-emerald-500', 'animate-pulse');
    }
  }
}

// Function to load values from State and render layout
function bootApp() {
  updateScoreHeaders();
  
  if (State.state.quizCompleted) {
    navigateToPanel('panel-dashboard');
    renderHabitsChecklist();
    renderBadgesShelf();
    renderLedgerStream('all');
    updateSimulatorCalculations();
  } else {
    navigateToPanel('panel-quiz');
    showStep(1);
  }
}

// Navigate inside the SPA with style adjustments
function navigateToPanel(panelId) {
  const panels = ['panel-quiz', 'panel-dashboard', 'panel-insights', 'panel-ledger'];
  panels.forEach(p => {
    const el = document.getElementById(p);
    if (el) {
      if (p === panelId) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Sidebar link styles
  const btnMapping = {
    'panel-quiz': 'nav-quiz',
    'panel-dashboard': 'nav-dashboard',
    'panel-insights': 'nav-insights',
    'panel-ledger': 'nav-ledger'
  };

  Object.entries(btnMapping).forEach(([pId, btnId]) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (pId === panelId) {
        btn.classList.add('active');
        btn.classList.add('bg-emerald-500/10', 'text-emerald-500', 'border-l-4', 'border-emerald-500');
        btn.classList.remove('text-slate-300', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('active');
        btn.classList.remove('bg-emerald-500/10', 'text-emerald-500', 'border-l-4', 'border-emerald-500');
        btn.classList.add('text-slate-300', 'hover:bg-slate-800');
      }
    }
  });

  // Top header text updates
  const headerTitle = document.getElementById('view-title');
  if (headerTitle) {
    if (panelId === 'panel-quiz') headerTitle.textContent = "Gamified Intake Quiz";
    if (panelId === 'panel-dashboard') headerTitle.textContent = "Tracker Dashboard";
    if (panelId === 'panel-insights') headerTitle.textContent = "Insights, Habits & Badges";
    if (panelId === 'panel-ledger') headerTitle.textContent = "Community Offset Ledger";
  }

  // Trigger chart draw or update if rendering the dashboard
  if (panelId === 'panel-dashboard') {
    initChartJS();
    renderLeaderboard();
  }
}

// Calculate score based on inputs
function submitQuiz() {
  const form = document.getElementById('intake-quiz-form');
  const commuteVal = form.elements['commute'].value;
  const dietVal = form.elements['diet'].value;
  const energyVal = form.elements['energy'].value;
  const shoppingVal = form.elements['shopping'].value;
  const wasteVal = form.elements['waste'].value;

  // Calculate sum of emissions
  const c1 = CARBON_FACTORS.commute[commuteVal];
  const c2 = CARBON_FACTORS.diet[dietVal];
  const c3 = CARBON_FACTORS.energy[energyVal];
  const c4 = CARBON_FACTORS.shopping[shoppingVal];
  const c5 = CARBON_FACTORS.waste[wasteVal];

  const totalEmissions = c1 + c2 + c3 + c4 + c5;

  // Update State
  State.state.quizCompleted = true;
  State.state.quizAnswers = { commute: commuteVal, diet: dietVal, energy: energyVal, shopping: shoppingVal, waste: wasteVal };
  State.state.quizBaseScore = totalEmissions;
  State.state.currentDailyScore = totalEmissions;
  
  // Award 500 points for quiz completion if user has 0 points
  if (State.state.ecoPoints === 0) {
    State.state.ecoPoints = 500;
  }
  
  // Unlock Eco Initiate badge
  unlockBadge('badge-initiate');
  
  // Setup user in leaderboard if not already
  const userExists = State.state.leaderboard.find(p => p.isUser);
  if (!userExists) {
    State.state.leaderboard.push({
      name: 'Eco Explorer (You)',
      points: State.state.ecoPoints,
      rank: 6,
      isUser: true
    });
  } else {
    userExists.points = State.state.ecoPoints;
  }

  State.saveState();
  updateScoreHeaders();
  
  // Boot the habits panel details and redirect
  renderHabitsChecklist();
  renderBadgesShelf();
  renderLedgerStream('all');
  
  alert(`Quiz Completed! Your estimated daily footprint is ${totalEmissions.toFixed(1)} kg CO₂e. Let's start tracking your daily habits to reduce this score.`);
  
  navigateToPanel('panel-dashboard');
}

// Update carbon score displays
function updateScoreHeaders() {
  const topScore = document.getElementById('top-score-display');
  const topPoints = document.getElementById('top-points-display');
  const sidebarStreak = document.getElementById('sidebar-streak-display');

  if (State.state.quizCompleted) {
    const dailyScore = State.state.currentDailyScore.toFixed(1);
    if (topScore) topScore.textContent = `${dailyScore} kg CO₂e`;
    
    // Check if score is below champion threshold
    if (State.state.currentDailyScore <= 5.0) {
      unlockBadge('badge-champion');
    }
  } else {
    if (topScore) topScore.textContent = `-- kg CO₂e`;
  }

  if (topPoints) topPoints.textContent = `${State.state.ecoPoints} pts`;
  if (sidebarStreak) sidebarStreak.textContent = `🔥 ${State.state.streakCount} Streak`;

  // Render dashboard elements if panel is active
  updateDashboardKPIs();
}

// Update dashboard KPI cards
function updateDashboardKPIs() {
  const dashScore = document.getElementById('dash-score-display');
  const dashRating = document.getElementById('dash-score-rating');
  const dashBaselinePercent = document.getElementById('dash-baseline-percent');
  const dashBaselineBar = document.getElementById('dash-baseline-bar');
  const dashStreakCount = document.getElementById('dash-streak-count');
  const dashStreakMultiplier = document.getElementById('dash-streak-multiplier');
  const dashStreakFlame = document.getElementById('dash-streak-flame');

  if (!State.state.quizCompleted) return;

  const score = State.state.currentDailyScore;
  if (dashScore) dashScore.textContent = score.toFixed(1);

  // Score assessment message
  if (dashRating) {
    if (score < 5.0) {
      dashRating.textContent = "Excellent - Eco Defender!";
      dashRating.className = "text-xs px-2.5 py-1 rounded-lg font-semibold inline-block self-start bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse";
    } else if (score <= BASELINE_BUDGET) {
      dashRating.textContent = "Good - Below Target Baseline";
      dashRating.className = "text-xs px-2.5 py-1 rounded-lg font-semibold inline-block self-start bg-teal-500/20 text-teal-400 border border-teal-500/30";
    } else if (score <= 15.0) {
      dashRating.textContent = "Fair - Moderate Footprint";
      dashRating.className = "text-xs px-2.5 py-1 rounded-lg font-semibold inline-block self-start bg-yellow-500/20 text-yellow-500 border border-yellow-500/30";
    } else {
      dashRating.textContent = "Warning - High Emissions!";
      dashRating.className = "text-xs px-2.5 py-1 rounded-lg font-semibold inline-block self-start bg-red-500/20 text-red-400 border border-red-500/30";
    }
  }

  // Calculate percentage of baseline
  const percentage = Math.min(Math.round((score / BASELINE_BUDGET) * 100), 200);
  if (dashBaselinePercent) dashBaselinePercent.textContent = `${percentage}%`;
  
  if (dashBaselineBar) {
    dashBaselineBar.style.width = `${Math.min(percentage, 100)}%`;
    if (percentage <= 50) {
      dashBaselineBar.className = "h-full bg-emerald-400 rounded-full transition-all duration-500";
    } else if (percentage <= 100) {
      dashBaselineBar.className = "h-full bg-teal-500 rounded-full transition-all duration-500";
    } else {
      dashBaselineBar.className = "h-full bg-red-500 rounded-full transition-all duration-500";
    }
  }

  // Streak details
  if (dashStreakCount) dashStreakCount.textContent = State.state.streakCount;
  
  // Calculate dynamic multiplier
  const multiplier = 1.0 + (State.state.streakCount * 0.1);
  if (dashStreakMultiplier) dashStreakMultiplier.textContent = `${multiplier.toFixed(1)}x`;

  if (dashStreakFlame) {
    if (State.state.streakCount > 0) {
      dashStreakFlame.className = "text-3xl streak-flame-active";
    } else {
      dashStreakFlame.className = "text-3xl filter grayscale opacity-40";
    }
  }
}

// Render the checklist of actionable daily habits
function renderHabitsChecklist() {
  const container = document.getElementById('habits-checklist-container');
  if (!container) return;

  container.innerHTML = '';
  
  // Calculate dynamic multiplier
  const mult = 1.0 + (State.state.streakCount * 0.1);

  ActionableHabits.forEach(habit => {
    const isCompleted = State.state.habitsCompleted.includes(habit.id);
    const itemPoints = Math.round(habit.points * mult);

    const row = document.createElement('div');
    row.className = `flex items-center justify-between p-4 rounded-xl border transition ${isCompleted ? 'bg-emerald-950/20 border-emerald-500/35' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'}`;
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <input type="checkbox" id="${habit.id}" class="habit-checkbox h-5 w-5 rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/40 cursor-pointer" ${isCompleted ? 'checked' : ''}>
        <label for="${habit.id}" class="text-sm font-semibold cursor-pointer ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-200'}">
          ${habit.label}
        </label>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">-${habit.reduction.toFixed(1)} kg CO₂</span>
        <span class="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">+${itemPoints} pts</span>
      </div>
    `;

    // Bind change listener
    const checkbox = row.querySelector('.habit-checkbox');
    checkbox.addEventListener('change', (e) => {
      toggleHabit(habit.id, e.target.checked);
    });

    container.appendChild(row);
  });

  // Show total points earned today
  const pointsEarnedDiv = document.getElementById('habits-points-earned');
  if (pointsEarnedDiv) {
    const todayPoints = ActionableHabits.reduce((acc, h) => {
      if (State.state.habitsCompleted.includes(h.id)) {
        return acc + Math.round(h.points * mult);
      }
      return acc;
    }, 0);
    pointsEarnedDiv.textContent = `+${todayPoints} Points Today`;
  }
}

// Toggle habit complete state
function toggleHabit(habitId, isChecked) {
  const habit = ActionableHabits.find(h => h.id === habitId);
  if (!habit) return;

  const mult = 1.0 + (State.state.streakCount * 0.1);
  const adjustedPoints = Math.round(habit.points * mult);

  if (isChecked) {
    if (!State.state.habitsCompleted.includes(habitId)) {
      State.state.habitsCompleted.push(habitId);
      State.state.currentDailyScore = Math.max(0.1, State.state.currentDailyScore - habit.reduction);
      State.state.ecoPoints += adjustedPoints;
      
      // Attempt badge unlock
      if (habit.badgeId) {
        unlockBadge(habit.badgeId);
      }

      // Add to Ledger entries dynamically
      const today = new Date().toLocaleDateString(undefined, { hour: '2-digit', minute: '2-digit' });
      State.state.ledgerEntries.unshift({
        user: 'Eco Explorer (You)',
        action: habit.label,
        category: getCategoryFromHabit(habitId),
        offset: habit.reduction,
        timestamp: 'Just now'
      });
    }
  } else {
    const idx = State.state.habitsCompleted.indexOf(habitId);
    if (idx !== -1) {
      State.state.habitsCompleted.splice(idx, 1);
      State.state.currentDailyScore = Math.min(State.state.quizBaseScore, State.state.currentDailyScore + habit.reduction);
      State.state.ecoPoints = Math.max(0, State.state.ecoPoints - adjustedPoints);
      
      // Note: We do not lock a badge back immediately if unchecked, as achievements remain unlocked. 
      // Clean corresponding dynamic ledger items
      State.state.ledgerEntries = State.state.ledgerEntries.filter(entry => 
        !(entry.user === 'Eco Explorer (You)' && entry.action === habit.label)
      );
    }
  }

  // Evaluate Streak modifications
  checkStreakRules();

  // Sync state & update DOM
  State.saveState();
  updateScoreHeaders();
  renderHabitsChecklist();
  renderLedgerStream('all');
}

// Helper to assign a logical category for custom actions
function getCategoryFromHabit(habitId) {
  if (habitId === 'habit-commute') return 'Transport';
  if (habitId === 'habit-plant') return 'Diet';
  if (habitId === 'habit-vampire') return 'Energy';
  return 'Waste';
}

// Evaluate Streak rules
function checkStreakRules() {
  const habitsCount = State.state.habitsCompleted.length;
  const today = new Date().toDateString();

  if (habitsCount >= 3) {
    // If streak hasn't been updated today, increment it
    if (State.state.lastStreakCheckDate !== today) {
      State.state.streakCount++;
      State.state.lastStreakCheckDate = today;
    }
  } else {
    // If user unticked below 3 habits on the same day, reduce streak back down
    if (State.state.lastStreakCheckDate === today && State.state.streakCount > 0) {
      State.state.streakCount--;
      State.state.lastStreakCheckDate = null;
    }
  }
}

// Unlock a Badge milestone
function unlockBadge(badgeId) {
  if (!State.state.unlockedBadges.includes(badgeId)) {
    State.state.unlockedBadges.push(badgeId);
    State.saveState();
    
    // Display trigger banner
    const badge = BadgesList.find(b => b.id === badgeId);
    if (badge) {
      console.log(`%c[ACHIEVEMENT UNLOCKED] %c${badge.name}: ${badge.desc}`, "color: #10b981; font-weight: bold", "color: #f8fafc");
    }
    
    // Rerender shelf
    renderBadgesShelf();
  }
}

// Render Badge shelf cards
function renderBadgesShelf() {
  const container = document.getElementById('badges-shelf-container');
  if (!container) return;

  container.innerHTML = '';

  BadgesList.forEach(badge => {
    const isUnlocked = State.state.unlockedBadges.includes(badge.id);
    const card = document.createElement('div');
    card.className = `glass-panel p-4 rounded-xl border flex flex-col items-center text-center justify-between h-36 has-tooltip relative ${isUnlocked ? 'border-emerald-500/40 bg-gradient-to-br ' + badge.color + ' badge-glow-unlocked' : 'border-slate-800 badge-glow-locked'}`;
    
    card.innerHTML = `
      <span class="text-3xl mb-2">${badge.icon}</span>
      <h5 class="text-xs font-bold text-white truncate max-w-full">${badge.name}</h5>
      <span class="text-[9px] font-semibold tracking-wider uppercase ${isUnlocked ? 'text-emerald-400' : 'text-slate-500'} mt-1">
        ${isUnlocked ? 'Unlocked' : 'Locked'}
      </span>
      
      <!-- Hover Tooltip -->
      <div class="tooltip bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-[10px] text-slate-300 w-36 bottom-full mb-2 shadow-xl text-center">
        <p class="font-bold text-white">${badge.name}</p>
        <p class="mt-1">${badge.desc}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// Render Weekly Leaderboard rows
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  container.innerHTML = '';

  // Synchronize user points with state
  const user = State.state.leaderboard.find(p => p.isUser);
  if (user) {
    user.points = State.state.ecoPoints;
  }

  // Sort leaderboard items by score descending
  State.state.leaderboard.sort((a, b) => b.points - a.points);

  // Recalculate ranks
  State.state.leaderboard.forEach((player, idx) => {
    player.rank = idx + 1;
  });

  State.saveState();

  State.state.leaderboard.forEach(player => {
    const row = document.createElement('div');
    row.className = `flex items-center justify-between p-3.5 rounded-xl border transition ${player.isUser ? 'bg-emerald-950/20 border-emerald-500/40 animate-pulse' : 'bg-slate-900/40 border-slate-800'}`;
    
    // Assign rank badge colors
    let rankBadge = '';
    if (player.rank === 1) rankBadge = '🥇';
    else if (player.rank === 2) rankBadge = '🥈';
    else if (player.rank === 3) rankBadge = '🥉';
    else rankBadge = `<span class="text-xs font-bold font-mono text-slate-500 w-5 text-center">${player.rank}</span>`;

    row.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-6 flex items-center justify-center shrink-0">
          ${rankBadge}
        </div>
        <div class="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs ${player.isUser ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-400'}">
          ${player.name.substring(0, 2).toUpperCase()}
        </div>
        <span class="text-sm font-semibold ${player.isUser ? 'text-emerald-400' : 'text-slate-200'} truncate max-w-[120px] sm:max-w-none">
          ${player.name}
        </span>
      </div>
      <span class="text-xs font-bold text-slate-300 font-mono">
        ${player.points.toLocaleString()} pts
      </span>
    `;

    container.appendChild(row);
  });
}

// Render Community Ledger Feed Stream
function renderLedgerStream(filterCategory = 'all') {
  const container = document.getElementById('ledger-feed-container');
  const countDisplay = document.getElementById('ledger-count-display');
  const totalDisplay = document.getElementById('ledger-total-saved-display');
  if (!container) return;

  container.innerHTML = '';

  const entries = State.state.ledgerEntries;
  
  // Filter list
  const filtered = filterCategory === 'all' 
    ? entries 
    : entries.filter(e => e.category === filterCategory);

  filtered.forEach(entry => {
    const row = document.createElement('div');
    row.className = "grid grid-cols-12 items-center text-xs p-3.5 bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-xl transition px-4";
    
    let catColor = 'bg-slate-800 text-slate-400';
    if (entry.category === 'Transport') catColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (entry.category === 'Diet') catColor = 'bg-green-500/10 text-green-400 border border-green-500/20';
    if (entry.category === 'Energy') catColor = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
    if (entry.category === 'Waste') catColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';

    row.innerHTML = `
      <div class="col-span-3 font-semibold text-slate-300 truncate pr-2">${entry.user}</div>
      <div class="col-span-5 text-slate-400 truncate pr-2">${entry.action}</div>
      <div class="col-span-2">
        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${catColor}">${entry.category}</span>
      </div>
      <div class="col-span-2 text-right font-bold text-emerald-400 font-mono">-${entry.offset.toFixed(1)} kg</div>
    `;

    container.appendChild(row);
  });

  // Update footer statistics
  if (countDisplay) {
    countDisplay.textContent = `Showing ${filtered.length} offsets`;
  }

  if (totalDisplay) {
    const sum = entries.reduce((acc, curr) => acc + curr.offset, 0);
    totalDisplay.textContent = `Total Community Offset: ${sum.toFixed(1)} kg CO₂`;
  }
}

// Log Custom Ledger action
function submitLedgerAction() {
  const usernameInput = document.getElementById('ledger-username');
  const actionInput = document.getElementById('ledger-action');
  const catInput = document.getElementById('ledger-category');
  const offsetInput = document.getElementById('ledger-offset');

  if (!usernameInput || !actionInput || !catInput || !offsetInput) return;

  const username = usernameInput.value.trim();
  const action = actionInput.value.trim();
  const category = catInput.value;
  const offset = parseFloat(offsetInput.value);

  if (!username || !action || isNaN(offset) || offset <= 0) return;

  // Add item
  const newEntry = {
    user: username,
    action: action,
    category: category,
    offset: offset,
    timestamp: 'Just now'
  };

  State.state.ledgerEntries.unshift(newEntry);
  
  // Award Eco Points to user if they logged their own action
  if (username.toLowerCase().includes('you') || username.toLowerCase() === 'eco explorer') {
    State.state.ecoPoints += 100;
  } else {
    // If it's another user mock, occasionally award the active user points for auditing
    State.state.ecoPoints += 25;
  }

  State.saveState();
  updateScoreHeaders();
  renderLedgerStream('all');

  // Reset form
  actionInput.value = '';
  offsetInput.value = '';
  
  // Highlight "all" filter button
  const filterBtns = document.querySelectorAll('.ledger-filter-btn');
  filterBtns.forEach(btn => {
    if (btn.getAttribute('data-ledger-filter') === 'all') {
      btn.classList.add('bg-emerald-600', 'text-white');
    } else {
      btn.classList.remove('bg-emerald-600', 'text-white');
      btn.classList.add('bg-slate-800', 'text-slate-400');
    }
  });

  alert("Action committed to Community Ledger ledger!");
}

// Run Calculations on the Annual Impact Simulator
function updateSimulatorCalculations() {
  const commuteDays = parseInt(document.getElementById('sim-commute-slider').value);
  const dietMeals = parseInt(document.getElementById('sim-diet-slider').value);
  const tempDelta = parseInt(document.getElementById('sim-temp-slider').value);

  // Update slider label readouts
  document.getElementById('sim-commute-display').textContent = `${commuteDays} days/week`;
  document.getElementById('sim-diet-display').textContent = `${dietMeals} meals/week`;
  document.getElementById('sim-temp-display').textContent = `${tempDelta} °F offset`;

  // Savings math
  // Commute: replacing gas car (8.0kg) with clean commute (1.0kg) = 7.0kg savings per day
  const commuteWeeklySavings = commuteDays * 7.0;
  
  // Diet: replacing red meat (7.5kg) with plant-based diet (1.2kg) = 6.3kg savings per meal
  const dietWeeklySavings = dietMeals * 1.5; // estimated 1.5kg saved per meal replaced

  // Energy: lowering HVAC draw saves about 0.8kg CO2 per degree Fahrenheit offset per day
  const tempWeeklySavings = tempDelta * 0.8 * 7.0;

  const totalWeeklySaved = commuteWeeklySavings + dietWeeklySavings + tempWeeklySavings;
  const annualSaved = totalWeeklySaved * 52.14; // weeks in a year

  // EPA conversion: 1 mature tree absorbs ~22.0 kg of CO2 per year
  const treesPlanted = Math.round(annualSaved / 22.0);

  // Render values
  document.getElementById('sim-annual-saved').textContent = `${annualSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO₂e`;
  document.getElementById('sim-trees-planted').textContent = `${treesPlanted.toLocaleString()} Trees`;
}

// Initialize and redraw Chart.js visual
function initChartJS() {
  const ctx = document.getElementById('emissionsChart');
  if (!ctx) return;

  // Clean old chart reference to avoid hover-flicker bug
  if (emissionsChartInstance) {
    emissionsChartInstance.destroy();
  }

  if (!State.state.quizCompleted) return;

  // Get current state segments mapping
  const answers = State.state.quizAnswers;
  const commute = CARBON_FACTORS.commute[answers.commute] || 0.1;
  const diet = CARBON_FACTORS.diet[answers.diet] || 0.1;
  const energy = CARBON_FACTORS.energy[answers.energy] || 0.1;
  const shopping = CARBON_FACTORS.shopping[answers.shopping] || 0.1;
  const waste = CARBON_FACTORS.waste[answers.waste] || 0.1;

  // Apply reductions dynamically from checked habits
  let adjustedCommute = commute;
  let adjustedDiet = diet;
  let adjustedEnergy = energy;
  let adjustedWaste = waste;

  State.state.habitsCompleted.forEach(habitId => {
    if (habitId === 'habit-commute') adjustedCommute = Math.max(0.1, adjustedCommute - 2.0);
    if (habitId === 'habit-plant') adjustedDiet = Math.max(0.1, adjustedDiet - 1.5);
    if (habitId === 'habit-vampire') adjustedEnergy = Math.max(0.1, adjustedEnergy - 0.5);
    if (habitId === 'habit-bags') adjustedWaste = Math.max(0.1, adjustedWaste - 0.4);
    if (habitId === 'habit-shower') adjustedEnergy = Math.max(0.1, adjustedEnergy - 0.8);
  });

  const chartData = {
    labels: ['Transport', 'Diet', 'Energy', 'Shopping', 'Waste'],
    datasets: [{
      data: [adjustedCommute, adjustedDiet, adjustedEnergy, shopping, adjustedWaste],
      backgroundColor: [
        '#3b82f6', // blue-500
        '#10b981', // emerald-500
        '#f59e0b', // amber-500
        '#6366f1', // indigo-500
        '#8b5cf6'  // violet-500
      ],
      borderWidth: 2,
      borderColor: '#0f172a', // slate-900 matching layout card backgrounds
      hoverOffset: 12
    }]
  };

  emissionsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8', // slate-400
            font: {
              family: 'Outfit',
              size: 11
            },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` ${context.label}: ${context.raw.toFixed(1)} kg CO₂e`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}

// Display the simulated Sentry crash modal
function displaySentryCrashModal(error) {
  const modal = document.getElementById('sentry-crash-modal');
  const stacktrace = document.getElementById('sentry-stacktrace');

  if (modal && stacktrace) {
    stacktrace.textContent = `ReferenceError: ${error.message || error}\n  at triggerMockSentryCrashException (app.js:685:5)\n  at HTMLButtonElement.anonymous (app.js:210:7)\n  at dispatch (jquery.js:3:12450)\n  at handler (jquery.js:3:10100)`;
    modal.classList.remove('hidden');
  }
}

// Trigger error simulation
function triggerMockSentryCrashException() {
  throw new ReferenceError("simulateSentryAppCrash is not defined in the scope chain.");
}
