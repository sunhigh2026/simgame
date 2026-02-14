// ========================================
// ゲーム状態管理
// ========================================

import { TAX_RATES } from './data.js';

export function createInitialState() {
  return {
    // 会社情報
    companyName: '',
    companyType: null,
    industry: null,
    capital: 0,
    fiscalMonth: 9,

    // お金
    corporateCash: 0,
    personalCash: 5000000,
    savings: 5000000,

    // 代表給
    monthlySalary: 250000,

    // 期・月
    currentPeriod: 1,
    currentMonth: 1,
    absoluteMonth: 1,

    // 従業員
    employees: [],

    // 累計
    totalRevenue: 0,
    totalExpense: 0,
    totalTaxPaid: 0,
    totalTaxSaved: 0,
    periodRevenue: 0,
    periodExpense: 0,
    periodProfit: 0,

    // 月次
    monthRevenue: 0,
    monthExpense: 0,

    // 内部スコア
    creditScore: 10,
    brandPower: 0,
    stamina: 100,
    taxRisk: 0,

    // 永続効果
    permanentEffects: {
      revenueBase: 0,
      revenueMultiplier: 1.0,
      revenueCap: 500000,
      monthlyExpense: 0,
      taxDeduction: 0,
      creditScore: 0,
    },

    // SNS蓄積
    snsCount: 0,

    // 繰越欠損金
    carryForwardLoss: 0,

    // 期ごとのP/L記録
    periodRecords: [],

    // 使用済みユニークカード
    usedUniqueCards: [],

    // 発火済みイベント
    triggeredEvents: [],

    // デッキ
    deck: [],
    hand: [],
    discardPile: [],

    // ゲーム状態
    phase: 'opening',
    gameOver: false,
    gameOverReason: '',
  };
}

// 月末処理
export function processMonthEnd(state) {
  const result = {
    items: [],
    previousCash: state.corporateCash,
  };

  // 代表給 + 相互扶助金
  const socialInsurance = Math.floor(state.monthlySalary * TAX_RATES.socialInsuranceRate);
  const salaryTotal = state.monthlySalary + socialInsurance;
  state.corporateCash -= salaryTotal;
  state.monthExpense += salaryTotal;
  result.items.push({
    label: `代表給 + 相互扶助金`,
    amount: -salaryTotal,
    detail: `(給与Ƴ${state.monthlySalary.toLocaleString()} + 扶助金Ƴ${socialInsurance.toLocaleString()})`,
  });

  // 個人の手取り（簡易計算：所得税+住民税≒20%とする）
  const personalTax = Math.floor(state.monthlySalary * 0.20);
  const personalInsurance = Math.floor(socialInsurance / 2);
  const takeHome = state.monthlySalary - personalTax - personalInsurance;
  state.personalCash += takeHome;

  // 従業員の給料
  for (const emp of state.employees) {
    const empSocial = Math.floor(emp.salary * TAX_RATES.socialInsuranceRate);
    const empTotal = emp.salary + empSocial;
    state.corporateCash -= empTotal;
    state.monthExpense += empTotal;
    result.items.push({
      label: `${emp.name}さん 給与 + 扶助金`,
      amount: -empTotal,
    });
  }

  // 永続的な固定費
  if (state.permanentEffects.monthlyExpense > 0) {
    state.corporateCash -= state.permanentEffects.monthlyExpense;
    state.monthExpense += state.permanentEffects.monthlyExpense;
    result.items.push({
      label: '固定費（家賃・積立等）',
      amount: -state.permanentEffects.monthlyExpense,
    });
  }

  // 基本の運営コスト
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
  result.cashChange = state.corporateCash - result.previousCash + state.monthRevenue;

  // 資金ショートチェック
  if (state.corporateCash < 0) {
    state.cashShortMonths = (state.cashShortMonths || 0) + 1;
    if (state.cashShortMonths >= 2) {
      state.gameOver = true;
      state.gameOverReason = '2ヶ月連続の資金ショート。支払いができなくなった。';
    }
  } else {
    state.cashShortMonths = 0;
  }

  // 月次リセット
  state.monthRevenue = 0;
  state.monthExpense = 0;

  return result;
}

// 決算処理
export function processSettlement(state) {
  const profit = state.periodRevenue - state.periodExpense;
  const taxDeduction = state.permanentEffects.taxDeduction;

  // 繰越欠損金の適用
  let taxableIncome = profit;
  let usedCarryForward = 0;
  if (taxableIncome > 0 && state.carryForwardLoss > 0) {
    usedCarryForward = Math.min(taxableIncome, state.carryForwardLoss);
    taxableIncome -= usedCarryForward;
    state.carryForwardLoss -= usedCarryForward;
  }

  // 節税控除の適用
  let usedDeduction = 0;
  if (taxableIncome > 0 && taxDeduction > 0) {
    usedDeduction = Math.min(taxableIncome, taxDeduction);
    taxableIncome -= usedDeduction;
  }

  // 税金計算
  let corporateTax = 0;
  if (taxableIncome > 0) {
    if (taxableIncome <= TAX_RATES.corporate.threshold) {
      corporateTax = Math.floor(taxableIncome * TAX_RATES.corporate.low);
    } else {
      corporateTax = Math.floor(
        TAX_RATES.corporate.threshold * TAX_RATES.corporate.low +
        (taxableIncome - TAX_RATES.corporate.threshold) * TAX_RATES.corporate.high
      );
    }
  }

  const citizenTax = TAX_RATES.citizenFlat;
  const businessTax = taxableIncome > 0 ? Math.floor(taxableIncome * TAX_RATES.business) : 0;

  // 取引税（3期目以降 & 前々期売上1000万超）
  let transactionTax = 0;
  if (state.currentPeriod >= 3) {
    const twoPeriodAgo = state.periodRecords[state.currentPeriod - 3];
    if (twoPeriodAgo && twoPeriodAgo.revenue >= TAX_RATES.transactionThreshold) {
      transactionTax = Math.floor(state.periodRevenue * TAX_RATES.transaction * 0.3);
    }
  }

  const totalTax = corporateTax + citizenTax + businessTax + transactionTax;

  // 赤字の場合、繰越欠損金を積む
  if (profit < 0) {
    state.carryForwardLoss += Math.abs(profit);
  }

  // 節税効果の計算
  const taxWithoutSaving = (() => {
    let ti = profit;
    if (ti > 0 && usedCarryForward > 0) ti -= usedCarryForward;
    if (ti <= 0) return citizenTax;
    let ct = ti <= TAX_RATES.corporate.threshold
      ? Math.floor(ti * TAX_RATES.corporate.low)
      : Math.floor(TAX_RATES.corporate.threshold * TAX_RATES.corporate.low + (ti - TAX_RATES.corporate.threshold) * TAX_RATES.corporate.high);
    let bt = Math.floor(ti * TAX_RATES.business);
    return ct + citizenTax + bt + transactionTax;
  })();
  const taxSaved = taxWithoutSaving - totalTax;

  // 納税
  state.corporateCash -= totalTax;
  state.totalTaxPaid += totalTax;
  state.totalTaxSaved += Math.max(0, taxSaved);

  // 期の記録
  state.periodRecords.push({
    period: state.currentPeriod,
    revenue: state.periodRevenue,
    expense: state.periodExpense,
    profit,
    taxableIncome,
    tax: totalTax,
    taxSaved: Math.max(0, taxSaved),
  });

  // 期リセット
  state.periodRevenue = 0;
  state.periodExpense = 0;
  state.periodProfit = 0;

  return {
    revenue: state.periodRecords[state.periodRecords.length - 1].revenue,
    expense: state.periodRecords[state.periodRecords.length - 1].expense,
    profit,
    taxableIncome,
    usedCarryForward,
    usedDeduction,
    corporateTax,
    citizenTax,
    businessTax,
    transactionTax,
    totalTax,
    taxSaved: Math.max(0, taxSaved),
    carryForwardLoss: state.carryForwardLoss,
  };
}

// カード効果の適用
export function applyCardEffect(state, card) {
  const results = [];

  // コスト支払い
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
  const roll = Math.random();
  const failRate = card.failRate || 0;

  if (roll < failRate) {
    results.push({ type: 'fail', text: card.failText || '失敗した…。' });
    return { success: false, results };
  }

  // 売上効果
  if (card.revenueMin !== undefined && card.revenueMax !== undefined) {
    let rev = Math.floor(Math.random() * (card.revenueMax - card.revenueMin + 1)) + card.revenueMin;

    // SNS蓄積効果
    if (card.cumulative) {
      state.snsCount++;
      rev += card.cumulativeBonus * state.snsCount;
    }

    // 永続効果の乗算
    rev = Math.floor(rev * state.permanentEffects.revenueMultiplier);

    // 売上上限チェック
    const cap = state.permanentEffects.revenueCap + (card.tempEffect?.revenueCap || 0);

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
    const emp = {
      ...card.addsEmployee,
      salary: card.addsEmployee.baseSalary,
      hiredPeriod: state.currentPeriod,
      hiredMonth: state.currentMonth,
    };
    state.employees.push(emp);
  }

  return { success: true, results };
}

// 永続効果の月間売上ベースを加算
export function applyPassiveRevenue(state) {
  const base = state.permanentEffects.revenueBase;
  if (base > 0) {
    state.corporateCash += base;
    state.monthRevenue += base;
    return base;
  }
  return 0;
}