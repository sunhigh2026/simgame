/* ========== アプリケーションコントローラ ========== */
const App = {
  state: null,
  setupData: {},
  pendingProject: null,
  hireCandidates: [],
  selectedHireIndex: null,
  pendingCardQueue: [],
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

    // 決算チェック（12月末）
    if (this.state.month > 12) {
      this.state.month = 1;
      this.processSettlement();
      return;
    }

    UI.render(UI.renderMonthStart(this.state));

    // イベントチェック
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

    // 成功判定
    if (eff.successChance !== undefined) {
      const roll = Math.random();
      if (roll < eff.successChance) {
        resultText = typeof choice.successText === 'function' ? choice.successText(this.state) : choice.successText;
        if (eff.creditBonus) this.state.credit += eff.creditBonus;
        if (eff.cashInflow) this.state.balance += eff.cashInflow;
        if (eff.bigProject) {
          // 大型案件を直接追加
          const proj = {
            name: 'トーキョ大手企業 - サイトリニューアル',
            client: 'トーキョ大手企業',
            icon: '🏢',
            price: 2000000,
            monthsTotal: 3,
            monthsLeft: 3,
            status: 'active',
          };
          this.state.projects.push(proj);
          this.state.periodRevenue += 0; // 完了時に計上
        }
      } else {
        resultText = typeof choice.failText === 'function' ? choice.failText(this.state) : (choice.failText || '失敗…');
        if (eff.creditEffect) this.state.credit += eff.creditEffect;
      }
    } else {
      resultText = typeof choice.successText === 'function' ? choice.successText(this.state) : choice.successText;
      if (eff.creditBonus) this.state.credit += eff.creditBonus;
      if (eff.cashInflow) this.state.balance += eff.cashInflow;
      if (eff.exitOption) this.state.exitOption = true;
    }

    // HP
    if (eff.hpCost) this.state.hp = Math.max(0, this.state.hp - eff.hpCost);
    if (eff.hpRecover) this.state.hp = Math.min(this.state.maxHp, this.state.hp + eff.hpRecover);

    // コスト
    if (eff.cost) {
      this.state.balance -= eff.cost;
      this.state.periodExpense += eff.cost;
    }

    // 従業員給料
    if (eff.salaryUp && this.state.employees.length > 0) {
      this.state.employees[0].salary += eff.salaryUp;
      this.state.employees[0].satisfaction = Math.min(100, this.state.employees[0].satisfaction + (eff.satisfactionUp || 0));
    }
    if (eff.satisfactionDown && this.state.employees.length > 0) {
      this.state.employees[0].satisfaction = Math.max(0, this.state.employees[0].satisfaction - eff.satisfactionDown);
    }
    if (eff.satisfactionUp && !eff.salaryUp && this.state.employees.length > 0) {
      this.state.employees[0].satisfaction = Math.min(100, this.state.employees[0].satisfaction + eff.satisfactionUp);
    }

    // 遅延
    if (eff.delayMonths) {
      // 売掛金の入金を遅らせる
      if (this.state.receivables.length > 0) {
        this.state.receivables[this.state.receivables.length - 1].dueMonth += eff.delayMonths;
      }
    }

    // 追徴課税
    if (eff.auditPenaltyChance && Math.random() < eff.auditPenaltyChance) {
      this.state.balance -= 150000;
      resultText += '\n\n追徴課税: Ƴ150,000…';
    }

    // イベント結果表示
    document.querySelector('.event-overlay').outerHTML = '';
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
    document.querySelector('.event-overlay').outerHTML = '';
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
      // すべてのカード処理完了 → 制作 → 月末
      this.processProductionPhase();
      return;
    }

    const cardIndex = this.state.selectedCards[this.state.currentCardIndex];
    const card = this.state.hand[cardIndex];

    // コスト選択画面
    UI.render(UI.renderCostSelect(this.state, card));
    UI.updateStatusBar(this.state);
  },

  selectCostOption(optIndex) {
    const cardIndex = this.state.selectedCards[this.state.currentCardIndex];
    const card = this.state.hand[cardIndex];
    const opt = card.costOptions[optIndex];

    // HP消費
    const hpCost = card.hpCostByOption ? card.hpCostByOption[optIndex] : card.hpCost;
    this.state.hp = Math.max(0, this.state.hp - hpCost);

    // コスト支払い
    if (opt.cost > 0) {
      this.state.balance -= opt.cost;
      this.state.periodExpense += opt.cost;
    }

    const results = [];

    // --- カードタイプ別処理 ---

    // 営業系：案件生成
    if (card.category === 'sales' && opt.projectChance !== undefined) {
      const roll = Math.random();
      if (roll < opt.projectChance + (this.state.credit / 200)) {
        const proj = generateProject(this.state, opt.projectTier || 0);
        this.pendingProject = proj;
        this.state.currentCardIndex++;
        // 見積もり画面へ
        UI.render(UI.renderQuoteInput(this.state, proj));
        UI.updateStatusBar(this.state);
        return;
      } else {
        results.push({ text: '😔 今回は案件につながらなかった…', type: 'negative' });
        results.push({ text: '信用スコアが少し上がった (+1)', type: 'neutral' });
        this.state.credit += 1;
      }
    }

    // 投資系
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

    // 人材系：採用
    if (card.id === 'hr_recruit') {
      const roll = Math.random();
      if (roll < opt.hireChance) {
        this.state.currentCardIndex++;
        UI.render(UI.renderHireSelect(this.state));
        UI.updateStatusBar(this.state);
        return;
      } else {
        results.push({ text: '😔 良い候補者が見つからなかった…', type: 'negative' });
      }
    }

    // 人材系：育成
    if (card.id === 'hr_training' && opt.effect && opt.effect.skillUp) {
      if (this.state.employees.length > 0) {
        this.state.employees[0].skill = (this.state.employees[0].skill || 0) + opt.effect.skillUp;
        this.state.employees[0].satisfaction = Math.min(100, this.state.employees[0].satisfaction + 5);
        results.push({ text: `${this.state.employees[0].name}のスキルが上がった！`, type: 'positive' });
      }
    }

    // 税理士
    if (card.id === 'tax_accountant' || card.id === 'tax_accountant_adv') {
      this.state.accountant = opt.effect.accountant;
      results.push({ text: `${DATA.ACCOUNTANTS[opt.effect.accountant].name}と契約しました！`, type: 'positive' });
      if (card.id === 'tax_accountant') results.push({ text: '月次P/Lが見えるようになりました', type: 'positive' });
      if (card.id === 'tax_accountant_adv') results.push({ text: 'B/Sも表示されます', type: 'positive' });
    }

    // 節税系
    if ((card.id === 'tax_shokibo' || card.id === 'tax_car') && opt.effect) {
      if (opt.effect.monthlyExpense) this.state.extraMonthlyExpense += opt.effect.monthlyExpense;
      if (opt.effect.taxDeduction) this.state.annualTaxDeduction += opt.effect.taxDeduction;
      if (opt.effect.creditBonus) this.state.credit += opt.effect.creditBonus;
      if (opt.effect.auditRisk) this.state.auditRisk += opt.effect.auditRisk;
      results.push({ text: '節税策を導入しました', type: 'positive' });
      if (opt.effect.auditRisk) results.push({ text: '⚠ 税務調査リスクが上昇', type: 'negative' });
      if (card.oneTime) this.state.usedOneTimeCards.push(card.id);
    }

    // 融資
    if (card.id === 'special_loan') {
      const approval = opt.approvalBase + (this.state.credit / 200) + (this.state.totalRevenue > 0 ? 0.1 : 0);
      if (Math.random() < approval) {
        this.state.balance += opt.loanAmount;
        this.state.loans.push({ monthlyRepay: opt.monthlyRepay, remainingMonths: 36 });
        results.push({ text: `融資承認！Ƴ${opt.loanAmount.toLocaleString(