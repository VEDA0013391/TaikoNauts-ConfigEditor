import { getSelectedDirectory, getSkinPath } from './context.js';

export async function createFontSelectField(field, currentValue, configName) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'setting-field';

    const infoContainer = document.createElement('div');
    infoContainer.className = 'setting-info';

    if (field.label) {
        const label = document.createElement('label');
        label.className = 'setting-label';
        label.textContent = field.label;
        infoContainer.appendChild(label);
    }

    if (field.description) {
        const description = document.createElement('p');
        description.className = 'setting-description';
        description.textContent = field.description;
        infoContainer.appendChild(description);
    }

    const controlContainer = document.createElement('div');
    controlContainer.className = 'setting-control';

    const select = document.createElement('select');
    select.className = 'setting-select';
    select.dataset.config = configName;
    select.dataset.key = field.key;

    // デフォルト選択肢
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '指定なし';
    select.appendChild(defaultOption);

    // フォントファイル一覧の読み込み処理
    const directory = getSelectedDirectory();
    const skinPath = getSkinPath();

    try {
        const fontFiles = await window.electronAPI.getFontFiles(directory, skinPath);
        if (Array.isArray(fontFiles)) {
            fontFiles.forEach((filename) => {
                const option = document.createElement('option');
                option.value = filename;
                option.textContent = filename;
                if (filename === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('フォントファイルの取得に失敗しました:', error);
    }

    controlContainer.appendChild(select);

    fieldContainer.appendChild(infoContainer);
    fieldContainer.appendChild(controlContainer);

    return fieldContainer;
}