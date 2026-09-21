import { createFieldBase } from './base.js';

// トグルスイッチのフィールド生成
function createBooleanField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    // トグルスイッチのラッパー要素
    const toggle = document.createElement('label');
    toggle.className = 'toggle';

    // チェックボックスの作成と設定データの保持
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(value);
    input.dataset.config = configName;
    input.dataset.key = fieldDefinition.key;

    // スイッチのスライダー要素
    const slider = document.createElement('span');
    slider.className = 'toggle-slider';

    toggle.append(input, slider);
    control.append(toggle);

    return field;
}

export {
    createBooleanField
};