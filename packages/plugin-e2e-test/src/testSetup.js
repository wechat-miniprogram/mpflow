/* eslint-disable no-undef */

afterAll(async () => {
  // 当测试执行完毕之后，将工具里收集到的覆盖率信息导出
  global.__coverage__ = await miniProgram.evaluate(() => {
    return __coverage__
  })
})
