// ========================================
// イベントデータ
// ========================================

export const EVENTS = [
  // === 1期目 ===
  {
    id: 'evt_bank_account',
    period: 1,
    month: 2,
    title: '法人口座の開設',
    dialog: {
      name: '銀行窓口',
      text: '法人口座の審査ですが……\n設立したばかりの会社ということで、\n今回は見送りとさせていただきます。',
    },
    followUp: {
      name: '税理士 佐藤',
      text: 'よくある話です。別の銀行を当たりましょう。\nネット銀行なら通りやすいですよ。',
    },
    effect: { creditScore: -2 },
    choices: [
      { text: 'ネット銀行に申し込む（1アクション消費）', effect: { creditScore: 3 } },
      { text: '個人口座で代用する（信用ダウン）', effect: { creditScore: -5 } },
    ],
  },
  {
    id: 'evt_first_revenue',
    period: 1,
    month: 3,
    condition: (gs) => gs.periodRevenue > 0,
    title: '初めての入金',
    dialog: {
      name: '税理士 佐藤',
      text: 'おめでとうございます、社長。\n法人口座に初めての入金がありました。\n\nこの瞬間を覚えておいてください。\n……ここからが本番です。',
    },
    effect: {},
  },
  {
    id: 'evt_withholding',
    period: 1,
    month: 4,
    condition: (gs) => gs.periodRevenue > 0,
    title: '源泉徴収ってなに？',
    dialog: {
      name: '税理士 佐藤',
      text: '取引先からの入金、請求額より少なくないですか？\nそれは「源泉徴収」です。\n報酬の10.21%が天引きされて、先方が代わりに国に納めています。\n\n確定申告で取り戻せるので、慌てなくて大丈夫です。',
    },
    effect: {},
  },
  {
    id: 'evt_living_cost',
    period: 1,
    month: 6,
    title: '生活費の危機',
    dialog: {
      name: 'あなたの内心',
      text: '……通帳の残高を見る。\n個人の貯金が減り続けている。\n\n代表給、足りてるのか？\nこの生活、あと何ヶ月持つ？',
    },
    effect: {},
  },
  {
    id: 'evt_pension_office',
    period: 1,
    month: 10,
    title: '社会保障庁からの手紙',
    dialog: {
      name: '社会保障庁',
      text: '貴社の相互扶助金の届出が\n確認できておりません。\n届出がまだの場合は速やかにお手続きください。',
    },
    followUp: {
      name: '税理士 佐藤',
      text: '法人は設立したら5日以内に届出が必要なんです。\n……今さらですが、急いで出しましょう。\nペナルティは……まあ、今回は大丈夫でしょう。',
    },
    choices: [
      { text: 'すぐ届け出る', effect: {} },
      { text: 'もう少し放置する（リスク）', effect: { penaltyRisk: true } },
    ],
  },

  // === 2期目 ===
  {
    id: 'evt_salary_negotiation',
    period: 2,
    month: 4,
    condition: (gs) => gs.employees.length > 0,
    title: '給料交渉',
    dialogFn: (gs) => ({
      name: gs.employees[0].name,
      text: `社長、ちょっとお話があるんですが……\n入社して半年になるんですけど、\nお給料の見直しって、ありますか？\n\n（現在の月給：Ƴ${gs.employees[0].salary.toLocaleString()}）`,
    }),
    interactive: true,
  },
  {
    id: 'evt_payment_delay',
    period: 2,
    month: 9,
    condition: (gs) => gs.periodRevenue > 3000000,
    title: '入金遅延',
    dialog: {
      name: '取引先',
      text: '申し訳ありません、\n今月末のお支払いですが、\n社内の経理の都合で来月末に\nずれ込みそうでして……',
    },
    followUp: {
      name: '税理士 佐藤',
      text: '売掛金の回収遅延ですね。\n売上は立っているのにお金が入ってこない。\n「黒字倒産」の入口がこれです。\n\n……催促しますか？',
    },
    effect: { delayedPayment: true },
    choices: [
      { text: '丁寧に催促する', effect: { creditScore: 1 } },
      { text: '待つ（来月の資金繰りが苦しくなる）', effect: { cashFlowHit: 300000 } },
      { text: '強めに催促する（関係悪化リスク）', effect: { creditScore: -3, immediatePayment: true } },
    ],
  },
  {
    id: 'evt_employee_quit',
    period: 2,
    month: 8,
    condition: (gs) => gs.employees.some(e => e.satisfaction < 40),
    title: '退職の予兆',
    dialogFn: (gs) => {
      const unhappy = gs.employees.find(e => e.satisfaction < 40);
      return {
        name: gs.employees.find(e => e.name !== unhappy.name)?.name || '噂',
        text: `${unhappy.name}さんなんですけど……\n最近、転職サイト見てるらしいですよ。`,
      };
    },
    interactive: true,
  },
];

export function getEventsForMonth(period, month, gameState) {
  return EVENTS.filter(evt => {
    if (evt.period !== period) return false;
    if (evt.month !== month) return false;
    if (evt.condition && !evt.condition(gameState)) return false;
    if (gameState.triggeredEvents.includes(evt.id)) return false;
    return true;
  });
}