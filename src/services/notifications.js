// src/services/notifications.js

// Play a beep sound using the browser's built-in Audio Context
export const playAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch beep
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1); // Drop pitch

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);

    // Close the context after the beep finishes to free resources
    osc.onended = () => {
      try { ctx.close(); } catch (_) {}
    };
  } catch (e) {
    console.log('Audio error', e);
  }
};

// Simple browser notification (Requires user permission)
export const showReminder = (title, body) => {
  playAlertSound();
  alert(`🔔 ${title}\n\n${body}`);
};