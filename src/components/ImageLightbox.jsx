import React, { useEffect } from 'react';
import { useFocus } from '../context/FocusContext.jsx';

/**
 * ImageLightbox — plain DOM overlay (not part of the 3D scene) that
 * shows the currently opened polaroid's photo fullscreen, styled to
 * match the physical polaroid cards on the heart (white frame, extra
 * bottom margin, square photo). No close button — click anywhere
 * outside the card, or press Escape, to dismiss.
 */
export default function ImageLightbox() {
  const { focused, closeImage } = useFocus();

  useEffect(() => {
    if (!focused) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeImage();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focused, closeImage]);

  if (!focused) return null;

  return (
    <div className="lightbox-backdrop" onClick={closeImage}>
      <div
        className="lightbox-polaroid"
        // Stop propagation so clicking the card itself doesn't close it —
        // only a click on the backdrop (outside the card) should exit.
        onClick={(e) => e.stopPropagation()}
      >
        <img src={focused.image.url} alt={focused.image.name} />
      </div>
    </div>
  );
}
