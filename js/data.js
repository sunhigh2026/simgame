export const INDUSTRIES = {
  web: {
    id: 'web',
    name: 'Web制作',
    icon: '💻',
    description: '一人で始められる。スキルがあれば粗利は高いが、営業力がないと仕事が来ない。',
    initialCost: 50000,
    baseRevenue: { min: 0, max: 300000 },
    baseCost: 30000,
    revenueGrowthRate: 1.08,
    difficulty: 2,
  },
  cafe: {
    id: 'cafe',
    name: 'カフェ開業',
    icon: '☕',
    description: '物件・内装・設備で300万は飛ぶ。売上は立ちやすいが、原価と家賃に殺される。',
    initialCost: 3000000,
    baseRevenue: { min: 200000, max: 500000 },
    baseCost: 250000,
    revenueGrowthRate: 1.03,
    difficulty: 4,
  },
  ec: {
    id: 'ec',
    name: 'EC物販',
    icon: '📦',
    description: '仕入れて売る。シンプル。在庫管理と価格競争が命。',
    initialCost: 500000,
    baseRevenue: { min: 100000, max: 400000 },
    baseCost: 150000,
    revenueGrowthRate: 1.06,
    difficulty: 3,
  },
  consul: {
    id: 'consul',
    name: 'コンサル・講師業',
    icon: '🎓',
    description: '体ひとつで始められる。ただし「信用ゼロ」からのスタート。最初の1件が遠い。',
    initialCost: 30000,
    baseRevenue: { min: 0, max: 200000 },
    baseCost: 20000,
    revenueGrowthRate: 1.10,
    difficulty: 3,
  }
};

export const COMPANY_TYPES = {
  seisha: {
    id: 'seisha',
    name: '正社（せいしゃ）',
    cost: 250000,
    creditBonus: 10,
    description: '信用度が高い。融資・大手取引に有利。',
  },
  ryakusha: {
    id: 'ryakusha',
    name: '略社（りゃくしゃ）',
    cost: 100000,
    creditBonus: 0,
    description: '安く作れる。でも「略社って何？」と言われがち。',
  }
};

export const TAX_RATES = {
  corporateTaxLow: 0.14,
  corporateTaxHigh: 0.22,
  corporateTaxThreshold: 8000000,
  citizenFlat: 70000,
  businessTax: 0.05,
  consumptionTax: 0.08,
  consumptionTaxThreshold: 10000000,
  socialInsuranceRate: 0.28,
};

export const FISCAL_MONTHS = [
  { value: 3, label: '3月（一般的）', description: '多くの会社が採用する決算月' },
  { value: 9, label: '9月', description: '設立月から遠い＝1期目が長くなる' },
  { value: 12, label: '12月', description: '年末で区切る。わかりやすい' },
];

export const ACCOUNTANT_PLANS = {
  none: {
    id: 'none',
    name: 'なし',
    cost: 0,
    description: '自分でなんとかする。通帳残高しか見えない。',
    features: [],
  },
  basic: {
    id: 'basic',
    name: '税理士 佐藤',
    cost: 30000,
    description: '月Ƴ3万。月次P/Lが見える。節税アドバイスあり。',
    features: ['monthlyPL', 'taxAdvice', 'detailedSettlement'],
  },
  advanced: {
    id: 'advanced',
    name: '敏腕税理士 伊藤',
    cost: 80000,
    description: '月Ƴ8万。P/L＋B/Sが見える。高度な節税提案。',
    features: ['monthlyPL', 'taxAdvice', 'detailedSettlement', 'balanceSheet', 'advancedTax'],
  },
};
