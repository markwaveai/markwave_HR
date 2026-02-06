# Leave & Attendance Page Updates - CORRECTED

## Summary
Updated the application to display leave balances correctly across different pages:
- **Dashboard Leave Balance Card**: Shows ALL leave types (with zero for non-allocated)
- **Leave & Attendance Page**: Shows ONLY allocated leave types
- **Apply Leave Modal**: Shows ONLY allocated leave types

## Changes Made

### 1. **Dashboard LeaveBalanceCard.jsx** (`c:\MarkwaveHR\keka_markwave\web\src\components\Dashboard\LeaveBalanceCard.jsx`)

#### Display All Leave Types
- **Removed filtering** that was hiding non-allocated leave types
- Now displays ALL 8 leave types (CL, SL, EL, SCL, PL, BL, LL, CO)
- Non-allocated leave types show **0** in the circular progress indicator
- Provides complete visibility of all available leave types in the system

### 2. **LeaveAttendance.jsx** (`c:\MarkwaveHR\keka_markwave\web\src\components\LeaveAttendance.jsx`)

#### Show Only Allocated Leave Types
- **Modified `calculateBalances()` function** to filter out non-allocated leave types
- Only includes leave types returned by the API (with `allocated_days > 0`)
- For allocated leave types:
  - `consumed` = sum of approved/pending leaves from history
  - `available` = remaining balance from API
  - `total` = available + consumed
- Removed the else block that was adding zero-balance entries

#### Default Leave Type Selection
- Simplified `useEffect` hook since balances array only contains allocated types
- Automatically sets default to the first allocated leave type
- No need to filter since all items in balances are already allocated

#### Modal Props
- Passes `balances` (only allocated types) and `LEAVE_TYPES` to `ApplyLeaveModal`

### 3. **ApplyLeaveModal.jsx** (`c:\MarkwaveHR\keka_markwave\web\src\components\LeaveAttendance\ApplyLeaveModal.jsx`)

#### Show Only Allocated Leave Types
- Displays only allocated leave types in the dropdown (from `balances` prop)
- Removed disabled options and availability info
- Clean, simple dropdown showing only selectable options
- LWP (Leave Without Pay) is always available as a fallback option

### 4. **LeaveBalanceGrid.jsx** (`c:\MarkwaveHR\keka_markwave\web\src\components\LeaveAttendance\LeaveBalanceGrid.jsx`)

#### Simplified Progress Bar
- Removed conditional check for zero total
- Since only allocated leaves are passed to this component, all items have `total > 0`
- Always displays the progress bar without "Not allocated" message

## Visual Behavior

### Dashboard Leave Balance Card
**Shows ALL 8 leave types:**
- Casual: **12** (allocated) ✓
- Sick: **9** (allocated) ✓
- Earned: **0** (not allocated)
- Special: **0** (not allocated)
- Bereavement: **5** (allocated) ✓
- Paternity: **0** (not allocated)
- Long: **0** (not allocated)
- Comp Off: **0** (not allocated)

### Leave & Attendance Page
**Shows ONLY allocated leave types:**
- Casual Leave: 12 days available ✓
- Sick Leave: 9 days available ✓
- Bereavement Leave: 5 days available ✓

### Apply Leave Modal Dropdown
**Shows ONLY allocated leave types:**
```
CASUAL LEAVE                 ✓ Selectable
SICK LEAVE                   ✓ Selectable
BEREAVEMENT LEAVE            ✓ Selectable
LEAVE WITHOUT PAY            ✓ Always Available
```

## Backend API Reference

The backend endpoint `/api/leaves/balance/{employee_id}/` returns:
```json
{
  "cl": 12.0,   // remaining Casual Leave days
  "sl": 9.0,    // remaining Sick Leave days
  "bl": 5.0,    // remaining Bereavement Leave days
  // ... only leave types with allocated_days > 0
}
```

**Frontend behavior:**
- **Dashboard**: Shows all leave types, uses 0 for types not in API response
- **Leave & Attendance**: Shows only leave types present in API response
- **Apply Leave Modal**: Shows only leave types present in API response

## Benefits

1. **Dashboard Visibility**: Users see all leave types that exist in the system at a glance
2. **Focused Leave Management**: Leave & Attendance page shows only relevant, allocated leave types
3. **Clean Application Form**: Modal dropdown only shows selectable options
4. **No Confusion**: Users can't select leave types they don't have
5. **Accurate Balances**: All balances come from the authoritative backend API
6. **Better UX**: Different contexts show appropriate levels of detail

## Example Scenarios

### Scenario 1: New Employee (CL and SL only)
- **Dashboard**: Shows all 8 types (CL=12, SL=9, others=0)
- **Leave & Attendance**: Shows 2 cards (CL, SL)
- **Modal Dropdown**: 3 options (CL, SL, LWP)

### Scenario 2: Senior Employee (All leaves allocated)
- **Dashboard**: Shows all 8 types with actual balances
- **Leave & Attendance**: Shows all 8 cards with actual balances
- **Modal Dropdown**: 9 options (all 8 types + LWP)

### Scenario 3: Mid-level Employee (CL, SL, EL, BL)
- **Dashboard**: Shows all 8 types (4 with balances, 4 with zero)
- **Leave & Attendance**: Shows 4 cards (CL, SL, EL, BL)
- **Modal Dropdown**: 5 options (CL, SL, EL, BL, LWP)

## Testing Recommendations

1. ✅ Test Dashboard with employees having different allocations
2. ✅ Verify Dashboard shows ALL 8 leave types
3. ✅ Confirm non-allocated types show 0 in Dashboard
4. ✅ Verify Leave & Attendance page shows ONLY allocated types
5. ✅ Check that Apply Leave modal shows ONLY allocated types + LWP
6. ✅ Ensure balances match backend calculations
7. ✅ Verify default leave type is set correctly in modal

## Files Modified

1. ✅ `Dashboard/LeaveBalanceCard.jsx` - Show all leave types
2. ✅ `LeaveAttendance.jsx` - Show only allocated leave types
3. ✅ `LeaveAttendance/ApplyLeaveModal.jsx` - Show only allocated leave types
4. ✅ `LeaveAttendance/LeaveBalanceGrid.jsx` - Simplified (no zero-balance handling)
