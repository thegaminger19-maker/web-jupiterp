const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title> Jupiter Proxy - Type Any URL</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .toolbar {
                    background: rgba(0,0,0,0.85);
                    backdrop-filter: blur(10px);
                    padding: 15px 20px;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .url-box {
                    flex: 1;
                    display: flex;
                    gap: 8px;
                    background: white;
                    border-radius: 60px;
                    padding: 5px 5px 5px 25px;
                    align-items: center;
                }
                .url-box input {
                    flex: 1;
                    border: none;
                    padding: 14px 0;
                    font-size: 16px;
                    outline: none;
                    font-family: monospace;
                }
                button {
                    background: #3b82f6;
                    border: none;
                    color: white;
                    padding: 10px 28px;
                    border-radius: 60px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                button:hover {
                    background: #2563eb;
                    transform: scale(0.97);
                }
                .nav-btn {
                    background: #475569;
                }
                .nav-btn:hover {
                    background: #334155;
                }
                .viewport {
                    flex: 1;
                    background: white;
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .quick-links {
                    background: #0f172a;
                    padding: 8px 20px;
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    border-top: 1px solid #1e293b;
                }
                .quick-links a {
                    color: #94a3b8;
                    cursor: pointer;
                    text-decoration: none;
                    font-size: 13px;
                    padding: 5px 12px;
                    border-radius: 20px;
                    transition: 0.2s;
                }
                .quick-links a:hover {
                    background: #1e293b;
                    color: white;
                }
                .status {
                    background: #10b981;
                    color: white;
                    padding: 5px 14px;
                    border-radius: 30px;
                    font-size: 12px;
                    font-weight: bold;
                }
                @media (max-width: 600px) {
                    .toolbar { padding: 10px; }
                    button { padding: 8px 18px; font-size: 12px; }
                    .url-box input { font-size: 13px; }
                }
            </style>
        </head>
        <body>
            <div class="toolbar">
                <button class="nav-btn" id="backBtn">◀ Back</button>
                <button class="nav-btn" id="forwardBtn">Forward ▶</button>
                <div class="url-box">
                    <span style="font-size:18px;">🌐</span>
                    <input type="text" id="urlInput" placeholder="Type any URL... youtube.com, google.com, reddit.com" value="example.com">
                    <button id="goBtn">Go</button>
                </div>
                <div class="status">● LIVE</div>
            </div>
            <div class="quick-links">
                <span style="color:#64748b;">Try these:</span>
                <a onclick="loadSite('example.com')">📄 Example</a>
                <a onclick="loadSite('youtube.com')">📺 YouTube</a>
                <a onclick="loadSite('google.com')">🔍 Google</a>
                <a onclick="loadSite('reddit.com')">🤖 Reddit</a>
                <a onclick="loadSite('github.com')">💻 GitHub</a>
                <a onclick="loadSite('wikipedia.org')">📚 Wikipedia</a>
                <a onclick="loadSite('x.com')">🐦 X/Twitter</a>
                <a onclick="loadSite('instagram.com')">📷 Instagram</a>
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
                    
                    // Clean up the URL
                    url = url.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                        url = 'https://' + url;
                    }
                    
                    // Update input field
                    urlInput.value = url.replace('https://', '').replace('http://', '');
                    
                    // Load in iframe
                    iframe.src = '/proxy?url=' + encodeURIComponent(url);
                    
                    // Update history
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
                
                // Event listeners
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
                
                // Load default
                loadSite('example.com');
            </script>
        </body>
        </html>
    `);
});

// Proxy endpoint - handles ANY website
app.get('/proxy', async (req, res) => {
    let targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).send('No URL provided');
    }
    
    // Add https if missing
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }
    
    console.log(`🌐 Proxying: ${targetUrl}`);
    
    try {
        const fetch = await import('node-fetch').then(m => m.default);
        
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        let html = await response.text();
        
        // Fix relative links and resources
        const baseUrl = targetUrl;
        html = html.replace(/(href|src)="\//g, `$1="${baseUrl}/`);
        html = html.replace(/(href|src)='\//g, `$1='${baseUrl}/`);
        html = html.replace(/(action)="\//g, `$1="${baseUrl}/`);
        
        res.send(html);
        
    } catch(error) {
        console.error('Proxy error:', error.message);
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Proxy Error</title>
                <style>
                    body { font-family: system-ui, sans-serif; padding: 40px; text-align: center; background: #f1f5f9; }
                    .error-box { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    h2 { color: #dc2626; margin-bottom: 20px; }
                    input { padding: 10px; width: 70%; margin: 10px; border: 1px solid #ccc; border-radius: 8px; }
                    button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="error-box">
                    <h2>⚠️ Cannot Load Website</h2>
                    <p><strong>${escapeHtml(targetUrl)}</strong></p>
                    <p style="color: #64748b;">Error: ${escapeHtml(error.message)}</p>
                    <hr style="margin: 20px 0;">
                    <p>💡 Try a different URL:</p>
                    <input type="text" id="newUrl" placeholder="youtube.com" value="example.com">
                    <button onclick="window.location.href='/proxy?url=' + encodeURIComponent(document.getElementById('newUrl').value)">Try Again</button>
                    <p style="margin-top: 20px;"><a href="/" style="color: #3b82f6;">← Back to Home</a></p>
                </div>
                <script>
                    document.getElementById('newUrl').onkeypress = (e) => {
                        if (e.key === 'Enter') {
                            window.location.href = '/proxy?url=' + encodeURIComponent(e.target.value);
                        }
                    };
                </script>
            </body>
            </html>
        `);
    }
});

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Proxy running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT}`);
});
