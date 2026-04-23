const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

function fixUrl(url) {
    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url;
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use('/go/*', (req, res) => {
    let targetUrl = req.params[0];
    targetUrl = fixUrl(targetUrl);
    console.log(`Proxying: ${targetUrl}`);
    
    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        onProxyReq: (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
        },
        onError: (err, req, res) => {
            console.error('Proxy error:', err.message);
            res.status(500).send(`Proxy error: ${err.message}`);
        }
    })(req, res);
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Web Proxy - Access Any Site</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: system-ui, -apple-system, sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .toolbar {
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(10px);
                    padding: 15px 20px;
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .url-box {
                    flex: 1;
                    display: flex;
                    gap: 10px;
                    background: white;
                    border-radius: 50px;
                    padding: 5px 5px 5px 20px;
                }
                .url-box input {
                    flex: 1;
                    border: none;
                    padding: 12px 0;
                    font-size: 16px;
                    outline: none;
                }
                button {
                    background: #3b82f6;
                    border: none;
                    color: white;
                    padding: 10px 25px;
                    border-radius: 50px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                }
                button:hover { background: #2563eb; }
                .nav-btn { background: #475569; }
                .viewport { flex: 1; background: white; }
                iframe { width: 100%; height: 100%; border: none; }
                .examples {
                    background: #0f172a;
                    padding: 8px 20px;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .examples a {
                    color: #94a3b8;
                    cursor: pointer;
                    text-decoration: none;
                }
                .examples a:hover { color: white; }
                .badge {
                    background: #10b981;
                    color: white;
                    padding: 5px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                }
                @media (max-width: 600px) {
                    .toolbar { padding: 10px; }
                    .url-box input { font-size: 14px; }
                    button { padding: 8px 15px; }
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button class="nav-btn" id="backBtn">◀ Back</button>
                <button class="nav-btn" id="forwardBtn">Forward ▶</button>
                <div class="url-box">
                    <input type="text" id="urlInput" placeholder="youtube.com" value="youtube.com">
                    <button id="goBtn">Go</button>
                </div>
                <div class="badge">Live Proxy</div>
            </div>
            <div class="examples">
                <span style="color:#64748b">Quick links:</span>
                <a onclick="loadSite('youtube.com')">YouTube</a>
                <a onclick="loadSite('google.com')">Google</a>
                <a onclick="loadSite('reddit.com')">Reddit</a>
                <a onclick="loadSite('x.com')">X/Twitter</a>
                <a onclick="loadSite('github.com')">GitHub</a>
                <a onclick="loadSite('wikipedia.org')">Wikipedia</a>
            </div>
            <div class="viewport">
                <iframe id="proxyFrame" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation allow-downloads"></iframe>
            </div>

            <script>
                let historyStack = [];
                let historyIndex = -1;
                const iframe = document.getElementById('proxyFrame');
                const urlInput = document.getElementById('urlInput');
                
                function loadSite(url) {
                    if (!url.startsWith('http')) url = 'https://' + url;
                    urlInput.value = url.replace('https://', '');
                    iframe.src = '/go/' + encodeURIComponent(url);
                    
                    if (historyStack[historyIndex] !== url) {
                        historyStack = historyStack.slice(0, historyIndex + 1);
                        historyStack.push(url);
                        historyIndex = historyStack.length - 1;
                    }
                }
                
                function goBack() {
                    if (historyIndex > 0) {
                        historyIndex--;
                        iframe.src = '/go/' + encodeURIComponent(historyStack[historyIndex]);
                        urlInput.value = historyStack[historyIndex].replace('https://', '');
                    }
                }
                
                function goForward() {
                    if (historyIndex < historyStack.length - 1) {
                        historyIndex++;
                        iframe.src = '/go/' + encodeURIComponent(historyStack[historyIndex]);
                        urlInput.value = historyStack[historyIndex].replace('https://', '');
                    }
                }
                
                document.getElementById('goBtn').onclick = () => loadSite(urlInput.value);
                document.getElementById('backBtn').onclick = goBack;
                document.getElementById('forwardBtn').onclick = goForward;
                urlInput.onkeypress = (e) => e.key === 'Enter' && loadSite(urlInput.value);
                
                loadSite('youtube.com');
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
