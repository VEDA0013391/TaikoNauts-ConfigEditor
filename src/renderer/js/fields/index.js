import { createBooleanField } from './boolean.js';
import { createNumberField } from './number.js';
import { createSelectField } from './select.js';
import { createTextField } from './text.js';
import { createArrayField } from './array.js';
import { createImageSelectorField } from './imageSelector.js';
import { createImageFolderSelectorField } from './imageFolderSelector.js';
import { createFolderSelectorField } from './folderSelector.js';
import { createSkinSelectorField } from './skinSelector.js';
import { createFontSelectField } from './fontSelect.js'; // ★ 追加

// typeに基づきフィールド要素を生成
async function createField(fieldDefinition, value, configName) {
    switch (fieldDefinition.type) {
        case 'boolean':
            return createBooleanField(fieldDefinition, value, configName);

        case 'number':
            return createNumberField(fieldDefinition, value, configName);

        case 'select':
            return createSelectField(fieldDefinition, value, configName);

        case 'text':
            return createTextField(fieldDefinition, value, configName);

        case 'array':
            return createArrayField(fieldDefinition, value, configName);

        case 'imageSelector':
            return createImageSelectorField(fieldDefinition, value, configName);

        case 'imageFolderSelector':
            return await createImageFolderSelectorField(fieldDefinition, value, configName);

        case 'folderSelector':
            return await createFolderSelectorField(fieldDefinition, value, configName);

        case 'skinSelector':
            return await createSkinSelectorField(fieldDefinition, value, configName);

        case 'fontSelect':
            return await createFontSelectField(fieldDefinition, value, configName);

        default:
            // 未定義の型の場合はデフォルトでテキストフィールドを生成
            return createTextField(fieldDefinition, value, configName);
    }
}

export {
    createField
};