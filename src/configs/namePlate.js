const namePlateConfig = {
    id: 'namePlate',
    title: 'ネームプレート',
    description: '名前や称号、段位などの設定を編集します。',

    files: [
        {
            id: 'namePlateConfig',
            pathTemplate: 'PlayerData/{userId}/NamePlateConfig.json',
            path: 'PlayerData/0/NamePlateConfig.json',
            fields: [
                {
                    key: 'name',
                    label: '名前',
                    type: 'text'
                },
                {
                    key: 'title',
                    label: '称号',
                    type: 'text',
                    description: '空欄にすると称号を表示しません。'
                },
                {
                    key: 'rank',
                    label: '段位',
                    type: 'text',
                    description: '空欄にすると段位を表示しません。'
                },
                {
                    key: 'isRankGold',
                    label: '金合格にする',
                    type: 'boolean'
                },
                {
                    key: 'namePlateType',
                    label: 'ネームプレート',
                    type: 'imageFolderSelector',
                    description: '使用するネームプレートを選択します。',
                    image: {
                        path: 'Image/99.Common/NamePlate/Plates',
                        file: 'Base.png'
                    }
                },
                {
                    key: 'rankType',
                    label: '段位の色',
                    type: 'select',
                    options: [
                        {
                            value: 0,
                            label: '銀'
                        },
                        {
                            value: 1,
                            label: '金'
                        },
                        {
                            value: 2,
                            label: '虹'
                        }
                    ]
                }
            ]
        }
    ]
};

export default namePlateConfig;