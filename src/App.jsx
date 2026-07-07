import React, { useMemo } from 'react';
import Scene from './components/Scene.jsx';
import ImageLightbox from './components/ImageLightbox.jsx';
import BackgroundMusic from './components/BackgroundMusic.jsx';
import { FocusProvider } from './context/FocusContext.jsx';
import { isWebGLAvailable } from './lib/webglCheck.js';
import { useRef } from "react";

export default function App() {
  const supported = useMemo(() => isWebGLAvailable(), []);
  const musicRef = useRef();

  if (!supported) {
    return (
      <div className="webgl-fallback">
        <h1>WebGL is not available</h1>
        <p>
          This experience needs WebGL to render the interactive 3D heart.
          Please try a modern browser (Chrome, Firefox, Edge, Safari) with
          hardware acceleration enabled.
        </p>
      </div>
    );
  }

  return (
    <FocusProvider>
      <div className="app-canvas-wrapper">
        <BackgroundMusic ref={musicRef} />
        <Scene musicRef={musicRef} />
        <div className="hud">My neyuh pics. Happy anniverary babii!</div>
        <ImageLightbox />
        
      </div>
    </FocusProvider>
  );
}
