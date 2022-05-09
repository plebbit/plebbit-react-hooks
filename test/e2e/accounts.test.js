describe('account', () => {
  beforeAll(async () => {
    await page.goto(reactAppUrl + '#/account', { waitUntil: 'networkidle' })
  })

  test('has signer', async () => {
    // wait until body contains 'name'
    await page.waitForFunction(() => !!document.body.textContent.match('name'))

    // serialize account
    const account = JSON.parse(await page.evaluate(() => document.body.textContent.trim()))

    // signer should have a private key
    expect(account.signer.privateKey).not.toBe(undefined)
  })
})
