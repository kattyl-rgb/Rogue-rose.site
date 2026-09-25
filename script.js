const menuButton=document.querySelector('.menu-button'),navigation=document.querySelector('.site-nav');
menuButton?.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open))});
navigation?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{navigation.classList.remove('open');menuButton?.setAttribute('aria-expanded','false')}));
document.querySelector('#year').textContent=new Date().getFullYear();
const cards=[
['0','The Fool','Begin before certainty arrives. Curiosity is opening a door that caution cannot.','Pause before the leap. Freedom without awareness can become avoidance.'],
['I','The Magician','Your tools are already on the table. Direct your will and make the first deliberate move.','Your power is scattered. Bring intention and action back into agreement.'],
['II','The High Priestess','The quiet knowing beneath the noise deserves your attention. Not everything needs revealing yet.','You may be doubting your own perception. Step away from outside voices and listen inward.'],
['III','The Empress','Nurture what is alive and growing. Beauty, care, and abundance answer steady attention.','Care has become depletion or control. Tend to yourself before giving more away.'],
['IV','The Emperor','Create structure strong enough to protect what matters. Clear limits can be an act of love.','Rigidity is pretending to be safety. Reconsider which rules still serve you.'],
['V','The Hierophant','Wisdom lives in tested traditions, trusted teachers, and shared ritual.','A borrowed belief no longer fits. Keep only what is true for you.'],
['VI','The Lovers','Make the choice that aligns desire with values. Real connection asks for honesty.','A divide between your actions and values needs attention. Avoiding the choice is still a choice.'],
['VII','The Chariot','Choose a direction and gather your conflicting impulses behind it.','Force will not replace alignment. Regain control before pushing farther.'],
['VIII','Strength','Meet the wild part gently. Courage here looks like patience, restraint, and self-trust.','Your inner critic is louder than your courage. Softness is not surrender.'],
['IX','The Hermit','Withdraw long enough to hear your own answer. Solitude can illuminate.','Isolation has stopped being medicine. Let one trustworthy light reach you.'],
['X','Wheel of Fortune','The cycle is turning. Work with change instead of asking it to stand still.','A repeated pattern wants recognition. Your response can change.'],
['XI','Justice','Look at the facts without abandoning compassion. Accountability restores balance.','Something is being judged unevenly. Name the truth cleanly.'],
['XII','The Hanged One','Stop struggling for the old angle. A willing pause reveals another view.','Waiting has become avoidance. Decide what is meaningful and what is merely delay.'],
['XIII','Death','An ending is clearing the ground. Grieve what was, then let transformation work.','Clinging is extending the ending. Release what has already changed.'],
['XIV','Temperance','Combine opposites slowly. Healing comes through rhythm and enough—not excess.','Your balance is disrupted by extremes. Return to the middle.'],
['XV','The Devil','Notice the chain you could remove. Desire is not the enemy, but denial gives it power.','The hold is weakening. Name what controlled you and choose differently.'],
['XVI','The Tower','What cannot remain is breaking open. Let truth clear the false structure.','You sense the fracture and keep bracing it. A controlled release may prevent a harsher fall.'],
['XVII','The Star','Hope returns quietly. Be honest, replenish yourself, and follow the small light.','Discouragement is narrowing your view. Rest before deciding the light is gone.'],
['XVIII','The Moon','Move carefully through uncertainty. Dreams and fears speak, but neither is the whole truth.','Confusion is lifting. Test the story against what you can actually know.'],
['XIX','The Sun','Let yourself be seen in what is true and joyful. Clarity grows when you stop shrinking it.','Joy feels blocked, not absent. Look for what is dimming it.'],
['XX','Judgement','Answer the call to become more honest than your history.','Self-condemnation is drowning out the lesson. Accountability and forgiveness must travel together.'],
['XXI','The World','A cycle is complete. Honor what you built before crossing the next threshold.','Closure needs one final act. Finish what is truly yours to finish.']];
let spreadCount=1;
document.querySelectorAll('.spread-button').forEach(button=>button.addEventListener('click',()=>{spreadCount=Number(button.dataset.count);document.querySelectorAll('.spread-button').forEach(item=>item.classList.toggle('active',item===button))}));
function shuffle(list){const copy=[...list],random=new Uint32Array(copy.length);crypto.getRandomValues(random);for(let i=copy.length-1;i>0;i--){const j=random[i]%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
document.querySelector('#draw-cards')?.addEventListener('click',()=>{const table=document.querySelector('#card-table'),status=document.querySelector('#reading-status');table.innerHTML='';status.textContent='The deck is turning…';const labels=spreadCount===3?['Past','Present','Future']:['Your message'],chosen=shuffle(cards).slice(0,spreadCount);setTimeout(()=>{chosen.forEach((card,index)=>{const reversed=crypto.getRandomValues(new Uint8Array(1))[0]%2===0,article=document.createElement('article');article.className='drawn-card';article.style.setProperty('--delay',`${index*120}ms`);article.innerHTML=`<p class="position-label">${labels[index]}</p><div class="tarot-face ${reversed?'reversed':''}"><span class="card-roman">${card[0]}</span><div class="marionette-mark"><i></i><b>✦</b><i></i></div><h3>${card[1]}</h3><span class="card-rose">❦</span></div><p class="orientation">${reversed?'Reversed':'Upright'}</p><p class="card-message">${reversed?card[3]:card[2]}</p>`;table.appendChild(article)});status.textContent=document.querySelector('#tarot-question').value.trim()?'Your question has been placed before the cards.':'Your cards have been revealed.'},650)});

const paymentMessages={subscription:'Membership checkout is reserved and ready to connect.',merch:'Merch checkout is reserved and ready to connect.',tip:'The tip page is reserved and ready to connect.'};
document.querySelectorAll('[data-payment-placeholder]').forEach(button=>button.addEventListener('click',()=>{const status=document.querySelector('#payment-status');status.textContent=`${paymentMessages[button.dataset.paymentPlaceholder]} No payment information is being collected yet.`;}));
