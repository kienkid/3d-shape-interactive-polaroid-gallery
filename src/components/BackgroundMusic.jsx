import React, {
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { getBackgroundMusicUrl } from "../lib/musicLoader.js";

/**
 * BackgroundMusic
 *
 * - Does NOT autoplay.
 * - Exposes playMusic() to parent components.
 * - Music starts only once per page session.
 * - Keeps looping after it starts.
 */

const BackgroundMusic = forwardRef((props, ref) => {
  const audioRef = useRef();
  const hasStarted = useRef(false);

  const [muted, setMuted] = useState(false);

  const url = useMemo(() => getBackgroundMusicUrl(), []);

  const playMusic = () => {
    if (!audioRef.current) return;

    // Already started once this session
    if (hasStarted.current) return;

    hasStarted.current = true;

    audioRef.current.volume = 0.45;

    audioRef.current.play().catch((err) => {
      console.error("Unable to play background music:", err);
    });
  };

  useImperativeHandle(ref, () => ({
    playMusic,
  }));

  if (!url) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={url}
        loop
        preload="auto"
      />

      <button
        className="music-toggle"
        onClick={() => {
          const audio = audioRef.current;
          if (!audio) return;

          audio.muted = !audio.muted;
          setMuted(audio.muted);
        }}
        aria-label={muted ? "Unmute background music" : "Mute background music"}
        title={muted ? "Unmute music" : "Mute music"}
      >
        {muted ? "♪ off" : "♪ on"}
      </button>
    </>
  );
});

export default BackgroundMusic;