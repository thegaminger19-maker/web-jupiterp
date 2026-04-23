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

// IMPORTANT FIX: Better URL parsing
app.get('/go/*', (req, res) => {
    // Get the URL from the path
    let targetUrl = req.params[0];
    
    if (!targetUrl) {
        return res.status(400).send('No URL provided. Use: /go/https://example.com');
    }
    
    targetUrl = fixUrl(targetUrl);
    console.log(`Proxying: ${targetUrl}`);
    
    try {
        createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            secure: false,
            followRedirects: true,
            logger: console,
            onProxyReq: (proxyReq, req, res) => {
                proxyReq.removeHeader('origin');
                proxyReq.removeHeader('referer');
                proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            },
            onError: (err, req, res) => {
                console.error('Proxy error:', err.message);
                res.status(500).send(`
                    <html>
                    <body style="font-family:sans-serif;padding:20px;text-align:center">
                        <h2>Proxy Error</h2>
                        <p>Could not load: ${targetUrl}</p>
                        <p>Error: ${err.message}</p>
                        <p><a href="/">← Go back to homepage</a></p>
                    </body>
                    </html>
                `);
            }
        })(req, res);
    } catch(e) {
        res.status(500).send(`Proxy setup error: ${e.message}`);
    }
});

// Simple homepage with working input
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Web Proxy - Type Any URL</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: Arial, system-ui, sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .toolbar {
                    background: rgba(0,0,0,0.9);
                    padding: 15px;
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
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
                }
                button:hover { background: #2563eb; }
                .nav-btn { background: #475569; }
                .viewport { flex: 1; background: white; }
                iframe { width: 100%; height: 100%; border: none; }
                .examples {
                    background: #1e293b;
                    padding: 8px 15px;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                .examples a {
                    color: #94a3b8;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 14px;
                }
                .examples a:hover { color: white; }
                .status {
                    background: #0f172a;
                    padding: 5px 15px;
                    border-radius: 20px;
                    color: #10b981;
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button class="nav-btn" id="backBtn">◀ Back</button>
                <button class="nav-btn" id="forwardBtn">Forward ▶</button>
                <div class="url-box">
                    <input type="text" id="urlInput" placeholder="youtube.com or google.com" value="youtube.com">
                    <button id="goBtn">Go</button>
                </div>
                <div class="status">● Live Proxy</div>
            </div>
            <div class="examples">
                <span style="color:#64748b">Try:</span>
                <a onclick="loadSite('youtube.com')">📺 YouTube</a>
                <a onclick="loadSite('google.com')">🔍 Google</a>
                <a onclick="loadSite('reddit.com')">🤖 Reddit</a>
                <a onclick="loadSite('x.com')">🐦 X/Twitter</a>
                <a onclick="loadSite('github.com')">💻 GitHub</a>
                <a onclick="loadSite('wikipedia.org')">📚 Wikipedia</a>
                <a onclick="loadSite('example.com')">📄 Example</a>
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
                    if (!url) return;
                    if (!url.startsWith('http')) url = 'https://' + url;
                    urlInput.value = url.replace('https://', '');
                    
                    const proxyUrl = '/go/' + encodeURIComponent(url);
                    console.log('Loading:', proxyUrl);
                    iframe.src = proxyUrl;
                    
                    if (historyStack[historyIndex] !== url) {
                        historyStack = historyStack.slice(0, historyIndex + 1);
                        historyStack.push(url);
                        historyIndex = historyStack.length - 1;
                    }
                }
                
                function goBack() {
                    if (historyIndex > 0) {
                        historyIndex--;
                        const url = historyStack[historyIndex];
                        urlInput.value = url.replace('https://', '');
                        iframe.src = '/go/' + encodeURIComponent(url);
                    } else {
                        alert('No back history');
                    }
                }
                
                function goForward() {
                    if (historyIndex < historyStack.length - 1) {
                        historyIndex++;
                        const url = historyStack[historyIndex];
                        urlInput.value = url.replace('https://', '');
                        iframe.src = '/go/' + encodeURIComponent(url);
                    } else {
                        alert('No forward history');
                    }
                }
                
                document.getElementById('goBtn').onclick = () => {
                    const val = urlInput.value.trim();
                    if (val) loadSite(val);
                };
                
                document.getElementById('backBtn').onclick = goBack;
                document.getElementById('forwardBtn').onclick = goForward;
                
                urlInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        const val = urlInput.value.trim();
                        if (val) loadSite(val);
                    }
                };
                
                // Initial load
                loadSite('youtube.com');
            </script>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Proxy running on port ${PORT}`);
    console.log(`📡 Open http://localhost:${PORT} in your browser`);
});
