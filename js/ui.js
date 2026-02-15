const screen = () => document.querySelector('#screen');

export function render(html) {
  screen().innerHTML = html;
  window.scrollTo(0, 0);
}

export function append(html) {
  screen().insertAdjacentHTML('beforeend', html);
}

export function money(amount) {
  if (amount < 0) return `▲Ƴ${Math.abs(amount).toLocaleString()}`;
  return `Ƴ${amount.toLocaleString()}`;
}

export function moneyClass(amount) {
  return amount >= 0 ? 'positive' : 'negative';
}

function hasFeature(state, feature) {
  if (!state.accountant) return false;
  if (state.accountant === 'basic') return ['monthlyPL', 'taxAdvice', 'detailedSettlement'].includes(feature);
  if (state.accountant === 'advanced') return true;
  return false;
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
    <button class="btn btn-primary fade-in fade-in-delay-4" id="btn-start">起業する</button>
  `;
}

export function statusBar(state) {
  const monthLabel = `${state.currentPeriod}期目 ${state.currentMonth}月`;
  const change = state._lastCash !== undefined ? state.corporateCash - state._lastCash : 0;
  const acctBadge = state.accountant
    ? `<span class="accountant-badge">税理士${state.accountant === 'advanced' ? '(敏腕)' : ''}</span>`
    : '';

  return `
    <div class="status-bar">
      <div class="period">${monthLabel} ${acctBadge}</div>
      <div class="company-name">${state.companyType?.name || ''} ${state.companyName || ''}</div>
      <div class="balance-row">
        <span class="balance-label">法人口座</span>
        <span class="balance-value main">${money(state.corporateCash)}${
          change !== 0 ? `<span class="balance-change ${moneyClass(change)}">(${change >= 0 ? '+' : ''}${money(change)})</span>` : ''
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
      <div class="slider-value"><span id="capital-display">Ƴ1,000,000</span></div>
      <input type="range" id="capital-slider" min="10000" max="${maxCapital}" step="10000" value="1000000">
      <div class="slider-range-labels"><span>Ƴ1万</span><span>${money(maxCapital)}</span></div>
      <div class="slider-detail" id="capital-detail"></div>
    </div>
  `;
}

export function salarySlider(currentValue) {
  const val = currentValue || 250000;
  return `
    <div class="slider-container fade-in">
      <label>役員報酬（会社からあなたへの毎月の給料）</label>
      <div class="slider-value"><span id="salary-display">${money(val)}</span><span class="slider-unit">/月</span></div>
      <input type="range" id="salary-slider" min="0" max="600000" step="10000" value="${val}">
      <div class="slider-range-labels"><span>Ƴ0</span><span>Ƴ60万</span></div>
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
          ${r.type === 'revenue' ? `💰 ${r.text}` : ''}
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

// 月末処理：税理士の有無で表示を分岐
export function monthEndView(result, state) {
  if (!state.accountant) {
    // 税理士なし：合計額だけ
    const total = result.items.reduce((sum, item) => sum + item.amount, 0);
    return `
      <div class="month-result fade-in">
        <h3>── 月末処理 ──</h3>
        <div class="settlement-row total">
          <span>口座からの引き落とし合計</span>
          <span class="amount negative">${money(total)}</span>
        </div>
        <div class="info-box info" style="margin-top:12px;">
          💡 内訳が見えない……。税理士と契約すれば詳細がわかります。
        </div>
      </div>
    `;
  }

  // 税理士あり：詳細表示
  return `
    <div class="settlement-table fade-in">
      <h3>── 月末処理（税理士レポート）──</h3>
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

// 月次P/L（税理士あり時のみ表示）
export function monthlyPLView(state) {
  if (!hasFeature(state, 'monthlyPL')) return '';

  const rev = state.periodRevenue;
  const exp = state.periodExpense;
  const profit = rev - exp;
  const maxBar = Math.max(rev, exp, 1);

  return `
    <div class="settlement-table fade-in">
      <h3>📊 今期の累計P/L（税理士レポート）</h3>
      <div class="settlement-row">
        <span>売上</span>
        <span class="amount positive">${money(rev)}</span>
      </div>
      <div class="pl-bar"><div class="pl-bar-fill revenue" style="width:${(rev / maxBar) * 100}%"></div></div>

      <div class="settlement-row" style="margin-top:8px;">
        <span>経費</span>
        <span class="amount negative">${money(-exp)}</span>
      </div>
      <div class="pl-bar"><div class="pl-bar-fill expense" style="width:${(exp / maxBar) * 100}%"></div></div>

      <div class="settlement-row total">
        <span>利益（税引前）</span>
        <span class="amount ${moneyClass(profit)}">${money(profit)}</span>
      </div>
      ${profit > 0 ? `<div class="pl-bar"><div class="pl-bar-fill profit" style="width:${(profit / maxBar) * 100}%"></div></div>` : ''}
    </div>
  `;
}

// 決算：税理士の有無で分岐
export function settlementView(result, state) {
  if (!state.accountant) {
    // 税理士なし：ざっくり
    return `
      <div class="settlement-table fade-in">
        <h3>📊 第${state.currentPeriod}期 決算</h3>
        <div class="settlement-row">
          <span>売上（たぶんこのくらい）</span>
          <span class="amount">${money(Math.round(result.revenue / 100000) * 100000)}</span>
        </div>
        <div class="settlement-row">
          <span>経費（よくわからない）</span>
          <span class="amount negative">???</span>
        </div>
        <div class="settlement-row total">
          <span>税金</span>
          <span class="amount negative">${money(-result.totalTax)}</span>
        </div>
      </div>
      <div class="info-box warning fade-in fade-in-delay-1">
        ⚠️ 利益の正確な金額がわからないまま税金を払いました。
        税理士がいれば、節税できたかもしれません……。
      </div>
      ${result.profit < 0 ? `
        <div class="info-box danger fade-in fade-in-delay-2">
          赤字です。でも均等割 ${money(result.citizenTax)} は取られました。
          なんで赤字なのにお金取られるんだ……？
        </div>
      ` : ''}
    `;
  }

  // 税理士あり：完全なP/L
  const maxBar = Math.max(result.revenue, result.expense, 1);

  let html = `
    <div class="settlement-table fade-in">
      <h3>📊 損益計算書（P/L）</h3>

      <div class="settlement-row">
        <span>売上高</span>
        <span class="amount">${money(result.revenue)}</span>
      </div>
      <div class="pl-bar"><div class="pl-bar-fill revenue" style="width:${(result.revenue / maxBar) * 100}%"></div></div>

      <div class="settlement-row" style="margin-top:8px;">
        <span>経費合計</span>
        <span class="amount negative">${money(-result.expense)}</span>
      </div>
      <div class="pl-bar"><div class="pl-bar-fill expense" style="width:${(result.expense / maxBar) * 100}%"></div></div>

      <div class="settlement-row total">
        <span>営業利益</span>
        <span class="amount ${moneyClass(result.profit)}">${money(result.profit)}</span>
      </div>
      ${result.profit > 0 ? `<div class="pl-bar"><div class="pl-bar-fill profit" style="width:${(result.profit / maxBar) * 100}%"></div></div>` : ''}
    </div>
  `;

  if (result.usedCarryForward > 0) {
    html += `<div class="info-box info fade-in fade-in-delay-1">繰越欠損金 ${money(result.usedCarryForward)} を適用しました</div>`;
  }
  if (result.usedDeduction > 0) {
    html += `<div class="info-box info fade-in fade-in-delay-2">節税対策により ${money(result.usedDeduction)} の利益を圧縮しました</div>`;
  }

  html += `
    <div class="settlement-table fade-in fade-in-delay-3">
      <h3>🏛️ 税金</h3>
      <div class="settlement-row">
        <span>法人税${result.taxableIncome > 0 ? `（${result.taxableIncome <= 8000000 ? '14%' : '14%/22%'}）` : ''}</span>
        <span class="amount">${money(result.corporateTax)}</span>
      </div>
      <div class="settlement-row">
        <span>均等割</span>
        <span class="amount">${money(result.citizenTax)}</span>
      </div>
      ${result.profit < 0 ? `<div class="settlement-row indent"><span>← 赤字でもかかります</span></div>` : ''}
      <div class="settlement-row">
        <span>事業税</span>
        <span class="amount">${money(result.businessTax)}</span>
      </div>
      ${result.consumptionTax > 0 ? `
        <div class="settlement-row">
          <span>消費税</span>
          <span class="amount">${money(result.consumptionTax)}</span>
        </div>
      ` : ''}
      <div class="settlement-row total">
        <span>税金合計</span>
        <span class="amount negative">${money(-result.totalTax)}</span>
      </div>
    </div>
  `;

  if (result.taxSaved > 0) {
    html += `<div class="info-box info fade-in fade-in-delay-4">🛡️ 節税効果：${money(result.taxSaved)} 軽減されました！</div>`;
  }

  if (result.carryForwardLoss > 0) {
    html += `<div class="info-box info fade-in fade-in-delay-5">繰越欠損金の残高：${money(result.carryForwardLoss)}（来期以降の利益と相殺できます）</div>`;
  }

  // B/S（敏腕税理士のみ）
  if (hasFeature(state, 'balanceSheet')) {
    html += balanceSheetView(state);
  }

  return html;
}

function balanceSheetView(state) {
  const cash = state.corporateCash;
  const totalAssets = Math.max(cash, 0);
  const capital = state.capital;
  const retainedEarnings = cash - capital;

  return `
    <div class="settlement-table fade-in fade-in-delay-5">
      <h3>📋 貸借対照表（B/S）</h3>
      <div style="display:flex; gap:8px;">
        <div style="flex:1;">
          <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">持っているもの</div>
          <div class="settlement-row">
            <span>現金・預金</span>
            <span class="amount">${money(Math.max(cash, 0))}</span>
          </div>
        </div>
        <div style="flex:1;">
          <div style="font-size:11px; color:var(--text-secondary); margin-bottom:8px;">お金の出どころ</div>
          <div class="settlement-row">
            <span>資本金</span>
            <span class="amount">${money(capital)}</span>
          </div>
          <div class="settlement-row">
            <span>繰越利益</span>
            <span class="amount ${moneyClass(retainedEarnings)}">${money(retainedEarnings)}</span>
          </div>
        </div>
      </div>
    </div>
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
      <h3>📊 経営成績（${records.length}年間）</h3>
      ${records.map(r => `
        <div class="settlement-row">
          <span>${r.period}期</span>
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
      <div class="settlement-row">
        <span>最終 法人口座</span>
        <span class="amount ${moneyClass(state.corporateCash)}">${money(state.corporateCash)}</span>
      </div>
    </div>
    <button class="btn btn-primary fade-in fade-in-delay-4" id="btn-share">結果をシェアする</button>
    <button class="btn fade-in fade-in-delay-5" id="btn-retry">もう一度起業する</button>
  `;
}
