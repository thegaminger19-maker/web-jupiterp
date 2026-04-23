const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Simple homepage
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Web Proxy</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: Arial, sans-serif;
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
                }
                .examples a:hover { color: white; }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button class="nav-btn" id="backBtn">◀</button>
                <button class="nav-btn" id="forwardBtn">▶</button>
                <div class="url-box">
                    <input type="text" id="urlInput" placeholder="youtube.com" value="youtube.com">
                    <button id="goBtn">Go</button>
                </div>
            </div>
            <div class="examples">
                <a onclick="loadSite('youtube.com')">YouTube</a>
                <a onclick="loadSite('google.com')">Google</a>
                <a onclick="loadSite('reddit.com')">Reddit</a>
                <a onclick="loadSite('github.com')">GitHub</a>
                <a onclick="loadSite('wikipedia.org')">Wikipedia</a>
            </div>
            <div class="viewport">
                <iframe id="proxyFrame"></iframe>
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
                    iframe.src = '/proxy?url=' + encodeURIComponent(url);
                    
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
                        iframe.src = '/proxy?url=' + encodeURIComponent(url);
                    }
                }
                
                function goForward() {
                    if (historyIndex < historyStack.length - 1) {
                        historyIndex++;
                        const url = historyStack[historyIndex];
                        urlInput.value = url.replace('https://', '');
                        iframe.src = '/proxy?url=' + encodeURIComponent(url);
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

// Proxy endpoint
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).send('No URL provided');
    }
    
    // Add https if needed
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }
    
    console.log(`Proxying: ${targetUrl}`);
    
    try {
        // Use simple fetch instead of complex proxy middleware
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await response.text();
        
        // Rewrite links to go through proxy
        const rewrittenHtml = html.replace(/(href|src)="\/([^"]*)"/g, `$1="/proxy?url=${targetUrl}/$2"`);
        const finalHtml = rewrittenHtml.replace(/(href|src)="(https?:\/\/[^"]*)"/g, `$1="/proxy?url=$2"`);
        
        res.send(finalHtml);
    } catch(error) {
        console.error('Error:', error.message);
        res.send(`
            <html>
            <body style="font-family:sans-serif;padding:20px;text-align:center">
                <h2>Error Loading Website</h2>
                <p>Could not load: ${targetUrl}</p>
                <p>Error: ${error.message}</p>
                <p><a href="/">← Back to Home</a></p>
            </body>
            </html>
        `);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Proxy running on port ${PORT}`);
});
