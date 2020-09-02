Page({
    data: {
        list: [
            {
                id: 'basic',
                name: '组件',
                open: false,
                pages: ['cell', 'badge']
            },
        ]
    },
    kindToggle: function (e) {
        const id = e.currentTarget.id,
            list = this.data.list
        for (let i = 0, len = list.length; i < len; ++i) {
            if (list[i].id == id) {
                list[i].open = !list[i].open
            } else {
                list[i].open = false
            }
        }
        this.setData({
            list: list
        })
    }
})
