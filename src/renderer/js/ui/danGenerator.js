import { createFieldBase } from '../fields/base.js';

const MAX_SONGS = 3;
const MAX_CONDITIONS = 3;

// 難易度の選択肢
const DIFFICULTY_OPTIONS = [
    { value: 0, label: 'かんたん' },
    { value: 1, label: 'ふつう' },
    { value: 2, label: 'むずかしい' },
    { value: 3, label: 'おに' },
    { value: 4, label: 'おに(裏)' }
];

// danIndexの選択肢
const DAN_INDEX_NAMES = [
    '五級', '四級', '三級', '二級', '一級',
    '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段',
    '玄人', '名人', '超人', '達人', '外伝'
];
const DAN_INDEX_OPTIONS = DAN_INDEX_NAMES.map((name, index) => ({
    value: index,
    label: name
}));

// 条件の選択肢
const CONDITION_TYPE_OPTIONS = [
    { value: 'Great', label: '良の数' },
    { value: 'Good', label: '可の数' },
    { value: 'Miss', label: '不可の数' },
    { value: 'Roll', label: '連打数' },
    { value: 'Hit', label: 'たたけた数' },
    { value: 'Score', label: 'スコア' },
    { value: 'MaxCombo', label: 'コンボ数' }
];

// branchLockの選択肢
const BRANCH_LOCK_OPTIONS = [
    { value: 'None', label: 'なし' },
    { value: 'Normal', label: '普通譜面固定' },
    { value: 'Expert', label: '玄人譜面固定' },
    { value: 'Master', label: '達人譜面固定' }
];

const THRESHOLD_MODE_OPTIONS = [
    { value: 'single', label: '共通条件' },
    { value: 'perSong', label: '個別条件' }
];

let state = null;

// 曲1件分の初期値
function createEmptySong() {
    return {
        path: '',
        difficulty: 1,
        genre: '',
        isHidden: false,
        branchLock: 'None'
    };
}

function createEmptyCondition() {
    return {
        type: 'Great',
        mode: 'single',
        single: { red: 0, gold: 0 },
        perSong: []
    };
}

function createInitialState() {
    return {
        title: '',
        danIndex: 0,
        danPlatePath: '',
        danPanelSidePath: '',
        danTitlePlatePath: '',
        danMiniPlatePath: '',
        danMiniPlateText: '',
        songs: [createEmptySong()],
        conditionGauge: { red: 80, gold: 100 },
        conditions: []
    };
}

// 共通の入力行ビルダー
function createSectionElement(title) {
    const section = document.createElement('section');
    section.className = 'settings-section';

    const header = document.createElement('div');
    header.className = 'settings-section-header';

    const heading = document.createElement('h3');
    heading.textContent = title;
    header.append(heading);

    section.append(header);

    return section;
}

function createTextRow(label, initialValue, onInput, description, placeholder) {
    const { field, control } = createFieldBase({ label, description });

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.value = initialValue ?? '';
    if (placeholder) {
        input.placeholder = placeholder;
    }
    input.addEventListener('input', () => onInput(input.value));

    control.append(input);
    return field;
}

function createNumberRow(label, initialValue, onInput, { description, min, max } = {}) {
    const { field, control } = createFieldBase({ label, description });

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'number-input';
    input.value = initialValue ?? 0;
    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    input.addEventListener('input', () => {
        onInput(input.value === '' ? 0 : Number(input.value));
    });

    control.append(input);
    return field;
}

function createBooleanRow(label, initialValue, onInput, description) {
    const { field, control } = createFieldBase({ label, description });

    const toggle = document.createElement('label');
    toggle.className = 'toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(initialValue);
    input.addEventListener('change', () => onInput(input.checked));

    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    toggle.append(input, slider);
    control.append(toggle);
    return field;
}

function createSelectRow(label, options, initialValue, onInput, description) {
    const { field, control } = createFieldBase({ label, description });

    const select = document.createElement('select');
    select.className = 'select-input';

    options.forEach((option) => {
        const opt = document.createElement('option');
        const value = typeof option === 'object' ? option.value : option;
        const optLabel = typeof option === 'object' ? option.label : option;

        opt.value = value;
        opt.textContent = optLabel;
        if (String(value) === String(initialValue)) {
            opt.selected = true;
        }

        select.append(opt);
    });

    select.addEventListener('change', () => onInput(select.value));

    control.append(select);
    return field;
}

// 基本情報
function buildBasicSection() {
    const section = createSectionElement('基本情報');

    section.append(
        createTextRow('タイトル', state.title, (value) => { state.title = value; }, '段位のタイトル名'),
        createSelectRow('段位インデックス', DAN_INDEX_OPTIONS, state.danIndex, (value) => { state.danIndex = Number(value); }, '段位のインデックス番号'),
        createTextRow('段位プレート画像パス', state.danPlatePath, (value) => { state.danPlatePath = value; }, '段位プレート画像のファイル名', 'Plate.png'),
        createTextRow('段位パネルサイド画像パス', state.danPanelSidePath, (value) => { state.danPanelSidePath = value; }, '段位パネルのサイド画像のファイル名(任意) - 条件パネル横の帯', 'side.png'),
        createTextRow('段位タイトルプレート画像パス', state.danTitlePlatePath, (value) => { state.danTitlePlatePath = value; }, '段位タイトルプレート画像のファイル名(任意) - 条件パネル上部のタイトル表示欄', 'titlePlate.png'),
        createTextRow('段位ミニプレート画像パス', state.danMiniPlatePath, (value) => { state.danMiniPlatePath = value; }, '段位ミニプレート画像のファイル名(任意) - 段位画面で上に並ぶプレート', 'miniPlate.png'),
        createTextRow('段位ミニプレートテキスト', state.danMiniPlateText, (value) => { state.danMiniPlateText = value; }, '段位ミニプレートに表示するテキスト(任意)')
    );

    return section;
}

// 曲
function buildSongsSection(onSongsChanged) {
    const section = createSectionElement('演奏曲');

    const description = document.createElement('p');
    description.className = 'setting-description dan-section-description';
    description.textContent = `段位で演奏する曲を順番に追加してください(最大${MAX_SONGS}件)。`;
    section.append(description);

    const listContainer = document.createElement('div');
    section.append(listContainer);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'button array-add-button dan-section-action-button';
    addBtn.textContent = '+ 曲を追加';
    addBtn.addEventListener('click', () => {
        if (state.songs.length >= MAX_SONGS) return;
        state.songs.push(createEmptySong());
        renderSongsList();
        onSongsChanged();
    });
    section.append(addBtn);

    function updateAddButtonState() {
        addBtn.disabled = state.songs.length >= MAX_SONGS;
    }

    function renderSongsList() {
        listContainer.innerHTML = '';

        state.songs.forEach((song, index) => {
            listContainer.append(buildSongRow(song, index));
        });

        updateAddButtonState();
    }

    function buildSongRow(song, index) {
        const row = document.createElement('div');
        row.className = 'dan-song-row';

        const header = document.createElement('div');
        header.className = 'dan-row-header';

        const title = document.createElement('span');
        title.className = 'dan-row-title';
        title.textContent = `曲 ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'dan-row-remove-button';
        removeBtn.textContent = '削除';
        removeBtn.disabled = state.songs.length <= 1;
        removeBtn.addEventListener('click', () => {
            if (state.songs.length <= 1) return;
            state.songs.splice(index, 1);
            renderSongsList();
            onSongsChanged();
        });

        header.append(title, removeBtn);
        row.append(header);

        row.append(
            createTextRow('TJAファイル名', song.path, (value) => { song.path = value; }, 'path', 'sample.tja'),
            createSelectRow('難易度', DIFFICULTY_OPTIONS, song.difficulty, (value) => { song.difficulty = Number(value); }, 'difficulty(0~4)'),
            createTextRow('ジャンル', song.genre, (value) => { song.genre = value; }, 'genre'),
            createBooleanRow('隠し曲にする(???表示)', song.isHidden, (value) => { song.isHidden = value; }, 'isHidden'),
            createSelectRow('譜面分岐ロック', BRANCH_LOCK_OPTIONS, song.branchLock, (value) => { song.branchLock = value; }, 'branchLock')
        );

        return row;
    }

    renderSongsList();

    return section;
}

// 魂ゲージ
function buildGaugeSection() {
    const section = createSectionElement('ゲージの合格条件');

    section.append(
        createNumberRow('赤合格(%)', state.conditionGauge.red, (value) => { state.conditionGauge.red = value; }, {
            description: '赤合格に必要なゲージ',
            min: 0,
            max: 100
        }),
        createNumberRow('金合格(%)', state.conditionGauge.gold, (value) => { state.conditionGauge.gold = value; }, {
            description: '金合格に必要なゲージ',
            min: 0,
            max: 100
        })
    );

    return section;
}

// 合格条件
function buildConditionsSection(getSongCount) {
    const section = createSectionElement('合格条件(任意)');

    const description = document.createElement('p');
    description.className = 'setting-description dan-section-description';
    description.textContent = `1件も追加しない場合、出力するJSONに"conditions"キー自体を含めません(最大${MAX_CONDITIONS}件)`;
    section.append(description);

    const listContainer = document.createElement('div');
    section.append(listContainer);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'button array-add-button dan-section-action-button';
    addBtn.textContent = '+ 条件を追加';
    addBtn.addEventListener('click', () => {
        if (state.conditions.length >= MAX_CONDITIONS) return;
        state.conditions.push(createEmptyCondition());
        renderConditionsList();
    });
    section.append(addBtn);

    function updateAddButtonState() {
        addBtn.disabled = state.conditions.length >= MAX_CONDITIONS;
    }

    function syncPerSongThresholds() {
        const songCount = getSongCount();

        state.conditions.forEach((condition) => {
            if (condition.mode !== 'perSong') return;

            while (condition.perSong.length < songCount) {
                condition.perSong.push({ red: 0, gold: 0 });
            }
            condition.perSong.length = songCount;
        });
    }

    function renderConditionsList() {
        syncPerSongThresholds();

        listContainer.innerHTML = '';

        state.conditions.forEach((condition, index) => {
            listContainer.append(buildConditionRow(condition, index));
        });

        updateAddButtonState();
    }

    function buildConditionRow(condition, index) {
        const row = document.createElement('div');
        row.className = 'dan-condition-row';

        const header = document.createElement('div');
        header.className = 'dan-row-header';

        const title = document.createElement('span');
        title.className = 'dan-row-title';
        title.textContent = `条件 ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'dan-row-remove-button';
        removeBtn.textContent = '削除';
        removeBtn.addEventListener('click', () => {
            state.conditions.splice(index, 1);
            renderConditionsList();
        });

        header.append(title, removeBtn);
        row.append(header);

        row.append(
            createSelectRow('種類', CONDITION_TYPE_OPTIONS, condition.type, (value) => { condition.type = value; }, 'type'),
            createSelectRow('閾値の形式', THRESHOLD_MODE_OPTIONS, condition.mode, (value) => {
                condition.mode = value;
                renderConditionsList();
            }, '単一なら全曲共通、曲ごとなら演奏曲の数だけ個別に指定します')
        );

        if (condition.mode === 'perSong') {
            syncPerSongThresholds();

            state.songs.forEach((song, songIndex) => {
                const threshold = condition.perSong[songIndex];
                row.append(buildThresholdSubRow(song, songIndex, threshold));
            });
        } else {
            row.append(
                createNumberRow('赤合格の閾値', condition.single.red, (value) => { condition.single.red = value; }, { description: 'red' }),
                createNumberRow('金合格の閾値', condition.single.gold, (value) => { condition.single.gold = value; }, { description: 'gold' })
            );
        }

        return row;
    }

    function buildThresholdSubRow(song, songIndex, threshold) {
        const subRow = document.createElement('div');
        subRow.className = 'dan-threshold-subrow';

        const label = document.createElement('span');
        label.className = 'dan-threshold-label';
        label.textContent = `曲${songIndex + 1}: ${song.path || '(未入力)'}`;

        const redInput = document.createElement('input');
        redInput.type = 'number';
        redInput.className = 'number-input';
        redInput.value = threshold.red;
        redInput.title = '赤合格の閾値';
        redInput.addEventListener('input', () => {
            threshold.red = redInput.value === '' ? 0 : Number(redInput.value);
        });

        const goldInput = document.createElement('input');
        goldInput.type = 'number';
        goldInput.className = 'number-input';
        goldInput.value = threshold.gold;
        goldInput.title = '金合格の閾値';
        goldInput.addEventListener('input', () => {
            threshold.gold = goldInput.value === '' ? 0 : Number(goldInput.value);
        });

        subRow.append(label, redInput, goldInput);
        return subRow;
    }

    renderConditionsList();

    section.refreshForSongChange = () => {
        renderConditionsList();
    };

    return section;
}

// dan.jsonの組み立て
function buildDanJson() {
    const json = {
        title: state.title,
        danIndex: Number(state.danIndex) || 0,
        danPlatePath: state.danPlatePath,
        danPanelSidePath: state.danPanelSidePath,
        danTitlePlatePath: state.danTitlePlatePath,
        danMiniPlatePath: state.danMiniPlatePath,
        danMiniPlateText: state.danMiniPlateText,
        danSongs: state.songs.map((song) => {
            const songJson = {
                path: song.path,
                difficulty: Number(song.difficulty),
                genre: song.genre,
                isHidden: Boolean(song.isHidden)
            };

            if (song.branchLock) {
                songJson.branchLock = song.branchLock;
            }

            return songJson;
        }),
        conditionGauge: {
            red: Number(state.conditionGauge.red) || 0,
            gold: Number(state.conditionGauge.gold) || 0
        }
    };

    if (state.conditions.length > 0) {
        json.conditions = state.conditions.map((condition) => ({
            type: condition.type,
            threshold: condition.mode === 'perSong'
                ? condition.perSong.map((t) => ({
                    red: Number(t.red) || 0,
                    gold: Number(t.gold) || 0
                }))
                : [{
                    red: Number(condition.single.red) || 0,
                    gold: Number(condition.single.gold) || 0
                }]
        }));
    }

    return json;
}

// ダウンロード
function buildDownloadSection() {
    const section = createSectionElement('ダウンロード');

    const bar = document.createElement('div');
    bar.className = 'dan-download-bar';

    const status = document.createElement('span');
    status.className = 'dan-download-status';

    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'button primary';
    downloadBtn.textContent = 'dan.jsonをダウンロード';

    downloadBtn.addEventListener('click', () => {
        status.classList.remove('error', 'success');

        if (!state.title || state.songs.length === 0 || state.songs.some((song) => !song.path)) {
            status.classList.add('error');
            status.textContent = 'タイトルと、すべての曲のTJAファイルパスを入力してください';
            return;
        }

        try {
            const json = buildDanJson();
            const content = `${JSON.stringify(json, null, 2)}\n`;
            const blob = new Blob([content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const fileName = 'dan.json';

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.append(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            status.classList.add('success');
            status.textContent = `${fileName} をダウンロードしました`;
        } catch (error) {
            console.error('dan.jsonの生成に失敗しました', error);
            status.classList.add('error');
            status.textContent = '生成に失敗しました';
        }
    });

    bar.append(status, downloadBtn);
    section.append(bar);

    return section;
}

// 段位道場ファイル作成画面をcontainerへレンダリングする
// カテゴリ切替のたびに呼び出され、内部状態は毎回リセット
function renderDanGenerator(container) {
    state = createInitialState();

    container.innerHTML = '';

    const intro = document.createElement('p');
    intro.className = 'setting-description dan-generator-intro';
    intro.textContent = '入力した内容からdan.jsonを生成してダウンロードします。生成後、対象の段位フォルダへ手動で配置してください';
    container.append(intro);

    const conditionsSection = buildConditionsSection(() => state.songs.length);
    const songsSection = buildSongsSection(() => conditionsSection.refreshForSongChange());

    container.append(
        buildBasicSection(),
        songsSection,
        buildGaugeSection(),
        conditionsSection,
        buildDownloadSection()
    );
}

export {
    renderDanGenerator
};