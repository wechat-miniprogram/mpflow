//info.js
Component({
  properties: {
    userInfo: {
      type: null,
    }
  },
  methods: {
    getUserInfo: function(e) {
      console.log(e)
      const userInfo = e.detail.userInfo
      this.setData({
        userInfo,
      })
      this.triggerEvent('change', userInfo)
    }
  }
})