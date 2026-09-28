#!/bin/bash
# Start the REAL local Hindsight daemon (detached, survives the launching shell).
cd /home/z/my-project/mini-services/hindsight-daemon
(
  exec bun run dev
) > /tmp/hindsight-daemon.log 2>&1 &
HD_PID=$!
disown "$HD_PID" 2>/dev/null || true
unset HD_PID
echo "hindsight-daemon launched"
