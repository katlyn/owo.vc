const API_ROOT = "/api/v2"

const linkInput = document.getElementById("input")
const linkCopy = document.getElementById("input-copy-btn")
const inputWrapper = document.getElementById("input-wrapper")
const linkSubmit = document.getElementById("submit")

const generator = document.getElementById("generator")
const metadataHandling = document.getElementById("metadata")

let lock = false

linkInput.addEventListener("keyup", ev => {
  if (ev.key === "Enter") {
    void shortenLink(linkInput.value)
  }
})

linkInput.addEventListener("paste", () => {
  setTimeout(() => shortenLink(linkInput.value), 0)
})

linkSubmit.addEventListener("click", () => {
  void shortenLink(linkInput.value)
})

linkCopy.addEventListener("click", () => {
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
  const isUrl = /https?:\/\/.+\..+/
  if (isUrl.test(link)) {
    console.log(`Shortening ${link}`)
    linkInput.value = ""
    linkInput.placeholder = "Generating link..."
    // eslint-disable-next-line no-undef
    const response = await fetch(`${API_ROOT}/link`, {
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
    const linkData = await response.json()
    if (response.ok) {
      inputWrapper.classList.remove("error")
      linkInput.value = `https://${linkData.id}`
      linkInput.placeholder = "Link to shorten..."
      linkInput.select()
    } else {
      inputWrapper.classList.add("error")
      linkInput.value = ""
      linkInput.placeholder = linkData.message
    }
  } else {
    inputWrapper.classList.add("error")
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
    void getInfo(infoLink.value)
  }
})

infoLink.addEventListener("paste", () => {
  setTimeout(() => getInfo(infoLink.value), 0)
})

infoSubmit.addEventListener("click", () => {
  void getInfo(infoLink.value)
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
    const request = await fetch(`${API_ROOT}/link/${encodedLink}`)
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
