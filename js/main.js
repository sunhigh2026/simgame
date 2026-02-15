import { INDUSTRIES, COMPANY_TYPES, FISCAL_MONTHS, TAX_RATES } from './data.js';
import { buildDeck, drawHand } from './cards.js';
import { createInitialState, processMonthEnd, processSettlement, applyCardEffect, applyPassiveRevenue } from './game.js';
import { render, append, money, moneyClass, titleScreen, statusBar, dialogBox, industryChoices, companyTypeChoices, capitalSlider, salarySlider, cardHand, monthResultView, monthEndView, monthlyPLView, settlementView, endingScreen } from './ui.js';
import { getEventsForMonth } from './events.js';

let state = createInitialState();
let selectedCardIds = [];

function showTitle() {
  render(titleScreen());
  on('btn-start', startSetup);
}

function startSetup() {
  render(`
    <div class="section-label fade-in">業種を選ぶ</div>
    ${dialogBox('（あなたの心の声）', '何で起業するか。\nこれが最初の、最大の選択だ。')}
    ${industryChoices(INDUSTRIES)}
  `);
  for (const key of Object.keys(INDUSTRIES)) {
    onData('industry', key, () => { state.industry = INDUSTRIES[key]; chooseCompanyType(); });
  }
}

function chooseCompanyType() {
  render(`
    <div class="section-label fade-in">会社の形態</div>
    ${dialogBox('（あなた）', `${state.industry.icon} ${state.industry.name}で勝負する。\nまずは会社を作らないと。`)}
    ${companyTypeChoices(COMPANY_TYPES)}
  `);
  for (const key of Object.keys(COMPANY_TYPES)) {
    onData('company-type', key, () => {
      state.companyType = COMPANY_TYPES[key];
      state.personalCash -= state.companyType.cost;
      state.creditScore += state.companyType.creditBonus;
      inputCompanyName();
    });
  }
}

function inputCompanyName() {
  render(`
    <div class="section-label fade-in">社名を決める</div>
    ${dialogBox('（あなた）', `${state.companyType.name}で設立する。\n設立費用 ${money(state.companyType.cost)}、痛いけど必要経費だ。\n\n……会社の名前、どうしよう。`)}
    <div class="slider-container fade-in">
      <label>会社名</label>
      <input type="text" id="company-name-input" placeholder="例：ナホンテック"
        style="width:100%;padding:12px;font-size:16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:var(--bg-card);color:var(--text-primary);font-family:var(--font-main);outline:none;">
    </div>
    <button class="btn btn-primary fade-in fade-in-delay-2" id="btn-name-confirm">決定</button>
  `);
  on('btn-name-confirm', () => {
    const name = document.getElementById('company-name-input').value.trim();
    if (!name) return;
    state.companyName = name;
    setCapital();
  });
}

function setCapital() {
  const maxCapital = Math.max(100000, state.personalCash - state.industry.initialCost - 500000);
  render(`
    <div class="section-label fade-in">資本金</div>
    ${dialogBox('（あなた）', `資本金を決める。\n会社に入れるお金だ。多いほど会社は安定するけど、\n自分の生活費がなくなる……。`)}
    ${capitalSlider(maxCapital)}
    <div id="capital-warning"></div>
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-capital-confirm">この資本金で設立する</button>
  `);

  const slider = document.getElementById('capital-slider');
  const display = document.getElementById('capital-display');
  const detail = document.getElementById('capital-detail');
  const warning = document.getElementById('capital-warning');

  function update() {
    const val = parseInt(slider.value);
    display.textContent = money(val);
    const remaining = state.personalCash - state.industry.initialCost - val;
    detail.innerHTML = `
      <div class="detail-row"><span>手元の貯金</span><span class="detail-value">${money(state.personalCash)}</span></div>
      <div class="detail-row"><span>初期費用（${state.industry.name}）</span><span class="detail-value">-${money(state.industry.initialCost)}</span></div>
      <div class="detail-row"><span>資本金（会社へ）</span><span class="detail-value">-${money(val)}</span></div>
      <div class="detail-row" style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:8px;">
        <span>手元に残るお金</span><span class="detail-value" style="${remaining < 500000 ? 'color:var(--color-negative)' : ''}">${money(remaining)}</span>
      </div>
    `;
    warning.innerHTML = remaining < 500000
      ? `<div class="info-box danger">⚠️ 生活費が危険な水準です。役員報酬を払えなくなる可能性があります。</div>`
      : '';
  }
  slider.addEventListener('input', update);
  update();

  on('btn-capital-confirm', () => {
    const capital = parseInt(slider.value);
    state.capital = capital;
    state.corporateCash = capital;
    state.personalCash = state.personalCash - state.industry.initialCost - capital;
    chooseFiscalMonth();
  });
}

function chooseFiscalMonth() {
  render(`
    <div class="section-label fade-in">決算月</div>
    ${dialogBox('（あなた）', '決算月を決める。\nよくわからないけど……3月が多いらしい。')}
    ${FISCAL_MONTHS.map(fm => `
      <button class="btn fade-in" data-fiscal="${fm.value}">
        <span class="btn-label">${fm.label}</span>
        <span class="btn-desc">${fm.description}</span>
      </button>
    `).join('')}
  `);
  for (const fm of FISCAL_MONTHS) {
    onData('fiscal', String(fm.value), () => { state.fiscalMonth = fm.value; setSalary(); });
  }
}

function setSalary() {
  render(`
    <div class="section-label fade-in">役員報酬の設定</div>
    ${dialogBox('（あなた）', '自分の給料を決める。\n会社から毎月、自分に払う金額だ。\n\n高くすれば生活は楽だけど、会社のお金が減る。\n低くすれば会社は安全だけど、生活がキツい。\n\n……しかもこれ、年度の途中では変えられないらしい。')}
    ${salarySlider(250000)}
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-salary-confirm">この金額で決定</button>
  `);
  setupSalarySlider();
  on('btn-salary-confirm', () => {
    state.monthlySalary = parseInt(document.getElementById('salary-slider').value);
    showStartMessage();
  });
}

function setupSalarySlider() {
  const slider = document.getElementById('salary-slider');
  const display = document.getElementById('salary-display');
  const detail = document.getElementById('salary-detail');

  function update() {
    const val = parseInt(slider.value);
    const social = Math.floor(val * TAX_RATES.socialInsuranceRate);
    const companyCost = val + social;
    const takeHome = val - Math.floor(val * 0.20) - Math.floor(social / 2);
    display.textContent = money(val);
    detail.innerHTML = `
      <div class="detail-row"><span>会社の負担（給与+社保）</span><span class="detail-value">${money(companyCost)}/月</span></div>
      <div class="detail-row"><span>あなたの手取り</span><span class="detail-value">≈ ${money(takeHome)}/月</span></div>
      <div class="detail-row"><span>年間の会社負担</span><span class="detail-value">${money(companyCost * 12)}/年</span></div>
    `;
  }
  slider.addEventListener('input', update);
  update();
}

function showStartMessage() {
  render(`
    <div class="narrative fade-in" style="text-align:center;padding:40px 0 20px;">
      <em style="font-size:18px;">${state.companyType.name} ${state.companyName}</em>
    </div>
    <div class="settlement-table fade-in fade-in-delay-1">
      <h3>設立完了</h3>
      <div class="settlement-row"><span>業種</span><span>${state.industry.icon} ${state.industry.name}</span></div>
      <div class="settlement-row"><span>資本金</span><span class="amount">${money(state.capital)}</span></div>
      <div class="settlement-row"><span>役員報酬</span><span class="amount">${money(state.monthlySalary)}/月</span></div>
      <div class="settlement-row"><span>法人口座</span><span class="amount">${money(state.corporateCash)}</span></div>
      <div class="settlement-row"><span>個人の貯金</span><span class="amount">${money(state.personalCash)}</span></div>
      <div class="settlement-row"><span>決算月</span><span>${state.fiscalMonth}月</span></div>
      <div class="settlement-row"><span>税理士</span><span style="color:var(--color-warning);">未契約</span></div>
    </div>
    ${dialogBox('（あなた）', '会社ができた。\n\n売上はゼロ。税理士もいない。\nでも、経費は明日から発生する。\n\n……やるしかない。')}
    <button class="btn btn-primary fade-in fade-in-delay-4" id="btn-start-game">1期目を始める</button>
  `);
  on('btn-start-game', () => {
    state.deck = buildDeck(state.currentPeriod, state);
    startMonth();
  });
}

// === 月次ループ ===

function startMonth() {
  state._lastCash = state.corporateCash;
  selectedCardIds = [];

  const passiveRev = applyPassiveRevenue(state);

  const events = getEventsForMonth(state.currentPeriod, state.currentMonth, state);
  if (events.length > 0) {
    showEvent(events[0], () => showHandSelection(passiveRev));
    return;
  }
  showHandSelection(passiveRev);
}

function showEvent(event, callback) {
  state.triggeredEvents.push(event.id);

  // 税理士の有無で対話を分岐
  let dialogContent;
  if (event.dialogFn) {
    const d = event.dialogFn(state);
    dialogContent = dialogBox(d.name, d.text);
  } else if (event.conditionAccountant && !state.accountant && event.dialogNoAccountant) {
    dialogContent = dialogBox(event.dialogNoAccountant.name, event.dialogNoAccountant.text);
  } else if (event.conditionAccountant && state.accountant && event.dialogWithAccountant) {
    dialogContent = dialogBox(event.dialogWithAccountant.name, event.dialogWithAccountant.text);
  } else {
    dialogContent = dialogBox(event.dialog.name, event.dialog.text);
  }

  let followUpContent = '';
  if (event.followUp) followUpContent = dialogBox(event.followUp.name, event.followUp.text);
  if (event.followUpAccountant && state.accountant) followUpContent = dialogBox(event.followUpAccountant.name, event.followUpAccountant.text);

  let choicesContent = '';
  if (event.choices) {
    choicesContent = event.choices.map((c, i) => `
      <button class="btn fade-in fade-in-delay-${i + 2}" data-event-choice="${i}">${c.text}</button>
    `).join('');
  } else {
    choicesContent = `<button class="btn btn-primary fade-in fade-in-delay-3" id="btn-event-ok">続ける</button>`;
  }

  render(`
    ${statusBar(state)}
    <div class="section-label fade-in">📮 ${event.title}</div>
    ${dialogContent}
    ${followUpContent}
    ${choicesContent}
  `);

  if (event.choices) {
    event.choices.forEach((c, i) => {
      onData('event-choice', String(i), () => {
        if (c.effect) {
          if (c.effect.creditScore) state.creditScore += c.effect.creditScore;
          if (c.effect.cashFlowHit) { state.corporateCash -= c.effect.cashFlowHit; state.monthExpense += c.effect.cashFlowHit; }
          if (c.effect.employeeSatisfaction && state.employees.length > 0) {
            state.employees[0].satisfaction = Math.max(0, Math.min(100, state.employees[0].satisfaction + c.effect.employeeSatisfaction));
          }
          if (c.effect.monthlyExpense && state.employees.length > 0) {
            state.employees[0].salary += c.effect.monthlyExpense;
          }
        }
        callback();
      });
    });
  } else {
    on('btn-event-ok', callback);
  }
}

function showHandSelection(passiveRev) {
  if (state.deck.length < 5) {
    state.deck = buildDeck(state.currentPeriod, state);
  }
  state.hand = drawHand(state.deck, 5);

  let plSection = monthlyPLView(state);

  render(`
    ${statusBar(state)}
    ${passiveRev > 0 ? `<div class="info-box info fade-in">📈 継続効果: +${money(passiveRev)}</div>` : ''}
    ${plSection}
    <div class="section-label fade-in">今月の手札（2枚選んでください）</div>
    ${cardHand(state.hand, selectedCardIds)}
    <button class="btn btn-primary disabled fade-in" id="btn-play-cards" style="margin-top:16px;">この2枚で行動する</button>
  `);

  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.cardId;
      if (el.classList.contains('disabled') && !el.classList.contains('selected')) return;
      if (selectedCardIds.includes(id)) {
        selectedCardIds = selectedCardIds.filter(x => x !== id);
      } else if (selectedCardIds.length < 2) {
        selectedCardIds.push(id);
      }
      document.querySelectorAll('.card').forEach(c => {
        c.classList.toggle('selected', selectedCardIds.includes(c.dataset.cardId));
        c.classList.toggle('disabled', !selectedCardIds.includes(c.dataset.cardId) && selectedCardIds.length >= 2);
      });
      const btn = document.getElementById('btn-play-cards');
      btn.classList.toggle('disabled', selectedCardIds.length !== 2);
    });
  });

  on('btn-play-cards', () => {
    if (selectedCardIds.length !== 2) return;
    resolveCards(state.hand.filter(c => selectedCardIds.includes(c.instanceId)));
  });
}

function resolveCards(cards) {
  const allResults = [];
  for (const card of cards) {
    allResults.push(...applyCardEffect(state, card).results);
  }

  const monthEnd = processMonthEnd(state);

  render(`
    ${statusBar(state)}
    ${monthResultView(allResults)}
    ${monthEndView(monthEnd, state)}
    ${state.corporateCash < 0 ? `<div class="info-box danger fade-in">⚠️ 資金がマイナスです！来月も続くとゲームオーバーです。</div>` : ''}
    <button class="btn btn-primary fade-in" id="btn-next-month">${state.gameOver ? '結果を見る' : '翌月へ'}</button>
  `);

  on('btn-next-month', () => {
    if (state.gameOver) { showGameOver(); return; }
    advanceMonth();
  });
}

function advanceMonth() {
  state.currentMonth++;
  state.absoluteMonth++;
  if (state.currentMonth > 12) state.currentMonth = 1;

  // 決算月の翌月かチェック
  const settlementMonth = state.fiscalMonth === 12 ? 1 : state.fiscalMonth + 1;
  if (state.currentMonth === settlementMonth && state.absoluteMonth > 1) {
    showSettlement();
    return;
  }
  startMonth();
}

function showSettlement() {
  const result = processSettlement(state);

  let accountantComment = '';
  if (state.accountant) {
    if (result.profit < 0) {
      accountantComment = dialogBox('税理士 佐藤', `赤字ですね。\nでもこの赤字は「繰越欠損金」として来期以降に繰り越せます。\n来期利益が出たら、この分だけ法人税が安くなりますよ。`);
    } else if (result.totalTax > 200000) {
      accountantComment = dialogBox('税理士 佐藤', `税金、なかなかの金額ですね。\n来期は節税対策も本格的に考えていきましょう。\n小商人積立や安全共済機構が使えるかもしれません。`);
    } else {
      accountantComment = dialogBox('税理士 佐藤', `まずまずの結果です。\nこの調子で来期も頑張りましょう。`);
    }
  } else {
    if (result.profit < 0) {
      accountantComment = dialogBox('（あなた）', `赤字……なのに税金取られた。\n均等割、ってやつらしい。\n\n税理士がいれば、もう少し何かできたのかな……。`);
    } else {
      accountantComment = dialogBox('（あなた）', `利益が出た、はず。正確な数字はわからないけど。\n税金もよくわからないまま払った。\n\n……来期は税理士を雇った方がいいかもしれない。`);
    }
  }

  render(`
    <div class="section-label fade-in">📊 第${state.currentPeriod}期 決算</div>
    ${settlementView(result, state)}
    ${accountantComment}
    <button class="btn btn-primary fade-in" id="btn-next-period">
      ${state.currentPeriod >= 5 ? 'エンディングへ' : `${state.currentPeriod + 1}期目へ`}
    </button>
  `);

  on('btn-next-period', () => {
    if (state.currentPeriod >= 5) { showEnding(); return; }
    state.currentPeriod++;
    state.currentMonth = state.fiscalMonth === 12 ? 1 : state.fiscalMonth + 1;
    state.deck = buildDeck(state.currentPeriod, state);
    startPeriodSetup();
  });
}

function startPeriodSetup() {
  render(`
    <div class="section-label fade-in">${state.currentPeriod}期目の準備</div>
    ${state.accountant
      ? dialogBox('税理士 佐藤', `${state.currentPeriod}期目です。\n役員報酬を見直しますか？\n前期は月 ${money(state.monthlySalary)} でした。`)
      : dialogBox('（あなた）', `${state.currentPeriod}期目。\n役員報酬、変えるか……？\n前期は月 ${money(state.monthlySalary)} だった。`)
    }
    ${salarySlider(state.monthlySalary)}
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-salary-confirm">この金額で決定</button>
  `);
  document.getElementById('salary-slider').value = state.monthlySalary;
  setupSalarySlider();
  on('btn-salary-confirm', () => {
    state.monthlySalary = parseInt(document.getElementById('salary-slider').value);
    startMonth();
  });
}

// === エンディング ===

function showEnding() {
  const rank = calculateRank(state);
  render(endingScreen(state, rank));

  on('btn-share', () => {
    const text = `ナホン国で起業してみた。\n\n業種：${state.industry.name}\n結果：${rank.grade}ランク「${rank.title}」\n5年間の売上：${money(state.totalRevenue)}\n5年間の納税：${money(state.totalTaxPaid)}\n節税効果：${money(state.totalTaxSaved)}\n税理士：${state.accountant ? 'あり' : 'なし（自力）'}\n\n#起業しろ #ナホン経営記`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('クリップボードにコピーしました！'));
    }
  });

  on('btn-retry', () => {
    state = createInitialState();
    showTitle();
  });
}

function calculateRank(state) {
  const cash = state.corporateCash;
  const emp = state.employees.length;
  if (cash >= 30000000 && emp >= 5) return { grade: 'S', title: 'ナホンの星', description: '業界紙に載った。次は株式公開か。\nトーキョ区の夜景が、今日は少し違って見える。' };
  if (cash >= 15000000) return { grade: 'A', title: '堅実なる経営者', description: '銀行から「いつでも融資します」と言われるようになった。\n5年前の自分に言いたい。\n「あの判断は、正しかった」と。' };
  if (cash >= 5000000) return { grade: 'B', title: '自由な一人社長', description: '大きくはない。でも、自分の城だ。\n満員電車にはもう乗らない。\n月曜の朝が怖くない。それだけで十分だ。' };
  if (cash >= 0) return { grade: 'C', title: '崖っぷちの生存者', description: 'まだ潰れていない。それだけでも奇跡だ。\n6期目も、きっと戦える。……たぶん。' };
  return { grade: 'D', title: 'また、サラリーマンから', description: '会社は畳んだ。借金は残らなかった。\nハローワークの椅子に座りながら思う。\n\n……でも、いつかまた。' };
}

function showGameOver() {
  render(`
    <div class="title-logo fade-in"><h1>GAME OVER</h1></div>
    <div class="narrative fade-in fade-in-delay-1">${state.gameOverReason}\n\n通帳の残高は、もう動かない。</div>
    ${state.accountant
      ? dialogBox('税理士 佐藤', '……お疲れさまでした、社長。\n\nまた挑戦するときは、声をかけてください。')
      : dialogBox('（あなた）', '……終わった。\n\nでも、次はもう少しうまくやれる気がする。')
    }
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-retry">もう一度起業する</button>
  `);
  on('btn-retry', () => { state = createInitialState(); showTitle(); });
}

// === ユーティリティ ===

function on(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler, { once: true });
}

function onData(attr, value, handler) {
  const el = document.querySelector(`[data-${attr}="${value}"]`);
  if (el) el.addEventListener('click', handler, { once: true });
}

// === スタート ===
showTitle();
