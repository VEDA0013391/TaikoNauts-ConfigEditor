// <option>要素をまとめて生成し、選択状態を判定して追加する共通ヘルパー。
// select.js / folderSelector.js / skinSelector.js の
// 「optionを作る→value/labelを設定→現在値と一致するか判定→selectedを付与」という
// 重複ロジックをここに集約する。
//
// items: 表示するアイテムの配列
// getOptionValue(item, index): アイテムからoption.valueに設定する値を返す
// getOptionLabel(item, index): アイテムからoption.textContentに設定する値を返す(省略時はvalueを使用)
// isSelected(optionValue, item, index): そのoptionを選択状態にするかどうか
function appendSelectOptions(select, items, { getOptionValue, getOptionLabel, isSelected }) {
    items.forEach((item, index) => {
        const option = document.createElement('option');
        const optionValue = getOptionValue(item, index);
        const optionLabel = getOptionLabel ? getOptionLabel(item, index) : optionValue;

        option.value = optionValue;
        option.textContent = optionLabel;

        if (isSelected(optionValue, item, index)) {
            option.selected = true;
        }

        select.append(option);
    });
}

export {
    appendSelectOptions
};