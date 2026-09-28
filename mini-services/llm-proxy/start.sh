#!/bin/bash
# Start the DealMind llm-proxy mini-service detached (survives the launching shell).
cd /home/z/my-project/mini-services/llm-proxy
(
  exec bun run dev
) > /tmp/llm-proxy.log 2>&1 &
PROXY_PID=$!
disown "$PROXY_PID" 2>/dev/null || true
unset PROXY_PID
echo "llm-proxy launched"
