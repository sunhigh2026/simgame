// ========================================
// UI描画
// ========================================

const $ = (sel) => document.querySelector(sel);
const screen = () => $('#screen');

export function render(html) {
  screen().innerHTML = html;
  screen().scrollTop = 0;
  window.scrollTo(0, 0);
}

export function append(html) {
  screen().insertAdjacentHTML('beforeend', html);
}

// ユーティリティ
export function money(amount) {
  if (amount < 0) return `▲Ƴ${Math.abs(amount).toLocaleString()}`;
  return `Ƴ${amount.toLocaleString()}`;
}

export function moneyClass(amount) {
  return amount >= 0 ? 'positive' : 'negative';
}

// --- 画面パーツ ---

export function titleScreen() {
  return `
    <div class="title-logo fade-in">
      <h1>起業しろ！</h1>
      <div class="subtitle">〜ナホン成り上がり経営記〜</div>
    </div>
    <div class="narrative fade-in fade-in-delay-2">
ここは<em>ナホン国</em>。

どこにでもある、よくある国。
満員電車、チェーンの牛丼屋、
コンビニのコーヒー、月末の通帳残高。

あなた（30）は今日、会社を辞めた。

退職金はない。
貯金は<span class="highlight">Ƴ5,000,000</span>。
経験はない。あるのは、やる気だけ。
    </div>
    <button class="btn btn-primary fade-in fade-in-delay-4" id="btn-start">
      起業する
    </button>
  `;
}

export function statusBar(state) {
  const monthLabel = `${state.currentPeriod}期目 ${state.currentMonth}月`;
  const changeFromLastMonth = state._lastCash !== undefined
    ? state.corporateCash - state._lastCash
    : 0;

  return `
    <div class="status-bar">
      <div class="period">${monthLabel}</div>
      <div class="company-name">${state.companyType?.name || ''} ${state.companyName || ''}</div>
      <div class="balance-row">
        <span class="balance-label">法人口座</span>
        <span class="balance-value main">${money(state.corporateCash)}${
          changeFromLastMonth !== 0
            ? `<span class="balance-change ${moneyClass(changeFromLastMonth)}">(${changeFromLastMonth >= 0 ? '+' : ''}${money(changeFromLastMonth)})</span>`
            : ''
        }</span>
      </div>
      <div class="balance-row">
        <span class="balance-label">今期売上</span>
        <span class="balance-value positive">${money(state.periodRevenue)}</span>
      </div>
      <div class="balance-row">
        <span class="balance-label">個人の貯金</span>
        <span class="balance-value ${moneyClass(state.personalCash)}">${money(state.personalCash)}</span>
      </div>
    </div>
  `;
}

export function dialogBox(name, text) {
  return `
    <div class="dialog fade-in">
      <div class="dialog-name">${name}</div>
      <div class="dialog-text">${text}</div>
    </div>
  `;
}

export function industryChoices(industries) {
  return Object.values(industries).map(ind => `
    <button class="btn fade-in" data-industry="${ind.id}">
      <span class="btn-label">${ind.icon} ${ind.name}</span>
      <span class="btn-desc">${ind.description}</span>
    </button>
  `).join('');
}

export function companyTypeChoices(types) {
  return Object.values(types).map(ct => `
    <button class="btn fade-in" data-company-type="${ct.id}">
      <span class="btn-label">${ct.name}</span>
      <span class="btn-desc">${ct.description}（設立費用：${money(ct.cost)}）</span>
    </button>
  `).join('');
}

export function capitalSlider(maxCapital) {
  return `
    <div class="slider-container fade-in">
      <label>資本金を決めてください</label>
      <div class="slider-value">
        <span id="capital-display">Ƴ1,000,000</span>
      </div>
      <input type="range" id="capital-slider" min="10000" max="${maxCapital}" step="10000" value="1000000">
      <div class="slider-range-labels">
        <span>Ƴ1万</span>
        <span>${money(maxCapital)}</span>
      </div>
      <div class="slider-detail" id="capital-detail"></div>
    </div>
  `;
}

export function salarySlider() {
  return `
    <div class="slider-container fade-in">
      <label>代表給（毎月の自分の給料）</label>
      <div class="slider-value">
        <span id="salary-display">Ƴ250,000</span>
        <span class="slider-unit">/月</span>
      </div>
      <input type="range" id="salary-slider" min="0" max="600000" step="10000" value="250000">
      <div class="slider-range-labels">
        <span>Ƴ0</span>
        <span>Ƴ60万</span>
      </div>
      <div class="slider-detail" id="salary-detail"></div>
    </div>
  `;
}

export function cardHand(hand, selectedIds) {
  return `
    <div class="cards-hand">
      ${hand.map((card, i) => {
        const selected = selectedIds.includes(card.instanceId);
        const disabled = !selected && selectedIds.length >= 2;
        return `
          <div class="card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} fade-in fade-in-delay-${i + 1}"
               data-card-id="${card.instanceId}">
            <div class="card-header">
              <span class="card-category ${card.category}">${card.categoryLabel}</span>
              <span class="card-name">${card.icon} ${card.name}</span>
            </div>
            <div class="card-desc">${card.description}</div>
            <div class="card-stats">
              ${card.cost > 0 ? `<div class="card-stat-item">コスト: <span>${money(card.cost)}</span></div>` : ''}
              ${card.revenueMin !== undefined ? `<div class="card-stat-item">売上: <span>${money(card.revenueMin)}〜${money(card.revenueMax)}</span></div>` : ''}
              ${card.failRate > 0 ? `<div class="card-stat-item">失敗率: <span>${Math.floor(card.failRate * 100)}%</span></div>` : ''}
              ${card.permanentLabel ? `<div class="card-stat-item">${card.permanentLabel}</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function monthResultView(results) {
  return `
    <div class="month-result fade-in">
      <h3>── 今月の結果 ──</h3>
      ${results.map(r => `
        <div class="result-item">
          ${r.type === 'revenue' ? `💰 ${r.text} <strong>+${money(r.amount)}</strong>` : ''}
          ${r.type === 'cost' ? `💸 ${r.text}` : ''}
          ${r.type === 'fail' ? `😢 ${r.text}` : ''}
          ${r.type === 'success' ? `✨ ${r.text}` : ''}
          ${r.type === 'permanent' ? `🔓 ${r.text}` : ''}
          ${r.type === 'stamina' ? `💪 ${r.text}` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

export function monthEndView(result) {
  return `
    <div class="settlement-table fade-in">
      <h3>── 月末処理 ──</h3>
      ${result.items.map(item => `
        <div class="settlement-row">
          <span>${item.label}</span>
          <span class="amount negative">${money(item.amount)}</span>
        </div>
        ${item.detail ? `<div class="settlement-row indent"><span>${item.detail}</span></div>` : ''}
      `).join('')}
    </div>
  `;
}

export function settlementView(result) {
  return `
    <div class="settlement-table fade-in">
      <h3>📊 損益計算書</h3>
      <div class="settlement-row">
        <span>売上高</span>
        <span class="amount">${money(result.revenue)}</span>
      </div>
      <div class="settlement-row">
        <span>経費合計</span>
        <span class="amount negative">${money(-result.expense)}</span>
      </div>
      <div class="settlement-row total">
        <span>営業利益</span>
        <span class="amount ${moneyClass(result.profit)}">${money(result.profit)}</span>
      </div>
    </div>

    ${result.usedCarryForward > 0 ? `
      <div class="info-box info fade-in fade-in-delay-1">
        繰越欠損金 ${money(result.usedCarryForward)} を適用しました
      </div>
    ` : ''}

    ${result.usedDeduction > 0 ? `
      <div class="info-box info fade-in fade-in-delay-2">
        節税対策により ${money(result.usedDeduction)} の利益を圧縮しました
      </div>
    ` : ''}

    <div class="settlement-table fade-in fade-in-delay-3">
      <h3>🏛️ 税金</h3>
      <div class="settlement-row">
        <span>商益税${result.taxableIncome > 0 ? `（${result.taxableIncome <= 8000000 ? '14%' : '14%/22%'}）` : ''}</span>
        <span class="amount">${money(result.corporateTax)}</span>
      </div>
      <div class="settlement-row">
        <span>市民割（均等割）</span>
        <span class="amount">${money(result.citizenTax)}</span>
      </div>
      <div class="settlement-row">
        <span>事業割</span>
        <span class="amount">${money(result.businessTax)}</span>
      </div>
      ${result.transactionTax > 0 ? `
        <div class="settlement-row">
          <span>取引税 ← NEW!</span>
          <span class="amount">${money(result.transactionTax)}</span>
        </div>
      ` : ''}
      <div class="settlement-row total">
        <span>税金合計</span>
        <span class="amount negative">${money(-result.totalTax)}</span>
      </div>
    </div>

    ${result.taxSaved > 0 ? `
      <div class="info-box info fade-in fade-in-delay-4">
        🛡️ 節税効果：${money(result.taxSaved)} 軽減されました！
      </div>
    ` : ''}

    ${result.profit < 0 ? `
      <div class="info-box warning fade-in fade-in-delay-4">
        赤字でも市民割 ${money(result.citizenTax)} がかかります。
        法人が存在しているだけでかかる税金です。
      </div>
    ` : ''}

    ${result.carryForwardLoss > 0 ? `
      <div class="info-box info fade-in fade-in-delay-5">
        繰越欠損金の残高：${money(result.carryForwardLoss)}
        （来期以降の利益と相殺できます）
      </div>
    ` : ''}
  `;
}

export function endingScreen(state, rank) {
  const records = state.periodRecords;
  return `
    <div class="title-logo fade-in">
      <h1>${rank.title}</h1>
      <div class="subtitle">ランク：${rank.grade}</div>
    </div>

    <div class="narrative fade-in fade-in-delay-1">${rank.description}</div>

    <div class="settlement-table fade-in fade-in-delay-2">
      <h3>📊 5年間の経営成績</h3>
      ${records.map(r => `
        <div class="settlement-row">
          <span>${r.period}期目</span>
          <span class="amount">売上 ${money(r.revenue)}</span>
          <span class="amount ${moneyClass(r.profit)}">利益 ${money(r.profit)}</span>
        </div>
      `).join('')}
      <div class="settlement-row total">
        <span>累計納税額</span>
        <span class="amount">${money(state.totalTaxPaid)}</span>
      </div>
      <div class="settlement-row">
        <span>節税で浮いた額</span>
        <span class="amount positive">${money(state.totalTaxSaved)}</span>
      </div>
    </div>

    <button class="btn btn-primary fade-in fade-in-delay-4" id="btn-share">
      結果をシェアする
    </button>
    <button class="btn fade-in fade-in-delay-5" id="btn-retry">
      もう一度起業する
    </button>
  `;
}