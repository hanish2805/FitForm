let cachedSoftwareGl: boolean | null = null;

/**
 * Probes once per page lifecycle whether WebGL2 is backed by a software rasterizer
 * (SwiftShader, llvmpipe, etc.) so 3D viewports can avoid redundant throwaway contexts
 * and adapt shadow/AA/frame-pacing settings cleanly.
 */
export function isSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = false;
    return false;
  }
}
