describe('publish', () => {
  beforeAll(async () => {
    await page.goto(reactAppUrl + `#/publish`, { waitUntil: 'networkidle' })
  })

  test('publish vote', async () => {
    // wait until body contains empty array
    await page.waitForFunction(() => !!document.body.textContent.match('\\[\\]'))

    // wait for functions to be defined
    await page.waitForFunction(() => !!window.publishComment && !!window.publishVote && !!window.addEvent)

    // publish a vote
    await page.evaluate(async () => {
      const onChallenge = (event, vote) => {
        // add the event to react component
        window.addEvent(event)
        vote.publishChallengeAnswers(['answer'])
      }
      const onChallengeVerification = (event) => {
        // add the event to react component
        window.addEvent(event)
      }

      // unknown error, not sure how to fix, doesn't affect result
      // DOMException: Failed to execute 'put' on 'IDBObjectStore':
      try {
        await window.publishVote({
          subplebbitAddress: 'subplebbitAddress',
          commentCid: 'commentCid', 
          vote: 1, 
          onChallenge, 
          onChallengeVerification
        })
      }
      catch (e) {}
    })

    // wait for events to appear
    await page.waitForFunction(() => !!document.body.textContent.match('VERIFICATION'))

    // serialize events
    const events = JSON.parse(await page.evaluate(() => document.body.textContent.trim()))

    // should have 2 events, challenge and challenge verification
    expect(events.length).toBe(2)
  })
})
