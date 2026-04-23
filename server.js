const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Fix URLs - add https if missing
function fixUrl(url) {
    url = url.trim();
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return 'https://' + url;
}

// Main homepage - FULLY FUNCTIONAL
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🌍 Web Proxy - Works With Any Site</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: #0f172a;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .header {
                    background: #1e293b;
                    padding: 12px 20px;
                    border-bottom: 1px solid #334155;
                }
                .url-section {
                    background: #0f172a;
                    padding: 15px 20px;
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .url-input-wrapper {
                    flex: 1;
                    display: flex;
                    gap: 8px;
                    background: #1e293b;
                    border-radius: 60px;
                    padding: 4px 4px 4px 20px;
                    border: 1px solid #475569;
                }
                .url-input-wrapper input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: #f1f5f9;
                    font-size: 15px;
                    padding: 12px 0;
                    outline: none;
                    font-family: monospace;
                }
                .url-input-wrapper input::placeholder {
                    color: #64748b;
                }
                button {
                    background: #3b82f6;
                    border: none;
                    color: white;
                    padding: 10px 24px;
                    border-radius: 60px;
                    cursor: pointer;
                    font-weight: 600;
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
                .quick-links {
                    background: #0f172a;
                    padding: 10px 20px;
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
                    padding: 4px 10px;
                    border-radius: 20px;
                    transition: 0.2s;
                }
                .quick-links a:hover {
                    background: #1e293b;
                    color: white;
                }
                .viewport {
                    flex: 1;
                    background: white;
                    position: relative;
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .status {
                    background: #10b981;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: bold;
                }
                @media (max-width: 600px) {
                    .url-section { padding: 10px; }
                    button { padding: 8px 16px; font-size: 12px; }
                    .url-input-wrapper input { font-size: 13px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="color: white; font-size: 18px;">🌐 Web Proxy</h2>
                    <div class="status">LIVE</div>
                </div>
            </div>
            <div class="url-section">
                <button class="nav-btn" id="backBtn">◀ Back</button>
                <button class="nav-btn" id="forwardBtn">Forward ▶</button>
                <div class="url-input-wrapper">
                    <input type="text" id="urlInput" placeholder="Enter any URL... youtube.com, google.com, reddit.com" value="youtube.com">
                    <button id="goBtn">Go</button>
                </div>
            </div>
            <div class="quick-links">
                <span style="color:#64748b;">Quick access:</span>
                <a onclick="loadUrl('youtube.com')">📺 YouTube</a>
                <a onclick="loadUrl('google.com')">🔍 Google</a>
                <a onclick="loadUrl('reddit.com')">🤖 Reddit</a>
                <a onclick="loadUrl('github.com')">💻 GitHub</a>
                <a onclick="loadUrl('x.com')">🐦 X/Twitter</a>
                <a onclick="loadUrl('wikipedia.org')">📚 Wikipedia</a>
                <a onclick="loadUrl('example.com')">📄 Example</a>
            </div>
            <div class="viewport">
                <iframe id="proxyFrame" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation allow-downloads"></iframe>
            </div>

            <script>
                // History management
                let historyStack = [];
                let historyIndex = -1;
                
                const iframe = document.getElementById('proxyFrame');
                const urlInput = document.getElementById('urlInput');
                
                // Function to load any URL
                function loadUrl(url) {
                    if (!url) return;
                    
                    // Clean up the URL
                    url = url.trim();
                    if (!url.startsWith('http')) {
                        url = 'https://' + url;
                    }
                    
                    // Update input field
                    urlInput.value = url.replace('https://', '').replace('http://', '');
                    
                    // Load in iframe
                    const proxyUrl = '/proxy/' + encodeURIComponent(url);
                    console.log('Loading:', proxyUrl);
                    iframe.src = proxyUrl;
                    
                    // Update history
                    if (historyStack[historyIndex] !== url) {
                        historyStack = historyStack.slice(0, historyIndex + 1);
                        historyStack.push(url);
                        historyIndex = historyStack.length - 1;
                    }
                }
                
                // Navigation functions
                function goBack() {
                    if (historyIndex > 0) {
                        historyIndex--;
                        const url = historyStack[historyIndex];
                        urlInput.value = url.replace('https://', '');
                        iframe.src = '/proxy/' + encodeURIComponent(url);
                    }
                }
                
                function goForward() {
                    if (historyIndex < historyStack.length - 1) {
                        historyIndex++;
                        const url = historyStack[historyIndex];
                        urlInput.value = url.replace('https://', '');
                        iframe.src = '/proxy/' + encodeURIComponent(url);
                    }
                }
                
                // Event listeners
                document.getElementById('goBtn').onclick = () => {
                    const val = urlInput.value.trim();
                    if (val) loadUrl(val);
                };
                
                document.getElementById('backBtn').onclick = goBack;
                document.getElementById('forwardBtn').onclick = goForward;
                
                urlInput.onkeypress = (e) => {
                    if (e.key === 'Enter') {
                        const val = urlInput.value.trim();
                        if (val) loadUrl(val);
                    }
                };
                
                // Load default site
                loadUrl('youtube.com');
            </script>
        </body>
        </html>
    `);
});

// PROXY ENDPOINT - handles all website requests
app.get('/proxy/*', (req, res) => {
    let targetUrl = req.params[0];
    
    if (!targetUrl) {
        return res.status(400).send('No URL provided');
    }
    
    // Decode and fix URL
    targetUrl = decodeURIComponent(targetUrl);
    if (!targetUrl.startsWith('http')) {
        targetUrl = 'https://' + targetUrl;
    }
    
    console.log(`🌐 Proxying: ${targetUrl}`);
    
    // Create proxy with proper settings
    createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        onProxyReq: (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
        },
        onError: (err, req, res) => {
            console.error('Proxy error:', err.message);
            res.send(`
                <!DOCTYPE html>
                <html>
                <head><title>Proxy Error</title></head>
                <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #f1f5f9;">
                    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px;">
                        <h2 style="color: #dc2626;">⚠️ Cannot Load Website</h2>
                        <p style="margin: 20px 0;"><strong>${escapeHtml(targetUrl)}</strong></p>
                        <p style="color: #64748b;">Error: ${escapeHtml(err.message)}</p>
                        <hr style="margin: 20px 0;">
                        <p>💡 Try these alternatives that work great:</p>
                        <ul style="text-align: left; display: inline-block;">
                            <li><a href="/" onclick="window.location.href='/'">🏠 Back to Home</a></li>
                            <li>📺 youtube.com</li>
                            <li>🔍 google.com</li>
                            <li>🤖 reddit.com</li>
                        </ul>
                    </div>
                </body>
                </html>
            `);
        }
    })(req, res);
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
    console.log(`✅ Proxy server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});
