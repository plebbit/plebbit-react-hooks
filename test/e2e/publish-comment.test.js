describe('publish', () => {
  beforeAll(async () => {
    await page.goto(reactAppUrl + `#/publish`, { waitUntil: 'networkidle' })
  })

  test('publish comment', async () => {
    // wait until body contains empty array
    await page.waitForFunction(() => !!document.body.textContent.match('\\[\\]'))

    // wait for functions to be defined
    await page.waitForFunction(() => !!window.publishComment && !!window.publishVote && !!window.addEvent)

    // publish a comment
    await page.evaluate(async () => {
      const onChallenge = (event, comment) => {
        // add the event to react component
        window.addEvent(event)
        comment.publishChallengeAnswers(['answer'])
      }
      const onChallengeVerification = (event) => {
        // add the event to react component
        window.addEvent(event)
      }

      try {
        await window.publishComment({
          subplebbitAddress: 'subplebbitAddress', 
          content: 'content', 
          title: 'title', 
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
