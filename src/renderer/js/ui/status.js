// ページのタイトルと説明テキストを更新する
function setPageInfo(titleElement, descriptionElement, category) {
    titleElement.textContent = category.title;
    descriptionElement.textContent = category.description ?? '';
}

// 保存ステータスメッセージを更新する
function setSaveStatus(element, message) {
    element.textContent = message;
}

// 保存ボタンの有効 / 無効の切り替え
function setSaveButtonState(button, disabled) {
    button.disabled = disabled;
}

// パス表示の更新
function setDirectoryPath(element, directory) {
    element.textContent = directory ?? 'フォルダが選択されていません';
}

export {
    setPageInfo,
    setSaveStatus,
    setSaveButtonState,
    setDirectoryPath
};