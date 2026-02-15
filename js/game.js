/* ========== ゲーム状態管理 ========== */
function createInitialState(industry, companyType, capital, salary) {
  const ind = DATA.INDUSTRIES[industry];
  const comp = DATA.COMPANY_TYPES.find(c => c.id === companyType);

  const balance = DATA.INITIAL_SAVINGS - comp.cost - ind.initialCost - capital;

  return {
    // 基本
    companyName: '',
    industry: industry,
    companyType: companyType,
    capitalAmount: capital,
    balance: balance + capital, // 会社口座 = 資本金
    personalBalance: balance,   // 個人残高
    salary: salary,            // 役員報酬（月額）

    // 時間
    period: 1,
    month: 1,
    totalMonths: 0,

    // 体力
    hp: DATA.MAX_HP,
    maxHp: DATA.MAX_HP,

    // 信用
    credit: 30 + comp.creditBonus,

    // 税理士
    accountant: 'none',

    // 従業員
    employees: [],

    // 案件パイプライン
    projects: [],        // { name, client, price, monthsTotal, monthsLeft, status: 'active'|'waiting'|'done' }
    receivables: [],     // { amount, dueMonth, duePeriod }  売掛金

    // 財務
    totalRevenue: 0,
    totalExpense: 0,
    totalTaxPaid: 0,
    periodRevenue: 0,
    periodExpense: 0,
    lossCarryforward: 0, // 繰越欠損金

    // 月次の追加固定費
    extraMonthlyExpense: 0,
    // 年間の税額控除
    annualTaxDeduction: 0,
    // 税務調査リスク
    auditRisk: 0,

    // 融資
    loans: [],           // { monthlyRepay, remainingMonths }

    // 制作キャパボーナス
    capacityBonus: 0,

    // 使用済みカード・イベント
    usedOneTimeCards: [],
    completedEvents: [],

    // ゲーム進行
    phase: 'intro',      // intro, setup, playing, monthStart, cardSelect, cardCost, cardResult, production, monthEnd, settlement, periodSetup, ending
    hand: [],
    selectedCards: [],
    currentCardIndex: 0,
    selectedCostOption: null,
    monthLog: [],

    // EXIT option
    exitOption: false,

    // 年間サマリ用
    monthlyBalanceHistory: [],
  };
}

/* ========== 制作キャパシティ計算 ========== */
function getProductionCapacity(state) {
  let cap = DATA.PRODUCTION_CAPACITY_SOLO + state.capacityBonus;
  for (const emp of state.employees) {
    let empCap = DATA.PRODUCTION_CAPACITY_PER_EMPLOYEE * (1 + (emp.skill || 0));
    // エンジニアボーナス
    if (emp.label === 'エンジニア') {
      empCap += DATA.EMPLOYEE_SKILLS.engineer.effect.capacityBonus;
    }
    cap += empCap;
  }
  return cap;
}

/* ========== 案件を生成 ========== */
function generateProject(state, tier) {
  const ind = DATA.INDUSTRIES[state.industry];
  const templates = ind.projectTemplates;

  // tierに応じて高単価案件も出る
  const maxIndex = Math.min(tier + 2, templates.length);
  const template = templates[Math.floor(Math.random() * maxIndex)];

  const client = DATA.CLIENT_NAMES[Math.floor(Math.random() * DATA.CLIENT_NAMES.length)];

  return {
    name: `${client} - ${template.name}`,
    client: client,
    templateName: template.name,
    icon: template.icon,
    basePrice: template.basePrice,
    minPrice: template.minPrice,
    maxPrice: template.maxPrice,
    monthsTotal: template.months,
    monthsLeft: template.months,
    price: 0,     // 見積もり時に設定
    status: 'negotiating', // negotiating → active → done
    recurring: template.recurring || false,
  };
}

/* ========== 受注確率計算 ========== */
function calcWinRate(project, quotePrice, state) {
  const base = project.basePrice;
  const ratio = quotePrice / base;

  // 相場の0.5倍→95%, 1.0倍→60%, 1.5倍→25%, 2.0倍→5%
  let rate = 1.0 - (ratio - 0.5) * 0.6;

  if (state) {
    // 信用スコアボーナス（最大+15%）
    const creditBonus = (state.credit / 100) * 0.15;
    rate += creditBonus;

    // デザイナーボーナス（+10%）
    const hasDesigner = state.employees.some(e => e.label === 'デザイナー');
    if (hasDesigner) {
      rate += DATA.EMPLOYEE_SKILLS.designer.effect.projectQuality;
    }
  }

  rate = Math.max(0.05, Math.min(0.95, rate));

  return rate;
}

/* ========== 月末処理 ========== */
function processMonthEnd(state) {
  const log = [];
  let totalDeduction = 0;
  let totalIncome = 0;

  // --- 売掛金の入金 ---
  const collected = [];
  const remaining = [];
  for (const recv of state.receivables) {
    if (recv.duePeriod < state.period || (recv.duePeriod === state.period && recv.dueMonth <= state.month)) {
      state.balance += recv.amount;
      totalIncome += recv.amount;
      collected.push(recv);
      log.push({ text: `入金: ${recv.name} Ƴ${recv.amount.toLocaleString()}`, type: 'positive' });
    } else {
      remaining.push(recv);
    }
  }
  state.receivables = remaining;

  // --- 役員報酬 ---
  const salaryDeduction = state.salary;
  totalDeduction += salaryDeduction;
  // 役員報酬から社会保険料（個人負担分）を引いた手取りを個人資産に加算
  const personalSocialIns = Math.round(state.salary * DATA.TAX.socialInsPersonalRate);
  const netSalary = state.salary - personalSocialIns;
  state.personalBalance += netSalary;
  log.push({ text: `役員報酬: Ƴ${salaryDeduction.toLocaleString()}`, type: 'neutral' });

  // --- 社会保険料（会社負担） ---
  const totalSalaries = state.salary + state.employees.reduce((sum, e) => sum + e.salary, 0);
  const socialInsCompany = Math.round(totalSalaries * DATA.TAX.socialInsCompanyRate);
  totalDeduction += socialInsCompany;
  log.push({ text: `社会保険料（会社負担）: Ƴ${socialInsCompany.toLocaleString()}`, type: 'neutral' });

  // --- 従業員給料 ---
  for (const emp of state.employees) {
    totalDeduction += emp.salary;
    log.push({ text: `給料（${emp.name}）: Ƴ${emp.salary.toLocaleString()}`, type: 'neutral' });
  }

  // --- 運営経費 ---
  const ind = DATA.INDUSTRIES[state.industry];
  let opCost = ind.monthlyCost + state.extraMonthlyExpense;
  // 事務スタッフによる経費削減
  const hasGeneralist = state.employees.some(e => e.label === '事務');
  if (hasGeneralist) {
    opCost = Math.round(opCost * (1 - DATA.EMPLOYEE_SKILLS.generalist.effect.costReduction));
  }
  totalDeduction += opCost;
  log.push({ text: `運営経費: Ƴ${opCost.toLocaleString()}${hasGeneralist ? '（事務効率化）' : ''}`, type: 'neutral' });

  // --- 税理士 ---
  const accCost = DATA.ACCOUNTANTS[state.accountant].cost;
  if (accCost > 0) {
    totalDeduction += accCost;
    log.push({ text: `税理士報酬: Ƴ${accCost.toLocaleString()}`, type: 'neutral' });
  }

  // --- 融資返済 ---
  const repaidLoans = [];
  for (let i = 0; i < state.loans.length; i++) {
    const loan = state.loans[i];
    totalDeduction += loan.monthlyRepay;
    loan.remainingMonths--;
    log.push({ text: `融資返済: Ƴ${loan.monthlyRepay.toLocaleString()}`, type: 'neutral' });
    if (loan.remainingMonths <= 0) repaidLoans.push(i);
  }
  // 完済した融資を除去
  for (let i = repaidLoans.length - 1; i >= 0; i--) {
    state.loans.splice(repaidLoans[i], 1);
    log.push({ text: '融資完済！', type: 'positive' });
  }

  // --- 差し引き ---
  state.balance -= totalDeduction;
  state.periodExpense += totalDeduction;
  state.totalExpense += totalDeduction;

  log.push({ text: `───────────`, type: 'neutral' });
  log.push({ text: `合計支出: Ƴ${totalDeduction.toLocaleString()}`, type: 'negative' });
  log.push({ text: `残高: Ƴ${state.balance.toLocaleString()}`, type: state.balance >= 0 ? 'safe' : 'danger' });

  // --- 体力回復（月をまたぐと少し回復） ---
  state.hp = Math.min(state.maxHp, state.hp + 2);

  // --- 従業員満足度チェック ---
  for (const emp of state.employees) {
    // 低賃金ペナルティ
    const template = DATA.EMPLOYEE_TEMPLATES.find(t => t.name === emp.name);
    if (template && emp.salary < template.baseSalary) {
      emp.satisfaction = Math.max(0, emp.satisfaction - 5);
    }
  }

  // --- 残高記録 ---
  state.monthlyBalanceHistory.push({ period: state.period, month: state.month, balance: state.balance });

  return {
    log,
    totalIncome,
    totalExpense: totalDeduction,
    netSalary: state.salary - Math.round(state.salary * DATA.TAX.socialInsPersonalRate),
  };
}

/* ========== 制作フェーズ ========== */
function processProduction(state) {
  const log = [];
  const capacity = getProductionCapacity(state);
  let remaining = capacity;

  // active案件を進める
  const activeProjects = state.projects.filter(p => p.status === 'active');
  for (const proj of activeProjects) {
    if (remaining <= 0) break;
    const work = Math.min(remaining, 1);
    proj.monthsLeft -= work;
    remaining -= work;

    if (proj.monthsLeft <= 0) {
      proj.status = 'done';
      // 売掛金に計上（翌月入金）
      let dueMonth = state.month + 1;
      let duePeriod = state.period;
      if (dueMonth > 12) {
        dueMonth = 1;
        duePeriod++;
      }
      state.receivables.push({
        name: proj.name,
        amount: proj.price,
        dueMonth: dueMonth,
        duePeriod: duePeriod,
      });
      state.periodRevenue += proj.price;
      state.totalRevenue += proj.price;
      log.push({ text: `✅ 納品完了: ${proj.name}（Ƴ${proj.price.toLocaleString()} 翌月入金）`, type: 'positive' });

      // 保守案件は再生成
      if (proj.recurring) {
        const newProj = { ...proj, monthsLeft: 1, status: 'active' };
        state.projects.push(newProj);
        log.push({ text: `🔄 保守契約継続: ${proj.name}`, type: 'neutral' });
      }
    }
  }

  // waiting案件をactiveに昇格（キャパがあれば）
  const waitingProjects = state.projects.filter(p => p.status === 'waiting');
  for (const proj of waitingProjects) {
    const currentActive = state.projects.filter(p => p.status === 'active').length;
    if (currentActive < Math.ceil(capacity + 1)) {
      proj.status = 'active';
      log.push({ text: `▶ 制作開始: ${proj.name}`, type: 'neutral' });
    }
  }

  if (log.length === 0) {
    log.push({ text: '制作中の案件はありません', type: 'neutral' });
  }

  return log;
}

/* ========== 決算処理 ========== */
function processSettlement(state) {
  const revenue = state.periodRevenue;
  const expense = state.periodExpense;
  const profit = revenue - expense;

  let taxableIncome = profit;

  // 繰越欠損金
  if (taxableIncome > 0 && state.lossCarryforward > 0) {
    const deduction = Math.min(taxableIncome, state.lossCarryforward);
    taxableIncome -= deduction;
    state.lossCarryforward -= deduction;
  }

  // 税額控除
  taxableIncome = Math.max(0, taxableIncome - state.annualTaxDeduction);

  // 赤字なら繰越欠損金に加算
  if (profit < 0) {
    state.lossCarryforward += Math.abs(profit);
  }

  // 法人税
  let corpTax = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= DATA.TAX.corp_threshold) {
      corpTax = Math.round(taxableIncome * DATA.TAX.corp_low);
    } else {
      corpTax = Math.round(DATA.TAX.corp_threshold * DATA.TAX.corp_low + (taxableIncome - DATA.TAX.corp_threshold) * DATA.TAX.corp_high);
    }
  }

  // 均等割
  const equalTax = DATA.TAX.equalTax;

  // 事業税
  const bizTax = taxableIncome > 0 ? Math.round(taxableIncome * DATA.TAX.bizTax) : 0;

  // 消費税
  let consumptionTax = 0;
  if (state.period > DATA.TAX.consumptionExemptYears) {
    consumptionTax = Math.round(revenue * DATA.TAX.consumptionTax * 0.3); // 簡易課税的な概算
  }

  const totalTax = corpTax + equalTax + bizTax + consumptionTax;

  state.balance -= totalTax;
  state.totalTaxPaid += totalTax;

  return {
    revenue,
    expense,
    profit,
    taxableIncome,
    corpTax,
    equalTax,
    bizTax,
    consumptionTax,
    totalTax,
    lossCarryforward: state.lossCarryforward,
  };
}

/* ========== ゲームオーバー判定 ========== */
function checkGameOver(state) {
  if (state.balance < -500000) {
    return { over: true, reason: '資金ショート（残高がƴ-50万を下回りました）' };
  }
  return { over: false };
}

/* ========== 融資審査ロジック ========== */
function calcLoanApproval(state, loanType, amount) {
  const loan = DATA.LOAN_TYPES[loanType];
  if (!loan) return { eligible: false, rate: 0, reason: '不明な融資タイプ' };

  // 条件チェック
  if (!loan.condition(state)) {
    let reason = '';
    switch (loanType) {
      case 'jfc':
        reason = '創業2年以内の企業が対象です';
        break;
      case 'shinkin':
        reason = '信用スコア30以上が必要です';
        break;
      case 'mega':
        reason = '黒字2期以上の実績が必要です';
        break;
      default:
        reason = '条件を満たしていません';
    }
    return { eligible: false, rate: 0, reason };
  }

  // 基本承認率
  let rate = loan.approvalBase;

  // 信用スコアボーナス（最大+20%）
  rate += (state.credit / 100) * 0.2;

  // 売上実績ボーナス（+10%）
  if (state.totalRevenue > 0) rate += 0.1;

  // 既存融資ペナルティ（融資1件ごとに-15%）
  rate -= state.loans.length * 0.15;

  // 金額による難易度（申請額/上限額の比率で調整）
  const amountRatio = amount / loan.maxAmount;
  rate -= amountRatio * 0.1;

  // 期数ボーナス（長く続けるほど+）
  rate += (state.period - 1) * 0.05;

  rate = Math.max(0.05, Math.min(0.95, rate));

  return {
    eligible: true,
    rate,
    interestRate: loan.interestRate,
    reason: null
  };
}

/* ========== エンディング判定 ========== */
function calcEnding(state) {
  const score =
    (state.totalRevenue / 1000000) * 10 +
    (state.balance / 1000000) * 20 +
    (state.credit) * 2 +
    (state.employees.length) * 15 -
    (state.totalTaxPaid / 1000000) * 5;

  if (state.exitOption && score > 150) return { rank: 'S', title: 'EXIT成功！伝説の起業家', score };
  if (score > 120) return { rank: 'A', title: '優良企業の社長', score };
  if (score > 80) return { rank: 'B', title: '安定経営者', score };
  if (score > 50) return { rank: 'C', title: 'なんとか生き残った', score };
  if (score > 20) return { rank: 'D', title: 'ギリギリ経営者', score };
  return { rank: 'E', title: '倒産寸前…', score };
}
