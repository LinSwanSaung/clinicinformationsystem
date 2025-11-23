# Performance Optimizations - API Call Reduction

## Problem
The application was making excessive API calls, causing:
- Database request quota exceeded (10k+ requests)
- High server load
- Poor performance
- Unnecessary network traffic

## Root Causes Identified

### 1. **Too Frequent Polling Intervals**
- Queue polling: **10 seconds** (too aggressive)
- Nurse queue: **15 seconds** (too aggressive)
- Multiple components polling simultaneously

### 2. **Individual Vitals API Calls**
- Each patient's vitals fetched separately
- If 10 patients = 10 separate `/api/vitals/visit/{id}` calls
- Happening every 10-15 seconds
- **No caching** - always fetched fresh

### 3. **Duplicate Polling Mechanisms**
- React Query polling (15s)
- setInterval polling (10s)
- Both running simultaneously for same data

### 4. **No Smart Caching**
- Vitals fetched even for completed patients (won't change)
- No staleTime optimization
- Refetching unchanged data

## Optimizations Applied

### 1. Increased Polling Intervals ✅
**Before:**
- QUEUE: 10 seconds
- NURSE_QUEUE: 15 seconds
- DASHBOARD: 60 seconds

**After:**
- QUEUE: **30 seconds** (3x reduction)
- NURSE_QUEUE: **30 seconds** (2x reduction)
- DASHBOARD: **60 seconds** (unchanged)

**Impact**: Reduces API calls by 50-66%

### 2. Skip Vitals for Completed Patients ✅
**Before:**
- Fetched vitals for ALL patients (including completed)

**After:**
- Skip vitals fetch for `completed` and `missed` status patients
- Only fetch vitals for active patients (`waiting`, `called`, `serving`)

**Impact**: If 50% of patients are completed, reduces vitals API calls by 50%

### 3. Improved React Query Caching ✅
**Before:**
- `staleTime: 30_000` (30 seconds)
- `refetchIntervalInBackground: true` (polls even in background tabs)

**After:**
- `staleTime: 60_000` (60 seconds) - data considered fresh longer
- `cacheTime: 5 * 60 * 1000` (5 minutes) - keep cached data longer
- `refetchIntervalInBackground: false` - don't poll in background tabs

**Impact**: Reduces unnecessary refetches, especially when multiple tabs open

### 4. Optimized Invoice Polling ✅
**Before:**
- Pending invoices: 10 seconds
- Completed invoices: 10 seconds

**After:**
- Pending invoices: **30 seconds** (more active, needs faster updates)
- Completed invoices: **60 seconds** (less likely to change)

**Impact**: Reduces completed invoice polling by 50%

## Expected Results

### API Call Reduction
**Before (per minute):**
- Queue status: 6 calls/min (10s interval)
- Nurse queue: 4 calls/min (15s interval)
- Vitals (10 patients): 60 calls/min (10s × 10 patients)
- Invoices: 6 calls/min (10s interval)
- **Total: ~76 calls/minute = 4,560 calls/hour**

**After (per minute):**
- Queue status: 2 calls/min (30s interval)
- Nurse queue: 2 calls/min (30s interval)
- Vitals (5 active patients): 10 calls/min (30s × 5 active, skip 5 completed)
- Invoices: 2-3 calls/min (30-60s intervals)
- **Total: ~16 calls/minute = 960 calls/hour**

**Reduction: ~79% fewer API calls** 🎉

### Database Load Reduction
- **Before**: 10,000+ requests/day
- **After**: ~2,000-3,000 requests/day (estimated)
- **Savings**: 70-80% reduction

## Files Modified

1. `frontend/src/constants/polling.js`
   - Increased polling intervals
   - Added documentation

2. `frontend/src/pages/role-dashboards/NurseDashboard.jsx`
   - Skip vitals for completed/missed patients
   - Updated polling intervals
   - Applied optimization to all refresh handlers

3. `frontend/src/pages/role-dashboards/CashierDashboard.jsx`
   - Optimized invoice polling intervals

4. `frontend/src/main.jsx`
   - Increased React Query staleTime
   - Added cacheTime
   - Disabled background polling

5. `frontend/src/features/billing/hooks/useInvoices.js`
   - Increased staleTime
   - Disabled background polling

## Monitoring Recommendations

1. **Monitor Database Requests**
   - Track daily request count
   - Alert if exceeding 5,000 requests/day

2. **Monitor API Response Times**
   - Ensure optimizations don't cause stale data issues
   - Watch for user complaints about delayed updates

3. **Consider Further Optimizations**
   - WebSockets for real-time updates (eliminates polling)
   - Server-Sent Events (SSE) for one-way updates
   - Batch API endpoints (fetch multiple vitals in one call)

## Future Improvements

1. **Batch Vitals API**
   - Create endpoint: `POST /api/vitals/batch` 
   - Accept array of visit IDs, return all vitals in one call
   - Reduces 10 calls → 1 call

2. **WebSocket Integration**
   - Real-time updates instead of polling
   - Push notifications for status changes
   - Zero polling overhead

3. **Smart Polling**
   - Increase interval when no changes detected
   - Decrease interval when activity detected
   - Pause polling when tab is inactive

4. **Request Deduplication**
   - Prevent multiple components from fetching same data
   - Share React Query cache across components

## Conclusion

These optimizations should reduce API calls by **70-80%**, bringing database requests from 10k+ down to 2-3k per day. The application will still feel responsive with 30-second polling intervals, which is acceptable for most healthcare workflows.

