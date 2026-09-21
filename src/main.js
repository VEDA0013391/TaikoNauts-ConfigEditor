const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

let win;

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
        icon: path.join(__dirname, '..', 'icon01.ico'),
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
        let content = await fs.readFile(filePath, 'utf8');
        content = content.replace(/^\uFEFF/, ''); // UTF-8 BOMを除去
        return JSON.parse(content);
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
        let content = await fs.readFile(gameConfigPath, 'utf8');
        content = content.replace(/^\uFEFF/, '');

        const gameConfig = JSON.parse(content);

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
        const entries = await fs.readdir(targetDirectory, { withFileTypes: true });

        const items = [];

        for (const entry of entries) {
            if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue;

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

// 指定パス直下のサブフォルダ一覧をで取得
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
        const entries = await fs.readdir(playerDataPath, { withFileTypes: true });

        const players = [];

        for (const entry of entries) {
            // 数字のみのフォルダが対象
            if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue;

            const userId = entry.name;
            const namePlatePath = path.join(playerDataPath, userId, 'NamePlateConfig.json');
            let name = '名称未設定';

            try {
                let content = await fs.readFile(namePlatePath, 'utf8');
                content = content.replace(/^\uFEFF/, '');
                const json = JSON.parse(content);
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

app.whenReady().then(() => {
    createWindow();

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