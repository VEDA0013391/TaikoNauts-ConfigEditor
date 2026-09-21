import { createFieldBase } from './base.js';

// 最後の方2個分だけ表示
function formatDisplayPath(fullPath, maxDepth = 2) {
    if (!fullPath) return 'フォルダ未選択';
    
    const parts = fullPath.split(/[/\\]/).filter(Boolean);
    if (parts.length === 0) return fullPath;

    // 指定階層数分だけ末尾を取得
    const displayParts = parts.slice(-maxDepth);
    return displayParts.join('/');
}

// 配列フィールド生成
function createArrayField(fieldDefinition, values, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    const wrapper = document.createElement('div');
    wrapper.className = 'array-input-wrapper';

    // 3つ分でスクロールするコンテナ
    const scrollArea = document.createElement('div');
    scrollArea.className = 'array-input-scroll-area';

    const items = Array.isArray(values) ? [...values] : [];

    // フォルダボタン + 削除ボタンを生成する内部関数
    const createRow = (fullPath) => {
        const row = document.createElement('div');
        row.className = 'array-input-row';

        // フォルダ名ボタン
        const itemBtn = document.createElement('button');
        itemBtn.type = 'button';
        itemBtn.className = 'array-item-button';

        // 末尾2階層分を表示
        itemBtn.textContent = formatDisplayPath(fullPath, 2);
        
        itemBtn.title = fullPath;

        // collectSettings等で値を拾えるように内部値はフルパスを設定
        itemBtn.dataset.config = configName;
        itemBtn.dataset.key = fieldDefinition.key;
        itemBtn.value = fullPath;

        // 削除ボタン
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'array-remove-button hidden';
        removeBtn.textContent = '削除';

        // フォルダボタンクリック時に選択状態切り替え, 削除ボタン表示 / 非表示
        itemBtn.addEventListener('click', () => {
            const isSelected = itemBtn.classList.contains('selected');

            scrollArea.querySelectorAll('.array-item-button').forEach(btn => btn.classList.remove('selected'));
            scrollArea.querySelectorAll('.array-remove-button').forEach(btn => btn.classList.add('hidden'));

            if (!isSelected) {
                itemBtn.classList.add('selected');
                removeBtn.classList.remove('hidden');
            }
        });

        // 削除ボタンクリック時
        removeBtn.addEventListener('click', () => {
            row.remove();
        });

        row.append(itemBtn, removeBtn);
        return row;
    };

    // 初期アイテムの描画
    items.forEach((val) => {
        scrollArea.append(createRow(val));
    });

    // 下部に配置する全幅の追加ボタン
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'button array-add-button';
    addBtn.textContent = '+ 追加';

    // 追加ボタンのイベントハンドラ
    addBtn.addEventListener('click', async () => {
        try {
            // フォルダ選択ダイアログを開く
            const folderPath = await window.electronAPI.selectDirectory();

            // フォルダが選択された場合のみ追加
            if (folderPath) {
                const newRow = createRow(folderPath);
                scrollArea.append(newRow);

                // 追加した位置へスクロール
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        } catch (error) {
            console.error('フォルダ選択中にエラーが発生しました:', error);
        }
    });

    wrapper.append(scrollArea, addBtn);
    control.append(wrapper);

    return field;
}

export { createArrayField };