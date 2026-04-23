const express = require('express');
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
                    background: #0f172a;
                    font-family: Arial, sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .toolbar {
                    background: #1e293b;
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
                    background: #0f172a;
                    padding: 10px 15px;
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
                    <input type="text" id="urlInput" placeholder="example.com" value="example.com">
                    <button id="goBtn">Go</button>
                </div>
            </div>
            <div class="examples">
                <a onclick="loadSite('example.com')">Example</a>
                <a onclick="loadSite('wikipedia.org')">Wikipedia</a>
                <a onclick="loadSite('github.com')">GitHub</a>
                <a onclick="loadSite('neocities.org')">Neocities</a>
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
                    iframe.src = '/api/' + encodeURIComponent(url);
                    
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
                        iframe.src = '/api/' + encodeURIComponent(url);
                    }
                }
                
                function goForward() {
                    if (historyIndex < historyStack.length - 1) {
                        historyIndex++;
                        const url = historyStack[historyIndex];
                        urlInput.value = url.replace('https://', '');
                        iframe.src = '/api/' + encodeURIComponent(url);
                    }
                }
                
                document.getElementById('goBtn').onclick = () => loadSite(urlInput.value);
                document.getElementById('backBtn').onclick = goBack;
                document.getElementById('forwardBtn').onclick = goForward;
                urlInput.onkeypress = (e) => e.key === 'Enter' && loadSite(urlInput.value);
                
                loadSite('example.com');
            </script>
        </body>
        </html>
    `);
});

// Simple fetch-based proxy (faster than http-proxy-middleware)
app.get('/api/*', async (req, res) => {
    let url = req.params[0];
    
    if (!url) {
        return res.status(400).send('No URL provided');
    }
    
    url = decodeURIComponent(url);
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
    
    console.log(`Fetching: ${url}`);
    
    try {
        // Use node-fetch
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000 // 10 second timeout
        });
        
        let text = await response.text();
        
        // Fix relative links
        const baseUrl = url;
        text = text.replace(/(href|src)="\//g, `$1="${baseUrl}/`);
        text = text.replace(/(href|src)='\//g, `$1='${baseUrl}/`);
        
        res.send(text);
    } catch (error) {
        console.error('Error:', error.message);
        res.send(`
            <html>
            <body style="font-family:sans-serif;padding:40px;text-align:center">
                <h2>Error Loading Website</h2>
                <p>Could not load: ${url}</p>
                <p>Error: ${error.message}</p>
                <p><a href="/">← Back to Home</a></p>
                <hr>
                <p>💡 Try these sites that work well:</p>
                <ul style="text-align:left;display:inline-block">
                    <li>example.com</li>
                    <li>wikipedia.org</li>
                    <li>github.com</li>
                    <li>neocities.org</li>
                </ul>
            </body>
            </html>
        `);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Proxy running on port ${PORT}`);
});
