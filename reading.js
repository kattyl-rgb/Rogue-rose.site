const cards = [
  ['0','The Fool'],['I','The Magician'],['II','The High Priestess'],['III','The Empress'],['IV','The Emperor'],['V','The Hierophant'],['VI','The Lovers'],['VII','The Chariot'],['VIII','Strength'],['IX','The Hermit'],['X','Wheel of Fortune'],['XI','Justice'],['XII','The Hanged One'],['XIII','Death'],['XIV','Temperance'],['XV','The Devil'],['XVI','The Tower'],['XVII','The Star'],['XVIII','The Moon'],['XIX','The Sun'],['XX','Judgement'],['XXI','The World']
];

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

function revealCards(chosen) {
  table.innerHTML = '';
  const labels = spreadCount === 3 ? ['Past', 'Present', 'Future'] : ['Your message'];
  chosen.forEach((card, index) => {
    const article = document.createElement('article');
    article.className = 'drawn-card';
    article.style.setProperty('--delay', `${index * 140}ms`);
    article.innerHTML = `<p class="position-label">${labels[index]}</p><div class="tarot-face ${card.orientation === 'Reversed' ? 'reversed' : ''}"><span class="card-roman">${card.roman}</span><div class="marionette-mark"><i></i><b>✦</b><i></i></div><h3>${card.name}</h3><span class="card-rose">❦</span></div><p class="orientation">${card.orientation}</p>`;
    table.appendChild(article);
  });
}

function showReading(text) {
  readingText.textContent = text;
  readingBox.hidden = false;
  document.querySelector('#reading-actions').hidden = false;
  readingBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

drawButton.addEventListener('click', async () => {
  if (busy) return;
  busy = true;
  drawButton.disabled = true;
  readingBox.hidden = true;
  document.querySelector('#reading-actions').hidden = true;
  const labels = spreadCount === 3 ? ['Past', 'Present', 'Future'] : ['Your message'];
  const chosen = shuffle(cards).slice(0, spreadCount).map((card, index) => ({
    roman: card[0],
    name: card[1],
    position: labels[index],
    orientation: crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0 ? 'Upright' : 'Reversed'
  }));
  status.textContent = 'The deck is turning…';
  revealCards(chosen);
  await new Promise((resolve) => setTimeout(resolve, 850));
  status.textContent = 'The cards are listening. Your interpretation is forming…';

  try {
    const response = await fetch('/.netlify/functions/tarot-reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: document.querySelector('#tarot-question').value.trim(), cards: chosen })
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
