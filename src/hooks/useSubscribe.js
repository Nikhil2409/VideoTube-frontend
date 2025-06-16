import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  toggleSubscription, 
  selectSubscriptionStatus,
  setSubscriptionStatus
} from '../store/slices/subscriptionSlice';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to handle subscription logic across components
 * @param {Object} owner - Channel owner object with id field
 * @param {Number} initialSubscribersCount - Initial subscribers count
 * @param {Boolean} initialIsSubscribed - Initial subscription status
 */
export const useSubscribe = (owner, initialSubscribersCount = 0, initialIsSubscribed = false) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  // Get the owner ID safely
  const ownerId = owner?.id;
  
  // Get subscription status from Redux store with memoized selector
  const subscriptionStatus = useSelector(state => 
    selectSubscriptionStatus(state, ownerId)
  );
  
  // Use local state to ensure UI updates properly
  const [localIsSubscribed, setLocalIsSubscribed] = useState(initialIsSubscribed);
  const [localSubscribersCount, setLocalSubscribersCount] = useState(initialSubscribersCount);
  
  // Initialize subscription status in Redux if not already set
  useEffect(() => {
    if (ownerId) {
      // Only update Redux if the initial values differ from current values
      if (initialIsSubscribed !== undefined || initialSubscribersCount !== undefined) {
        dispatch(setSubscriptionStatus({
          ownerId,
          isSubscribed: initialIsSubscribed,
          subscribersCount: initialSubscribersCount
        }));
      }
    }
  }, [ownerId, initialIsSubscribed, initialSubscribersCount, dispatch]);
  
  // Update local state when Redux state changes
  useEffect(() => {
    if (subscriptionStatus.isSubscribed !== undefined) {
      setLocalIsSubscribed(subscriptionStatus.isSubscribed);
    }
    if (subscriptionStatus.subscribersCount !== undefined) {
      setLocalSubscribersCount(subscriptionStatus.subscribersCount);
    }
  }, [subscriptionStatus.isSubscribed, subscriptionStatus.subscribersCount]);
  
  // Debug state changes
  useEffect(() => {
    console.log(`useSubscribe Hook for ${ownerId}: `, {
      reduxState: subscriptionStatus,
      localState: { isSubscribed: localIsSubscribed, subscribersCount: localSubscribersCount }
    });
  }, [ownerId, subscriptionStatus, localIsSubscribed, localSubscribersCount]);
  
  const handleSubscribe = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    if (!ownerId || isSubscribing) return;
    
    setIsSubscribing(true);
    
    // Immediately update local state for better UI response
    setLocalIsSubscribed(!localIsSubscribed);
    setLocalSubscribersCount(prev => 
      !localIsSubscribed ? prev + 1 : Math.max(0, prev - 1)
    );
    
    try {
      await dispatch(toggleSubscription({
        ownerId, 
        accessToken: user.accessToken
      })).unwrap();
    } catch (error) {
      console.error("Error in subscription toggle:", error);
      
      // Revert local state on error
      setLocalIsSubscribed(!localIsSubscribed);
      setLocalSubscribersCount(prev => 
        localIsSubscribed ? prev + 1 : Math.max(0, prev - 1)
      );
      
      // Show error toast or notification here if you have a toast system
    } finally {
      setIsSubscribing(false);
    }
  };
  
  return {
    // Return local state for component rendering to ensure UI updates
    isSubscribed: localIsSubscribed,
    subscribersCount: localSubscribersCount,
    isSubscribing,
    handleSubscribe
  };
};