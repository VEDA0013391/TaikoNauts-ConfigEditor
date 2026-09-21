import { createFieldBase } from './base.js';
import { getSkinRelativePath, getSelectedDirectory, getSkinPath } from './context.js';

// Skinのサブフォルダ一覧を取得しドロップダウンメニューで表示
async function createFolderSelectorField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    // スキンパス未設定時のエラーハンドリング
    if (!getSkinPath()) {
        const errorMessage = document.createElement('span');
        errorMessage.className = 'setting-description';
        errorMessage.textContent = 'スキンが設定されていません。';

        control.append(errorMessage);
        return field;
    }

    // 検索対象のフォルダパス一覧を取得
    const folders = fieldDefinition.folders ?? (
        fieldDefinition.folder?.path ? [fieldDefinition.folder.path] : []
    );

    let items = [];
    let selectedFolder = null;

    // 定義されたフォルダ一覧を順に検索し、itemが存在するフォルダを採用
    for (const folder of folders) {
        try {
            items = await window.electronAPI.getFolderItems(
                getSelectedDirectory(),
                getSkinRelativePath(folder)
            );

            if (items.length > 0) {
                selectedFolder = folder;
                break;
            }
        } catch (error) {
            console.error(`フォルダの読み込みに失敗しました: ${folder}`, error);
        }
    }

    // 有効なフォルダ, アイテムが見つからなかった場合の表示
    if (!selectedFolder) {
        const emptyMessage = document.createElement('span');
        emptyMessage.className = 'setting-description';
        emptyMessage.textContent = '使用可能なキャラクターがありません。';

        control.append(emptyMessage);
        return field;
    }

    // セレクトボックス要素の作成
    const select = document.createElement('select');
    select.className = 'select-input';
    select.dataset.config = configName;
    select.dataset.key = fieldDefinition.key;

    // 取得したフォルダ一覧を<option>要素として追加
    items.forEach((item, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = item;

        if (index === Number(value)) {
            option.selected = true;
        }

        select.append(option);
    });

    control.append(select);
    return field;
}

export {
    createFolderSelectorField
};