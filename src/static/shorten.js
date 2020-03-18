const linkInput = document.getElementById('input')
const linkSubmit = document.getElementById('submit')

const zws = document.getElementById('zws')
const preventScrape = document.getElementById('preventScrape')
const owoify = document.getElementById('owoify')

let lock = false

linkInput.addEventListener('keypress', ev => {
  if (ev.keyCode === 13) {
    shortenLink(linkInput.value)
  } 
})

linkInput.addEventListener('paste', ev => {
  let paste = (ev.clipboardData || window.clipboardData).getData('text')
  shortenLink(paste)
})

linkSubmit.addEventListener('click', ev => {
  shortenLink(linkInput.value)
})

const shortenLink = async (link) => {
  if (lock) return
  lock = true
  const isUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/
  if (isUrl.test(link)) {
    console.log(`Shortening ${link}`)
    linkInput.value = ''
    linkInput.placeholder = 'Generating link...'
    const response = await fetch('/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
    },
      body: JSON.stringify({
        link,
        generator: zws.checked ? 'zws' : 'owo',
        preventScrape: preventScrape.checked,
        owoify: owoify.checked
      })
    })
    if (response.ok) {
      linkInput.classList.remove('error')
      const linkData = await response.json()
      linkInput.value = `https://${linkData.result}`
      linkInput.placeholder = 'Link to shorten...'
      linkInput.select()
    } else {
      linkInput.classList.add('error')
      linkInput.value = ''
      linkInput.placeholder = 'Error generating link!'
    }
  } else {
    linkInput.classList.add('error')
    linkInput.value = ''
    linkInput.placeholder = 'Invalid link!'
  }
  lock = false
}
