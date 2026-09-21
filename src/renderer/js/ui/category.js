// 指定されたコンテナ内にカテゴリボタン一覧を生成
function renderCategories(container, categories, currentCategoryId, onSelect) {
    container.innerHTML = '';

    for (const category of categories) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-item';
        button.dataset.category = category.id;
        button.textContent = category.title;

        // 現在選択中のカテゴリであればactiveクラスを付与
        button.classList.toggle('active', category.id === currentCategoryId);

        // クリック時に選択コールバックを実行
        button.addEventListener('click', () => {
            onSelect(category.id);
        });

        container.append(button);
    }
}

// 指定されたカテゴリをsctive化
function setActiveCategory(container, categoryId) {
    container.querySelectorAll('.category-item').forEach((button) => {
        button.classList.toggle(
            'active',
            button.dataset.category === categoryId
        );
    });
}

export {
    renderCategories,
    setActiveCategory
};