import { createFieldBase } from './base.js';
import { getSkinRelativePath, getFileUrl, getSelectedDirectory, getSkinPath } from './context.js';

// プレビュー付き画像選択フィールドの生成
async function createImageFolderSelectorField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);
    const imageConfig = fieldDefinition.image;

    // スキンパス未設定時の表示制御
    if (!getSkinPath()) {
        const errorMessage = document.createElement('span');
        errorMessage.className = 'setting-description';
        errorMessage.textContent = 'スキンが設定されていません。';

        control.append(errorMessage);
        return field;
    }

    const imageFolderPath = getSkinRelativePath(imageConfig.path);
    let items = [];

    // 画像フォルダ内のアイテム一覧を取得
    try {
        items = await window.electronAPI.getImageFolderItems(
            getSelectedDirectory(),
            imageFolderPath,
            imageConfig.file
        );
    } catch (error) {
        console.error(error);

        const errorMessage = document.createElement('span');
        errorMessage.className = 'setting-description';
        errorMessage.textContent = '画像の読み込みに失敗しました。';

        control.append(errorMessage);
        return field;
    }

    // 使える画像が存在しない場合
    if (items.length === 0) {
        const emptyMessage = document.createElement('span');
        emptyMessage.className = 'setting-description';
        emptyMessage.textContent = '使用可能なネームプレートがありません。';

        control.append(emptyMessage);
        return field;
    }

    // 初期選択インデックスの特定
    let currentItemIndex = items.findIndex((item) => item.value === Number(value));
    if (currentItemIndex < 0) {
        currentItemIndex = 0;
    }

    const selector = document.createElement('div');
    selector.className = 'image-folder-selector';

    // 前へ
    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.className = 'image-selector-button';
    previousButton.textContent = '<';
    previousButton.setAttribute('aria-label', '前のネームプレート');

    // プレビュー表示エリアと画像要素
    const preview = document.createElement('div');
    preview.className = 'image-folder-selector-preview';

    const image = document.createElement('img');
    image.className = 'image-folder-selector-image';

    // 次へ
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'image-selector-button';
    nextButton.textContent = '>';
    nextButton.setAttribute('aria-label', '次のネームプレート');

    // ラベルと保存用非表示インプット
    const label = document.createElement('span');
    label.className = 'image-selector-label';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.dataset.config = configName;
    hiddenInput.dataset.key = fieldDefinition.key;

    // 現在の選択インデックスに基づいてプレビュー画像, ラベル, ボタン活性化状態を更新
    function updatePreview() {
        const item = items[currentItemIndex];
        if (!item) return;

        image.src = getFileUrl(item.imagePath);
        image.alt = `${fieldDefinition.label} ${item.value}`;
        label.textContent = `No. ${item.value}`;
        hiddenInput.value = item.value;

        previousButton.disabled = currentItemIndex <= 0;
        nextButton.disabled = currentItemIndex >= items.length - 1;
    }

    // ボタンクリック時のイベントハンドラー
    previousButton.addEventListener('click', () => {
        if (currentItemIndex <= 0) return;
        currentItemIndex--;
        updatePreview();
    });

    nextButton.addEventListener('click', () => {
        if (currentItemIndex >= items.length - 1) return;
        currentItemIndex++;
        updatePreview();
    });

    preview.append(image);
    selector.append(previousButton, preview, nextButton);
    control.append(selector, label, hiddenInput);

    // 初期状態の表示適用
    updatePreview();

    return field;
}

export {
    createImageFolderSelectorField
};