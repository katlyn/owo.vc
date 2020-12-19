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
  const isUrl = /(?:https?:\/\/).+\..+/
  if (isUrl.test(link)) {
    console.log(`Shortening ${link}`)
    linkInput.value = ''
    linkInput.placeholder = 'Generating link...'
    
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
