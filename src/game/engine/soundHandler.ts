/**
 * Play a HTMLAudioElement. This will also reset the playback if it is already currently playing.
 */
export function playSound(
  sound: HTMLAudioElement,
  { volume = 1, loop = true } = {}
) {
  sound.volume = volume;
  sound.loop = loop ?? sound.loop;

  if (sound.currentTime > 0) sound.currentTime = 0;
  if (sound.paused) sound.play();
}

/**
 * Stop a currently playing HTMLAudioElement, reseting its position to the beginning.
 */
export function stopSound(sound: HTMLAudioElement) {
  sound.pause();
  sound.currentTime = 0;
}
