# 起業しろ！ 実装計画書

**作成日:** 2026-02-15
**現在バージョン:** 0.2.0（UI改善済み）

---

## 現状サマリー

### 実装済み機能
- 基本ゲームループ（月次処理 → カード選択 → 制作 → 月末処理）
- 決算処理（P/L、税金計算、繰越欠損金）
- カードシステム（17種類）
- イベントシステム（固定10個 + ランダム4個）
- 従業員採用・育成
- 税理士契約
- 法人/個人の残高分離表示
- P/Lビジュアル表示

### 現状の課題
- 1期目が簡単すぎる（売上が立ちやすい）
- カード結果メッセージが単調
- 従業員のスキル効果が薄い
- イベントが少なく単調
- 業種がWeb制作のみ

---

## Phase 1-a: バランス調整（固定費・売上レンジ）

### 目的
1期目の「生存の緊張感」を演出し、資金繰りの厳しさを体感させる。

### 実装内容

#### 1. 固定費の見直し（data.js）
```javascript
// 現状
monthlyCost: 25000

// 変更後
monthlyCost: 35000  // サーバー・ツール・通信費など
```

#### 2. 案件単価・成功率の調整（cards.js）
| カード | 現状 | 変更後 |
|--------|------|--------|
| 飛び込み営業（控えめ） | 成功率30% | 成功率20% |
| 飛び込み営業（標準） | 成功率55% | 成功率40% |
| 飛び込み営業（攻め） | 成功率75% | 成功率60% |
| 知人紹介（軽く連絡） | 成功率20% | 成功率15% |
| SNS発信（ゆるく投稿） | 成功率10% | 成功率5% |

#### 3. 信用スコアの影響強化（game.js）
```javascript
// 受注確率に信用スコアを反映
const creditBonus = state.credit / 100 * 0.15; // 最大+15%
const finalChance = baseChance + creditBonus;
```

#### 4. 1期目の案件単価調整（data.js）
```javascript
projectTemplates: [
  { name: 'ランディングページ', basePrice: 120000, minPrice: 60000, maxPrice: 200000, months: 1 },
  { name: 'コーポレートサイト', basePrice: 350000, minPrice: 200000, maxPrice: 500000, months: 1 },
  // ... 期によってtierでフィルタ
]
```

### ファイル変更
- `js/data.js`: monthlyCost、projectTemplates
- `js/cards.js`: projectChance各値
- `js/game.js`: calcWinRate関数に信用ボーナス追加

---

## Phase 1-b: カード結果メッセージ充実

### 目的
カード使用時のフィードバックを充実させ、ゲーム体験を向上。

### 実装内容

#### 1. 結果メッセージテンプレート追加（data.js）
```javascript
RESULT_MESSAGES: {
  sales_success: [
    '「ぜひお願いします！」話がまとまった。',
    '名刺交換から商談成立。営業の手応えを感じる。',
    '粘り強い交渉が実を結んだ！',
  ],
  sales_fail: [
    '「今は予算が…」また次の機会に。',
    '競合に負けた。何が足りなかったのか…',
    '担当者に会えずじまい。タイミングが悪かった。',
  ],
  // ...
}
```

#### 2. 状況に応じたメッセージ選択（main.js）
```javascript
function getResultMessage(category, success, state) {
  const pool = DATA.RESULT_MESSAGES[`${category}_${success ? 'success' : 'fail'}`];
  // 信用スコア、期、残高などに応じて追加コメント
  let msg = pool[Math.floor(Math.random() * pool.length)];
  if (state.credit >= 50) msg += '\n（信用が高まっている）';
  return msg;
}
```

#### 3. 結果画面の演出強化（ui.js）
- 成功時: 緑のハイライト + アイコンアニメーション
- 失敗時: 赤のハイライト + 励ましメッセージ
- 金額表示: カウントアップアニメーション

### ファイル変更
- `js/data.js`: RESULT_MESSAGES追加
- `js/main.js`: getResultMessage関数追加
- `js/ui.js`: renderCardResult改善
- `css/style.css`: アニメーション追加

---

## Phase 1-c: 従業員システム強化

### 目的
従業員の採用・育成・退職がゲーム進行に与える影響を強化。

### 実装内容

#### 1. スキル効果の明確化（data.js）
```javascript
EMPLOYEE_SKILLS: {
  designer: {
    label: 'デザイナー',
    effect: { projectQuality: 0.1 },  // 受注率+10%
    description: 'デザイン案件の受注率UP'
  },
  engineer: {
    label: 'エンジニア',
    effect: { capacityBonus: 0.3 },   // キャパ+0.3
    description: '制作キャパ増加'
  },
  marketer: {
    label: 'マーケター',
    effect: { salesBonus: 0.15 },     // 営業成功率+15%
    description: '営業カードの成功率UP'
  },
  generalist: {
    label: '事務',
    effect: { costReduction: 0.1 },   // 運営費-10%
    description: '運営経費削減'
  }
}
```

#### 2. 満足度システムの可視化（ui.js）
```javascript
// 月初画面で満足度の状態を表示
renderEmployeeStatus(emp) {
  const status = emp.satisfaction >= 70 ? '😊 好調'
    : emp.satisfaction >= 40 ? '😐 普通'
    : '😟 不満';
  // 警告表示: 「退職リスクあり」
}
```

#### 3. 従業員イベントの追加（events.js）
```javascript
// 満足度に応じたイベント
{ id: 'ev_emp_praise', condition: (s) => s.employees.some(e => e.satisfaction >= 80) }
{ id: 'ev_emp_complaint', condition: (s) => s.employees.some(e => e.satisfaction < 40) }
```

#### 4. 昇給・賞与システム（main.js）
- 期首設定で昇給可能
- 決算月に賞与カード使用可能
- 昇給/賞与 → 満足度UP

### ファイル変更
- `js/data.js`: EMPLOYEE_SKILLS追加
- `js/game.js`: スキル効果の計算追加
- `js/ui.js`: 従業員ステータス表示改善
- `js/events.js`: 従業員イベント追加
- `js/cards.js`: 決算賞与カード追加

---

## Phase 1-d: イベント追加（1期目15個）

### 目的
1期目の体験を充実させ、起業初期の「あるある」を学べるようにする。

### 追加イベント一覧

| 月 | ID | タイトル | 内容 |
|----|-----|---------|------|
| 1 | ev_first_day | 初日の緊張 | 会社設立完了。さあ何から始める？ |
| 2 | ev_bank_account | 法人口座開設 | （実装済み） |
| 3 | ev_business_card | 名刺を作る | （実装済み） |
| 4 | ev_first_meeting | 初めての商談 | 緊張で声が震える… |
| 5 | ev_withholding | 源泉徴収って何？ | （実装済み） |
| 6 | ev_invoice | 請求書の書き方 | 振込先、支払条件…難しい |
| 7 | ev_living_crisis | 生活費が足りない | （実装済み・条件付き） |
| 8 | ev_pc_trouble | PCが壊れた | 仕事道具のトラブル |
| 9 | ev_first_complaint | クレーム発生 | 初めてのクレーム対応 |
| 10 | ev_year_end_prep | 年末調整？ | 一人社長には関係ない？ |
| 11 | ev_social_ins_notice | 社会保障庁から手紙 | 届出の催促 |
| 12 | ev_first_settlement | 初めての決算 | 税理士の助言（または独力で） |

### ランダムイベント追加

| ID | 内容 | 発生率 |
|----|------|--------|
| rand_cafe_meeting | カフェで偶然ビジネスパートナーに出会う | 5% |
| rand_inspiration | 深夜にアイデアが降りてきた（体力-1、次の案件単価+10%） | 8% |
| rand_family_worry | 家族から「大丈夫？」と心配される | 10% |
| rand_competitor | 競合の存在を知る | 6% |

### ファイル変更
- `js/events.js`: EVENTS配列に追加、RANDOM_EVENTSに追加

---

## Phase 2-a: 業種追加（カフェ・EC）

### 目的
リプレイ性を高め、異なるビジネスモデルを体験させる。

### カフェ業種

```javascript
cafe: {
  id: 'cafe',
  name: 'カフェ開業',
  icon: '☕',
  description: '初期投資は大きいが、固定客がつけば安定。在庫・廃棄ロスに注意。',
  initialCost: 3000000,  // 内装・設備
  monthlyCost: 250000,   // 家賃・光熱費・仕入
  difficulty: 4,
  projectTemplates: [
    { name: '日次売上', basePrice: 15000, minPrice: 8000, maxPrice: 25000, months: 0, recurring: true },
    { name: 'イベント出店', basePrice: 50000, minPrice: 30000, maxPrice: 80000, months: 1 },
    { name: 'ケータリング', basePrice: 100000, minPrice: 60000, maxPrice: 150000, months: 1 },
  ],
  // カフェ固有パラメータ
  dailySalesBase: 15000,
  customerGrowthRate: 0.02,  // 信用に応じて成長
  wasteRate: 0.1,            // 廃棄ロス率
}
```

### EC物販業種

```javascript
ec: {
  id: 'ec',
  name: 'EC物販',
  icon: '📦',
  description: '在庫リスクはあるが、当たれば大きい。仕入れと価格設定がカギ。',
  initialCost: 500000,   // 初期仕入
  monthlyCost: 80000,    // 倉庫・発送費
  difficulty: 3,
  projectTemplates: [
    { name: '月間売上', basePrice: 300000, minPrice: 100000, maxPrice: 800000, months: 0, recurring: true },
  ],
  // EC固有パラメータ
  inventoryCapacity: 1000000,  // 在庫上限
  marginRate: 0.3,             // 粗利率
}
```

### 業種別カード

| 業種 | カード | 効果 |
|------|--------|------|
| カフェ | 新メニュー開発 | 日次売上+10% |
| カフェ | SNS映え施策 | 来客数UP |
| EC | 仕入れ交渉 | 原価率改善 |
| EC | 広告運用 | 売上UP（在庫注意） |

### ファイル変更
- `js/data.js`: INDUSTRIES追加
- `js/cards.js`: 業種別カード追加
- `js/game.js`: 業種別の売上計算ロジック
- `js/events.js`: 業種別イベント追加
- `js/ui.js`: 業種選択画面を3択に

---

## Phase 2-b: 決算演出・節税カード深掘り

### 目的
決算の「ドキドキ感」と節税の「お得感」を演出。

### 決算演出強化

#### 1. P/L表示のアニメーション
```css
/* 数字のカウントアップ */
@keyframes countUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

#### 2. 5期分の推移グラフ（ui.js）
```javascript
renderPLHistory(state) {
  // 期ごとの売上・利益・税金を折れ線グラフで表示
  // canvas または SVG で描画
}
```

#### 3. 税理士コメントの充実
```javascript
ACCOUNTANT_COMMENTS: {
  profit_high: '素晴らしい利益です！来期は節税対策を強化しましょう。',
  profit_low: '利益は少ないですが、繰越欠損金が使えます。',
  tax_heavy: '税金が重いですね…経費の使い方を見直しましょう。',
  first_black: '初の黒字おめでとうございます！ここからが本番です。',
}
```

### 節税カード追加

| カード | 効果 | 条件 |
|--------|------|------|
| 経営セーフティ共済 | 年Ƴ240万経費化 | 2期目〜 |
| 社宅制度 | 家賃の50%経費化 | オフィス契約後 |
| 出張手当規程 | 月Ƴ3万経費化 | 2期目〜 |
| 決算賞与 | 従業員へのボーナス経費化 | 決算月のみ |

### ファイル変更
- `js/ui.js`: renderSettlement改善、グラフ追加
- `js/data.js`: ACCOUNTANT_COMMENTS追加
- `js/cards.js`: 節税カード追加
- `css/style.css`: アニメーション追加

---

## Phase 2-c: 融資システム強化

### 目的
資金繰りの選択肢を増やし、借入のリスク・リターンを体感させる。

### 融資の種類

| 種類 | 金額 | 金利 | 審査難易度 | 条件 |
|------|------|------|-----------|------|
| 日本政策金融公庫 | Ƴ500万まで | 年2% | 中 | 創業1年以内 |
| 信用金庫 | Ƴ300万まで | 年3% | 低 | 信用スコア30以上 |
| メガバンク | Ƴ1000万まで | 年1.5% | 高 | 黒字2期以上 |
| ビジネスローン | Ƴ200万まで | 年8% | 低 | なし（緊急用） |

### 審査ロジック（game.js）
```javascript
function calcLoanApproval(state, loanType) {
  let baseRate = LOAN_TYPES[loanType].approvalBase;
  baseRate += state.credit / 200;  // 信用ボーナス
  if (state.periodRevenue > 0) baseRate += 0.1;  // 黒字ボーナス
  if (state.balance < 0) baseRate -= 0.3;  // 赤字ペナルティ
  return Math.min(0.95, Math.max(0.05, baseRate));
}
```

### 返済管理の可視化
- 月初画面に「今月の返済予定」表示
- 返済が滞ると信用スコア低下
- 完済時にボーナス（信用+5）

### ファイル変更
- `js/data.js`: LOAN_TYPES追加
- `js/cards.js`: 融資カード分割
- `js/game.js`: calcLoanApproval関数
- `js/ui.js`: 融資状況表示

---

## Phase 3: シナリオ完成・シェア機能・公開

### 目的
ゲームを完成させ、公開準備を行う。

### シナリオ完成

#### 2〜5期目イベント追加
- 2期目: 10個（従業員問題、取引先トラブル）
- 3期目: 10個（消費税、競合、大型案件）
- 4期目: 10個（税務調査、取引先倒産、人材流出）
- 5期目: 8個（M&A、後輩起業相談、振り返り）

#### エンディング分岐
| ランク | 条件 | タイトル |
|--------|------|---------|
| S | 資産Ƴ3000万 + 従業員5人 | ナホンの星 |
| A | 資産Ƴ1500万以上 | 堅実なる経営者 |
| B | 資産Ƴ500万以上 | 自由な一人社長 |
| C | 資産Ƴ0以上 | 崖っぷちの生存者 |
| D | ゲームオーバー | また、サラリーマンから |
| 隠し | M&A成功 | EXIT |

### シェア機能

```javascript
function generateShareText(state, ending) {
  return `ナホン国で5年間起業してみた。

業種：${DATA.INDUSTRIES[state.industry].name}
結果：${ending.rank}ランク「${ending.title}」
5年間の売上：Ƴ${state.totalRevenue.toLocaleString()}
5年間の納税：Ƴ${state.totalTaxPaid.toLocaleString()}

${getSurpriseComment(state)}

#起業しろ #ナホン経営記`;
}
```

### 公開準備

1. **GitHub Pages設定**
   - repository設定でPages有効化
   - カスタムドメイン設定（任意）

2. **OGP設定**（index.html）
   ```html
   <meta property="og:title" content="起業しろ！〜ナホン成り上がり経営記〜">
   <meta property="og:description" content="貯金500万で起業。5年間生き残れるか？">
   <meta property="og:image" content="ogp.png">
   ```

3. **PWA対応**（任意）
   - manifest.json
   - service-worker.js

### ファイル変更
- `js/events.js`: 全イベント追加
- `js/game.js`: エンディング分岐
- `js/ui.js`: シェアボタン、OGP
- `index.html`: meta tags
- 新規: `manifest.json`, `ogp.png`

---

## 実装スケジュール目安

| Phase | 内容 | 工数目安 |
|-------|------|---------|
| 1-a | バランス調整 | 2-3時間 |
| 1-b | カード結果メッセージ | 3-4時間 |
| 1-c | 従業員システム | 4-5時間 |
| 1-d | イベント追加（1期） | 3-4時間 |
| 2-a | 業種追加 | 6-8時間 |
| 2-b | 決算演出・節税 | 4-5時間 |
| 2-c | 融資システム | 3-4時間 |
| 3 | シナリオ完成・公開 | 8-10時間 |

**合計: 約35-45時間**

---

## 優先度と依存関係

```
Phase 1-a ──┐
Phase 1-b ──┼── 独立して並行可能
Phase 1-c ──┤
Phase 1-d ──┘
     │
     ▼
Phase 2-a（業種追加は1-a完了後が望ましい）
Phase 2-b（決算演出は独立）
Phase 2-c（融資は独立）
     │
     ▼
Phase 3（全体完成後）
```

---

## 次のアクション

1. **Phase 1-a から着手** → ゲームバランスの土台を固める
2. 各Phase完了後にテストプレイ
3. フィードバックを元に調整

どのPhaseから始めますか？
