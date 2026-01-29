# Real-time Updates & Notifications Implementation

This document describes the real-time updates and notification system implemented for the admin panel.

## Files Created/Modified

### 1. Core Hook: `src/lib/hooks/useRealTimePoll.ts`
Custom React hook for polling data at regular intervals.

**Features:**
- Configurable polling interval (default: 30 seconds)
- Automatic data refresh
- Loading and error states
- Last update timestamp tracking
- Manual refresh capability
- Debouncing to prevent duplicate requests
- Cleanup on unmount

**Usage:**
```tsx
const { data, loading, error, lastUpdate, refetch, isPolling } = useRealTimePoll({
  fetchFunction: async () => {
    return await fetchData();
  },
  interval: 30000, // 30 seconds
  enabled: true,
  onSuccess: (data) => console.log('Data updated:', data),
  onError: (error) => console.error('Error:', error)
});
```

### 2. Enhanced Toast System: `src/lib/toast.ts`
Updated toast context and provider with improved functionality.

**Features:**
- Multiple toast types: success, error, warning, info
- Configurable duration
- Maximum toast limit
- Auto-dismiss with animation
- Queue management

**Usage:**
```tsx
import { useToast } from "@/lib/toast";

function MyComponent() {
  const { addToast, removeToast, clearToasts } = useToast();

  const handleSuccess = () => {
    addToast("Operation completed successfully!", "success", 5000);
  };

  return <button onClick={handleSuccess}>Click me</button>;
}
```

### 3. Improved Toast UI: `src/components/ui/Toast.tsx`
Enhanced toast component with better visual design.

**Features:**
- Gradient backgrounds for different toast types
- Animated icons
- Smooth entry/exit animations
- Hover effects
- Better accessibility
- Responsive design

### 4. Live Indicator Component: `src/components/ui/LiveIndicator.tsx`
Visual indicator showing real-time update status.

**Features:**
- Live/Offline status with pulsing indicator
- Last update timestamp
- Relative time display (e.g., "Just now", "30s ago", "5m ago")
- Manual refresh button
- Loading state for refresh
- Clean, modern UI

**Usage:**
```tsx
<LiveIndicator
  isPolling={isPolling}
  lastUpdate={lastUpdate}
  onRefresh={handleManualRefresh}
  refreshLoading={manualRefreshing}
  showLabel={true}
/>
```

### 5. WebSocket Preparation: `src/lib/websocket.ts`
Prepared WebSocket implementation for future real-time updates.

**Features:**
- Connection management
- Event listeners (on, off)
- Reconnect logic with exponential backoff
- Error handling
- Singleton pattern

**Note:** Currently commented out. To enable:
1. Set up a WebSocket server
2. Configure `WS_URL` environment variable
3. Uncomment the WebSocket client code
4. Update components to use WebSocket events

## Updated Components

### 1. Leads Page: `src/app/admin/leads/page.tsx`
- Integrated `useRealTimePoll` for automatic data refresh every 30s
- Added `LiveIndicator` component
- Replaced manual `fetchLeads` with hook
- Enhanced error handling

### 2. Campaigns Page: `src/app/admin/campaigns/page.tsx`
- Integrated `useRealTimePoll` for automatic data refresh every 30s
- Added `LiveIndicator` component
- Replaced manual `fetchData` with hook
- Updated campaign data fetching

### 3. Analytics Page: `src/app/admin/analytics/page.tsx`
- Integrated `useRealTimePoll` for automatic data refresh every 30s
- Added `LiveIndicator` component
- Replaced manual `fetchAnalytics` and `fetchCampaigns` with hook
- Combined data fetching for efficiency

## Benefits

1. **Real-time Data:** Automatic updates every 30 seconds keep data fresh
2. **User Feedback:** Visual indicators show when data is being updated
3. **Manual Control:** Users can refresh manually when needed
4. **Better UX:** Toast notifications provide clear feedback for all operations
5. **Performance:** Debouncing prevents unnecessary requests
6. **Future-Ready:** WebSocket code prepared for eventual real-time implementation
7. **Clean Code:** Modular, reusable components and hooks

## Future Enhancements

1. **WebSocket Integration:** Uncomment and configure WebSocket in `src/lib/websocket.ts`
2. **Customizable Intervals:** Allow users to set their preferred polling interval
3. **Offline Detection:** Add browser online/offline detection
4. **Optimistic UI Updates:** Show updates immediately, rollback on error
5. **Push Notifications:** Add browser push notification support
6. **Data Diffing:** Only update changed data points for better performance
