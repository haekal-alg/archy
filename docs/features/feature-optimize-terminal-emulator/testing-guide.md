# Terminal Emulator Performance Testing Guide

**Version**: 1.0
**Date**: 2025-12-15
**Purpose**: Validate Phase 1 optimizations and benchmark performance improvements

---

## Quick Test Checklist

Use this checklist to quickly verify the optimizations are working:

- [ ] Terminal scrolling is smooth during high throughput
- [ ] No visible lag when typing in vim/nano
- [ ] `cat` large files completes quickly
- [ ] Memory usage stays stable during long sessions
- [ ] No crashes or freezes observed
- [ ] All terminal features still work (copy/paste, zoom, resize)

---

## Detailed Test Scenarios

### Test 1: Throughput & Scrolling Performance

**Purpose**: Verify that data buffering reduces IPC overhead and improves rendering speed.

**Steps**:
1. Connect to SSH server
2. Run: `cat /var/log/syslog` (or any file >1MB)
3. Observe scrolling behavior

**What to Look For**:
- ✅ **Good**: Smooth, continuous scrolling with no stutter
- ✅ **Good**: Completes in <2 seconds
- ❌ **Bad**: Choppy/jerky scrolling
- ❌ **Bad**: Takes >3 seconds

**Baseline (Before Optimization)**:
- Choppy scrolling
- 3-5 seconds to complete
- Visible frame drops

**Expected (After Optimization)**:
- Smooth scrolling
- 0.5-1 second to complete
- No visible lag

---

### Test 2: Interactive Response (vim/nano)

**Purpose**: Verify that input latency is acceptable for interactive applications.

**Steps**:
1. Connect to SSH server
2. Run: `vim test.txt` or `nano test.txt`
3. Type rapidly and use arrow keys to navigate
4. Pay attention to cursor responsiveness

**What to Look For**:
- ✅ **Good**: Cursor follows keystrokes immediately (<20ms perceived)
- ✅ **Good**: Arrow key navigation is smooth
- ✅ **Good**: Typing feels natural, no input buffering
- ❌ **Bad**: Visible delay between keystroke and display
- ❌ **Bad**: Cursor jumps or lags behind input

**Baseline (Before Optimization)**:
- 15-50ms input lag
- Occasionally choppy cursor movement

**Expected (After Optimization)**:
- 10-20ms input lag (barely perceptible)
- Smooth cursor movement

---

### Test 3: Stress Test (Continuous Output)

**Purpose**: Verify that memory usage stays stable and rendering doesn't degrade over time.

**Steps**:
1. Connect to SSH server
2. Run: `yes` (infinite output)
3. Let it run for 60 seconds
4. Monitor memory usage in Task Manager/Activity Monitor
5. Press Ctrl+C to stop

**What to Look For**:
- ✅ **Good**: Memory usage stabilizes around 50-80MB
- ✅ **Good**: Smooth rendering throughout
- ✅ **Good**: Terminal remains responsive (can still scroll, zoom)
- ❌ **Bad**: Memory grows continuously
- ❌ **Bad**: Terminal becomes sluggish after 30+ seconds
- ❌ **Bad**: Browser tab freezes or crashes

**Baseline (Before Optimization)**:
- Memory growth: 2-5 MB/sec
- Potential freeze/crash after 60+ seconds
- CPU usage: 50-80%

**Expected (After Optimization)**:
- Memory stabilizes at 60-100MB (scrollback limit working)
- No freeze or crash
- CPU usage: 20-40%

---

### Test 4: Real-World Usage Pattern

**Purpose**: Verify that optimizations improve day-to-day SSH usage.

**Steps**:
1. Connect to SSH server
2. Perform typical tasks:
   - Navigate directories (`cd`, `ls`)
   - View logs (`tail -f /var/log/syslog`)
   - Edit files (`vim`, `nano`)
   - Run commands with moderate output (`ps aux`, `top`)
   - Search files (`grep -r "pattern" .`)
3. Use terminal for 10-15 minutes continuously

**What to Look For**:
- ✅ **Good**: Everything feels noticeably faster and smoother
- ✅ **Good**: No lag or stuttering observed
- ✅ **Good**: All features work as expected
- ❌ **Bad**: Any regressions in functionality
- ❌ **Bad**: New bugs or crashes

**Subjective Rating**:
- Rate responsiveness: 1-10 (target: 7+)
- Rate smoothness: 1-10 (target: 8+)
- Compare to native terminal: How close does it feel?

---

## Performance Metrics

### How to Measure IPC Messages/sec

**Using Chrome DevTools**:
1. Open Archy
2. Press F12 (DevTools)
3. Go to Performance tab
4. Click Record
5. Perform test (e.g., `cat large.txt`)
6. Stop recording
7. Analyze IPC message frequency

**What to Look For**:
- **Before**: 500-1000 `ssh-data` IPC messages/sec
- **After**: 50-100 `ssh-data` IPC messages/sec
- **Improvement**: 90-95% reduction

### How to Measure Throughput

**Using time command**:
```bash
# On SSH server
time cat /var/log/syslog
```

**Record**:
- Real time (wall clock time)
- Compare before vs after

**Expected**:
- **Before**: 3-5 seconds
- **After**: 0.5-1 second
- **Improvement**: 3-5x faster

### How to Measure Input Latency

**Manual Method** (rough estimate):
1. Type a character in vim/nano
2. Count milliseconds until it appears on screen
3. Repeat 10 times, average

**Tools** (advanced):
- High-speed camera (120fps+) to measure frame delay
- Browser profiling tools

**Expected**:
- **Before**: 15-50ms
- **After**: 10-20ms
- **Improvement**: 25-50% reduction

### How to Measure CPU Usage

**Using Task Manager (Windows)**:
1. Open Task Manager
2. Find Archy process
3. Run stress test (`yes` command)
4. Monitor CPU % over 60 seconds

**Expected**:
- **Before**: 50-80% CPU during `yes`
- **After**: 20-40% CPU during `yes`
- **Improvement**: 40-60% reduction

### How to Measure Memory Usage

**Using Task Manager (Windows)**:
1. Open Task Manager
2. Find Archy process
3. Note initial memory
4. Run stress test for 60 seconds
5. Note final memory

**Expected**:
- **Before**: Growing 2-5 MB/sec, no cap
- **After**: Stabilizes at 60-100MB (scrollback limit)
- **Improvement**: Bounded memory usage

---

## Benchmarking Script

Save this as `benchmark.sh` on your SSH server:

```bash
#!/bin/bash

echo "=== Terminal Performance Benchmark ==="
echo ""

echo "Test 1: Throughput (large file cat)"
time cat /var/log/syslog 2>/dev/null || time cat /var/log/messages 2>/dev/null || echo "No log file found"
echo ""

echo "Test 2: Rapid output (1000 lines)"
time seq 1 1000
echo ""

echo "Test 3: Mixed content"
time find /usr -type f 2>/dev/null | head -1000
echo ""

echo "Benchmark complete!"
```

**Usage**:
```bash
chmod +x benchmark.sh
./benchmark.sh
```

**Interpret Results**:
- Record "real" time for each test
- Compare before vs after optimization
- Target: 3-5x improvement across all tests

---

## Regression Testing

Ensure these features still work correctly:

### Basic Functionality
- [ ] Can connect to SSH server
- [ ] Terminal displays output correctly
- [ ] Can type and send input
- [ ] Colors and formatting work (ANSI escape codes)
- [ ] Special keys work (arrow keys, Enter, Tab, Ctrl+C)

### Advanced Features
- [ ] Copy/paste (Ctrl+C / Ctrl+V)
- [ ] Terminal zoom (-, +, % buttons)
- [ ] Terminal resize (window resize, terminal resizes correctly)
- [ ] Multiple concurrent connections
- [ ] Connection retry after disconnect
- [ ] Latency display updates

### Edge Cases
- [ ] Very long lines (>1000 characters)
- [ ] Rapid input (typing very fast)
- [ ] Binary output (e.g., `cat /bin/bash`)
- [ ] UTF-8 characters (emojis, foreign languages)
- [ ] Tab completion (bash auto-complete)

---

## Common Issues & Solutions

### Issue: Buffering latency feels too high

**Symptoms**: Noticeable delay (>30ms) between input and display

**Solution**: Reduce `BUFFER_TIME_MS` in `src/main/main.ts`:
```typescript
const BUFFER_TIME_MS = 8; // Was 16
```

### Issue: Memory still growing during stress test

**Symptoms**: Memory usage increases continuously beyond 100MB

**Solution**: Reduce scrollback in `src/renderer/components/TerminalEmulator.tsx`:
```typescript
scrollback: 5000, // Was 10000
```

### Issue: Scrolling is choppy on high DPI displays

**Symptoms**: Stuttering during fast scrolling despite optimizations

**Solution**: Try WebGL renderer (requires additional package):
```bash
npm install @xterm/addon-webgl
```

Then in `TerminalEmulator.tsx`:
```typescript
import { WebglAddon } from '@xterm/addon-webgl';

// After loading other addons:
const webglAddon = new WebglAddon();
terminal.loadAddon(webglAddon);
```

### Issue: Terminal feels less responsive than before

**Symptoms**: Actions feel delayed or sluggish

**Solution**: Revert optimizations and report issue. May indicate:
- Buffer time too high
- requestAnimationFrame timing issue
- Browser/GPU compatibility problem

---

## Comparison with Native Terminals

To properly evaluate Archy's performance, compare side-by-side:

**Setup**:
1. Open native terminal (Windows Terminal, iTerm2, etc.)
2. SSH to same server
3. Open Archy, SSH to same server
4. Run identical tests in both

**Comparison Points**:
- Scrolling smoothness during `cat large.txt`
- Input lag in vim/nano
- Overall "feel" and responsiveness
- Memory usage after 30 min session

**Goal**:
- **Before Optimization**: 10-30x slower than native
- **After Phase 1**: 2-3x slower than native (acceptable!)
- **After Phase 2-3**: <20% slower than native (near-native!)

---

## Reporting Results

When reporting test results, include:

1. **System Info**:
   - OS: Windows/Mac/Linux
   - CPU: Model and speed
   - RAM: Amount
   - GPU: If relevant

2. **Archy Version**:
   - Commit hash or version number
   - Which phase implemented (1, 2, or 3)

3. **Test Results**:
   - Which tests performed
   - Measurements taken
   - Before vs after comparisons
   - Screenshots/videos if applicable

4. **Subjective Feedback**:
   - How does it feel?
   - Better/worse/same?
   - Any unexpected behavior?

**Template**:
```
## Performance Test Results

**System**: Windows 11, Intel i7-9700K, 16GB RAM
**Archy**: v1.1.0, Phase 1 optimizations
**Date**: 2025-12-15

### Test 1: Throughput
- Before: 4.2 seconds
- After: 0.8 seconds
- Improvement: 5.25x

### Test 2: Interactive (vim)
- Before: Laggy, 20-40ms input delay
- After: Smooth, <15ms input delay
- Improvement: Noticeable improvement

### Test 3: Stress Test
- Before: Memory grew to 300MB, terminal froze
- After: Memory stable at 75MB, smooth throughout
- Improvement: Huge improvement

### Overall Impression
Terminal feels much closer to native. Scrolling is smooth, no more stuttering.
Very satisfied with improvements. Rating: 9/10

### Issues
None observed.
```

---

## Next Steps After Phase 1

Once Phase 1 is validated:

1. **Monitor Production Usage**:
   - Collect user feedback
   - Watch for bug reports
   - Monitor performance metrics

2. **Consider Phase 2** (if needed):
   - Implement flow control/backpressure
   - Adds 20-30% improvement under load
   - More complex, only needed if issues remain

3. **Consider Phase 3** (if needed):
   - Test WebGL renderer
   - Explore SharedArrayBuffer
   - Adds 2-3x improvement
   - High complexity, only if pursuing near-native performance

---

## Conclusion

Successful validation of Phase 1 means:
- ✅ Measurable performance improvement (3-5x)
- ✅ No functionality regressions
- ✅ No new bugs introduced
- ✅ User satisfaction improved
- ✅ Terminal is "good enough" for production use

If all criteria met, Phase 1 is complete and successful!

---

**Document Version**: 1.0
**Last Updated**: 2025-12-15
