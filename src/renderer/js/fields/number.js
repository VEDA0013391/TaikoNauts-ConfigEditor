import { createFieldBase } from './base.js';

// 数値入力フィールドを生成する
function createNumberField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    // 数値入力要素の作成
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'number-input';
    input.value = value ?? '';

    // 最小値の設定
    if (fieldDefinition.min !== undefined) {
        input.min = fieldDefinition.min;
    }

    // 最大値の設定
    if (fieldDefinition.max !== undefined) {
        input.max = fieldDefinition.max;
    }

    // 刻み幅の設定
    if (fieldDefinition.step !== undefined) {
        input.step = fieldDefinition.step;
    }

    // 設定保存用の識別データを保持
    input.dataset.config = configName;
    input.dataset.key = fieldDefinition.key;

    control.append(input);

    return field;
}

export {
    createNumberField
};