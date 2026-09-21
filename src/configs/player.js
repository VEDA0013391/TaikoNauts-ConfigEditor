const playerConfig = {
    id: 'player',
    title: 'プレイヤー情報',
    description: 'プレイヤーに関する設定を編集します。',

    files: [
        {
            id: 'playerConfig',
            pathTemplate: 'PlayerData/{userId}/PlayerConfig.json',
            // デフォルトの初期値
            path: 'PlayerData/0/PlayerConfig.json',
            fields: [
                {
                    key: 'isShowScore',
                    label: 'スコア表示',
                    type: 'boolean',
                    description: 'スコアランクや王冠などを表示します。'
                },
                {
                    key: 'isSaveScore',
                    label: 'スコア保存',
                    type: 'boolean',
                    description: 'プレイしたスコアデータを保存します。'
                },
                {
                    key: 'donchanType',
                    label: 'キャラクターの種類',
                    type: 'folderSelector',
                    description: 'キャラクターの種類を指定します。',
                    folders: [
                        'Image/99.Common/Chara',
                        'Image/99.Common/Donchan'
                    ]
                },
                {
                    key: 'isUsePuchiChara',
                    label: 'ぷちキャラを使用',
                    type: 'boolean',
                    description: 'ぷちキャラを表示します。'
                },
                {
                    key: 'puchiCharaType',
                    label: 'ぷちキャラの種類',
                    type: 'number',
                    min: 0,
                    description: 'ぷちキャラの種類を指定します。'
                },
                {
                    key: 'songSelectScorePanelIndex',
                    label: '曲選択スコアパネル',
                    type: 'imageSelector',
                    description: '曲選択画面で表示するスコアパネルを選択します。',
                    image: {
                        path: 'Image/02.SongSelect/ScorePanel.png',
                        width: 340,
                        height: 200,
                        count: 5
                    },
                    options: [
                        'かんたん',
                        'ふつう',
                        'むずかしい',
                        'おに',
                        '裏'
                    ]
                }
            ]
        }
    ]
};

export default playerConfig;