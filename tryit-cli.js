#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EventEmitter = require('events');

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
  config: path.join(DATA_DIR, 'config.json'),
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ══════════════════════════════════
// COLOR & STYLING (ANSI)
// ══════════════════════════════════
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  pink: '\x1b[38;5;205m',
  lavender: '\x1b[38;5;135m',
  teal: '\x1b[38;5;51m',
  amber: '\x1b[38;5;178m',
  gray: '\x1b[38;5;240m',
  purple: '\x1b[38;5;99m',
  green: '\x1b[38;5;46m',
  red: '\x1b[38;5;196m',
};

const style = {
  header: (text) => `${colors.pink}${colors.bright}${text}${colors.reset}`,
  subheader: (text) => `${colors.lavender}${colors.bright}${text}${colors.reset}`,
  success: (text) => `${colors.green}${colors.bright}${text}${colors.reset}`,
  warning: (text) => `${colors.amber}${text}${colors.reset}`,
  error: (text) => `${colors.red}${colors.bright}${text}${colors.reset}`,
  accent: (text) => `${colors.teal}${text}${colors.reset}`,
  dim: (text) => `${colors.gray}${text}${colors.reset}`,
  info: (text) => `${colors.purple}${text}${colors.reset}`,
  prompt: (text) => `${colors.pink}♡${colors.reset} ${text}`,
};

// ══════════════════════════════════
// UTILITY: INPUT VALIDATION
// ══════════════════════════════════
const validateInput = (input, type = 'string') => {
  if (type === 'string') return input.trim().length > 0;
  if (type === 'number') return !isNaN(parseInt(input)) && parseInt(input) > 0;
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
  return true;
};

const sanitizeInput = (input) => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000);
};

// ══════════════════════════════════
// DATA MANAGEMENT (IMPROVED)
// ══════════════════════════════════
const loadData = (file, defaultValue = []) => {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn(style.warning(`⚠ Error loading ${file}: ${e.message}`));
  }
  return defaultValue;
};

const saveData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error(style.error(`✕ Error saving to ${file}: ${e.message}`));
    return false;
  }
};

const getDistance = () => {
  try {
    if (fs.existsSync(FILES.dist)) {
      const val = fs.readFileSync(FILES.dist, 'utf-8').trim();
      return parseInt(val) || 0;
    }
  } catch (e) {
    console.warn(style.warning(`⚠ Error reading distance: ${e.message}`));
  }
  return 0;
};

const setDistance = (dist) => {
  try {
    if (dist < 0) dist = 0;
    fs.writeFileSync(FILES.dist, String(dist));
    return true;
  } catch (e) {
    console.error(style.error(`✕ Error saving distance: ${e.message}`));
    return false;
  }
};

// ══════════════════════════════════
// RANKS SYSTEM (IMPROVED)
// ══════════════════════════════════
const RANKS = [
  { dist: 0, rank: '🛸 Space Cadet', emoji: '🛸', description: 'Just starting your journey' },
  { dist: 100, rank: '🌙 Moon Walker', emoji: '🌙', description: 'Learning to navigate' },
  { dist: 500, rank: '☄️ Comet Rider', emoji: '☄️', description: 'Building momentum' },
  { dist: 1000, rank: '🚀 Orbit Master', emoji: '🚀', description: 'Reaching new heights' },
  { dist: 2500, rank: '⭐ Star Pilot', emoji: '⭐', description: 'Stellar performance' },
  { dist: 5000, rank: '🌌 Galactic Overlord', emoji: '🌌', description: 'Ultimate mastery' },
];

const getCurrentRank = (distance) => {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (distance >= r.dist) rank = r;
    else break;
  }
  return rank;
};

const getNextRank = (distance) => {
  for (const r of RANKS) {
    if (distance < r.dist) return r;
  }
  return RANKS[RANKS.length - 1];
};

// ══════════════════════════════════
// WISDOM DATABASE (EXPANDED)
// ══════════════════════════════════
const WISDOM = {
  bronte: [
    "'Whatever our souls are made of, his and mine are the same.' — Brontë",
    "'I am no bird; and no net ensnares me.' — Charlotte Brontë",
    "'I have dreamed in my life, dreams that have stayed with me ever after.' — Emily Brontë",
    "'If all the world hated you and believed you wicked, while your own conscience approved and you knew that you were innocent, you would not be without a friend.' — Charlotte",
  ],
  kant: [
    "'Act only according to that maxim whereby you can at the same time will that it should become a universal law.' — Kant",
    "'Science is organized knowledge. Wisdom is organized life.' — Kant",
    "'Two things awe me most: the starry sky above, and the moral law within.' — Kant",
  ],
  lyrics: [
    "'In the middle of the night, I think about you.' ✦",
    "'I want to be your end game.' — Taylor",
    "'You don't have to call anymore, I won't pick up the phone.' — Taylor",
  ],
  heroic: [
    'The cave you fear to enter holds the treasure you seek.',
    'Fall seven times, stand eight.',
    'She who endures, conquers. ✦',
    'The obstacle is the way. Every resistance reveals the path.',
    'Comfort is the enemy of achievement.',
  ],
  vibe: [
    'main character energy only ✦',
    'that girl is studying and thriving ♡',
    'we move in silence and we deliver ✦',
    'soft life, strong mind ✿',
    'bloom where you are planted ♡',
  ],
  wisdom: [
    'The expert in anything was once a beginner.',
    'Progress, not perfection. ✦',
    'Your future self is watching — make her proud. ♡',
    'One focused hour beats eight distracted ones.',
    'Rest is not quitting. It is recharging. ✦',
    'Slow progress is still progress.',
  ],
  iro: [
    "'Even in the mud and scum of things, something always, always sings.' — Emerson",
    "'It is not length of life, but depth of life.' — Emerson",
    'Nature never hurries, yet everything is accomplished. ✦',
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
// TIMER (IMPROVED - NON-BLOCKING)
// ══════════════════════════════════
class Timer extends EventEmitter {
  constructor() {
    super();
    this.running = false;
    this.remaining = 0;
    this.total = 0;
    this.label = '';
    this.interval = null;
  }

  start(minutes, label = 'session') {
    return new Promise((resolve) => {
      this.total = minutes * 60;
      this.remaining = this.total;
      this.label = label;
      this.running = true;

      console.log(style.header(`\n🍅 ${label.toUpperCase()} — ${minutes} minute${minutes !== 1 ? 's' : ''}\n`));

      this.interval = setInterval(() => {
        const mins = Math.floor(this.remaining / 60);
        const secs = this.remaining % 60;
        const bar = this._renderBar();

        process.stdout.write(
          `\r${style.accent(String(mins).padStart(2, '0'))}:${style.accent(
            String(secs).padStart(2, '0')
          )} ${bar}  `
        );

        this.remaining--;

        if (this.remaining < 0) {
          clearInterval(this.interval);
          this.running = false;
          console.log(`\n\n${style.success('✓ Session complete! 🎉')}`);
          this.emit('complete');
          resolve();
        }
      }, 1000);
    });
  }

  _renderBar(width = 25) {
    const percent = Math.max(0, this.remaining / this.total);
    const filled = Math.round(percent * width);
    const empty = width - filled;
    return `[${colors.pink}${'█'.repeat(filled)}${colors.reset}${' '.repeat(empty)}]`;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.running = false;
      console.log('\n');
    }
  }
}

// ══════════════════════════════════
// NOTES (IMPROVED)
// ══════════════════════════════════
class NotesManager {
  static show(limit = null) {
    const notes = loadData(FILES.notes, []);
    if (!notes.length) {
      console.log(style.dim('\nNo notes yet. Start creating! ♡\n'));
      return;
    }

    console.log(style.header('\n✦ YOUR NOTES\n'));
    const display = limit ? notes.slice(0, limit) : notes;
    
    display.forEach((n, i) => {
      console.log(
        `${style.accent(`[${i + 1}]`)} ${style.subheader(n.title)} ${style.dim(
          `(${n.tag})`
        )}`
      );
      console.log(`${style.dim('    ' + n.body.slice(0, 70))}${n.body.length > 70 ? style.dim('…') : ''}`);
      console.log(style.dim(`    ${n.date}\n`));
    });

    if (limit && notes.length > limit) {
      console.log(style.dim(`... and ${notes.length - limit} more\n`));
    }
  }

  static async add(rl) {
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log(style.header('\n✦ ADD NOTE\n'));
    
    const title = await question(style.prompt('Title: '));
    if (!validateInput(title, 'string')) {
      console.log(style.warning('\n⚠ Title cannot be empty.\n'));
      return;
    }

    const body = await question(style.prompt('Content: '));
    if (!validateInput(body, 'string')) {
      console.log(style.warning('\n⚠ Content cannot be empty.\n'));
      return;
    }

    console.log(
      style.dim(
        '\nCategories: lecture, reading, summary, formula, question, idea, other'
      )
    );
    const tag = await question(style.prompt('Category (default: other): '));
    const validTags = ['lecture', 'reading', 'summary', 'formula', 'question', 'idea', 'other'];
    const selectedTag = validTags.includes(tag.toLowerCase()) ? tag.toLowerCase() : 'other';

    const notes = loadData(FILES.notes, []);
    notes.unshift({
      id: Date.now(),
      title: sanitizeInput(title),
      body: sanitizeInput(body),
      tag: selectedTag,
      date: new Date().toLocaleDateString(),
    });

    if (saveData(FILES.notes, notes)) {
      console.log(style.success('\n✓ Note saved!\n'));
    }
  }

  static async delete(rl) {
    const notes = loadData(FILES.notes, []);
    if (!notes.length) {
      console.log(style.dim('\nNo notes to delete.\n'));
      return;
    }

    this.show(5);
    
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    const idx = await question(style.prompt('Delete note #: '));
    const i = parseInt(idx) - 1;

    if (i >= 0 && i < notes.length) {
      const removed = notes.splice(i, 1)[0];
      saveData(FILES.notes, notes);
      console.log(style.success(`\n✓ Deleted: "${removed.title}"\n`));
    } else {
      console.log(style.error('\n✕ Invalid note number.\n'));
    }
  }

  static export() {
    const notes = loadData(FILES.notes, []);
    if (!notes.length) {
      console.log(style.dim('\nNo notes to export.\n'));
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `tryit-notes-${timestamp}.txt`;
    const filepath = path.join(process.cwd(), filename);

    let content = `TRYIT NOTES EXPORT\n${timestamp}\n${'═'.repeat(50)}\n\n`;
    notes.forEach((n) => {
      content += `[${n.date}] [${n.tag.toUpperCase()}] ${n.title}\n${'─'.repeat(50)}\n${n.body}\n\n`;
    });

    try {
      fs.writeFileSync(filepath, content);
      console.log(style.success(`\n✓ Exported to: ${filepath}\n`));
    } catch (e) {
      console.log(style.error(`\n✕ Export failed: ${e.message}\n`));
    }
  }
}

// ══════════════════════════════════
// FLASHCARDS (IMPROVED)
// ══════════════════════════════════
class CardsManager {
  static show(limit = null) {
    const cards = loadData(FILES.cards, []);
    if (!cards.length) {
      console.log(style.dim('\nNo flashcards yet. Start learning! ✧\n'));
      return;
    }

    console.log(style.header(`\n✧ YOUR FLASHCARDS (${cards.length})\n`));
    const display = limit ? cards.slice(0, limit) : cards;
    
    display.forEach((c, i) => {
      console.log(`${style.accent(`[${i + 1}]`)} ${style.subheader(c.front)}`);
      console.log(`${style.dim(`     ↳ ${c.back}\n`)}`);
    });

    if (limit && cards.length > limit) {
      console.log(style.dim(`... and ${cards.length - limit} more\n`));
    }
  }

  static async add(rl) {
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log(style.header('\n✧ ADD FLASHCARD\n'));
    const front = await question(style.prompt('Front (Question): '));
    
    if (!validateInput(front, 'string')) {
      console.log(style.warning('\n⚠ Front side cannot be empty.\n'));
      return;
    }

    const back = await question(style.prompt('Back (Answer): '));
    
    if (!validateInput(back, 'string')) {
      console.log(style.warning('\n⚠ Back side cannot be empty.\n'));
      return;
    }

    const cards = loadData(FILES.cards, []);
    cards.push({ 
      id: Date.now(),
      front: sanitizeInput(front), 
      back: sanitizeInput(back) 
    });
    
    if (saveData(FILES.cards, cards)) {
      console.log(style.success(`\n✓ Card added! (Total: ${cards.length})\n`));
    }
  }

  static async quiz(rl) {
    const cards = loadData(FILES.cards, []);
    if (!cards.length) {
      console.log(style.dim('\nNo cards to quiz.\n'));
      return;
    }

    console.log(style.header('\n✧ FLASHCARD QUIZ\n'));
    
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    let correct = 0;

    for (let i = 0; i < shuffled.length; i++) {
      const card = shuffled[i];
      console.log(style.accent(`\n[${i + 1}/${shuffled.length}]`));
      console.log(`${style.subheader(card.front)}\n`);

      const answer = await question(style.prompt('Your answer (or "s" to skip): '));

      if (answer.toLowerCase() === 's') {
        console.log(`${style.dim('Skipped.')} ${style.dim(`Answer: ${card.back}`)}`);
      } else if (answer.toLowerCase().includes(card.back.toLowerCase().slice(0, 3))) {
        console.log(style.success('✓ Correct!'));
        correct++;
      } else {
        console.log(style.warning(`✕ Wrong. Answer: ${card.back}`));
      }
    }

    const percent = Math.round((correct / shuffled.length) * 100);
    console.log(
      `\n${style.header('QUIZ COMPLETE')}\nScore: ${style.accent(
        `${correct}/${shuffled.length}`
      )} (${percent}%)\n`
    );
  }

  static async delete(rl) {
    const cards = loadData(FILES.cards, []);
    if (!cards.length) {
      console.log(style.dim('\nNo cards to delete.\n'));
      return;
    }

    this.show(5);
    
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    const idx = await question(style.prompt('Delete card #: '));
    const i = parseInt(idx) - 1;

    if (i >= 0 && i < cards.length) {
      const removed = cards.splice(i, 1)[0];
      saveData(FILES.cards, cards);
      console.log(style.success(`\n✓ Deleted: "${removed.front}"\n`));
    } else {
      console.log(style.error('\n✕ Invalid card number.\n'));
    }
  }
}

// ══════════════════════════════════
// TASKS (IMPROVED)
// ══════════════════════════════════
class TodosManager {
  static show() {
    const todos = loadData(FILES.todos, []);
    if (!todos.length) {
      console.log(style.dim('\nNo tasks yet. Add one to get started! ✿\n'));
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
  }

  static async add(rl) {
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log(style.header('\n✿ ADD TASK\n'));
    const text = await question(style.prompt('Task: '));

    if (!validateInput(text, 'string')) {
      console.log(style.dim('\nCancelled.\n'));
      return;
    }

    const todos = loadData(FILES.todos, []);
    todos.push({ 
      text: sanitizeInput(text), 
      done: false, 
      id: Date.now(),
      created: new Date().toLocaleDateString(),
    });
    
    if (saveData(FILES.todos, todos)) {
      console.log(style.success(`\n✓ Task added! (Total: ${todos.length})\n`));
    }
  }

  static async toggle(rl) {
    const todos = loadData(FILES.todos, []);
    if (!todos.length) {
      console.log(style.dim('\nNo tasks.\n'));
      return;
    }

    this.show();

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    const idx = await question(style.prompt('Toggle task #: '));
    const i = parseInt(idx) - 1;

    if (i >= 0 && i < todos.length) {
      const wasEmpty = !todos.find((t) => t.done);
      todos[i].done = !todos[i].done;
      saveData(FILES.todos, todos);

      if (todos[i].done) {
        console.log(style.success('\n✓ Task completed! 🎉\n'));
      } else {
        console.log(style.warning('\n↻ Task reopened.\n'));
      }
    } else {
      console.log(style.error('\n✕ Invalid task number.\n'));
    }
  }

  static async delete(rl) {
    const todos = loadData(FILES.todos, []);
    if (!todos.length) {
      console.log(style.dim('\nNo tasks.\n'));
      return;
    }

    this.show();

    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    const idx = await question(style.prompt('Delete task #: '));
    const i = parseInt(idx) - 1;

    if (i >= 0 && i < todos.length) {
      const removed = todos.splice(i, 1)[0];
      saveData(FILES.todos, todos);
      console.log(style.success(`\n✓ Deleted: "${removed.text}"\n`));
    } else {
      console.log(style.error('\n✕ Invalid task number.\n'));
    }
  }
}

// ══════════════════════════════════
// MOOD (IMPROVED)
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

class MoodManager {
  static async log(rl) {
    const question = (prompt) =>
      new Promise((resolve) => rl.question(prompt, resolve));

    console.log(style.header('\n♡ MOOD CHECK-IN\n'));
    MOODS.forEach((m, i) => {
      console.log(`  ${style.accent(`[${i + 1}]`)} ${m.emoji} ${m.label}`);
    });

    const idx = await question(style.prompt('Your mood (#): '));
    const i = parseInt(idx) - 1;

    if (i < 0 || i >= MOODS.length) {
      console.log(style.error('\n✕ Invalid selection.\n'));
      return;
    }

    const note = await question(style.prompt('Note (optional): '));
    const mood = MOODS[i];

    const moods = loadData(FILES.moods, []);
    moods.unshift({
      emoji: mood.emoji,
      label: mood.label,
      note: note ? sanitizeInput(note) : '',
      date: new Date().toLocaleDateString(),
      time: new Date().toTimeString().slice(0, 5),
    });
    
    if (saveData(FILES.moods, moods.slice(0, 50))) {
      console.log(style.success(`\n✓ Mood logged ${mood.emoji}\n`));
    }
  }

  static show(limit = 15) {
    const moods = loadData(FILES.moods, []);
    if (!moods.length) {
      console.log(style.dim('\nNo moods logged.\n'));
      return;
    }

    console.log(style.header('\n♡ MOOD HISTORY\n'));
    const display = moods.slice(0, limit);
    
    display.forEach((m) => {
      const noteStr = m.note ? ` — ${m.note}` : '';
      console.log(
        `  ${m.emoji} ${style.subheader(m.label)}${noteStr}`
      );
      console.log(style.dim(`     ${m.date} ${m.time}\n`));
    });

    if (moods.length > limit) {
      console.log(style.dim(`... and ${moods.length - limit} more\n`));
    }
  }

  static getStreak() {
    const moods = loadData(FILES.moods, []);
    if (!moods.length) return 0;

    let streak = 0;
    const today = new Date().toLocaleDateString();
    let checkDate = new Date();

    for (const mood of moods) {
      const moodDate = mood.date;
      const checkStr = checkDate.toLocaleDateString();

      if (moodDate === checkStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
}

// ══════════════════════════════════
// RANKING SYSTEM
// ══════════════════════════════════
class RankingSystem {
  static show() {
    const distance = getDistance();
    const currentRank = getCurrentRank(distance);
    const nextRank = getNextRank(distance);

    console.log(style.header('\n🌌 GALACTIC RANKING\n'));
    console.log(style.accent(`Distance: ${distance}m`));
    console.log(style.subheader(`Current: ${currentRank.rank}`));
    console.log(style.dim(`"${currentRank.description}"\n`));

    RANKS.forEach((r) => {
      const isCurrent = r.rank === currentRank.rank;
      const marker = isCurrent ? style.accent('→ ') : '  ';
      const rankText = isCurrent ? style.bright(r.rank) : r.rank;
      const dist = isCurrent 
        ? style.accent(`${r.dist}m`)
        : style.dim(`${r.dist}m`);
      console.log(`${marker}${rankText} ${style.dim(`(${dist}+)`)}`);
    });

    if (nextRank.rank !== currentRank.rank) {
      const needed = nextRank.dist - distance;
      console.log(
        `\n${style.info(`↳ ${needed}m until ${nextRank.emoji} ${nextRank.label}`)}\n`
      );
    } else {
      console.log(style.success('\n✓ You have reached the highest rank!\n'));
    }
  }
}

// ══════════════════════════════════
// STATISTICS & DASHBOARD
// ══════════════════════════════════
class Dashboard {
  static show() {
    const notes = loadData(FILES.notes, []);
    const cards = loadData(FILES.cards, []);
    const todos = loadData(FILES.todos, []);
    const sessions = loadData(FILES.sessions, []);
    const moods = loadData(FILES.moods, []);
    const distance = getDistance();
    const rank = getCurrentRank(distance);
    const streak = MoodManager.getStreak();

    console.log(style.header('\n📊 DASHBOARD\n'));

    console.log(style.subheader('📝 NOTES'));
    console.log(`   Total: ${style.accent(notes.length.toString())}`);
    if (notes.length) {
      console.log(`   Latest: "${notes[0].title}" (${notes[0].tag})`);
    }

    console.log(style.subheader('\n✧ FLASHCARDS'));
    console.log(`   Total: ${style.accent(cards.length.toString())}`);
    if (cards.length) {
      console.log(`   Latest: "${cards[cards.length - 1].front}"`);
    }

    console.log(style.subheader('\n✿ TASKS'));
    const todoDone = todos.filter((t) => t.done).length;
    const todoPct = todos.length ? Math.round((todoDone / todos.length) * 100) : 0;
    console.log(`   Total: ${style.accent(todos.length.toString())}`);
    console.log(`   Done: ${style.success(`${todoDone}/${todos.length}`)} (${todoPct}%)`);

    console.log(style.subheader('\n🍅 SESSIONS'));
    console.log(`   Total: ${style.accent(sessions.length.toString())} sessions`);
    if (sessions.length) {
      const totalTime = sessions.reduce((sum, s) => sum + s.mins, 0);
      console.log(`   Total time: ${style.accent(totalTime.toString())} minutes`);
      console.log(`   Last session: ${sessions[0].label} on ${sessions[0].date}`);
    }

    console.log(style.subheader('\n🌌 RANKING'));
    console.log(`   Rank: ${style.accent(rank.rank)}`);
    console.log(`   Distance: ${style.accent(`${distance}m`)}`);

    console.log(style.subheader('\n♡ MOOD'));
    console.log(`   Total logged: ${style.accent(moods.length.toString())}`);
    console.log(`   Current streak: ${style.accent(streak.toString())} day${streak !== 1 ? 's' : ''}`);

    console.log();
  }
}

// ══════════════════════════════════
// MAIN MENU & INTERFACE
// ══════════════════════════════════
const showMainMenu = () => {
  console.log(style.header('\n✦ TRYIT — COSMIC STUDY STATION ✦\n'));
  console.log(style.dim('┌─────────────────────────────────┐'));
  console.log(style.dim('│') + ' ' + style.accent('STUDY TOOLS') + style.dim(' │'));
  console.log(style.dim('├─────────────────────────────────┤'));
  
  const menus = [
    [' 1', 'timer    ', 'Start Pomodoro timer', '🍅'],
    [' 2', 'notes    ', 'View/manage notes', '✦'],
    [' 3', 'cards    ', 'Flashcards & quiz', '✧'],
    [' 4', 'tasks    ', 'Task checklist', '✿'],
    [' 5', 'mood     ', 'Mood tracking', '♡'],
    [' 6', 'wisdom   ', 'Get inspiration', '💬'],
    ['─', '─────────', '─────────────────────', '─'],
    [' 7', 'ranks    ', 'View galactic ranking', '🌌'],
    [' 8', 'dashboard', 'Statistics overview', '📊'],
    [' 9', 'help     ', 'Show help', '❓'],
    [' 0', 'quit     ', 'Exit app', '🚪'],
  ];

  menus.forEach(([num, cmd, desc, icon]) => {
    if (num === '─') {
      console.log(style.dim('├─────────────────────────────────┤'));
    } else {
      console.log(
        style.dim('│') +
          ` ${icon} ${style.accent(num)} ${style.dim(cmd)} ${style.dim(desc)} ${style.dim('│')}`
      );
    }
  });

  console.log(style.dim('└─────────────────────────────────┘'));
  console.log();
};

const showHelp = () => {
  console.log(style.header('\n❓ HELP & GUIDE\n'));
  
  const helpText = `
${style.subheader('🍅 TIMER')}
  Start focused study sessions using the Pomodoro technique.
  Default: 25 minutes | Other presets: 5, 15, 45, 90 minutes
  Tracks distance in galactic system!

${style.subheader('✦ NOTES')}
  Save study notes with categories for easy organization.
  Export all notes to a .txt file for backup.

${style.subheader('✧ FLASHCARDS')}
  Create digital flashcards for spaced repetition learning.
  Quiz mode shuffles and tests your knowledge!

${style.subheader('✿ TASKS')}
  Organize your study checklist and track progress.
  Check off completed tasks as you go.

${style.subheader('♡ MOOD')}
  Track your emotional state during study sessions.
  Streak counter shows consecutive days logged!

${style.subheader('🌌 RANKING')}
  Earn ranks based on total study time (distance).
  Space Cadet → Moon Walker → ... → Galactic Overlord
  Each minute = 10 meters of distance!

${style.subheader('💬 WISDOM')}
  Get daily inspiration from philosophers & motivational quotes.
  Try: wisdom, bronte, kant, vibe, heroic

${style.subheader('SHORTCUTS')}
  In any prompt, type 'q' or 'back' to return to menu
  Use 's' in quiz to skip questions

${style.subheader('DATA')}
  All data stored in: ~/.tryit/
  Backup: run "export" in notes menu
`;

  console.log(helpText);
};

// ══════════════════════════════════
// MAIN APPLICATION LOOP
// ══════════════════════════════════
const main = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const question = (prompt) =>
    new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        if (answer.toLowerCase() === 'q' || answer.toLowerCase() === 'back') {
          resolve('__back__');
        } else {
          resolve(answer);
        }
      });
    });

  // Boot sequence
  console.clear();
  console.log(style.header('\n✦ tryit — cosmic study station ✦\n'));
  console.log(style.dim('loading cosmic-os 1.0...'));
  await new Promise((r) => setTimeout(r, 200));
  console.log(style.dim('mounting kirbs.pomodoro modules...'));
  await new Promise((r) => setTimeout(r, 200));
  console.log(style.dim('initialising mochi companion...'));
  await new Promise((r) => setTimeout(r, 200));
  console.log(style.dim('syncing study.girl station...'));
  await new Promise((r) => setTimeout(r, 200));
  console.log(style.dim('calibrating galactic ranking system...'));
  await new Promise((r) => setTimeout(r, 200));
  console.log(style.success('✓ all systems ready — welcome, pilot!\n'));
  await new Promise((r) => setTimeout(r, 800));

  let running = true;

  while (running) {
    console.clear();
    showMainMenu();

    const cmd = await question(
      `${style.prompt('select option')}: `
    );

    const c = cmd.trim();

    switch (c) {
      case '1':
      case 'timer':
        const minsInput = await question(style.prompt('Minutes (default 25): '));
        const mins = parseInt(minsInput) || 25;
        if (mins > 0 && mins <= 999) {
          const timer = new Timer();
          await timer.start(mins, 'study session');
          
          const sessions = loadData(FILES.sessions, []);
          const dist = mins * 10;
          const totalDist = getDistance() + dist;
          setDistance(totalDist);
          
          sessions.unshift({
            label: 'Study Session',
            mins,
            dist,
            date: new Date().toLocaleDateString(),
            time: new Date().toTimeString().slice(0, 5),
          });
          saveData(FILES.sessions, sessions.slice(0, 50));
          
          console.log(getWisdomResponse());
          console.log(
            style.info(
              `\n+${dist}m distance! Now: ${style.accent(getCurrentRank(totalDist).rank)}\n`
            )
          );
          await question(style.prompt('Press Enter to continue...'));
        } else {
          console.log(style.warning('\n⚠ Invalid time. Please enter 1-999 minutes.\n'));
          await question(style.prompt('Press Enter to continue...'));
        }
        break;

      case '2':
      case 'notes':
        let notesLoop = true;
        while (notesLoop) {
          console.clear();
          NotesManager.show(8);
          const nCmd = await question(
            style.prompt('(v)iew all, (a)dd, (d)elete, (e)xport, or back? ').toUpperCase()
          );
          const nc = nCmd.toLowerCase().trim();
          if (nc === 'a') await NotesManager.add(rl);
          else if (nc === 'd') await NotesManager.delete(rl);
          else if (nc === 'e') NotesManager.export();
          else if (nc === 'v') {
            console.clear();
            NotesManager.show();
            await question(style.prompt('Press Enter...'));
          } else if (nc === '__back__' || nc === 'q') notesLoop = false;
        }
        break;

      case '3':
      case 'cards':
        let cardsLoop = true;
        while (cardsLoop) {
          console.clear();
          CardsManager.show(8);
          const cCmd = await question(
            style.prompt('(v)iew all, (a)dd, (q)uiz, (d)elete, or back?').toUpperCase()
          );
          const cc = cCmd.toLowerCase().trim();
          if (cc === 'a') await CardsManager.add(rl);
          else if (cc === 'q') await CardsManager.quiz(rl);
          else if (cc === 'd') await CardsManager.delete(rl);
          else if (cc === 'v') {
            console.clear();
            CardsManager.show();
            await question(style.prompt('Press Enter...'));
          } else if (cc === '__back__' || cc === 'q') cardsLoop = false;
        }
        break;

      case '4':
      case 'tasks':
        let tasksLoop = true;
        while (tasksLoop) {
          console.clear();
          TodosManager.show();
          const tCmd = await question(
            style.prompt('(a)dd, (t)oggle, (d)elete, or back?').toUpperCase()
          );
          const tc = tCmd.toLowerCase().trim();
          if (tc === 'a') await TodosManager.add(rl);
          else if (tc === 't') await TodosManager.toggle(rl);
          else if (tc === 'd') await TodosManager.delete(rl);
          else if (tc === '__back__' || tc === 'q') tasksLoop = false;
        }
        break;

      case '5':
      case 'mood':
        let moodLoop = true;
        while (moodLoop) {
          console.clear();
          const mCmd = await question(
            style.prompt('(l)og mood, (h)istory, or back?').toUpperCase()
          );
          const mc = mCmd.toLowerCase().trim();
          if (mc === 'l') await MoodManager.log(rl);
          else if (mc === 'h') {
            console.clear();
            MoodManager.show();
            await question(style.prompt('Press Enter...'));
          } else if (mc === '__back__' || mc === 'q') moodLoop = false;
        }
        break;

      case '6':
      case 'wisdom':
        const wCmd = await question(
          style.prompt(
            'Category (bronte/kant/lyrics/heroic/vibe/wisdom/iro) or ask: '
          )
        );
        const wisdom = getWisdomResponse(wCmd);
        console.log(`\n${style.subheader('✦ kirbs')} ${wisdom}\n`);
        await question(style.prompt('Press Enter...'));
        break;

      case '7':
      case 'ranks':
        RankingSystem.show();
        await question(style.prompt('Press Enter...'));
        break;

      case '8':
      case 'dashboard':
        Dashboard.show();
        await question(style.prompt('Press Enter...'));
        break;

      case '9':
      case 'help':
        showHelp();
        await question(style.prompt('Press Enter...'));
        break;

      case '0':
      case 'q':
      case 'quit':
      case 'exit':
        console.log(
          style.success(
            '\n✦ Rest well, pilot. May your studies reach for the stars! ✦\n'
          )
        );
        rl.close();
        running = false;
        break;

      default:
        console.log(style.warning('\n⚠ Unknown command. Try again.\n'));
        await question(style.prompt('Press Enter...'));
    }
  }
};

// ══════════════════════════════════
// ERROR HANDLING & STARTUP
// ══════════════════════════════════
process.on('uncaughtException', (err) => {
  console.error(style.error(`\n✕ ERROR: ${err.message}\n`));
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(
    style.success('\n\n✦ See you next time, cosmic pilot! ✦\n')
  );
  process.exit(0);
});

main().catch(console.error);
