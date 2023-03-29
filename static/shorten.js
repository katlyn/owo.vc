const linkInput = document.getElementById("input")
const linkCopy = document.getElementById("input-copy-btn")
const linkSubmit = document.getElementById("submit")

const generator = document.getElementById("generator")
const metadataHandling = document.getElementById("metadata")

let lock = false

linkInput.addEventListener("keyup", ev => {
  if (ev.key === "Enter") {
    shortenLink(linkInput.value)
  }
})

linkInput.addEventListener("paste", ev => {
  const paste = (ev.clipboardData || window.clipboardData).getData("text")
  shortenLink(paste)
})

linkSubmit.addEventListener("click", ev => {
  shortenLink(linkInput.value)
})

linkCopy.addEventListener("click", ev => {
  linkInput.select()
  // deprecated but it's supported by every browser and the only reliable way
  document.execCommand("copy")
})

generator.addEventListener("input", () => {
  // Don't owoify by default if the user changes to gay links
  const defaults = {
    owo: "owoify",
    gay: "proxy",
    zws: "proxy",
    sketchy: "proxy"
  }
  metadataHandling.value = defaults[generator.value]
})

const shortenLink = async link => {
  if (lock) return
  lock = true
  const isUrl = /(?:https?:\/\/).+\..+/
  if (isUrl.test(link)) {
    console.log(`Shortening ${link}`)
    linkInput.value = ""
    linkInput.placeholder = "Generating link..."
    // eslint-disable-next-line no-undef
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify({
        link,
        generator: generator.value,
        preventScrape: metadataHandling.value === "ignore",
        owoify: metadataHandling.value === "owoify"
      })
    })
    if (response.ok) {
      linkInput.classList.remove("error")
      const linkData = await response.json()
      linkInput.value = `https://${linkData.result}`
      linkInput.placeholder = "Link to shorten..."
      linkInput.select()
    } else {
      linkInput.classList.add("error")
      linkInput.value = ""
      linkInput.placeholder = await response.text()
    }
  } else {
    linkInput.classList.add("error")
    linkInput.value = ""
    linkInput.placeholder = "Invalid link!"
  }
  lock = false
}

// Link information handling
const infoLink = document.getElementById("link")
const infoSubmit = document.getElementById("info-submit")

let infoLock = false

infoLink.addEventListener("keypress", ev => {
  if (ev.keyCode === 13) {
    getInfo(infoLink.value)
  }
})

infoLink.addEventListener("paste", ev => {
  const paste = (ev.clipboardData || window.clipboardData).getData("text")
  getInfo(paste)
})

infoSubmit.addEventListener("click", ev => {
  getInfo(infoLink.value)
})

const getInfo = async link => {
  link = link.trim()
  if (infoLock || link === "") return
  infoLock = true
  // Trim url scheme from link
  if (link.startsWith("http")) {
    link = link.replace(/https?:\/\//, "")
  }
  const encodedLink = encodeURIComponent(link)
  try {
    const request = await fetch(`/info/${encodedLink}`)
    if (request.ok) {
      const linkInfo = await request.json()
      infoLink.classList.remove("error")
      document.getElementById("info-results").style = ""
      document.getElementById("info-results-body").innerHTML += `<tr>
      <td>${linkInfo.id}</td>
      <td>${linkInfo.destination}</td>
      <td>
        ${linkInfo.preventScrape ? "Prevent Scrape" : ""}
        ${linkInfo.owoify ? "Owoify" : ""}
      </td>
      <td>${linkInfo.visits}</td>
      <td>${linkInfo.scrapes}</td>
      </tr>`
    } else {
      infoLink.classList.add("error")
      infoLink.value = ""
      const res = await request.json()
      infoLink.placeholder = res.error
    }
  } catch (e) {
    infoLink.classList.add("error")
    infoLink.value = ""
    infoLink.placeholder = e
  }
  infoLock = false
}
