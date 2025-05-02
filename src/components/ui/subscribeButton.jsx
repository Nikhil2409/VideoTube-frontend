import React, { useEffect } from 'react';

/**
 * A common subscribe button component that uses consistent Channel-style design
 * for all pages in the application
 * 
 * @param {boolean} isSubscribed - Current subscription state
 * @param {boolean} isSubscribing - Whether a subscription action is in progress
 * @param {function} onClick - Handler for subscribe/unsubscribe action
 * @param {string} className - Additional CSS classes
 */
const SubscribeButton = ({ 
  isSubscribed, 
  isSubscribing, 
  onClick,
  className = '' 
}) => {
  // Debug state changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`SubscribeButton render:`, { isSubscribed, isSubscribing });
    }
  }, [isSubscribed, isSubscribing]);

  // Get button style based on subscription state
  const buttonStyle = isSubscribing
    ? 'bg-gray-300 text-gray-500' 
    : isSubscribed
      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      : 'bg-red-600 text-white hover:bg-red-700';

  return (
    <button 
      onClick={onClick}
      disabled={isSubscribing}
      className={`px-4 py-2 rounded-md font-medium ${buttonStyle} ${className}`}
      // Using key to force re-render when subscription state changes
      key={`sub-btn-${isSubscribed ? 'subscribed' : 'not-subscribed'}`}
    >
      {isSubscribing ? 'Processing...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
};

export default React.memo(SubscribeButton);