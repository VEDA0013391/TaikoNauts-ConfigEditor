import { createField } from '../fields/index.js';

// 選択されたカテゴリの設定項目をHTML要素としてレンダリングする
async function renderSettings(container, category, configs) {
    container.innerHTML = '';

    for (const file of category.files) {
        const data = configs[file.id];
        if (!data) continue;

        const section = document.createElement('section');
        section.className = 'settings-section';

        // セクションタイトルの生成
        if (file.title) {
            const title = document.createElement('h3');
            title.className = 'settings-section-title';
            title.textContent = file.title;
            section.append(title);
        }

        // 各フィールドの生成と追加
        for (const fieldDefinition of file.fields) {
            const value = data[fieldDefinition.key];
            const field = await createField(
                fieldDefinition,
                value,
                file.id
            );

            section.append(field);
        }

        container.append(section);
    }
}

// 設定値を収集してconfigに反映
function collectSettings(container, category, configs) {
    const elements = container.querySelectorAll('[data-config][data-key]');
    const arrayValues = new Map();

    for (const element of elements) {
        const configName = element.dataset.config;
        const key = element.dataset.key;

        if (!configs[configName]) continue;

        // 対象設定ファイル定義の取得
        const fileDefinition = category.files.find(
            (file) => file.id === configName
        );
        if (!fileDefinition) continue;

        // 対象フィールド定義の取得
        const fieldDefinition = fileDefinition.fields.find(
            (field) => field.key === key
        );
        if (!fieldDefinition) continue;

        // 配列型フィールドの値収集処理
        if (fieldDefinition.type === 'array') {
            if (!arrayValues.has(configName)) {
                arrayValues.set(configName, new Map());
            }

            const configArrays = arrayValues.get(configName);
            if (!configArrays.has(key)) {
                configArrays.set(key, []);
            }

            configArrays.get(key).push(element.value);
            continue;
        }

        // フィールド型に応じた値の変換
        let value;

        switch (fieldDefinition.type) {
            case 'boolean':
                value = element.checked;
                break;

            case 'number':
            case 'imageSelector':
            case 'imageFolderSelector':
            case 'folderSelector':
                value = Number(element.value);
                break;

            default:
                value = element.value;
                break;
        }

        configs[configName][key] = value;
    }

    // 蓄積された配列データをconfigsに格納
    for (const [configName, configArrays] of arrayValues) {
        for (const [key, values] of configArrays) {
            configs[configName][key] = values;
        }
    }
}

export {
    renderSettings,
    collectSettings
};