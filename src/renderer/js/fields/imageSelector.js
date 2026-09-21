import { createFieldBase } from './base.js';
import { getSkinImagePath } from './context.js';

// スコアパネル画像選択フィールドを生成する
function createImageSelectorField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);
    const imageConfig = fieldDefinition.image;
    const options = fieldDefinition.options ?? [];
    const count = imageConfig.count;

    // 現在の選択インデックスの検証, 初期化
    let currentIndex = Number(value);
    if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= count) {
        currentIndex = 0;
    }

    const selector = document.createElement('div');
    selector.className = 'image-selector';

    // 前へ
    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.className = 'image-selector-button';
    previousButton.textContent = '<';
    previousButton.setAttribute('aria-label', '前のスコアパネル');

    // プレビュー表示エリアと画像要素
    const preview = document.createElement('div');
    preview.className = 'image-selector-preview';

    const image = document.createElement('img');
    image.className = 'image-selector-image';
    image.width = imageConfig.width;
    image.height = imageConfig.height * count;

    // 次へボタン
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'image-selector-button';
    nextButton.textContent = '>';
    nextButton.setAttribute('aria-label', '次のスコアパネル');

    // ラベルと保存用非表示インプット
    const label = document.createElement('span');
    label.className = 'image-selector-label';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.dataset.config = configName;
    hiddenInput.dataset.key = fieldDefinition.key;

    // translateYで画像を上下に移動させ、該当インデックスの位置を表示する
    function updatePreview() {
        image.src = getSkinImagePath(imageConfig.path);
        image.alt = `${fieldDefinition.label} ${options[currentIndex] ?? currentIndex}`;
        image.style.transform = `translateY(-${currentIndex * imageConfig.height}px)`;

        label.textContent = options[currentIndex] ?? `No. ${currentIndex}`;
        hiddenInput.value = currentIndex;

        previousButton.disabled = currentIndex <= 0;
        nextButton.disabled = currentIndex >= count - 1;
    }

    // ボタンクリック時のイベントハンドラー
    previousButton.addEventListener('click', () => {
        if (currentIndex <= 0) return;
        currentIndex--;
        updatePreview();
    });

    nextButton.addEventListener('click', () => {
        if (currentIndex >= count - 1) return;
        currentIndex++;
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
    createImageSelectorField
};