// Electron API経由でJSONファイルを読み込み
async function readJsonFile(filePath) {
    if (!window.electronAPI?.readJsonFile) {
        throw new Error('JSON読み込みAPIが利用できません。');
    }

    return await window.electronAPI.readJsonFile(filePath);
}

// Electron API経由でJSONファイルを書き込む
async function writeJsonFile(filePath, data) {
    if (!window.electronAPI?.writeJsonFile) {
        throw new Error('JSON保存APIが利用できません。');
    }

    return await window.electronAPI.writeJsonFile(filePath, data);
}

// パス区切り文字をスラッシュに統一する
function getConfigPath(directory, configPath) {
    return `${directory}/${configPath}`.replaceAll('\\', '/');
}

// カテゴリに含まれるすべての設定ファイルを並列で読み込む
async function loadConfigs(directory, category) {
    const entries = await Promise.all(
        category.files.map(async (file) => {
            const filePath = getConfigPath(directory, file.path);
            const data = await readJsonFile(filePath);
            return [file.id, data];
        })
    );

    return Object.fromEntries(entries);
}

// カテゴリに含まれるすべての設定ファイルを並列で保存する
async function saveConfigs(directory, category, configs) {
    await Promise.all(
        category.files.map(async (file) => {
            const data = configs[file.id];
            if (data === undefined) return;

            const filePath = getConfigPath(directory, file.path);
            await writeJsonFile(filePath, data);
        })
    );
}

export {
    loadConfigs,
    saveConfigs,
    getConfigPath
};