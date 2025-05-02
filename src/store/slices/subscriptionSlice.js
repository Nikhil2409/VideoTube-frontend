import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_SERVER_URL || "http://localhost:3900",
  withCredentials: true,
});

// Async thunk for toggling subscription
export const toggleSubscription = createAsyncThunk(
  'subscription/toggle',
  async ({ ownerId, accessToken }, { rejectWithValue, getState }) => {
    try {
      // Get current subscription state for more reliable toggling
      const state = getState();
      const currentStatus = state.subscription.subscriptionStatus[ownerId] || { 
        isSubscribed: false, 
        subscribersCount: 0 
      };

      // Toggle the subscription
      const response = await api.post(`/api/v1/subscriptions/c/${ownerId}`, {}, {
        headers: { 
          Authorization: `Bearer ${accessToken}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      // If we get explicit data from the server, use that
      const serverStatus = response.data.data || {};
      
      return { 
        ownerId,
        // Use server values if available, otherwise invert current status
        isSubscribed: serverStatus.isSubscribed !== undefined 
          ? serverStatus.isSubscribed 
          : !currentStatus.isSubscribed,
        subscribersCount: serverStatus.subscribersCount !== undefined
          ? serverStatus.subscribersCount
          : (currentStatus.isSubscribed 
              ? Math.max(0, currentStatus.subscribersCount - 1) 
              : currentStatus.subscribersCount + 1),
        success: true
      };
    } catch (error) {
      console.error("Error toggling subscription:", error);
      return rejectWithValue({ 
        ownerId,
        error: error.response?.data?.message || 'Failed to update subscription status'
      });
    }
  }
);

// Async thunk for fetching subscriptions list
export const fetchSubscriptions = createAsyncThunk(
  'subscription/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/v1/subscriptions');
      return { 
        users: response.data.data?.users || [] 
      };
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      return rejectWithValue({ 
        error: error.response?.data?.message || 'Failed to fetch subscriptions'
      });
    }
  }
);

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: {
    // Map of channel IDs to subscription status
    subscriptionStatus: {},
    // List of subscribed channels for sidebar
    subscribedChannels: [],
    loading: false,
    error: null
  },
  reducers: {
    // Set subscription status for a specific channel
    setSubscriptionStatus: (state, action) => {
      const { ownerId, isSubscribed, subscribersCount } = action.payload;
      
      if (!ownerId) return; // Guard against null/undefined owner
      
      // Only update if values are provided
      if (isSubscribed !== undefined || subscribersCount !== undefined) {
        // Get current state or create new entry
        const current = state.subscriptionStatus[ownerId] || { 
          isSubscribed: false, 
          subscribersCount: 0 
        };
        
        state.subscriptionStatus[ownerId] = {
          isSubscribed: isSubscribed !== undefined ? isSubscribed : current.isSubscribed,
          subscribersCount: subscribersCount !== undefined ? subscribersCount : current.subscribersCount
        };
        
        // Log for debugging
        console.log(`Redux setSubscriptionStatus: ${ownerId}`, state.subscriptionStatus[ownerId]);
      }
    },
    // Clear all subscription data (e.g., on logout)
    clearSubscriptions: (state) => {
      state.subscriptionStatus = {};
      state.subscribedChannels = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Toggle subscription
      .addCase(toggleSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleSubscription.fulfilled, (state, action) => {
        const { ownerId, isSubscribed, subscribersCount } = action.payload;
        
        if (!ownerId) {
          state.loading = false;
          return;
        }
        
        // Update subscription status with new values from server
        state.subscriptionStatus[ownerId] = {
          isSubscribed,
          subscribersCount
        };
        
        // Update subscribedChannels list
        if (isSubscribed) {
          // Find if the channel is already in the list
          const existingIndex = state.subscribedChannels.findIndex(
            channel => channel.id === ownerId
          );
          if (existingIndex === -1) {
            // Add to the list if not found
            state.subscribedChannels.push({ id: ownerId });
          }
        } else {
          // Remove from subscribed channels
          state.subscribedChannels = state.subscribedChannels.filter(
            channel => channel.id !== ownerId
          );
        }
        
        // Log for debugging
        console.log(`Redux toggleSubscription fulfilled: ${ownerId}`, {
          newStatus: state.subscriptionStatus[ownerId],
          channelsList: state.subscribedChannels
        });
        
        state.loading = false;
      })
      .addCase(toggleSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to toggle subscription';
        
        // Log for debugging
        console.error(`Redux toggleSubscription rejected: ${action.payload?.ownerId}`, state.error);
      })
      
      // Fetch subscriptions list
      .addCase(fetchSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.subscribedChannels = action.payload.users || [];
        state.loading = false;
        
        // Log for debugging
        console.log('Redux fetchSubscriptions fulfilled:', state.subscribedChannels);
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch subscriptions';
        
        // Log for debugging
        console.error('Redux fetchSubscriptions rejected:', state.error);
      });
  }
});

export const { setSubscriptionStatus, clearSubscriptions } = subscriptionSlice.actions;

// Selectors
export const selectSubscriptionStatus = (state, ownerId) => 
  state.subscription.subscriptionStatus[ownerId] || { isSubscribed: false, subscribersCount: 0 };

export const selectSubscribedChannels = (state) => 
  state.subscription.subscribedChannels;

export const selectSubscriptionLoading = (state) => 
  state.subscription.loading;

export default subscriptionSlice.reducer;