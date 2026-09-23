const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs/promises');
const path = require('path');

// ログ出力設定
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// 自動ダウンロードを無効化
autoUpdater.autoDownload = false;

let win;

function setupAutoUpdater(win) {
    // 画面が準備完了したらアップデートチェックを実行
    win.once('ready-to-show', () => {
        console.log('[AutoUpdater] 更新チェックを開始します...');
        autoUpdater.checkForUpdates();
    });

    autoUpdater.on('checking-for-update', () => {
        console.log('[AutoUpdater] GitHubの最新リリースを確認中...');
        win.webContents.send('update-status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
        console.log(`[AutoUpdater] 新しいバージョンが見つかりました: v${info.version}`);
        win.webContents.send('update-status', {
            status: 'available',
            version: info.version
        });
    });

    autoUpdater.on('update-not-available', (info) => {
        console.log(`[AutoUpdater] 現在のバージョンは最新です (現在のバージョン: v${info.version})`);
        win.webContents.send('update-status', { status: 'latest' });
    });

    autoUpdater.on('error', (err) => {
        console.error('[AutoUpdater] エラーが発生しました:', err);
        win.webContents.send('update-status', { status: 'error', error: err.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
        console.log(`[AutoUpdater] ダウンロード進捗: ${Math.floor(progressObj.percent)}%`);
        win.webContents.send('update-status', {
            status: 'downloading',
            percent: Math.floor(progressObj.percent)
        });
    });

    autoUpdater.on('update-downloaded', () => {
        console.log('[AutoUpdater] ダウンロードが完了しました。');
        win.webContents.send('update-status', { status: 'downloaded' });
    });
}

// BOM除去のうえJSONファイルを安全に読み込む共通処理
// (read-json-file / get-skin-path / get-player-list で重複していた処理を統一)
async function readJsonSafe(filePath) {
    let content = await fs.readFile(filePath, 'utf8');
    content = content.replace(/^\uFEFF/, ''); // UTF-8 BOMを除去
    return JSON.parse(content);
}

// 指定ディレクトリ直下から「数字のみの名前」のフォルダを列挙する
// (get-player-list / get-image-folder-items で重複していた抽出処理を統一)
async function listNumericSubfolders(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name));
}

// ファイルを別ディレクトリへ移動する(別ドライブ間などrenameできない場合はコピー+削除で代替)
async function moveFileSafe(sourcePath, destPath) {
    try {
        await fs.rename(sourcePath, destPath);
    } catch (error) {
        if (error.code === 'EXDEV') {
            await fs.copyFile(sourcePath, destPath);
            await fs.unlink(sourcePath);
        } else {
            throw error;
        }
    }
}

// ディレクトリ内を再帰的に探索してTaikoNautsのフォルダを探す
async function findTaikoNauts(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    // 直下のフォルダから対象名を検索
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name === 'TaikoNauts-latest') {
            return path.join(directory, entry.name);
        }
    }

    // 見つからなければサブフォルダ内を再帰探索
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const fullPath = path.join(directory, entry.name);

        try {
            const result = await findTaikoNauts(fullPath);
            if (result) return result;
        } catch {
            // アクセス制限のあるフォルダ等は無視して続行
        }
    }

    return null;
}

// ウィンドウの作成
function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        icon: path.join(__dirname, 'icon01.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// IPC
// 全ドライブからTaikoNauts-latestを自動検索
ipcMain.handle('find-taiko-nauts', async () => {
    for (const letter of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
        const drive = `${letter}:\\`;

        try {
            await fs.access(drive);
            const result = await findTaikoNauts(drive);
            if (result) return result;
        } catch {
            // 存在しないドライブやアクセス不能な場所は無視
        }
    }

    return null;
});

// ユーザー選択用のフォルダ選択ダイアログを表示
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    return result.filePaths[0];
});

// JSONファイルを読み込む
ipcMain.handle('read-json-file', async (_event, filePath) => {
    try {
        return await readJsonSafe(filePath);
    } catch (error) {
        console.error(`JSONの読み込みに失敗しました: ${filePath}`, error);
        throw new Error(`JSONの読み込みに失敗しました。\n${filePath}`);
    }
});

// データを整形してJSONファイルに書き込む
ipcMain.handle('write-json-file', async (_event, filePath, data) => {
    try {
        const content = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, `${content}\n`, 'utf8');
        return true;
    } catch (error) {
        console.error(`JSONの保存に失敗しました: ${filePath}`, error);
        throw new Error(`JSONの保存に失敗しました。\n${filePath}`);
    }
});

// GameConfigからスキンパスを取得
ipcMain.handle('get-skin-path', async (_event, directory) => {
    try {
        const gameConfigPath = path.join(directory, 'Config', 'GameConfig.json');
        const gameConfig = await readJsonSafe(gameConfigPath);

        if (typeof gameConfig.skinPath !== 'string') {
            throw new Error('GameConfig.jsonにskinPathがありません。');
        }

        return gameConfig.skinPath;
    } catch (error) {
        console.error(`skinPathの取得に失敗しました: ${directory}`, error);
        throw new Error('GameConfig.jsonからskinPathを取得できませんでした。');
    }
});

// フォルダの中の画像を一覧取得
ipcMain.handle('get-image-folder-items', async (_event, directory, relativePath, fileName) => {
    try {
        const targetDirectory = path.join(directory, relativePath);
        const numericFolders = await listNumericSubfolders(targetDirectory);

        const items = [];

        for (const entry of numericFolders) {
            const number = Number(entry.name);
            const imagePath = path.join(targetDirectory, entry.name, fileName);

            try {
                await fs.access(imagePath);
                items.push({ value: number, imagePath });
            } catch {
                // 画像が存在しないフォルダはスキップ
            }
        }

        items.sort((a, b) => a.value - b.value);
        return items;
    } catch (error) {
        console.error(`画像フォルダの読み込みに失敗しました: ${relativePath}`, error);
        throw new Error(`画像フォルダの読み込みに失敗しました。\n${relativePath}`);
    }
});

// 指定パス直下のサブフォルダ一覧を取得
ipcMain.handle('get-folder-items', async (_event, directory, relativePath) => {
    try {
        const targetDirectory = path.join(directory, relativePath);
        const entries = await fs.readdir(targetDirectory, { withFileTypes: true });

        return entries
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name)
            .sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));
    } catch (error) {
        console.error(`フォルダ一覧の取得に失敗しました: ${relativePath}`, error);
        throw new Error(`フォルダ一覧の取得に失敗しました。\n${relativePath}`);
    }
});

// プレイヤーの一覧を取得
ipcMain.handle('get-player-list', async (_event, rootDirectory) => {
    try {
        const playerDataPath = path.join(rootDirectory, 'PlayerData');
        const numericFolders = await listNumericSubfolders(playerDataPath);

        const players = [];

        for (const entry of numericFolders) {
            const userId = entry.name;
            const namePlatePath = path.join(playerDataPath, userId, 'NamePlateConfig.json');
            let name = '名称未設定';

            try {
                const json = await readJsonSafe(namePlatePath);
                if (json.name) {
                    name = json.name;
                }
            } catch {
                // NamePlateConfig.json が無いか読み込めない場合はデフォルト名
            }

            players.push({
                id: userId,
                label: `${userId} - ${name}`
            });
        }

        // フォルダ数値順にソート
        players.sort((a, b) => Number(a.id) - Number(b.id));
        return players;
    } catch (error) {
        console.error('プレイヤー一覧の取得に失敗しました:', error);
        return [];
    }
});

// スキンのFont/フォルダ内のファイル一覧を取得
ipcMain.handle('get-font-files', async (_event, directory, skinPath) => {
    try {
        if (!directory || !skinPath) return [];

        // 例: <directory>/Skins/R-Style/Font/
        const fontFolderPath = path.join(directory, skinPath, 'Font');

        // フォルダが存在するか確認
        try {
            await fs.access(fontFolderPath);
        } catch {
            return []; // 存在しない場合は空配列を返す
        }

        const files = await fs.readdir(fontFolderPath, { withFileTypes: true });

        // フォントファイルを抽出
        const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
        const fontFiles = files
            .filter((file) => file.isFile() && fontExtensions.includes(path.extname(file.name).toLowerCase()))
            .map((file) => file.name);

        return fontFiles;
    } catch (error) {
        console.error('フォント一覧の取得に失敗しました:', error);
        return [];
    }
});

// フォントファイルを選択し、現在のスキンのFontフォルダへ移動する
ipcMain.handle('upload-font-file', async (_event, directory, skinPath) => {
    if (!directory || !skinPath) {
        throw new Error('スキンが設定されていません。');
    }

    const result = await dialog.showOpenDialog(win, {
        title: 'フォントファイルを選択',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'フォントファイル', extensions: ['ttf', 'otf', 'woff', 'woff2'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    const fontFolderPath = path.join(directory, skinPath, 'Font');
    await fs.mkdir(fontFolderPath, { recursive: true });

    const fileNames = [];

    for (const sourcePath of result.filePaths) {
        const fileName = path.basename(sourcePath);
        const destPath = path.join(fontFolderPath, fileName);

        try {
            await moveFileSafe(sourcePath, destPath);
            fileNames.push(fileName);
        } catch (error) {
            console.error(`フォントファイルの移動に失敗しました: ${sourcePath}`, error);
            throw new Error(`フォントファイルの移動に失敗しました。\n${fileName}`);
        }
    }

    return { fileNames };
});

// レンダラーからのダウンロード要求
ipcMain.handle('start-update-download', async () => {
    autoUpdater.downloadUpdate();
});

// レンダラーからの再起動・インストール要求
ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall();
});

// アプリケーションの起動と初期化
app.whenReady().then(() => {
    createWindow();

    // パッケージ化されている場合に自動更新チェックを実行
    if (app.isPackaged) {
        setupAutoUpdater(win);
        autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});