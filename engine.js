const APP_VERSION = "7.0.0";

let curriculumData = null;
let TOTAL_DAYS = 45;
let currentTopics = [];
let scrollObserver = null;
let completedDays = JSON.parse(localStorage.getItem('systems_completed') || '[]');

// UI State: Mode and Theme Separated
const THEMES = ['futuristic', 'classic', 'hacker'];
const MODES = ['dark', 'light'];
const LAYOUTS = ['standard', 'focus', 'compact'];

let currentThemeIdx = THEMES.indexOf(localStorage.getItem('sys_theme') || 'futuristic');
let currentModeIdx = MODES.indexOf(localStorage.getItem('sys_mode') || 'dark');
let currentLayoutIdx = LAYOUTS.indexOf(localStorage.getItem('sys_layout') || 'standard');
let cssAnimationsEnabled = JSON.parse(localStorage.getItem('sys_anim') || 'true');

if (currentThemeIdx === -1) currentThemeIdx = 0;
if (currentModeIdx === -1) currentModeIdx = 0;
if (currentLayoutIdx === -1) currentLayoutIdx = 0;

// Offline SVGs
const ICONS = {
    'menu': '<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>',
    'chevron-left': '<polyline points="15 18 9 12 15 6"></polyline>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"></polyline>',
    'chevron-up': '<polyline points="18 15 12 9 6 15"></polyline>',
    'moon': '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
    'sun': '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
    'file': '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline>',
    'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
    'settings': '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
};

function getIcon(name) { return `<svg class="icon" viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`; }

function injectDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .module-title { display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; }
        .mod-toggle-icon { display: flex; align-items: center; opacity: 0.6; transition: opacity 0.2s; }
        .module-title:hover .mod-toggle-icon { opacity: 1; }
        .module-items { transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out; overflow: hidden; }
        .module-items.collapsed { display: none; }
        .day-footer { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-light); margin-bottom: 2rem; }
        .day-nav-buttons { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .day-nav-buttons button { padding: 0.75rem 1.5rem; background: var(--bg-hover); border: 1px solid var(--border-light); color: var(--text-primary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-mono); font-size: 0.9rem; transition: all 0.2s; }
        .day-nav-buttons button:hover:not(:disabled) { border-color: var(--accent); background: var(--bg-card); }
        .day-nav-buttons button.completed { background: rgba(16, 185, 129, 0.1); border-color: var(--success-border); color: var(--success-border); }
        .day-nav-buttons button:disabled { opacity: 0.3; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
}

async function initLMS() {
    if (window.innerWidth < 768) {
        document.body.classList.add('sidebar-collapsed');
    }

    applyPreferences();
    injectSettingsUI();
    injectDynamicStyles();

    const target = document.getElementById('render-target');
    
    // Fetch external curriculum.json
    try {
        const res = await fetch(`curriculum.json?v=${APP_VERSION}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        curriculumData = await res.json();
        TOTAL_DAYS = curriculumData.total_days || 45;
    } catch (e) {
        console.error("Payload Pipeline Error:", e);
        target.innerHTML = `<div class="hero-section">
            <h2 style="color:var(--danger-border)">System Fault</h2>
            <p style="font-family:var(--font-mono); color:var(--text-secondary);">Failed to parse curriculum.json. Ensure you are running this via a local server (e.g., Live Server or python -m http.server).</p>
        </div>`;
        return;
    }

    buildSidebar();
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = getIcon(el.getAttribute('data-icon')); });
    updateProgressUI();
    renderLandingPage();
}

function buildSidebar() {
    const nav = document.getElementById('nav-container');
    if (!nav) return;
    nav.innerHTML = ''; 

    curriculumData.modules.forEach((mod) => {
        const group = document.createElement('div');
        group.className = 'module-group';
        
        // Collapsible Title
        const titleDiv = document.createElement('div');
        titleDiv.className = 'module-title';
        titleDiv.innerHTML = `<span>${mod.module || mod.title}</span> <span class="mod-toggle-icon">${getIcon('chevron-up')}</span>`;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'module-items'; // default expanded
        
        // Toggle Logic
        titleDiv.onclick = () => {
            itemsContainer.classList.toggle('collapsed');
            const iconSpan = titleDiv.querySelector('.mod-toggle-icon');
            if (itemsContainer.classList.contains('collapsed')) {
                iconSpan.innerHTML = getIcon('chevron-down');
            } else {
                iconSpan.innerHTML = getIcon('chevron-up');
            }
        };

        mod.days.forEach(day => {
            const item = document.createElement('a');
            item.className = `nav-item ${completedDays.includes(day.day) ? 'completed' : ''}`;
            item.id = `nav-day-${day.day}`;
            item.innerHTML = `<span>Day ${day.day} — ${day.title}</span> ${getIcon('check-circle')}`;
            item.onclick = () => {
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                loadDay(day.day);
                if (window.innerWidth < 768) document.body.classList.add('sidebar-collapsed');
            };
            itemsContainer.appendChild(item);
        });
        
        group.appendChild(titleDiv);
        group.appendChild(itemsContainer);
        nav.appendChild(group);
    });
}

window.toggleCompletion = function(dayNumber) {
    const idx = completedDays.indexOf(dayNumber);
    if (idx === -1) {
        completedDays.push(dayNumber); // Mark as complete
    } else {
        completedDays.splice(idx, 1); // Unmark
    }
    localStorage.setItem('systems_completed', JSON.stringify(completedDays));
    
    // Update sidebar UI
    const navItem = document.getElementById(`nav-day-${dayNumber}`);
    if (navItem) {
        if (idx === -1) navItem.classList.add('completed');
        else navItem.classList.remove('completed');
    }
    
    // Update active button UI
    const btn = document.getElementById('mark-complete-btn');
    if (btn) {
        const isCompleted = idx === -1;
        btn.className = isCompleted ? 'completed' : '';
        btn.innerHTML = isCompleted ? 'Completed ' + getIcon('check-circle') : 'Mark as Complete';
    }
    
    updateProgressUI();
};

// ============================================================================
// Settings, Theme & Layout Engine
// ============================================================================
function injectSettingsUI() {
    const topBar = document.querySelector('.top-bar');
    if (topBar) {
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'icon-btn';
        settingsBtn.innerHTML = `${getIcon('settings')} <span class="hide-mobile">Preferences</span>`;
        settingsBtn.onclick = toggleSettingsPanel;
        topBar.appendChild(settingsBtn);
    }

    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.className = 'settings-overlay';
    panel.innerHTML = `
        <div class="settings-modal">
            <h3>System Preferences</h3>
            <div class="pref-group">
                <label>UI Theme</label>
                <button onclick="cycleTheme()" id="btn-theme" class="pref-btn">${THEMES[currentThemeIdx].toUpperCase()}</button>
            </div>
            <div class="pref-group">
                <label>Reading Layout</label>
                <button onclick="cycleLayout()" id="btn-layout" class="pref-btn">${LAYOUTS[currentLayoutIdx].toUpperCase()}</button>
            </div>
            <div class="pref-group">
                <label>CSS Animations</label>
                <button onclick="toggleAnimations()" id="btn-anim" class="pref-btn">${cssAnimationsEnabled ? 'ENABLED' : 'DISABLED'}</button>
            </div>
            <button class="pref-close" onclick="toggleSettingsPanel()">Save & Close</button>
        </div>
    `;
    document.body.appendChild(panel);
}

function toggleSettingsPanel() { document.getElementById('settings-panel').classList.toggle('active'); }
function cycleTheme() { currentThemeIdx = (currentThemeIdx + 1) % THEMES.length; applyPreferences(); }
function cycleLayout() { currentLayoutIdx = (currentLayoutIdx + 1) % LAYOUTS.length; applyPreferences(); }
function toggleAnimations() { cssAnimationsEnabled = !cssAnimationsEnabled; applyPreferences(); }

window.toggleMode = function () {
    currentModeIdx = (currentModeIdx + 1) % MODES.length;
    applyPreferences();
};

function applyPreferences() {
    const theme = THEMES[currentThemeIdx];
    const mode = MODES[currentModeIdx];
    const layout = LAYOUTS[currentLayoutIdx];

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    document.documentElement.setAttribute('data-layout', layout);

    if (cssAnimationsEnabled) document.documentElement.classList.remove('disable-animations');
    else document.documentElement.classList.add('disable-animations');

    localStorage.setItem('sys_theme', theme);
    localStorage.setItem('sys_mode', mode);
    localStorage.setItem('sys_layout', layout);
    localStorage.setItem('sys_anim', cssAnimationsEnabled);

    const btnTheme = document.getElementById('btn-theme');
    const btnLayout = document.getElementById('btn-layout');
    const btnAnim = document.getElementById('btn-anim');

    if (btnTheme) btnTheme.innerText = theme.toUpperCase();
    if (btnLayout) btnLayout.innerText = layout.toUpperCase();
    if (btnAnim) btnAnim.innerText = cssAnimationsEnabled ? 'ENABLED' : 'DISABLED';

    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (icon) icon.innerHTML = getIcon(mode === 'dark' ? 'sun' : 'moon');
    if (text) text.innerText = mode === 'dark' ? 'Light Mode' : 'Dark Mode';

    if (layout === 'focus' && window.innerWidth >= 768) document.body.classList.add('sidebar-collapsed');
    else if (window.innerWidth >= 768) document.body.classList.remove('sidebar-collapsed');
}

function toggleSidebar() { document.body.classList.toggle('sidebar-collapsed'); }

function updateProgressUI() {
    const pct = Math.round((completedDays.length / TOTAL_DAYS) * 100);
    document.getElementById('progress-bar').style.width = `${pct}%`;
    document.getElementById('progress-val').innerText = `${pct}%`;
}

window.renderLandingPage = function() {
    const target = document.getElementById('render-target');
    const stepper = document.getElementById('stepper-mount');
    if (stepper) stepper.innerHTML = ''; // Clear top stepper on landing page

    // 1. Build the Hero Section
    let html = `
        <div class="hero-section animate-in" style="text-align:center; margin-top:5vh;">
            <div class="hero-badge">> ROOT ACCESS GRANTED</div>
            <h1>Ultimate Systems & Embedded Expert</h1>
            <p>Initiating compilation sequence. Select a module below to begin.</p>
        </div>
        <div class="curriculum-grid animate-in" style="animation-delay: 0.1s;">
    `;

    // Fail-safe if data hasn't loaded
    if (!curriculumData || !curriculumData.modules) {
        target.innerHTML = html + `</div>`;
        return;
    }

    // 2. Loop through the Curriculum and build the Cards
    curriculumData.modules.forEach(mod => {
        // Check if every day in this module is completed
        const allDaysCompleted = mod.days.every(d => completedDays.includes(d.day));
        const cardClass = allDaysCompleted ? 'curriculum-card completed' : 'curriculum-card';
        
        let daysHtml = '';
        mod.days.forEach(day => {
            const isCompleted = completedDays.includes(day.day);
            const liClass = isCompleted ? 'completed' : '';
            const icon = isCompleted ? getIcon('check-circle') : getIcon('file');
            
            // Truncate long titles for the dashboard view
            const shortTitle = day.title.split(',')[0]; 
            
            daysHtml += `
                <li class="${liClass}" onclick="loadDay(${day.day})">
                    <span>Day ${day.day}: ${shortTitle}</span>
                    <span style="display:flex; align-items:center; opacity: ${isCompleted ? '1' : '0.4'};">${icon}</span>
                </li>
            `;
        });

        html += `
            <div class="${cardClass}">
                <h3>
                    <span>${mod.module || mod.title}</span> 
                    ${allDaysCompleted ? `<span style="color:var(--success-border);">${getIcon('check-circle')}</span>` : ''}
                </h3>
                <ul>${daysHtml}</ul>
            </div>
        `;
    });

    html += `</div>`;
    target.innerHTML = html;
    
    // 3. Clean up sidebar UI state (remove active highlights)
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (window.innerWidth < 768) document.body.classList.remove('sidebar-collapsed');
};

async function loadDay(dayNumber) {
    const target = document.getElementById('render-target');
    const stepperMount = document.getElementById('stepper-mount');
    target.innerHTML = `<div class="init-loader"><div class="spinner"></div><p>Fetching Day ${dayNumber} specs...</p></div>`;
    stepperMount.innerHTML = '';

    try {
        const res = await fetch(`data/day${dayNumber}.json?v=${APP_VERSION}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();

        currentTopics = data.topics.map(t => buildTopicNode(t));
        renderContinuousTopics(data.topics, target, stepperMount);

        // --- Build Footer Navigation ---
        let flatDays = [];
        curriculumData.modules.forEach(m => m.days.forEach(d => flatDays.push(d.day)));
        const currentIndex = flatDays.indexOf(dayNumber);
        const prevDay = currentIndex > 0 ? flatDays[currentIndex - 1] : null;
        const nextDay = currentIndex < flatDays.length - 1 ? flatDays[currentIndex + 1] : null;

        const isCompleted = completedDays.includes(dayNumber);

        const footer = document.createElement('div');
        footer.className = 'day-footer';
        footer.innerHTML = `
            <div class="day-nav-buttons">
                <button onclick="${prevDay ? `loadDay(${prevDay})` : ''}" ${!prevDay ? 'disabled' : ''}>
                    ${getIcon('chevron-left')} Prev Day
                </button>
                
                <button id="mark-complete-btn" class="${isCompleted ? 'completed' : ''}" onclick="toggleCompletion(${dayNumber})">
                    ${isCompleted ? 'Completed ' + getIcon('check-circle') : 'Mark as Complete'}
                </button>
                
                <button onclick="${nextDay ? `loadDay(${nextDay})` : ''}" ${!nextDay ? 'disabled' : ''}>
                    Next Day <span style="transform:rotate(180deg); display:inline-block;">${getIcon('chevron-left')}</span>
                </button>
            </div>
        `;
        document.getElementById('topic-container').appendChild(footer);

        // Highlight Sidebar cleanly
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const navItem = document.getElementById(`nav-day-${dayNumber}`);
        if (navItem) navItem.classList.add('active');

    } catch (e) {
        console.error("Payload Pipeline Error:", e);
        target.innerHTML = `<div class="hero-section">
            <h2 style="color:var(--danger-border)">System Fault</h2>
            <p style="font-family:var(--font-mono); color:var(--text-secondary);">${e.message}</p>
        </div>`;
    }
}

function renderContinuousTopics(topicsData, target, stepperMount) {
    stepperMount.innerHTML = `<div class="stepper-nav">
        ${topicsData.map((t, i) => `
            <div class="step-node ${i === 0 ? 'active' : ''}" id="step-${i}" onclick="scrollToTopic(${i})">
                <span class="step-number">${i + 1}:</span>
                <span class="step-title">${t.header_hub.title.split(':')[0]}</span> 
            </div>
        `).join('')}
    </div>`;

    target.innerHTML = '<div id="topic-container"></div>';
    const container = document.getElementById('topic-container');
    let globalBlockIndex = 0;

    currentTopics.forEach((topicNode, idx) => {
        const wrapper = document.createElement('div');
        wrapper.id = `topic-section-${idx}`;
        wrapper.className = 'topic-wrapper';

        Array.from(topicNode.children).forEach(child => {
            if (cssAnimationsEnabled) {
                child.classList.add('animate-in');
                child.style.animationDelay = `${Math.min(globalBlockIndex * 0.05, 1.5)}s`;
            }
            wrapper.appendChild(child);
            globalBlockIndex++;
        });

        container.appendChild(wrapper);
    });

    document.getElementById('main-content').scrollTo(0, 0);
    setupScrollSpy();

    if (window.mermaid) {
        const currentMode = document.documentElement.getAttribute('data-mode') || 'dark';
        window.mermaid.initialize({
            startOnLoad: false,
            theme: currentMode === 'dark' ? 'dark' : 'default',
            fontFamily: 'var(--font-mono)',
            flowchart: { htmlLabels: false },
            sequence: { htmlLabels: false }
        });
        window.mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    }

    if (window.Prism) {
        window.Prism.highlightAllUnder(target);
    }
}

function scrollToTopic(idx) {
    const el = document.getElementById(`topic-section-${idx}`);
    const scrollElement = document.getElementById('main-content');
    const y = el.getBoundingClientRect().top + scrollElement.scrollTop - 90;
    scrollElement.scrollTo({ top: y, behavior: cssAnimationsEnabled ? 'smooth' : 'auto' });
}

function setupScrollSpy() {
    if (scrollObserver) scrollObserver.disconnect();
    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const idx = e.target.id.split('-')[2];
                document.querySelectorAll('.step-node').forEach(n => n.classList.remove('active'));
                const node = document.getElementById(`step-${idx}`);
                if (node) {
                    node.classList.add('active');
                    node.scrollIntoView({ behavior: cssAnimationsEnabled ? 'smooth' : 'auto', inline: 'center' });
                }
            }
        });
    }, { root: document.getElementById('main-content'), rootMargin: '-90px 0px -60% 0px' });
    document.querySelectorAll('.topic-wrapper').forEach(s => scrollObserver.observe(s));
}

window.switchTab = function (blockId, tabIndex) {
    const container = document.getElementById(blockId);
    container.querySelectorAll('.tab-btn').forEach((btn, i) => btn.classList.toggle('active', i === tabIndex));
    container.querySelectorAll('.tab-content').forEach((cont, i) => cont.classList.toggle('active', i === tabIndex));
}

// ============================================================================
// Interactive Quiz Engine (Focus Mode, Timer, State)
// ============================================================================
window.startQuiz = function(blockId) {
    const state = window.quizState[blockId];
    if(state.started) return;
    state.started = true;

    // Trigger Cinematic Focus Mode
    document.body.classList.add('quiz-active');
    document.getElementById('main-content').classList.add('quiz-active');
    document.getElementById(blockId).classList.add('focus-mode');

    // Swap UI
    document.getElementById(`${blockId}-start-overlay`).style.display = 'none';
    document.getElementById(`${blockId}-timer`).style.display = 'flex';
    document.getElementById(`${blockId}-q0-wrapper`).classList.add('active');

    // Initialize Timer
    state.timerId = setInterval(() => {
        state.timeRemaining--;
        const m = Math.floor(state.timeRemaining / 60);
        const s = state.timeRemaining % 60;
        const timerEl = document.getElementById(`${blockId}-timer`);
        
        timerEl.querySelector('span').innerText = `${m}:${s.toString().padStart(2, '0')}`;
        if(state.timeRemaining <= 30) timerEl.classList.add('danger');

        if(state.timeRemaining <= 0) endQuiz(blockId, true);
    }, 1000);
}

window.checkQuiz = function(blockId, questionId, optionId, isCorrect, explanation) {
    const wrapper = document.getElementById(`${questionId}-wrapper`);
    if (wrapper.getAttribute('data-answered') === 'true') return;
    wrapper.setAttribute('data-answered', 'true');

    wrapper.querySelectorAll('.quiz-opt').forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.getAttribute('data-opt') === optionId) {
            opt.classList.add(isCorrect ? 'correct' : 'wrong');
        } else {
            opt.classList.add('disabled');
        }
    });

    const expDiv = document.getElementById(`${questionId}-expl`);
    expDiv.style.display = 'block';
    if(cssAnimationsEnabled) expDiv.classList.add('animate-in');
    expDiv.innerHTML = `<strong>${isCorrect ? 'System Pass:' : 'System Fault:'}</strong> ${explanation}`;

    const state = window.quizState[blockId];
    state.answered++;
    if (isCorrect) state.correct++;
    else state.wrong++;

    document.getElementById(`${blockId}-score-text`).innerText = `Score: ${state.correct} / ${state.total} (${state.answered + state.skipped} completed)`;

    document.getElementById(`${questionId}-btn-skip`).style.display = 'none';
    const nextBtn = document.getElementById(`${questionId}-btn-next`);
    nextBtn.style.display = 'block';
    if (state.currentIdx === state.total - 1) nextBtn.innerText = "Finalize Calibration";
}

window.skipQuestion = function(blockId, questionId) {
    const wrapper = document.getElementById(`${questionId}-wrapper`);
    if (wrapper.getAttribute('data-answered') === 'true') return;
    wrapper.setAttribute('data-answered', 'true');

    const state = window.quizState[blockId];
    state.skipped++;
    document.getElementById(`${blockId}-score-text`).innerText = `Score: ${state.correct} / ${state.total} (${state.answered + state.skipped} completed)`;
    
    nextQuestion(blockId);
}

window.nextQuestion = function(blockId) {
    const state = window.quizState[blockId];
    document.getElementById(`${blockId}-q${state.currentIdx}-wrapper`).classList.remove('active');
    state.currentIdx++;

    if(state.currentIdx < state.total) {
        document.getElementById(`${blockId}-q${state.currentIdx}-wrapper`).classList.add('active');
    } else {
        endQuiz(blockId, false);
    }
}

window.endQuiz = function(blockId, isTimeout) {
    const state = window.quizState[blockId];
    clearInterval(state.timerId);

    if(state.currentIdx < state.total) {
        const activeWrap = document.getElementById(`${blockId}-q${state.currentIdx}-wrapper`);
        if(activeWrap) activeWrap.classList.remove('active');
    }

    const pct = Math.round((state.correct / state.total) * 100);
    
    // Save to LocalStorage permanently
    let savedScores = JSON.parse(localStorage.getItem('systems_quiz_scores') || '{}');
    // Only overwrite if it's a new high score
    if (!savedScores[blockId] || pct > savedScores[blockId].pct) {
        savedScores[blockId] = { correct: state.correct, total: state.total, pct: pct, date: new Date().toISOString() };
        localStorage.setItem('systems_quiz_scores', JSON.stringify(savedScores));
    }

    const finalDiv = document.getElementById(`${blockId}-final`);
    finalDiv.style.display = 'block';
    if(cssAnimationsEnabled) finalDiv.classList.add('animate-in');
    
    const timeoutMsg = isTimeout ? `<p style="color:var(--danger-border); font-weight:bold; margin-bottom:1rem;">[ System Timeout ]</p>` : '';
    const unans = state.total - state.correct - state.wrong;
    
    finalDiv.innerHTML = `<h4>Calibration Complete</h4>
        ${timeoutMsg}
        <div class="score-tally">
            <span><strong style="color:var(--success-border)">✔ ${state.correct}</strong> Correct</span>
            <span><strong style="color:var(--danger-border)">✖ ${state.wrong}</strong> Faults</span>
            <span><strong>- ${unans}</strong> Skipped</span>
        </div>
        <p style="font-size:1.2rem; font-weight:bold;">Final Output Score: ${pct}%</p>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.5rem;">Highest saved score: ${savedScores[blockId].pct}%</p>
        
        <div class="quiz-actions" style="justify-content: center; margin-top: 2rem;">
            <button class="btn-skip" onclick="retakeQuiz('${blockId}')">Retake Calibration</button>
            <button class="btn-next-q" style="display:block" onclick="closeQuiz('${blockId}')">Accept & Close</button>
        </div>`;
    
    if (pct >= 80) finalDiv.classList.add('passed');
    else finalDiv.classList.add('failed');
    
    document.getElementById(`${blockId}-timer`).style.display = 'none';
}

window.closeQuiz = function(blockId) {
    document.body.classList.remove('quiz-active');
    document.getElementById('main-content').classList.remove('quiz-active');
    document.getElementById(blockId).classList.remove('focus-mode');
}

window.retakeQuiz = function(blockId) {
    const total = window.quizState[blockId].total;
    const timeLimit = window.quizState[blockId].timeLimit;
    
    // Wipe memory state
    window.quizState[blockId] = { 
        total: total, answered: 0, correct: 0, wrong: 0, skipped: 0, 
        currentIdx: 0, timeLimit: timeLimit, timeRemaining: timeLimit, timerId: null, started: false 
    };

    const block = document.getElementById(blockId);
    
    // Wipe DOM styling
    block.querySelectorAll('.quiz-question-wrapper').forEach(w => {
        w.classList.remove('active');
        w.removeAttribute('data-answered');
    });
    block.querySelectorAll('.quiz-opt').forEach(opt => {
        opt.classList.remove('correct', 'wrong', 'disabled');
        opt.style.pointerEvents = 'auto';
        const radio = opt.querySelector('input');
        if(radio) radio.checked = false;
    });
    block.querySelectorAll('.quiz-expl').forEach(e => e.style.display = 'none');
    block.querySelectorAll('.btn-skip').forEach(b => b.style.display = 'block');
    block.querySelectorAll('.btn-next-q').forEach(b => b.style.display = 'none');

    // Reset layout
    const finalDiv = document.getElementById(`${blockId}-final`);
    finalDiv.style.display = 'none';
    finalDiv.className = 'quiz-final-results'; 
    
    const timer = document.getElementById(`${blockId}-timer`);
    timer.style.display = 'none';
    timer.classList.remove('danger');
    
    document.getElementById(`${blockId}-score-text`).innerText = `0 / ${total} Completed`;
    document.getElementById(`${blockId}-start-overlay`).style.display = 'block';
    
    closeQuiz(blockId);
}

// ============================================================================
// Core JSON to DOM Parser
// ============================================================================
function buildTopicNode(topic) {
    const wrapper = document.createElement('div');
    const hub = topic.header_hub || {};

    let html = `<header class="topic-header" style="margin-bottom: 2.5rem;">
        <div class="topic-meta">
            ${hub.category ? `<span class="chip std">${hub.category}</span>` : ''}
            ${hub.complexity ? `<span class="chip">Complexity: ${hub.complexity}</span>` : ''}
            ${hub.standard ? `<span class="chip">${hub.standard}</span>` : ''}
            ${hub.read_time ? `<span class="chip time">${getIcon('clock')} ${hub.read_time} min read</span>` : ''}
        </div>
        <h1 style="margin-top: 0;">${hub.title}</h1>
    </header>`;

    topic.content_blocks?.forEach(block => {
        const id = block.block_id || `blk-${Math.random().toString(36).substr(2, 9)}`;

        switch (block.type) {
            case 'section_title': html += `<h2>${block.title}</h2>`; break;
            case 'text': html += `<div style="margin-bottom:1.5rem; color:var(--text-secondary);">${block.content}</div>`; break;

            case 'cli_session':
                html += `<div class="cli-block" id="${id}">
                    <div class="cli-header"><div class="cli-dot r"></div><div class="cli-dot y"></div><div class="cli-dot g"></div></div>
                    <div class="cli-body">
                        ${block.lines.map(l => {
                    if (l.type === 'command') return `<div class="cli-line"><span class="cli-prompt">${l.prompt}</span><span class="cli-cmd">${l.content}</span></div>`;
                    if (l.type === 'output_error') return `<div class="cli-line"><span class="cli-err">${l.content}</span></div>`;
                    return `<div class="cli-line"><span class="cli-out">${l.content}</span></div>`;
                }).join('')}
                    </div>
                </div>`; break;

            case 'hex_dump':
                html += `<div class="hex-block" id="${id}">
                    ${block.rows.map(r => `
                        <div class="hex-row">
                            <span class="hex-addr">${r.address}</span>
                            <span class="hex-bytes">${r.bytes.join(' ')}</span>
                            <span class="hex-ascii">${r.ascii.replace(/</g, '&lt;')}</span>
                        </div>
                    `).join('')}
                </div>`; break;

            case 'memory_map':
                html += `<div class="memory-map" id="${id}">
                    ${block.layout_data.map(seg => `
                        <div class="mem-segment">
                            <div class="mem-addr">${seg.address}</div>
                            <div class="mem-data" style="--seg-color: ${seg.color}">${seg.segment}: ${seg.value}</div>
                        </div>
                    `).join('')}
                </div>`; break;

            case 'file_tree':
                let treeHtml = '';
                Object.entries(block.structure).forEach(([folder, files]) => {
                    treeHtml += `<div class="tree-item">${getIcon('folder')} ${folder}</div>`;
                    if (Array.isArray(files)) {
                        files.forEach(f => treeHtml += `<div class="tree-item file" style="margin-left:24px;">${getIcon('file')} ${f}</div>`);
                    }
                });
                html += `<div class="file-tree" id="${id}">${treeHtml}</div>`; break;

            case 'tabbed_content':
                html += `<div class="tabs-container" id="${id}">
                    <div class="tabs-header">
                        ${block.tabs.map((t, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="switchTab('${id}', ${i})">${t.tab_label}</button>`).join('')}
                    </div>
                    ${block.tabs.map((t, i) => `<div class="tab-content ${i === 0 ? 'active' : ''}">${t.content}</div>`).join('')}
                </div>`; break;

            case 'knowledge_check':
                const timeLimit = block.time_limit_seconds || (block.questions.length * 75);
                const m = Math.floor(timeLimit / 60);
                const s = timeLimit % 60;
                const timeStr = `${m}:${s.toString().padStart(2, '0')}`;

                window.quizState = window.quizState || {};
                window.quizState[id] = { 
                    total: block.questions.length, answered: 0, correct: 0, wrong: 0, skipped: 0, 
                    currentIdx: 0, timeLimit: timeLimit, timeRemaining: timeLimit, timerId: null, started: false 
                };

                html += `<div class="quiz-block" id="${id}">
                    <div class="quiz-header">
                        <h3>Mastery Calibration</h3>
                        <div class="quiz-timer" id="${id}-timer" style="display:none;">${getIcon('clock')} <span>${timeStr}</span></div>
                        <div class="quiz-score-pill">
                            <span id="${id}-score-text">0 / ${block.questions.length} Completed</span>
                        </div>
                    </div>
                    <div class="quiz-questions-container" id="${id}-container">
                        <div class="quiz-start-overlay" id="${id}-start-overlay">
                            <p style="color:var(--text-secondary); font-size:1.1rem; margin-bottom:0.5rem;">This calibration contains <strong>${block.questions.length}</strong> scenario-based questions.</p>
                            <p style="color:var(--text-secondary); font-size:0.95rem;">You have <strong>${m} minutes and ${s} seconds</strong> to complete the assessment. The timer begins when you proceed.</p>
                            <button class="btn-start-quiz" onclick="startQuiz('${id}')">Initialize Calibration</button>
                        </div>`;

                block.questions.forEach((q, qIndex) => {
                    const qId = `${id}-q${qIndex}`;
                    html += `<div class="quiz-question-wrapper" id="${qId}-wrapper">
                        <div class="quiz-q"><span style="color:var(--text-secondary); font-size:0.85rem; display:block; margin-bottom:8px;">QUESTION ${qIndex + 1} OF ${block.questions.length}</span>${q.question}</div>
                        ${q.options.map(opt => `
                            <label class="quiz-opt" data-opt="${opt.id}" onclick="checkQuiz('${id}', '${qId}', '${opt.id}', ${opt.is_correct}, '${opt.explanation.replace(/'/g, "\\'")}')">
                                <input type="radio" name="${qId}"> ${opt.text}
                            </label>
                        `).join('')}
                        <div class="quiz-expl" id="${qId}-expl" style="display:none;"></div>
                        <div class="quiz-actions">
                            <button class="btn-skip" id="${qId}-btn-skip" onclick="skipQuestion('${id}', '${qId}')">Skip Question</button>
                            <button class="btn-next-q" id="${qId}-btn-next" onclick="nextQuestion('${id}')">Next Protocol</button>
                        </div>
                    </div>`;
                });

                html += `</div>
                    <div class="quiz-final-results" id="${id}-final" style="display:none;"></div>
                </div>`;
                break;

            case 'mermaid_diagram':
                html += `<div class="visual-container"><div class="svg-wrapper mermaid">${block.syntax}</div></div>`; break;

            case 'svg_diagram':
                html += `<div class="visual-container" id="${id}">
                    <div class="svg-wrapper">${block.svg_code}</div>
                    ${block.caption ? `<div class="visual-caption">${block.caption}</div>` : ''}
                </div>`; break;

            case 'code_block':
            case 'sandbox':
                let rawCode = block.code || block.initial_code || '';
                if (rawCode.includes('<pre><code>')) {
                    rawCode = rawCode.replace('<pre><code>', `<pre><code class="language-${block.language}">`);
                } else {
                    rawCode = `<pre><code class="language-${block.language}">${rawCode}</code></pre>`;
                }
                html += `<div class="code-block" id="${id}">
                    <div class="code-header"><span>${block.header || 'source.c'}</span><span class="syntax-com">// ${block.language}</span></div>
                    <div class="code-content">${rawCode}</div>
                </div>`; break;

            case 'api_reference':
                html += `<div class="api-block" id="${id}">
                    <div class="api-signature">${block.signature}</div>
                    <div class="api-details">
                        <div class="api-desc">${block.description}</div>`;

                if (block.parameters && block.parameters.length > 0) {
                    html += `<div class="api-section">
                        <div class="api-label">Parameters</div>
                        <ul class="api-list">
                            ${block.parameters.map(p => `<li><span class="api-code">${p.type.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span> <span class="api-param-name">${p.name}</span> <span class="api-param-desc">${p.description}</span></li>`).join('')}
                        </ul>
                    </div>`;
                }

                if (block.returns || block.complexity || block.exceptions) {
                    html += `<div class="api-meta-grid">`;
                    if (block.returns) html += `<div class="api-meta-item"><strong>Returns:</strong> <span class="api-code">${block.returns.type.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span> ${block.returns.description}</div>`;
                    if (block.complexity) html += `<div class="api-meta-item"><strong>Complexity:</strong> ${block.complexity}</div>`;
                    if (block.exceptions) html += `<div class="api-meta-item"><strong>Exceptions:</strong> ${block.exceptions}</div>`;
                    html += `</div>`;
                }

                html += `</div></div>`;
                break;

            case 'callout':
                html += `<div class="callout callout-${block.variant}" style="--callout-color: ${block.color || 'var(--accent)'}">
                    <div class="callout-title">${block.title}</div>
                    ${block.content}
                </div>`; break;

            case 'qa_list':
                html += `<div class="qa-section">${block.items.map(qa => `
                    <details class="qa-item">
                        <summary class="qa-q">
                            <span class="qa-q-text">Q: ${qa.question}</span>
                            ${getIcon('chevron-left')} 
                        </summary>
                        <div class="qa-a">${qa.answer}</div>
                    </details>
                `).join('')}</div>`; break;
        }
    });

    wrapper.innerHTML = html;
    return wrapper;
}

window.onload = initLMS;