(() => {
  const storageKey = 'rogueRoseDisclosureAcceptedV1';
  const footer = document.querySelector('.site-footer');

  if (footer && !footer.querySelector('.site-disclosures')) {
    const disclosures = document.createElement('div');
    disclosures.className = 'site-disclosures';
    disclosures.innerHTML = `
      <p><strong>Important disclosures:</strong> Tarot and Ouija-style experiences are AI-generated entertainment and tools for personal reflection—not actual spirit contact or medical, legal, financial, mental-health, or crisis advice. Results and outcomes are not guaranteed. Visitors must be 18 or older to purchase services or products.</p>
      <p>Do not submit passwords, payment details, medical records, Social Security numbers, or another person’s private information. <a href="legal.html">Read the full Terms, Privacy Policy, Refund Policy, and Disclosures.</a></p>`;
    footer.append(disclosures);
  }

  let accepted = false;
  try { accepted = localStorage.getItem(storageKey) === 'yes'; } catch (_) {}
  if (accepted) return;

  const modal = document.createElement('div');
  modal.className = 'disclosure-gate';
  modal.innerHTML = `
    <div class="disclosure-backdrop" aria-hidden="true"></div>
    <section class="disclosure-dialog" role="dialog" aria-modal="true" aria-labelledby="disclosure-title" aria-describedby="disclosure-copy">
      <p class="eyebrow">Before You Enter</p>
      <h2 id="disclosure-title">A quick reality check.</h2>
      <div id="disclosure-copy" class="disclosure-copy">
        <p>Rogue Rose tarot and Ouija-style experiences use AI and are offered for entertainment and personal reflection. They do not provide actual spirit contact, guaranteed predictions, or professional advice.</p>
        <p>Please do not enter sensitive personal information. You must be 18 or older to make a purchase. An account is optional—you may continue as a guest.</p>
      </div>
      <label class="disclosure-check"><input id="disclosure-agree" type="checkbox"> <span>I understand and agree to the <a href="legal.html">Terms, Privacy Policy, and Disclosures</a>.</span></label>
      <button id="disclosure-continue" class="button button-primary" type="button" disabled>Continue as guest</button>
    </section>`;
  document.body.append(modal);
  document.body.classList.add('disclosure-open');

  const checkbox = modal.querySelector('#disclosure-agree');
  const continueButton = modal.querySelector('#disclosure-continue');
  checkbox.addEventListener('change', () => { continueButton.disabled = !checkbox.checked; });
  continueButton.addEventListener('click', () => {
    try { localStorage.setItem(storageKey, 'yes'); } catch (_) {}
    modal.remove();
    document.body.classList.remove('disclosure-open');
  });
  checkbox.focus();
})();
