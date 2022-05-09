describe('Commen', () => {
  beforeAll(async () => {
    const commentCidToGet = 'Qm...'
    await page.goto(reactAppUrl + `#/comment/${commentCidToGet}`, { waitUntil: 'networkidle' })
  })

  test('has content or link', async () => {
    // wait until body contains 'cid'
    await page.waitForFunction(() => !!document.body.textContent.match('cid'))

    // serialize comment
    const comment = JSON.parse(await page.evaluate(() => document.body.textContent.trim()))

    // comment should have a content or title
    expect(comment.title || comment.content).not.toBe(undefined)
  })
})
