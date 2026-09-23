import { createFieldBase } from './base.js';

// Image関連共通の「◀ボタン + プレビュー + ▶ボタン + ラベル + hidden input」構造を生成
function createPreviewSelector(fieldDefinition, { previewClass, ariaPrev, ariaNext } = {}) {
    const { field, control } = createFieldBase(fieldDefinition);

    const selector = document.createElement('div');
    selector.className = 'preview-selector';

    // 前へ
    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.className = 'image-selector-button';
    previousButton.textContent = '<';
    previousButton.setAttribute('aria-label', ariaPrev ?? '前へ');

    // プレビュー表示エリアと画像要素
    const preview = document.createElement('div');
    preview.className = `preview-box ${previewClass ?? ''}`.trim();

    const image = document.createElement('img');
    preview.append(image);

    // 次へ
    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.className = 'image-selector-button';
    nextButton.textContent = '>';
    nextButton.setAttribute('aria-label', ariaNext ?? '次へ');

    // ラベルと保存用非表示インプット
    const label = document.createElement('span');
    label.className = 'image-selector-label';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';

    selector.append(previousButton, preview, nextButton);
    control.append(selector, label, hiddenInput);

    return { field, previousButton, image, nextButton, label, hiddenInput };
}

export { createPreviewSelector };