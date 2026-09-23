import { createFieldBase } from './base.js';
import { appendSelectOptions } from './selectHelper.js';

// ドロップダウンメニューの生成
function createSelectField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    // セレクトボックス要素の作成
    const select = document.createElement('select');
    select.className = 'select-input';
    select.dataset.config = configName;
    select.dataset.key = fieldDefinition.key;

    // オプション項目の追加(value/labelどちらの形式のoptionsにも対応)
    appendSelectOptions(select, fieldDefinition.options ?? [], {
        getOptionValue: (option) => (
            typeof option === 'object' && option !== null ? option.value : option
        ),
        getOptionLabel: (option) => (
            typeof option === 'object' && option !== null ? option.label : option
        ),
        isSelected: (optionValue) => String(optionValue) === String(value)
    });

    control.append(select);

    return field;
}

export {
    createSelectField
};