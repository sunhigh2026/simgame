/* ========== アプリケーションコントローラ ========== */
const App = {
  state: null,
  setupData: {},
  pendingProject: null,
  hireCandidates: [],
  selectedHireIndex: null,
  currentEvent: null,

  /* ===== 初期化 ===== */
  init() {
    UI.render(UI.renderIntro());
  },

  /* ===== セットアップ ===== */
  startSetup() {
    this.setupData = {};
    UI.render(UI.renderIndustrySelect());
  },

  selectIndustry(id) {
    this.setupData.industry = id;
    UI.render(UI.renderCompanyTypeSelect());
  },

  selectCompanyType(id) {
    this.setupData.companyType = id;
    UI.render(UI.renderCapitalSelect());
  },

  setCapital(amount) {
    this.setupData.capital = amount;
    UI.render(UI.renderSalarySelect());
  },

  setSalary(amount) {
    this.setupData.salary = amount;
    this.state = createInitialState(
      this.setupData.industry,
      this.setupData.companyType,
      this.setupData.capital,
      this.setupData.salary
    );
    this.state.phase = 'playing';
    this.showMonthStart();
  },

  /* ===== 月初 ===== */
  showMonthStart() {
    UI.updateStatusBar(this.state);

    // ゲームオーバーチェック
    const goCheck = checkGameOver(this.state);
    if (goCheck.over) {
      UI.render(UI.renderGameOver(goCheck.reason));
      return;
    }

    // 決算チェック（12月を超えた）
    if (this.state.month > 12) {
      this.state.month = 1;
      this.doSettlement();
      return;
    }

    UI.render(UI.renderMonthStart(this.state));

    // 固定イベントチェック
    const ev = getMonthEvent(this.state);
    if (ev) {
      this.currentEvent = ev;
      this.state.completedEvents.push(ev.id);
      UI.append(UI.renderEvent(ev, this.state));
      return;
    }

    // ランダムイベント
    const randEv = checkRandomEvent(this.state);
    if (randEv) {
      this.handleRandomEvent(randEv);
    }
  },

  /* ===== イベント処理 ===== */
  selectEventChoice(index) {
    const ev = this.currentEvent;
    const choice = ev.choices[index];
    const eff = choice.effect;
    let resultText = '';

    // 成功判定が必要な場合
    if (eff.successChance !== undefined) {
      if (Math.random() < eff.successChance) {
        resultText = typeof choice.successText === 'function'
          ? choice.successText(this.state) : choice.successText;
        if (eff.creditBonus) this.state.credit += eff.creditBonus;
        if (eff.cashInflow) this.state.balance += eff.cashInflow;
        if (eff.bigProject) {
          this.state.projects.push({
            name: 'トーキョ大手企業 - サイトリニューアル',
            client: 'トーキョ大手企業', icon: '🏢',
            price: 2000000, monthsTotal: 3, monthsLeft: 3,
            status: 'active', recurring: false,
          });
        }
      } else {
        resultText = typeof choice.failText === 'function'
          ? choice.failText(this.state) : (choice.failText || '失敗…');
        if (eff.creditEffect) this.state.credit += eff.creditEffect;
        // 失敗時でも信用+3（大型案件落選時など）
        if (eff.bigProject) this.state.credit += 3;
      }
    } else {
      resultText = typeof choice.successText === 'function'
        ? choice.successText(this.state) : choice.successText;
      if (eff.creditBonus) this.state.credit += eff.creditBonus;
      if (eff.cashInflow) this.state.balance += eff.cashInflow;
      if (eff.exitOption) this.state.exitOption = true;
    }

    if (eff.hpCost) this.state.hp = Math.max(0, this.state.hp - eff.hpCost);
    if (eff.hpRecover) this.state.hp = Math.min(this.state.maxHp, this.state.hp + eff.hpRecover);
    if (eff.cost) {
      this.state.balance -= eff.cost;
      this.state.periodExpense += eff.cost;
    }

    // 従業員関連
    if (eff.salaryUp && this.state.employees.length > 0) {
      this.state.employees[0].salary += eff.salaryUp;
      if (eff.satisfactionUp) {
        this.state.employees[0].satisfaction = Math.min(100,
          this.state.employees[0].satisfaction + eff.satisfactionUp);
      }
    }
    if (eff.satisfactionDown && this.state.employees.length > 0) {
      this.state.employees[0].satisfaction = Math.max(0,
        this.state.employees[0].satisfaction - eff.satisfactionDown);
    }
    if (eff.satisfactionUp && !eff.salaryUp && this.state.employees.length > 0) {
      this.state.employees[0].satisfaction = Math.min(100,
        this.state.employees[0].satisfaction + eff.satisfactionUp);
    }

    if (eff.delayMonths && this.state.receivables.length > 0) {
      this.state.receivables[this.state.receivables.length - 1].dueMonth += eff.delayMonths;
    }

    if (eff.auditPenaltyChance && Math.random() < eff.auditPenaltyChance) {
      this.state.balance -= 150000;
      this.state.periodExpense += 150000;
      resultText += '\n\n追徴課税: Ƴ150,000…';
    }

    // イベント結果表示
    const overlay = document.querySelector('.event-overlay');
    if (overlay) overlay.remove();
    UI.append(UI.renderEventResult(resultText));
  },

  handleRandomEvent(ev) {
    let text = ev.text;
    if (ev.effect.hpCost) {
      this.state.hp = Math.max(0, this.state.hp - ev.effect.hpCost);
    }
    if (ev.effect.cost) {
      this.state.balance -= ev.effect.cost;
      this.state.periodExpense += ev.effect.cost;
    }
    if (ev.effect.projectDirect) {
      const proj = generateProject(this.state, ev.effect.tier || 0);
      proj.price = proj.basePrice;
      proj.status = 'active';
      this.state.projects.push(proj);
      text += `\n案件追加: ${proj.name}（Ƴ${proj.price.toLocaleString()}）`;
    }
    UI.append(UI.renderEventResult(text));
  },

  closeEvent() {
    const overlay = document.querySelector('.event-overlay');
    if (overlay) overlay.remove();
    this.currentEvent = null;
  },

  /* ===== カードフェーズ ===== */
  startCardPhase() {
    const deck = buildDeck(this.state);
    this.state.hand = drawHand(deck, DATA.CARDS_DRAW);
    this.state.selectedCards = [];
    this.state.currentCardIndex = 0;
    UI.render(UI.renderCardSelect(this.state));
    UI.updateStatusBar(this.state);
  },

  selectCard(index) {
    this.state.selectedCards.push(index);
    if (this.state.selectedCards.length >= DATA.CARDS_PLAY) {
      this.processNextCard();
    } else {
      UI.render(UI.renderCardSelect(this.state));
    }
  },

  skipRemainingCards() {
    this.processNextCard();
  },

  processNextCard() {
    if (this.state.currentCardIndex >= this.state.selectedCards.length) {
      this.processProductionPhase();
      return;
    }
    const cardIndex = this.state.selectedCards[this.state.currentCardIndex];
    const card = this.state.hand[cardIndex];
    UI.render(UI.renderCostSelect(this.state, card));
    UI.updateStatusBar(this.state);
  },

  /* ===== コスト選択実行 ===== */
  selectCostOption(optIndex) {
    const cardIndex = this.state.selectedCards[this.state.currentCardIndex];
    const card = this.state.hand[cardIndex];
    const opt = card.costOptions[optIndex];

    // HP消費
    const hpCost = card.hpCostByOption
      ? card.hpCostByOption[optIndex] : card.hpCost;
    this.state.hp = Math.max(0, this.state.hp - hpCost);

    // コスト支払い
    if (opt.cost > 0) {
      this.state.balance -= opt.cost;
      this.state.periodExpense += opt.cost;
    }

    const results = [];

    /* --- 営業系 --- */
    if (card.category === 'sales' && opt.projectChance !== undefined) {
      const chance = Math.min(0.95, opt.projectChance + (this.state.credit / 200));
      if (Math.random() < chance) {
        const proj = generateProject(this.state, opt.projectTier || 0);
        this.pendingProject = proj;
        this.state.currentCardIndex++;
        UI.render(UI.renderQuoteInput(this.state, proj));
        UI.updateStatusBar(this.state);
        return; // 見積もり画面に飛ぶので、ここで中断
      } else {
        results.push({ text: '😔 今回は案件につながらなかった…', type: 'negative' });
        this.state.credit = Math.min(100, this.state.credit + 1);
        results.push({ text: '信用スコア +1', type: 'neutral' });
      }
    }

    /* --- 投資系 --- */
    if (card.category === 'invest' && opt.effect) {
      if (opt.effect.capacityBonus) {
        this.state.capacityBonus += opt.effect.capacityBonus;
        results.push({ text: `制作キャパ +${opt.effect.capacityBonus}`, type: 'positive' });
      }
      if (opt.effect.monthlyExpense) {
        this.state.extraMonthlyExpense += opt.effect.monthlyExpense;
        results.push({ text: `月額経費 +Ƴ${opt.effect.monthlyExpense.toLocaleString()}`, type: 'neutral' });
      }
      if (opt.effect.creditBonus) {
        this.state.credit += opt.effect.creditBonus;
        results.push({ text: `信用スコア +${opt.effect.creditBonus}`, type: 'positive' });
      }
      if (card.oneTime) this.state.usedOneTimeCards.push(card.id);
    }

    /* --- 人材：採用 --- */
    if (card.id === 'hr_recruit') {
      if (Math.random() < opt.hireChance) {
        this.state.currentCardIndex++;
        // 候補者選択画面へ
        const hired = this.state.employees.map(e => e.name);
        this.hireCandidates = DATA.EMPLOYEE_TEMPLATES
          .filter(t => !hired.includes(t.name))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);
        UI.render(UI.renderHireSelect(this.state));
        UI.updateStatusBar(this.state);
        return;
      } else {
        results.push({ text: '😔 良い候補者が見つからなかった…', type: 'negative' });
      }
    }

    /* --- 人材：育成 --- */
    if (card.id === 'hr_training' && opt.effect && opt.effect.skillUp) {
      if (this.state.employees.length > 0) {
        const emp = this.state.employees[0];
        emp.skill = (emp.skill || 0) + opt.effect.skillUp;
        emp.satisfaction = Math.min(100, emp.satisfaction + 5);
        results.push({ text: `${emp.name}のスキルが上がった！`, type: 'positive' });
      }
    }

    /* --- 税理士 --- */
    if (card.id === 'tax_accountant' || card.id === 'tax_accountant_adv') {
      const accKey = opt.effect.accountant;
      this.state.accountant = accKey;
      const accName = DATA.ACCOUNTANTS[accKey].name;
      results.push({ text: `${accName}と契約しました！`, type: 'positive' });
      if (accKey === 'basic') results.push({ text: '月次P/Lが見えるようになりました', type: 'positive' });
      if (accKey === 'advanced') results.push({ text: 'B/Sも表示されます', type: 'positive' });
    }

    /* --- 節税 --- */
    if (card.id === 'tax_shokibo' || card.id === 'tax_car') {
      if (opt.effect) {
        if (opt.effect.monthlyExpense)
          this.state.extraMonthlyExpense += opt.effect.monthlyExpense;
        if (opt.effect.taxDeduction)
          this.state.annualTaxDeduction += opt.effect.taxDeduction;
        if (opt.effect.creditBonus)
          this.state.credit += opt.effect.creditBonus;
        if (opt.effect.auditRisk)
          this.state.auditRisk += opt.effect.auditRisk;
        results.push({ text: '節税策を導入しました', type: 'positive' });
        if (opt.effect.auditRisk) {
          results.push({ text: '⚠ 税務調査リスクが上昇', type: 'negative' });
        }
      }
      if (card.oneTime) this.state.usedOneTimeCards.push(card.id);
    }

    /* --- 融資 --- */
    if (card.id === 'special_loan') {
      const approvalRate = Math.min(0.9,
        opt.approvalBase + (this.state.credit / 200)
        + (this.state.totalRevenue > 0 ? 0.1 : 0));
      if (Math.random() < approvalRate) {
        this.state.balance += opt.loanAmount;
        this.state.loans.push({
          monthlyRepay: opt.monthlyRepay,
          remainingMonths: 36,
        });
        results.push({ text: `🎉 融資承認！Ƴ${opt.loanAmount.toLocaleString()} 入金`, type: 'positive' });
        results.push({ text: `毎月の返済: Ƴ${opt.monthlyRepay.toLocaleString()} × 36回`, type: 'neutral' });
      } else {
        results.push({ text: '😔 融資審査に落ちた…信用を上げよう', type: 'negative' });
      }
    }

    /* --- 助成金 --- */
    if (card.id === 'special_subsidy') {
      if (Math.random() < opt.approvalChance) {
        this.state.balance += opt.subsidyAmount;
        results.push({ text: `🎉 助成金採択！Ƴ${opt.subsidyAmount.toLocaleString()} 入金`, type: 'positive' });
      } else {
        results.push({ text: '😔 不採択…また次の機会に', type: 'negative' });
      }
    }

    /* --- 休息 --- */
    if (card.id === 'rest') {
      const recover = opt.hpRecover || 3;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + recover);
      results.push({ text: `体力が ${recover} 回復した（現在 ${this.state.hp}/${this.state.maxHp}）`, type: 'positive' });
    }

    // 結果がなければデフォルトメッセージ
    if (results.length === 0) {
      results.push({ text: `${card.name}を実行した`, type: 'neutral' });
    }

    this.state.currentCardIndex++;
    UI.render(UI.renderCardResult(this.state, results));
    UI.updateStatusBar(this.state);
  },

  /* ===== 見積もり送信 ===== */
  submitQuote(price) {
    const proj = this.pendingProject;
    proj.price = price;
    const winRate = calcWinRate(proj, price);

    if (Math.random() < winRate) {
      // 受注成功
      const activeCount = this.state.projects.filter(
        p => p.status === 'active').length;
      const cap = getProductionCapacity(this.state);
      proj.status = activeCount < Math.ceil(cap + 1) ? 'active' : 'waiting';
      this.state.projects.push(proj);

      const results = [
        { text: `🎉 受注成功！`, type: 'positive' },
        { text: `${proj.icon} ${proj.name}`, type: 'neutral' },
        { text: `金額: Ƴ${price.toLocaleString()} ／ 工期: ${proj.monthsTotal}ヶ月`, type: 'neutral' },
        { text: proj.status === 'active' ? '制作開始！' : 'バックログに追加（制作待ち）', type: 'neutral' },
      ];
      this.pendingProject = null;
      UI.render(UI.renderCardResult(this.state, results));
    } else {
      // 失注
      const results = [
        { text: `😔 失注…「他社にお願いすることにしました」`, type: 'negative' },
        { text: `見積もりƴ${price.toLocaleString()}は高かったかもしれない`, type: 'neutral' },
      ];
      this.state.credit = Math.min(100, this.state.credit + 1);
      this.pendingProject = null;
      UI.render(UI.renderCardResult(this.state, results));
    }
    UI.updateStatusBar(this.state);
  },

  /* ===== カード結果後 ===== */
  afterCardResult() {
    this.processNextCard();
  },

  /* ===== 採用処理 ===== */
  hireEmployee(candidateIndex) {
    const candidate = this.hireCandidates[candidateIndex];
    if (!candidate) {
      this.processNextCard();
      return;
    }
    this.selectedHireIndex = candidateIndex;
    UI.render(UI.renderHireSalary(this.state, candidate));
    UI.updateStatusBar(this.state);
  },

  confirmHire(salary) {
    const candidate = this.hireCandidates[this.selectedHireIndex];
    const satisfaction = salary >= candidate.baseSalary ? 70 : 40;

    this.state.employees.push({
      name: candidate.name,
      label: candidate.label,
      skill: 0,
      salary: salary,
      minSalary: candidate.minSalary,
      maxSalary: candidate.maxSalary,
      baseSalary: candidate.baseSalary,
      satisfaction: satisfaction,
    });

    const results = [
      { text: `🎉 ${candidate.name}（${candidate.label}）を採用しました！`, type: 'positive' },
      { text: `月給: Ƴ${salary.toLocaleString()}`, type: 'neutral' },
      { text: `制作キャパが増加しました`, type: 'positive' },
    ];
    if (salary < candidate.baseSalary) {
      results.push({ text: `⚠ 希望より低い給料のため、満足度がやや低い`, type: 'negative' });
    }

    this.hireCandidates = [];
    this.selectedHireIndex = null;
    UI.render(UI.renderCardResult(this.state, results));
    UI.updateStatusBar(this.state);
  },

  /* ===== 制作フェーズ ===== */
  processProductionPhase() {
    const prodLog = processProduction(this.state);
    const monthEndResult = processMonthEnd(this.state);
    const monthEndLog = monthEndResult.log;

    // 従業員退職チェック
    const quitters = [];
    for (let i = this.state.employees.length - 1; i >= 0; i--) {
      const emp = this.state.employees[i];
      const quitChance = emp.satisfaction < 20 ? 0.4
        : emp.satisfaction < 40 ? 0.15
        : emp.satisfaction < 60 ? 0.05 : 0;
      if (Math.random() < quitChance) {
        quitters.push(emp.name);
        this.state.employees.splice(i, 1);
      }
    }

    // 制作ログ + 月末ログを結合して表示
    let combinedHtml = '';

    // 制作フェーズ
    if (prodLog.length > 0) {
      combinedHtml += `
        <div class="panel">
          <div class="panel-title">🔨 制作フェーズ</div>
          ${prodLog.map(l => `<div class="${l.type}" style="font-size:0.88rem;margin-bottom:4px;">${l.text}</div>`).join('')}
        </div>
      `;
    }

    // 退職通知
    if (quitters.length > 0) {
      combinedHtml += `
        <div class="panel" style="border-left:3px solid var(--red);">
          <div class="panel-title" style="color:var(--red);">😢 退職</div>
          ${quitters.map(name => `<div style="font-size:0.88rem;">${name}が退職しました…「もう限界です」</div>`).join('')}
        </div>
      `;
    }

    // 月末処理 - P/Lビジュアル
    const hasAccountant = this.state.accountant !== 'none';
    const { totalIncome, totalExpense, netSalary } = monthEndResult;
    const maxBar = Math.max(totalIncome, totalExpense, 1);
    const incomePct = (totalIncome / maxBar) * 100;
    const expensePct = (totalExpense / maxBar) * 100;

    // 収支サマリーバー（常に表示）
    const summaryBar = `
      <div class="monthly-summary">
        <div class="summary-row">
          <span class="summary-label">📥 入金</span>
          <div class="summary-bar-container">
            <div class="summary-bar income" style="width:${incomePct}%"></div>
          </div>
          <span class="summary-value positive">Ƴ${totalIncome.toLocaleString()}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">📤 支出</span>
          <div class="summary-bar-container">
            <div class="summary-bar expense" style="width:${expensePct}%"></div>
          </div>
          <span class="summary-value negative">Ƴ${totalExpense.toLocaleString()}</span>
        </div>
        <div class="summary-row net">
          <span class="summary-label">💵 収支</span>
          <span class="summary-value ${totalIncome - totalExpense >= 0 ? 'positive' : 'negative'}">
            ${totalIncome - totalExpense >= 0 ? '+' : ''}Ƴ${(totalIncome - totalExpense).toLocaleString()}
          </span>
        </div>
      </div>
    `;

    let monthEndHtml;
    if (hasAccountant) {
      // 税理士あり：詳細表示
      const detailRows = monthEndLog
        .filter(item => !item.text.includes('───') && !item.text.includes('合計支出') && !item.text.includes('残高'))
        .map(item => {
          const parts = item.text.split(':');
          const label = parts[0];
          const value = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
          return `<div class="pl-row"><span>${label}</span><span class="${item.type === 'positive' ? 'positive' : ''}">${value}</span></div>`;
        }).join('');

      monthEndHtml = `
        ${summaryBar}
        <div class="pl-detail">
          <div class="pl-detail-title">内訳</div>
          ${detailRows}
        </div>
      `;
    } else {
      // 税理士なし：サマリーのみ
      monthEndHtml = `
        ${summaryBar}
        <div style="font-size:0.78rem;color:var(--text2);margin-top:8px;">※ 税理士と契約すると内訳が見えます</div>
      `;
    }

    // 残高表示
    monthEndHtml += `
      <div class="balance-display">
        <div class="balance-row">
          <span>🏢 法人残高</span>
          <span class="${this.state.balance < 0 ? 'negative' : 'safe'}">Ƴ${this.state.balance.toLocaleString()}</span>
        </div>
        <div class="balance-row sub">
          <span>👤 個人資産</span>
          <span>Ƴ${this.state.personalBalance.toLocaleString()}</span>
        </div>
        ${netSalary > 0 ? `<div class="balance-note">今月の手取り: +Ƴ${netSalary.toLocaleString()}</div>` : ''}
      </div>
    `;

    combinedHtml += `
      <div class="panel">
        <div class="panel-title">📊 ${this.state.period}期目 ${this.state.month}月 月末処理</div>
        ${monthEndHtml}
      </div>
    `;

    UI.render(combinedHtml + `<button class="btn btn-block" onclick="App.nextMonth()">翌月へ</button>`);
    UI.updateStatusBar(this.state);
  },

  /* ===== 翌月へ ===== */
  nextMonth() {
    this.state.month++;
    this.state.totalMonths++;
    this.showMonthStart();
  },

  /* ===== 決算 ===== */
  doSettlement() {
    const result = processSettlement(this.state);
    UI.render(UI.renderSettlement(this.state, result));
    UI.updateStatusBar(this.state);
  },

  afterSettlement() {
    if (this.state.period >= 5) {
      // エンディング
      const ending = calcEnding(this.state);
      UI.render(UI.renderEnding(this.state, ending));
      const bar = document.getElementById('status-bar');
      bar.classList.remove('active');
      return;
    }

    // 次の期
    this.state.period++;
    this.state.periodRevenue = 0;
    this.state.periodExpense = 0;
    this.state.annualTaxDeduction = 0; // 年度ごとリセット（再設定が必要）

    UI.render(UI.renderPeriodSetup(this.state));
    UI.updateStatusBar(this.state);
  },

  /* ===== 期首設定確定 ===== */
  confirmPeriodSetup() {
    // 役員報酬
    const salaryInput = document.querySelector('.slider-section input');
    if (salaryInput) {
      this.state.salary = Number(salaryInput.value);
    }

    // 従業員給料
    const empInputs = document.querySelectorAll('[data-emp-index]');
    empInputs.forEach(input => {
      const idx = Number(input.dataset.empIndex);
      if (this.state.employees[idx]) {
        const oldSalary = this.state.employees[idx].salary;
        const newSalary = Number(input.value);
        this.state.employees[idx].salary = newSalary;

        // 満足度調整
        if (newSalary > oldSalary) {
          this.state.employees[idx].satisfaction = Math.min(100,
            this.state.employees[idx].satisfaction + 10);
        } else if (newSalary < oldSalary) {
          this.state.employees[idx].satisfaction = Math.max(0,
            this.state.employees[idx].satisfaction - 15);
        }
      }
    });

    this.state.month = 1;
    this.showMonthStart();
  },

  /* ===== リスタート ===== */
  restart() {
    this.state = null;
    this.setupData = {};
    this.pendingProject = null;
    this.hireCandidates = [];
    this.selectedHireIndex = null;
    this.currentEvent = null;
    const bar = document.getElementById('status-bar');
    bar.classList.remove('active');
    UI.render(UI.renderIntro());
  },

  /* ===== SNSシェア ===== */
  shareResult(rank, title, score) {
    const text = encodeURIComponent(
      `ナホン国で5年間起業してみた。\n結果: ${rank}ランク「${title}」\nスコア: ${score}\n#起業しろ #ナホン経営記`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  },
};

/* ===== 起動 ===== */
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
