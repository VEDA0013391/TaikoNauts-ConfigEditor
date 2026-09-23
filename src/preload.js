const { contextBridge, ipcRenderer } = require('electron');

// API
contextBridge.exposeInMainWorld('electronAPI', {
    // フォルダ選択ダイアログを開く
    selectDirectory: () => ipcRenderer.invoke('select-directory'),

    // 指定されたパスのJSONファイルを読み込む
    readJsonFile: (filePath) => ipcRenderer.invoke('read-json-file', filePath),

    // 指定されたパスにJSONファイルとしてデータを書き込む
    writeJsonFile: (filePath, data) => ipcRenderer.invoke('write-json-file', filePath, data),

    // TaikoNautsのスキンパスを取得する
    getSkinPath: (directory) => ipcRenderer.invoke('get-skin-path', directory),

    // システム上からTaikoNautsフォルダを自動検索する
    findTaikoNauts: () => ipcRenderer.invoke('find-taiko-nauts'),

    // 指定フォルダ内の画像アイテム一覧を取得する
    getImageFolderItems: (directory, relativePath, fileName) =>
        ipcRenderer.invoke('get-image-folder-items', directory, relativePath, fileName),

    // 指定フォルダ内のサブフォルダ、ファイル一覧を取得する
    getFolderItems: (directory, relativePath) =>
        ipcRenderer.invoke('get-folder-items', directory, relativePath),

    // ユーザーリストの取得
    getPlayerList: (directory) => ipcRenderer.invoke('get-player-list', directory),

    // アップデート機能用の追加
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, value) => callback(value)),
    startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),

    // スキンフォント一覧取得用のIPCを追加
    getFontFiles: (directory, skinPath) => ipcRenderer.invoke('get-font-files', directory, skinPath),

    // フォントファイルを選択してSkinのFontフォルダへ移動する
    uploadFontFile: (directory, skinPath) => ipcRenderer.invoke('upload-font-file', directory, skinPath)
});