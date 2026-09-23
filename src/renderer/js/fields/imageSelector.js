import { createPreviewSelector } from './previewSelector.js';
import { getSkinImagePath } from './context.js';

// スコアパネル画像選択フィールドを生成する
function createImageSelectorField(fieldDefinition, value, configName) {
    const imageConfig = fieldDefinition.image;
    const options = fieldDefinition.options ?? [];
    const count = imageConfig.count;

    // 現在の選択インデックスの検証, 初期化
    let currentIndex = Number(value);
    if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= count) {
        currentIndex = 0;
    }

    const { field, previousButton, image, nextButton, label, hiddenInput } = createPreviewSelector(
        fieldDefinition,
        {
            previewClass: 'score-panel',
            ariaPrev: '前のスコアパネル',
            ariaNext: '次のスコアパネル'
        }
    );

    image.className = 'image-selector-image';
    image.width = imageConfig.width;
    image.height = imageConfig.height * count;

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

    // 初期状態の表示適用
    updatePreview();

    return field;
}

export {
    createImageSelectorField
};