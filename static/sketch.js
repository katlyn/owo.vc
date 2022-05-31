const linkInput = document.getElementById('input')
const linkSubmit = document.getElementById('submit')

let lock = false

linkInput.addEventListener('keypress', ev => {
  if (ev.keyCode === 13) {
    unshortenLink(linkInput.value)
  }
})

linkInput.addEventListener('paste', ev => {
  const paste = (ev.clipboardData || window.clipboardData).getData('text')
  setTimeout(() => unshortenLink(paste), 10)
})

linkSubmit.addEventListener('click', ev => {
  unshortenLink(linkInput.value)
})

const shortenLink = async (link) => {
  if (lock) return
  lock = true
  const isUrl = /(?:https?:\/\/).+\..+/
  if (isUrl.test(link)) {
    console.log(`Shortening ${link}`)
    linkInput.value = ''
    linkInput.placeholder = 'Generating link...'

    // eslint-disable-next-line no-undef
    const encoded = btoa(link)
      .split('')
      .map(c => c === '=' ? '=' : String.fromCharCode(c.charCodeAt(0) + 1))
      .join('')

    linkInput.value = `http://0x2e65ae31/${encoded}`
    linkInput.placeholder = 'Link to shorten...'
    linkInput.select()
  } else {
    linkInput.classList.add('error')
    linkInput.value = ''
    linkInput.placeholder = 'Invalid link!'
  }
  lock = false
}

const unshortenLink = async (link) => {
  if (lock) return
  lock = true
  try {
    const isUrl = /(?:https?:\/\/).+\..+/
    if (isUrl.test(link)) {
      console.log(`Unshortening ${link}`)
      linkInput.value = ''
      linkInput.placeholder = 'Unshortening link...'

      const path = decodeURIComponent(new URL(link).pathname.substring(1))

      // eslint-disable-next-line no-undef
      const decoded = atob(path.split('')
        .map(c => c === '=' ? '=' : String.fromCharCode(c.charCodeAt(0) - 1))
        .join(''))

      linkInput.value = decoded
      linkInput.placeholder = 'Link to unshorten...'
      linkInput.select()
    } else {
      linkInput.classList.add('error')
      linkInput.value = ''
      linkInput.placeholder = 'Invalid link!'
    }
  } catch (err) {
    console.error(err)
    alert('Unable to decode input.')
  }
  lock = false
}
