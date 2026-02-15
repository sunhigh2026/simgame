/* ========== 定数・マスタデータ ========== */
const DATA = {
  // --- 税率（ナホン国） ---
  TAX: {
    corp_low: 0.14,       // 法人税（利益800万以下）
    corp_high: 0.22,      // 法人税（利益800万超）
    corp_threshold: 8000000,
    equalTax: 70000,      // 均等割（赤字でも）
    bizTax: 0.04,         // 事業税
    consumptionTax: 0.08, // 消費税
    consumptionExemptYears: 2, // 免税期間
    socialInsRate: 0.28,  // 社会保険料率（会社+個人）
    socialInsCompanyRate: 0.14, // 会社負担分
    socialInsPersonalRate: 0.14, // 個人負担分
  },

  // --- 法人形態 ---
  COMPANY_TYPES: [
    {
      id: 'kabushiki',
      name: '正式会社（株式会社相当）',
      cost: 250000,
      description: '信用力が高い。設立費用Ƴ250,000',
      creditBonus: 10,
    },
    {
      id: 'godo',
      name: '略式会社（合同会社相当）',
      cost: 100000,
      description: '設立費用が安い。Ƴ100,000',
      creditBonus: 0,
    },
  ],

  // --- 業種 ---
  INDUSTRIES: {
    web: {
      id: 'web',
      name: 'Web制作',
      icon: '💻',
      description: '一人で始められる。スキルがあれば粗利は高いが、営業力がないと仕事が来ない。',
      initialCost: 50000,
      monthlyCost: 25000,  // サーバー・ツール等
      difficulty: 2,
      // 案件テンプレート
      projectTemplates: [
        { name: 'ランディングページ', basePrice: 150000, minPrice: 80000, maxPrice: 250000, months: 1, icon: '📄' },
        { name: 'コーポレートサイト', basePrice: 400000, minPrice: 250000, maxPrice: 600000, months: 1, icon: '🏢' },
        { name: 'ECサイト構築', basePrice: 700000, minPrice: 500000, maxPrice: 1000000, months: 2, icon: '🛒' },
        { name: 'Webアプリ開発', basePrice: 1200000, minPrice: 800000, maxPrice: 1800000, months: 3, icon: '⚙️' },
        { name: 'サイト保守（月額）', basePrice: 50000, minPrice: 30000, maxPrice: 80000, months: 1, recurring: true, icon: '🔧' },
        { name: 'LP改善コンサル', basePrice: 200000, minPrice: 120000, maxPrice: 350000, months: 1, icon: '📊' },
      ],
    },
  },

  // --- 案件の取引先名 ---
  CLIENT_NAMES: [
    'ABC商事', 'DEFカフェ', 'GHI不動産', 'JKLテック', 'MNO出版',
    'PQR食品', 'STUデザイン', 'VWX建設', 'YZ物産', 'あおい美容室',
    'さくら整骨院', 'ひまわり保育園', 'もみじ旅館', 'こまち呉服店',
    'トーキョ電機', 'ナホン物流', 'フジ薬局', 'ミナト商会',
  ],

  // --- 初期設定 ---
  INITIAL_SAVINGS: 5000000,
  MAX_HP: 12,
  CARDS_DRAW: 5,
  CARDS_PLAY: 2,
  PRODUCTION_CAPACITY_SOLO: 1.0,  // 社長一人の月間制作キャパ
  PRODUCTION_CAPACITY_PER_EMPLOYEE: 0.8,

  // --- 従業員 ---
  EMPLOYEE_TEMPLATES: [
    { name: '鈴木', skill: 'designer', label: 'デザイナー', baseSalary: 220000, minSalary: 180000, maxSalary: 350000 },
    { name: '田中', skill: 'engineer', label: 'エンジニア', baseSalary: 250000, minSalary: 200000, maxSalary: 400000 },
    { name: '佐々木', skill: 'marketer', label: 'マーケター', baseSalary: 230000, minSalary: 180000, maxSalary: 350000 },
    { name: '山本', skill: 'generalist', label: '事務', baseSalary: 200000, minSalary: 170000, maxSalary: 280000 },
  ],

  // --- 税理士 ---
  ACCOUNTANTS: {
    none: { name: 'なし', cost: 0, plVisible: false, bsVisible: false, adviceLevel: 0 },
    basic: { name: '佐藤（格安税理士）', cost: 30000, plVisible: true, bsVisible: false, adviceLevel: 1 },
    advanced: { name: '伊藤（敏腕税理士）', cost: 80000, plVisible: true, bsVisible: true, adviceLevel: 2 },
  },
};