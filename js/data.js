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
      monthlyCost: 35000,  // サーバー・ツール・通信費など
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
    cafe: {
      id: 'cafe',
      name: 'カフェ開業',
      icon: '☕',
      description: '初期投資は大きいが、固定客がつけば安定。在庫・廃棄ロスに注意。',
      initialCost: 3000000,  // 内装・設備
      monthlyCost: 250000,   // 家賃・光熱費・仕入
      difficulty: 4,
      // カフェ固有パラメータ
      dailySalesBase: 15000,
      customerGrowthRate: 0.02,
      wasteRate: 0.1,
      projectTemplates: [
        { name: '日次売上', basePrice: 450000, minPrice: 300000, maxPrice: 700000, months: 1, recurring: true, icon: '☕' },
        { name: 'イベント出店', basePrice: 50000, minPrice: 30000, maxPrice: 80000, months: 1, icon: '🎪' },
        { name: 'ケータリング', basePrice: 100000, minPrice: 60000, maxPrice: 150000, months: 1, icon: '🍽️' },
        { name: '企業向け定期契約', basePrice: 80000, minPrice: 50000, maxPrice: 120000, months: 1, recurring: true, icon: '🏢' },
      ],
    },
    ec: {
      id: 'ec',
      name: 'EC物販',
      icon: '📦',
      description: '在庫リスクはあるが、当たれば大きい。仕入れと価格設定がカギ。',
      initialCost: 500000,   // 初期仕入
      monthlyCost: 80000,    // 倉庫・発送費・広告費
      difficulty: 3,
      // EC固有パラメータ
      inventoryCapacity: 1000000,
      marginRate: 0.3,
      projectTemplates: [
        { name: '月間売上', basePrice: 400000, minPrice: 150000, maxPrice: 800000, months: 1, recurring: true, icon: '📦' },
        { name: 'セール企画', basePrice: 200000, minPrice: 100000, maxPrice: 400000, months: 1, icon: '🏷️' },
        { name: '新商品ライン', basePrice: 300000, minPrice: 150000, maxPrice: 500000, months: 2, icon: '✨' },
        { name: 'BtoB卸売契約', basePrice: 500000, minPrice: 300000, maxPrice: 800000, months: 1, icon: '🤝' },
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

  // --- 結果メッセージ ---
  RESULT_MESSAGES: {
    sales_success: [
      '「ぜひお願いします！」話がまとまった。',
      '名刺交換から商談成立。営業の手応えを感じる。',
      '粘り強い交渉が実を結んだ！',
      '「他社と比較したが、御社に決めました」嬉しい言葉だ。',
      '熱意が伝わったようだ。契約書にサインをもらえた。',
    ],
    sales_fail: [
      '「今は予算が…」また次の機会に。',
      '競合に負けた。何が足りなかったのか…',
      '担当者に会えずじまい。タイミングが悪かった。',
      '「検討します」…社交辞令だとわかっている。',
      '手応えはあったのに、返事が来ない。',
    ],
    invest_success: [
      '設備が整った。これで効率アップだ！',
      '投資の成果が出るのが楽しみだ。',
      '良い買い物ができた。',
    ],
    hr_success: [
      '良い人材が見つかった！チームが強くなる。',
      '採用成功！さっそく仕事を覚えてもらおう。',
      '即戦力の人材だ。期待できそう。',
    ],
    hr_fail: [
      '条件に合う人が見つからなかった。',
      '内定を出したが辞退された…',
      '良い人材は競争が激しい。',
    ],
    rest_success: [
      'ゆっくり休めた。明日からまた頑張ろう。',
      'リフレッシュできた！体力が回復した。',
      '休息も仕事のうち。体は資本だ。',
    ],
    loan_success: [
      '融資が承認された！資金繰りに余裕ができる。',
      '銀行からの信頼を得られた。',
      '事業計画が評価された。',
    ],
    loan_fail: [
      '融資は見送りに…もう少し実績が必要だ。',
      '審査に通らなかった。別の方法を考えよう。',
      '「実績ができたらまた来てください」と言われた。',
    ],
    subsidy_success: [
      '助成金が採択された！返済不要の資金はありがたい。',
      '申請書の苦労が報われた！',
    ],
    subsidy_fail: [
      '残念ながら不採択。競争率が高かった…',
      '書類に不備があったかもしれない。',
    ],
  },

  // --- 従業員スキル効果 ---
  EMPLOYEE_SKILLS: {
    designer: {
      label: 'デザイナー',
      effect: { projectQuality: 0.1 },
      description: 'デザイン案件の受注率+10%'
    },
    engineer: {
      label: 'エンジニア',
      effect: { capacityBonus: 0.3 },
      description: '制作キャパ+0.3'
    },
    marketer: {
      label: 'マーケター',
      effect: { salesBonus: 0.15 },
      description: '営業カードの成功率+15%'
    },
    generalist: {
      label: '事務',
      effect: { costReduction: 0.1 },
      description: '運営経費-10%'
    }
  },

  // --- 税理士コメント ---
  ACCOUNTANT_COMMENTS: {
    profit_high: '素晴らしい利益です！来期は節税対策を強化しましょう。',
    profit_low: '利益は少ないですが、繰越欠損金が使えます。',
    tax_heavy: '税金が重いですね…経費の使い方を見直しましょう。',
    first_black: '初の黒字おめでとうございます！ここからが本番です。',
    first_year: '初年度お疲れ様でした。まずは生き残ることが大事です。',
    loss: '赤字ですが、繰越欠損金として来期以降に活用できます。',
  },

  // --- 融資の種類 ---
  LOAN_TYPES: {
    jfc: {
      id: 'jfc',
      name: 'ナホン政策金融公庫',
      icon: '🏛️',
      maxAmount: 5000000,
      interestRate: 0.02,
      approvalBase: 0.5,
      condition: (state) => state.period <= 2,
      description: '創業2年以内限定。低金利で借りやすい',
    },
    shinkin: {
      id: 'shinkin',
      name: '信用金庫',
      icon: '🏦',
      maxAmount: 3000000,
      interestRate: 0.03,
      approvalBase: 0.6,
      condition: (state) => state.credit >= 30,
      description: '信用スコア30以上。地域密着で親身',
    },
    mega: {
      id: 'mega',
      name: 'メガバンク',
      icon: '🏢',
      maxAmount: 10000000,
      interestRate: 0.015,
      approvalBase: 0.25,
      condition: (state) => state.periodRevenue > 0 && state.period >= 2,
      description: '黒字2期以上。低金利だが審査厳しい',
    },
    business: {
      id: 'business',
      name: 'ビジネスローン',
      icon: '💳',
      maxAmount: 2000000,
      interestRate: 0.08,
      approvalBase: 0.8,
      condition: () => true,
      description: '審査緩いが高金利。緊急用',
    },
  },
};