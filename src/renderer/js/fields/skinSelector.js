import { createFieldBase } from './base.js';
import { getSelectedDirectory } from './context.js';
import { appendSelectOptions } from './selectHelper.js';

// Skins/ ディレクトリ内のフォルダ一覧を取得し、スキン選択セレクトボックスを生成する
async function createSkinSelectorField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    let items = [];

    // Skins/ 内のフォルダ一覧を取得
    try {
        items = await window.electronAPI.getFolderItems(
            getSelectedDirectory(),
            'Skins'
        );
    } catch (error) {
        console.error(error);

        const errorMessage = document.createElement('span');
        errorMessage.className = 'setting-description';
        errorMessage.textContent = 'スキンの読み込みに失敗しました。';

        control.append(errorMessage);
        return field;
    }

    // スキンが1つもない場合のフォールバック表示
    if (items.length === 0) {
        const emptyMessage = document.createElement('span');
        emptyMessage.className = 'setting-description';
        emptyMessage.textContent = '使用可能なスキンがありません。';

        control.append(emptyMessage);
        return field;
    }

    // セレクトボックス要素の生成
    const select = document.createElement('select');
    select.className = 'select-input';
    select.dataset.config = configName;
    select.dataset.key = fieldDefinition.key;

    // 現在設定されているスキン名の抽出
    const currentSkin = String(value ?? '')
        .replace('Skins/', '')
        .replace(/\/+$/, '');

    // オプション要素の生成、追加
    appendSelectOptions(select, items, {
        getOptionValue: (item) => `Skins/${item}/`,
        getOptionLabel: (item) => item,
        isSelected: (optionValue, item) => item === currentSkin
    });

    // スキン変更時にカスタムイベントを通知
    select.addEventListener('change', () => {
        window.dispatchEvent(
            new CustomEvent('skin-path-changed', {
                detail: {
                    value: select.value
                }
            })
        );
    });

    control.append(select);

    return field;
}

export {
    createSkinSelectorField
};