import { createFieldBase } from './base.js';

// テキスト入力フィールドを生成
function createTextField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    // テキスト入力要素の作成
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.value = value ?? '';

    // 設定保存用の識別データを保持
    input.dataset.config = configName;
    input.dataset.key = fieldDefinition.key;

    control.append(input);

    return field;
}

export {
    createTextField
};