# AGENTS.md

このファイルは、このリポジトリで作業するAIエージェント(Claude Code等)向けのガイドです。
コードを変更する前に必ず目を通してください。

## プロジェクト概要

**Taiko Config Editor**(表示名: `TaikøNauts Settings Editor`)は、太鼓ゲーム
「TaikoNauts」のJSON設定ファイルをGUIで編集するためのElectronアプリです。

ユーザーはTaikoNautsのインストールフォルダ(`TaikoNauts-latest`)を選択すると、
そのフォルダ配下にある複数のJSON設定ファイル(`GameConfig.json` /
`PlayerConfig.json` / `NamePlateConfig.json` / `SkinConfig.json` など)を、
カテゴリ別のフォームで読み書きできます。加えて、既存ファイルの読み書きを
伴わない「ツール」的な画面(例: 段位道場のdan.jsonをフォームから作成して
ダウンロードする機能)も、同じサイドバーの中に「特殊カテゴリ」として
組み込まれています(詳細はアーキテクチャの節を参照)。

技術スタック: Electron / バニラJS(ESモジュール) / HTML / CSS。フレームワーク
(React等)は使用していません。ビルドツールも未使用で、`renderer/`配下は
ブラウザがそのまま解釈できるESモジュールとして書かれています。

## ディレクトリ構成(推定・実態に合わせて随時更新すること)

```
main.js              # Electronメインプロセス。ウィンドウ生成、全IPCハンドラ、自動更新
preload.js           # contextBridgeでwindow.electronAPIを公開するpreloadスクリプト
renderer/
  index.html
  css/
    style.css
  js/
    app.js               # レンダラーのエントリポイント。全体のオーケストレーション
    configManager.js     # JSON設定ファイルの読み込み/書き込みロジック
    ui/
      settings.js         # カテゴリ内の設定項目のレンダリング/収集
      category.js         # サイドバーのカテゴリボタン一覧
      status.js           # ページタイトル・保存ステータス等の表示更新
      danGenerator.js      # 段位道場dan.json作成ツールの専用画面(下記セクション8参照)
    fields/
      index.js             # type別にフィールド生成関数へディスパッチ
      base.js               # 全フィールド共通のDOM土台(ラベル+説明+コントロール)を生成
      context.js            # selectedDirectory / skinPath を保持する共有ステート
      previewSelector.js    # imageSelector/imageFolderSelectorが共有する
                             #   「◀プレビュー▶」型セレクタの共通土台
      selectHelper.js        # select/folderSelector/skinSelectorが共有する
                             #   <option>生成+選択判定の共通ヘルパー
      boolean.js / number.js / text.js / select.js / array.js
      imageSelector.js / imageFolderSelector.js
      folderSelector.js / skinSelector.js / fontSelect.js
      fontUpload.js          # フォントファイルをSkinのFontフォルダへ
                             #   アップロード(移動)するボタン型の疑似フィールド
    configs/
      index.js              # 全カテゴリ定義(configDefinitions配列)をまとめる
      game.js / player.js / namePlate.js / skin.js   # カテゴリごとの設定項目定義
      danGenerator.js        # 段位道場dan.json作成ツールの「特殊カテゴリ」定義
                             #   (files/fieldsを持たない。下記セクション8を参照)
```

> 上記のパスは実際のファイル内の `import` 文から逆算した想定パスです。
> 実ファイルのフォルダ構成を確認し、異なる場合はこのセクションを修正してください。

## アーキテクチャの要点

### 1. メインプロセス ⇔ レンダラーの分離

- ファイルシステムへのアクセス(JSON読み書き、フォルダ選択ダイアログ、フォルダ探索)は
  **すべて`main.js`のIPCハンドラ(`ipcMain.handle`)経由**で行う。
- レンダラー側は直接`fs`にアクセスできない(`nodeIntegration: false`,
  `contextIsolation: true`)。必ず`preload.js`が公開する`window.electronAPI.*`を
  呼び出す。
- 新しいファイル操作が必要になったら:
  1. `main.js`に`ipcMain.handle('新チャンネル名', ...)`を追加
  2. `preload.js`の`contextBridge.exposeInMainWorld('electronAPI', {...})`に
     対応するラッパー関数を追加
  3. レンダラー側から`window.electronAPI.新関数名(...)`で呼び出す
- `main.js`には汎用ヘルパーが用意されているので、個々のハンドラで再実装しない:
  - `readJsonSafe(filePath)`: BOM除去 + `JSON.parse`までを行うJSON読み込み共通処理
  - `listNumericSubfolders(directory)`: 名前が数字のみのサブフォルダを列挙
    (`PlayerData/0/`のようなID採番フォルダの探索に使用)
  - `moveFileSafe(sourcePath, destPath)`: ファイルの移動。`fs.rename`が失敗する
    場合(別ドライブ間など、`EXDEV`エラー)は`copyFile`+`unlink`にフォールバックする。
    ダイアログで選んだ外部ファイルをアプリ管理下のフォルダへ取り込む処理
    (`upload-font-file`等)で使う想定。

### 2. 設定カテゴリの定義システム(`configs/`)

各カテゴリ(ゲーム設定・プレイヤー情報・ネームプレート・スキン設定など)は、
`configs/`配下に1ファイルとして「宣言的に」定義される。UIコードを直接書き換えず、
**この定義オブジェクトを追加・編集するだけで新しい設定項目/カテゴリが追加できる**
ように設計されている。

```js
// configs/例.js
const 例Config = {
    id: 'カテゴリID',
    title: '表示タイトル',
    description: 'カテゴリの説明文',
    files: [
        {
            id: 'ファイル識別子',                 // configsオブジェクト内のキーになる
            path: '相対パス/Config.json',         // 固定パスの場合
            // または
            pathTemplate: 'PlayerData/{userId}/PlayerConfig.json', // 動的パスの場合
            title: 'セクション見出し(任意)',
            fields: [
                { key: 'jsonのキー名', label: 'UI表示名', type: 'フィールド種別', ... }
            ]
        }
    ]
};

export default 例Config;
```

新しいカテゴリを追加する手順:
1. `configs/`に新しい定義ファイルを作成する(上記の形)
2. `configs/index.js`の`configDefinitions`配列にimportして追加する
3. 必要なら`index.html`の`#categoryList`にサイドバーボタンを追加する
   (`renderCategories`が動的に生成するため、通常は手動追加不要な場合もある)

`path`と`pathTemplate`の違い:
- `path`: 固定パス。読み込み前にそのまま使われる。
- `pathTemplate`: `{userId}`や`{skinName}`のようなプレースホルダーを含み、
  `app.js`側の`updatePlayerConfigPaths()` / `updateSkinConfigPaths()`が
  実際の値で置換して`file.path`にセットしてから使われる。
  プレースホルダーを追加する場合は、置換処理の関数も対応させること。

### 3. フィールド(入力コンポーネント)システム(`fields/`)

`fields/index.js`の`createField(fieldDefinition, value, configName)`が、
`fieldDefinition.type`の値に応じて各`create○○Field()`関数にディスパッチする。

現在サポートされている`type`:

| type                  | 用途                                   | 主な追加プロパティ            |
|-----------------------|----------------------------------------|-------------------------------|
| `boolean`             | トグルスイッチ                         | -                              |
| `number`              | 数値入力                               | `min` / `max` / `step`         |
| `text`                | テキスト入力                           | -                              |
| `select`              | ドロップダウン(固定選択肢)             | `options: [値 or {value,label}]` |
| `array`               | フォルダパスの配列(追加/削除可)        | -                              |
| `imageSelector`       | 静的スプライトシートからの画像選択      | `image: {path, width, height, count}`, `options`(ラベル配列) |
| `imageFolderSelector` | ゲームフォルダ内の連番フォルダから画像選択 | `image: {path, file}`        |
| `folderSelector`      | ゲームフォルダ内のサブフォルダ一覧から選択 | `folders: [候補パス...]`（先頭から順に中身があるものを採用） |
| `skinSelector`        | `Skins/`配下のスキンフォルダ選択。変更時に`skin-path-changed`イベントを発火 | - |
| `fontSelect`          | 現在のスキンの`Font/`フォルダ内フォントファイル一覧から選択 | -   |
| `fontUpload`          | フォントファイルを選択し、現在のスキンの`Font/`フォルダへ移動するボタン(値を持たない疑似フィールド。下記参照) | -   |

**値を持たない「疑似フィールド」について**: `fontUpload`のように、JSON側に対応する
キーがなく、ボタン操作などの副作用だけを行うフィールドも作れる。この場合、
生成する入力要素に`dataset.config` / `dataset.key`を設定しないこと。
`collectSettings()`は`[data-config][data-key]`を持つ要素だけを走査するため、
設定しなければ保存処理から自然に除外される(誤って空文字列などをJSONへ
書き込んでしまう事故を防げる)。`configs/`側の`fields`定義には便宜上の`key`を
書いてよいが(例: `fontUploader`)、それは表示上のダミーであり実際の保存には
使われない。

新しいフィールド型を追加する手順:
1. `fields/新型.js`を作成し、`createFieldBase()`(`base.js`)を土台に
   DOM要素を組み立てて返す関数を実装する
   - 保存対象の入力要素には必ず`dataset.config = configName`と
     `dataset.key = fieldDefinition.key`を設定すること
     (`collectSettings`がこの2つの属性を頼りに値を回収するため)
   - JSONに保存する値を持たない操作用フィールド(ボタン等)の場合は、
     あえて`dataset.config` / `dataset.key`を設定しない(上記の
     「値を持たない疑似フィールド」を参照)
   - 「◀ ▶ で切り替えるプレビュー型UI」が必要なら`previewSelector.js`の
     `createPreviewSelector()`を再利用する(`imageSelector.js` /
     `imageFolderSelector.js`を参照)
   - 「ドロップダウン(`<select>`)」が必要なら`selectHelper.js`の
     `appendSelectOptions()`を再利用する(`select.js` / `folderSelector.js` /
     `skinSelector.js`を参照)
2. `fields/index.js`の`createField()`の`switch`文に`case '新型':`を追加する
3. `ui/settings.js`の`collectSettings()`内の`switch`にも、値の型変換が
   特殊な場合(数値化・配列蓄積など)は追加のcaseを書く
   (デフォルトは`element.value`をそのまま文字列として扱う。値を持たない
   疑似フィールドの場合はこの対応も不要)

### 4. データフロー

```
[フォルダ選択 / 自動検出]
        ↓
  app.js: loadDirectory(directory)
        ↓
  app.js: selectCategory(categoryId)
        ↓
  configManager.js: loadConfigs(directory, category)
        → 各file.pathのJSONを並列読み込み → { fileId: JSONデータ, ... }
        ↓
  ui/settings.js: renderSettings(container, category, configs)
        → category.filesごとにセクションを生成し、fields/index.jsのcreateField()で
          各入力要素を生成してDOMに追加
        ↓
  (ユーザーが保存ボタンをクリック)
        ↓
  ui/settings.js: collectSettings(container, category, configs)
        → data-config / data-key属性を持つ全要素を走査し、configsオブジェクトへ書き戻す
        ↓
  configManager.js: saveConfigs(directory, category, configs)
        → 各file.pathへ並列でJSON書き込み(write-json-file IPC経由)
```

### 5. 共有ステート(`fields/context.js`)

- `selectedDirectory`(現在選択中のTaikoNautsフォルダ)と`skinPath`
  (現在のスキンパス)は、モジュールスコープの変数として`context.js`が保持する。
  グローバルステート管理ライブラリは使用していない。
- `getSkinRelativePath()` / `getSkinImagePath()` / `getFileUrl()`は
  パス結合・`file:///`URL生成のユーティリティ。画像プレビュー系フィールド
  (`imageSelector` / `imageFolderSelector`)が利用する。
- スキンが変更されると`window`に`skin-path-changed`カスタムイベントが発火し、
  `app.js`側のリスナーが該当設定を自動保存してアプリをリロードする
  (スキン変更後は各種フォント/画像パスの再取得が必要なため)。

### 6. 自動更新(`main.js`)

`electron-updater`を使い、GitHub Releasesベースで自動更新チェックを行う
(`app.isPackaged`時のみ動作)。ステータスは`update-status` IPCイベントで
レンダラーに送られ、`app.js`のハンドラがボタン/テキスト表示を切り替える。
新しいステータス種別を増やす場合は、`main.js`側の`autoUpdater.on(...)`と
`app.js`側の`switch (data.status)`の両方に追記すること。

### 7. `window.location.reload()`とカテゴリ復元(localStorage)

設定変更を即座にファイル/パスへ反映させたい処理(スキン切替、フォント
アップロード等)は、ページ全体を`window.location.reload()`でリロードする方式を
採る。リロードするとJSのモジュールステート(`currentCategory`等)は全て失われる
ため、**リロード後にどの画面へ戻るかはlocalStorageで管理する**:

- `localStorage['taikoNautsDirectory']`: 前回選択したTaikoNautsフォルダのパス。
  起動時の自動読み込みに使用(`autoLoadTaikoNauts()`)。
- `localStorage['taikoNautsLastCategory']`: 直前に表示していたカテゴリID。
  `selectCategory()`が呼ばれるたびに更新される。

`app.js`の`autoLoadTaikoNauts()`は、`taikoNautsDirectory`がlocalStorageに
存在する場合(=起動時のキャッシュ読み込み、および`window.location.reload()`後の
どちらも該当)、`loadDirectory(directory, { restoreCategory: true })`を呼び、
`taikoNautsLastCategory`に保存されたカテゴリへ自動的に遷移する。
一方、ユーザーが「フォルダを選択」ボタンで**明示的に**フォルダを選び直した場合
(`selectDirectory()`)は`restoreCategory`を指定せず、常に先頭のカテゴリから
開始する(フォルダを切り替えた際に前のフォルダのカテゴリ状態を引きずらないため)。

**今後、保存直後にリロードする新しい処理を追加する場合**、このカテゴリ復元の
仕組みは`autoLoadTaikoNauts()`経由で自動的に効くため、特別な対応は基本的に
不要(単に`window.location.reload()`を呼べばよい)。ただし、カテゴリ以外の
状態(例: どのユーザー(`currentUserId`)を選択していたか、スクロール位置など)は
まだ復元対象に含まれていない。それらを保持したい場合は同様にlocalStorageへ
保存し、`loadDirectory()` / `autoLoadTaikoNauts()`側で復元する処理を追加すること。

### 8. 特殊カテゴリ(`special`) — 既存JSONを読み書きしないツール画面

`configs/`の各カテゴリは基本的に「TaikoNautsフォルダ内の既存JSONを読み込み、
編集し、同じ場所へ保存する」ことを前提にした`files`/`fields`構造だが、
**段位道場のdan.json作成ツール**のように、当てはまらない画面もある:

- 保存先の固定パスが存在しない(段位ごとにフォルダが分かれ、フォルダ名も
  ユーザー次第のため)
- 既存ファイルを読み込むのではなく、新規にデータを組み立てる
- 「保存する」ではなく「ダウンロードする」という別の完了アクションを取る

このようなカテゴリは、`files`を持たない代わりに`special`という文字列フラグを
持つ定義にする:

```js
// configs/danGenerator.js
export default {
    id: 'danGenerator',
    title: '段位道場ファイル作成',
    description: 'dan.jsonを入力フォームから作成し、ダウンロードします。',
    special: 'danGenerator'
};
```

`app.js`の`selectCategory()`は`category.special`の値を見て分岐し、
`special === 'danGenerator'`の場合は通常の`loadConfigs`/`renderSettings`を
呼ばず、`ui/danGenerator.js`の`renderDanGenerator(settingsContainer)`を
呼び出す。あわせて`#saveArea`(保存ボタン一式)を非表示にする
(通常カテゴリへ戻る際は再表示する)。`saveCurrentCategory()`側にも
`currentCategory.special`が真の場合は何もしないガードが入っている。

`ui/danGenerator.js`は完全に自己完結したモジュールで、`selectedDirectory`や
`window.electronAPI`のファイル書き込み系IPCには一切依存しない。生成した
JSONは`Blob` + `URL.createObjectURL()` + `<a download>`のクリックという
標準的なブラウザ機能だけでダウンロードさせている(Electronのメインプロセスを
経由する`dialog.showSaveDialog`等は使っていない)。

`ui/danGenerator.js`固有の入力仕様:
- 曲(`danSongs`)・合格条件(`conditions`)はどちらも**最大3件まで**
  (`MAX_SONGS` / `MAX_CONDITIONS`定数)。上限に達すると「+ 追加」ボタンが
  `disabled`になる(`.button:disabled`のスタイルは`style.css`側で汎用定義)。
  上限を変更したい場合はこの2定数を書き換えるだけでよい。
- `danIndex`(段位名)・`difficulty`(難易度)・`conditions[].type`(合格条件の種類)・
  `branchLock`(分岐ロック)は、いずれも`<select>`の表示ラベルに**英語名や数字の
  接頭辞を付けない**方針(例: `danIndex`は「五級」であって「0: 五級」ではない、
  `type`は「良の数」であって「良の数(Great)」ではない)。実際に保存される
  JSONの値(`option.value`)は引き続き仕様通りの数値/英語文字列
  (`0`, `'Great'`, `'None'`など)。新しい選択肢を追加するときもこの表記ルールに
  合わせること。

**同様の「ツール的な画面」を追加する場合の手順**:
1. `configs/新ツール.js`に`special: '任意の識別子'`を持つ定義を作る(`files`は
   書かない)
2. `configs/index.js`の配列に追加する(サイドバーに自動で表示される)
3. `ui/新ツール.js`に`render新ツール(container)`のような描画関数を実装する
   (`fields/base.js`の`createFieldBase()`は流用できるが、`dataset.config` /
   `dataset.key`は設定しない = 通常の保存フローに一切乗らない)
4. `app.js`の`selectCategory()`に`category.special === '任意の識別子'`の分岐を
   追加し、専用の描画関数を呼び出す。保存ボタン(`#saveArea`)を隠すかどうかも
   ここで決める

## コーディング規約

- **コメント・UI文言は日本語**で統一されている。新規コードもこれに合わせる。
- JSONファイルはBOM付きのケースがあるため、読み込み時は必ず
  `content.replace(/^\uFEFF/, '')`でBOMを除去してからパースする
  (`main.js`の各`read-*`ハンドラを参照)。
- 書き込み時は`JSON.stringify(data, null, 2)`で整形し、末尾に改行を1つ付与する。
- CSSはCSS変数(`:root`内の`--primary`, `--surface`など)でテーマカラーを一元管理。
  色を直書きせず、既存の変数を再利用するか新しい変数を`:root`に追加すること。
- フィールドDOMの構造は`fields/base.js`の`createFieldBase()`が生成する
  `.setting-field > (.setting-info, .setting-control)`という構造に統一する。
  独自レイアウトが必要な場合(`fontSelect.js`のように)も、可能な限りこの構造・
  クラス名(`setting-field` / `setting-label` / `setting-description` /
  `setting-control`)に合わせて`style.css`の既存スタイルを再利用する。
- セクション見出し(カテゴリ内の各ファイル/グループのタイトル)は
  `.settings-section-header`内に`<h3>`(必要なら`<p>`で補足説明)を置く構造に
  統一する(`ui/settings.js`の`renderSettings()`、`ui/danGenerator.js`の
  `createSectionElement()`を参照)。見出し用に新しいクラスを増やさないこと。

## 既知の注意点 / TODO候補

- Windows専用の全ドライブ探索(`findTaikoNauts`)はmacOS/Linuxを考慮していない。
  クロスプラットフォーム対応が必要になった場合は`main.js`のドライブ文字列探索
  ロジックを見直すこと。
- `danGenerator.js`の「曲ごと」条件で、各曲の閾値行に表示される曲パスのラベルは
  行の再描画時にしか更新されない(曲のパス入力欄を編集しても、既に表示済みの
  閾値ラベルはリアルタイムには追従しない)。実害は小さいが、双方向バインディングを
  入れると改善できる。

## 変更時のチェックリスト

新しい設定カテゴリやフィールド型を追加したら、以下を確認する:

- [ ] `configs/`の定義に文法ミスがないか(通常カテゴリなら`id` / `path or
      pathTemplate` / `fields`。特殊カテゴリなら`id` / `special`)
- [ ] 新しい`type`を使った場合、`fields/index.js`と`collectSettings`の両方に
      対応するcaseを追加したか
- [ ] `dataset.config` / `dataset.key`が入力要素に正しく設定されているか
      (保存時に値が回収されない典型的なバグ原因。ただし値を持たない疑似
      フィールド・特殊カテゴリでは意図的に未設定でよい)
- [ ] `pathTemplate`を使う場合、置換処理(`updatePlayerConfigPaths`等)を
      呼び出すタイミングが正しいか
- [ ] 特殊カテゴリ(`special`)を追加した場合、`app.js`の`selectCategory()`に
      分岐を追加し、`#saveArea`の表示/非表示を適切に切り替えたか
- [ ] このAGENTS.mdの該当セクション(フィールド型一覧・ディレクトリ構成など)を
      更新したか