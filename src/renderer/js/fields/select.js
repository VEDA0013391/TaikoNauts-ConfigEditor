import { createFieldBase } from './base.js';

// ドロップダウンメニューの生成
function createSelectField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    // セレクトボックス要素の作成
    const select = document.createElement('select');
    select.className = 'select-input';
    select.dataset.config = configName;
    select.dataset.key = fieldDefinition.key;

    // オプション項目の追加
    for (const optionDefinition of fieldDefinition.options ?? []) {
        const option = document.createElement('option');

        if (typeof optionDefinition === 'object' && optionDefinition !== null) {
            option.value = optionDefinition.value;
            option.textContent = optionDefinition.label;
        } else {
            option.value = optionDefinition;
            option.textContent = optionDefinition;
        }

        // 初期値と一致する場合は選択状態にする
        if (String(option.value) === String(value)) {
            option.selected = true;
        }

        select.append(option);
    }

    control.append(select);

    return field;
}

export {
    createSelectField
};