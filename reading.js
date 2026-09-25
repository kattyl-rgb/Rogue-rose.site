const majorArcana = [
  ['0','The Fool'],['I','The Magician'],['II','The High Priestess'],['III','The Empress'],['IV','The Emperor'],['V','The Hierophant'],['VI','The Lovers'],['VII','The Chariot'],['VIII','Strength'],['IX','The Hermit'],['X','Wheel of Fortune'],['XI','Justice'],['XII','The Hanged One'],['XIII','Death'],['XIV','Temperance'],['XV','The Devil'],['XVI','The Tower'],['XVII','The Star'],['XVIII','The Moon'],['XIX','The Sun'],['XX','Judgement'],['XXI','The World']
].map(([roman, name], artIndex) => ({ roman, name, artIndex, kind:'illustrated' }));

const suits = [
  { name:'Wands', symbol:'♜', accent:'wand' },
  { name:'Cups', symbol:'♛', accent:'cup' },
  { name:'Swords', symbol:'†', accent:'sword' },
  { name:'Pentacles', symbol:'✦', accent:'pentacle' }
];
const ranks = ['Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
const courtRanks = ['Page','Knight','Queen','King'];
const rankMarks = ['A','II','III','IV','V','VI','VII','VIII','IX','X'];

const minorArcana = suits.flatMap((suit, suitIndex) => {
  const numbered = ranks.map((rank, rankIndex) => ({
    roman:rankMarks[rankIndex], name:`${rank} of ${suit.name}`, suit:suit.name,
    symbol:suit.symbol, accent:suit.accent, pips:rankIndex + 1, kind:'symbolic'
  }));
  const court = courtRanks.map((rank, courtIndex) => ({
    roman:suit.symbol, name:`${rank} of ${suit.name}`, suit:suit.name,
    accent:suit.accent, artIndex:22 + (suitIndex * 4) + courtIndex, kind:'illustrated'
  }));
  return [...numbered, ...court];
});

const cards = [...majorArcana, ...minorArcana];
let spreadCount = 1;
let busy = false;
const status = document.querySelector('#reading-status');
const table = document.querySelector('#card-table');
const readingBox = document.querySelector('#ai-reading');
const readingText = document.querySelector('#ai-reading-text');
const drawButton = document.querySelector('#draw-cards');

document.querySelector('#year').textContent = new Date().getFullYear();

document.querySelectorAll('.spread-button').forEach((button) => {
  button.addEventListener('click', () => {
    if (busy) return;
    spreadCount = Number(button.dataset.count);
    document.querySelectorAll('.spread-button').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  });
});

function shuffle(list) {
  const copy = [...list];
  const random = new Uint32Array(copy.length);
  crypto.getRandomValues(random);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = random[i] % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function illustratedArt(card) {
  const column = card.artIndex % 8;
  const row = Math.floor(card.artIndex / 8);
  return `<div class="card-illustration" style="background-position:${(column / 7) * 100}% ${(row / 4) * 100}%" aria-hidden="true"></div>`;
}

function symbolicArt(card) {
  const pips = Array.from({ length:card.pips }, () => `<span>${card.symbol}</span>`).join('');
  return `<div class="pip-illustration ${card.accent}" aria-hidden="true"><i class="puppet-string"></i><div class="pip-grid pips-${card.pips}">${pips}</div><b>❦</b></div>`;
}

function revealCards(chosen) {
  table.innerHTML = '';
  const labels = spreadCount === 3 ? ['Past', 'Present', 'Future'] : ['Your message'];
  chosen.forEach((card, index) => {
    const article = document.createElement('article');
    article.className = 'drawn-card';
    article.style.setProperty('--delay', `${index * 140}ms`);
    const artwork = card.kind === 'illustrated' ? illustratedArt(card) : symbolicArt(card);
    article.innerHTML = `<p class="position-label">${labels[index]}</p><div class="tarot-face ${card.orientation === 'Reversed' ? 'reversed' : ''}"><span class="card-roman">${card.roman}</span>${artwork}<h3>${card.name}</h3><span class="card-rose">❦</span></div><p class="orientation">${card.orientation}</p>`;
    table.appendChild(article);
  });
}

function showReading(text) {
  readingText.textContent = text;
  readingBox.hidden = false;
  document.querySelector('#reading-actions').hidden = false;
  readingBox.scrollIntoView({ behavior:'smooth', block:'start' });
}

drawButton.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  drawButton.disabled = true;
  readingBox.hidden = true;
  document.querySelector('#reading-actions').hidden = true;
  const labels = spreadCount === 3 ? ['Past', 'Present', 'Future'] : ['Your message'];
  const chosen = shuffle(cards).slice(0, spreadCount).map((card, index) => ({
    ...card, position:labels[index],
    orientation:crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0 ? 'Upright' : 'Reversed'
  }));
  status.textContent = 'The full 78-card deck is turning…';
  revealCards(chosen);
  await new Promise((resolve) => setTimeout(resolve, 850));
  status.textContent = 'The cards are listening. Your interpretation is forming…';

  try {
    const response = await fetch('/.netlify/functions/tarot-reading', {
      method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ question:document.querySelector('#tarot-question').value.trim(), cards:chosen.map(({ name, position, orientation }) => ({ name, position, orientation })) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The reading could not be completed.');
    showReading(data.reading);
    status.textContent = 'Your reading is ready.';
  } catch (error) {
    status.textContent = error.message || 'The connection went quiet. Please try again.';
    document.querySelector('#reading-actions').hidden = false;
  } finally {
    busy = false;
    drawButton.disabled = false;
  }
});

document.querySelector('#new-reading').addEventListener('click', () => {
  table.innerHTML = '';
  readingBox.hidden = true;
  document.querySelector('#reading-actions').hidden = true;
  status.textContent = '';
  document.querySelector('#tarot-question').focus();
  window.scrollTo({ top:0, behavior:'smooth' });
});
