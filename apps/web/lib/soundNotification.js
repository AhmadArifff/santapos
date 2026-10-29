// Web Audio API Chime & Notification Sound Utility for Santapos POS
// Bekerja langsung di browser tanpa dependensi file .mp3 eksternal (zero-network, instant response)

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Memainkan nada bel pesanan baru masuk ("Ding-Dong" ganda)
 * Sangat cocok untuk memberi tahu kasir atau koki saat pelanggan scan QR meja
 */
export const playOrderNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nada pertama (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.4);

    // Nada kedua (A5 - 880.00 Hz) sedikit lebih tinggi dan ceria
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.18);

    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.18);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('[Sound Notification Warning]:', err.message);
  }
};

/**
 * Memainkan nada sukses transaksi (Cash register / POS checkout chime)
 */
export const playCheckoutSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Triad chord C - E - G (C Mayor ceria)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + index * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch (err) {
    console.warn('[Sound Notification Warning]:', err.message);
  }
};

