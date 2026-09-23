import { createFieldBase } from './base.js';
import { getSelectedDirectory, getSkinPath } from './context.js';

// フォントファイルを選択し、現在のスキンのFontフォルダへ移動するボタンを生成する
function createFontUploadField(fieldDefinition, value, configName) {
    const { field, control } = createFieldBase(fieldDefinition);

    const wrapper = document.createElement('div');
    wrapper.className = 'font-upload-control';

    const uploadBtn = document.createElement('button');
    uploadBtn.type = 'button';
    uploadBtn.className = 'button';
    uploadBtn.textContent = 'フォントを選択してアップロード';

    const status = document.createElement('span');
    status.className = 'setting-description font-upload-status';

    uploadBtn.addEventListener('click', async () => {
        const directory = getSelectedDirectory();
        const skinPath = getSkinPath();

        if (!directory || !skinPath) {
            status.classList.add('error');
            status.textContent = 'スキンが設定されていません。';
            return;
        }

        uploadBtn.disabled = true;
        status.classList.remove('error', 'success');
        status.textContent = 'アップロード中...';

        try {
            const result = await window.electronAPI.uploadFontFile(directory, skinPath);

            // ダイアログをキャンセルした場合
            if (!result) {
                status.textContent = '';
                uploadBtn.disabled = false;
                return;
            }

            status.classList.add('success');
            status.textContent = `追加しました: ${result.fileNames.join(', ')}(フォント一覧に反映するため再読み込みします)`;

            // フォント選択欄に反映させるため少し待ってからリロード
            window.setTimeout(() => {
                window.location.reload();
            }, 800);
        } catch (error) {
            console.error('フォントのアップロードに失敗しました', error);
            status.classList.add('error');
            status.textContent = 'アップロードに失敗しました。';
            uploadBtn.disabled = false;
        }
    });

    wrapper.append(uploadBtn, status);
    control.append(wrapper);

    return field;
}

export {
    createFontUploadField
};