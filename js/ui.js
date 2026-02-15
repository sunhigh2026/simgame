/* ========== UI描画 ========== */
const UI = {
  money(amount) {
    if (amount < 0) return `<span class="negative">▲Ƴ${Math.abs(amount).toLocaleString()}</span>`;
    return `Ƴ${amount.toLocaleString()}`;
  },

  render(html) {
    document.getElementById('screen').innerHTML = html;
  },

  append(html) {
    document.getElementById('screen').innerHTML += html;
  },

  /* ========== ステータスバー ========== */
  updateStatusBar(state) {
    const bar = document.getElementById('status-bar');
    if (state.phase === 'intro' || state.phase === 'setup') {
      bar.classList.remove('active');
      return;
    }
    bar.classList.add('active');

    const hpBlocks = Array.from({ length: state.maxHp }, (_, i) => {
      if (i < state.hp) {
        if (state.hp <= 3) return '<span class="critical"></span>';
        if (state.hp <= 6) return '<span class="low"></span>';
        return '<span class="filled"></span>';
      }
      return '<span></span>';
    }).join('');

    bar.innerHTML = `
      <div class="status-period">${state.period}期目 ${state.month}月 ／ ナホン・トーキョ区</div>
      <div class="status-grid">
        <span class="label">🏢 法人</span>
        <span class="value ${state.balance < 200000 ? 'danger' : 'safe'}">${UI.money(state.balance)}</span>
        <span class="label">👤 個人</span>
        <span class="value">${UI.money(state.personalBalance)}</span>
        <span class="label">❤️ 体力</span>
        <span class="value"><div class="hp-bar-mini">${hpBlocks}</div></span>
        <span class="label">⭐ 信用</span>
        <span class="value">${state.credit}</span>
      </div>
    `;
  },

  /* ========== オープニング ========== */
  renderIntro() {
    return `
      <div class="game-title">
        <h1>起業しろ！</h1>
        <div class="subtitle">〜ナホン成り上がり経営記〜</div>
      </div>
      <div class="panel">
        <div class="intro-text">
          ナホン国・トーキョ区。<br><br>
          あなたは30歳のサラリーマン。<br>
          貯金はƴ500万。仕事はそこそこ。人生もそこそこ。<br><br>
          「このまま定年まで働くのか…？」<br><br>
          ある日、あなたは決意する。<br><br>
          <strong>「会社を辞めて、起業しよう」</strong><br><br>
          貯金ƴ500万。人脈ゼロ。経験ゼロ。<br>
          税金？社会保険？決算？なにそれ？<br><br>
          あなたの5年間が、今始まる。
        </div>
        <button class="btn btn-block" onclick="App.startSetup()">起業する</button>
      </div>
      <div class="disclaimer">
        本作は架空の国「ナホン」を舞台にしたフィクションの経営シミュレーションゲームです。
        登場する制度・税率・法律はすべて架空のものであり、実在する国の税制とは異なります。
        実際の起業・税務判断については専門家にご相談ください。
      </div>
    `;
  },

  /* ========== セットアップ ========== */
  renderIndustrySelect() {
    const industries = Object.values(DATA.INDUSTRIES);
    const difficultyStars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);
    const choices = industries.map(ind => `
      <button class="choice-btn industry-btn" onclick="App.selectIndustry('${ind.id}')">
        <div class="choice-header">
          <span class="choice-title">${ind.icon} ${ind.name}</span>
          <span class="difficulty">難易度: ${difficultyStars(ind.difficulty)}</span>
        </div>
        <div class="choice-desc">${ind.description}</div>
        <div class="industry-stats">
          <span>初期費用: Ƴ${ind.initialCost.toLocaleString()}</span>
          <span>月間経費: Ƴ${ind.monthlyCost.toLocaleString()}</span>
        </div>
      </button>
    `).join('');

    return `
      <div class="panel">
        <div class="panel-title">🏭 業種を選択</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:12px;">何で起業する？</p>
        <div class="btn-group">${choices}</div>
      </div>
    `;
  },

  renderCompanyTypeSelect() {
    const choices = DATA.COMPANY_TYPES.map(ct => `
      <button class="choice-btn" onclick="App.selectCompanyType('${ct.id}')">
        <div class="choice-title">${ct.name}</div>
        <div class="choice-desc">${ct.description}${ct.creditBonus > 0 ? ` ／ 信用+${ct.creditBonus}` : ''}</div>
      </button>
    `).join('');

    return `
      <div class="panel">
        <div class="panel-title">🏛️ 法人形態を選択</div>
        <div class="btn-group">${choices}</div>
      </div>
    `;
  },

  renderCapitalSelect() {
    return `
      <div class="panel">
        <div class="panel-title">💰 資本金を設定</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:12px;">
          貯金Ƴ500万のうち、いくらを資本金にする？<br>
          残りは個人の生活費になる。
        </p>
        <div class="slider-section">
          <div class="slider-label">
            <span>資本金</span>
            <span id="capital-value">Ƴ1,000,000</span>
          </div>
          <input type="range" min="100000" max="4000000" step="100000" value="1000000"
            oninput="document.getElementById('capital-value').textContent='Ƴ'+Number(this.value).toLocaleString()">
          <div class="slider-hint">
            個人の残り: <span id="capital-personal">Ƴ4,000,000</span>
          </div>
        </div>
        <script>
          document.querySelector('.slider-section input').addEventListener('input', function() {
            const remain = 5000000 - Number(this.value);
            document.getElementById('capital-personal').textContent = 'Ƴ' + remain.toLocaleString();
          });
        </script>
        <button class="btn btn-block" style="margin-top:12px" onclick="App.setCapital(Number(document.querySelector('.slider-section input').value))">決定</button>
      </div>
    `;
  },

  renderSalarySelect() {
    return `
      <div class="panel">
        <div class="panel-title">💼 役員報酬を設定</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:12px;">
          自分の月給をいくらにする？<br>
          一度決めたら1年間変更できない。<br>
          高すぎると会社のお金がなくなる。低すぎると生活できない。
        </p>
        <div class="slider-section">
          <div class="slider-label">
            <span>月額役員報酬</span>
            <span id="salary-value">Ƴ200,000</span>
          </div>
          <input type="range" min="0" max="500000" step="10000" value="200000"
            oninput="document.getElementById('salary-value').textContent='Ƴ'+Number(this.value).toLocaleString(); UI.updateSalaryHint(this.value)">
          <div class="slider-hint" id="salary-hint">
            年間: Ƴ2,400,000 ／ 社会保険料（会社負担）: 月Ƴ28,000
          </div>
        </div>
        <button class="btn btn-block" style="margin-top:12px" onclick="App.setSalary(Number(document.querySelector('.slider-section input').value))">この金額で起業する！</button>
      </div>
    `;
  },

  updateSalaryHint(val) {
    const v = Number(val);
    const annual = v * 12;
    const socialIns = Math.round(v * DATA.TAX.socialInsCompanyRate);
    document.getElementById('salary-hint').innerHTML =
      `年間: Ƴ${annual.toLocaleString()} ／ 社会保険料（会社負担）: 月Ƴ${socialIns.toLocaleString()}`;
  },

  /* ========== 月初画面 ========== */
  renderMonthStart(state) {
    // 案件ボード
    const activeProjects = state.projects.filter(p => p.status === 'active');
    const waitingProjects = state.projects.filter(p => p.status === 'waiting');
    const projectsHtml = (activeProjects.length + waitingProjects.length) > 0
      ? `
        <div class="panel">
          <div class="panel-title">📋 案件ボード</div>
          ${activeProjects.map(p => {
            const progress = ((p.monthsTotal - p.monthsLeft) / p.monthsTotal) * 100;
            return `
              <div class="project-item active">
                <div class="project-name">${p.icon} ${p.name}</div>
                <div class="project-detail">報酬: Ƴ${p.price.toLocaleString()} ／ 残り${Math.ceil(p.monthsLeft)}ヶ月</div>
                <div class="progress-bar"><div class="fill" style="width:${progress}%"></div></div>
              </div>
            `;
          }).join('')}
          ${waitingProjects.map(p => `
            <div class="project-item waiting">
              <div class="project-name">${p.icon} ${p.name}</div>
              <div class="project-detail">報酬: Ƴ${p.price.toLocaleString()} ／ 待ち（${p.monthsTotal}ヶ月）</div>
            </div>
          `).join('')}
          <div style="font-size:0.78rem;color:var(--text2);margin-top:6px;">
            制作キャパ: ${getProductionCapacity(state).toFixed(1)} 案件分/月
          </div>
        </div>
      `
      : '';

    // 従業員
    const empHtml = state.employees.length > 0
      ? `
        <div class="panel">
          <div class="panel-title">👥 従業員</div>
          ${state.employees.map(emp => {
            const satBlocks = Array.from({ length: 5 }, (_, i) => {
              const threshold = (i + 1) * 20;
              if (emp.satisfaction >= threshold) {
                if (emp.satisfaction <= 30) return '<span class="low"></span>';
                if (emp.satisfaction <= 60) return '<span class="mid"></span>';
                return '<span class="filled"></span>';
              }
              return '<span></span>';
            }).join('');

            // 満足度に応じたステータス
            let satStatus = '';
            if (emp.satisfaction >= 70) {
              satStatus = '<span class="sat-status good">好調</span>';
            } else if (emp.satisfaction >= 40) {
              satStatus = '<span class="sat-status mid">普通</span>';
            } else {
              satStatus = '<span class="sat-status bad">不満 ⚠</span>';
            }

            // スキル効果の説明
            const skillKey = emp.label === 'デザイナー' ? 'designer'
              : emp.label === 'エンジニア' ? 'engineer'
              : emp.label === 'マーケター' ? 'marketer'
              : 'generalist';
            const skillDesc = DATA.EMPLOYEE_SKILLS[skillKey]?.description || '';

            return `
              <div class="employee-card ${emp.satisfaction < 40 ? 'warning' : ''}">
                <div class="emp-info">
                  <div class="emp-name">${emp.name}（${emp.label}）</div>
                  <div class="emp-detail">給料: Ƴ${emp.salary.toLocaleString()}/月</div>
                  <div class="emp-skill">${skillDesc}</div>
                </div>
                <div class="emp-status">
                  ${satStatus}
                  <div class="satisfaction-bar">${satBlocks}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `
      : '';

    // 売掛金
    const recvHtml = state.receivables.length > 0
      ? `
        <div class="panel">
          <div class="panel-title">📄 入金予定（売掛金）</div>
          ${state.receivables.map(r => `
            <div class="pl-row">
              <span>${r.name}</span>
              <span>${UI.money(r.amount)}</span>
            </div>
          `).join('')}
        </div>
      `
      : '';

    // 融資返済状況
    const loansHtml = state.loans.length > 0
      ? `
        <div class="panel loans-panel">
          <div class="panel-title">🏦 融資返済</div>
          ${state.loans.map(loan => {
            const progress = ((36 - loan.remainingMonths) / 36) * 100;
            const remainingTotal = loan.monthlyRepay * loan.remainingMonths;
            return `
              <div class="loan-item">
                <div class="loan-item-header">
                  <span>${loan.icon || '🏦'} ${loan.name || '融資'}</span>
                  <span class="loan-remaining">残${loan.remainingMonths}ヶ月</span>
                </div>
                <div class="loan-item-detail">
                  <span>月々返済: Ƴ${loan.monthlyRepay.toLocaleString()}</span>
                  <span>残債: Ƴ${remainingTotal.toLocaleString()}</span>
                </div>
                <div class="progress-bar loan-progress">
                  <div class="fill" style="width:${progress}%"></div>
                </div>
              </div>
            `;
          }).join('')}
          <div class="loan-summary">
            <span>今月の返済合計</span>
            <span class="negative">Ƴ${state.loans.reduce((sum, l) => sum + l.monthlyRepay, 0).toLocaleString()}</span>
          </div>
        </div>
      `
      : '';

    return `
      <div class="panel">
        <div class="panel-title">📅 ${state.period}期目 ${state.month}月</div>
        <p style="font-size:0.88rem;">さて、今月はどうする？</p>
      </div>
      ${projectsHtml}
      ${empHtml}
      ${recvHtml}
      ${loansHtml}
      <button class="btn btn-block" onclick="App.startCardPhase()">カードを引く</button>
    `;
  },

  /* ========== カード選択 ========== */
  renderCardSelect(state) {
    const remaining = DATA.CARDS_PLAY - state.selectedCards.length;
    const canSkip = state.selectedCards.length > 0;

    const handHtml = state.hand.map((card, i) => {
      const isSelected = state.selectedCards.includes(i);
      const canSelect = !isSelected && remaining > 0 && state.hp >= card.hpCost;
      const catClass = card.category;

      return `
        <div class="card ${isSelected ? 'selected' : ''} ${!canSelect && !isSelected ? 'disabled' : ''}"
             onclick="${canSelect ? `App.selectCard(${i})` : ''}">
          <div class="card-header">
            <span class="card-name">${card.icon} ${card.name}</span>
            <span class="card-cat ${catClass}">${card.category}</span>
          </div>
          <div class="card-desc">${card.description}</div>
          <div class="card-stats">
            <span>❤️ -${card.hpCost}</span>
            ${isSelected ? '<span style="color:var(--green);">✓ 選択済み</span>' : ''}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="panel">
        <div class="panel-title">🃏 カードを選択</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:8px;">
          あと<strong>${remaining}枚</strong>選べます（体力が足りないカードは使えません）
        </p>
      </div>
      <div class="hand-area">${handHtml}</div>
      ${canSkip ? '<button class="btn btn-block btn-secondary" onclick="App.skipRemainingCards()">これで決定</button>' : ''}
    `;
  },

  /* ========== コスト選択 ========== */
  renderCostSelect(state, card) {
    const optionsHtml = card.costOptions.map((opt, i) => `
      <div class="cost-option" onclick="App.selectCostOption(${i})">
        <div class="cost-label">${opt.label}${opt.cost > 0 ? ` （Ƴ${opt.cost.toLocaleString()}）` : ' （無料）'}</div>
        <div class="cost-detail">${opt.desc}</div>
      </div>
    `).join('');

    return `
      <div class="panel">
        <div class="panel-title">${card.icon} ${card.name}</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:8px;">どれくらい投じる？</p>
        <div class="cost-select">${optionsHtml}</div>
      </div>
    `;
  },

  /* ========== 見積もり画面 ========== */
  renderQuoteInput(state, project) {
    const accAdvice = state.accountant !== 'none'
      ? `<div class="advisor-box">
           <div class="advisor-name">💬 ${DATA.ACCOUNTANTS[state.accountant].name}</div>
           「Ƴ${project.basePrice.toLocaleString()}くらいが相場ですね。安すぎると赤字、高すぎると逃げられます。」
         </div>`
      : '';

    return `
      <div class="panel">
        <div class="panel-title">💼 見積もりを出す</div>
        <div style="font-size:0.9rem;margin-bottom:8px;">
          <strong>${project.icon} ${project.name}</strong><br>
          <span style="color:var(--text2);">工期: 約${project.monthsTotal}ヶ月</span>
        </div>
        <div class="quote-section">
          <div class="quote-range">
            <span>Ƴ${project.minPrice.toLocaleString()}</span>
            <span>相場 Ƴ${project.basePrice.toLocaleString()}</span>
            <span>Ƴ${project.maxPrice.toLocaleString()}</span>
          </div>
          <div class="quote-input-row">
            <input type="range" min="${project.minPrice}" max="${project.maxPrice}"
              step="10000" value="${project.basePrice}"
              oninput="UI.updateQuoteUI(this.value, ${project.basePrice})">
            <span class="quote-value" id="quote-val">Ƴ${project.basePrice.toLocaleString()}</span>
          </div>
          <div class="quote-prob" id="quote-prob">受注確率: ${Math.round(calcWinRate(project, project.basePrice, state) * 100)}%</div>
        </div>
        ${accAdvice}
        <button class="btn btn-block" style="margin-top:12px" onclick="App.submitQuote(Number(document.querySelector('.quote-input-row input').value))">見積もり送付</button>
      </div>
    `;
  },

  updateQuoteUI(val, basePrice) {
    const v = Number(val);
    document.getElementById('quote-val').textContent = 'Ƴ' + v.toLocaleString();
    // 受注確率を概算で表示（信用スコアボーナス込み）
    const ratio = v / basePrice;
    let rate = 1.0 - (ratio - 0.5) * 0.6;
    // 信用スコアボーナス（最大+15%）
    if (App.state) {
      const creditBonus = (App.state.credit / 100) * 0.15;
      rate += creditBonus;
    }
    rate = Math.max(0.05, Math.min(0.95, rate));
    const pct = Math.round(rate * 100);
    const probEl = document.getElementById('quote-prob');
    probEl.textContent = `受注確率: 約${pct}%`;
    probEl.style.color = pct >= 60 ? 'var(--green)' : pct >= 30 ? 'var(--orange)' : 'var(--red)';
  },

  /* ========== カード結果 ========== */
  renderCardResult(state, results) {
    const lines = results.map(r => `<div class="${r.type}">${r.text}</div>`).join('');
    return `
      <div class="result-log">${lines}</div>
      <button class="btn btn-block" onclick="App.afterCardResult()">次へ</button>
    `;
  },

  /* ========== 月末画面 ========== */
  renderMonthEnd(state, log) {
    const hasAccountant = state.accountant !== 'none';

    let detailHtml;
    if (hasAccountant) {
      detailHtml = log.map(item => `
        <div class="pl-row">
          <span>${item.text.split(':')[0]}</span>
          <span class="${item.type === 'positive' ? 'positive' : item.type === 'negative' ? 'negative' : ''}">${item.text.includes(':') ? item.text.split(':').slice(1).join(':').trim() : ''}</span>
        </div>
      `).join('');
    } else {
      // 税理士なし：合計のみ
      const totalLine = log.find(l => l.text.includes('合計支出'));
      const balanceLine = log.find(l => l.text.includes('残高'));
      const incomeLine = log.filter(l => l.type === 'positive');
      detailHtml = `
        ${incomeLine.map(l => `<div class="pl-row"><span>${l.text}</span></div>`).join('')}
        ${totalLine ? `<div class="pl-row total"><span>合計支出</span><span class="negative">${totalLine.text.split(':')[1] || ''}</span></div>` : ''}
        ${balanceLine ? `<div class="pl-row total"><span>残高</span><span class="${state.balance < 0 ? 'negative' : ''}">${balanceLine.text.split(':')[1] || ''}</span></div>` : ''}
        <div style="font-size:0.78rem;color:var(--text2);margin-top:8px;">※ 税理士と契約すると内訳が見えます</div>
      `;
    }

    return `
      <div class="panel">
        <div class="panel-title">📊 ${state.period}期目 ${state.month}月 月末処理</div>
        ${detailHtml}
      </div>
      <button class="btn btn-block" onclick="App.nextMonth()">翌月へ</button>
    `;
  },

  /* ========== 決算画面 ========== */
  renderSettlement(state, result) {
    const hasAccountant = state.accountant !== 'none';
    const hasAdvanced = state.accountant === 'advanced';

    const maxBar = Math.max(result.revenue, result.expense, 1);
    const revPct = (result.revenue / maxBar) * 100;
    const expPct = (result.expense / maxBar) * 100;
    const afterTax = result.profit - result.totalTax;

    // P/L サマリー（常に表示）
    const plSummary = `
      <div class="settlement-summary">
        <div class="settlement-header">📊 第${state.period}期 損益計算書（P/L）</div>
        <div class="settlement-visual">
          <div class="visual-row">
            <div class="visual-label">売上高</div>
            <div class="visual-bar-wrap">
              <div class="visual-bar revenue" style="width:${revPct}%"></div>
            </div>
            <div class="visual-value positive">${UI.money(result.revenue)}</div>
          </div>
          <div class="visual-row">
            <div class="visual-label">経費</div>
            <div class="visual-bar-wrap">
              <div class="visual-bar expense" style="width:${expPct}%"></div>
            </div>
            <div class="visual-value negative">${UI.money(-result.expense)}</div>
          </div>
        </div>
        <div class="settlement-profit ${result.profit >= 0 ? 'positive' : 'negative'}">
          <span>営業利益</span>
          <span>${UI.money(result.profit)}</span>
        </div>
      </div>
    `;

    // 税金パネル
    let taxHtml = `
      <div class="settlement-tax">
        <div class="tax-header">🏛️ 税金</div>
        <div class="tax-grid">
          <div class="tax-item">
            <span class="tax-name">法人税</span>
            <span class="tax-amount">${UI.money(result.corpTax)}</span>
          </div>
          <div class="tax-item">
            <span class="tax-name">均等割 <span class="tax-note">※赤字でも発生</span></span>
            <span class="tax-amount">${UI.money(result.equalTax)}</span>
          </div>
          <div class="tax-item">
            <span class="tax-name">事業税</span>
            <span class="tax-amount">${UI.money(result.bizTax)}</span>
          </div>
          ${result.consumptionTax > 0 ? `
            <div class="tax-item">
              <span class="tax-name">消費税</span>
              <span class="tax-amount">${UI.money(result.consumptionTax)}</span>
            </div>
          ` : ''}
        </div>
        <div class="tax-total">
          <span>税金合計</span>
          <span class="negative">${UI.money(-result.totalTax)}</span>
        </div>
      </div>
    `;

    // 最終利益
    const finalHtml = `
      <div class="settlement-final ${afterTax >= 0 ? 'positive' : 'negative'}">
        <span>税引後利益</span>
        <span class="final-amount">${UI.money(afterTax)}</span>
      </div>
      ${result.lossCarryforward > 0 ? `
        <div class="carryforward-note">繰越欠損金: Ƴ${result.lossCarryforward.toLocaleString()}（来期以降に利用可能）</div>
      ` : ''}
    `;

    let plHtml = '';
    if (hasAccountant) {
      plHtml = `
        <div class="panel settlement-panel">
          ${plSummary}
          ${taxHtml}
          ${finalHtml}
        </div>
      `;
    } else {
      // 税理士なし：サマリーと税金合計のみ
      plHtml = `
        <div class="panel settlement-panel">
          ${plSummary}
          <div class="settlement-tax simple">
            <div class="tax-total">
              <span>税金合計</span>
              <span class="negative">${UI.money(-result.totalTax)}</span>
            </div>
          </div>
          ${finalHtml}
          <div class="accountant-hint">※ 税理士と契約すると税金の内訳が見えます</div>
        </div>
      `;
    }

    // B/S（敏腕税理士のみ）
    let bsHtml = '';
    if (hasAdvanced) {
      const assets = state.balance;
      const liabilities = state.loans.reduce((sum, l) => sum + l.monthlyRepay * l.remainingMonths, 0);
      const equity = assets - liabilities;
      bsHtml = `
        <div class="panel">
          <div class="panel-title">📋 貸借対照表（B/S）</div>
          <div class="bs-visual">
            <div class="bs-side assets">
              <div class="bs-label">資産</div>
              <div class="bs-value">${UI.money(assets)}</div>
            </div>
            <div class="bs-side liabilities">
              <div class="bs-section">
                <div class="bs-label">負債</div>
                <div class="bs-value">${UI.money(liabilities)}</div>
              </div>
              <div class="bs-section equity ${equity >= 0 ? 'positive' : 'negative'}">
                <div class="bs-label">純資産</div>
                <div class="bs-value">${UI.money(equity)}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // 税理士アドバイス
    let adviceHtml = '';
    if (hasAccountant) {
      const acc = DATA.ACCOUNTANTS[state.accountant];
      let advice = '';

      // 状況に応じたアドバイスを選択
      if (state.period === 1) {
        advice = DATA.ACCOUNTANT_COMMENTS.first_year;
      } else if (result.profit < 0) {
        advice = DATA.ACCOUNTANT_COMMENTS.loss;
      } else if (result.profit > 0 && state.period === 2 && state.lossCarryforward === 0) {
        advice = DATA.ACCOUNTANT_COMMENTS.first_black;
      } else if (result.totalTax > result.profit * 0.4) {
        advice = DATA.ACCOUNTANT_COMMENTS.tax_heavy;
      } else if (result.profit > 5000000) {
        advice = DATA.ACCOUNTANT_COMMENTS.profit_high;
      } else {
        advice = DATA.ACCOUNTANT_COMMENTS.profit_low;
      }

      adviceHtml = `
        <div class="advisor-box">
          <div class="advisor-name">💬 ${acc.name}</div>
          ${advice}
        </div>
      `;
    }

    return `
      ${plHtml}
      ${bsHtml}
      ${adviceHtml}
      <button class="btn btn-block" onclick="App.afterSettlement()">${state.period >= 5 ? 'エンディングへ' : '来期の設定へ'}</button>
    `;
  },

  /* ========== 期首設定 ========== */
  renderPeriodSetup(state) {
    return `
      <div class="panel">
        <div class="panel-title">🔄 第${state.period}期スタート</div>
        <p style="font-size:0.88rem;margin-bottom:12px;">新年度です。役員報酬を再設定できます。</p>
        <div class="slider-section">
          <div class="slider-label">
            <span>月額役員報酬</span>
            <span id="new-salary-value">Ƴ${state.salary.toLocaleString()}</span>
          </div>
          <input type="range" min="0" max="800000" step="10000" value="${state.salary}"
            oninput="document.getElementById('new-salary-value').textContent='Ƴ'+Number(this.value).toLocaleString()">
          <div class="slider-hint">
            現在の残高: ${UI.money(state.balance)}
          </div>
        </div>
        ${state.employees.length > 0 ? `
          <div style="margin-top:16px;">
            <div style="font-weight:700;margin-bottom:8px;">従業員の給料調整</div>
            ${state.employees.map((emp, i) => `
              <div style="margin-bottom:10px;">
                <div class="slider-label">
                  <span>${emp.name}（${emp.label}）</span>
                  <span id="emp-salary-${i}">Ƴ${emp.salary.toLocaleString()}</span>
                </div>
                <input type="range" min="${emp.minSalary || 180000}" max="${emp.maxSalary || 400000}" step="10000" value="${emp.salary}"
                  data-emp-index="${i}"
                  oninput="document.getElementById('emp-salary-${i}').textContent='Ƴ'+Number(this.value).toLocaleString()">
              </div>
            `).join('')}
          </div>
        ` : ''}
        <button class="btn btn-block" style="margin-top:16px" onclick="App.confirmPeriodSetup()">この設定で開始</button>
      </div>
    `;
  },

  /* ========== 採用選択 ========== */
  renderHireSelect(state) {
    // App.hireCandidatesを使用（main.jsで設定済み）
    const candidates = App.hireCandidates;

    if (!candidates || candidates.length === 0) {
      return `
        <div class="panel">
          <div class="panel-title">👤 採用</div>
          <p>これ以上の候補者が見つかりませんでした。</p>
          <button class="btn btn-block" onclick="App.afterCardResult()">戻る</button>
        </div>
      `;
    }

    const html = candidates.map((c, i) => `
      <button class="choice-btn" onclick="App.hireEmployee(${i})">
        <div class="choice-title">${c.name}（${c.label}）</div>
        <div class="choice-desc">希望給料: Ƴ${c.baseSalary.toLocaleString()}/月<br>範囲: Ƴ${c.minSalary.toLocaleString()} 〜 Ƴ${c.maxSalary.toLocaleString()}</div>
      </button>
    `).join('');

    return `
      <div class="panel">
        <div class="panel-title">👤 採用候補</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:8px;">誰を採用する？</p>
        <div class="btn-group">${html}</div>
        <button class="btn btn-block btn-secondary" style="margin-top:8px" onclick="App.afterCardResult()">やめておく</button>
      </div>
    `;
  },

  renderHireSalary(state, candidate) {
    return `
      <div class="panel">
        <div class="panel-title">💰 ${candidate.name}の給料を決める</div>
        <div class="slider-section">
          <div class="slider-label">
            <span>月給</span>
            <span id="hire-salary-val">Ƴ${candidate.baseSalary.toLocaleString()}</span>
          </div>
          <input type="range" min="${candidate.minSalary}" max="${candidate.maxSalary}" step="10000" value="${candidate.baseSalary}"
            oninput="document.getElementById('hire-salary-val').textContent='Ƴ'+Number(this.value).toLocaleString()">
          <div class="slider-hint">
            希望: Ƴ${candidate.baseSalary.toLocaleString()} ／ 低いと不満、高いとコスト増
          </div>
        </div>
        <button class="btn btn-block" style="margin-top:12px" onclick="App.confirmHire(Number(document.querySelector('.slider-section input').value))">この金額で採用</button>
      </div>
    `;
  },

  /* ========== エンディング ========== */
  renderEnding(state, ending) {
    return `
      <div class="panel ending-card">
        <div style="font-size:0.85rem;color:var(--text2);">5年間の経営が終了しました</div>
        <div class="ending-rank ${ending.rank}">${ending.rank}ランク</div>
        <div style="font-size:1.1rem;font-weight:700;margin-bottom:20px;">${ending.title}</div>

        <div class="ending-stats">
          <div class="pl-row"><span>累計売上</span><span>${UI.money(state.totalRevenue)}</span></div>
          <div class="pl-row"><span>累計納税</span><span>${UI.money(state.totalTaxPaid)}</span></div>
          <div class="pl-row"><span>最終残高</span><span class="${state.balance >= 0 ? 'positive' : 'negative'}">${UI.money(state.balance)}</span></div>
          <div class="pl-row"><span>従業員数</span><span>${state.employees.length}人</span></div>
          <div class="pl-row"><span>信用スコア</span><span>${state.credit}</span></div>
          <div class="pl-row total"><span>総合スコア</span><span>${Math.round(ending.score)}</span></div>
        </div>

        <button class="btn btn-block" style="margin-top:16px" onclick="App.restart()">もう一度起業する</button>
        <button class="btn btn-block btn-secondary" style="margin-top:8px" onclick="App.shareResult('${ending.rank}', '${ending.title}', ${Math.round(ending.score)})">結果をシェア</button>
      </div>
    `;
  },

  /* ========== イベント ========== */
  renderEvent(event, state) {
    const choicesHtml = event.choices.map((c, i) => `
      <button class="choice-btn" onclick="App.selectEventChoice(${i})">
        <div class="choice-title">${c.text}</div>
      </button>
    `).join('');

    return `
      <div class="event-overlay" onclick="event.stopPropagation()">
        <div class="event-box">
          <div class="event-title">${event.title}</div>
          <div class="event-text">${event.text}</div>
          <div class="btn-group">${choicesHtml}</div>
        </div>
      </div>
    `;
  },

  renderEventResult(text) {
    return `
      <div class="event-overlay">
        <div class="event-box">
          <div class="event-text">${text}</div>
          <button class="btn btn-block" onclick="App.closeEvent()">OK</button>
        </div>
      </div>
    `;
  },

  /* ========== 融資選択 ========== */
  renderLoanSelect(state) {
    const loanTypes = Object.values(DATA.LOAN_TYPES);

    const loansHtml = loanTypes.map(loan => {
      const eligible = loan.condition(state);
      const approval = eligible ? calcLoanApproval(state, loan.id, loan.maxAmount / 2) : null;

      let statusClass = '';
      let statusText = '';
      if (!eligible) {
        statusClass = 'disabled';
        statusText = '条件未達';
      } else if (approval.rate >= 0.6) {
        statusClass = 'good';
        statusText = '審査通りやすい';
      } else if (approval.rate >= 0.3) {
        statusClass = 'mid';
        statusText = '審査普通';
      } else {
        statusClass = 'hard';
        statusText = '審査厳しい';
      }

      return `
        <div class="loan-option ${statusClass}" onclick="${eligible ? `App.selectLoanType('${loan.id}')` : ''}">
          <div class="loan-header">
            <span class="loan-icon">${loan.icon}</span>
            <span class="loan-name">${loan.name}</span>
            <span class="loan-status ${statusClass}">${statusText}</span>
          </div>
          <div class="loan-details">
            <div class="loan-detail-row">
              <span>上限額</span>
              <span>Ƴ${loan.maxAmount.toLocaleString()}</span>
            </div>
            <div class="loan-detail-row">
              <span>金利</span>
              <span>${(loan.interestRate * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div class="loan-desc">${loan.description}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="panel">
        <div class="panel-title">🏦 融資先を選択</div>
        <p style="font-size:0.85rem;color:var(--text2);margin-bottom:12px;">
          どの金融機関に申し込む？
        </p>
        <div class="loan-list">${loansHtml}</div>
        <button class="btn btn-block btn-secondary" style="margin-top:12px" onclick="App.cancelLoan()">やめておく</button>
      </div>
    `;
  },

  renderLoanAmount(state, loan) {
    const step = loan.maxAmount <= 3000000 ? 100000 : 500000;
    const defaultAmount = Math.round(loan.maxAmount / 2 / step) * step;

    return `
      <div class="panel">
        <div class="panel-title">${loan.icon} ${loan.name}</div>
        <div class="loan-info-box">
          <div class="loan-info-row">
            <span>上限額</span>
            <span>Ƴ${loan.maxAmount.toLocaleString()}</span>
          </div>
          <div class="loan-info-row">
            <span>金利</span>
            <span>${(loan.interestRate * 100).toFixed(1)}%（年）</span>
          </div>
        </div>
        <div class="slider-section" style="margin-top:16px;">
          <div class="slider-label">
            <span>借入希望額</span>
            <span id="loan-amount-val">Ƴ${defaultAmount.toLocaleString()}</span>
          </div>
          <input type="range" min="${step}" max="${loan.maxAmount}" step="${step}" value="${defaultAmount}"
            oninput="UI.updateLoanUI(this.value, '${loan.id}')">
          <div class="loan-calc" id="loan-calc">
            <div class="loan-calc-row">
              <span>月々返済（36回）</span>
              <span id="loan-monthly">Ƴ${Math.round((defaultAmount * (1 + loan.interestRate * 3)) / 36).toLocaleString()}</span>
            </div>
            <div class="loan-calc-row">
              <span>総返済額</span>
              <span id="loan-total">Ƴ${Math.round(defaultAmount * (1 + loan.interestRate * 3)).toLocaleString()}</span>
            </div>
            <div class="loan-calc-row approval">
              <span>審査通過率</span>
              <span id="loan-approval">${Math.round(calcLoanApproval(state, loan.id, defaultAmount).rate * 100)}%</span>
            </div>
          </div>
        </div>
        <button class="btn btn-block" style="margin-top:12px" onclick="App.applyForLoan(Number(document.querySelector('.slider-section input').value))">この金額で申し込む</button>
        <button class="btn btn-block btn-secondary" style="margin-top:8px" onclick="UI.render(UI.renderLoanSelect(App.state))">戻る</button>
      </div>
    `;
  },

  updateLoanUI(val, loanTypeId) {
    const v = Number(val);
    const loan = DATA.LOAN_TYPES[loanTypeId];
    document.getElementById('loan-amount-val').textContent = 'Ƴ' + v.toLocaleString();

    const interestTotal = Math.round(v * loan.interestRate * 3);
    const totalRepay = v + interestTotal;
    const monthlyRepay = Math.round(totalRepay / 36);

    document.getElementById('loan-monthly').textContent = 'Ƴ' + monthlyRepay.toLocaleString();
    document.getElementById('loan-total').textContent = 'Ƴ' + totalRepay.toLocaleString();

    const approval = calcLoanApproval(App.state, loanTypeId, v);
    const approvalEl = document.getElementById('loan-approval');
    const pct = Math.round(approval.rate * 100);
    approvalEl.textContent = pct + '%';
    approvalEl.style.color = pct >= 60 ? 'var(--green)' : pct >= 30 ? 'var(--orange)' : 'var(--red)';
  },

  /* ========== ゲームオーバー ========== */
  renderGameOver(reason) {
    return `
      <div class="panel ending-card">
        <div style="font-size:2rem;margin-bottom:12px;">💀</div>
        <div style="font-size:1.2rem;font-weight:700;color:var(--red);margin-bottom:12px;">GAME OVER</div>
        <div style="font-size:0.9rem;margin-bottom:20px;">${reason}</div>
        <button class="btn btn-block" onclick="App.restart()">もう一度起業する</button>
      </div>
    `;
  },
};
