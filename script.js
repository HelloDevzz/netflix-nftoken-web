const btn = document.getElementById('generateBtn');
const btnText = document.getElementById('btnText');
const spinner = document.getElementById('spinner');
const resultEl = document.getElementById('result');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');

document.getElementById('cookieInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate();
});

btn.addEventListener('click', generate);

async function generate() {
  const cookie = document.getElementById('cookieInput').value.trim();
  if (!cookie) {
    showError('Please paste your Netflix cookie first.');
    return;
  }

  setLoading(true);

  try {
    const res = await fetch('/.netlify/functions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie }),
    });

    const data = await res.json();

    if (data.error) {
      showError(data.error);
    } else {
      showSuccess(data.url, data.expires);
    }
  } catch (err) {
    showError('Network error: ' + err.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  btn.disabled = on;
  btnText.textContent = on ? 'Generating...' : 'Generate NFToken';
  spinner.classList.toggle('active', on);
}

function showSuccess(url, expires) {
  resultBox.className = 'result-box success';
  resultContent.innerHTML = `
    <div class="result-label">Login URL</div>
    <div class="result-url" id="nftokenUrl">${esc(url)}</div>
    <div class="result-expires">Expires: ${esc(expires)}</div>
    <button class="copy-btn" id="copyBtn">Copy URL</button>
  `;
  resultEl.classList.remove('hidden');

  document.getElementById('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(url).then(() => {
      const copyBtn = document.getElementById('copyBtn');
      copyBtn.textContent = 'Copied!';
      setTimeout(() => { copyBtn.textContent = 'Copy URL'; }, 2000);
    });
  });
}

function showError(msg) {
  resultBox.className = 'result-box error';
  resultContent.innerHTML = `<div class="result-error">${esc(msg)}</div>`;
  resultEl.classList.remove('hidden');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
