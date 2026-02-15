/* ========== イベント定義 ========== */
const EVENTS = [
  // --- 1期 ---
  {
    id: 'ev_bank_account',
    period: 1, month: 2,
    title: '🏦 法人口座を開設しに行く',
    text: '会社を作ったはいいが、法人口座がないと始まらない。メガバンクに申し込みに行くか、ネット銀行にするか。',
    choices: [
      { text: 'メガバンクに申し込む（信用力UP、ただし審査厳しい）', effect: { creditBonus: 5, successChance: 0.4 },
        successText: '審査通過！信用スコア+5',
        failText: '審査落ち…「実績ができたらまた来てください」と言われた。ネット銀行で開設した。' },
      { text: 'ネット銀行で開設（確実）', effect: { creditBonus: 1 },
        successText: 'すぐに開設完了。ネットで完結、便利。信用スコア+1' },
    ],
  },
  {
    id: 'ev_business_card',
    period: 1, month: 3,
    title: '📇 名刺を作る',
    text: '営業するには名刺が必要だ。どこまでこだわる？',
    choices: [
      { text: 'ネット印刷で最低限（Ƴ2,000）', effect: { cost: 2000, creditBonus: 0 },
        successText: 'シンプルな名刺が届いた。まあ、これで十分。' },
      { text: 'デザイナーに頼む（Ƴ30,000）', effect: { cost: 30000, creditBonus: 3 },
        successText: 'おしゃれな名刺ができた！「いい名刺ですね」と言われることが増えた。信用+3' },
    ],
  },
  {
    id: 'ev_first_revenue',
    period: 1, month: 4,
    title: '🎉 初めての入金！',
    text: 'ついに初めての売上が口座に振り込まれた日。通帳を何度も見返してしまう。',
    condition: (state) => state.totalRevenue > 0,
    choices: [
      { text: '気を引き締めて次の案件へ', effect: { hpRecover: 2 }, successText: '初入金の嬉しさをバネに頑張ろう。体力+2' },
    ],
  },
  {
    id: 'ev_withholding',
    period: 1, month: 5,
    title: '📝 源泉徴収って何？',
    text: '請求書を出したら「源泉徴収しますね」と言われた。え、売上から引かれるの？',
    choices: [
      { text: '調べて理解する', effect: { hpCost: 1 },
        successText: '所得税の前払い的な制度だとわかった。最終的には確定申告で調整される。勉強になった！' },
      { text: '税理士に聞く', effect: {},
        successText: state => state.accountant !== 'none'
          ? '佐藤税理士「源泉は売上の10.21%が天引きされますが、法人なら基本関係ないですよ」'
          : '…税理士がいないので自分で調べるしかない。' },
    ],
  },
  {
    id: 'ev_living_crisis',
    period: 1, month: 7,
    title: '💸 生活費が足りない！',
    text: '役員報酬を低く設定しすぎたかも。個人の貯金も減ってきた…。',
    condition: (state) => state.salary <= 150000,
    choices: [
      { text: '節約して耐える（体力-2）', effect: { hpCost: 2 }, successText: '自炊とクーポンで乗り切った。体がキツい…。' },
      { text: '個人貯金から会社に貸付（Ƴ300,000）', effect: { cashInflow: 300000 }, successText: '役員借入金として処理。いつか返してもらおう…。' },
    ],
  },

  // --- 2期 ---
  {
    id: 'ev_salary_negotiation',
    period: 2, month: 3,
    title: '💬 従業員から給料交渉',
    text: '「社長、ちょっとお話が…」',
    condition: (state) => state.employees.length > 0,
    choices: [
      { text: '月Ƴ20,000上げる', effect: { salaryUp: 20000, satisfactionUp: 15 }, successText: '嬉しそうだ。やる気も上がったみたい。' },
      { text: '今は厳しいと伝える', effect: { satisfactionDown: 10 }, successText: '「わかりました…」少し不満そうだ。' },
      { text: '賞与で対応すると約束', effect: { satisfactionUp: 5 }, successText: '「期待してます！」…プレッシャーだ。' },
    ],
  },
  {
    id: 'ev_late_payment',
    period: 2, month: 6,
    title: '⚠️ 入金が遅れている！',
    text: '先月納品した案件の入金が来ない。催促するか？',
    choices: [
      { text: 'やんわり催促', effect: { successChance: 0.6 },
        successText: '「すみません、来週振り込みます」無事入金された。',
        failText: '「もう少し待ってください」…来月に持ち越し。' },
      { text: '強めに催促', effect: { successChance: 0.85, creditEffect: -2 },
        successText: '翌日入金された。ただし関係は少し悪化。',
        failText: '逆ギレされた。「もうお宅には頼まない」信用-2' },
      { text: '待つ', effect: { delayMonths: 1 },
        successText: '翌月、無事に入金された。ホッとした。' },
    ],
  },

  // --- 3期 ---
  {
    id: 'ev_big_project',
    period: 3, month: 4,
    title: '🏢 大手企業から問い合わせ！',
    text: 'トーキョ区の大手企業から「サイトリニューアルの見積もりを」と連絡が来た！大きなチャンスだが…',
    choices: [
      { text: '全力で提案する（体力-4）', effect: { hpCost: 4, projectChance: 0.5, bigProject: true },
        successText: '受注成功！報酬Ƴ2,000,000の大型案件だ！',
        failText: '惜しくも落選。「またの機会に」…でも良い経験になった。信用+3' },
      { text: '無理せず断る', effect: { hpCost: 0 },
        successText: '身の丈に合った仕事をしよう。堅実だ。' },
    ],
  },

  // --- 4期 ---
  {
    id: 'ev_tax_audit',
    period: 4, month: 8,
    title: '🔍 税務調査の通知が届いた',
    text: '税務署から連絡が…！「来月、御社の帳簿を確認させてください」',
    choices: [
      { text: '税理士に相談して準備する', effect: {},
        successText: state => state.accountant !== 'none'
          ? `${DATA.ACCOUNTANTS[state.accountant].name}「大丈夫です、しっかり準備しましょう」→ 問題なく終了。`
          : '税理士がいない！自分で帳簿を整理するしかない…（体力-4、ペナルティリスクあり）' },
      { text: 'とりあえず帳簿を見直す（体力-3）', effect: { hpCost: 3, auditPenaltyChance: 0.3 },
        successText: '何とか乗り切った。ヒヤヒヤした…',
        failText: '経費の一部が否認された。追徴課税Ƴ150,000…痛い。' },
    ],
  },

  // --- 5期 ---
  {
    id: 'ev_ma_offer',
    period: 5, month: 6,
    title: '💰 M&Aの打診が来た',
    text: '「御社を買収したいのですが…」大手から声がかかった。',
    condition: (state) => state.totalRevenue > 20000000,
    choices: [
      { text: '話を聞いてみる', effect: { exitOption: true },
        successText: '条件次第ではEXITも選択肢に。最終決算後に決断できる。' },
      { text: '断る', effect: {},
        successText: 'この会社は自分で育てる。まだまだこれからだ。' },
    ],
  },
];

function getMonthEvent(state) {
  const candidates = EVENTS.filter(e => {
    if (e.period !== state.period) return false;
    if (e.month !== state.month) return false;
    if (e.condition && !e.condition(state)) return false;
    if (state.completedEvents.includes(e.id)) return false;
    return true;
  });
  return candidates.length > 0 ? candidates[0] : null;
}

// ランダムイベント（特定月に紐づかない）
const RANDOM_EVENTS = [
  {
    id: 'rand_referral',
    text: '以前の取引先から紹介が入った！',
    chance: 0.1,
    effect: { projectDirect: true, tier: 1 },
    period: [1,2,3,4,5],
  },
  {
    id: 'rand_tool_discount',
    text: '使っているツールが30%割引キャンペーン中！',
    chance: 0.08,
    effect: { costReduction: 0.3 },
    period: [1,2,3,4,5],
  },
  {
    id: 'rand_sick',
    text: '風邪をひいてしまった…今月の体力-3',
    chance: 0.08,
    effect: { hpCost: 3 },
    period: [1,2,3,4,5],
  },
  {
    id: 'rand_server_down',
    text: 'サーバーがダウン！復旧に時間がかかった。',
    chance: 0.06,
    effect: { hpCost: 2, cost: 15000 },
    period: [1,2,3,4,5],
  },
];

function checkRandomEvent(state) {
  const candidates = RANDOM_EVENTS.filter(e => e.period.includes(state.period));
  for (const ev of candidates) {
    if (Math.random() < ev.chance) return ev;
  }
  return null;
}
