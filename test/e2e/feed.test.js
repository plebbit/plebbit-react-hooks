describe('feed', () => {
  beforeAll(async () => {
    await page.goto(reactAppUrl + `#/feed`, { waitUntil: 'networkidle' })
  })

  test('has 25 posts', async () => {
    // wait until body contains 'cid'
    await page.waitForFunction(() => !!document.body.textContent.match('cid'))

    // serialize sub
    const feed = JSON.parse(await page.evaluate(() => document.body.textContent.trim()))

    // sub should have an address
    expect(feed.length).toBe(25)
  })
})
