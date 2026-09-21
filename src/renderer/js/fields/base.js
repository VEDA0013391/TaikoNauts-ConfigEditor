// 設定の基本構造の生成
function createFieldBase(fieldDefinition) {
    const field = document.createElement('div');
    field.className = 'setting-field';

    const info = document.createElement('div');
    info.className = 'setting-info';

    const label = document.createElement('label');
    label.className = 'setting-label';
    label.textContent = fieldDefinition.label;

    info.append(label);

    const control = document.createElement('div');
    control.className = 'setting-control';

    field.append(info, control);

    // 説明文が定義されている場合はラベルの下に追加
    if (fieldDefinition.description) {
        const description = document.createElement('div');
        description.className = 'setting-description';
        description.textContent = fieldDefinition.description;

        info.append(description);
    }

    return {
        field,
        info,
        label,
        control
    };
}

export {
    createFieldBase
};