// アプリケーション内で共有するコンテキスト状態
let selectedDirectory = null;
let skinPath = null;

// 選択中のディレクトリパスを設定する
function setSelectedDirectory(directory) {
    selectedDirectory = directory;
}

// 現在のスキンパスを設定
function setSkinPath(path) {
    skinPath = path;
}

// 選択中のディレクトリパスを取得する
function getSelectedDirectory() {
    return selectedDirectory;
}

// 現在のスキンパスを取得する
function getSkinPath() {
    return skinPath;
}

// 相対パスと結合して正規化されたスキン相対パスを返す
function getSkinRelativePath(relativePath) {
    if (!skinPath) {
        return relativePath;
    }

    return `${skinPath}/${relativePath}`
        .replaceAll('\\', '/')
        .replaceAll(/\/+/g, '/');
}

// 画像表示用のfile:///URL を生成
function getSkinImagePath(relativePath) {
    if (!selectedDirectory) {
        return '';
    }

    const imagePath = getSkinRelativePath(relativePath);

    return `file:///${selectedDirectory
        .replaceAll('\\', '/')
        .replaceAll(' ', '%20')}/${imagePath}`;
}

// ローカルファイルパスをfile:/// プロトコルのURL形式に変換
function getFileUrl(filePath) {
    return `file:///${filePath
        .replaceAll('\\', '/')
        .replaceAll(' ', '%20')}`;
}

export {
    setSelectedDirectory,
    setSkinPath,
    getSelectedDirectory,
    getSkinPath,
    getSkinRelativePath,
    getSkinImagePath,
    getFileUrl
};