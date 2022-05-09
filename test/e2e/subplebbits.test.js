describe('subplebbit', () => {
  beforeAll(async () => {
    const subplebbitAddressToGet = 'something.eth'
    await page.goto(reactAppUrl + `#/subplebbit/${subplebbitAddressToGet}`, { waitUntil: 'networkidle' })
  })

  test('has address', async () => {
    // wait until body contains 'cid'
    await page.waitForFunction(() => !!document.body.textContent.match('address'))

    // serialize sub
    const subplebbit = JSON.parse(await page.evaluate(() => document.body.textContent.trim()))

    // sub should have an address
    expect(subplebbit.address).not.toBe(undefined)
  })
})
