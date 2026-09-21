import configDefinitions from '../../configs/index.js';
import playerConfig from '../../configs/player.js';
import { loadConfigs, saveConfigs } from './configManager.js';
import { setSelectedDirectory, setSkinPath } from './fields/context.js';
import { renderCategories, setActiveCategory } from './ui/category.js';
import { renderSettings, collectSettings } from './ui/settings.js';
import { setPageInfo, setSaveStatus, setSaveButtonState, setDirectoryPath } from './ui/status.js';

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
        console.error('ユーザー一覧の構築に失敗しました。', error);
        userSelectWrapper.style.display = 'none';
    }
}

// 指定されたディレクトリを読み込んでUIの切り替えを行う
async function loadDirectory(directory) {
    try {
        selectedDirectory = directory;
        setSelectedDirectory(directory);
        setDirectoryPath(directoryPath, directory);

        // スキンパスを取得してコンテキストに設定
        const currentSkinPath = await window.electronAPI.getSkinPath(directory);
        setSkinPath(currentSkinPath);

        // ユーザー一覧ドロップダウンを読み込み, パスを初期化
        await loadUserDropdown(directory);
        updatePlayerConfigPaths(currentUserId);

        // ウェルカム画面から設定画面に切り替え
        welcomeView.classList.add('hidden');
        settingsView.classList.remove('hidden');

        // 一番上のカテゴリを表示
        const categoryId = currentCategory?.id ?? configDefinitions[0]?.id;

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

    // UIの表示を更新
    setActiveCategory(categoryList, category.id);
    setPageInfo(pageTitle, pageDescription, category);
    setSaveStatus(saveStatus, '');

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
        errorMessage.textContent = '設定の読み込みに失敗しました。';
        settingsContainer.append(errorMessage);
    }
}

// ディレクトリの手動選択
async function selectDirectory() {
    const directory = await window.electronAPI.selectDirectory();
    if (!directory) return;

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
            await loadDirectory(cachedDirectory);
            return;
        }

        const directory = await window.electronAPI.findTaikoNauts();

        if (!directory) {
            if (welcomeMessage) {
                welcomeMessage.textContent = 'TaikoNauts-latestが見つかりませんでした。';
            }
            return;
        }

        localStorage.setItem('taikoNautsDirectory', directory);
        await loadDirectory(directory);
    } catch (error) {
        console.error('TaikoNauts-latestの自動読み込みに失敗しました。', error);
        localStorage.removeItem('taikoNautsDirectory');

        if (welcomeMessage) {
            welcomeMessage.textContent = 'TaikoNauts-latestの読み込みに失敗しました。';
        }
    }
}

// 現在のカテゴリの内容を保存
async function saveCurrentCategory() {
    if (!selectedDirectory || !currentCategory) return;

    const previousSkinPath = configs.gameConfig?.skinPath;

    collectSettings(settingsContainer, currentCategory, configs);

    const skinPathChanged = currentCategory.id === 'game' && previousSkinPath !== configs.gameConfig?.skinPath;

    setSaveButtonState(saveBtn, true);
    setSaveStatus(saveStatus, '保存中...');

    try {
        await saveConfigs(selectedDirectory, currentCategory, configs);
        setSaveStatus(saveStatus, '保存しました。');

        if (skinPathChanged) {
            window.location.reload();
        }
    } catch (error) {
        console.error(error);
        setSaveStatus(saveStatus, '保存に失敗しました。');
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
        console.error('スキン設定の保存に失敗しました。', error);
    }
});

// 起動時にTaikoNautsフォルダの自動読み込みを実行
autoLoadTaikoNauts();