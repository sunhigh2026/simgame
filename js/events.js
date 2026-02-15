export const EVENTS = [
  {
    id: 'evt_bank_account', period: 1, month: 2,
    title: '法人口座の開設',
    dialog: { name: '銀行窓口', text: '法人口座の審査ですが……\n設立したばかりの会社ということで、\n今回は見送りとさせていただきます。' },
    followUp: { name: '（あなたの心の声）', text: 'マジか……。ネット銀行なら通るかも。' },
    choices: [
      { text: 'ネット銀行に申し込む', effect: { creditScore: 3 } },
      { text: '個人口座で代用する（信用ダウン）', effect: { creditScore: -5 } },
    ],
  },
  {
    id: 'evt_first_revenue', period: 1, month: 3,
    condition: (gs) => gs.periodRevenue > 0,
    title: '初めての入金',
    dialog: { name: '（あなた）', text: '法人口座に、初めての入金があった。\n\n……やった。本当にやった。\nこれが自分で稼いだお金だ。' },
  },
  {
    id: 'evt_withholding', period: 1, month: 4,
    condition: (gs) => gs.periodRevenue > 0,
    title: '源泉徴収ってなに？',
    conditionAccountant: 'basic',
    dialogNoAccountant: { name: '（あなた）', text: '取引先からの入金が、請求額より少ない。\nなんで？\n\n……誰かに聞きたいけど、税理士いないしな。' },
    dialogWithAccountant: { name: '税理士 佐藤', text: '取引先からの入金、請求額より少なくないですか？\nそれは「源泉徴収」です。\n報酬の10.21%が天引きされて、\n先方が代わりに国に納めています。\n\n確定申告で取り戻せるので、慌てなくて大丈夫です。' },
  },
  {
    id: 'evt_living_cost', period: 1, month: 6,
    title: '通帳を見て震える夜',
    dialog: { name: '（深夜3時、布団の中で）', text: '……個人の貯金が減り続けている。\n\n役員報酬、足りてるのか？\nこの生活、あと何ヶ月持つ？\n\n会社を辞めたあの日の自分に\n「本当に大丈夫か？」と聞きたい。' },
  },
  {
    id: 'evt_social_insurance', period: 1, month: 5,
    title: '社会保険料の説明',
    conditionAccountant: 'basic',
    dialogNoAccountant: { name: '年金事務所', text: '貴社の社会保険の届出が\n確認できておりません。\n速やかにお手続きください。' },
    dialogWithAccountant: { name: '税理士 佐藤', text: '社長、社会保険料について説明させてください。\n\nこれは健康保険と年金のことです。\n会社と社長が半分ずつ負担します。\n\n例えば役員報酬 Ƴ25万の場合、\n会社負担：約Ƴ7万\n本人負担：約Ƴ3.5万\n\n給料が高いほど、この金額も増えます。\n役員報酬を決めるとき、ここも考慮が必要ですよ。' },
  },
  {
    id: 'evt_pension_office', period: 1, month: 10,
    title: '年金事務所からの手紙',
    dialog: { name: '年金事務所', text: '貴社の社会保険の届出が\n確認できておりません。\n届出がまだの場合は速やかにお手続きください。' },
    choices: [
      { text: 'すぐ届け出る', effect: {} },
      { text: 'もう少し放置する（リスク）', effect: { penaltyRisk: true } },
    ],
  },

  // === 2期目 ===
  {
    id: 'evt_salary_negotiation', period: 2, month: 4,
    condition: (gs) => gs.employees.length > 0,
    title: '給料交渉',
    dialogFn: (gs) => ({
      name: gs.employees[0].name + 'さん',
      text: `社長、ちょっとお話があるんですが……\n入社して半年になるんですけど、\nお給料の見直しって、ありますか？\n\n（現在の月給：Ƴ${gs.employees[0].salary.toLocaleString()}）`,
    }),
    interactive: true,
    choices: [
      { text: '月Ƴ1万上げる', effect: { employeeSatisfaction: 15, monthlyExpense: 10000 } },
      { text: '今は据え置き（理由を説明する）', effect: { employeeSatisfaction: -5 } },
      { text: '今は無理（素っ気なく断る）', effect: { employeeSatisfaction: -20 } },
    ],
  },
  {
    id: 'evt_payment_delay', period: 2, month: 9,
    condition: (gs) => gs.periodRevenue > 3000000,
    title: '入金遅延',
    dialog: { name: '取引先', text: '申し訳ありません、\n今月末のお支払いですが、\n社内の経理の都合で来月末に\nずれ込みそうでして……' },
    followUpAccountant: { name: '税理士 佐藤', text: '売掛金の回収遅延ですね。\n売上は立っているのにお金が入ってこない。\n「黒字倒産」の入口がこれです。' },
    choices: [
      { text: '丁寧に催促する', effect: { creditScore: 1 } },
      { text: '待つ（来月の資金繰りが苦しくなる）', effect: { cashFlowHit: 300000 } },
      { text: '強めに催促する（関係悪化リスク）', effect: { creditScore: -3 } },
    ],
  },
  {
    id: 'evt_employee_quit_risk', period: 2, month: 8,
    condition: (gs) => gs.employees.some(e => e.satisfaction < 40),
    title: '退職の予兆',
    dialogFn: (gs) => {
      const unhappy = gs.employees.find(e => e.satisfaction < 40);
      return {
        name: '（社内の噂）',
        text: `${unhappy.name}さん、最近\n転職サイト見てるらしいですよ……`,
      };
    },
    choices: [
      { text: '本人と面談する', effect: { employeeSatisfaction: 10 } },
      { text: '給料を上げて引き留める', effect: { employeeSatisfaction: 25, monthlyExpense: 20000 } },
      { text: '様子を見る', effect: {} },
    ],
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
