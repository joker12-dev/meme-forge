import { useEffect, useRef } from 'react';

/**
 * Auto-refresh hook - Belirli aralıklarla veri yenileme
 * @param {Function} callback - Yenilenecek fonksiyon
 * @param {number} interval - Yenileme aralığı (ms) - varsayılan 30 saniye
 * @param {boolean} enabled - Hook aktif mi
 */
const useAutoRefresh = (callback, interval = 30000, enabled = true) => {
  const savedCallback = useRef();

  // Callback'i kaydet
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Interval setup
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // İlk yükleme
    tick();

    // Periyodik yenileme
    const id = setInterval(tick, interval);

    return () => clearInterval(id);
  }, [interval, enabled]);
};

export default useAutoRefresh;

