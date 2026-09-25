const characters = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ', ...'1234567890'];
const boardCharacters = document.querySelector('#board-characters');
const planchette = document.querySelector('#moving-planchette');
const sessionLog = document.querySelector('#session-log');
const status = document.querySelector('#session-status');
const form = document.querySelector('#ouija-form');
const askButton = document.querySelector('#ask-board');
let history = [];
let sessionOpen = false;

document.querySelector('#year').textContent = new Date().getFullYear();
characters.forEach((character) => {
  const span = document.createElement('span');
  span.textContent = character;
  span.dataset.boardChar = character;
  boardCharacters.appendChild(span);
});

function addLog(role, text) {
  const entry = document.createElement('div');
  entry.className = `session-entry ${role}`;
  const label = document.createElement('span');
  label.textContent = role === 'visitor' ? 'You asked' : 'The board answered';
  const content = document.createElement('p');
  content.textContent = text;
  entry.append(label, content);
  sessionLog.appendChild(entry);
  sessionLog.scrollTop = sessionLog.scrollHeight;
}

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function moveTo(character) {
  const key = character === ' ' ? null : character.toUpperCase();
  const target = key ? document.querySelector(`[data-board-char="${CSS.escape(key)}"]`) : null;
  if (!target) { await delay(240); return; }
  const board = document.querySelector('#spirit-board').getBoundingClientRect();
  const spot = target.getBoundingClientRect();
  const x = spot.left + spot.width / 2 - board.left;
  const y = spot.top + spot.height / 2 - board.top;
  planchette.style.left = `${x}px`;
  planchette.style.top = `${y}px`;
  target.classList.add('lit');
  await delay(430 + Math.random() * 260);
  target.classList.remove('lit');
}

async function spell(message) {
  planchette.classList.add('awake');
  for (const character of message) await moveTo(character);
  planchette.classList.remove('awake');
}

document.querySelector('#begin-session').addEventListener('click', async () => {
  sessionOpen = true;
  document.querySelector('#session-start').hidden = true;
  document.querySelector('#session-live').hidden = false;
  status.textContent = 'The room settles around the board…';
  await delay(900);
  await spell('YES');
  status.textContent = 'The board is ready for a question.';
  document.querySelector('#ouija-question').focus();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!sessionOpen || askButton.disabled) return;
  const input = document.querySelector('#ouija-question');
  const question = input.value.trim();
  if (!question) return;
  addLog('visitor', question);
  input.value = '';
  askButton.disabled = true;
  status.textContent = 'The planchette grows restless…';

  try {
    const response = await fetch('/.netlify/functions/ouija-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        intention: document.querySelector('#session-intention').value.trim(),
        history: history.slice(-6)
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The connection went quiet.');
    await spell(data.message);
    addLog('board', data.message);
    history.push({ question, answer: data.message });
    status.textContent = 'The planchette comes to rest.';
  } catch (error) {
    status.textContent = error.message || 'The connection went quiet. Try again.';
  } finally {
    askButton.disabled = false;
    input.focus();
  }
});

document.querySelector('#end-session').addEventListener('click', async () => {
  sessionOpen = false;
  askButton.disabled = true;
  status.textContent = 'Closing the circle…';
  await spell('GOODBYE');
  addLog('board', 'GOODBYE');
  status.textContent = 'The session is closed.';
  form.hidden = true;
  document.querySelector('#end-session').hidden = true;
});
