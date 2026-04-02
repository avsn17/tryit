#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ══════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════
const DATA_DIR = path.join(process.env.HOME || '/tmp', '.tryit');
const FILES = {
  notes: path.join(DATA_DIR, 'notes.json'),
  cards: path.join(DATA_DIR, 'cards.json'),
  todos: path.join(DATA_DIR, 'todos.json'),
  sessions: path.join(DATA_DIR, 'sessions.json'),
  moods: path.join(DATA_DIR, 'moods.json'),
  dist: path.join(DATA_DIR, 'distance.txt'),
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ══════════════════════════════════
// COLOR & STYLING
// ══════════════════════════════════
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  pink: '\x1b[38;5;205m',
  lavender: '\x1b[38;5;135m',
  teal: '\x1b[38;5;51m',
  amber: '\x1b[38;5;178m',
  gray: '\x1b[38;5;240m',
  purple: '\x1b[38;5;99m',
  green: '\x1b[38;5;46m',
};

const style = {
  header: (text) => `${colors.pink}${colors.bright}${text}${colors.reset}`,
  subheader: (text) => `${colors.lavender}${text}${colors.reset}`,
  success: (text) => `${colors.green}${text}${colors.reset}`,
  warning: (text) => `${colors.amber}${text}${colors.reset}`,
  error: (text) => `${colors.pink}${text}${colors.reset}`,
  accent: (text) => `${colors.teal}${text}${colors.reset}`,
  dim: (text) => `${colors.gray}${text}${colors.reset}`,
};

// ══════════════════════════════════
// DATA MANAGEMENT
// ══════════════════════════════════
const loadData = (file, defaultValue = []) => {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`Error loading ${file}:`, e.message);
  }
  return defaultValue;
};

const saveData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving ${file}:`, e.message);
  }
};

const getDistance = () => {
  try {
    if (fs.existsSync(FILES.dist)) {
      return parseInt(fs.readFileSync(FILES.dist, 'utf-8')) || 0;
    }
  } catch (e) {}
  return 0;
};

const setDistance = (dist) => {
  try {
    fs.writeFileSync(FILES.dist, String(dist));
  } catch (e) {
    console.error('Error saving distance:', e.message);
  }
};

// ══════════════════════════════════
// RANKS SYSTEM
// ══════════════════════════════════
const RANKS = [
  { dist: 0, rank: '🛸 Space Cadet', emoji: '🛸' },
  { dist: 100, rank: '🌙 Moon Walker', emoji: '🌙' },
  { dist: 500, rank: '☄️ Comet Rider', emoji: '☄️' },
  { dist: 1000, rank: '🚀 Orbit Master', emoji: '🚀' },
  { dist: 2500, rank: '⭐ Star Pilot', emoji: '⭐' },
  { dist: 5000, rank: '🌌 Galactic Overlord', emoji: '🌌' },
];

const getCurrentRank = (distance) => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (distance >= r.dist) rank = r;
    else break;
  }
  return rank;
};

// ══════════════════════════════════
// WISDOM DATABASE
// ══════════════════════════════════
const WISDOM = {
  bronte: [
    "'Whatever our souls are made of, his and mine are the same.' — Brontë",
    "'I am no bird; and no net ensnares me.' — Charlotte Brontë",
    "'I have dreamed in my life, dreams that have stayed with me ever after.' — Emily Brontë",
  ],
  kant: [
    "'Act only according to that maxim whereby you can at the same time will that it should become a universal law.' — Kant",
    "'Science is organized knowledge. Wisdom is organized life.' — Kant",
  ],
  lyrics: [
    "'In the middle of the night, I think about you.' ✦",
    "'I want to be your end game.' — Taylor",
  ],
  heroic: [
    'The cave you fear to enter holds the treasure you seek.',
    'Fall seven times, stand eight.',
    'She who endures, conquers. ✦',
  ],
  vibe: [
    'main character energy only ✦',
    'that girl is studying and thriving ♡',
    'we move in silence and we deliver ✦',
  ],
};

const ALL_QUOTES = Object.values(WISDOM).flat();

const getWisdomResponse = (input = '') => {
  const low = input.toLowerCase().trim();
  for (const [key, arr] of Object.entries(WISDOM)) {
    if (low.includes(key)) return arr[Math.floor(Math.random() * arr.length)];
  }
  return ALL_QUOTES[Math.floor(Math.random() * ALL_QUOTES.length)];
};

// ══════════════════════════════════
// TIMER
// ══════════════════════════════════
let timerRunning = false;
let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;
let timerLabel = '';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const renderProgressBar = (remaining, total, width = 30) => {
  const percent = remaining / total;
  const filled = Math.round(percent * width);
  const empty = width - filled;
  return `[${colors.pink}${'█'.repeat(filled)}${colors.reset}${' '.repeat(empty)}]`;
};

const startTimer = async (minutes, label = 'session') => {
  return new Promise((resolve) => {
    timerTotal = minutes * 60;
    timerRemaining = timerTotal;
    timerLabel = label;
    timerRunning = true;

    console.log(style.header(`\n🍅 ${label.toUpperCase()} — ${minutes} minutes\n`));

    timerInterval = setInterval(() => {
      const mins = Math.floor(timerRemaining / 60);
      const secs = timerRemaining % 60;
      const bar = renderProgressBar(timerRemaining, timerTotal);

      process.stdout.write(
        `\r${style.accent(String(mins).padStart(2, '0'))}:${style.accent(String(secs).padStart(2, '0'))} ${bar}`
      );

      timerRemaining--;

      if (timerRemaining < 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        console.log(`\n\n${style.success('✓ Session complete! 🎉')}`);
        
        // Log session
        const sessions = loadData(FILES.sessions, []);
        const dist = minutes * 10;
        const totalDist = getDistance() + dist;
        setDistance(totalDist);
        
        sessions.unshift({
          label,
          mins: minutes,
          dist,
          date: new Date().toLocaleDateString(),
          time: new Date().toTimeString().slice(0, 5),
        });
        saveData(FILES.sessions, sessions.slice(0, 30));
        
        console.log(`${style.accent(`+${dist}m`)} distance → ${style.accent(getCurrentRank(totalDist).rank)}\n`);
        resolve();
      }
    }, 1000);
  });
};

// ══════════════════════════════════
// NOTES
// ══════════════════════════════════
const showNotes = () => {
  const notes = loadData(FILES.notes, []);
  if (!notes.length) {
    console.log(style.dim('\nNo notes yet.\n'));
    return;
  }
  
  console.log(style.header('\n✦ YOUR NOTES\n'));
  notes.forEach((n, i) => {
    console.log(
      `${style.accent(`[${i + 1}]`)} ${style.subheader(n.title)} ${style.dim(`(${n.tag})`)}`
    );
    console.log(`    ${n.body.slice(0, 60)}${n.body.length > 60 ? '…' : ''}`);
    console.log(style.dim(`    ${n.date}\n`));
  });
};

const addNote = async (rl) => {
  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log(style.header('\n✦ ADD NOTE\n'));
  const title = await question('Title: ');
  const body = await question('Content: ');
  const tag = await question(
    'Category (lecture/reading/summary/formula/question/idea): '
  ) || 'other';

  const notes = loadData(FILES.notes, []);
  notes.unshift({
    id: Date.now(),
    title: title || '(untitled)',
    body,
    tag,
    date: new Date().toLocaleDateString(),
  });
  saveData(FILES.notes, notes);
  
  console.log(style.success('\n✓ Note saved!\n'));
};

// ══════════════════════════════════
// FLASHCARDS
// ══════════════════════════════════
const showCards = () => {
  const cards = loadData(FILES.cards, []);
  if (!cards.length) {
    console.log(style.dim('\nNo flashcards yet.\n'));
    return;
  }

  console.log(style.header('\n✧ YOUR FLASHCARDS\n'));
  cards.forEach((c, i) => {
    console.log(`${style.accent(`[${i + 1}]`)} ${style.subheader(c.front)}`);
    console.log(`${style.dim(`     → ${c.back}\n`)}`);
  });
};

const addCard = async (rl) => {
  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log(style.header('\n✧ ADD FLASHCARD\n'));
  const front = await question('Front (Q): ');
  const back = await question('Back (A): ');

  if (!front || !back) {
    console.log(style.error('\n✕ Both sides required!\n'));
    return;
  }

  const cards = loadData(FILES.cards, []);
  cards.push({ front, back });
  saveData(FILES.cards, cards);

  console.log(style.success('\n✓ Card added!\n'));
};

// ══════════════════════════════════
// TASKS
// ══════════════════════════════════
const showTodos = () => {
  const todos = loadData(FILES.todos, []);
  if (!todos.length) {
    console.log(style.dim('\nNo tasks yet.\n'));
    return;
  }

  console.log(style.header('\n✿ YOUR TASKS\n'));
  todos.forEach((t, i) => {
    const checkbox = t.done ? style.success('✓') : style.dim('○');
    const text = t.done ? style.dim(t.text) : t.text;
    console.log(`  ${checkbox} ${style.accent(`[${i + 1}]`)} ${text}`);
  });
  
  const done = todos.filter((t) => t.done).length;
  console.log(style.dim(`\n${done}/${todos.length} completed\n`));
};

const addTodo = async (rl) => {
  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log(style.header('\n✿ ADD TASK\n'));
  const text = await question('Task: ');

  if (!text) {
    console.log(style.dim('Cancelled.\n'));
    return;
  }

  const todos = loadData(FILES.todos, []);
  todos.push({ text, done: false, id: Date.now() });
  saveData(FILES.todos, todos);

  console.log(style.success('\n✓ Task added!\n'));
};

const toggleTodo = async (rl) => {
  const todos = loadData(FILES.todos, []);
  if (!todos.length) {
    console.log(style.dim('\nNo tasks.\n'));
    return;
  }

  showTodos();

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  const idx = await question('Toggle task #: ');
  const i = parseInt(idx) - 1;

  if (i >= 0 && i < todos.length) {
    todos[i].done = !todos[i].done;
    saveData(FILES.todos, todos);
    console.log(style.success('\n✓ Updated!\n'));
  } else {
    console.log(style.error('\n✕ Invalid task number.\n'));
  }
};

// ══════════════════════════════════
// MOOD
// ══════════════════════════════════
const MOODS = [
  { emoji: '✨', label: 'radiant' },
  { emoji: '🌸', label: 'blooming' },
  { emoji: '😊', label: 'happy' },
  { emoji: '😌', label: 'calm' },
  { emoji: '😐', label: 'meh' },
  { emoji: '😴', label: 'sleepy' },
  { emoji: '😰', label: 'stressed' },
  { emoji: '🌧', label: 'sad' },
];

const logMood = async (rl) => {
  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log(style.header('\n♡ MOOD CHECK-IN\n'));
  MOODS.forEach((m, i) => {
    console.log(`  ${style.accent(`[${i + 1}]`)} ${m.emoji} ${m.label}`);
  });

  const idx = await question('\nYour mood (#): ');
  const i = parseInt(idx) - 1;

  if (i < 0 || i >= MOODS.length) {
    console.log(style.error('\n✕ Invalid selection.\n'));
    return;
  }

  const note = await question('Note (optional): ');
  const mood = MOODS[i];

  const moods = loadData(FILES.moods, []);
  moods.unshift({
    emoji: mood.emoji,
    label: mood.label,
    note,
    date: new Date().toLocaleDateString(),
    time: new Date().toTimeString().slice(0, 5),
  });
  saveData(FILES.moods, moods.slice(0, 30));

  console.log(style.success(`\n✓ Logged ${mood.emoji}\n`));
};

const showMoods = () => {
  const moods = loadData(FILES.moods, []);
  if (!moods.length) {
    console.log(style.dim('\nNo moods logged.\n'));
    return;
  }

  console.log(style.header('\n♡ MOOD HISTORY\n'));
  moods.slice(0, 10).forEach((m) => {
    console.log(
      `  ${m.emoji} ${style.subheader(m.label)} ${m.note ? `— ${m.note}` : ''}`
    );
    console.log(style.dim(`     ${m.date} ${m.time}\n`));
  });
};

// ══════════════════════════════════
// RANKING SYSTEM
// ══════════════════════════════════
const showRanks = () => {
  const distance = getDistance();
  const currentRank = getCurrentRank(distance);

  console.log(style.header('\n🌌 GALACTIC RANKING\n'));
  console.log(style.accent(`Distance: ${distance}m`));
  console.log(style.subheader(`Current: ${currentRank.rank}\n`));

  RANKS.forEach((r) => {
    const marker = r.rank === currentRank.rank ? style.accent('→ ') : '  ';
    const rankText = r.rank === currentRank.rank ? style.bright(r.rank) : r.rank;
    console.log(`${marker}${rankText} ${style.dim(`(${r.dist}m+)`)}`);
  });
  console.log();
};

const showStats = () => {
  const notes = loadData(FILES.notes, []);
  const cards = loadData(FILES.cards, []);
  const todos = loadData(FILES.todos, []);
  const sessions = loadData(FILES.sessions, []);
  const distance = getDistance();
  const rank = getCurrentRank(distance);

  console.log(style.header('\n📊 STATISTICS\n'));
  console.log(`${style.accent('Notes:')} ${notes.length}`);
  console.log(`${style.accent('Flashcards:')} ${cards.length}`);
  console.log(`${style.accent('Tasks:')} ${todos.length} (${todos.filter((t) => t.done).length} done)`);
  console.log(`${style.accent('Sessions:')} ${sessions.length}`);
  console.log(`${style.accent('Distance:')} ${distance}m`);
  console.log(`${style.accent('Rank:')} ${rank.rank}`);
  console.log();
};

// ══════════════════════════════════
// MENU
// ══════════════════════════════════
const showMenu = () => {
  console.log(style.header('\n✦ TRYIT — COSMIC STUDY STATION ✦\n'));

  const menu = [
    ['🍅', 'timer', 'Start pomodoro timer'],
    ['✦', 'notes', 'View/add notes'],
    ['✧', 'cards', 'View/add flashcards'],
    ['✿', 'tasks', 'View/add tasks'],
    ['♡', 'mood', 'Mood check-in'],
    ['🌌', 'ranks', 'View ranking system'],
    ['📊', 'stats', 'View statistics'],
    ['💬', 'wisdom', 'Get some wisdom'],
    ['q', 'quit', 'Exit'],
  ];

  menu.forEach(([icon, cmd, desc]) => {
    console.log(`  ${icon} ${style.accent(cmd.padEnd(10))} — ${desc}`);
  });
  console.log();
};

const askWisdom = async (rl) => {
  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log(style.header('\n💬 ASK KIRBS\n'));
  console.log(style.dim('Categories: bronte, kant, lyrics, heroic, vibe, wisdom\n'));

  const input = await question('Ask or pick category: ');
  const wisdom = getWisdomResponse(input);

  console.log(`\n${style.subheader('✦ kirbs')} ${wisdom}\n`);
};

// ══════════════════════════════════
// MAIN LOOP
// ══════════════════════════════════
const main = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.clear();
  console.log(style.header('\n✦ tryit — cosmic study station ✦\n'));
  console.log(style.dim('loading cosmic-os 1.0...'));
  console.log(style.dim('mounting kirbs.pomodoro modules...'));
  console.log(style.dim('initialising mochi companion...'));
  console.log(style.dim('all systems ready — welcome, pilot!\n'));

  while (true) {
    showMenu();
    const cmd = await question(
      `${style.pink}♡ kirbs@cosmic${colors.reset}:~/tryit$ `
    );

    const c = cmd.toLowerCase().trim();

    switch (c) {
      case 'timer':
        const mins = await question(
          'Minutes (default 25, presets: 5/15/25/45/90): '
        ) || '25';
        const m = parseInt(mins) || 25;
        await startTimer(m, 'pomodoro session');
        console.log(`\n${getWisdomResponse()}\n`);
        break;

      case 'notes':
        showNotes();
        const nChoice = await question('(v)iew, (a)dd, or back? ');
        if (nChoice.toLowerCase() === 'a') await addNote(rl);
        break;

      case 'cards':
        showCards();
        const cChoice = await question('(v)iew, (a)dd, or back? ');
        if (cChoice.toLowerCase() === 'a') await addCard(rl);
        break;

      case 'tasks':
        showTodos();
        const tChoice = await question('(v)iew, (a)dd, (t)oggle, or back? ');
        if (tChoice.toLowerCase() === 'a') await addTodo(rl);
        if (tChoice.toLowerCase() === 't') await toggleTodo(rl);
        break;

      case 'mood':
        await logMood(rl);
        const mChoice = await question('View history? (y/n): ');
        if (mChoice.toLowerCase() === 'y') showMoods();
        break;

      case 'ranks':
        showRanks();
        break;

      case 'stats':
        showStats();
        break;

      case 'wisdom':
        await askWisdom(rl);
        break;

      case 'q':
      case 'quit':
      case 'exit':
        console.log(style.success('\n✦ Rest well, pilot. See you next session! ✦\n'));
        rl.close();
        process.exit(0);

      default:
        console.log(style.warning('\n✕ Unknown command.\n'));
    }
  }
};

main().catch(console.error);
