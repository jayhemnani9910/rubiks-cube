import { getState } from "./storage.js";

let audioContext = null;

const getContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
};

const playTone = (frequency, duration = 0.12) => {
  if (!getState().settings.soundEnabled) {
    return;
  }
  const context = getContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.15;

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

export const playStartSound = () => playTone(660);
export const playStopSound = () => playTone(440, 0.2);
