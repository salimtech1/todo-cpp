import { applyAccent, applyTheme, initializeSliders, initializeTheme } from "./customize/theme.js";
import { getWidgetMarkup, getWidgets, isWidgetVisible, setWidgetVisible } from "./customize/layout.js";
import { saveSetting } from "./customize/settings.js";

const API = "/api";
const moodFaces = ["☹", "◔", "○", "◕", "☀"];
const state = { data: null, page: "today", timer: null, remaining: 25 * 60, total: 25 * 60,
  running: false, preset: 25, audio: null, theme: "aurora", taskFilter: "open" };
const app = document.querySelector("#app");
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { message = (await response.json()).detail || message; } catch { /* Non-JSON error response. */ }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}
async function refresh() {
  state.data = await request("/state");
  render();
}
function toast(message) {
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;
  document.querySelector("#toast-region").append(node);
  setTimeout(() => node.remove(), 2800);
  if (navigator.vibrate && localStorage.getItem("nura-haptics") !== "off") navigator.vibrate(12);
}
function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}
function formatDate() {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
}
function taskMarkup(task) {
  const due = task.due_date === state.data.date ? "Today" : task.due_date || "Whenever";
  return `<div class="task-row ${task.done ? "is-done" : ""}" data-task="${task.id}">
    <button class="check" data-action="toggle-task" aria-label="${task.done ? "Reopen" : "Complete"} ${escapeHtml(task.title)}">✓</button>
    <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div>
    <div class="task-meta"><span><i class="priority priority-${task.priority}"></i>${["", "Urgent", "High", "Normal", "Low"][task.priority]}</span>
    <span>${escapeHtml(due)}${task.due_time ? ` · ${escapeHtml(task.due_time)}` : ""}</span>${task.tag ? `<span>#${escapeHtml(task.tag)}</span>` : ""}</div></div>
    <button class="delete-task" data-action="edit-task" aria-label="Edit ${escapeHtml(task.title)}" title="Edit task">✎</button>
    <button class="delete-task" data-action="archive-task" aria-label="Archive ${escapeHtml(task.title)}" title="Archive task">⌑</button>
    <button class="delete-task" data-action="delete-task" aria-label="Delete ${escapeHtml(task.title)}">×</button>
  </div>`;
}
function habitMarkup(habit) {
  const done = habit.today_amount >= habit.target;
  return `<article class="card habit-card" style="--habit-color:${escapeHtml(habit.color)}">
    <button class="habit-check ${done ? "checked" : ""}" data-action="toggle-habit" data-id="${habit.id}" aria-label="${done ? "Undo" : "Complete"} ${escapeHtml(habit.title)}">✓</button>
    <div class="habit-icon">${escapeHtml(habit.icon)}</div><div class="habit-title">${escapeHtml(habit.title)}</div>
    <div class="habit-sub">${habit.streak} day streak · ${done ? "Done today" : `${habit.target} ${escapeHtml(habit.unit)}`}</div></article>`;
}
function navMarkup() {
  const tabs = [
    ["today", "⌂", "Today"], ["habits", "✳", "Habits"], ["focus", "◷", "Focus"],
    ["insights", "▥", "Insights"], ["me", "☼", "Me"]
  ];
  return `<nav class="tabbar" aria-label="Main navigation">${tabs.map(([page, icon, label]) =>
    `<button class="tab-button ${state.page === page ? "active" : ""}" data-page="${page}" aria-label="${label}">
      <span>${icon}</span><span>${label}</span></button>`).join("")}
      <button class="tab-button quick-add-tab" data-page="quick" aria-label="Quick add"><span>+</span></button></nav>`;
}
function pageHeader(title, subtitle = "") {
  return `<header class="page-head"><div><div class="eyebrow">${escapeHtml(subtitle)}</div><h1>${escapeHtml(title)}</h1></div><span class="pill">${state.data.level} · ${state.data.xp} XP</span></header>`;
}
function todayView() {
  const tasks = state.data.tasks.filter((task) => state.taskFilter === "completed" ? task.done : !task.done);
  const openCount = state.data.tasks.filter((task) => !task.done).length;
  const complete = state.data.completed_tasks;
  const percent = state.data.tasks.length ? state.data.completed_tasks / state.data.tasks.length : 0;
  const offset = 188 * (1 - percent);
  const habitCount = state.data.habits.filter((habit) => habit.today_amount >= habit.target).length;
  return `<div class="hello-row"><div><div class="eyebrow">${formatDate()}</div><h1>${greeting()},<br>one thing at a time.</h1></div><div class="avatar" aria-label="Your Nura profile">N</div></div>
    <section class="card hero-card"><div><strong>Your day, at your pace.</strong><p>${complete ? `${complete} small win${complete === 1 ? "" : "s"} already. ` : ""}${state.data.open_tasks} gentle intention${state.data.open_tasks === 1 ? "" : "s"} to go.</p></div>
      <div class="ring" aria-label="${Math.round(percent * 100)} percent of tasks complete"><svg viewBox="0 0 70 70"><circle class="track" cx="35" cy="35" r="30"></circle><circle class="value" cx="35" cy="35" r="30" style="--offset:${offset}px"></circle></svg><b>${Math.round(percent * 100)}%</b></div></section>
    <div class="section-heading"><h2>Today</h2><span class="pill">${openCount} left</span></div>
    <div style="display:flex;gap:7px;margin-bottom:9px"><button class="preset ${state.taskFilter === "open" ? "active" : ""}" data-task-filter="open">Open</button><button class="preset ${state.taskFilter === "completed" ? "active" : ""}" data-task-filter="completed">Completed</button></div>
    <div class="task-list">${tasks.length ? tasks.map(taskMarkup).join("") : `<div class="card empty">${state.taskFilter === "completed" ? "No completed tasks yet. Every start counts." : "A little breathing room. You’ve done what you planned."}</div>`}</div>
    <form class="quick-add" id="quick-add-form"><label class="sr-only" for="quick-title">Add a task</label><input id="quick-title" maxlength="240" placeholder="Add a little intention…" autocomplete="off"><button class="add-button" aria-label="Add task">+</button></form>
    <p class="hint">Try “Read tomorrow #growth !high” · Enter to add</p>
    <details class="advanced-task"><summary>Plan a task with more detail</summary><form class="card" id="advanced-task-form">
      <label class="field-label" for="advanced-title">Task</label><input class="field" id="advanced-title" required maxlength="240" placeholder="What would you like to do?">
      <label class="field-label" for="advanced-notes">Notes</label><textarea class="field" id="advanced-notes" placeholder="A little context (optional)"></textarea>
      <div style="display:flex;gap:8px"><div style="flex:1"><label class="field-label" for="advanced-date">Due date</label><input class="field" id="advanced-date" type="date"></div>
      <div style="flex:1"><label class="field-label" for="advanced-time">Time</label><input class="field" id="advanced-time" type="time"></div></div>
      <div style="display:flex;gap:8px"><div style="flex:1"><label class="field-label" for="advanced-priority">Priority</label><select class="field" id="advanced-priority"><option value="3">Normal</option><option value="1">Urgent</option><option value="2">High</option><option value="4">Low</option></select></div>
      <div style="flex:1"><label class="field-label" for="advanced-tag">Tag</label><input class="field" id="advanced-tag" maxlength="40" placeholder="Personal"></div></div>
      <label class="field-label" for="advanced-repeat">Repeat</label><select class="field" id="advanced-repeat"><option value="">Does not repeat</option><option value="daily">Every day</option><option value="weekly:0,1,2,3,4,5,6">Weekly</option><option value="monthly">Monthly</option></select>
      <button class="primary-button full">Save task</button></form></details>
    <div class="section-heading"><h2>Gentle habits</h2><button class="text-button" data-page="habits">See all →</button></div>
    <div class="habit-grid">${state.data.habits.slice(0, 2).map(habitMarkup).join("") || `<div class="card empty">Add one habit that feels good.</div>`}</div>
    <div class="section-heading"><h2>A moment to focus</h2><button class="text-button" data-page="focus">Open timer →</button></div>
    <section class="card focus-card"><div><div class="focus-clock">${state.data.focus_minutes}<small style="font-size:12px">m</small></div><p class="focus-label">focused today · ${habitCount}/${state.data.habits.length} habits tended</p></div><button class="play-button" data-page="focus" aria-label="Open focus timer">▶</button></section>
    ${getWidgetMarkup()}`;
}
function habitsView() {
  return `${pageHeader("Small promises", "Habits")}
    <p class="muted">Consistency is built gently. Tap a circle when you show up for yourself.</p>
    <div class="habit-grid">${state.data.habits.map(habitMarkup).join("") || `<div class="card empty">Start with one habit so small it feels easy.</div>`}</div>
    <div class="section-heading"><h2>Add a habit</h2></div>
    <form class="card" id="habit-form">
      <label class="field-label" for="habit-title">What would you like to practice?</label><input class="field" id="habit-title" required maxlength="120" placeholder="e.g. Stretch for five minutes">
      <div style="display:flex;gap:9px"><div style="flex:1"><label class="field-label" for="habit-icon">Icon</label><input class="field" id="habit-icon" value="✦" maxlength="8"></div>
      <div style="flex:1"><label class="field-label" for="habit-unit">Measure</label><input class="field" id="habit-unit" value="times" maxlength="30"></div></div>
      <label class="field-label" for="habit-color">Habit color</label><input class="field" id="habit-color" type="color" value="#7cffb2" style="height:42px;padding:4px">
      <button class="primary-button full">Create habit</button>
    </form>
    <div class="section-heading"><h2>A little goal</h2></div>
    <form class="card" id="goal-form"><label class="field-label" for="goal-title">What are you growing toward?</label>
      <input class="field" id="goal-title" required maxlength="180" placeholder="e.g. Read 12 books this year">
      <div style="display:flex;gap:9px"><input class="field" id="goal-target" type="number" min="1" value="12" aria-label="Goal target">
      <input class="field" id="goal-unit" value="steps" maxlength="30" aria-label="Goal unit"></div>
      <button class="primary-button full">Add goal</button></form>
    ${state.data.goals.length ? `<div class="section-heading"><h2>Growing toward</h2></div>${state.data.goals.map((goal) => `<article class="card goal-row"><div style="flex:1"><h3>${escapeHtml(goal.title)}</h3><div class="muted">${goal.progress} of ${goal.target} ${escapeHtml(goal.unit)}</div><div class="goal-progress"><span style="width:${Math.min(100, 100 * goal.progress / goal.target)}%"></span></div></div><button class="icon-button" data-action="goal-step" data-id="${goal.id}" data-progress="${goal.progress}" data-target="${goal.target}" aria-label="Update goal">+</button></article>`).join("")}` : ""}`;
}
function focusView() {
  const minutes = String(Math.floor(state.remaining / 60)).padStart(2, "0");
  const seconds = String(state.remaining % 60).padStart(2, "0");
  const ratio = state.total ? state.remaining / state.total : 1;
  const offset = 552 * (1 - ratio);
  return `${pageHeader("A little focus", "Focus")}
    <p class="muted" style="text-align:center">One gentle stretch of attention. Everything else can wait.</p>
    <div class="timer-face"><svg viewBox="0 0 190 190"><circle class="track" cx="95" cy="95" r="88"></circle><circle class="timer-progress" cx="95" cy="95" r="88" style="stroke-dashoffset:${offset}px"></circle></svg>
      <div class="timer-center"><div class="timer-value">${minutes}:${seconds}</div><div class="timer-caption">${state.running ? "you’re doing beautifully" : "a little time for you"}</div></div></div>
    <div class="preset-row">${[25, 50, 15].map((min) => `<button class="preset ${state.preset === min ? "active" : ""}" data-preset="${min}">${min} min</button>`).join("")}</div>
    <div class="timer-controls"><button data-action="reset-timer">Reset</button><button class="primary-button" data-action="toggle-timer">${state.running ? "Pause" : "Begin focus"}</button></div>
    <div class="section-heading"><h2>Today’s focus</h2><span class="pill">${state.data.focus_minutes} minutes</span></div>
    <div class="card muted">When the timer finishes, this session is added to your daily total. You can pause or reset at any time.</div>`;
}
async function insightsView() {
  const insight = await request("/insights");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const values = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - index));
    const iso = day.toISOString().slice(0, 10);
    return { name: dayNames[day.getDay()], count: insight.completed.find((row) => row.day === iso)?.count || 0 };
  });
  const max = Math.max(1, ...values.map((item) => item.count));
  return `${pageHeader("Noticing your growth", "Insights")}
    <p class="muted">A gentle look back, without grades or pressure.</p>
    <div class="stat-grid"><article class="card"><div class="stat-value">${state.data.xp}</div><div class="stat-label">kindness points · level ${state.data.level}</div></article>
      <article class="card"><div class="stat-value">${state.data.focus_minutes}<small style="font-size:11px">m</small></div><div class="stat-label">focus today</div></article>
      <article class="card"><div class="stat-value">${state.data.completed_tasks}</div><div class="stat-label">tasks completed</div></article>
      <article class="card"><div class="stat-value">${state.data.habits.length}</div><div class="stat-label">habits in your rhythm</div></article></div>
    <div class="section-heading"><h2>Small wins this week</h2></div>
    <article class="card"><div class="insight-bars">${values.map((item) => `<div class="bar-col"><div class="bar" style="height:${Math.max(5, 65 * item.count / max)}%"></div><small>${item.name}</small></div>`).join("")}</div><p class="hint">Tasks you completed each day</p></article>
    <div class="section-heading"><h2>Weekly reflection</h2></div>
    <article class="card"><label class="field-label" for="reflection">What felt good this week? What would you like to carry forward?</label><textarea id="reflection" class="field" placeholder="Give yourself a moment to notice…">${escapeHtml(state.data.journal?.note || "")}</textarea><button class="primary-button full" data-action="save-reflection">Save reflection</button></article>`;
}
function meView() {
  const themes = [["aurora", "Aurora", "linear-gradient(120deg,#134332,#453e73)"], ["midnight", "Midnight", "linear-gradient(120deg,#161b49,#394c87)"], ["sakura", "Sakura", "linear-gradient(120deg,#652f51,#9e5771)"], ["forest", "Forest", "linear-gradient(120deg,#173d2b,#527e4f)"], ["sunset", "Sunset", "linear-gradient(120deg,#693c32,#b06e51)"], ["light", "Paper light", "linear-gradient(120deg,#eee8db,#a2b6aa)"]];
  return `${pageHeader("A space that’s yours", "Me")}
    <article class="card" style="text-align:center"><div class="companion"></div><h2 style="margin-top:14px">Your little light</h2><p class="muted">Level ${state.data.level} · ${state.data.xp} kindness points<br>Growing at your own pace.</p></article>
    <div class="settings-title">Choose your atmosphere</div><div class="theme-swatches">${themes.map(([key, title, swatch]) => `<button class="theme-swatch ${state.theme === key ? "selected" : ""}" data-theme-choice="${key}" style="--swatch:${swatch}">${title}</button>`).join("")}</div>
    <div class="settings-title">Make it feel right</div>
    <div class="card"><label class="range-row">Text size <input type="range" min="90" max="115" value="${localStorage.getItem("nura-font") || 100}" data-custom="font"></label>
      <label class="range-row">Card corners <input type="range" min="16" max="34" value="${localStorage.getItem("nura-radius") || 25}" data-custom="radius"></label>
      <label class="range-row">Glass blur <input type="range" min="0" max="28" value="${localStorage.getItem("nura-glass") || 18}" data-custom="glass"></label>
      <label class="range-row">Accent color <input type="color" value="${localStorage.getItem("nura-accent") || "#7cffb2"}" data-custom="accent"></label>
      <label class="toggle-row">Compact cards <input type="checkbox" data-custom="density" ${localStorage.getItem("nura-density") === "compact" ? "checked" : ""}></label>
      <label class="toggle-row">Gentle haptics <input type="checkbox" data-custom="haptics" ${localStorage.getItem("nura-haptics") !== "off" ? "checked" : ""}></label>
      <label class="toggle-row">Completion reminders <input type="checkbox" data-custom="notifications" ${localStorage.getItem("nura-notifications") === "on" ? "checked" : ""}></label></div>
    ${getWidgets().length ? `<div class="settings-title">Today widgets</div><div class="card">${getWidgets().map((widget) => `<label class="toggle-row">${escapeHtml(widget.title || widget.id)}<input type="checkbox" data-widget="${escapeHtml(widget.id)}" ${isWidgetVisible(widget.id) ? "checked" : ""}></label>`).join("")}</div>` : ""}
    <div class="settings-title">Your data stays yours</div>
    <div class="card"><p class="muted">Nura saves everything in a local SQLite database on this computer. No account, analytics, or internet connection required.</p>
      <a href="/api/export" class="primary-button" style="display:grid;place-items:center;text-decoration:none">Download JSON backup</a>
      <a href="/api/export/csv" class="primary-button full" style="display:grid;place-items:center;text-decoration:none">Download CSV backup</a>
      <label class="primary-button full" style="display:grid;place-items:center;cursor:pointer">Restore Nura JSON backup<input id="backup-import" type="file" accept=".json,application/json" hidden></label>
      <label class="primary-button full" style="display:grid;place-items:center;cursor:pointer">Restore Nura CSV ZIP<input id="csv-import" type="file" accept=".zip,application/zip" hidden></label>
      <label class="primary-button full" style="display:grid;place-items:center;cursor:pointer">Import old C++ task list<input id="legacy-import" type="file" accept=".txt,text/plain" hidden></label>
      <button class="text-button full" data-action="reset-demo">Reset demo data</button></div>
    <div class="settings-title">Your mood today</div><article class="card"><div class="mood-row">${moodFaces.map((face, index) => `<button class="mood-choice ${state.data.journal?.mood === index + 1 ? "selected" : ""}" data-mood="${index + 1}" aria-label="Mood ${index + 1}">${face}</button>`).join("")}</div>
      <label class="field-label" for="gratitude">Three little things you’re grateful for</label><textarea id="gratitude" class="field" placeholder="A warm drink, a kind message…">${escapeHtml(state.data.journal?.gratitude || "")}</textarea>
      <label class="field-label" for="journal-note">A note to yourself</label><textarea id="journal-note" class="field" placeholder="Anything on your mind?">${escapeHtml(state.data.journal?.note || "")}</textarea><button class="primary-button full" data-action="save-journal">Save check-in</button></article>`;
}
async function render() {
  if (!state.data) return;
  const page = state.page;
  app.innerHTML = `<div class="page-content">${page === "today" ? todayView() :
    page === "habits" ? habitsView() : page === "focus" ? focusView() :
    page === "insights" ? await insightsView() : meView()}</div>${navMarkup()}`;
}
function setTheme(theme) {
  state.theme = theme;
  applyTheme(theme);
}
function loadCustomization() {
  state.theme = initializeTheme();
  initializeSliders();
}
function startClock(repaint = true) {
  clearInterval(state.timer);
  state.timer = setInterval(async () => {
    if (state.remaining > 0) {
      state.remaining -= 1;
      if (repaint && state.page === "focus") await render();
      return;
    }
    clearInterval(state.timer);
    state.timer = null;
    state.running = false;
    try {
      await request("/focus", { method: "POST", body: JSON.stringify({ minutes: state.preset }) });
      await refresh();
      toast("Focus time complete. Lovely work showing up for yourself.");
      confetti();
    } catch (error) { toast(error.message); }
    if (state.page === "focus") render();
  }, 1000);
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#7cffb2", "#a99bff", "#ffbb9b"];
  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement("i");
    piece.style.cssText = `position:fixed;z-index:30;left:${40 + Math.random()*20}vw;top:48vh;width:6px;height:9px;border-radius:2px;background:${colors[i%3]};pointer-events:none;transition:transform 1s ease-out,opacity 1s`;
    document.body.append(piece);
    requestAnimationFrame(() => { piece.style.transform = `translate(${(Math.random()-.5)*240}px,${(Math.random()-.5)*300+80}px) rotate(${Math.random()*500}deg)`; piece.style.opacity = "0"; });
    setTimeout(() => piece.remove(), 1100);
  }
}
async function addQuickTask(text) {
  await request("/tasks/quick-add", { method: "POST", body: JSON.stringify({ text }) });
  await refresh();
  toast("Added gently to your day.");
}
let selectedMood = 3;
app.addEventListener("click", async (event) => {
  const pageButton = event.target.closest("[data-page]");
  const page = pageButton?.dataset.page;
  if (page === "quick") { app.querySelector("#quick-title")?.focus(); return; }
  if (page) { state.page = page; render(); return; }
  const themeChoice = event.target.closest("[data-theme-choice]");
  if (themeChoice) { setTheme(themeChoice.dataset.themeChoice); render(); return; }
  const filterButton = event.target.closest("[data-task-filter]");
  if (filterButton) { state.taskFilter = filterButton.dataset.taskFilter; render(); return; }
  const preset = event.target.closest("[data-preset]");
  if (preset) { state.preset = Number(preset.dataset.preset); state.remaining = state.preset * 60; state.total = state.remaining; state.running = false; clearInterval(state.timer); render(); return; }
  const mood = event.target.closest("[data-mood]");
  if (mood) { selectedMood = Number(mood.dataset.mood); app.querySelectorAll("[data-mood]").forEach((node) => node.classList.toggle("selected", node === mood)); return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  try {
    const taskRow = event.target.closest("[data-task]");
    const habitId = Number(event.target.closest("[data-id]")?.dataset.id || event.target.closest("[data-action]")?.dataset.id);
    if (action === "toggle-task" && taskRow) {
      const task = state.data.tasks.find((item) => item.id === Number(taskRow.dataset.task));
      await request(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ done: !task.done }) });
      await refresh(); if (!task.done) { toast("One small win. Be proud of that."); confetti(); }
    } else if (action === "edit-task" && taskRow) {
      const task = state.data.tasks.find((item) => item.id === Number(taskRow.dataset.task));
      const title = prompt("Edit task title:", task.title);
      if (title === null) return;
      await request(`/tasks/${task.id}`, { method: "PATCH", body: JSON.stringify({ title }) });
      await refresh(); toast("Task updated.");
    } else if (action === "archive-task" && taskRow) {
      await request(`/tasks/${taskRow.dataset.task}`, { method: "PATCH", body: JSON.stringify({ archived: true }) });
      await refresh(); toast("Task archived.");
    } else if (action === "delete-task" && taskRow) {
      await request(`/tasks/${taskRow.dataset.task}`, { method: "DELETE" }); await refresh(); toast("Task removed.");
    } else if (action === "toggle-habit") {
      const habit = state.data.habits.find((item) => item.id === habitId);
      const done = habit.today_amount >= habit.target;
      await request(`/habits/${habitId}/check`, { method: done ? "DELETE" : "POST", body: JSON.stringify({ amount: habit.target }) });
      await refresh(); if (!done) toast("You showed up. That counts.");
    } else if (action === "toggle-timer") {
      state.running = !state.running;
      if (state.running) startClock();
      else clearInterval(state.timer);
      render();
    } else if (action === "reset-timer") {
      state.running = false; clearInterval(state.timer); state.remaining = state.preset * 60; state.total = state.remaining; render();
    } else if (action === "save-journal") {
      await request("/journal/today", { method: "PUT", body: JSON.stringify({ mood: selectedMood, note: app.querySelector("#journal-note")?.value || "", gratitude: app.querySelector("#gratitude")?.value || "" }) });
      await refresh(); toast("Your check-in is saved just for you.");
    } else if (action === "save-reflection") {
      await request("/journal/today", { method: "PUT", body: JSON.stringify({ mood: state.data.journal?.mood || 3, note: app.querySelector("#reflection")?.value || "", gratitude: state.data.journal?.gratitude || "" }) });
      await refresh(); toast("Reflection saved.");
    } else if (action === "goal-step") {
      const button = event.target.closest("[data-action]");
      await request(`/goals/${button.dataset.id}`, { method: "PATCH", body: JSON.stringify({ progress: Math.min(Number(button.dataset.target), Number(button.dataset.progress) + 1) }) });
      await refresh(); toast("A little progress is still progress.");
    } else if (action === "reset-demo") {
      if (!confirm("Reset all local Nura data to the demo starting point? This cannot be undone.")) return;
      await request("/reset-demo", { method: "POST" }); await refresh(); toast("Demo data restored.");
    }
  } catch (error) { toast(error.message); }
});
app.addEventListener("submit", async (event) => {
  if (event.target.id === "quick-add-form") {
    event.preventDefault();
    const input = event.target.querySelector("input");
    if (!input.value.trim()) return;
    try { await addQuickTask(input.value); } catch (error) { toast(error.message); }
  } else if (event.target.id === "habit-form") {
    event.preventDefault();
    try {
      await request("/habits", { method: "POST", body: JSON.stringify({
        title: event.target.querySelector("#habit-title").value,
        icon: event.target.querySelector("#habit-icon").value || "✦",
        color: event.target.querySelector("#habit-color").value,
        unit: event.target.querySelector("#habit-unit").value || "times"
      }) });
      await refresh(); toast("A new gentle practice, just for you.");
    } catch (error) { toast(error.message); }
  } else if (event.target.id === "goal-form") {
    event.preventDefault();
    try {
      await request("/goals", { method: "POST", body: JSON.stringify({
        title: event.target.querySelector("#goal-title").value,
        target: Number(event.target.querySelector("#goal-target").value),
        unit: event.target.querySelector("#goal-unit").value || "steps"
      }) });
      await refresh(); toast("A goal to grow toward, saved.");
    } catch (error) { toast(error.message); }
  } else if (event.target.id === "advanced-task-form") {
    event.preventDefault();
    try {
      await request("/tasks", { method: "POST", body: JSON.stringify({
        title: event.target.querySelector("#advanced-title").value,
        notes: event.target.querySelector("#advanced-notes").value,
        due_date: event.target.querySelector("#advanced-date").value || null,
        due_time: event.target.querySelector("#advanced-time").value || null,
        priority: Number(event.target.querySelector("#advanced-priority").value),
        tag: event.target.querySelector("#advanced-tag").value,
        recurrence: event.target.querySelector("#advanced-repeat").value || null
      }) });
      await refresh(); toast("Task added to your list.");
    } catch (error) { toast(error.message); }
  }
});
app.addEventListener("input", (event) => {
  const input = event.target;
  const kind = input.dataset.custom;
  if (kind === "font") { localStorage.setItem("nura-font", input.value); document.documentElement.style.setProperty("--font-scale", `${input.value / 100}`); }
  if (kind === "radius") { localStorage.setItem("nura-radius", input.value); document.documentElement.style.setProperty("--radius", `${input.value}px`); }
  if (kind === "glass") { localStorage.setItem("nura-glass", input.value); document.documentElement.style.setProperty("--glass", `${input.value}px`); }
  if (kind === "accent") applyAccent(input.value);
});
app.addEventListener("change", async (event) => {
  const input = event.target;
  if (input.dataset.custom === "density") { saveSetting("density", input.checked ? "compact" : "comfortable"); document.documentElement.dataset.density = input.checked ? "compact" : "comfortable"; }
  if (input.dataset.custom === "haptics") saveSetting("haptics", input.checked ? "on" : "off");
  if (input.dataset.custom === "notifications") {
    if (input.checked && "Notification" in window) {
      const permission = await Notification.requestPermission();
      input.checked = permission === "granted";
      saveSetting("notifications", input.checked ? "on" : "off");
      if (input.checked) toast("Gentle reminders enabled in this browser.");
      else toast("Browser notifications were not enabled.");
    } else { saveSetting("notifications", "off"); }
  }
  if (input.dataset.widget) {
    setWidgetVisible(input.dataset.widget, input.checked);
    if (state.page === "today") render();
  }
  if (input.id === "legacy-import" && input.files?.[0]) {
    try {
      const content = await input.files[0].text();
      const result = await request("/import/legacy", { method: "POST", body: JSON.stringify({ content }) });
      await refresh(); toast(`${result.imported_tasks} task${result.imported_tasks === 1 ? "" : "s"} brought into Nura.`);
    } catch (error) { toast(error.message); }
    input.value = "";
  }
  if (input.id === "backup-import" && input.files?.[0]) {
    if (!confirm("Restore this backup and replace the current Nura data?")) { input.value = ""; return; }
    try {
      const backup = JSON.parse(await input.files[0].text());
      await request("/import/backup", { method: "PUT", body: JSON.stringify(backup) });
      await refresh(); toast("Your Nura backup has been restored.");
    } catch (error) { toast(`Backup could not be restored: ${error.message}`); }
    input.value = "";
  }
  if (input.id === "csv-import" && input.files?.[0]) {
    if (!confirm("Restore this CSV archive and replace the current Nura data?")) { input.value = ""; return; }
    try {
      const response = await fetch("/api/import/csv", {
        method: "PUT",
        headers: { "Content-Type": "application/zip" },
        body: input.files[0]
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "The CSV archive could not be restored.");
      }
      await refresh(); toast("Your CSV backup has been restored.");
    } catch (error) { toast(`Backup could not be restored: ${error.message}`); }
    input.value = "";
  }
});
document.querySelector("#device-mode").addEventListener("change", (event) => {
  document.querySelector("#device-shell").dataset.device = event.target.value;
});
document.querySelector("#rotate-device").addEventListener("click", () => document.querySelector("#device-shell").classList.toggle("rotated"));
document.querySelector("#quick-theme").addEventListener("click", () => setTheme(state.theme === "light" ? "aurora" : "light"));
function updateStatusTime() { document.querySelector("#status-time").textContent = new Intl.DateTimeFormat(undefined, { hour:"numeric", minute:"2-digit" }).format(new Date()); }
updateStatusTime(); setInterval(updateStatusTime, 30000);
loadCustomization();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Service worker unavailable:", error));
request("/plugins").then(async (plugins) => {
  await Promise.all(plugins.map((name) => import(`./plugins/${name}.js`)));
  if (state.data && state.page === "today") render();
}).catch((error) => console.error("Nura plugin loading failed:", error));
request("/state").then((data) => { state.data = data; selectedMood = data.journal?.mood || 3; render(); }).catch((error) => { app.innerHTML = `<div class="card empty">Nura couldn’t load your local data: ${escapeHtml(error.message)}. Restart the app and try again.</div>`; });
