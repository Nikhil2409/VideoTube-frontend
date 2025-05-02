import { configureStore } from '@reduxjs/toolkit';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    subscription: subscriptionReducer,
  },
});