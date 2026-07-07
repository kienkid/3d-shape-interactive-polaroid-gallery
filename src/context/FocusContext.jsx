import React, { createContext, useContext, useState, useCallback } from 'react';

const FocusContext = createContext(null);

/**
 * Tracks which polaroid (if any) is currently opened in the fullscreen
 * lightbox. `focused` is either null or { id, image }.
 */
export function FocusProvider({ children }) {
  const [focused, setFocused] = useState(null);

  const openImage = useCallback((id, image) => setFocused({ id, image }), []);
  const closeImage = useCallback(() => setFocused(null), []);

  return (
    <FocusContext.Provider value={{ focused, openImage, closeImage }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) {
    throw new Error('useFocus must be used within a <FocusProvider>');
  }
  return ctx;
}
