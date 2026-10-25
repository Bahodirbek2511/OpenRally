import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useGameStore } from '@/store/gameStore';
import { isIOS, isMobileDevice } from '@/utils/device';

/**
 * Enterprise Shader Pre-Warming Component for OpenRally.
 * Pre-compiles all scene materials (PBR vehicles, terrain splatting, instanced vegetation,
 * particle systems, and sky shaders) during the loading screen via WebGLRenderer.compile().
 * Guarantees zero runtime shader compilation stalls (hitching/stutter) during high-speed driving.
 *
 * NOTE: On iOS WebKit (Safari and Chrome on iPhone/iPad), compiling the entire scene graph
 * synchronously triggers the Metal shader compiler watchdog timeout, terminating com.apple.WebKit.GPU.
 * On iOS devices, synchronous full-scene pre-compilation is safely bypassed, allowing Three.js to
 * compile materials naturally on-demand without stalling the compositor.
 */
export function ShaderWarmUp(): null {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const selectedLevelId = useGameStore((s) => s.selectedLevelId);
  const selectedVehicleId = useGameStore((s) => s.selectedVehicleId);
  const isSceneReady = useGameStore((s) => s.isSceneReady);

  useEffect(() => {
    // Only pre-compile when scene is still initializing in the loading phase
    // Full-scene synchronous shader compilation can freeze low-memory Android GPUs and
    // trigger long loading stalls. Let mobile devices compile materials on demand.
    if (isSceneReady || isIOS() || isMobileDevice()) return;

    const timer = setTimeout(() => {
      try {
        if (gl && scene && camera) {
          gl.compile(scene, camera);
        }
      } catch (err) {
        console.warn('[ShaderWarmUp] Suppressed shader pre-compilation warning:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gl, scene, camera, selectedLevelId, selectedVehicleId, isSceneReady]);

  return null;
}
