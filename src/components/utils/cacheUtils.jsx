export const cacheUtils = {
    save: (key, data) => {
      try {
        localStorage.setItem(key, JSON.stringify({
          timestamp: Date.now(),
          data: data
        }));
      } catch (error) {
        console.error("Error saving to cache:", error);
      }
    },
  
    get: (key) => {
      try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
  
        const parsedCache = JSON.parse(cached);
        
        const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 hour
        if (Date.now() - parsedCache.timestamp > CACHE_EXPIRATION) {
          localStorage.removeItem(key);
          return null;
        }
  
        return parsedCache.data;
      } catch (error) {
        console.error("Error retrieving from cache:", error);
        return null;
      }
    },
  
    clear: (key) => {
      localStorage.removeItem(key);
    },
  
    clearUserCache: (userId) => {
      const cacheKeys = [
        `dashboard_data_${userId}`,
        `watch_history_${userId}`,
        `liked_videos_${userId}`,
        `user_playlists_${userId}`
      ];
  
      cacheKeys.forEach(key => localStorage.removeItem(key));
    }
  };
  