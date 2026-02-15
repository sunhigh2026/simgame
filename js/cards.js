/* ========== カードテンプレート ========== */
const CARD_TEMPLATES = [
  // === 営業系 ===
  {
    id: 'sales_visit',
    name: '飛び込み営業',
    category: 'sales',
    icon: '🚪',
    description: '地元企業を回って仕事を探す',
    hpCost: 2,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '控えめ', cost: 5000, projectChance: 0.2, projectTier: 0, desc: '名刺交換程度' },
      { label: '標準', cost: 15000, projectChance: 0.4, projectTier: 1, desc: '資料持参で訪問' },
      { label: '攻め', cost: 40000, projectChance: 0.6, projectTier: 2, desc: '手土産持って徹底訪問' },
    ],
  },
  {
    id: 'sales_web_ad',
    name: 'Web広告を出す',
    category: 'sales',
    icon: '📢',
    description: 'ネット広告で問い合わせを狙う',
    hpCost: 1,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '少額', cost: 30000, projectChance: 0.25, projectTier: 0, desc: '月3万円の広告' },
      { label: '中額', cost: 100000, projectChance: 0.5, projectTier: 1, desc: '月10万円の広告' },
      { label: '大量投下', cost: 300000, projectChance: 0.7, projectTier: 2, desc: '月30万円ガッツリ' },
    ],
  },
  {
    id: 'sales_referral',
    name: '知人に声をかける',
    category: 'sales',
    icon: '🤝',
    description: '前職の人脈や知り合いに営業',
    hpCost: 1,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '軽く連絡', cost: 0, projectChance: 0.15, projectTier: 0, desc: 'メールだけ' },
      { label: '食事に誘う', cost: 8000, projectChance: 0.35, projectTier: 1, desc: 'ランチおごり' },
      { label: '会食セッティング', cost: 30000, projectChance: 0.55, projectTier: 2, desc: 'ディナーで本気トーク' },
    ],
  },
  {
    id: 'sales_sns',
    name: 'SNS発信',
    category: 'sales',
    icon: '📱',
    description: '実績や知見を発信して問い合わせを待つ',
    hpCost: 1,
    period: [1,2,3,4,5],
    costOptions: [
      { label: 'ゆるく投稿', cost: 0, projectChance: 0.05, projectTier: 0, desc: '週1投稿' },
      { label: '毎日投稿', cost: 0, projectChance: 0.15, projectTier: 1, desc: '体力を使うが無料' },
      { label: 'コンテンツ制作', cost: 20000, projectChance: 0.3, projectTier: 1, desc: 'ブログ+動画も' },
    ],
    hpCostByOption: [1, 2, 3],
  },
  {
    id: 'sales_seminar',
    name: 'セミナー開催',
    category: 'sales',
    icon: '🎤',
    description: '無料セミナーで見込み客を集める',
    hpCost: 3,
    period: [2,3,4,5],
    costOptions: [
      { label: 'オンライン', cost: 5000, projectChance: 0.35, projectTier: 1, desc: 'Zoom開催' },
      { label: '会場借りて', cost: 50000, projectChance: 0.55, projectTier: 2, desc: '会議室レンタル' },
      { label: '大規模', cost: 150000, projectChance: 0.7, projectTier: 3, desc: 'ホール借りて本格開催' },
    ],
  },
  {
    id: 'sales_partnership',
    name: '代理店・提携営業',
    category: 'sales',
    icon: '🔗',
    description: '他社と提携して案件を回してもらう',
    hpCost: 2,
    period: [2,3,4,5],
    costOptions: [
      { label: '提案だけ', cost: 0, projectChance: 0.2, projectTier: 1, desc: '紹介手数料10%' },
      { label: '契約締結', cost: 50000, projectChance: 0.45, projectTier: 2, desc: '紹介手数料15%' },
      { label: '専属契約', cost: 150000, projectChance: 0.65, projectTier: 3, desc: '手数料20%だが安定' },
    ],
  },

  // === 投資系 ===
  {
    id: 'invest_pc',
    name: 'PC・機材を買う',
    category: 'invest',
    icon: '🖥️',
    description: '制作効率を上げる設備投資',
    hpCost: 1,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '最低限', cost: 80000, effect: { capacityBonus: 0.1 }, desc: '中古PC' },
      { label: '標準', cost: 200000, effect: { capacityBonus: 0.2 }, desc: '新品ミドルスペック' },
      { label: 'ハイスペ', cost: 500000, effect: { capacityBonus: 0.35 }, desc: 'フルスペック＋モニタ2枚' },
    ],
    oneTime: true,
  },
  {
    id: 'invest_office',
    name: 'オフィスを借りる',
    category: 'invest',
    icon: '🏠',
    description: '自宅から脱出。信用力UP',
    hpCost: 1,
    period: [1,2,3,4,5],
    costOptions: [
      { label: 'コワーキング', cost: 0, effect: { monthlyExpense: 20000, creditBonus: 3 }, desc: '月Ƴ20,000' },
      { label: '小さな事務所', cost: 100000, effect: { monthlyExpense: 60000, creditBonus: 7 }, desc: '敷金+月Ƴ60,000' },
      { label: 'しっかりオフィス', cost: 300000, effect: { monthlyExpense: 120000, creditBonus: 12 }, desc: '敷金+月Ƴ120,000' },
    ],
    oneTime: true,
  },
  {
    id: 'invest_tool',
    name: '業務ツール導入',
    category: 'invest',
    icon: '🛠️',
    description: '制作・管理ツールで効率化',
    hpCost: 1,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '無料ツール', cost: 0, effect: { capacityBonus: 0.05 }, desc: '使い勝手はイマイチ' },
      { label: '有料ツール', cost: 0, effect: { monthlyExpense: 10000, capacityBonus: 0.15 }, desc: '月Ƴ10,000' },
      { label: 'フルセット', cost: 50000, effect: { monthlyExpense: 25000, capacityBonus: 0.25 }, desc: '初期費+月Ƴ25,000' },
    ],
    oneTime: true,
  },

  // === 人材系 ===
  {
    id: 'hr_recruit',
    name: '人を採用する',
    category: 'hr',
    icon: '👤',
    description: '従業員を1人雇う',
    hpCost: 2,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '知人紹介', cost: 0, hireChance: 0.3, desc: '無料だが見つかるか不明' },
      { label: '求人サイト', cost: 50000, hireChance: 0.6, desc: '掲載費Ƴ50,000' },
      { label: '人材紹介', cost: 200000, hireChance: 0.85, desc: '紹介手数料Ƴ200,000' },
    ],
    maxEmployees: 3,
  },
  {
    id: 'hr_training',
    name: '従業員を育成する',
    category: 'hr',
    icon: '📚',
    description: '研修・OJTでスキルアップ',
    hpCost: 2,
    period: [2,3,4,5],
    requiresEmployee: true,
    costOptions: [
      { label: '社内OJT', cost: 0, effect: { skillUp: 0.05 }, desc: '自分で教える（体力消費多）' },
      { label: '外部研修', cost: 50000, effect: { skillUp: 0.1 }, desc: '1日研修' },
      { label: '集中研修', cost: 150000, effect: { skillUp: 0.2 }, desc: '1週間の集中コース' },
    ],
    hpCostByOption: [3, 2, 1],
  },

  // === 節税系 ===
  {
    id: 'tax_accountant',
    name: '税理士と契約する',
    category: 'tax',
    icon: '🧮',
    description: '月次P/Lが見えるようになる',
    hpCost: 0,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '佐藤税理士（格安）', cost: 0, effect: { accountant: 'basic' }, desc: '月額Ƴ30,000' },
    ],
    requireAccountant: 'none',
  },
  {
    id: 'tax_accountant_adv',
    name: '敏腕税理士に乗り換え',
    category: 'tax',
    icon: '🧮',
    description: 'B/Sも見える。高度な節税助言',
    hpCost: 0,
    period: [2,3,4,5],
    costOptions: [
      { label: '伊藤税理士（敏腕）', cost: 30000, effect: { accountant: 'advanced' }, desc: '月額Ƴ80,000 + 顧問料Ƴ30,000' },
    ],
    requireAccountant: 'basic',
  },
  {
    id: 'tax_shokibo',
    name: '小規模企業共済に加入',
    category: 'tax',
    icon: '🏦',
    description: '積立で退職金＆節税',
    hpCost: 0,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '月1万', cost: 0, effect: { monthlyExpense: 10000, taxDeduction: 120000 }, desc: '年間Ƴ12万の所得控除' },
      { label: '月3万', cost: 0, effect: { monthlyExpense: 30000, taxDeduction: 360000 }, desc: '年間Ƴ36万の所得控除' },
      { label: '月7万', cost: 0, effect: { monthlyExpense: 70000, taxDeduction: 840000 }, desc: '年間Ƴ84万の所得控除' },
    ],
    oneTime: true,
  },
  {
    id: 'tax_car',
    name: '社用車をリースする',
    category: 'tax',
    icon: '🚗',
    description: '経費計上で節税。移動も楽に',
    hpCost: 0,
    period: [2,3,4,5],
    costOptions: [
      { label: '軽自動車', cost: 0, effect: { monthlyExpense: 25000, taxDeduction: 300000, creditBonus: 2 }, desc: '月Ƴ25,000リース' },
      { label: '普通車', cost: 0, effect: { monthlyExpense: 50000, taxDeduction: 600000, creditBonus: 4 }, desc: '月Ƴ50,000リース' },
      { label: '高級車', cost: 0, effect: { monthlyExpense: 100000, taxDeduction: 1200000, auditRisk: 15 }, desc: '月Ƴ100,000 ⚠税務調査リスク' },
    ],
    oneTime: true,
  },
  {
    id: 'tax_safety',
    name: '経営セーフティ共済',
    category: 'tax',
    icon: '🛡️',
    description: '取引先倒産に備えつつ節税。年間最大Ƴ240万経費化',
    hpCost: 0,
    period: [2,3,4,5],
    costOptions: [
      { label: '月5万', cost: 0, effect: { monthlyExpense: 50000, taxDeduction: 600000 }, desc: '年間Ƴ60万の経費化' },
      { label: '月10万', cost: 0, effect: { monthlyExpense: 100000, taxDeduction: 1200000 }, desc: '年間Ƴ120万の経費化' },
      { label: '月20万', cost: 0, effect: { monthlyExpense: 200000, taxDeduction: 2400000 }, desc: '年間Ƴ240万の経費化' },
    ],
    oneTime: true,
  },
  {
    id: 'tax_housing',
    name: '社宅制度を導入',
    category: 'tax',
    icon: '🏠',
    description: '住居費の一部を会社負担に。オフィス契約後のみ',
    hpCost: 0,
    period: [2,3,4,5],
    requiresOffice: true,
    costOptions: [
      { label: '家賃の30%を会社負担', cost: 0, effect: { monthlyExpense: 30000, taxDeduction: 360000 }, desc: '月Ƴ3万追加経費' },
      { label: '家賃の50%を会社負担', cost: 0, effect: { monthlyExpense: 50000, taxDeduction: 600000 }, desc: '月Ƴ5万追加経費' },
    ],
    oneTime: true,
  },
  {
    id: 'tax_trip',
    name: '出張手当規程を作成',
    category: 'tax',
    icon: '✈️',
    description: '出張手当を非課税で受け取れる',
    hpCost: 0,
    period: [2,3,4,5],
    costOptions: [
      { label: '日帰りƳ2,000', cost: 5000, effect: { taxDeduction: 24000 }, desc: '規程作成費' },
      { label: '宿泊Ƴ3,000', cost: 5000, effect: { taxDeduction: 36000 }, desc: '規程作成費' },
      { label: '宿泊Ƴ5,000', cost: 5000, effect: { taxDeduction: 60000 }, desc: '規程作成費（高め設定）' },
    ],
    oneTime: true,
  },
  {
    id: 'tax_bonus',
    name: '決算賞与を出す',
    category: 'tax',
    icon: '🎁',
    description: '従業員への賞与で経費化＆満足度UP',
    hpCost: 0,
    period: [1,2,3,4,5],
    requiresEmployee: true,
    settlementOnly: true,
    costOptions: [
      { label: '1人Ƴ10万', cost: 100000, effect: { satisfactionUp: 10 }, desc: '少額の賞与' },
      { label: '1人Ƴ30万', cost: 300000, effect: { satisfactionUp: 20 }, desc: '標準的な賞与' },
      { label: '1人Ƴ50万', cost: 500000, effect: { satisfactionUp: 30 }, desc: '高額の賞与' },
    ],
  },

  // === 特殊系 ===
  {
    id: 'special_loan',
    name: '融資を申し込む',
    category: 'special',
    icon: '🏦',
    description: '金融機関から資金調達',
    hpCost: 2,
    period: [1,2,3,4,5],
    isLoanCard: true,  // 特殊フラグ：金融機関選択フローへ
    costOptions: [
      { label: '金融機関を選ぶ', cost: 0, desc: '複数の金融機関から選択' },
    ],
  },
  {
    id: 'special_subsidy',
    name: '助成金を申請する',
    category: 'special',
    icon: '📋',
    description: '返済不要の助成金にチャレンジ',
    hpCost: 3,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '小規模助成', cost: 5000, subsidyAmount: 200000, approvalChance: 0.4, desc: '採択率40%' },
      { label: '中規模助成', cost: 20000, subsidyAmount: 500000, approvalChance: 0.25, desc: '採択率25%' },
      { label: '大型助成', cost: 50000, subsidyAmount: 1500000, approvalChance: 0.1, desc: '採択率10% 書類が大変' },
    ],
    hpCostByOption: [2, 3, 4],
  },

  // === 休息 ===
  {
    id: 'rest',
    name: '休む',
    category: 'rest',
    icon: '😴',
    description: '体力を回復する。何もしない勇気。',
    hpCost: 0,
    period: [1,2,3,4,5],
    costOptions: [
      { label: '軽く休む', cost: 0, hpRecover: 3, desc: '半日ゴロゴロ' },
      { label: 'しっかり休む', cost: 0, hpRecover: 5, desc: '丸一日OFF' },
      { label: '旅行する', cost: 50000, hpRecover: 8, desc: '温泉旅行でリフレッシュ' },
    ],
  },

  // === カフェ専用カード ===
  {
    id: 'cafe_menu',
    name: '新メニュー開発',
    category: 'sales',
    icon: '🍰',
    description: '新しいメニューで集客UP',
    hpCost: 2,
    period: [1,2,3,4,5],
    industry: 'cafe',
    costOptions: [
      { label: '既存アレンジ', cost: 10000, projectChance: 0.4, projectTier: 0, desc: '材料費のみ' },
      { label: '新規開発', cost: 50000, projectChance: 0.6, projectTier: 1, desc: '試作込み' },
      { label: 'コラボメニュー', cost: 150000, projectChance: 0.75, projectTier: 2, desc: '有名店とコラボ' },
    ],
  },
  {
    id: 'cafe_sns',
    name: 'SNS映え施策',
    category: 'sales',
    icon: '📸',
    description: 'インスタ映えで来店数UP',
    hpCost: 1,
    period: [1,2,3,4,5],
    industry: 'cafe',
    costOptions: [
      { label: '店内装飾', cost: 20000, effect: { creditBonus: 2 }, desc: 'フォトスポット設置' },
      { label: 'インフルエンサー招待', cost: 80000, projectChance: 0.5, projectTier: 1, desc: 'PR投稿依頼' },
      { label: '全面リニューアル', cost: 200000, effect: { creditBonus: 5 }, projectChance: 0.3, projectTier: 2, desc: '内装一新' },
    ],
  },
  {
    id: 'cafe_event',
    name: 'イベント企画',
    category: 'sales',
    icon: '🎉',
    description: 'ワークショップやイベントで集客',
    hpCost: 3,
    period: [2,3,4,5],
    industry: 'cafe',
    costOptions: [
      { label: 'ミニワークショップ', cost: 10000, projectChance: 0.5, projectTier: 0, desc: 'ラテアート体験など' },
      { label: '音楽ライブ', cost: 50000, projectChance: 0.6, projectTier: 1, desc: 'アコースティックライブ' },
      { label: '大型イベント', cost: 150000, projectChance: 0.7, projectTier: 2, desc: 'フードフェス出店' },
    ],
  },

  // === EC専用カード ===
  {
    id: 'ec_purchase',
    name: '仕入れ交渉',
    category: 'invest',
    icon: '📋',
    description: '仕入れ先と交渉して原価率改善',
    hpCost: 2,
    period: [1,2,3,4,5],
    industry: 'ec',
    costOptions: [
      { label: '既存取引先に交渉', cost: 0, effect: { costReductionTemp: 0.05 }, successChance: 0.4, desc: '原価5%削減' },
      { label: '新規仕入先開拓', cost: 30000, effect: { costReductionTemp: 0.1 }, successChance: 0.6, desc: '原価10%削減' },
      { label: '直接取引', cost: 100000, effect: { costReductionTemp: 0.15 }, successChance: 0.5, desc: '原価15%削減' },
    ],
  },
  {
    id: 'ec_marketing',
    name: '広告運用',
    category: 'sales',
    icon: '📣',
    description: 'ネット広告で売上UP（在庫注意）',
    hpCost: 1,
    period: [1,2,3,4,5],
    industry: 'ec',
    costOptions: [
      { label: 'SNS広告', cost: 30000, projectChance: 0.35, projectTier: 0, desc: '低予算で開始' },
      { label: 'リスティング広告', cost: 100000, projectChance: 0.55, projectTier: 1, desc: '検索連動型' },
      { label: '大規模キャンペーン', cost: 300000, projectChance: 0.7, projectTier: 2, desc: '複合メディア展開' },
    ],
  },
  {
    id: 'ec_product',
    name: '新商品開発',
    category: 'invest',
    icon: '✨',
    description: 'オリジナル商品で差別化',
    hpCost: 3,
    period: [2,3,4,5],
    industry: 'ec',
    costOptions: [
      { label: 'バリエーション追加', cost: 50000, projectChance: 0.5, projectTier: 1, desc: '既存商品の派生' },
      { label: 'OEM商品', cost: 200000, projectChance: 0.6, projectTier: 2, desc: '自社ブランド商品' },
      { label: '完全オリジナル', cost: 500000, projectChance: 0.4, projectTier: 3, desc: '企画から製造まで' },
    ],
  },
];

/* ========== デッキ構築 ========== */
function buildDeck(state) {
  const period = state.period;
  let cards = CARD_TEMPLATES.filter(c => c.period.includes(period));

  // --- 条件フィルタ ---
  cards = cards.filter(card => {
    // 業種フィルタ：業種指定があれば、その業種のみ
    if (card.industry && card.industry !== state.industry) return false;

    // 税理士：すでに契約済みなら除外
    if (card.id === 'tax_accountant' && state.accountant !== 'none') return false;
    if (card.id === 'tax_accountant_adv' && state.accountant !== 'basic') return false;

    // oneTime：すでに使用済みなら除外
    if (card.oneTime && state.usedOneTimeCards.includes(card.id)) return false;

    // 従業員必須カード
    if (card.requiresEmployee && state.employees.length === 0) return false;

    // 採用上限
    if (card.id === 'hr_recruit' && state.employees.length >= (card.maxEmployees || 3)) return false;

    return true;
  });

  return cards;
}

function drawHand(deck, count) {
  const shuffled = [...deck].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
