import { useEffect } from 'react';

/**
 * Sekme görünürlüğü değiştiğinde callback çalıştır
 * Kullanıcı sekmeye geri döndüğünde veriyi yeniler
 * @param {Function} callback - Çalıştırılacak fonksiyon
 * @param {boolean} enabled - Hook aktif mi
 */
const useVisibilityChange = (callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      // Sekme görünür hale geldiğinde
      if (!document.hidden) {
        console.log('🔄 Tab visible - refreshing data');
        callback();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback, enabled]);
};

export default useVisibilityChange;

