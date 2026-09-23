import { createFieldBase } from './base.js';
import { getSelectedDirectory, getSkinPath } from './context.js';

// スキンのFont/フォルダ内のファイル一覧からフォントを選択するフィールドを生成
async function createFontSelectField(fieldDefinition, currentValue, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    const select = document.createElement('select');
    select.className = 'select-input';
    select.dataset.config = configName;
    select.dataset.key = fieldDefinition.key;

    // デフォルト選択肢
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '指定なし';
    select.append(defaultOption);

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
                select.append(option);
            });
        }
    } catch (error) {
        console.error('フォントファイルの取得に失敗しました:', error);
    }

    control.append(select);

    return field;
}

export {
    createFontSelectField
};