import { TAX_RATES } from './data.js';

export function createInitialState() {
  return {
    companyName: '',
    companyType: null,
    industry: null,
    capital: 0,
    fiscalMonth: 9,

    corporateCash: 0,
    personalCash: 5000000,
    savings: 5000000,

    monthlySalary: 250000,

    currentPeriod: 1,
    currentMonth: 1,
    absoluteMonth: 1,

    employees: [],

    totalRevenue: 0,
    totalExpense: 0,
    totalTaxPaid: 0,
    totalTaxSaved: 0,
    periodRevenue: 0,
    periodExpense: 0,

    monthRevenue: 0,
    monthExpense: 0,

    creditScore: 10,
    brandPower: 0,
    stamina: 100,
    taxRisk: 0,

    // 税理士
    accountant: null, // null | 'basic' | 'advanced'
    accountantCost: 0,

    permanentEffects: {
      revenueBase: 0,
      revenueMultiplier: 1.0,
      revenueCap: 500000,
      monthlyExpense: 0,
      taxDeduction: 0,
    },

    snsCount: 0,
    carryForwardLoss: 0,
    periodRecords: [],
    usedUniqueCards: [],
    triggeredEvents: [],

    deck: [],
    hand: [],

    cashShortMonths: 0,
    phase: 'opening',
    gameOver: false,
    gameOverReason: '',

    // 月の開始時の残高を記録
    _lastCash: 0,
  };
}

export function processMonthEnd(state) {
  const result = { items: [], previousCash: state.corporateCash };

  // 役員報酬 + 社会保険料
  const socialIns = Math.floor(state.monthlySalary * TAX_RATES.socialInsuranceRate);
  const salaryTotal = state.monthlySalary + socialIns;
  state.corporateCash -= salaryTotal;
  state.monthExpense += salaryTotal;
  result.items.push({
    label: '役員報酬 + 社会保険料',
    amount: -salaryTotal,
    detail: `(給与Ƴ${state.monthlySalary.toLocaleString()} + 社保Ƴ${socialIns.toLocaleString()})`,
  });

  // 個人の手取り
  const personalTax = Math.floor(state.monthlySalary * 0.20);
  const personalIns = Math.floor(socialIns / 2);
  const takeHome = state.monthlySalary - personalTax - personalIns;
  state.personalCash += takeHome;

  // 従業員
  for (const emp of state.employees) {
    const empSocial = Math.floor(emp.salary * TAX_RATES.socialInsuranceRate);
    const empTotal = emp.salary + empSocial;
    state.corporateCash -= empTotal;
    state.monthExpense += empTotal;
    result.items.push({
      label: `${emp.name}さん 給与 + 社保`,
      amount: -empTotal,
      detail: `(給与Ƴ${emp.salary.toLocaleString()} + 社保Ƴ${empSocial.toLocaleString()})`,
    });
  }

  // 税理士費用
  if (state.accountantCost > 0) {
    state.corporateCash -= state.accountantCost;
    state.monthExpense += state.accountantCost;
    result.items.push({
      label: '税理士 顧問料',
      amount: -state.accountantCost,
    });
  }

  // 永続固定費（家賃・積立等）
  if (state.permanentEffects.monthlyExpense > 0) {
    state.corporateCash -= state.permanentEffects.monthlyExpense;
    state.monthExpense += state.permanentEffects.monthlyExpense;
    result.items.push({
      label: '固定費（家賃・積立等）',
      amount: -state.permanentEffects.monthlyExpense,
    });
  }

  // 基本運営コスト
  const baseCost = state.industry ? state.industry.baseCost : 30000;
  state.corporateCash -= baseCost;
  state.monthExpense += baseCost;
  result.items.push({
    label: '運営経費（通信・雑費等）',
    amount: -baseCost,
  });

  // 累計更新
  state.periodRevenue += state.monthRevenue;
  state.periodExpense += state.monthExpense;
  state.totalRevenue += state.monthRevenue;
  state.totalExpense += state.monthExpense;

  result.newCash = state.corporateCash;

  // 資金ショートチェック
  if (state.corporateCash < 0) {
    state.cashShortMonths = (state.cashShortMonths || 0) + 1;
    if (state.cashShortMonths >= 2) {
      state.gameOver = true;
      state.gameOverReason = '2ヶ月連続の資金ショート。\n支払いができなくなった。';
    }
  } else {
    state.cashShortMonths = 0;
  }

  state.monthRevenue = 0;
  state.monthExpense = 0;

  return result;
}

export function processSettlement(state) {
  const revenue = state.periodRevenue;
  const expense = state.periodExpense;
  const profit = revenue - expense;
  const taxDeduction = state.permanentEffects.taxDeduction;

  let taxableIncome = profit;
  let usedCarryForward = 0;
  if (taxableIncome > 0 && state.carryForwardLoss > 0) {
    usedCarryForward = Math.min(taxableIncome, state.carryForwardLoss);
    taxableIncome -= usedCarryForward;
    state.carryForwardLoss -= usedCarryForward;
  }

  let usedDeduction = 0;
  if (taxableIncome > 0 && taxDeduction > 0) {
    usedDeduction = Math.min(taxableIncome, taxDeduction);
    taxableIncome -= usedDeduction;
  }

  let corporateTax = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= TAX_RATES.corporateTaxThreshold) {
      corporateTax = Math.floor(taxableIncome * TAX_RATES.corporateTaxLow);
    } else {
      corporateTax = Math.floor(
        TAX_RATES.corporateTaxThreshold * TAX_RATES.corporateTaxLow +
        (taxableIncome - TAX_RATES.corporateTaxThreshold) * TAX_RATES.corporateTaxHigh
      );
    }
  }

  const citizenTax = TAX_RATES.citizenFlat;
  const businessTax = taxableIncome > 0 ? Math.floor(taxableIncome * TAX_RATES.businessTax) : 0;

  let consumptionTax = 0;
  if (state.currentPeriod >= 3 && state.periodRecords.length >= 2) {
    const twoPeriodAgo = state.periodRecords[state.currentPeriod - 3];
    if (twoPeriodAgo && twoPeriodAgo.revenue >= TAX_RATES.consumptionTaxThreshold) {
      consumptionTax = Math.floor(revenue * TAX_RATES.consumptionTax * 0.3);
    }
  }

  const totalTax = corporateTax + citizenTax + businessTax + consumptionTax;

  if (profit < 0) {
    state.carryForwardLoss += Math.abs(profit);
  }

  // 節税効果の計算（対策なしとの比較）
  const taxWithoutSaving = (() => {
    let ti = profit;
    if (ti > 0 && usedCarryForward > 0) ti -= usedCarryForward;
    if (ti <= 0) return citizenTax;
    let ct = ti <= TAX_RATES.corporateTaxThreshold
      ? Math.floor(ti * TAX_RATES.corporateTaxLow)
      : Math.floor(TAX_RATES.corporateTaxThreshold * TAX_RATES.corporateTaxLow + (ti - TAX_RATES.corporateTaxThreshold) * TAX_RATES.corporateTaxHigh);
    return ct + citizenTax + Math.floor(ti * TAX_RATES.businessTax) + consumptionTax;
  })();
  const taxSaved = Math.max(0, taxWithoutSaving - totalTax);

  state.corporateCash -= totalTax;
  state.totalTaxPaid += totalTax;
  state.totalTaxSaved += taxSaved;

  state.periodRecords.push({ period: state.currentPeriod, revenue, expense, profit, tax: totalTax, taxSaved });

  state.periodRevenue = 0;
  state.periodExpense = 0;

  return { revenue, expense, profit, taxableIncome, usedCarryForward, usedDeduction, corporateTax, citizenTax, businessTax, consumptionTax, totalTax, taxSaved, carryForwardLoss: state.carryForwardLoss };
}

export function applyCardEffect(state, card) {
  const results = [];

  // 特殊：税理士契約
  if (card.special === 'accountant_basic') {
    state.accountant = 'basic';
    state.accountantCost = 30000;
    state.usedUniqueCards.push(card.id);
    results.push({ type: 'success', text: '税理士 佐藤と顧問契約を結んだ！' });
    results.push({ type: 'permanent', text: '月次P/L・決算詳細が見えるようになった（月Ƴ3万）' });
    return { success: true, results };
  }
  if (card.special === 'accountant_advanced') {
    state.accountant = 'advanced';
    state.accountantCost = 80000;
    state.usedUniqueCards.push(card.id);
    results.push({ type: 'success', text: '敏腕税理士 伊藤と契約した！' });
    results.push({ type: 'permanent', text: 'B/S（貸借対照表）が見えるようになった（月Ƴ8万）' });
    return { success: true, results };
  }

  // コスト
  if (card.cost > 0) {
    state.corporateCash -= card.cost;
    state.monthExpense += card.cost;
    results.push({ type: 'cost', amount: -card.cost, text: `Ƴ${card.cost.toLocaleString()} 支出` });
  }

  // 休息
  if (card.restoreStamina) {
    state.stamina = Math.min(100, state.stamina + card.restoreStamina);
    results.push({ type: 'stamina', text: `体力が${card.restoreStamina}回復した` });
    return { success: true, results };
  }

  // 成否判定
  if (Math.random() < (card.failRate || 0)) {
    results.push({ type: 'fail', text: card.failText || '失敗した…。' });
    return { success: false, results };
  }

  // 売上
  if (card.revenueMin !== undefined && card.revenueMax !== undefined) {
    let rev = Math.floor(Math.random() * (card.revenueMax - card.revenueMin + 1)) + card.revenueMin;
    if (card.cumulative) {
      state.snsCount++;
      rev += card.cumulativeBonus * state.snsCount;
    }
    rev = Math.floor(rev * state.permanentEffects.revenueMultiplier);
    if (rev > 0) {
      state.corporateCash += rev;
      state.monthRevenue += rev;
      results.push({ type: 'revenue', amount: rev, text: card.successText || `Ƴ${rev.toLocaleString()} の売上！` });
    }
  } else if (card.successText) {
    results.push({ type: 'success', text: card.successText });
  }

  // 永続効果
  if (card.permanent && card.permanentEffect) {
    const pe = card.permanentEffect;
    if (pe.revenueBase) state.permanentEffects.revenueBase += pe.revenueBase;
    if (pe.revenueMultiplier) state.permanentEffects.revenueMultiplier *= pe.revenueMultiplier;
    if (pe.revenueCap) state.permanentEffects.revenueCap += pe.revenueCap;
    if (pe.monthlyExpense) state.permanentEffects.monthlyExpense += pe.monthlyExpense;
    if (pe.taxDeduction) state.permanentEffects.taxDeduction += pe.taxDeduction;
    if (pe.creditScore) state.creditScore += pe.creditScore;
    if (card.unique) state.usedUniqueCards.push(card.id);
    results.push({ type: 'permanent', text: card.permanentLabel });
  }

  // 従業員追加
  if (card.addsEmployee) {
    state.employees.push({
      ...card.addsEmployee,
      salary: card.addsEmployee.baseSalary,
      hiredPeriod: state.currentPeriod,
      hiredMonth: state.currentMonth,
    });
  }

  return { success: true, results };
}

export function applyPassiveRevenue(state) {
  const base = state.permanentEffects.revenueBase;
  if (base > 0) {
    state.corporateCash += base;
    state.monthRevenue += base;
    return base;
  }
  return 0;
}
