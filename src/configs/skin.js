export default {
    id: 'skin',
    title: 'スキン設定',
    description: '使用中のスキンのフォント設定を変更します。',
    files: [
        {
            id: 'skinConfig',
            key: 'skinConfig',
            pathTemplate: '{skinName}/SkinConfig.json',
            default: {
                mainFontPath: '',
                detailFontPath: '',
                nameplateEnglishFontPath: ''
            },
            fields: [
                {
                    key: 'mainFontPath',
                    label: 'メインフォント',
                    type: 'fontSelect',
                    description: '曲名などに使用するメインフォントファイルです。'
                },
                {
                    key: 'detailFontPath',
                    label: '詳細フォント',
                    type: 'fontSelect',
                    description: 'ジャンル説明等に使用するサブフォントファイルです。'
                },
                {
                    key: 'nameplateEnglishFontPath',
                    label: 'ネームプレート英字フォント',
                    type: 'fontSelect',
                    description: 'ネームプレートの英数字部分に使用するフォントです。'
                },
                {
                    key: 'fontUploader',
                    label: 'フォントをアップロード',
                    type: 'fontUpload',
                    description: '選択したフォントファイルをFontフォルダへ移動します。反映のためリロードします'
                }
            ]
        }
    ]
};