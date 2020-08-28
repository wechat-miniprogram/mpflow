describe("page index", () => {
  let page;

  beforeAll(async () => {
    page = await miniProgram.reLaunch("/pages/index/index");
    await page.waitFor(500);
  }, 30 * 1000);

  test("wxml", async () => {
    const element = await page.$("page");
    expect(await element.wxml()).toMatchSnapshot();
  });
});
