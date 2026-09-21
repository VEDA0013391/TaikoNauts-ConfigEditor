const gameConfig = {
    id: 'game',
    title: 'ゲーム設定',
    description: 'ゲーム全体に関する設定を編集します。',

    files: [
        {
            id: 'gameConfig',
            path: 'Config/GameConfig.json',
            fields: [
                {
                    key: 'skinPath',
                    label: 'スキンのパス',
                    type: 'skinSelector',
                    description: '使用するスキンのフォルダを指定します(反映のためリロードします)'
                },
                {
                    key: 'songPath',
                    label: '曲フォルダ',
                    type: 'array',
                    description: '曲を検索するフォルダを指定します。'
                },
                {
                    key: 'isReplacedKeyIn2P',
                    label: '2P時に専用キーを使用する',
                    type: 'boolean',
                    description: '2Pプレイ時に2P専用のキー設定を使用します。'
                },
                {
                    key: 'autoRollSpeedPerSecond',
                    label: 'オート連打速度',
                    type: 'number',
                    min: 0,
                    description: 'オート連打時の1秒あたりの連打数を指定します。'
                },
                {
                    key: 'boxCloseInterval',
                    label: 'ボックスを閉じる時間',
                    type: 'number',
                    min: 0,
                    description: '曲選択画面でボックスを閉じるまでの時間を指定します。'
                },
                {
                    key: 'maxSongCount',
                    label: '最大曲数',
                    type: 'number',
                    min: 1,
                    description: '曲選択画面に表示する最大曲数を指定します(プレイには影響しません)'
                }
            ]
        }
    ]
};

export default gameConfig;