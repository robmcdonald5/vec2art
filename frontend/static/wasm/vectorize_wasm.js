import * as __wbg_star0 from '__wbindgen_placeholder__';

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

function isLikeNone(x) {
    return x === undefined || x === null;
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().slice(ptr, ptr + len));
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
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
 * Initialize GPU backend with automatic detection and fallback
 * @returns {Promise<GpuBackendInfo>}
 */
export function initialize_gpu_backend() {
    const ret = wasm.initialize_gpu_backend();
    return ret;
}

/**
 * Get current GPU backend status as a JSON string for JavaScript
 * @returns {string}
 */
export function get_gpu_backend_status() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_gpu_backend_status();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Check if GPU acceleration is currently available
 * @returns {boolean}
 */
export function is_gpu_acceleration_available() {
    const ret = wasm.is_gpu_acceleration_available();
    return ret !== 0;
}

/**
 * Get the currently active GPU backend type
 * @returns {GpuBackend}
 */
export function get_active_gpu_backend() {
    const ret = wasm.get_active_gpu_backend();
    return ret;
}

/**
 * Force reset GPU backend (for testing/debugging)
 */
export function reset_gpu_backend() {
    wasm.reset_gpu_backend();
}

/**
 * Detect best available GPU backend without full initialization
 * @returns {GpuBackend}
 */
export function detect_best_gpu_backend() {
    const ret = wasm.detect_best_gpu_backend();
    return ret;
}

/**
 * Get comprehensive GPU capability report
 * @returns {string}
 */
export function get_gpu_capability_report() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_gpu_capability_report();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Get backend performance statistics
 * @returns {string}
 */
export function get_backend_performance_report() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_backend_performance_report();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Create a processing manager with recommended configuration
 * @returns {ProcessingConfig}
 */
export function create_optimal_processing_manager() {
    const ret = wasm.create_optimal_processing_manager();
    return ProcessingConfig.__wrap(ret);
}

/**
 * Initialize the wasm module with basic setup
 */
export function wasm_init() {
    wasm.wasm_init();
}

/**
 * Get available backends
 * @returns {string[]}
 */
export function get_available_backends() {
    const ret = wasm.get_available_backends();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Get WASM module information
 * @returns {string}
 */
export function get_wasm_info() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_wasm_info();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Emergency cleanup function for error recovery
 */
export function emergency_cleanup() {
    const ret = wasm.emergency_cleanup();
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
}

/**
 * Check if GPU acceleration should be used for the given image size
 * @param {number} width
 * @param {number} height
 * @returns {boolean}
 */
export function should_use_gpu_for_size(width, height) {
    const ret = wasm.should_use_gpu_for_size(width, height);
    return ret !== 0;
}

/**
 * Get backend performance report from processing manager
 * @returns {string}
 */
export function get_processing_backend_report() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.get_processing_backend_report();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Create optimal processing manager configuration
 * @returns {string}
 */
export function create_optimal_processing_config() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.create_optimal_processing_config();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Initialize GPU processing pipeline (async)
 * @returns {Promise<string>}
 */
export function initialize_gpu_processing() {
    const ret = wasm.initialize_gpu_processing();
    return ret;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}
/**
 * GPU-accelerated vectorization using processing manager
 * @param {WasmVectorizer} vectorizer
 * @param {ImageData} image_data
 * @param {boolean} prefer_gpu
 * @returns {Promise<string>}
 */
export function vectorize_with_gpu_acceleration(vectorizer, image_data, prefer_gpu) {
    _assertClass(vectorizer, WasmVectorizer);
    const ret = wasm.vectorize_with_gpu_acceleration(vectorizer.__wbg_ptr, image_data, prefer_gpu);
    return ret;
}

function __wbg_adapter_100(arg0, arg1, arg2) {
    wasm.closure2028_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_103(arg0, arg1, arg2) {
    wasm.closure2831_externref_shim(arg0, arg1, arg2);
}

function __wbg_adapter_7267(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.closure4466_externref_shim(arg0, arg1, arg2, arg3, arg4);
    return ret !== 0;
}

function __wbg_adapter_7284(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.closure4467_externref_shim_multivalue_shim(arg0, arg1, arg2, arg3, arg4);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

function __wbg_adapter_7287(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4468_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_7304(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.closure4469_externref_shim(arg0, arg1, arg2, arg3, arg4);
    return ret;
}

function __wbg_adapter_7321(arg0, arg1, arg2, arg3, arg4, arg5) {
    const ret = wasm.closure4470_externref_shim(arg0, arg1, arg2, arg3, arg4, arg5);
    return ret;
}

function __wbg_adapter_7332(arg0, arg1, arg2) {
    const ret = wasm.closure4471_externref_shim(arg0, arg1, arg2);
    return ret !== 0;
}

function __wbg_adapter_7593(arg0, arg1, arg2, arg3) {
    wasm.closure4472_externref_shim(arg0, arg1, arg2, arg3);
}

function __wbg_adapter_8034(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4468_externref_shim20(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8451(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4473_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8488(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4474_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8525(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4468_externref_shim23(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8562(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4473_externref_shim24(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8635(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4474_externref_shim25(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8672(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4468_externref_shim26(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8709(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4475_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8746(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4476_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8783(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4477_externref_shim(arg0, arg1, arg2, arg3, arg4);
}

function __wbg_adapter_8820(arg0, arg1, arg2, arg3, arg4) {
    wasm.closure4477_externref_shim30(arg0, arg1, arg2, arg3, arg4);
}

/**
 * Available GPU backends for image processing acceleration
 * @enum {0 | 1 | 2}
 */
export const GpuBackend = Object.freeze({
    /**
     * WebGPU backend (preferred, best performance)
     */
    WebGPU: 0, "0": "WebGPU",
    /**
     * WebGL2 backend (fallback, good compatibility)
     */
    WebGL2: 1, "1": "WebGL2",
    /**
     * No GPU acceleration available (CPU fallback)
     */
    None: 2, "2": "None",
});
/**
 * Processing backend types in order of preference
 * Note: For single-threaded WASM + Web Worker architecture
 * @enum {0 | 1 | 2}
 */
export const ProcessingBackend = Object.freeze({
    /**
     * WebGPU accelerated processing (fastest)
     */
    WebGPU: 0, "0": "WebGPU",
    /**
     * WebGL2 accelerated processing (fast fallback)
     */
    WebGL2: 1, "1": "WebGL2",
    /**
     * CPU single-threaded processing (standard fallback)
     */
    CpuSingleThreaded: 2, "2": "CpuSingleThreaded",
});

const __wbindgen_enum_GpuAddressMode = ["clamp-to-edge", "repeat", "mirror-repeat"];

const __wbindgen_enum_GpuBlendFactor = ["zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant", "src1", "one-minus-src1", "src1-alpha", "one-minus-src1-alpha"];

const __wbindgen_enum_GpuBlendOperation = ["add", "subtract", "reverse-subtract", "min", "max"];

const __wbindgen_enum_GpuBufferBindingType = ["uniform", "storage", "read-only-storage"];

const __wbindgen_enum_GpuBufferMapState = ["unmapped", "pending", "mapped"];

const __wbindgen_enum_GpuCanvasAlphaMode = ["opaque", "premultiplied"];

const __wbindgen_enum_GpuCanvasToneMappingMode = ["standard", "extended"];

const __wbindgen_enum_GpuCompareFunction = ["never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always"];

const __wbindgen_enum_GpuCompilationMessageType = ["error", "warning", "info"];

const __wbindgen_enum_GpuCullMode = ["none", "front", "back"];

const __wbindgen_enum_GpuDeviceLostReason = ["unknown", "destroyed"];

const __wbindgen_enum_GpuErrorFilter = ["validation", "out-of-memory", "internal"];

const __wbindgen_enum_GpuFilterMode = ["nearest", "linear"];

const __wbindgen_enum_GpuFrontFace = ["ccw", "cw"];

const __wbindgen_enum_GpuIndexFormat = ["uint16", "uint32"];

const __wbindgen_enum_GpuLoadOp = ["load", "clear"];

const __wbindgen_enum_GpuMipmapFilterMode = ["nearest", "linear"];

const __wbindgen_enum_GpuPowerPreference = ["low-power", "high-performance"];

const __wbindgen_enum_GpuPrimitiveTopology = ["point-list", "line-list", "line-strip", "triangle-list", "triangle-strip"];

const __wbindgen_enum_GpuQueryType = ["occlusion", "timestamp"];

const __wbindgen_enum_GpuSamplerBindingType = ["filtering", "non-filtering", "comparison"];

const __wbindgen_enum_GpuStencilOperation = ["keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap"];

const __wbindgen_enum_GpuStorageTextureAccess = ["write-only", "read-only", "read-write"];

const __wbindgen_enum_GpuStoreOp = ["store", "discard"];

const __wbindgen_enum_GpuTextureAspect = ["all", "stencil-only", "depth-only"];

const __wbindgen_enum_GpuTextureDimension = ["1d", "2d", "3d"];

const __wbindgen_enum_GpuTextureFormat = ["r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32uint", "r32sint", "r32float", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb9e5ufloat", "rgb10a2uint", "rgb10a2unorm", "rg11b10ufloat", "rg32uint", "rg32sint", "rg32float", "rgba16uint", "rgba16sint", "rgba16float", "rgba32uint", "rgba32sint", "rgba32float", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb"];

const __wbindgen_enum_GpuTextureSampleType = ["float", "unfilterable-float", "depth", "sint", "uint"];

const __wbindgen_enum_GpuTextureViewDimension = ["1d", "2d", "2d-array", "cube", "cube-array", "3d"];

const __wbindgen_enum_GpuVertexFormat = ["uint8", "uint8x2", "uint8x4", "sint8", "sint8x2", "sint8x4", "unorm8", "unorm8x2", "unorm8x4", "snorm8", "snorm8x2", "snorm8x4", "uint16", "uint16x2", "uint16x4", "sint16", "sint16x2", "sint16x4", "unorm16", "unorm16x2", "unorm16x4", "snorm16", "snorm16x2", "snorm16x4", "float16", "float16x2", "float16x4", "float32", "float32x2", "float32x3", "float32x4", "uint32", "uint32x2", "uint32x3", "uint32x4", "sint32", "sint32x2", "sint32x3", "sint32x4", "unorm10-10-10-2", "unorm8x4-bgra"];

const __wbindgen_enum_GpuVertexStepMode = ["vertex", "instance"];

const __wbindgen_enum_WorkerType = ["classic", "module"];

const GpuBackendInfoFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gpubackendinfo_free(ptr >>> 0, 1));
/**
 * GPU backend configuration and status
 */
export class GpuBackendInfo {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GpuBackendInfo.prototype);
        obj.__wbg_ptr = ptr;
        GpuBackendInfoFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GpuBackendInfoFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gpubackendinfo_free(ptr, 0);
    }
    /**
     * @returns {GpuBackend}
     */
    get backend() {
        const ret = wasm.gpubackendinfo_backend(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {boolean}
     */
    get available() {
        const ret = wasm.gpubackendinfo_available(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get status_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.gpubackendinfo_status_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get webgpu_supported() {
        const ret = wasm.gpubackendinfo_webgpu_supported(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get webgl2_supported() {
        const ret = wasm.gpubackendinfo_webgl2_supported(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number | undefined}
     */
    get estimated_memory_mb() {
        const ret = wasm.gpubackendinfo_estimated_memory_mb(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : ret[1];
    }
    /**
     * @returns {string}
     */
    get adapter_info() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.gpubackendinfo_adapter_info(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const ProcessingConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_processingconfig_free(ptr >>> 0, 1));
/**
 * Processing manager configuration
 * Note: Configured for single-threaded WASM + Web Worker architecture
 */
export class ProcessingConfig {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ProcessingConfig.prototype);
        obj.__wbg_ptr = ptr;
        ProcessingConfigFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ProcessingConfigFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_processingconfig_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.processingconfig_new();
        this.__wbg_ptr = ret >>> 0;
        ProcessingConfigFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {boolean}
     */
    get try_gpu_acceleration() {
        const ret = wasm.processingconfig_try_gpu_acceleration(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} value
     */
    set try_gpu_acceleration(value) {
        wasm.processingconfig_set_try_gpu_acceleration(this.__wbg_ptr, value);
    }
    /**
     * @returns {number}
     */
    get max_attempt_time_ms() {
        const ret = wasm.processingconfig_max_attempt_time_ms(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} value
     */
    set max_attempt_time_ms(value) {
        wasm.processingconfig_set_max_attempt_time_ms(this.__wbg_ptr, value);
    }
    /**
     * @returns {boolean}
     */
    get aggressive_fallback() {
        const ret = wasm.processingconfig_aggressive_fallback(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} value
     */
    set aggressive_fallback(value) {
        wasm.processingconfig_set_aggressive_fallback(this.__wbg_ptr, value);
    }
    /**
     * @returns {boolean}
     */
    get cache_backend_selection() {
        const ret = wasm.processingconfig_cache_backend_selection(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @param {boolean} value
     */
    set cache_backend_selection(value) {
        wasm.processingconfig_set_cache_backend_selection(this.__wbg_ptr, value);
    }
}

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
    /**
     * @returns {boolean}
     */
    get webgpu_supported() {
        const ret = wasm.wasmcapabilityreport_webgpu_supported(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    get webgl2_supported() {
        const ret = wasm.wasmcapabilityreport_webgl2_supported(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {string}
     */
    get gpu_backend() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmcapabilityreport_gpu_backend(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const WasmConfigManagerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmconfigmanager_free(ptr >>> 0, 1));
/**
 * WASM configuration state manager
 *
 * This struct manages configuration state for the WASM interface in a clean,
 * immutable way without the recursive aliasing issues of the mutable builder.
 */
export class WasmConfigManager {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmConfigManagerFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmconfigmanager_free(ptr, 0);
    }
    /**
     * Create a new configuration manager
     */
    constructor() {
        const ret = wasm.wasmconfigmanager_new();
        this.__wbg_ptr = ret >>> 0;
        WasmConfigManagerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set backend
     * @param {string} backend
     */
    set_backend(backend) {
        const ptr0 = passStringToWasm0(backend, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmconfigmanager_set_backend(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set detail level
     * @param {number} detail
     */
    set_detail(detail) {
        const ret = wasm.wasmconfigmanager_set_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set stroke width
     * @param {number} width
     */
    set_stroke_width(width) {
        const ret = wasm.wasmconfigmanager_set_stroke_width(this.__wbg_ptr, width);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set multipass settings
     * @param {boolean} enabled
     * @param {number | null} [pass_count]
     */
    set_multipass(enabled, pass_count) {
        const ret = wasm.wasmconfigmanager_set_multipass(this.__wbg_ptr, enabled, isLikeNone(pass_count) ? 0x100000001 : (pass_count) >>> 0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set directional passes
     * @param {boolean} reverse
     * @param {boolean} diagonal
     */
    set_directional_passes(reverse, diagonal) {
        wasm.wasmconfigmanager_set_directional_passes(this.__wbg_ptr, reverse, diagonal);
    }
    /**
     * Set noise filtering
     * @param {boolean} enabled
     */
    set_noise_filtering(enabled) {
        wasm.wasmconfigmanager_set_noise_filtering(this.__wbg_ptr, enabled);
    }
    /**
     * Set hand-drawn preset
     * @param {string} preset
     */
    set_hand_drawn_preset(preset) {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmconfigmanager_set_hand_drawn_preset(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom hand-drawn parameters
     * @param {number | null} [tremor]
     * @param {number | null} [variable_weights]
     * @param {number | null} [tapering]
     */
    set_custom_hand_drawn(tremor, variable_weights, tapering) {
        const ret = wasm.wasmconfigmanager_set_custom_hand_drawn(this.__wbg_ptr, isLikeNone(tremor) ? 0x100000001 : Math.fround(tremor), isLikeNone(variable_weights) ? 0x100000001 : Math.fround(variable_weights), isLikeNone(tapering) ? 0x100000001 : Math.fround(tapering));
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set background removal
     * @param {boolean} enabled
     * @param {number | null} [strength]
     * @param {string | null} [algorithm]
     */
    set_background_removal(enabled, strength, algorithm) {
        var ptr0 = isLikeNone(algorithm) ? 0 : passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmconfigmanager_set_background_removal(this.__wbg_ptr, enabled, isLikeNone(strength) ? 0x100000001 : Math.fround(strength), ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Backend-specific configuration methods
     * @param {boolean} etf_fdog
     * @param {boolean} flow_tracing
     * @param {boolean} bezier_fitting
     */
    set_edge_settings(etf_fdog, flow_tracing, bezier_fitting) {
        const ret = wasm.wasmconfigmanager_set_edge_settings(this.__wbg_ptr, etf_fdog, flow_tracing, bezier_fitting);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {boolean} adaptive_threshold
     * @param {number} window_size
     * @param {number} sensitivity_k
     */
    set_centerline_settings(adaptive_threshold, window_size, sensitivity_k) {
        const ret = wasm.wasmconfigmanager_set_centerline_settings(this.__wbg_ptr, adaptive_threshold, window_size, sensitivity_k);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} density
     * @param {number} min_radius
     * @param {number} max_radius
     * @param {boolean} adaptive_sizing
     * @param {boolean} preserve_colors
     */
    set_dots_settings(density, min_radius, max_radius, adaptive_sizing, preserve_colors) {
        const ret = wasm.wasmconfigmanager_set_dots_settings(this.__wbg_ptr, density, min_radius, max_radius, adaptive_sizing, preserve_colors);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} num_superpixels
     * @param {number} compactness
     * @param {number} iterations
     */
    set_superpixel_settings(num_superpixels, compactness, iterations) {
        const ret = wasm.wasmconfigmanager_set_superpixel_settings(this.__wbg_ptr, num_superpixels, compactness, iterations);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Load a preset configuration
     * @param {string} preset
     */
    load_preset(preset) {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmconfigmanager_load_preset(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Build and get configuration summary for JavaScript
     * @returns {string}
     */
    build() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmconfigmanager_build(this.__wbg_ptr);
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
     * Get current backend
     * @returns {string}
     */
    get_backend() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmconfigmanager_get_backend(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Reset configuration to defaults
     */
    reset() {
        wasm.wasmconfigmanager_reset(this.__wbg_ptr);
    }
    /**
     * Validate current configuration
     * @returns {string}
     */
    validate() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmconfigmanager_validate(this.__wbg_ptr);
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
}

const WasmGpuSelectorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmgpuselector_free(ptr >>> 0, 1));
/**
 * GPU selector class for strategy selection
 */
export class WasmGpuSelector {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmGpuSelector.prototype);
        obj.__wbg_ptr = ptr;
        WasmGpuSelectorFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmGpuSelectorFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmgpuselector_free(ptr, 0);
    }
    /**
     * Create new GPU selector (CPU-only by default)
     */
    constructor() {
        const ret = wasm.wasmgpuselector_new();
        this.__wbg_ptr = ret >>> 0;
        WasmGpuSelectorFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Initialize GPU selector with GPU acceleration
     * @returns {Promise<WasmGpuSelector>}
     */
    static init_with_gpu() {
        const ret = wasm.wasmgpuselector_init_with_gpu();
        return ret;
    }
    /**
     * Analyze image characteristics for processing strategy
     * @param {ImageData} image_data
     * @returns {string}
     */
    analyze_image_characteristics(image_data) {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmgpuselector_analyze_image_characteristics(this.__wbg_ptr, image_data);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Select processing strategy based on image dimensions and algorithm
     * @param {number} width
     * @param {number} height
     * @param {string} algorithm
     * @returns {string}
     */
    select_strategy(width, height, algorithm) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.wasmgpuselector_select_strategy(this.__wbg_ptr, width, height, ptr0, len0);
            deferred2_0 = ret[0];
            deferred2_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
     * Record performance data (placeholder for compatibility)
     * @param {string} _algorithm
     * @param {number} _width
     * @param {number} _height
     * @param {number} _gpu_time_ms
     * @param {number | null} [_cpu_time_ms]
     */
    record_performance(_algorithm, _width, _height, _gpu_time_ms, _cpu_time_ms) {
        const ptr0 = passStringToWasm0(_algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.wasmgpuselector_record_performance(this.__wbg_ptr, ptr0, len0, _width, _height, _gpu_time_ms, !isLikeNone(_cpu_time_ms), isLikeNone(_cpu_time_ms) ? 0 : _cpu_time_ms);
    }
    /**
     * Get performance summary (placeholder for compatibility)
     * @returns {string}
     */
    get_performance_summary() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmgpuselector_get_performance_summary(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get historical speedup data (placeholder for compatibility)
     * @param {string} _algorithm
     * @param {number} _width
     * @param {number} _height
     * @returns {number | undefined}
     */
    get_historical_speedup(_algorithm, _width, _height) {
        const ptr0 = passStringToWasm0(_algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmgpuselector_get_historical_speedup(this.__wbg_ptr, ptr0, len0, _width, _height);
        return ret[0] === 0 ? undefined : ret[1];
    }
}

const WasmProgressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmprogress_free(ptr >>> 0, 1));
/**
 * Progress reporting structure for JavaScript callbacks
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
     * @returns {number | undefined}
     */
    get svg_size() {
        const ret = wasm.wasmprogress_svg_size(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * @returns {number | undefined}
     */
    get processing_time_ms() {
        const ret = wasm.wasmprogress_processing_time_ms(this.__wbg_ptr);
        return ret[0] === 0 ? undefined : ret[1];
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
 * Main WASM vectorizer interface
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
    constructor() {
        const ret = wasm.wasmvectorizer_new();
        this.__wbg_ptr = ret >>> 0;
        WasmVectorizerFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Apply complete configuration from JSON
     * This is the PRIMARY configuration method - replaces all individual setters
     * @param {string} config_json
     */
    apply_config_json(config_json) {
        const ptr0 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_apply_config_json(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Get the current configuration as JSON
     * @returns {string}
     */
    get_config_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizer_get_config_json(this.__wbg_ptr);
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
     * Validate configuration JSON without applying it
     * @param {string} config_json
     * @returns {boolean}
     */
    static validate_config_json(config_json) {
        const ptr0 = passStringToWasm0(config_json, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_validate_config_json(ptr0, len0);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0] !== 0;
    }
    /**
     * Set the vectorization backend
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
     * Set detail level (0.0 = low detail, 1.0 = high detail)
     * @param {number} detail
     */
    set_detail(detail) {
        const ret = wasm.wasmvectorizer_set_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set stroke width
     * @param {number} width
     */
    set_stroke_width(width) {
        const ret = wasm.wasmvectorizer_set_stroke_width(this.__wbg_ptr, width);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable multipass processing
     * @param {boolean} enabled
     */
    set_multipass(enabled) {
        wasm.wasmvectorizer_set_multipass(this.__wbg_ptr, enabled);
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
     * Set dot size range (min_radius, max_radius)
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
     * Enable or disable ETF/FDoG edge detection
     * @param {boolean} enabled
     */
    set_enable_etf_fdog(enabled) {
        wasm.wasmvectorizer_set_enable_etf_fdog(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable flow tracing
     * @param {boolean} enabled
     */
    set_enable_flow_tracing(enabled) {
        wasm.wasmvectorizer_set_enable_flow_tracing(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable bezier fitting
     * @param {boolean} enabled
     */
    set_enable_bezier_fitting(enabled) {
        wasm.wasmvectorizer_set_enable_bezier_fitting(this.__wbg_ptr, enabled);
    }
    /**
     * Set conservative detail for multipass processing
     * @param {number} detail
     */
    set_conservative_detail(detail) {
        const ret = wasm.wasmvectorizer_set_conservative_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set aggressive detail for multipass processing
     * @param {number} detail
     */
    set_aggressive_detail(detail) {
        const ret = wasm.wasmvectorizer_set_aggressive_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set directional strength threshold
     * @param {number} threshold
     */
    set_directional_strength_threshold(threshold) {
        const ret = wasm.wasmvectorizer_set_directional_strength_threshold(this.__wbg_ptr, threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable noise filtering
     * @param {boolean} enabled
     */
    set_noise_filtering(enabled) {
        wasm.wasmvectorizer_set_noise_filtering(this.__wbg_ptr, enabled);
    }
    /**
     * Set noise filter spatial sigma (for bilateral filter)
     * Note: This parameter is for future implementation
     * @param {number} sigma
     */
    set_noise_filter_spatial_sigma(sigma) {
        const ret = wasm.wasmvectorizer_set_noise_filter_spatial_sigma(this.__wbg_ptr, sigma);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set noise filter range sigma (for bilateral filter)
     * Note: This parameter is for future implementation
     * @param {number} sigma
     */
    set_noise_filter_range_sigma(sigma) {
        const ret = wasm.wasmvectorizer_set_noise_filter_range_sigma(this.__wbg_ptr, sigma);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set SVG precision
     * @param {number} precision
     */
    set_svg_precision(precision) {
        const ret = wasm.wasmvectorizer_set_svg_precision(this.__wbg_ptr, precision);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable adaptive threshold
     * @param {boolean} enabled
     */
    set_enable_adaptive_threshold(enabled) {
        wasm.wasmvectorizer_set_enable_adaptive_threshold(this.__wbg_ptr, enabled);
    }
    /**
     * Set window size for adaptive threshold
     * @param {number} size
     */
    set_window_size(size) {
        const ret = wasm.wasmvectorizer_set_window_size(this.__wbg_ptr, size);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set sensitivity k for adaptive threshold
     * @param {number} k
     */
    set_sensitivity_k(k) {
        const ret = wasm.wasmvectorizer_set_sensitivity_k(this.__wbg_ptr, k);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable width modulation
     * @param {boolean} enabled
     */
    set_enable_width_modulation(enabled) {
        wasm.wasmvectorizer_set_enable_width_modulation(this.__wbg_ptr, enabled);
    }
    /**
     * Set minimum branch length
     * @param {number} length
     */
    set_min_branch_length(length) {
        const ret = wasm.wasmvectorizer_set_min_branch_length(this.__wbg_ptr, length);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set Douglas-Peucker epsilon
     * @param {number} epsilon
     */
    set_douglas_peucker_epsilon(epsilon) {
        const ret = wasm.wasmvectorizer_set_douglas_peucker_epsilon(this.__wbg_ptr, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set dot density threshold
     * @param {number} threshold
     */
    set_dot_density(threshold) {
        const ret = wasm.wasmvectorizer_set_dot_density(this.__wbg_ptr, threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable adaptive sizing for dots
     * @param {boolean} enabled
     */
    set_adaptive_sizing(enabled) {
        wasm.wasmvectorizer_set_adaptive_sizing(this.__wbg_ptr, enabled);
    }
    /**
     * Set background tolerance for dots
     * @param {number} tolerance
     */
    set_background_tolerance(tolerance) {
        const ret = wasm.wasmvectorizer_set_background_tolerance(this.__wbg_ptr, tolerance);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable Poisson disk sampling
     * @param {boolean} enabled
     */
    set_poisson_disk_sampling(enabled) {
        wasm.wasmvectorizer_set_poisson_disk_sampling(this.__wbg_ptr, enabled);
    }
    /**
     * Enable or disable gradient-based sizing
     * @param {boolean} enabled
     */
    set_gradient_based_sizing(enabled) {
        wasm.wasmvectorizer_set_gradient_based_sizing(this.__wbg_ptr, enabled);
    }
    /**
     * Set number of superpixels
     * @param {number} count
     */
    set_num_superpixels(count) {
        const ret = wasm.wasmvectorizer_set_num_superpixels(this.__wbg_ptr, count);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set superpixel compactness
     * @param {number} compactness
     */
    set_compactness(compactness) {
        const ret = wasm.wasmvectorizer_set_compactness(this.__wbg_ptr, compactness);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set SLIC iterations
     * @param {number} iterations
     */
    set_slic_iterations(iterations) {
        const ret = wasm.wasmvectorizer_set_slic_iterations(this.__wbg_ptr, iterations);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set boundary epsilon for superpixel simplification
     * @param {number} epsilon
     */
    set_boundary_epsilon(epsilon) {
        const ret = wasm.wasmvectorizer_set_boundary_epsilon(this.__wbg_ptr, epsilon);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set initialization pattern for superpixel backend
     * @param {string} pattern
     */
    set_superpixel_initialization_pattern(pattern) {
        const ptr0 = passStringToWasm0(pattern, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_set_superpixel_initialization_pattern(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Deprecated: Use set_superpixel_initialization_pattern instead
     * @param {string} pattern
     */
    set_initialization_pattern(pattern) {
        const ptr0 = passStringToWasm0(pattern, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizer_set_initialization_pattern(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set color preservation for superpixel backend
     * @param {boolean} enabled
     */
    set_superpixel_preserve_colors(enabled) {
        wasm.wasmvectorizer_set_superpixel_preserve_colors(this.__wbg_ptr, enabled);
    }
    /**
     * Set fill regions for superpixel backend
     * @param {boolean} enabled
     */
    set_fill_regions(enabled) {
        wasm.wasmvectorizer_set_fill_regions(this.__wbg_ptr, enabled);
    }
    /**
     * Set stroke regions for superpixel backend
     * @param {boolean} enabled
     */
    set_stroke_regions(enabled) {
        wasm.wasmvectorizer_set_stroke_regions(this.__wbg_ptr, enabled);
    }
    /**
     * Set simplify boundaries for superpixel backend
     * @param {boolean} enabled
     */
    set_simplify_boundaries(enabled) {
        wasm.wasmvectorizer_set_simplify_boundaries(this.__wbg_ptr, enabled);
    }
    /**
     * Set preserve colors (generic)
     * @param {boolean} enabled
     */
    set_preserve_colors(enabled) {
        wasm.wasmvectorizer_set_preserve_colors(this.__wbg_ptr, enabled);
    }
    /**
     * Set color tolerance
     * @param {number} tolerance
     */
    set_color_tolerance(tolerance) {
        const ret = wasm.wasmvectorizer_set_color_tolerance(this.__wbg_ptr, tolerance);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set line preserve colors (edge/centerline backends)
     * @param {boolean} enabled
     */
    set_line_preserve_colors(enabled) {
        wasm.wasmvectorizer_set_line_preserve_colors(this.__wbg_ptr, enabled);
    }
    /**
     * Set line color accuracy (edge/centerline backends)
     * @param {number} accuracy
     */
    set_line_color_accuracy(accuracy) {
        const ret = wasm.wasmvectorizer_set_line_color_accuracy(this.__wbg_ptr, accuracy);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set max colors per path (edge/centerline backends)
     * @param {number} count
     */
    set_max_colors_per_path(count) {
        const ret = wasm.wasmvectorizer_set_max_colors_per_path(this.__wbg_ptr, count);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable background removal
     * @param {boolean} enabled
     */
    enable_background_removal(enabled) {
        wasm.wasmvectorizer_enable_background_removal(this.__wbg_ptr, enabled);
    }
    /**
     * Set background removal strength
     * @param {number} strength
     */
    set_background_removal_strength(strength) {
        const ret = wasm.wasmvectorizer_set_background_removal_strength(this.__wbg_ptr, strength);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set background removal algorithm
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
     * Set background removal threshold
     * @param {number} threshold
     */
    set_background_removal_threshold(threshold) {
        const ret = wasm.wasmvectorizer_set_background_removal_threshold(this.__wbg_ptr, threshold);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set hand-drawn preset for artistic effects
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
     * Set multi-pass intensity for sketchy overlapping strokes
     * @param {number} intensity
     */
    set_multi_pass_intensity(intensity) {
        const ret = wasm.wasmvectorizer_set_multi_pass_intensity(this.__wbg_ptr, intensity);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set image resolution for adaptive scaling
     * @param {number} width
     * @param {number} height
     */
    set_image_resolution(width, height) {
        const ret = wasm.wasmvectorizer_set_image_resolution(this.__wbg_ptr, width, height);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable or disable adaptive scaling
     * @param {boolean} enabled
     */
    set_adaptive_scaling(enabled) {
        wasm.wasmvectorizer_set_adaptive_scaling(this.__wbg_ptr, enabled);
    }
    /**
     * Process an image and return SVG
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
     * Simple vectorize function without progress callbacks
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
     * GPU-accelerated vectorize function with automatic backend selection
     * @param {ImageData} image_data
     * @param {Function | null} [callback]
     * @returns {Promise<string>}
     */
    vectorize_with_gpu(image_data, callback) {
        const ret = wasm.wasmvectorizer_vectorize_with_gpu(this.__wbg_ptr, image_data, isLikeNone(callback) ? 0 : addToExternrefTable0(callback));
        return ret;
    }
    /**
     * Reset configuration to defaults
     */
    reset_config() {
        wasm.wasmvectorizer_reset_config(this.__wbg_ptr);
    }
    /**
     * Get current backend as string
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
     * Debug method to dump current configuration state
     * @returns {string}
     */
    debug_dump_config() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmvectorizer_debug_dump_config(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Validate current configuration and return validation results
     * @returns {string}
     */
    validate_config() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmvectorizer_validate_config(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Apply a complete configuration from JSON in a single call
     * This is the most efficient way to configure the vectorizer, reducing 20+ individual
     * setter calls to a single boundary crossing.
     * Validate a configuration JSON without applying it
     * Returns a JSON string with validation results
     * Get default configuration JSON for a specific backend
     * Returns a JSON string with all default parameters for the specified backend
     * @param {string} backend
     * @returns {string}
     */
    get_default_config_json(backend) {
        let deferred3_0;
        let deferred3_1;
        try {
            const ptr0 = passStringToWasm0(backend, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ret = wasm.wasmvectorizer_get_default_config_json(this.__wbg_ptr, ptr0, len0);
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
     * Get current configuration as JSON
     * Returns the current configuration state as a JSON string
     * @returns {string}
     */
    get_current_config_json() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizer_get_current_config_json(this.__wbg_ptr);
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
}

const WasmVectorizerRefactoredFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmvectorizerrefactored_free(ptr >>> 0, 1));
/**
 * Clean WASM vectorizer interface using immutable configuration
 */
export class WasmVectorizerRefactored {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmVectorizerRefactoredFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmvectorizerrefactored_free(ptr, 0);
    }
    /**
     * Create a new vectorizer instance
     */
    constructor() {
        const ret = wasm.wasmvectorizerrefactored_new();
        this.__wbg_ptr = ret >>> 0;
        WasmVectorizerRefactoredFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Set the backend
     * @param {string} backend
     */
    set_backend(backend) {
        const ptr0 = passStringToWasm0(backend, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizerrefactored_set_backend(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set detail level
     * @param {number} detail
     */
    set_detail(detail) {
        const ret = wasm.wasmvectorizerrefactored_set_detail(this.__wbg_ptr, detail);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set stroke width
     * @param {number} width
     */
    set_stroke_width(width) {
        const ret = wasm.wasmvectorizerrefactored_set_stroke_width(this.__wbg_ptr, width);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable/disable multipass with optional pass count
     * @param {boolean} enabled
     */
    set_multipass(enabled) {
        const ret = wasm.wasmvectorizerrefactored_set_multipass(this.__wbg_ptr, enabled);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set pass count for multipass
     * @param {number} count
     */
    set_pass_count(count) {
        const ret = wasm.wasmvectorizerrefactored_set_pass_count(this.__wbg_ptr, count);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable/disable reverse pass
     * @param {boolean} enabled
     */
    set_reverse_pass(enabled) {
        wasm.wasmvectorizerrefactored_set_reverse_pass(this.__wbg_ptr, enabled);
    }
    /**
     * Enable/disable diagonal pass
     * @param {boolean} enabled
     */
    set_diagonal_pass(enabled) {
        wasm.wasmvectorizerrefactored_set_diagonal_pass(this.__wbg_ptr, enabled);
    }
    /**
     * Enable/disable noise filtering
     * @param {boolean} enabled
     */
    set_noise_filtering(enabled) {
        wasm.wasmvectorizerrefactored_set_noise_filtering(this.__wbg_ptr, enabled);
    }
    /**
     * Set hand-drawn preset
     * @param {string} preset
     */
    set_hand_drawn_preset(preset) {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizerrefactored_set_hand_drawn_preset(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom tremor strength
     * @param {number} tremor
     */
    set_custom_tremor(tremor) {
        const ret = wasm.wasmvectorizerrefactored_set_custom_tremor(this.__wbg_ptr, tremor);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom variable weights
     * @param {number} weights
     */
    set_custom_variable_weights(weights) {
        const ret = wasm.wasmvectorizerrefactored_set_custom_variable_weights(this.__wbg_ptr, weights);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set custom tapering
     * @param {number} tapering
     */
    set_custom_tapering(tapering) {
        const ret = wasm.wasmvectorizerrefactored_set_custom_tapering(this.__wbg_ptr, tapering);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Enable/disable background removal
     * @param {boolean} enabled
     */
    enable_background_removal(enabled) {
        wasm.wasmvectorizerrefactored_enable_background_removal(this.__wbg_ptr, enabled);
    }
    /**
     * Set background removal strength
     * @param {number} strength
     */
    set_background_removal_strength(strength) {
        const ret = wasm.wasmvectorizerrefactored_set_background_removal_strength(this.__wbg_ptr, strength);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set background removal algorithm
     * @param {string} algorithm
     */
    set_background_removal_algorithm(algorithm) {
        const ptr0 = passStringToWasm0(algorithm, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizerrefactored_set_background_removal_algorithm(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Configure Edge/Centerline backend settings
     * @param {boolean} etf_fdog
     * @param {boolean} flow_tracing
     * @param {boolean} bezier_fitting
     */
    set_edge_settings(etf_fdog, flow_tracing, bezier_fitting) {
        const ret = wasm.wasmvectorizerrefactored_set_edge_settings(this.__wbg_ptr, etf_fdog, flow_tracing, bezier_fitting);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Configure Centerline backend settings
     * @param {boolean} adaptive_threshold
     * @param {number} window_size
     * @param {number} sensitivity_k
     */
    set_centerline_settings(adaptive_threshold, window_size, sensitivity_k) {
        const ret = wasm.wasmvectorizerrefactored_set_centerline_settings(this.__wbg_ptr, adaptive_threshold, window_size, sensitivity_k);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Configure Dots backend settings
     * @param {number} density
     * @param {number} min_radius
     * @param {number} max_radius
     * @param {boolean} adaptive_sizing
     * @param {boolean} preserve_colors
     */
    set_dots_settings(density, min_radius, max_radius, adaptive_sizing, preserve_colors) {
        const ret = wasm.wasmvectorizerrefactored_set_dots_settings(this.__wbg_ptr, density, min_radius, max_radius, adaptive_sizing, preserve_colors);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Configure Superpixel backend settings
     * @param {number} num_superpixels
     * @param {number} compactness
     * @param {number} iterations
     */
    set_superpixel_settings(num_superpixels, compactness, iterations) {
        const ret = wasm.wasmvectorizerrefactored_set_superpixel_settings(this.__wbg_ptr, num_superpixels, compactness, iterations);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Load a preset configuration
     * @param {string} preset
     */
    load_preset(preset) {
        const ptr0 = passStringToWasm0(preset, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmvectorizerrefactored_load_preset(this.__wbg_ptr, ptr0, len0);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Process an image and return SVG
     * @param {ImageData} image_data
     * @returns {string}
     */
    vectorize(image_data) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizerrefactored_vectorize(this.__wbg_ptr, image_data);
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
     * Process an image with progress callback
     * @param {ImageData} image_data
     * @param {Function | null} [callback]
     * @returns {string}
     */
    vectorize_with_progress(image_data, callback) {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizerrefactored_vectorize_with_progress(this.__wbg_ptr, image_data, isLikeNone(callback) ? 0 : addToExternrefTable0(callback));
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
     * Reset configuration to defaults
     */
    reset_config() {
        wasm.wasmvectorizerrefactored_reset_config(this.__wbg_ptr);
    }
    /**
     * Get current backend as string
     * @returns {string}
     */
    get_backend() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmvectorizerrefactored_get_backend(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Validate current configuration
     * @returns {string}
     */
    validate_config() {
        let deferred2_0;
        let deferred2_1;
        try {
            const ret = wasm.wasmvectorizerrefactored_validate_config(this.__wbg_ptr);
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
     * Debug dump configuration
     * @returns {string}
     */
    debug_dump_config() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.wasmvectorizerrefactored_debug_dump_config(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
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
    imports.wbg.__wbg_URL_7fe066fa4113de91 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.URL;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_UTC_925e7a2b93c33767 = function(arg0, arg1) {
        const ret = Date.UTC(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_WebGL2RenderingContext_c0b42e22650ff2c9 = function() { return handleError(function () {
        const ret = globalThis.WebGL2RenderingContext();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_Window_a4c5a48392f234ba = function(arg0) {
        const ret = arg0.Window;
        return ret;
    };
    imports.wbg.__wbg_WorkerGlobalScope_2b2b89e1ac952b50 = function(arg0) {
        const ret = arg0.WorkerGlobalScope;
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
    imports.wbg.__wbg_accessKeyLabel_8ac3e6b111cdda50 = function(arg0, arg1) {
        const ret = arg1.accessKeyLabel;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_accessKey_e5aac75bd34717a5 = function(arg0, arg1) {
        const ret = arg1.accessKey;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_acos_b68abcb126624477 = function(arg0) {
        const ret = Math.acos(arg0);
        return ret;
    };
    imports.wbg.__wbg_acosh_6282e5fe665cf63f = function(arg0) {
        const ret = Math.acosh(arg0);
        return ret;
    };
    imports.wbg.__wbg_activeElement_367599fdfa7ad115 = function(arg0) {
        const ret = arg0.activeElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_activeTexture_0f19d8acfa0a14c2 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_activeTexture_460f2e367e813fb0 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_activeVRDisplays_a83a9aa280ae4186 = function(arg0) {
        const ret = arg0.activeVRDisplays;
        return ret;
    };
    imports.wbg.__wbg_adapterInfo_74d93490ff843c7f = function(arg0) {
        const ret = arg0.adapterInfo;
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
    imports.wbg.__wbg_adoptNode_a7cd9a7af34e6005 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.adoptNode(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_after_0b4eeaf5452747d8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.after(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_after_108e41f903cace7d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.after(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_after_2612d4fffe308757 = function() { return handleError(function (arg0) {
        arg0.after();
    }, arguments) };
    imports.wbg.__wbg_after_263ab632300fc9d9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_after_2c16a18af060fa07 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_after_3a73be245382bf06 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_after_4026318b3dd1aa03 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.after(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_after_4480042e47c5aec6 = function() { return handleError(function (arg0) {
        arg0.after();
    }, arguments) };
    imports.wbg.__wbg_after_550b9493192c5af8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_after_7474586172c50ce7 = function() { return handleError(function (arg0, arg1) {
        arg0.after(arg1);
    }, arguments) };
    imports.wbg.__wbg_after_76f6ce4efc4d9f30 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.after(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_after_7e066b00d876f09e = function() { return handleError(function (arg0, arg1) {
        arg0.after(...arg1);
    }, arguments) };
    imports.wbg.__wbg_after_a4c66985295d48ca = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_after_b524d48dc75ad9ae = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.after(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_after_bd04fa01877cc26e = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.after(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_after_c6bb1e773d660aff = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_after_de3ea9c3e4977fcc = function() { return handleError(function (arg0, arg1) {
        arg0.after(...arg1);
    }, arguments) };
    imports.wbg.__wbg_after_eb78148f95551b93 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.after(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_alert_90cedcff585b96d6 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.alert(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_alert_bf5d209744414b8e = function() { return handleError(function (arg0) {
        arg0.alert();
    }, arguments) };
    imports.wbg.__wbg_align_9c0da83eab20632b = function(arg0, arg1) {
        const ret = arg1.align;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_allSettled_d6c2eb0382f2fff9 = function(arg0) {
        const ret = Promise.allSettled(arg0);
        return ret;
    };
    imports.wbg.__wbg_all_d5bf227e8f68795d = function(arg0) {
        const ret = Promise.all(arg0);
        return ret;
    };
    imports.wbg.__wbg_allocationSize_e2411815b9e923d6 = function() { return handleError(function (arg0) {
        const ret = arg0.allocationSize();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_alt_46b85ecccedacb93 = function(arg0, arg1) {
        const ret = arg1.alt;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_appCodeName_54b0c05bad9ad784 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appCodeName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appName_790ce2a95cd0e1b8 = function(arg0, arg1) {
        const ret = arg1.appName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
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
    imports.wbg.__wbg_appVersion_fbbe96aac3bcca72 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appVersion;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appendChild_8204974b7328bf98 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.appendChild(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_append_021747f107b566a4 = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_065727f6a1e20c82 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.append(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_append_289312ac650dc5da = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_append_2d373bf2d09d0105 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.append(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_append_3a79af10760333cc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_append_3bfc4e2d0cad289f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_append_3e2d678ccbe4ca04 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_append_4909c7d215381c40 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.append(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_append_78bb5e482c8041af = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_append_7a38581cecef670e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_append_8001ee865a696e7a = function() { return handleError(function (arg0, arg1) {
        arg0.append(arg1);
    }, arguments) };
    imports.wbg.__wbg_append_91800b8aae0c3f14 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_append_9305c7d3f27e05a5 = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_98dbc84fcdd685fb = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_append_9b4d2b566d024f1e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_append_9c30d5b72ccca90f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.append(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_append_9f1abf8139007873 = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_9f8c3778ac5bb95f = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_append_a76eb260e5f696b4 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_append_afad7ded7d317de6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_append_b73f6a50a1318221 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_append_b8eefca14b70d1cc = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_bd50a42365ab9b8f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_append_c0074b30dd1ee33d = function() { return handleError(function (arg0, arg1) {
        arg0.append(arg1);
    }, arguments) };
    imports.wbg.__wbg_append_c4fc5a4d60cb438a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_append_c545865dce8d3692 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_append_cae73cc1571a2ea9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_append_cd77a3e797b04a5c = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_cfd9b6c0be8b868c = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_append_d3e73b1ac5c66347 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_append_ed45e7945a9b5746 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_append_efc201e8a8e5a469 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_append_f57603526df1d86b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_append_f5ec5c4aa8196a6f = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_f9e40c8f8de04a61 = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_fb620c7fc0303e7d = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_apply_36be6a55257c99bf = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.apply(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_apply_eb9e9b97497f91e4 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.apply(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_architecture_3632d9d8bfcd08ac = function(arg0, arg1) {
        const ret = arg1.architecture;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
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
    imports.wbg.__wbg_attachShader_3d4eb6af9e3e7bd1 = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_attachShader_94e758c8b5283eb2 = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_autofocus_927db73820c549f4 = function(arg0) {
        const ret = arg0.autofocus;
        return ret;
    };
    imports.wbg.__wbg_autoplay_db1a14e982cdcdef = function(arg0) {
        const ret = arg0.autoplay;
        return ret;
    };
    imports.wbg.__wbg_baseURI_240b3b82ba685e7c = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.baseURI;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_before_0804531a4528970a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_before_1a3e8cec6c32e521 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.before(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_before_1eea696651d8156d = function() { return handleError(function (arg0, arg1) {
        arg0.before(...arg1);
    }, arguments) };
    imports.wbg.__wbg_before_3353bcb66d05453a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_before_4d6dbf3d43b4b08a = function() { return handleError(function (arg0) {
        arg0.before();
    }, arguments) };
    imports.wbg.__wbg_before_5dd05d088f31c3d5 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.before(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_before_65c9e99ae4f3ddd7 = function() { return handleError(function (arg0, arg1) {
        arg0.before(...arg1);
    }, arguments) };
    imports.wbg.__wbg_before_6b28047649006972 = function() { return handleError(function (arg0) {
        arg0.before();
    }, arguments) };
    imports.wbg.__wbg_before_78a4486ba216533b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.before(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_before_80972be18c47dafc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.before(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_before_a3005efb5fc8dfad = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_before_aac458ae3b80541e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_before_ae82426161175bb3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.before(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_before_c735810cb6839ce5 = function() { return handleError(function (arg0, arg1) {
        arg0.before(arg1);
    }, arguments) };
    imports.wbg.__wbg_before_d9c882d08301a93f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_before_e3f97c5d3551ad63 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.before(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_before_f1a685129f6e7765 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.before(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_before_ff5b808af31c0d55 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_beginComputePass_304dccb30a4db2cc = function(arg0, arg1) {
        const ret = arg0.beginComputePass(arg1);
        return ret;
    };
    imports.wbg.__wbg_beginComputePass_7db4acfc0075f450 = function(arg0) {
        const ret = arg0.beginComputePass();
        return ret;
    };
    imports.wbg.__wbg_beginOcclusionQuery_d261f72357ca0cbd = function(arg0, arg1) {
        arg0.beginOcclusionQuery(arg1 >>> 0);
    };
    imports.wbg.__wbg_beginQueryEXT_814e2693cd8f5f0a = function(arg0, arg1, arg2) {
        arg0.beginQueryEXT(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_beginQuery_6af0b28414b16c07 = function(arg0, arg1, arg2) {
        arg0.beginQuery(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_beginRenderPass_2bc62f5f78642ee0 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.beginRenderPass(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_beginTransformFeedback_a0966b5262176678 = function(arg0, arg1) {
        arg0.beginTransformFeedback(arg1 >>> 0);
    };
    imports.wbg.__wbg_bindAttribLocation_40da4b3e84cc7bd5 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bindAttribLocation_ce2730e29976d230 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bindBufferBase_9a5e345a36fbf5f4 = function(arg0, arg1, arg2, arg3) {
        arg0.bindBufferBase(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_bindBufferRange_454f90f2b1781982 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBufferRange_64ea09b65a9e0373 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBufferRange_ad6d9465e988c284 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBufferRange_f7df16edd8051e04 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBuffer_309c9a6c21826cf5 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindBuffer_f32f587f1c2962a7 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_bd02c8cc707d670f = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_e48e83c0f973944d = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_53eedd88e52b4cb5 = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_55e205fecfddbb8c = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindSampler_9f59cf2eaa22eee0 = function(arg0, arg1, arg2) {
        arg0.bindSampler(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_a6e795697f49ebd1 = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_bc8eb316247f739d = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTransformFeedback_10c597e6c2b575b4 = function(arg0, arg1, arg2) {
        arg0.bindTransformFeedback(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindVertexArrayOES_da8e7059b789629e = function(arg0, arg1) {
        arg0.bindVertexArrayOES(arg1);
    };
    imports.wbg.__wbg_bindVertexArray_6b4b88581064b71f = function(arg0, arg1) {
        arg0.bindVertexArray(arg1);
    };
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
    imports.wbg.__wbg_blendColor_15ba1eff44560932 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_blendColor_6446fba673f64ff0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_blendEquationSeparate_c1aa26a9a5c5267e = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendEquationSeparate_f3d422e981d86339 = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendEquation_c23d111ad6d268ff = function(arg0, arg1) {
        arg0.blendEquation(arg1 >>> 0);
    };
    imports.wbg.__wbg_blendEquation_cec7bc41f3e5704c = function(arg0, arg1) {
        arg0.blendEquation(arg1 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_483be8d4dd635340 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_dafeabfc1680b2ee = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blendFunc_9454884a3cfd2911 = function(arg0, arg1, arg2) {
        arg0.blendFunc(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendFunc_c3b74be5a39c665f = function(arg0, arg1, arg2) {
        arg0.blendFunc(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blitFramebuffer_7303bdff77cfe967 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.blitFramebuffer(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_blur_347057ec60b37695 = function() { return handleError(function (arg0) {
        arg0.blur();
    }, arguments) };
    imports.wbg.__wbg_blur_c2ad8cc71bac3974 = function() { return handleError(function (arg0) {
        arg0.blur();
    }, arguments) };
    imports.wbg.__wbg_body_942ea927546a04ba = function(arg0) {
        const ret = arg0.body;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_border_88925c92c06f9426 = function(arg0, arg1) {
        const ret = arg1.border;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
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
    imports.wbg.__wbg_bufferData_0abecb564006493b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_bufferData_16923c0ffe315a76 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferData_3261d3e1dd6fc903 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_33c59bf909ea6fd3 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_463178757784fcac = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_566705f8377b6344 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_5d4f734d66d49dae = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_5f3f1dac57a79255 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_5fe4415cfa76adbd = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_62e535618393a141 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferData_793d559472cc534a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferData_a388507cdfe27963 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_c021e80425acf6da = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_c97b729d560cf60d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_d99b6b4eb5283f20 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_e6716160ff81f9fc = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_e782cf0ee06c693a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_f46a30812f317a7e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_07c3479a59df3fc3 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_0a63a3fb89e74f26 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_1ef21e58ff76e88b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_2625507c8a2d5e70 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_3f4a16a505cf698e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_4e973eefe9236d04 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_4f958560deb072c9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_4fe6dce97a11488e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_517481c2670c1f4c = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_5c4b3ff7a128c850 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_5db4c8a294948607 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_600f275f115d4fd8 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_60eaf035da6900c7 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_6790430cf2cdaddb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_679dca25204692bd = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_6871ba4f8a3c43b7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_78e9cba0ddca22ed = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_80830771d579fc3f = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_8175f19234045e6d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_96bede9d2952870b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_cd93e0e686368e8e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_d1604b0a62f9aea1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_d1f3c04cd10d6056 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_d6f6b7f00622b7ac = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_dcd4d16031a60345 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_dfe10818bd4b985d = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_e57bdf2b10eece9d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_eca7be1b284cc1f4 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
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
    imports.wbg.__wbg_canPlayType_fed4010274924341 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.canPlayType(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
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
    imports.wbg.__wbg_canvas_08a474f774a35a52 = function(arg0) {
        const ret = arg0.canvas;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_canvas_61c22f731dd850f6 = function(arg0) {
        const ret = arg0.canvas;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_canvas_eacd0ca8eb2bb7a8 = function(arg0) {
        const ret = arg0.canvas;
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
    imports.wbg.__wbg_characterSet_dbd46cba215aa9ac = function(arg0, arg1) {
        const ret = arg1.characterSet;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_charset_74968d861c6c76ef = function(arg0, arg1) {
        const ret = arg1.charset;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_checkFramebufferStatus_1aea9a28f6bc4fa6 = function(arg0, arg1) {
        const ret = arg0.checkFramebufferStatus(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_checkFramebufferStatus_6c0515b61b4291d5 = function(arg0, arg1) {
        const ret = arg0.checkFramebufferStatus(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_childElementCount_385229cd432147ba = function(arg0) {
        const ret = arg0.childElementCount;
        return ret;
    };
    imports.wbg.__wbg_childElementCount_badb805eb4089416 = function(arg0) {
        const ret = arg0.childElementCount;
        return ret;
    };
    imports.wbg.__wbg_childNodes_c4423003f3a9441f = function(arg0) {
        const ret = arg0.childNodes;
        return ret;
    };
    imports.wbg.__wbg_className_c085027b30c195d3 = function(arg0, arg1) {
        const ret = arg1.className;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_clearBuffer_1d6a82c413da2143 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_clearBuffer_3d04c6e36b54e254 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_clearBuffer_b7d0381b50c8f5bb = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_clearBuffer_ca1d866a5800f697 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_clearBuffer_df7f56347deee350 = function(arg0, arg1) {
        arg0.clearBuffer(arg1);
    };
    imports.wbg.__wbg_clearBuffer_e3fa352fcc8ecc67 = function(arg0, arg1, arg2) {
        arg0.clearBuffer(arg1, arg2);
    };
    imports.wbg.__wbg_clearBuffer_f66025582e026136 = function(arg0, arg1, arg2) {
        arg0.clearBuffer(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_clearBufferfi_18d5faa0229bbb10 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfi(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearBufferfv_2b7963f04b68c981 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferfv_5c19da4455b89068 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferfv_65ea413f7f2554a2 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_clearBufferfv_775630c737c1fabb = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferfv_e2e85a03fa3993ea = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferfv_effe01dcf71afb21 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_340006b90af4f17b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_930c6802f2664249 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferiv_b75f46b1b081b5ac = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_c003c27b77a0245b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_clearBufferiv_c24df548e7e56c3c = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferiv_d05a9039d2467de5 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_3546bdab12bd5bcf = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_48cc9a933b01cfbe = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_71c827b90419f147 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_8ad5085d01f025c7 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferuiv_8c285072f2026a37 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_clearBufferuiv_d3f97678b16b5e5d = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearColor_d39507085c98a678 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearColor_f0fa029dfbcc1982 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearDepth_17cfee5be8476fae = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clearDepth_670d19914a501259 = function(arg0, arg1) {
        arg0.clearDepth(arg1);
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
    imports.wbg.__wbg_clearStencil_4323424f1acca0df = function(arg0, arg1) {
        arg0.clearStencil(arg1);
    };
    imports.wbg.__wbg_clearStencil_7addd3b330b56b27 = function(arg0, arg1) {
        arg0.clearStencil(arg1);
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
    imports.wbg.__wbg_clear_62b9037b892f6988 = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clear_f12a18d4396a6a94 = function() {
        console.clear();
    };
    imports.wbg.__wbg_clear_f8d5f3c348d37d95 = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clear_fca8ee600282eba4 = function(arg0) {
        arg0.clear();
    };
    imports.wbg.__wbg_click_c52d7bdb3b6dc9c3 = function(arg0) {
        arg0.click();
    };
    imports.wbg.__wbg_clientHeight_216178c194000db4 = function(arg0) {
        const ret = arg0.clientHeight;
        return ret;
    };
    imports.wbg.__wbg_clientLeft_b0129910947303cd = function(arg0) {
        const ret = arg0.clientLeft;
        return ret;
    };
    imports.wbg.__wbg_clientTop_de5f81cc8156f4c6 = function(arg0) {
        const ret = arg0.clientTop;
        return ret;
    };
    imports.wbg.__wbg_clientWaitSync_4b49b679100154b4 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.clientWaitSync(arg1, arg2 >>> 0, arg3);
        return ret;
    };
    imports.wbg.__wbg_clientWaitSync_6930890a42bd44c0 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.clientWaitSync(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_clientWidth_ce67a04dc15fce39 = function(arg0) {
        const ret = arg0.clientWidth;
        return ret;
    };
    imports.wbg.__wbg_cloneNode_a8ce4052a2c37536 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.cloneNode(arg1 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_cloneNode_e35b333b87d51340 = function() { return handleError(function (arg0) {
        const ret = arg0.cloneNode();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_clone_89dccf4c3de2fac7 = function() { return handleError(function (arg0) {
        const ret = arg0.clone();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_close_162e826d20a642ba = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_close_4760e2b3758cb809 = function() { return handleError(function (arg0) {
        arg0.close();
    }, arguments) };
    imports.wbg.__wbg_close_487a86835f4d2ee3 = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_closed_04e8dbfa3fbe0177 = function() { return handleError(function (arg0) {
        const ret = arg0.closed;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_closest_73ed23f4aa9c0b46 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.closest(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_clz32_8663ef8c423ba902 = function(arg0) {
        const ret = Math.clz32(arg0);
        return ret;
    };
    imports.wbg.__wbg_codePointAt_78181f32881e5b59 = function(arg0, arg1) {
        const ret = arg0.codePointAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_codedHeight_68cd784ecbc3b742 = function(arg0) {
        const ret = arg0.codedHeight;
        return ret;
    };
    imports.wbg.__wbg_codedWidth_756904fbc3fc7465 = function(arg0) {
        const ret = arg0.codedWidth;
        return ret;
    };
    imports.wbg.__wbg_colorMask_5e7c60b9c7a57a2e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_colorMask_6dac12039c7145ae = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_commit_1ccb5a9571ac0f46 = function(arg0) {
        arg0.commit();
    };
    imports.wbg.__wbg_compareDocumentPosition_e9dddbfce23cda8b = function(arg0, arg1) {
        const ret = arg0.compareDocumentPosition(arg1);
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
    imports.wbg.__wbg_compatMode_3256e1b3bdeb8aa8 = function(arg0, arg1) {
        const ret = arg1.compatMode;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_compileShader_0ad770bbdbb9de21 = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_compileShader_2307c9d370717dd5 = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_compileStreaming_2428c74f1f1905e9 = function(arg0) {
        const ret = WebAssembly.compileStreaming(arg0);
        return ret;
    };
    imports.wbg.__wbg_compile_5422d3b813875b98 = function(arg0) {
        const ret = WebAssembly.compile(arg0);
        return ret;
    };
    imports.wbg.__wbg_complete_7a623be264d76fd2 = function(arg0) {
        const ret = arg0.complete;
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
    imports.wbg.__wbg_compressedTexImage2D_448ee5b0289e4ca3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_5790c37ce10b4f6a = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_6d9416aafd1436db = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_7a8269aa9ecbf2ff = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_7e2657a44b9c59f0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_compressedTexImage2D_7e8c6f7f34484c00 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_8c0b364d8c56a7ce = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_9051c1590c556cae = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage2D_94ce348c7b58064c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8), arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_9855204361bfa06c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8), arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_9eec40959c4eb09e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage2D_b2aa99ad29e8dece = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_compressedTexImage2D_b2d3a97e90609813 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_cc859513aac3c897 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_1d62bc1687be91ae = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_3c5908aec6a2dd7b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_40616a1d91385a04 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_6f68e1d53abfc4bb = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, getArrayU8FromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_compressedTexImage3D_98fb6fb75950b2c8 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_b52a0a4126bfd92d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexImage3D_c7c07c0d19313ce1 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage3D_cbbcc108f5ee0b6c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_e161f619666e4fdd = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexImage3D_eceb9fc1575d20c1 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage3D_f7eae3138ba168c5 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_391d1b27ca7667f0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_417d2e44ffe49ef2 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_432a9deed413bf36 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_637adb0ebf45f881 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_71877eec950ca069 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_76d12b5631233e19 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_78e987a58c694d36 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_compressedTexSubImage2D_99abf4cfdb7c3fd8 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_ca0f0d573b659969 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_d2af6d3d6c36a793 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_d66dcfcb2422e703 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_d73a2951cfee1ae9 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_e3bec4b73039fa2b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_f6d43cabac3be9f9 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_compressedTexSubImage3D_53bd8b01a27b654e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11), arg12 >>> 0, arg13 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_58506392da46b927 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_739af20af54c23a7 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_81477746675a4017 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_85bfc6690f04f2ef = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_9deba1156e3e5f3d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11));
    };
    imports.wbg.__wbg_compressedTexSubImage3D_a16bf3e89d4cf904 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0, arg12 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_a2034ef517185173 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_b94d857c0f453ecf = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11), arg12 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_c50c038adeb3767d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0, arg12 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_d28d708a719ca048 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
    };
    imports.wbg.__wbg_concat_9de968491c4340cf = function(arg0, arg1) {
        const ret = arg0.concat(arg1);
        return ret;
    };
    imports.wbg.__wbg_concat_d11834e0ce0498a8 = function(arg0, arg1) {
        const ret = arg0.concat(arg1);
        return ret;
    };
    imports.wbg.__wbg_configure_bced8e40e8dbaaa0 = function() { return handleError(function (arg0, arg1) {
        arg0.configure(arg1);
    }, arguments) };
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
    imports.wbg.__wbg_contains_3361c7eda6c95afd = function(arg0, arg1) {
        const ret = arg0.contains(arg1);
        return ret;
    };
    imports.wbg.__wbg_contentEditable_a3edac8632d72fc3 = function(arg0, arg1) {
        const ret = arg1.contentEditable;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_contentType_3478c745868b17db = function(arg0, arg1) {
        const ret = arg1.contentType;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_controls_fcafe31a45b20100 = function(arg0) {
        const ret = arg0.controls;
        return ret;
    };
    imports.wbg.__wbg_convertToBlob_0332bff100bd065e = function() { return handleError(function (arg0) {
        const ret = arg0.convertToBlob();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_copyBufferSubData_18e06a82f70e3ebf = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_4ee07a74fa31a5f2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_9469a965478e33b5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_9853c96039ec0c77 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_c497abc88cca30cd = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_d16da8ad67ca9140 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_e04bf985d588c349 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_e70852f4a0d260fa = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferToBuffer_1d3ef5ce856f63a6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_1eac4629483f93a3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_38cb6919320bd451 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_3c7b539593b533b8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_417a1a0dc276b9ac = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_5bdfb89a3d50de2f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_6cdb6ccc2c8eb2b0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_70b4915847f0aaa6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_8267342fac372926 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_8db6b1d1ef2bcea4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_b2f6e06fef51ed20 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_ba7eebae76d1f4d0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToTexture_2953a4816f424a15 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyBufferToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToTexture_89e33471024c94ca = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyBufferToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyExternalImageToTexture_56059f22ac4cac0e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyExternalImageToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyExternalImageToTexture_6e01f85d0415aa70 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyExternalImageToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTexImage2D_38dadb5058dcd06f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexImage2D_c437e967b7fb4c1b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexSubImage2D_05e7e8df6814a705 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexSubImage2D_607ad28606952982 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexSubImage3D_32e92c94044e58ca = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.copyTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
    };
    imports.wbg.__wbg_copyTextureToBuffer_21b9dc9b4d87baf0 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTextureToBuffer_df5ec700534eebe2 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTextureToTexture_0eb51a215ab2cc31 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTextureToTexture_216764b25d01c751 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTo_13dd3bf6a979e7e1 = function(arg0, arg1, arg2) {
        const ret = arg0.copyTo(getArrayU8FromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_copyTo_857225ee0d67c298 = function(arg0, arg1) {
        const ret = arg0.copyTo(arg1);
        return ret;
    };
    imports.wbg.__wbg_copyTo_c4169d350835cf89 = function(arg0, arg1) {
        const ret = arg0.copyTo(arg1);
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
    imports.wbg.__wbg_count_3290348e0b16cb43 = function(arg0) {
        const ret = arg0.count;
        return ret;
    };
    imports.wbg.__wbg_count_c1961ed4a53fbb2d = function(arg0, arg1) {
        console.count(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_createBindGroupLayout_3fb59c14aed4b64e = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createBindGroupLayout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createBindGroup_03f26b8770895116 = function(arg0, arg1) {
        const ret = arg0.createBindGroup(arg1);
        return ret;
    };
    imports.wbg.__wbg_createBuffer_76f7598789ecc3d7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createBuffer(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createBuffer_7a9ec3d654073660 = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createBuffer_9886e84a67b68c89 = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createCommandEncoder_2c5e462c0b582d6a = function(arg0) {
        const ret = arg0.createCommandEncoder();
        return ret;
    };
    imports.wbg.__wbg_createCommandEncoder_f8056019328bd192 = function(arg0, arg1) {
        const ret = arg0.createCommandEncoder(arg1);
        return ret;
    };
    imports.wbg.__wbg_createComputePipelineAsync_66d4d3984b4d2ba9 = function(arg0, arg1) {
        const ret = arg0.createComputePipelineAsync(arg1);
        return ret;
    };
    imports.wbg.__wbg_createComputePipeline_e6192c920efba35b = function(arg0, arg1) {
        const ret = arg0.createComputePipeline(arg1);
        return ret;
    };
    imports.wbg.__wbg_createElementNS_2b279d9b7197eea3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElementNS_914d752e521987da = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElement_872b53eb9a63990d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElement_8c9931a732ee2fea = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createEvent_fec3d2b0ce98814d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.createEvent(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createFramebuffer_7824f69bba778885 = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createFramebuffer_c8d70ebc4858051e = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createImageBitmap_04e04adbb57e2dde = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_19c1b2f03c6144fe = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_1d58b967d375fd34 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_24412f9d744a3da5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_251ceedf1acbe692 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_2add0d92ad910109 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_2e8e31f0b1d4f1ea = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_2fdd9a2c22a9224d = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_3d917aa2cd0ed4a2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_64d40a0c0e02f215 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_67dc8767e81e5cf2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_7b572ef91684942d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_7e3fc81d8536b26a = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_8232ce3b9a8f3a24 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_8972f5a9912bccf9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_8a482f2a8ccd248d = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_9125ff62d024b7b3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_95f2181c3e2edd4d = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_9cb23e1edb93fe82 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_ad0eb4f5c05310b9 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_b8cac7ec86bc2a46 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_c49d61ea957fbea1 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_c62b4d4e6d0e0c79 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_c800564244fe8bc3 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_da6bad27381d6c59 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_e14e03e9254f41ee = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_e32f658ed928fff6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_eb2374c902954993 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createNSResolver_a2121e13f262c1ca = function(arg0, arg1) {
        const ret = arg0.createNSResolver(arg1);
        return ret;
    };
    imports.wbg.__wbg_createPipelineLayout_5039b0679b6b7f36 = function(arg0, arg1) {
        const ret = arg0.createPipelineLayout(arg1);
        return ret;
    };
    imports.wbg.__wbg_createProgram_8ff56c485f3233d0 = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createProgram_da203074cafb1038 = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createQueryEXT_dfa8314082d3680b = function(arg0) {
        const ret = arg0.createQueryEXT();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createQuerySet_ab1eb5a348bc4430 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createQuerySet(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createQuery_5ed5e770ec1009c1 = function(arg0) {
        const ret = arg0.createQuery();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderBundleEncoder_4d9c5d46ef1aafa2 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createRenderBundleEncoder(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createRenderPipelineAsync_e01d1aeda40875cb = function(arg0, arg1) {
        const ret = arg0.createRenderPipelineAsync(arg1);
        return ret;
    };
    imports.wbg.__wbg_createRenderPipeline_db585efa9bab66f3 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createRenderPipeline(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createRenderbuffer_d88aa9403faa38ea = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderbuffer_fd347ae14f262eaa = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createSampler_9b6b918fa5c058fa = function(arg0) {
        const ret = arg0.createSampler();
        return ret;
    };
    imports.wbg.__wbg_createSampler_e421d07197c6e5ec = function(arg0, arg1) {
        const ret = arg0.createSampler(arg1);
        return ret;
    };
    imports.wbg.__wbg_createSampler_f76e29d7522bec9e = function(arg0) {
        const ret = arg0.createSampler();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShaderModule_3facfe98356b79a9 = function(arg0, arg1) {
        const ret = arg0.createShaderModule(arg1);
        return ret;
    };
    imports.wbg.__wbg_createShader_4a256a8cc9c1ce4f = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShader_983150fb1243ee56 = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_49002c91188f6137 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createTexture(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createTexture_9c536c79b635fdef = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_bfaa54c0cd22e367 = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTransformFeedback_3b1242fe957daaa7 = function(arg0) {
        const ret = arg0.createTransformFeedback();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArrayOES_991b44f100f93329 = function(arg0) {
        const ret = arg0.createVertexArrayOES();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArray_e435029ae2660efd = function(arg0) {
        const ret = arg0.createVertexArray();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createView_0ce5c82d78f482df = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createView(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createView_e402894387b301e8 = function() { return handleError(function (arg0) {
        const ret = arg0.createView();
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
    imports.wbg.__wbg_crossOrigin_34ed567317d7ada7 = function(arg0, arg1) {
        const ret = arg1.crossOrigin;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_crossOrigin_da60371b86299c30 = function(arg0, arg1) {
        const ret = arg1.crossOrigin;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = arg0.crypto;
        return ret;
    };
    imports.wbg.__wbg_cullFace_187079e6e20a464d = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_cullFace_fbae6dd4d5e61ba4 = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_currentScript_696dfba63dbe2fbe = function(arg0) {
        const ret = arg0.currentScript;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_currentSrc_cb207c6b2c0d6a6c = function(arg0, arg1) {
        const ret = arg1.currentSrc;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_currentSrc_fb3d59d5149a4477 = function(arg0, arg1) {
        const ret = arg1.currentSrc;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_currentTarget_6f3494de6b6d7897 = function(arg0) {
        const ret = arg0.currentTarget;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_currentTime_7940fe39798a1ca0 = function(arg0) {
        const ret = arg0.currentTime;
        return ret;
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
    imports.wbg.__wbg_decode_3ad9767b863c0d8e = function(arg0) {
        const ret = arg0.decode();
        return ret;
    };
    imports.wbg.__wbg_decoding_94d05d0c36fd1434 = function(arg0, arg1) {
        const ret = arg1.decoding;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_defaultMuted_39712c6328c88eea = function(arg0) {
        const ret = arg0.defaultMuted;
        return ret;
    };
    imports.wbg.__wbg_defaultPlaybackRate_5d5a212be6531ff7 = function(arg0) {
        const ret = arg0.defaultPlaybackRate;
        return ret;
    };
    imports.wbg.__wbg_defaultPrevented_2fc2f28cc3ab3140 = function(arg0) {
        const ret = arg0.defaultPrevented;
        return ret;
    };
    imports.wbg.__wbg_defaultView_51f191496dcfd54e = function(arg0) {
        const ret = arg0.defaultView;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
    imports.wbg.__wbg_deleteBuffer_7ed96e1bf7c02e87 = function(arg0, arg1) {
        arg0.deleteBuffer(arg1);
    };
    imports.wbg.__wbg_deleteBuffer_a7822433fc95dfb8 = function(arg0, arg1) {
        arg0.deleteBuffer(arg1);
    };
    imports.wbg.__wbg_deleteFramebuffer_66853fb7101488cb = function(arg0, arg1) {
        arg0.deleteFramebuffer(arg1);
    };
    imports.wbg.__wbg_deleteFramebuffer_cd3285ee5a702a7a = function(arg0, arg1) {
        arg0.deleteFramebuffer(arg1);
    };
    imports.wbg.__wbg_deleteProgram_3fa626bbc0001eb7 = function(arg0, arg1) {
        arg0.deleteProgram(arg1);
    };
    imports.wbg.__wbg_deleteProgram_71a133c6d053e272 = function(arg0, arg1) {
        arg0.deleteProgram(arg1);
    };
    imports.wbg.__wbg_deleteProperty_96363d4a1d977c97 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.deleteProperty(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_deleteQueryEXT_8f083d67d9fb9914 = function(arg0, arg1) {
        arg0.deleteQueryEXT(arg1);
    };
    imports.wbg.__wbg_deleteQuery_6a2b7cd30074b20b = function(arg0, arg1) {
        arg0.deleteQuery(arg1);
    };
    imports.wbg.__wbg_deleteRenderbuffer_59f4369653485031 = function(arg0, arg1) {
        arg0.deleteRenderbuffer(arg1);
    };
    imports.wbg.__wbg_deleteRenderbuffer_8808192853211567 = function(arg0, arg1) {
        arg0.deleteRenderbuffer(arg1);
    };
    imports.wbg.__wbg_deleteSampler_7f02bb003ba547f0 = function(arg0, arg1) {
        arg0.deleteSampler(arg1);
    };
    imports.wbg.__wbg_deleteShader_8d42f169deda58ac = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteShader_c65a44796c5004d8 = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteSync_5a3fbe5d6b742398 = function(arg0, arg1) {
        arg0.deleteSync(arg1);
    };
    imports.wbg.__wbg_deleteTexture_a30f5ca0163c4110 = function(arg0, arg1) {
        arg0.deleteTexture(arg1);
    };
    imports.wbg.__wbg_deleteTexture_bb82c9fec34372ba = function(arg0, arg1) {
        arg0.deleteTexture(arg1);
    };
    imports.wbg.__wbg_deleteTransformFeedback_2ed79dd8bd333c11 = function(arg0, arg1) {
        arg0.deleteTransformFeedback(arg1);
    };
    imports.wbg.__wbg_deleteVertexArrayOES_1ee7a06a4b23ec8c = function(arg0, arg1) {
        arg0.deleteVertexArrayOES(arg1);
    };
    imports.wbg.__wbg_deleteVertexArray_77fe73664a3332ae = function(arg0, arg1) {
        arg0.deleteVertexArray(arg1);
    };
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
    imports.wbg.__wbg_depthFunc_2906916f4536d5d7 = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthFunc_f34449ae87cc4e3e = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthMask_5fe84e2801488eda = function(arg0, arg1) {
        arg0.depthMask(arg1 !== 0);
    };
    imports.wbg.__wbg_depthMask_76688a8638b2f321 = function(arg0, arg1) {
        arg0.depthMask(arg1 !== 0);
    };
    imports.wbg.__wbg_depthOrArrayLayers_f1be613bc4a818db = function(arg0) {
        const ret = arg0.depthOrArrayLayers;
        return ret;
    };
    imports.wbg.__wbg_depthRange_3cd6b4dc961d9116 = function(arg0, arg1, arg2) {
        arg0.depthRange(arg1, arg2);
    };
    imports.wbg.__wbg_depthRange_f9c084ff3d81fd7b = function(arg0, arg1, arg2) {
        arg0.depthRange(arg1, arg2);
    };
    imports.wbg.__wbg_description_485ca74be5d6ce88 = function(arg0, arg1) {
        const ret = arg1.description;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_destroy_09eeb3369fbf129e = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_destroy_651a690183451256 = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_destroy_9ef007ceda9a0b56 = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_destroy_d85f895015778091 = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_detachShader_ab39d8a19811cfa6 = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_detachShader_cd3ab294e635ff90 = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_deviceMemory_57e5763d7efe19bc = function(arg0) {
        const ret = arg0.deviceMemory;
        return ret;
    };
    imports.wbg.__wbg_deviceMemory_75e100d19762419b = function(arg0) {
        const ret = arg0.deviceMemory;
        return ret;
    };
    imports.wbg.__wbg_devicePixelRatio_68c391265f05d093 = function(arg0) {
        const ret = arg0.devicePixelRatio;
        return ret;
    };
    imports.wbg.__wbg_device_c30c00142deaa03f = function(arg0, arg1) {
        const ret = arg1.device;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_dimension_9b94c7a4e783eb4c = function(arg0) {
        const ret = arg0.dimension;
        return (__wbindgen_enum_GpuTextureDimension.indexOf(ret) + 1 || 4) - 1;
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
    imports.wbg.__wbg_dir_e1770afcf8b4038a = function(arg0, arg1) {
        const ret = arg1.dir;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_dir_f29e2a40edf6f2be = function(arg0, arg1) {
        const ret = arg1.dir;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_disableVertexAttribArray_452cc9815fced7e4 = function(arg0, arg1) {
        arg0.disableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_disableVertexAttribArray_afd097fb465dc100 = function(arg0, arg1) {
        arg0.disableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_disable_2702df5b5da5dd21 = function(arg0, arg1) {
        arg0.disable(arg1 >>> 0);
    };
    imports.wbg.__wbg_disable_8b53998501a7a85b = function(arg0, arg1) {
        arg0.disable(arg1 >>> 0);
    };
    imports.wbg.__wbg_dispatchEvent_9e259d7c1d603dfb = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.dispatchEvent(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_dispatchWorkgroupsIndirect_6594fbc416b287d6 = function(arg0, arg1, arg2) {
        arg0.dispatchWorkgroupsIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_dispatchWorkgroupsIndirect_7c3c560f9c3f505d = function(arg0, arg1, arg2) {
        arg0.dispatchWorkgroupsIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_dispatchWorkgroups_111fb72182307b99 = function(arg0, arg1) {
        arg0.dispatchWorkgroups(arg1 >>> 0);
    };
    imports.wbg.__wbg_dispatchWorkgroups_4e59e078119b5bab = function(arg0, arg1, arg2, arg3) {
        arg0.dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_dispatchWorkgroups_dcc542fd08dc53c2 = function(arg0, arg1, arg2) {
        arg0.dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_displayHeight_a6ff7964b6182d84 = function(arg0) {
        const ret = arg0.displayHeight;
        return ret;
    };
    imports.wbg.__wbg_displayWidth_d82e7b620f6f4189 = function(arg0) {
        const ret = arg0.displayWidth;
        return ret;
    };
    imports.wbg.__wbg_doNotTrack_c2a6e66ff1f26d03 = function(arg0, arg1) {
        const ret = arg1.doNotTrack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_documentElement_197a88c262a0aa27 = function(arg0) {
        const ret = arg0.documentElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_documentURI_2dec44d7f3cc6f7b = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.documentURI;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_document_d249400bd7bd996d = function(arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_done_769e5ede4b31c67b = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_draggable_137aeb47c776ce0a = function(arg0) {
        const ret = arg0.draggable;
        return ret;
    };
    imports.wbg.__wbg_drawArraysInstancedANGLE_342ee6b5236d9702 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_drawArraysInstanced_622ea9f149b0b80c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawArraysInstanced(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_drawArrays_6acaa2669c105f3a = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawArrays_6d29ea2ebc0c72a2 = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawBuffersWEBGL_9fdbdf3d4cbd3aae = function(arg0, arg1) {
        arg0.drawBuffersWEBGL(arg1);
    };
    imports.wbg.__wbg_drawBuffers_e729b75c5a50d760 = function(arg0, arg1) {
        arg0.drawBuffers(arg1);
    };
    imports.wbg.__wbg_drawElementsInstancedANGLE_096b48ab8686c5cf = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstancedANGLE_55529bc6e1fae42f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstanced_14cf6ff364a14fa5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstanced_f874e87d0b4e95e9 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElements_16199ef1cc58b16a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_4702f8877eeeb220 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_65cb4b099bd7d4ac = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_95b738b0b964ac39 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawIndexedIndirect_2b79c83f6fda758e = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndexedIndirect_79ff4d1956bbfc29 = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexedIndirect_9a9e26725ae5fb94 = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexedIndirect_d9ceb7d8401e99f6 = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndexed_2bd0094d9b11f36d = function(arg0, arg1, arg2) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_450a8a275162d436 = function(arg0, arg1, arg2, arg3) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_712470b21b70d691 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawIndexed_94f89aa7e523b9e4 = function(arg0, arg1) {
        arg0.drawIndexed(arg1 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_b04590e3eef432c4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_b890e7adc0b06cfe = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawIndexed_c3d100781aa86744 = function(arg0, arg1, arg2) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_cd3fe908d7411605 = function(arg0, arg1) {
        arg0.drawIndexed(arg1 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_d1202dc1fe88d5f5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_f05fd81cd102410b = function(arg0, arg1, arg2, arg3) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_drawIndirect_3fe067ed364e50a7 = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndirect_4341c3872834f19f = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndirect_4967558afdbece32 = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndirect_516037c3877390d3 = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawRangeElements_0daaa8a259532525 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.drawRangeElements(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0, arg6);
    };
    imports.wbg.__wbg_drawRangeElements_ae081cc86dacf242 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.drawRangeElements(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0, arg6);
    };
    imports.wbg.__wbg_draw_524f085fcf22cf38 = function(arg0, arg1) {
        arg0.draw(arg1 >>> 0);
    };
    imports.wbg.__wbg_draw_83a7cec03da825bd = function(arg0, arg1, arg2) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_draw_9172085531e4873f = function(arg0, arg1, arg2) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_draw_c263475381bfc116 = function(arg0, arg1, arg2, arg3) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_draw_d3b53fbcc9853635 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_draw_e53700ce1a499dd1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_draw_eb072532cdc96dd9 = function(arg0, arg1, arg2, arg3) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_draw_eeade0cf1a9899da = function(arg0, arg1) {
        arg0.draw(arg1 >>> 0);
    };
    imports.wbg.__wbg_drawingBufferHeight_1d398e1fc5bb18e9 = function(arg0) {
        const ret = arg0.drawingBufferHeight;
        return ret;
    };
    imports.wbg.__wbg_drawingBufferHeight_5c6adac1ebfdd6ff = function(arg0) {
        const ret = arg0.drawingBufferHeight;
        return ret;
    };
    imports.wbg.__wbg_drawingBufferWidth_78f7e4a8892a90fe = function(arg0) {
        const ret = arg0.drawingBufferWidth;
        return ret;
    };
    imports.wbg.__wbg_drawingBufferWidth_e221d6f42f657d59 = function(arg0) {
        const ret = arg0.drawingBufferWidth;
        return ret;
    };
    imports.wbg.__wbg_duration_4d32c501d87796c1 = function(arg0) {
        const ret = arg0.duration;
        return ret;
    };
    imports.wbg.__wbg_duration_b9240785d56495c8 = function(arg0, arg1) {
        const ret = arg1.duration;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_duration_c4974bbe5a2ca54c = function(arg0) {
        const ret = arg0.duration;
        return ret;
    };
    imports.wbg.__wbg_elementFromPoint_be6286b8ec1ae1a2 = function(arg0, arg1, arg2) {
        const ret = arg0.elementFromPoint(arg1, arg2);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_elementsFromPoint_ea458c8aefadc8db = function(arg0, arg1, arg2) {
        const ret = arg0.elementsFromPoint(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_enableStyleSheetsForSet_686186f82465751c = function(arg0, arg1, arg2) {
        arg0.enableStyleSheetsForSet(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_enableVertexAttribArray_607be07574298e5e = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enableVertexAttribArray_93c3d406a41ad6c7 = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_51114837e05ee280 = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_d183fef39258803f = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_encodeURIComponent_6f2a4577aed2d0dd = function(arg0, arg1) {
        const ret = encodeURIComponent(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_encodeURI_3a90bb7e82d978f0 = function(arg0, arg1) {
        const ret = encodeURI(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_endOcclusionQuery_f5a864a5fda41348 = function(arg0) {
        arg0.endOcclusionQuery();
    };
    imports.wbg.__wbg_endQueryEXT_565924c3de3c71ee = function(arg0, arg1) {
        arg0.endQueryEXT(arg1 >>> 0);
    };
    imports.wbg.__wbg_endQuery_17aac36532ca7d47 = function(arg0, arg1) {
        arg0.endQuery(arg1 >>> 0);
    };
    imports.wbg.__wbg_endTransformFeedback_ba5a330e1f1e2880 = function(arg0) {
        arg0.endTransformFeedback();
    };
    imports.wbg.__wbg_end_b9d7079f54620f76 = function(arg0) {
        arg0.end();
    };
    imports.wbg.__wbg_end_ece2bf3a25678f12 = function(arg0) {
        arg0.end();
    };
    imports.wbg.__wbg_ended_b873fb75d0c13ca7 = function(arg0) {
        const ret = arg0.ended;
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
    imports.wbg.__wbg_entries_7d3f2dc1aac96f8e = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_8d07132a80246145 = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_c8a90a7ed73e84ce = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_f99801412ca1697b = function(arg0) {
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
    imports.wbg.__wbg_error_d2e248d3e80a06c7 = function(arg0) {
        const ret = arg0.error;
        return ret;
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
                    return __wbg_adapter_7267(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_executeBundles_3547044d126e821b = function(arg0, arg1) {
        arg0.executeBundles(arg1);
    };
    imports.wbg.__wbg_exitFullscreen_909f35c20d9db949 = function(arg0) {
        arg0.exitFullscreen();
    };
    imports.wbg.__wbg_exitPointerLock_7b6e7252c7133f69 = function(arg0) {
        arg0.exitPointerLock();
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
    imports.wbg.__wbg_fastSeek_e6b165b1fe7cd9da = function() { return handleError(function (arg0, arg1) {
        arg0.fastSeek(arg1);
    }, arguments) };
    imports.wbg.__wbg_features_1e615dfe5ee66265 = function(arg0) {
        const ret = arg0.features;
        return ret;
    };
    imports.wbg.__wbg_features_23875e4e632c481d = function(arg0) {
        const ret = arg0.features;
        return ret;
    };
    imports.wbg.__wbg_fenceSync_02d142d21e315da6 = function(arg0, arg1, arg2) {
        const ret = arg0.fenceSync(arg1 >>> 0, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
                    return __wbg_adapter_7267(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_7267(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_7267(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_7267(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_7267(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_finish_17a0b297901010d5 = function(arg0) {
        const ret = arg0.finish();
        return ret;
    };
    imports.wbg.__wbg_finish_2f4c76e7da4475a6 = function(arg0) {
        const ret = arg0.finish();
        return ret;
    };
    imports.wbg.__wbg_finish_3789a1295227aba1 = function(arg0, arg1) {
        const ret = arg0.finish(arg1);
        return ret;
    };
    imports.wbg.__wbg_finish_5632056bf2db7dd2 = function(arg0) {
        arg0.finish();
    };
    imports.wbg.__wbg_finish_ab9e01a922269f3a = function(arg0, arg1) {
        const ret = arg0.finish(arg1);
        return ret;
    };
    imports.wbg.__wbg_finish_cde47a517e5169f6 = function(arg0) {
        arg0.finish();
    };
    imports.wbg.__wbg_firstChild_b0603462b5172539 = function(arg0) {
        const ret = arg0.firstChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_firstElementChild_49a3e627013e2be0 = function(arg0) {
        const ret = arg0.firstElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_firstElementChild_d75d385f5abd1414 = function(arg0) {
        const ret = arg0.firstElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
                    return __wbg_adapter_7284(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_flush_4150080f65c49208 = function(arg0) {
        arg0.flush();
    };
    imports.wbg.__wbg_flush_987c35de09e06fd6 = function(arg0) {
        arg0.flush();
    };
    imports.wbg.__wbg_focus_7d08b55eba7b368d = function() { return handleError(function (arg0) {
        arg0.focus();
    }, arguments) };
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
                    return __wbg_adapter_8672(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_0a00eff2cd485d03 = function() { return handleError(function (arg0, arg1) {
        arg0.forEach(arg1);
    }, arguments) };
    imports.wbg.__wbg_forEach_31c11340305aba0a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_8709(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8783(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8562(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8820(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8034(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8746(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_8c9409ff5fea785e = function() { return handleError(function (arg0, arg1) {
        arg0.forEach(arg1);
    }, arguments) };
    imports.wbg.__wbg_forEach_93eba4c3bd5ee6b3 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_8488(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8562(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8451(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_8525(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_cff56638e11ab7d2 = function() { return handleError(function (arg0, arg1) {
        arg0.forEach(arg1);
    }, arguments) };
    imports.wbg.__wbg_forEach_d6a05ca96422eff9 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_7287(a, state0.b, arg0, arg1, arg2);
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
                    return __wbg_adapter_7593(a, state0.b, arg0, arg1);
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
                    return __wbg_adapter_8635(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_format_8ffc44d83ebf2edc = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_format_d5288b7100197a55 = function(arg0) {
        const ret = arg0.format;
        return ret;
    };
    imports.wbg.__wbg_frameElement_0a9643c570cd7091 = function() { return handleError(function (arg0) {
        const ret = arg0.frameElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_framebufferRenderbuffer_2fdd12e89ad81eb9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferRenderbuffer_8b88592753b54715 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferTexture2D_81a565732bd5d8fe = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTexture2D_ed855d0b097c557a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTextureLayer_5e6bd1b0cb45d815 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTextureLayer(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTextureMultiviewOVR_e54f936c3cc382cb = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.framebufferTextureMultiviewOVR(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5, arg6);
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
    imports.wbg.__wbg_frontFace_289c9d7a8569c4f2 = function(arg0, arg1) {
        arg0.frontFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_frontFace_4d4936cfaeb8b7df = function(arg0, arg1) {
        arg0.frontFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_fround_34bd493063a4f320 = function(arg0) {
        const ret = Math.fround(arg0);
        return ret;
    };
    imports.wbg.__wbg_fullscreenElement_a2f691b04c3b3de5 = function(arg0) {
        const ret = arg0.fullscreenElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_fullscreenEnabled_b5c0e93adacf5153 = function(arg0) {
        const ret = arg0.fullscreenEnabled;
        return ret;
    };
    imports.wbg.__wbg_fullscreen_cb41a7e3004c0f90 = function(arg0) {
        const ret = arg0.fullscreen;
        return ret;
    };
    imports.wbg.__wbg_generateMipmap_13d3d6406de35b14 = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_generateMipmap_e3b21a330b500089 = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_getActiveAttrib_62d0edceacb9259f = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveAttrib(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveAttrib_ef9231684274e84a = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveAttrib(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniformBlockName_9fd24de17dc4e834 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.getActiveUniformBlockName(arg2, arg3 >>> 0);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getActiveUniformBlockParameter_38aa2142edc7682b = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getActiveUniformBlockParameter(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getActiveUniform_3c49cb0b185d71e0 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniform_999b2093d93c3d0e = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniforms_e91e9562e40b5bac = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getActiveUniforms(arg1, arg2, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getAnimations_350947326aff9a82 = function(arg0) {
        const ret = arg0.getAnimations();
        return ret;
    };
    imports.wbg.__wbg_getAnimations_e13ae74c9dde4c3c = function(arg0) {
        const ret = arg0.getAnimations();
        return ret;
    };
    imports.wbg.__wbg_getArg_88520473b1a220a7 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getArg(arg1, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getAttachedShaders_9d8548a89389cbd8 = function(arg0, arg1) {
        const ret = arg0.getAttachedShaders(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getAttachedShaders_bda43f09f47e87df = function(arg0, arg1) {
        const ret = arg0.getAttachedShaders(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getAttribLocation_959c0150cdd39cac = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getAttribLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getAttribLocation_9db82d01924fa43d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getAttribLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getAttributeNS_727c4fd24258543e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg1.getAttributeNS(arg2 === 0 ? undefined : getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getAttributeNames_d2dd7cba5c74e6de = function(arg0) {
        const ret = arg0.getAttributeNames();
        return ret;
    };
    imports.wbg.__wbg_getAttribute_ea5166be2deba45e = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.getAttribute(getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getBindGroupLayout_70511f5f4d93467f = function(arg0, arg1) {
        const ret = arg0.getBindGroupLayout(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBindGroupLayout_b566bc85812225d6 = function(arg0, arg1) {
        const ret = arg0.getBindGroupLayout(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBoxQuads_71effcdf4c17686c = function() { return handleError(function (arg0) {
        const ret = arg0.getBoxQuads();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getBoxQuads_8e9d08f9b905f5ab = function() { return handleError(function (arg0) {
        const ret = arg0.getBoxQuads();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getBufferParameter_165a39f523d9c0aa = function(arg0, arg1, arg2) {
        const ret = arg0.getBufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBufferParameter_8e291d1333d42459 = function(arg0, arg1, arg2) {
        const ret = arg0.getBufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBufferSubData_1120db2612218b11 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_1506606479a927ee = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_1c30773c147c9f16 = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_26e307156264a5a8 = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_396afa9796ed8558 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_4a214a2779c30237 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_565654d335100aa0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_667e59d380deb8a1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_getBufferSubData_79ecc052b94027e1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_getBufferSubData_88e506e36507d7a3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_8ab2dcc5fcf5770f = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_8b52709eb5ca0064 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_91c64c1659f66e6e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_95de5c8b13ca8e9e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_b6a7ab36d88cf2ae = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_d6aa6f985b6bcc6e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_e645617af9fdf4f4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_ed92dd1244014a67 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getCanonicalLocales_c5d7306b2c223c65 = function(arg0) {
        const ret = Intl.getCanonicalLocales(arg0);
        return ret;
    };
    imports.wbg.__wbg_getCompilationInfo_9c4ab914a917aeee = function(arg0) {
        const ret = arg0.getCompilationInfo();
        return ret;
    };
    imports.wbg.__wbg_getConfiguration_1cced1b00926d9bc = function(arg0) {
        const ret = arg0.getConfiguration();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getContext_3ae09aaa73194801 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_e9cf379449413580 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_f65a0debd1e8f8e8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_fc19859df6331073 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getCurrentTexture_d64323b76f42d5e0 = function() { return handleError(function (arg0) {
        const ret = arg0.getCurrentTexture();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getDate_ef336e14594b35ce = function(arg0) {
        const ret = arg0.getDate();
        return ret;
    };
    imports.wbg.__wbg_getDay_3da98b461c969439 = function(arg0) {
        const ret = arg0.getDay();
        return ret;
    };
    imports.wbg.__wbg_getElementById_f827f0d6648718a8 = function(arg0, arg1, arg2) {
        const ret = arg0.getElementById(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getElementsByName_cbf7f3da00769cda = function(arg0, arg1, arg2) {
        const ret = arg0.getElementsByName(getStringFromWasm0(arg1, arg2));
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
    imports.wbg.__wbg_getError_578ee28e31637d2f = function(arg0) {
        const ret = arg0.getError();
        return ret;
    };
    imports.wbg.__wbg_getError_d749701e28a45150 = function(arg0) {
        const ret = arg0.getError();
        return ret;
    };
    imports.wbg.__wbg_getExtension_e6c97409b224b5dc = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getExtension_ff0fb1398bcf28c3 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
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
    imports.wbg.__wbg_getFragDataLocation_028d8ec3a32bfdd2 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getFragDataLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getFramebufferAttachmentParameter_7fa7a91dc28edb07 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getFramebufferAttachmentParameter(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getFramebufferAttachmentParameter_d70bc5190e43cc8b = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getFramebufferAttachmentParameter(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_getIndexedParameter_f9211edc36533919 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getIndexedParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_getInternalformatParameter_2beb7b4ad9c991d6 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getInternalformatParameter(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_042b4d7137b6cf14 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_1229810ff58e27ce = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_2d0daee037709cf8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_31739fa53190a070 = function() { return handleError(function (arg0) {
        const ret = arg0.getMappedRange();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_957e0aa208e7ce4f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_bbebf1b88253df9e = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getMappedRange(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_c744f55caae79ecd = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getMappedRange(arg1 >>> 0);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_getParameter_1f0887a2b88e6d19 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getParameter_e3429f024018310f = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getPreferredCanvasFormat_9aef34efead2aa08 = function(arg0) {
        const ret = arg0.getPreferredCanvasFormat();
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getProgramInfoLog_631c180b1b21c8ed = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramInfoLog_a998105a680059db = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramParameter_0c411f0cd4185c5b = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getProgramParameter_360f95ff07ac068d = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
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
    imports.wbg.__wbg_getQueryEXT_0b01d852fc3206f3 = function(arg0, arg1, arg2) {
        const ret = arg0.getQueryEXT(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getQueryObjectEXT_2fcc1c0c67288330 = function(arg0, arg1, arg2) {
        const ret = arg0.getQueryObjectEXT(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getQueryParameter_8921497e1d1561c1 = function(arg0, arg1, arg2) {
        const ret = arg0.getQueryParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getQuery_a50e38eb31d1dec4 = function(arg0, arg1, arg2) {
        const ret = arg0.getQuery(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_getRenderbufferParameter_7bb041c14aeb0b7a = function(arg0, arg1, arg2) {
        const ret = arg0.getRenderbufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getRenderbufferParameter_e3c067390b35fda2 = function(arg0, arg1, arg2) {
        const ret = arg0.getRenderbufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getRootNode_f59bcfa355239af5 = function(arg0) {
        const ret = arg0.getRootNode();
        return ret;
    };
    imports.wbg.__wbg_getSamplerParameter_2ff9aa3f75cb2b78 = function(arg0, arg1, arg2) {
        const ret = arg0.getSamplerParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getSeconds_755197b634cca692 = function(arg0) {
        const ret = arg0.getSeconds();
        return ret;
    };
    imports.wbg.__wbg_getShaderInfoLog_7e7b38fb910ec534 = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderInfoLog_f59c3112acc6e039 = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderParameter_511b5f929074fa31 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getShaderParameter_6dbe0b8558dc41fd = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getShaderPrecisionFormat_a2c4687f933a40d4 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderPrecisionFormat(arg1 >>> 0, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getShaderPrecisionFormat_b6abc579b8088ab7 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderPrecisionFormat(arg1 >>> 0, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getShaderSource_153624e17e2cdbdc = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderSource(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderSource_68be1dda255c1577 = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderSource(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getSupportedExtensions_3938cc3251d21f05 = function(arg0) {
        const ret = arg0.getSupportedExtensions();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getSupportedExtensions_8c007dbb54905635 = function(arg0) {
        const ret = arg0.getSupportedExtensions();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getSupportedProfiles_10d2a4d32a128384 = function(arg0) {
        const ret = arg0.getSupportedProfiles();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getSyncParameter_7cb8461f5891606c = function(arg0, arg1, arg2) {
        const ret = arg0.getSyncParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getTexParameter_8ec72517c626fce3 = function(arg0, arg1, arg2) {
        const ret = arg0.getTexParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getTexParameter_e50bcec9146fb1fa = function(arg0, arg1, arg2) {
        const ret = arg0.getTexParameter(arg1 >>> 0, arg2 >>> 0);
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
    imports.wbg.__wbg_getTransformFeedbackVarying_3093352952fb4adb = function(arg0, arg1, arg2) {
        const ret = arg0.getTransformFeedbackVarying(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getTranslatedShaderSource_7ca25773d6b0b597 = function(arg0, arg1, arg2) {
        const ret = arg1.getTranslatedShaderSource(arg2);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_getUniformBlockIndex_288fdc31528171ca = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformBlockIndex(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getUniformIndices_73be7e3b48116b87 = function(arg0, arg1, arg2) {
        const ret = arg0.getUniformIndices(arg1, arg2);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_657a2b6d102bd126 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_838363001c74dc21 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniform_4436ea225fc083a0 = function(arg0, arg1, arg2) {
        const ret = arg0.getUniform(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_getUniform_67e77d458ec97b30 = function(arg0, arg1, arg2) {
        const ret = arg0.getUniform(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_getVRDisplays_ab888328ff55e6e2 = function() { return handleError(function (arg0) {
        const ret = arg0.getVRDisplays();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getVertexAttribOffset_285c368953618992 = function(arg0, arg1, arg2) {
        const ret = arg0.getVertexAttribOffset(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getVertexAttribOffset_b03f4350591ecffe = function(arg0, arg1, arg2) {
        const ret = arg0.getVertexAttribOffset(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getVertexAttrib_5fdf2116b18f3cc6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getVertexAttrib(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getVertexAttrib_851ef77853a467d2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getVertexAttrib(arg1 >>> 0, arg2 >>> 0);
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
    imports.wbg.__wbg_get_e27dfaeb6f46bd45 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_geta_73cb742e4465e32e = function(arg0) {
        const ret = arg0.a;
        return ret;
    };
    imports.wbg.__wbg_getaccess_b455a8ec241ca44f = function(arg0) {
        const ret = arg0.access;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuStorageTextureAccess.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getaddressmodeu_0bba765ac8c99fdf = function(arg0) {
        const ret = arg0.addressModeU;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuAddressMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getaddressmodev_ff833c13d986fd6e = function(arg0) {
        const ret = arg0.addressModeV;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuAddressMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getaddressmodew_99b6085842b13609 = function(arg0) {
        const ret = arg0.addressModeW;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuAddressMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getalpha_0ba7e6f9657990c0 = function(arg0) {
        const ret = arg0.alpha;
        return ret;
    };
    imports.wbg.__wbg_getalphamode_c2bba29a7b785eda = function(arg0) {
        const ret = arg0.alphaMode;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuCanvasAlphaMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getalphatocoverageenabled_bbe506f9a80c53eb = function(arg0) {
        const ret = arg0.alphaToCoverageEnabled;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getarraylayercount_a726e6c470354ec8 = function(arg0) {
        const ret = arg0.arrayLayerCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getarraystride_09ba379512ef7e89 = function(arg0) {
        const ret = arg0.arrayStride;
        return ret;
    };
    imports.wbg.__wbg_getaspect_5917206a11bfe20d = function(arg0) {
        const ret = arg0.aspect;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureAspect.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getaspect_6cacc8a82bc0f144 = function(arg0) {
        const ret = arg0.aspect;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureAspect.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getaspect_b6174eaf82c9e09e = function(arg0) {
        const ret = arg0.aspect;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureAspect.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getattributes_67ca0b47e81808fa = function(arg0) {
        const ret = arg0.attributes;
        return ret;
    };
    imports.wbg.__wbg_getb_c8b1729a605e3232 = function(arg0) {
        const ret = arg0.b;
        return ret;
    };
    imports.wbg.__wbg_getbasearraylayer_3a0e945bfde10a71 = function(arg0) {
        const ret = arg0.baseArrayLayer;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getbasemiplevel_fb888ef2d6f821f2 = function(arg0) {
        const ret = arg0.baseMipLevel;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getbeginningofpasswriteindex_a3e8c635aa39f868 = function(arg0) {
        const ret = arg0.beginningOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getbeginningofpasswriteindex_fcce5c06f2ea00d6 = function(arg0) {
        const ret = arg0.beginningOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getbindgrouplayouts_265876c24455bc53 = function(arg0) {
        const ret = arg0.bindGroupLayouts;
        return ret;
    };
    imports.wbg.__wbg_getbinding_25502b5d36197fc7 = function(arg0) {
        const ret = arg0.binding;
        return ret;
    };
    imports.wbg.__wbg_getbinding_bc9d48ad24cdd1a3 = function(arg0) {
        const ret = arg0.binding;
        return ret;
    };
    imports.wbg.__wbg_getblend_7db4904bf1157016 = function(arg0) {
        const ret = arg0.blend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getbubbles_1e772f1e323cf730 = function(arg0) {
        const ret = arg0.bubbles;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getbuffer_084f38976e3f267b = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_getbuffer_b5e3372df2eba846 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_getbuffer_c22f0182563e6975 = function(arg0) {
        const ret = arg0.buffer;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getbuffers_5da6f40a0fa71d9e = function(arg0) {
        const ret = arg0.buffers;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getbytesperrow_225104203e354913 = function(arg0) {
        const ret = arg0.bytesPerRow;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getbytesperrow_3437a03a6582c501 = function(arg0) {
        const ret = arg0.bytesPerRow;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getcancelable_ef4fc4d730880898 = function(arg0) {
        const ret = arg0.cancelable;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getclearvalue_ea4a50627b3dd819 = function(arg0) {
        const ret = arg0.clearValue;
        return ret;
    };
    imports.wbg.__wbg_getcode_98f71bab7f08bc3c = function(arg0, arg1) {
        const ret = arg1.code;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getcolor_0e12ec4ddf020677 = function(arg0) {
        const ret = arg0.color;
        return ret;
    };
    imports.wbg.__wbg_getcolorattachments_86b49e8c40471f09 = function(arg0) {
        const ret = arg0.colorAttachments;
        return ret;
    };
    imports.wbg.__wbg_getcolorformats_fb8ac7ad6f0552c8 = function(arg0) {
        const ret = arg0.colorFormats;
        return ret;
    };
    imports.wbg.__wbg_getcompare_a2ce67eda6ac02f4 = function(arg0) {
        const ret = arg0.compare;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuCompareFunction.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_getcompare_d205a50c491bac1a = function(arg0) {
        const ret = arg0.compare;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuCompareFunction.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_getcompilationhints_51dbd0c1cb210d9c = function(arg0) {
        const ret = arg0.compilationHints;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getcomposed_4b92c55bf92ce718 = function(arg0) {
        const ret = arg0.composed;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getcompute_e75350d4c6cf549b = function(arg0) {
        const ret = arg0.compute;
        return ret;
    };
    imports.wbg.__wbg_getconstants_9fccc5be65a872b5 = function(arg0) {
        const ret = arg0.constants;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getconstants_eaba32e9380c08a6 = function(arg0) {
        const ret = arg0.constants;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getconstants_fcda6c20c122412b = function(arg0) {
        const ret = arg0.constants;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getcount_9968571b28052b78 = function(arg0) {
        const ret = arg0.count;
        return ret;
    };
    imports.wbg.__wbg_getcount_e1bd0658bf388ac9 = function(arg0) {
        const ret = arg0.count;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getcullmode_dd51180e36bcb1ac = function(arg0) {
        const ret = arg0.cullMode;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuCullMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getdefaultqueue_2cc00cd20207e4d5 = function(arg0) {
        const ret = arg0.defaultQueue;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getdepthbias_125c01d592956ac5 = function(arg0) {
        const ret = arg0.depthBias;
        return isLikeNone(ret) ? 0x100000001 : (ret) >> 0;
    };
    imports.wbg.__wbg_getdepthbiasclamp_00f4358efd403e97 = function(arg0) {
        const ret = arg0.depthBiasClamp;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_getdepthbiasslopescale_2e86a4d3721144a4 = function(arg0) {
        const ret = arg0.depthBiasSlopeScale;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_getdepthclearvalue_ea4405850f7125c3 = function(arg0) {
        const ret = arg0.depthClearValue;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_getdepthcompare_e463bff16c6f12f1 = function(arg0) {
        const ret = arg0.depthCompare;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuCompareFunction.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_getdepthfailop_61ab241bd6b0af33 = function(arg0) {
        const ret = arg0.depthFailOp;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuStencilOperation.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_getdepthloadop_2bbe17b6959470e6 = function(arg0) {
        const ret = arg0.depthLoadOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuLoadOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getdepthorarraylayers_f5039ac3f4e08d5e = function(arg0) {
        const ret = arg0.depthOrArrayLayers;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getdepthreadonly_ad7f6bb9c51c65a4 = function(arg0) {
        const ret = arg0.depthReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getdepthreadonly_fb42365a88d43ffb = function(arg0) {
        const ret = arg0.depthReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getdepthslice_46fcfa81e9377f5a = function(arg0) {
        const ret = arg0.depthSlice;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getdepthstencil_1572782572b359cf = function(arg0) {
        const ret = arg0.depthStencil;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getdepthstencilattachment_bebe72eaaf3d4d85 = function(arg0) {
        const ret = arg0.depthStencilAttachment;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getdepthstencilformat_8f59c3ca9eefa621 = function(arg0) {
        const ret = arg0.depthStencilFormat;
        return isLikeNone(ret) ? 96 : ((__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1);
    };
    imports.wbg.__wbg_getdepthstoreop_ac6294d547d523e9 = function(arg0) {
        const ret = arg0.depthStoreOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuStoreOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getdepthwriteenabled_369d97003904ec59 = function(arg0) {
        const ret = arg0.depthWriteEnabled;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getdevice_403eb351b0c221c7 = function(arg0) {
        const ret = arg0.device;
        return ret;
    };
    imports.wbg.__wbg_getdimension_2fb7a09b5eca9552 = function(arg0) {
        const ret = arg0.dimension;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureDimension.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getdimension_cae0aee644c55dd8 = function(arg0) {
        const ret = arg0.dimension;
        return isLikeNone(ret) ? 7 : ((__wbindgen_enum_GpuTextureViewDimension.indexOf(ret) + 1 || 7) - 1);
    };
    imports.wbg.__wbg_getdstfactor_f279afd0ff9cda02 = function(arg0) {
        const ret = arg0.dstFactor;
        return isLikeNone(ret) ? 18 : ((__wbindgen_enum_GpuBlendFactor.indexOf(ret) + 1 || 18) - 1);
    };
    imports.wbg.__wbg_getendofpasswriteindex_640c51efec253f16 = function(arg0) {
        const ret = arg0.endOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getendofpasswriteindex_eb00d0496181a14c = function(arg0) {
        const ret = arg0.endOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getentries_8a3181d579e77e92 = function(arg0) {
        const ret = arg0.entries;
        return ret;
    };
    imports.wbg.__wbg_getentries_c458b1c602c958d1 = function(arg0) {
        const ret = arg0.entries;
        return ret;
    };
    imports.wbg.__wbg_getentrypoint_16f43013b4a1e02f = function(arg0, arg1) {
        const ret = arg1.entryPoint;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getentrypoint_26012728a46ccf28 = function(arg0, arg1) {
        const ret = arg1.entryPoint;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getentrypoint_a55ab88a729606c4 = function(arg0, arg1) {
        const ret = arg1.entryPoint;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_geterror_ce31d285b3b29dcd = function(arg0) {
        const ret = arg0.error;
        return ret;
    };
    imports.wbg.__wbg_getexternaltexture_d8d0df5e65ad47ad = function(arg0) {
        const ret = arg0.externalTexture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getfailop_1aae36880786556a = function(arg0) {
        const ret = arg0.failOp;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuStencilOperation.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_getfeaturelevel_2be784a4ea50366f = function(arg0, arg1) {
        const ret = arg1.featureLevel;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getflipy_aabeec15388f81e9 = function(arg0) {
        const ret = arg0.flipY;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getforcefallbackadapter_9ecd33aeb5ddc0e4 = function(arg0) {
        const ret = arg0.forceFallbackAdapter;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getformat_26851e46a8110df5 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getformat_7d2206af1fc441d2 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getformat_a573baec7d3203b8 = function(arg0) {
        const ret = arg0.format;
        return isLikeNone(ret) ? 96 : ((__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1);
    };
    imports.wbg.__wbg_getformat_a6c5c393814cb7d1 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getformat_b0a9444517900182 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getformat_d9bb8a94b2a0648f = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getformat_ee1b7df470989030 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuVertexFormat.indexOf(ret) + 1 || 42) - 1;
    };
    imports.wbg.__wbg_getfragment_93a5dc2a3a79b93d = function(arg0) {
        const ret = arg0.fragment;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getfrontface_0449287d016132ef = function(arg0) {
        const ret = arg0.frontFace;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuFrontFace.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getg_ca222e6fc6f6cd5f = function(arg0) {
        const ret = arg0.g;
        return ret;
    };
    imports.wbg.__wbg_gethasdynamicoffset_5556675ab61e6dd3 = function(arg0) {
        const ret = arg0.hasDynamicOffset;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getheight_854a6ba196f7d83d = function(arg0) {
        const ret = arg0.height;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
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
    imports.wbg.__wbg_getlabel_074b23947d9a2476 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_0f33fa1a7c6fa7f5 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_1f4573c3dc54e73b = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_319857c97dd2b718 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_32593c1e251795d3 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_3495df35e87fbccc = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_3b5ef00bd5c41b5b = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_40f86576569b4144 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_4e19bc277300fa5e = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_552c52c7c9d426ab = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_6000f2a8991e6e0e = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_7e5ec6c705f6fc6c = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_80ca2fdf97ca7af9 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_8d5c66debbfe5bc8 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_9456b6d8d8ae337f = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_9f5fb8899f910624 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_a70a8c46860a9bd2 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_a813f0f7be1db876 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_a9ea982b8214e01b = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_b8ef535774674bee = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_bd5bc7a55d44a7e4 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlabel_e885a16ece9eea76 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getlayout_8b5ffbe72902f26c = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_getlayout_b8c3b814a1436d15 = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_getlayout_cfab54b4c05eccb2 = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_getlayout_d531a8324751e15f = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_getloadop_1b66a289847b2f68 = function(arg0) {
        const ret = arg0.loadOp;
        return (__wbindgen_enum_GpuLoadOp.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_getlodmaxclamp_fd7b873d66339689 = function(arg0) {
        const ret = arg0.lodMaxClamp;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_getlodminclamp_57188fce1b50e151 = function(arg0) {
        const ret = arg0.lodMinClamp;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_getmagfilter_8265150e051a3863 = function(arg0) {
        const ret = arg0.magFilter;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuFilterMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getmappedatcreation_c320b6024a17c425 = function(arg0) {
        const ret = arg0.mappedAtCreation;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getmask_7ab40d104ea76233 = function(arg0) {
        const ret = arg0.mask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getmaxanisotropy_9fc99027256b999a = function(arg0) {
        const ret = arg0.maxAnisotropy;
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_getmaxdrawcount_5a9cc0d1212d6d96 = function(arg0, arg1) {
        const ret = arg1.maxDrawCount;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_getminbindingsize_619bcc4eea82259f = function(arg0, arg1) {
        const ret = arg1.minBindingSize;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_getminfilter_da729a12dcbaba91 = function(arg0) {
        const ret = arg0.minFilter;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuFilterMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getmiplevel_9a84ce40eca5a74c = function(arg0) {
        const ret = arg0.mipLevel;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getmiplevel_f68fef751cb97007 = function(arg0) {
        const ret = arg0.mipLevel;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getmiplevelcount_9439117dfe06aa41 = function(arg0) {
        const ret = arg0.mipLevelCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getmiplevelcount_a55989d2c04e1bd8 = function(arg0) {
        const ret = arg0.mipLevelCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getmipmapfilter_e5348d5c5779cf4b = function(arg0) {
        const ret = arg0.mipmapFilter;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuMipmapFilterMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getmode_b05d3389c1fdb4ad = function(arg0) {
        const ret = arg0.mode;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuCanvasToneMappingMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getmodule_0d5a9511206e86a1 = function(arg0) {
        const ret = arg0.module;
        return ret;
    };
    imports.wbg.__wbg_getmodule_5a2270b798f01779 = function(arg0) {
        const ret = arg0.module;
        return ret;
    };
    imports.wbg.__wbg_getmodule_6bdb0ae04941214e = function(arg0) {
        const ret = arg0.module;
        return ret;
    };
    imports.wbg.__wbg_getmultisample_a099bd9041a5e9dd = function(arg0) {
        const ret = arg0.multisample;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getmultisampled_c4af992f900d587b = function(arg0) {
        const ret = arg0.multisampled;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getname_a9bc06830b3aa610 = function(arg0, arg1) {
        const ret = arg1.name;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getocclusionqueryset_93f13c3418b4cc5b = function(arg0) {
        const ret = arg0.occlusionQuerySet;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getoffset_2609e8841f58e649 = function(arg0, arg1) {
        const ret = arg1.offset;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_getoffset_4dadb8e19aecbe34 = function(arg0) {
        const ret = arg0.offset;
        return ret;
    };
    imports.wbg.__wbg_getoffset_4dbb3e75c047e1e0 = function(arg0, arg1) {
        const ret = arg1.offset;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_getoffset_9a13bd727f37cc31 = function(arg0, arg1) {
        const ret = arg1.offset;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_getoperation_753748de7bd9dba4 = function(arg0) {
        const ret = arg0.operation;
        return isLikeNone(ret) ? 6 : ((__wbindgen_enum_GpuBlendOperation.indexOf(ret) + 1 || 6) - 1);
    };
    imports.wbg.__wbg_getorigin_32979dfff13a9cb5 = function(arg0) {
        const ret = arg0.origin;
        return ret;
    };
    imports.wbg.__wbg_getorigin_4f127a80acce4ce8 = function(arg0) {
        const ret = arg0.origin;
        return ret;
    };
    imports.wbg.__wbg_getorigin_68979d1577adb249 = function(arg0) {
        const ret = arg0.origin;
        return ret;
    };
    imports.wbg.__wbg_getpassop_071081cec5bd4cd1 = function(arg0) {
        const ret = arg0.passOp;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuStencilOperation.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_getpowerpreference_2a7ef25ad7b15f79 = function(arg0) {
        const ret = arg0.powerPreference;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuPowerPreference.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getpremultipliedalpha_74b7ee2a6e89cbfb = function(arg0) {
        const ret = arg0.premultipliedAlpha;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getprimitive_2d7e656c73f3ea60 = function(arg0) {
        const ret = arg0.primitive;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getqueryset_a46848bfa9fbedd2 = function(arg0) {
        const ret = arg0.querySet;
        return ret;
    };
    imports.wbg.__wbg_getqueryset_aae99596da1805a6 = function(arg0) {
        const ret = arg0.querySet;
        return ret;
    };
    imports.wbg.__wbg_getr_f54a59db55b34b6f = function(arg0) {
        const ret = arg0.r;
        return ret;
    };
    imports.wbg.__wbg_getrequiredfeatures_85fa1794853b07cc = function(arg0) {
        const ret = arg0.requiredFeatures;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getrequiredlimits_d6bb4209bc7e8367 = function(arg0) {
        const ret = arg0.requiredLimits;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getresolvetarget_07230e9141a7690b = function(arg0) {
        const ret = arg0.resolveTarget;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getresource_df9827ab645a20d5 = function(arg0) {
        const ret = arg0.resource;
        return ret;
    };
    imports.wbg.__wbg_getrowsperimage_6ef2d94efaba31c8 = function(arg0) {
        const ret = arg0.rowsPerImage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getrowsperimage_e9d0f1e390c81f98 = function(arg0) {
        const ret = arg0.rowsPerImage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getsamplecount_3c59d25048d1e99a = function(arg0) {
        const ret = arg0.sampleCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getsamplecount_3f2fa8913653bf98 = function(arg0) {
        const ret = arg0.sampleCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getsampler_88d78af850bbb67a = function(arg0) {
        const ret = arg0.sampler;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getsampletype_e9996b8f3110dbae = function(arg0) {
        const ret = arg0.sampleType;
        return isLikeNone(ret) ? 6 : ((__wbindgen_enum_GpuTextureSampleType.indexOf(ret) + 1 || 6) - 1);
    };
    imports.wbg.__wbg_getshaderlocation_a8ec9aba70bd93ec = function(arg0) {
        const ret = arg0.shaderLocation;
        return ret;
    };
    imports.wbg.__wbg_getsize_09f66ca0e5fbcd72 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_getsize_4fc932614b934cbb = function(arg0, arg1) {
        const ret = arg1.size;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_getsize_bbd0b03af214712d = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_getsource_7ca1c80d16ce8106 = function(arg0) {
        const ret = arg0.source;
        return ret;
    };
    imports.wbg.__wbg_getsource_cad6a932e7e6adb1 = function(arg0) {
        const ret = arg0.source;
        return ret;
    };
    imports.wbg.__wbg_getsrcfactor_e5f7bc19dbaaa9ec = function(arg0) {
        const ret = arg0.srcFactor;
        return isLikeNone(ret) ? 18 : ((__wbindgen_enum_GpuBlendFactor.indexOf(ret) + 1 || 18) - 1);
    };
    imports.wbg.__wbg_getstencilback_0680ae8e6ab982b3 = function(arg0) {
        const ret = arg0.stencilBack;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getstencilclearvalue_9f0f4804df39659a = function(arg0) {
        const ret = arg0.stencilClearValue;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getstencilfront_be5241d6b84325ca = function(arg0) {
        const ret = arg0.stencilFront;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getstencilloadop_4920f6e8a2033798 = function(arg0) {
        const ret = arg0.stencilLoadOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuLoadOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getstencilreadmask_01211098f504b8f9 = function(arg0) {
        const ret = arg0.stencilReadMask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getstencilreadonly_771b3025fac91e64 = function(arg0) {
        const ret = arg0.stencilReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getstencilreadonly_823c1f65a1f388df = function(arg0) {
        const ret = arg0.stencilReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getstencilstoreop_756c5dea70d9cc8a = function(arg0) {
        const ret = arg0.stencilStoreOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuStoreOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getstencilwritemask_f1918630ec45cfe9 = function(arg0) {
        const ret = arg0.stencilWriteMask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getstepmode_6f72984cf06f7277 = function(arg0) {
        const ret = arg0.stepMode;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuVertexStepMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_getstoragetexture_5a2e44c8df77b5c5 = function(arg0) {
        const ret = arg0.storageTexture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getstoreop_01d95e00f9f4a07c = function(arg0) {
        const ret = arg0.storeOp;
        return (__wbindgen_enum_GpuStoreOp.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_getstripindexformat_c1d52b8d872788f8 = function(arg0) {
        const ret = arg0.stripIndexFormat;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuIndexFormat.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_gettargets_4f985101a5f15023 = function(arg0) {
        const ret = arg0.targets;
        return ret;
    };
    imports.wbg.__wbg_gettexture_8722c38defe1cde3 = function(arg0) {
        const ret = arg0.texture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_gettexture_87d577976364b751 = function(arg0) {
        const ret = arg0.texture;
        return ret;
    };
    imports.wbg.__wbg_gettexture_edef547fbe387ac5 = function(arg0) {
        const ret = arg0.texture;
        return ret;
    };
    imports.wbg.__wbg_gettimestampwrites_a443c28d10c42ce0 = function(arg0) {
        const ret = arg0.timestampWrites;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_gettimestampwrites_c373c6f1f4aeda69 = function(arg0) {
        const ret = arg0.timestampWrites;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_gettonemapping_db355f8e5fc53f9f = function(arg0) {
        const ret = arg0.toneMapping;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_gettopology_c99fcf91a9127931 = function(arg0) {
        const ret = arg0.topology;
        return isLikeNone(ret) ? 6 : ((__wbindgen_enum_GpuPrimitiveTopology.indexOf(ret) + 1 || 6) - 1);
    };
    imports.wbg.__wbg_gettype_263c4efc404c2ced = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuBufferBindingType.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_gettype_3e33317454de2932 = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_WorkerType.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_gettype_bf01a2c1e894d5d8 = function(arg0) {
        const ret = arg0.type;
        return (__wbindgen_enum_GpuQueryType.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_gettype_f4bb29ee77881b1e = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuSamplerBindingType.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_getunclippeddepth_28d56aab5f7c8d7c = function(arg0) {
        const ret = arg0.unclippedDepth;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_getusage_1b47b9e2caabda2e = function(arg0) {
        const ret = arg0.usage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getusage_9229f27402bb6c86 = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_getusage_e8183d15eef8d719 = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_getusage_f59800352c4a2906 = function(arg0) {
        const ret = arg0.usage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getvertex_cd8f7477845087f5 = function(arg0) {
        const ret = arg0.vertex;
        return ret;
    };
    imports.wbg.__wbg_getview_c71893be1422d649 = function(arg0) {
        const ret = arg0.view;
        return ret;
    };
    imports.wbg.__wbg_getview_fb7ceddce2c6ef6c = function(arg0) {
        const ret = arg0.view;
        return ret;
    };
    imports.wbg.__wbg_getviewdimension_7d8751eaf33e8af0 = function(arg0) {
        const ret = arg0.viewDimension;
        return isLikeNone(ret) ? 7 : ((__wbindgen_enum_GpuTextureViewDimension.indexOf(ret) + 1 || 7) - 1);
    };
    imports.wbg.__wbg_getviewdimension_9ca2c9f8af8ed3d4 = function(arg0) {
        const ret = arg0.viewDimension;
        return isLikeNone(ret) ? 7 : ((__wbindgen_enum_GpuTextureViewDimension.indexOf(ret) + 1 || 7) - 1);
    };
    imports.wbg.__wbg_getviewformats_bde9f615b0b8d018 = function(arg0) {
        const ret = arg0.viewFormats;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getviewformats_d5e397aae67f16c0 = function(arg0) {
        const ret = arg0.viewFormats;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getvisibility_1e35d707e3bbb2cd = function(arg0) {
        const ret = arg0.visibility;
        return ret;
    };
    imports.wbg.__wbg_getwidth_d13cefb32ebf26a3 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_getwithrefkey_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    };
    imports.wbg.__wbg_getwritemask_b71b849e208d207d = function(arg0) {
        const ret = arg0.writeMask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getx_54eb290f7267e31c = function(arg0) {
        const ret = arg0.x;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getx_ef411cec6c439830 = function(arg0) {
        const ret = arg0.x;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getxrcompatible_38e7d7f6b380ba43 = function(arg0) {
        const ret = arg0.xrCompatible;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_gety_00a13e5450977093 = function(arg0) {
        const ret = arg0.y;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_gety_6b81f8272553f588 = function(arg0) {
        const ret = arg0.y;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_getz_570bbaa4b2cdb451 = function(arg0) {
        const ret = arg0.z;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_global_04938130ec921a6a = function(arg0) {
        const ret = arg0.global;
        return ret;
    };
    imports.wbg.__wbg_gpu_a6bce2913fb8f574 = function(arg0) {
        const ret = arg0.gpu;
        return ret;
    };
    imports.wbg.__wbg_gpubackendinfo_new = function(arg0) {
        const ret = GpuBackendInfo.__wrap(arg0);
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
    imports.wbg.__wbg_hardwareConcurrency_a58b0da6a18bb0cb = function(arg0) {
        const ret = arg0.hardwareConcurrency;
        return ret;
    };
    imports.wbg.__wbg_hardwareConcurrency_e840281060cd1953 = function(arg0) {
        const ret = arg0.hardwareConcurrency;
        return ret;
    };
    imports.wbg.__wbg_hasAttributeNS_257650ba137d272d = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.hasAttributeNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_hasAttribute_db31090c2e646f57 = function(arg0, arg1, arg2) {
        const ret = arg0.hasAttribute(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_hasAttributes_0c8caac280127571 = function(arg0) {
        const ret = arg0.hasAttributes();
        return ret;
    };
    imports.wbg.__wbg_hasChildNodes_cd350e7b5c6e411e = function(arg0) {
        const ret = arg0.hasChildNodes();
        return ret;
    };
    imports.wbg.__wbg_hasFocus_21add8cd20546ed0 = function() { return handleError(function (arg0) {
        const ret = arg0.hasFocus();
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_hasPointerCapture_8795026dddc22845 = function(arg0, arg1) {
        const ret = arg0.hasPointerCapture(arg1);
        return ret;
    };
    imports.wbg.__wbg_hasSuspendTaint_802cdf3236aea6af = function(arg0) {
        const ret = arg0.hasSuspendTaint();
        return ret;
    };
    imports.wbg.__wbg_has_4891bec062ded753 = function(arg0, arg1, arg2) {
        const ret = arg0.has(getStringFromWasm0(arg1, arg2));
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
    imports.wbg.__wbg_has_a6323b69b2d0943c = function(arg0, arg1, arg2) {
        const ret = arg0.has(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_height_09c194ef4dc69ec5 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_1d93eb7f5e355d97 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_838cee19ba8597db = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_94941b7681aa1cce = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_d3f39e12f0f62121 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_df1aa98dfbbe11ad = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_e3c322f23d99ad2f = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_hidden_44035768fde1148a = function(arg0) {
        const ret = arg0.hidden;
        return ret;
    };
    imports.wbg.__wbg_hidden_d5c02c79a2b77bb6 = function(arg0) {
        const ret = arg0.hidden;
        return ret;
    };
    imports.wbg.__wbg_hidePopover_ddbc9445ef563761 = function() { return handleError(function (arg0) {
        arg0.hidePopover();
    }, arguments) };
    imports.wbg.__wbg_hint_1bd2b1584050d71a = function(arg0, arg1, arg2) {
        arg0.hint(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_hint_76b07a30b664ed2a = function(arg0, arg1, arg2) {
        arg0.hint(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_hspace_603eb26dbe01fad3 = function(arg0) {
        const ret = arg0.hspace;
        return ret;
    };
    imports.wbg.__wbg_hypot_c356ef2c94b13bae = function(arg0, arg1) {
        const ret = Math.hypot(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_id_c65402eae48fb242 = function(arg0, arg1) {
        const ret = arg1.id;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_ignoreCase_fc7595cfc5991daa = function(arg0) {
        const ret = arg0.ignoreCase;
        return ret;
    };
    imports.wbg.__wbg_importExternalTexture_48281bcd478e2431 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.importExternalTexture(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_importNode_2fae5d3f020e0064 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.importNode(arg1, arg2 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_importNode_36840c3d064b37b7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.importNode(arg1);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_inert_31f2674ac8cc017a = function(arg0) {
        const ret = arg0.inert;
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
    imports.wbg.__wbg_info_f1fa2f36797c8d89 = function(arg0) {
        const ret = arg0.info;
        return ret;
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
    imports.wbg.__wbg_innerHTML_e1553352fe93921a = function(arg0, arg1) {
        const ret = arg1.innerHTML;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_innerHeight_05f4225d754a7929 = function() { return handleError(function (arg0) {
        const ret = arg0.innerHeight;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_innerText_df9aeb9435e40973 = function(arg0, arg1) {
        const ret = arg1.innerText;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_innerWidth_7e0498dbd876d498 = function() { return handleError(function (arg0) {
        const ret = arg0.innerWidth;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_inputEncoding_6fbce1287bc33d99 = function(arg0, arg1) {
        const ret = arg1.inputEncoding;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_input_7bc82bb61badfdde = function() {
        const ret = RegExp.input;
        return ret;
    };
    imports.wbg.__wbg_insertAdjacentElement_cea32dfd4c2cfba5 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.insertAdjacentElement(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_insertAdjacentHTML_63bf1f0cd930014e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.insertAdjacentHTML(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_insertAdjacentText_8c9e94190fcc8e1d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.insertAdjacentText(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_insertBefore_c181fb91844cd959 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.insertBefore(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_insertDebugMarker_0a93b262898e0670 = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_insertDebugMarker_39440bb8db83e2bf = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_insertDebugMarker_676e6841e28dfe4d = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_insertDebugMarker_d78573f00a67b83a = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_instanceof_AngleInstancedArrays_62984598d6852032 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ANGLE_instanced_arrays;
        } catch (_) {
            result = false;
        }
        const ret = result;
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
    imports.wbg.__wbg_instanceof_Document_917b7ac52e42682e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Document;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Element_0af65443936d5154 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Element;
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
    imports.wbg.__wbg_instanceof_ExtBlendMinmax_d001063e6f077dae = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_blend_minmax;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtColorBufferFloat_a35fd07278c2c5c7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_color_buffer_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtColorBufferHalfFloat_4703797f81e8add4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_color_buffer_half_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtDisjointTimerQuery_3325c6ca1a642f5f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_disjoint_timer_query;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtFragDepth_faf7338f423a997a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_frag_depth;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtSRgb_ecee0d1d23ae324a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_sRGB;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtShaderTextureLod_198612d69c2a6677 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_shader_texture_lod;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtTextureFilterAnisotropic_50589d9f654541f8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_texture_filter_anisotropic;
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
    imports.wbg.__wbg_instanceof_Global_294ff0f7ff2483ff = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
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
    imports.wbg.__wbg_instanceof_GpuAdapterInfo_92f3167fcd8b6461 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUAdapterInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuAdapter_fb230cdccb184887 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUAdapter;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupDescriptor_f0d4bb9d85784660 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupEntry_35480b984ef12c2d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupEntry;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupLayoutDescriptor_00c52bd22790f403 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupLayoutDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupLayoutEntry_8f53277ed799d44c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupLayoutEntry;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupLayout_896206264559a169 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroup_e5eeecc318493e78 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroup;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBlendComponent_2ae9f368112f5da2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBlendComponent;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBlendState_a4a9e6cf32d181c9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBlendState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBufferBindingLayout_a438e006058016fc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBufferBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBufferBinding_7dd77627902da0fe = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBufferBinding;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBufferDescriptor_3969f96f71ec1bf6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBufferDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBuffer_edfab0bb6be5faf5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCanvasConfiguration_0e7f2756d4f91d5a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCanvasConfiguration;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCanvasContext_48ec5330c4425d84 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCanvasContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCanvasToneMapping_011ed21bb1a13740 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCanvasToneMapping;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuColorDict_7e051f5ac3052f9d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUColorDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuColorTargetState_33ed24435ff748d1 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUColorTargetState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandBufferDescriptor_b255b1f22460b62f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandBufferDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandBuffer_563afd02a4815b11 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandEncoderDescriptor_bb575b70a8cc3462 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandEncoderDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandEncoder_4078ec7fd3c143e5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCompilationInfo_aa98a8a14a9dba66 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCompilationInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCompilationMessage_f23ed5eb6982b96b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCompilationMessage;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePassDescriptor_e9431ca42ca8b613 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePassDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePassEncoder_cfcd0ace9679ac1a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePassEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePassTimestampWrites_79ffad214e29842b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePassTimestampWrites;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePipelineDescriptor_d02a852910dace47 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePipelineDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePipeline_51c56dd2eab3e08e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePipeline;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCopyExternalImageDestInfo_90a66b58f97f6bae = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCopyExternalImageDestInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCopyExternalImageSourceInfo_ae22020a523ba8e2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCopyExternalImageSourceInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDepthStencilState_0d09dc9e034555d4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDepthStencilState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDeviceDescriptor_5c9a334dfe5d0024 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDeviceDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDeviceLostInfo_00e487bdd59348b8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDeviceLostInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDevice_a8730103ecbe3b8c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDevice;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuError_98945c6f7474da25 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExtent3dDict_f438b5fecbe011bb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExtent3DDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExternalTextureBindingLayout_2048b131cffa8c66 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExternalTextureBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExternalTextureDescriptor_921797bc4556e1a9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExternalTextureDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExternalTexture_dca8552f3d962548 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExternalTexture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuFragmentState_0be1bbe356cb888b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUFragmentState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuMultisampleState_575022d54ee05cb9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUMultisampleState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuObjectDescriptorBase_c749f6d4089d76a4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUObjectDescriptorBase;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuOrigin2dDict_f260caf88aa3075f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUOrigin2DDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuOrigin3dDict_b4f96348c901d2d8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUOrigin3DDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuOutOfMemoryError_7b1554dded417c4f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUOutOfMemoryError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPipelineDescriptorBase_23cfa9114ca48a6f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPipelineDescriptorBase;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPipelineLayoutDescriptor_a09076697362f92f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPipelineLayoutDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPipelineLayout_7395bac0641bd00c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPipelineLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPrimitiveState_e97278473e1191c8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPrimitiveState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuProgrammableStage_fcddd344f11ddbdd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUProgrammableStage;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQuerySetDescriptor_b50338e4d7954b5e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQuerySetDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQuerySet_8bb1080e2c62c30a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQuerySet;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQueueDescriptor_189843ca327b5928 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQueueDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQueue_d909fdb938f44eee = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQueue;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundleDescriptor_32fa86068b33484b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundleDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundleEncoderDescriptor_18bb7d0d0e7520bf = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundleEncoderDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundleEncoder_0fc0010efa4e1e57 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundleEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundle_e6bdc1b2581a3c0e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundle;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassColorAttachment_9acbee01f83d8f4f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassColorAttachment;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassDepthStencilAttachment_813db23827db8e23 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassDepthStencilAttachment;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassDescriptor_7b956e678f7b50e6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassEncoder_2d66ab9a65864593 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassTimestampWrites_eaefdea87df77c04 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassTimestampWrites;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPipelineDescriptor_b53997ccfd319ccd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPipelineDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPipeline_0b75b5e1002f45d7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPipeline;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRequestAdapterOptions_f3b6aa37a5b2727e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURequestAdapterOptions;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSamplerBindingLayout_6894432717937829 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSamplerBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSamplerDescriptor_4ffaac59b965dfda = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSamplerDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSampler_d04ddbf4254a39d6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSampler;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuShaderModuleDescriptor_9787fb80105c05ae = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUShaderModuleDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuShaderModule_86af9537433491fd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUShaderModule;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuStencilFaceState_f7fba25271f534c7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUStencilFaceState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuStorageTextureBindingLayout_b6c4014b43b9ecb4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUStorageTextureBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSupportedFeatures_0f15c46f8fb701e9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSupportedFeatures;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSupportedLimits_941b888cf33ee488 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSupportedLimits;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexelCopyBufferInfo_67019cba575bca28 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexelCopyBufferInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexelCopyBufferLayout_1efc80b5f9acf26a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexelCopyBufferLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexelCopyTextureInfo_b14b87d45af57a29 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexelCopyTextureInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureBindingLayout_e03369a1a5122434 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureDescriptor_a4a8dd497cece79d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureViewDescriptor_2533aefa12c8eb63 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureViewDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureView_9257e14b2f7aa4df = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureView;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexture_7f426156e359e805 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuUncapturedErrorEventInit_6e3eaa1c351bcc35 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUUncapturedErrorEventInit;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuUncapturedErrorEvent_c06b8264b0658b6d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUUncapturedErrorEvent;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuValidationError_124458c5a6bb3b58 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUValidationError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuVertexAttribute_b69a5fba9fb7915a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUVertexAttribute;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuVertexBufferLayout_3cab24a605020e87 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUVertexBufferLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuVertexState_9b90bdb42920bfc9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUVertexState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Gpu_a272a2acae49cec5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPU;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlCanvasElement_2ea67072a7624ac5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLCanvasElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlElement_51378c201250b16c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlImageElement_3fe24a3cec7f62bb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLImageElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlMediaElement_dfdb010481a98e04 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLMediaElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlVideoElement_7f414b32f362e317 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLVideoElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ImageBitmap_d093d508663e313d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ImageBitmap;
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
    imports.wbg.__wbg_instanceof_NavigatorWithGpu_5f6f0821cad90624 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof NavigatorWithGpu;
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
    imports.wbg.__wbg_instanceof_NodeList_e3627c69dda12d50 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof NodeList;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Node_fbc6b87f5ed2e230 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Node;
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
    imports.wbg.__wbg_instanceof_OesElementIndexUint_fdf86f548cd7bb27 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_element_index_uint;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesStandardDerivatives_dc71b532bfc8a9ba = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_standard_derivatives;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureFloatLinear_763161e5a0a4cb09 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_float_linear;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureFloat_ef9b1ec60c4fcfb4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureHalfFloatLinear_f439c18ce46b995f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_half_float_linear;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureHalfFloat_b5e6e21a058ae542 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_half_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesVertexArrayObject_05f79245dc468916 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_vertex_array_object;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OffscreenCanvas_d55760945f91bf51 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OffscreenCanvas;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OvrMultiview2_d580034298c37ccd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OVR_multiview2;
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
    imports.wbg.__wbg_instanceof_VideoFrame_f362406fe1355687 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof VideoFrame;
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
    imports.wbg.__wbg_instanceof_WebGl2RenderingContext_2b6045efeb76568d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGL2RenderingContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlActiveInfo_f89d76e96d143e6f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLActiveInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlBuffer_480aab8590407121 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlFramebuffer_54aca42faf38c7bd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLFramebuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlProgram_8658596e0b5f9646 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLProgram;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlQuery_3e5d06e41fef3f48 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLQuery;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlRenderbuffer_f139deabffbdf406 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLRenderbuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlRenderingContext_b9cbe798424f6d4c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLRenderingContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlSampler_6923b118f44d8eba = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLSampler;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlShaderPrecisionFormat_c4a5ea4bff4973c3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLShaderPrecisionFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlShader_ecd97500edeec731 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLShader;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlSync_3863bc7c3fdac69c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLSync;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlTexture_e1b2395c0e7c5c2d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLTexture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlTransformFeedback_2f7df69b7965e02b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLTransformFeedback;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlUniformLocation_851167c3ec0200d3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLUniformLocation;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlVertexArrayObject_83df7ac756c9dae0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLVertexArrayObject;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglColorBufferFloat_bf561ed8b1d75465 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_color_buffer_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureAstc_765e8f2a61425a5d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_astc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureEtc1_4d9295e8c3793e35 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_etc1;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureEtc_4eefdb08043a1ec6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_etc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTexturePvrtc_6a90ab1abdce5e20 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_pvrtc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureS3tcSrgb_59e46aab539cab3d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_s3tc_srgb;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureS3tc_178db33ec293e1f3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_s3tc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDebugRendererInfo_04d819612ec9f282 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_debug_renderer_info;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDebugShaders_1631668f816f352c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_debug_shaders;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDepthTexture_e7f3ddfaf392d155 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_depth_texture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDrawBuffers_0980e16f0148b114 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_draw_buffers;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglLoseContext_e188aefd2ee92f99 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_lose_context;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WgslLanguageFeatures_eff5aad59a76b139 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WGSLLanguageFeatures;
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
    imports.wbg.__wbg_instanceof_WorkerNavigator_16d0429e2f608fc9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WorkerNavigator;
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
    imports.wbg.__wbg_invalidateFramebuffer_83f643d2a4936456 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.invalidateFramebuffer(arg1 >>> 0, arg2);
    }, arguments) };
    imports.wbg.__wbg_invalidateSubFramebuffer_2014a6025d7bcb46 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.invalidateSubFramebuffer(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_isArray_a1eab7e0d067391b = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_isBuffer_67c8f0fa38d4b4e8 = function(arg0, arg1) {
        const ret = arg0.isBuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isBuffer_7794ba7b32f71430 = function(arg0, arg1) {
        const ret = arg0.isBuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isConcatSpreadable_18561c7c903c3cdd = function() {
        const ret = Symbol.isConcatSpreadable;
        return ret;
    };
    imports.wbg.__wbg_isConnected_61ed8d7b311467d5 = function(arg0) {
        const ret = arg0.isConnected;
        return ret;
    };
    imports.wbg.__wbg_isContentEditable_476a31af2f281cb6 = function(arg0) {
        const ret = arg0.isContentEditable;
        return ret;
    };
    imports.wbg.__wbg_isContextLost_568448d44345f919 = function(arg0) {
        const ret = arg0.isContextLost();
        return ret;
    };
    imports.wbg.__wbg_isContextLost_ab3c02d6560e914b = function(arg0) {
        const ret = arg0.isContextLost();
        return ret;
    };
    imports.wbg.__wbg_isDefaultNamespace_62e1edc61fc0e5a7 = function(arg0, arg1, arg2) {
        const ret = arg0.isDefaultNamespace(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_isEnabled_50f23ae4458ee243 = function(arg0, arg1) {
        const ret = arg0.isEnabled(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_isEnabled_b2d9050c79f24045 = function(arg0, arg1) {
        const ret = arg0.isEnabled(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_isEqualNode_787944690bbad9da = function(arg0, arg1) {
        const ret = arg0.isEqualNode(arg1);
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
    imports.wbg.__wbg_isFallbackAdapter_2172e4ac84cee367 = function(arg0) {
        const ret = arg0.isFallbackAdapter;
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
    imports.wbg.__wbg_isFramebuffer_ce0974911da21f45 = function(arg0, arg1) {
        const ret = arg0.isFramebuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isFramebuffer_e24cbf1cbc729994 = function(arg0, arg1) {
        const ret = arg0.isFramebuffer(arg1);
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
    imports.wbg.__wbg_isMap_d1c822dce7180f21 = function(arg0) {
        const ret = arg0.isMap;
        return ret;
    };
    imports.wbg.__wbg_isNaN_43c030426660ba58 = function(arg0) {
        const ret = Number.isNaN(arg0);
        return ret;
    };
    imports.wbg.__wbg_isProgram_339423d9ef15163d = function(arg0, arg1) {
        const ret = arg0.isProgram(arg1);
        return ret;
    };
    imports.wbg.__wbg_isProgram_9b1a698d13d9a248 = function(arg0, arg1) {
        const ret = arg0.isProgram(arg1);
        return ret;
    };
    imports.wbg.__wbg_isPrototypeOf_372fa1d8cba01591 = function(arg0, arg1) {
        const ret = arg0.isPrototypeOf(arg1);
        return ret;
    };
    imports.wbg.__wbg_isQueryEXT_677d05e7399e2f7f = function(arg0, arg1) {
        const ret = arg0.isQueryEXT(arg1);
        return ret;
    };
    imports.wbg.__wbg_isQuery_2748ea240488ceab = function(arg0, arg1) {
        const ret = arg0.isQuery(arg1);
        return ret;
    };
    imports.wbg.__wbg_isRenderbuffer_28faf143532501f0 = function(arg0, arg1) {
        const ret = arg0.isRenderbuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isRenderbuffer_5ab90c3c8d1095cc = function(arg0, arg1) {
        const ret = arg0.isRenderbuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_343e2beeeece1bb0 = function(arg0) {
        const ret = Number.isSafeInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSameNode_2a012c6251fe238d = function(arg0, arg1) {
        const ret = arg0.isSameNode(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSampler_2718c9cfe4a28b67 = function(arg0, arg1) {
        const ret = arg0.isSampler(arg1);
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
    imports.wbg.__wbg_isShader_8c93913152c9311e = function(arg0, arg1) {
        const ret = arg0.isShader(arg1);
        return ret;
    };
    imports.wbg.__wbg_isShader_b3b4fbf936e4eee5 = function(arg0, arg1) {
        const ret = arg0.isShader(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSync_68ac34385d87fde3 = function(arg0, arg1) {
        const ret = arg0.isSync(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTexture_5746d1d42909aca6 = function(arg0, arg1) {
        const ret = arg0.isTexture(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTexture_c15fad2343452873 = function(arg0, arg1) {
        const ret = arg0.isTexture(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTransformFeedback_0249a9d25852ab33 = function(arg0, arg1) {
        const ret = arg0.isTransformFeedback(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTrusted_cc994b7949c53593 = function(arg0) {
        const ret = arg0.isTrusted;
        return ret;
    };
    imports.wbg.__wbg_isVertexArrayOES_819b5bdeff17b9c9 = function(arg0, arg1) {
        const ret = arg0.isVertexArrayOES(arg1);
        return ret;
    };
    imports.wbg.__wbg_isVertexArray_2b666363ee9771df = function(arg0, arg1) {
        const ret = arg0.isVertexArray(arg1);
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
    imports.wbg.__wbg_item_8be407c958853a13 = function(arg0, arg1) {
        const ret = arg0.item(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
    imports.wbg.__wbg_keys_40c9c07429ef6ef3 = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_483e9acdd8ad4799 = function(arg0) {
        const ret = arg0.keys();
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
    imports.wbg.__wbg_keys_5af53af5c0356618 = function(arg0) {
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
    imports.wbg.__wbg_label_200122a5af2be158 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_215f8568b1ad8b31 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_2222ad4b760940d1 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_357bf185995bf1e2 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_46e7feada5402a68 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_47d92535a24c18c3 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_4f7d1c5d78b2b797 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_5466ed161efb13fb = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_54ce300cc4d069d0 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_5c0f1c839da9a64a = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_5de7aceea9ddf02a = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_7d0c16aeb8e91e18 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_7e8321599076307a = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_833d6a4e7ef21d26 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_8920fbcf2d201133 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_accfa21eda46c375 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_b59cbcc51390e200 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_c6440e6a32ad5fe3 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_cda985b32d44cee0 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_f119926d852802ae = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lang_a9d917fba233f813 = function(arg0, arg1) {
        const ret = arg1.lang;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_language_185a22ab87902856 = function(arg0, arg1) {
        const ret = arg1.language;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_language_d871ec78ee8eec62 = function(arg0, arg1) {
        const ret = arg1.language;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_languages_2420955220685766 = function(arg0) {
        const ret = arg0.languages;
        return ret;
    };
    imports.wbg.__wbg_languages_d8dad509faf757df = function(arg0) {
        const ret = arg0.languages;
        return ret;
    };
    imports.wbg.__wbg_lastChild_e20d4dc0f9e02ce7 = function(arg0) {
        const ret = arg0.lastChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_lastElementChild_1269b660ec3e6985 = function(arg0) {
        const ret = arg0.lastElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_lastElementChild_c078f175dc773dc0 = function(arg0) {
        const ret = arg0.lastElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
    imports.wbg.__wbg_lastModified_c118330bfe7289b9 = function(arg0, arg1) {
        const ret = arg1.lastModified;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lastParen_a151767da39c8f63 = function() {
        const ret = RegExp.lastParen;
        return ret;
    };
    imports.wbg.__wbg_lastStyleSheetSet_ce4d2b2860921519 = function(arg0, arg1) {
        const ret = arg1.lastStyleSheetSet;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_length_38d7e6b233e91f60 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_3b4f022188ae8db6 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_49b2ba67f0897e97 = function(arg0) {
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
    imports.wbg.__wbg_limits_79ab67d5f10db979 = function(arg0) {
        const ret = arg0.limits;
        return ret;
    };
    imports.wbg.__wbg_limits_b6a82fde3977821c = function(arg0) {
        const ret = arg0.limits;
        return ret;
    };
    imports.wbg.__wbg_lineNum_cebfd98a4d402029 = function(arg0) {
        const ret = arg0.lineNum;
        return ret;
    };
    imports.wbg.__wbg_linePos_757e30865479c848 = function(arg0) {
        const ret = arg0.linePos;
        return ret;
    };
    imports.wbg.__wbg_lineWidth_4748a35a9ba291b3 = function(arg0, arg1) {
        arg0.lineWidth(arg1);
    };
    imports.wbg.__wbg_lineWidth_8233f7f986bfa84d = function(arg0, arg1) {
        arg0.lineWidth(arg1);
    };
    imports.wbg.__wbg_linkProgram_067ee06739bdde81 = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_linkProgram_e002979fe36e5b2a = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_load_2671477a3293aadb = function(arg0) {
        arg0.load();
    };
    imports.wbg.__wbg_load_37f7461738b4d1ca = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.load(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_load_e8d50870e4f7a070 = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.load(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_localName_8c204fd2f432fb9b = function(arg0, arg1) {
        const ret = arg1.localName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
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
    imports.wbg.__wbg_longDesc_947d6ee55c6dd9b8 = function(arg0, arg1) {
        const ret = arg1.longDesc;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lookupNamespaceURI_b5359c3558d970cf = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.lookupNamespaceURI(arg2 === 0 ? undefined : getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lookupPrefix_2ab86f20563ea2e2 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.lookupPrefix(arg2 === 0 ? undefined : getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_loop_0167dd3be6d065be = function(arg0) {
        const ret = arg0.loop;
        return ret;
    };
    imports.wbg.__wbg_loseContext_b08e5a60056f6e15 = function(arg0) {
        arg0.loseContext();
    };
    imports.wbg.__wbg_lost_b3ca4432a1e6db21 = function(arg0) {
        const ret = arg0.lost;
        return ret;
    };
    imports.wbg.__wbg_makeXRCompatible_b5d9bd522ed55f4a = function(arg0) {
        const ret = arg0.makeXRCompatible();
        return ret;
    };
    imports.wbg.__wbg_makeXRCompatible_e3eda1328210dc62 = function(arg0) {
        const ret = arg0.makeXRCompatible();
        return ret;
    };
    imports.wbg.__wbg_mapAsync_04f010b0fe132174 = function(arg0, arg1, arg2) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_109e186bf9bc3654 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_431f5b4154ee4bef = function(arg0, arg1, arg2) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_4a34082bad283ccf = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_5f8aefa944edbe78 = function(arg0, arg1) {
        const ret = arg0.mapAsync(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_a1b4c4d08c3ebfb5 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2 >>> 0, arg3);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_aa75696b8d2600e8 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapState_349cf786ba1d51a2 = function(arg0) {
        const ret = arg0.mapState;
        return (__wbindgen_enum_GpuBufferMapState.indexOf(ret) + 1 || 4) - 1;
    };
    imports.wbg.__wbg_map_e4849f8f12213f6a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_7304(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_matches_33a2000d7f67f964 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.matches(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_maxBindGroupsPlusVertexBuffers_b29d419ac8ce1089 = function(arg0) {
        const ret = arg0.maxBindGroupsPlusVertexBuffers;
        return ret;
    };
    imports.wbg.__wbg_maxBindGroups_c88520bb1d32bb51 = function(arg0) {
        const ret = arg0.maxBindGroups;
        return ret;
    };
    imports.wbg.__wbg_maxBindingsPerBindGroup_432afc05fd4d1473 = function(arg0) {
        const ret = arg0.maxBindingsPerBindGroup;
        return ret;
    };
    imports.wbg.__wbg_maxBufferSize_b67a4c44cc76ddc3 = function(arg0) {
        const ret = arg0.maxBufferSize;
        return ret;
    };
    imports.wbg.__wbg_maxColorAttachmentBytesPerSample_2b29886758adffb4 = function(arg0) {
        const ret = arg0.maxColorAttachmentBytesPerSample;
        return ret;
    };
    imports.wbg.__wbg_maxColorAttachments_ec0f3f73d0af16a4 = function(arg0) {
        const ret = arg0.maxColorAttachments;
        return ret;
    };
    imports.wbg.__wbg_maxComputeInvocationsPerWorkgroup_ea57344834f1a195 = function(arg0) {
        const ret = arg0.maxComputeInvocationsPerWorkgroup;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupSizeX_b924545971550146 = function(arg0) {
        const ret = arg0.maxComputeWorkgroupSizeX;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupSizeY_c0d9d68b1acecdc1 = function(arg0) {
        const ret = arg0.maxComputeWorkgroupSizeY;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupSizeZ_3898cfa28ca6d14f = function(arg0) {
        const ret = arg0.maxComputeWorkgroupSizeZ;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupStorageSize_edea548daf4af87d = function(arg0) {
        const ret = arg0.maxComputeWorkgroupStorageSize;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupsPerDimension_bfc346c1292145d9 = function(arg0) {
        const ret = arg0.maxComputeWorkgroupsPerDimension;
        return ret;
    };
    imports.wbg.__wbg_maxDynamicStorageBuffersPerPipelineLayout_e7359e7bdfc76801 = function(arg0) {
        const ret = arg0.maxDynamicStorageBuffersPerPipelineLayout;
        return ret;
    };
    imports.wbg.__wbg_maxDynamicUniformBuffersPerPipelineLayout_8beefcf6b6ae3a02 = function(arg0) {
        const ret = arg0.maxDynamicUniformBuffersPerPipelineLayout;
        return ret;
    };
    imports.wbg.__wbg_maxInterStageShaderVariables_38c042fb78e63308 = function(arg0) {
        const ret = arg0.maxInterStageShaderVariables;
        return ret;
    };
    imports.wbg.__wbg_maxSampledTexturesPerShaderStage_7fe798e58a892ea4 = function(arg0) {
        const ret = arg0.maxSampledTexturesPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxSamplersPerShaderStage_84408cd7914be213 = function(arg0) {
        const ret = arg0.maxSamplersPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxStorageBufferBindingSize_9711b12549c371a6 = function(arg0) {
        const ret = arg0.maxStorageBufferBindingSize;
        return ret;
    };
    imports.wbg.__wbg_maxStorageBuffersPerShaderStage_3b626e8ff1584e0b = function(arg0) {
        const ret = arg0.maxStorageBuffersPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxStorageTexturesPerShaderStage_c612c8e8f36e7ad3 = function(arg0) {
        const ret = arg0.maxStorageTexturesPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxTextureArrayLayers_6e0973f615982bee = function(arg0) {
        const ret = arg0.maxTextureArrayLayers;
        return ret;
    };
    imports.wbg.__wbg_maxTextureDimension1D_fda090a895ffead5 = function(arg0) {
        const ret = arg0.maxTextureDimension1D;
        return ret;
    };
    imports.wbg.__wbg_maxTextureDimension2D_876dc9c39fa8de4e = function(arg0) {
        const ret = arg0.maxTextureDimension2D;
        return ret;
    };
    imports.wbg.__wbg_maxTextureDimension3D_3e8ca51b995bc0e0 = function(arg0) {
        const ret = arg0.maxTextureDimension3D;
        return ret;
    };
    imports.wbg.__wbg_maxTouchPoints_763ee20e665a4536 = function(arg0) {
        const ret = arg0.maxTouchPoints;
        return ret;
    };
    imports.wbg.__wbg_maxUniformBufferBindingSize_d9898f62e702922b = function(arg0) {
        const ret = arg0.maxUniformBufferBindingSize;
        return ret;
    };
    imports.wbg.__wbg_maxUniformBuffersPerShaderStage_80346a93791c45ff = function(arg0) {
        const ret = arg0.maxUniformBuffersPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxVertexAttributes_bb30494dbeda4a16 = function(arg0) {
        const ret = arg0.maxVertexAttributes;
        return ret;
    };
    imports.wbg.__wbg_maxVertexBufferArrayStride_f2b103ca29d68d1a = function(arg0) {
        const ret = arg0.maxVertexBufferArrayStride;
        return ret;
    };
    imports.wbg.__wbg_maxVertexBuffers_522f56407d841954 = function(arg0) {
        const ret = arg0.maxVertexBuffers;
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
    imports.wbg.__wbg_message_37510c9867df2726 = function(arg0, arg1) {
        const ret = arg1.message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_message_430c6a99ed41c865 = function(arg0, arg1) {
        const ret = arg1.message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_message_97a2af9b89d693a3 = function(arg0) {
        const ret = arg0.message;
        return ret;
    };
    imports.wbg.__wbg_message_faac9a3b061926d2 = function(arg0, arg1) {
        const ret = arg1.message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_messages_7ac9f799fce0fa51 = function(arg0) {
        const ret = arg0.messages;
        return ret;
    };
    imports.wbg.__wbg_minStorageBufferOffsetAlignment_8150d07a1d4bf231 = function(arg0) {
        const ret = arg0.minStorageBufferOffsetAlignment;
        return ret;
    };
    imports.wbg.__wbg_minUniformBufferOffsetAlignment_f2960fb3c8ad86bd = function(arg0) {
        const ret = arg0.minUniformBufferOffsetAlignment;
        return ret;
    };
    imports.wbg.__wbg_min_886b049527853bd8 = function(arg0, arg1) {
        const ret = Math.min(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_mipLevelCount_86cfeea77bf99c24 = function(arg0) {
        const ret = arg0.mipLevelCount;
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
    imports.wbg.__wbg_muted_3e0c534b15bb0a64 = function(arg0) {
        const ret = arg0.muted;
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
    imports.wbg.__wbg_name_46d2a30bbc62bbfb = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_name_a546fbb44b8bc70a = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_name_f5089a8a6c7a983a = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_namespaceURI_63ddded7f2fdbe94 = function(arg0, arg1) {
        const ret = arg1.namespaceURI;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_naturalHeight_1effe4454cdc755f = function(arg0) {
        const ret = arg0.naturalHeight;
        return ret;
    };
    imports.wbg.__wbg_naturalWidth_2d1cd85377acd810 = function(arg0) {
        const ret = arg0.naturalWidth;
        return ret;
    };
    imports.wbg.__wbg_navigator_0a9bf1120e24fec2 = function(arg0) {
        const ret = arg0.navigator;
        return ret;
    };
    imports.wbg.__wbg_navigator_1577371c070c8947 = function(arg0) {
        const ret = arg0.navigator;
        return ret;
    };
    imports.wbg.__wbg_networkState_6aa3ffc7cc03355f = function(arg0) {
        const ret = arg0.networkState;
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
                    return __wbg_adapter_7593(a, state0.b, arg0, arg1);
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
    imports.wbg.__wbg_new_2ef971087cb43792 = function() { return handleError(function (arg0, arg1) {
        const ret = new OffscreenCanvas(arg0 >>> 0, arg1 >>> 0);
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
    imports.wbg.__wbg_new_58b33d452eaaedb4 = function() { return handleError(function (arg0, arg1) {
        const ret = new GPUValidationError(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_new_6377da097a44ce6e = function() { return handleError(function () {
        const ret = new Image();
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_new_797878d14eba4247 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new GPUUncapturedErrorEvent(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_7a91e41fe43b3c92 = function(arg0) {
        const ret = new Uint8ClampedArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_7e079fa25e135eb1 = function(arg0, arg1, arg2) {
        const ret = new DataView(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_81b108568d5aa95c = function() { return handleError(function (arg0, arg1) {
        const ret = new GPUOutOfMemoryError(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_new_d8422282c85804f7 = function() { return handleError(function () {
        const ret = new Document();
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_newwithhtmlcanvaselement_3a5631ab05e3fb6a = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithhtmlimageelement_750a48b60ce05ca2 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithhtmlvideoelement_11b4b93f00b2ca31 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithimagebitmap_b6e73b8f7bb08381 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_newwithoffscreencanvas_8da0f1f257cacc66 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_newwithvideoframe_0486a35b800cf5fd = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithwidth_dd20fe89c670cbc1 = function() { return handleError(function (arg0) {
        const ret = new Image(arg0 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_newwithwidthandheight_9a12e2386a96e3bd = function() { return handleError(function (arg0, arg1) {
        const ret = new Image(arg0 >>> 0, arg1 >>> 0);
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
    imports.wbg.__wbg_nextElementSibling_8472709bec4de113 = function(arg0) {
        const ret = arg0.nextElementSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_nextSibling_f17f68d089a20939 = function(arg0) {
        const ret = arg0.nextSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
    imports.wbg.__wbg_nodeName_ff3aa439a5af6311 = function(arg0, arg1) {
        const ret = arg1.nodeName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_nodeType_5e1153141daac26a = function(arg0) {
        const ret = arg0.nodeType;
        return ret;
    };
    imports.wbg.__wbg_nodeValue_6ff4f14870c43bd9 = function(arg0, arg1) {
        const ret = arg1.nodeValue;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = arg0.node;
        return ret;
    };
    imports.wbg.__wbg_nonce_2fe22e54b801941d = function(arg0, arg1) {
        const ret = arg1.nonce;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_normalize_1cd2333f94c462ad = function(arg0, arg1, arg2) {
        const ret = arg0.normalize(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_normalize_96d8e4ea8bdfb68f = function(arg0) {
        arg0.normalize();
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
    imports.wbg.__wbg_offsetHeight_4b2bc94377e10979 = function(arg0) {
        const ret = arg0.offsetHeight;
        return ret;
    };
    imports.wbg.__wbg_offsetLeft_0afdbda1fc3f098d = function(arg0) {
        const ret = arg0.offsetLeft;
        return ret;
    };
    imports.wbg.__wbg_offsetParent_eb6119f334bb7dda = function(arg0) {
        const ret = arg0.offsetParent;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_offsetTop_de8d0722bd1b211d = function(arg0) {
        const ret = arg0.offsetTop;
        return ret;
    };
    imports.wbg.__wbg_offsetWidth_3cf4cc9df4051078 = function(arg0) {
        const ret = arg0.offsetWidth;
        return ret;
    };
    imports.wbg.__wbg_offset_88faad4a1fb59e84 = function(arg0) {
        const ret = arg0.offset;
        return ret;
    };
    imports.wbg.__wbg_onLine_a406ab004b6ce1e7 = function(arg0) {
        const ret = arg0.onLine;
        return ret;
    };
    imports.wbg.__wbg_onLine_dd34eaeb7b810a04 = function(arg0) {
        const ret = arg0.onLine;
        return ret;
    };
    imports.wbg.__wbg_onSubmittedWorkDone_0ce4e551adbacd9e = function(arg0) {
        const ret = arg0.onSubmittedWorkDone();
        return ret;
    };
    imports.wbg.__wbg_onabort_2e2ac2e395183c04 = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onabort_b5ea29a4c152f513 = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onabort_b8f5636f3d2f4bd6 = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onafterprint_b8d4041fd193f636 = function(arg0) {
        const ret = arg0.onafterprint;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onafterscriptexecute_18ec083bc62a9e68 = function(arg0) {
        const ret = arg0.onafterscriptexecute;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_27d7f9984ff8ea1a = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_ba595daecd6b1b7d = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_f180ab321d423bb5 = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationend_7ea2673a6a6544d9 = function(arg0) {
        const ret = arg0.onanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationend_9ead56aecb63ee2b = function(arg0) {
        const ret = arg0.onanimationend;
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
    imports.wbg.__wbg_onanimationiteration_a1290172945e1ba5 = function(arg0) {
        const ret = arg0.onanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationiteration_e75ad013e68c0141 = function(arg0) {
        const ret = arg0.onanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_92396874a729eee9 = function(arg0) {
        const ret = arg0.onanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_c8e49799df9badc0 = function(arg0) {
        const ret = arg0.onanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_effef8f610de0329 = function(arg0) {
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
    imports.wbg.__wbg_onauxclick_43ffd9cb9c2684fd = function(arg0) {
        const ret = arg0.onauxclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onauxclick_abed98ea8740713b = function(arg0) {
        const ret = arg0.onauxclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeprint_a4a067b42aa34840 = function(arg0) {
        const ret = arg0.onbeforeprint;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforescriptexecute_c4ba92120853ecbf = function(arg0) {
        const ret = arg0.onbeforescriptexecute;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_2b3275d818607b0e = function(arg0) {
        const ret = arg0.onbeforetoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_66fac10f8dfa52b5 = function(arg0) {
        const ret = arg0.onbeforetoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_7b9762c6d6ef9d4a = function(arg0) {
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
    imports.wbg.__wbg_onblur_9fb6219be8fa73c5 = function(arg0) {
        const ret = arg0.onblur;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onblur_a0e369e759bd0976 = function(arg0) {
        const ret = arg0.onblur;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_aa6fa116f429fae1 = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_f3f4200a6bb131e7 = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_f9eccd54c0aee17d = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_2ccbd8be48ce3012 = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_47b716d02ceb938e = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_a75e354947f5deb3 = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_16059ceb1eef5090 = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_6953478e7128b81b = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_6bdd6647487c8d33 = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclick_0449e73ead0b26c1 = function(arg0) {
        const ret = arg0.onclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclick_322b6835bfb63aac = function(arg0) {
        const ret = arg0.onclick;
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
    imports.wbg.__wbg_onclose_71897454d15380a0 = function(arg0) {
        const ret = arg0.onclose;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclose_d22cbe24ab636f63 = function(arg0) {
        const ret = arg0.onclose;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_9c98e6bc6d7a151d = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_a50059a0670a7f15 = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_e58618a9ed2d2bd8 = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncopy_336a399abee3d88d = function(arg0) {
        const ret = arg0.oncopy;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncopy_ab8bf15ecbdbf9b4 = function(arg0) {
        const ret = arg0.oncopy;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncut_004fbff0f41522a7 = function(arg0) {
        const ret = arg0.oncut;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncut_09f3b341b2d970e8 = function(arg0) {
        const ret = arg0.oncut;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_622e2cff632fccb6 = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_b034756443cdb76c = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_c59b018f1dbc610a = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_5d49dc4d28d71f6d = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_8ec5f86b805a396f = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_a5ca8c8d117a89c4 = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_225446d7875ae5d2 = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_9b00b9e6e035b304 = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_fcb8f3af812d8952 = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_306974f029691962 = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_380aa3550be1d943 = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_473a56e29bccf6ed = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_0d3f4aded7f27c16 = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_19b52e38b562da16 = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_41061a05a5e5228c = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_8e89995907e3a82b = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_b9acd5ad689484cc = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_fdca2245d335ec87 = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_31aa6b76fa09ab78 = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_3613dbd00a1c2273 = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_376c1547697d4a2b = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_51d3814c4542854b = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_760c73e3256920cd = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_e6dd41a2a256e1e9 = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_42f44edfe20e8c53 = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_68525a87fd29df73 = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_fa00c482fda9d534 = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_4ae59c1507e1c0ca = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_4f52af7fe3f763c3 = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_77af8fb327b38047 = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_04a0cf081914d652 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_4291d0ab1300a310 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_ae3bd07ea842f938 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onencrypted_b620978f89bed963 = function(arg0) {
        const ret = arg0.onencrypted;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_55082d5a0a35dc4e = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_8962f493da7afb58 = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_efc1838c9ea9be21 = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_1436ba8bb39b7296 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_304fdb2135f3f1ff = function(arg0) {
        const ret = arg0.onerror;
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
    imports.wbg.__wbg_onfocus_6f4166fe4fbc0f8e = function(arg0) {
        const ret = arg0.onfocus;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfocus_d44357a2b5295574 = function(arg0) {
        const ret = arg0.onfocus;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfullscreenchange_cec09953e4bc8c58 = function(arg0) {
        const ret = arg0.onfullscreenchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfullscreenerror_599732dc201bc76d = function(arg0) {
        const ret = arg0.onfullscreenerror;
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
    imports.wbg.__wbg_ongotpointercapture_365f2b96587b3e39 = function(arg0) {
        const ret = arg0.ongotpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongotpointercapture_e5271dc970f43f77 = function(arg0) {
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
    imports.wbg.__wbg_oninput_b45e53f93f8ae0d0 = function(arg0) {
        const ret = arg0.oninput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninput_d52415f3ee7c7bd5 = function(arg0) {
        const ret = arg0.oninput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_27277280b5b0b929 = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_aac9f532a40a524f = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_dffc71511dbc5ff9 = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_569130f2b562439b = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_8927e228c1a36aee = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_a8732bd33e6a7de1 = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_19c7c8b46d109143 = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_6a783a0f6d5d78c8 = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_86ce478e888e0395 = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_45894a68001e94cf = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_a86ac008ef3d776c = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_b5de248215ee5afc = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlanguagechange_fab3ea5b146ac64a = function(arg0) {
        const ret = arg0.onlanguagechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onload_42c682a7ce68912a = function(arg0) {
        const ret = arg0.onload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onload_5cb59e1f23ff70e0 = function(arg0) {
        const ret = arg0.onload;
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
    imports.wbg.__wbg_onloadeddata_55e2e08c349301cc = function(arg0) {
        const ret = arg0.onloadeddata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadeddata_f94e72820ed5fac5 = function(arg0) {
        const ret = arg0.onloadeddata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_08629e2fdfc66c54 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_7dcd56590d837bd1 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_dd032ceea37cee99 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_338af3aa71ddabf5 = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_5fc96f2ed662d423 = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_ca292be1be9a2b11 = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_270c9755b4ddeada = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_aa0bb15042ab36ab = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_fdd38a5654810dab = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_6f321d3b980aa198 = function(arg0) {
        const ret = arg0.onlostpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_8c4e0dfabd623312 = function(arg0) {
        const ret = arg0.onlostpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_e0f94cc9c7f832e7 = function(arg0) {
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
    imports.wbg.__wbg_onmousedown_5235caa671485326 = function(arg0) {
        const ret = arg0.onmousedown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousedown_e92980d883b2faef = function(arg0) {
        const ret = arg0.onmousedown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_137c360577f89982 = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_6e05d5d9b0a6a39b = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_db57f5d8b4dd20e9 = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_4efa9f42ff88838b = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_9ba472fb29e563e4 = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_da2e36052a417634 = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousemove_7b9b746d4e2d2349 = function(arg0) {
        const ret = arg0.onmousemove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousemove_95a17156ce744248 = function(arg0) {
        const ret = arg0.onmousemove;
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
    imports.wbg.__wbg_onmouseout_62fc711209faae7e = function(arg0) {
        const ret = arg0.onmouseout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseout_b07200f071480ea5 = function(arg0) {
        const ret = arg0.onmouseout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_00a71a53ec9d58f4 = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_3a59a885342d6e59 = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_db6bdda3fb3bf6fc = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_78ce7dcdb1180893 = function(arg0) {
        const ret = arg0.onmouseup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_8c997fd9afb87a54 = function(arg0) {
        const ret = arg0.onmouseup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_f07a2f1da0d33bc1 = function(arg0) {
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
    imports.wbg.__wbg_onpaste_da0f9372ae327235 = function(arg0) {
        const ret = arg0.onpaste;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpaste_e0a323756ed6b45c = function(arg0) {
        const ret = arg0.onpaste;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_6a5ab6990ea4db9c = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_90144e2c29cf5a33 = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_c7f7b32de88397a8 = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_a1c06ea3278d25d0 = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_baa51301aef9e5d4 = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_fedeb6500093f49b = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_79430c633d65ae41 = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_af0929a07f880a1c = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_ddd6dc5cd5b542e2 = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_2ed491d8ac5da41d = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_5a1e9066513164b8 = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_be2469e326e4aae5 = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_3d9285a7acbbe96d = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_6055c78ae31b852e = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_991144fd7d31ac0c = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_1b6d1450565ef1c5 = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_8c2dd169ae0081d1 = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_b8c025e2bec9a14c = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_155529e3e7e314af = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_9430902af6b3f6d6 = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_a7f0c7566aab099d = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerlockchange_6af8a4f6c548bed3 = function(arg0) {
        const ret = arg0.onpointerlockchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerlockerror_bb31360a3e516ec4 = function(arg0) {
        const ret = arg0.onpointerlockerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_5cdbcf0e6180ef2f = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_79823b2399f24a39 = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_ba919342229a7521 = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_42f272c03fb19369 = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_c0ded2e1ad95bbb3 = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_fd8a6a295a66abab = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_21b352793ccb7c6a = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_9c6dee97e94da9ec = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_e5015da7695ac443 = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_61cff048bd2b3133 = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_64b0e362e234640a = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_b614d1d5e92a09c1 = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpopstate_e82d79b8cb323edc = function(arg0) {
        const ret = arg0.onpopstate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_1cad3933fcde2a26 = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_4f202162c844e5e0 = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_6b3edc0166fe5f29 = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_18539fbde5a5dcfd = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_6f54aee4ed797be2 = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_807c14559aeb7e9d = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreadystatechange_83349bded211f72f = function(arg0) {
        const ret = arg0.onreadystatechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_aab11c169b145fec = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_b4edceb75e7c0aa1 = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_fef6a167dd79f02c = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresize_3944166b0553d307 = function(arg0) {
        const ret = arg0.onresize;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresize_a581c3afe61181c3 = function(arg0) {
        const ret = arg0.onresize;
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
    imports.wbg.__wbg_onscroll_adc5cb4b3039fb06 = function(arg0) {
        const ret = arg0.onscroll;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onscroll_fd0ed4ad8ec870e2 = function(arg0) {
        const ret = arg0.onscroll;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_058400aba948d0ac = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_c9f623c789863f62 = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_ed778c07cce579df = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeking_7de04f2db8f3bdd9 = function(arg0) {
        const ret = arg0.onseeking;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeking_8b0bf311f906dd77 = function(arg0) {
        const ret = arg0.onseeking;
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
    imports.wbg.__wbg_onselect_728a189fbdc21db3 = function(arg0) {
        const ret = arg0.onselect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselect_9ed7f917fb41f1aa = function(arg0) {
        const ret = arg0.onselect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectionchange_603c363bc3f9c639 = function(arg0) {
        const ret = arg0.onselectionchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_1ad80798b2ca2c4e = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_232cfda197bf6c67 = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_fade53fd5be5b264 = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_40cd915c85b81b66 = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_ac8dcac456e1c345 = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_e6d79cf4273215cd = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_3d9a4e7de5a687e2 = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_4a5a5f4eab456aaf = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_784aaa320f435e7d = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstorage_a4d060477e453ac6 = function(arg0) {
        const ret = arg0.onstorage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsubmit_2d50ca72682bdf05 = function(arg0) {
        const ret = arg0.onsubmit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsubmit_926ec8e82c16b00c = function(arg0) {
        const ret = arg0.onsubmit;
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
    imports.wbg.__wbg_onsuspend_247414ea6e911dbb = function(arg0) {
        const ret = arg0.onsuspend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsuspend_f881501decae0991 = function(arg0) {
        const ret = arg0.onsuspend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_6d25aeb62aac074c = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_866c804b4704b5d0 = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_cd4525bbe2d0c466 = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_0935fffd438ba6f9 = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_1f4b7214898c74d7 = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_64f53aa8a38725a8 = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchcancel_9e2757f2aa6beb74 = function(arg0) {
        const ret = arg0.ontouchcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchcancel_e9ec2d7ef74f416d = function(arg0) {
        const ret = arg0.ontouchcancel;
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
    imports.wbg.__wbg_ontouchend_47e036e2c43228cc = function(arg0) {
        const ret = arg0.ontouchend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchend_90932f3cacded5aa = function(arg0) {
        const ret = arg0.ontouchend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_63149ea322ad12c9 = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_6a25867d94ec6d1f = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_863e3cfa3cce0a68 = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_87adfb94dc0ffbe1 = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_dcbfc08d5393c542 = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_e61c77717ae6930d = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitioncancel_1e32ba63e364fa23 = function(arg0) {
        const ret = arg0.ontransitioncancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitioncancel_324065105842b869 = function(arg0) {
        const ret = arg0.ontransitioncancel;
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
    imports.wbg.__wbg_ontransitionend_1e487a151ab2948f = function(arg0) {
        const ret = arg0.ontransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionend_96497628e0b79d17 = function(arg0) {
        const ret = arg0.ontransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_0138426f4467083f = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_94f47adb10ece571 = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_a49ecd52c0f6948c = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_04754fdecfc069a2 = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_59abfa1079b61388 = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_7865a02252d64d64 = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onuncapturederror_2178f249968e2153 = function(arg0) {
        const ret = arg0.onuncapturederror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onunload_8eba91685150944d = function(arg0) {
        const ret = arg0.onunload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvisibilitychange_ec7058d5cc6c666a = function(arg0) {
        const ret = arg0.onvisibilitychange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_924f97d72277931c = function(arg0) {
        const ret = arg0.onvolumechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_97865ddb6665f0b1 = function(arg0) {
        const ret = arg0.onvolumechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_e7616f18e93b37d2 = function(arg0) {
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
    imports.wbg.__wbg_onwaiting_703088cdecfc389b = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaiting_7a56a19d23cb2787 = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaiting_93aed298d80c6069 = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaitingforkey_7770ef55855f3821 = function(arg0) {
        const ret = arg0.onwaitingforkey;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_2a058fa9a76c562d = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_8b9ba148eded0ec2 = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_ce5027c7b1cc11b0 = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_343e48e9dd69ae6d = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_ba3792c51a9172b6 = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_df308eb37d2e719f = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_68c928c36bd2371c = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_b64b86dc88f514eb = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_c2e551c0df83f3d4 = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkittransitionend_86a9bec2b12c3dba = function(arg0) {
        const ret = arg0.onwebkittransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkittransitionend_a6961af31c96768e = function(arg0) {
        const ret = arg0.onwebkittransitionend;
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
    imports.wbg.__wbg_onwheel_9abf987341aa2b26 = function(arg0) {
        const ret = arg0.onwheel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwheel_bf58ac4d704b71de = function(arg0) {
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
    imports.wbg.__wbg_outerHTML_69175e02bad1633b = function(arg0, arg1) {
        const ret = arg1.outerHTML;
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
    imports.wbg.__wbg_ownerDocument_243e06ce3350b842 = function(arg0) {
        const ret = arg0.ownerDocument;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
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
    imports.wbg.__wbg_parentElement_be28a1a931f9c9b7 = function(arg0) {
        const ret = arg0.parentElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_parentNode_9de97a0e7973ea4e = function(arg0) {
        const ret = arg0.parentNode;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
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
    imports.wbg.__wbg_pauseTransformFeedback_247554b1d5e68f23 = function(arg0) {
        arg0.pauseTransformFeedback();
    };
    imports.wbg.__wbg_pause_b74c96d69f769518 = function() { return handleError(function (arg0) {
        arg0.pause();
    }, arguments) };
    imports.wbg.__wbg_paused_9b2affc0a8a62e86 = function(arg0) {
        const ret = arg0.paused;
        return ret;
    };
    imports.wbg.__wbg_performance_704644393c4d3310 = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_performance_c185c0cdc2766575 = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_pixelStorei_6aba5d04cdcaeaf6 = function(arg0, arg1, arg2) {
        arg0.pixelStorei(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_pixelStorei_c8520e4b46f4a973 = function(arg0, arg1, arg2) {
        arg0.pixelStorei(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_platform_2e1c03e9a5bb1868 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.platform;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_platform_faf02c487289f206 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.platform;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_play_f6ec5fc4e84b0d26 = function() { return handleError(function (arg0) {
        const ret = arg0.play();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_playbackRate_941c01b55b0d096e = function(arg0) {
        const ret = arg0.playbackRate;
        return ret;
    };
    imports.wbg.__wbg_pointerLockElement_4e5150cbf7338524 = function(arg0) {
        const ret = arg0.pointerLockElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_polygonOffset_773fe0017b2c8f51 = function(arg0, arg1, arg2) {
        arg0.polygonOffset(arg1, arg2);
    };
    imports.wbg.__wbg_polygonOffset_8c11c066486216c4 = function(arg0, arg1, arg2) {
        arg0.polygonOffset(arg1, arg2);
    };
    imports.wbg.__wbg_popDebugGroup_0289eb423d236961 = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popDebugGroup_240bb500cccf80ff = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popDebugGroup_394d0ad1c3f7003b = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popDebugGroup_e8b447d58e9c8507 = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popErrorScope_37df7a5518e8b238 = function(arg0) {
        const ret = arg0.popErrorScope();
        return ret;
    };
    imports.wbg.__wbg_pop_664cca873297c974 = function(arg0) {
        const ret = arg0.pop();
        return ret;
    };
    imports.wbg.__wbg_popover_828c365e46dc7ce3 = function(arg0, arg1) {
        const ret = arg1.popover;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_poster_fb5e5addb8a54199 = function(arg0, arg1) {
        const ret = arg1.poster;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_pow_35f95838ecd24e51 = function(arg0, arg1) {
        const ret = Math.pow(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_precision_50cfc1839ac683eb = function(arg0) {
        const ret = arg0.precision;
        return ret;
    };
    imports.wbg.__wbg_preferredStyleSheetSet_28e53bb115319c44 = function(arg0, arg1) {
        const ret = arg1.preferredStyleSheetSet;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_prefix_92cb53af0e357968 = function(arg0, arg1) {
        const ret = arg1.prefix;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_preload_d5254dcdb523b0b8 = function(arg0, arg1) {
        const ret = arg1.preload;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_prepend_04b7309229decadc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_prepend_06fcc36a94fdbe44 = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_09c5b1a9a242cdda = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_prepend_1d4e1718d1f0df90 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_prepend_4335675b4cb85d29 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_prepend_47a640dfe3e5d897 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_prepend_47cf00618dee30ac = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_prepend_536a5a2dc0b99b47 = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_5538faa84b09a6b6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_prepend_55daf28c90a866d5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_prepend_5700671ea3aa03f8 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.prepend(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_prepend_588b43a14c008700 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.prepend(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_prepend_690d72ad0d3c0f7d = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_6c29f21fb0e056ad = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_prepend_6f003dc48be3ab53 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_prepend_7932d0515fc873fc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_prepend_7b9e955010d10c8d = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_824d48fa2ef586be = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_838dd9ee5bd8c203 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_prepend_8bfb93e09f78c9f0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_prepend_90f52e21eaa9d66c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_prepend_95d2824ecd89abe3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_prepend_9cfe73dd33015874 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_prepend_9f5a957c1acd188f = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_a3da525bb466b44e = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_prepend_a97b7ed631e1ba5e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_prepend_b206b0cbb6befeed = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_b29254957962896f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_prepend_c647779f6c7740f5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_prepend_cc3b46c56520796e = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_cf58ce9d8698cd69 = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_d33367ec5622264a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_prepend_e2cf2dddc97445a7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_prepend_efaa1b7a3700d6a7 = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_f41ad48c22f1921b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_prepend_fb42315199d3b39a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
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
    imports.wbg.__wbg_previousElementSibling_d81a34c36fb8e60c = function(arg0) {
        const ret = arg0.previousElementSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_previousSibling_80448835719a478f = function(arg0) {
        const ret = arg0.previousSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
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
    imports.wbg.__wbg_product_7ced446945dd0a2c = function(arg0, arg1) {
        const ret = arg1.product;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_pushDebugGroup_62ac726c8370ca62 = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushDebugGroup_69e32dcc92396167 = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushDebugGroup_8d71ee8ed837ff7f = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushDebugGroup_c225b7c05fb78e94 = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushErrorScope_79bafe9790e688cf = function(arg0, arg1) {
        arg0.pushErrorScope(__wbindgen_enum_GpuErrorFilter[arg1]);
    };
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbg_queryCounterEXT_7aed85645b7ec1da = function(arg0, arg1, arg2) {
        arg0.queryCounterEXT(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_queryLocalFonts_4c6ef1525bf49dc4 = function() { return handleError(function (arg0) {
        const ret = arg0.queryLocalFonts();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_querySelectorAll_40998fd748f057ef = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_querySelectorAll_8ea0e513ba30ebd0 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_querySelector_c69f8b573958906b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_querySelector_d638ba83a95cf66a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
    imports.wbg.__wbg_queue_39d4f3bda761adef = function(arg0) {
        const ret = arg0.queue;
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
    imports.wbg.__wbg_rangeMax_e3230a3da7b3f9f5 = function(arg0) {
        const ret = arg0.rangeMax;
        return ret;
    };
    imports.wbg.__wbg_rangeMin_1f1ea3e43e524c2e = function(arg0) {
        const ret = arg0.rangeMin;
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
    imports.wbg.__wbg_readBuffer_1c35b1e4939f881d = function(arg0, arg1) {
        arg0.readBuffer(arg1 >>> 0);
    };
    imports.wbg.__wbg_readPixels_05b426266eb8041a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7 === 0 ? undefined : getArrayU8FromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_readPixels_094a0cfa1849193f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_2364d9a53e5f9112 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7 === 0 ? undefined : getArrayU8FromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_readPixels_2dea9d481633ea4c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7, arg8 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_readPixels_51a0c02cdee207a5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_70989b7060c483bc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_8fb71a3d279d51af = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7, arg8 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_readPixels_a6cbb21794452142 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_a94c189fa27e9685 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, getArrayU8FromWasm0(arg7, arg8), arg9 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_readPixels_cd64c5a7b0343355 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_dc11747a3fda0963 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readyState_017c08aa5e73517e = function(arg0) {
        const ret = arg0.readyState;
        return ret;
    };
    imports.wbg.__wbg_readyState_bcffb7ab5bdd0be6 = function(arg0, arg1) {
        const ret = arg1.readyState;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_reason_9afb6aa36aa88fae = function(arg0) {
        const ret = arg0.reason;
        return (__wbindgen_enum_GpuDeviceLostReason.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_reduceRight_3df34d923c3749da = function(arg0, arg1, arg2, arg3) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2, arg3) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_7321(a, state0.b, arg0, arg1, arg2, arg3);
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
                    return __wbg_adapter_7321(a, state0.b, arg0, arg1, arg2, arg3);
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
    imports.wbg.__wbg_referrerPolicy_5824f4e4a938ac13 = function(arg0, arg1) {
        const ret = arg1.referrerPolicy;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_referrer_580ee3c45c084e8e = function(arg0, arg1) {
        const ret = arg1.referrer;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_releaseCapture_a6590a6b3cf5698c = function(arg0) {
        arg0.releaseCapture();
    };
    imports.wbg.__wbg_releaseCapture_dd3d10daf228b676 = function(arg0) {
        arg0.releaseCapture();
    };
    imports.wbg.__wbg_releaseEvents_ebe41c227dcd8afc = function(arg0) {
        arg0.releaseEvents();
    };
    imports.wbg.__wbg_releasePointerCapture_e950e66cb5438c50 = function() { return handleError(function (arg0, arg1) {
        arg0.releasePointerCapture(arg1);
    }, arguments) };
    imports.wbg.__wbg_removeAttributeNS_e736616b2e57128c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.removeAttributeNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_removeAttribute_e419cd6726b4c62f = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_removeChild_841bf1dc802c0a2c = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.removeChild(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_removeEventListener_056dfe8c3d6c58f9 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_removeEventListener_d365ee1c2a7b08f0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0);
    }, arguments) };
    imports.wbg.__wbg_remove_e2d2659f3128c045 = function(arg0) {
        arg0.remove();
    };
    imports.wbg.__wbg_renderbufferStorageMultisample_13fbd5e58900c6fe = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.renderbufferStorageMultisample(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_renderbufferStorage_73e01ea83b8afab4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
    };
    imports.wbg.__wbg_renderbufferStorage_f010012bd3566942 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
    };
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
    imports.wbg.__wbg_replaceChild_326b82f8cdc8d78e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.replaceChild(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_replaceChildren_0bd3438a3f53bcbc = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    };
    imports.wbg.__wbg_replaceChildren_0cde4a5835cc04e7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_replaceChildren_1222837bce3e4dea = function(arg0, arg1, arg2) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_replaceChildren_17753bf5054eb998 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    };
    imports.wbg.__wbg_replaceChildren_20733292ae16a512 = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_22bc10f8beb1ba36 = function(arg0, arg1, arg2, arg3) {
        arg0.replaceChildren(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_replaceChildren_2b33dbed560a65d3 = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_30f4b9d52b1ad832 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_replaceChildren_347b3cb567bf3a3f = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_3b970c4f35d724dc = function(arg0, arg1, arg2) {
        arg0.replaceChildren(arg1, arg2);
    };
    imports.wbg.__wbg_replaceChildren_4627e850d0c161ab = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_replaceChildren_5af779419b8929d2 = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_66c5b4b7892f4fad = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    };
    imports.wbg.__wbg_replaceChildren_6d33d33d55922e3d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_replaceChildren_6e774f4d5b034e3f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_replaceChildren_76313e54b4e52f30 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_replaceChildren_7a679e67c91ebea0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    };
    imports.wbg.__wbg_replaceChildren_86be1d3273036547 = function(arg0, arg1, arg2) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_replaceChildren_8a7a8472ba116e8a = function(arg0, arg1, arg2) {
        arg0.replaceChildren(arg1, arg2);
    };
    imports.wbg.__wbg_replaceChildren_9873f9dd9d135415 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    };
    imports.wbg.__wbg_replaceChildren_99ed08e6719d54fe = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_replaceChildren_9dce32364efb7c20 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    };
    imports.wbg.__wbg_replaceChildren_a72805fcb5b08ac4 = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_b58828217fe029bc = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_b768724f68f73832 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_replaceChildren_c30a1fe20d0076ef = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_c372b19c6f97fcb5 = function(arg0, arg1) {
        arg0.replaceChildren(arg1);
    };
    imports.wbg.__wbg_replaceChildren_dab910c3fca6f436 = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_e1e9f14a5fdfbc6f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_replaceChildren_e6302b17d30b8661 = function(arg0, arg1, arg2, arg3) {
        arg0.replaceChildren(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_replaceChildren_f3c01b44221abc2f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_replaceChildren_f54821b1211ed288 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_replaceChildren_f68ce96fbe87fb55 = function(arg0, arg1) {
        arg0.replaceChildren(arg1);
    };
    imports.wbg.__wbg_replaceChildren_f77dd26e6631649d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    };
    imports.wbg.__wbg_replaceChildren_ff1183ba30c1b5df = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_replaceChildren_ffc4077396f6f3e5 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    };
    imports.wbg.__wbg_replaceWith_07dc0e89dbf1f3de = function() { return handleError(function (arg0, arg1) {
        arg0.replaceWith(...arg1);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_1f57e7b7ea0b263b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.replaceWith(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_20d38d4bc6bc819f = function() { return handleError(function (arg0, arg1) {
        arg0.replaceWith(...arg1);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_411fbd5b772fb43e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceWith(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_446668896c857e7c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_4e901cd6cbf9e0df = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_59fa76470d45d214 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_5fbb32f47e84e018 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.replaceWith(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_7d5b07c48ab96ee5 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.replaceWith(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_8406bb9ab7c2013c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_8ca783a4cb8b40f8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.replaceWith(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_94f37c8110c008da = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_9ce9927e3141d0f6 = function() { return handleError(function (arg0, arg1) {
        arg0.replaceWith(arg1);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_9ecf74b367dbb75e = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_a2cc4468787e6ded = function() { return handleError(function (arg0) {
        arg0.replaceWith();
    }, arguments) };
    imports.wbg.__wbg_replaceWith_b8a096e1e3c8edad = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceWith(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_c135a0ded50e0275 = function() { return handleError(function (arg0) {
        arg0.replaceWith();
    }, arguments) };
    imports.wbg.__wbg_replaceWith_e8b98e1bba4c43ca = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
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
    imports.wbg.__wbg_requestAdapter_55d15e6d14e8392c = function(arg0, arg1) {
        const ret = arg0.requestAdapter(arg1);
        return ret;
    };
    imports.wbg.__wbg_requestAdapter_d3963964c51549c6 = function(arg0) {
        const ret = arg0.requestAdapter();
        return ret;
    };
    imports.wbg.__wbg_requestAnimationFrame_d7fd890aaefc3246 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestAnimationFrame(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestDevice_66e864eaf1ffbb38 = function(arg0, arg1) {
        const ret = arg0.requestDevice(arg1);
        return ret;
    };
    imports.wbg.__wbg_requestDevice_d2f68725b9e99d48 = function(arg0) {
        const ret = arg0.requestDevice();
        return ret;
    };
    imports.wbg.__wbg_requestFullscreen_153661987bd37c4a = function() { return handleError(function (arg0) {
        arg0.requestFullscreen();
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
    imports.wbg.__wbg_requestPointerLock_304dd9ccfe548767 = function(arg0) {
        arg0.requestPointerLock();
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
    imports.wbg.__wbg_resolveQuerySet_72ab4dbb04dbded9 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.resolveQuerySet(arg1, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
    };
    imports.wbg.__wbg_resolveQuerySet_87b8b6225aa81187 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.resolveQuerySet(arg1, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
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
    imports.wbg.__wbg_restoreContext_cac6117faf1c29fb = function(arg0) {
        arg0.restoreContext();
    };
    imports.wbg.__wbg_resumeTransformFeedback_6f32da1d21ccba72 = function(arg0) {
        arg0.resumeTransformFeedback();
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
    imports.wbg.__wbg_sampleCount_8c4d54cf65a1644e = function(arg0) {
        const ret = arg0.sampleCount;
        return ret;
    };
    imports.wbg.__wbg_sampleCoverage_5b5d254cc81cf5d3 = function(arg0, arg1, arg2) {
        arg0.sampleCoverage(arg1, arg2 !== 0);
    };
    imports.wbg.__wbg_sampleCoverage_f283cfb9675b93c4 = function(arg0, arg1, arg2) {
        arg0.sampleCoverage(arg1, arg2 !== 0);
    };
    imports.wbg.__wbg_samplerParameterf_909baf50360c94d4 = function(arg0, arg1, arg2, arg3) {
        arg0.samplerParameterf(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_samplerParameteri_d5c292172718da63 = function(arg0, arg1, arg2, arg3) {
        arg0.samplerParameteri(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_scissor_e917a332f67a5d30 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.scissor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_scissor_eb177ca33bf24a44 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.scissor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_screenX_a83f227e7f12ec27 = function() { return handleError(function (arg0) {
        const ret = arg0.screenX;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_screenY_e4bb791391d3daad = function() { return handleError(function (arg0) {
        const ret = arg0.screenY;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scrollBy_3f09a1f58879e96f = function(arg0) {
        arg0.scrollBy();
    };
    imports.wbg.__wbg_scrollBy_59451c12501a014f = function(arg0, arg1, arg2) {
        arg0.scrollBy(arg1, arg2);
    };
    imports.wbg.__wbg_scrollBy_61d7f59eb94e7b27 = function(arg0, arg1, arg2) {
        arg0.scrollBy(arg1, arg2);
    };
    imports.wbg.__wbg_scrollBy_695675804a27c286 = function(arg0) {
        arg0.scrollBy();
    };
    imports.wbg.__wbg_scrollHeight_63d2b8dad4baacb9 = function(arg0) {
        const ret = arg0.scrollHeight;
        return ret;
    };
    imports.wbg.__wbg_scrollHeight_6c5a5fc7dbce3f36 = function(arg0) {
        const ret = arg0.scrollHeight;
        return ret;
    };
    imports.wbg.__wbg_scrollIntoView_281bcffa62eea382 = function(arg0, arg1) {
        arg0.scrollIntoView(arg1 !== 0);
    };
    imports.wbg.__wbg_scrollIntoView_d13094450218e94b = function(arg0) {
        arg0.scrollIntoView();
    };
    imports.wbg.__wbg_scrollLeft_b195ce13f48fdfef = function(arg0) {
        const ret = arg0.scrollLeft;
        return ret;
    };
    imports.wbg.__wbg_scrollTo_1933346951679624 = function(arg0) {
        arg0.scrollTo();
    };
    imports.wbg.__wbg_scrollTo_1df5fd546af8f000 = function(arg0, arg1, arg2) {
        arg0.scrollTo(arg1, arg2);
    };
    imports.wbg.__wbg_scrollTo_26cd993048111460 = function(arg0, arg1, arg2) {
        arg0.scrollTo(arg1, arg2);
    };
    imports.wbg.__wbg_scrollTo_5cadaba2a93250fe = function(arg0) {
        arg0.scrollTo();
    };
    imports.wbg.__wbg_scrollTop_8a5774351f38b4cb = function(arg0) {
        const ret = arg0.scrollTop;
        return ret;
    };
    imports.wbg.__wbg_scrollTop_fa6a185d62b9a4ab = function(arg0) {
        const ret = arg0.scrollTop;
        return ret;
    };
    imports.wbg.__wbg_scrollWidth_14cd601c190e01a7 = function(arg0) {
        const ret = arg0.scrollWidth;
        return ret;
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
    imports.wbg.__wbg_scroll_5d72e013ac976d40 = function(arg0) {
        arg0.scroll();
    };
    imports.wbg.__wbg_scroll_b3b78eb7384e5438 = function(arg0, arg1, arg2) {
        arg0.scroll(arg1, arg2);
    };
    imports.wbg.__wbg_scroll_bf72969f3afda887 = function(arg0) {
        arg0.scroll();
    };
    imports.wbg.__wbg_scrollingElement_5844148f6bfe4109 = function(arg0) {
        const ret = arg0.scrollingElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
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
    imports.wbg.__wbg_seekToNextFrame_2dd1725aad7278d0 = function() { return handleError(function (arg0) {
        const ret = arg0.seekToNextFrame();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_seeking_c0427be38e698dcd = function(arg0) {
        const ret = arg0.seeking;
        return ret;
    };
    imports.wbg.__wbg_select_a63ef9df6c7b7d0d = function(arg0, arg1) {
        const ret = arg0.select(arg1);
        return ret;
    };
    imports.wbg.__wbg_selectedStyleSheetSet_0d588156064213c6 = function(arg0, arg1) {
        const ret = arg1.selectedStyleSheetSet;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_setAttributeNS_e6b1d3fe34fab2a0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setAttributeNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_setAttribute_2704501201f15687 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_025f81a3e5cbebec = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_07e28ef3b746a065 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_0e104a84d56e46e9 = function(arg0, arg1, arg2, arg3) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setBindGroup_10b49391bd0bfb4d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_1adf05c538dbed7c = function(arg0, arg1, arg2, arg3) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setBindGroup_1f268f3b312a0803 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_20b4e4274a1839df = function(arg0, arg1, arg2, arg3) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setBindGroup_217a90209c20d822 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_250647fe6341e1db = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_2aab2a8dc3a73c1f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_2e57c30e0e80fdec = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_48b8ae36c74aa552 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_54dd074228f585f3 = function(arg0, arg1, arg2) {
        arg0.setBindGroup(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setBindGroup_74272bf1d0880a9c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_77fc1c2c49ddcff0 = function(arg0, arg1, arg2) {
        arg0.setBindGroup(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setBindGroup_92f5fbfaea0311a0 = function(arg0, arg1, arg2) {
        arg0.setBindGroup(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setBindGroup_b966448206045bdd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_d128f6444d3365c6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBlendConstant_920f0d81f234d8ad = function() { return handleError(function (arg0, arg1) {
        arg0.setBlendConstant(arg1);
    }, arguments) };
    imports.wbg.__wbg_setBlendConstant_960990e1a1200237 = function() { return handleError(function (arg0, arg1) {
        arg0.setBlendConstant(arg1);
    }, arguments) };
    imports.wbg.__wbg_setCapture_20c16892d8c59000 = function(arg0, arg1) {
        arg0.setCapture(arg1 !== 0);
    };
    imports.wbg.__wbg_setCapture_ff88024d5b6f3fa1 = function(arg0) {
        arg0.setCapture();
    };
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
    imports.wbg.__wbg_setIndexBuffer_0b6ab171cf8c55ea = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_2a751165ba30a6a9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_35ece9a761fcf324 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_4e7ed6a4323b8548 = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_7623400b4afc81ad = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_784586d50b774775 = function(arg0, arg1, arg2) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2]);
    };
    imports.wbg.__wbg_setIndexBuffer_797caf0d1eda40ac = function(arg0, arg1, arg2) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2]);
    };
    imports.wbg.__wbg_setIndexBuffer_8282bd9ab99d7946 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_9ad7a28aac1c68f5 = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_9feeacf84101a479 = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3);
    };
    imports.wbg.__wbg_setIndexBuffer_d3a43096e5053bf4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_e0d1c48e97c34742 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_e8e5f34d3adc32b1 = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3);
    };
    imports.wbg.__wbg_setIndexBuffer_f01c3fcc5705f189 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4 >>> 0);
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
    imports.wbg.__wbg_setPipeline_1078f98b32bb5f3d = function(arg0, arg1) {
        arg0.setPipeline(arg1);
    };
    imports.wbg.__wbg_setPipeline_6dd7dffa6e7d7496 = function(arg0, arg1) {
        arg0.setPipeline(arg1);
    };
    imports.wbg.__wbg_setPipeline_95448e1c3bb1e875 = function(arg0, arg1) {
        arg0.setPipeline(arg1);
    };
    imports.wbg.__wbg_setPointerCapture_c04dafaf4d00ffad = function() { return handleError(function (arg0, arg1) {
        arg0.setPointerCapture(arg1);
    }, arguments) };
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
    imports.wbg.__wbg_setScissorRect_994e1c38862bc50f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setSeconds_273c40b0a2343530 = function(arg0, arg1) {
        const ret = arg0.setSeconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setStencilReference_31241469963257e7 = function(arg0, arg1) {
        arg0.setStencilReference(arg1 >>> 0);
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
    imports.wbg.__wbg_setVertexBuffer_03d0da62f243d741 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_26bdb7e7a07afa74 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_2b69bb305cf97bb6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_2f3670c5971e57a6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_418ded66fc9344ee = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_50ecd5772fd1d706 = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_56f8b7f73d97fa75 = function(arg0, arg1, arg2) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setVertexBuffer_64452246fb789d75 = function(arg0, arg1, arg2) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setVertexBuffer_844be5445c5afa3c = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setVertexBuffer_a5351141d459f106 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_b562a8a167090c01 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_b9309cebfcbbfea3 = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_ba00b58c75c4c6b8 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_f6e54c6e90ef26ce = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setViewport_91319cc7a634f387 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setViewport(arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_setVisible_cfac4e5ab38833f5 = function(arg0, arg1) {
        arg0.setVisible(arg1 !== 0);
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
    imports.wbg.__wbg_seta_add312ccdfbfaa2d = function(arg0, arg1) {
        arg0.a = arg1;
    };
    imports.wbg.__wbg_setaccessKey_c17e42618306f843 = function(arg0, arg1, arg2) {
        arg0.accessKey = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setaccess_c87a9bdb5c449e6b = function(arg0, arg1) {
        arg0.access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
    };
    imports.wbg.__wbg_setaddressmodeu_2ff1a762cca3e679 = function(arg0, arg1) {
        arg0.addressModeU = __wbindgen_enum_GpuAddressMode[arg1];
    };
    imports.wbg.__wbg_setaddressmodev_1322b1b0dafa29ef = function(arg0, arg1) {
        arg0.addressModeV = __wbindgen_enum_GpuAddressMode[arg1];
    };
    imports.wbg.__wbg_setaddressmodew_1128071f5dcb4e54 = function(arg0, arg1) {
        arg0.addressModeW = __wbindgen_enum_GpuAddressMode[arg1];
    };
    imports.wbg.__wbg_setalign_43624e23f8d24840 = function(arg0, arg1, arg2) {
        arg0.align = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setalpha_23751af59d391d98 = function(arg0, arg1) {
        arg0.alpha = arg1;
    };
    imports.wbg.__wbg_setalphamode_1192a40e9bd8c3aa = function(arg0, arg1) {
        arg0.alphaMode = __wbindgen_enum_GpuCanvasAlphaMode[arg1];
    };
    imports.wbg.__wbg_setalphatocoverageenabled_9700e84c77d52727 = function(arg0, arg1) {
        arg0.alphaToCoverageEnabled = arg1 !== 0;
    };
    imports.wbg.__wbg_setalt_1613e90331441bf5 = function(arg0, arg1, arg2) {
        arg0.alt = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setarraylayercount_3a8ad1adab3aded1 = function(arg0, arg1) {
        arg0.arrayLayerCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_setarraystride_5508d074b809d568 = function(arg0, arg1) {
        arg0.arrayStride = arg1;
    };
    imports.wbg.__wbg_setaspect_4066a62e6528c589 = function(arg0, arg1) {
        arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    };
    imports.wbg.__wbg_setaspect_69b543f897d0388e = function(arg0, arg1) {
        arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    };
    imports.wbg.__wbg_setaspect_a4fa638f0ab8b4c1 = function(arg0, arg1) {
        arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    };
    imports.wbg.__wbg_setattributes_aa15086089274167 = function(arg0, arg1) {
        arg0.attributes = arg1;
    };
    imports.wbg.__wbg_setautofocus_6ca6f0ab5a566c21 = function() { return handleError(function (arg0, arg1) {
        arg0.autofocus = arg1 !== 0;
    }, arguments) };
    imports.wbg.__wbg_setautoplay_9b329e0c67586a6b = function(arg0, arg1) {
        arg0.autoplay = arg1 !== 0;
    };
    imports.wbg.__wbg_setb_162f487856c3bad9 = function(arg0, arg1) {
        arg0.b = arg1;
    };
    imports.wbg.__wbg_setbasearraylayer_85c4780859e3e025 = function(arg0, arg1) {
        arg0.baseArrayLayer = arg1 >>> 0;
    };
    imports.wbg.__wbg_setbasemiplevel_f90525112a282a1d = function(arg0, arg1) {
        arg0.baseMipLevel = arg1 >>> 0;
    };
    imports.wbg.__wbg_setbeginningofpasswriteindex_1175eec9e005d722 = function(arg0, arg1) {
        arg0.beginningOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_setbeginningofpasswriteindex_c8a62bc66645f5cd = function(arg0, arg1) {
        arg0.beginningOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_setbindgrouplayouts_54f980eb55071c87 = function(arg0, arg1) {
        arg0.bindGroupLayouts = arg1;
    };
    imports.wbg.__wbg_setbinding_1ddbf5eebabdc48c = function(arg0, arg1) {
        arg0.binding = arg1 >>> 0;
    };
    imports.wbg.__wbg_setbinding_5ea4d52c77434dfa = function(arg0, arg1) {
        arg0.binding = arg1 >>> 0;
    };
    imports.wbg.__wbg_setblend_4a45a53ea0e4706e = function(arg0, arg1) {
        arg0.blend = arg1;
    };
    imports.wbg.__wbg_setbody_09aac2a7e93b4f62 = function(arg0, arg1) {
        arg0.body = arg1;
    };
    imports.wbg.__wbg_setborder_c566202daa581ff8 = function(arg0, arg1, arg2) {
        arg0.border = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setbubbles_5abf71a583dc30e0 = function(arg0, arg1) {
        arg0.bubbles = arg1 !== 0;
    };
    imports.wbg.__wbg_setbuffer_2dac3e64a7099038 = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_setbuffer_489d923366e1f63a = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_setbuffer_a3a7f00fa797e1d1 = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_setbuffers_d5f54ba1d3368c00 = function(arg0, arg1) {
        arg0.buffers = arg1;
    };
    imports.wbg.__wbg_setbytesperrow_61fdc31fb1e978f4 = function(arg0, arg1) {
        arg0.bytesPerRow = arg1 >>> 0;
    };
    imports.wbg.__wbg_setbytesperrow_7eb4ea50ad336975 = function(arg0, arg1) {
        arg0.bytesPerRow = arg1 >>> 0;
    };
    imports.wbg.__wbg_setcancelBubble_67a62cf82c269e56 = function(arg0, arg1) {
        arg0.cancelBubble = arg1 !== 0;
    };
    imports.wbg.__wbg_setcancelable_7125162e405488cc = function(arg0, arg1) {
        arg0.cancelable = arg1 !== 0;
    };
    imports.wbg.__wbg_setcause_180f5110152d3ce3 = function(arg0, arg1) {
        arg0.cause = arg1;
    };
    imports.wbg.__wbg_setclassName_6bdd0705e646d028 = function(arg0, arg1, arg2) {
        arg0.className = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setclearvalue_1d26e1b07873908a = function(arg0, arg1) {
        arg0.clearValue = arg1;
    };
    imports.wbg.__wbg_setcode_e66de35c80aa100f = function(arg0, arg1, arg2) {
        arg0.code = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setcolor_8d4bfc735001f4bd = function(arg0, arg1) {
        arg0.color = arg1;
    };
    imports.wbg.__wbg_setcolorattachments_6118b962baa6088d = function(arg0, arg1) {
        arg0.colorAttachments = arg1;
    };
    imports.wbg.__wbg_setcolorformats_fb2449e629a4c19b = function(arg0, arg1) {
        arg0.colorFormats = arg1;
    };
    imports.wbg.__wbg_setcompare_019e85bf2bf22bc8 = function(arg0, arg1) {
        arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
    };
    imports.wbg.__wbg_setcompare_3a69aad67f43501e = function(arg0, arg1) {
        arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
    };
    imports.wbg.__wbg_setcompilationhints_dfdcf032c3e3e358 = function(arg0, arg1) {
        arg0.compilationHints = arg1;
    };
    imports.wbg.__wbg_setcomposed_be5cf57e9890db94 = function(arg0, arg1) {
        arg0.composed = arg1 !== 0;
    };
    imports.wbg.__wbg_setcompute_7e84d836a17ec8dc = function(arg0, arg1) {
        arg0.compute = arg1;
    };
    imports.wbg.__wbg_setconstants_1db05109bef2f43b = function(arg0, arg1) {
        arg0.constants = arg1;
    };
    imports.wbg.__wbg_setconstants_4c01b7ba4ea259a9 = function(arg0, arg1) {
        arg0.constants = arg1;
    };
    imports.wbg.__wbg_setconstants_e5d7768e90117b11 = function(arg0, arg1) {
        arg0.constants = arg1;
    };
    imports.wbg.__wbg_setcontentEditable_de1619757b8f1f17 = function(arg0, arg1, arg2) {
        arg0.contentEditable = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setcontrols_01ad48dc4e49e469 = function(arg0, arg1) {
        arg0.controls = arg1 !== 0;
    };
    imports.wbg.__wbg_setcount_2013aa835878f321 = function(arg0, arg1) {
        arg0.count = arg1 >>> 0;
    };
    imports.wbg.__wbg_setcount_d128a4ba77a20008 = function(arg0, arg1) {
        arg0.count = arg1 >>> 0;
    };
    imports.wbg.__wbg_setcrossOrigin_3fd0c2bb1c09e80a = function(arg0, arg1, arg2) {
        arg0.crossOrigin = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setcrossOrigin_999029ac31b6f930 = function(arg0, arg1, arg2) {
        arg0.crossOrigin = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setcullmode_e82736bddd8d5a5c = function(arg0, arg1) {
        arg0.cullMode = __wbindgen_enum_GpuCullMode[arg1];
    };
    imports.wbg.__wbg_setcurrentTime_64727eddd3966512 = function(arg0, arg1) {
        arg0.currentTime = arg1;
    };
    imports.wbg.__wbg_setdecoding_d3608991a1d31826 = function(arg0, arg1, arg2) {
        arg0.decoding = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setdefaultMuted_f95ae6c32ac584ee = function(arg0, arg1) {
        arg0.defaultMuted = arg1 !== 0;
    };
    imports.wbg.__wbg_setdefaultPlaybackRate_26f6029e808cc695 = function(arg0, arg1) {
        arg0.defaultPlaybackRate = arg1;
    };
    imports.wbg.__wbg_setdefaultqueue_e0ac537b4a88117b = function(arg0, arg1) {
        arg0.defaultQueue = arg1;
    };
    imports.wbg.__wbg_setdepthbias_dc092ae40ce06777 = function(arg0, arg1) {
        arg0.depthBias = arg1;
    };
    imports.wbg.__wbg_setdepthbiasclamp_30724e55c04b7132 = function(arg0, arg1) {
        arg0.depthBiasClamp = arg1;
    };
    imports.wbg.__wbg_setdepthbiasslopescale_3047f42a19dd1d21 = function(arg0, arg1) {
        arg0.depthBiasSlopeScale = arg1;
    };
    imports.wbg.__wbg_setdepthclearvalue_e09b29c35f439d38 = function(arg0, arg1) {
        arg0.depthClearValue = arg1;
    };
    imports.wbg.__wbg_setdepthcompare_7ff390bcd4cbc798 = function(arg0, arg1) {
        arg0.depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
    };
    imports.wbg.__wbg_setdepthfailop_32e5a25f8472872a = function(arg0, arg1) {
        arg0.depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
    };
    imports.wbg.__wbg_setdepthloadop_5292e3e4542c7770 = function(arg0, arg1) {
        arg0.depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
    };
    imports.wbg.__wbg_setdepthorarraylayers_57e35a31ded46b97 = function(arg0, arg1) {
        arg0.depthOrArrayLayers = arg1 >>> 0;
    };
    imports.wbg.__wbg_setdepthreadonly_72ff2bc6fc166fb6 = function(arg0, arg1) {
        arg0.depthReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_setdepthreadonly_8e4aa6065b3f0cb1 = function(arg0, arg1) {
        arg0.depthReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_setdepthslice_bdd1471feb1f8cda = function(arg0, arg1) {
        arg0.depthSlice = arg1 >>> 0;
    };
    imports.wbg.__wbg_setdepthstencil_2708265354655cab = function(arg0, arg1) {
        arg0.depthStencil = arg1;
    };
    imports.wbg.__wbg_setdepthstencilattachment_ef75a68ffe787e5a = function(arg0, arg1) {
        arg0.depthStencilAttachment = arg1;
    };
    imports.wbg.__wbg_setdepthstencilformat_be719755f3367e3a = function(arg0, arg1) {
        arg0.depthStencilFormat = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setdepthstoreop_a7eddf1211b8cf40 = function(arg0, arg1) {
        arg0.depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
    };
    imports.wbg.__wbg_setdepthwriteenabled_acc3c3e7425182f8 = function(arg0, arg1) {
        arg0.depthWriteEnabled = arg1 !== 0;
    };
    imports.wbg.__wbg_setdevice_44b06c4615b5e253 = function(arg0, arg1) {
        arg0.device = arg1;
    };
    imports.wbg.__wbg_setdimension_1e40af745768ac00 = function(arg0, arg1) {
        arg0.dimension = __wbindgen_enum_GpuTextureDimension[arg1];
    };
    imports.wbg.__wbg_setdimension_8523a7df804e7839 = function(arg0, arg1) {
        arg0.dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    };
    imports.wbg.__wbg_setdir_09c088186d759f70 = function(arg0, arg1, arg2) {
        arg0.dir = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setdir_b4e481c92bdd1ab4 = function(arg0, arg1, arg2) {
        arg0.dir = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setdraggable_0d92c364baadbcd3 = function(arg0, arg1) {
        arg0.draggable = arg1 !== 0;
    };
    imports.wbg.__wbg_setdstfactor_f1f99957519ecc26 = function(arg0, arg1) {
        arg0.dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
    };
    imports.wbg.__wbg_setendofpasswriteindex_7e0b2037985d92b3 = function(arg0, arg1) {
        arg0.endOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_setendofpasswriteindex_c9e77fba223f5e64 = function(arg0, arg1) {
        arg0.endOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_setentries_5ebe60dce5e74a0b = function(arg0, arg1) {
        arg0.entries = arg1;
    };
    imports.wbg.__wbg_setentries_9e330e1730f04662 = function(arg0, arg1) {
        arg0.entries = arg1;
    };
    imports.wbg.__wbg_setentrypoint_0a1a32e09949ab1d = function(arg0, arg1, arg2) {
        arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setentrypoint_0dd252068a92e7b1 = function(arg0, arg1, arg2) {
        arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setentrypoint_f8a6dd312fc366f9 = function(arg0, arg1, arg2) {
        arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_seterror_8519396a9f0b16fe = function(arg0, arg1) {
        arg0.error = arg1;
    };
    imports.wbg.__wbg_setexternaltexture_c45a65eda8f1c7e7 = function(arg0, arg1) {
        arg0.externalTexture = arg1;
    };
    imports.wbg.__wbg_setfailop_30e3f1483250eade = function(arg0, arg1) {
        arg0.failOp = __wbindgen_enum_GpuStencilOperation[arg1];
    };
    imports.wbg.__wbg_setfeaturelevel_d3ed7ed75c310c84 = function(arg0, arg1, arg2) {
        arg0.featureLevel = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setflipy_008d87fb5d2aaed0 = function(arg0, arg1) {
        arg0.flipY = arg1 !== 0;
    };
    imports.wbg.__wbg_setforcefallbackadapter_e1ba817aee509a0c = function(arg0, arg1) {
        arg0.forceFallbackAdapter = arg1 !== 0;
    };
    imports.wbg.__wbg_setformat_071b082598e71ae2 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setformat_2a57c4eddb717f46 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuVertexFormat[arg1];
    };
    imports.wbg.__wbg_setformat_45c59d08eefdcb12 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setformat_71f884d31aabe541 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setformat_726ed8f81a287fdc = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setformat_8530b9d25ea51775 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setformat_d5c08abcb3a02a26 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_setfragment_a6d6aa2f648896c5 = function(arg0, arg1) {
        arg0.fragment = arg1;
    };
    imports.wbg.__wbg_setfrontface_fccdd9171df26b56 = function(arg0, arg1) {
        arg0.frontFace = __wbindgen_enum_GpuFrontFace[arg1];
    };
    imports.wbg.__wbg_setg_d7b95d11c12af1cb = function(arg0, arg1) {
        arg0.g = arg1;
    };
    imports.wbg.__wbg_sethasdynamicoffset_dcbae080558be467 = function(arg0, arg1) {
        arg0.hasDynamicOffset = arg1 !== 0;
    };
    imports.wbg.__wbg_setheight_28e79506f626af82 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_setheight_433680330c9420c3 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_setheight_6053b37a3d7b8f53 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_setheight_71fa269106b747cd = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_setheight_da683a33fa99843c = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_sethidden_c9dddd5ae4b3314f = function(arg0, arg1) {
        arg0.hidden = arg1 !== 0;
    };
    imports.wbg.__wbg_sethspace_d9911dd68bc81d3c = function(arg0, arg1) {
        arg0.hspace = arg1 >>> 0;
    };
    imports.wbg.__wbg_setid_d1300d55a412791b = function(arg0, arg1, arg2) {
        arg0.id = getStringFromWasm0(arg1, arg2);
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
    imports.wbg.__wbg_setinert_7d47aa9e7a135f47 = function(arg0, arg1) {
        arg0.inert = arg1 !== 0;
    };
    imports.wbg.__wbg_setinnerHTML_31bde41f835786f7 = function(arg0, arg1, arg2) {
        arg0.innerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setinnerHeight_1163c1855c6350f9 = function() { return handleError(function (arg0, arg1) {
        arg0.innerHeight = arg1;
    }, arguments) };
    imports.wbg.__wbg_setinnerText_b11978b8158639c4 = function(arg0, arg1, arg2) {
        arg0.innerText = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setinnerWidth_c68e5f72431b90f3 = function() { return handleError(function (arg0, arg1) {
        arg0.innerWidth = arg1;
    }, arguments) };
    imports.wbg.__wbg_setisMap_988c49dd85b91f23 = function(arg0, arg1) {
        arg0.isMap = arg1 !== 0;
    };
    imports.wbg.__wbg_setlabel_03ef288b104476b5 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_0c713e07d4ef3264 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_1183ccaccddf4c32 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_1336753c9120caaf = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_24bef27418569cd7 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_36f22959c06ec4b6 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_3d8a20f328073061 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_42e0e4bce180f34b = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_43546b3aada77c03 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_491466139034563c = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_52035d5a523c8285 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_53b47ffdebccf638 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_6d317656a2b3dea6 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_72d75062f0a26322 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_7ffda3ed69c72b85 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_81a109feea612160 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_828e6fe16c83ad61 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_8bdb11c776bc2378 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_90703bf72945f91b = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_92039809cbdba121 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_9553d04daccb286a = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_95bae3d54f33d3c6 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_9681b7d2ca0a570f = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_9d2294e53a76244f = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_a1c8caea9f6c17d7 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_a3e682ef8c10c947 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_a9c832a66749cc17 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_acbff10cb9bf18bc = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_b3a2eb634bb9a3c7 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_c30b527dc52048c0 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_c4f12c66dd93a527 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_c7426807cb0ab0d7 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_c880c612e67bf9d9 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_cca279a0d341d5ec = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_d2f1be695c4cc9c8 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_d5ff85faa53a8c67 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_d640c084d21215a4 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_ddf4cfb6765c594c = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_df21af3b9780c755 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_e284cfe3e26232e3 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_e38e9ae587e3f8bb = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlabel_eb73d9dd282c005a = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlang_c0baa8e665c21432 = function(arg0, arg1, arg2) {
        arg0.lang = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setlastindex_b7f88ee3f88ca390 = function(arg0, arg1) {
        arg0.lastIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_setlayout_35e3e6cb0da26ca2 = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_setlayout_38ee34b009072f0c = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_setlayout_934f9127172b906e = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_setlayout_a9aebce493b15bfb = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_setlength_a668e53981184590 = function(arg0, arg1) {
        arg0.length = arg1 >>> 0;
    };
    imports.wbg.__wbg_setloadop_15883d29f266b084 = function(arg0, arg1) {
        arg0.loadOp = __wbindgen_enum_GpuLoadOp[arg1];
    };
    imports.wbg.__wbg_setlodmaxclamp_f1429df82c4b3ea8 = function(arg0, arg1) {
        arg0.lodMaxClamp = arg1;
    };
    imports.wbg.__wbg_setlodminclamp_9609dff5684c3fe5 = function(arg0, arg1) {
        arg0.lodMinClamp = arg1;
    };
    imports.wbg.__wbg_setlongDesc_530bbb9223b99ec3 = function(arg0, arg1, arg2) {
        arg0.longDesc = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setloop_624f75cdf1baa040 = function(arg0, arg1) {
        arg0.loop = arg1 !== 0;
    };
    imports.wbg.__wbg_setmagfilter_b97a014d5bdb96e4 = function(arg0, arg1) {
        arg0.magFilter = __wbindgen_enum_GpuFilterMode[arg1];
    };
    imports.wbg.__wbg_setmappedatcreation_37dd8bbd1a910924 = function(arg0, arg1) {
        arg0.mappedAtCreation = arg1 !== 0;
    };
    imports.wbg.__wbg_setmask_60410c7f40b0fe24 = function(arg0, arg1) {
        arg0.mask = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmaxanisotropy_cae2737696b22ee1 = function(arg0, arg1) {
        arg0.maxAnisotropy = arg1;
    };
    imports.wbg.__wbg_setmaxdrawcount_19d17777d7c41271 = function(arg0, arg1) {
        arg0.maxDrawCount = arg1;
    };
    imports.wbg.__wbg_setmessage_ada6afb63a12b382 = function(arg0, arg1, arg2) {
        arg0.message = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setminbindingsize_f7d3351b78c71fbc = function(arg0, arg1) {
        arg0.minBindingSize = arg1;
    };
    imports.wbg.__wbg_setminfilter_386c520cd285c6b2 = function(arg0, arg1) {
        arg0.minFilter = __wbindgen_enum_GpuFilterMode[arg1];
    };
    imports.wbg.__wbg_setmiplevel_4adfe9f0872d052d = function(arg0, arg1) {
        arg0.mipLevel = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmiplevel_d5e9c11736d336c5 = function(arg0, arg1) {
        arg0.mipLevel = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmiplevelcount_3368440f1c3c34b9 = function(arg0, arg1) {
        arg0.mipLevelCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmiplevelcount_9de96fe0db85420d = function(arg0, arg1) {
        arg0.mipLevelCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_setmipmapfilter_ba0ff5e3e86bc573 = function(arg0, arg1) {
        arg0.mipmapFilter = __wbindgen_enum_GpuMipmapFilterMode[arg1];
    };
    imports.wbg.__wbg_setmode_cc9cfde4397f45e0 = function(arg0, arg1) {
        arg0.mode = __wbindgen_enum_GpuCanvasToneMappingMode[arg1];
    };
    imports.wbg.__wbg_setmodule_0700e7e0b7b4f128 = function(arg0, arg1) {
        arg0.module = arg1;
    };
    imports.wbg.__wbg_setmodule_4a8baf88303e8712 = function(arg0, arg1) {
        arg0.module = arg1;
    };
    imports.wbg.__wbg_setmodule_871baa111fc4d61b = function(arg0, arg1) {
        arg0.module = arg1;
    };
    imports.wbg.__wbg_setmultisample_d07e1d64727f8cc6 = function(arg0, arg1) {
        arg0.multisample = arg1;
    };
    imports.wbg.__wbg_setmultisampled_dc1cdd807d0170e1 = function(arg0, arg1) {
        arg0.multisampled = arg1 !== 0;
    };
    imports.wbg.__wbg_setmuted_e93fc48340c43e67 = function(arg0, arg1) {
        arg0.muted = arg1 !== 0;
    };
    imports.wbg.__wbg_setname_295752fa44721cf0 = function(arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
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
    imports.wbg.__wbg_setnodeValue_58cb1b2f6b6c33d2 = function(arg0, arg1, arg2) {
        arg0.nodeValue = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setnonce_31624ff49df51aca = function(arg0, arg1, arg2) {
        arg0.nonce = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setocclusionqueryset_d805687dfe2effe5 = function(arg0, arg1) {
        arg0.occlusionQuerySet = arg1;
    };
    imports.wbg.__wbg_setoffset_49dfc93674b6347b = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_setoffset_51eb43b37f1e9525 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_setoffset_a0d9f31cd1585a78 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_setoffset_a90a41961b1df9b4 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_setonabort_19fbf1d403f3c1e5 = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_setonabort_29e0b1f225d6cb8d = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_setonabort_761199119900910c = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_setonafterprint_d3678004b80e88ee = function(arg0, arg1) {
        arg0.onafterprint = arg1;
    };
    imports.wbg.__wbg_setonafterscriptexecute_3d47cef1200119fe = function(arg0, arg1) {
        arg0.onafterscriptexecute = arg1;
    };
    imports.wbg.__wbg_setonanimationcancel_5d0e2d610c653931 = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_setonanimationcancel_789d2fdcd478674f = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_setonanimationcancel_d1691a1fbcac1af8 = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_setonanimationend_408de6be8c5c6b9a = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_setonanimationend_853f1bccbda348fa = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_setonanimationend_866d7346431116ea = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_setonanimationiteration_0cd46d6c3641086e = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonanimationiteration_176a1ffa47876038 = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonanimationiteration_5079f42bf7c2be9d = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonanimationstart_25604bef39368c8f = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_setonanimationstart_7c9424d6ebeb0740 = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_setonanimationstart_e4cc60bffb758475 = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_setonappinstalled_e59ccf1f45074106 = function(arg0, arg1) {
        arg0.onappinstalled = arg1;
    };
    imports.wbg.__wbg_setonauxclick_3394a10735a4a504 = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_setonauxclick_9d6923f4df57d136 = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_setonauxclick_d079b250f0a99b43 = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_setonbeforeprint_418d156ffd3b8e37 = function(arg0, arg1) {
        arg0.onbeforeprint = arg1;
    };
    imports.wbg.__wbg_setonbeforescriptexecute_afa5a55d17c5176f = function(arg0, arg1) {
        arg0.onbeforescriptexecute = arg1;
    };
    imports.wbg.__wbg_setonbeforetoggle_2b8456cfd5ae375f = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_setonbeforetoggle_4a58d30faf678275 = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_setonbeforetoggle_7fe97886cffc2763 = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_setonbeforeunload_f5e1006c06147fe6 = function(arg0, arg1) {
        arg0.onbeforeunload = arg1;
    };
    imports.wbg.__wbg_setonblur_457ad2b06c4a394b = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_setonblur_5371e54c902d52e0 = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_setonblur_cedb31fae51abd58 = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_setoncanplay_4d09fddda73ed61a = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_setoncanplay_703884f48c66211e = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_setoncanplay_7fbcb2a54a05c3f8 = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_setoncanplaythrough_060bb2564aa7e81b = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_setoncanplaythrough_745393c5fc45dfd1 = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_setoncanplaythrough_bf86346bfbe43288 = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_setonchange_27a14425d44d596b = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_setonchange_7e6339de96a11c7f = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_setonchange_bed4577e9a0c4f86 = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_setonclick_23bb838c9e4e501d = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_setonclick_578becc82e481f5c = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_setonclick_d0c6e25a994463d9 = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_setonclose_8c36f48331e32685 = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_setonclose_e52abca0af5bce3f = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_setonclose_ea982414c71f130c = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_setoncontextmenu_44caf5f802085b8a = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_setoncontextmenu_72b45a663990f248 = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_setoncontextmenu_ab8ca3c0b1ec57df = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_setoncopy_57716445bedec3a8 = function(arg0, arg1) {
        arg0.oncopy = arg1;
    };
    imports.wbg.__wbg_setoncopy_b8a81885f4190905 = function(arg0, arg1) {
        arg0.oncopy = arg1;
    };
    imports.wbg.__wbg_setoncut_b0d8447d70093d42 = function(arg0, arg1) {
        arg0.oncut = arg1;
    };
    imports.wbg.__wbg_setoncut_df5e4f6b672e4320 = function(arg0, arg1) {
        arg0.oncut = arg1;
    };
    imports.wbg.__wbg_setondblclick_30d28e47920cba5e = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_setondblclick_905a69d743530467 = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_setondblclick_ef020fc7f1b5d829 = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_setondrag_6291cead6fc23609 = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_setondrag_ac05c421fa65ffd2 = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_setondrag_d5bc8e16415fc110 = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_setondragend_55bd35c829430665 = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_setondragend_6b9fbc99b834ca94 = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_setondragend_96ee8d5e13b44666 = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_setondragenter_0f918b63df1cf771 = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_setondragenter_6dffb69ab77018c3 = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_setondragenter_905d97149406be34 = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_setondragexit_20cc396a07ec4af2 = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_setondragexit_c788f5e218c86bcc = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_setondragexit_fd0fc9f2aa72fcb5 = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_setondragleave_5ea7ab9a452e800a = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_setondragleave_b1d8d0e9e5a3f000 = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_setondragleave_c3197537b3e76faa = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_setondragover_49b2fed6b9b1bebe = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_setondragover_820bcb800bb48c65 = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_setondragover_f1503b9691a9e10e = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_setondragstart_1be0ba1c46cdfb45 = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_setondragstart_2c157ae36e38959a = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_setondragstart_ed63f4dbb21be7f7 = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_setondrop_95d3d4d6d4506946 = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_setondrop_c6c36ba74670e43b = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_setondrop_e8e4216b50173496 = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_setondurationchange_40d08a350ded5985 = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_setondurationchange_81a4ba6c97aece99 = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_setondurationchange_bc70a1eddde4c75d = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_setonemptied_4299698250b3c389 = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_setonemptied_85497d36ab738251 = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_setonemptied_ebb7034d3010dbc6 = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_setonencrypted_43979275319edde8 = function(arg0, arg1) {
        arg0.onencrypted = arg1;
    };
    imports.wbg.__wbg_setonended_285647d6d32e64f0 = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_setonended_b9d1f5c7023f7c28 = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_setonended_febd19db79b73e2e = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_setonerror_57eeef5feb01fe7a = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonerror_5ef4bb65682bb77d = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonerror_e94ca1221abc457f = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonerror_ecdb181dbd4861e0 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonerror_f1fecae78c4b6d95 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_setonfocus_23c8ba38bca8121a = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_setonfocus_da72800c1eeb4bf7 = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_setonfocus_e14a4e6bbfa0e1ef = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_setonfullscreenchange_81c6dc1e8826b227 = function(arg0, arg1) {
        arg0.onfullscreenchange = arg1;
    };
    imports.wbg.__wbg_setonfullscreenerror_7e50326a55470aa5 = function(arg0, arg1) {
        arg0.onfullscreenerror = arg1;
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
    imports.wbg.__wbg_setongotpointercapture_2f5eaaf681761413 = function(arg0, arg1) {
        arg0.ongotpointercapture = arg1;
    };
    imports.wbg.__wbg_setongotpointercapture_61d0a2b8d6b86cec = function(arg0, arg1) {
        arg0.ongotpointercapture = arg1;
    };
    imports.wbg.__wbg_setonhashchange_bdaf027f3ca65265 = function(arg0, arg1) {
        arg0.onhashchange = arg1;
    };
    imports.wbg.__wbg_setoninput_2e21fa091fbeea68 = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_setoninput_631131c69b6b1487 = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_setoninput_9b4bdebbe5689033 = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_setoninvalid_7d5b1b756493ef5a = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_setoninvalid_82dd491be85e6f74 = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_setoninvalid_bbdc743d72e626bb = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_setonkeydown_2f9a4c3fd4d2bc52 = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_setonkeydown_4028232a83c52ea7 = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_setonkeydown_6f8d021ecb13db5a = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_setonkeypress_08eb97ce4d9642ae = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_setonkeypress_0a0beab3c5cf7603 = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_setonkeypress_1986580a3c02e9f1 = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_setonkeyup_aca4ece19c302c28 = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_setonkeyup_b27e41da0dcc43bb = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_setonkeyup_d38a5e036e4265aa = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_setonlanguagechange_3d0df7bc9bfb2af8 = function(arg0, arg1) {
        arg0.onlanguagechange = arg1;
    };
    imports.wbg.__wbg_setonload_264a0d330b7166fb = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_setonload_43b25347d55a5c6e = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_setonload_db94154c460cefd9 = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_setonloadeddata_1ce966be6193f795 = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_setonloadeddata_ae9dc5c4b2fc9599 = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_setonloadeddata_ddec4ee0fed67673 = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_setonloadedmetadata_03ffc4f34e884899 = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_setonloadedmetadata_9b55c03b908660cc = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_setonloadedmetadata_c3b10ec3e5dcb5b6 = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_setonloadend_083a0226b2963c1f = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_setonloadend_4d8f1aea22b17abe = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_setonloadend_600e660cb3a4c509 = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_setonloadstart_03459ce2dc2a4932 = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_setonloadstart_d4f655d35f7cb9af = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_setonloadstart_d9f8b2610f896a5c = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_setonlostpointercapture_25790f9e2f07d806 = function(arg0, arg1) {
        arg0.onlostpointercapture = arg1;
    };
    imports.wbg.__wbg_setonlostpointercapture_2b767b2ba681d7f6 = function(arg0, arg1) {
        arg0.onlostpointercapture = arg1;
    };
    imports.wbg.__wbg_setonlostpointercapture_b436100bb6abc949 = function(arg0, arg1) {
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
    imports.wbg.__wbg_setonmousedown_33cc2d66754cb6ee = function(arg0, arg1) {
        arg0.onmousedown = arg1;
    };
    imports.wbg.__wbg_setonmousedown_c721b8076d7c9739 = function(arg0, arg1) {
        arg0.onmousedown = arg1;
    };
    imports.wbg.__wbg_setonmouseenter_c4a2119c97bfc112 = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_setonmouseenter_dab0a1db435ce411 = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_setonmouseenter_e19a6927a38dd9e5 = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_setonmouseleave_383a2467aa97a13f = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_setonmouseleave_9a5a65b303489297 = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_setonmouseleave_fb496c7b3e3f7bc5 = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_setonmousemove_2d04216ad6c75ae6 = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_setonmousemove_981d0487feded8fd = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_setonmousemove_e3e4f7801ef476ef = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_setonmouseout_1b3a3882dff57f05 = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_setonmouseout_7c15a3e5d3cb20d4 = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_setonmouseout_ebcce6268bea6593 = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_setonmouseover_47b5c4d132fc1a2e = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_setonmouseover_d12c4f0b04cbac79 = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_setonmouseover_fe6c5396201d3bc8 = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_setonmouseup_6a991a1ab5054070 = function(arg0, arg1) {
        arg0.onmouseup = arg1;
    };
    imports.wbg.__wbg_setonmouseup_956972ef4827f04c = function(arg0, arg1) {
        arg0.onmouseup = arg1;
    };
    imports.wbg.__wbg_setonmouseup_a34038e6681a3de2 = function(arg0, arg1) {
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
    imports.wbg.__wbg_setonpaste_1350849ff027f02f = function(arg0, arg1) {
        arg0.onpaste = arg1;
    };
    imports.wbg.__wbg_setonpaste_234f64e9adb758ac = function(arg0, arg1) {
        arg0.onpaste = arg1;
    };
    imports.wbg.__wbg_setonpause_32f41394f1c808d8 = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_setonpause_3e914864334ea75d = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_setonpause_ece5810cfdf52f67 = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_setonplay_0e51f043a1c493ff = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_setonplay_27f80b84ab6cacbf = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_setonplay_378a0c3b1a72f222 = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_setonplaying_134c3b5a8a8a7e61 = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_setonplaying_36a2df346a9f6af1 = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_setonplaying_63cd8663f8863f69 = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_setonpointercancel_02b97f599f06ac41 = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_setonpointercancel_2413450fe181cc94 = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_setonpointercancel_96e81a6b75745897 = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_setonpointerdown_df111965df140069 = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_setonpointerdown_dfaeaac22e20acfd = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_setonpointerdown_fe2978254bffa0a9 = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_setonpointerenter_0052f752d7a17830 = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_setonpointerenter_0455f43e20f82f56 = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_setonpointerenter_13c4400fc12310d8 = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_setonpointerleave_15d3d8eba723726a = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_setonpointerleave_5e9bc8c430b05171 = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_setonpointerleave_a776b8a848bb57e4 = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_setonpointerlockchange_15fff483ba4c5a0f = function(arg0, arg1) {
        arg0.onpointerlockchange = arg1;
    };
    imports.wbg.__wbg_setonpointerlockerror_bcec174143ebe237 = function(arg0, arg1) {
        arg0.onpointerlockerror = arg1;
    };
    imports.wbg.__wbg_setonpointermove_596c57c402771a09 = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_setonpointermove_896f53eff7479f90 = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_setonpointermove_b721a8ea8a5322f1 = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_setonpointerout_16e9c3041fa9f5f9 = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_setonpointerout_b9f27be1e6442991 = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_setonpointerout_e6e2f7c5ccb20918 = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_setonpointerover_01dc14f5e84aaf6a = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_setonpointerover_1a74e8e0f2ad9482 = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_setonpointerover_96502c6817d8dd8f = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_setonpointerup_1bd01f0a8f2e9861 = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_setonpointerup_884925c18d96ace5 = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_setonpointerup_ea4f721bd89e5f1e = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_setonpopstate_c929380900d58c85 = function(arg0, arg1) {
        arg0.onpopstate = arg1;
    };
    imports.wbg.__wbg_setonprogress_62f0339a48d9702e = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_setonprogress_70ac1c645384a1dc = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_setonprogress_ff8f23e02537f744 = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_setonratechange_29dac293a446dd3d = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_setonratechange_61cfd6d79fbafd24 = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_setonratechange_b18ba34b09b01d6a = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_setonreadystatechange_6c0ebf655f044473 = function(arg0, arg1) {
        arg0.onreadystatechange = arg1;
    };
    imports.wbg.__wbg_setonreset_221c98e7dac9d1b5 = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_setonreset_4695a44e478f42c3 = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_setonreset_c1b7a136d1f94268 = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_setonresize_376a647b3cba80a2 = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_setonresize_7141daa900abfc93 = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_setonresize_f0eac0939b23d247 = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_setonresourcetimingbufferfull_25b6bd27d6296614 = function(arg0, arg1) {
        arg0.onresourcetimingbufferfull = arg1;
    };
    imports.wbg.__wbg_setonscroll_1a82eaf97d654a29 = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_setonscroll_5566c441b1b1859b = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_setonscroll_fbe90e9e71d2bbe1 = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_setonseeked_16a20ee8cc545a39 = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_setonseeked_21997e8abcf4af92 = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_setonseeked_b9ae3acc8dbd91ce = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_setonseeking_206309e3a62c6ac7 = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_setonseeking_2474c53f5daed87d = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_setonseeking_8a1d0e3b99c494fb = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_setonselect_14a98858e9f710c6 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_setonselect_b4d51927638ab475 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_setonselect_cf93fc62a8c78212 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_setonselectionchange_65ba2c2fa70d6c01 = function(arg0, arg1) {
        arg0.onselectionchange = arg1;
    };
    imports.wbg.__wbg_setonselectstart_accdb6c5043b2da3 = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_setonselectstart_bed3ff8e685db94a = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_setonselectstart_d4f86081ee576dce = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_setonshow_3a532988cdfc5b2c = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_setonshow_8d35566f24269a98 = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_setonshow_e6bdbcf887a1d98f = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_setonstalled_34bea62aa1478d01 = function(arg0, arg1) {
        arg0.onstalled = arg1;
    };
    imports.wbg.__wbg_setonstalled_61f9e1f159efe6ed = function(arg0, arg1) {
        arg0.onstalled = arg1;
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
    imports.wbg.__wbg_setonsubmit_8717621895f4512d = function(arg0, arg1) {
        arg0.onsubmit = arg1;
    };
    imports.wbg.__wbg_setonsubmit_9aa1890a42d571bd = function(arg0, arg1) {
        arg0.onsubmit = arg1;
    };
    imports.wbg.__wbg_setonsuspend_40b23660398112e1 = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_setonsuspend_bdbefba3fa6964cf = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_setonsuspend_e2ba6783a32fafcf = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_setontimeupdate_0e8cb275822b3744 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_setontimeupdate_6c18f2bea7dd12a9 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_setontimeupdate_9a26ab03942260c3 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_setontoggle_61b478aa89f79524 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_setontoggle_d336b9336d5baa95 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_setontoggle_e364ae6a00829c95 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_setontouchcancel_4639315a37c21e61 = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_setontouchcancel_5c62e023f3eb87a4 = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_setontouchcancel_83d377aa324a400d = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_setontouchend_7ac3a11b578e6b8d = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_setontouchend_c3ba19132a7e3963 = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_setontouchend_db088412747e3342 = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_setontouchmove_3074fbd89c05e146 = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_setontouchmove_85d35ea04a89ec69 = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_setontouchmove_f80dcbcaeae1b13a = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_setontouchstart_8177fb00aaad3b93 = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_setontouchstart_c2bec05a4bfe687c = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_setontouchstart_c748dbaf6199cd02 = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_setontransitioncancel_10ce35b7868b1564 = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_setontransitioncancel_16341d41f5f2367c = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_setontransitioncancel_fa0bd36fab2c4b10 = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_setontransitionend_47667b1d1af3247d = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_setontransitionend_7051e09b9820b057 = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_setontransitionend_8c960a54c1d43504 = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_setontransitionrun_153d7c085a760e30 = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_setontransitionrun_b774a4a82a059a7c = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_setontransitionrun_f8289f7e4fcd37ca = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_setontransitionstart_1548ea9907cddf45 = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_setontransitionstart_509014c39edfe916 = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_setontransitionstart_cd84b00cc299c308 = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_setonuncapturederror_a15ab4f8fa2275bd = function(arg0, arg1) {
        arg0.onuncapturederror = arg1;
    };
    imports.wbg.__wbg_setonunload_4f4843135e84664f = function(arg0, arg1) {
        arg0.onunload = arg1;
    };
    imports.wbg.__wbg_setonvisibilitychange_7b132c2943566dc9 = function(arg0, arg1) {
        arg0.onvisibilitychange = arg1;
    };
    imports.wbg.__wbg_setonvolumechange_592f38104f220a6d = function(arg0, arg1) {
        arg0.onvolumechange = arg1;
    };
    imports.wbg.__wbg_setonvolumechange_7fca293e6fcd3e9b = function(arg0, arg1) {
        arg0.onvolumechange = arg1;
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
    imports.wbg.__wbg_setonwaiting_50b79cdf7528ab16 = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_setonwaiting_524c4f64b01449ed = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_setonwaiting_c039897cb25957d5 = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_setonwaitingforkey_4c7b71ec1fec857d = function(arg0, arg1) {
        arg0.onwaitingforkey = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationend_1cf52f5e8f699ad5 = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationend_48180e7fe95c24ef = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationend_6d3a58bdf3599c05 = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationiteration_2a96c47f40b82ecb = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationiteration_440e420abac787a9 = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationiteration_fb2b3f48bafc5123 = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationstart_6717e9ef9af7284d = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationstart_9376c37c8da66779 = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_setonwebkitanimationstart_ea17664bf0a68a2e = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_setonwebkittransitionend_6f24d039f979b679 = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_setonwebkittransitionend_aa3bf0541b5109a8 = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_setonwebkittransitionend_b0bbcd2bfef77be6 = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_setonwheel_06e1ac2c6a9d28ed = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_setonwheel_6898322c5cd65659 = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_setonwheel_7c012a9b1052eedc = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_setopener_0c9cfb913057d3b9 = function() { return handleError(function (arg0, arg1) {
        arg0.opener = arg1;
    }, arguments) };
    imports.wbg.__wbg_setoperation_2bbceba9621b7980 = function(arg0, arg1) {
        arg0.operation = __wbindgen_enum_GpuBlendOperation[arg1];
    };
    imports.wbg.__wbg_setorigin_154a83d3703121d7 = function(arg0, arg1) {
        arg0.origin = arg1;
    };
    imports.wbg.__wbg_setorigin_ab13e52b07b09d8c = function(arg0, arg1) {
        arg0.origin = arg1;
    };
    imports.wbg.__wbg_setorigin_d15b59e96b22426e = function(arg0, arg1) {
        arg0.origin = arg1;
    };
    imports.wbg.__wbg_setouterHTML_9fca26e1036bf8cf = function(arg0, arg1, arg2) {
        arg0.outerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setouterHeight_aa1caf86aeb5442b = function() { return handleError(function (arg0, arg1) {
        arg0.outerHeight = arg1;
    }, arguments) };
    imports.wbg.__wbg_setouterWidth_cbdbe81079605824 = function() { return handleError(function (arg0, arg1) {
        arg0.outerWidth = arg1;
    }, arguments) };
    imports.wbg.__wbg_setpassop_57a439a73e0295e2 = function(arg0, arg1) {
        arg0.passOp = __wbindgen_enum_GpuStencilOperation[arg1];
    };
    imports.wbg.__wbg_setplaybackRate_f5c3b8896f82425e = function(arg0, arg1) {
        arg0.playbackRate = arg1;
    };
    imports.wbg.__wbg_setpopover_5b074b75da0b996b = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.popover = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_setposter_12e5e81c0e10ae53 = function(arg0, arg1, arg2) {
        arg0.poster = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setpowerpreference_229fffedb859fda8 = function(arg0, arg1) {
        arg0.powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
    };
    imports.wbg.__wbg_setpreload_d2fb02758e3f8e3a = function(arg0, arg1, arg2) {
        arg0.preload = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setpremultipliedalpha_13fd3c2f95d2a27a = function(arg0, arg1) {
        arg0.premultipliedAlpha = arg1 !== 0;
    };
    imports.wbg.__wbg_setprimitive_6c50407f92440018 = function(arg0, arg1) {
        arg0.primitive = arg1;
    };
    imports.wbg.__wbg_setqueryset_1f0efa5a49a1b2ad = function(arg0, arg1) {
        arg0.querySet = arg1;
    };
    imports.wbg.__wbg_setqueryset_5d767886356c7b79 = function(arg0, arg1) {
        arg0.querySet = arg1;
    };
    imports.wbg.__wbg_setr_6ad5c6f67a5f5a57 = function(arg0, arg1) {
        arg0.r = arg1;
    };
    imports.wbg.__wbg_setreferrerPolicy_b6a0f16f5ee94de2 = function(arg0, arg1, arg2) {
        arg0.referrerPolicy = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setrequiredfeatures_8135f6ab89e06b58 = function(arg0, arg1) {
        arg0.requiredFeatures = arg1;
    };
    imports.wbg.__wbg_setrequiredlimits_4293442d4bdc297f = function(arg0, arg1) {
        arg0.requiredLimits = arg1;
    };
    imports.wbg.__wbg_setresolvetarget_95ee5e55e47822ff = function(arg0, arg1) {
        arg0.resolveTarget = arg1;
    };
    imports.wbg.__wbg_setresource_97233a9ead07e4bc = function(arg0, arg1) {
        arg0.resource = arg1;
    };
    imports.wbg.__wbg_setrowsperimage_b2e56467282d270a = function(arg0, arg1) {
        arg0.rowsPerImage = arg1 >>> 0;
    };
    imports.wbg.__wbg_setrowsperimage_ca194ae8c040a0d0 = function(arg0, arg1) {
        arg0.rowsPerImage = arg1 >>> 0;
    };
    imports.wbg.__wbg_setsamplecount_67ee9cec510c2c58 = function(arg0, arg1) {
        arg0.sampleCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_setsamplecount_df26d31cf04a57d8 = function(arg0, arg1) {
        arg0.sampleCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_setsampler_43a3dd77c3b0a5ba = function(arg0, arg1) {
        arg0.sampler = arg1;
    };
    imports.wbg.__wbg_setsampletype_5671a405c6474494 = function(arg0, arg1) {
        arg0.sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
    };
    imports.wbg.__wbg_setscreenX_b8e1b084a2b9c385 = function() { return handleError(function (arg0, arg1) {
        arg0.screenX = arg1;
    }, arguments) };
    imports.wbg.__wbg_setscreenY_f7850cd44e6efe95 = function() { return handleError(function (arg0, arg1) {
        arg0.screenY = arg1;
    }, arguments) };
    imports.wbg.__wbg_setscrollHeight_8adc5493da2494ca = function(arg0, arg1) {
        arg0.scrollHeight = arg1;
    };
    imports.wbg.__wbg_setscrollLeft_4a32d6dd95043f07 = function(arg0, arg1) {
        arg0.scrollLeft = arg1;
    };
    imports.wbg.__wbg_setscrollTop_10fcb58772498965 = function(arg0, arg1) {
        arg0.scrollTop = arg1;
    };
    imports.wbg.__wbg_setscrollTop_f15a2d1f8cd45571 = function(arg0, arg1) {
        arg0.scrollTop = arg1;
    };
    imports.wbg.__wbg_setselectedStyleSheetSet_4a1c1154e172c3eb = function(arg0, arg1, arg2) {
        arg0.selectedStyleSheetSet = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setshaderlocation_99975e71b887d57f = function(arg0, arg1) {
        arg0.shaderLocation = arg1 >>> 0;
    };
    imports.wbg.__wbg_setsize_1a3d1e3a2e547ec1 = function(arg0, arg1) {
        arg0.size = arg1;
    };
    imports.wbg.__wbg_setsize_a45dd219534f95ed = function(arg0, arg1) {
        arg0.size = arg1;
    };
    imports.wbg.__wbg_setsize_e0576eacd9f11fed = function(arg0, arg1) {
        arg0.size = arg1;
    };
    imports.wbg.__wbg_setsizes_a5d52a21e0d92b8c = function(arg0, arg1, arg2) {
        arg0.sizes = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setslot_bcae5db8b8840861 = function(arg0, arg1, arg2) {
        arg0.slot = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setsource_1e349834f8de7d81 = function(arg0, arg1) {
        arg0.source = arg1;
    };
    imports.wbg.__wbg_setsource_51c596d0bb04f207 = function(arg0, arg1) {
        arg0.source = arg1;
    };
    imports.wbg.__wbg_setspellcheck_b4bb86a530ecf25b = function(arg0, arg1) {
        arg0.spellcheck = arg1 !== 0;
    };
    imports.wbg.__wbg_setsrc_3a759736e2659904 = function(arg0, arg1, arg2) {
        arg0.src = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setsrc_c239193cc7ab0470 = function(arg0, arg1, arg2) {
        arg0.src = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setsrcfactor_368c2472010737bf = function(arg0, arg1) {
        arg0.srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
    };
    imports.wbg.__wbg_setsrcset_14a023a94ad7f588 = function(arg0, arg1, arg2) {
        arg0.srcset = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setstatus_00d206e323892ffa = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.status = getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_setstencilback_c70185d4a7d8b41f = function(arg0, arg1) {
        arg0.stencilBack = arg1;
    };
    imports.wbg.__wbg_setstencilclearvalue_1580738072a672c0 = function(arg0, arg1) {
        arg0.stencilClearValue = arg1 >>> 0;
    };
    imports.wbg.__wbg_setstencilfront_dc4230c3548ea7f6 = function(arg0, arg1) {
        arg0.stencilFront = arg1;
    };
    imports.wbg.__wbg_setstencilloadop_8486231257ee81bf = function(arg0, arg1) {
        arg0.stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
    };
    imports.wbg.__wbg_setstencilreadmask_027558153bfc424b = function(arg0, arg1) {
        arg0.stencilReadMask = arg1 >>> 0;
    };
    imports.wbg.__wbg_setstencilreadonly_3f415ad876ffa592 = function(arg0, arg1) {
        arg0.stencilReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_setstencilreadonly_f26562e6b48d988c = function(arg0, arg1) {
        arg0.stencilReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_setstencilstoreop_39fcdf3cc001e427 = function(arg0, arg1) {
        arg0.stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
    };
    imports.wbg.__wbg_setstencilwritemask_6018d5b786f024b1 = function(arg0, arg1) {
        arg0.stencilWriteMask = arg1 >>> 0;
    };
    imports.wbg.__wbg_setstepmode_3b73fd4c54248ad9 = function(arg0, arg1) {
        arg0.stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
    };
    imports.wbg.__wbg_setstoragetexture_4853479f6eb61a57 = function(arg0, arg1) {
        arg0.storageTexture = arg1;
    };
    imports.wbg.__wbg_setstoreop_0e46dbc6c9712fbb = function(arg0, arg1) {
        arg0.storeOp = __wbindgen_enum_GpuStoreOp[arg1];
    };
    imports.wbg.__wbg_setstripindexformat_be4689e628d10d25 = function(arg0, arg1) {
        arg0.stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
    };
    imports.wbg.__wbg_settabIndex_31adfec3c7eafbce = function(arg0, arg1) {
        arg0.tabIndex = arg1;
    };
    imports.wbg.__wbg_settargets_c52d21117ec2cbc0 = function(arg0, arg1) {
        arg0.targets = arg1;
    };
    imports.wbg.__wbg_settextContent_d29397f7b994d314 = function(arg0, arg1, arg2) {
        arg0.textContent = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_settexture_5f219a723eb7db43 = function(arg0, arg1) {
        arg0.texture = arg1;
    };
    imports.wbg.__wbg_settexture_84c4ac5434a9ddb5 = function(arg0, arg1) {
        arg0.texture = arg1;
    };
    imports.wbg.__wbg_settexture_d38fb0ac5c8a7504 = function(arg0, arg1) {
        arg0.texture = arg1;
    };
    imports.wbg.__wbg_settimestampwrites_9c3e9dd8a3e800a1 = function(arg0, arg1) {
        arg0.timestampWrites = arg1;
    };
    imports.wbg.__wbg_settimestampwrites_db44391e390948e2 = function(arg0, arg1) {
        arg0.timestampWrites = arg1;
    };
    imports.wbg.__wbg_settitle_4f2894dde356c096 = function(arg0, arg1, arg2) {
        arg0.title = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_settitle_f779989743070c28 = function(arg0, arg1, arg2) {
        arg0.title = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_settonemapping_89d0e099bc5dcae2 = function(arg0, arg1) {
        arg0.toneMapping = arg1;
    };
    imports.wbg.__wbg_settopology_0c9fa83132042031 = function(arg0, arg1) {
        arg0.topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
    };
    imports.wbg.__wbg_settype_0a9fcee42b714ba8 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_GpuBufferBindingType[arg1];
    };
    imports.wbg.__wbg_settype_3ad5f338ec1a1541 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_GpuQueryType[arg1];
    };
    imports.wbg.__wbg_settype_47fae7d6c82625e7 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_WorkerType[arg1];
    };
    imports.wbg.__wbg_settype_ba111b7f1813a222 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_GpuSamplerBindingType[arg1];
    };
    imports.wbg.__wbg_setunclippeddepth_b8bfc6ba4e566a5f = function(arg0, arg1) {
        arg0.unclippedDepth = arg1 !== 0;
    };
    imports.wbg.__wbg_setusage_0f3970011718ab12 = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_setusage_49bed7c9b47e7849 = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_setusage_7ffa4257ea250d02 = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_setusage_8a5ac4564d826d9d = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_setuseMap_e18a21277d9f9908 = function(arg0, arg1, arg2) {
        arg0.useMap = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_setvalue_9829fae8eebc39d3 = function(arg0, arg1) {
        arg0.value = arg1;
    };
    imports.wbg.__wbg_setvertex_725cd211418aeffb = function(arg0, arg1) {
        arg0.vertex = arg1;
    };
    imports.wbg.__wbg_setview_2ae2d88e6d071b88 = function(arg0, arg1) {
        arg0.view = arg1;
    };
    imports.wbg.__wbg_setview_5db167adcc0d1b9c = function(arg0, arg1) {
        arg0.view = arg1;
    };
    imports.wbg.__wbg_setviewdimension_2e3a58d96671f97a = function(arg0, arg1) {
        arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    };
    imports.wbg.__wbg_setviewdimension_88c1a47ce71f7839 = function(arg0, arg1) {
        arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    };
    imports.wbg.__wbg_setviewformats_dbd4d0d50ed403ff = function(arg0, arg1) {
        arg0.viewFormats = arg1;
    };
    imports.wbg.__wbg_setviewformats_e21a9630b45aff68 = function(arg0, arg1) {
        arg0.viewFormats = arg1;
    };
    imports.wbg.__wbg_setvisibility_f4f66940005e5c39 = function(arg0, arg1) {
        arg0.visibility = arg1 >>> 0;
    };
    imports.wbg.__wbg_setvolume_3895e06a030ca4f7 = function(arg0, arg1) {
        arg0.volume = arg1;
    };
    imports.wbg.__wbg_setvspace_fdd2bb5c02d36df6 = function(arg0, arg1) {
        arg0.vspace = arg1 >>> 0;
    };
    imports.wbg.__wbg_setwidth_196de8952521776c = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_setwidth_64c5783b064042bc = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_setwidth_660ca581e3fbe279 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_setwidth_c5fed9f5e7f0b406 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_setwidth_fa1d6e96a4c26213 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_setwritemask_4198f874c5422156 = function(arg0, arg1) {
        arg0.writeMask = arg1 >>> 0;
    };
    imports.wbg.__wbg_setx_6968babe18f3ff41 = function(arg0, arg1) {
        arg0.x = arg1 >>> 0;
    };
    imports.wbg.__wbg_setx_d5236bf9391eb053 = function(arg0, arg1) {
        arg0.x = arg1 >>> 0;
    };
    imports.wbg.__wbg_setxrcompatible_136ac4de6e18932d = function(arg0, arg1) {
        arg0.xrCompatible = arg1 !== 0;
    };
    imports.wbg.__wbg_sety_413262ade3cc0d56 = function(arg0, arg1) {
        arg0.y = arg1 >>> 0;
    };
    imports.wbg.__wbg_sety_e3dd79062e975415 = function(arg0, arg1) {
        arg0.y = arg1 >>> 0;
    };
    imports.wbg.__wbg_setz_a136ba9bd16085f0 = function(arg0, arg1) {
        arg0.z = arg1 >>> 0;
    };
    imports.wbg.__wbg_shaderSource_72d3e8597ef85b67 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_shaderSource_ad0087e637a35191 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
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
    imports.wbg.__wbg_showPopover_80684728fe771419 = function() { return handleError(function (arg0) {
        arg0.showPopover();
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
    imports.wbg.__wbg_size_04e7b306340c55f9 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_3d0a84da1d4aaea9 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_40ab50c7f045cbf0 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_531ef01d6a4916c2 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_d4e737c0d21784af = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_f9d54556ad844dc3 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_sizes_1fea674310048459 = function(arg0, arg1) {
        const ret = arg1.sizes;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_slot_b3d615ae3a57c68d = function(arg0, arg1) {
        const ret = arg1.slot;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_some_675bdd75b9d96808 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return __wbg_adapter_7332(a, state0.b, arg0);
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
    imports.wbg.__wbg_spellcheck_3e347c7391456c34 = function(arg0) {
        const ret = arg0.spellcheck;
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
    imports.wbg.__wbg_src_7b3ceeda0fbdae73 = function(arg0, arg1) {
        const ret = arg1.src;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_src_c2a7ee5692d71b0e = function(arg0, arg1) {
        const ret = arg1.src;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_srcset_e403da74e16b2f32 = function(arg0, arg1) {
        const ret = arg1.srcset;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_stencilFuncSeparate_91700dcf367ae07e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilFuncSeparate_c1a6fa2005ca0aaf = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilFunc_115c92784472048b = function(arg0, arg1, arg2, arg3) {
        arg0.stencilFunc(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_stencilFunc_ebe594b996e772e7 = function(arg0, arg1, arg2, arg3) {
        arg0.stencilFunc(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_stencilMaskSeparate_4f1a2defc8c10956 = function(arg0, arg1, arg2) {
        arg0.stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_stencilMaskSeparate_f8a0cfb5c2994d4a = function(arg0, arg1, arg2) {
        arg0.stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_stencilMask_1e602ef63f5b4144 = function(arg0, arg1) {
        arg0.stencilMask(arg1 >>> 0);
    };
    imports.wbg.__wbg_stencilMask_cd8ca0a55817e599 = function(arg0, arg1) {
        arg0.stencilMask(arg1 >>> 0);
    };
    imports.wbg.__wbg_stencilOpSeparate_1fa08985e79e1627 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilOpSeparate_ff6683bbe3838ae6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilOp_b794f03cef95238e = function(arg0, arg1, arg2, arg3) {
        arg0.stencilOp(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_stencilOp_cebb850a3b4f9e4f = function(arg0, arg1, arg2, arg3) {
        arg0.stencilOp(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
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
    imports.wbg.__wbg_submit_068b03683463d934 = function(arg0, arg1) {
        arg0.submit(arg1);
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
    imports.wbg.__wbg_tabIndex_4b690e44caf0ca65 = function(arg0) {
        const ret = arg0.tabIndex;
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
    imports.wbg.__wbg_tagName_b284ab9c1479c38d = function(arg0, arg1) {
        const ret = arg1.tagName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_taintEnabled_0bbd9734ea0727d4 = function(arg0) {
        const ret = arg0.taintEnabled();
        return ret;
    };
    imports.wbg.__wbg_taintEnabled_53ecf796e9a22a9a = function(arg0) {
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
    imports.wbg.__wbg_texImage2D_06281e677e3f6909 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texImage2D_114e77ca61ee2068 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_297bb8474cd4e8b8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texImage2D_4533bdabb9918529 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_4e9c4a59f1fe4632 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_57483314967bdd11 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_5e3faaf7e74e0057 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_5e71049a713909a1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_5f2835f02b1d1077 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_7b15c62fc9c12b16 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_7fafc5db9861e235 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_9382f3cfabf2b15d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_a1094c0d5b52ffce = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_ac3a52aa53cce98a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_b04417baaf352149 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_b2bb443de3966051 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_b8edcb5692f65f88 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_cc4a50e871e966b3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_ccec8d31111076df = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_cf25dac874164780 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getArrayU8FromWasm0(arg9, arg10), arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_d40a00b9c1254ee4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_d5534871ba32a41f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_dd6e442709223469 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_dd9ded937513fb00 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_e4074a0a35209cab = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_ecb99be64f037e6e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_f0fee364ad1876bc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_f1dc2cc64f0d7e5e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_f6f13191b12446ef = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_14438bf407dbf33f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_1d401c2a0f509aae = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_2a9da867a1277a4b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_5f40f6aefd484458 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10, arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_623edb318033e9b1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_66fac31208d13088 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_750735c69223fd29 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11), arg12 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_7713c1aa94bd877e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10, arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_83ea3bceee6ca941 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_8667bef0f88cf4c0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_921b54d09bf45af0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_a00b7a4df48cf757 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_caf5438ff80b3d67 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_f7ae389d2b5d1dd6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10 === 0 ? undefined : getArrayU8FromWasm0(arg10, arg11));
    }, arguments) };
    imports.wbg.__wbg_texParameterf_957d99ee8423bfef = function(arg0, arg1, arg2, arg3) {
        arg0.texParameterf(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameterf_e306abe7ab904e48 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameterf(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameteri_8112b26b3c360b7e = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameteri_ef50743cb94d507e = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texStorage2D_fbda848497f3674e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.texStorage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_texStorage3D_fd7a7ca30e7981d1 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texStorage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_texSubImage2D_00e9fc34c22b598e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_061605071aad9d2c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_0ffb7e62f8cff087 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_13c667ee4e70fd64 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_331fdc5bbdef5747 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_3b94ca3b3c44902f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_488e25cb50321558 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_4981ce658e1ec181 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_4e109b5d5b9809e3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_53b417ee9b638fdf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_603b5a635e1a9c11 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_6af0635061e94680 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_7009de77ca12a8a9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_7bb03ae848729ff8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_82670edc2c5acd35 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_89d024022529730a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_8a7993135bac4f36 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_aa9a084093764796 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_bb4735274232f76d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_bd2c8f4761145e7f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_c4a878364bebcaa0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_c7365dd741832ded = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_c7951ed97252bdff = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_d52d1a0d3654c60b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_dd9cac68ad5fe0b6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_e6d34f5bb062e404 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_f39ea52a2d4bd2f7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_fbdf91268228c757 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_fcb5239a52293283 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getArrayU8FromWasm0(arg9, arg10), arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_02bbdad14919acfc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_04731251d7cecc83 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_143fdcaf9557a5ee = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11, arg12 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_37f0045d16871670 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_3a871f6405d2f183 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_3b21f893d9f05e30 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11 === 0 ? undefined : getArrayU8FromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_415df0f5fffbe3ae = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_63f76ad786878692 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11, arg12 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_66acd67f56e3b214 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_a051de089266fa1b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_b28c55f839bbec41 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_d6286190b2e6f87e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11 === 0 ? undefined : getArrayU8FromWasm0(arg11, arg12), arg13 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_f18bf091cd48774c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_f2924b3df7a4ec5d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_textContent_215d0f87d539368a = function(arg0, arg1) {
        const ret = arg1.textContent;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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
    imports.wbg.__wbg_time_ddef11b392e7cb99 = function() {
        console.time();
    };
    imports.wbg.__wbg_timestamp_5f0512a1aa9d6d32 = function(arg0, arg1) {
        const ret = arg1.timestamp;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_title_09f6e06f98d0b686 = function(arg0, arg1) {
        const ret = arg1.title;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_title_6bae71bf422192dc = function(arg0, arg1) {
        const ret = arg1.title;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_toBlob_50988919311dc3cb = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.toBlob(arg1, getStringFromWasm0(arg2, arg3));
    }, arguments) };
    imports.wbg.__wbg_toBlob_81bc9e27f3fbded6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.toBlob(arg1, getStringFromWasm0(arg2, arg3), arg4);
    }, arguments) };
    imports.wbg.__wbg_toBlob_b9c8aa2351e3ea86 = function() { return handleError(function (arg0, arg1) {
        arg0.toBlob(arg1);
    }, arguments) };
    imports.wbg.__wbg_toDataURL_642f4ad5ad88d86d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg1.toDataURL(getStringFromWasm0(arg2, arg3), arg4);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_toDataURL_ca84be9d3afd64db = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.toDataURL(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_toDataURL_eaec332e848fe935 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.toDataURL();
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
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
    imports.wbg.__wbg_toggleAttribute_afba3a9c057ca8b4 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.toggleAttribute(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toggleAttribute_c3884c3487bd80cf = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.toggleAttribute(getStringFromWasm0(arg1, arg2), arg3 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_togglePopover_083484abb68d9665 = function() { return handleError(function (arg0) {
        const ret = arg0.togglePopover();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_togglePopover_8867a263a093fcbb = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.togglePopover(arg1 !== 0);
        return ret;
    }, arguments) };
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
    imports.wbg.__wbg_transferControlToOffscreen_50f0dbdebe8b08e5 = function() { return handleError(function (arg0) {
        const ret = arg0.transferControlToOffscreen();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_transferToImageBitmap_4b1cc41c0f7e5de5 = function() { return handleError(function (arg0) {
        const ret = arg0.transferToImageBitmap();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_transformFeedbackVaryings_318cfcb0a0b01aa5 = function(arg0, arg1, arg2, arg3) {
        arg0.transformFeedbackVaryings(arg1, arg2, arg3 >>> 0);
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
    imports.wbg.__wbg_type_12764cf86d9bd479 = function(arg0) {
        const ret = arg0.type;
        return (__wbindgen_enum_GpuCompilationMessageType.indexOf(ret) + 1 || 4) - 1;
    };
    imports.wbg.__wbg_type_16f2b8031796512f = function(arg0, arg1) {
        const ret = arg1.type;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_type_a43080ecd49da621 = function(arg0) {
        const ret = arg0.type;
        return ret;
    };
    imports.wbg.__wbg_type_aebee95d1d9e50c0 = function(arg0) {
        const ret = arg0.type;
        return (__wbindgen_enum_GpuQueryType.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_unconfigure_11c604a04a095391 = function(arg0) {
        arg0.unconfigure();
    };
    imports.wbg.__wbg_unescape_e3df3a9b4be937bb = function(arg0, arg1) {
        const ret = unescape(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_unicode_b13cfca88b85412b = function(arg0) {
        const ret = arg0.unicode;
        return ret;
    };
    imports.wbg.__wbg_uniform1f_21390b04609a9fa5 = function(arg0, arg1, arg2) {
        arg0.uniform1f(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1f_dc009a0e7f7e5977 = function(arg0, arg1, arg2) {
        arg0.uniform1f(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_03f7d6a29a584881 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_2088af0eea6f04c0 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_57185d4119d31285 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_5b2178dd75f6a7d0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_754e629b60b53119 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_76ac2f26482914f1 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_98959edc00418447 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_9a1cdaa3386c8081 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1fv_b41efa3d9c5df06c = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1fv_be19ea5245325580 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_c4d272af746f5cb6 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_d1cf5c0830fa5f70 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1i_5ddd9d8ccbd390bb = function(arg0, arg1, arg2) {
        arg0.uniform1i(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1i_ed95b6129dce4d84 = function(arg0, arg1, arg2) {
        arg0.uniform1i(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_1c8294ba1c09dfeb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_337c4a74e31ddc15 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1iv_49f813c564a687d4 = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_6cc568ecb1605db8 = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_9abf516b38df1120 = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_9f705a736e531498 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_bc696cd38f7cee57 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_d86e6ab3c18f4c5c = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_d90e918d4e871d3b = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_e4c44488e311c507 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_f2460f2481c803ef = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_fe0f24a5cc9acd95 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1ui_66e092b67a21c84d = function(arg0, arg1, arg2) {
        arg0.uniform1ui(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_03156e0197a3fb3c = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1uiv_065e804ef0403aae = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_18f16530ba4e1841 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_1ff6bf4b4fb93b1a = function(arg0, arg1, arg2) {
        arg0.uniform1uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1uiv_4b50df76f9a09e37 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_65a4a7f8f7575872 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_a5ed87ec099722ae = function(arg0, arg1, arg2) {
        arg0.uniform1uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1uiv_dc3da241d3fd65c4 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_e52212f9006ad485 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2f_56af4e1731d87421 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2f(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2f_b69b5369bc019bd5 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2f(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2fv_1f936a4b0f67a535 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_2fe225c92cf82bc4 = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_398b66bc87653799 = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_48d2598866a17373 = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_4982324a38720906 = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_656fce9525420996 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_75db38fd217bc274 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_a07eca05850401ea = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_b1902bf5a43d1ae3 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_bda9283c33a7ac9d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_d8bd2a36da7ce440 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_f6129ba8b83e55ba = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2i_2ca0ebb03eed1cb8 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2i(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2i_8fd6d9b2b07c8027 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2i(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2iv_04bd2f1b41df70f9 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_24e67ae00bb5a0b0 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_3c849b07ae5a8297 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_4d39fc5a26f03f55 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2iv_523ddd88aa176812 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_846bcdeea5716ef1 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_86fcfc7056886625 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_9bca3349a8dfc581 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_a6cc48b94ab46a38 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_b3744f977cce1269 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_e967139a28017a99 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2iv_fa5b08b52befb424 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2ui_662eb84f610e013f = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2ui(arg1, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_2af39f1696400a71 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_4c340c9e8477bb07 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2uiv_4e764c06ac867ad5 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_5a7d226297af92b2 = function(arg0, arg1, arg2) {
        arg0.uniform2uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2uiv_72f9d0fdee57491f = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_b00ebeb6d4b1c7d4 = function(arg0, arg1, arg2) {
        arg0.uniform2uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2uiv_cf840f3736e8d722 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_ddd9c7fee36be65a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_eef579d1607521cc = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3f_99e237fdba99fca9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3f(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3f_c40bec60fca69774 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3f(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3fv_039b93b73e2d2197 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_0940486353297402 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_0eaf5b857421d069 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_4a2a69ed32a94599 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_4d2aede2b0bb1252 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_6aec8b2eabb6189d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_6b2535e64a799ca9 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_7772918872ec44b7 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_7d828b7c4c91138e = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_8153c834ce667125 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_874842db1d9e88d7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_b5c0b1a1b0bd673a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3i_590c80bd1f623eab = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3i(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3i_c777d18b03191e7c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3i(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3iv_165cb850ae8fa3b9 = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_26f6f1db01d237d1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_3b9c34d7a829212e = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_48e75dc32ef3d594 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_4d7af0f14542c1fa = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_58662d914661aa10 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3iv_77978b28089da7a6 = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_a190983480da532b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_a531fd0249405f85 = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_cc9d8037ab0ff943 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_f30d27ec224b4b24 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3iv_fb6fe96f0d598d95 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform3ui_b95fa767e3215da0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3ui(arg1, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_054b1c9aad41caed = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_1f41efe3f9c01493 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_30c070612ac3bfdb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_30c20e314a77674e = function(arg0, arg1, arg2) {
        arg0.uniform3uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3uiv_38673b825dc755f6 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3uiv_6a5c50c31bc74696 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_ba72da9f61d9a5a5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_c8baf5ba29a0ef42 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_e9e850f409778a4f = function(arg0, arg1, arg2) {
        arg0.uniform3uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4f_36b8f9be15064aa7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4f_f7ea07febf8b5108 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4fv_01aee2826811ac53 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_150472582f2d941c = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_4050f968cb55a18a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_6d4a958e591a323c = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_8827081a7585145b = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4fv_a2ddaded77c5874b = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_a978b08cd99c1698 = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_bfd92f605b5cf05b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_c01fbc6c022abac3 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4fv_c993f414948470ac = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_ccd7e23236e33d0a = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_e4a9bc921c29759a = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4i_22c9b735c92537cc = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4i(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4i_7485a4e0fee475f4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4i(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4iv_412e57a2b4224367 = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_51b9fbd3ff3e9970 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_6bf8801d894b4cf8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_7fd0f72ab915c1fa = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_7fe05be291899f06 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4iv_84fdf80745e7ff26 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4iv_871d4523bc95e3ee = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_91ee4d665bf52760 = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_9dd358f78d1c5155 = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_b53a8a8804307440 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_d38ad80dd9793345 = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_d9dff1b79412f058 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4ui_84423250a7870136 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4ui(arg1, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_11024dbacc565961 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_2ed3c0f9230fd4e1 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_624368e8a114f00b = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_641b660c94af11c8 = function(arg0, arg1, arg2) {
        arg0.uniform4uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4uiv_675d72c652b16347 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_8b38ca3e27bd41b8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_9de55998fbfef236 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4uiv_c06b67def46e8cbb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_f1156a7ac45637fc = function(arg0, arg1, arg2) {
        arg0.uniform4uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniformBlockBinding_18117f4bda07115b = function(arg0, arg1, arg2, arg3) {
        arg0.uniformBlockBinding(arg1, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_0412cc2bf0ce8a45 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_395f84c81b9a27be = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_564afbdf83c8268d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_59292d5c16014532 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_737afe1192e32b8e = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_98681e400347369c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2fv_b411371b2515adbf = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_bc019eb4784a3b8c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2fv_ce0e7437d1dd5d51 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_cea8eb684e177909 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_f78a0da279fc1308 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_f889615af1b61390 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_6421f8d6f7f4d144 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_8082abd359eb099f = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_a1103357e5485255 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_aa8ffced0fb2c646 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_b5c9ba50ffb60063 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_c37874ebcd7b6493 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_c76c9a98f59c62cf = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_d54f3f57e46a8432 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_eed4a9e0e0bc3d5e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_0ca1aab5cad89a5c = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_1418958de655ca4e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_16e7458b379460a4 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_1cfed17706be8b81 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_27d807767d7aadc6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_4967348d035e716c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_71a207c1efd8f9cd = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_9270a36ff6f50c83 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_ed15eed75d113b86 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_1a4d2f8493e0547a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_2be8ea2151a1d280 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_3d6ad3a1e0b0b5b6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3fv_3df529aab93cf902 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3fv_4d0135c82932748e = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_527ebf7523ac988a = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_7156b1c1c755a789 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_7c2534cf98802175 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_89254cc23ff13975 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_8e2429110fbe6276 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_a753a73d075aa118 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_cdd0c9e83fda1e85 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_6d5e3c7942c82dca = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_70ca7b663ef00ae2 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_79357317e9637d05 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_885b5b65adbaec73 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_a35376dad80cc239 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_b8a21bc44fea428c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_ca11f49745835e5d = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_cd8418c442163209 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_eba4cbea70a770b6 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_457beb621df8e62c = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_5089e880c7cf2340 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_630afab09cbd8742 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_65ea5814049a5fc4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_88cb4f9d5603e905 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_991f5a058e32010c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_9d1a88b5abfbd64b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_ad1c802402e1959f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_f14bd8b4000f306d = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_1849301c7c9662f9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_1976be891fca9817 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_2ddb1bda0f62c5f7 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_449dc1b6b6565ef5 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_5ffb8dc3cad8623a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_666a37443f29a9f8 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_6b5babe739d4c3b0 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_775ead7003a5a949 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_da94083874f202ad = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_dc525ce3cddbb770 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_e87383507ae75670 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_f484611fade0663d = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_0e41572033d08146 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_213f2aa37b849389 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_442bea73710b2078 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_5d73970dc59816e6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_63128ca312d223d5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_7015986eaf18316e = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_aa507d918a0b5a62 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_cf63aa1b7cd04849 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_f0106bd885a61bca = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_0cdf8f8b7247fd0b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_37da2fa6fc439c51 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_5ec9b2a4f687b6f5 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_6269cd68b899b308 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_6712c7a3b4276fb4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_6848f67cf1a61951 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_b8a42fec5994840d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_ba3ffd2e0569dbfd = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_ed4880bb0f0a059f = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_unmap_619e40c09473aed0 = function(arg0) {
        arg0.unmap();
    };
    imports.wbg.__wbg_unscopables_7673b799e5130697 = function() {
        const ret = Symbol.unscopables;
        return ret;
    };
    imports.wbg.__wbg_unshift_c290010f73f04fb1 = function(arg0, arg1) {
        const ret = arg0.unshift(arg1);
        return ret;
    };
    imports.wbg.__wbg_usage_47329a31253e57ce = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_usage_af514d644ba6fe62 = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_useMap_4a2db3ac86e63bda = function(arg0, arg1) {
        const ret = arg1.useMap;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_useProgram_473bf913989b6089 = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_useProgram_9b2660f7bb210471 = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_userAgent_12e9d8e62297563f = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.userAgent;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_userAgent_d036e8722fea0cde = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.userAgent;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_validateProgram_3d70cb461f4e58a9 = function(arg0, arg1) {
        arg0.validateProgram(arg1);
    };
    imports.wbg.__wbg_validateProgram_7098e786ca8bfe10 = function(arg0, arg1) {
        arg0.validateProgram(arg1);
    };
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
    imports.wbg.__wbg_values_410b80bb45c5b179 = function(arg0) {
        const ret = arg0.values();
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
    imports.wbg.__wbg_values_e6b2887346a7bf4d = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_e9040ab76c65ff00 = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_fcb8ba8c0aad8b58 = function(arg0) {
        const ret = Object.values(arg0);
        return ret;
    };
    imports.wbg.__wbg_vendor_5bfff736035d99f1 = function(arg0, arg1) {
        const ret = arg1.vendor;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = arg0.versions;
        return ret;
    };
    imports.wbg.__wbg_vertexAttrib1f_30386de267df8d08 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1f(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1f_8fb2822c66730301 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1f(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_1f00732ffb69a1dd = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_569a2bc30733951b = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib1fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib1fv_d73a9e88e1b70a82 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib1fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib1fv_ea1b413bc21f4992 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_eda679bf4ff88d7f = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_f46270b6d3779249 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2f_cee44e907abc08d0 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2f(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_vertexAttrib2f_d928238aeacf398e = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2f(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_vertexAttrib2fv_328440e40c29a32b = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib2fv_63159c313e6647bf = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_947db6bac4d2ae78 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_ac7f505de2354baf = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib2fv_c7db7e38a2a73f3d = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_ca0ce1d17fa07b24 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3f_b0010bb0ccee561c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.vertexAttrib3f(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_vertexAttrib3f_e4dab6e31f7c3ac1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.vertexAttrib3f(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_vertexAttrib3fv_0935cde58fb35dd1 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib3fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib3fv_14c6862aed8c9136 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3fv_679b6228fa0d44d0 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3fv_afb26b87ccd923d7 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3fv_be7e27da1d5e3fc6 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib3fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib3fv_ffc6abd7ea77a55a = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4f_2a47cb701d647eeb = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttrib4f(arg1 >>> 0, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttrib4f_69459444d0a1c4a6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttrib4f(arg1 >>> 0, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttrib4fv_0d08aa58a101fb1c = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4fv_149b8e56f5fcb754 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib4fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib4fv_2f17621862e23f43 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4fv_30606d9b53cc6601 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib4fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib4fv_49c697b6c1fc411c = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4fv_a98e50d76c1b48c2 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribDivisorANGLE_11e909d332960413 = function(arg0, arg1, arg2) {
        arg0.vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribDivisor_4d361d77ffb6d3ff = function(arg0, arg1, arg2) {
        arg0.vertexAttribDivisor(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribI4i_ab71cf820ad80d26 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribI4i(arg1 >>> 0, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttribI4iv_49cf21bbd7398d9d = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttribI4iv(arg1 >>> 0, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttribI4iv_aa4f83c943673319 = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4iv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribI4iv_bd32f7308b1c7ca1 = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4iv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribI4ui_19cfe51d154e8afc = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribI4ui(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribI4uiv_2d7261b493054b54 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttribI4uiv(arg1 >>> 0, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttribI4uiv_b1cd4b424f0e7d43 = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4uiv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribI4uiv_ceffd07b5e968923 = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4uiv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribIPointer_577be02423680c6c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttribIPointer_d0c67543348c90ce = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttribPointer_550dc34903e3d1ea = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_676924d9d3f64712 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_7a2a506cdbe3aebc = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_fe8df1dfa4b5daa4 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vibrate_b2b29ee7b04fe03a = function(arg0, arg1) {
        const ret = arg0.vibrate(arg1);
        return ret;
    };
    imports.wbg.__wbg_vibrate_fe479753f5bed032 = function(arg0, arg1) {
        const ret = arg0.vibrate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_videoHeight_3a43327a766c1f03 = function(arg0) {
        const ret = arg0.videoHeight;
        return ret;
    };
    imports.wbg.__wbg_videoWidth_4b400cf6f4744a4d = function(arg0) {
        const ret = arg0.videoWidth;
        return ret;
    };
    imports.wbg.__wbg_viewport_a1b4d71297ba89af = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_viewport_e615e98f676f2d39 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_volume_9898f1386775aba9 = function(arg0) {
        const ret = arg0.volume;
        return ret;
    };
    imports.wbg.__wbg_vspace_e550d845d1ce429a = function(arg0) {
        const ret = arg0.vspace;
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
    imports.wbg.__wbg_waitSync_841058c007a9fb95 = function(arg0, arg1, arg2, arg3) {
        arg0.waitSync(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_waitSync_c6c73d9a99af3cb4 = function(arg0, arg1, arg2, arg3) {
        arg0.waitSync(arg1, arg2 >>> 0, arg3);
    };
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
    imports.wbg.__wbg_wasmgpuselector_new = function(arg0) {
        const ret = WasmGpuSelector.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_webkitMatchesSelector_60f72d5094a142f1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.webkitMatchesSelector(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wgslLanguageFeatures_4aae92a03635b0f7 = function(arg0) {
        const ret = arg0.wgslLanguageFeatures;
        return ret;
    };
    imports.wbg.__wbg_width_4f334fc47ef03de1 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_5dde457d606ba683 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_5ebf76e136ee6582 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_6f13e0ff80f0fc1a = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_8fe4e8f77479c2a6 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_b0c1d9f437a95799 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_f54c7178d3c78f16 = function(arg0) {
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
    imports.wbg.__wbg_writeBuffer_01cc386ebe1ffae5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_0ad5fa6fd006c520 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_24f84dd8bdb968f0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_32e880778cced0b0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_3dafb6ac59530248 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_3dda1ed0c6b62482 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_43149691ada46c18 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_491f3ddfed93c2af = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_4a05ee8f859cfba9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_5bd3ec8a92742f5c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_6105c3ebfe098ee7 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_619cf8589f732043 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_669c624ba16b4281 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_6d358e1143f1a792 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_6ee2d4b544314ad3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_753fc5a6d0aee2d4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_76f798f03936d3f8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_7e0f1761cb268784 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_7f199a33177f0978 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_8278bda79e510b72 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_87231a1f44179647 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_8d73e1b0cb2319ac = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_8ee1d5f6a3840c3c = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_9c7fc2fdde029df2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_9ee57747dcc5dc28 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_a366e45c838f5db4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_a65948d6ddeb954d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_acfc9ca3b5432df3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_af340733479dd454 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_b1a9209c2d4e4bd8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_b479dd5b90cd43eb = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_b95274ea75eaf280 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_bdc0adcf24ba6df1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_bf7a3d12b185ebc6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_c610b46a600618d9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_c9e7cf9aa4371bad = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_d50d9b480d4e293f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_d53abd5c8397f24b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_da3319769ed54e4e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_dc4a0c6ea84a69d3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_ebacbd56bd59f587 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_f1a0b526a9217cf5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_19edd3b2b45ea730 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeTexture(arg1, getArrayU8FromWasm0(arg2, arg3), arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_c1e0c11429c519d5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_c70826cc2ae8e127 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_d7f929cf48c7a5b9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_ead9edda8043d891 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeTexture(arg1, getArrayU8FromWasm0(arg2, arg3), arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_f304b0f27d2602f5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
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
    imports.wbg.__wbindgen_closure_wrapper12868 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2832, __wbg_adapter_103);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper12870 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2832, __wbg_adapter_103);
        return ret;
    };
    imports.wbg.__wbindgen_closure_wrapper9981 = function(arg0, arg1, arg2) {
        const ret = makeMutClosure(arg0, arg1, 2029, __wbg_adapter_100);
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
    imports.wbg.__wbindgen_is_falsy = function(arg0) {
        const ret = !arg0;
        return ret;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_null = function(arg0) {
        const ret = arg0 === null;
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
    imports.wbg.memory = memory || new WebAssembly.Memory({initial:39,maximum:65536,shared:true});
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
