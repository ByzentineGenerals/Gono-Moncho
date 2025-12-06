# Article Verification & Display Fix

## Issues Fixed

### 1. **Verification Status Staying "Pending"**
**Problem**: After clicking "Verify" in the Verifier Dashboard, the article status wasn't updating.

**Root Cause**:
- TypeScript type error: `addVerifierScore` expected `bigint` but received `number`
- This caused silent failures in the verification transaction

**Solution**:
- Fixed in `VerifierDashboard.tsx` line 118: Changed `args: [selectedArticle, verificationScore]` to `args: [selectedArticle, BigInt(verificationScore)]`

### 2. **Articles Not Appearing on Homepage After Verification**
**Problem**: Even after verification succeeded, articles didn't show up on the homepage.

**Root Causes**:
- ArticleContext wasn't properly polling localStorage for changes in the same tab
- Storage events don't fire within the same browser tab
- Contract response type mismatch (expected 4 fields, contract returns 6)

**Solutions**:
1. **Added polling mechanism** in `ArticleContext.tsx`:
   - Polls localStorage every 2 seconds
   - Compares verified article count to detect changes
   - Auto-refreshes when changes detected

2. **Fixed contract type mismatch**:
   - Updated response type from `[address, string, uint8, uint256]` (4 fields)
   - To correct type: `[address, string, uint256[], uint256[], uint8, uint256]` (6 fields)
   - Properly destructures: `reporter, arweaveHash, analyzerScores, verifierScores, status, credibilityScore`

3. **Enhanced logging** for debugging:
   - Added detailed console logs in verification flow
   - Shows verification status of each article
   - Logs when articles are filtered/displayed

## How It Works Now

### Publishing Flow:
```
1. User publishes article in Reporter Portal
   → Saves to localStorage with verificationStatus: 0 (PENDING)
   
2. Article appears in Verifier Dashboard

3. Verifier assigns score (1-10) and clicks "Submit Score"
   → Transaction sent to blockchain with BigInt(score)
   → localStorage updated: verificationStatus: 2 (HUMAN_VERIFIED)
   
4. ArticleContext detects change (within 2 seconds via polling)
   → Loads verified articles from localStorage
   → Displays on homepage
```

### Verification States:
- `0` = PENDING (not yet verified)
- `1` = AI_VERIFIED (still needs human verification)
- `2` = HUMAN_VERIFIED (✅ appears on homepage)
- `3` = DISPUTED (flagged as problematic)

## Testing

### Quick Test (Using Debug Page):
1. Navigate to `/en/debug` or `/bn/debug`
2. Click "Add Test Verified Article"
3. Article should instantly appear on homepage

### Full Workflow Test:
1. Go to Reporter Portal → Publish Article Tab
2. Fill in headline and content
3. Click "Publish Article"
4. Wait for "Article published successfully" toast
5. Switch to "Verify Tab" (if you're a verifier)
6. See your article in the pending list
7. Click "Verify", adjust score slider
8. Click "Submit Score"
9. Wait for transaction confirmation
10. Go to homepage - article appears within 2 seconds!

## Files Modified

### Core Fixes:
1. **`frontend/src/components/VerifierDashboard.tsx`**
   - Fixed bigint type error in `addVerifierScore`
   - Improved localStorage update logic with detailed logging
   - Immediate `refreshArticles()` call after verification

2. **`frontend/src/context/ArticleContext.tsx`**
   - Added 2-second polling for localStorage changes
   - Fixed contract response type (6 fields instead of 4)
   - Enhanced logging for verification status tracking
   - Proper handling of demo articles alongside blockchain articles

### New Files:
3. **`frontend/src/app/[locale]/debug/page.tsx`** (NEW)
   - Debug dashboard for testing
   - View localStorage data in real-time
   - Force refresh ArticleContext
   - Add test verified articles instantly

## Key Code Changes

### VerifierDashboard.tsx - Line 118:
```typescript
// BEFORE (broken):
args: [selectedArticle, verificationScore]

// AFTER (fixed):
args: [selectedArticle, BigInt(verificationScore)]
```

### ArticleContext.tsx - Polling Logic:
```typescript
// NEW: Poll every 2 seconds for changes
const pollInterval = setInterval(() => {
  const storedArticles = localStorage.getItem('demoArticles');
  if (storedArticles) {
    const parsed = JSON.parse(storedArticles);
    const verifiedCount = parsed.filter((a: any) => a.verificationStatus === 2).length;
    const currentVerifiedCount = articles.filter(a => a.category === "Demo").length;
    
    if (verifiedCount !== currentVerifiedCount) {
      console.log(`Detected change: ${currentVerifiedCount} -> ${verifiedCount} verified articles`);
      fetchArticlesFromChain();
    }
  }
}, 2000);
```

### ArticleContext.tsx - Contract Response:
```typescript
// BEFORE (incorrect type):
const [reporter, arweaveHash, statusRaw, credibilityScore] = response;

// AFTER (correct type with all 6 fields):
const [reporter, arweaveHash, analyzerScores, verifierScores, statusRaw, credibilityScore] = response;
```

## Debugging Tips

1. **Open Browser Console** to see detailed logs:
   - "=== VERIFICATION SUCCESS ===" when verification completes
   - "Detected change: X -> Y verified articles" when polling detects updates
   - "Verified demo articles to display: N" when loading articles

2. **Check localStorage** manually:
   ```javascript
   JSON.parse(localStorage.getItem('demoArticles'))
   ```

3. **Force refresh** ArticleContext:
   - Use the Debug page `/en/debug`
   - Click "Force Refresh ArticleContext"

4. **Verify transaction** on PolygonScan:
   - Click the transaction hash link in Verifier Dashboard
   - Confirm it succeeded on Polygon Amoy testnet

## Performance

- **Polling interval**: 2 seconds (configurable)
- **No excessive re-renders**: Only refreshes when verified count changes
- **Efficient filtering**: Uses strict equality check on `verificationStatus === 2`

## Next Steps (Optional Improvements)

1. **IndexedDB**: Replace localStorage for better performance with large datasets
2. **WebSocket**: Real-time updates without polling
3. **Optimistic UI**: Show article immediately on homepage before transaction confirms
4. **Pagination**: Load articles in batches for better performance
5. **Caching**: Cache Arweave metadata to reduce API calls

---

**Status**: ✅ All issues fixed and tested
**Date**: December 6, 2025
