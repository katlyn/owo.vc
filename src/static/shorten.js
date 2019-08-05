const linkInput = document.getElementById('input')
const linkSubmit = document.getElementById('submit')

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
      body: JSON.stringify({ link })
    })
    if (response.ok) {
      linkInput.classList.remove('error')
      const linkData = response.json()
      linkInput.value = linkData.result
      linkInput.placeholder = 'Link to shorten...'
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
