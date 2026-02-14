// ========================================
// メインエントリーポイント：画面遷移の制御
// ========================================

import { INDUSTRIES, COMPANY_TYPES, FISCAL_MONTHS, TAX_RATES } from './data.js';
import { buildDeck, drawHand } from './cards.js';
import {
  createInitialState, processMonthEnd, processSettlement,
  applyCardEffect, applyPassiveRevenue
} from './game.js';
import {
  render, append, money, moneyClass,
  titleScreen, statusBar, dialogBox,
  industryChoices, companyTypeChoices,
  capitalSlider, salarySlider,
  cardHand, monthResultView, monthEndView,
  settlementView, endingScreen
} from './ui.js';
import { getEventsForMonth } from './events.js';

let state = createInitialState();
let selectedCardIds = [];

// ========================================
// ゲーム開始
// ========================================

function showTitle() {
  render(titleScreen());
  on('btn-start', startSetup);
}

// ========================================
// 会社設立フロー
// ========================================

function startSetup() {
  render(`
    <div class="section-label fade-in">業種を選ぶ</div>
    ${dialogBox('税理士 佐藤', 'はじめまして、税理士の佐藤です。\n起業のお手伝いをさせていただきます。\n\nまず……何で起業しますか？')}
    ${industryChoices(INDUSTRIES)}
  `);

  for (const key of Object.keys(INDUSTRIES)) {
    onData('industry', key, () => {
      state.industry = INDUSTRIES[key];
      chooseCompanyType();
    });
  }
}

function chooseCompanyType() {
  render(`
    <div class="section-label fade-in">会社の形態</div>
    ${dialogBox('税理士 佐藤', `${state.industry.icon} ${state.industry.name}ですね。\n\n次に、会社の種類を選びましょう。`)}
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
    ${dialogBox('税理士 佐藤', `${state.companyType.name}で設立しますね。\n設立費用 ${money(state.companyType.cost)} を支払いました。\n\n会社の名前を決めてください。`)}
    <div class="slider-container fade-in">
      <label>会社名</label>
      <input type="text" id="company-name-input" placeholder="例：ナホンテック"
        style="width:100%; padding:12px; font-size:16px; border-radius:8px;
        border:1px solid rgba(255,255,255,0.1); background:var(--bg-card);
        color:var(--text-primary); font-family:var(--font-main); outline:none;">
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
  const setupCost = state.companyType.cost + state.industry.initialCost;
  const maxCapital = state.savings - setupCost - 500000;

  render(`
    <div class="section-label fade-in">資本金</div>
    ${dialogBox('税理士 佐藤', `「${state.companyType.name} ${state.companyName}」ですね。\n\n次は資本金を決めましょう。\n貯金 ${money(state.savings)} から設立費用を引いた中から決めてください。\n\n資本金は会社の体力です。\nでも、あなたの生活費も残す必要がありますよ。`)}
    ${capitalSlider(Math.max(100000, maxCapital))}
    <div id="capital-warning"></div>
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-capital-confirm">この資本金で設立する</button>
  `);

  const slider = document.getElementById('capital-slider');
  const display = document.getElementById('capital-display');
  const detail = document.getElementById('capital-detail');
  const warning = document.getElementById('capital-warning');

  function updateCapitalDisplay() {
    const val = parseInt(slider.value);
    display.textContent = money(val);
    const remaining = state.savings - state.companyType.cost - state.industry.initialCost - val;
    detail.innerHTML = `
      <div class="detail-row">
        <span>貯金</span><span class="detail-value">${money(state.savings)}</span>
      </div>
      <div class="detail-row">
        <span>設立費用</span><span class="detail-value">-${money(state.companyType.cost)}</span>
      </div>
      <div class="detail-row">
        <span>初期費用（${state.industry.name}）</span><span class="detail-value">-${money(state.industry.initialCost)}</span>
      </div>
      <div class="detail-row">
        <span>資本金（会社へ）</span><span class="detail-value">-${money(val)}</span>
      </div>
      <div class="detail-row" style="border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; margin-top:8px;">
        <span>手元に残るお金（個人）</span><span class="detail-value ${remaining < 500000 ? 'color:var(--color-negative)' : ''}">${money(remaining)}</span>
      </div>
    `;
    if (remaining < 500000) {
      warning.innerHTML = `<div class="info-box danger">⚠️ 生活費がかなり少なくなります。代表給が払えなくなる可能性があります。</div>`;
    } else {
      warning.innerHTML = '';
    }
  }

  slider.addEventListener('input', updateCapitalDisplay);
  updateCapitalDisplay();

  on('btn-capital-confirm', () => {
    const capital = parseInt(slider.value);
    state.capital = capital;
    state.corporateCash = capital;
    state.personalCash = state.savings - state.companyType.cost - state.industry.initialCost - capital;
    chooseFiscalMonth();
  });
}

function chooseFiscalMonth() {
  render(`
    <div class="section-label fade-in">決算月</div>
    ${dialogBox('税理士 佐藤', '決算月を選んでください。\n\n設立月から遠い月にすると、\n1期目が長くなります。\n免税メリットを最大限使えますよ。')}
    ${FISCAL_MONTHS.map(fm => `
      <button class="btn fade-in" data-fiscal="${fm.value}">
        <span class="btn-label">${fm.label}</span>
        <span class="btn-desc">${fm.description}</span>
      </button>
    `).join('')}
  `);

  for (const fm of FISCAL_MONTHS) {
    onData('fiscal', String(fm.value), () => {
      state.fiscalMonth = fm.value;
      setSalary();
    });
  }
}

function setSalary() {
  render(`
    <div class="section-label fade-in">代表給の設定</div>
    ${dialogBox('税理士 佐藤', '自分の給料を決めてください。\n会社から毎月あなたに支払われるお金です。\n\n高くすれば生活は楽ですが、会社のお金が減ります。\n低くすれば会社は安全ですが、生活がキツい。\n\n⚠️ 一度決めたら今期中は変更できません。')}
    ${salarySlider()}
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-salary-confirm">この金額で決定</button>
  `);

  const slider = document.getElementById('salary-slider');
  const display = document.getElementById('salary-display');
  const detail = document.getElementById('salary-detail');

  function updateSalaryDisplay() {
    const val = parseInt(slider.value);
    const social = Math.floor(val * TAX_RATES.socialInsuranceRate);
    const companyCost = val + social;
    const personalTax = Math.floor(val * 0.20);
    const personalSocial = Math.floor(social / 2);
    const takeHome = val - personalTax - personalSocial;

    display.textContent = money(val);
    detail.innerHTML = `
      <div class="detail-row">
        <span>会社の負担（給与+扶助金）</span><span class="detail-value">${money(companyCost)}/月</span>
      </div>
      <div class="detail-row">
        <span>あなたの手取り（税・扶助金引後）</span><span class="detail-value">≈ ${money(takeHome)}/月</span>
      </div>
      <div class="detail-row">
        <span>年間の会社負担</span><span class="detail-value">${money(companyCost * 12)}/年</span>
      </div>
    `;
  }

  slider.addEventListener('input', updateSalaryDisplay);
  updateSalaryDisplay();

  on('btn-salary-confirm', () => {
    state.monthlySalary = parseInt(slider.value);
    showStartMessage();
  });
}

function showStartMessage() {
  render(`
    <div class="narrative fade-in" style="text-align:center; padding:40px 0 20px;">
      <em style="font-size:18px;">${state.companyType.name} ${state.companyName}</em>
    </div>
    <div class="settlement-table fade-in fade-in-delay-1">
      <h3>設立完了</h3>
      <div class="settlement-row"><span>業種</span><span>${state.industry.icon} ${state.industry.name}</span></div>
      <div class="settlement-row"><span>資本金</span><span class="amount">${money(state.capital)}</span></div>
      <div class="settlement-row"><span>代表給</span><span class="amount">${money(state.monthlySalary)}/月</span></div>
      <div class="settlement-row"><span>法人口座</span><span class="amount">${money(state.corporateCash)}</span></div>
      <div class="settlement-row"><span>個人の貯金</span><span class="amount">${money(state.personalCash)}</span></div>
      <div class="settlement-row"><span>決算月</span><span>${state.fiscalMonth}月</span></div>
    </div>
    ${dialogBox('税理士 佐藤', `設立おめでとうございます。\n\nさあ、1期目が始まります。\n売上はゼロ。でも経費は待ってくれません。\n\n……がんばれ、社長。`)}
    <button class="btn btn-primary fade-in fade-in-delay-4" id="btn-start-game">1期目を始める</button>
  `);

  on('btn-start-game', () => {
    state.deck = buildDeck(state.currentPeriod, state);
    startMonth();
  });
}

// ========================================
// 月次ループ
// ========================================

function startMonth() {
  state._lastCash = state.corporateCash;
  selectedCardIds = [];

  // 永続効果の受動売上
  const passiveRev = applyPassiveRevenue(state);

  // イベントチェック
  const events = getEventsForMonth(state.currentPeriod, state.currentMonth, state);
  if (events.length > 0) {
    showEvent(events[0], () => showHandSelection(passiveRev));
    return;
  }

  showHandSelection(passiveRev);
}

function showEvent(event, callback) {
  state.triggeredEvents.push(event.id);

  let dialogContent;
  if (event.dialogFn) {
    const d = event.dialogFn(state);
    dialogContent = dialogBox(d.name, d.text);
  } else {
    dialogContent = dialogBox(event.dialog.name, event.dialog.text);
  }

  let followUpContent = '';
  if (event.followUp) {
    followUpContent = dialogBox(event.followUp.name, event.followUp.text);
  }

  let choicesContent = '';
  if (event.choices) {
    choicesContent = event.choices.map((c, i) => `
      <button class="btn fade-in fade-in-delay-${i + 2}" data-event-choice="${i}">
        ${c.text}
      </button>
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
          if (c.effect.cashFlowHit) {
            state.corporateCash -= c.effect.cashFlowHit;
            state.monthExpense += c.effect.cashFlowHit;
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
  // デッキが少なくなったらリシャッフル
  if (state.deck.length < 5) {
    state.deck = buildDeck(state.currentPeriod, state);
  }

  state.hand = drawHand(state.deck, 5);

  render(`
    ${statusBar(state)}
    ${passiveRev > 0 ? `<div class="info-box info fade-in">📈 継続効果による売上: +${money(passiveRev)}</div>` : ''}
    <div class="section-label fade-in">今月の手札（2枚選んでください）</div>
    ${cardHand(state.hand, selectedCardIds)}
    <button class="btn btn-primary fade-in" id="btn-play-cards" style="margin-top:16px; opacity:0.3; pointer-events:none;">
      この2枚で行動する
    </button>
  `);

  // カード選択ロジック
  document.querySelectorAll('.card').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.cardId;
      if (el.classList.contains('disabled') && !el.classList.contains('selected')) return;

      if (selectedCardIds.includes(id)) {
        selectedCardIds = selectedCardIds.filter(x => x !== id);
      } else if (selectedCardIds.length < 2) {
        selectedCardIds.push(id);
      }

      // 再描画
      document.querySelectorAll('.card').forEach(c => {
        const cid = c.dataset.cardId;
        c.classList.toggle('selected', selectedCardIds.includes(cid));
        c.classList.toggle('disabled', !selectedCardIds.includes(cid) && selectedCardIds.length >= 2);
      });

      const btn = document.getElementById('btn-play-cards');
      if (selectedCardIds.length === 2) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } else {
        btn.style.opacity = '0.3';
        btn.style.pointerEvents = 'none';
      }
    });
  });

  on('btn-play-cards', () => {
    if (selectedCardIds.length !== 2) return;
    const played = state.hand.filter(c => selectedCardIds.includes(c.instanceId));
    resolveCards(played);
  });
}

function resolveCards(cards) {
  const allResults = [];

  for (const card of cards) {
    const result = applyCardEffect(state, card);
    allResults.push(...result.results);
  }

  // 月末処理
  const monthEnd = processMonthEnd(state);

  render(`
    ${statusBar(state)}
    ${monthResultView(allResults)}
    ${monthEndView(monthEnd)}
    ${state.corporateCash < 0 ? `<div class="info-box danger fade-in">⚠️ 資金がマイナスです！来月も続くとゲームオーバーです。</div>` : ''}
    <button class="btn btn-primary fade-in" id="btn-next-month">
      ${state.gameOver ? '結果を見る' : '翌月へ'}
    </button>
  `);

  on('btn-next-month', () => {
    if (state.gameOver) {
      showGameOver();
      return;
    }
    advanceMonth();
  });
}

function advanceMonth() {
  state.currentMonth++;
  state.absoluteMonth++;

  // 決算月チェック
  if (state.currentMonth > 12) {
    state.currentMonth = 1;
  }

  if (state.currentMonth === state.fiscalMonth + 1 || (state.fiscalMonth === 12 && state.currentMonth === 1)) {
    showSettlement();
    return;
  }

  startMonth();
}

function showSettlement() {
  const result = processSettlement(state);

  render(`
    <div class="section-label fade-in">📊 第${state.currentPeriod}期 決算</div>
    ${dialogBox('税理士 佐藤', `社長、${state.currentPeriod}期目の決算です。\n数字をまとめました。`)}
    ${settlementView(result)}
    ${dialogBox('税理士 佐藤',
      result.profit < 0
        ? `赤字ですね。\nでも、この赤字は来期以降に繰り越せます。\n来期利益が出たら、この分だけ税金が安くなりますよ。`
        : result.totalTax > 200000
          ? `税金、なかなかの金額ですね。\n来期は節税対策も考えていきましょう。`
          : `まずまずの結果です。\nこの調子で来期も頑張りましょう。`
    )}
    <button class="btn btn-primary fade-in" id="btn-next-period">
      ${state.currentPeriod >= 5 ? 'エンディングへ' : `${state.currentPeriod + 1}期目へ`}
    </button>
  `);

  on('btn-next-period', () => {
    if (state.currentPeriod >= 5) {
      showEnding();
      return;
    }
    state.currentPeriod++;
    state.currentMonth = state.fiscalMonth === 12 ? 1 : state.fiscalMonth + 1;
    state.deck = buildDeck(state.currentPeriod, state);
    startPeriodSetup();
  });
}

function startPeriodSetup() {
  render(`
    <div class="section-label fade-in">${state.currentPeriod}期目の準備</div>
    ${dialogBox('税理士 佐藤', `${state.currentPeriod}期目です。\n代表給を見直しますか？\n前期は月 ${money(state.monthlySalary)} でした。`)}
    ${salarySlider()}
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-salary-confirm">この金額で決定</button>
  `);

  const slider = document.getElementById('salary-slider');
  const display = document.getElementById('salary-display');
  const detail = document.getElementById('salary-detail');
  slider.value = state.monthlySalary;

  function updateSalaryDisplay() {
    const val = parseInt(slider.value);
    const social = Math.floor(val * TAX_RATES.socialInsuranceRate);
    const companyCost = val + social;
    const takeHome = val - Math.floor(val * 0.20) - Math.floor(social / 2);
    display.textContent = money(val);
    detail.innerHTML = `
      <div class="detail-row">
        <span>会社の負担</span><span class="detail-value">${money(companyCost)}/月</span>
      </div>
      <div class="detail-row">
        <span>手取り</span><span class="detail-value">≈ ${money(takeHome)}/月</span>
      </div>
    `;
  }

  slider.addEventListener('input', updateSalaryDisplay);
  updateSalaryDisplay();

  on('btn-salary-confirm', () => {
    state.monthlySalary = parseInt(slider.value);
    startMonth();
  });
}

// ========================================
// エンディング
// ========================================

function showEnding() {
  const rank = calculateRank(state);
  render(endingScreen(state, rank));

  on('btn-share', () => {
    const text = `ナホン国で起業してみた。\n\n業種：${state.industry.name}\n結果：${rank.grade}「${rank.title}」\n5年間の売上：${money(state.totalRevenue)}\n5年間の納税：${money(state.totalTaxPaid)}\n\n#起業しろ #ナホン経営記`;
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
  const employees = state.employees.length;

  if (cash >= 30000000 && employees >= 5) {
    return { grade: 'S', title: 'ナホンの星', description: '業界紙に載った。次は株式公開か。\nトーキョ区の夜景が、今日は少し違って見える。' };
  }
  if (cash >= 15000000) {
    return { grade: 'A', title: '堅実なる経営者', description: '銀行から「いつでも融資します」と言われるようになった。\n5年前、会社を辞めた日のことを思い出す。\n……あの判断は、正しかった。' };
  }
  if (cash >= 5000000) {
    return { grade: 'B', title: '自由な一人社長', description: '大きくはない。でも、自分の城だ。\n満員電車にはもう乗らない。\n月曜の朝が怖くない。それだけで十分だ。' };
  }
  if (cash >= 0) {
    return { grade: 'C', title: '崖っぷちの生存者', description: 'まだ潰れていない。それだけでも奇跡だ。\n6期目も、きっと戦える。……たぶん。' };
  }
  return { grade: 'D', title: 'また、サラリーマンから', description: '会社は畳んだ。借金は残らなかった。\nハローワークの椅子に座りながら思う。\n\n……でも、いつかまた。' };
}

function showGameOver() {
  render(`
    <div class="title-logo fade-in">
      <h1>GAME OVER</h1>
    </div>
    <div class="narrative fade-in fade-in-delay-1">
${state.gameOverReason}

通帳の残高は、もう動かない。
    </div>
    ${dialogBox('税理士 佐藤', '……お疲れさまでした、社長。\n\nまた挑戦するときは、声をかけてください。')}
    <button class="btn btn-primary fade-in fade-in-delay-3" id="btn-retry">もう一度起業する</button>
  `);

  on('btn-retry', () => {
    state = createInitialState();
    showTitle();
  });
}

// ========================================
// ユーティリティ
// ========================================

function on(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler, { once: true });
}

function onData(attr, value, handler) {
  const el = document.querySelector(`[data-${attr}="${value}"]`);
  if (el) el.addEventListener('click', handler, { once: true });
}

// ========================================
// スタート
// ========================================

showTitle();