# SL/TP Drag and Drop - Core Issues Found

**File**: `/frontend/src/utils/TradeLineManager.js`  
**Version**: v7.70  
**Analysis Date**: 2026-03-26

---

## 🔴 CRITICAL ISSUES

### **ISSUE #1: Missing Profit/Loss Display During Drag**
**Severity**: CRITICAL  
**Location**: `_onNativeMove()` lines 102-132  
**Problem**:
- When dragging SL/TP lines, NO profit/loss box is shown
- Exness shows a floating box with P&L, cost, margin impact during drag
- Current code only shows "NEW SL/TP" text label, missing all calculations
- User expects to see:
  - Profit/Loss amount
  - Currency
  - Percentage change
  - Margin utilization impact

**Current Code**:
```javascript
this._updateShape(tvId, price, `NEW ${ghostType.toUpperCase()}`);
```

**Expected (per Exness)**: Should calculate and display:
```
+125.50 USD (5.2%)
or
-89.30 USD (-3.8%)
```

---

### **ISSUE #2: Ghost Type String Matching Bug**
**Severity**: CRITICAL  
**Location**: `_onNativeStop()` line 182  
**Problem**:
```javascript
if (meta.type.includes('ghost')) {
    this.activeDragId = null;
    return;
}
```

**Bug**:
- Shape types are created as: `ghost-sl`, `ghost-tp`, `entry-ghost`
- The `.includes('ghost')` check catches ALL ghost shapes
- BUT: When user releases drag on entry line (which creates a ghost), the check BLOCKS the commit
- This means dragging entry line to create SL/TP via ghost visualization does NOT work properly

**Flow Breakdown**:
1. User drags ENTRY line → Creates `entry-ghost` and `ghost-sl`/`ghost-tp`
2. User releases → `meta.type` could be ANY of these
3. If caught by `.includes('ghost')` early, the commit never happens
4. SL/TP never gets saved

---

### **ISSUE #3: Race Condition in Drag Event Sequencing**
**Severity**: HIGH  
**Location**: Multiple setTimeout calls in `_onNativeMove()` and `_onNativeStop()`  
**Problem**:
```javascript
// In _onNativeMove (line 131)
this.isUpdatingGhost = true;
try {
    await this._updateSpawnGhost(meta.tradeId, ghostType, price);
} finally {
    this.isUpdatingGhost = false;
}

// But immediately after (line 127):
this._updateShape(tvId, price, `NEW ${ghostType.toUpperCase()}`);
```

**Issues**:
- `isUpdatingGhost` flag doesn't prevent mouseMove from being called multiple times
- Multiple async `_updateSpawnGhost` calls can stack up
- `_updateShape` is called sync but depends on shape that might not exist yet
- Rapid mouse movements can create/destroy ghost shapes chaotically

**Symptom**: Lines flicker randomly, ghosts disappear unexpectedly mid-drag

---

### **ISSUE #4: Incorrect SL/TP Determination Logic (Sell Side)**
**Severity**: HIGH  
**Location**: `_onNativeMove()` line 126 and `_onNativeStop()` line 200  
**Problem**:

```javascript
// For BUY positions
const isBuy = side.includes('buy') || side.includes('long');
let ghostType = isBuy ? (price > realEntry ? 'tp' : 'sl') : (price > realEntry ? 'sl' : 'tp');
```

**Bug in Sell Logic**: 
- For SELL: If price > entry → shows as TP (correct)
- For SELL: If price < entry → shows as SL (correct)
- BUT in `_onNativeStop()` line 200, the logic is DIFFERENT:

```javascript
const t = isBuy ? (price > entryPrice ? 'tp' : 'sl') : (price < entryPrice ? 'tp' : 'sl');
```

Here for SELL: If price < entry → TP (WRONG! Should be SL)

**This creates inconsistency**: Visual ghost shows one thing, but commit decides differently

---

### **ISSUE #5: Markup Inconsistency Between Display and Commit**
**Severity**: HIGH  
**Location**: `_syncTradeShapes()` line 257 vs `_commitTrade()` line 374  
**Problem**:

When syncing from server, markup is applied:
```javascript
const entry = Number(trade.openPrice || trade.price) - markup;
const sl = Number(trade.stopLoss || trade.sl) > 0 ? Number(trade.stopLoss || trade.sl) - markup : null;
```

But when committing the drag:
```javascript
const rawPrice = roundedPrice + markup; // Translate visual positioning back
```

**Issues**:
- Markup direction is inconsistent (subtracting in sync, adding in commit)
- If markup changes mid-drag, visual line and actual SL/TP don't match
- Admin spreads loaded async, so old markup values could be used during drag

---

### **ISSUE #6: Entry Line Drag Creates Persistent Ghost Lines**
**Severity**: MEDIUM  
**Location**: `_onNativeMove()` lines 115-120  
**Problem**:

When dragging entry, code creates `entryGhost`:
```javascript
if (!this.lines[tid].entryGhost) {
    const ghostId = await this._createShape(meta.tradeId, `entry-ghost`, realEntry, { ... });
    if (ghostId) this.lines[tid].entryGhost = { tvId: ghostId.tvId, price: realEntry };
}
```

**But** in `_onNativeStop()` line 186-189, it's deleted:
```javascript
if (this.lines[tid]?.entryGhost) {
    this._destroyShape(this.lines[tid].entryGhost.tvId);
    delete this.lines[tid].entryGhost;
}
```

**Problem**: 
- If drag is interrupted (network issue, click elsewhere), ghost lines remain on chart
- User sees phantom blue line that can't be removed
- Multiple drags without completion can stack ghost lines

---

### **ISSUE #7: No Validation of Price Before Commit**
**Severity**: MEDIUM  
**Location**: `_commitTrade()` lines 350-366  
**Problem**:

Code accepts ANY price from drag without validation:
```javascript
const roundedPrice = parseFloat(price.toFixed(decimals));
// ... no checks for:
// - SL being on wrong side of entry (buy: SL should be < entry, not > entry)
// - TP being on wrong side of entry (buy: TP should be > entry, not < entry)
// - SL = TP (no spread difference)
// - Price too close to entry (no minimum distance)
```

**Result**: User can drag SL above TP (inverted), system sends invalid values to backend

---

### **ISSUE #8: Sync Lock Causes Visual Jump on Release**
**Severity**: MEDIUM  
**Location**: `_commitTrade()` line 391  
**Problem**:

```javascript
this.syncLockUntil = Date.now() + this.syncLockDuration; // 1200ms lock
```

Then in `syncTrades()` line 235:
```javascript
if (Date.now() < this.syncLockUntil) return;
```

**Issue**:
- After drag release, system locks for 1.2 seconds
- During this time, server might send OLD price values (if update is slow)
- When lock expires, lines suddenly jump to whatever server sent
- If server is still processing, visual "snap back" occurs

**Symptom**: SL/TP line position confirmed, then jumps back to old position after 1.2s

---

### **ISSUE #9: Ghost Text Updates But Shape Doesn't Exist Yet**
**Severity**: MEDIUM  
**Location**: `_onNativeMove()` line 127  
**Problem**:

```javascript
this._updateShape(tvId, price, `NEW ${ghostType.toUpperCase()}`);
// ...
this.isUpdatingGhost = true;
try {
    await this._updateSpawnGhost(meta.tradeId, ghostType, price); // Creates actual shape
}
```

**Order is wrong**: 
- Text is updated on the dragged shape (entry line)
- Ghost shape creation happens AFTER
- If shape doesn't exist yet, setText fails silently
- Ghost might render without proper styling

---

### **ISSUE #10: No Handling for Simultaneous SL/TP Drag**
**Severity**: LOW  
**Location**: Event handler line 95  
**Problem**:

Code assumes only one active drag at a time:
```javascript
this.activeDragId = meta.tradeId;
```

**But nothing prevents**:
- User dragging SL line while TP is still being dragged
- Multiple trades being dragged simultaneously
- Entry + SL being dragged at same time

Result: Race conditions in `_onNativeStop()` - which trade wins?

---

## 🟡 WARNING / DESIGN ISSUES

### **DESIGN ISSUE #1: No Undo/Cancel Confirmation**
- No way for user to cancel drag mid-operation
- If user drags wrong direction, they're committed once released
- Exness shows a preview that user can close without committing

### **DESIGN ISSUE #2: Missing Visual Feedback**
- No cursor change when hovering over draggable lines
- No "snapping" to round prices
- No highlight showing drag boundaries
- No visual feedback line showing where price will snap

### **DESIGN ISSUE #3: No Minimum Spread Validation**
- System allows SL and TP to be set with zero spread
- Could create invalid trade states

---

## 📋 PRIORITY FIX ORDER

1. **ISSUE #2** (Ghost type check) - FIX FIRST - Blocks all entry drag functionality
2. **ISSUE #4** (SL/TP logic inconsistency) - Critical for SELL trades  
3. **ISSUE #1** (Missing P&L display) - Core feature missing
4. **ISSUE #3** (Race conditions) - Causes flickering
5. **ISSUE #5** (Markup inconsistency) - Pricing accuracy
6. **ISSUE #7** (No validation) - Prevent invalid states
7. **ISSUE #6** (Ghost cleanup) - UI pollution
8. **ISSUE #8** (Sync lock jump) - UX polish
9. **ISSUE #9** (Shape update order) - Reliability
10. **ISSUE #10** (Multi-drag) - Edge case handling

---

## 🧪 TESTING CHECKLIST

- [ ] Drag entry line on BUY trade - SL/TP determination correct
- [ ] Drag entry line on SELL trade - SL shows below entry, TP above
- [ ] Drag SL line directly - updates without creating ghosts
- [ ] Drag TP line directly - updates without creating ghosts  
- [ ] Cancel drag halfway - no ghost lines left on chart
- [ ] Rapid multiple drags - no flickering or ghost accumulation
- [ ] Drag to invalid position (SL > TP) - rejected with warning
- [ ] Network slow during drag - line locks, doesn't jump back
- [ ] Switch symbols during drag - old trade lines properly cleaned
- [ ] P&L box shows during drag - profit/loss visible in real time

---

## 📝 NOTES FOR IMPLEMENTATION

- Keep existing line visuals (blue entry, red SL, green TP)
- Add FLOATING P&L BOX during drag (not on line label)
- Add validation before commit
- Implement proper async sequencing with locks
- Test with slow 3G network (simulate delays)
