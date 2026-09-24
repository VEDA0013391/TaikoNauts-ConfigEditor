import configDefinitions from '../../configs/index.js';
import playerConfig from '../../configs/player.js';
import skinConfig from '../../configs/skin.js';
import { loadConfigs, saveConfigs } from './configManager.js';
import { setSelectedDirectory, setSkinPath } from './fields/context.js';
import { renderCategories, setActiveCategory } from './ui/category.js';
import { renderSettings, collectSettings } from './ui/settings.js';
import { renderDanGenerator } from './ui/danGenerator.js'; // ★ 追加: 段位道場ファイル作成ツール
import { setPageInfo, setSaveStatus, setSaveButtonState, setDirectoryPath } from './ui/status.js';

// 画面リロード後にどのカテゴリへ戻るかを覚えておくためのlocalStorageキー。
// フォントアップロードやスキン切替のようにwindow.location.reload()を行う処理は、
// このキーに頼って「元の画面」へ復帰する(autoLoadTaikoNauts側で参照)。
const LAST_CATEGORY_STORAGE_KEY = 'taikoNautsLastCategory';

let selectedDirectory = null;
let currentCategory = null;
let configs = {};
let currentUserId = '0';

const categoryList = document.getElementById('categoryList');
const welcomeView = document.getElementById('welcomeView');
const settingsView = document.getElementById('settingsView');
const pageTitle = document.getElementById('pageTitle');
const pageDescription = document.getElementById('pageDescription');
const settingsContainer = document.getElementById('settingsContainer');
const saveStatus = document.getElementById('saveStatus');
const saveBtn = document.getElementById('saveBtn');
const saveArea = document.getElementById('saveArea'); // ★ 追加: 段位道場ツール表示時に隠す
const directoryPath = document.getElementById('directoryPath');
const selectDirectoryBtn = document.getElementById('selectDirectoryBtn');
const welcomeSelectDirectoryBtn = document.getElementById('welcomeSelectDirectoryBtn');
const userSelect = document.getElementById('userSelect'); // ★ 追加: ドロップダウン要素
const userSelectWrapper = document.getElementById('userSelectWrapper'); // ★ 追加: ドロップダウン囲み要素

// playerConfigのパステンプレートを更新する処理
function updatePlayerConfigPaths(userId) {
    playerConfig.files.forEach((file) => {
        if (file.pathTemplate) {
            file.path = file.pathTemplate.replace('{userId}', userId);
        }
    });
}

// skinConfigのパステンプレートを更新する処理
function updateSkinConfigPaths(skinPath) {
    if (!skinConfig || !skinConfig.files) return;

    skinConfig.files.forEach((file) => {
        if (file.pathTemplate) {
            // スキンパスを適用
            file.path = file.pathTemplate.replace('{skinName}', skinPath);
        }
    });
}

// ユーザー一覧を取得してドロップダウンを構築する
async function loadUserDropdown(directory) {
    if (!userSelect || !userSelectWrapper) return;

    try {
        const players = await window.electronAPI.getPlayerList(directory);

        if (!players || players.length === 0) {
            userSelectWrapper.style.display = 'none';
            return;
        }

        userSelect.innerHTML = '';
        players.forEach((player) => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.label;
            if (player.id === currentUserId) {
                option.selected = true;
            }
            userSelect.appendChild(option);
        });

        userSelectWrapper.style.display = 'flex';
    } catch (error) {
        console.error('ユーザー一覧の構築に失敗しました', error);
        userSelectWrapper.style.display = 'none';
    }
}

// 指定されたディレクトリを読み込んでUIの切り替えを行う
// options.restoreCategory が true の場合、localStorageに保存された直前のカテゴリへ
// 自動的に遷移する(フォントアップロード後のリロード等、アプリ側が自動で行う
// window.location.reload()からの復帰専用。ユーザーが手動でフォルダを選び直した
// 場合は常に先頭のカテゴリから開始する)。
async function loadDirectory(directory, options = {}) {
    const { restoreCategory = false } = options;

    try {
        selectedDirectory = directory;
        setSelectedDirectory(directory);
        setDirectoryPath(directoryPath, directory);

        // スキンパスを取得してコンテキストに設定
        const currentSkinPath = await window.electronAPI.getSkinPath(directory);
        setSkinPath(currentSkinPath);

        // スキン設定のパスを更新
        if (currentSkinPath) {
            updateSkinConfigPaths(currentSkinPath);
        }

        // ユーザー一覧ドロップダウンを読み込み, パスを初期化
        await loadUserDropdown(directory);
        updatePlayerConfigPaths(currentUserId);

        // ウェルカム画面から設定画面に切り替え
        welcomeView.classList.add('hidden');
        settingsView.classList.remove('hidden');

        // 表示するカテゴリを決定
        // 1. 既にメモリ上にcurrentCategoryがあればそれを優先
        // 2. restoreCategory指定時はlocalStorageに保存された直前のカテゴリを復元
        // 3. どちらもなければ先頭のカテゴリ
        const restoredCategoryId = restoreCategory
            ? localStorage.getItem(LAST_CATEGORY_STORAGE_KEY)
            : null;
        const isRestoredCategoryValid = restoredCategoryId
            && configDefinitions.some((category) => category.id === restoredCategoryId);

        const categoryId = currentCategory?.id
            ?? (isRestoredCategoryValid ? restoredCategoryId : null)
            ?? configDefinitions[0]?.id;

        if (categoryId) {
            await selectCategory(categoryId);
        }
    } catch (error) {
        console.error(error);

        // エラー発生時は状態を初期化してウェルカム画面に戻す
        selectedDirectory = null;
        currentCategory = null;
        configs = {};

        setSelectedDirectory(null);
        setSkinPath(null);
        setDirectoryPath(directoryPath, null);

        welcomeView.classList.remove('hidden');
        settingsView.classList.add('hidden');
        setSaveStatus(saveStatus, '');
    }
}

// カテゴリの該当する設定項目を読み込んでレンダリング
async function selectCategory(categoryId) {
    if (!selectedDirectory) return;

    const category = configDefinitions.find((item) => item.id === categoryId);
    if (!category) return;

    currentCategory = category;

    // 次回リロード時に同じカテゴリへ戻れるように記憶しておく
    localStorage.setItem(LAST_CATEGORY_STORAGE_KEY, category.id);

    // UIの表示を更新
    setActiveCategory(categoryList, category.id);
    setPageInfo(pageTitle, pageDescription, category);
    setSaveStatus(saveStatus, '');

    // 段位道場ファイル作成ツールは既存JSONの読み込み/保存を行わない特殊カテゴリ。
    // 通常の保存ボタンは隠し、専用の描画関数へ切り替える。
    if (category.special === 'danGenerator') {
        if (saveArea) saveArea.classList.add('hidden');
        configs = {};
        renderDanGenerator(settingsContainer);
        return;
    }

    if (saveArea) saveArea.classList.remove('hidden');

    try {
        // 設定ファイルの読み込みと設定画面のレンダリング
        configs = await loadConfigs(selectedDirectory, category);
        await renderSettings(settingsContainer, category, configs);
    } catch (error) {
        console.error(error);

        // 読み込み失敗時のエラー表示
        settingsContainer.innerHTML = '';
        const errorMessage = document.createElement('div');
        errorMessage.className = 'setting-error';
        errorMessage.textContent = '設定の読み込みに失敗しました';
        settingsContainer.append(errorMessage);
    }
}

// ディレクトリの手動選択
async function selectDirectory() {
    const directory = await window.electronAPI.selectDirectory();
    if (!directory) return;

    // ユーザーが明示的にフォルダを選び直した場合は先頭のカテゴリから開始する
    currentCategory = null;
    await loadDirectory(directory);
}

// TaikoNautsフォルダの自動読み込み
async function autoLoadTaikoNauts() {
    const welcomeMessage = document.getElementById('welcomeMessage');

    if (welcomeMessage) {
        welcomeMessage.textContent = '読み込み中...';
    }

    try {
        const cachedDirectory = localStorage.getItem('taikoNautsDirectory');

        if (cachedDirectory) {
            // アプリ起動時・window.location.reload()後のいずれもここを通るため、
            // 直前に開いていたカテゴリへ復元する
            await loadDirectory(cachedDirectory, { restoreCategory: true });
            return;
        }

        const directory = await window.electronAPI.findTaikoNauts();

        if (!directory) {
            if (welcomeMessage) {
                welcomeMessage.textContent = 'TaikoNauts-latestが見つかりませんでした';
            }
            return;
        }

        localStorage.setItem('taikoNautsDirectory', directory);
        await loadDirectory(directory, { restoreCategory: true });
    } catch (error) {
        console.error('TaikoNauts-latestの自動読み込みに失敗しました', error);
        localStorage.removeItem('taikoNautsDirectory');

        if (welcomeMessage) {
            welcomeMessage.textContent = 'TaikoNauts-latestの読み込みに失敗しました';
        }
    }
}

// 現在のカテゴリの内容を保存
async function saveCurrentCategory() {
    if (!selectedDirectory || !currentCategory || currentCategory.special) return;

    const previousSkinPath = configs.gameConfig?.skinPath;

    collectSettings(settingsContainer, currentCategory, configs);

    const skinPathChanged = currentCategory.id === 'game' && previousSkinPath !== configs.gameConfig?.skinPath;

    setSaveButtonState(saveBtn, true);
    setSaveStatus(saveStatus, '保存中...');

    try {
        await saveConfigs(selectedDirectory, currentCategory, configs);
        setSaveStatus(saveStatus, '保存しました');

        if (skinPathChanged) {
            window.location.reload();
        }
    } catch (error) {
        console.error(error);
        setSaveStatus(saveStatus, '保存に失敗しました');
    } finally {
        setSaveButtonState(saveBtn, false);
    }
}

// 初期表示時のカテゴリ一覧レンダリング
renderCategories(categoryList, configDefinitions, null, selectCategory);

// イベントリスナーの登録
selectDirectoryBtn.addEventListener('click', selectDirectory);
welcomeSelectDirectoryBtn.addEventListener('click', selectDirectory);
saveBtn.addEventListener('click', saveCurrentCategory);

// ユーザー切り替え時のイベントハンドラ
if (userSelect) {
    userSelect.addEventListener('change', async (e) => {
        currentUserId = e.target.value;

        // パステンプレートを更新
        updatePlayerConfigPaths(currentUserId);

        // プレイヤー情報カテゴリを表示中の場合は設定を読み込み直して再描画
        if (currentCategory && currentCategory.id === 'player') {
            await selectCategory('player');
        }
    });
}

// スキン変更時の自動保存処理
window.addEventListener('skin-path-changed', async (event) => {
    if (!selectedDirectory) return;

    collectSettings(settingsContainer, currentCategory, configs);
    configs.gameConfig.skinPath = event.detail.value;

    try {
        const gameCategory = configDefinitions.find((category) => category.id === 'game');
        if (!gameCategory) return;

        await saveConfigs(selectedDirectory, gameCategory, configs);
        window.location.reload();
    } catch (error) {
        console.error('スキン設定の保存に失敗しました', error);
    }
});

// 起動時にTaikoNautsフォルダの自動読み込みを実行
autoLoadTaikoNauts();

const updateStatusText = document.getElementById('updateStatusText');
const updateBtn = document.getElementById('updateBtn');

// アップデート状態イベントの受取
window.electronAPI.onUpdateStatus((data) => {
    // 受信した生のデータをコンソールに出力
    console.log('[AutoUpdater] ステータスを受信:', data);

    if (!updateStatusText || !updateBtn) {
        console.warn('[AutoUpdater] UI要素が見つかりません。DOMの設定を確認してください');
        return;
    }

    switch (data.status) {
        case 'checking':
            console.log('[AutoUpdater] アップデートを確認中...');
            updateStatusText.textContent = '更新確認中...';
            updateStatusText.style.display = 'inline';
            updateBtn.style.display = 'none';
            break;

        case 'latest':
            console.log('[AutoUpdater] アプリは最新バージョンです');
            updateStatusText.textContent = '最新バージョンです';
            updateStatusText.style.display = 'inline';
            updateBtn.style.display = 'none';
            break;

        case 'available':
            console.log(`[AutoUpdater] 新バージョン発見: v${data.version}`);
            // 最新版が見つかったらテキストを非表示にし、ボタンを表示
            updateStatusText.style.display = 'none';
            updateBtn.textContent = `v${data.version} にアップデート`;
            updateBtn.className = 'update-btn';
            updateBtn.style.display = 'inline-block';
            updateBtn.disabled = false;
            updateBtn.onclick = () => {
                console.log('[AutoUpdater] アップデートのダウンロードを開始します...');
                updateBtn.textContent = 'ダウンロード中 (0%)...';
                updateBtn.className = 'update-btn downloading';
                updateBtn.disabled = true;
                window.electronAPI.startUpdateDownload();
            };
            break;

        case 'downloading':
            console.log(`[AutoUpdater] ダウンロード進捗: ${data.percent}%`);
            updateBtn.textContent = `ダウンロード中 (${data.percent}%)...`;
            break;

        case 'downloaded':
            console.log('[AutoUpdater] ダウンロード完了。再起動待機中');
            updateBtn.textContent = '再起動して更新を適用';
            updateBtn.className = 'update-btn';
            updateBtn.disabled = false;
            updateBtn.onclick = () => {
                console.log('[AutoUpdater] 再起動・インストール要求を送信します');
                window.electronAPI.quitAndInstall();
            };
            break;

        case 'error':
            console.error('[AutoUpdater] エラーが発生しました:', data.error);
            updateStatusText.textContent = '更新チェック失敗';
            updateStatusText.style.display = 'inline';
            updateBtn.style.display = 'none';
            break;
    }
});