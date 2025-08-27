import { startWorkers } from './snippets/wasm-bindgen-rayon-38edf6e439f6d70d/src/workerHelpers.js';
import * as __wbg_star0 from './__wbindgen_placeholder__.js';

let wasm;

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

let WASM_VECTOR_LEN = 0;

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
};

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer !== wasm.memory.buffer) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedUint16ArrayMemory0 = null;

function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedUint8ClampedArrayMemory0 = null;

function getUint8ClampedArrayMemory0() {
    if (cachedUint8ClampedArrayMemory0 === null || cachedUint8ClampedArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedUint8ClampedArrayMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedArrayMemory0;
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedBigInt64ArrayMemory0 = null;

function getBigInt64ArrayMemory0() {
    if (cachedBigInt64ArrayMemory0 === null || cachedBigInt64ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedBigInt64ArrayMemory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64ArrayMemory0;
}

function getArrayI64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigInt64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedBigUint64ArrayMemory0 = null;

function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

function getArrayU64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigUint64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => {
    wasm.__wbindgen_export_6.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_6.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

let cachedFloat32ArrayMemory0 = null;

function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedFloat64ArrayMemory0 = null;

function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedInt16ArrayMemory0 = null;

function getInt16ArrayMemory0() {
    if (cachedInt16ArrayMemory0 === null || cachedInt16ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedInt16ArrayMemory0 = new Int16Array(wasm.memory.buffer);
    }
    return cachedInt16ArrayMemory0;
}

function getArrayI16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

let cachedInt32ArrayMemory0 = null;

function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedInt8ArrayMemory0 = null;

function getInt8ArrayMemory0() {
    if (cachedInt8ArrayMemory0 === null || cachedInt8ArrayMemory0.buffer !== wasm.memory.buffer) {
        cachedInt8ArrayMemory0 = new Int8Array(wasm.memory.buffer);
    }
    return cachedInt8ArrayMemory0;
}

function getArrayI8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(wasm.__wbindgen_export_2.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}
/**
 * Check comprehensive browser capabilities for WebAssembly threading
 *
 * This function performs a detailed analysis of the browser environment to determine
 * if WebAssembly multi-threading is supported and provides diagnostic information
 * about any missing requirements.
 * @returns {WasmCapabilityReport}
 */
export function check_threading_requirements() {
    const ret = wasm.check_threading_requirements();
    return WasmCapabilityReport.__wrap(ret);
}

/**
 * Get a list of missing requirements for WebAssembly threading
 *
 * Returns an empty array if all requirements are met.
 * @returns {any[]}
 */
export function get_missing_requirements() {
    const ret = wasm.get_missing_requirements();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Check if Cross-Origin Isolation is enabled
 *
 * This is a quick check for the most common reason threading doesn't work.
 * @returns {boolean}
 */
export function is_cross_origin_isolated() {
    const ret = wasm.is_cross_origin_isolated();
    return ret !== 0;
}

/**
 * Check if SharedArrayBuffer is supported and functional
 * @returns {boolean}
 */
export function is_shared_array_buffer_supported() {
    const ret = wasm.is_shared_array_buffer_supported();
    return ret !== 0;
}

/**
 * Check if we're running in a Node.js environment
 * @returns {boolean}
 */
export function is_nodejs_environment() {
    const ret = wasm.is_nodejs_environment();
    return ret !== 0;
}

/**
 * Get the detected environment type as a string
 * @returns {string}
 */
export function get_environment_type() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_environment_type();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Force refresh of capability cache
 *
 * This can be useful if the environment changes during runtime
 * (e.g., headers are modified via service worker)
 */
export function refresh_capability_cache() {
    wasm.refresh_capability_cache();
}

/**
 * Get a human-readable summary of threading requirements
 * @returns {string}
 */
export function get_threading_requirements_summary() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_threading_requirements_summary();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Provide actionable recommendations for enabling threading
 * @returns {any[]}
 */
export function get_threading_recommendations() {
    const ret = wasm.get_threading_recommendations();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}
/**
 * Initialize the WASM thread pool with the specified number of threads
 *
 * This returns a JavaScript Promise that must be awaited before using parallel functions.
 *
 * # Arguments
 * * `num_threads` - Number of threads to use. If None, uses browser's hardware concurrency
 *
 * # Returns
 * * `JsValue` containing a Promise that resolves when initialization is complete
 *
 * # Safety
 * This function modifies global state and should only be called once during module initialization
 * @param {number | null} [num_threads]
 * @returns {any}
 */
export function init_thread_pool(num_threads) {
    const ret = wasm.init_thread_pool(isLikeNone(num_threads) ? 0x100000001 : (num_threads) >>> 0);
    return ret;
}

/**
 * Confirm successful thread pool initialization
 *
 * This should be called by JavaScript when the initThreadPool promise resolves successfully
 */
export function confirm_threading_success() {
    wasm.confirm_threading_success();
}

/**
 * Mark thread pool initialization failure
 *
 * This should be called by JavaScript when the initThreadPool promise rejects
 */
export function mark_threading_failed() {
    wasm.mark_threading_failed();
}

/**
 * Initialize the wasm module with basic setup
 */
export function init() {
    wasm.init();
}

/**
 * Initialize the thread pool for WASM parallel processing
 * This must be called from JavaScript before using any parallel functions
 * @returns {Promise<void>}
 */
export function start() {
    const ret = wasm.start();
    return ret;
}

/**
 * Get available backends for trace-low algorithm
 * @returns {any[]}
 */
export function get_available_backends() {
    const ret = wasm.get_available_backends();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Get available presets for configuration
 * @returns {any[]}
 */
export function get_available_presets() {
    const ret = wasm.get_available_presets();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Get description for a specific preset
 * @param {string} preset
 * @returns {string}
 */
export function get_preset_description(preset) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.get_preset_description(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Reset thread pool state to prevent memory corruption in high multipass scenarios
 * Perform complete thread pool reset to prevent memory corruption in high multipass scenarios
 * This performs a complete reset by forcing re-initialization of the wasm-bindgen-rayon thread pool
 * @returns {any}
 */
export function reset_thread_pool() {
    const ret = wasm.reset_thread_pool();
    return ret;
}

/**
 * Cleanup and reset thread pool after intensive operations
 * This helps prevent the "every other failure" issue with high pass counts
 * @returns {any}
 */
export function cleanup_after_multipass() {
    const ret = wasm.cleanup_after_multipass();
    return ret;
}

/**
 * Legacy function - use initThreadPool() directly from JavaScript instead
 * This is kept for compatibility but just logs a warning
 * @param {number | null} [_num_threads]
 * @returns {any}
 */
export function init_threading(_num_threads) {
    const ret = wasm.init_threading(isLikeNone(_num_threads) ? 0x100000001 : (_num_threads) >>> 0);
    return ret;
}

/**
 * Check if threading is supported and active in the current environment
 *
 * # Returns
 * * `true` if multi-threading is available and working, `false` otherwise
 * @returns {boolean}
 */
export function is_threading_supported() {
    const ret = wasm.is_threading_supported();
    return ret !== 0;
}

/**
 * Get the current number of threads available for parallel processing
 *
 * # Returns
 * * Number of threads available (1 if single-threaded)
 * @returns {number}
 */
export function get_thread_count() {
    const ret = wasm.get_thread_count();
    return ret >>> 0;
}

/**
 * Get the browser's hardware concurrency (logical processor count)
 *
 * # Returns
 * * Number of logical processors available to the browser
 * @returns {number}
 */
export function get_hardware_concurrency() {
    const ret = wasm.get_hardware_concurrency();
    return ret >>> 0;
}

/**
 * Get detailed information about the threading environment
 *
 * # Returns
 * * Diagnostic string with threading details
 * @returns {string}
 */
export function get_threading_info() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_threading_info();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Force single-threaded execution (for debugging or fallback)
 *
 * This disables threading even if it's supported and can be useful
 * for debugging or ensuring consistent behavior across environments
 */
export function force_single_threaded() {
    wasm.force_single_threaded();
}

/**
 * Function exposed as `initThreadPool` to JS (see the main docs).
 *
 * Normally, you'd invoke this function from JS to initialize the thread pool.
 * However, if you strongly prefer, you can use [wasm-bindgen-futures](https://rustwasm.github.io/wasm-bindgen/reference/js-promises-and-rust-futures.html) to invoke and await this function from Rust.
 *
 * Note that doing so comes with extra initialization and Wasm size overhead for the JS<->Rust Promise integration.
 * @param {number} num_threads
 * @returns {Promise<any>}
 */
export function initThreadPool(num_threads) {
    const ret = wasm.initThreadPool(num_threads);
    return ret;
}

/**
 * @param {number} receiver
 */
export function wbg_rayon_start_worker(receiver) {
    wasm.wbg_rayon_start_worker(receiver);
}

function __wbg_adapter_96(arg0, arg1, arg2) {
    wasm.closure85_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_1760(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.closure1882_externref_shim(arg0, arg1, arg2, arg3, arg4);
    return ret !== 0;
}

function __wbg_adapter_1777(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.closure1883_externref_shim_multivalue_shim(arg0, arg1, arg2, arg3, arg4);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

function __wbg_adapter_1780(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1884_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_1797(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.closure1885_externref_shim(arg0, arg1, arg2, arg3, arg4);
    return ret;
}

function __wbg_adapter_1814(arg0, arg1, arg2, arg3, arg4, arg5) {
    const ret = wasm.closure1886_externref_shim(arg0, arg1, arg2, arg3, arg4, arg5);
    return ret;
}

function __wbg_adapter_1825(arg0, arg1, arg2) {
    const ret = wasm.closure1887_externref_shim(arg0, arg1, arg2);
    return ret !== 0;
}

function __wbg_adapter_2086(arg0, arg1, arg2, arg3) {
    wasm.closure1888_externref_shim(arg0, arg1, arg2, arg3);
}

function __wbg_adapter_2527(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1884_externref_shim19(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_2944(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1889_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_2981(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1890_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3018(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1884_externref_shim22(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3055(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1889_externref_shim23(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3128(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1890_externref_shim24(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3165(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1884_externref_shim25(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3202(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1891_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3239(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1892_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3276(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1893_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_3313(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure1893_externref_shim29(arg0, arg1, arg2, arg3, arg4);
}

/**
 * Available backends for JavaScript interaction
 * @enum {0 | 1 | 2 | 3}
 */
export const WasmBackend = Object.freeze({
    Edge: 0, "0": "Edge",
    Centerline: 1, "1": "Centerline",
    Superpixel: 2, "2": "Superpixel",
    Dots: 3, "3": "Dots",
});
/**
 * Available presets for JavaScript interaction
 * @enum {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7}
 */
export const WasmPreset = Object.freeze({
    LineArt: 0, "0": "LineArt",
    Sketch: 1, "1": "Sketch",
    Technical: 2, "2": "Technical",
    DenseStippling: 3, "3": "DenseStippling",
    Pointillism: 4, "4": "Pointillism",
    SparseDots: 5, "5": "SparseDots",
    FineStippling: 6, "6": "FineStippling",
    BoldArtistic: 7, "7": "BoldArtistic",
});

const __wbindgen_enum_WorkerType = ["classic", "module"];

const WasmCapabilityReportFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcapabilityreport_free(ptr >>> 0, 1));
/**
 * WASM-bindgen wrapper for CapabilityReport with proper getter methods
 */
export class WasmCapabilityReport {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmCapabilityReport.prototype);
        obj.__wbg_ptr = ptr;
        WasmCapabilityReportFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmCapabilityReportFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmcapabilityreport_free(ptr, 0);
    }
    /**
     * @returns {boolean}
     */
    get threading_supported() {
        const ret = wasm.wasmcapabilityreport_threading_supported(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get shared_array_buffer() {
        const ret = wasm.wasmcapabilityreport_shared_array_buffer(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get cross_origin_isolated() {
        const ret = wasm.wasmcapabilityreport_cross_origin_isolated(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get web_workers() {
        const ret = wasm.wasmcapabilityreport_web_workers(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get proper_headers() {
        const ret = wasm.wasmcapabilityreport_proper_headers(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get environment_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmcapabilityreport_environment_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {any[]}
     */
    get missing_requirements() {
        const ret = wasm.wasmcapabilityreport_missing_requirements(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {any[]}
     */
    get diagnostics() {
        const ret = wasm.wasmcapabilityreport_diagnostics(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * @returns {boolean}
     */
    get is_node_js() {
        const ret = wasm.wasmcapabilityreport_is_node_js(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get atomics_supported() {
        const ret = wasm.wasmcapabilityreport_atomics_supported(this.__wbg_ptr);
        return ret !== 0;
    }
}

const WasmProgressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmprogress_free(ptr >>> 0, 1));
/**
 * Progress information passed to JavaScript callbacks
 */
export class WasmProgress {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmProgressFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmprogress_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get percent() {
        const ret = wasm.wasmprogress_percent(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    get message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmprogress_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get stage() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmprogress_stage(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const WasmThreadingErrorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmthreadingerror_free(ptr >>> 0, 1));
/**
 * WASM-bindgen wrapper for ThreadingError
 */
export class WasmThreadingError {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmThreadingErrorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmthreadingerror_free(ptr, 0);
    }
    /**
     * Get error type as string
     * @returns {string}
     */
    get error_type() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmthreadingerror_error_type(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get error message
     * @returns {string}
     */
    get message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmthreadingerror_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get recovery suggestions
     * @returns {any[]}
     */
    get recovery_suggestions() {
        const ret = wasm.wasmthreadingerror_recovery_suggestions(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get attempted solutions
     * @returns {any[]}
     */
    get attempted_solutions() {
        const ret = wasm.wasmthreadingerror_attempted_solutions(this.__wbg_ptr);
        var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get environment information as JSON
     * @returns {string}
     */
    get environment_info() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmthreadingerror_environment_info(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Check if recovery is possible
     * @returns {boolean}
     */
    get is_recoverable() {
        const ret = wasm.wasmthreadingerror_is_recoverable(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get expected performance impact (0.0 = no impact, 1.0 = severe impact)
     * @returns {number}
     */
    get performance_impact() {
        const ret = wasm.wasmthreadingerror_performance_impact(this.__wbg_ptr);
        return ret;
    }
}

const WasmVectorizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmvectorizer_free(ptr >>> 0, 1));
/**
 * Main WebAssembly vectorizer struct wrapping ConfigBuilder
 */
export class WasmVectorizer {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmVectorizerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmvectorizer_free(ptr, 0);
    }
    /**
     * Create a new WasmVectorizer with default configuration
     */
    constructor() {
        const ret = wasm.wasmvectorizer_new();
        this.__wbg_ptr = ret >>> 0;
        WasmVectorizerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Apply a preset configuration by name
     * Available presets: "line_art", "sketch", "technical", "dots_dense", "dots_pointillism", "dots_sparse", "dots_fine", "dots_bold"
     * @param {string} preset
     */
    use_preset(preset) {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_use_preset(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set the tracing backend: "edge", "centerline", "superpixel", or "dots"
     * @param {string} backend
     */
    set_backend(backend) {
        const ptr0 = passStringToWasm0(backend, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_set_backend(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get the current backend
     * @returns {string}
     */
    get_backend() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmvectorizer_get_backend(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Set detail level (0.0 = sparse, 1.0 = detailed)
     * @param {number} detail
     */
    set_detail(detail) {
        const ret = wasm.wasmvectorizer_set_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get current detail level
     * @returns {number}
     */
    get_detail() {
        const ret = wasm.wasmvectorizer_get_detail(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set stroke width at 1080p reference resolution
     * @param {number} width
     */
    set_stroke_width(width) {
        const ret = wasm.wasmvectorizer_set_stroke_width(this.__wbg_ptr, width);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get current stroke width
     * @returns {number}
     */
    get_stroke_width() {
        const ret = wasm.wasmvectorizer_get_stroke_width(this.__wbg_ptr);
        return ret;
    }
    /**
     * Enable or disable multipass processing
     * @param {boolean} enabled
     */
    set_multipass(enabled) {
        wasm.wasmvectorizer_set_multipass(this.__wbg_ptr, enabled);
    }
    /**
     * Get multipass setting
     * @returns {boolean}
     */
    get_multipass() {
        const ret = wasm.wasmvectorizer_get_multipass(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Set number of processing passes (1-10)
     * @param {number} count
     */
    set_pass_count(count) {
        const ret = wasm.wasmvectorizer_set_pass_count(this.__wbg_ptr, count);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get number of processing passes
     * @returns {number}
     */
    get_pass_count() {
        const ret = wasm.wasmvectorizer_get_pass_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Enable or disable noise filtering
     * @param {boolean} enabled
     */
    set_noise_filtering(enabled) {
        wasm.wasmvectorizer_set_noise_filtering(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable reverse pass
     * @param {boolean} enabled
     */
    set_reverse_pass(enabled) {
        wasm.wasmvectorizer_set_reverse_pass(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable diagonal pass
     * @param {boolean} enabled
     */
    set_diagonal_pass(enabled) {
        wasm.wasmvectorizer_set_diagonal_pass(this.__wbg_ptr, enabled);
    }
    /**
     * Set conservative detail level for first pass in multipass processing
     * @param {number} detail
     */
    set_conservative_detail(detail) {
        const ret = wasm.wasmvectorizer_set_conservative_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set aggressive detail level for second pass in multipass processing
     * @param {number} detail
     */
    set_aggressive_detail(detail) {
        const ret = wasm.wasmvectorizer_set_aggressive_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set directional strength threshold for directional passes
     * @param {number} threshold
     */
    set_directional_strength_threshold(threshold) {
        const ret = wasm.wasmvectorizer_set_directional_strength_threshold(this.__wbg_ptr, threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set dot density (0.0 = very sparse, 1.0 = very dense)
     * @param {number} density
     */
    set_dot_density(density) {
        const ret = wasm.wasmvectorizer_set_dot_density(this.__wbg_ptr, density);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set dot size range with minimum and maximum radius
     * @param {number} min_radius
     * @param {number} max_radius
     */
    set_dot_size_range(min_radius, max_radius) {
        const ret = wasm.wasmvectorizer_set_dot_size_range(this.__wbg_ptr, min_radius, max_radius);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable color preservation in dots
     * @param {boolean} enabled
     */
    set_preserve_colors(enabled) {
        wasm.wasmvectorizer_set_preserve_colors(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable color preservation in line tracing (edge/centerline backends)
     * @param {boolean} enabled
     */
    set_line_preserve_colors(enabled) {
        wasm.wasmvectorizer_set_line_preserve_colors(this.__wbg_ptr, enabled);
    }
    /**
     * Set color accuracy for line tracing (0.0 = fast, 1.0 = accurate)
     * @param {number} accuracy
     */
    set_line_color_accuracy(accuracy) {
        const ret = wasm.wasmvectorizer_set_line_color_accuracy(this.__wbg_ptr, accuracy);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set maximum colors per path segment for line tracing
     * @param {number} max_colors
     */
    set_max_colors_per_path(max_colors) {
        const ret = wasm.wasmvectorizer_set_max_colors_per_path(this.__wbg_ptr, max_colors);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set color tolerance for clustering (0.0-1.0)
     * @param {number} tolerance
     */
    set_color_tolerance(tolerance) {
        const ret = wasm.wasmvectorizer_set_color_tolerance(this.__wbg_ptr, tolerance);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable adaptive dot sizing
     * @param {boolean} enabled
     */
    set_adaptive_sizing(enabled) {
        wasm.wasmvectorizer_set_adaptive_sizing(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable Poisson disk sampling for natural dot distribution
     * @param {boolean} enabled
     */
    set_poisson_disk_sampling(enabled) {
        wasm.wasmvectorizer_set_poisson_disk_sampling(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable gradient-based sizing for dot scaling based on local image gradients
     * @param {boolean} enabled
     */
    set_gradient_based_sizing(enabled) {
        wasm.wasmvectorizer_set_gradient_based_sizing(this.__wbg_ptr, enabled);
    }
    /**
     * Set background tolerance for automatic background detection
     * @param {number} tolerance
     */
    set_background_tolerance(tolerance) {
        const ret = wasm.wasmvectorizer_set_background_tolerance(this.__wbg_ptr, tolerance);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable background removal preprocessing
     * @param {boolean} enabled
     */
    enable_background_removal(enabled) {
        wasm.wasmvectorizer_enable_background_removal(this.__wbg_ptr, enabled);
    }
    /**
     * Set background removal strength (0.0-1.0)
     * @param {number} strength
     */
    set_background_removal_strength(strength) {
        const ret = wasm.wasmvectorizer_set_background_removal_strength(this.__wbg_ptr, strength);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set background removal algorithm: "otsu", "adaptive", or "auto"
     * @param {string} algorithm
     */
    set_background_removal_algorithm(algorithm) {
        const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_set_background_removal_algorithm(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set background removal threshold override (0-255)
     * @param {number | null} [threshold]
     */
    set_background_removal_threshold(threshold) {
        wasm.wasmvectorizer_set_background_removal_threshold(this.__wbg_ptr, isLikeNone(threshold) ? 0xFFFFFF : threshold);
    }
    /**
     * Set hand-drawn preset: "none", "subtle", "medium", "strong", or "sketchy"
     * @param {string} preset
     */
    set_hand_drawn_preset(preset) {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_set_hand_drawn_preset(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom tremor strength (overrides preset)
     * @param {number} tremor
     */
    set_custom_tremor(tremor) {
        const ret = wasm.wasmvectorizer_set_custom_tremor(this.__wbg_ptr, tremor);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom variable weights (overrides preset)
     * @param {number} weights
     */
    set_custom_variable_weights(weights) {
        const ret = wasm.wasmvectorizer_set_custom_variable_weights(this.__wbg_ptr, weights);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom tapering strength (overrides preset)
     * @param {number} tapering
     */
    set_custom_tapering(tapering) {
        const ret = wasm.wasmvectorizer_set_custom_tapering(this.__wbg_ptr, tapering);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable ETF/FDoG advanced edge detection
     * @param {boolean} enabled
     */
    set_enable_etf_fdog(enabled) {
        wasm.wasmvectorizer_set_enable_etf_fdog(this.__wbg_ptr, enabled);
    }
    /**
     * Enable flow-guided tracing (requires ETF/FDoG)
     * @param {boolean} enabled
     */
    set_enable_flow_tracing(enabled) {
        wasm.wasmvectorizer_set_enable_flow_tracing(this.__wbg_ptr, enabled);
    }
    /**
     * Enable Bézier curve fitting (requires flow tracing)
     * @param {boolean} enabled
     */
    set_enable_bezier_fitting(enabled) {
        wasm.wasmvectorizer_set_enable_bezier_fitting(this.__wbg_ptr, enabled);
    }
    /**
     * Set maximum processing time in milliseconds
     * @param {bigint} time_ms
     */
    set_max_processing_time_ms(time_ms) {
        const ret = wasm.wasmvectorizer_set_max_processing_time_ms(this.__wbg_ptr, time_ms);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set spatial sigma for bilateral noise filtering (0.5-5.0, higher = more smoothing)
     * @param {number} sigma
     */
    set_noise_filter_spatial_sigma(sigma) {
        const ret = wasm.wasmvectorizer_set_noise_filter_spatial_sigma(this.__wbg_ptr, sigma);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set range sigma for bilateral noise filtering (10.0-100.0, higher = less edge preservation)
     * @param {number} sigma
     */
    set_noise_filter_range_sigma(sigma) {
        const ret = wasm.wasmvectorizer_set_noise_filter_range_sigma(this.__wbg_ptr, sigma);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable adaptive thresholding for centerline backend
     * @param {boolean} enabled
     */
    set_enable_adaptive_threshold(enabled) {
        wasm.wasmvectorizer_set_enable_adaptive_threshold(this.__wbg_ptr, enabled);
    }
    /**
     * Set window size for adaptive thresholding (15-50 pixels)
     * @param {number} size
     */
    set_window_size(size) {
        const ret = wasm.wasmvectorizer_set_window_size(this.__wbg_ptr, size);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set sensitivity parameter k for Sauvola thresholding (0.1-1.0)
     * @param {number} k
     */
    set_sensitivity_k(k) {
        const ret = wasm.wasmvectorizer_set_sensitivity_k(this.__wbg_ptr, k);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set minimum branch length for centerline tracing (4-24 pixels)
     * @param {number} length
     */
    set_min_branch_length(length) {
        const ret = wasm.wasmvectorizer_set_min_branch_length(this.__wbg_ptr, length);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set Douglas-Peucker epsilon for path simplification (0.5-3.0)
     * @param {number} epsilon
     */
    set_douglas_peucker_epsilon(epsilon) {
        const ret = wasm.wasmvectorizer_set_douglas_peucker_epsilon(this.__wbg_ptr, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable width modulation for centerline SVG strokes
     * @param {boolean} enabled
     */
    set_enable_width_modulation(enabled) {
        wasm.wasmvectorizer_set_enable_width_modulation(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable Distance Transform-based centerline algorithm (default: false)
     * When enabled, uses the high-performance Distance Transform algorithm instead of traditional skeleton thinning
     * This provides 5-10x performance improvement with better quality results
     * @param {boolean} enabled
     */
    set_enable_distance_transform_centerline(enabled) {
        wasm.wasmvectorizer_set_enable_distance_transform_centerline(this.__wbg_ptr, enabled);
    }
    /**
     * Set number of superpixels to generate (20-1000)
     * @param {number} num
     */
    set_num_superpixels(num) {
        const ret = wasm.wasmvectorizer_set_num_superpixels(this.__wbg_ptr, num);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set SLIC compactness parameter (1.0-50.0)
     * Higher values create more regular shapes, lower values follow color similarity more closely
     * @param {number} compactness
     */
    set_compactness(compactness) {
        const ret = wasm.wasmvectorizer_set_compactness(this.__wbg_ptr, compactness);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set SLIC iterations for convergence (5-15)
     * @param {number} iterations
     */
    set_slic_iterations(iterations) {
        const ret = wasm.wasmvectorizer_set_slic_iterations(this.__wbg_ptr, iterations);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable filled superpixel regions
     * @param {boolean} enabled
     */
    set_fill_regions(enabled) {
        wasm.wasmvectorizer_set_fill_regions(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable superpixel region boundary strokes
     * @param {boolean} enabled
     */
    set_stroke_regions(enabled) {
        wasm.wasmvectorizer_set_stroke_regions(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable color preservation in superpixel regions
     * @param {boolean} enabled
     */
    set_superpixel_preserve_colors(enabled) {
        wasm.wasmvectorizer_set_superpixel_preserve_colors(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable boundary path simplification
     * @param {boolean} enabled
     */
    set_simplify_boundaries(enabled) {
        wasm.wasmvectorizer_set_simplify_boundaries(this.__wbg_ptr, enabled);
    }
    /**
     * Set boundary simplification tolerance (0.5-3.0)
     * @param {number} epsilon
     */
    set_boundary_epsilon(epsilon) {
        const ret = wasm.wasmvectorizer_set_boundary_epsilon(this.__wbg_ptr, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set maximum image size before automatic resizing (512-8192 pixels)
     * Images larger than this will be automatically resized to prevent memory/timeout issues
     * @param {number} size
     */
    set_max_image_size(size) {
        const ret = wasm.wasmvectorizer_set_max_image_size(this.__wbg_ptr, size);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get current maximum image size setting
     * @returns {number}
     */
    get_max_image_size() {
        const ret = wasm.wasmvectorizer_get_max_image_size(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Set SVG coordinate precision in decimal places (0-4)
     * Higher precision = larger file size but better quality. 0 = integers only.
     * @param {number} precision
     */
    set_svg_precision(precision) {
        const ret = wasm.wasmvectorizer_set_svg_precision(this.__wbg_ptr, precision);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get current SVG precision setting
     * @returns {number}
     */
    get_svg_precision() {
        const ret = wasm.wasmvectorizer_get_svg_precision(this.__wbg_ptr);
        return ret;
    }
    /**
     * Enable or disable SVG output optimization (NOT YET IMPLEMENTED)
     * This is a placeholder for future implementation
     * @param {boolean} _enabled
     */
    set_optimize_svg(_enabled) {
        const ret = wasm.wasmvectorizer_set_optimize_svg(this.__wbg_ptr, _enabled);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable metadata inclusion in SVG output (NOT YET IMPLEMENTED)
     * This is a placeholder for future implementation
     * @param {boolean} _enabled
     */
    set_include_metadata(_enabled) {
        const ret = wasm.wasmvectorizer_set_include_metadata(this.__wbg_ptr, _enabled);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set the thread count for this vectorizer instance
     * Note: Thread pool must be initialized from JavaScript using initThreadPool()
     * @param {number | null} [thread_count]
     */
    set_thread_count(thread_count) {
        const ret = wasm.wasmvectorizer_set_thread_count(this.__wbg_ptr, isLikeNone(thread_count) ? 0x100000001 : (thread_count) >>> 0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get the current thread count for this vectorizer
     * @returns {number}
     */
    get_thread_count() {
        const ret = wasm.wasmvectorizer_get_thread_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Validate current configuration
     */
    validate_config() {
        const ret = wasm.wasmvectorizer_validate_config(this.__wbg_ptr);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Vectorize an image with the current configuration
     * @param {ImageData} image_data
     * @returns {string}
     */
    vectorize(image_data) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizer_vectorize(this.__wbg_ptr, image_data);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Vectorize an image with progress callbacks
     * @param {ImageData} image_data
     * @param {Function | null} [callback]
     * @returns {string}
     */
    vectorize_with_progress(image_data, callback) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizer_vectorize_with_progress(this.__wbg_ptr, image_data, isLikeNone(callback) ? 0 : addToExternrefTable0(callback));
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Export current configuration as JSON string
     * @returns {string}
     */
    export_config() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizer_export_config(this.__wbg_ptr);
            var ptr1 = ret[0];
            var len1 = ret[1];
            if (ret[3]) {
                ptr1 = 0; len1 = 0;
                throw takeFromExternrefTable0(ret[2]);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Import configuration from JSON string
     * @param {string} json
     */
    import_config(json) {
        const ptr0 = passStringToWasm0(json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_import_config(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
}

const wbg_rayon_PoolBuilderFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wbg_rayon_poolbuilder_free(ptr >>> 0, 1));

export class wbg_rayon_PoolBuilder {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(wbg_rayon_PoolBuilder.prototype);
        obj.__wbg_ptr = ptr;
        wbg_rayon_PoolBuilderFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    static __unwrap(jsValue) {
        if (!(jsValue instanceof wbg_rayon_PoolBuilder)) {
            return 0;
        }
        return jsValue.__destroy_into_raw();
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        wbg_rayon_PoolBuilderFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wbg_rayon_poolbuilder_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    numThreads() {
        const ret = wasm.wbg_rayon_poolbuilder_numThreads(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    receiver() {
        const ret = wasm.wbg_rayon_poolbuilder_receiver(this.__wbg_ptr);
        return ret >>> 0;
    }
    build() {
        wasm.wbg_rayon_poolbuilder_build(this.__wbg_ptr);
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_1_77c0e503c33a64ed = function() {
        const ret = RegExp.$1;
        return ret;
    };
    imports.wbg.__wbg_2_2954c20a47e1d6d5 = function() {
        const ret = RegExp.$2;
        return ret;
    };
    imports.wbg.__wbg_3_0f9691ccc7469464 = function() {
        const ret = RegExp.$3;
        return ret;
    };
    imports.wbg.__wbg_4_5e93be43b49e66e0 = function() {
        const ret = RegExp.$4;
        return ret;
    };
    imports.wbg.__wbg_5_83811052d820a892 = function() {
        const ret = RegExp.$5;
        return ret;
    };
    imports.wbg.__wbg_6_54e5027336db0f85 = function() {
        const ret = RegExp.$6;
        return ret;
    };
    imports.wbg.__wbg_7_ed8dde86f655e6fc = function() {
        const ret = RegExp.$7;
        return ret;
    };
    imports.wbg.__wbg_8_f2ea7602beb419fe = function() {
        const ret = RegExp.$8;
        return ret;
    };
    imports.wbg.__wbg_9_76c3c425176d548a = function() {
        const ret = RegExp.$9;
        return ret;
    };
    imports.wbg.__wbg_Atomics_3b464f352c5a5881 = function() { return handleError(function () {
        const ret = globalThis.Atomics();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_BigInt_470dd987b8190f8e = function(arg0) {
        const ret = BigInt(arg0);
        return ret;
    };
    imports.wbg.__wbg_BigInt_ddea6d2f55558acb = function() { return handleError(function (arg0) {
        const ret = BigInt(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_Deno_3388d30851d104ab = function() { return handleError(function () {
        const ret = globalThis.Deno();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_SharedArrayBuffer_50a8ecb8bd2db524 = function() { return handleError(function () {
        const ret = globalThis.SharedArrayBuffer();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_String_8f0eb39a4a4c2f66 = function(arg0, arg1) {
        const ret = String(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_UTC_925e7a2b93c33767 = function(arg0, arg1) {
        const ret = Date.UTC(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_Worker_60f910cbbd3d870d = function() { return handleError(function () {
        const ret = globalThis.Worker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_abs_b92041d36bda5d96 = function(arg0) {
        const ret = Math.abs(arg0);
        return ret;
    };
    imports.wbg.__wbg_acos_b68abcb126624477 = function(arg0) {
        const ret = Math.acos(arg0);
        return ret;
    };
    imports.wbg.__wbg_acosh_6282e5fe665cf63f = function(arg0) {
        const ret = Math.acosh(arg0);
        return ret;
    };
    imports.wbg.__wbg_activeVRDisplays_a83a9aa280ae4186 = function(arg0) {
        const ret = arg0.activeVRDisplays;
        return ret;
    };
    imports.wbg.__wbg_addEventListener_7b8506ed3daef7d5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0);
    }, arguments) };
    imports.wbg.__wbg_addEventListener_7cbc6153efcd30d0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0, arg5 === 0xFFFFFF ? undefined : arg5 !== 0);
    }, arguments) };
    imports.wbg.__wbg_addEventListener_90e553fdce254421 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_add_177d0470da9b609f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.add(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_add_2d7350e4c406d62d = function(arg0, arg1) {
        const ret = arg0.add(arg1);
        return ret;
    };
    imports.wbg.__wbg_add_545a39f4e6b3edf1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.add(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_add_883d9432f9188ef2 = function(arg0, arg1) {
        const ret = arg0.add(arg1);
        return ret;
    };
    imports.wbg.__wbg_alert_90cedcff585b96d6 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.alert(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_alert_bf5d209744414b8e = function() { return handleError(function (arg0) {
        arg0.alert();
    }, arguments) };
    imports.wbg.__wbg_allSettled_d6c2eb0382f2fff9 = function(arg0) {
        const ret = Promise.allSettled(arg0);
        return ret;
    };
    imports.wbg.__wbg_all_d5bf227e8f68795d = function(arg0) {
        const ret = Promise.all(arg0);
        return ret;
    };
    imports.wbg.__wbg_and_0b22ca81d931528f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.and(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_and_a2491ca70b6029d0 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.and(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_any_8f7b1d9e103c57f1 = function(arg0) {
        const ret = Promise.any(arg0);
        return ret;
    };
    imports.wbg.__wbg_appCodeName_38062db9462b46b5 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appCodeName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appName_f926b7e3ee997a4c = function(arg0, arg1) {
        const ret = arg1.appName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_appVersion_d8ba3b7823ebd38e = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appVersion;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_apply_36be6a55257c99bf = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.apply(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_apply_eb9e9b97497f91e4 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.apply(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_asIntN_071c1718fdc50d70 = function(arg0, arg1) {
        const ret = BigInt.asIntN(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_asUintN_9d004ba3133c97f5 = function(arg0, arg1) {
        const ret = BigInt.asUintN(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_asin_c7a8598dcffd627f = function(arg0) {
        const ret = Math.asin(arg0);
        return ret;
    };
    imports.wbg.__wbg_asinh_8f5ffc1478ddfe56 = function(arg0) {
        const ret = Math.asinh(arg0);
        return ret;
    };
    imports.wbg.__wbg_assert_46f7186356292e84 = function(arg0, arg1, arg2, arg3, arg4) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_assert_4f555227c5ac7d8a = function(arg0, arg1, arg2) {
        console.assert(arg0 !== 0, arg1, arg2);
    };
    imports.wbg.__wbg_assert_69037f3eae7e9d7f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_assert_9267b412952df0c0 = function() {
        console.assert();
    };
    imports.wbg.__wbg_assert_c5e46f075f741ed4 = function(arg0, arg1) {
        console.assert(arg0 !== 0, arg1);
    };
    imports.wbg.__wbg_assert_cd90f28afea8c58c = function(arg0) {
        console.assert(arg0 !== 0);
    };
    imports.wbg.__wbg_assert_ea09775311c8fcd1 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_assert_f12924ba8edbc382 = function(arg0, arg1, arg2, arg3) {
        console.assert(arg0 !== 0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_assert_f3a6aa3337af1dbf = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_assert_fb27c85ed850ac03 = function(arg0, arg1) {
        console.assert(arg0 !== 0, ...arg1);
    };
    imports.wbg.__wbg_assign_3627b8559449930a = function(arg0, arg1) {
        const ret = Object.assign(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_assign_e3aced5bef79fc54 = function(arg0, arg1, arg2, arg3) {
        const ret = Object.assign(arg0, arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_assign_eed3574315a8be88 = function(arg0, arg1, arg2) {
        const ret = Object.assign(arg0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_asyncIterator_0225a9ac9cafeede = function() {
        const ret = Symbol.asyncIterator;
        return ret;
    };
    imports.wbg.__wbg_async_9ff6d9e405f13772 = function(arg0) {
        const ret = arg0.async;
        return ret;
    };
    imports.wbg.__wbg_at_0037648248f3a507 = function(arg0, arg1, arg2) {
        const ret = arg1.at(arg2);
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_at_1c3249f7352893d2 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_at_27b904fe2c3a0725 = function(arg0, arg1, arg2) {
        const ret = arg1.at(arg2);
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_at_370a2d9562d412e7 = function(arg0, arg1, arg2) {
        const ret = arg1.at(arg2);
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_at_5c17ce985931eb04 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_7d852dd9f194d43e = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return ret;
    };
    imports.wbg.__wbg_at_90de07f0d0cc1b65 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_9364776d0b7fe643 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_b074e4b11991b877 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_at_ba279b8a401ac67e = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0x100000001 : (ret) >> 0;
    };
    imports.wbg.__wbg_at_d8182cac6199d797 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_at_e274345717782d0e = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_ef3c0541a93417b1 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_atan2_c85f65cc8c936b0b = function(arg0, arg1) {
        const ret = Math.atan2(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_atan_f24a6c1ae092912d = function(arg0) {
        const ret = Math.atan(arg0);
        return ret;
    };
    imports.wbg.__wbg_atanh_fb4e2f29c7af4e32 = function(arg0) {
        const ret = Math.atanh(arg0);
        return ret;
    };
    imports.wbg.__wbg_atob_3fcf5a5437ab47f7 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.atob(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_atob_a5c0c9b67f6ba886 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.atob(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_bind_2edc84e7009c38d4 = function(arg0, arg1, arg2) {
        const ret = arg0.bind(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_bind_ad2e982d1120f0cb = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_bind_b6522eb56f6b0f95 = function(arg0, arg1) {
        const ret = arg0.bind(arg1);
        return ret;
    };
    imports.wbg.__wbg_bind_c8359b1cba058168 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.bind(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_bind_e4791964203591e5 = function(arg0, arg1) {
        const ret = arg0.bind(arg1);
        return ret;
    };
    imports.wbg.__wbg_blur_347057ec60b37695 = function() { return handleError(function (arg0) {
        arg0.blur();
    }, arguments) };
    imports.wbg.__wbg_btoa_6e36c9bb5e7b68e0 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.btoa(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_btoa_d290f734d310dd8f = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.btoa(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_bubbles_afd8dd1d14b05aba = function(arg0) {
        const ret = arg0.bubbles;
        return ret;
    };
    imports.wbg.__wbg_buffer_09165b52af8c5237 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_23e9f922437d64fa = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_62c5112305d6fd9d = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_70f9372398b2b380 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_90cbb614ca327ddc = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_94ae5ab638195fbd = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_9921d7ced4528406 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_a37b65473d783595 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_b0fcc0cacba33ba1 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_caa1636bf6f7e18d = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_cb2ea12980c3eedc = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_e6c6daaa78528d53 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_byteLength_1bdb96d98ab0d871 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_32180cffc5253ce7 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_3a75fc28bfbfec28 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_3db3a6f9a9a32aee = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_58927acaac72e05f = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_65a081d5e119fa19 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_8d2accb665485d18 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_9ca72ffa338a54ce = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_da46574ab005ccca = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_e2cb6a7f4177a9a7 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_e674b853d9c77e1d = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_ea52ac3de882b483 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_ebcf113133dbad49 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_f6fca9cf8db7cea0 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_04a79caf8c7cee0a = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_06441bccedf4a0e9 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_468fc4ec2938bd73 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_4cc6a7f96a00e50b = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_5af380fecfddc6f5 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_6df52c39e521aa03 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_7a1cd9ab17ccc6cd = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_7e0a04158810d576 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_979a8fac4b74efec = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_d7656012e66edc5f = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_ecaa1b55d01fc6a3 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_fd862df290ef848d = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_833bed5770ea2041 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.call(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_b8adc8b1d0a0d8eb = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.call(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_canShare_b86cb5c48763c675 = function(arg0) {
        const ret = arg0.canShare();
        return ret;
    };
    imports.wbg.__wbg_cancelAnimationFrame_089b48301c362fde = function() { return handleError(function (arg0, arg1) {
        arg0.cancelAnimationFrame(arg1);
    }, arguments) };
    imports.wbg.__wbg_cancelBubble_2e66f509cdea4d7e = function(arg0) {
        const ret = arg0.cancelBubble;
        return ret;
    };
    imports.wbg.__wbg_cancelIdleCallback_669eb1ed294c8b8b = function(arg0, arg1) {
        arg0.cancelIdleCallback(arg1 >>> 0);
    };
    imports.wbg.__wbg_cancelable_1c026d5a603c3ce7 = function(arg0) {
        const ret = arg0.cancelable;
        return ret;
    };
    imports.wbg.__wbg_captureEvents_479fb37431a90fc0 = function(arg0) {
        arg0.captureEvents();
    };
    imports.wbg.__wbg_catch_a6e601879b2610e9 = function(arg0, arg1) {
        const ret = arg0.catch(arg1);
        return ret;
    };
    imports.wbg.__wbg_cause_9940c4e8dfcd5129 = function(arg0) {
        const ret = arg0.cause;
        return ret;
    };
    imports.wbg.__wbg_cbrt_226728ee5064e32a = function(arg0) {
        const ret = Math.cbrt(arg0);
        return ret;
    };
    imports.wbg.__wbg_ceil_2a411b0e70cc0baf = function(arg0) {
        const ret = Math.ceil(arg0);
        return ret;
    };
    imports.wbg.__wbg_charAt_89619e9a977710e3 = function(arg0, arg1) {
        const ret = arg0.charAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_charCodeAt_abe5953e37f4b5a6 = function(arg0, arg1) {
        const ret = arg0.charCodeAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_clearInterval_1910fae3bc99f792 = function(arg0) {
        arg0.clearInterval();
    };
    imports.wbg.__wbg_clearInterval_7e2cec20a72545ef = function(arg0) {
        arg0.clearInterval();
    };
    imports.wbg.__wbg_clearInterval_ad2594253cc39c4b = function(arg0, arg1) {
        arg0.clearInterval(arg1);
    };
    imports.wbg.__wbg_clearInterval_eba67734fd13a7f1 = function(arg0, arg1) {
        arg0.clearInterval(arg1);
    };
    imports.wbg.__wbg_clearMarks_162552a2a82eb4e7 = function(arg0, arg1, arg2) {
        arg0.clearMarks(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_clearMarks_3d4cf91eb6b9f159 = function(arg0) {
        arg0.clearMarks();
    };
    imports.wbg.__wbg_clearMeasures_658277b31ee35745 = function(arg0, arg1, arg2) {
        arg0.clearMeasures(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_clearMeasures_72c1604a9dcb1caa = function(arg0) {
        arg0.clearMeasures();
    };
    imports.wbg.__wbg_clearResourceTimings_c78fcc8fc9719d30 = function(arg0) {
        arg0.clearResourceTimings();
    };
    imports.wbg.__wbg_clearTimeout_1194b8cad7a362be = function(arg0) {
        arg0.clearTimeout();
    };
    imports.wbg.__wbg_clearTimeout_a4a1c8c379e0a240 = function(arg0, arg1) {
        arg0.clearTimeout(arg1);
    };
    imports.wbg.__wbg_clearTimeout_b2651b7485c58446 = function(arg0, arg1) {
        arg0.clearTimeout(arg1);
    };
    imports.wbg.__wbg_clearTimeout_e471a57d1a6c4188 = function(arg0) {
        arg0.clearTimeout();
    };
    imports.wbg.__wbg_clear_1f96150ecf4061a6 = function(arg0) {
        arg0.clear();
    };
    imports.wbg.__wbg_clear_f12a18d4396a6a94 = function() {
        console.clear();
    };
    imports.wbg.__wbg_clear_fca8ee600282eba4 = function(arg0) {
        arg0.clear();
    };
    imports.wbg.__wbg_close_4760e2b3758cb809 = function() { return handleError(function (arg0) {
        arg0.close();
    }, arguments) };
    imports.wbg.__wbg_closed_04e8dbfa3fbe0177 = function() { return handleError(function (arg0) {
        const ret = arg0.closed;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_clz32_8663ef8c423ba902 = function(arg0) {
        const ret = Math.clz32(arg0);
        return ret;
    };
    imports.wbg.__wbg_codePointAt_78181f32881e5b59 = function(arg0, arg1) {
        const ret = arg0.codePointAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_compareExchange_04ba2cc47d66e5c3 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.compareExchange(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_compareExchange_ab617023f0b06efc = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.compareExchange(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_compare_0e899d9ef8482432 = function(arg0) {
        const ret = arg0.compare;
        return ret;
    };
    imports.wbg.__wbg_compileStreaming_2428c74f1f1905e9 = function(arg0) {
        const ret = WebAssembly.compileStreaming(arg0);
        return ret;
    };
    imports.wbg.__wbg_compile_5422d3b813875b98 = function(arg0) {
        const ret = WebAssembly.compile(arg0);
        return ret;
    };
    imports.wbg.__wbg_composedPath_977ce97a0ef39358 = function(arg0) {
        const ret = arg0.composedPath();
        return ret;
    };
    imports.wbg.__wbg_composed_765f32977f1cd497 = function(arg0) {
        const ret = arg0.composed;
        return ret;
    };
    imports.wbg.__wbg_concat_9de968491c4340cf = function(arg0, arg1) {
        const ret = arg0.concat(arg1);
        return ret;
    };
    imports.wbg.__wbg_concat_d11834e0ce0498a8 = function(arg0, arg1) {
        const ret = arg0.concat(arg1);
        return ret;
    };
    imports.wbg.__wbg_confirm_1fcaca780fc7e5b6 = function() { return handleError(function (arg0) {
        const ret = arg0.confirm();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_confirm_e2474272c4d0acee = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.confirm(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_construct_b91ff0e53b60c0c3 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.construct(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_construct_e71491b6198ebf47 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.construct(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_constructor_9fd96f589d65d4e5 = function(arg0) {
        const ret = arg0.constructor;
        return ret;
    };
    imports.wbg.__wbg_copyWithin_06c030003f930457 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_19e6fc532cd12562 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_1ea21677ae20395c = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_3a0fc021877bfc2c = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_642a60b719b2e1e4 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_796a328729999082 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_80672fd42bb5c36c = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_89eed76cc8e153eb = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_934343304a34abae = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_ac5c1489ed703705 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_b32cd69075d8ccd5 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_cc4e86f92fb7e78f = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_cos_cbb4f34512fdbc86 = function(arg0) {
        const ret = Math.cos(arg0);
        return ret;
    };
    imports.wbg.__wbg_cosh_5d28307c56957a95 = function(arg0) {
        const ret = Math.cosh(arg0);
        return ret;
    };
    imports.wbg.__wbg_countReset_5a6a884bb99f78b3 = function(arg0, arg1) {
        console.countReset(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_countReset_c43e8b6669c4bc0f = function() {
        console.countReset();
    };
    imports.wbg.__wbg_count_2698ced10967306c = function() {
        console.count();
    };
    imports.wbg.__wbg_count_c1961ed4a53fbb2d = function(arg0, arg1) {
        console.count(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_createImageBitmap_04e04adbb57e2dde = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_2add0d92ad910109 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_7b572ef91684942d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_c800564244fe8bc3 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_create_cfe43ccc88c64e0a = function(arg0) {
        const ret = Object.create(arg0);
        return ret;
    };
    imports.wbg.__wbg_crossOriginIsolated_3589aa89e00c71e6 = function() { return handleError(function () {
        const ret = globalThis.crossOriginIsolated();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = arg0.crypto;
        return ret;
    };
    imports.wbg.__wbg_currentTarget_6f3494de6b6d7897 = function(arg0) {
        const ret = arg0.currentTarget;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_customSections_ba23a87a1675a00b = function(arg0, arg1, arg2) {
        const ret = WebAssembly.Module.customSections(arg0, getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_data_432d9c3df2630942 = function(arg0) {
        const ret = arg0.data;
        return ret;
    };
    imports.wbg.__wbg_data_d1ed736c1e42b10e = function(arg0, arg1) {
        const ret = arg1.data;
        const ptr1 = passArray8ToWasm0(ret, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_debug_04d6b61ad609783a = function(arg0, arg1) {
        console.debug(arg0, arg1);
    };
    imports.wbg.__wbg_debug_080597f733d31ff0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.debug(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_debug_1e3161b3df89806a = function(arg0, arg1, arg2, arg3, arg4) {
        console.debug(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_debug_3cb59063b29f58c1 = function(arg0) {
        console.debug(arg0);
    };
    imports.wbg.__wbg_debug_d76facd5bd84d5bc = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.debug(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_debug_e17b51583ca6a632 = function(arg0, arg1, arg2, arg3) {
        console.debug(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_debug_ea21af4d49cde1d1 = function(arg0, arg1, arg2) {
        console.debug(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_debug_ee2c16e8e5166282 = function() {
        console.debug();
    };
    imports.wbg.__wbg_debug_faaa2b98a2718860 = function(arg0) {
        console.debug(...arg0);
    };
    imports.wbg.__wbg_decodeURIComponent_47f6f7c91d9430fc = function() { return handleError(function (arg0, arg1) {
        const ret = decodeURIComponent(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_decodeURI_985604b8372324c2 = function() { return handleError(function (arg0, arg1) {
        const ret = decodeURI(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_defaultPrevented_2fc2f28cc3ab3140 = function(arg0) {
        const ret = arg0.defaultPrevented;
        return ret;
    };
    imports.wbg.__wbg_defineProperties_67ae1e25439271b5 = function(arg0, arg1) {
        const ret = Object.defineProperties(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_defineProperty_5e0378dd0a5920ab = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.defineProperty(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_defineProperty_a3ddad9901e2d29e = function(arg0, arg1, arg2) {
        const ret = Object.defineProperty(arg0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_deleteProperty_96363d4a1d977c97 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.deleteProperty(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_delete_09c74635f90abbbc = function(arg0, arg1) {
        delete arg0[arg1 >>> 0];
    };
    imports.wbg.__wbg_delete_36c8630e530a2a1a = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_delete_c06665f9786a3023 = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_delete_d6860deb47204f3b = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_delete_da5c7de20b1b076b = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_deviceMemory_57e5763d7efe19bc = function(arg0) {
        const ret = arg0.deviceMemory;
        return ret;
    };
    imports.wbg.__wbg_devicePixelRatio_68c391265f05d093 = function(arg0) {
        const ret = arg0.devicePixelRatio;
        return ret;
    };
    imports.wbg.__wbg_dir_28d8c363cbb9a2aa = function(arg0, arg1) {
        console.dir(arg0, arg1);
    };
    imports.wbg.__wbg_dir_32679dc56dde7410 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.dir(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_dir_6ddbbdd0c1d76d76 = function(arg0, arg1, arg2) {
        console.dir(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_dir_87e72e4e76e15bc1 = function(arg0, arg1, arg2, arg3, arg4) {
        console.dir(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_dir_9bd272ebe191302c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.dir(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_dir_a3488a30215f3b8d = function(arg0) {
        console.dir(...arg0);
    };
    imports.wbg.__wbg_dir_a6df0cf16404243d = function(arg0, arg1, arg2, arg3) {
        console.dir(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_dir_a85d421d0fcc78bc = function(arg0) {
        console.dir(arg0);
    };
    imports.wbg.__wbg_dir_e00787dfdba51a8b = function() {
        console.dir();
    };
    imports.wbg.__wbg_dirxml_2ad8ac7f726012f5 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.dirxml(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_dirxml_409f3cf5d6345bb6 = function() {
        console.dirxml();
    };
    imports.wbg.__wbg_dirxml_47ae855c3fe68bad = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.dirxml(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_dirxml_a2fc53552ab47e13 = function(arg0) {
        console.dirxml(...arg0);
    };
    imports.wbg.__wbg_dirxml_aa1aeb95fa98bc10 = function(arg0, arg1, arg2, arg3) {
        console.dirxml(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_dirxml_c107384435520dc3 = function(arg0, arg1, arg2, arg3, arg4) {
        console.dirxml(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_dirxml_e33bbe6a91eafa31 = function(arg0, arg1) {
        console.dirxml(arg0, arg1);
    };
    imports.wbg.__wbg_dirxml_e8bf8521cd649e97 = function(arg0) {
        console.dirxml(arg0);
    };
    imports.wbg.__wbg_dirxml_e91979a404de2509 = function(arg0, arg1, arg2) {
        console.dirxml(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_dispatchEvent_9e259d7c1d603dfb = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.dispatchEvent(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_doNotTrack_c2a6e66ff1f26d03 = function(arg0, arg1) {
        const ret = arg1.doNotTrack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_done_769e5ede4b31c67b = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_duration_c4974bbe5a2ca54c = function(arg0) {
        const ret = arg0.duration;
        return ret;
    };
    imports.wbg.__wbg_encodeURIComponent_6f2a4577aed2d0dd = function(arg0, arg1) {
        const ret = encodeURIComponent(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_encodeURI_3a90bb7e82d978f0 = function(arg0, arg1) {
        const ret = encodeURI(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_endsWith_d37e7f8ae15136e7 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.endsWith(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_entries_19e50c4e9233b54b = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_3265d4158b33e5dc = function(arg0) {
        const ret = Object.entries(arg0);
        return ret;
    };
    imports.wbg.__wbg_entries_4f104eb781688a73 = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_c8a90a7ed73e84ce = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entryType_e9b0904b4c909c05 = function(arg0, arg1) {
        const ret = arg1.entryType;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_error_1004b8c64097413f = function(arg0, arg1) {
        console.error(arg0, arg1);
    };
    imports.wbg.__wbg_error_13f62fdb4fc06f92 = function(arg0, arg1, arg2) {
        console.error(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_error_524f506f44df1645 = function(arg0) {
        console.error(arg0);
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_error_80de38b3f7cc3c3c = function(arg0, arg1, arg2, arg3) {
        console.error(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_error_dc53417fcef5463a = function(arg0) {
        console.error(...arg0);
    };
    imports.wbg.__wbg_error_dd6754c0a72c651e = function() {
        console.error();
    };
    imports.wbg.__wbg_error_e663b0f2315c3e47 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.error(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_error_f11b8d4d85274b5f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.error(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_error_fdd73e7ac77ed7d5 = function(arg0, arg1, arg2, arg3, arg4) {
        console.error(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_escape_8a957b313047a5dc = function(arg0, arg1) {
        const ret = escape(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_eval_e10dc02e9547f640 = function() { return handleError(function (arg0, arg1) {
        const ret = eval(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_eventPhase_d6ba7259ccde75b4 = function(arg0) {
        const ret = arg0.eventPhase;
        return ret;
    };
    imports.wbg.__wbg_event_5049c5cb1c377cf5 = function(arg0) {
        const ret = arg0.event;
        return ret;
    };
    imports.wbg.__wbg_every_44c3a06a12373d8d = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1760(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.every(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_exception_066fa8768f130ae7 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.exception(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_exception_0e256dfe83944eb5 = function() {
        console.exception();
    };
    imports.wbg.__wbg_exception_11580db5d87cc752 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.exception(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_exception_1197f5d4ce5aa7ec = function(arg0, arg1, arg2, arg3, arg4) {
        console.exception(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_exception_3e2f2df166ee1296 = function(arg0) {
        console.exception(arg0);
    };
    imports.wbg.__wbg_exception_6811627727e5b90d = function(arg0, arg1, arg2, arg3) {
        console.exception(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_exception_cfde1a81735a9585 = function(arg0, arg1, arg2) {
        console.exception(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_exception_d29a906fd252b830 = function(arg0) {
        console.exception(...arg0);
    };
    imports.wbg.__wbg_exception_df6c31ad886d1c8e = function(arg0, arg1) {
        console.exception(arg0, arg1);
    };
    imports.wbg.__wbg_exchange_7f9c8cee5ac0e122 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.exchange(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_exchange_c57e37e19ea8be71 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.exchange(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_exec_3e2d2d0644c927df = function(arg0, arg1, arg2) {
        const ret = arg0.exec(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_exp_35c42d3fa8b52ffa = function(arg0) {
        const ret = Math.exp(arg0);
        return ret;
    };
    imports.wbg.__wbg_expm1_31bbd0ad9480eb90 = function(arg0) {
        const ret = Math.expm1(arg0);
        return ret;
    };
    imports.wbg.__wbg_exports_a3ca1199b2feae47 = function(arg0) {
        const ret = arg0.exports;
        return ret;
    };
    imports.wbg.__wbg_exports_c7319fa8c36d0c51 = function(arg0) {
        const ret = WebAssembly.Module.exports(arg0);
        return ret;
    };
    imports.wbg.__wbg_fetch_1b7e793ab8320753 = function(arg0, arg1, arg2) {
        const ret = arg0.fetch(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_fetch_6fed924f7801d8f3 = function(arg0, arg1, arg2) {
        const ret = arg0.fetch(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_fill_21c7b3e5b39084cd = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_3311db9cdf18c6c4 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_604140e828ec978e = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_6b65f11c6b507981 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_80a72e4db11b99ad = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(BigInt.asUintN(64, arg1), arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_8964745e33e858be = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_b31295b527c4c506 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_b43ad2c03f4bb173 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_b9e6411722f2910a = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_c938e65a1f487194 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_f1524dc1e9469b1a = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_fc912e9ea9cb9fc6 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_filter_17c290b1ff5cd9e8 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1760(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.filter(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_finally_b0e84f80db073b6f = function(arg0, arg1) {
        const ret = arg0.finally(arg1);
        return ret;
    };
    imports.wbg.__wbg_findIndex_3e4f86a66183a36b = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1760(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.findIndex(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_findLastIndex_eb9912c89aaae709 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1760(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.findLastIndex(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_findLast_c528850a356e715f = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1760(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.findLast(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_find_7691d2ec2d320535 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1760(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.find(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_flags_d78ef2a9e5e952d9 = function(arg0) {
        const ret = arg0.flags;
        return ret;
    };
    imports.wbg.__wbg_flatMap_f713e19eb937c724 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1777(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.flatMap(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_flat_a267d030e837af2c = function(arg0, arg1) {
        const ret = arg0.flat(arg1);
        return ret;
    };
    imports.wbg.__wbg_floor_3206eb41fe582a22 = function(arg0) {
        const ret = Math.floor(arg0);
        return ret;
    };
    imports.wbg.__wbg_focus_c8f068803d0427b1 = function() { return handleError(function (arg0) {
        arg0.focus();
    }, arguments) };
    imports.wbg.__wbg_forEach_0411e3301c725fad = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3165(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_31c11340305aba0a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3202(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_39f50e6ccae70982 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3276(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_3e6987bbb3550a5a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3055(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_427b8b90a26e2631 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3313(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_432d981ecbee7d69 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_2527(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_5c190962f0d6d724 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3239(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_93eba4c3bd5ee6b3 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_2981(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_a91d65907f92a131 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3055(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_ab5b100b7d84efef = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_2944(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_c534cd13e9abf80d = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3018(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_d6a05ca96422eff9 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1780(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_e1cf6f7c8ecb7dae = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_2086(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_efa5589f408d714a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_3128(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_for_4ff07bddd743c5e7 = function(arg0, arg1) {
        const ret = Symbol.for(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_formatToParts_bbe7a55463f17c4f = function(arg0, arg1) {
        const ret = arg0.formatToParts(arg1);
        return ret;
    };
    imports.wbg.__wbg_formatToParts_bf2f5b230e6b5bef = function(arg0, arg1) {
        const ret = arg0.formatToParts(arg1);
        return ret;
    };
    imports.wbg.__wbg_formatToParts_d9d8cb8ad7e13072 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.formatToParts(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_format_0545b83dc1d8a934 = function(arg0) {
        const ret = arg0.format;
        return ret;
    };
    imports.wbg.__wbg_format_4f8baaa16c19227f = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.format(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_format_d5288b7100197a55 = function(arg0) {
        const ret = arg0.format;
        return ret;
    };
    imports.wbg.__wbg_frames_adc64b66b05cc67d = function() { return handleError(function (arg0) {
        const ret = arg0.frames;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_freeze_ef6d70cf38e8d948 = function(arg0) {
        const ret = Object.freeze(arg0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_017210bade73996d = function(arg0, arg1, arg2, arg3) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_41ef5d49c5af1702 = function(arg0, arg1, arg2) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_5493f9b25e1ce0a1 = function(arg0, arg1) {
        const ret = String.fromCharCode(...getArrayU16FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_5c7f818046b247b7 = function(arg0, arg1) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_93f48a1cb52bad0b = function(arg0) {
        const ret = String.fromCharCode(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_af4b278a9f65ccb8 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCodePoint_5d34c8ba1c4e93ed = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_916fd1bd1110da40 = function() { return handleError(function (arg0, arg1) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_a9c0f7a4cdffc4f3 = function() { return handleError(function (arg0, arg1) {
        const ret = String.fromCodePoint(...getArrayU32FromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_b09a594f3fe1418b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_e195d404af149f91 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_f37c25c172f2e8b5 = function() { return handleError(function (arg0) {
        const ret = String.fromCodePoint(arg0 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromEntries_524679eecb0bdc2e = function() { return handleError(function (arg0) {
        const ret = Object.fromEntries(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_from_2a5d3e218e67aa85 = function(arg0) {
        const ret = Array.from(arg0);
        return ret;
    };
    imports.wbg.__wbg_fround_34bd493063a4f320 = function(arg0) {
        const ret = Math.fround(arg0);
        return ret;
    };
    imports.wbg.__wbg_getArg_88520473b1a220a7 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getArg(arg1, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getCanonicalLocales_c5d7306b2c223c65 = function(arg0) {
        const ret = Intl.getCanonicalLocales(arg0);
        return ret;
    };
    imports.wbg.__wbg_getDate_ef336e14594b35ce = function(arg0) {
        const ret = arg0.getDate();
        return ret;
    };
    imports.wbg.__wbg_getDay_3da98b461c969439 = function(arg0) {
        const ret = arg0.getDay();
        return ret;
    };
    imports.wbg.__wbg_getEntriesByName_2a5a14d4b09f36a4 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.getEntriesByName(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_getEntriesByName_9fa67d5d430caa15 = function(arg0, arg1, arg2) {
        const ret = arg0.getEntriesByName(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_getEntriesByType_5d2deec4d4dcff89 = function(arg0, arg1, arg2) {
        const ret = arg0.getEntriesByType(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_getEntries_d99f1382d233617d = function(arg0) {
        const ret = arg0.getEntries();
        return ret;
    };
    imports.wbg.__wbg_getFloat32_00c29d27f224ce0a = function(arg0, arg1) {
        const ret = arg0.getFloat32(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getFloat32_e0872364daa466bb = function(arg0, arg1, arg2) {
        const ret = arg0.getFloat32(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getFloat64_3c55a5d18420aa12 = function(arg0, arg1, arg2) {
        const ret = arg0.getFloat64(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getFloat64_7dceab5ddac93b37 = function(arg0, arg1) {
        const ret = arg0.getFloat64(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getFullYear_17d3c9e4db748eb7 = function(arg0) {
        const ret = arg0.getFullYear();
        return ret;
    };
    imports.wbg.__wbg_getGamepads_1f997cef580c9088 = function() { return handleError(function (arg0) {
        const ret = arg0.getGamepads();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getHours_70451b8de3ce8638 = function(arg0) {
        const ret = arg0.getHours();
        return ret;
    };
    imports.wbg.__wbg_getInt16_10c0b730f46d36b6 = function(arg0, arg1, arg2) {
        const ret = arg0.getInt16(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getInt16_246accd71f1892c7 = function(arg0, arg1) {
        const ret = arg0.getInt16(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getInt32_6ea30555a7e6366d = function(arg0, arg1, arg2) {
        const ret = arg0.getInt32(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getInt32_6fd7296105d9e99b = function(arg0, arg1) {
        const ret = arg0.getInt32(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getInt8_84e7c7f490c0f9ab = function(arg0, arg1) {
        const ret = arg0.getInt8(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getMilliseconds_88c5e08788e81f92 = function(arg0) {
        const ret = arg0.getMilliseconds();
        return ret;
    };
    imports.wbg.__wbg_getMinutes_e793d718371e18f7 = function(arg0) {
        const ret = arg0.getMinutes();
        return ret;
    };
    imports.wbg.__wbg_getMonth_d37edcd23642c97d = function(arg0) {
        const ret = arg0.getMonth();
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertyDescriptor_5e8ddf002549cc1f = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.getOwnPropertyDescriptor(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getOwnPropertyDescriptor_9dd936a3c0cbd368 = function(arg0, arg1) {
        const ret = Object.getOwnPropertyDescriptor(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertyDescriptors_ad8f9ef76a3175ff = function(arg0) {
        const ret = Object.getOwnPropertyDescriptors(arg0);
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertyNames_f6c169dd52a5435e = function(arg0) {
        const ret = Object.getOwnPropertyNames(arg0);
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertySymbols_97eebed6fe6e08be = function(arg0) {
        const ret = Object.getOwnPropertySymbols(arg0);
        return ret;
    };
    imports.wbg.__wbg_getPrototypeOf_08aaacea7e300a38 = function() { return handleError(function (arg0) {
        const ret = Reflect.getPrototypeOf(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getPrototypeOf_64af13611bceb86e = function(arg0) {
        const ret = Object.getPrototypeOf(arg0);
        return ret;
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_getSeconds_755197b634cca692 = function(arg0) {
        const ret = arg0.getSeconds();
        return ret;
    };
    imports.wbg.__wbg_getTime_46267b1c24877e30 = function(arg0) {
        const ret = arg0.getTime();
        return ret;
    };
    imports.wbg.__wbg_getTimezoneOffset_6b5752021c499c47 = function(arg0) {
        const ret = arg0.getTimezoneOffset();
        return ret;
    };
    imports.wbg.__wbg_getUTCDate_81a922644bdea1c8 = function(arg0) {
        const ret = arg0.getUTCDate();
        return ret;
    };
    imports.wbg.__wbg_getUTCDay_eae857f4d1ced36d = function(arg0) {
        const ret = arg0.getUTCDay();
        return ret;
    };
    imports.wbg.__wbg_getUTCFullYear_a6f9c66b6c8698dd = function(arg0) {
        const ret = arg0.getUTCFullYear();
        return ret;
    };
    imports.wbg.__wbg_getUTCHours_0500625a80f72d27 = function(arg0) {
        const ret = arg0.getUTCHours();
        return ret;
    };
    imports.wbg.__wbg_getUTCMilliseconds_2c3722e9edc6032b = function(arg0) {
        const ret = arg0.getUTCMilliseconds();
        return ret;
    };
    imports.wbg.__wbg_getUTCMinutes_1d5b5b8a363e98f8 = function(arg0) {
        const ret = arg0.getUTCMinutes();
        return ret;
    };
    imports.wbg.__wbg_getUTCMonth_1628c88863ef1084 = function(arg0) {
        const ret = arg0.getUTCMonth();
        return ret;
    };
    imports.wbg.__wbg_getUTCSeconds_0eed426529881daa = function(arg0) {
        const ret = arg0.getUTCSeconds();
        return ret;
    };
    imports.wbg.__wbg_getUint16_201be5f0c23fb726 = function(arg0, arg1) {
        const ret = arg0.getUint16(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getUint16_21b5ddd2bf7ba173 = function(arg0, arg1, arg2) {
        const ret = arg0.getUint16(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getUint32_78580012d2915dec = function(arg0, arg1, arg2) {
        const ret = arg0.getUint32(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getUint32_9c3cc8fde7919ed4 = function(arg0, arg1) {
        const ret = arg0.getUint32(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getUint8_749a77380c219f58 = function(arg0, arg1) {
        const ret = arg0.getUint8(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getVRDisplays_ab888328ff55e6e2 = function() { return handleError(function (arg0) {
        const ret = arg0.getVRDisplays();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_0b9dd635dc599246 = function(arg0, arg1) {
        const ret = arg0.get(arg1);
        return ret;
    };
    imports.wbg.__wbg_get_13495dac72693ecc = function(arg0, arg1) {
        const ret = arg0.get(arg1);
        return ret;
    };
    imports.wbg.__wbg_get_5df6f18ccf9a51a8 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_67b2ba62fc30de12 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_74b8744f6a23f4fa = function(arg0, arg1, arg2) {
        const ret = arg0[getStringFromWasm0(arg1, arg2)];
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_85c3d71662a108c8 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_9c748c7114bcf125 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.get(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_b9b93047fe3cf45b = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_013d4b906bc5aa19 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_2b2e46a17f14612d = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_2b6c53796ebf0478 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_36afe80e2534b386 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_3ce0cfd27f53fc6d = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_5b00c274b05714aa = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_5c60e5bb54e514e4 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_991af3c05d37345b = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_ae7a776c0e19fedf = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_b3df41665d83d8f3 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getindex_d332410fbea81873 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_getname_a9bc06830b3aa610 = function(arg0, arg1) {
        const ret = arg1.name;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_gettype_3e33317454de2932 = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_WorkerType.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getwithrefkey_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    };
    imports.wbg.__wbg_global_04938130ec921a6a = function(arg0) {
        const ret = arg0.global;
        return ret;
    };
    imports.wbg.__wbg_groupCollapsed_014cb8a43f464558 = function(arg0, arg1, arg2, arg3) {
        console.groupCollapsed(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_groupCollapsed_4b2058a242d8d3e7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.groupCollapsed(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_groupCollapsed_4e37b2743802fca4 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.groupCollapsed(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_groupCollapsed_5016fcd7f8208abe = function(arg0) {
        console.groupCollapsed(arg0);
    };
    imports.wbg.__wbg_groupCollapsed_569f4d78b33ffaab = function(arg0, arg1, arg2) {
        console.groupCollapsed(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_groupCollapsed_5dc4fc8ccfe2f557 = function(arg0, arg1) {
        console.groupCollapsed(arg0, arg1);
    };
    imports.wbg.__wbg_groupCollapsed_91f96ca77fc359bc = function() {
        console.groupCollapsed();
    };
    imports.wbg.__wbg_groupCollapsed_c7b7a21d4a3cbf1a = function(arg0) {
        console.groupCollapsed(...arg0);
    };
    imports.wbg.__wbg_groupCollapsed_ed53701ba45b5b9e = function(arg0, arg1, arg2, arg3, arg4) {
        console.groupCollapsed(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_groupEnd_b914a98ab6af114b = function() {
        console.groupEnd();
    };
    imports.wbg.__wbg_group_07a3ddf64873f3c4 = function(arg0) {
        console.group(...arg0);
    };
    imports.wbg.__wbg_group_241396af511ee425 = function(arg0, arg1, arg2, arg3, arg4) {
        console.group(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_group_445f4c950345b749 = function() {
        console.group();
    };
    imports.wbg.__wbg_group_74eb6b2244978709 = function(arg0, arg1, arg2, arg3) {
        console.group(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_group_b5481e14fe827ba7 = function(arg0, arg1) {
        console.group(arg0, arg1);
    };
    imports.wbg.__wbg_group_bba213abbc4d3f59 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.group(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_group_d25cd6695c8947c4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.group(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_group_d91a02672f44b38c = function(arg0) {
        console.group(arg0);
    };
    imports.wbg.__wbg_group_f51d3276ab64373f = function(arg0, arg1, arg2) {
        console.group(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_grow_43d369088a370694 = function(arg0, arg1) {
        const ret = arg0.grow(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_grow_a2efb85f4eae7f62 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.grow(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_hardwareConcurrency_e840281060cd1953 = function(arg0) {
        const ret = arg0.hardwareConcurrency;
        return ret;
    };
    imports.wbg.__wbg_hasInstance_897023b3f9178eaa = function() {
        const ret = Symbol.hasInstance;
        return ret;
    };
    imports.wbg.__wbg_hasOwnProperty_eb9a168e9990a716 = function(arg0, arg1) {
        const ret = arg0.hasOwnProperty(arg1);
        return ret;
    };
    imports.wbg.__wbg_hasOwn_bbbc0256c3366bfe = function(arg0, arg1) {
        const ret = Object.hasOwn(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_has_4fed1c5f33ebbe44 = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_76ca66e2f25d1c49 = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_7984823c9e23a04a = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_7c5f4d2298d31fb5 = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_a5ea9117f258a0ec = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_height_1d93eb7f5e355d97 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_hypot_c356ef2c94b13bae = function(arg0, arg1) {
        const ret = Math.hypot(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_ignoreCase_fc7595cfc5991daa = function(arg0) {
        const ret = arg0.ignoreCase;
        return ret;
    };
    imports.wbg.__wbg_importScripts_22dff5b488210844 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_importScripts_2feb8f818e05951c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_importScripts_57903bd5bd978626 = function() { return handleError(function (arg0) {
        arg0.importScripts();
    }, arguments) };
    imports.wbg.__wbg_importScripts_5d3b01403f42d57c = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_importScripts_679009b1542ddabb = function() { return handleError(function (arg0, arg1) {
        arg0.importScripts(...arg1);
    }, arguments) };
    imports.wbg.__wbg_importScripts_7b1131d04719e844 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_importScripts_a83bedd56edddda3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_importScripts_c1409bba996684ef = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_importScripts_ebc9ba0108beb837 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_imports_a0be98f47e9ec95f = function(arg0) {
        const ret = WebAssembly.Module.imports(arg0);
        return ret;
    };
    imports.wbg.__wbg_imul_68d7d84e001383fd = function(arg0, arg1) {
        const ret = Math.imul(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_includes_7b5528537c505bd1 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.includes(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_includes_937486a108ec147b = function(arg0, arg1, arg2) {
        const ret = arg0.includes(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_indexOf_09baaccf9ce3d42d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.indexOf(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_indexOf_d4ae214c9b222695 = function(arg0, arg1, arg2) {
        const ret = arg0.indexOf(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_info_033d8b8a0838f1d3 = function(arg0, arg1, arg2, arg3) {
        console.info(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_info_0846673acb7a566a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.info(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_info_1d56a32c182632a2 = function() {
        console.info();
    };
    imports.wbg.__wbg_info_2ff149ea315cdfef = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.info(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_info_3daf2e093e091b66 = function(arg0) {
        console.info(arg0);
    };
    imports.wbg.__wbg_info_7fbe81f62c7b4dab = function(arg0) {
        console.info(...arg0);
    };
    imports.wbg.__wbg_info_82e0194b1a4eb493 = function(arg0, arg1, arg2, arg3, arg4) {
        console.info(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_info_a7dea4373588b687 = function(arg0, arg1) {
        console.info(arg0, arg1);
    };
    imports.wbg.__wbg_info_ecafd3c734ab85b7 = function(arg0, arg1, arg2) {
        console.info(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_initEvent_238fdafafeb7be1d = function(arg0, arg1, arg2) {
        arg0.initEvent(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_initEvent_7cea1a5c8beedb8e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.initEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_initEvent_9bfe7d869f74a583 = function(arg0, arg1, arg2, arg3) {
        arg0.initEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0);
    };
    imports.wbg.__wbg_initMessageEvent_01c7f21675f459f2 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0, arg5, getStringFromWasm0(arg6, arg7));
    };
    imports.wbg.__wbg_initMessageEvent_04cf37972e3c39e7 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_initMessageEvent_06c3572c50b7a9ee = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0, arg5, getStringFromWasm0(arg6, arg7), getStringFromWasm0(arg8, arg9), arg10);
    };
    imports.wbg.__wbg_initMessageEvent_266aef6c78a5dbc6 = function(arg0, arg1, arg2, arg3) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0);
    };
    imports.wbg.__wbg_initMessageEvent_4d14926a7c228e76 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0, arg5);
    };
    imports.wbg.__wbg_initMessageEvent_71ebb3ace32ec08b = function(arg0, arg1, arg2) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_initMessageEvent_7ef4d782d50d47b3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0, arg5, getStringFromWasm0(arg6, arg7), getStringFromWasm0(arg8, arg9), arg10, arg11);
    };
    imports.wbg.__wbg_initMessageEvent_f94e54d2e74115bf = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.initMessageEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0, arg5, getStringFromWasm0(arg6, arg7), getStringFromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_innerHeight_05f4225d754a7929 = function() { return handleError(function (arg0) {
        const ret = arg0.innerHeight;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_innerWidth_7e0498dbd876d498 = function() { return handleError(function (arg0) {
        const ret = arg0.innerWidth;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_input_7bc82bb61badfdde = function() {
        const ret = RegExp.input;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_e14585432e3737fc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Array_6ac07133d621675a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_AsyncIterator_e76ce6393b853986 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof AsyncIterator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Atomics_d8f804f20ba6d401 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Atomics;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_BigInt64Array_54093ef9577a0ead = function(arg0) {
        let result;
        try {
            result = arg0 instanceof BigInt64Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_BigInt_53b823af3c8aa96b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof BigInt;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_BigUint64Array_11036ba986f4cf6c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof BigUint64Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Boolean_b1a15927fb349cc0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Boolean;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Collator_de88950c869f0886 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.Collator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_CompileError_c2cefc4b28ca8a4c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.CompileError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_DataView_865d3c9951e56a3e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof DataView;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_DateTimeFormat_311add6ad2cd65b5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.DateTimeFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Date_e9a9be8b9cea7890 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Date;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Error_4d54113b22d20306 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Error;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Error_7e91bccc17ccebea = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Error;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_EvalError_8a1aaa1ad4c06544 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EvalError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_EventTarget_8c4eb19ce0b8fe12 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EventTarget;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Event_998a4becb0d2339c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Event;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Exception_47cd13073c6e75a9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Exception;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Float32Array_01dd91be3195315d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Float32Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Float64Array_becba31e3ab3ef82 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Float64Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Function_07c665125a9d8cfc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Function;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Generator_b80348a6734f9b59 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Generator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_405b97586371c808 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_9efa0ecb33b61c63 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_e6f7b8c6abc5271a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_f44d86ffaa34e200 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ImageData_fc475d401abac639 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ImageData;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Instance_8dfda0e9d55dc16b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Instance;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Int16Array_51f409e7e77b5328 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Int16Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Int32Array_e5985ec23fafcb9c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Int32Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Int8Array_2897001329f70c4e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Int8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_IteratorNext_95735fbf2ef0a407 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof IteratorNext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Iterator_72ab85832eaeb141 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Iterator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_JsString_e17d03022cc088d8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof String;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_LinkError_f3be775e0b7fc835 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.LinkError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Map_f3469ce2244d2430 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Map;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_MaybeIterator_f82ca544052e9135 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof MaybeIterator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Memory_111add5588accff2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Memory;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_MessageEvent_2e467ced55f682c9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof MessageEvent;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Module_60497ea6b9a51494 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Module;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Module_efcdb9e83b58d379 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Module;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Navigator_1a0ee377f1057fd4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Navigator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_NodeCrypto_16c3b5fd30cef570 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof NodeCrypto;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_NumberFormat_03b339bb01695b56 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.NumberFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Number_85b5745fcb6275b7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Number;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ObjectExt_a3fef57f1b48fc86 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ObjectExt;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Object_7f2dcef8f78644a4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Object;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PerformanceEntry_56b5db38934344c6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof PerformanceEntry;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PerformanceMark_dc92445df105731a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof PerformanceMark;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PerformanceMeasure_76c8eba3e021726b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof PerformanceMeasure;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Performance_0ac1286c87171f57 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Performance;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PluralRules_71ba478349d84230 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.PluralRules;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Process_52182eda75a901fc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Process;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Promise_935168b8f4b49db3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Promise;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Proxy_db81d12997776663 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Proxy;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RangeError_bc6231fb12421b49 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof RangeError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ReferenceError_903561c7bc26d7b0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ReferenceError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RegExp_233cb0448c1407f8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof RegExp;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RelativeTimeFormat_d5f85709d6f1c668 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.RelativeTimeFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RuntimeError_d136e147a095d470 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.RuntimeError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Set_f48781e4bf8ffb09 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Set;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_SharedArrayBuffer_e750d76567bf7e45 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof SharedArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Symbol_d1c8723b734c0517 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Symbol;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_SyntaxError_d161995119c7f7b5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof SyntaxError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Table_4091fe3019f465b6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Table;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Tag_498f5c4dcd0243d6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Tag;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_TypeError_896f9e5789610ec3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof TypeError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint16Array_17c549c1d1af4c33 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint16Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint32Array_b8b88c093c0d7ff4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint32Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_17156bcf118086a9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8ClampedArray_72cd50327e1f4ad6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8ClampedArray;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_UriError_3e788881d4af084d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof URIError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Versions_21fb6fed4b57360a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Versions;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WaitAsyncResult_edf960d3588742b5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WaitAsyncResult;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WeakMap_7702bf863ffac5d4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WeakMap;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WeakSet_a3b6204a2539b375 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WeakSet;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebCrypto_08351f8d1506b2b9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebCrypto;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_def73ea0955fc569 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WorkerGlobalScope_dbdbdea7e3b56493 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WorkerGlobalScope;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WorkerOptions_72372ffeac0d6138 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WorkerOptions;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Worker_6f025d0399bca138 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Worker;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instantiateStreaming_417a2dda32897c94 = function(arg0, arg1) {
        const ret = WebAssembly.instantiateStreaming(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_instantiate_4e6bbe76c13dddbd = function(arg0, arg1) {
        const ret = WebAssembly.instantiate(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_instantiate_78ff71f669329311 = function(arg0, arg1, arg2) {
        const ret = WebAssembly.instantiate(getArrayU8FromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_isArray_a1eab7e0d067391b = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_isConcatSpreadable_18561c7c903c3cdd = function() {
        const ret = Symbol.isConcatSpreadable;
        return ret;
    };
    imports.wbg.__wbg_isExtensible_87b33828efbec2f7 = function() { return handleError(function (arg0) {
        const ret = Reflect.isExtensible(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_isExtensible_afaa1bf106f9e97e = function(arg0) {
        const ret = Object.isExtensible(arg0);
        return ret;
    };
    imports.wbg.__wbg_isFinite_a642942c521d8cde = function(arg0) {
        const ret = isFinite(arg0);
        return ret;
    };
    imports.wbg.__wbg_isFinite_a708d4aff8ddbab4 = function(arg0) {
        const ret = Number.isFinite(arg0);
        return ret;
    };
    imports.wbg.__wbg_isFrozen_86d6e9675e470e1e = function(arg0) {
        const ret = Object.isFrozen(arg0);
        return ret;
    };
    imports.wbg.__wbg_isInteger_d887071db5be36e3 = function(arg0) {
        const ret = Number.isInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_isLockFree_9145717e32ba7771 = function(arg0) {
        const ret = Atomics.isLockFree(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_isNaN_43c030426660ba58 = function(arg0) {
        const ret = Number.isNaN(arg0);
        return ret;
    };
    imports.wbg.__wbg_isPrototypeOf_372fa1d8cba01591 = function(arg0, arg1) {
        const ret = arg0.isPrototypeOf(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_343e2beeeece1bb0 = function(arg0) {
        const ret = Number.isSafeInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSealed_0ef4968c49dea032 = function(arg0) {
        const ret = Object.isSealed(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSecureContext_29f9823e13a0e946 = function(arg0) {
        const ret = arg0.isSecureContext;
        return ret;
    };
    imports.wbg.__wbg_isSecureContext_aedcf3816338189a = function(arg0) {
        const ret = arg0.isSecureContext;
        return ret;
    };
    imports.wbg.__wbg_isTrusted_cc994b7949c53593 = function(arg0) {
        const ret = arg0.isTrusted;
        return ret;
    };
    imports.wbg.__wbg_isView_45918552f958bbb8 = function(arg0) {
        const ret = ArrayBuffer.isView(arg0);
        return ret;
    };
    imports.wbg.__wbg_is_4f5254dec46eb5e1 = function(arg0, arg1) {
        const ret = arg0.is(arg1);
        return ret;
    };
    imports.wbg.__wbg_is_c7481c65e7e5df9e = function(arg0, arg1) {
        const ret = Object.is(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_iterator_9a24c88df860dc65 = function() {
        const ret = Symbol.iterator;
        return ret;
    };
    imports.wbg.__wbg_join_f9ac4707dbaaa63e = function(arg0, arg1, arg2) {
        const ret = arg0.join(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_keyFor_f71fd7c597a97670 = function(arg0) {
        const ret = Symbol.keyFor(arg0);
        return ret;
    };
    imports.wbg.__wbg_keys_4be11949494015fb = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_4e7df9a04572b339 = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_5c77a08ddc2fb8a6 = function(arg0) {
        const ret = Object.keys(arg0);
        return ret;
    };
    imports.wbg.__wbg_keys_867d2062f5df73dc = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_language_d871ec78ee8eec62 = function(arg0, arg1) {
        const ret = arg1.language;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_languages_d8dad509faf757df = function(arg0) {
        const ret = arg0.languages;
        return ret;
    };
    imports.wbg.__wbg_lastEventId_fc2c26ffafb6e5c2 = function(arg0, arg1) {
        const ret = arg1.lastEventId;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lastIndexOf_40d6977cb7f33b2a = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.lastIndexOf(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_lastIndexOf_599945729a9fc10a = function(arg0, arg1, arg2) {
        const ret = arg0.lastIndexOf(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_lastMatch_4a44a12dc8fc064e = function() {
        const ret = RegExp.lastMatch;
        return ret;
    };
    imports.wbg.__wbg_lastParen_a151767da39c8f63 = function() {
        const ret = RegExp.lastParen;
        return ret;
    };
    imports.wbg.__wbg_lastindex_cfde6ee9213d18e2 = function(arg0) {
        const ret = arg0.lastIndex;
        return ret;
    };
    imports.wbg.__wbg_leftContext_c6fea7949ca40a86 = function() {
        const ret = RegExp.leftContext;
        return ret;
    };
    imports.wbg.__wbg_length_07e0772b8084db33 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_1e1dda66fc775b47 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_238152a0aedbb6e7 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_3b4f022188ae8db6 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_65df9cd7c58180b2 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_6ca527665d89694d = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_8cfd2c6409af88ad = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_9f8b63d62581e278 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_a446193dc22c12f8 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_c38244946ebd6be9 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_c67d5e5c3b83737f = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_d52856b9cff20b6c = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_d56737991078581b = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_d92f3ebe2a565f43 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_e2d2a49132c1b256 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_f8c2b921ff6325ae = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_load_37f7461738b4d1ca = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.load(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_load_e8d50870e4f7a070 = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.load(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_localeCompare_aba25b49b5adb9cb = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.localeCompare(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_log10_4096e089ca1af56d = function(arg0) {
        const ret = Math.log10(arg0);
        return ret;
    };
    imports.wbg.__wbg_log1p_d9cfb8db7fbf0ea4 = function(arg0) {
        const ret = Math.log1p(arg0);
        return ret;
    };
    imports.wbg.__wbg_log2_959ad90ebe7ef569 = function(arg0) {
        const ret = Math.log2(arg0);
        return ret;
    };
    imports.wbg.__wbg_log_0e8ddf1fb1eaaf6e = function(arg0) {
        const ret = Math.log(arg0);
        return ret;
    };
    imports.wbg.__wbg_log_12c24d9b9bb67c81 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.log(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_log_19b76e7a298a44d3 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.log(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_log_1ae1e9f741096e91 = function(arg0, arg1) {
        console.log(arg0, arg1);
    };
    imports.wbg.__wbg_log_245868b4b99cdf20 = function(arg0) {
        console.log(...arg0);
    };
    imports.wbg.__wbg_log_53ca6abb454c8644 = function(arg0, arg1, arg2) {
        console.log(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_log_abfb12308b214f30 = function(arg0, arg1, arg2, arg3, arg4) {
        console.log(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_log_c222819a41e063d3 = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_log_cad59bb680daec67 = function(arg0, arg1, arg2, arg3) {
        console.log(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_log_f5462d6e7613efa8 = function() {
        console.log();
    };
    imports.wbg.__wbg_map_e4849f8f12213f6a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1797(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.map(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_mark_001da84b098c950f = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.mark(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_matchAll_8633bfb7fc831cf9 = function(arg0, arg1) {
        const ret = arg0.matchAll(arg1);
        return ret;
    };
    imports.wbg.__wbg_match_6351748d67464863 = function(arg0, arg1) {
        const ret = arg0.match(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_match_bf0cabf948d5aebc = function() {
        const ret = Symbol.match;
        return ret;
    };
    imports.wbg.__wbg_maxTouchPoints_763ee20e665a4536 = function(arg0) {
        const ret = arg0.maxTouchPoints;
        return ret;
    };
    imports.wbg.__wbg_max_0516851425d44529 = function(arg0, arg1) {
        const ret = Math.max(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_measureUserAgentSpecificMemory_a1ffc8fa3d354f9a = function(arg0) {
        const ret = arg0.measureUserAgentSpecificMemory();
        return ret;
    };
    imports.wbg.__wbg_measure_36bc93e7be4ed1bb = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.measure(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_measure_65e49f8bc0e203a8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.measure(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_measure_7534f0bb03d39df6 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.measure(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_message_97a2af9b89d693a3 = function(arg0) {
        const ret = arg0.message;
        return ret;
    };
    imports.wbg.__wbg_min_886b049527853bd8 = function(arg0, arg1) {
        const ret = Math.min(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_moveBy_04b00e1884bc354d = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.moveBy(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_moveTo_2bdd6c73b62c624a = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.moveTo(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = arg0.msCrypto;
        return ret;
    };
    imports.wbg.__wbg_multiline_4d15fd6d25bdfc2b = function(arg0) {
        const ret = arg0.multiline;
        return ret;
    };
    imports.wbg.__wbg_name_0b327d569f00ebee = function(arg0) {
        const ret = arg0.name;
        return ret;
    };
    imports.wbg.__wbg_name_12bde059b9e585e1 = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_name_16617c8e9d4188ac = function(arg0) {
        const ret = arg0.name;
        return ret;
    };
    imports.wbg.__wbg_name_a546fbb44b8bc70a = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_navigator_1577371c070c8947 = function(arg0) {
        const ret = arg0.navigator;
        return ret;
    };
    imports.wbg.__wbg_new0_f788a2397c7ca929 = function() {
        const ret = new Date();
        return ret;
    };
    imports.wbg.__wbg_new_08dc65a1d6785f11 = function(arg0, arg1) {
        const ret = new Intl.NumberFormat(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_0c501ad837dedba0 = function() { return handleError(function (arg0, arg1) {
        const ret = new Event(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_1ab78df5e132f715 = function(arg0, arg1) {
        const ret = new RangeError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_1be7f81095472405 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Instance(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_215d9bc2d34af331 = function(arg0, arg1) {
        const ret = new WebAssembly.RuntimeError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_2328c47df831bde5 = function(arg0, arg1) {
        const ret = new EvalError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_232bf76aa774bea9 = function(arg0, arg1) {
        const ret = new URIError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_23a2665fac83c611 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_2086(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            const ret = new Promise(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_new_2626a2990a9762f6 = function(arg0) {
        const ret = new Int16Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_263e3ed0ecf4a0f0 = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Memory(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_31a97dac4f10fab7 = function(arg0) {
        const ret = new Date(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_3396f7c2ac8bea17 = function(arg0, arg1) {
        const ret = new Intl.RelativeTimeFormat(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_377d0ce71ccbe856 = function() {
        const ret = new WeakSet();
        return ret;
    };
    imports.wbg.__wbg_new_3add1beb692468cb = function(arg0, arg1) {
        const ret = new Proxy(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_405e22f390576ce2 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_49d1d36ae5bd514a = function(arg0, arg1) {
        const ret = new WebAssembly.LinkError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_5a9862266889117b = function(arg0, arg1) {
        const ret = new Intl.PluralRules(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_5e0be73521bc8c17 = function() {
        const ret = new Map();
        return ret;
    };
    imports.wbg.__wbg_new_613e9a13431ae376 = function() { return handleError(function () {
        const ret = new EventTarget();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_61dc378c2412d7e1 = function(arg0, arg1) {
        const ret = new ReferenceError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_63847613cde5d4bc = function(arg0, arg1, arg2, arg3) {
        const ret = new RegExp(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_new_6ef6888614f8a2cc = function(arg0, arg1) {
        const ret = new SyntaxError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_75273663d4f8b523 = function(arg0, arg1) {
        const ret = new Intl.Collator(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_757fd34d47ff40d2 = function(arg0) {
        const ret = new ArrayBuffer(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_780abee5c1739fd7 = function(arg0) {
        const ret = new Float32Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_78c8a92080461d08 = function(arg0) {
        const ret = new Float64Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_78feb108b6472713 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_7a91e41fe43b3c92 = function(arg0) {
        const ret = new Uint8ClampedArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_7e079fa25e135eb1 = function(arg0, arg1, arg2) {
        const ret = new DataView(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_new_8de0180919aeafa0 = function(arg0) {
        const ret = new Int8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_90b6aa09853293ac = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Global(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_92947b367f190a3c = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Module(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_99d41243f28e26b2 = function(arg0) {
        const ret = new Number(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_9fee97a409b32b68 = function(arg0) {
        const ret = new Uint16Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_a239edaa1dc2968f = function(arg0) {
        const ret = new Set(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_a84b4fa486a621ad = function(arg0, arg1) {
        const ret = new Intl.DateTimeFormat(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_aa993a83a6092798 = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Table(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_aa9c15785d2aa302 = function() {
        const ret = new WeakMap();
        return ret;
    };
    imports.wbg.__wbg_new_b08a00743b8ae2f3 = function(arg0, arg1) {
        const ret = new TypeError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_b1a33e5095abf678 = function() { return handleError(function (arg0, arg1) {
        const ret = new Worker(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_bd268764cefc60c9 = function(arg0) {
        const ret = new BigInt64Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_bfc0af80e6f9546f = function() { return handleError(function (arg0, arg1) {
        const ret = new MessageEvent(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_c451cdf5bf10f385 = function(arg0) {
        const ret = new Boolean(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_c68d7209be747379 = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_c757c17a3a479543 = function(arg0) {
        const ret = new SharedArrayBuffer(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_dd8801ea68601332 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Exception(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_de01f3553ffa085b = function(arg0, arg1) {
        const ret = new WebAssembly.CompileError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_e3b321dcfef89fc7 = function(arg0) {
        const ret = new Uint32Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_e5efeb1e59f0eb60 = function(arg0) {
        const ret = new BigUint64Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_e9a4a67dbababe57 = function(arg0) {
        const ret = new Int32Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_ff2e0af67e0c14e1 = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Tag(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newfromstr_42340c4af34277bc = function(arg0, arg1) {
        const ret = new Number(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newregexp_4648929e8461de79 = function(arg0, arg1, arg2) {
        const ret = new RegExp(arg0, getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_newwithargs_ab6ffe8cd6c19c04 = function(arg0, arg1, arg2, arg3) {
        const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_091f2494863d796f = function(arg0, arg1) {
        const ret = new Int16Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_3c5d3722a06563d4 = function(arg0, arg1) {
        const ret = new Float32Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_639cbdb2ee946d95 = function(arg0, arg1) {
        const ret = new Float64Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_712d0128559f2e53 = function(arg0, arg1) {
        const ret = new Uint8Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_8064af2c75b19e1a = function(arg0, arg1) {
        const ret = new BigInt64Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_8225ecdb077b6af4 = function(arg0, arg1) {
        const ret = new Uint8ClampedArray(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_9220c0fb08375e72 = function(arg0, arg1) {
        const ret = new Int8Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_b255ce467d87553b = function(arg0, arg1) {
        const ret = new Int32Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_d5b9a646f0ce0693 = function(arg0, arg1) {
        const ret = new Uint16Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_dc4876c9267d491a = function(arg0, arg1) {
        const ret = new Uint32Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffset_f423d2cf8bc5cefd = function(arg0, arg1) {
        const ret = new BigUint64Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_095d65baacc373dd = function(arg0, arg1, arg2) {
        const ret = new BigUint64Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_6d34787141015158 = function(arg0, arg1, arg2) {
        const ret = new Uint8ClampedArray(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_840f3c038856d4e9 = function(arg0, arg1, arg2) {
        const ret = new Int8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_93c8e0c1a479fa1a = function(arg0, arg1, arg2) {
        const ret = new Float64Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_999332a180064b59 = function(arg0, arg1, arg2) {
        const ret = new Int32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d4a86622320ea258 = function(arg0, arg1, arg2) {
        const ret = new Uint16Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_e6b7e69acd4c7354 = function(arg0, arg1, arg2) {
        const ret = new Float32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_f1dead44d1fc7212 = function(arg0, arg1, arg2) {
        const ret = new Uint32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_f254047f7e80e7ff = function(arg0, arg1, arg2) {
        const ret = new Int16Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_fe845a3aab7ef15e = function(arg0, arg1, arg2) {
        const ret = new BigInt64Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithjsu8clampedarray_4283b8095ad5f2c9 = function() { return handleError(function (arg0, arg1) {
        const ret = new ImageData(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithjsu8clampedarrayandsh_7f3fdc36fd8f9d7a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new ImageData(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithlength_4fd90de0398a9177 = function(arg0) {
        const ret = new Uint16Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_5a5efe313cfd59f1 = function(arg0) {
        const ret = new Float32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_5d1356a27989f1b6 = function(arg0) {
        const ret = new Int8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_5ebc38e611488614 = function(arg0) {
        const ret = new Float64Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_84c6929758560a46 = function(arg0) {
        const ret = new BigUint64Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_b93fcdb8050ed017 = function(arg0) {
        const ret = new Int32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_bd3de93688d68fbc = function(arg0) {
        const ret = new Uint32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_bde4eaf5f44a60c5 = function(arg0) {
        const ret = new BigInt64Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_c4c419ef0bc8a1f8 = function(arg0) {
        const ret = new Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_ee8e1b95dea9d37c = function(arg0) {
        const ret = new Uint8ClampedArray(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_f73a2c8b1b925870 = function(arg0) {
        const ret = new Int16Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithoptions_0419cac3977d7f7f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Worker(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithoptions_e397d7f30f4d6e4e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new WebAssembly.Exception(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithoptions_e863bb7ef3c9b6ab = function(arg0, arg1, arg2) {
        const ret = new Error(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_newwithsharedarraybuffer_ce303d6ddd3f1844 = function(arg0, arg1, arg2) {
        const ret = new DataView(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithsw_dae0a8f485014db3 = function() { return handleError(function (arg0, arg1) {
        const ret = new ImageData(arg0 >>> 0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithu8clampedarray_0fcf78a036c89a97 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithu8clampedarrayandsh_7ea6ee082a25bc85 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithyearmonth_54b29a66f7df4ad1 = function(arg0, arg1) {
        const ret = new Date(arg0 >>> 0, arg1);
        return ret;
    };
    imports.wbg.__wbg_newwithyearmonthday_03748851282a850d = function(arg0, arg1, arg2) {
        const ret = new Date(arg0 >>> 0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_newwithyearmonthdayhr_f08f95599fff3e50 = function(arg0, arg1, arg2, arg3) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_newwithyearmonthdayhrmin_5561c0e76c1bebf3 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_newwithyearmonthdayhrminsec_72c204d952ef4426 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3, arg4, arg5);
        return ret;
    };
    imports.wbg.__wbg_newwithyearmonthdayhrminsecmilli_a13c1e72bd3baa18 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    };
    imports.wbg.__wbg_next_25feadfc0913fea9 = function(arg0) {
        const ret = arg0.next;
        return ret;
    };
    imports.wbg.__wbg_next_38cc0804cc6c3005 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.next(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_6574e1a8a62d1055 = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_c3ab0d59847b3b5c = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = arg0.node;
        return ret;
    };
    imports.wbg.__wbg_normalize_1cd2333f94c462ad = function(arg0, arg1, arg2) {
        const ret = arg0.normalize(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_notify_699dae6852876980 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.notify(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_notify_b54dda7c0c314722 = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.notify(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_now_807e54c39636c349 = function() {
        const ret = Date.now();
        return ret;
    };
    imports.wbg.__wbg_now_d18023d54d4e5500 = function(arg0) {
        const ret = arg0.now();
        return ret;
    };
    imports.wbg.__wbg_of_04ef494b6500b2c5 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = Array.of(arg0, arg1, arg2, arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_of_1483b62f6e3f9868 = function(arg0, arg1, arg2, arg3) {
        const ret = Array.of(arg0, arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_of_2eaf5a02d443ef03 = function(arg0) {
        const ret = Array.of(arg0);
        return ret;
    };
    imports.wbg.__wbg_of_4a05197bfc89556f = function(arg0, arg1, arg2) {
        const ret = Array.of(arg0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_of_66b3ee656cbd962b = function(arg0, arg1) {
        const ret = Array.of(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_onLine_dd34eaeb7b810a04 = function(arg0) {
        const ret = arg0.onLine;
        return ret;
    };
    imports.wbg.__wbg_onabort_2e2ac2e395183c04 = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onafterprint_b8d4041fd193f636 = function(arg0) {
        const ret = arg0.onafterprint;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_ba595daecd6b1b7d = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationend_c49aca2a68e7bb4c = function(arg0) {
        const ret = arg0.onanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationiteration_7c5283807d8df9d4 = function(arg0) {
        const ret = arg0.onanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_c8e49799df9badc0 = function(arg0) {
        const ret = arg0.onanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onappinstalled_829ffbd9ab70adcb = function(arg0) {
        const ret = arg0.onappinstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onauxclick_398a054a995538f8 = function(arg0) {
        const ret = arg0.onauxclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeprint_a4a067b42aa34840 = function(arg0) {
        const ret = arg0.onbeforeprint;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_2b3275d818607b0e = function(arg0) {
        const ret = arg0.onbeforetoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeunload_27db0cfc35f366f0 = function(arg0) {
        const ret = arg0.onbeforeunload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onblur_192e3eec8cf09583 = function(arg0) {
        const ret = arg0.onblur;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_aa6fa116f429fae1 = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_2ccbd8be48ce3012 = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_6953478e7128b81b = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclick_c250d70753f13429 = function(arg0) {
        const ret = arg0.onclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclose_036002baf2254efc = function(arg0) {
        const ret = arg0.onclose;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_e58618a9ed2d2bd8 = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_622e2cff632fccb6 = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_a5ca8c8d117a89c4 = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_fcb8f3af812d8952 = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_380aa3550be1d943 = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_19b52e38b562da16 = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_8e89995907e3a82b = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_3613dbd00a1c2273 = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_e6dd41a2a256e1e9 = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_68525a87fd29df73 = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_4f52af7fe3f763c3 = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_ae3bd07ea842f938 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_55082d5a0a35dc4e = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_8219bbf095e31c2e = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_928085c4f34d8ef2 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_de66d06d9d999647 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfocus_055c161d27a701a0 = function(arg0) {
        const ret = arg0.onfocus;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongamepadconnected_da718e648325e3ff = function(arg0) {
        const ret = arg0.ongamepadconnected;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongamepaddisconnected_afbba19edab6a711 = function(arg0) {
        const ret = arg0.ongamepaddisconnected;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongotpointercapture_34ee7b7362e95095 = function(arg0) {
        const ret = arg0.ongotpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onhashchange_027510d809521972 = function(arg0) {
        const ret = arg0.onhashchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninput_385de826c54d8a6f = function(arg0) {
        const ret = arg0.oninput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_aac9f532a40a524f = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_8927e228c1a36aee = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_86ce478e888e0395 = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_a86ac008ef3d776c = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlanguagechange_fab3ea5b146ac64a = function(arg0) {
        const ret = arg0.onlanguagechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onload_63d9d62aa036102a = function(arg0) {
        const ret = arg0.onload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadeddata_2e6102c25f3ee0df = function(arg0) {
        const ret = arg0.onloadeddata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_dd032ceea37cee99 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_ca292be1be9a2b11 = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_aa0bb15042ab36ab = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_6f321d3b980aa198 = function(arg0) {
        const ret = arg0.onlostpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessage_5b9ed2a1cf0835cf = function(arg0) {
        const ret = arg0.onmessage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessage_f758d4c56920afd7 = function(arg0) {
        const ret = arg0.onmessage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessageerror_4f095c77fee2caac = function(arg0) {
        const ret = arg0.onmessageerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessageerror_b0c2724ed22153c2 = function(arg0) {
        const ret = arg0.onmessageerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousedown_1f005454196a2637 = function(arg0) {
        const ret = arg0.onmousedown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_db57f5d8b4dd20e9 = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_9ba472fb29e563e4 = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousemove_b9248ae2e19c1e7f = function(arg0) {
        const ret = arg0.onmousemove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseout_16160f19f840f06e = function(arg0) {
        const ret = arg0.onmouseout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_3a59a885342d6e59 = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_78ce7dcdb1180893 = function(arg0) {
        const ret = arg0.onmouseup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onoffline_412b444769dc56e7 = function(arg0) {
        const ret = arg0.onoffline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onoffline_6d32007d27859d17 = function(arg0) {
        const ret = arg0.onoffline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ononline_47453e91708052f0 = function(arg0) {
        const ret = arg0.ononline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ononline_7cfef99f83d9d299 = function(arg0) {
        const ret = arg0.ononline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onorientationchange_f0aa9907dcf3af11 = function(arg0) {
        const ret = arg0.onorientationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpagehide_cbebb8a529239ab9 = function(arg0) {
        const ret = arg0.onpagehide;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpageshow_9748e94d9d628c71 = function(arg0) {
        const ret = arg0.onpageshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_6a5ab6990ea4db9c = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_baa51301aef9e5d4 = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_af0929a07f880a1c = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_2ed491d8ac5da41d = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_3d9285a7acbbe96d = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_b8c025e2bec9a14c = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_9430902af6b3f6d6 = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_79823b2399f24a39 = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_c0ded2e1ad95bbb3 = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_9c6dee97e94da9ec = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_61cff048bd2b3133 = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpopstate_e82d79b8cb323edc = function(arg0) {
        const ret = arg0.onpopstate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_4f202162c844e5e0 = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_18539fbde5a5dcfd = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_fef6a167dd79f02c = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresize_f7c629b5a1fb5901 = function(arg0) {
        const ret = arg0.onresize;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresourcetimingbufferfull_fe69e9cdea9a7c54 = function(arg0) {
        const ret = arg0.onresourcetimingbufferfull;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onscroll_514bead97aa4238d = function(arg0) {
        const ret = arg0.onscroll;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_ed778c07cce579df = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeking_f6e0db6ef6f77d05 = function(arg0) {
        const ret = arg0.onseeking;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselect_02a40e43c16acf70 = function(arg0) {
        const ret = arg0.onselect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_fade53fd5be5b264 = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_ac8dcac456e1c345 = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_3d9a4e7de5a687e2 = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstorage_a4d060477e453ac6 = function(arg0) {
        const ret = arg0.onstorage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsubmit_afa35fa70b172859 = function(arg0) {
        const ret = arg0.onsubmit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsuspend_0fdf206492e03afa = function(arg0) {
        const ret = arg0.onsuspend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_6d25aeb62aac074c = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_1f4b7214898c74d7 = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchcancel_fb0d159b4d66c9b9 = function(arg0) {
        const ret = arg0.ontouchcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchend_07c6525da87b7b30 = function(arg0) {
        const ret = arg0.ontouchend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_863e3cfa3cce0a68 = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_dcbfc08d5393c542 = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitioncancel_4b4658b998944c9a = function(arg0) {
        const ret = arg0.ontransitioncancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionend_0b11d5fbf801fd4d = function(arg0) {
        const ret = arg0.ontransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_a49ecd52c0f6948c = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_7865a02252d64d64 = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onunload_8eba91685150944d = function(arg0) {
        const ret = arg0.onunload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_924f97d72277931c = function(arg0) {
        const ret = arg0.onvolumechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplayactivate_20f257696287a13f = function(arg0) {
        const ret = arg0.onvrdisplayactivate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplayconnect_60e3a39c5c162b86 = function(arg0) {
        const ret = arg0.onvrdisplayconnect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplaydeactivate_359536c12478546f = function(arg0) {
        const ret = arg0.onvrdisplaydeactivate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplaydisconnect_2908bb31d9823408 = function(arg0) {
        const ret = arg0.onvrdisplaydisconnect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplaypresentchange_b6d3ee30d17a7167 = function(arg0) {
        const ret = arg0.onvrdisplaypresentchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaiting_7a56a19d23cb2787 = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_2a058fa9a76c562d = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_ba3792c51a9172b6 = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_68c928c36bd2371c = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkittransitionend_b447f342b54b5b51 = function(arg0) {
        const ret = arg0.onwebkittransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwheel_0dc333ebf840b5fe = function(arg0) {
        const ret = arg0.onwheel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_open_133269b8b8f0081c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_open_6c3f5ef5a0204c5d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_open_a9f9f906ba53e934 = function() { return handleError(function (arg0) {
        const ret = arg0.open();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_open_be2b7c16bd9eb2cb = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_opener_36b1dd875196d01f = function() { return handleError(function (arg0) {
        const ret = arg0.opener;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_or_6b371080b70c57c4 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.or(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_or_ec9f7c1eaa23dd65 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.or(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_orientation_66f662b0fa29286f = function(arg0) {
        const ret = arg0.orientation;
        return ret;
    };
    imports.wbg.__wbg_origin_1d664917fb08d320 = function(arg0, arg1) {
        const ret = arg1.origin;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_origin_3a1afbb4ffac9e0c = function(arg0, arg1) {
        const ret = arg1.origin;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_origin_e456f9a154a7ca78 = function(arg0, arg1) {
        const ret = arg1.origin;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_outerHeight_61c6c9169b95f3ab = function() { return handleError(function (arg0) {
        const ret = arg0.outerHeight;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_outerWidth_9b07ed6d31481aff = function() { return handleError(function (arg0) {
        const ret = arg0.outerWidth;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_ownKeys_3930041068756f1f = function() { return handleError(function (arg0) {
        const ret = Reflect.ownKeys(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_padEnd_3054a094456b80a0 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.padEnd(arg1 >>> 0, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_padStart_d7cedac5e866d377 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.padStart(arg1 >>> 0, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_pageXOffset_48820339e455f4ec = function() { return handleError(function (arg0) {
        const ret = arg0.pageXOffset;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_pageYOffset_9cd68bc5387501b3 = function() { return handleError(function (arg0) {
        const ret = arg0.pageYOffset;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_parent_ac72de2e193460fd = function() { return handleError(function (arg0) {
        const ret = arg0.parent;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_parseFloat_40655e71a57d91e0 = function(arg0, arg1) {
        const ret = parseFloat(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_parseFloat_7e07eec2726e65d0 = function(arg0, arg1) {
        const ret = Number.parseFloat(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_parseInt_01d4a03838fa55bc = function(arg0, arg1, arg2) {
        const ret = Number.parseInt(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_parseInt_7deceafc75400ae4 = function(arg0, arg1, arg2) {
        const ret = parseInt(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_parse_d8ad31530d0d1b1e = function(arg0, arg1) {
        const ret = Date.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_parse_def2e24ef1252aff = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_performance_704644393c4d3310 = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_performance_c185c0cdc2766575 = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_platform_faf02c487289f206 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.platform;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_pop_664cca873297c974 = function(arg0) {
        const ret = arg0.pop();
        return ret;
    };
    imports.wbg.__wbg_ports_b00492ca2866b691 = function(arg0) {
        const ret = arg0.ports;
        return ret;
    };
    imports.wbg.__wbg_postMessage_6edafa8f7b9c2f52 = function() { return handleError(function (arg0, arg1) {
        arg0.postMessage(arg1);
    }, arguments) };
    imports.wbg.__wbg_postMessage_8c0100a70b86428f = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.postMessage(arg1, getStringFromWasm0(arg2, arg3));
    }, arguments) };
    imports.wbg.__wbg_postMessage_df7290b432734375 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.postMessage(arg1, getStringFromWasm0(arg2, arg3), arg4);
    }, arguments) };
    imports.wbg.__wbg_postMessage_f961e53b9731ca83 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.postMessage(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_pow_35f95838ecd24e51 = function(arg0, arg1) {
        const ret = Math.pow(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_preventDefault_c2314fd813c02b3c = function(arg0) {
        arg0.preventDefault();
    };
    imports.wbg.__wbg_preventExtensions_8e5dccd08714c897 = function(arg0) {
        Object.preventExtensions(arg0);
    };
    imports.wbg.__wbg_preventExtensions_8f7c2fc7c26c9de5 = function() { return handleError(function (arg0) {
        const ret = Reflect.preventExtensions(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_print_3b7e1edbc1f394f9 = function() { return handleError(function (arg0) {
        arg0.print();
    }, arguments) };
    imports.wbg.__wbg_process_669a7ac64944e44a = function() { return handleError(function () {
        const ret = globalThis.process();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(arg0) {
        const ret = arg0.process;
        return ret;
    };
    imports.wbg.__wbg_product_d8471bb6840b06fa = function(arg0, arg1) {
        const ret = arg1.product;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_profileEnd_034022e7f56fb29b = function(arg0, arg1, arg2) {
        console.profileEnd(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_profileEnd_1bc5336746dcaadb = function(arg0) {
        console.profileEnd(...arg0);
    };
    imports.wbg.__wbg_profileEnd_27f01cff03e83fd9 = function() {
        console.profileEnd();
    };
    imports.wbg.__wbg_profileEnd_4626eeb603cfee69 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.profileEnd(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_profileEnd_47d8cbd43fa3639c = function(arg0, arg1) {
        console.profileEnd(arg0, arg1);
    };
    imports.wbg.__wbg_profileEnd_804aa6edfb368e26 = function(arg0, arg1, arg2, arg3, arg4) {
        console.profileEnd(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_profileEnd_88e3fcfd45adcdbd = function(arg0, arg1, arg2, arg3) {
        console.profileEnd(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_profileEnd_a0631f0c411f6281 = function(arg0) {
        console.profileEnd(arg0);
    };
    imports.wbg.__wbg_profileEnd_d8cfc004ee55fe94 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.profileEnd(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_profile_10685fb7a699c8d2 = function(arg0) {
        console.profile(...arg0);
    };
    imports.wbg.__wbg_profile_337cdc62c7ba3680 = function(arg0, arg1, arg2, arg3, arg4) {
        console.profile(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_profile_9cbbe019099e773c = function(arg0, arg1, arg2) {
        console.profile(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_profile_a1f4d76de4eb7bba = function(arg0, arg1, arg2, arg3) {
        console.profile(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_profile_d2863881f12a41a1 = function(arg0) {
        console.profile(arg0);
    };
    imports.wbg.__wbg_profile_dc2c557b9be3e969 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.profile(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_profile_ddf2d62e6b917097 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.profile(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_profile_f54fa90c3a016c32 = function(arg0, arg1) {
        console.profile(arg0, arg1);
    };
    imports.wbg.__wbg_profile_fc732fe96df4dc4c = function() {
        console.profile();
    };
    imports.wbg.__wbg_prompt_3f1c779abb961426 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.prompt();
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_prompt_653c7547ba4ad777 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg1.prompt(getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_prompt_6f8d98756013e3b0 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.prompt(getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_propertyIsEnumerable_958e5d08bfe58987 = function(arg0, arg1) {
        const ret = arg0.propertyIsEnumerable(arg1);
        return ret;
    };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbg_queryLocalFonts_4c6ef1525bf49dc4 = function() { return handleError(function (arg0) {
        const ret = arg0.queryLocalFonts();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_queueMicrotask_105d75ca4423d8f9 = function(arg0, arg1) {
        arg0.queueMicrotask(arg1);
    };
    imports.wbg.__wbg_queueMicrotask_65a6c48ee9790d40 = function(arg0, arg1) {
        arg0.queueMicrotask(arg1);
    };
    imports.wbg.__wbg_queueMicrotask_97d92b4fcc8a61c5 = function(arg0) {
        queueMicrotask(arg0);
    };
    imports.wbg.__wbg_queueMicrotask_d3219def82552485 = function(arg0) {
        const ret = arg0.queueMicrotask;
        return ret;
    };
    imports.wbg.__wbg_race_ace53f9902587e09 = function(arg0) {
        const ret = Promise.race(arg0);
        return ret;
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_random_3ad904d98382defe = function() {
        const ret = Math.random();
        return ret;
    };
    imports.wbg.__wbg_raw_048a48521e593215 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_1ffefae640047a65 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_22fcd14478426531 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_3dfda9c5bb468fe5 = function() { return handleError(function (arg0) {
        const ret = String.raw(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_4fa52e9d908bab3d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_5623cfebccabe4c9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_acaf844c040708fe = function() { return handleError(function (arg0, arg1) {
        const ret = String.raw(arg0, ...arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_eb5a6f46c57a16ef = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_ed844e71aa8f7b5e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_reduceRight_3df34d923c3749da = function(arg0, arg1, arg2, arg3) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2, arg3) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1814(a, state0.b, arg0, arg1, arg2, arg3);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.reduceRight(cb0, arg3);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_reduce_7a736dffa18146a9 = function(arg0, arg1, arg2, arg3) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2, arg3) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1814(a, state0.b, arg0, arg1, arg2, arg3);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.reduce(cb0, arg3);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_registerContentHandler_b3651c41c4fc3f66 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.registerContentHandler(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_registerProtocolHandler_68ea96af66ab5cea = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.registerProtocolHandler(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_reject_b3fcf99063186ff7 = function(arg0) {
        const ret = Promise.reject(arg0);
        return ret;
    };
    imports.wbg.__wbg_releaseEvents_ebe41c227dcd8afc = function(arg0) {
        arg0.releaseEvents();
    };
    imports.wbg.__wbg_removeEventListener_056dfe8c3d6c58f9 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_removeEventListener_d365ee1c2a7b08f0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0);
    }, arguments) };
    imports.wbg.__wbg_repeat_33b0f5d4055feb03 = function(arg0, arg1) {
        const ret = arg0.repeat(arg1);
        return ret;
    };
    imports.wbg.__wbg_replaceAll_2bd6e7b8f77d84d5 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.replaceAll(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_replaceAll_7116a64ee7a34aa6 = function(arg0, arg1, arg2) {
        const ret = arg0.replaceAll(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_replaceAll_a86c9cabf09252d0 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replaceAll(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_replaceAll_cb87650ed5b86ac9 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replaceAll(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_replace_21c2f331b5f60537 = function(arg0, arg1, arg2) {
        const ret = arg0.replace(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_replace_36a54c48b7cefe2e = function() {
        const ret = Symbol.replace;
        return ret;
    };
    imports.wbg.__wbg_replace_4ffadecc1813eeb7 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.replace(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_replace_5f8f0dfb7c0efb12 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replace(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_replace_e0f60142c1c56251 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replace(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_requestAnimationFrame_d7fd890aaefc3246 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestAnimationFrame(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestIdleCallback_e3eefd34962470e1 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestIdleCallback(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestMIDIAccess_86889ca4eb6661f6 = function() { return handleError(function (arg0) {
        const ret = arg0.requestMIDIAccess();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestMediaKeySystemAccess_620917ec537552b7 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.requestMediaKeySystemAccess(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_resizeBy_b68be00d5a5f4447 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.resizeBy(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_resizeTo_1b5992ab93dc34b9 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.resizeTo(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_resolve_4851785c9c5f573d = function(arg0) {
        const ret = Promise.resolve(arg0);
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_8208e7b200dcf4e9 = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_a733b0797636ab2c = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_bf765ffc958dfa69 = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_c74e04336bed4fb8 = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_d495c21c27a8f865 = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_return_3e4e8a0813efddbf = function(arg0, arg1) {
        const ret = arg0.return(arg1);
        return ret;
    };
    imports.wbg.__wbg_reverse_71c11f9686a5c11b = function(arg0) {
        const ret = arg0.reverse();
        return ret;
    };
    imports.wbg.__wbg_revocable_36a8fb77a29299af = function(arg0, arg1) {
        const ret = Proxy.revocable(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_rightContext_731816b28cd917c2 = function() {
        const ret = RegExp.rightContext;
        return ret;
    };
    imports.wbg.__wbg_round_d3c6f5f0c2d66c40 = function(arg0) {
        const ret = Math.round(arg0);
        return ret;
    };
    imports.wbg.__wbg_screenX_a83f227e7f12ec27 = function() { return handleError(function (arg0) {
        const ret = arg0.screenX;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_screenY_e4bb791391d3daad = function() { return handleError(function (arg0) {
        const ret = arg0.screenY;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scrollBy_59451c12501a014f = function(arg0, arg1, arg2) {
        arg0.scrollBy(arg1, arg2);
    };
    imports.wbg.__wbg_scrollBy_695675804a27c286 = function(arg0) {
        arg0.scrollBy();
    };
    imports.wbg.__wbg_scrollTo_1933346951679624 = function(arg0) {
        arg0.scrollTo();
    };
    imports.wbg.__wbg_scrollTo_26cd993048111460 = function(arg0, arg1, arg2) {
        arg0.scrollTo(arg1, arg2);
    };
    imports.wbg.__wbg_scrollX_02fa7e84cc48b8fe = function() { return handleError(function (arg0) {
        const ret = arg0.scrollX;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scrollY_94bf061418186bb3 = function() { return handleError(function (arg0) {
        const ret = arg0.scrollY;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scroll_0599033488663a6c = function(arg0, arg1, arg2) {
        arg0.scroll(arg1, arg2);
    };
    imports.wbg.__wbg_scroll_bf72969f3afda887 = function(arg0) {
        arg0.scroll();
    };
    imports.wbg.__wbg_seal_33f55eba2ecb78ca = function(arg0) {
        const ret = Object.seal(arg0);
        return ret;
    };
    imports.wbg.__wbg_search_43c4dd40b39bca6c = function() {
        const ret = Symbol.search;
        return ret;
    };
    imports.wbg.__wbg_search_db83e9563041480d = function(arg0, arg1) {
        const ret = arg0.search(arg1);
        return ret;
    };
    imports.wbg.__wbg_select_a63ef9df6c7b7d0d = function(arg0, arg1) {
        const ret = arg0.select(arg1);
        return ret;
    };
    imports.wbg.__wbg_self_9b81dfebd2c7e4ea = function(arg0) {
        const ret = arg0.self;
        return ret;
    };
    imports.wbg.__wbg_self_ba48e45118f453fe = function(arg0) {
        const ret = arg0.self;
        return ret;
    };
    imports.wbg.__wbg_sendBeacon_58ab518b2de39a96 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_64bba96f2527ca68 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_a5e6a69f26f145a2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3 === 0 ? undefined : getArrayU8FromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_a98a679269b5461a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3 === 0 ? undefined : getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_f602aa0b831a1063 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setDate_90491bc93d09cadd = function(arg0, arg1) {
        const ret = arg0.setDate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setFloat32_999b0483a3cca36d = function(arg0, arg1, arg2) {
        arg0.setFloat32(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setFloat32_c0e42bd7a3e32ace = function(arg0, arg1, arg2, arg3) {
        arg0.setFloat32(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setFloat64_5d4ae7d816da8ff4 = function(arg0, arg1, arg2, arg3) {
        arg0.setFloat64(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setFloat64_e0758fb3922454a6 = function(arg0, arg1, arg2) {
        arg0.setFloat64(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setFullYear_6fb6b27904998f9d = function(arg0, arg1) {
        const ret = arg0.setFullYear(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setFullYear_77f2728d1363e833 = function(arg0, arg1, arg2) {
        const ret = arg0.setFullYear(arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_setFullYear_defb81082dc64642 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.setFullYear(arg1 >>> 0, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_setHours_a0015b8607d67419 = function(arg0, arg1) {
        const ret = arg0.setHours(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setInt16_98206d0c05f71194 = function(arg0, arg1, arg2, arg3) {
        arg0.setInt16(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setInt16_b68dde92e883b65c = function(arg0, arg1, arg2) {
        arg0.setInt16(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setInt32_1e8dd470e09919fd = function(arg0, arg1, arg2) {
        arg0.setInt32(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setInt32_2c2e7774a83284aa = function(arg0, arg1, arg2, arg3) {
        arg0.setInt32(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setInt8_02192f07c0756613 = function(arg0, arg1, arg2) {
        arg0.setInt8(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setInterval_04dd484f05defaa2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_0901e3bed1b23a7a = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setInterval(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_0923cfd81102c272 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_0e40a6ee4a12e065 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_2f4c9e62dfc21889 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_3282e2ef2d188226 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_32a5535eaab9464a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_3676337fd6140daa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_4e10679bb54d40d8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_50182bcb185ddfa4 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_5035112ad456b6ee = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_551ca9c939d8761b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_58460096a7dd697d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_5b8f18b3570298d2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6274906e29968d3e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_64dd6b7cf8c213f0 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6b496b820a789690 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6bcc6eb5a25f815b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6beb58177be980f2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6d6e28297322ec4b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_72cc42c39c605a26 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_73903f4e94825f6c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_78c95d7464214a01 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_7ad0472faa693c6f = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_7c4a6e548dd71436 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setInterval(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_83d54331ceeda644 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_8c948c1584a5770d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_989f13429fcafc57 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_9ffe4a25023ab147 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_bb81b73dbc620f8e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_c6ec6d648035e95a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_c77c760a8ab1eaf1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_c8cd158e93af68e4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_cfbb32b46c873db2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_d307f1b116515391 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_d4f8bdcc1d5b1da9 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_d54ded80d1b95a2d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_e2d9ea1823767884 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_f9719483d3cd6bf9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_ff7bcca1ab6009cf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setMilliseconds_91a36a169d15317b = function(arg0, arg1) {
        const ret = arg0.setMilliseconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setMinutes_0eace0dcf9530f36 = function(arg0, arg1) {
        const ret = arg0.setMinutes(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setMonth_882060a82c467ba3 = function(arg0, arg1) {
        const ret = arg0.setMonth(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setPrototypeOf_6c119f585215a641 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.setPrototypeOf(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setPrototypeOf_8e67f98bc0899e4a = function(arg0, arg1) {
        const ret = Object.setPrototypeOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_setResourceTimingBufferSize_988cd68d8c634aa2 = function(arg0, arg1) {
        arg0.setResourceTimingBufferSize(arg1 >>> 0);
    };
    imports.wbg.__wbg_setSeconds_273c40b0a2343530 = function(arg0, arg1) {
        const ret = arg0.setSeconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setTime_8afa2faa26e7eb59 = function(arg0, arg1) {
        const ret = arg0.setTime(arg1);
        return ret;
    };
    imports.wbg.__wbg_setTimeout_02edae9da963e8a4 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setTimeout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_0d4dd547f4f0bd07 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_189f0f6e534472c7 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_1fa03a76ad81a5c5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_2065eea88143be51 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_21efc9790ea87608 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_26b38d86f9550652 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_3168f646340efec4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_360b2cfb66ec92c4 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_3b88418fd8e56ad0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_461fec76662b35ea = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setTimeout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_50607e60e3dd7b99 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_56185d378e4967f1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_59ff66909af74070 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_5ca15d6c93bf371a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_6deb565bfb06fba0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_7408a88fa695db8f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_7c8be94132e230fa = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_80ea42c0b943dacf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_82d7f6c6ab219418 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_8d0b2b84852512a8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_96a00a026636da95 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_99bb3119db589538 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_9bb0b2e18ebca265 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_9f6a68d4314848c8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_a44ec7812459cbc1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_a68a410cb8c4c7a9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_a7ca757c62a1b593 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_b2b6002ff0414de8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_b4ee584b3f982e97 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_bd69941efa9afca5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_c05db86cc4667fca = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_cbfefeef4a9fd68f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_dade1d689569e63c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_e9a5df876266ecde = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_f2fe5af8e3debeb3 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_f48a464d534b0139 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_fd3e4e0b704a7124 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_fd7a20e4c277b3b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_feaa323fbab396be = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setUTCDate_752af726c3d0353a = function(arg0, arg1) {
        const ret = arg0.setUTCDate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCFullYear_16b9cd00a57c96f3 = function(arg0, arg1) {
        const ret = arg0.setUTCFullYear(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCFullYear_1ef361642c0f60a7 = function(arg0, arg1, arg2) {
        const ret = arg0.setUTCFullYear(arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_setUTCFullYear_ccecb86f835fc949 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.setUTCFullYear(arg1 >>> 0, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_setUTCHours_56b347a46c5ba182 = function(arg0, arg1) {
        const ret = arg0.setUTCHours(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCMilliseconds_12c6ee18756537fa = function(arg0, arg1) {
        const ret = arg0.setUTCMilliseconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCMinutes_b74fa124314606d8 = function(arg0, arg1) {
        const ret = arg0.setUTCMinutes(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCMonth_6a32defc2f76341e = function(arg0, arg1) {
        const ret = arg0.setUTCMonth(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCSeconds_3162b526c0aa7b96 = function(arg0, arg1) {
        const ret = arg0.setUTCSeconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUint16_1b9b3bfa170b08f1 = function(arg0, arg1, arg2, arg3) {
        arg0.setUint16(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setUint16_52b6d22fcb36d9ee = function(arg0, arg1, arg2) {
        arg0.setUint16(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setUint32_50bd13a7bc859d75 = function(arg0, arg1, arg2, arg3) {
        arg0.setUint32(arg1 >>> 0, arg2 >>> 0, arg3 !== 0);
    };
    imports.wbg.__wbg_setUint32_ad8826b8caeaf63d = function(arg0, arg1, arg2) {
        arg0.setUint32(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_setUint8_a2fddf9c40cdcc0d = function(arg0, arg1, arg2) {
        arg0.setUint8(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_set_10bad9bee0e9c58b = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_17060c045911830c = function(arg0, arg1, arg2) {
        const ret = arg0.set(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_set_29b6f95e6adb667e = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_2bff331e6fe25bf4 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_37837023f3d740e8 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_set_5882e5672c74f0b1 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_6775f73144c2ef27 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_83c639e27a117753 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_8fc6bf8a5b1071d1 = function(arg0, arg1, arg2) {
        const ret = arg0.set(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_set_958acb46280370e5 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_98629cd6f1be3d3f = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_a5e40949eee15582 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Reflect.set(arg0, arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_bb8cecf6a62b9f46 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_c481e5d5a6de7aa5 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.set(arg1 >>> 0, arg2);
    }, arguments) };
    imports.wbg.__wbg_set_ca5a3be96ec3accc = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_d23661d19148b229 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_e19aad29cdaa3e80 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_f4f1f0daa30696fc = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_setcancelBubble_67a62cf82c269e56 = function(arg0, arg1) {
        arg0.cancelBubble = arg1 !== 0;
    };
    imports.wbg.__wbg_setcause_180f5110152d3ce3 = function(arg0, arg1) {
        arg0.cause = arg1;
    };
    imports.wbg.__wbg_setindex_1e08306077919ed6 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_1ee8d4cff9651c00 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_293cc136ea1e25f9 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_492b4871340897de = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_4e73afdcd9bb95cd = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_548f8734824269ec = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_554ac79bf43ac280 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = BigInt.asUintN(64, arg2);
    };
    imports.wbg.__wbg_setindex_9c5c6be24d5d72fc = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_b947c348fc00fc76 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setindex_c430b78b97744fcc = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2 >>> 0;
    };
    imports.wbg.__wbg_setindex_dcd71eabf405bde1 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_setinnerHeight_1163c1855c6350f9 = function() { return handleError(function (arg0, arg1) {
        arg0.innerHeight = arg1;
    }, arguments) };
    imports.wbg.__wbg_setinnerWidth_c68e5f72431b90f3 = function() { return handleError(function (arg0, arg1) {
        arg0.innerWidth = arg1;
    }, arguments) };
    imports.wbg.__wbg_setlastindex_b7f88ee3f88ca390 = function(arg0, arg1) {
        arg0.lastIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_setlength_a668e53981184590 = function(arg0, arg1) {
        arg0.length = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmessage_ada6afb63a12b382 = function(arg0, arg1, arg2) {
        arg0.message = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setname_6df54b7ebf9404a9 = function(arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setname_73878b09a5ee3d0c = function(arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setname_f860fea37b4fe882 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_setonabort_19fbf1d403f3c1e5 = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_setonafterprint_d3678004b80e88ee = function(arg0, arg1) {
        arg0.onafterprint = arg1;
    };
    imports.wbg.__wbg_setonanimationcancel_d1691a1fbcac1af8 = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_setonanimationend_853f1bccbda348fa = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_setonanimationiteration_176a1ffa47876038 = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonanimationstart_7c9424d6ebeb0740 = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_setonappinstalled_e59ccf1f45074106 = function(arg0, arg1) {
        arg0.onappinstalled = arg1;
    };
    imports.wbg.__wbg_setonauxclick_9d6923f4df57d136 = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_setonbeforeprint_418d156ffd3b8e37 = function(arg0, arg1) {
        arg0.onbeforeprint = arg1;
    };
    imports.wbg.__wbg_setonbeforetoggle_2b8456cfd5ae375f = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_setonbeforeunload_f5e1006c06147fe6 = function(arg0, arg1) {
        arg0.onbeforeunload = arg1;
    };
    imports.wbg.__wbg_setonblur_cedb31fae51abd58 = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_setoncanplay_7fbcb2a54a05c3f8 = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_setoncanplaythrough_bf86346bfbe43288 = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_setonchange_27a14425d44d596b = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_setonclick_578becc82e481f5c = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_setonclose_8c36f48331e32685 = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_setoncontextmenu_44caf5f802085b8a = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_setondblclick_905a69d743530467 = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_setondrag_6291cead6fc23609 = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_setondragend_96ee8d5e13b44666 = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_setondragenter_0f918b63df1cf771 = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_setondragexit_20cc396a07ec4af2 = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_setondragleave_b1d8d0e9e5a3f000 = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_setondragover_f1503b9691a9e10e = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_setondragstart_1be0ba1c46cdfb45 = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_setondrop_95d3d4d6d4506946 = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_setondurationchange_40d08a350ded5985 = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_setonemptied_4299698250b3c389 = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_setonended_b9d1f5c7023f7c28 = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_setonerror_57eeef5feb01fe7a = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonerror_5ef4bb65682bb77d = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonerror_f1fecae78c4b6d95 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonfocus_23c8ba38bca8121a = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_setongamepadconnected_148629f22f71feda = function(arg0, arg1) {
        arg0.ongamepadconnected = arg1;
    };
    imports.wbg.__wbg_setongamepaddisconnected_678b2b4d0f2ebf73 = function(arg0, arg1) {
        arg0.ongamepaddisconnected = arg1;
    };
    imports.wbg.__wbg_setongotpointercapture_1ad54e6ddac7ca93 = function(arg0, arg1) {
        arg0.ongotpointercapture = arg1;
    };
    imports.wbg.__wbg_setonhashchange_bdaf027f3ca65265 = function(arg0, arg1) {
        arg0.onhashchange = arg1;
    };
    imports.wbg.__wbg_setoninput_631131c69b6b1487 = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_setoninvalid_bbdc743d72e626bb = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_setonkeydown_6f8d021ecb13db5a = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_setonkeypress_1986580a3c02e9f1 = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_setonkeyup_d38a5e036e4265aa = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_setonlanguagechange_3d0df7bc9bfb2af8 = function(arg0, arg1) {
        arg0.onlanguagechange = arg1;
    };
    imports.wbg.__wbg_setonload_43b25347d55a5c6e = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_setonloadeddata_1ce966be6193f795 = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_setonloadedmetadata_c3b10ec3e5dcb5b6 = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_setonloadend_083a0226b2963c1f = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_setonloadstart_03459ce2dc2a4932 = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_setonlostpointercapture_25790f9e2f07d806 = function(arg0, arg1) {
        arg0.onlostpointercapture = arg1;
    };
    imports.wbg.__wbg_setonmessage_5a885b16bdc6dca6 = function(arg0, arg1) {
        arg0.onmessage = arg1;
    };
    imports.wbg.__wbg_setonmessage_6487c59800bc98f9 = function(arg0, arg1) {
        arg0.onmessage = arg1;
    };
    imports.wbg.__wbg_setonmessageerror_9c25f59c328a0274 = function(arg0, arg1) {
        arg0.onmessageerror = arg1;
    };
    imports.wbg.__wbg_setonmessageerror_b2ecb05174fd3136 = function(arg0, arg1) {
        arg0.onmessageerror = arg1;
    };
    imports.wbg.__wbg_setonmousedown_0f5b78396a320370 = function(arg0, arg1) {
        arg0.onmousedown = arg1;
    };
    imports.wbg.__wbg_setonmouseenter_dab0a1db435ce411 = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_setonmouseleave_383a2467aa97a13f = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_setonmousemove_981d0487feded8fd = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_setonmouseout_7c15a3e5d3cb20d4 = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_setonmouseover_d12c4f0b04cbac79 = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_setonmouseup_6a991a1ab5054070 = function(arg0, arg1) {
        arg0.onmouseup = arg1;
    };
    imports.wbg.__wbg_setonoffline_148cda42fb761c37 = function(arg0, arg1) {
        arg0.onoffline = arg1;
    };
    imports.wbg.__wbg_setonoffline_908da0f8044a963f = function(arg0, arg1) {
        arg0.onoffline = arg1;
    };
    imports.wbg.__wbg_setononline_622089ef6386d288 = function(arg0, arg1) {
        arg0.ononline = arg1;
    };
    imports.wbg.__wbg_setononline_975517d857e80d05 = function(arg0, arg1) {
        arg0.ononline = arg1;
    };
    imports.wbg.__wbg_setonorientationchange_e0b37b9860480f75 = function(arg0, arg1) {
        arg0.onorientationchange = arg1;
    };
    imports.wbg.__wbg_setonpagehide_cfaf218630240f8a = function(arg0, arg1) {
        arg0.onpagehide = arg1;
    };
    imports.wbg.__wbg_setonpageshow_b91492a6fe0f9bf2 = function(arg0, arg1) {
        arg0.onpageshow = arg1;
    };
    imports.wbg.__wbg_setonpause_ece5810cfdf52f67 = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_setonplay_0e51f043a1c493ff = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_setonplaying_36a2df346a9f6af1 = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_setonpointercancel_96e81a6b75745897 = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_setonpointerdown_dfaeaac22e20acfd = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_setonpointerenter_0052f752d7a17830 = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_setonpointerleave_5e9bc8c430b05171 = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_setonpointermove_596c57c402771a09 = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_setonpointerout_16e9c3041fa9f5f9 = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_setonpointerover_01dc14f5e84aaf6a = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_setonpointerup_884925c18d96ace5 = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_setonpopstate_c929380900d58c85 = function(arg0, arg1) {
        arg0.onpopstate = arg1;
    };
    imports.wbg.__wbg_setonprogress_62f0339a48d9702e = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_setonratechange_29dac293a446dd3d = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_setonreset_4695a44e478f42c3 = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_setonresize_376a647b3cba80a2 = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_setonresourcetimingbufferfull_25b6bd27d6296614 = function(arg0, arg1) {
        arg0.onresourcetimingbufferfull = arg1;
    };
    imports.wbg.__wbg_setonscroll_5566c441b1b1859b = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_setonseeked_b9ae3acc8dbd91ce = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_setonseeking_2474c53f5daed87d = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_setonselect_cf93fc62a8c78212 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_setonselectstart_bed3ff8e685db94a = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_setonshow_8d35566f24269a98 = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_setonstalled_ffd2af7dbf97b6d7 = function(arg0, arg1) {
        arg0.onstalled = arg1;
    };
    imports.wbg.__wbg_setonstorage_e5a334e2d759ea05 = function(arg0, arg1) {
        arg0.onstorage = arg1;
    };
    imports.wbg.__wbg_setonsubmit_1040f8d777fd818f = function(arg0, arg1) {
        arg0.onsubmit = arg1;
    };
    imports.wbg.__wbg_setonsuspend_bdbefba3fa6964cf = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_setontimeupdate_6c18f2bea7dd12a9 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_setontoggle_e364ae6a00829c95 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_setontouchcancel_83d377aa324a400d = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_setontouchend_7ac3a11b578e6b8d = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_setontouchmove_f80dcbcaeae1b13a = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_setontouchstart_c748dbaf6199cd02 = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_setontransitioncancel_fa0bd36fab2c4b10 = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_setontransitionend_47667b1d1af3247d = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_setontransitionrun_153d7c085a760e30 = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_setontransitionstart_cd84b00cc299c308 = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_setonunload_4f4843135e84664f = function(arg0, arg1) {
        arg0.onunload = arg1;
    };
    imports.wbg.__wbg_setonvolumechange_e4d3b70aca12f8e4 = function(arg0, arg1) {
        arg0.onvolumechange = arg1;
    };
    imports.wbg.__wbg_setonvrdisplayactivate_e86ec4ef7e98076a = function(arg0, arg1) {
        arg0.onvrdisplayactivate = arg1;
    };
    imports.wbg.__wbg_setonvrdisplayconnect_2bbb5ae886b7a5ca = function(arg0, arg1) {
        arg0.onvrdisplayconnect = arg1;
    };
    imports.wbg.__wbg_setonvrdisplaydeactivate_41ec717e2d871d19 = function(arg0, arg1) {
        arg0.onvrdisplaydeactivate = arg1;
    };
    imports.wbg.__wbg_setonvrdisplaydisconnect_78fb278f5054f8dc = function(arg0, arg1) {
        arg0.onvrdisplaydisconnect = arg1;
    };
    imports.wbg.__wbg_setonvrdisplaypresentchange_c32f9c3f06eadcfb = function(arg0, arg1) {
        arg0.onvrdisplaypresentchange = arg1;
    };
    imports.wbg.__wbg_setonwaiting_524c4f64b01449ed = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationend_6d3a58bdf3599c05 = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationiteration_440e420abac787a9 = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationstart_ea17664bf0a68a2e = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_setonwebkittransitionend_6f24d039f979b679 = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_setonwheel_06e1ac2c6a9d28ed = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_setopener_0c9cfb913057d3b9 = function() { return handleError(function (arg0, arg1) {
        arg0.opener = arg1;
    }, arguments) };
    imports.wbg.__wbg_setouterHeight_aa1caf86aeb5442b = function() { return handleError(function (arg0, arg1) {
        arg0.outerHeight = arg1;
    }, arguments) };
    imports.wbg.__wbg_setouterWidth_cbdbe81079605824 = function() { return handleError(function (arg0, arg1) {
        arg0.outerWidth = arg1;
    }, arguments) };
    imports.wbg.__wbg_setscreenX_b8e1b084a2b9c385 = function() { return handleError(function (arg0, arg1) {
        arg0.screenX = arg1;
    }, arguments) };
    imports.wbg.__wbg_setscreenY_f7850cd44e6efe95 = function() { return handleError(function (arg0, arg1) {
        arg0.screenY = arg1;
    }, arguments) };
    imports.wbg.__wbg_setstatus_00d206e323892ffa = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.status = getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_settype_47fae7d6c82625e7 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_WorkerType[arg1];
    };
    imports.wbg.__wbg_setvalue_9829fae8eebc39d3 = function(arg0, arg1) {
        arg0.value = arg1;
    };
    imports.wbg.__wbg_share_5373816eafaec951 = function(arg0) {
        const ret = arg0.share();
        return ret;
    };
    imports.wbg.__wbg_shift_9a41f00897c50537 = function(arg0) {
        const ret = arg0.shift();
        return ret;
    };
    imports.wbg.__wbg_showDirectoryPicker_202855738ded3f11 = function() { return handleError(function (arg0) {
        const ret = arg0.showDirectoryPicker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_showOpenFilePicker_c3d4636caf7289f2 = function() { return handleError(function (arg0) {
        const ret = arg0.showOpenFilePicker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_showSaveFilePicker_70deb0cba6e6d852 = function() { return handleError(function (arg0) {
        const ret = arg0.showSaveFilePicker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sign_624e0b0023f59b2e = function(arg0) {
        const ret = Math.sign(arg0);
        return ret;
    };
    imports.wbg.__wbg_sin_70aa75741b44f216 = function(arg0) {
        const ret = Math.sin(arg0);
        return ret;
    };
    imports.wbg.__wbg_sinh_a512aadce56a1abb = function(arg0) {
        const ret = Math.sinh(arg0);
        return ret;
    };
    imports.wbg.__wbg_size_531ef01d6a4916c2 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_f9d54556ad844dc3 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_slice_20af3d9eef839bdb = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_310cff51ceee6573 = function(arg0, arg1) {
        const ret = arg0.slice(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_5d9c561089c5b271 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_61d080f8fbe1237f = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_8339a12068af339c = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_8c2d19f9a247adba = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_9272f90890997145 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_96a5a88dc69bd1cb = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_972c243648c9fd2e = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_9826d81ae1ea821a = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_a18aced6f26168b6 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_ab0b7e3d75dccdee = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_b2dfa851aff60399 = function(arg0, arg1) {
        const ret = arg0.slice(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_de0c319bd9ab6756 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_e32fcc69a08a49ce = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_f197343e1f666f1a = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_f6598c85651b4714 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_some_675bdd75b9d96808 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_1825(a, state0.b, arg0);
                } finally {
                    state0.a = a;
                }
            };
            const ret = arg0.some(cb0);
            return ret;
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_sort_17005f4a32733e23 = function(arg0) {
        const ret = arg0.sort();
        return ret;
    };
    imports.wbg.__wbg_source_2567e3b9b0c52d11 = function(arg0) {
        const ret = arg0.source;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_source_583b711d1c044225 = function(arg0) {
        const ret = arg0.source;
        return ret;
    };
    imports.wbg.__wbg_species_7dd36cf88d6ffccb = function() {
        const ret = Symbol.species;
        return ret;
    };
    imports.wbg.__wbg_splice_ee284c704bebb18b = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.splice(arg1 >>> 0, arg2 >>> 0, arg3);
        return ret;
    };
    imports.wbg.__wbg_split_43cb6ef578c647f7 = function() {
        const ret = Symbol.split;
        return ret;
    };
    imports.wbg.__wbg_split_7ee3aef7c277832d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.split(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_split_a8fc4ca34f6f3ad7 = function(arg0, arg1) {
        const ret = arg0.split(arg1);
        return ret;
    };
    imports.wbg.__wbg_split_ecd4c34eb433f0df = function(arg0, arg1, arg2) {
        const ret = arg0.split(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_split_f6f04800558cea43 = function(arg0, arg1, arg2) {
        const ret = arg0.split(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_sqrt_68a20b95bafcc1e5 = function(arg0) {
        const ret = Math.sqrt(arg0);
        return ret;
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = arg1.stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_startTime_c051731d0a31602f = function(arg0) {
        const ret = arg0.startTime;
        return ret;
    };
    imports.wbg.__wbg_startWorkers_2ca11761e08ff5d5 = function(arg0, arg1, arg2) {
        const ret = startWorkers(arg0, arg1, wbg_rayon_PoolBuilder.__wrap(arg2));
        return ret;
    };
    imports.wbg.__wbg_startsWith_59cb414cb6c5c89f = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.startsWith(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_status_0e11df0ceb428164 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.status;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_sticky_6f9bc5626a18ad01 = function(arg0) {
        const ret = arg0.sticky;
        return ret;
    };
    imports.wbg.__wbg_stopImmediatePropagation_b7f329ceca9e5cb4 = function(arg0) {
        arg0.stopImmediatePropagation();
    };
    imports.wbg.__wbg_stopPropagation_11d220a858e5e0fb = function(arg0) {
        arg0.stopPropagation();
    };
    imports.wbg.__wbg_stop_81bd11ce5b37ba1e = function() { return handleError(function (arg0) {
        arg0.stop();
    }, arguments) };
    imports.wbg.__wbg_store_d04e6f33202d25d4 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.store(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_store_d38d10639308f619 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.store(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_stringify_b1b3844ae02664a1 = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.stringify(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_stringify_e3eb82f5aa1ea94d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = JSON.stringify(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_stringify_f7ed6987935b4a24 = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sub_6971ac60847ed9ea = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.sub(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sub_80a745f4cbc60eb5 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.sub(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_subarray_3aaeec89bb2544f0 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_4c5e1805acf1a45b = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_66ab170ddadadc5e = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_769e1e0f81bb259b = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_aacc94e3d3358ef3 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_b35a92e211d01042 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_dbc70ea1438e5394 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_f1845515c6a957e6 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_fa0950d06c298557 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_fe67399f1caa0471 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_substr_e2763fcd7f483208 = function(arg0, arg1, arg2) {
        const ret = arg0.substr(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_substring_c212c044e339bbb0 = function(arg0, arg1, arg2) {
        const ret = arg0.substring(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_120db3e24a5e406e = function(arg0, arg1) {
        const ret = Intl.DateTimeFormat.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_1ccc40fe6b9a10aa = function(arg0, arg1) {
        const ret = Intl.NumberFormat.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_1e3c2332521c7dbe = function(arg0, arg1) {
        const ret = Intl.PluralRules.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_89927bb0d9fc461e = function(arg0, arg1) {
        const ret = Intl.RelativeTimeFormat.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_fd27ec6a4e640b4e = function(arg0, arg1) {
        const ret = Intl.Collator.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_table_25391058fad8b7f3 = function(arg0) {
        console.table(...arg0);
    };
    imports.wbg.__wbg_table_56e0d46b553d0316 = function(arg0, arg1) {
        console.table(arg0, arg1);
    };
    imports.wbg.__wbg_table_5709e4fd476699c9 = function() {
        console.table();
    };
    imports.wbg.__wbg_table_89cf9346e398ce43 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.table(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_table_c64a53f8b3a40be4 = function(arg0, arg1, arg2, arg3, arg4) {
        console.table(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_table_ca4bc11da31ffc98 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.table(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_table_ca65562388d005fd = function(arg0, arg1, arg2, arg3) {
        console.table(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_table_dff9b87dcdefbeb4 = function(arg0, arg1, arg2) {
        console.table(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_table_fe5deeebbd1d9dab = function(arg0) {
        console.table(arg0);
    };
    imports.wbg.__wbg_taintEnabled_0bbd9734ea0727d4 = function(arg0) {
        const ret = arg0.taintEnabled();
        return ret;
    };
    imports.wbg.__wbg_tan_a6975485c4fc6ae6 = function(arg0) {
        const ret = Math.tan(arg0);
        return ret;
    };
    imports.wbg.__wbg_tanh_36f633e1b283bec7 = function(arg0) {
        const ret = Math.tanh(arg0);
        return ret;
    };
    imports.wbg.__wbg_target_0a62d9d79a2a1ede = function(arg0) {
        const ret = arg0.target;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_terminate_e8eab2977ce01111 = function(arg0) {
        arg0.terminate();
    };
    imports.wbg.__wbg_test_7f0ac7b9d67b7a48 = function(arg0, arg1, arg2) {
        const ret = arg0.test(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_then_44b73946d2fb3e7d = function(arg0, arg1) {
        const ret = arg0.then(arg1);
        return ret;
    };
    imports.wbg.__wbg_then_48b406749878a531 = function(arg0, arg1, arg2) {
        const ret = arg0.then(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_throw_a01ab8dd8f810d6a = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.throw(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_timeEnd_8ceb4334874fe379 = function(arg0, arg1) {
        console.timeEnd(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_timeEnd_c619922f7c81b96d = function(arg0, arg1) {
        console.timeEnd(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_timeEnd_e186fb4affb1bc76 = function() {
        console.timeEnd();
    };
    imports.wbg.__wbg_timeLog_31f9c808c340de7f = function(arg0, arg1, arg2) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_timeLog_4a5e2bfea63050a4 = function(arg0, arg1) {
        console.timeLog(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_timeLog_4fb42b009488d294 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_timeLog_526d496af722b373 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_timeLog_5a2220be912e43ac = function(arg0, arg1, arg2, arg3) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3);
    };
    imports.wbg.__wbg_timeLog_79d3a16be5413d5e = function(arg0, arg1, arg2) {
        console.timeLog(getStringFromWasm0(arg0, arg1), ...arg2);
    };
    imports.wbg.__wbg_timeLog_7e29cea7afcedd44 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_timeLog_92df6d226839ce69 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_timeLog_9e1f7db1c697e5c8 = function(arg0, arg1, arg2, arg3, arg4) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4);
    };
    imports.wbg.__wbg_timeLog_d45cf1af2fba0bd8 = function() {
        console.timeLog();
    };
    imports.wbg.__wbg_timeOrigin_ad5f80b145e4fb16 = function(arg0) {
        const ret = arg0.timeOrigin;
        return ret;
    };
    imports.wbg.__wbg_timeStamp_15056b812e09b3f9 = function() {
        console.timeStamp();
    };
    imports.wbg.__wbg_timeStamp_77f4ec8b6669253c = function(arg0) {
        const ret = arg0.timeStamp;
        return ret;
    };
    imports.wbg.__wbg_timeStamp_cbeb5b320f2e36cd = function(arg0) {
        console.timeStamp(arg0);
    };
    imports.wbg.__wbg_time_45bf36fd575512a4 = function(arg0, arg1) {
        console.time(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_time_5c8943f56217d99a = function(arg0, arg1) {
        console.time(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_time_ddef11b392e7cb99 = function() {
        console.time();
    };
    imports.wbg.__wbg_toDateString_a32d3e19c034f890 = function(arg0) {
        const ret = arg0.toDateString();
        return ret;
    };
    imports.wbg.__wbg_toExponential_94205e87d4cb41a7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toExponential(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toFixed_43af7895cf202c17 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toFixed(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toISOString_b015155a5a6fe219 = function(arg0) {
        const ret = arg0.toISOString();
        return ret;
    };
    imports.wbg.__wbg_toJSON_14c00e0c5e95df79 = function(arg0) {
        const ret = arg0.toJSON();
        return ret;
    };
    imports.wbg.__wbg_toJSON_43264ca8d6b26ef9 = function(arg0) {
        const ret = arg0.toJSON();
        return ret;
    };
    imports.wbg.__wbg_toJSON_7e7e87cf6df827e8 = function(arg0) {
        const ret = arg0.toJSON();
        return ret;
    };
    imports.wbg.__wbg_toLocaleDateString_e5424994746e8415 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.toLocaleDateString(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_toLocaleLowerCase_a2b32231c0146e55 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleLowerCase(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_60b767b25a2de00f = function(arg0) {
        const ret = arg0.toLocaleString();
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_b1f934fd5c99bae5 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleString(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_d2523aac0e54b5b2 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleString(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_f35f1732d697cac8 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleString(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_fd5a08bf263df045 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.toLocaleString(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_toLocaleTimeString_05de397341758a86 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.toLocaleTimeString(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_toLocaleTimeString_a7496b9e59445928 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleTimeString(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLocaleUpperCase_41fea0ca2bd8e963 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleUpperCase(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLowerCase_d86a8d3cde393429 = function(arg0) {
        const ret = arg0.toLowerCase();
        return ret;
    };
    imports.wbg.__wbg_toPrecision_976bce0547470a93 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toPrecision(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toPrimitive_693467a3eb50bdea = function() {
        const ret = Symbol.toPrimitive;
        return ret;
    };
    imports.wbg.__wbg_toStringTag_8ca81c3aaed93093 = function() {
        const ret = Symbol.toStringTag;
        return ret;
    };
    imports.wbg.__wbg_toString_085f123fb88c76f1 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_2f76f493957b63da = function(arg0, arg1, arg2) {
        const ret = arg1.toString(arg2);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_toString_5285597960676b7b = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_5594a7237007a325 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_66ab719c2a98bdf1 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_b46b28b849433558 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_b5d4438bc26b267c = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toString(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toString_ba82658ec370add0 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toString(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toString_c813bbd34d063839 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_c951aa1c78365ed3 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_c9b649be8d242a59 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toTimeString_b89c29919337fbe3 = function(arg0) {
        const ret = arg0.toTimeString();
        return ret;
    };
    imports.wbg.__wbg_toUTCString_ccb4361bc1564cb6 = function(arg0) {
        const ret = arg0.toUTCString();
        return ret;
    };
    imports.wbg.__wbg_toUpperCase_f5e19186eebe77dc = function(arg0) {
        const ret = arg0.toUpperCase();
        return ret;
    };
    imports.wbg.__wbg_top_afaba101d10ff63c = function() { return handleError(function (arg0) {
        const ret = arg0.top;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_trace_1dbf52226310c447 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.trace(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_trace_5b0fc70111fbb0d2 = function(arg0, arg1, arg2, arg3, arg4) {
        console.trace(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_trace_634fdffd847a2b32 = function() {
        console.trace();
    };
    imports.wbg.__wbg_trace_73b46637c3d745e8 = function(arg0, arg1) {
        console.trace(arg0, arg1);
    };
    imports.wbg.__wbg_trace_8fa9ac2274ea7420 = function(arg0) {
        console.trace(...arg0);
    };
    imports.wbg.__wbg_trace_96c1e4a6d75b70fd = function(arg0, arg1, arg2) {
        console.trace(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_trace_d12a9ac890a2cbb8 = function(arg0, arg1, arg2, arg3) {
        console.trace(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_trace_da03da44cd01b045 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.trace(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_trace_e758b839df8d34f1 = function(arg0) {
        console.trace(arg0);
    };
    imports.wbg.__wbg_trimEnd_637231f4bd4d22bd = function(arg0) {
        const ret = arg0.trimEnd();
        return ret;
    };
    imports.wbg.__wbg_trimLeft_75e3745ac82487b0 = function(arg0) {
        const ret = arg0.trimLeft();
        return ret;
    };
    imports.wbg.__wbg_trimRight_a404543ac1304079 = function(arg0) {
        const ret = arg0.trimRight();
        return ret;
    };
    imports.wbg.__wbg_trimStart_5963beebacf825df = function(arg0) {
        const ret = arg0.trimStart();
        return ret;
    };
    imports.wbg.__wbg_trim_25212e1a3bb3c44b = function(arg0) {
        const ret = arg0.trim();
        return ret;
    };
    imports.wbg.__wbg_trunc_c5fd0f48bc479afe = function(arg0) {
        const ret = Math.trunc(arg0);
        return ret;
    };
    imports.wbg.__wbg_type_16f2b8031796512f = function(arg0, arg1) {
        const ret = arg1.type;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_unescape_e3df3a9b4be937bb = function(arg0, arg1) {
        const ret = unescape(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_unicode_b13cfca88b85412b = function(arg0) {
        const ret = arg0.unicode;
        return ret;
    };
    imports.wbg.__wbg_unscopables_7673b799e5130697 = function() {
        const ret = Symbol.unscopables;
        return ret;
    };
    imports.wbg.__wbg_unshift_c290010f73f04fb1 = function(arg0, arg1) {
        const ret = arg0.unshift(arg1);
        return ret;
    };
    imports.wbg.__wbg_userAgent_12e9d8e62297563f = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.userAgent;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_validate_33b3352448e612da = function() { return handleError(function (arg0) {
        const ret = WebAssembly.validate(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_valueOf_28aa09eb1ee2e033 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_39a18758c25e8b95 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_42cebfd435f685cc = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_7392193dd78c6b97 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_ab4cae7d2c8c804c = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_d187d770bc1b4ab3 = function(arg0, arg1) {
        const ret = arg0.valueOf(arg1);
        return ret;
    };
    imports.wbg.__wbg_valueOf_fdbb54fcdfe33477 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_value_8cbb57a4b5be75c1 = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_value_cd1ffa7b1ab794f1 = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_value_dab73d3d5d4abaaf = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_values_53465c57fc8cd691 = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_623d00ad3703dfaa = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_99f7a68c7f313d66 = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_fcb8ba8c0aad8b58 = function(arg0) {
        const ret = Object.values(arg0);
        return ret;
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = arg0.versions;
        return ret;
    };
    imports.wbg.__wbg_vibrate_b2b29ee7b04fe03a = function(arg0, arg1) {
        const ret = arg0.vibrate(arg1);
        return ret;
    };
    imports.wbg.__wbg_vibrate_fe479753f5bed032 = function(arg0, arg1) {
        const ret = arg0.vibrate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_waitAsync_5959708aa2c15275 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitAsync_61f0a081053dd3c2 = function(arg0, arg1, arg2) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_waitAsync_6d65dd0e77668a97 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitAsync_7ce6c8a047c752c3 = function() {
        const ret = Atomics.waitAsync;
        return ret;
    };
    imports.wbg.__wbg_waitAsync_bc76cfbcdc247bd5 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitAsync_cbc63583701e57d8 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_4b9779acbf26ae2b = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_5be6b21937b6db2f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_a3231eefdf760fb6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_c19065fad9b95713 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_warn_0559d544d5150e8e = function() {
        console.warn();
    };
    imports.wbg.__wbg_warn_0fe31571b501a575 = function(arg0, arg1, arg2, arg3, arg4) {
        console.warn(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_warn_14410cc27be5552a = function(arg0, arg1, arg2) {
        console.warn(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_warn_4ca3906c248c47c4 = function(arg0) {
        console.warn(arg0);
    };
    imports.wbg.__wbg_warn_6ab1dbce89ae5d85 = function(arg0, arg1) {
        console.warn(arg0, arg1);
    };
    imports.wbg.__wbg_warn_78b5c09a3809bb74 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.warn(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_warn_aaf1f4664a035bd6 = function(arg0, arg1, arg2, arg3) {
        console.warn(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_warn_ba4bf5118b457d45 = function(arg0) {
        console.warn(...arg0);
    };
    imports.wbg.__wbg_warn_f35d09eec95ff1d6 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.warn(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_wbg_rayon_poolbuilder_new = function(arg0) {
        const ret = wbg_rayon_PoolBuilder.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_wbg_rayon_poolbuilder_unwrap = function(arg0) {
        const ret = wbg_rayon_PoolBuilder.__unwrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_width_b0c1d9f437a95799 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_window_0d495abb0d421f1f = function(arg0) {
        const ret = arg0.window;
        return ret;
    };
    imports.wbg.__wbg_window_a782b194486157e5 = function() { return handleError(function () {
        const ret = globalThis.window();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_xor_0d03072ea65f3e9c = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.xor(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_xor_5378375e84cd24bd = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.xor(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_array_new = function() {
        const ret = [];
        return ret;
    };
    imports.wbg.__wbindgen_array_push = function(arg0, arg1) {
        arg0.push(arg1);
    };
    imports.wbg.__wbindgen_as_number = function(arg0) {
        const ret = +arg0;
        return ret;
    };
    imports.wbg.__wbindgen_bigint64_array_new = function(arg0, arg1) {
        var v0 = getArrayI64FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 8, 8);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_i128 = function(arg0, arg1) {
        const ret = arg0 << BigInt(64) | BigInt.asUintN(64, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_i64 = function(arg0) {
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_u128 = function(arg0, arg1) {
        const ret = BigInt.asUintN(64, arg0) << BigInt(64) | BigInt.asUintN(64, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_bigint_from_u64 = function(arg0) {
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    };
    imports.wbg.__wbindgen_bigint_get_as_i64 = function(arg0, arg1) {
        const v = arg1;
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_biguint64_array_new = function(arg0, arg1) {
        var v0 = getArrayU64FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 8, 8);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_boolean_get = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
        return ret;
    };
    imports.wbg.__wbindgen_cb_drop = function(arg0) {
        const obj = arg0.original;
        if (obj.cnt-- == 1) {
            obj.a = 0;
            return true;
        }
        const ret = false;
        return ret;
    };
    imports.wbg.__wbindgen_checked_div = function(arg0, arg1) {
        let result;
        try {
            result = arg0 / arg1;
        } catch (e) {
            if (e instanceof RangeError) {
                result = e;
            } else {
                throw e;
            }
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper1974 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 86, __wbg_adapter_96);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper1976 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 86, __wbg_adapter_96);
        return ret;
    };
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbindgen_exports = function() {
        const ret = wasm;
        return ret;
    };
    imports.wbg.__wbindgen_externref_heap_live_count = function() {
        const ret = wasm.__externref_heap_live_count();
        return ret;
    };
    imports.wbg.__wbindgen_float32_array_new = function(arg0, arg1) {
        var v0 = getArrayF32FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 4, 4);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_float64_array_new = function(arg0, arg1) {
        var v0 = getArrayF64FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 8, 8);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_function_table = function() {
        const ret = wasm.__wbindgen_export_6;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_int16_array_new = function(arg0, arg1) {
        var v0 = getArrayI16FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 2, 2);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_int32_array_new = function(arg0, arg1) {
        var v0 = getArrayI32FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 4, 4);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_int8_array_new = function(arg0, arg1) {
        var v0 = getArrayI8FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1, 1);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_jsval_loose_eq = function(arg0, arg1) {
        const ret = arg0 == arg1;
        return ret;
    };
    imports.wbg.__wbindgen_link_9579f016b4522a24 = function(arg0) {
        const val = `onmessage = function (ev) {
            let [ia, index, value] = ev.data;
            ia = new Int32Array(ia.buffer);
            let result = Atomics.wait(ia, index, value);
            postMessage(result);
        };
        `;
        const ret = typeof URL.createObjectURL === 'undefined' ? "data:application/javascript," + encodeURIComponent(val) : URL.createObjectURL(new Blob([val], { type: "text/javascript" }));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_lt = function(arg0, arg1) {
        const ret = arg0 < arg1;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_module = function() {
        const ret = __wbg_init.__wbindgen_wasm_module;
        return ret;
    };
    imports.wbg.__wbindgen_neg = function(arg0) {
        const ret = -arg0;
        return ret;
    };
    imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_rethrow = function(arg0) {
        throw arg0;
    };
    imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_symbol_anonymous_new = function() {
        const ret = Symbol();
        return ret;
    };
    imports.wbg.__wbindgen_symbol_named_new = function(arg0, arg1) {
        const ret = Symbol(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbindgen_uint16_array_new = function(arg0, arg1) {
        var v0 = getArrayU16FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 2, 2);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_uint32_array_new = function(arg0, arg1) {
        var v0 = getArrayU32FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 4, 4);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_uint8_array_new = function(arg0, arg1) {
        var v0 = getArrayU8FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1, 1);
        const ret = v0;
        return ret;
    };
    imports.wbg.__wbindgen_uint8_clamped_array_new = function(arg0, arg1) {
        var v0 = getClampedArrayU8FromWasm0(arg0, arg1).slice();
        wasm.__wbindgen_free(arg0, arg1 * 1, 1);
        const ret = v0;
        return ret;
    };
    imports['__wbindgen_placeholder__'] = __wbg_star0;

    return imports;
}

function __wbg_init_memory(imports, memory) {
    imports.wbg.memory = memory || new WebAssembly.Memory({initial:33,maximum:32768,shared:true});
}

function __wbg_finalize_init(instance, module, thread_stack_size) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedBigInt64ArrayMemory0 = null;
    cachedBigUint64ArrayMemory0 = null;
    cachedDataViewMemory0 = null;
    cachedFloat32ArrayMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedInt16ArrayMemory0 = null;
    cachedInt32ArrayMemory0 = null;
    cachedInt8ArrayMemory0 = null;
    cachedUint16ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    cachedUint8ClampedArrayMemory0 = null;

    if (typeof thread_stack_size !== 'undefined' && (typeof thread_stack_size !== 'number' || thread_stack_size === 0 || thread_stack_size % 65536 !== 0)) { throw 'invalid stack size' }
    wasm.__wbindgen_start(thread_stack_size);
    return wasm;
}

function initSync(module, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size
    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module, memory, thread_stack_size} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports, memory);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module, thread_stack_size);
}

async function __wbg_init(module_or_path, memory) {
    if (wasm !== undefined) return wasm;

    let thread_stack_size
    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path, memory, thread_stack_size} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('vectorize_wasm_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports, memory);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module, thread_stack_size);
}

export { initSync };
export default __wbg_init;
