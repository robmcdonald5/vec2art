import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const response = await resolve(event, {
        filterSerializedResponseHeaders: (name) => name === 'content-type'
    });
    
    // Set COOP/COEP headers for cross-origin isolation (required for SharedArrayBuffer/WASM threading)
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    
    return response;
};