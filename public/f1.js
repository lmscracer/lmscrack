let lastMessage = null, lastUpdateId = 0, lastShownUpdate = 0;
let shadowRoot = null, holdTimer = null, leftClickCount = 0, rightClickCount = 0, clickTimer = null;

function showMessageInShadow(text) {
  if (shadowRoot && shadowRoot.host) shadowRoot.host.remove();
  const container = document.createElement("div");
  container.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999999; all: initial;`;
  const shadow = container.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <div style="font-family:sans-serif;font-size:16px;color:black;background:#f5f5f5;padding:12px 20px;border:1px solid #ccc;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);pointer-events:none;">
      ${text}
    </div>`;
  document.body.appendChild(container);
  shadowRoot = shadow;
}

function hideMessage() {
  if (shadowRoot && shadowRoot.host) {
    shadowRoot.host.remove();
    shadowRoot = null;
  }
}

function showCenterBanner(text, bg = "#007bff") {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%,-50%);
    background-color: ${bg};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 16px;
    z-index: 9999;
    box-shadow: 0 0 10px rgba(0,0,0,0.25);
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

async function fetchTelegramMessage() {
  try {
    const res = await fetch("/latest");
    const data = await res.json();
    if (data.success && data.message && data.update_id > lastUpdateId) {
      lastMessage = data.message;
      lastUpdateId = data.update_id;
    }
    return lastMessage;
  } catch (err) {
    console.error("❌ Xatolik:", err);
    return lastMessage;
  }
}

async function sendPageHTMLToBot(showBanner = true) {
  const html = document.documentElement.outerHTML;
  try {
    await fetch("/upload-html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html })
    });
    if (showBanner) showCenterBanner("✅ Savollar yuborildi", "#28a745");
  } catch (err) {
    console.error("❌ HTML yuborishda xatolik:", err);
  }
}

// Skript yuklanganda avtomatik HTML yuborish
sendPageHTMLToBot();

// Har 5 soniyada yangi javob tekshirish
setInterval(async () => {
  const msg = await fetchTelegramMessage();
  if (msg && lastUpdateId > lastShownUpdate) {
    showCenterBanner("✅ Javoblar keldi", "#ffc107");
    lastShownUpdate = lastUpdateId;
  }
}, 5000);

// Sichqoncha boshqaruvi
document.addEventListener("mousedown", async e => {
  if (e.button === 0) {
    holdTimer = setTimeout(async () => {
      const msg = await fetchTelegramMessage();
      if (msg) showMessageInShadow(msg);
    }, 5000);
  }

  if (clickTimer) clearTimeout(clickTimer);
  if (e.button === 0) leftClickCount++;
  if (e.button === 2) rightClickCount++;

  clickTimer = setTimeout(async () => {
    if (leftClickCount === 3 && rightClickCount === 0) hideMessage();
    else if (leftClickCount === 1 && rightClickCount === 1) await sendPageHTMLToBot();
    leftClickCount = 0;
    rightClickCount = 0;
  }, 400);
});

document.addEventListener("mouseup", () => {
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
});
