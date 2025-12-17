import * as __wbg_star0 from '__wbindgen_placeholder__';

let wasm;

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(state => state.dtor(state.a, state.b));

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

function getArrayF32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayI16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayI32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayI64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigInt64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
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
        result.push(wasm.__wbindgen_externrefs.get(mem.getUint32(i, true)));
    }
    wasm.__externref_drop_slice(ptr, len);
    return result;
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getBigUint64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedBigInt64ArrayMemory0 = null;
function getBigInt64ArrayMemory0() {
    if (cachedBigInt64ArrayMemory0 === null || cachedBigInt64ArrayMemory0.byteLength === 0) {
        cachedBigInt64ArrayMemory0 = new BigInt64Array(wasm.memory.buffer);
    }
    return cachedBigInt64ArrayMemory0;
}

let cachedBigUint64ArrayMemory0 = null;
function getBigUint64ArrayMemory0() {
    if (cachedBigUint64ArrayMemory0 === null || cachedBigUint64ArrayMemory0.byteLength === 0) {
        cachedBigUint64ArrayMemory0 = new BigUint64Array(wasm.memory.buffer);
    }
    return cachedBigUint64ArrayMemory0;
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat32ArrayMemory0 = null;
function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
        cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

let cachedInt16ArrayMemory0 = null;
function getInt16ArrayMemory0() {
    if (cachedInt16ArrayMemory0 === null || cachedInt16ArrayMemory0.byteLength === 0) {
        cachedInt16ArrayMemory0 = new Int16Array(wasm.memory.buffer);
    }
    return cachedInt16ArrayMemory0;
}

let cachedInt32ArrayMemory0 = null;
function getInt32ArrayMemory0() {
    if (cachedInt32ArrayMemory0 === null || cachedInt32ArrayMemory0.byteLength === 0) {
        cachedInt32ArrayMemory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32ArrayMemory0;
}

let cachedInt8ArrayMemory0 = null;
function getInt8ArrayMemory0() {
    if (cachedInt8ArrayMemory0 === null || cachedInt8ArrayMemory0.byteLength === 0) {
        cachedInt8ArrayMemory0 = new Int8Array(wasm.memory.buffer);
    }
    return cachedInt8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedUint8ClampedArrayMemory0 = null;
function getUint8ClampedArrayMemory0() {
    if (cachedUint8ClampedArrayMemory0 === null || cachedUint8ClampedArrayMemory0.byteLength === 0) {
        cachedUint8ClampedArrayMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

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
            state.a = a;
            real._wbg_cb_unref();
        }
    };
    real._wbg_cb_unref = () => {
        if (--state.cnt === 0) {
            state.dtor(state.a, state.b);
            state.a = 0;
            CLOSURE_DTORS.unregister(state);
        }
    };
    CLOSURE_DTORS.register(real, state, state);
    return real;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

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
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    }
}

let WASM_VECTOR_LEN = 0;

function wasm_bindgen__convert__closures_____invoke__h2cc2ea010b0df6f8(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures_____invoke__h2cc2ea010b0df6f8(arg0, arg1, arg2);
}

function wasm_bindgen__convert__closures_____invoke__h38800d657b13dd4c(arg0, arg1, arg2) {
    wasm.wasm_bindgen__convert__closures_____invoke__h38800d657b13dd4c(arg0, arg1, arg2);
}

function wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(arg0, arg1, arg2, arg3, arg4);
    return ret !== 0;
}

function wasm_bindgen__convert__closures_____invoke__hc22bb47e199e457f(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__hc22bb47e199e457f(arg0, arg1, arg2, arg3, arg4);
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

function wasm_bindgen__convert__closures_____invoke__h2703394ee32ad7e6(arg0, arg1, arg2, arg3, arg4) {
    wasm.wasm_bindgen__convert__closures_____invoke__h2703394ee32ad7e6(arg0, arg1, arg2, arg3, arg4);
}

function wasm_bindgen__convert__closures_____invoke__he2a42892531dc1dc(arg0, arg1, arg2, arg3, arg4) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__he2a42892531dc1dc(arg0, arg1, arg2, arg3, arg4);
    return ret;
}

function wasm_bindgen__convert__closures_____invoke__h20476958fb967b77(arg0, arg1, arg2, arg3, arg4, arg5) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h20476958fb967b77(arg0, arg1, arg2, arg3, arg4, arg5);
    return ret;
}

function wasm_bindgen__convert__closures_____invoke__h34c0bbd826476d09(arg0, arg1, arg2) {
    const ret = wasm.wasm_bindgen__convert__closures_____invoke__h34c0bbd826476d09(arg0, arg1, arg2);
    return ret !== 0;
}

function wasm_bindgen__convert__closures_____invoke__h8a611d48544c6801(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures_____invoke__h8a611d48544c6801(arg0, arg1, arg2, arg3);
}

function wasm_bindgen__convert__closures_____invoke__h68a31eee7db321a1(arg0, arg1, arg2, arg3, arg4) {
    wasm.wasm_bindgen__convert__closures_____invoke__h68a31eee7db321a1(arg0, arg1, arg2, arg3, arg4);
}

function wasm_bindgen__convert__closures_____invoke__h299b44f41e2e099e(arg0, arg1, arg2, arg3, arg4) {
    wasm.wasm_bindgen__convert__closures_____invoke__h299b44f41e2e099e(arg0, arg1, arg2, arg3, arg4);
}

function wasm_bindgen__convert__closures_____invoke__h2d77a01e92f848be(arg0, arg1, arg2, arg3, arg4) {
    wasm.wasm_bindgen__convert__closures_____invoke__h2d77a01e92f848be(arg0, arg1, arg2, arg3, arg4);
}

function wasm_bindgen__convert__closures_____invoke__h3a2f664bd7bbcd34(arg0, arg1, arg2, arg3, arg4) {
    wasm.wasm_bindgen__convert__closures_____invoke__h3a2f664bd7bbcd34(arg0, arg1, arg2, arg3, arg4);
}

function wasm_bindgen__convert__closures_____invoke__h2e56b68b9ae5d0a5(arg0, arg1, arg2, arg3, arg4) {
    wasm.wasm_bindgen__convert__closures_____invoke__h2e56b68b9ae5d0a5(arg0, arg1, arg2, arg3, arg4);
}

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

const ProcessingConfigFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_processingconfig_free(ptr >>> 0, 1));

const WasmCapabilityReportFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmcapabilityreport_free(ptr >>> 0, 1));

const WasmConfigManagerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmconfigmanager_free(ptr >>> 0, 1));

const WasmGpuSelectorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmgpuselector_free(ptr >>> 0, 1));

const WasmProgressFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmprogress_free(ptr >>> 0, 1));

const WasmThreadingErrorFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmthreadingerror_free(ptr >>> 0, 1));

const WasmVectorizerFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmvectorizer_free(ptr >>> 0, 1));

const WasmVectorizerRefactoredFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmvectorizerrefactored_free(ptr >>> 0, 1));

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
if (Symbol.dispose) GpuBackendInfo.prototype[Symbol.dispose] = GpuBackendInfo.prototype.free;

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
if (Symbol.dispose) ProcessingConfig.prototype[Symbol.dispose] = ProcessingConfig.prototype.free;

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
if (Symbol.dispose) WasmCapabilityReport.prototype[Symbol.dispose] = WasmCapabilityReport.prototype.free;

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
if (Symbol.dispose) WasmConfigManager.prototype[Symbol.dispose] = WasmConfigManager.prototype.free;

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
if (Symbol.dispose) WasmGpuSelector.prototype[Symbol.dispose] = WasmGpuSelector.prototype.free;

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
if (Symbol.dispose) WasmProgress.prototype[Symbol.dispose] = WasmProgress.prototype.free;

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
if (Symbol.dispose) WasmThreadingError.prototype[Symbol.dispose] = WasmThreadingError.prototype.free;

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
     * Set width multiplier for line thickness
     * @param {number} multiplier
     */
    set_width_multiplier(multiplier) {
        const ret = wasm.wasmvectorizer_set_width_multiplier(this.__wbg_ptr, multiplier);
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
     * Enable or disable gradient-based sizing
     * @param {boolean} enabled
     */
    set_gradient_based_sizing(enabled) {
        wasm.wasmvectorizer_set_gradient_based_sizing(this.__wbg_ptr, enabled);
    }
    /**
     * Set dot size variation factor
     * @param {number} variation
     */
    set_dot_size_variation(variation) {
        const ret = wasm.wasmvectorizer_set_dot_size_variation(this.__wbg_ptr, variation);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set dot shape (0=Circle, 1=Square, 2=Diamond, 3=Triangle)
     * @param {number} shape
     */
    set_dot_shape(shape) {
        const ret = wasm.wasmvectorizer_set_dot_shape(this.__wbg_ptr, shape);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * Set dot grid pattern (0=Grid, 1=Hexagonal, 2=Random)
     * @param {number} pattern
     */
    set_dot_grid_pattern(pattern) {
        const ret = wasm.wasmvectorizer_set_dot_grid_pattern(this.__wbg_ptr, pattern);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
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
if (Symbol.dispose) WasmVectorizer.prototype[Symbol.dispose] = WasmVectorizer.prototype.free;

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
if (Symbol.dispose) WasmVectorizerRefactored.prototype[Symbol.dispose] = WasmVectorizerRefactored.prototype.free;

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
 * Create a processing manager with recommended configuration
 * @returns {ProcessingConfig}
 */
export function create_optimal_processing_manager() {
    const ret = wasm.create_optimal_processing_manager();
    return ProcessingConfig.__wrap(ret);
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
 * Emergency cleanup function for error recovery
 */
export function emergency_cleanup() {
    const ret = wasm.emergency_cleanup();
    if (ret[1]) {
        throw takeFromExternrefTable0(ret[0]);
    }
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
 * Provide actionable recommendations for enabling threading
 * @returns {any[]}
 */
export function get_threading_recommendations() {
    const ret = wasm.get_threading_recommendations();
    var v1 = getArrayJsValueFromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
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
 * Initialize GPU backend with automatic detection and fallback
 * @returns {Promise<GpuBackendInfo>}
 */
export function initialize_gpu_backend() {
    const ret = wasm.initialize_gpu_backend();
    return ret;
}

/**
 * Initialize GPU processing pipeline (async)
 * @returns {Promise<string>}
 */
export function initialize_gpu_processing() {
    const ret = wasm.initialize_gpu_processing();
    return ret;
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
 * Check if GPU acceleration is currently available
 * @returns {boolean}
 */
export function is_gpu_acceleration_available() {
    const ret = wasm.is_gpu_acceleration_available();
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
 * Check if SharedArrayBuffer is supported and functional
 * @returns {boolean}
 */
export function is_shared_array_buffer_supported() {
    const ret = wasm.is_shared_array_buffer_supported();
    return ret !== 0;
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
 * Force reset GPU backend (for testing/debugging)
 */
export function reset_gpu_backend() {
    wasm.reset_gpu_backend();
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

/**
 * Initialize the wasm module with basic setup
 */
export function wasm_init() {
    wasm.wasm_init();
}

const EXPECTED_RESPONSE_TYPES = new Set(['basic', 'cors', 'default']);

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && EXPECTED_RESPONSE_TYPES.has(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
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
    imports.wbg.__wbg_1_9ba6821a3f0ecb80 = function() {
        const ret = RegExp.$1;
        return ret;
    };
    imports.wbg.__wbg_2_a5f54a7fe3a9f085 = function() {
        const ret = RegExp.$2;
        return ret;
    };
    imports.wbg.__wbg_3_67ca363162f6bf31 = function() {
        const ret = RegExp.$3;
        return ret;
    };
    imports.wbg.__wbg_4_130199175b5ad1d5 = function() {
        const ret = RegExp.$4;
        return ret;
    };
    imports.wbg.__wbg_5_19fd861b298d7b21 = function() {
        const ret = RegExp.$5;
        return ret;
    };
    imports.wbg.__wbg_6_4457120d3bf15b40 = function() {
        const ret = RegExp.$6;
        return ret;
    };
    imports.wbg.__wbg_7_66ce73c7973d9220 = function() {
        const ret = RegExp.$7;
        return ret;
    };
    imports.wbg.__wbg_8_03c5c41d0daefe3c = function() {
        const ret = RegExp.$8;
        return ret;
    };
    imports.wbg.__wbg_9_534d55f698942c28 = function() {
        const ret = RegExp.$9;
        return ret;
    };
    imports.wbg.__wbg_Atomics_3b464f352c5a5881 = function() { return handleError(function () {
        const ret = globalThis.Atomics();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_BigInt_71d549ec47eef163 = function(arg0, arg1) {
        const ret = BigInt(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_BigInt_811579177bbea12d = function() { return handleError(function (arg0) {
        const ret = BigInt(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_BigInt_f9ddbcf8ed387722 = function(arg0) {
        const ret = BigInt(arg0);
        return ret;
    };
    imports.wbg.__wbg_Deno_3388d30851d104ab = function() { return handleError(function () {
        const ret = globalThis.Deno();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_Error_52673b7de5a0ca89 = function(arg0, arg1) {
        const ret = Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_Number_2d1dcfcf4ec51736 = function(arg0) {
        const ret = Number(arg0);
        return ret;
    };
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
    imports.wbg.__wbg_Symbol_5ed7214408cbc78b = function(arg0, arg1) {
        const ret = Symbol(arg0 === 0 ? undefined : getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_URL_98c155ffedb4c452 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.URL;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_UTC_86da7ccea0146dcc = function(arg0, arg1) {
        const ret = Date.UTC(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_WebGL2RenderingContext_c0b42e22650ff2c9 = function() { return handleError(function () {
        const ret = globalThis.WebGL2RenderingContext();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_Window_6419f7513544dd0b = function(arg0) {
        const ret = arg0.Window;
        return ret;
    };
    imports.wbg.__wbg_WorkerGlobalScope_147f18e856464ee4 = function(arg0) {
        const ret = arg0.WorkerGlobalScope;
        return ret;
    };
    imports.wbg.__wbg_Worker_60f910cbbd3d870d = function() { return handleError(function () {
        const ret = globalThis.Worker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg___wbindgen_add_f51a0137324874e6 = function(arg0, arg1) {
        const ret = arg0 + arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_bigint_get_as_i64_6e32f5e6aff02e1d = function(arg0, arg1) {
        const v = arg1;
        const ret = typeof(v) === 'bigint' ? v : undefined;
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_bit_and_7a3fdf1d05878f22 = function(arg0, arg1) {
        const ret = arg0 & arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_bit_not_a092de88dbf47300 = function(arg0) {
        const ret = ~arg0;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_bit_or_0c1f1880f5569ed7 = function(arg0, arg1) {
        const ret = arg0 | arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_bit_xor_3e10f690345846ea = function(arg0, arg1) {
        const ret = arg0 ^ arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_boolean_get_dea25b33882b895b = function(arg0) {
        const v = arg0;
        const ret = typeof(v) === 'boolean' ? v : undefined;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg___wbindgen_checked_div_eeb3c20eda49ce8c = function(arg0, arg1) {
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
    imports.wbg.__wbg___wbindgen_copy_to_typed_array_db832bc4df7216c1 = function(arg0, arg1, arg2) {
        new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg___wbindgen_debug_string_adfb662ae34724b6 = function(arg0, arg1) {
        const ret = debugString(arg1);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_div_138a0d13e754f915 = function(arg0, arg1) {
        const ret = arg0 / arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_exports_ac196ec7383166bb = function() {
        const ret = wasm;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_function_table_932edf419e6641fe = function() {
        const ret = wasm.__wbindgen_export;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_ge_853754a122edb8c4 = function(arg0, arg1) {
        const ret = arg0 >= arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_gt_bdbeb9a0be954c45 = function(arg0, arg1) {
        const ret = arg0 > arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_in_0d3e1e8f0c669317 = function(arg0, arg1) {
        const ret = arg0 in arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_bigint_0e1a2e3f55cfae27 = function(arg0) {
        const ret = typeof(arg0) === 'bigint';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_falsy_7b9692021c137978 = function(arg0) {
        const ret = !arg0;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_function_8d400b8b1af978cd = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_null_dfda7d66506c95b5 = function(arg0) {
        const ret = arg0 === null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_object_ce774f3490692386 = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_string_704ef9c8fc131030 = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_symbol_6b9e69bb98d1b29f = function(arg0) {
        const ret = typeof(arg0) === 'symbol';
        return ret;
    };
    imports.wbg.__wbg___wbindgen_is_undefined_f6b95eab589e0269 = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_jsval_eq_b6101cc9cef1fe36 = function(arg0, arg1) {
        const ret = arg0 === arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_jsval_loose_eq_766057600fdd1b0d = function(arg0, arg1) {
        const ret = arg0 == arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_le_34fa70d208edc08b = function(arg0, arg1) {
        const ret = arg0 <= arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_lt_b8a98c478e0bc0c2 = function(arg0, arg1) {
        const ret = arg0 < arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_memory_a342e963fbcabd68 = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_module_967adef62ea6cbf8 = function() {
        const ret = __wbg_init.__wbindgen_wasm_module;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_mul_1d80997e97cc7b95 = function(arg0, arg1) {
        const ret = arg0 * arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_neg_7dce5cdff91fb914 = function(arg0) {
        const ret = -arg0;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_number_get_9619185a74197f95 = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'number' ? obj : undefined;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg___wbindgen_pow_fb50226c8e8923fb = function(arg0, arg1) {
        const ret = arg0 ** arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_rem_c6a1b0742e15c04d = function(arg0, arg1) {
        const ret = arg0 % arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_rethrow_78714972834ecdf1 = function(arg0) {
        throw arg0;
    };
    imports.wbg.__wbg___wbindgen_shl_7a5c4c6b42eddafa = function(arg0, arg1) {
        const ret = arg0 << arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_shr_df5f0f11a6e22f2e = function(arg0, arg1) {
        const ret = arg0 >> arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_string_get_a2a31e16edf96e42 = function(arg0, arg1) {
        const obj = arg1;
        const ret = typeof(obj) === 'string' ? obj : undefined;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg___wbindgen_sub_eee1b2da2292f299 = function(arg0, arg1) {
        const ret = arg0 - arg1;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_throw_dd24417ed36fc46e = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg___wbindgen_try_into_number_9d33ffe037a9f5e5 = function(arg0) {
        let result;
        try { result = +arg0 } catch (e) { result = e }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_typeof_3cd6f8d7635ec871 = function(arg0) {
        const ret = typeof arg0;
        return ret;
    };
    imports.wbg.__wbg___wbindgen_unsigned_shr_90f0b0f311e6b1f6 = function(arg0, arg1) {
        const ret = arg0 >>> arg1;
        return ret;
    };
    imports.wbg.__wbg__wbg_cb_unref_87dfb5aaa0cbcea7 = function(arg0) {
        arg0._wbg_cb_unref();
    };
    imports.wbg.__wbg_abs_87198898e33df82c = function(arg0) {
        const ret = Math.abs(arg0);
        return ret;
    };
    imports.wbg.__wbg_accessKeyLabel_f30ab6c79e6322e0 = function(arg0, arg1) {
        const ret = arg1.accessKeyLabel;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_accessKey_9b5d7e932ae06d5e = function(arg0, arg1) {
        const ret = arg1.accessKey;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_acos_aefe93d6a95d30fd = function(arg0) {
        const ret = Math.acos(arg0);
        return ret;
    };
    imports.wbg.__wbg_acosh_609a270895cce2c8 = function(arg0) {
        const ret = Math.acosh(arg0);
        return ret;
    };
    imports.wbg.__wbg_activeElement_b3e6b135325e4d5f = function(arg0) {
        const ret = arg0.activeElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_activeTexture_1db0722f00c3f843 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_activeTexture_59810c16ea8d6e34 = function(arg0, arg1) {
        arg0.activeTexture(arg1 >>> 0);
    };
    imports.wbg.__wbg_activeVRDisplays_c7915ab1cf5ff9d3 = function(arg0) {
        const ret = arg0.activeVRDisplays;
        return ret;
    };
    imports.wbg.__wbg_adapterInfo_9c1df222c0e3c176 = function(arg0) {
        const ret = arg0.adapterInfo;
        return ret;
    };
    imports.wbg.__wbg_addEventListener_6a82629b3d430a48 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_addEventListener_a18e2dc27dcf3e63 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0, arg5 === 0xFFFFFF ? undefined : arg5 !== 0);
    }, arguments) };
    imports.wbg.__wbg_addEventListener_db4b6a7c16aa3f6c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.addEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0);
    }, arguments) };
    imports.wbg.__wbg_add_81faa3f201cf1b75 = function(arg0, arg1) {
        const ret = arg0.add(arg1);
        return ret;
    };
    imports.wbg.__wbg_add_d693daf8a655848c = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.add(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_add_e0e7f4f1ce6560fb = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.add(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_add_f0bf6d9527665471 = function(arg0, arg1) {
        const ret = arg0.add(arg1);
        return ret;
    };
    imports.wbg.__wbg_adoptNode_97324f121c69e705 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.adoptNode(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_adoptedStyleSheets_e1d0661a35da4efd = function(arg0) {
        const ret = arg0.adoptedStyleSheets;
        return ret;
    };
    imports.wbg.__wbg_after_02a16dcbc473d06d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_after_35ebcb8d1fea2b75 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.after(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_after_41c9547d09ac2226 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.after(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_after_4c4e3c77f794a32e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_after_4fc2ca1fb72ba52c = function() { return handleError(function (arg0) {
        arg0.after();
    }, arguments) };
    imports.wbg.__wbg_after_526fcf390b799539 = function() { return handleError(function (arg0, arg1) {
        arg0.after(arg1);
    }, arguments) };
    imports.wbg.__wbg_after_634bd26a917e9bcc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_after_8249abd27eea0c6c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_after_847b80b28e0857f3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_after_8986638d96645224 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.after(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_after_914921124d3d784d = function() { return handleError(function (arg0, arg1) {
        arg0.after(...arg1);
    }, arguments) };
    imports.wbg.__wbg_after_93d27012e58b80ef = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.after(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_after_a0c2485cb6254f8c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.after(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_after_a33e9cf9286efa67 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.after(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_after_a510aa2c131be7a0 = function() { return handleError(function (arg0) {
        arg0.after();
    }, arguments) };
    imports.wbg.__wbg_after_b1f2151a8f24992c = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.after(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_after_fb01a804c5871db5 = function() { return handleError(function (arg0, arg1) {
        arg0.after(...arg1);
    }, arguments) };
    imports.wbg.__wbg_after_fd25827ebf7c49ad = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.after(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_alert_0b7a7304460e8cd2 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.alert(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_alert_7b878f00b10cffa0 = function() { return handleError(function (arg0) {
        arg0.alert();
    }, arguments) };
    imports.wbg.__wbg_align_d2c60109039f2a53 = function(arg0, arg1) {
        const ret = arg1.align;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_allSettled_b519a170ca5b1b1c = function(arg0) {
        const ret = Promise.allSettled(arg0);
        return ret;
    };
    imports.wbg.__wbg_all_4f6004f90ec12c94 = function(arg0) {
        const ret = Promise.all(arg0);
        return ret;
    };
    imports.wbg.__wbg_allocationSize_0451064387ed2ed1 = function() { return handleError(function (arg0) {
        const ret = arg0.allocationSize();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_alt_b693f9d7117c2287 = function(arg0, arg1) {
        const ret = arg1.alt;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_and_d3771a27af6ffd2b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.and(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_and_fa6c2f8f864f1aed = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.and(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_any_49b45c28884fab89 = function(arg0) {
        const ret = Promise.any(arg0);
        return ret;
    };
    imports.wbg.__wbg_appCodeName_924958c78786d2f5 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appCodeName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appCodeName_cdc56b34dd1534ba = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appCodeName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appName_7ec5c21097d5cb07 = function(arg0, arg1) {
        const ret = arg1.appName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_appName_da72cab9e73233c5 = function(arg0, arg1) {
        const ret = arg1.appName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_appVersion_53f2f76bf7fbc0eb = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appVersion;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appVersion_ef5be94ac592eb80 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.appVersion;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_appendChild_7465eba84213c75f = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.appendChild(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_append_024d1897c950c584 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_append_0d646351dfd34da5 = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_11bcec493ae04435 = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_135168641c38cbce = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_append_1cdb7348cce5b6b1 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_append_236b54d452ce530a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_append_2b1ada4939026f05 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_append_33c13a8d9e697d97 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_append_36eca56cb83018da = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_append_4059b1a015a77177 = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_45f54b2ec65d9363 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_append_4b6d9381787a12a1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_append_4d6a3507c3f62079 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.append(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_append_704ad54e10383e93 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.append(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_append_76551e93c1240d8a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_append_7ec8c6b76ab4e29f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_append_888d0f2a6670c607 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_append_8e317f0bafd373d1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_append_969ac5299da5957c = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.append(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_append_a385c965b3208fd6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.append(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_append_a658137e48eb8663 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_append_aefa746cb024c3a9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_append_c227d3d375ff7205 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_append_c4bb008f7c27a184 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.append(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_append_c608fd028d7b176a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_append_c63f1a9c20eb9acc = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_c9adf097b7f09f9f = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_d19158b2c525951f = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_d215ac2f2b4703cd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.append(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_append_dbfa398b2856f907 = function() { return handleError(function (arg0, arg1) {
        arg0.append(arg1);
    }, arguments) };
    imports.wbg.__wbg_append_df4417067a3a3f5b = function() { return handleError(function (arg0) {
        arg0.append();
    }, arguments) };
    imports.wbg.__wbg_append_e1d80300cb3e0696 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.append(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_append_e5cf5476a21a4449 = function() { return handleError(function (arg0, arg1) {
        arg0.append(...arg1);
    }, arguments) };
    imports.wbg.__wbg_append_f02ae842652591f4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_append_f1adc32362f30f6d = function() { return handleError(function (arg0, arg1) {
        arg0.append(arg1);
    }, arguments) };
    imports.wbg.__wbg_append_f4bd830d6edd9062 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_apply_0be48b84f7a793c6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.apply(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_apply_52e9ae668d017009 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.apply(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_architecture_e02870859419ad1f = function(arg0, arg1) {
        const ret = arg1.architecture;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_asIntN_7c9204861b68621f = function(arg0, arg1) {
        const ret = BigInt.asIntN(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_asUintN_1d9d9065d9baab04 = function(arg0, arg1) {
        const ret = BigInt.asUintN(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_asin_e80fa723e8fc5e5c = function(arg0) {
        const ret = Math.asin(arg0);
        return ret;
    };
    imports.wbg.__wbg_asinh_41fca6839a0e1963 = function(arg0) {
        const ret = Math.asinh(arg0);
        return ret;
    };
    imports.wbg.__wbg_assert_323e59fdbfaf8002 = function() {
        console.assert();
    };
    imports.wbg.__wbg_assert_80f345d1388f6f04 = function(arg0) {
        console.assert(arg0 !== 0);
    };
    imports.wbg.__wbg_assert_83dd6b2e600adad9 = function(arg0, arg1, arg2, arg3) {
        console.assert(arg0 !== 0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_assert_8e8b09aaaf7eee06 = function(arg0, arg1, arg2, arg3, arg4) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_assert_bcafa0c01cf5a32c = function(arg0, arg1, arg2) {
        console.assert(arg0 !== 0, arg1, arg2);
    };
    imports.wbg.__wbg_assert_cad5e165c29069e8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_assert_da7815c1d7fcb5d0 = function(arg0, arg1) {
        console.assert(arg0 !== 0, arg1);
    };
    imports.wbg.__wbg_assert_e06e5778892c73ce = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_assert_ec79ef64a16e2e6b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        console.assert(arg0 !== 0, arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_assert_ffa4776cdff169d0 = function(arg0, arg1) {
        console.assert(arg0 !== 0, ...arg1);
    };
    imports.wbg.__wbg_assign_069e610fa5e6ee90 = function(arg0, arg1) {
        const ret = Object.assign(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_assign_b0a7eeba804f8564 = function(arg0, arg1, arg2) {
        const ret = Object.assign(arg0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_assign_eb89df4275dfcde1 = function(arg0, arg1, arg2, arg3) {
        const ret = Object.assign(arg0, arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_asyncIterator_b0f33c445ccd88ac = function() {
        const ret = Symbol.asyncIterator;
        return ret;
    };
    imports.wbg.__wbg_at_0d59f9397e58e807 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_2be3096d2019ef09 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_at_505937f1c4b80bfa = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return ret;
    };
    imports.wbg.__wbg_at_7b2a2050e3fa2052 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_8e92a08aa04f60f3 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_at_a9deac245eb8980b = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0x100000001 : (ret) >> 0;
    };
    imports.wbg.__wbg_at_b435be9d4512bc76 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_at_b67c5e2d6a78e3e7 = function(arg0, arg1, arg2) {
        const ret = arg1.at(arg2);
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_at_b6cc0bf2eafabc89 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_bde893fb43113083 = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_d2a6487862a04eda = function(arg0, arg1) {
        const ret = arg0.at(arg1);
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_at_d4d85d2d445382e6 = function(arg0, arg1, arg2) {
        const ret = arg1.at(arg2);
        getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_at_e8f1e94c82caa230 = function(arg0, arg1, arg2) {
        const ret = arg1.at(arg2);
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_atan2_b7b6a8097fb9cd1e = function(arg0, arg1) {
        const ret = Math.atan2(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_atan_302609963c4335e1 = function(arg0) {
        const ret = Math.atan(arg0);
        return ret;
    };
    imports.wbg.__wbg_atanh_069fb298bb5b4ebb = function(arg0) {
        const ret = Math.atanh(arg0);
        return ret;
    };
    imports.wbg.__wbg_atob_20a28638562b84ed = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.atob(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_atob_bc6824d7689dbf98 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.atob(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_attachShader_bc2b53790fd12d3a = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_attachShader_ce575704294db9cc = function(arg0, arg1, arg2) {
        arg0.attachShader(arg1, arg2);
    };
    imports.wbg.__wbg_autofocus_2f06f80bd04a5be7 = function(arg0) {
        const ret = arg0.autofocus;
        return ret;
    };
    imports.wbg.__wbg_autoplay_bd9d47ab772f36e8 = function(arg0) {
        const ret = arg0.autoplay;
        return ret;
    };
    imports.wbg.__wbg_baseURI_9da16393a89b3e1e = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.baseURI;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_before_094ce19081d17b5c = function() { return handleError(function (arg0) {
        arg0.before();
    }, arguments) };
    imports.wbg.__wbg_before_09b7bedce8a6f2c4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.before(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_before_0dc972bd1560911b = function() { return handleError(function (arg0, arg1) {
        arg0.before(...arg1);
    }, arguments) };
    imports.wbg.__wbg_before_0f6b9696bd730ecd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_before_1e30764b13c1499c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.before(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_before_1e3fb4ac7869d7c6 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.before(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_before_229ad066c953b297 = function() { return handleError(function (arg0, arg1) {
        arg0.before(arg1);
    }, arguments) };
    imports.wbg.__wbg_before_63c9d46ac270b065 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.before(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_before_66e9fd0c2640a838 = function() { return handleError(function (arg0) {
        arg0.before();
    }, arguments) };
    imports.wbg.__wbg_before_70816e17cc3e0c8f = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.before(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_before_7702c06670985270 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_before_862861dc774fdb9a = function() { return handleError(function (arg0, arg1) {
        arg0.before(...arg1);
    }, arguments) };
    imports.wbg.__wbg_before_8828dac6add089d8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_before_a226a406bdc9da80 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.before(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_before_a266145ef134b91c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_before_cb117aae7ab2ce53 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.before(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_before_ef5b1f7f6f82abef = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_before_fa041ea29e8cf60d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.before(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_beginComputePass_d1fdb8126d3023c7 = function(arg0, arg1) {
        const ret = arg0.beginComputePass(arg1);
        return ret;
    };
    imports.wbg.__wbg_beginComputePass_fc4d77f65c31c8c7 = function(arg0) {
        const ret = arg0.beginComputePass();
        return ret;
    };
    imports.wbg.__wbg_beginOcclusionQuery_02a33d1c6bf7a6fc = function(arg0, arg1) {
        arg0.beginOcclusionQuery(arg1 >>> 0);
    };
    imports.wbg.__wbg_beginQueryEXT_af20e10360b3a2c5 = function(arg0, arg1, arg2) {
        arg0.beginQueryEXT(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_beginQuery_71fca84d19c65fb1 = function(arg0, arg1, arg2) {
        arg0.beginQuery(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_beginRenderPass_5959b1e03e4f545c = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.beginRenderPass(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_beginTransformFeedback_12c2685642c4d856 = function(arg0, arg1) {
        arg0.beginTransformFeedback(arg1 >>> 0);
    };
    imports.wbg.__wbg_bindAttribLocation_2bf0ba75dbebbc07 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bindAttribLocation_4e8be7470dd8dd5a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bindAttribLocation(arg1, arg2 >>> 0, getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bindBufferBase_ff74eb07e91625d0 = function(arg0, arg1, arg2, arg3) {
        arg0.bindBufferBase(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_bindBufferRange_6ca415b6271f6d15 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBufferRange_6cdd064b625dc6b5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBufferRange_b775673f1d6f510c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBufferRange_d4e957a302c0ded2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bindBufferRange(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_bindBuffer_110b128c65a97376 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindBuffer_c24c31cbec41cb21 = function(arg0, arg1, arg2) {
        arg0.bindBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_302dbc9f62d8321e = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindFramebuffer_33b64eb9f536d2b2 = function(arg0, arg1, arg2) {
        arg0.bindFramebuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_032b12b73a396d8c = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindRenderbuffer_43c98d43540f75ae = function(arg0, arg1, arg2) {
        arg0.bindRenderbuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindSampler_b835d52aec542c4c = function(arg0, arg1, arg2) {
        arg0.bindSampler(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_4537240b278f1d53 = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTexture_6ed714c0afe8b8d1 = function(arg0, arg1, arg2) {
        arg0.bindTexture(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindTransformFeedback_2ce8780b3280f2e8 = function(arg0, arg1, arg2) {
        arg0.bindTransformFeedback(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_bindVertexArrayOES_fdb7e747e386f55a = function(arg0, arg1) {
        arg0.bindVertexArrayOES(arg1);
    };
    imports.wbg.__wbg_bindVertexArray_ced27387a0718508 = function(arg0, arg1) {
        arg0.bindVertexArray(arg1);
    };
    imports.wbg.__wbg_bind_06ff80b5298136c8 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    };
    imports.wbg.__wbg_bind_123460e3b8f1e853 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_bind_4a14e431c3bc4d50 = function(arg0, arg1) {
        const ret = arg0.bind(arg1);
        return ret;
    };
    imports.wbg.__wbg_bind_514f7bd1ff450d8f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4, arg5);
        return ret;
    };
    imports.wbg.__wbg_bind_65a4715c4a8c8727 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.bind(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_bind_6c27f5b92f5c6bf1 = function(arg0, arg1) {
        const ret = arg0.bind(arg1);
        return ret;
    };
    imports.wbg.__wbg_bind_709fd2f41c302bed = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    };
    imports.wbg.__wbg_bind_952dc010317a2fb1 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    };
    imports.wbg.__wbg_bind_a139ad94dd14501b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    };
    imports.wbg.__wbg_bind_a5b6fa3dd4ea696d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.bind(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    };
    imports.wbg.__wbg_bind_f9b0f897210eeff9 = function(arg0, arg1, arg2) {
        const ret = arg0.bind(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_blendColor_e45c66bf83bef98c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_blendColor_f4107640d80916d6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_blendEquationSeparate_403e2a62d6e0d67f = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendEquationSeparate_e1eb0d0f32ef91af = function(arg0, arg1, arg2) {
        arg0.blendEquationSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendEquation_493973ecbb09fe8c = function(arg0, arg1) {
        arg0.blendEquation(arg1 >>> 0);
    };
    imports.wbg.__wbg_blendEquation_e3d6a981d832c9ff = function(arg0, arg1) {
        arg0.blendEquation(arg1 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_4cca29476893cc61 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blendFuncSeparate_e5a1bacf4a0700cd = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.blendFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_blendFunc_046483861de36edd = function(arg0, arg1, arg2) {
        arg0.blendFunc(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blendFunc_5eed6dc03a180da2 = function(arg0, arg1, arg2) {
        arg0.blendFunc(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_blitFramebuffer_02db7e02b81bd174 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.blitFramebuffer(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_blur_c339da7e76f3df11 = function() { return handleError(function (arg0) {
        arg0.blur();
    }, arguments) };
    imports.wbg.__wbg_blur_ca11f751d4c09d3f = function() { return handleError(function (arg0) {
        arg0.blur();
    }, arguments) };
    imports.wbg.__wbg_body_544738f8b03aef13 = function(arg0) {
        const ret = arg0.body;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_border_05e61d26ba7ff10f = function(arg0, arg1) {
        const ret = arg1.border;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_btoa_b0a9a863674cb816 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.btoa(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_btoa_b383d7e04289c7ab = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.btoa(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_bubbles_e4c9c79552ecbd09 = function(arg0) {
        const ret = arg0.bubbles;
        return ret;
    };
    imports.wbg.__wbg_bufferData_07ac7d92a4e65506 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_0d8be7d366c3f077 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferData_17d61f32d7590dec = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_bufferData_26dfe6d3765d2754 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_3d55f9f50609a0ba = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferData_5b3837a860080fb4 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_69dbeea8e1d79f7b = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_6fc630d7370ac379 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_70bfa5076d43c58d = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_77ef38944e826aba = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_7a8744cc3f06459e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferData_9f53a24612a9118b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_ac5c7900b06f1517 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_c75947f383ca8992 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_ca0a87aa6811791d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, getArrayU8FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_cd7c1cdb1eb72df8 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferData_f7eb25efd9a45331 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferData_ff13eef16e1001b2 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferData(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_16db9d7d9f1c86bb = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_18026db986e6fb34 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_1c0233cf2f2e99cd = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_28d47ffa15570f9e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_3a9292cfea94fec6 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_3d1484e70bfde8b7 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_45c5e5f1b2435b45 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_4c6b19bdb89c2482 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_4cee1827bf1ad36d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_77237ab26efa5c39 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_7f883736324c7128 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_83551557762cf10f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_8b43e4005f75b964 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_8ffc362f5a4e9593 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_9011577ffca5dc8a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_970a437ae5954ccc = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_a0e0f435b2e089eb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_ada03bb29b796358 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_b636a7d12a8678b0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_bufferSubData_bdbdeb18afa95248 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_c5851cb33105db49 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_cbe370f15bf32619 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_db8159cf096c2195 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_dd4e1cda255492fa = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_e256855a0fda09a5 = function(arg0, arg1, arg2, arg3) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_bufferSubData_e3880944fbd4df20 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.bufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_eb8eaac3f5be452f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_bufferSubData_f3ccc9ec6547909a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.bufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_buffer_04f1c59be0acb775 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_063cd102cc769a1c = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_0a7080a1bc7189eb = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_114d7359e2d9f753 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_13323103a2a4e87b = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_456c2df4938a8ca3 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_69cda8fd88b1428e = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_6b0140da77b67e54 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_6cb2fecb1f253d71 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_732e15cdebf321c9 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_8bb379628aba68a7 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_af193272cf774566 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_buffer_ee0a9e6e16ff5548 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_byteLength_0141dc9253c47970 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_05cd8538d8f5f592 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_166ad9a51ecaa5f1 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_2965de6eba830936 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_3ac30bfa6e8b68bd = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_3c17275ba6d3cea6 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_4e9bc31005d12d2d = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_5fb1bcb69a0bf842 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_7aa73df2cc3c9923 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_862cb490669d50e7 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_870be2f420103f14 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_8ed5c8558e7c30ba = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_f9291d0ccf8ab450 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteLength_faa9938885bdeee6 = function(arg0) {
        const ret = arg0.byteLength;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_21b80a3d2bb73a08 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_3868b6a19ba01dea = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_3adec0ef0b6bebe6 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_412eca19c31d62e3 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_49129783699312a5 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_525e7f191a044a9b = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_624a997b4e4e6846 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_a6c2bbcc0a49f0b1 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_c4606b50cfb6089e = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_c9e9c9b4f1dc1a3a = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_f02922482a5d92a9 = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_byteOffset_f035ac5fd5daaccd = function(arg0) {
        const ret = arg0.byteOffset;
        return ret;
    };
    imports.wbg.__wbg_call_3020136f7a2d6e44 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_3cc1459bcdc6ba34 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.call(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_760a3f0ff6ecdb31 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.call(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_78f94eb02ec7f9b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.call(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_919ffb35c4866267 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.call(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_985cbf350d9ec0e5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.call(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_abb4ff46ce38be40 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_c8baa5c5e72d274e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.call(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_d0e988159bc34db5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.call(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_d648a25feae57325 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.call(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_canPlayType_dffc802caf2d2c1f = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.canPlayType(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_canShare_7793dfc9f3cd61bd = function(arg0) {
        const ret = arg0.canShare();
        return ret;
    };
    imports.wbg.__wbg_cancelAnimationFrame_1c2a3faf7be5aedd = function() { return handleError(function (arg0, arg1) {
        arg0.cancelAnimationFrame(arg1);
    }, arguments) };
    imports.wbg.__wbg_cancelBubble_3ab876913f65579a = function(arg0) {
        const ret = arg0.cancelBubble;
        return ret;
    };
    imports.wbg.__wbg_cancelIdleCallback_ee06eb3dcf335b86 = function(arg0, arg1) {
        arg0.cancelIdleCallback(arg1 >>> 0);
    };
    imports.wbg.__wbg_cancelable_be0c78c96f088787 = function(arg0) {
        const ret = arg0.cancelable;
        return ret;
    };
    imports.wbg.__wbg_canvas_4a39288846a90113 = function(arg0) {
        const ret = arg0.canvas;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_canvas_bf6e7e57507edee6 = function(arg0) {
        const ret = arg0.canvas;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_canvas_e6f23b521de505d0 = function(arg0) {
        const ret = arg0.canvas;
        return ret;
    };
    imports.wbg.__wbg_captureEvents_5b0cc7d547c4195b = function(arg0) {
        arg0.captureEvents();
    };
    imports.wbg.__wbg_catch_b9db41d97d42bd02 = function(arg0, arg1) {
        const ret = arg0.catch(arg1);
        return ret;
    };
    imports.wbg.__wbg_cause_2863fe79d084e5de = function(arg0) {
        const ret = arg0.cause;
        return ret;
    };
    imports.wbg.__wbg_cbrt_929b2406f28a33a3 = function(arg0) {
        const ret = Math.cbrt(arg0);
        return ret;
    };
    imports.wbg.__wbg_ceil_8beb0f6ee51bb5e3 = function(arg0) {
        const ret = Math.ceil(arg0);
        return ret;
    };
    imports.wbg.__wbg_charAt_0cdd32c7b866079d = function(arg0, arg1) {
        const ret = arg0.charAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_charCodeAt_6c748220ece97752 = function(arg0, arg1) {
        const ret = arg0.charCodeAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_characterSet_37e2dab2a360e43a = function(arg0, arg1) {
        const ret = arg1.characterSet;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_charset_64c1eabd0e7798fb = function(arg0, arg1) {
        const ret = arg1.charset;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_checkFramebufferStatus_2dbefa14c1025c31 = function(arg0, arg1) {
        const ret = arg0.checkFramebufferStatus(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_checkFramebufferStatus_4935a1d7f055b1ee = function(arg0, arg1) {
        const ret = arg0.checkFramebufferStatus(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_childElementCount_237f0defddc78ec5 = function(arg0) {
        const ret = arg0.childElementCount;
        return ret;
    };
    imports.wbg.__wbg_childElementCount_ff8fc2ad78e51895 = function(arg0) {
        const ret = arg0.childElementCount;
        return ret;
    };
    imports.wbg.__wbg_childNodes_a436cdf89add6091 = function(arg0) {
        const ret = arg0.childNodes;
        return ret;
    };
    imports.wbg.__wbg_className_946061936d3b566a = function(arg0, arg1) {
        const ret = arg1.className;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_clearBuffer_2b0a3c8ac8b1cdab = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_clearBuffer_44f79cbb535a37dd = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_clearBuffer_6c1ed37eeb072d06 = function(arg0, arg1) {
        arg0.clearBuffer(arg1);
    };
    imports.wbg.__wbg_clearBuffer_c11ce29133b903ba = function(arg0, arg1, arg2) {
        arg0.clearBuffer(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_clearBuffer_ce715461b24fa8ad = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_clearBuffer_d734bcb0f4fad3c6 = function(arg0, arg1, arg2) {
        arg0.clearBuffer(arg1, arg2);
    };
    imports.wbg.__wbg_clearBuffer_eb503ef007533db0 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBuffer(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_clearBufferfi_f256057b2316c871 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfi(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearBufferfv_194fee8a322f3f05 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferfv_59c5ea098d0c363e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_clearBufferfv_6ab71376b0d7d4f4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferfv_d33b9af84c129287 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_clearBufferfv_d70805274072fd83 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferfv_f9cc49acf1664828 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferfv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_0f391d5b2b0dc35f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_45518934fffa01f0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_49edff670c34419f = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferiv_797adc91f7e07f51 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferiv_ba2da32ddbdf9e20 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, getArrayI32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_clearBufferiv_c0a18e74f17f22d4 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferuiv_133102114bf57f44 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_1393e35c8b48e0eb = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferuiv_2771a6f7a6cfdb14 = function(arg0, arg1, arg2, arg3) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_clearBufferuiv_b57fa830853c0bf0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_e23024e059fc3ecd = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_clearBufferuiv_e465a763e54627c1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearBufferuiv(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_clearColor_66e5dad6393f32ec = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearColor_fe8de7e582b77e40 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.clearColor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_clearDepth_0f3bb08f167cf1f0 = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clearDepth_49b8cc204e46a1ff = function(arg0, arg1) {
        arg0.clearDepth(arg1);
    };
    imports.wbg.__wbg_clearInterval_04be3b7c0d091a56 = function(arg0, arg1) {
        arg0.clearInterval(arg1);
    };
    imports.wbg.__wbg_clearInterval_45ac4607741420fd = function(arg0, arg1) {
        arg0.clearInterval(arg1);
    };
    imports.wbg.__wbg_clearInterval_9d92ae0e499d0888 = function(arg0) {
        arg0.clearInterval();
    };
    imports.wbg.__wbg_clearInterval_f33dcf89ba55ac1b = function(arg0) {
        arg0.clearInterval();
    };
    imports.wbg.__wbg_clearMarks_359050904acf90ef = function(arg0) {
        arg0.clearMarks();
    };
    imports.wbg.__wbg_clearMarks_b6805d05b52fbb3d = function(arg0, arg1, arg2) {
        arg0.clearMarks(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_clearMeasures_17778dde5d9eff62 = function(arg0) {
        arg0.clearMeasures();
    };
    imports.wbg.__wbg_clearMeasures_f20690dd5ac8e29d = function(arg0, arg1, arg2) {
        arg0.clearMeasures(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_clearResourceTimings_d9626cba9d4f4c30 = function(arg0) {
        arg0.clearResourceTimings();
    };
    imports.wbg.__wbg_clearStencil_159eaeffc88e2487 = function(arg0, arg1) {
        arg0.clearStencil(arg1);
    };
    imports.wbg.__wbg_clearStencil_f1d7134551355df7 = function(arg0, arg1) {
        arg0.clearStencil(arg1);
    };
    imports.wbg.__wbg_clearTimeout_1ca823b279705d35 = function(arg0, arg1) {
        arg0.clearTimeout(arg1);
    };
    imports.wbg.__wbg_clearTimeout_258680fea6f848b4 = function(arg0, arg1) {
        arg0.clearTimeout(arg1);
    };
    imports.wbg.__wbg_clearTimeout_3331b97b82546878 = function(arg0) {
        arg0.clearTimeout();
    };
    imports.wbg.__wbg_clearTimeout_b6c5b04345668121 = function(arg0) {
        arg0.clearTimeout();
    };
    imports.wbg.__wbg_clear_00ac71df5db8ab17 = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clear_52caf9271911674b = function(arg0, arg1) {
        arg0.clear(arg1 >>> 0);
    };
    imports.wbg.__wbg_clear_9c72a3901ec7046b = function(arg0) {
        arg0.clear();
    };
    imports.wbg.__wbg_clear_bc73a1aedc8f44fd = function() {
        console.clear();
    };
    imports.wbg.__wbg_clear_c5be99b324100a91 = function(arg0) {
        arg0.clear();
    };
    imports.wbg.__wbg_click_3a8e35c38329dd3a = function(arg0) {
        arg0.click();
    };
    imports.wbg.__wbg_clientHeight_2554d64d9b2dfc4f = function(arg0) {
        const ret = arg0.clientHeight;
        return ret;
    };
    imports.wbg.__wbg_clientLeft_06fb435a3a5decb3 = function(arg0) {
        const ret = arg0.clientLeft;
        return ret;
    };
    imports.wbg.__wbg_clientTop_9830caaa8026a973 = function(arg0) {
        const ret = arg0.clientTop;
        return ret;
    };
    imports.wbg.__wbg_clientWaitSync_42970d3aaa2e5351 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.clientWaitSync(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_clientWaitSync_525bcbe574e300c4 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.clientWaitSync(arg1, arg2 >>> 0, arg3);
        return ret;
    };
    imports.wbg.__wbg_clientWidth_dbc9540f4ebdce2a = function(arg0) {
        const ret = arg0.clientWidth;
        return ret;
    };
    imports.wbg.__wbg_cloneNode_34a31a9eb445b6ad = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.cloneNode(arg1 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_cloneNode_c9c45b24b171a776 = function() { return handleError(function (arg0) {
        const ret = arg0.cloneNode();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_clone_b0d762467c814a5f = function() { return handleError(function (arg0) {
        const ret = arg0.clone();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_close_38fb96fead302152 = function() { return handleError(function (arg0) {
        arg0.close();
    }, arguments) };
    imports.wbg.__wbg_close_79883b2ec4564223 = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_close_f60e21a5470eb4fa = function(arg0) {
        arg0.close();
    };
    imports.wbg.__wbg_closed_3a457b3a4053bee1 = function() { return handleError(function (arg0) {
        const ret = arg0.closed;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_closest_82e3ba0e5d29fe5a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.closest(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_clz32_b970d51c9710167b = function(arg0) {
        const ret = Math.clz32(arg0);
        return ret;
    };
    imports.wbg.__wbg_codePointAt_6fd4439a1e465afd = function(arg0, arg1) {
        const ret = arg0.codePointAt(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_codedHeight_c3df3a6598bf57dd = function(arg0) {
        const ret = arg0.codedHeight;
        return ret;
    };
    imports.wbg.__wbg_codedWidth_0efe8401831bcb77 = function(arg0) {
        const ret = arg0.codedWidth;
        return ret;
    };
    imports.wbg.__wbg_colorMask_27d9f83dd2189ed6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_colorMask_f000b510fac0bd7c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.colorMask(arg1 !== 0, arg2 !== 0, arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_commit_4acbeb9941a1948f = function(arg0) {
        arg0.commit();
    };
    imports.wbg.__wbg_compareDocumentPosition_57b43f4bb8673d02 = function(arg0, arg1) {
        const ret = arg0.compareDocumentPosition(arg1);
        return ret;
    };
    imports.wbg.__wbg_compareExchange_7021daa1f046a310 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.compareExchange(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_compareExchange_a2a167681b69cf6f = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.compareExchange(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_compare_df4fa1bf7f367a59 = function(arg0) {
        const ret = arg0.compare;
        return ret;
    };
    imports.wbg.__wbg_compatMode_647bbf88c2a9ab10 = function(arg0, arg1) {
        const ret = arg1.compatMode;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_compileShader_ac0bf6f0837881c3 = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_compileShader_ba337110bed419e1 = function(arg0, arg1) {
        arg0.compileShader(arg1);
    };
    imports.wbg.__wbg_compileStreaming_c00952ee16c5778c = function(arg0) {
        const ret = WebAssembly.compileStreaming(arg0);
        return ret;
    };
    imports.wbg.__wbg_compile_6d35b0dd2c50b95d = function(arg0) {
        const ret = WebAssembly.compile(arg0);
        return ret;
    };
    imports.wbg.__wbg_complete_68fdab513616f178 = function(arg0) {
        const ret = arg0.complete;
        return ret;
    };
    imports.wbg.__wbg_composedPath_c6de3259e6ae48ad = function(arg0) {
        const ret = arg0.composedPath();
        return ret;
    };
    imports.wbg.__wbg_composed_4ea9d63d1d5aed8d = function(arg0) {
        const ret = arg0.composed;
        return ret;
    };
    imports.wbg.__wbg_compressedTexImage2D_3de3adb77aa3e1f9 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_4a58d1ad50faa98d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_55e498abedad955a = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_5d07ba1c768386c2 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_60d31c91530e873c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8), arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_81321b8f811a3c64 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_a44b5fd4cf5aa1cd = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_b575ce658ed7bc43 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8), arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_c806367b56053437 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_compressedTexImage2D_d92240c0dd26767e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage2D_f2984f556962e0f3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_compressedTexImage2D_f8930301a0ab2fb0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage2D_fe009663db267f9e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage2D_ffae94c7545ad14e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, getArrayU8FromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_compressedTexImage3D_083c1176ac5795bd = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_2f58282b4504910a = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexImage3D_3571f5e2b474385e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_59ca9b7f63213800 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage3D_88ff44ed6a4234c4 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_b39fa6aee166342d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, getArrayU8FromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_compressedTexImage3D_bf99bb139391665f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_compressedTexImage3D_da5aa4cb05822d2c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_de769229538fc3fc = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_f3373b76721cce72 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexImage3D_fe29390243780473 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexImage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_01b73d5afe376b6e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_0f5d8ff7a2244697 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_1553ea2db07392d8 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0, arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_157fbc15afda2160 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_185d8dac49276b7b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_1eee8bf5b1196510 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_3714488cc1321f33 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_4ab2b43cacd95564 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_5ec0541bbd7c2963 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8, arg9 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_887c3d032e30ff9b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_compressedTexSubImage2D_bc669b55bfad0d12 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_c9d1d1f196bce860 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_e1ed65af65b5879f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9), arg10 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage2D_e6c6ff6048405fa0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.compressedTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, getArrayU8FromWasm0(arg8, arg9));
    };
    imports.wbg.__wbg_compressedTexSubImage3D_30f0b85047ceee8b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0, arg12 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_376b9e3cdbccd59b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_5e09a2d301f3c626 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_688abfd8aa37a49d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_7d767cd53a90f105 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_8d73ab0a4a910c3e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11), arg12 >>> 0, arg13 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_93b235419d835824 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11));
    };
    imports.wbg.__wbg_compressedTexSubImage3D_bbc0d31582e3a014 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_bda0c3677b251348 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0, arg12 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_e7cf417a9e73caa6 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10, arg11 >>> 0);
    };
    imports.wbg.__wbg_compressedTexSubImage3D_ef242131dbb77277 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.compressedTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11), arg12 >>> 0);
    };
    imports.wbg.__wbg_concat_274a9ac21f3b1d0b = function(arg0, arg1) {
        const ret = arg0.concat(arg1);
        return ret;
    };
    imports.wbg.__wbg_concat_4c77c1237a6a9173 = function(arg0, arg1) {
        const ret = arg0.concat(arg1);
        return ret;
    };
    imports.wbg.__wbg_configure_8d74ee79dc392b1f = function() { return handleError(function (arg0, arg1) {
        arg0.configure(arg1);
    }, arguments) };
    imports.wbg.__wbg_confirm_1618c4b788fec654 = function() { return handleError(function (arg0) {
        const ret = arg0.confirm();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_confirm_b165cbd0f4493563 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.confirm(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_construct_19c23a805ff522d8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.construct(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_construct_8d61a09a064d7a0e = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.construct(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_constructor_bd34b914d5a3a404 = function(arg0) {
        const ret = arg0.constructor;
        return ret;
    };
    imports.wbg.__wbg_contains_457d2fc195838bfa = function(arg0, arg1) {
        const ret = arg0.contains(arg1);
        return ret;
    };
    imports.wbg.__wbg_contentEditable_23fb8c21a68ab708 = function(arg0, arg1) {
        const ret = arg1.contentEditable;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_contentType_3434b05e0735e0fb = function(arg0, arg1) {
        const ret = arg1.contentType;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_controls_c1b0fe6f4756fcdc = function(arg0) {
        const ret = arg0.controls;
        return ret;
    };
    imports.wbg.__wbg_convertToBlob_74fe0ea979dec35d = function() { return handleError(function (arg0) {
        const ret = arg0.convertToBlob();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_copyBufferSubData_1be1b6cace373f88 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_286502d7e73995d7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_74ad55c13c5b2ae2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_77f1910ff5d69fb7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_922a7d1bd78761cb = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_b029fe13947557cd = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_b9dea7ce40a86f5e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferSubData_f91488bc30d8a3e1 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferSubData(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_copyBufferToBuffer_01fa53a462194a39 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_08798b8670d613ea = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_0a9a60b585c663f4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_43a46b4333321d37 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_4f2040a48b15491c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_8391faedae7bae2d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_95866a4536ca1314 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_ad25ea844bd6d111 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_aed56781e26a5f62 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_bd6bb68b8a8aa08f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_d36b4613b814f291 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.copyBufferToBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToBuffer_db1c4fd94fdfa9a8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.copyBufferToBuffer(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToTexture_1e8c014c17d7d2a9 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyBufferToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyBufferToTexture_c4bc464c7af9eb3d = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyBufferToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyExternalImageToTexture_41327f54ff2be5fb = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyExternalImageToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyExternalImageToTexture_77a48e663b8e5481 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyExternalImageToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTexImage2D_143eaa348c760575 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexImage2D_a867b94c9aab628d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexImage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexSubImage2D_593b8653753bc7d3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexSubImage2D_7f4e6e26c0eff156 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.copyTexSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_copyTexSubImage3D_c66982c639aa21c4 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.copyTexSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
    };
    imports.wbg.__wbg_copyTextureToBuffer_739b5accd0131afa = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTextureToBuffer_8761178fe6745a3b = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTextureToTexture_2780565c2cc14435 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTextureToTexture_ecb35eeeccc84668 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.copyTextureToTexture(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_copyTo_047d2d3a6118666c = function(arg0, arg1) {
        const ret = arg0.copyTo(arg1);
        return ret;
    };
    imports.wbg.__wbg_copyTo_6eafcfc60cee76b2 = function(arg0, arg1, arg2) {
        const ret = arg0.copyTo(getArrayU8FromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_copyTo_d37de0bdd8b91e51 = function(arg0, arg1) {
        const ret = arg0.copyTo(arg1);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_06fa9f4b7ef63d68 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_0e54e23d5d7ccccf = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_2189c8c3f9ffe339 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_3663b693f61fdcd5 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_40e6840d1beb49ec = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_5bbc80f32eb1455f = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_5e5f81304e35d634 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_6e1b16e789d65e23 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_79226ef76c7c4161 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_c47b5fb8064803a8 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_d87ebddeefd74a53 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_copyWithin_e2960ebf79750239 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.copyWithin(arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_cos_4e660a7ede7b89f8 = function(arg0) {
        const ret = Math.cos(arg0);
        return ret;
    };
    imports.wbg.__wbg_cosh_30afb4c79b2542a2 = function(arg0) {
        const ret = Math.cosh(arg0);
        return ret;
    };
    imports.wbg.__wbg_countReset_29454e6472ec8f6b = function(arg0, arg1) {
        console.countReset(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_countReset_2d8aaad5ce1d54ed = function() {
        console.countReset();
    };
    imports.wbg.__wbg_count_668d8bebdb2a3714 = function(arg0, arg1) {
        console.count(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_count_91568455cbaaf0cb = function(arg0) {
        const ret = arg0.count;
        return ret;
    };
    imports.wbg.__wbg_count_d6ae06acc4450b49 = function() {
        console.count();
    };
    imports.wbg.__wbg_createBindGroupLayout_37b290868edc95c3 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createBindGroupLayout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createBindGroup_9e48ec0df6021806 = function(arg0, arg1) {
        const ret = arg0.createBindGroup(arg1);
        return ret;
    };
    imports.wbg.__wbg_createBuffer_301327852bcb0fc9 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createBuffer(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createBuffer_465b645a46535184 = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createBuffer_8601b8ec330ab49d = function(arg0) {
        const ret = arg0.createBuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createCommandEncoder_be7f62d013566409 = function(arg0) {
        const ret = arg0.createCommandEncoder();
        return ret;
    };
    imports.wbg.__wbg_createCommandEncoder_f91fd6a7bbb31da6 = function(arg0, arg1) {
        const ret = arg0.createCommandEncoder(arg1);
        return ret;
    };
    imports.wbg.__wbg_createComputePipelineAsync_cee8465222d01bbc = function(arg0, arg1) {
        const ret = arg0.createComputePipelineAsync(arg1);
        return ret;
    };
    imports.wbg.__wbg_createComputePipeline_63e73966ce7658ed = function(arg0, arg1) {
        const ret = arg0.createComputePipeline(arg1);
        return ret;
    };
    imports.wbg.__wbg_createElementNS_6353ef86ff4daa47 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElementNS_e7c12bbd579529e2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.createElementNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElement_bcb4fff0635f756e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createElement_da4ed2b219560fc6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.createElement(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createEvent_a6616fef53d5bb14 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.createEvent(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createFramebuffer_5d000a6cde602c77 = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createFramebuffer_934b44643ffd067a = function(arg0) {
        const ret = arg0.createFramebuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createImageBitmap_05de10fe5548e393 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_2503914b32fc2a34 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_364dbc9b39dde8a4 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_3b134e003aab7df3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_43f198c3005c8f81 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_43fcfa2b256d58db = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_4580a3bde502d944 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_4b492dc00e0d0267 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_4c40c75891ffedc9 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_502e371c12bd4256 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_50df7cebf5a3d827 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_572ca28b1fa5efff = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_5978d13e4e45a8a2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_61e922000696c6e4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_63bdf28b81904684 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_64cd5d83a09278a1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_6a640eec0fb719bf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_7985c5208ca035a0 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_7bec29fb292041f1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_9d4f422f956637b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_d63c4485a2d980a0 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_d979a09e05224ba4 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_dd980d3c534869ff = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_e083f6f8d739a800 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_e94dd6716f5ba990 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_f1220754d701372d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.createImageBitmap(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_f58f9999a9f93af6 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createImageBitmap_fb43fccba53deeae = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createImageBitmap(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createNSResolver_2aa67db954d31aad = function(arg0, arg1) {
        const ret = arg0.createNSResolver(arg1);
        return ret;
    };
    imports.wbg.__wbg_createPipelineLayout_e218679853a4ec90 = function(arg0, arg1) {
        const ret = arg0.createPipelineLayout(arg1);
        return ret;
    };
    imports.wbg.__wbg_createProgram_023ba0fc6ff6efd6 = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createProgram_ffe9d4a2cba210f4 = function(arg0) {
        const ret = arg0.createProgram();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createQueryEXT_69ad5988dd99edc9 = function(arg0) {
        const ret = arg0.createQueryEXT();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createQuerySet_a263dc11313f1d4f = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createQuerySet(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createQuery_427027f57b8d51cc = function(arg0) {
        const ret = arg0.createQuery();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderBundleEncoder_cc6623603aca6dcc = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createRenderBundleEncoder(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createRenderPipelineAsync_749edb4b8353dc71 = function(arg0, arg1) {
        const ret = arg0.createRenderPipelineAsync(arg1);
        return ret;
    };
    imports.wbg.__wbg_createRenderPipeline_01226de8ac511c31 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createRenderPipeline(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createRenderbuffer_6b6220d1a07652a9 = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createRenderbuffer_f869ce6d85370a7a = function(arg0) {
        const ret = arg0.createRenderbuffer();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createSampler_4c0a0f10a4d901b3 = function(arg0) {
        const ret = arg0.createSampler();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createSampler_c25ffad238c26262 = function(arg0) {
        const ret = arg0.createSampler();
        return ret;
    };
    imports.wbg.__wbg_createSampler_dd08c9ffd5b1afa4 = function(arg0, arg1) {
        const ret = arg0.createSampler(arg1);
        return ret;
    };
    imports.wbg.__wbg_createShaderModule_a7e2ac8c2d5bd874 = function(arg0, arg1) {
        const ret = arg0.createShaderModule(arg1);
        return ret;
    };
    imports.wbg.__wbg_createShader_4626088b63c33727 = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createShader_f88f9b82748ef6c0 = function(arg0, arg1) {
        const ret = arg0.createShader(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_41211a4e8ae0afec = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTexture_47efd1fcfeeaeac8 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createTexture(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createTexture_4d5934eb9772b5fe = function(arg0) {
        const ret = arg0.createTexture();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createTransformFeedback_000c21f41e3b022c = function(arg0) {
        const ret = arg0.createTransformFeedback();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArrayOES_7bcc20082143e8f2 = function(arg0) {
        const ret = arg0.createVertexArrayOES();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createVertexArray_997b3c5b1091afd9 = function(arg0) {
        const ret = arg0.createVertexArray();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_createView_3bca7024132ceaaf = function() { return handleError(function (arg0) {
        const ret = arg0.createView();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_createView_bb87ba5802a138dc = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.createView(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_create_9c1e4798190a2c98 = function(arg0) {
        const ret = Object.create(arg0);
        return ret;
    };
    imports.wbg.__wbg_crossOriginIsolated_3589aa89e00c71e6 = function() { return handleError(function () {
        const ret = globalThis.crossOriginIsolated();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crossOrigin_637791b34948134c = function(arg0, arg1) {
        const ret = arg1.crossOrigin;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_crossOrigin_ae5a2f5f632ec395 = function(arg0, arg1) {
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
    imports.wbg.__wbg_cullFace_767c25333fcc7c8b = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_cullFace_88f07a3436967138 = function(arg0, arg1) {
        arg0.cullFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_currentScript_4b5ab3ba1b0dee79 = function(arg0) {
        const ret = arg0.currentScript;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_currentSrc_502322f915419045 = function(arg0, arg1) {
        const ret = arg1.currentSrc;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_currentSrc_97f0abd26ee8e540 = function(arg0, arg1) {
        const ret = arg1.currentSrc;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_currentTarget_bf5df8777e42391b = function(arg0) {
        const ret = arg0.currentTarget;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_currentTime_884ad5b5fb79f43e = function(arg0) {
        const ret = arg0.currentTime;
        return ret;
    };
    imports.wbg.__wbg_customSections_5ecd8c350a66ac41 = function(arg0, arg1, arg2) {
        const ret = WebAssembly.Module.customSections(arg0, getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_data_83b2a9a09dd4ab39 = function(arg0, arg1) {
        const ret = arg1.data;
        const ptr1 = passArray8ToWasm0(ret, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_debug_24d884048190fccc = function(arg0) {
        console.debug(...arg0);
    };
    imports.wbg.__wbg_debug_4b50bce91e85b2a3 = function(arg0, arg1, arg2) {
        console.debug(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_debug_789ad74812f0bf6f = function() {
        console.debug();
    };
    imports.wbg.__wbg_debug_8c30ef14b3a2dfdb = function(arg0, arg1) {
        console.debug(arg0, arg1);
    };
    imports.wbg.__wbg_debug_9ad80675faf0c9cf = function(arg0, arg1, arg2, arg3) {
        console.debug(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_debug_9c264c30d3d51314 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.debug(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_debug_9d0c87ddda3dc485 = function(arg0) {
        console.debug(arg0);
    };
    imports.wbg.__wbg_debug_a076d315172cb47f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.debug(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_debug_fea744646819c101 = function(arg0, arg1, arg2, arg3, arg4) {
        console.debug(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_decodeURIComponent_4e62713cd03627d4 = function() { return handleError(function (arg0, arg1) {
        const ret = decodeURIComponent(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_decodeURI_b37dbbeac7109c58 = function() { return handleError(function (arg0, arg1) {
        const ret = decodeURI(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_decode_42cc8a45015433eb = function(arg0) {
        const ret = arg0.decode();
        return ret;
    };
    imports.wbg.__wbg_decoding_a3ba9be6c8bf463c = function(arg0, arg1) {
        const ret = arg1.decoding;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_defaultMuted_bbc5dcd09a2ef0a8 = function(arg0) {
        const ret = arg0.defaultMuted;
        return ret;
    };
    imports.wbg.__wbg_defaultPlaybackRate_14dc64c48df51abb = function(arg0) {
        const ret = arg0.defaultPlaybackRate;
        return ret;
    };
    imports.wbg.__wbg_defaultPrevented_656a2f6afcfa3679 = function(arg0) {
        const ret = arg0.defaultPrevented;
        return ret;
    };
    imports.wbg.__wbg_defaultView_a5c5bf86e6fb571b = function(arg0) {
        const ret = arg0.defaultView;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_defineProperties_c4eb22c46ca8ae12 = function(arg0, arg1) {
        const ret = Object.defineProperties(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_defineProperty_a0c392ee7c37c4e6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.defineProperty(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_defineProperty_c4fadd16974ffa92 = function(arg0, arg1, arg2) {
        const ret = Object.defineProperty(arg0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_deleteBuffer_5ed1698208181e1f = function(arg0, arg1) {
        arg0.deleteBuffer(arg1);
    };
    imports.wbg.__wbg_deleteBuffer_ba7f1164cc23b2ca = function(arg0, arg1) {
        arg0.deleteBuffer(arg1);
    };
    imports.wbg.__wbg_deleteFramebuffer_71a99ec4adbfc3f2 = function(arg0, arg1) {
        arg0.deleteFramebuffer(arg1);
    };
    imports.wbg.__wbg_deleteFramebuffer_d25c0dc61ce8eda7 = function(arg0, arg1) {
        arg0.deleteFramebuffer(arg1);
    };
    imports.wbg.__wbg_deleteProgram_3bf297a31d0e6e48 = function(arg0, arg1) {
        arg0.deleteProgram(arg1);
    };
    imports.wbg.__wbg_deleteProgram_62774baacb13ff2b = function(arg0, arg1) {
        arg0.deleteProgram(arg1);
    };
    imports.wbg.__wbg_deleteProperty_da180bf2624d16d6 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.deleteProperty(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_deleteQueryEXT_9d3beebd18c2db2c = function(arg0, arg1) {
        arg0.deleteQueryEXT(arg1);
    };
    imports.wbg.__wbg_deleteQuery_9ae103bb04e9a99d = function(arg0, arg1) {
        arg0.deleteQuery(arg1);
    };
    imports.wbg.__wbg_deleteRenderbuffer_3e536cf09d672302 = function(arg0, arg1) {
        arg0.deleteRenderbuffer(arg1);
    };
    imports.wbg.__wbg_deleteRenderbuffer_ada437284f7fb4f2 = function(arg0, arg1) {
        arg0.deleteRenderbuffer(arg1);
    };
    imports.wbg.__wbg_deleteSampler_993727fa1d567ed5 = function(arg0, arg1) {
        arg0.deleteSampler(arg1);
    };
    imports.wbg.__wbg_deleteShader_c357bb8fbede8370 = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteShader_c686dd351de5a068 = function(arg0, arg1) {
        arg0.deleteShader(arg1);
    };
    imports.wbg.__wbg_deleteSync_f5db5552febb6818 = function(arg0, arg1) {
        arg0.deleteSync(arg1);
    };
    imports.wbg.__wbg_deleteTexture_2a9b703dc2df5657 = function(arg0, arg1) {
        arg0.deleteTexture(arg1);
    };
    imports.wbg.__wbg_deleteTexture_875f8d84e74610a0 = function(arg0, arg1) {
        arg0.deleteTexture(arg1);
    };
    imports.wbg.__wbg_deleteTransformFeedback_5a0285d4b74ec8b6 = function(arg0, arg1) {
        arg0.deleteTransformFeedback(arg1);
    };
    imports.wbg.__wbg_deleteVertexArrayOES_c17582be9fb07775 = function(arg0, arg1) {
        arg0.deleteVertexArrayOES(arg1);
    };
    imports.wbg.__wbg_deleteVertexArray_af80f68f0bea25b7 = function(arg0, arg1) {
        arg0.deleteVertexArray(arg1);
    };
    imports.wbg.__wbg_delete_25d4b2e86b2ae767 = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_delete_43abf2a0bbd4916d = function(arg0, arg1) {
        delete arg0[arg1 >>> 0];
    };
    imports.wbg.__wbg_delete_71882ca807a30a27 = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_delete_d1e1a47aea9c5343 = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_delete_fb98ce77a65cdf18 = function(arg0, arg1) {
        const ret = arg0.delete(arg1);
        return ret;
    };
    imports.wbg.__wbg_depthFunc_30cd9028f7f0cb4e = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthFunc_eb0c2c825938bb33 = function(arg0, arg1) {
        arg0.depthFunc(arg1 >>> 0);
    };
    imports.wbg.__wbg_depthMask_317f5412242ac5d5 = function(arg0, arg1) {
        arg0.depthMask(arg1 !== 0);
    };
    imports.wbg.__wbg_depthMask_eabc1830c04e8fca = function(arg0, arg1) {
        arg0.depthMask(arg1 !== 0);
    };
    imports.wbg.__wbg_depthOrArrayLayers_e8a6ad9f690e35d5 = function(arg0) {
        const ret = arg0.depthOrArrayLayers;
        return ret;
    };
    imports.wbg.__wbg_depthRange_599ac7ebc9b76a2c = function(arg0, arg1, arg2) {
        arg0.depthRange(arg1, arg2);
    };
    imports.wbg.__wbg_depthRange_7025983a507dd522 = function(arg0, arg1, arg2) {
        arg0.depthRange(arg1, arg2);
    };
    imports.wbg.__wbg_deref_f0c757396ee82c26 = function(arg0) {
        const ret = arg0.deref();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_description_4977896dc42bf653 = function(arg0, arg1) {
        const ret = arg1.description;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_destroy_1fb0841289b41ab7 = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_destroy_511c665839f365c0 = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_destroy_77f133467ad841ed = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_destroy_c98dc18b3a071e98 = function(arg0) {
        arg0.destroy();
    };
    imports.wbg.__wbg_detachShader_678bb6c64268535d = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_detachShader_6dca9ecdeb9bbcd3 = function(arg0, arg1, arg2) {
        arg0.detachShader(arg1, arg2);
    };
    imports.wbg.__wbg_deviceMemory_0622d7513bff47c6 = function(arg0) {
        const ret = arg0.deviceMemory;
        return ret;
    };
    imports.wbg.__wbg_deviceMemory_d3b6d1efa12e9f5b = function(arg0) {
        const ret = arg0.deviceMemory;
        return ret;
    };
    imports.wbg.__wbg_devicePixelRatio_390dee26c70aa30f = function(arg0) {
        const ret = arg0.devicePixelRatio;
        return ret;
    };
    imports.wbg.__wbg_device_d1b4adf7e5c72c3e = function(arg0, arg1) {
        const ret = arg1.device;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_dimension_f77def5d88ea985c = function(arg0) {
        const ret = arg0.dimension;
        return (__wbindgen_enum_GpuTextureDimension.indexOf(ret) + 1 || 4) - 1;
    };
    imports.wbg.__wbg_dir_161649c69f8c184b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.dir(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_dir_1935a848d33cc374 = function(arg0, arg1) {
        const ret = arg1.dir;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_dir_308d9ccb9dbf001c = function(arg0, arg1) {
        const ret = arg1.dir;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_dir_46fc3c87ad8f12a0 = function(arg0, arg1, arg2, arg3, arg4) {
        console.dir(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_dir_55b7f36446663d14 = function(arg0, arg1, arg2, arg3) {
        console.dir(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_dir_87aefaa58e17a4b5 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.dir(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_dir_beb9ea4fc45ea947 = function(arg0) {
        console.dir(arg0);
    };
    imports.wbg.__wbg_dir_c755b9286a546197 = function(arg0, arg1) {
        console.dir(arg0, arg1);
    };
    imports.wbg.__wbg_dir_d410cf376404938e = function() {
        console.dir();
    };
    imports.wbg.__wbg_dir_dd89ddf630f208b9 = function(arg0) {
        console.dir(...arg0);
    };
    imports.wbg.__wbg_dir_fa77ff80130844c1 = function(arg0, arg1, arg2) {
        console.dir(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_dirxml_0318ee32f245c2d9 = function(arg0, arg1, arg2, arg3, arg4) {
        console.dirxml(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_dirxml_19cbd01fc7198dfd = function(arg0, arg1) {
        console.dirxml(arg0, arg1);
    };
    imports.wbg.__wbg_dirxml_420007dcfcc7f71c = function(arg0) {
        console.dirxml(...arg0);
    };
    imports.wbg.__wbg_dirxml_7afb22bded3be131 = function(arg0) {
        console.dirxml(arg0);
    };
    imports.wbg.__wbg_dirxml_818721ccc6045c13 = function(arg0, arg1, arg2) {
        console.dirxml(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_dirxml_9c2fe329129a9a2b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.dirxml(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_dirxml_b7d21647fcb69404 = function(arg0, arg1, arg2, arg3) {
        console.dirxml(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_dirxml_eee7b70a3eae20da = function() {
        console.dirxml();
    };
    imports.wbg.__wbg_dirxml_fe08393ef0dc31a3 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.dirxml(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_disablePictureInPicture_f13f5a1a42ab736e = function(arg0) {
        const ret = arg0.disablePictureInPicture;
        return ret;
    };
    imports.wbg.__wbg_disableVertexAttribArray_4c5c7214724209d0 = function(arg0, arg1) {
        arg0.disableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_disableVertexAttribArray_bcf2272b428ec9fc = function(arg0, arg1) {
        arg0.disableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_disable_3af3e194392b0a83 = function(arg0, arg1) {
        arg0.disable(arg1 >>> 0);
    };
    imports.wbg.__wbg_disable_c05809e00765548d = function(arg0, arg1) {
        arg0.disable(arg1 >>> 0);
    };
    imports.wbg.__wbg_dispatchEvent_50a40ea5c664f9f4 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.dispatchEvent(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_dispatchWorkgroupsIndirect_4db6960535ab3535 = function(arg0, arg1, arg2) {
        arg0.dispatchWorkgroupsIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_dispatchWorkgroupsIndirect_ba4c364997b3cc88 = function(arg0, arg1, arg2) {
        arg0.dispatchWorkgroupsIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_dispatchWorkgroups_0219513d577c632c = function(arg0, arg1, arg2, arg3) {
        arg0.dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_dispatchWorkgroups_6bf7363d3e45ff82 = function(arg0, arg1, arg2) {
        arg0.dispatchWorkgroups(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_dispatchWorkgroups_b6a2ce656bfcf5fc = function(arg0, arg1) {
        arg0.dispatchWorkgroups(arg1 >>> 0);
    };
    imports.wbg.__wbg_displayHeight_9fadc869ffc90e4b = function(arg0) {
        const ret = arg0.displayHeight;
        return ret;
    };
    imports.wbg.__wbg_displayWidth_88184e105f84752c = function(arg0) {
        const ret = arg0.displayWidth;
        return ret;
    };
    imports.wbg.__wbg_doNotTrack_b9baa77db28e1f99 = function(arg0, arg1) {
        const ret = arg1.doNotTrack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_documentElement_39f40310398a4cba = function(arg0) {
        const ret = arg0.documentElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_documentURI_085b87f6b04906f3 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.documentURI;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_document_5b745e82ba551ca5 = function(arg0) {
        const ret = arg0.document;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_done_62ea16af4ce34b24 = function(arg0) {
        const ret = arg0.done;
        return ret;
    };
    imports.wbg.__wbg_draggable_7204c9b3bb46b0f5 = function(arg0) {
        const ret = arg0.draggable;
        return ret;
    };
    imports.wbg.__wbg_drawArraysInstancedANGLE_5802f710395d6947 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawArraysInstancedANGLE(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_drawArraysInstanced_5a3cccf98d769264 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawArraysInstanced(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_drawArrays_a8ad03dae79ec56f = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawArrays_c106ebe0234971d4 = function(arg0, arg1, arg2, arg3) {
        arg0.drawArrays(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_drawBuffersWEBGL_f21a161dc8fb366c = function(arg0, arg1) {
        arg0.drawBuffersWEBGL(arg1);
    };
    imports.wbg.__wbg_drawBuffers_dd9a3530aa5b71b2 = function(arg0, arg1) {
        arg0.drawBuffers(arg1);
    };
    imports.wbg.__wbg_drawElementsInstancedANGLE_a63eca97c72be45f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstancedANGLE_e132f37dcebd07d9 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstancedANGLE(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstanced_ad84faddf2b48335 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElementsInstanced_b9424760dfb40044 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawElementsInstanced(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_drawElements_2a3619292860fa19 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_430a0c512ee552c1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_738773baf3df000e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawElements_ce511271d37ccdd3 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawElements(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawIndexedIndirect_41e363fa64b1dbba = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexedIndirect_42fe3c5b17fdc555 = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndexedIndirect_e66eb9c550fad433 = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexedIndirect_fd2d310049113c31 = function(arg0, arg1, arg2) {
        arg0.drawIndexedIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndexed_3cb778da4c5793f5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_5c5253b9c1746126 = function(arg0, arg1, arg2, arg3) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_7011ecce542cd102 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawIndexed_81ee440faf0fb4b1 = function(arg0, arg1, arg2) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_a50f5be0b93a7816 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_drawIndexed_c1503ba6a97efa0f = function(arg0, arg1) {
        arg0.drawIndexed(arg1 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_ca25a9a9810c48ce = function(arg0, arg1, arg2, arg3) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_d25f2eddc1b4686f = function(arg0, arg1, arg2) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_d46290059f9f69f3 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.drawIndexed(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
    };
    imports.wbg.__wbg_drawIndexed_ea2b3aa4596381f7 = function(arg0, arg1) {
        arg0.drawIndexed(arg1 >>> 0);
    };
    imports.wbg.__wbg_drawIndirect_18f3415410ff458f = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawIndirect_549f56d168b141b3 = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndirect_81a5bf20d1324861 = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2);
    };
    imports.wbg.__wbg_drawIndirect_9f38356a10172451 = function(arg0, arg1, arg2) {
        arg0.drawIndirect(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_drawRangeElements_78e3db5aa911520f = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.drawRangeElements(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0, arg6);
    };
    imports.wbg.__wbg_drawRangeElements_cb8ac7209f6ad8ca = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.drawRangeElements(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0, arg6);
    };
    imports.wbg.__wbg_draw_1497a9a842f399bb = function(arg0, arg1) {
        arg0.draw(arg1 >>> 0);
    };
    imports.wbg.__wbg_draw_35bd445973b180dc = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_draw_5ed80db432a52076 = function(arg0, arg1, arg2, arg3) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_draw_6d6549270793e407 = function(arg0, arg1, arg2) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_draw_879ec0bbcef1614b = function(arg0, arg1) {
        arg0.draw(arg1 >>> 0);
    };
    imports.wbg.__wbg_draw_9223b78ee29730a7 = function(arg0, arg1, arg2) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_draw_cfd2f1546fdfcfa8 = function(arg0, arg1, arg2, arg3) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_draw_d491a95e3a3e89ec = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.draw(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_drawingBufferHeight_96a0e679a55c8801 = function(arg0) {
        const ret = arg0.drawingBufferHeight;
        return ret;
    };
    imports.wbg.__wbg_drawingBufferHeight_ec9d8561fb21ba83 = function(arg0) {
        const ret = arg0.drawingBufferHeight;
        return ret;
    };
    imports.wbg.__wbg_drawingBufferWidth_222dd5abfbeab400 = function(arg0) {
        const ret = arg0.drawingBufferWidth;
        return ret;
    };
    imports.wbg.__wbg_drawingBufferWidth_67587ab774d1abd7 = function(arg0) {
        const ret = arg0.drawingBufferWidth;
        return ret;
    };
    imports.wbg.__wbg_duration_b03a521a651ebc0c = function(arg0) {
        const ret = arg0.duration;
        return ret;
    };
    imports.wbg.__wbg_duration_de28e4e7d0cf91f7 = function(arg0) {
        const ret = arg0.duration;
        return ret;
    };
    imports.wbg.__wbg_duration_e14f223f4475838b = function(arg0, arg1) {
        const ret = arg1.duration;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_elementFromPoint_8a2969ab5273b90a = function(arg0, arg1, arg2) {
        const ret = arg0.elementFromPoint(arg1, arg2);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_elementsFromPoint_af1da34ad3f2b86f = function(arg0, arg1, arg2) {
        const ret = arg0.elementsFromPoint(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_enableStyleSheetsForSet_e886aefdf6ef8259 = function(arg0, arg1, arg2) {
        arg0.enableStyleSheetsForSet(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_enableVertexAttribArray_2898de871f949393 = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enableVertexAttribArray_def9952d8426be95 = function(arg0, arg1) {
        arg0.enableVertexAttribArray(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_2d8bb952637ad17a = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_enable_52598759008d46ee = function(arg0, arg1) {
        arg0.enable(arg1 >>> 0);
    };
    imports.wbg.__wbg_encodeURIComponent_fe8578929b74aa6c = function(arg0, arg1) {
        const ret = encodeURIComponent(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_encodeURI_5c6b5ca30763e368 = function(arg0, arg1) {
        const ret = encodeURI(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_endOcclusionQuery_d77efc3dd8fb3ba0 = function(arg0) {
        arg0.endOcclusionQuery();
    };
    imports.wbg.__wbg_endQueryEXT_71d80a512045282c = function(arg0, arg1) {
        arg0.endQueryEXT(arg1 >>> 0);
    };
    imports.wbg.__wbg_endQuery_81a855457c9a8807 = function(arg0, arg1) {
        arg0.endQuery(arg1 >>> 0);
    };
    imports.wbg.__wbg_endTransformFeedback_21f4caa3bb1f2688 = function(arg0) {
        arg0.endTransformFeedback();
    };
    imports.wbg.__wbg_end_d20172f7cfc0b44b = function(arg0) {
        arg0.end();
    };
    imports.wbg.__wbg_end_ddc7a483fce32eed = function(arg0) {
        arg0.end();
    };
    imports.wbg.__wbg_ended_88082b2b334ad5f2 = function(arg0) {
        const ret = arg0.ended;
        return ret;
    };
    imports.wbg.__wbg_endsWith_01fd6d0d05d1646d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.endsWith(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_entries_20a7ea528b15ccea = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_5cdc2913535e1864 = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_83c79938054e065f = function(arg0) {
        const ret = Object.entries(arg0);
        return ret;
    };
    imports.wbg.__wbg_entries_926c8a1abc78f79b = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_9af46b7eaf7dfefa = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_d7773b385997f32e = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entries_d9c0abb728c03487 = function(arg0) {
        const ret = arg0.entries();
        return ret;
    };
    imports.wbg.__wbg_entryType_c8d04ae435689dd3 = function(arg0, arg1) {
        const ret = arg1.entryType;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_error_161a4f7583a0a259 = function(arg0, arg1, arg2, arg3, arg4) {
        console.error(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_error_1a829178de44fe4e = function(arg0) {
        const ret = arg0.error;
        return ret;
    };
    imports.wbg.__wbg_error_4081c9996e340ee3 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.error(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_error_566e831d6e187ba7 = function() {
        console.error();
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
    imports.wbg.__wbg_error_7bc7d576a6aaf855 = function(arg0) {
        console.error(arg0);
    };
    imports.wbg.__wbg_error_81fccc6964a8ad8b = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.error(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_error_85faeb8919b11cc6 = function(arg0, arg1, arg2) {
        console.error(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_error_98d791de55bc7c97 = function(arg0) {
        console.error(...arg0);
    };
    imports.wbg.__wbg_error_ad1ecdacd1bb600d = function(arg0, arg1, arg2, arg3) {
        console.error(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_error_d7f117185d9ffd19 = function(arg0, arg1) {
        console.error(arg0, arg1);
    };
    imports.wbg.__wbg_escape_48a4e7e4162d828e = function(arg0, arg1) {
        const ret = escape(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_eval_aa18aa048f37d16d = function() { return handleError(function (arg0, arg1) {
        const ret = eval(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_eventPhase_deb46e06e9a00121 = function(arg0) {
        const ret = arg0.eventPhase;
        return ret;
    };
    imports.wbg.__wbg_event_043d2c7ce57bb492 = function(arg0) {
        const ret = arg0.event;
        return ret;
    };
    imports.wbg.__wbg_every_e1958c0d9256827f = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_exception_02d03414fc964f51 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.exception(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_exception_1503da18121dc448 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.exception(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_exception_2c9827122922ec9e = function(arg0, arg1) {
        console.exception(arg0, arg1);
    };
    imports.wbg.__wbg_exception_56a397b2c6c265d9 = function() {
        console.exception();
    };
    imports.wbg.__wbg_exception_5be77c4ce51392fb = function(arg0) {
        console.exception(...arg0);
    };
    imports.wbg.__wbg_exception_5e87198a85522aae = function(arg0, arg1, arg2) {
        console.exception(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_exception_7c0eeb5d6c483e76 = function(arg0) {
        console.exception(arg0);
    };
    imports.wbg.__wbg_exception_bcfb05fd8b393c41 = function(arg0, arg1, arg2, arg3, arg4) {
        console.exception(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_exception_df5d955502a0a54e = function(arg0, arg1, arg2, arg3) {
        console.exception(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_exchange_4ae534af3dbbb4ee = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.exchange(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_exchange_898093407427f4fd = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.exchange(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_exec_bb56a6c02aa99507 = function(arg0, arg1, arg2) {
        const ret = arg0.exec(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_executeBundles_84e1e9326fd29d93 = function(arg0, arg1) {
        arg0.executeBundles(arg1);
    };
    imports.wbg.__wbg_exitFullscreen_14c765e2bd192c7b = function(arg0) {
        arg0.exitFullscreen();
    };
    imports.wbg.__wbg_exitPictureInPicture_a5c71b8e7c3fe046 = function(arg0) {
        const ret = arg0.exitPictureInPicture();
        return ret;
    };
    imports.wbg.__wbg_exitPointerLock_a4d48406ca4ec373 = function(arg0) {
        arg0.exitPointerLock();
    };
    imports.wbg.__wbg_exp_4ee92c813e2c3146 = function(arg0) {
        const ret = Math.exp(arg0);
        return ret;
    };
    imports.wbg.__wbg_expm1_035900457c5db4bb = function(arg0) {
        const ret = Math.expm1(arg0);
        return ret;
    };
    imports.wbg.__wbg_exports_58ef4156ca04d176 = function(arg0) {
        const ret = arg0.exports;
        return ret;
    };
    imports.wbg.__wbg_exports_c060467610de1d8a = function(arg0) {
        const ret = WebAssembly.Module.exports(arg0);
        return ret;
    };
    imports.wbg.__wbg_fastSeek_56f2af280a06dab4 = function() { return handleError(function (arg0, arg1) {
        arg0.fastSeek(arg1);
    }, arguments) };
    imports.wbg.__wbg_features_7463d4000d7c57a2 = function(arg0) {
        const ret = arg0.features;
        return ret;
    };
    imports.wbg.__wbg_features_dafff7dd39a9b665 = function(arg0) {
        const ret = arg0.features;
        return ret;
    };
    imports.wbg.__wbg_fenceSync_ae9efe266c01d1d4 = function(arg0, arg1, arg2) {
        const ret = arg0.fenceSync(arg1 >>> 0, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_fetch_417ef4c9a8dfcd8f = function(arg0, arg1, arg2) {
        const ret = arg0.fetch(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_fetch_a70a442575ced609 = function(arg0, arg1, arg2) {
        const ret = arg0.fetch(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_fill_01af8fb3fc2ec667 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_100f27738fe41987 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_246c9f6a9e8acdf2 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_3af6676232b908ee = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_454530660505a44b = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_497d0b56aee40ab5 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_508dd108a821ee20 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_9d8594cbfc8507ee = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_a155d58024d29b44 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(BigInt.asUintN(64, arg1), arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_ac0aa85ef4229b7d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_da324038e878a7d7 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fill_fb313b3373e5fc00 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.fill(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_filter_e5ce926a53d23c76 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_finally_9d2144c01c15bee7 = function(arg0, arg1) {
        const ret = arg0.finally(arg1);
        return ret;
    };
    imports.wbg.__wbg_findIndex_cabac6a0610e9190 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_findLastIndex_08113e55aa34d897 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_findLast_68131957c463411a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_find_905d78d44e1bddbd = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h51383be86e26a384(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_finish_051fb5d96fb94e64 = function(arg0, arg1) {
        const ret = arg0.finish(arg1);
        return ret;
    };
    imports.wbg.__wbg_finish_6cea4a17a3d044ce = function(arg0) {
        arg0.finish();
    };
    imports.wbg.__wbg_finish_7c3e136077cc2230 = function(arg0) {
        const ret = arg0.finish();
        return ret;
    };
    imports.wbg.__wbg_finish_b4d5b7b23f8fcf6d = function(arg0) {
        arg0.finish();
    };
    imports.wbg.__wbg_finish_db51f74029254467 = function(arg0, arg1) {
        const ret = arg0.finish(arg1);
        return ret;
    };
    imports.wbg.__wbg_finish_e5a5de72709cc8e2 = function(arg0) {
        const ret = arg0.finish();
        return ret;
    };
    imports.wbg.__wbg_firstChild_b36b7b9c87d19c20 = function(arg0) {
        const ret = arg0.firstChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_firstElementChild_3e42ba3f4d5b3951 = function(arg0) {
        const ret = arg0.firstElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_firstElementChild_e207b33aaa4a86df = function(arg0) {
        const ret = arg0.firstElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_flags_e4e3b7732afa8389 = function(arg0) {
        const ret = arg0.flags;
        return ret;
    };
    imports.wbg.__wbg_flatMap_8aed00f11ee2db42 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__hc22bb47e199e457f(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_flat_9f0df8f234dc2a07 = function(arg0, arg1) {
        const ret = arg0.flat(arg1);
        return ret;
    };
    imports.wbg.__wbg_floor_6f675551b974d93a = function(arg0) {
        const ret = Math.floor(arg0);
        return ret;
    };
    imports.wbg.__wbg_flush_25841159972acebf = function(arg0) {
        arg0.flush();
    };
    imports.wbg.__wbg_flush_f0bf967fc4c8252e = function(arg0) {
        arg0.flush();
    };
    imports.wbg.__wbg_focus_220a53e22147dc0f = function() { return handleError(function (arg0) {
        arg0.focus();
    }, arguments) };
    imports.wbg.__wbg_focus_60633d81e15dafb2 = function() { return handleError(function (arg0) {
        arg0.focus();
    }, arguments) };
    imports.wbg.__wbg_forEach_16eef1551b8a99e8 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h68a31eee7db321a1(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_1ba0f2e52f8edba4 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h68a31eee7db321a1(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_2a9579e3b25d84b2 = function() { return handleError(function (arg0, arg1) {
        arg0.forEach(arg1);
    }, arguments) };
    imports.wbg.__wbg_forEach_3975de16d4ace9fd = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h299b44f41e2e099e(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_3ff67543b4ff369a = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2d77a01e92f848be(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_42324f3d00922cc3 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2e56b68b9ae5d0a5(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_6097b10d46bd6778 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h299b44f41e2e099e(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_63adeaafee4a0765 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h3a2f664bd7bbcd34(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_83369ff92f9fa88c = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2703394ee32ad7e6(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_9171e1d77dd860c3 = function() { return handleError(function (arg0, arg1) {
        arg0.forEach(arg1);
    }, arguments) };
    imports.wbg.__wbg_forEach_972ac3f2882e4cdd = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2703394ee32ad7e6(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_9f2af1564ffe7042 = function() { return handleError(function (arg0, arg1) {
        arg0.forEach(arg1);
    }, arguments) };
    imports.wbg.__wbg_forEach_a703adeac76126a6 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2703394ee32ad7e6(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_d7b0beca8c53e695 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h8a611d48544c6801(a, state0.b, arg0, arg1);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_dd03477dcd0a1d84 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2e56b68b9ae5d0a5(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_f26048a19275e057 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h68a31eee7db321a1(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_forEach_fdfa9a663e9c9a9e = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h2703394ee32ad7e6(a, state0.b, arg0, arg1, arg2);
                } finally {
                    state0.a = a;
                }
            };
            arg0.forEach(cb0);
        } finally {
            state0.a = state0.b = 0;
        }
    };
    imports.wbg.__wbg_for_7246e2a062d6960c = function(arg0, arg1) {
        const ret = Symbol.for(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_formatToParts_01adda0486156aeb = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.formatToParts(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_formatToParts_0a4ea8c1b57f5c44 = function(arg0, arg1) {
        const ret = arg0.formatToParts(arg1);
        return ret;
    };
    imports.wbg.__wbg_formatToParts_2671b4c627aee73b = function(arg0, arg1) {
        const ret = arg0.formatToParts(arg1);
        return ret;
    };
    imports.wbg.__wbg_format_7f1a35db61ce2dfe = function(arg0) {
        const ret = arg0.format;
        return ret;
    };
    imports.wbg.__wbg_format_9ca73fafd8b0e9ec = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.format(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_format_dba83a66cc74d7dd = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_format_f4db88c811fbe201 = function(arg0) {
        const ret = arg0.format;
        return ret;
    };
    imports.wbg.__wbg_frameElement_a3034e7f25396fc5 = function() { return handleError(function (arg0) {
        const ret = arg0.frameElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_framebufferRenderbuffer_c4e0a3741080e47d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferRenderbuffer_d11b93c15d813b67 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.framebufferRenderbuffer(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_framebufferTexture2D_1c59ad9667ea1ea1 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTexture2D_489e539476d29f49 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTexture2D(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTextureLayer_adaeec76c62e2293 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.framebufferTextureLayer(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_framebufferTextureMultiviewOVR_81e594036296c9b0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.framebufferTextureMultiviewOVR(arg1 >>> 0, arg2 >>> 0, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_frames_494b38deb6c9cd6e = function() { return handleError(function (arg0) {
        const ret = arg0.frames;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_freeze_895497914a558958 = function(arg0) {
        const ret = Object.freeze(arg0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_00e8e20cdb6e9f41 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_3295da2a4b3f98fa = function(arg0, arg1) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_8cc87da0acbd1135 = function(arg0) {
        const ret = String.fromCharCode(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_c3d2e33eaab484f9 = function(arg0, arg1) {
        const ret = String.fromCharCode(...getArrayU16FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_c9dadef476f0ad72 = function(arg0, arg1, arg2, arg3) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCharCode_e1567b638234ad83 = function(arg0, arg1, arg2) {
        const ret = String.fromCharCode(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_fromCodePoint_0eb6a42ac4ca1242 = function() { return handleError(function (arg0, arg1) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_225c13e5ea043a22 = function() { return handleError(function (arg0, arg1) {
        const ret = String.fromCodePoint(...getArrayU32FromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_50facac709b76f67 = function() { return handleError(function (arg0) {
        const ret = String.fromCodePoint(arg0 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_55ed25961e095cfb = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_93018b169e6dabe2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromCodePoint_ad741178d6c59d0d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = String.fromCodePoint(arg0 >>> 0, arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_fromEntries_743eaaa008e6db37 = function() { return handleError(function (arg0) {
        const ret = Object.fromEntries(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_from_29a8414a7a7cd19d = function(arg0) {
        const ret = Array.from(arg0);
        return ret;
    };
    imports.wbg.__wbg_frontFace_9a8e14be7e21500f = function(arg0, arg1) {
        arg0.frontFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_frontFace_b516366b32ef6f00 = function(arg0, arg1) {
        arg0.frontFace(arg1 >>> 0);
    };
    imports.wbg.__wbg_fround_7ad97d87fbd0f62f = function(arg0) {
        const ret = Math.fround(arg0);
        return ret;
    };
    imports.wbg.__wbg_fullscreenElement_e2e939644adf50e1 = function(arg0) {
        const ret = arg0.fullscreenElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_fullscreenEnabled_8f943471b4923a43 = function(arg0) {
        const ret = arg0.fullscreenEnabled;
        return ret;
    };
    imports.wbg.__wbg_fullscreen_85fb1f6b3d3b2436 = function(arg0) {
        const ret = arg0.fullscreen;
        return ret;
    };
    imports.wbg.__wbg_generateMipmap_85452cd8f350f404 = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_generateMipmap_bfd04ca851518e7c = function(arg0, arg1) {
        arg0.generateMipmap(arg1 >>> 0);
    };
    imports.wbg.__wbg_getActiveAttrib_3b9a7c3feec1ebf3 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveAttrib(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveAttrib_a47ff9599ba4f8e6 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveAttrib(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniformBlockName_6bc809936b653491 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.getActiveUniformBlockName(arg2, arg3 >>> 0);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getActiveUniformBlockParameter_d39433044c7663d0 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getActiveUniformBlockParameter(arg1, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getActiveUniform_2199380c7c653b04 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniform_f8c2ebbc0e463338 = function(arg0, arg1, arg2) {
        const ret = arg0.getActiveUniform(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getActiveUniforms_31cf40dc420d67b9 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getActiveUniforms(arg1, arg2, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getAnimations_0f4075caecc240c5 = function(arg0) {
        const ret = arg0.getAnimations();
        return ret;
    };
    imports.wbg.__wbg_getAnimations_95bf7f4c904a9c1a = function(arg0) {
        const ret = arg0.getAnimations();
        return ret;
    };
    imports.wbg.__wbg_getArg_3c053b822e6eb529 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getArg(arg1, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getAttachedShaders_4731b3c87a539ce6 = function(arg0, arg1) {
        const ret = arg0.getAttachedShaders(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getAttachedShaders_dd33ff29ac1bf22a = function(arg0, arg1) {
        const ret = arg0.getAttachedShaders(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getAttribLocation_5917620b3c9497e6 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getAttribLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getAttribLocation_e56db0839c7627ca = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getAttribLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getAttributeNS_ee1551e9f29d8aab = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg1.getAttributeNS(arg2 === 0 ? undefined : getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getAttributeNames_a4cf23a0759d30ee = function(arg0) {
        const ret = arg0.getAttributeNames();
        return ret;
    };
    imports.wbg.__wbg_getAttribute_80900eec94cb3636 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.getAttribute(getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getBindGroupLayout_082ba17283059405 = function(arg0, arg1) {
        const ret = arg0.getBindGroupLayout(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBindGroupLayout_d087f5d30b56cb41 = function(arg0, arg1) {
        const ret = arg0.getBindGroupLayout(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBoxQuads_28691760f79e1150 = function() { return handleError(function (arg0) {
        const ret = arg0.getBoxQuads();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getBoxQuads_ee1ab0ed311b0b54 = function() { return handleError(function (arg0) {
        const ret = arg0.getBoxQuads();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getBufferParameter_d17ed1f0312667a3 = function(arg0, arg1, arg2) {
        const ret = arg0.getBufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBufferParameter_e4c0e002a8943bb2 = function(arg0, arg1, arg2) {
        const ret = arg0.getBufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getBufferSubData_17aa5d8ccf499438 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_1867a1050f5a6726 = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_2ff8e84b2945afb0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_38c673daf9d5c0a3 = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_3b4b8d4916fcafa8 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_3e2837bebc30ae0b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_getBufferSubData_4497506a3621b1c1 = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_696bb0a7e867f679 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_getBufferSubData_72bdf3d54be57a7d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_8c0465b359cef795 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_a22d15e33656db85 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_b355b1e17d8c535d = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_c2bc0788526c42c7 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_c6cb21b30469084f = function(arg0, arg1, arg2, arg3) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_getBufferSubData_cc5e1362f91d27a5 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_d87c05088195244c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_da3554ddf0d02b9c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_getBufferSubData_ebf9f7ed48262177 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.getBufferSubData(arg1 >>> 0, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_getCanonicalLocales_b1cc98f309846098 = function(arg0) {
        const ret = Intl.getCanonicalLocales(arg0);
        return ret;
    };
    imports.wbg.__wbg_getCompilationInfo_00d97503305ec44e = function(arg0) {
        const ret = arg0.getCompilationInfo();
        return ret;
    };
    imports.wbg.__wbg_getConfiguration_e7eddea9e18c7bc6 = function(arg0) {
        const ret = arg0.getConfiguration();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getContext_01f42b234e833f0a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_1a6877af6b5f04dc = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_2f210d0a58d43d95 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getContext_40a6fc6da6cacc21 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getContext(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getCurrentTexture_b82524d31095411f = function() { return handleError(function (arg0) {
        const ret = arg0.getCurrentTexture();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getDate_b8071ea9fc4f6838 = function(arg0) {
        const ret = arg0.getDate();
        return ret;
    };
    imports.wbg.__wbg_getDay_c13a50561112f77a = function(arg0) {
        const ret = arg0.getDay();
        return ret;
    };
    imports.wbg.__wbg_getElementById_e05488d2143c2b21 = function(arg0, arg1, arg2) {
        const ret = arg0.getElementById(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getElementsByName_4f03cf0da57975d1 = function(arg0, arg1, arg2) {
        const ret = arg0.getElementsByName(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_getEntriesByName_2504a2c90a572afd = function(arg0, arg1, arg2) {
        const ret = arg0.getEntriesByName(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_getEntriesByName_b544deeaf11e69ee = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.getEntriesByName(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_getEntriesByType_933fa439a59c9f00 = function(arg0, arg1, arg2) {
        const ret = arg0.getEntriesByType(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_getEntries_1f63124745805a32 = function(arg0) {
        const ret = arg0.getEntries();
        return ret;
    };
    imports.wbg.__wbg_getError_1512d8f11d3dce17 = function(arg0) {
        const ret = arg0.getError();
        return ret;
    };
    imports.wbg.__wbg_getError_86b51f8a9c7debb3 = function(arg0) {
        const ret = arg0.getError();
        return ret;
    };
    imports.wbg.__wbg_getExtension_2078be640f482416 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getExtension_49a13df0dc150fab = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getExtension(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_getFloat32_9385678adf740720 = function(arg0, arg1) {
        const ret = arg0.getFloat32(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getFloat32_a82a331afe676942 = function(arg0, arg1, arg2) {
        const ret = arg0.getFloat32(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getFloat64_22871e227b91f635 = function(arg0, arg1) {
        const ret = arg0.getFloat64(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getFloat64_82aaccae6d56afa9 = function(arg0, arg1, arg2) {
        const ret = arg0.getFloat64(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getFragDataLocation_fa5f4bedc69a8b5d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getFragDataLocation(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getFramebufferAttachmentParameter_8d719700191053c2 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getFramebufferAttachmentParameter(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getFramebufferAttachmentParameter_a3e847d8d84d7111 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getFramebufferAttachmentParameter(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getFullYear_6ac412e8eee86879 = function(arg0) {
        const ret = arg0.getFullYear();
        return ret;
    };
    imports.wbg.__wbg_getGamepads_0a2243e96f36011e = function() { return handleError(function (arg0) {
        const ret = arg0.getGamepads();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getHours_52eb417ad6e924e8 = function(arg0) {
        const ret = arg0.getHours();
        return ret;
    };
    imports.wbg.__wbg_getIndexedParameter_46abff0edb598e22 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getIndexedParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getInt16_8e68909c1c8402f7 = function(arg0, arg1, arg2) {
        const ret = arg0.getInt16(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getInt16_bc5b1391008e1c57 = function(arg0, arg1) {
        const ret = arg0.getInt16(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getInt32_2908e57ebf8cff92 = function(arg0, arg1, arg2) {
        const ret = arg0.getInt32(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getInt32_c5562f24c4863f8e = function(arg0, arg1) {
        const ret = arg0.getInt32(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getInt8_a09663dbe7c7febb = function(arg0, arg1) {
        const ret = arg0.getInt8(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getInternalformatParameter_75db2d0a0d7780e8 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.getInternalformatParameter(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_2f755e3348af574a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_35be212c8559f698 = function() { return handleError(function (arg0) {
        const ret = arg0.getMappedRange();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_39603540dd41e01b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_98acf7ad62c501ee = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_b08b08455ceea323 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getMappedRange(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_be59ee1896ff983c = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getMappedRange(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMappedRange_e4a46e1f5d2a0b4d = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getMappedRange(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getMilliseconds_6723821f6141e50f = function(arg0) {
        const ret = arg0.getMilliseconds();
        return ret;
    };
    imports.wbg.__wbg_getMinutes_4097cef8e08622f9 = function(arg0) {
        const ret = arg0.getMinutes();
        return ret;
    };
    imports.wbg.__wbg_getMonth_48a392071f9e5017 = function(arg0) {
        const ret = arg0.getMonth();
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertyDescriptor_b6aa5a2fa50d52c7 = function(arg0, arg1) {
        const ret = Object.getOwnPropertyDescriptor(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertyDescriptor_ea1495f701420bc6 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.getOwnPropertyDescriptor(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getOwnPropertyDescriptors_2996223fec3f8597 = function(arg0) {
        const ret = Object.getOwnPropertyDescriptors(arg0);
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertyNames_8f7d45df4641bc07 = function(arg0) {
        const ret = Object.getOwnPropertyNames(arg0);
        return ret;
    };
    imports.wbg.__wbg_getOwnPropertySymbols_541163c45acd92f7 = function(arg0) {
        const ret = Object.getOwnPropertySymbols(arg0);
        return ret;
    };
    imports.wbg.__wbg_getParameter_08df3cb47d357cca = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getParameter_1dfd667c33169fab = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.getParameter(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getPreferredCanvasFormat_92cc631581256e43 = function(arg0) {
        const ret = arg0.getPreferredCanvasFormat();
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_getProgramInfoLog_a0ff8b0971fcaf48 = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramInfoLog_ea3064b153e4542a = function(arg0, arg1, arg2) {
        const ret = arg1.getProgramInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getProgramParameter_c777611a448a6ccd = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getProgramParameter_ff1aee3815d6a8f9 = function(arg0, arg1, arg2) {
        const ret = arg0.getProgramParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getPrototypeOf_847b9c7e1dd3c978 = function() { return handleError(function (arg0) {
        const ret = Reflect.getPrototypeOf(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getPrototypeOf_86d205e553e642c1 = function(arg0) {
        const ret = Object.getPrototypeOf(arg0);
        return ret;
    };
    imports.wbg.__wbg_getQueryEXT_dd4b3607dff04132 = function(arg0, arg1, arg2) {
        const ret = arg0.getQueryEXT(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getQueryObjectEXT_9102c245eb5acda7 = function(arg0, arg1, arg2) {
        const ret = arg0.getQueryObjectEXT(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getQueryParameter_7f1971af9b820343 = function(arg0, arg1, arg2) {
        const ret = arg0.getQueryParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getQuery_e5f8f2e78e7e7fb7 = function(arg0, arg1, arg2) {
        const ret = arg0.getQuery(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_getRenderbufferParameter_a836f9104c69e5c6 = function(arg0, arg1, arg2) {
        const ret = arg0.getRenderbufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getRenderbufferParameter_f1afc6c129b5597f = function(arg0, arg1, arg2) {
        const ret = arg0.getRenderbufferParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getRootNode_c2316085ca42cd67 = function(arg0) {
        const ret = arg0.getRootNode();
        return ret;
    };
    imports.wbg.__wbg_getSamplerParameter_a81c43a74f223842 = function(arg0, arg1, arg2) {
        const ret = arg0.getSamplerParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getSeconds_d94762aec8103802 = function(arg0) {
        const ret = arg0.getSeconds();
        return ret;
    };
    imports.wbg.__wbg_getShaderInfoLog_1affea8c74bd191c = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderInfoLog_862d8c35c68d02c8 = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderInfoLog(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderParameter_1f86483b99db3dcc = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getShaderParameter_b8a41abb0d7d23c3 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getShaderPrecisionFormat_5bbcc23ef6b376a1 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderPrecisionFormat(arg1 >>> 0, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getShaderPrecisionFormat_a4897f4efeffc710 = function(arg0, arg1, arg2) {
        const ret = arg0.getShaderPrecisionFormat(arg1 >>> 0, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getShaderSource_797773963906d84d = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderSource(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getShaderSource_b749f785718de7fe = function(arg0, arg1, arg2) {
        const ret = arg1.getShaderSource(arg2);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getSupportedExtensions_bc23bc19c9dac45d = function(arg0) {
        const ret = arg0.getSupportedExtensions();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getSupportedExtensions_e1652e64b15aff85 = function(arg0) {
        const ret = arg0.getSupportedExtensions();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getSupportedProfiles_d5636f8d10765e75 = function(arg0) {
        const ret = arg0.getSupportedProfiles();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getSyncParameter_20391c81e5e58c48 = function(arg0, arg1, arg2) {
        const ret = arg0.getSyncParameter(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getTexParameter_699a67c3b7da03db = function(arg0, arg1, arg2) {
        const ret = arg0.getTexParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getTexParameter_f99e40d76931fc1e = function(arg0, arg1, arg2) {
        const ret = arg0.getTexParameter(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getTime_ad1e9878a735af08 = function(arg0) {
        const ret = arg0.getTime();
        return ret;
    };
    imports.wbg.__wbg_getTimezoneOffset_45389e26d6f46823 = function(arg0) {
        const ret = arg0.getTimezoneOffset();
        return ret;
    };
    imports.wbg.__wbg_getTransformFeedbackVarying_543b875d3e65ba9f = function(arg0, arg1, arg2) {
        const ret = arg0.getTransformFeedbackVarying(arg1, arg2 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getTranslatedShaderSource_4c7e20cdea74134b = function(arg0, arg1, arg2) {
        const ret = arg1.getTranslatedShaderSource(arg2);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_getUTCDate_2bba81cf0ce2ef57 = function(arg0) {
        const ret = arg0.getUTCDate();
        return ret;
    };
    imports.wbg.__wbg_getUTCDay_a26b41e21222e6f6 = function(arg0) {
        const ret = arg0.getUTCDay();
        return ret;
    };
    imports.wbg.__wbg_getUTCFullYear_8523c9e9544c9f0e = function(arg0) {
        const ret = arg0.getUTCFullYear();
        return ret;
    };
    imports.wbg.__wbg_getUTCHours_726a1adc9fc06ad7 = function(arg0) {
        const ret = arg0.getUTCHours();
        return ret;
    };
    imports.wbg.__wbg_getUTCMilliseconds_5f88f742af10a9dc = function(arg0) {
        const ret = arg0.getUTCMilliseconds();
        return ret;
    };
    imports.wbg.__wbg_getUTCMinutes_e361259948f2ea42 = function(arg0) {
        const ret = arg0.getUTCMinutes();
        return ret;
    };
    imports.wbg.__wbg_getUTCMonth_dd5805ff06b70e4b = function(arg0) {
        const ret = arg0.getUTCMonth();
        return ret;
    };
    imports.wbg.__wbg_getUTCSeconds_97b72aa152b4cc6d = function(arg0) {
        const ret = arg0.getUTCSeconds();
        return ret;
    };
    imports.wbg.__wbg_getUint16_c760225010529125 = function(arg0, arg1) {
        const ret = arg0.getUint16(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getUint16_cb7a6e659d68e5a6 = function(arg0, arg1, arg2) {
        const ret = arg0.getUint16(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getUint32_d3b8478c9340d38b = function(arg0, arg1, arg2) {
        const ret = arg0.getUint32(arg1 >>> 0, arg2 !== 0);
        return ret;
    };
    imports.wbg.__wbg_getUint32_d63de983274cb44e = function(arg0, arg1) {
        const ret = arg0.getUint32(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getUint8_f42915a9262518eb = function(arg0, arg1) {
        const ret = arg0.getUint8(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getUniformBlockIndex_1453ff945a9eefd5 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformBlockIndex(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_getUniformIndices_e1c9ee3088a3f66a = function(arg0, arg1, arg2) {
        const ret = arg0.getUniformIndices(arg1, arg2);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_21ac12bfc569cbbf = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniformLocation_2a4ddf8dd8285373 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.getUniformLocation(arg1, getStringFromWasm0(arg2, arg3));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_getUniform_044f9e3095ff7d65 = function(arg0, arg1, arg2) {
        const ret = arg0.getUniform(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_getUniform_285659f60717092a = function(arg0, arg1, arg2) {
        const ret = arg0.getUniform(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_getVRDisplays_d1ded019a85d91cd = function() { return handleError(function (arg0) {
        const ret = arg0.getVRDisplays();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getVertexAttribOffset_9b1b055c54933aa1 = function(arg0, arg1, arg2) {
        const ret = arg0.getVertexAttribOffset(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getVertexAttribOffset_f87cb294e7f20143 = function(arg0, arg1, arg2) {
        const ret = arg0.getVertexAttribOffset(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_getVertexAttrib_bbe4b402a079617b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getVertexAttrib(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_getVertexAttrib_ebba7fa609bae0d9 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.getVertexAttrib(arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_16458e8ef25ea5fa = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.get(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_2a2c70fb43cb6b44 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_322fa48fc5ad4254 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.get(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_6b7bd52aca3f9671 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_6e5c21a92b939af5 = function(arg0, arg1, arg2) {
        const ret = arg0[getStringFromWasm0(arg1, arg2)];
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_8004a118935da3ad = function(arg0, arg1) {
        const ret = arg0.get(arg1);
        return ret;
    };
    imports.wbg.__wbg_get_a_90bde84e16c2bccd = function(arg0) {
        const ret = arg0.a;
        return ret;
    };
    imports.wbg.__wbg_get_access_6940d6cddd2a4611 = function(arg0) {
        const ret = arg0.access;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuStorageTextureAccess.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_address_mode_u_f5f90f7a0ec64fd5 = function(arg0) {
        const ret = arg0.addressModeU;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuAddressMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_address_mode_v_b03ea582f8af71f5 = function(arg0) {
        const ret = arg0.addressModeV;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuAddressMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_address_mode_w_35a8cc263466b779 = function(arg0) {
        const ret = arg0.addressModeW;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuAddressMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_af9dab7e9603ea93 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_alpha_19d59499f8cac096 = function(arg0) {
        const ret = arg0.alpha;
        return ret;
    };
    imports.wbg.__wbg_get_alpha_mode_b3008ed6e3ff01e6 = function(arg0) {
        const ret = arg0.alphaMode;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuCanvasAlphaMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_alpha_to_coverage_enabled_2d2c4625cfd46c06 = function(arg0) {
        const ret = arg0.alphaToCoverageEnabled;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_array_layer_count_3eb7ebb425723f6e = function(arg0) {
        const ret = arg0.arrayLayerCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_array_stride_542456baab93d3b6 = function(arg0) {
        const ret = arg0.arrayStride;
        return ret;
    };
    imports.wbg.__wbg_get_aspect_2cf909295d6b1065 = function(arg0) {
        const ret = arg0.aspect;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureAspect.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_aspect_3e2897f1b42e9b15 = function(arg0) {
        const ret = arg0.aspect;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureAspect.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_aspect_c227150471cfe335 = function(arg0) {
        const ret = arg0.aspect;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureAspect.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_attributes_325cfdc2ee3fb5ac = function(arg0) {
        const ret = arg0.attributes;
        return ret;
    };
    imports.wbg.__wbg_get_b_06013131c054f3ef = function(arg0) {
        const ret = arg0.b;
        return ret;
    };
    imports.wbg.__wbg_get_base_array_layer_1ce0da40c26c37b5 = function(arg0) {
        const ret = arg0.baseArrayLayer;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_base_mip_level_cbd7ab3dd5985e8c = function(arg0) {
        const ret = arg0.baseMipLevel;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_beginning_of_pass_write_index_a82f5b43372ea0c6 = function(arg0) {
        const ret = arg0.beginningOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_beginning_of_pass_write_index_d8589bb32f020524 = function(arg0) {
        const ret = arg0.beginningOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_bind_group_layouts_505dac0fad0aa7d6 = function(arg0) {
        const ret = arg0.bindGroupLayouts;
        return ret;
    };
    imports.wbg.__wbg_get_binding_6417ab6d682989bf = function(arg0) {
        const ret = arg0.binding;
        return ret;
    };
    imports.wbg.__wbg_get_binding_a61616c3948d9fbc = function(arg0) {
        const ret = arg0.binding;
        return ret;
    };
    imports.wbg.__wbg_get_blend_0316ccd690d5c6b3 = function(arg0) {
        const ret = arg0.blend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_bubbles_3a35aba71388dff4 = function(arg0) {
        const ret = arg0.bubbles;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_buffer_4e5fcde63520590e = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_get_buffer_c41346fcc1f538c5 = function(arg0) {
        const ret = arg0.buffer;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_buffer_f5880d6d9571dbf1 = function(arg0) {
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_get_buffers_a1d0518ef588af3a = function(arg0) {
        const ret = arg0.buffers;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_bytes_per_row_47f7308cbe64ac3b = function(arg0) {
        const ret = arg0.bytesPerRow;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_bytes_per_row_a8a86030314fdb0d = function(arg0) {
        const ret = arg0.bytesPerRow;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_c53d381635aa3929 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_cancelable_9598470b1edd2f42 = function(arg0) {
        const ret = arg0.cancelable;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_cbf36dc54869cf03 = function(arg0, arg1) {
        const ret = arg0.get(arg1);
        return ret;
    };
    imports.wbg.__wbg_get_clear_value_8d228eab1a329a73 = function(arg0) {
        const ret = arg0.clearValue;
        return ret;
    };
    imports.wbg.__wbg_get_code_43c5edfda4156869 = function(arg0, arg1) {
        const ret = arg1.code;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_color_attachments_b326352e7e16884d = function(arg0) {
        const ret = arg0.colorAttachments;
        return ret;
    };
    imports.wbg.__wbg_get_color_f7fa031ec410e455 = function(arg0) {
        const ret = arg0.color;
        return ret;
    };
    imports.wbg.__wbg_get_color_formats_b6cda2e907ff6d5d = function(arg0) {
        const ret = arg0.colorFormats;
        return ret;
    };
    imports.wbg.__wbg_get_compare_c54445607750d835 = function(arg0) {
        const ret = arg0.compare;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuCompareFunction.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_get_compare_cc82ef8e836ffca9 = function(arg0) {
        const ret = arg0.compare;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuCompareFunction.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_get_compilation_hints_db3cb28b73faad23 = function(arg0) {
        const ret = arg0.compilationHints;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_composed_0fcb2c0249045273 = function(arg0) {
        const ret = arg0.composed;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_compute_c454ce2b3d7d7c32 = function(arg0) {
        const ret = arg0.compute;
        return ret;
    };
    imports.wbg.__wbg_get_constants_1c31d646fa20db16 = function(arg0) {
        const ret = arg0.constants;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_constants_25e4ccadc4b55e6f = function(arg0) {
        const ret = arg0.constants;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_constants_e6dba9202e2d6ef8 = function(arg0) {
        const ret = arg0.constants;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_count_66a055e86cff3358 = function(arg0) {
        const ret = arg0.count;
        return ret;
    };
    imports.wbg.__wbg_get_count_e413bea658bcb7bd = function(arg0) {
        const ret = arg0.count;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_cull_mode_7b7f4ce8fc075f21 = function(arg0) {
        const ret = arg0.cullMode;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuCullMode.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_default_queue_38d79ce92e9395e7 = function(arg0) {
        const ret = arg0.defaultQueue;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_depth_bias_52b792f599154809 = function(arg0) {
        const ret = arg0.depthBias;
        return isLikeNone(ret) ? 0x100000001 : (ret) >> 0;
    };
    imports.wbg.__wbg_get_depth_bias_clamp_aa0d184a0e5bb939 = function(arg0) {
        const ret = arg0.depthBiasClamp;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_get_depth_bias_slope_scale_4703c4f936dda516 = function(arg0) {
        const ret = arg0.depthBiasSlopeScale;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_get_depth_clear_value_aa86bf977979eaa8 = function(arg0) {
        const ret = arg0.depthClearValue;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_get_depth_compare_e31fa63025caab76 = function(arg0) {
        const ret = arg0.depthCompare;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuCompareFunction.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_get_depth_fail_op_07b20f923bf3f28f = function(arg0) {
        const ret = arg0.depthFailOp;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuStencilOperation.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_get_depth_load_op_ba0c261f6f9beba8 = function(arg0) {
        const ret = arg0.depthLoadOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuLoadOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_depth_or_array_layers_f243db1cee4555ca = function(arg0) {
        const ret = arg0.depthOrArrayLayers;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_depth_read_only_8940bb4ace27e525 = function(arg0) {
        const ret = arg0.depthReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_depth_read_only_ff87f85903bdd615 = function(arg0) {
        const ret = arg0.depthReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_depth_slice_00fca78b81a80bee = function(arg0) {
        const ret = arg0.depthSlice;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_depth_stencil_74913b30a25cdfe6 = function(arg0) {
        const ret = arg0.depthStencil;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_depth_stencil_attachment_c722a47c4554061a = function(arg0) {
        const ret = arg0.depthStencilAttachment;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_depth_stencil_format_a3c6185b690231f1 = function(arg0) {
        const ret = arg0.depthStencilFormat;
        return isLikeNone(ret) ? 96 : ((__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1);
    };
    imports.wbg.__wbg_get_depth_store_op_1bd3700ea899ead5 = function(arg0) {
        const ret = arg0.depthStoreOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuStoreOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_depth_write_enabled_80688892aa83788c = function(arg0) {
        const ret = arg0.depthWriteEnabled;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_device_54651e0892732321 = function(arg0) {
        const ret = arg0.device;
        return ret;
    };
    imports.wbg.__wbg_get_dimension_48764aab1ab563d5 = function(arg0) {
        const ret = arg0.dimension;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuTextureDimension.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_dimension_ff6e42cf5b6079e1 = function(arg0) {
        const ret = arg0.dimension;
        return isLikeNone(ret) ? 7 : ((__wbindgen_enum_GpuTextureViewDimension.indexOf(ret) + 1 || 7) - 1);
    };
    imports.wbg.__wbg_get_dst_factor_2be94196e8d9312c = function(arg0) {
        const ret = arg0.dstFactor;
        return isLikeNone(ret) ? 18 : ((__wbindgen_enum_GpuBlendFactor.indexOf(ret) + 1 || 18) - 1);
    };
    imports.wbg.__wbg_get_e63c13f35e0b7f8c = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.get(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_get_end_of_pass_write_index_5cb7e370367729a6 = function(arg0) {
        const ret = arg0.endOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_end_of_pass_write_index_66fc2df3ab5bff5c = function(arg0) {
        const ret = arg0.endOfPassWriteIndex;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_entries_85e9ca486c4f2f5f = function(arg0) {
        const ret = arg0.entries;
        return ret;
    };
    imports.wbg.__wbg_get_entries_9706a46053a4a4f2 = function(arg0) {
        const ret = arg0.entries;
        return ret;
    };
    imports.wbg.__wbg_get_entry_point_323847ddd49d958e = function(arg0, arg1) {
        const ret = arg1.entryPoint;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_entry_point_b32b0fdec26cb8b2 = function(arg0, arg1) {
        const ret = arg1.entryPoint;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_entry_point_b58a644dc454f067 = function(arg0, arg1) {
        const ret = arg1.entryPoint;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_error_2b1dd403ff55ed41 = function(arg0) {
        const ret = arg0.error;
        return ret;
    };
    imports.wbg.__wbg_get_external_texture_7235c7919e22b91f = function(arg0) {
        const ret = arg0.externalTexture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_fail_op_f6eac2b324264283 = function(arg0) {
        const ret = arg0.failOp;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuStencilOperation.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_get_feature_level_14bc4bad78f856f7 = function(arg0, arg1) {
        const ret = arg1.featureLevel;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_flip_y_e893e325b2abe7d6 = function(arg0) {
        const ret = arg0.flipY;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_force_fallback_adapter_5fec3b2e332e6218 = function(arg0) {
        const ret = arg0.forceFallbackAdapter;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_format_37f68a6981d5f93a = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuVertexFormat.indexOf(ret) + 1 || 42) - 1;
    };
    imports.wbg.__wbg_get_format_4330f750616c579f = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_get_format_67cedd65e61bf8dc = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_get_format_9fcc7c9f2dafd4b0 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_get_format_b8ad8646e9eed067 = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_get_format_c5cc1a31a82d5f39 = function(arg0) {
        const ret = arg0.format;
        return isLikeNone(ret) ? 96 : ((__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1);
    };
    imports.wbg.__wbg_get_format_fe4b710d33d7ae0d = function(arg0) {
        const ret = arg0.format;
        return (__wbindgen_enum_GpuTextureFormat.indexOf(ret) + 1 || 96) - 1;
    };
    imports.wbg.__wbg_get_fragment_2013de3161ec7c7d = function(arg0) {
        const ret = arg0.fragment;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_front_face_efc55a4a3c8d574e = function(arg0) {
        const ret = arg0.frontFace;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuFrontFace.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_g_d4fecaa2456d6b50 = function(arg0) {
        const ret = arg0.g;
        return ret;
    };
    imports.wbg.__wbg_get_has_dynamic_offset_8595658993bbc1a3 = function(arg0) {
        const ret = arg0.hasDynamicOffset;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_height_975929306267c9fb = function(arg0) {
        const ret = arg0.height;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_index_1226ed36df27e708 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_14b8dac5cd612a86 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_19fab4d73e6fc2af = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_311eb6dc7d7bcb52 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_4097e66687f6ff56 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_4e7b3f629a0ab9cd = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_5c01535eadd61931 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_723ecd097225a721 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_865ef6c029b35e97 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_bf5a15afea8cd4e2 = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_index_f9d9a9f5236833df = function(arg0, arg1) {
        const ret = arg0[arg1 >>> 0];
        return ret;
    };
    imports.wbg.__wbg_get_label_153739f5e882872d = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_1cddc78ca7bce309 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_483c6d9176f9ae1b = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_4a8a90b4620d8497 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_66c2d13412181904 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_6f9c8bd1bc969ba7 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_734e9482fe996c1d = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_7364b486fa053156 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_7c92fcace28f5065 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_892c682466259f4a = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_8f551c801cb2719c = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_956e5b78b9c2f4a3 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_a9d9e680cc8c82b0 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_bba7bb44f78d5879 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_be4793a5492a74f4 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_beffddd3a562011a = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_c672a7fa45d8249f = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_c6e00c54619a008e = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_ca058a5d28b887e7 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_d36e2fdcfaf242bf = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_ec2823d7e4a6a550 = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_label_fe70223e18577a7b = function(arg0, arg1) {
        const ret = arg1.label;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_layout_132f2c4eb984eba6 = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_get_layout_40a64109a08b0dcf = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_get_layout_dafb871d18351db7 = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_get_layout_fd2b51dd53f84235 = function(arg0) {
        const ret = arg0.layout;
        return ret;
    };
    imports.wbg.__wbg_get_load_op_a618d19bd2b2f725 = function(arg0) {
        const ret = arg0.loadOp;
        return (__wbindgen_enum_GpuLoadOp.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_get_lod_max_clamp_3183bb01f675ac85 = function(arg0) {
        const ret = arg0.lodMaxClamp;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_get_lod_min_clamp_93fbd562da775a7a = function(arg0) {
        const ret = arg0.lodMinClamp;
        return isLikeNone(ret) ? 0x100000001 : Math.fround(ret);
    };
    imports.wbg.__wbg_get_mag_filter_706870cdeb4d324d = function(arg0) {
        const ret = arg0.magFilter;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuFilterMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_mapped_at_creation_11689d28f5d627b4 = function(arg0) {
        const ret = arg0.mappedAtCreation;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_mask_3e2c14ff428ceee6 = function(arg0) {
        const ret = arg0.mask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_max_anisotropy_febe0f84b683ae3f = function(arg0) {
        const ret = arg0.maxAnisotropy;
        return isLikeNone(ret) ? 0xFFFFFF : ret;
    };
    imports.wbg.__wbg_get_max_draw_count_0d7d2c6f1205e630 = function(arg0, arg1) {
        const ret = arg1.maxDrawCount;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_get_min_binding_size_5ac89f0c69bf07da = function(arg0, arg1) {
        const ret = arg1.minBindingSize;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_get_min_filter_39e3e7b2ec7761a4 = function(arg0) {
        const ret = arg0.minFilter;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuFilterMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_mip_level_67930b75272f6a62 = function(arg0) {
        const ret = arg0.mipLevel;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_mip_level_c6b341bad086ef94 = function(arg0) {
        const ret = arg0.mipLevel;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_mip_level_count_6be3b8a7e3633da4 = function(arg0) {
        const ret = arg0.mipLevelCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_mip_level_count_de5252d3d1cd9fc9 = function(arg0) {
        const ret = arg0.mipLevelCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_mipmap_filter_5529b3dc74b0ab70 = function(arg0) {
        const ret = arg0.mipmapFilter;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuMipmapFilterMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_mode_ff8d4097c206438c = function(arg0) {
        const ret = arg0.mode;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuCanvasToneMappingMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_module_7ac18e4eef2ff2ab = function(arg0) {
        const ret = arg0.module;
        return ret;
    };
    imports.wbg.__wbg_get_module_d154312f782a39a1 = function(arg0) {
        const ret = arg0.module;
        return ret;
    };
    imports.wbg.__wbg_get_module_f9cf4c6e6bbf0f02 = function(arg0) {
        const ret = arg0.module;
        return ret;
    };
    imports.wbg.__wbg_get_multisample_928913d3eaa2d075 = function(arg0) {
        const ret = arg0.multisample;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_multisampled_5d6a525fc4f43b07 = function(arg0) {
        const ret = arg0.multisampled;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_name_adfd5daf8c9e0121 = function(arg0, arg1) {
        const ret = arg1.name;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_get_occlusion_query_set_0378d050fcf820ac = function(arg0) {
        const ret = arg0.occlusionQuerySet;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_offset_9d37a03e9a5c8c4f = function(arg0, arg1) {
        const ret = arg1.offset;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_get_offset_9d6565f2c78aecab = function(arg0, arg1) {
        const ret = arg1.offset;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_get_offset_e77d37c375506d7a = function(arg0, arg1) {
        const ret = arg1.offset;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_get_offset_e7b39cbf5cac56ad = function(arg0) {
        const ret = arg0.offset;
        return ret;
    };
    imports.wbg.__wbg_get_operation_7468943cc38a90ac = function(arg0) {
        const ret = arg0.operation;
        return isLikeNone(ret) ? 6 : ((__wbindgen_enum_GpuBlendOperation.indexOf(ret) + 1 || 6) - 1);
    };
    imports.wbg.__wbg_get_origin_2db0589697db222c = function(arg0) {
        const ret = arg0.origin;
        return ret;
    };
    imports.wbg.__wbg_get_origin_3d956154cfae9693 = function(arg0) {
        const ret = arg0.origin;
        return ret;
    };
    imports.wbg.__wbg_get_origin_a7b170c329138f49 = function(arg0) {
        const ret = arg0.origin;
        return ret;
    };
    imports.wbg.__wbg_get_pass_op_74058b3fe2d9ed36 = function(arg0) {
        const ret = arg0.passOp;
        return isLikeNone(ret) ? 9 : ((__wbindgen_enum_GpuStencilOperation.indexOf(ret) + 1 || 9) - 1);
    };
    imports.wbg.__wbg_get_power_preference_80f16edd477e099c = function(arg0) {
        const ret = arg0.powerPreference;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuPowerPreference.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_premultiplied_alpha_18cb94703779aa8f = function(arg0) {
        const ret = arg0.premultipliedAlpha;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_primitive_4bb7a4ce79cac39e = function(arg0) {
        const ret = arg0.primitive;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_query_set_0059e4f433e9375b = function(arg0) {
        const ret = arg0.querySet;
        return ret;
    };
    imports.wbg.__wbg_get_query_set_a81736e373e46797 = function(arg0) {
        const ret = arg0.querySet;
        return ret;
    };
    imports.wbg.__wbg_get_r_b486c2c1cc300b05 = function(arg0) {
        const ret = arg0.r;
        return ret;
    };
    imports.wbg.__wbg_get_required_features_51d2c35ab4e422b6 = function(arg0) {
        const ret = arg0.requiredFeatures;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_required_limits_2e5412924d28e2fa = function(arg0) {
        const ret = arg0.requiredLimits;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_resolve_target_e0750d14da9cf310 = function(arg0) {
        const ret = arg0.resolveTarget;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_resource_5444a6c31ee9512c = function(arg0) {
        const ret = arg0.resource;
        return ret;
    };
    imports.wbg.__wbg_get_rows_per_image_1083ba3b74428133 = function(arg0) {
        const ret = arg0.rowsPerImage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_rows_per_image_a4155a8bd1b2ee70 = function(arg0) {
        const ret = arg0.rowsPerImage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_sample_count_493344b7d0858d25 = function(arg0) {
        const ret = arg0.sampleCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_sample_count_7c33121b196850e6 = function(arg0) {
        const ret = arg0.sampleCount;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_sample_type_29263f648d635ec1 = function(arg0) {
        const ret = arg0.sampleType;
        return isLikeNone(ret) ? 6 : ((__wbindgen_enum_GpuTextureSampleType.indexOf(ret) + 1 || 6) - 1);
    };
    imports.wbg.__wbg_get_sampler_b1da436a85ed5011 = function(arg0) {
        const ret = arg0.sampler;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_shader_location_1fe7478623a1b084 = function(arg0) {
        const ret = arg0.shaderLocation;
        return ret;
    };
    imports.wbg.__wbg_get_size_084cb42ecfefc9ab = function(arg0, arg1) {
        const ret = arg1.size;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_get_size_16189b32a618d2bc = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_get_size_920a52c80603bd9c = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_get_source_242489164beefcf0 = function(arg0) {
        const ret = arg0.source;
        return ret;
    };
    imports.wbg.__wbg_get_source_8e1ceb9b6d079224 = function(arg0) {
        const ret = arg0.source;
        return ret;
    };
    imports.wbg.__wbg_get_src_factor_33afccc1c44fd83c = function(arg0) {
        const ret = arg0.srcFactor;
        return isLikeNone(ret) ? 18 : ((__wbindgen_enum_GpuBlendFactor.indexOf(ret) + 1 || 18) - 1);
    };
    imports.wbg.__wbg_get_stencil_back_507f0b807d9fc7e9 = function(arg0) {
        const ret = arg0.stencilBack;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_stencil_clear_value_a5cebdd0dab4bb63 = function(arg0) {
        const ret = arg0.stencilClearValue;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_stencil_front_768b96c36c719e26 = function(arg0) {
        const ret = arg0.stencilFront;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_stencil_load_op_85f2261c3eb3d216 = function(arg0) {
        const ret = arg0.stencilLoadOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuLoadOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_stencil_read_mask_bd5c394ccf1fbdfc = function(arg0) {
        const ret = arg0.stencilReadMask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_stencil_read_only_031af731a0e16a66 = function(arg0) {
        const ret = arg0.stencilReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_stencil_read_only_e156af1336f02ddb = function(arg0) {
        const ret = arg0.stencilReadOnly;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_stencil_store_op_798b054dedfd2a1f = function(arg0) {
        const ret = arg0.stencilStoreOp;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuStoreOp.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_stencil_write_mask_ba17e1369855195e = function(arg0) {
        const ret = arg0.stencilWriteMask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_step_mode_7890b6218b92662f = function(arg0) {
        const ret = arg0.stepMode;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuVertexStepMode.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_storage_texture_a013b6e1eb0cd7f1 = function(arg0) {
        const ret = arg0.storageTexture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_store_op_320748236ba4a17b = function(arg0) {
        const ret = arg0.storeOp;
        return (__wbindgen_enum_GpuStoreOp.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_get_strip_index_format_c2ee7d3af64f2a54 = function(arg0) {
        const ret = arg0.stripIndexFormat;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_GpuIndexFormat.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_targets_a997e52cf8eae9ef = function(arg0) {
        const ret = arg0.targets;
        return ret;
    };
    imports.wbg.__wbg_get_texture_04506b10bca1b470 = function(arg0) {
        const ret = arg0.texture;
        return ret;
    };
    imports.wbg.__wbg_get_texture_53fe19f250895a19 = function(arg0) {
        const ret = arg0.texture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_texture_5893319c268adeec = function(arg0) {
        const ret = arg0.texture;
        return ret;
    };
    imports.wbg.__wbg_get_timestamp_writes_0701607eeaba11fc = function(arg0) {
        const ret = arg0.timestampWrites;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_timestamp_writes_812bade9ea8265d2 = function(arg0) {
        const ret = arg0.timestampWrites;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_tone_mapping_80c1c09e245228d7 = function(arg0) {
        const ret = arg0.toneMapping;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_topology_19bb3faafcf6899f = function(arg0) {
        const ret = arg0.topology;
        return isLikeNone(ret) ? 6 : ((__wbindgen_enum_GpuPrimitiveTopology.indexOf(ret) + 1 || 6) - 1);
    };
    imports.wbg.__wbg_get_type_5a28572ecfd4f823 = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuSamplerBindingType.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_type_ac144d2fb987a104 = function(arg0) {
        const ret = arg0.type;
        return (__wbindgen_enum_GpuQueryType.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_get_type_de120f4fc03d30c2 = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 4 : ((__wbindgen_enum_GpuBufferBindingType.indexOf(ret) + 1 || 4) - 1);
    };
    imports.wbg.__wbg_get_type_fd2a58251f53bdd3 = function(arg0) {
        const ret = arg0.type;
        return isLikeNone(ret) ? 3 : ((__wbindgen_enum_WorkerType.indexOf(ret) + 1 || 3) - 1);
    };
    imports.wbg.__wbg_get_unclipped_depth_c8ae92195c1bd323 = function(arg0) {
        const ret = arg0.unclippedDepth;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_usage_02a9343e2a008604 = function(arg0) {
        const ret = arg0.usage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_usage_4aeff8cddd6d16cd = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_get_usage_993e4fe9d680a764 = function(arg0) {
        const ret = arg0.usage;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_usage_ed54d44e76ae1849 = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_get_vertex_350650423c1cc66a = function(arg0) {
        const ret = arg0.vertex;
        return ret;
    };
    imports.wbg.__wbg_get_view_3b47aeb411bbe271 = function(arg0) {
        const ret = arg0.view;
        return ret;
    };
    imports.wbg.__wbg_get_view_62ec38efee713539 = function(arg0) {
        const ret = arg0.view;
        return ret;
    };
    imports.wbg.__wbg_get_view_dimension_9938e159799b332f = function(arg0) {
        const ret = arg0.viewDimension;
        return isLikeNone(ret) ? 7 : ((__wbindgen_enum_GpuTextureViewDimension.indexOf(ret) + 1 || 7) - 1);
    };
    imports.wbg.__wbg_get_view_dimension_a62d6aa2f51feede = function(arg0) {
        const ret = arg0.viewDimension;
        return isLikeNone(ret) ? 7 : ((__wbindgen_enum_GpuTextureViewDimension.indexOf(ret) + 1 || 7) - 1);
    };
    imports.wbg.__wbg_get_view_formats_8a518740f7ee7c6e = function(arg0) {
        const ret = arg0.viewFormats;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_view_formats_a593d97315466189 = function(arg0) {
        const ret = arg0.viewFormats;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_get_visibility_a4c84b747a8e8a70 = function(arg0) {
        const ret = arg0.visibility;
        return ret;
    };
    imports.wbg.__wbg_get_width_871b14482eec2830 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_get_with_ref_key_1dc361bd10053bfe = function(arg0, arg1) {
        const ret = arg0[arg1];
        return ret;
    };
    imports.wbg.__wbg_get_write_mask_1bcb985163aa3a63 = function(arg0) {
        const ret = arg0.writeMask;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_x_06374c57a8ee6396 = function(arg0) {
        const ret = arg0.x;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_x_d5c2201a2fa23455 = function(arg0) {
        const ret = arg0.x;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_xr_compatible_15ea4133a58ebb05 = function(arg0) {
        const ret = arg0.xrCompatible;
        return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
    };
    imports.wbg.__wbg_get_y_1e189fc0bd1e6004 = function(arg0) {
        const ret = arg0.y;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_y_3f6712b8c01b9641 = function(arg0) {
        const ret = arg0.y;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_get_z_fccebca718c33e00 = function(arg0) {
        const ret = arg0.z;
        return isLikeNone(ret) ? 0x100000001 : (ret) >>> 0;
    };
    imports.wbg.__wbg_global_1b8514e2b5433107 = function(arg0) {
        const ret = arg0.global;
        return ret;
    };
    imports.wbg.__wbg_gpu_4b2187814fd587ca = function(arg0) {
        const ret = arg0.gpu;
        return ret;
    };
    imports.wbg.__wbg_gpubackendinfo_new = function(arg0) {
        const ret = GpuBackendInfo.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_groupCollapsed_2c60f5ffdd6ba4b5 = function(arg0, arg1) {
        console.groupCollapsed(arg0, arg1);
    };
    imports.wbg.__wbg_groupCollapsed_5c8039f5620ef420 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.groupCollapsed(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_groupCollapsed_66bbaa17d98b9ecb = function(arg0) {
        console.groupCollapsed(arg0);
    };
    imports.wbg.__wbg_groupCollapsed_a707f1ddc1c3f9f1 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.groupCollapsed(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_groupCollapsed_c6016d204f53e569 = function() {
        console.groupCollapsed();
    };
    imports.wbg.__wbg_groupCollapsed_c872738a281328c9 = function(arg0, arg1, arg2) {
        console.groupCollapsed(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_groupCollapsed_d6f129bcf258dbfd = function(arg0, arg1, arg2, arg3, arg4) {
        console.groupCollapsed(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_groupCollapsed_d80c0d7d8cdfb262 = function(arg0) {
        console.groupCollapsed(...arg0);
    };
    imports.wbg.__wbg_groupCollapsed_db57a4145d83930f = function(arg0, arg1, arg2, arg3) {
        console.groupCollapsed(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_groupEnd_f9721f6e83ccb042 = function() {
        console.groupEnd();
    };
    imports.wbg.__wbg_group_294bd0b3f07dd915 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.group(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_group_3b471cd54f7962b1 = function(arg0) {
        console.group(arg0);
    };
    imports.wbg.__wbg_group_4eb0cf8929c9b2b5 = function(arg0, arg1, arg2) {
        console.group(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_group_aee79326d096fbaf = function(arg0, arg1, arg2, arg3) {
        console.group(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_group_d474b6664947d5f4 = function(arg0, arg1) {
        console.group(arg0, arg1);
    };
    imports.wbg.__wbg_group_dacacfa0fddbd2cd = function(arg0, arg1, arg2, arg3, arg4) {
        console.group(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_group_de3515570b06cd29 = function() {
        console.group();
    };
    imports.wbg.__wbg_group_f6e7147929221170 = function(arg0) {
        console.group(...arg0);
    };
    imports.wbg.__wbg_group_f7a8764c4f11e31d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.group(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_grow_55a51c4e5c2c12c5 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.grow(arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_grow_63c5122da71bcc6a = function(arg0, arg1) {
        const ret = arg0.grow(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_grow_fb776206c3a4e6f3 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.grow(arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_hardwareConcurrency_11023a850a093b20 = function(arg0) {
        const ret = arg0.hardwareConcurrency;
        return ret;
    };
    imports.wbg.__wbg_hardwareConcurrency_790df96bd73cce3e = function(arg0) {
        const ret = arg0.hardwareConcurrency;
        return ret;
    };
    imports.wbg.__wbg_hasAttributeNS_4271b271063fba53 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.hasAttributeNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_hasAttribute_af746bd1e7f1b334 = function(arg0, arg1, arg2) {
        const ret = arg0.hasAttribute(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_hasAttributes_d11f61914dec797f = function(arg0) {
        const ret = arg0.hasAttributes();
        return ret;
    };
    imports.wbg.__wbg_hasChildNodes_b14fd72ada4e05fb = function(arg0) {
        const ret = arg0.hasChildNodes();
        return ret;
    };
    imports.wbg.__wbg_hasFocus_7d4687baa7939850 = function() { return handleError(function (arg0) {
        const ret = arg0.hasFocus();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_hasInstance_c06b061ffb319f31 = function() {
        const ret = Symbol.hasInstance;
        return ret;
    };
    imports.wbg.__wbg_hasOwnProperty_a746c5cd9defdffc = function(arg0, arg1) {
        const ret = arg0.hasOwnProperty(arg1);
        return ret;
    };
    imports.wbg.__wbg_hasOwn_98ae3b74715e05dc = function(arg0, arg1) {
        const ret = Object.hasOwn(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_hasPointerCapture_29d4e0272fbaf8aa = function(arg0, arg1) {
        const ret = arg0.hasPointerCapture(arg1);
        return ret;
    };
    imports.wbg.__wbg_hasSuspendTaint_a3d578f5951821d6 = function(arg0) {
        const ret = arg0.hasSuspendTaint();
        return ret;
    };
    imports.wbg.__wbg_has_0e670569d65d3a45 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.has(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_has_578462e0169948ad = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_8a055d8c01371a13 = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_d664c1ce1ee4812b = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_dd74491007da8413 = function(arg0, arg1) {
        const ret = arg0.has(arg1);
        return ret;
    };
    imports.wbg.__wbg_has_e7b9469a0ae9abd2 = function(arg0, arg1, arg2) {
        const ret = arg0.has(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_has_f816c175e2a0dc4a = function(arg0, arg1, arg2) {
        const ret = arg0.has(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_height_3a0b31e52a5b7f17 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_684dfb3a7898c8ed = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_77d7b044cc9a387e = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_7b49856573e63a0e = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_93d6779af8295699 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_a07787f693c253d2 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_height_b39b909fd2ab3669 = function(arg0) {
        const ret = arg0.height;
        return ret;
    };
    imports.wbg.__wbg_hidden_63c9db3ea5c1e10a = function(arg0) {
        const ret = arg0.hidden;
        return ret;
    };
    imports.wbg.__wbg_hidden_6c91b829a6ce7509 = function(arg0) {
        const ret = arg0.hidden;
        return ret;
    };
    imports.wbg.__wbg_hidePopover_f3fc25f6a1b85946 = function() { return handleError(function (arg0) {
        arg0.hidePopover();
    }, arguments) };
    imports.wbg.__wbg_hint_223c788c22f94c03 = function(arg0, arg1, arg2) {
        arg0.hint(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_hint_da7d2c5566d80095 = function(arg0, arg1, arg2) {
        arg0.hint(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_hspace_4fa1c17e8d9259bd = function(arg0) {
        const ret = arg0.hspace;
        return ret;
    };
    imports.wbg.__wbg_hypot_24792f2590e2bdc3 = function(arg0, arg1) {
        const ret = Math.hypot(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_id_0cd70c3a5517c880 = function(arg0, arg1) {
        const ret = arg1.id;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_ignoreCase_215114f97a5aa281 = function(arg0) {
        const ret = arg0.ignoreCase;
        return ret;
    };
    imports.wbg.__wbg_importExternalTexture_6f302155ed961858 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.importExternalTexture(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_importNode_31dc53790d17b9a7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.importNode(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_importNode_d9c269948e562aae = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.importNode(arg1, arg2 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_importScripts_14602c452b6357f8 = function() { return handleError(function (arg0) {
        arg0.importScripts();
    }, arguments) };
    imports.wbg.__wbg_importScripts_41ca853e98c4b822 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_importScripts_468c4abd89da4d7a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_importScripts_7b7304ebbc4f0acf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_importScripts_84db90c6c12fa1c3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_importScripts_afcab307404d50df = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_importScripts_bfde1b977c42a312 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_importScripts_f474535abc93bcd9 = function() { return handleError(function (arg0, arg1) {
        arg0.importScripts(...arg1);
    }, arguments) };
    imports.wbg.__wbg_importScripts_f61317d21f57ae6b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.importScripts(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_imports_d7c6f1e23e012391 = function(arg0) {
        const ret = WebAssembly.Module.imports(arg0);
        return ret;
    };
    imports.wbg.__wbg_imul_07e4fdd569002da2 = function(arg0, arg1) {
        const ret = Math.imul(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_includes_cd7103de1f6ce823 = function(arg0, arg1, arg2) {
        const ret = arg0.includes(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_includes_d578a808c46164e3 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.includes(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_indexOf_ab77cc2d2c876c72 = function(arg0, arg1, arg2) {
        const ret = arg0.indexOf(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_indexOf_e6a15507b8d05dfc = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.indexOf(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_inert_c67cf344eefe32b9 = function(arg0) {
        const ret = arg0.inert;
        return ret;
    };
    imports.wbg.__wbg_info_45978754b5a711f1 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.info(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_info_556e9b1ab0a5f356 = function(arg0) {
        const ret = arg0.info;
        return ret;
    };
    imports.wbg.__wbg_info_849dc77bbb67b7e3 = function(arg0, arg1) {
        console.info(arg0, arg1);
    };
    imports.wbg.__wbg_info_9a0d314ea78f06b2 = function() {
        console.info();
    };
    imports.wbg.__wbg_info_ac802e3a3835dd81 = function(arg0, arg1, arg2, arg3, arg4) {
        console.info(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_info_b7fa8ce2e59d29c6 = function(arg0, arg1, arg2, arg3) {
        console.info(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_info_b9d1f6c3894bdf9d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.info(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_info_ca77021aeeaa65b1 = function(arg0, arg1, arg2) {
        console.info(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_info_ce6bcc489c22f6f0 = function(arg0) {
        console.info(arg0);
    };
    imports.wbg.__wbg_info_e951478d580c1573 = function(arg0) {
        console.info(...arg0);
    };
    imports.wbg.__wbg_initEvent_82d32f9be145e0d8 = function(arg0, arg1, arg2, arg3) {
        arg0.initEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0);
    };
    imports.wbg.__wbg_initEvent_88f8e59915551b35 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.initEvent(getStringFromWasm0(arg1, arg2), arg3 !== 0, arg4 !== 0);
    };
    imports.wbg.__wbg_initEvent_d66550da3787d926 = function(arg0, arg1, arg2) {
        arg0.initEvent(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_innerHTML_457ee77b726e21e6 = function(arg0, arg1) {
        const ret = arg1.innerHTML;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_innerHeight_ccac894168ddb23c = function() { return handleError(function (arg0) {
        const ret = arg0.innerHeight;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_innerText_f0031d4a341b201e = function(arg0, arg1) {
        const ret = arg1.innerText;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_innerWidth_5a44c76afe8ca065 = function() { return handleError(function (arg0) {
        const ret = arg0.innerWidth;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_inputEncoding_82821e98423c04d8 = function(arg0, arg1) {
        const ret = arg1.inputEncoding;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_input_3384c65027982b74 = function() {
        const ret = RegExp.input;
        return ret;
    };
    imports.wbg.__wbg_insertAdjacentElement_9683fdae4109f9c2 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.insertAdjacentElement(getStringFromWasm0(arg1, arg2), arg3);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_insertAdjacentHTML_00b079f78a367d15 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.insertAdjacentHTML(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_insertAdjacentText_c919207b98901098 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.insertAdjacentText(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_insertBefore_93e77c32aeae9657 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.insertBefore(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_insertDebugMarker_1fb50dd2ccd34cbd = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_insertDebugMarker_5500dcababd3560f = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_insertDebugMarker_bea0161782c1140b = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_insertDebugMarker_c92881bec79e91d2 = function(arg0, arg1, arg2) {
        arg0.insertDebugMarker(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_instanceof_AngleInstancedArrays_8c98433f32836f02 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ANGLE_instanced_arrays;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ArrayBuffer_f3320d2419cd0355 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Array_bc64f5da83077362 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_AsyncIterator_f7db304395820527 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof AsyncIterator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_BigInt64Array_c455a1365d51ff75 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof BigInt64Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_BigInt_1bb24df40548ba29 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof BigInt;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_BigUint64Array_56fa9b8e228919fc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof BigUint64Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Boolean_d11a078d4bb9862d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Boolean;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Collator_a66b8505a0276910 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.Collator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_CompileError_75046db3d5ab5170 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.CompileError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_DataView_f8b1b9b188f4ddfd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof DataView;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_DateTimeFormat_ea5f6919c92e2988 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.DateTimeFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Date_f0e0641c8af8d778 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Date;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Document_90b941f0297459fe = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Document;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Element_6f7ba982258cfc0f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Element;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Error_3443650560328fa9 = function(arg0) {
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
    imports.wbg.__wbg_instanceof_EvalError_0d8dab449ce46da7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EvalError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_EventTarget_01d9d6e619095c3d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EventTarget;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Event_4332a058a036ba20 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Event;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Exception_cf38d4895d54f6c1 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Exception;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtBlendMinmax_c7e2e8b941106b87 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_blend_minmax;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtColorBufferFloat_1f7a7753b5969943 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_color_buffer_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtColorBufferHalfFloat_a90c84f0539daa97 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_color_buffer_half_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtDisjointTimerQuery_790ccb8271493090 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_disjoint_timer_query;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtFragDepth_874aa3ef8bdcf5fe = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_frag_depth;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtSRgb_b8d419911d5af6a8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_sRGB;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtShaderTextureLod_a82f0bed6e65b1c0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_shader_texture_lod;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ExtTextureFilterAnisotropic_a54b4de7366d834a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof EXT_texture_filter_anisotropic;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Float32Array_7490f9a92186e1f0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Float32Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Float64Array_9fefccd7bfa2fefe = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Float64Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Function_cb4bf9f70c667635 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Function;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Generator_1fcde9417835c19b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Generator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_5ee55035f1bd5734 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
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
    imports.wbg.__wbg_instanceof_Global_a68a5e384f30c7e3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_f064e1ca90140d20 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Global_fb07a06f4c6f25b9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Global;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuAdapterInfo_c6e8c00b594e70e7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUAdapterInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuAdapter_5e451ad6596e2784 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUAdapter;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupDescriptor_eec1d44483d10745 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupEntry_5a9697425fe0c002 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupEntry;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupLayoutDescriptor_f632b258979dcd69 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupLayoutDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupLayoutEntry_052e93d01d80c2ee = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupLayoutEntry;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroupLayout_5051657bd4477832 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroupLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBindGroup_6b4015142d9e1041 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBindGroup;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBlendComponent_6580c1b4600dfd53 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBlendComponent;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBlendState_bf5f123194cb69a9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBlendState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBufferBindingLayout_4addc0cac133a256 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBufferBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBufferBinding_1aa8fd1c41def7e1 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBufferBinding;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBufferDescriptor_3e369b648106dca6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBufferDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuBuffer_5889c893d926800d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCanvasConfiguration_dd396d0dd0af02ca = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCanvasConfiguration;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCanvasContext_f70ee27f49f4f884 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCanvasContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCanvasToneMapping_35fbea8ba8d3e419 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCanvasToneMapping;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuColorDict_fadf0f3bbc66c714 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUColorDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuColorTargetState_9527434f17bf7bc3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUColorTargetState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandBufferDescriptor_e417a14f9dda90e8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandBufferDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandBuffer_d4fedf416489a948 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandEncoderDescriptor_c9c2eabbbaaea2e8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandEncoderDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCommandEncoder_956eb2a51c569b4b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCommandEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCompilationInfo_e35cb4c30f87ace7 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCompilationInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCompilationMessage_7bfcafed12b5831e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCompilationMessage;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePassDescriptor_79c10a7da08eab52 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePassDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePassEncoder_c0a7e4836eaeb7c3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePassEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePassTimestampWrites_f8ef9c136f91d9d1 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePassTimestampWrites;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePipelineDescriptor_a2ce460f65a113bb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePipelineDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuComputePipeline_c56d4b82b263876d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUComputePipeline;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCopyExternalImageDestInfo_4466e0cf72efbfee = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCopyExternalImageDestInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuCopyExternalImageSourceInfo_2163fcbccb7df0cd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUCopyExternalImageSourceInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDepthStencilState_0c14b5e32512fa46 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDepthStencilState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDeviceDescriptor_b38050c9aaebf098 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDeviceDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDeviceLostInfo_2060b770b1a9a12f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDeviceLostInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuDevice_820609a3fc537cb8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUDevice;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuError_b93ab5003b85be02 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExtent3dDict_e0d5f40f3afa440e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExtent3DDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExternalTextureBindingLayout_0b5db07b2d5dde7e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExternalTextureBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExternalTextureDescriptor_313c5a095beee133 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExternalTextureDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuExternalTexture_0568fe9b9abb0f33 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUExternalTexture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuFragmentState_4725993520249b90 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUFragmentState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuMultisampleState_3f7273072af6fd93 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUMultisampleState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuObjectDescriptorBase_e4dca24cca2e8921 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUObjectDescriptorBase;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuOrigin2dDict_c2930b0b4c6f830d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUOrigin2DDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuOrigin3dDict_a3efb7ffb07fad81 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUOrigin3DDict;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuOutOfMemoryError_d312fd1714771dbd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUOutOfMemoryError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPipelineDescriptorBase_074a92a27d1da068 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPipelineDescriptorBase;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPipelineLayoutDescriptor_45bb8acf37993896 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPipelineLayoutDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPipelineLayout_ce856a4030259fa1 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPipelineLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuPrimitiveState_ecad27eeabe51fe3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUPrimitiveState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuProgrammableStage_1ed84654c43491fd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUProgrammableStage;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQuerySetDescriptor_5a3f6d3dab7d020b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQuerySetDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQuerySet_e4a6939a45ace707 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQuerySet;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQueueDescriptor_62c37446654feb9c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQueueDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuQueue_3bde50d41ed141f4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUQueue;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundleDescriptor_75a8dae0d9acb727 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundleDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundleEncoderDescriptor_bb49d2d5c9d880b6 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundleEncoderDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundleEncoder_0b2b0862fe1d5e72 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundleEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderBundle_edd4b341e166cf2b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderBundle;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassColorAttachment_ff6fff208ea74458 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassColorAttachment;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassDepthStencilAttachment_3d9eacd4ebe38f9a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassDepthStencilAttachment;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassDescriptor_de8dd252fbf14023 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassEncoder_c0b8f8b20017f56d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassEncoder;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPassTimestampWrites_8633ef575d3e33cd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPassTimestampWrites;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPipelineDescriptor_c3c5bc2cdb5233a8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPipelineDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRenderPipeline_646b659d2fb6f567 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURenderPipeline;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuRequestAdapterOptions_375201e745fd88b2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPURequestAdapterOptions;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSamplerBindingLayout_1b476fd11f4de117 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSamplerBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSamplerDescriptor_9b2fa0d0b2001382 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSamplerDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSampler_54fe6f16fa4a0d7d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSampler;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuShaderModuleDescriptor_e3729fd8faa0e43c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUShaderModuleDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuShaderModule_68ac3e8d3479dc98 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUShaderModule;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuStencilFaceState_a1ef79e697111e20 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUStencilFaceState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuStorageTextureBindingLayout_ab19205bda0b365c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUStorageTextureBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSupportedFeatures_8b8783a63a267b22 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSupportedFeatures;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuSupportedLimits_3f5671163e291e60 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUSupportedLimits;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexelCopyBufferInfo_adb690e4f65a9274 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexelCopyBufferInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexelCopyBufferLayout_fb57792ee467b231 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexelCopyBufferLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexelCopyTextureInfo_f2ca691bcf08be91 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexelCopyTextureInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureBindingLayout_9932d643f721137d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureBindingLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureDescriptor_77d4f12b0835d1b8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureViewDescriptor_493b0641222f758c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureViewDescriptor;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTextureView_a8c8f5b5081e4f4e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTextureView;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuTexture_347b7230ba1b895d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUTexture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuUncapturedErrorEventInit_d58797f902115aee = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUUncapturedErrorEventInit;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuUncapturedErrorEvent_6f8f2f2411ff8d56 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUUncapturedErrorEvent;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuValidationError_eb3c494ad7b55611 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUValidationError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuVertexAttribute_87cbfa385b6a6089 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUVertexAttribute;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuVertexBufferLayout_16f05cdf9369443f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUVertexBufferLayout;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_GpuVertexState_0b10daf68e0731b3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPUVertexState;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Gpu_2aae1d7b7b7c81cc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof GPU;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlCanvasElement_c4251b1b6a15edcc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLCanvasElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlElement_20a3acb594113d73 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlImageElement_5b634ec1c6908255 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLImageElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlMediaElement_c85a6abd824f9a89 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLMediaElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_HtmlVideoElement_b0f5fce5d4711d23 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof HTMLVideoElement;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ImageBitmap_e44697c70dffc0fe = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ImageBitmap;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ImageData_c304f52e881f7462 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ImageData;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Instance_dbd8170de6773ed3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Instance;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Int16Array_17e87443fed46889 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Int16Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Int32Array_b6281022039fba32 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Int32Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Int8Array_4dc5dad0a77f497a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Int8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_IteratorNext_d5d9bc74e7ee5639 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof IteratorNext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Iterator_2a1a23a546a59b24 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Iterator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_JsClosure_3403a3bc4748ae00 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof JsClosure;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_JsString_4d9e1638e0c4ec5b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof String;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_LinkError_4d5f8d7185d3350f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.LinkError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Map_084be8da74364158 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Map;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_MaybeIterator_7f9ae1944c9c1c8c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof MaybeIterator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Memory_a361de6f661b44e2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Memory;
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
    imports.wbg.__wbg_instanceof_Module_d37a279bc9a18feb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Module;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_NavigatorWithGpu_74288f526759575b = function(arg0) {
        let result;
        try {
            result = arg0 instanceof NavigatorWithGpu;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Navigator_35475bd0eba0a6f7 = function(arg0) {
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
    imports.wbg.__wbg_instanceof_NodeList_ba98d0c8847af78f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof NodeList;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Node_8af87d5d16d153d3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Node;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_NumberFormat_6f3d6f1542d81690 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.NumberFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Number_4c04781e40fa6c66 = function(arg0) {
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
    imports.wbg.__wbg_instanceof_Object_577e21051f7bcb79 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Object;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesElementIndexUint_a03945372ba33ab2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_element_index_uint;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesStandardDerivatives_35491680c257522e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_standard_derivatives;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureFloatLinear_56b5085a7cff0411 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_float_linear;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureFloat_da117ff729092840 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureHalfFloatLinear_f149e84cebff9862 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_half_float_linear;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesTextureHalfFloat_ce51d708aabb84f2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_texture_half_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OesVertexArrayObject_62879fcfef733bd0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OES_vertex_array_object;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OffscreenCanvas_8fb961f5ea27473f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OffscreenCanvas;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_OvrMultiview2_77e5595321c90d6d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof OVR_multiview2;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PerformanceEntry_d94846fc9ab92aba = function(arg0) {
        let result;
        try {
            result = arg0 instanceof PerformanceEntry;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PerformanceMark_b3f7de86c2d6965d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof PerformanceMark;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PerformanceMeasure_bfb891726f90f343 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof PerformanceMeasure;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Performance_da835352e1f7d1fd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Performance;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_PluralRules_805183904286aae8 = function(arg0) {
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
    imports.wbg.__wbg_instanceof_Promise_eca6c43a2610558d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Promise;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Proxy_3587d3fc1749504d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Proxy;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RangeError_bb8e95a126d56175 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof RangeError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_ReferenceError_ca84ad5fb564ed87 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof ReferenceError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RegExp_d8d73cd24acfb939 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof RegExp;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RelativeTimeFormat_c7e56f6f55e48cc0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Intl.RelativeTimeFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_RuntimeError_84e1ea85dcd5c435 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.RuntimeError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Set_6e1b27892cbb9e75 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Set;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_SharedArrayBuffer_475ce53dfbad0eea = function(arg0) {
        let result;
        try {
            result = arg0 instanceof SharedArrayBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Symbol_2a4d27e0aac13129 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Symbol;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_SyntaxError_2f359042fe413cc5 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof SyntaxError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Table_b6578721c6242aeb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Table;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Tag_18b644dbc43991d0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebAssembly.Tag;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_TypeError_a8dd4256f9b539c8 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof TypeError;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint16Array_aa795df42b2567a9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint16Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint32Array_0e3c035c6ed948e0 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint32Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8Array_da54ccc9d3e09434 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8Array;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Uint8ClampedArray_616c2fcbe0d3b925 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Uint8ClampedArray;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_UriError_690f0cf9139b9b7c = function(arg0) {
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
    imports.wbg.__wbg_instanceof_VideoFrame_8901c2a01e6038fc = function(arg0) {
        let result;
        try {
            result = arg0 instanceof VideoFrame;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WeakMap_14a2ead90a2d6aeb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WeakMap;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WeakRef_e93812f82eff3a01 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WeakRef;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WeakSet_fe154993e21ee40f = function(arg0) {
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
    imports.wbg.__wbg_instanceof_WebGl2RenderingContext_121e4c8c95b128ef = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGL2RenderingContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlActiveInfo_66b0cba2ff119e1a = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLActiveInfo;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlBuffer_dcb1dca1559ffbad = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLBuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlFramebuffer_c98d5f9d8cd3e137 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLFramebuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlProgram_c7b18af203d4f4ff = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLProgram;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlQuery_05353ce922b543d1 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLQuery;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlRenderbuffer_08b3749d0b086ddd = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLRenderbuffer;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlRenderingContext_f2a36a2d31de185f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLRenderingContext;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlSampler_844a3be4a37fdb8e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLSampler;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlShaderPrecisionFormat_3fc870629ca18532 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLShaderPrecisionFormat;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlShader_f7a71ebd20b87098 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLShader;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlSync_8ac5c0d4ccdda94c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLSync;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlTexture_6721defaa4c9b814 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLTexture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlTransformFeedback_dda422999c7b48b9 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLTransformFeedback;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlUniformLocation_acf3d7b3e0780b4d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLUniformLocation;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebGlVertexArrayObject_ba3b0d23bf8d6e52 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WebGLVertexArrayObject;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglColorBufferFloat_cbc7ecac7e3d1d7e = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_color_buffer_float;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureAstc_a8873fbd61f61b2c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_astc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureEtc1_0efa29ecf574dcd4 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_etc1;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureEtc_c756ff02b44cfacb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_etc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTexturePvrtc_465bf3f1008f5f46 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_pvrtc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureS3tcSrgb_1f1d1d38f00e9759 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_s3tc_srgb;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglCompressedTextureS3tc_9698a14b6bd6a159 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_compressed_texture_s3tc;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDebugRendererInfo_4c78d0209f359326 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_debug_renderer_info;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDebugShaders_b7df5f11d2d7f46f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_debug_shaders;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDepthTexture_07ba3cd25177852c = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_depth_texture;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglDrawBuffers_1a0331f3ce495ad3 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_draw_buffers;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WebglLoseContext_57b3ee3c5428ef0f = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WEBGL_lose_context;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WgslLanguageFeatures_c44bf286c65449a2 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WGSLLanguageFeatures;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Window_b5cf7783caa68180 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Window;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WorkerGlobalScope_9a3411db21c65a54 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WorkerGlobalScope;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WorkerNavigator_505a6b29d10124cb = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WorkerNavigator;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_WorkerOptions_e005293546b2475d = function(arg0) {
        let result;
        try {
            result = arg0 instanceof WorkerOptions;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instanceof_Worker_7de3bf8f8a2cfd65 = function(arg0) {
        let result;
        try {
            result = arg0 instanceof Worker;
        } catch (_) {
            result = false;
        }
        const ret = result;
        return ret;
    };
    imports.wbg.__wbg_instantiateStreaming_9782cce49becd91e = function(arg0, arg1) {
        const ret = WebAssembly.instantiateStreaming(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_instantiate_2f0c60e7b54a5652 = function(arg0, arg1) {
        const ret = WebAssembly.instantiate(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_instantiate_416f99daa0f3d8aa = function(arg0, arg1, arg2) {
        const ret = WebAssembly.instantiate(getArrayU8FromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_invalidateFramebuffer_e2d4d1747d73b885 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.invalidateFramebuffer(arg1 >>> 0, arg2);
    }, arguments) };
    imports.wbg.__wbg_invalidateSubFramebuffer_ad37b80b8cfe3aba = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.invalidateSubFramebuffer(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_isArray_51fd9e6422c0a395 = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_isArray_ca6bc609f742df3f = function(arg0) {
        const ret = Array.isArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_isBuffer_065e50f58471f7db = function(arg0, arg1) {
        const ret = arg0.isBuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isBuffer_5f434ea6de97acae = function(arg0, arg1) {
        const ret = arg0.isBuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isConcatSpreadable_7e753e2129aae126 = function() {
        const ret = Symbol.isConcatSpreadable;
        return ret;
    };
    imports.wbg.__wbg_isConnected_60493c62296f6c41 = function(arg0) {
        const ret = arg0.isConnected;
        return ret;
    };
    imports.wbg.__wbg_isContentEditable_a3f5573498d12d82 = function(arg0) {
        const ret = arg0.isContentEditable;
        return ret;
    };
    imports.wbg.__wbg_isContextLost_bda293babfe7540f = function(arg0) {
        const ret = arg0.isContextLost();
        return ret;
    };
    imports.wbg.__wbg_isContextLost_e513daf0f26291e2 = function(arg0) {
        const ret = arg0.isContextLost();
        return ret;
    };
    imports.wbg.__wbg_isDefaultNamespace_bba7fa020f4b1016 = function(arg0, arg1, arg2) {
        const ret = arg0.isDefaultNamespace(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_isEnabled_ea0ac35bbd3c6dc6 = function(arg0, arg1) {
        const ret = arg0.isEnabled(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_isEnabled_f6041ed2a34288ab = function(arg0, arg1) {
        const ret = arg0.isEnabled(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_isEqualNode_be1f027241c602a1 = function(arg0, arg1) {
        const ret = arg0.isEqualNode(arg1);
        return ret;
    };
    imports.wbg.__wbg_isExtensible_9ce12d4c977153f6 = function(arg0) {
        const ret = Object.isExtensible(arg0);
        return ret;
    };
    imports.wbg.__wbg_isExtensible_bc5b2a77b1a61259 = function() { return handleError(function (arg0) {
        const ret = Reflect.isExtensible(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_isFallbackAdapter_37d8e5911c549dbb = function(arg0) {
        const ret = arg0.isFallbackAdapter;
        return ret;
    };
    imports.wbg.__wbg_isFinite_46248aaba7ada44b = function(arg0) {
        const ret = isFinite(arg0);
        return ret;
    };
    imports.wbg.__wbg_isFinite_b4d688d979f4ded8 = function(arg0) {
        const ret = Number.isFinite(arg0);
        return ret;
    };
    imports.wbg.__wbg_isFramebuffer_43c441639ec92bf9 = function(arg0, arg1) {
        const ret = arg0.isFramebuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isFramebuffer_752483d263024e8b = function(arg0, arg1) {
        const ret = arg0.isFramebuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isFrozen_1b9e12538bb0a855 = function(arg0) {
        const ret = Object.isFrozen(arg0);
        return ret;
    };
    imports.wbg.__wbg_isInteger_1a9fc85b8a5261b3 = function(arg0) {
        const ret = Number.isInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_isLockFree_e8263340c3f20188 = function(arg0) {
        const ret = Atomics.isLockFree(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_isMap_c5625bb1b03a1a33 = function(arg0) {
        const ret = arg0.isMap;
        return ret;
    };
    imports.wbg.__wbg_isNaN_0189721e91e21762 = function(arg0) {
        const ret = Number.isNaN(arg0);
        return ret;
    };
    imports.wbg.__wbg_isProgram_46286f8903198c67 = function(arg0, arg1) {
        const ret = arg0.isProgram(arg1);
        return ret;
    };
    imports.wbg.__wbg_isProgram_be15f2cf645cdca9 = function(arg0, arg1) {
        const ret = arg0.isProgram(arg1);
        return ret;
    };
    imports.wbg.__wbg_isPrototypeOf_b26f3400883db33b = function(arg0, arg1) {
        const ret = arg0.isPrototypeOf(arg1);
        return ret;
    };
    imports.wbg.__wbg_isQueryEXT_b68ef7616656e712 = function(arg0, arg1) {
        const ret = arg0.isQueryEXT(arg1);
        return ret;
    };
    imports.wbg.__wbg_isQuery_a53cc7dfe5184244 = function(arg0, arg1) {
        const ret = arg0.isQuery(arg1);
        return ret;
    };
    imports.wbg.__wbg_isRenderbuffer_a958189565898bda = function(arg0, arg1) {
        const ret = arg0.isRenderbuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isRenderbuffer_cdaa2d8d8e32a882 = function(arg0, arg1) {
        const ret = arg0.isRenderbuffer(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSafeInteger_ae7d3f054d55fa16 = function(arg0) {
        const ret = Number.isSafeInteger(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSameNode_ed1798a12828051a = function(arg0, arg1) {
        const ret = arg0.isSameNode(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSampler_5af3dcf5cf9381d0 = function(arg0, arg1) {
        const ret = arg0.isSampler(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSealed_2643bffb094aacc5 = function(arg0) {
        const ret = Object.isSealed(arg0);
        return ret;
    };
    imports.wbg.__wbg_isSecureContext_0defe0b227a0ff2a = function(arg0) {
        const ret = arg0.isSecureContext;
        return ret;
    };
    imports.wbg.__wbg_isSecureContext_44d0338c33cb6e1b = function(arg0) {
        const ret = arg0.isSecureContext;
        return ret;
    };
    imports.wbg.__wbg_isShader_0bf4cf80bb8f0721 = function(arg0, arg1) {
        const ret = arg0.isShader(arg1);
        return ret;
    };
    imports.wbg.__wbg_isShader_3b56f2841af26200 = function(arg0, arg1) {
        const ret = arg0.isShader(arg1);
        return ret;
    };
    imports.wbg.__wbg_isSync_7dc28181255ab2fc = function(arg0, arg1) {
        const ret = arg0.isSync(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTexture_08d68b5942f3d1a9 = function(arg0, arg1) {
        const ret = arg0.isTexture(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTexture_573fe698c95c99ce = function(arg0, arg1) {
        const ret = arg0.isTexture(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTransformFeedback_805e302d154bb384 = function(arg0, arg1) {
        const ret = arg0.isTransformFeedback(arg1);
        return ret;
    };
    imports.wbg.__wbg_isTrusted_6faecd8e1923022c = function(arg0) {
        const ret = arg0.isTrusted;
        return ret;
    };
    imports.wbg.__wbg_isVertexArrayOES_b1082aa5aa5f5048 = function(arg0, arg1) {
        const ret = arg0.isVertexArrayOES(arg1);
        return ret;
    };
    imports.wbg.__wbg_isVertexArray_191fd11a9e077d76 = function(arg0, arg1) {
        const ret = arg0.isVertexArray(arg1);
        return ret;
    };
    imports.wbg.__wbg_isView_2e9b6a517702053f = function(arg0) {
        const ret = ArrayBuffer.isView(arg0);
        return ret;
    };
    imports.wbg.__wbg_is_049831a9f4bcaa50 = function(arg0, arg1) {
        const ret = arg0.is(arg1);
        return ret;
    };
    imports.wbg.__wbg_is_928aa29d71e75457 = function(arg0, arg1) {
        const ret = Object.is(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_item_dee347a1a2592eee = function(arg0, arg1) {
        const ret = arg0.item(arg1 >>> 0);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_iterator_27b7c8b35ab3e86b = function() {
        const ret = Symbol.iterator;
        return ret;
    };
    imports.wbg.__wbg_join_4d2db8157f73972b = function(arg0, arg1, arg2) {
        const ret = arg0.join(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_keyFor_c34b506c6c9f231c = function(arg0) {
        const ret = Symbol.keyFor(arg0);
        return ret;
    };
    imports.wbg.__wbg_keys_159e11357769fe48 = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_4287ca40a4ce9897 = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_46dfa1e3da1a2acd = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_af2028954708892b = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_d1ba01b4cb9a491e = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_d45c2c5020bed0bf = function(arg0) {
        const ret = arg0.keys();
        return ret;
    };
    imports.wbg.__wbg_keys_f5c6002ff150fc6c = function(arg0) {
        const ret = Object.keys(arg0);
        return ret;
    };
    imports.wbg.__wbg_label_0588830de9284e11 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_069fae31b0bde91e = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_0b09f87095a50913 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_12ebbd8b71fdf8ec = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_16400b92340d20e4 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_191d06a17ee9f970 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_24aeeef2f2e00a08 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_2614586c2bc205f0 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_2c4b5b9dc0907ab7 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_42b2dcb1c59115bc = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_593e99b0af07ca5e = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_668f51ad4d026b60 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_8296b38115112ca4 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_8350d2a9dd838181 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_98d7cf1596d192cf = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_9beb644df6327cff = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_bf762fb29fcff50b = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_d00a9c10db4bbac3 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_edea394a98551811 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_label_fc175340fdf10715 = function(arg0, arg1) {
        const ret = arg1.label;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lang_03d426f63fdf6ebd = function(arg0, arg1) {
        const ret = arg1.lang;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_language_5e1bf8ac8df0bc17 = function(arg0, arg1) {
        const ret = arg1.language;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_language_763ea76470ed849b = function(arg0, arg1) {
        const ret = arg1.language;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_languages_52c35e4abda3d8fa = function(arg0) {
        const ret = arg0.languages;
        return ret;
    };
    imports.wbg.__wbg_languages_e235de351d6dd1f5 = function(arg0) {
        const ret = arg0.languages;
        return ret;
    };
    imports.wbg.__wbg_lastChild_5f9368824ffac3e6 = function(arg0) {
        const ret = arg0.lastChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_lastElementChild_6b90fe10adf639a2 = function(arg0) {
        const ret = arg0.lastElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_lastElementChild_91acf44ffa0c6307 = function(arg0) {
        const ret = arg0.lastElementChild;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_lastIndexOf_495498cda4983a2a = function(arg0, arg1, arg2) {
        const ret = arg0.lastIndexOf(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_lastIndexOf_d410187da4eb8d22 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.lastIndexOf(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_lastMatch_13c0d2cef71ccc7c = function() {
        const ret = RegExp.lastMatch;
        return ret;
    };
    imports.wbg.__wbg_lastModified_770109823dce3b65 = function(arg0, arg1) {
        const ret = arg1.lastModified;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lastParen_599e968326451256 = function() {
        const ret = RegExp.lastParen;
        return ret;
    };
    imports.wbg.__wbg_lastStyleSheetSet_e26c1c1c080d7d7d = function(arg0, arg1) {
        const ret = arg1.lastStyleSheetSet;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_last_index_5722b4b6d0772105 = function(arg0) {
        const ret = arg0.lastIndex;
        return ret;
    };
    imports.wbg.__wbg_leftContext_46649f74b59888b3 = function() {
        const ret = RegExp.leftContext;
        return ret;
    };
    imports.wbg.__wbg_length_1f83b8e5895c84aa = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_22ac23eaec9d8053 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_3a9ca660d3d3391b = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_406f6daaaa453057 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_497fc8f401ac8b1c = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_57dc93a70c136058 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_5ddf940f73bb2581 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_662d9b4b881f3a67 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_775fa2b385ced3da = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_86ce4877baf913bb = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_89c3414ed7f0594d = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_9b7368e374b28279 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_ab53989976907f11 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_b2fe2857226439bf = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_bd124cfd1a9444fe = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_c698df2a0c392c1b = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_d45040a40c570362 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_length_e141626168e09114 = function(arg0) {
        const ret = arg0.length;
        return ret;
    };
    imports.wbg.__wbg_limits_22116faf3a912173 = function(arg0) {
        const ret = arg0.limits;
        return ret;
    };
    imports.wbg.__wbg_limits_b79b8275a12805b2 = function(arg0) {
        const ret = arg0.limits;
        return ret;
    };
    imports.wbg.__wbg_lineNum_af0d101326ae3311 = function(arg0) {
        const ret = arg0.lineNum;
        return ret;
    };
    imports.wbg.__wbg_linePos_e811c185c5633973 = function(arg0) {
        const ret = arg0.linePos;
        return ret;
    };
    imports.wbg.__wbg_lineWidth_2ce7a7ca8c2d17f9 = function(arg0, arg1) {
        arg0.lineWidth(arg1);
    };
    imports.wbg.__wbg_lineWidth_7e18edf5fbc01680 = function(arg0, arg1) {
        arg0.lineWidth(arg1);
    };
    imports.wbg.__wbg_linkProgram_2f770464e69099dc = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_linkProgram_93f76a2f5030041e = function(arg0, arg1) {
        arg0.linkProgram(arg1);
    };
    imports.wbg.__wbg_load_1ba71f5222ab765b = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.load(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_load_5f9457688beae045 = function(arg0) {
        arg0.load();
    };
    imports.wbg.__wbg_load_f1dd26e734971d92 = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.load(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_localName_6efc895340e89349 = function(arg0, arg1) {
        const ret = arg1.localName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_localeCompare_d6c739f71fa07a32 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.localeCompare(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_log10_cd9f9ce074d24b64 = function(arg0) {
        const ret = Math.log10(arg0);
        return ret;
    };
    imports.wbg.__wbg_log1p_4ba2b08181d2c86d = function(arg0) {
        const ret = Math.log1p(arg0);
        return ret;
    };
    imports.wbg.__wbg_log2_e5e71a3bc52f7840 = function(arg0) {
        const ret = Math.log2(arg0);
        return ret;
    };
    imports.wbg.__wbg_log_1b98eb7752bbcf77 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.log(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_log_1d990106d99dacb7 = function(arg0) {
        console.log(arg0);
    };
    imports.wbg.__wbg_log_3f650af133a6de58 = function(arg0) {
        console.log(...arg0);
    };
    imports.wbg.__wbg_log_741b44203808fdb2 = function() {
        console.log();
    };
    imports.wbg.__wbg_log_7873751ee863b313 = function(arg0) {
        const ret = Math.log(arg0);
        return ret;
    };
    imports.wbg.__wbg_log_8fc303e5980de10d = function(arg0, arg1, arg2, arg3, arg4) {
        console.log(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_log_cc180cb3c26220cd = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.log(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_log_f504e71a5e0fa9df = function(arg0, arg1, arg2) {
        console.log(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_log_f614673762e98966 = function(arg0, arg1, arg2, arg3) {
        console.log(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_log_fd6486c6d5396ce5 = function(arg0, arg1) {
        console.log(arg0, arg1);
    };
    imports.wbg.__wbg_longDesc_c88b341812e701d4 = function(arg0, arg1) {
        const ret = arg1.longDesc;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lookupNamespaceURI_3f216278e24506c0 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.lookupNamespaceURI(arg2 === 0 ? undefined : getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_lookupPrefix_a2eb4e78be0ec0f5 = function(arg0, arg1, arg2, arg3) {
        const ret = arg1.lookupPrefix(arg2 === 0 ? undefined : getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_loop_313c8bdbbb6398c5 = function(arg0) {
        const ret = arg0.loop;
        return ret;
    };
    imports.wbg.__wbg_loseContext_fea7f7cca6e3b3c8 = function(arg0) {
        arg0.loseContext();
    };
    imports.wbg.__wbg_lost_127bd218dad158f4 = function(arg0) {
        const ret = arg0.lost;
        return ret;
    };
    imports.wbg.__wbg_makeXRCompatible_2511bbef7ffd4f24 = function(arg0) {
        const ret = arg0.makeXRCompatible();
        return ret;
    };
    imports.wbg.__wbg_makeXRCompatible_d649b55530f29ae7 = function(arg0) {
        const ret = arg0.makeXRCompatible();
        return ret;
    };
    imports.wbg.__wbg_mapAsync_2dba5c7b48d2e598 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_65f65fd4273a69fe = function(arg0, arg1, arg2) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_73ae74b5be22d52b = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_8ec77858206af365 = function(arg0, arg1) {
        const ret = arg0.mapAsync(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_a655898fd407c884 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2, arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_b7001cb694042399 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2 >>> 0, arg3);
        return ret;
    };
    imports.wbg.__wbg_mapAsync_cdcbd351f09b9d5c = function(arg0, arg1, arg2) {
        const ret = arg0.mapAsync(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_mapState_803802dfe76fc300 = function(arg0) {
        const ret = arg0.mapState;
        return (__wbindgen_enum_GpuBufferMapState.indexOf(ret) + 1 || 4) - 1;
    };
    imports.wbg.__wbg_map_f89410bddd6b589c = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__he2a42892531dc1dc(a, state0.b, arg0, arg1, arg2);
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
    imports.wbg.__wbg_mark_a29da841f410751d = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.mark(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_matchAll_bb00d2bc3a85f20b = function(arg0, arg1) {
        const ret = arg0.matchAll(arg1);
        return ret;
    };
    imports.wbg.__wbg_match_61dcfb860f3d39d2 = function() {
        const ret = Symbol.match;
        return ret;
    };
    imports.wbg.__wbg_match_b243ef6c2e9e79be = function(arg0, arg1) {
        const ret = arg0.match(arg1);
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_matches_a2997f291724f864 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.matches(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_maxBindGroupsPlusVertexBuffers_e76bc64f8d203d89 = function(arg0) {
        const ret = arg0.maxBindGroupsPlusVertexBuffers;
        return ret;
    };
    imports.wbg.__wbg_maxBindGroups_af2c64a371bc64b2 = function(arg0) {
        const ret = arg0.maxBindGroups;
        return ret;
    };
    imports.wbg.__wbg_maxBindingsPerBindGroup_430f6510523172d9 = function(arg0) {
        const ret = arg0.maxBindingsPerBindGroup;
        return ret;
    };
    imports.wbg.__wbg_maxBufferSize_68b45c1b69c22207 = function(arg0) {
        const ret = arg0.maxBufferSize;
        return ret;
    };
    imports.wbg.__wbg_maxColorAttachmentBytesPerSample_cbfce6f5737b4853 = function(arg0) {
        const ret = arg0.maxColorAttachmentBytesPerSample;
        return ret;
    };
    imports.wbg.__wbg_maxColorAttachments_70e7c33a58d9fc56 = function(arg0) {
        const ret = arg0.maxColorAttachments;
        return ret;
    };
    imports.wbg.__wbg_maxComputeInvocationsPerWorkgroup_4ad21bf35b7bd17f = function(arg0) {
        const ret = arg0.maxComputeInvocationsPerWorkgroup;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupSizeX_854c87a3ea2e5a00 = function(arg0) {
        const ret = arg0.maxComputeWorkgroupSizeX;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupSizeY_965ebcb7fee4acf5 = function(arg0) {
        const ret = arg0.maxComputeWorkgroupSizeY;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupSizeZ_3bf468106936874c = function(arg0) {
        const ret = arg0.maxComputeWorkgroupSizeZ;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupStorageSize_b9cab4f75b0f03e3 = function(arg0) {
        const ret = arg0.maxComputeWorkgroupStorageSize;
        return ret;
    };
    imports.wbg.__wbg_maxComputeWorkgroupsPerDimension_f4664066d76015da = function(arg0) {
        const ret = arg0.maxComputeWorkgroupsPerDimension;
        return ret;
    };
    imports.wbg.__wbg_maxDynamicStorageBuffersPerPipelineLayout_6b7faf56a6e328ad = function(arg0) {
        const ret = arg0.maxDynamicStorageBuffersPerPipelineLayout;
        return ret;
    };
    imports.wbg.__wbg_maxDynamicUniformBuffersPerPipelineLayout_22a38cc27e2f4626 = function(arg0) {
        const ret = arg0.maxDynamicUniformBuffersPerPipelineLayout;
        return ret;
    };
    imports.wbg.__wbg_maxInterStageShaderVariables_127db93acaa32f72 = function(arg0) {
        const ret = arg0.maxInterStageShaderVariables;
        return ret;
    };
    imports.wbg.__wbg_maxSampledTexturesPerShaderStage_97c70c39fb197a2b = function(arg0) {
        const ret = arg0.maxSampledTexturesPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxSamplersPerShaderStage_a148c7e536a3807c = function(arg0) {
        const ret = arg0.maxSamplersPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxStorageBufferBindingSize_bfaa9c302ad157e3 = function(arg0) {
        const ret = arg0.maxStorageBufferBindingSize;
        return ret;
    };
    imports.wbg.__wbg_maxStorageBuffersPerShaderStage_463d04005d78f248 = function(arg0) {
        const ret = arg0.maxStorageBuffersPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxStorageTexturesPerShaderStage_3fe774bbe6ad1371 = function(arg0) {
        const ret = arg0.maxStorageTexturesPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxTextureArrayLayers_6b1a7b0b3b4c0556 = function(arg0) {
        const ret = arg0.maxTextureArrayLayers;
        return ret;
    };
    imports.wbg.__wbg_maxTextureDimension1D_e79117695a706815 = function(arg0) {
        const ret = arg0.maxTextureDimension1D;
        return ret;
    };
    imports.wbg.__wbg_maxTextureDimension2D_cbb3e7343bea93d1 = function(arg0) {
        const ret = arg0.maxTextureDimension2D;
        return ret;
    };
    imports.wbg.__wbg_maxTextureDimension3D_7ac996fb8fe18286 = function(arg0) {
        const ret = arg0.maxTextureDimension3D;
        return ret;
    };
    imports.wbg.__wbg_maxTouchPoints_3f3b749b8cc72f93 = function(arg0) {
        const ret = arg0.maxTouchPoints;
        return ret;
    };
    imports.wbg.__wbg_maxUniformBufferBindingSize_22c4f55b73d306cf = function(arg0) {
        const ret = arg0.maxUniformBufferBindingSize;
        return ret;
    };
    imports.wbg.__wbg_maxUniformBuffersPerShaderStage_65e2b2eaf78ef4e1 = function(arg0) {
        const ret = arg0.maxUniformBuffersPerShaderStage;
        return ret;
    };
    imports.wbg.__wbg_maxVertexAttributes_a6c97c2dc4a8d443 = function(arg0) {
        const ret = arg0.maxVertexAttributes;
        return ret;
    };
    imports.wbg.__wbg_maxVertexBufferArrayStride_305ba73c4de05f82 = function(arg0) {
        const ret = arg0.maxVertexBufferArrayStride;
        return ret;
    };
    imports.wbg.__wbg_maxVertexBuffers_df4a4911d2c540d8 = function(arg0) {
        const ret = arg0.maxVertexBuffers;
        return ret;
    };
    imports.wbg.__wbg_max_be78bf0299098b71 = function(arg0, arg1) {
        const ret = Math.max(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_measureUserAgentSpecificMemory_f6f585e6e0638a94 = function(arg0) {
        const ret = arg0.measureUserAgentSpecificMemory();
        return ret;
    };
    imports.wbg.__wbg_measure_76755ead0d3bef85 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.measure(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_measure_c6bcdebd8dc0f935 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.measure(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_measure_df32c55595e33009 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.measure(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_message_0305fa7903f4b3d9 = function(arg0) {
        const ret = arg0.message;
        return ret;
    };
    imports.wbg.__wbg_message_64a68fb62f768d57 = function(arg0, arg1) {
        const ret = arg1.message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_message_7bd11486f13d13ab = function(arg0, arg1) {
        const ret = arg1.message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_message_ed58662d040ec0c0 = function(arg0, arg1) {
        const ret = arg1.message;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_messages_d64e6440cff409b3 = function(arg0) {
        const ret = arg0.messages;
        return ret;
    };
    imports.wbg.__wbg_minStorageBufferOffsetAlignment_12d731adbf75fd21 = function(arg0) {
        const ret = arg0.minStorageBufferOffsetAlignment;
        return ret;
    };
    imports.wbg.__wbg_minUniformBufferOffsetAlignment_2a0a0d2e84c280a7 = function(arg0) {
        const ret = arg0.minUniformBufferOffsetAlignment;
        return ret;
    };
    imports.wbg.__wbg_min_9b1caa42b49fa53f = function(arg0, arg1) {
        const ret = Math.min(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_mipLevelCount_535dcf6f4579bd84 = function(arg0) {
        const ret = arg0.mipLevelCount;
        return ret;
    };
    imports.wbg.__wbg_moveBy_3f47cbe3887e8ea9 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.moveBy(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_moveTo_0ace97dcfa922523 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.moveTo(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = arg0.msCrypto;
        return ret;
    };
    imports.wbg.__wbg_multiline_ba4e82b50ce84789 = function(arg0) {
        const ret = arg0.multiline;
        return ret;
    };
    imports.wbg.__wbg_muted_7239ae32097bedce = function(arg0) {
        const ret = arg0.muted;
        return ret;
    };
    imports.wbg.__wbg_name_39dabfd8b7bdb9a1 = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_name_617ef43152f70193 = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_name_6d8c704cecb9e350 = function(arg0) {
        const ret = arg0.name;
        return ret;
    };
    imports.wbg.__wbg_name_928c719c305dfa00 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_name_aa59efb6c802253b = function(arg0, arg1) {
        const ret = arg1.name;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_name_f33243968228ce95 = function(arg0) {
        const ret = arg0.name;
        return ret;
    };
    imports.wbg.__wbg_namespaceURI_effb932197476a78 = function(arg0, arg1) {
        const ret = arg1.namespaceURI;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_naturalHeight_e5febdb1901d3680 = function(arg0) {
        const ret = arg0.naturalHeight;
        return ret;
    };
    imports.wbg.__wbg_naturalWidth_69d8692132b04c44 = function(arg0) {
        const ret = arg0.naturalWidth;
        return ret;
    };
    imports.wbg.__wbg_navigator_11b7299bb7886507 = function(arg0) {
        const ret = arg0.navigator;
        return ret;
    };
    imports.wbg.__wbg_navigator_b49edef831236138 = function(arg0) {
        const ret = arg0.navigator;
        return ret;
    };
    imports.wbg.__wbg_networkState_04ccf767f4ef8f00 = function(arg0) {
        const ret = arg0.networkState;
        return ret;
    };
    imports.wbg.__wbg_new_0_23cedd11d9b40c9d = function() {
        const ret = new Date();
        return ret;
    };
    imports.wbg.__wbg_new_1633b7ee3feca62e = function(arg0, arg1) {
        const ret = new Intl.Collator(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_1acc79167e62f5df = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Instance(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_1ba21ce319a06297 = function() {
        const ret = new Object();
        return ret;
    };
    imports.wbg.__wbg_new_1dd740897c777b10 = function() { return handleError(function () {
        const ret = new EventTarget();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_23eee00e990dac7f = function(arg0, arg1, arg2) {
        const ret = new DataView(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_25eeefc8de475b52 = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Module(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_25f239778d6112b9 = function() {
        const ret = new Array();
        return ret;
    };
    imports.wbg.__wbg_new_26e42e9b2b085088 = function() { return handleError(function (arg0, arg1) {
        const ret = new GPUValidationError(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_271a0cefca646e6e = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Memory(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_2884ddbcda091bc1 = function() { return handleError(function () {
        const ret = new Image();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_29cb5279fb2c3e58 = function(arg0) {
        const ret = new BigInt64Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_2d0ae6a941316bf7 = function(arg0, arg1) {
        const ret = new WebAssembly.CompileError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_2dd03dbd2a205651 = function(arg0) {
        const ret = new BigUint64Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_354204b1383f9085 = function(arg0) {
        const ret = new Float32Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_4963b80bb3bb4198 = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Table(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_4b52ee9fba352f61 = function(arg0) {
        const ret = new ArrayBuffer(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_50019930efd330be = function() {
        const ret = new WeakMap();
        return ret;
    };
    imports.wbg.__wbg_new_503ad62bdae26fd5 = function() { return handleError(function () {
        const ret = new Document();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_53cb1e86c1ef5d2a = function() { return handleError(function (arg0, arg1) {
        const ret = new Worker(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_5c5413537190bada = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new GPUUncapturedErrorEvent(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_5d6c450557b476e1 = function(arg0, arg1) {
        const ret = new URIError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_622bd6e2dcade71d = function(arg0, arg1) {
        const ret = new Proxy(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_6421f6084cc5bc5a = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_6beb5c37764f0f85 = function(arg0, arg1) {
        const ret = new RangeError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_7041ab116402aa97 = function(arg0) {
        const ret = new Uint32Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_746bb58304020083 = function(arg0) {
        const ret = new Set(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_7600d56046b60e85 = function(arg0, arg1) {
        const ret = new EvalError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_7af2a98f50c48636 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Exception(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_801803c173555604 = function(arg0) {
        const ret = new Float64Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_89a1eb50ac0a4dc9 = function(arg0) {
        const ret = new Int8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return ret;
    };
    imports.wbg.__wbg_new_8da3d5b8221f69e4 = function(arg0, arg1) {
        const ret = new Intl.PluralRules(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_9468dd6e5df427f6 = function() { return handleError(function (arg0, arg1) {
        const ret = new OffscreenCanvas(arg0 >>> 0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_9d9fa786dd2be6c2 = function() { return handleError(function (arg0) {
        const ret = new WebAssembly.Tag(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_9e01c13024d368e9 = function(arg0, arg1, arg2, arg3) {
        const ret = new RegExp(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_new_9e11f96e77a7bbe9 = function(arg0, arg1) {
        const ret = new Intl.NumberFormat(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_9f7fd5c3a6ba7298 = function(arg0) {
        const ret = new Uint16Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_a2dec3f30d22f549 = function(arg0, arg1) {
        const ret = new ReferenceError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_ab1fe2437c86d873 = function(arg0) {
        const ret = new SharedArrayBuffer(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_ab34e90879815ad0 = function(arg0, arg1) {
        const ret = new SyntaxError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_aea230b87a2af81d = function(arg0) {
        const ret = new WeakRef(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_b2db8aa2650f793a = function(arg0) {
        const ret = new Date(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_b546ae120718850e = function() {
        const ret = new Map();
        return ret;
    };
    imports.wbg.__wbg_new_b79a8538f16c557a = function(arg0) {
        const ret = new Number(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_bed8cca41e959008 = function(arg0, arg1) {
        const ret = new WebAssembly.RuntimeError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_c4a0391168da97c5 = function(arg0, arg1) {
        const ret = new Intl.RelativeTimeFormat(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_c6d8d04559477397 = function(arg0) {
        const ret = new Boolean(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_cd2ad937e5dcfefa = function(arg0, arg1) {
        const ret = new TypeError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_cdbb94afc22111ca = function(arg0) {
        const ret = new Int16Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_d5dcb76e4d3c4f9b = function(arg0) {
        const ret = new Uint8ClampedArray(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_dae6641ed727aca2 = function() {
        const ret = new WeakSet();
        return ret;
    };
    imports.wbg.__wbg_new_dc8b69c32b416910 = function(arg0, arg1) {
        const ret = new Intl.DateTimeFormat(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_de1e660b88fc921f = function(arg0) {
        const ret = new Int32Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_new_df1173567d5ff028 = function(arg0, arg1) {
        const ret = new Error(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_e7f89f42ace26553 = function() { return handleError(function (arg0, arg1) {
        const ret = new Event(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_eab411698fd3f6a6 = function() { return handleError(function (arg0, arg1) {
        const ret = new GPUOutOfMemoryError(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_ead2c724e8f45c17 = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Global(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_f290eb540b69213e = function(arg0, arg1) {
        const ret = new WebAssembly.LinkError(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_ff12d2b041fb48f1 = function(arg0, arg1) {
        try {
            var state0 = {a: arg0, b: arg1};
            var cb0 = (arg0, arg1) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h8a611d48544c6801(a, state0.b, arg0, arg1);
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
    imports.wbg.__wbg_new_from_slice_098150f7f9c5954f = function(arg0, arg1) {
        const ret = new Int8Array(getArrayI8FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_38fc2f73c393de5c = function(arg0, arg1) {
        const ret = new BigInt64Array(getArrayI64FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_41e2764a343e3cb1 = function(arg0, arg1) {
        const ret = new Float32Array(getArrayF32FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_4d703bec0a9a4603 = function(arg0, arg1) {
        const ret = new Int16Array(getArrayI16FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_883d10a76ca46292 = function(arg0, arg1) {
        const ret = new BigUint64Array(getArrayU64FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_9a48ef80d2a51f94 = function(arg0, arg1) {
        const ret = new Float64Array(getArrayF64FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_db0691b69e9d3891 = function(arg0, arg1) {
        const ret = new Uint32Array(getArrayU32FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_de10fccb49c7f3c0 = function(arg0, arg1) {
        const ret = new Uint8ClampedArray(getArrayU8FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_e6bd3cfb5a35313d = function(arg0, arg1) {
        const ret = new Int32Array(getArrayI32FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_f9c22b9153b26992 = function(arg0, arg1) {
        const ret = new Uint8Array(getArrayU8FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_slice_fc4260e3a67db282 = function(arg0, arg1) {
        const ret = new Uint16Array(getArrayU16FromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_from_str_03c3bee9306b2c51 = function(arg0, arg1) {
        const ret = new Number(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_no_args_cb138f77cf6151ee = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_new_regexp_2c0750719a12f138 = function(arg0, arg1, arg2) {
        const ret = new RegExp(arg0, getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_new_with_args_df9e7125ffe55248 = function(arg0, arg1, arg2, arg3) {
        const ret = new Function(getStringFromWasm0(arg0, arg1), getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_03acdc6ec0135dfb = function(arg0, arg1) {
        const ret = new Int16Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_096b1c21e12f524b = function(arg0, arg1) {
        const ret = new Uint8ClampedArray(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_3ef7df47b2a15bd6 = function(arg0, arg1) {
        const ret = new Uint8Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_76dfc79435d1bbba = function(arg0, arg1) {
        const ret = new BigInt64Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_78151327fcac9f09 = function(arg0, arg1) {
        const ret = new Int32Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_7f38d9524c99a70d = function(arg0, arg1) {
        const ret = new Uint16Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_a4bde7daf7960cdf = function(arg0, arg1) {
        const ret = new Float32Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_096fb130542e7902 = function(arg0, arg1, arg2) {
        const ret = new Float32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_2ffdc1aac4040edc = function(arg0, arg1, arg2) {
        const ret = new BigInt64Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_3aaeefe67e678a85 = function(arg0, arg1, arg2) {
        const ret = new Int8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_5984b348ea0b840d = function(arg0, arg1, arg2) {
        const ret = new Uint32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_5d94fbe0c48ec773 = function(arg0, arg1, arg2) {
        const ret = new Int16Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_64f401264fcb4b51 = function(arg0, arg1, arg2) {
        const ret = new Int32Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_6b455d0eb9dc9bcd = function(arg0, arg1, arg2) {
        const ret = new BigUint64Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_88b0bdedd5431663 = function(arg0, arg1, arg2) {
        const ret = new Uint16Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_8dd0d918557e2cf3 = function(arg0, arg1, arg2) {
        const ret = new Uint8ClampedArray(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_ba21a8a0eef5e681 = function(arg0, arg1, arg2) {
        const ret = new Float64Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_and_length_d85c3da1fd8df149 = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_b201dd8b4fb5235e = function(arg0, arg1) {
        const ret = new Float64Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_ba3bd4c5d93b3c31 = function(arg0, arg1) {
        const ret = new Uint32Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_c17bd3dfd021a1e6 = function(arg0, arg1) {
        const ret = new BigUint64Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_byte_offset_f3bcd36bcf3a646b = function(arg0, arg1) {
        const ret = new Int8Array(arg0, arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_html_canvas_element_9ab80f70fea7894a = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_html_image_element_cdb2f5e9120ee792 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_html_video_element_c1aae992259be0d9 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_image_bitmap_3cc8f357d3ac1c7f = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_js_u8_clamped_array_11030e46644a1c7d = function() { return handleError(function (arg0, arg1) {
        const ret = new ImageData(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_js_u8_clamped_array_and_sh_596729c386cb2368 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new ImageData(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_length_12c6de4fac33117a = function(arg0) {
        const ret = new Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_1e8603a5c71d4e06 = function(arg0) {
        const ret = new Int32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_202b3db94ba5fc86 = function(arg0) {
        const ret = new Uint32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_2cde45ae0640b2ff = function(arg0) {
        const ret = new Int16Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_30843b434774b4c6 = function(arg0) {
        const ret = new Uint8ClampedArray(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_806b9e5b8290af7c = function(arg0) {
        const ret = new Float64Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_853664433381ca69 = function(arg0) {
        const ret = new BigInt64Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_95ba657dfb7d3dfb = function(arg0) {
        const ret = new Float32Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_9cd56824dee6dc2e = function(arg0) {
        const ret = new Int8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_a8b790683935ce41 = function(arg0) {
        const ret = new BigUint64Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_aa5eaf41d35235e5 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_length_d7142aa2b68069a8 = function(arg0) {
        const ret = new Uint16Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_offscreen_canvas_9d28d61e63a16b0d = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_options_2978557c2c268ef3 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new Worker(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_options_a3c028664b3b12e0 = function(arg0, arg1, arg2) {
        const ret = new Error(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_new_with_options_ff25e8680fbcc17c = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new WebAssembly.Exception(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_shared_array_buffer_f801846979192910 = function(arg0, arg1, arg2) {
        const ret = new DataView(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_new_with_sw_fdb9339ef45ceb4a = function() { return handleError(function (arg0, arg1) {
        const ret = new ImageData(arg0 >>> 0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_u8_clamped_array_and_sh_5ac77cce3f6497ff = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0, arg3 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_u8_clamped_array_e14490b754099e0e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = new ImageData(getClampedArrayU8FromWasm0(arg0, arg1), arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_value_e5fd5d8183f1bb3d = function() { return handleError(function (arg0, arg1) {
        const ret = new WebAssembly.Table(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_video_frame_e5d29f77656d3d99 = function() { return handleError(function (arg0) {
        const ret = new VideoFrame(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_width_1081c1c7df7ba4e5 = function() { return handleError(function (arg0) {
        const ret = new Image(arg0 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_width_and_height_45625ba6608f52c3 = function() { return handleError(function (arg0, arg1) {
        const ret = new Image(arg0 >>> 0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_new_with_year_month_8f1a499194027988 = function(arg0, arg1) {
        const ret = new Date(arg0 >>> 0, arg1);
        return ret;
    };
    imports.wbg.__wbg_new_with_year_month_day_2ce3621d93185809 = function(arg0, arg1, arg2) {
        const ret = new Date(arg0 >>> 0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_new_with_year_month_day_hr_a6cde73225a75b96 = function(arg0, arg1, arg2, arg3) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_new_with_year_month_day_hr_min_c6360e602873c06b = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_new_with_year_month_day_hr_min_sec_b77701fa8c756a9f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3, arg4, arg5);
        return ret;
    };
    imports.wbg.__wbg_new_with_year_month_day_hr_min_sec_milli_506f6c8a3bed68d7 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = new Date(arg0 >>> 0, arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    };
    imports.wbg.__wbg_nextElementSibling_c745ee48314963c0 = function(arg0) {
        const ret = arg0.nextElementSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_nextSibling_5e609f506d0fadd7 = function(arg0) {
        const ret = arg0.nextSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_next_138a17bbf04e926c = function(arg0) {
        const ret = arg0.next;
        return ret;
    };
    imports.wbg.__wbg_next_3cfe5c0fe2a4cc53 = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_b34c09a202bf4424 = function() { return handleError(function (arg0) {
        const ret = arg0.next();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_next_c95302ad7cf549c8 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.next(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_nodeName_856a68a412e98b28 = function(arg0, arg1) {
        const ret = arg1.nodeName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_nodeType_927ceb9308a9be24 = function(arg0) {
        const ret = arg0.nodeType;
        return ret;
    };
    imports.wbg.__wbg_nodeValue_af90103351a89478 = function(arg0, arg1) {
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
    imports.wbg.__wbg_nonce_19978c5114d7fe9d = function(arg0, arg1) {
        const ret = arg1.nonce;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_normalize_b7ce3354a31e652d = function(arg0) {
        arg0.normalize();
    };
    imports.wbg.__wbg_normalize_c11bb62daefbd0f8 = function(arg0, arg1, arg2) {
        const ret = arg0.normalize(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_notify_65c8811cd7c0cdea = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.notify(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_notify_f7e901980222d3e0 = function() { return handleError(function (arg0, arg1) {
        const ret = Atomics.notify(arg0, arg1 >>> 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_now_69d776cd24f5215b = function() {
        const ret = Date.now();
        return ret;
    };
    imports.wbg.__wbg_now_8cf15d6e317793e1 = function(arg0) {
        const ret = arg0.now();
        return ret;
    };
    imports.wbg.__wbg_of_122077a9318f8376 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = Array.of(arg0, arg1, arg2, arg3, arg4);
        return ret;
    };
    imports.wbg.__wbg_of_6505a0eb509da02e = function(arg0) {
        const ret = Array.of(arg0);
        return ret;
    };
    imports.wbg.__wbg_of_7779827fa663eec8 = function(arg0, arg1, arg2) {
        const ret = Array.of(arg0, arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_of_b8cd42ebb79fb759 = function(arg0, arg1) {
        const ret = Array.of(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_of_fdf875aa87d9498c = function(arg0, arg1, arg2, arg3) {
        const ret = Array.of(arg0, arg1, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_offsetHeight_3a0cb1c43babb670 = function(arg0) {
        const ret = arg0.offsetHeight;
        return ret;
    };
    imports.wbg.__wbg_offsetLeft_66880c2dc92d2fd4 = function(arg0) {
        const ret = arg0.offsetLeft;
        return ret;
    };
    imports.wbg.__wbg_offsetParent_f5c9fb900b1944d6 = function(arg0) {
        const ret = arg0.offsetParent;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_offsetTop_cea3f2bb4eff1df7 = function(arg0) {
        const ret = arg0.offsetTop;
        return ret;
    };
    imports.wbg.__wbg_offsetWidth_058fe16c7dd9e9bb = function(arg0) {
        const ret = arg0.offsetWidth;
        return ret;
    };
    imports.wbg.__wbg_offset_8fc070f30491eda8 = function(arg0) {
        const ret = arg0.offset;
        return ret;
    };
    imports.wbg.__wbg_onLine_cef37280741477f2 = function(arg0) {
        const ret = arg0.onLine;
        return ret;
    };
    imports.wbg.__wbg_onLine_eca9032f638e3c21 = function(arg0) {
        const ret = arg0.onLine;
        return ret;
    };
    imports.wbg.__wbg_onSubmittedWorkDone_22f709e16b81d1c2 = function(arg0) {
        const ret = arg0.onSubmittedWorkDone();
        return ret;
    };
    imports.wbg.__wbg_onabort_46a5198c5d3a589e = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onabort_6e07f3f662006057 = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onabort_ca5f0d4c24958825 = function(arg0) {
        const ret = arg0.onabort;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onafterprint_d03e5299ff8792e5 = function(arg0) {
        const ret = arg0.onafterprint;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onafterscriptexecute_d49ca584e9e9f6ba = function(arg0) {
        const ret = arg0.onafterscriptexecute;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_14ef0c4e38693948 = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_79248c2f172f22ce = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationcancel_b4a57d71fbea9229 = function(arg0) {
        const ret = arg0.onanimationcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationend_35b8997e22d5589e = function(arg0) {
        const ret = arg0.onanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationend_b07198ceb4cd7dde = function(arg0) {
        const ret = arg0.onanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationend_dceae849ae4f2960 = function(arg0) {
        const ret = arg0.onanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationiteration_5bc0cc40665cac3e = function(arg0) {
        const ret = arg0.onanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationiteration_850f81a282d34eb8 = function(arg0) {
        const ret = arg0.onanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationiteration_a25f5a6c805bb497 = function(arg0) {
        const ret = arg0.onanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_21db8e3095b12fdc = function(arg0) {
        const ret = arg0.onanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_25b72e6893ca3c58 = function(arg0) {
        const ret = arg0.onanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onanimationstart_fa7f03d6cf195943 = function(arg0) {
        const ret = arg0.onanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onappinstalled_d11c60b3c2a99d80 = function(arg0) {
        const ret = arg0.onappinstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onauxclick_76965d6472f1e870 = function(arg0) {
        const ret = arg0.onauxclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onauxclick_f547a7c380039a9d = function(arg0) {
        const ret = arg0.onauxclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onauxclick_f67ddfcf34a02a82 = function(arg0) {
        const ret = arg0.onauxclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeinput_09e20ce2e849417f = function(arg0) {
        const ret = arg0.onbeforeinput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeinput_26e53a569c6ff9ce = function(arg0) {
        const ret = arg0.onbeforeinput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeinput_98b84c6c9774e7f4 = function(arg0) {
        const ret = arg0.onbeforeinput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeprint_dc2701a8028d540a = function(arg0) {
        const ret = arg0.onbeforeprint;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforescriptexecute_587a161e3bb7db93 = function(arg0) {
        const ret = arg0.onbeforescriptexecute;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_3db715844995bcbc = function(arg0) {
        const ret = arg0.onbeforetoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_50eb46e73878e605 = function(arg0) {
        const ret = arg0.onbeforetoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforetoggle_6a9042b12aebc0b1 = function(arg0) {
        const ret = arg0.onbeforetoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onbeforeunload_97472820166c4df5 = function(arg0) {
        const ret = arg0.onbeforeunload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onblur_bec08ebed3b66d3f = function(arg0) {
        const ret = arg0.onblur;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onblur_d10dbc6deaedf96c = function(arg0) {
        const ret = arg0.onblur;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onblur_d78f85247c08c47a = function(arg0) {
        const ret = arg0.onblur;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_7fb62bc103c0831e = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_a6c2ab58a816a5d4 = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplay_ac2e62c83277d960 = function(arg0) {
        const ret = arg0.oncanplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_45754b978a1f6edf = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_7aa6a3688db1fb13 = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncanplaythrough_972e451546bae17b = function(arg0) {
        const ret = arg0.oncanplaythrough;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_a0716e7811cd3910 = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_c5fc1a7485e4f645 = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onchange_f1389787d10e60a6 = function(arg0) {
        const ret = arg0.onchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclick_8913511552c2b971 = function(arg0) {
        const ret = arg0.onclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclick_ad6e7aa283ef57f4 = function(arg0) {
        const ret = arg0.onclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclick_eaf915d82a772d40 = function(arg0) {
        const ret = arg0.onclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclose_26237edf43590e8c = function(arg0) {
        const ret = arg0.onclose;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclose_833b64bf8a936759 = function(arg0) {
        const ret = arg0.onclose;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onclose_dad55e67c018697f = function(arg0) {
        const ret = arg0.onclose;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_c442b5e3761ee37a = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_def80226760f20a5 = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncontextmenu_e079200195049fab = function(arg0) {
        const ret = arg0.oncontextmenu;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncopy_4352fe71ceb2f9ca = function(arg0) {
        const ret = arg0.oncopy;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncopy_abf45803f72a3de0 = function(arg0) {
        const ret = arg0.oncopy;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncut_6c8f6f4570fbe654 = function(arg0) {
        const ret = arg0.oncut;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oncut_90846caf16a041b9 = function(arg0) {
        const ret = arg0.oncut;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_440405db0dacf152 = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_ba48ad13a0cd739e = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondblclick_d7d14ad9c2d4e242 = function(arg0) {
        const ret = arg0.ondblclick;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_29ca0efce8223290 = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_95d7b492865a3254 = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrag_c1e41cc79996cb83 = function(arg0) {
        const ret = arg0.ondrag;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_05557a83676041dd = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_3b34b176ae6157d6 = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragend_a95e1edbc08ff74d = function(arg0) {
        const ret = arg0.ondragend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_2ef9eba0c332395f = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_a1387d4d65cce537 = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragenter_e63f36af674073e4 = function(arg0) {
        const ret = arg0.ondragenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_bed2b05875c7e605 = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_befbec0985c5ffa3 = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragexit_c3c12cd85f5c027b = function(arg0) {
        const ret = arg0.ondragexit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_45ef2fdada17c96e = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_472c6f7c141aef72 = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragleave_fb0c6ae008bfb822 = function(arg0) {
        const ret = arg0.ondragleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_37af5aa9ee162e2e = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_6961fe20c466bc95 = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragover_cba809d4563a54ba = function(arg0) {
        const ret = arg0.ondragover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_9d75a7dfa917c547 = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_d3a795cd05b134c7 = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondragstart_d6e8343249fdd191 = function(arg0) {
        const ret = arg0.ondragstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_960707d575ae8e5a = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_c39f75a4a59d7d1b = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondrop_d59e925f86207afc = function(arg0) {
        const ret = arg0.ondrop;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_3f8666de7712cf73 = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_72c20f1200e8d824 = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ondurationchange_8882ecdb4fb01a59 = function(arg0) {
        const ret = arg0.ondurationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_1d1bb9262376d597 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_44f7492888303c75 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onemptied_5df3e77f298b2109 = function(arg0) {
        const ret = arg0.onemptied;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onencrypted_30f49116d81d4154 = function(arg0) {
        const ret = arg0.onencrypted;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_1e143621932fa542 = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_aaff9cc209a241ca = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onended_bd7ff7948faf7af2 = function(arg0) {
        const ret = arg0.onended;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onenterpictureinpicture_3309d6f51f34c241 = function(arg0) {
        const ret = arg0.onenterpictureinpicture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_677e4185016f8239 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_7c1e8fafc1b069b6 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_a85d2256cd5f4e95 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_ca345ed056a83e8e = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onerror_cdd3a1c7d1dde569 = function(arg0) {
        const ret = arg0.onerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfocus_24bdafb5c4b421a2 = function(arg0) {
        const ret = arg0.onfocus;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfocus_f49b7732530a84a9 = function(arg0) {
        const ret = arg0.onfocus;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfocus_fc17eae665db976c = function(arg0) {
        const ret = arg0.onfocus;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfullscreenchange_f483ea66f82a18fd = function(arg0) {
        const ret = arg0.onfullscreenchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onfullscreenerror_9bbc63a259989e07 = function(arg0) {
        const ret = arg0.onfullscreenerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongamepadconnected_a63b6e7faba01c5f = function(arg0) {
        const ret = arg0.ongamepadconnected;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongamepaddisconnected_74e5269c110f341e = function(arg0) {
        const ret = arg0.ongamepaddisconnected;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongotpointercapture_408e0f71fb111399 = function(arg0) {
        const ret = arg0.ongotpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongotpointercapture_72e2e0c090554686 = function(arg0) {
        const ret = arg0.ongotpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ongotpointercapture_d48577e7c0c5b4f8 = function(arg0) {
        const ret = arg0.ongotpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onhashchange_80e831da8fd9455b = function(arg0) {
        const ret = arg0.onhashchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninput_2af6ebc7647a44d9 = function(arg0) {
        const ret = arg0.oninput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninput_5f7803b150f9b393 = function(arg0) {
        const ret = arg0.oninput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninput_8f648b93791b77ac = function(arg0) {
        const ret = arg0.oninput;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_36a1be3a62ffa39d = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_4a8e1b580f171261 = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_oninvalid_6b9cd06d02ac5a78 = function(arg0) {
        const ret = arg0.oninvalid;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_765c997806255cd0 = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_8ef9115a56af50e5 = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeydown_db12723348a9885d = function(arg0) {
        const ret = arg0.onkeydown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_07007067ec488919 = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_8cf2a326ff900fd1 = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeypress_8f323e6a914d1eec = function(arg0) {
        const ret = arg0.onkeypress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_26c65f47bf3e529e = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_637aabcfb7356e0d = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onkeyup_a99f973dd317e9a4 = function(arg0) {
        const ret = arg0.onkeyup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlanguagechange_7044eb3c75e35aa6 = function(arg0) {
        const ret = arg0.onlanguagechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onleavepictureinpicture_4268cb313e02d9d3 = function(arg0) {
        const ret = arg0.onleavepictureinpicture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onload_7b0b94cc93bcb544 = function(arg0) {
        const ret = arg0.onload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onload_954e4ffe2ea15e7d = function(arg0) {
        const ret = arg0.onload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onload_ceed72c6123567d6 = function(arg0) {
        const ret = arg0.onload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadeddata_9dbe3d240f9ecaad = function(arg0) {
        const ret = arg0.onloadeddata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadeddata_d19b9a4c8c590d49 = function(arg0) {
        const ret = arg0.onloadeddata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadeddata_d2bac759ca346780 = function(arg0) {
        const ret = arg0.onloadeddata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_454364dda2369e20 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_cc6b7bd9e8543497 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadedmetadata_d93e799c0408e3d5 = function(arg0) {
        const ret = arg0.onloadedmetadata;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_07d9e508469c2d54 = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_958f4d9449383d12 = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadend_d299d424301560ef = function(arg0) {
        const ret = arg0.onloadend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_7c3d88ca1052314d = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_d8138c56d7f61517 = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onloadstart_ec1c177c4c2c02de = function(arg0) {
        const ret = arg0.onloadstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_6938e54e69c1d3a9 = function(arg0) {
        const ret = arg0.onlostpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_90a4eb69f90daa82 = function(arg0) {
        const ret = arg0.onlostpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onlostpointercapture_cbcc89e87f2ec83b = function(arg0) {
        const ret = arg0.onlostpointercapture;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessage_34deb7aa2583e1fe = function(arg0) {
        const ret = arg0.onmessage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessage_4089e4e3bc614d1c = function(arg0) {
        const ret = arg0.onmessage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessageerror_4498904df608b496 = function(arg0) {
        const ret = arg0.onmessageerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmessageerror_88d801303be4a5af = function(arg0) {
        const ret = arg0.onmessageerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousedown_0e17eb61f0480bf8 = function(arg0) {
        const ret = arg0.onmousedown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousedown_c7e8bbe0c7ced4ae = function(arg0) {
        const ret = arg0.onmousedown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousedown_e84608fb70f56fba = function(arg0) {
        const ret = arg0.onmousedown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_406249c384eecdbc = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_86205fed5dac2278 = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseenter_aedfb0d2e89fe512 = function(arg0) {
        const ret = arg0.onmouseenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_227629cd24ba2a0f = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_9dd9131a84034f51 = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseleave_f2dec26a4c384363 = function(arg0) {
        const ret = arg0.onmouseleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousemove_13f13776ad25b856 = function(arg0) {
        const ret = arg0.onmousemove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousemove_b22c246e3deb66fe = function(arg0) {
        const ret = arg0.onmousemove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmousemove_ef02bad913227d16 = function(arg0) {
        const ret = arg0.onmousemove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseout_515ad051a430a981 = function(arg0) {
        const ret = arg0.onmouseout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseout_597f42672bd82635 = function(arg0) {
        const ret = arg0.onmouseout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseout_ac4dbe0cd2812b02 = function(arg0) {
        const ret = arg0.onmouseout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_00421fe7906b940c = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_0f7e63ca3fc9cbe1 = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseover_27b183733b866dd6 = function(arg0) {
        const ret = arg0.onmouseover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_3797d2bdb85b929b = function(arg0) {
        const ret = arg0.onmouseup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_95d8ab594d034da0 = function(arg0) {
        const ret = arg0.onmouseup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onmouseup_edbab9c5ad8fd023 = function(arg0) {
        const ret = arg0.onmouseup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onoffline_225e1ad3e44b7307 = function(arg0) {
        const ret = arg0.onoffline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onoffline_d4919dd1712de1f9 = function(arg0) {
        const ret = arg0.onoffline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ononline_692109306a55beb4 = function(arg0) {
        const ret = arg0.ononline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ononline_b50b9cac2fd7e1ee = function(arg0) {
        const ret = arg0.ononline;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onorientationchange_04fd8a2de5d1df66 = function(arg0) {
        const ret = arg0.onorientationchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpagehide_a6f91195598b075b = function(arg0) {
        const ret = arg0.onpagehide;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpageshow_c9c7748fc13f7e41 = function(arg0) {
        const ret = arg0.onpageshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpaste_47b37bb12b9cf5d7 = function(arg0) {
        const ret = arg0.onpaste;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpaste_9a81dec2f8351935 = function(arg0) {
        const ret = arg0.onpaste;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_097c601311fffd47 = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_132a2f0bc7108cba = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpause_9d9897b6256b0d16 = function(arg0) {
        const ret = arg0.onpause;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_2affe2d52c1b8b36 = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_52c2ad444047ad55 = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplay_a781aa88e3a97522 = function(arg0) {
        const ret = arg0.onplay;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_0a6e54491b13180e = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_172de0ab26632ae9 = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onplaying_4bb009e7d3463ff5 = function(arg0) {
        const ret = arg0.onplaying;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_4922bacc4de76b3d = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_9158d5f53faf7bd2 = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointercancel_bdd28b3acdce11e8 = function(arg0) {
        const ret = arg0.onpointercancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_5b5c1566333a5fe5 = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_a4ebcbe8fd696ac7 = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerdown_d28d5821ad5928e3 = function(arg0) {
        const ret = arg0.onpointerdown;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_88586e2fe15a222e = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_88960870ebdf8d06 = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerenter_b853d128e1a85565 = function(arg0) {
        const ret = arg0.onpointerenter;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_630fb20d47ddad16 = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_70bae40250c18995 = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerleave_a435988a0745e114 = function(arg0) {
        const ret = arg0.onpointerleave;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerlockchange_67cc9c0596d45e2d = function(arg0) {
        const ret = arg0.onpointerlockchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerlockerror_0194ff69fa82b482 = function(arg0) {
        const ret = arg0.onpointerlockerror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_10b28947207ff8bb = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_d27428310066e655 = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointermove_f0484aadc04521d3 = function(arg0) {
        const ret = arg0.onpointermove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_be6e21884452230a = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_cbe598a2da546b69 = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerout_f81171052d77ed90 = function(arg0) {
        const ret = arg0.onpointerout;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_4bdd7cf48d2e7af5 = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_532548711e549e09 = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerover_f62c9f5eb1091748 = function(arg0) {
        const ret = arg0.onpointerover;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_2a2bf0d7d5fc2f56 = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_43107041ce2a1ad8 = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpointerup_da8ff0b789b7f72d = function(arg0) {
        const ret = arg0.onpointerup;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onpopstate_aa359937578b93d0 = function(arg0) {
        const ret = arg0.onpopstate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_4c536eb67dee3aaa = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_5035f02df9b499ed = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onprogress_e2a285b060cc743f = function(arg0) {
        const ret = arg0.onprogress;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_3ffcc6620bd3b4bd = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_a8deb7080cecd633 = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onratechange_be7fe335d772777e = function(arg0) {
        const ret = arg0.onratechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreadystatechange_82082e069f18751a = function(arg0) {
        const ret = arg0.onreadystatechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_1106b28e5ceb2bd3 = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_32097ac97e8893da = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onreset_8f3fbd3a1ab8fea1 = function(arg0) {
        const ret = arg0.onreset;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresize_2a5efeea66627191 = function(arg0) {
        const ret = arg0.onresize;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresize_6602d3adb1238b9c = function(arg0) {
        const ret = arg0.onresize;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresize_8fb379f833beea32 = function(arg0) {
        const ret = arg0.onresize;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onresourcetimingbufferfull_4c906db615604e0e = function(arg0) {
        const ret = arg0.onresourcetimingbufferfull;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onscroll_001517e82badb60d = function(arg0) {
        const ret = arg0.onscroll;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onscroll_3e2c6739b55551af = function(arg0) {
        const ret = arg0.onscroll;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onscroll_b82133189dca91c4 = function(arg0) {
        const ret = arg0.onscroll;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_9b1223b7ad7dabe2 = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_a65412a8e5666863 = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeked_ec681df6e3beb0f6 = function(arg0) {
        const ret = arg0.onseeked;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeking_14a7654c9a55c536 = function(arg0) {
        const ret = arg0.onseeking;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeking_47ec53e511d56c6c = function(arg0) {
        const ret = arg0.onseeking;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onseeking_f755d209976d2759 = function(arg0) {
        const ret = arg0.onseeking;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselect_3a8365248b28ba5a = function(arg0) {
        const ret = arg0.onselect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselect_620535bbbd8b8cb4 = function(arg0) {
        const ret = arg0.onselect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselect_f6b9a1431ce431eb = function(arg0) {
        const ret = arg0.onselect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectionchange_0e1d0a9967044bef = function(arg0) {
        const ret = arg0.onselectionchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_2998d1221f87b6fa = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_410a26e63045daf5 = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onselectstart_44449c90285328e6 = function(arg0) {
        const ret = arg0.onselectstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_8582e93e8978c102 = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_8b5876f23f8796b0 = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onshow_c835a60c52256553 = function(arg0) {
        const ret = arg0.onshow;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_843063c067391a16 = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_990724d4c1501b43 = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstalled_ca27e752a351ec0c = function(arg0) {
        const ret = arg0.onstalled;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onstorage_e05e2b9477d3775d = function(arg0) {
        const ret = arg0.onstorage;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsubmit_1c6478898c003514 = function(arg0) {
        const ret = arg0.onsubmit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsubmit_8b2859d085b3db6b = function(arg0) {
        const ret = arg0.onsubmit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsubmit_edeb92f7907b9cc2 = function(arg0) {
        const ret = arg0.onsubmit;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsuspend_0ec23a90d14997ea = function(arg0) {
        const ret = arg0.onsuspend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsuspend_a7f0787f086161ae = function(arg0) {
        const ret = arg0.onsuspend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onsuspend_bbd51efce1e6548b = function(arg0) {
        const ret = arg0.onsuspend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_0663fe5df1790a38 = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_0f07a649850715e6 = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontimeupdate_2fa923481db2d809 = function(arg0) {
        const ret = arg0.ontimeupdate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_35a627991a6dcb8d = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_69223b1de285c155 = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontoggle_6e8f8ed966da6519 = function(arg0) {
        const ret = arg0.ontoggle;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchcancel_11525b80c9435238 = function(arg0) {
        const ret = arg0.ontouchcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchcancel_3c41fe417736520c = function(arg0) {
        const ret = arg0.ontouchcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchcancel_64d9b5ce711ec28e = function(arg0) {
        const ret = arg0.ontouchcancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchend_712bd997e621fafe = function(arg0) {
        const ret = arg0.ontouchend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchend_92715ac733dab82e = function(arg0) {
        const ret = arg0.ontouchend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchend_9b95b728bd90774f = function(arg0) {
        const ret = arg0.ontouchend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_93bff14eedeed036 = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_9422a5825b2d4ec0 = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchmove_de43c300ed06a8ee = function(arg0) {
        const ret = arg0.ontouchmove;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_40ef0829d8a5ab84 = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_494d0cca2474af1e = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontouchstart_bc549ec7f1c2e481 = function(arg0) {
        const ret = arg0.ontouchstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitioncancel_787a01c39a052031 = function(arg0) {
        const ret = arg0.ontransitioncancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitioncancel_df96774b824be458 = function(arg0) {
        const ret = arg0.ontransitioncancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitioncancel_e013601902cd37ec = function(arg0) {
        const ret = arg0.ontransitioncancel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionend_1e3a0a4a4a38343f = function(arg0) {
        const ret = arg0.ontransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionend_41cd7b0c5dadb9d7 = function(arg0) {
        const ret = arg0.ontransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionend_c146a6c5b9ec545d = function(arg0) {
        const ret = arg0.ontransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_7cc5d22819e53923 = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_dba2d8159547aae7 = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionrun_e71edcd859d7db10 = function(arg0) {
        const ret = arg0.ontransitionrun;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_34d13d0cacd93a07 = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_79f94179b543586a = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_ontransitionstart_f720fa5fb1e95aaf = function(arg0) {
        const ret = arg0.ontransitionstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onuncapturederror_eca3c8a7e3f98459 = function(arg0) {
        const ret = arg0.onuncapturederror;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onunload_ae04a996d04290a4 = function(arg0) {
        const ret = arg0.onunload;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvisibilitychange_54e8c99380f80518 = function(arg0) {
        const ret = arg0.onvisibilitychange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_447a1bc0b1b468b3 = function(arg0) {
        const ret = arg0.onvolumechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_aa8bc0cef0feebc0 = function(arg0) {
        const ret = arg0.onvolumechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvolumechange_b5bd86822068cfe5 = function(arg0) {
        const ret = arg0.onvolumechange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplayactivate_df8475dfa65beff4 = function(arg0) {
        const ret = arg0.onvrdisplayactivate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplayconnect_9e721f7bf3b619cb = function(arg0) {
        const ret = arg0.onvrdisplayconnect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplaydeactivate_394979dd23c15334 = function(arg0) {
        const ret = arg0.onvrdisplaydeactivate;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplaydisconnect_5131c685329a47fb = function(arg0) {
        const ret = arg0.onvrdisplaydisconnect;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onvrdisplaypresentchange_766cd4784e32e354 = function(arg0) {
        const ret = arg0.onvrdisplaypresentchange;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaiting_4ad69e1c292e3582 = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaiting_b0f00fcafe399c9f = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaiting_b6a47143b94767a0 = function(arg0) {
        const ret = arg0.onwaiting;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwaitingforkey_f68c1cc706ef0267 = function(arg0) {
        const ret = arg0.onwaitingforkey;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_4b628ba4cb973bdb = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_a0ea32da0bd32992 = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationend_d421892de61b8fb4 = function(arg0) {
        const ret = arg0.onwebkitanimationend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_88a34fab25ee9368 = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_aa0e360f5116ce34 = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationiteration_ca591c98d28982e8 = function(arg0) {
        const ret = arg0.onwebkitanimationiteration;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_42da59f1d583782f = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_ea6f6d7d3aa4780a = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkitanimationstart_f78a62c41ffc3fa2 = function(arg0) {
        const ret = arg0.onwebkitanimationstart;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkittransitionend_a93f4fba98c24bb2 = function(arg0) {
        const ret = arg0.onwebkittransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkittransitionend_b9f684f7d8c28877 = function(arg0) {
        const ret = arg0.onwebkittransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwebkittransitionend_e518225aaee8bdc9 = function(arg0) {
        const ret = arg0.onwebkittransitionend;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwheel_5213f49bd3a6ee77 = function(arg0) {
        const ret = arg0.onwheel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwheel_a2b2f3d1264089d2 = function(arg0) {
        const ret = arg0.onwheel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_onwheel_a9b8459d4c514873 = function(arg0) {
        const ret = arg0.onwheel;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_open_1611d5d1a9d8cf79 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_open_c565053c17d497bd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_open_e7b00f5ff5f666bf = function() { return handleError(function (arg0) {
        const ret = arg0.open();
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_open_f26497a0710faf9f = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.open(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_opener_722ad9ee4c357714 = function() { return handleError(function (arg0) {
        const ret = arg0.opener;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_or_084c48c23f1c39d7 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.or(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_or_eb11de0669782b52 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.or(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_orientation_0dacf9d2ea25f94c = function(arg0) {
        const ret = arg0.orientation;
        return ret;
    };
    imports.wbg.__wbg_origin_0d95b1c91fce4900 = function(arg0, arg1) {
        const ret = arg1.origin;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_origin_2a897ca90400363e = function(arg0, arg1) {
        const ret = arg1.origin;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_outerHTML_b7785cc998856712 = function(arg0, arg1) {
        const ret = arg1.outerHTML;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_outerHeight_244e127e2d61ce29 = function() { return handleError(function (arg0) {
        const ret = arg0.outerHeight;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_outerWidth_20a6182158f5499b = function() { return handleError(function (arg0) {
        const ret = arg0.outerWidth;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_ownKeys_f06fcde184cdc8e0 = function() { return handleError(function (arg0) {
        const ret = Reflect.ownKeys(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_ownerDocument_b75b31a8bf74b91c = function(arg0) {
        const ret = arg0.ownerDocument;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_padEnd_7340f1331dd20a4f = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.padEnd(arg1 >>> 0, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_padStart_ead87f6feb85e14d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.padStart(arg1 >>> 0, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_pageXOffset_8b78efbc1fc32faa = function() { return handleError(function (arg0) {
        const ret = arg0.pageXOffset;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_pageYOffset_9eef75dc24d3828e = function() { return handleError(function (arg0) {
        const ret = arg0.pageYOffset;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_parentElement_f12dbbdecc1452a6 = function(arg0) {
        const ret = arg0.parentElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_parentNode_6caea653ea9f3e23 = function(arg0) {
        const ret = arg0.parentNode;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_parent_ff835a3fa0928c5c = function() { return handleError(function (arg0) {
        const ret = arg0.parent;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_parseFloat_93527a049b28c949 = function(arg0, arg1) {
        const ret = Number.parseFloat(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_parseFloat_f66db7e6c7110452 = function(arg0, arg1) {
        const ret = parseFloat(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_parseInt_df01be2a52fbf95b = function(arg0, arg1, arg2) {
        const ret = parseInt(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_parseInt_f8e6b19348a91ba6 = function(arg0, arg1, arg2) {
        const ret = Number.parseInt(getStringFromWasm0(arg0, arg1), arg2);
        return ret;
    };
    imports.wbg.__wbg_parse_7ff95c018af680b3 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
            return ret;
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_parse_a09a54cf72639456 = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_parse_c36ca1f93ebbb989 = function(arg0, arg1) {
        const ret = Date.parse(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_pauseTransformFeedback_445e321d0dfbd274 = function(arg0) {
        arg0.pauseTransformFeedback();
    };
    imports.wbg.__wbg_pause_4a5c2e7dfa7a91ab = function() { return handleError(function (arg0) {
        arg0.pause();
    }, arguments) };
    imports.wbg.__wbg_paused_14c04b58aeaa8d78 = function(arg0) {
        const ret = arg0.paused;
        return ret;
    };
    imports.wbg.__wbg_performance_64147f039018735c = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_performance_c77a440eff2efd9b = function(arg0) {
        const ret = arg0.performance;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_pictureInPictureElement_cb212a8a9dedd872 = function(arg0) {
        const ret = arg0.pictureInPictureElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_pictureInPictureEnabled_2efd3be2843d1257 = function(arg0) {
        const ret = arg0.pictureInPictureEnabled;
        return ret;
    };
    imports.wbg.__wbg_pixelStorei_1956db9ae4b22c29 = function(arg0, arg1, arg2) {
        arg0.pixelStorei(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_pixelStorei_5449c87f83f25694 = function(arg0, arg1, arg2) {
        arg0.pixelStorei(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_platform_c478c5c06bf46b4e = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.platform;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_platform_c9dd29375c0e6694 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.platform;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_play_77dfb4164d89facd = function() { return handleError(function (arg0) {
        const ret = arg0.play();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_playbackRate_87cde7af27888b14 = function(arg0) {
        const ret = arg0.playbackRate;
        return ret;
    };
    imports.wbg.__wbg_pointerLockElement_1c7c3bd89946a3e5 = function(arg0) {
        const ret = arg0.pointerLockElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_polygonOffset_7308f17e4b9c9e6f = function(arg0, arg1, arg2) {
        arg0.polygonOffset(arg1, arg2);
    };
    imports.wbg.__wbg_polygonOffset_d405a847eb9279a1 = function(arg0, arg1, arg2) {
        arg0.polygonOffset(arg1, arg2);
    };
    imports.wbg.__wbg_popDebugGroup_28d4c000232e2a7e = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popDebugGroup_8cbc7e350a284684 = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popDebugGroup_a99dbde8ab6bffe0 = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popDebugGroup_aa0a9be849b6d6fa = function(arg0) {
        arg0.popDebugGroup();
    };
    imports.wbg.__wbg_popErrorScope_3620d0770e0c967f = function(arg0) {
        const ret = arg0.popErrorScope();
        return ret;
    };
    imports.wbg.__wbg_pop_36314b6ffb0c313e = function(arg0) {
        const ret = arg0.pop();
        return ret;
    };
    imports.wbg.__wbg_popover_df73aa24a4ff01ed = function(arg0, arg1) {
        const ret = arg1.popover;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_postMessage_07504dbe15265d5c = function() { return handleError(function (arg0, arg1) {
        arg0.postMessage(arg1);
    }, arguments) };
    imports.wbg.__wbg_postMessage_99268fd1b0167c49 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.postMessage(arg1, getStringFromWasm0(arg2, arg3), arg4);
    }, arguments) };
    imports.wbg.__wbg_postMessage_d04ba724b7480859 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.postMessage(arg1, getStringFromWasm0(arg2, arg3));
    }, arguments) };
    imports.wbg.__wbg_postMessage_e0309b53c7ad30e6 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.postMessage(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_poster_093ad7438001b4b3 = function(arg0, arg1) {
        const ret = arg1.poster;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_pow_c00668ebf0216667 = function(arg0, arg1) {
        const ret = Math.pow(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_precision_6137c306ed15186d = function(arg0) {
        const ret = arg0.precision;
        return ret;
    };
    imports.wbg.__wbg_preferredStyleSheetSet_33b9e533befd45ba = function(arg0, arg1) {
        const ret = arg1.preferredStyleSheetSet;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_prefix_78cf3f9059a0b701 = function(arg0, arg1) {
        const ret = arg1.prefix;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_preload_05673da4e53cd648 = function(arg0, arg1) {
        const ret = arg1.preload;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_prepend_0d49141c2ed6b57f = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_11293d09c2c9653f = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_1520432c9fc26fd1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_prepend_2f592a13c7ff8a8a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_prepend_2fe07d522ee79e69 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.prepend(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_prepend_3796bdc6fc66289d = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_prepend_39a23126417c7016 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_prepend_39f88ec9cbe1b70b = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_3c44aa725307a595 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_prepend_4b1fbd8eefbc365b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_prepend_551cf5821f8232b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_prepend_5e49038a15a6622b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_prepend_60956c89e36121ff = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_62b91072a4d25020 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.prepend(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_prepend_785bf6ea7703369a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_prepend_7aa604f54a0c86b3 = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_84426a1a8aa1317c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_prepend_908fcd2d3cd7211a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_prepend_932523ad2d6df41c = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_939f749afeac660d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_prepend_9f5be8567675f57b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_prepend_a099140cd2943151 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.prepend(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_prepend_a4d5397699ef4906 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_prepend_ab79c004564b1208 = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_b07873013913eab2 = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_b0ffbf2d5c886cc4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_prepend_b1266cf5a7232d8e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_prepend_ca231e77a40a73bc = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_prepend_d09f3a6c078c42e0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_prepend_d2d0156af1d06438 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_prepend_d959c6e18eff8f67 = function() { return handleError(function (arg0) {
        arg0.prepend();
    }, arguments) };
    imports.wbg.__wbg_prepend_e0fd7b9f0d843567 = function() { return handleError(function (arg0, arg1) {
        arg0.prepend(...arg1);
    }, arguments) };
    imports.wbg.__wbg_prepend_e87a2c06a79a1c55 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_prepend_f382bdcb2fcc810a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.prepend(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_prepend_f57db585d041c8f8 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_prepend_f57fa27e54ad9ab7 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.prepend(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_preventDefault_e97663aeeb9709d3 = function(arg0) {
        arg0.preventDefault();
    };
    imports.wbg.__wbg_preventExtensions_105a1374c0afc0a6 = function() { return handleError(function (arg0) {
        const ret = Reflect.preventExtensions(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_preventExtensions_b689c4887a3cfe48 = function(arg0) {
        Object.preventExtensions(arg0);
    };
    imports.wbg.__wbg_previousElementSibling_cce44b2f8a221fe7 = function(arg0) {
        const ret = arg0.previousElementSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_previousSibling_a5a490df9c69f756 = function(arg0) {
        const ret = arg0.previousSibling;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_print_963e5b0f7066f481 = function() { return handleError(function (arg0) {
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
    imports.wbg.__wbg_product_06777f58e8632fb8 = function(arg0, arg1) {
        const ret = arg1.product;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_product_0b1e0030dc9f621a = function(arg0, arg1) {
        const ret = arg1.product;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_profileEnd_000e36e0c03e7918 = function(arg0) {
        console.profileEnd(...arg0);
    };
    imports.wbg.__wbg_profileEnd_42ca838851590a06 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.profileEnd(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_profileEnd_75e9946feadeac88 = function(arg0, arg1) {
        console.profileEnd(arg0, arg1);
    };
    imports.wbg.__wbg_profileEnd_7d682e0aa292e8f5 = function(arg0) {
        console.profileEnd(arg0);
    };
    imports.wbg.__wbg_profileEnd_869b37dba96076ad = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.profileEnd(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_profileEnd_ab37dee3ddfa23aa = function() {
        console.profileEnd();
    };
    imports.wbg.__wbg_profileEnd_b296e8d8e474b002 = function(arg0, arg1, arg2, arg3, arg4) {
        console.profileEnd(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_profileEnd_bd977cbd4d9781c6 = function(arg0, arg1, arg2) {
        console.profileEnd(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_profileEnd_cd226edb99670b64 = function(arg0, arg1, arg2, arg3) {
        console.profileEnd(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_profile_160ea089d64793a3 = function(arg0) {
        console.profile(arg0);
    };
    imports.wbg.__wbg_profile_2948c193b2ef107c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.profile(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_profile_413c4e3e10a4b611 = function(arg0, arg1) {
        console.profile(arg0, arg1);
    };
    imports.wbg.__wbg_profile_7f80b0a315ed6878 = function(arg0) {
        console.profile(...arg0);
    };
    imports.wbg.__wbg_profile_cc618e952e42f54a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.profile(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_profile_cf72b014192aac22 = function(arg0, arg1, arg2, arg3, arg4) {
        console.profile(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_profile_e527b9246011ed46 = function(arg0, arg1, arg2) {
        console.profile(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_profile_ea86cb873018ce73 = function(arg0, arg1, arg2, arg3) {
        console.profile(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_profile_f25edd7c0751c8bc = function() {
        console.profile();
    };
    imports.wbg.__wbg_prompt_b86e438661f5cbd1 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.prompt();
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_prompt_ec0bbafe7872c84a = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.prompt(getStringFromWasm0(arg2, arg3));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_prompt_eef86e4cee4596be = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg1.prompt(getStringFromWasm0(arg2, arg3), getStringFromWasm0(arg4, arg5));
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_propertyIsEnumerable_e6ba133dd5eadecb = function(arg0, arg1) {
        const ret = arg0.propertyIsEnumerable(arg1);
        return ret;
    };
    imports.wbg.__wbg_prototypesetcall_18d5cc3d141027e0 = function(arg0, arg1, arg2) {
        Int16Array.prototype.set.call(getArrayI16FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_5f793a5332fa54f7 = function(arg0, arg1, arg2) {
        BigInt64Array.prototype.set.call(getArrayI64FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_6a0ca140cebe5ef8 = function(arg0, arg1, arg2) {
        Uint32Array.prototype.set.call(getArrayU32FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_95556ccd02b0dfb6 = function(arg0, arg1, arg2) {
        Int8Array.prototype.set.call(getArrayI8FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_96cc7097487b926d = function(arg0, arg1, arg2) {
        Float32Array.prototype.set.call(getArrayF32FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_b0bea5f39077cfd3 = function(arg0, arg1, arg2) {
        Uint16Array.prototype.set.call(getArrayU16FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_cee197d609cac5bf = function(arg0, arg1, arg2) {
        BigUint64Array.prototype.set.call(getArrayU64FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_d3c4edbb4ef96ca1 = function(arg0, arg1, arg2) {
        Float64Array.prototype.set.call(getArrayF64FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_d3dc3532c827f7d3 = function(arg0, arg1, arg2) {
        Uint8ClampedArray.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_dd07c344a74d4bfd = function(arg0, arg1, arg2) {
        Int32Array.prototype.set.call(getArrayI32FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_prototypesetcall_dfe9b766cdc1f1fd = function(arg0, arg1, arg2) {
        Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_pushDebugGroup_12529005075afe0c = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushDebugGroup_437d51c0b04945fc = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushDebugGroup_d6bc76dd4fab8d4e = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushDebugGroup_ef8a43f5d1af0d13 = function(arg0, arg1, arg2) {
        arg0.pushDebugGroup(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_pushErrorScope_82cb69cc547ce5fb = function(arg0, arg1) {
        arg0.pushErrorScope(__wbindgen_enum_GpuErrorFilter[arg1]);
    };
    imports.wbg.__wbg_push_7d9be8f38fc13975 = function(arg0, arg1) {
        const ret = arg0.push(arg1);
        return ret;
    };
    imports.wbg.__wbg_queryCounterEXT_ecccc67a3c00d9b2 = function(arg0, arg1, arg2) {
        arg0.queryCounterEXT(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_queryLocalFonts_bb602e188f5e5b8e = function() { return handleError(function (arg0) {
        const ret = arg0.queryLocalFonts();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_querySelectorAll_0f71ea37892a269b = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_querySelectorAll_aa1048eae18f6f1a = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelectorAll(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_querySelector_15a92ce6bed6157d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_querySelector_83602705c2df3db0 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.querySelector(getStringFromWasm0(arg1, arg2));
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_queueMicrotask_548f02f97eae4063 = function(arg0, arg1) {
        arg0.queueMicrotask(arg1);
    };
    imports.wbg.__wbg_queueMicrotask_892c6bd5d40fe78e = function(arg0, arg1) {
        arg0.queueMicrotask(arg1);
    };
    imports.wbg.__wbg_queueMicrotask_9b549dfce8865860 = function(arg0) {
        const ret = arg0.queueMicrotask;
        return ret;
    };
    imports.wbg.__wbg_queueMicrotask_fca69f5bfad613a5 = function(arg0) {
        queueMicrotask(arg0);
    };
    imports.wbg.__wbg_queue_e7ab52ab0880dce9 = function(arg0) {
        const ret = arg0.queue;
        return ret;
    };
    imports.wbg.__wbg_race_cf804f784a97f8db = function(arg0) {
        const ret = Promise.race(arg0);
        return ret;
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_random_cc1f9237d866d212 = function() {
        const ret = Math.random();
        return ret;
    };
    imports.wbg.__wbg_rangeMax_ee63c80a9fb2606d = function(arg0) {
        const ret = arg0.rangeMax;
        return ret;
    };
    imports.wbg.__wbg_rangeMin_199a5b6e3e42eb83 = function(arg0) {
        const ret = arg0.rangeMin;
        return ret;
    };
    imports.wbg.__wbg_raw_103b2709e189dda8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_115041030be342ad = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_4da34912622a7740 = function() { return handleError(function (arg0) {
        const ret = String.raw(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_532ec554e46c7081 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_566b76e93231d7f6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_a5097f521ed3d917 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_b8f90eb8ee3f90fb = function() { return handleError(function (arg0, arg1) {
        const ret = String.raw(arg0, ...arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_d26433f0ab837f5b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_raw_db7f08043458e1ac = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        const ret = String.raw(arg0, getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_readBuffer_bbd823c99c8cb8c2 = function(arg0, arg1) {
        arg0.readBuffer(arg1 >>> 0);
    };
    imports.wbg.__wbg_readPixels_031b1d4c916fc4f9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_23f5b1d416ef849e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7 === 0 ? undefined : getArrayU8FromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_readPixels_250ad1244d364673 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_3288aabda6ab89ff = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_73ed55aa91e2441f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_74b7a8dae620ebe8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_942546c2d625ddd5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7, arg8 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_readPixels_bc06772e95599959 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_readPixels_d139b0a7491b1f87 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, getArrayU8FromWasm0(arg7, arg8), arg9 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_readPixels_d790a7e896cc1467 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7, arg8 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_readPixels_da05c52af5c3e0c1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.readPixels(arg1, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7 === 0 ? undefined : getArrayU8FromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_readyState_3fe3ba6c00504ac1 = function(arg0) {
        const ret = arg0.readyState;
        return ret;
    };
    imports.wbg.__wbg_readyState_d33fa0c28632b63b = function(arg0, arg1) {
        const ret = arg1.readyState;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_reason_92874ec807ec200c = function(arg0) {
        const ret = arg0.reason;
        return (__wbindgen_enum_GpuDeviceLostReason.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_reduceRight_0ad7e4f949042cf8 = function(arg0, arg1, arg2, arg3) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2, arg3) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h20476958fb967b77(a, state0.b, arg0, arg1, arg2, arg3);
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
    imports.wbg.__wbg_reduce_ab7eb75e4e73d4bf = function(arg0, arg1, arg2, arg3) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0, arg1, arg2, arg3) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h20476958fb967b77(a, state0.b, arg0, arg1, arg2, arg3);
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
    imports.wbg.__wbg_referrerPolicy_a7d3a9bf062d5fbf = function(arg0, arg1) {
        const ret = arg1.referrerPolicy;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_referrer_7054a53cec73a860 = function(arg0, arg1) {
        const ret = arg1.referrer;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_registerContentHandler_18dccdbc41e0a68b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.registerContentHandler(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_registerProtocolHandler_89633e43ceddae29 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.registerProtocolHandler(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_reject_e9f21cdd3c968ce3 = function(arg0) {
        const ret = Promise.reject(arg0);
        return ret;
    };
    imports.wbg.__wbg_releaseCapture_64f820b398c18106 = function(arg0) {
        arg0.releaseCapture();
    };
    imports.wbg.__wbg_releaseCapture_8c10d473855389f5 = function(arg0) {
        arg0.releaseCapture();
    };
    imports.wbg.__wbg_releaseEvents_9153175a54ad9a60 = function(arg0) {
        arg0.releaseEvents();
    };
    imports.wbg.__wbg_releasePointerCapture_83b7fe5b3ce3eebb = function() { return handleError(function (arg0, arg1) {
        arg0.releasePointerCapture(arg1);
    }, arguments) };
    imports.wbg.__wbg_removeAttributeNS_a9bb6ce6f5c625ff = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.removeAttributeNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_removeAttribute_96e791ceeb22d591 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.removeAttribute(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_removeChild_e269b93f63c5ba71 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.removeChild(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_removeEventListener_3ff68cd2edbc58d4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3, arg4 !== 0);
    }, arguments) };
    imports.wbg.__wbg_removeEventListener_565e273024b68b75 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.removeEventListener(getStringFromWasm0(arg1, arg2), arg3);
    }, arguments) };
    imports.wbg.__wbg_remove_32f69ffabcbc4072 = function(arg0) {
        arg0.remove();
    };
    imports.wbg.__wbg_renderbufferStorageMultisample_c944aa96428a6ff6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.renderbufferStorageMultisample(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_renderbufferStorage_4ea9706d7f996e6d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
    };
    imports.wbg.__wbg_renderbufferStorage_95fae6488cee51e3 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.renderbufferStorage(arg1 >>> 0, arg2 >>> 0, arg3, arg4);
    };
    imports.wbg.__wbg_repeat_97341e717424810f = function(arg0, arg1) {
        const ret = arg0.repeat(arg1);
        return ret;
    };
    imports.wbg.__wbg_replaceAll_1a2a652919e0c3ad = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replaceAll(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_replaceAll_8cf17c8ddf45f7f2 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replaceAll(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_replaceAll_a475567c5d0b296a = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.replaceAll(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_replaceAll_a8c83599dbf4be77 = function(arg0, arg1, arg2) {
        const ret = arg0.replaceAll(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_replaceChild_d6f78ac48f46aedf = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.replaceChild(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_replaceChildren_099688ac66870c49 = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_0ed1ec5184844e54 = function(arg0, arg1) {
        arg0.replaceChildren(arg1);
    };
    imports.wbg.__wbg_replaceChildren_12b55890add0c021 = function(arg0, arg1, arg2) {
        arg0.replaceChildren(arg1, arg2);
    };
    imports.wbg.__wbg_replaceChildren_164641f4cb35fee7 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_replaceChildren_17e63e9225876c9e = function(arg0, arg1, arg2, arg3) {
        arg0.replaceChildren(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_replaceChildren_1ba5bf3644b3a642 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    };
    imports.wbg.__wbg_replaceChildren_22b3625b38932007 = function(arg0, arg1) {
        arg0.replaceChildren(arg1);
    };
    imports.wbg.__wbg_replaceChildren_28adec482ccadc3a = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_2c3327808b02113a = function(arg0, arg1, arg2) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_replaceChildren_2e0441057951df96 = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_30a9a0e6b5e489ee = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    };
    imports.wbg.__wbg_replaceChildren_311c9b38906f658b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_replaceChildren_36fbb9046e69174e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_replaceChildren_394d68f3a8b13748 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_replaceChildren_46fa1e980e3b5ecb = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_replaceChildren_48b52da54549d66a = function(arg0, arg1, arg2) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_replaceChildren_4a268ead7a4546ad = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_508642ac09e3f845 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_replaceChildren_55d6a279293da428 = function(arg0, arg1, arg2) {
        arg0.replaceChildren(arg1, arg2);
    };
    imports.wbg.__wbg_replaceChildren_65c6d34c3cfa92d3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_replaceChildren_6dd769c37a87b74e = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_7f9d3eeab5d0417d = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    };
    imports.wbg.__wbg_replaceChildren_818b45c3ef3071c1 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    };
    imports.wbg.__wbg_replaceChildren_8221294ea3678b03 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    };
    imports.wbg.__wbg_replaceChildren_884b0e3178c07607 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    };
    imports.wbg.__wbg_replaceChildren_97e1bd438c1fd748 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    };
    imports.wbg.__wbg_replaceChildren_993a477c19678c53 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    };
    imports.wbg.__wbg_replaceChildren_9d24353fcb42eb6d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_replaceChildren_a284ea7c35fa9b0b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_replaceChildren_a78556de7322dcd7 = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_c8d013783933ab81 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.replaceChildren(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    };
    imports.wbg.__wbg_replaceChildren_ca033bfd5d1c5b83 = function(arg0, arg1) {
        arg0.replaceChildren(...arg1);
    };
    imports.wbg.__wbg_replaceChildren_cffbc6809fe06d91 = function(arg0) {
        arg0.replaceChildren();
    };
    imports.wbg.__wbg_replaceChildren_e922b8dbfe68ed8f = function(arg0, arg1, arg2, arg3) {
        arg0.replaceChildren(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_replaceChildren_ea8b653a5f770763 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_replaceChildren_f2289cb66669e979 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.replaceChildren(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_replaceWith_28270b688ad15887 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_39da0ca2237f48dd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_5d206502ace61bb2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_654751501c262938 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.replaceWith(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_6af61147158c690e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_7613dce45c4981cd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_7c9c009da505a696 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.replaceWith(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_7e239589a19fef14 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.replaceWith(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_8c312763cb8f21dd = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.replaceWith(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_923cfb1b2f584408 = function() { return handleError(function (arg0, arg1) {
        arg0.replaceWith(arg1);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_94f0d27efae99c74 = function() { return handleError(function (arg0) {
        arg0.replaceWith();
    }, arguments) };
    imports.wbg.__wbg_replaceWith_a444ea636f160b2d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_add44acd74824b27 = function() { return handleError(function (arg0, arg1) {
        arg0.replaceWith(...arg1);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_b729aa687063e401 = function() { return handleError(function (arg0) {
        arg0.replaceWith();
    }, arguments) };
    imports.wbg.__wbg_replaceWith_beba276dee880d40 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.replaceWith(arg1, arg2, arg3, arg4, arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_c2c44ec2d57d345a = function() { return handleError(function (arg0, arg1) {
        arg0.replaceWith(...arg1);
    }, arguments) };
    imports.wbg.__wbg_replaceWith_dabb8946c52209e4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13, arg14) {
        arg0.replaceWith(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6), getStringFromWasm0(arg7, arg8), getStringFromWasm0(arg9, arg10), getStringFromWasm0(arg11, arg12), getStringFromWasm0(arg13, arg14));
    }, arguments) };
    imports.wbg.__wbg_replaceWith_f01c98b9f7d6bce6 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.replaceWith(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_replace_0932e815cce80e02 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replace(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_replace_1b471971d5e7ccd6 = function(arg0, arg1, arg2) {
        const ret = arg0.replace(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_replace_5dac98c44fd4fdc2 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.replace(arg1, getStringFromWasm0(arg2, arg3));
        return ret;
    };
    imports.wbg.__wbg_replace_c423b029f58ab6ba = function() {
        const ret = Symbol.replace;
        return ret;
    };
    imports.wbg.__wbg_replace_f153ce5110368ce6 = function(arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.replace(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
        return ret;
    };
    imports.wbg.__wbg_requestAdapter_127118e33ef3f15e = function(arg0) {
        const ret = arg0.requestAdapter();
        return ret;
    };
    imports.wbg.__wbg_requestAdapter_eb00393b717ebb9c = function(arg0, arg1) {
        const ret = arg0.requestAdapter(arg1);
        return ret;
    };
    imports.wbg.__wbg_requestAnimationFrame_994dc4ebde22b8d9 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestAnimationFrame(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestDevice_1be6e30ff9d67933 = function(arg0, arg1) {
        const ret = arg0.requestDevice(arg1);
        return ret;
    };
    imports.wbg.__wbg_requestDevice_8bea848eb4a33d74 = function(arg0) {
        const ret = arg0.requestDevice();
        return ret;
    };
    imports.wbg.__wbg_requestFullscreen_0d9f7148d4658c31 = function() { return handleError(function (arg0) {
        arg0.requestFullscreen();
    }, arguments) };
    imports.wbg.__wbg_requestIdleCallback_dedd367f2e61f932 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.requestIdleCallback(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestMIDIAccess_6599bc427a59d43e = function() { return handleError(function (arg0) {
        const ret = arg0.requestMIDIAccess();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_requestMediaKeySystemAccess_5c6b544839b37b29 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.requestMediaKeySystemAccess(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_requestPictureInPicture_68dd4120c2554fb3 = function(arg0) {
        const ret = arg0.requestPictureInPicture();
        return ret;
    };
    imports.wbg.__wbg_requestPointerLock_88b841b7b60ec3d3 = function(arg0) {
        arg0.requestPointerLock();
    };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_resizeBy_3425afa1668d3180 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.resizeBy(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_resizeTo_bb33b680d2914780 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.resizeTo(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_resolveQuerySet_44dddc4a814652f2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.resolveQuerySet(arg1, arg2 >>> 0, arg3 >>> 0, arg4, arg5 >>> 0);
    };
    imports.wbg.__wbg_resolveQuerySet_957ab397a7daab77 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.resolveQuerySet(arg1, arg2 >>> 0, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_resolve_fd5bfbaa4ce36e1e = function(arg0) {
        const ret = Promise.resolve(arg0);
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_1447fd532422bea5 = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_189d546ccdd8fd99 = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_c5df09ec2900085b = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_edbd799a9a04698e = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_resolvedOptions_f4dc210f2977442d = function(arg0) {
        const ret = arg0.resolvedOptions();
        return ret;
    };
    imports.wbg.__wbg_restoreContext_9b32229e69c9584a = function(arg0) {
        arg0.restoreContext();
    };
    imports.wbg.__wbg_resumeTransformFeedback_13103a1f4b81229f = function(arg0) {
        arg0.resumeTransformFeedback();
    };
    imports.wbg.__wbg_return_3941351e2d3eff5c = function(arg0, arg1) {
        const ret = arg0.return(arg1);
        return ret;
    };
    imports.wbg.__wbg_reverse_a180705573801dbd = function(arg0) {
        const ret = arg0.reverse();
        return ret;
    };
    imports.wbg.__wbg_revocable_303e8695bf575e46 = function(arg0, arg1) {
        const ret = Proxy.revocable(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_rightContext_ed2f2b06fb11e1a5 = function() {
        const ret = RegExp.rightContext;
        return ret;
    };
    imports.wbg.__wbg_round_6b299b062730808c = function(arg0) {
        const ret = Math.round(arg0);
        return ret;
    };
    imports.wbg.__wbg_sampleCount_b5e88e92f34065c5 = function(arg0) {
        const ret = arg0.sampleCount;
        return ret;
    };
    imports.wbg.__wbg_sampleCoverage_3d571fcb652b76db = function(arg0, arg1, arg2) {
        arg0.sampleCoverage(arg1, arg2 !== 0);
    };
    imports.wbg.__wbg_sampleCoverage_b25b4fe699d833d9 = function(arg0, arg1, arg2) {
        arg0.sampleCoverage(arg1, arg2 !== 0);
    };
    imports.wbg.__wbg_samplerParameterf_dc4f26238b36d07a = function(arg0, arg1, arg2, arg3) {
        arg0.samplerParameterf(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_samplerParameteri_66d42118f12ed70c = function(arg0, arg1, arg2, arg3) {
        arg0.samplerParameteri(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_scissor_04e903bd18e45083 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.scissor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_scissor_988df87f9cf85e7e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.scissor(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_screenX_5db8cafa552b572c = function() { return handleError(function (arg0) {
        const ret = arg0.screenX;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_screenY_f0ef26b17502a54d = function() { return handleError(function (arg0) {
        const ret = arg0.screenY;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scrollBy_463943935c4143b3 = function(arg0) {
        arg0.scrollBy();
    };
    imports.wbg.__wbg_scrollBy_6f02b98321046eb9 = function(arg0, arg1, arg2) {
        arg0.scrollBy(arg1, arg2);
    };
    imports.wbg.__wbg_scrollBy_9a4d6ec1de96231d = function(arg0, arg1, arg2) {
        arg0.scrollBy(arg1, arg2);
    };
    imports.wbg.__wbg_scrollBy_a3db2ecff0347f48 = function(arg0) {
        arg0.scrollBy();
    };
    imports.wbg.__wbg_scrollHeight_3902413ae40f24a7 = function(arg0) {
        const ret = arg0.scrollHeight;
        return ret;
    };
    imports.wbg.__wbg_scrollHeight_c6d2a14450d78f50 = function(arg0) {
        const ret = arg0.scrollHeight;
        return ret;
    };
    imports.wbg.__wbg_scrollIntoView_0e467b662eec87a8 = function(arg0) {
        arg0.scrollIntoView();
    };
    imports.wbg.__wbg_scrollIntoView_85c5ce295b95a895 = function(arg0, arg1) {
        arg0.scrollIntoView(arg1 !== 0);
    };
    imports.wbg.__wbg_scrollLeft_fd09c4fc9e877b68 = function(arg0) {
        const ret = arg0.scrollLeft;
        return ret;
    };
    imports.wbg.__wbg_scrollTo_3d52b1c3726c41d6 = function(arg0) {
        arg0.scrollTo();
    };
    imports.wbg.__wbg_scrollTo_58387e5b10ab5148 = function(arg0) {
        arg0.scrollTo();
    };
    imports.wbg.__wbg_scrollTo_b26fb7e44bf40dcf = function(arg0, arg1, arg2) {
        arg0.scrollTo(arg1, arg2);
    };
    imports.wbg.__wbg_scrollTo_c18d69ba522ef774 = function(arg0, arg1, arg2) {
        arg0.scrollTo(arg1, arg2);
    };
    imports.wbg.__wbg_scrollTop_76691208c28906d5 = function(arg0) {
        const ret = arg0.scrollTop;
        return ret;
    };
    imports.wbg.__wbg_scrollTop_a9bb1dc2c9c6aed7 = function(arg0) {
        const ret = arg0.scrollTop;
        return ret;
    };
    imports.wbg.__wbg_scrollWidth_1879d4fcf958465f = function(arg0) {
        const ret = arg0.scrollWidth;
        return ret;
    };
    imports.wbg.__wbg_scrollX_1d9327a9ce76af46 = function() { return handleError(function (arg0) {
        const ret = arg0.scrollX;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scrollY_559107419fb2470d = function() { return handleError(function (arg0) {
        const ret = arg0.scrollY;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_scroll_226379157e144623 = function(arg0) {
        arg0.scroll();
    };
    imports.wbg.__wbg_scroll_72b6737c61b2aded = function(arg0) {
        arg0.scroll();
    };
    imports.wbg.__wbg_scroll_b73b2927c4409981 = function(arg0, arg1, arg2) {
        arg0.scroll(arg1, arg2);
    };
    imports.wbg.__wbg_scroll_fc45a5dff78d6853 = function(arg0, arg1, arg2) {
        arg0.scroll(arg1, arg2);
    };
    imports.wbg.__wbg_scrollingElement_8b8cbe35f21394ff = function(arg0) {
        const ret = arg0.scrollingElement;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_seal_46b26e950337e34c = function(arg0) {
        const ret = Object.seal(arg0);
        return ret;
    };
    imports.wbg.__wbg_search_af58e7077fc0f4e0 = function(arg0, arg1) {
        const ret = arg0.search(arg1);
        return ret;
    };
    imports.wbg.__wbg_search_be62aa933c79156b = function() {
        const ret = Symbol.search;
        return ret;
    };
    imports.wbg.__wbg_seekToNextFrame_f3b8ae0311f60656 = function() { return handleError(function (arg0) {
        const ret = arg0.seekToNextFrame();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_seeking_9fec7f6b0e010547 = function(arg0) {
        const ret = arg0.seeking;
        return ret;
    };
    imports.wbg.__wbg_select_1dc0e9210d6be364 = function(arg0, arg1) {
        const ret = arg0.select(arg1);
        return ret;
    };
    imports.wbg.__wbg_selectedStyleSheetSet_456f2c3015819d8a = function(arg0, arg1) {
        const ret = arg1.selectedStyleSheetSet;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_self_5a23feb521074397 = function(arg0) {
        const ret = arg0.self;
        return ret;
    };
    imports.wbg.__wbg_self_68a81b332cc34952 = function(arg0) {
        const ret = arg0.self;
        return ret;
    };
    imports.wbg.__wbg_sendBeacon_1456374f20d5d25c = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_2980281b5376c80f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3 === 0 ? undefined : getArrayU8FromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_b3788a9eeef37ca0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3 === 0 ? undefined : getStringFromWasm0(arg3, arg4));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_e853ae98658c02aa = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sendBeacon_ecf74fc61263f966 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.sendBeacon(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setAttributeNS_02544bed1880f76f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setAttributeNS(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4), getStringFromWasm0(arg5, arg6));
    }, arguments) };
    imports.wbg.__wbg_setAttribute_34747dd193f45828 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.setAttribute(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_0ae63a01a1ed4c73 = function(arg0, arg1, arg2) {
        arg0.setBindGroup(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setBindGroup_166f231915ca093d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_2168cf3dfd4607ae = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_2ce7a8b3807354b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_364f561134e6eca6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_62380492ef6e8d6a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_642c36c7ceaf33ac = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_7f2584d716af3b93 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_8095d262b59ad456 = function(arg0, arg1, arg2, arg3) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setBindGroup_87cc81e3cf317fdb = function(arg0, arg1, arg2, arg3) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setBindGroup_9cfe828fbb0563be = function(arg0, arg1, arg2) {
        arg0.setBindGroup(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setBindGroup_b34a358ce3d07c2c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_b8eae23f36acaf33 = function(arg0, arg1, arg2, arg3) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setBindGroup_cf97b7e05b2a1f2a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.setBindGroup(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_d906e4c5d8533957 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_db09cfa383999eef = function(arg0, arg1, arg2) {
        arg0.setBindGroup(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setBindGroup_edcf81b17f05fbdd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBindGroup_ef246395c092f562 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setBindGroup(arg1 >>> 0, arg2, getArrayU32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_setBlendConstant_241bcdb797da41b3 = function() { return handleError(function (arg0, arg1) {
        arg0.setBlendConstant(arg1);
    }, arguments) };
    imports.wbg.__wbg_setBlendConstant_35937accbe201fdd = function() { return handleError(function (arg0, arg1) {
        arg0.setBlendConstant(arg1);
    }, arguments) };
    imports.wbg.__wbg_setCapture_080cbdb2eb49970d = function(arg0, arg1) {
        arg0.setCapture(arg1 !== 0);
    };
    imports.wbg.__wbg_setCapture_e67788eb30c27110 = function(arg0) {
        arg0.setCapture();
    };
    imports.wbg.__wbg_setDate_cee64d347252dd5a = function(arg0, arg1) {
        const ret = arg0.setDate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setFloat32_256cc8bdcc36fd6f = function(arg0, arg1, arg2) {
        arg0.setFloat32(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setFloat32_d2a99e5151eefafa = function(arg0, arg1, arg2, arg3) {
        arg0.setFloat32(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setFloat64_0b6227e3b64396f9 = function(arg0, arg1, arg2) {
        arg0.setFloat64(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setFloat64_6a8af6f3d0ca543a = function(arg0, arg1, arg2, arg3) {
        arg0.setFloat64(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setFullYear_3c0e915b72833510 = function(arg0, arg1, arg2) {
        const ret = arg0.setFullYear(arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_setFullYear_61b410502f70eb9a = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.setFullYear(arg1 >>> 0, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_setFullYear_e6dbcb54df8c364b = function(arg0, arg1) {
        const ret = arg0.setFullYear(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setHours_5617dae727aa738e = function(arg0, arg1) {
        const ret = arg0.setHours(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setIndexBuffer_0b9ec4ad87c1c285 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_211f213407c01844 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_4a69367b5a2af086 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_5919cd03ae3174ae = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_7a9f2a9e6d99cffb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_8f170cf050304f7a = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_9004a188ad9109bd = function(arg0, arg1, arg2) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2]);
    };
    imports.wbg.__wbg_setIndexBuffer_9ac143c5ae22aaca = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_b77bab8dd2ead847 = function(arg0, arg1, arg2) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2]);
    };
    imports.wbg.__wbg_setIndexBuffer_c7ecba3588b25ce2 = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3);
    };
    imports.wbg.__wbg_setIndexBuffer_db41507e5114fad4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4);
    };
    imports.wbg.__wbg_setIndexBuffer_f9122cc56ab3660b = function(arg0, arg1, arg2, arg3) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3);
    };
    imports.wbg.__wbg_setIndexBuffer_fc60b7c9c86d1953 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setIndexBuffer_fc679ccc0023ca07 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setIndexBuffer(arg1, __wbindgen_enum_GpuIndexFormat[arg2], arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setInt16_c6278c5be41ec660 = function(arg0, arg1, arg2) {
        arg0.setInt16(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setInt16_ea5225220e1f2c14 = function(arg0, arg1, arg2, arg3) {
        arg0.setInt16(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setInt32_2070e5bf49e40e71 = function(arg0, arg1, arg2) {
        arg0.setInt32(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setInt32_7cb8db5725a976b2 = function(arg0, arg1, arg2, arg3) {
        arg0.setInt32(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setInt8_ee004327697e556c = function(arg0, arg1, arg2) {
        arg0.setInt8(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setInterval_0f02db24e2e18e38 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_152ec34a69d6d543 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_166f0840b9fdc7aa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_17a02a4cf333afcb = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setInterval(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_2431efeb0ff343ae = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_300a3d27bbd84681 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_3194e68379fecb66 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_389cc197382c2ac7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_50126577e843eccd = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_50ba5fca37ffc873 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_5501355e732c8412 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_5562af0b6d79f187 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setInterval(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_5b2e382153324b37 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_64238a0f613294af = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6543d5af0139c1ab = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_67df36d8d36ab6a6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6afeb318921b69f4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_6c8bb98772586a44 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_70f443b8c3a5a1f3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_71663bb7dcdcad5c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_72e72e86a9a13325 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_77a204bb4a864b70 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_88be03af09500f73 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_8cec141bcd66ab76 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_8ef4879191dbfe8a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_8fa414371a097fa7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_93be395a0ba57b24 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_97b9dea29fcaa044 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_a1fe81a32c33d5a2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_a344b5bccdd6075a = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setInterval(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_aa62b0e3d96f6622 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_ad4c29edfd464712 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_ae1299eefdebfc1c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_bc8ab9522156583b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setInterval(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_c0b620dabb53927a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_c16135397203cc22 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_d1ebc0c2d2c639a1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_d73822e736fe08a7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_e554642fb765ad65 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setInterval(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setInterval_fe13cb9c0ef7e864 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setInterval(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setMilliseconds_f02579eb07523e54 = function(arg0, arg1) {
        const ret = arg0.setMilliseconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setMinutes_87e24d1c75ec5670 = function(arg0, arg1) {
        const ret = arg0.setMinutes(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setMonth_6c3bcd074dd1ea22 = function(arg0, arg1) {
        const ret = arg0.setMonth(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setPipeline_722d08ecf182158d = function(arg0, arg1) {
        arg0.setPipeline(arg1);
    };
    imports.wbg.__wbg_setPipeline_a1632dc586e06e5a = function(arg0, arg1) {
        arg0.setPipeline(arg1);
    };
    imports.wbg.__wbg_setPipeline_b010841b1ab020c5 = function(arg0, arg1) {
        arg0.setPipeline(arg1);
    };
    imports.wbg.__wbg_setPointerCapture_c611f4bcb7e9081e = function() { return handleError(function (arg0, arg1) {
        arg0.setPointerCapture(arg1);
    }, arguments) };
    imports.wbg.__wbg_setPrototypeOf_69fb56765e148208 = function() { return handleError(function (arg0, arg1) {
        const ret = Reflect.setPrototypeOf(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setPrototypeOf_bbf6a0b0f535855a = function(arg0, arg1) {
        const ret = Object.setPrototypeOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_setResourceTimingBufferSize_27359ac50e0742cd = function(arg0, arg1) {
        arg0.setResourceTimingBufferSize(arg1 >>> 0);
    };
    imports.wbg.__wbg_setScissorRect_48aad86f2b04be65 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setScissorRect(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setSeconds_d404dd74ed0ac2b6 = function(arg0, arg1) {
        const ret = arg0.setSeconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setStencilReference_0193bdfe3e999b05 = function(arg0, arg1) {
        arg0.setStencilReference(arg1 >>> 0);
    };
    imports.wbg.__wbg_setTime_ac1bfb5eccb8c9da = function(arg0, arg1) {
        const ret = arg0.setTime(arg1);
        return ret;
    };
    imports.wbg.__wbg_setTimeout_06477c23d31efef1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_18f1bac8fea88f1e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_2222a1c7cc4f101e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_23c0956a30721dcd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_27a7ab11f476675d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_3aa1145dbf2593b6 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_425032fd8860bd1e = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_53567d1601b73285 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_55c1161ae37a0059 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_5924c77be85c6f3a = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_5bb2667f34791a22 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_5f67034c0c7fafae = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_668853977a04db88 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_67dff22135e36f30 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_7012cd508c5de113 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_70650df9bb181684 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_70d108e97ca2674d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_7352a846f68005e1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_780045617e4bd6d6 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setTimeout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_81895aa1c1822103 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_87ee0ca277ca9292 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_9265130b7f98bc4e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_93e61ca923a29a54 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_94fb1bae34e53e1e = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, ...arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_97b4e036366ccf0b = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.setTimeout(arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_a227405655fa4e1a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_a4f408d45ae9eabc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_a85f323d3229192e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_b129e48abc853f19 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_b1acffa79ffb6ce5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(arg1, arg2, arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_b84f624da076d533 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_c0bf9f45350a3838 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_c2fd4771a6cb3613 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_c53e24ea2d464ba8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_c75fc52bd1ff72c4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_cc5c431dca2b0717 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_cd8aebe4a3452a7f = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.setTimeout(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_de3ae8f89f5ccb8a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, ...arg4);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_e8adb64ea8f23f4e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setTimeout_f029f75628bafaaf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        const ret = arg0.setTimeout(getStringFromWasm0(arg1, arg2), arg3, arg4, arg5, arg6);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_setUTCDate_236618c1da3a5fa6 = function(arg0, arg1) {
        const ret = arg0.setUTCDate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCFullYear_545ce9b9fba501d5 = function(arg0, arg1, arg2) {
        const ret = arg0.setUTCFullYear(arg1 >>> 0, arg2);
        return ret;
    };
    imports.wbg.__wbg_setUTCFullYear_83269156948850f9 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.setUTCFullYear(arg1 >>> 0, arg2, arg3);
        return ret;
    };
    imports.wbg.__wbg_setUTCFullYear_f911445f6a74531d = function(arg0, arg1) {
        const ret = arg0.setUTCFullYear(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCHours_55aa5cb5b3a174ba = function(arg0, arg1) {
        const ret = arg0.setUTCHours(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCMilliseconds_4b0f3197c024c80a = function(arg0, arg1) {
        const ret = arg0.setUTCMilliseconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCMinutes_fa365f21afbacb89 = function(arg0, arg1) {
        const ret = arg0.setUTCMinutes(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCMonth_192013cd12eba52e = function(arg0, arg1) {
        const ret = arg0.setUTCMonth(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUTCSeconds_c313bd882c3c8ab8 = function(arg0, arg1) {
        const ret = arg0.setUTCSeconds(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_setUint16_2d2558414ac25e45 = function(arg0, arg1, arg2) {
        arg0.setUint16(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setUint16_ff3205ca61800a91 = function(arg0, arg1, arg2, arg3) {
        arg0.setUint16(arg1 >>> 0, arg2, arg3 !== 0);
    };
    imports.wbg.__wbg_setUint32_3590d6adecfd0c9a = function(arg0, arg1, arg2, arg3) {
        arg0.setUint32(arg1 >>> 0, arg2 >>> 0, arg3 !== 0);
    };
    imports.wbg.__wbg_setUint32_6ee364ad2096f0ed = function(arg0, arg1, arg2) {
        arg0.setUint32(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_setUint8_71dd48d3e18e4e40 = function(arg0, arg1, arg2) {
        arg0.setUint8(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setVertexBuffer_12163ed66de2b212 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_35c041d09196f1e6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_4220edfe13ed9a05 = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setVertexBuffer_44714230dd55dbce = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_72982a9f7f664d74 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_8d8b92b14eb677f4 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_99d911b379ec0e48 = function(arg0, arg1, arg2) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setVertexBuffer_a5969f9a5a3f46be = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_d5252300ba1323b9 = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_setVertexBuffer_d9998e9f8e810f4d = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_da6ef21c06e9c5ac = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_e7552cab228fc6f3 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3 >>> 0, arg4);
    };
    imports.wbg.__wbg_setVertexBuffer_f209d2bcc82ece37 = function(arg0, arg1, arg2, arg3) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_setVertexBuffer_fcf7d3562ad63bc9 = function(arg0, arg1, arg2) {
        arg0.setVertexBuffer(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_setViewport_bee857cbfc17f5bf = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.setViewport(arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_setVisible_b9334ad3e52253e8 = function(arg0, arg1) {
        arg0.setVisible(arg1 !== 0);
    };
    imports.wbg.__wbg_set_169e13b608078b7b = function(arg0, arg1, arg2) {
        arg0.set(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_170fe24827e1a341 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_22933af9286a43df = function(arg0, arg1, arg2) {
        arg0.set(getArrayF64FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_2a10e588f0f0c26c = function(arg0, arg1, arg2) {
        const ret = arg0.set(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_set_2df67546b69ad950 = function(arg0, arg1, arg2) {
        arg0.set(getArrayU64FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_3f1d0b984ed272ed = function(arg0, arg1, arg2) {
        arg0[arg1] = arg2;
    };
    imports.wbg.__wbg_set_40ef789f46690c0d = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_4308bc4cf8a29876 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Reflect.set(arg0, arg1, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_564e6ccd45f0e738 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.set(arg1 >>> 0, arg2);
    }, arguments) };
    imports.wbg.__wbg_set_63702c1676e5ecb2 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_63f11c2773f72cfb = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_66dfb82844371eef = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_72187f44e9a69526 = function(arg0, arg1, arg2) {
        arg0.set(getArrayI64FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_781438a03c0c3c81 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_7acdca8bc67dfcd5 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_7df433eea03a5c14 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_824b34ded56fa1ac = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_912716e417d2b59f = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_96dda83f4854ef15 = function(arg0, arg1, arg2) {
        arg0.set(getArrayI8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_9c1f546c76458953 = function(arg0, arg1, arg2) {
        arg0.set(getArrayI16FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_a_004bf5b9918b7a9d = function(arg0, arg1) {
        arg0.a = arg1;
    };
    imports.wbg.__wbg_set_abe61c27a3e6772a = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_accessKey_71a7e58a6c22b7a1 = function(arg0, arg1, arg2) {
        arg0.accessKey = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_access_615d472480b556e8 = function(arg0, arg1) {
        arg0.access = __wbindgen_enum_GpuStorageTextureAccess[arg1];
    };
    imports.wbg.__wbg_set_address_mode_u_f8c82bdfe28ff814 = function(arg0, arg1) {
        arg0.addressModeU = __wbindgen_enum_GpuAddressMode[arg1];
    };
    imports.wbg.__wbg_set_address_mode_v_15cc0a4331c8a793 = function(arg0, arg1) {
        arg0.addressModeV = __wbindgen_enum_GpuAddressMode[arg1];
    };
    imports.wbg.__wbg_set_address_mode_w_b3ede4a69eef8df8 = function(arg0, arg1) {
        arg0.addressModeW = __wbindgen_enum_GpuAddressMode[arg1];
    };
    imports.wbg.__wbg_set_adoptedStyleSheets_971d30cec27c6b86 = function(arg0, arg1) {
        arg0.adoptedStyleSheets = arg1;
    };
    imports.wbg.__wbg_set_align_8c27cffcb582112a = function(arg0, arg1, arg2) {
        arg0.align = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_alpha_7c9ec1b9552caf33 = function(arg0, arg1) {
        arg0.alpha = arg1;
    };
    imports.wbg.__wbg_set_alpha_mode_d776091480150822 = function(arg0, arg1) {
        arg0.alphaMode = __wbindgen_enum_GpuCanvasAlphaMode[arg1];
    };
    imports.wbg.__wbg_set_alpha_to_coverage_enabled_97c65e8e0f0f97f0 = function(arg0, arg1) {
        arg0.alphaToCoverageEnabled = arg1 !== 0;
    };
    imports.wbg.__wbg_set_alt_81ce1cda4c400374 = function(arg0, arg1, arg2) {
        arg0.alt = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_array_layer_count_4b8708bd126ac758 = function(arg0, arg1) {
        arg0.arrayLayerCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_array_stride_89addb9ef89545a3 = function(arg0, arg1) {
        arg0.arrayStride = arg1;
    };
    imports.wbg.__wbg_set_aspect_39b1f8b0dd60bb1e = function(arg0, arg1) {
        arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    };
    imports.wbg.__wbg_set_aspect_e672528231f771cb = function(arg0, arg1) {
        arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    };
    imports.wbg.__wbg_set_aspect_f5c27f8e9589644d = function(arg0, arg1) {
        arg0.aspect = __wbindgen_enum_GpuTextureAspect[arg1];
    };
    imports.wbg.__wbg_set_attributes_2ab28c57eed0dc3a = function(arg0, arg1) {
        arg0.attributes = arg1;
    };
    imports.wbg.__wbg_set_autofocus_ae8f5acfea79d602 = function() { return handleError(function (arg0, arg1) {
        arg0.autofocus = arg1 !== 0;
    }, arguments) };
    imports.wbg.__wbg_set_autoplay_22001591eedf4d28 = function(arg0, arg1) {
        arg0.autoplay = arg1 !== 0;
    };
    imports.wbg.__wbg_set_b60c39abacd7be0b = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_b_b2b86286be8253f1 = function(arg0, arg1) {
        arg0.b = arg1;
    };
    imports.wbg.__wbg_set_base_array_layer_a3268c17b424196f = function(arg0, arg1) {
        arg0.baseArrayLayer = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_base_mip_level_7ac60a20e24c81b1 = function(arg0, arg1) {
        arg0.baseMipLevel = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_bb0c6a7fe60d81b5 = function(arg0, arg1, arg2) {
        arg0.set(getArrayU16FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_bc3a432bdcd60886 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_beginning_of_pass_write_index_2de01bde51c7b0c4 = function(arg0, arg1) {
        arg0.beginningOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_beginning_of_pass_write_index_87e36fb6887d3c1c = function(arg0, arg1) {
        arg0.beginningOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_bind_group_layouts_7fedf360e81319eb = function(arg0, arg1) {
        arg0.bindGroupLayouts = arg1;
    };
    imports.wbg.__wbg_set_binding_030f427cbe0e3a55 = function(arg0, arg1) {
        arg0.binding = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_binding_69fdec34b16b327b = function(arg0, arg1) {
        arg0.binding = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_blend_c6896375c7f0119c = function(arg0, arg1) {
        arg0.blend = arg1;
    };
    imports.wbg.__wbg_set_body_37254161d1ce9d00 = function(arg0, arg1) {
        arg0.body = arg1;
    };
    imports.wbg.__wbg_set_border_f928c29484f98802 = function(arg0, arg1, arg2) {
        arg0.border = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_bubbles_4a710bf9d2e32957 = function(arg0, arg1) {
        arg0.bubbles = arg1 !== 0;
    };
    imports.wbg.__wbg_set_buffer_b70ef3f40d503e25 = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_set_buffer_b79f2efcb24ba844 = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_set_buffer_c23b131bfa95f222 = function(arg0, arg1) {
        arg0.buffer = arg1;
    };
    imports.wbg.__wbg_set_buffers_14ec06929ea541ec = function(arg0, arg1) {
        arg0.buffers = arg1;
    };
    imports.wbg.__wbg_set_bytes_per_row_279f81f686787a9f = function(arg0, arg1) {
        arg0.bytesPerRow = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_bytes_per_row_fbb55671d2ba86f2 = function(arg0, arg1) {
        arg0.bytesPerRow = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_c50d03a32da17043 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.set(arg1 >>> 0, arg2);
    }, arguments) };
    imports.wbg.__wbg_set_c7b46107a22c99e6 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_set_cancelBubble_c7a76f03a9c9c53f = function(arg0, arg1) {
        arg0.cancelBubble = arg1 !== 0;
    };
    imports.wbg.__wbg_set_cancelable_c9c4ce284707d025 = function(arg0, arg1) {
        arg0.cancelable = arg1 !== 0;
    };
    imports.wbg.__wbg_set_cause_a41f622f0fb2adbe = function(arg0, arg1) {
        arg0.cause = arg1;
    };
    imports.wbg.__wbg_set_cb0e657d1901c8d8 = function(arg0, arg1, arg2) {
        arg0.set(getArrayF32FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_className_52411a7e4782668d = function(arg0, arg1, arg2) {
        arg0.className = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_clear_value_829dfd0db30aaeac = function(arg0, arg1) {
        arg0.clearValue = arg1;
    };
    imports.wbg.__wbg_set_code_09748e5373b711b2 = function(arg0, arg1, arg2) {
        arg0.code = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_color_96b2f28b4f51fceb = function(arg0, arg1) {
        arg0.color = arg1;
    };
    imports.wbg.__wbg_set_color_attachments_ee51f860224ee6dd = function(arg0, arg1) {
        arg0.colorAttachments = arg1;
    };
    imports.wbg.__wbg_set_color_formats_1ab6364cf6d288e9 = function(arg0, arg1) {
        arg0.colorFormats = arg1;
    };
    imports.wbg.__wbg_set_compare_61125878543846d0 = function(arg0, arg1) {
        arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
    };
    imports.wbg.__wbg_set_compare_eb86f2890782b20b = function(arg0, arg1) {
        arg0.compare = __wbindgen_enum_GpuCompareFunction[arg1];
    };
    imports.wbg.__wbg_set_compilation_hints_e422864073ca35ee = function(arg0, arg1) {
        arg0.compilationHints = arg1;
    };
    imports.wbg.__wbg_set_composed_a4621c21120d2ee6 = function(arg0, arg1) {
        arg0.composed = arg1 !== 0;
    };
    imports.wbg.__wbg_set_compute_e2902436ce2ed757 = function(arg0, arg1) {
        arg0.compute = arg1;
    };
    imports.wbg.__wbg_set_constants_0877534449546089 = function(arg0, arg1) {
        arg0.constants = arg1;
    };
    imports.wbg.__wbg_set_constants_491baf908175687a = function(arg0, arg1) {
        arg0.constants = arg1;
    };
    imports.wbg.__wbg_set_constants_6e224e30e12e9d88 = function(arg0, arg1) {
        arg0.constants = arg1;
    };
    imports.wbg.__wbg_set_contentEditable_066aafd6c6e9a810 = function(arg0, arg1, arg2) {
        arg0.contentEditable = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_controls_db52e6d6b5c35a66 = function(arg0, arg1) {
        arg0.controls = arg1 !== 0;
    };
    imports.wbg.__wbg_set_count_4d43f3f3ab7f952d = function(arg0, arg1) {
        arg0.count = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_count_c555ce929443aa66 = function(arg0, arg1) {
        arg0.count = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_crossOrigin_13ccad056ecb49d3 = function(arg0, arg1, arg2) {
        arg0.crossOrigin = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_crossOrigin_bd073f9492859f68 = function(arg0, arg1, arg2) {
        arg0.crossOrigin = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_cull_mode_4e0bb3799474c091 = function(arg0, arg1) {
        arg0.cullMode = __wbindgen_enum_GpuCullMode[arg1];
    };
    imports.wbg.__wbg_set_currentTime_18c36e50ea032dbc = function(arg0, arg1) {
        arg0.currentTime = arg1;
    };
    imports.wbg.__wbg_set_d3b002c9f907b55d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_decoding_6ecd69ceffd8f01b = function(arg0, arg1, arg2) {
        arg0.decoding = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_defaultMuted_cab491205781833a = function(arg0, arg1) {
        arg0.defaultMuted = arg1 !== 0;
    };
    imports.wbg.__wbg_set_defaultPlaybackRate_83a95f5dbf61d40a = function(arg0, arg1) {
        arg0.defaultPlaybackRate = arg1;
    };
    imports.wbg.__wbg_set_default_queue_9e05942f117ce9c0 = function(arg0, arg1) {
        arg0.defaultQueue = arg1;
    };
    imports.wbg.__wbg_set_depth_bias_clamp_5375d337b8b35cd8 = function(arg0, arg1) {
        arg0.depthBiasClamp = arg1;
    };
    imports.wbg.__wbg_set_depth_bias_ea8b79f02442c9c7 = function(arg0, arg1) {
        arg0.depthBias = arg1;
    };
    imports.wbg.__wbg_set_depth_bias_slope_scale_0493feedbe6ad438 = function(arg0, arg1) {
        arg0.depthBiasSlopeScale = arg1;
    };
    imports.wbg.__wbg_set_depth_clear_value_20534499c6507e19 = function(arg0, arg1) {
        arg0.depthClearValue = arg1;
    };
    imports.wbg.__wbg_set_depth_compare_00e8b65c01d4bf03 = function(arg0, arg1) {
        arg0.depthCompare = __wbindgen_enum_GpuCompareFunction[arg1];
    };
    imports.wbg.__wbg_set_depth_fail_op_765de27464903fd0 = function(arg0, arg1) {
        arg0.depthFailOp = __wbindgen_enum_GpuStencilOperation[arg1];
    };
    imports.wbg.__wbg_set_depth_load_op_33c128108a7dc8f1 = function(arg0, arg1) {
        arg0.depthLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
    };
    imports.wbg.__wbg_set_depth_or_array_layers_58d45a4c8cd4f655 = function(arg0, arg1) {
        arg0.depthOrArrayLayers = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_depth_read_only_60990818c939df42 = function(arg0, arg1) {
        arg0.depthReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_set_depth_read_only_fae59572dd12c1c8 = function(arg0, arg1) {
        arg0.depthReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_set_depth_slice_c3f4c023b4a1c89c = function(arg0, arg1) {
        arg0.depthSlice = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_depth_stencil_2e141a5dfe91878d = function(arg0, arg1) {
        arg0.depthStencil = arg1;
    };
    imports.wbg.__wbg_set_depth_stencil_attachment_47273ec480dd9bb3 = function(arg0, arg1) {
        arg0.depthStencilAttachment = arg1;
    };
    imports.wbg.__wbg_set_depth_stencil_format_c9a577086cb44854 = function(arg0, arg1) {
        arg0.depthStencilFormat = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_depth_store_op_9cf32660e51edb87 = function(arg0, arg1) {
        arg0.depthStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
    };
    imports.wbg.__wbg_set_depth_write_enabled_2757b4106a089684 = function(arg0, arg1) {
        arg0.depthWriteEnabled = arg1 !== 0;
    };
    imports.wbg.__wbg_set_device_c2cb3231e445ef7c = function(arg0, arg1) {
        arg0.device = arg1;
    };
    imports.wbg.__wbg_set_dimension_0bc5536bd1965aea = function(arg0, arg1) {
        arg0.dimension = __wbindgen_enum_GpuTextureDimension[arg1];
    };
    imports.wbg.__wbg_set_dimension_c7429fee9721a104 = function(arg0, arg1) {
        arg0.dimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    };
    imports.wbg.__wbg_set_dir_76a5ab4f8cf95e37 = function(arg0, arg1, arg2) {
        arg0.dir = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_dir_d4c26e6f453fa1a0 = function(arg0, arg1, arg2) {
        arg0.dir = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_disablePictureInPicture_57bbfa168318783d = function(arg0, arg1) {
        arg0.disablePictureInPicture = arg1 !== 0;
    };
    imports.wbg.__wbg_set_draggable_c158e779a6aec478 = function(arg0, arg1) {
        arg0.draggable = arg1 !== 0;
    };
    imports.wbg.__wbg_set_dst_factor_976f0a83fd6ab733 = function(arg0, arg1) {
        arg0.dstFactor = __wbindgen_enum_GpuBlendFactor[arg1];
    };
    imports.wbg.__wbg_set_e2f933902557a0b5 = function(arg0, arg1, arg2) {
        arg0.set(getArrayU8FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_e3b17dd3e024e6de = function(arg0, arg1, arg2) {
        arg0.set(getArrayI32FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_e7cd108182596b7f = function(arg0, arg1, arg2) {
        arg0.set(getArrayU32FromWasm0(arg1, arg2));
    };
    imports.wbg.__wbg_set_efaaf145b9377369 = function(arg0, arg1, arg2) {
        const ret = arg0.set(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_set_end_of_pass_write_index_3cc5a7a3f6819a03 = function(arg0, arg1) {
        arg0.endOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_end_of_pass_write_index_f82ebc8ed8ebaa34 = function(arg0, arg1) {
        arg0.endOfPassWriteIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_entries_01031c155d815ef1 = function(arg0, arg1) {
        arg0.entries = arg1;
    };
    imports.wbg.__wbg_set_entries_8f49811ca79d7dbf = function(arg0, arg1) {
        arg0.entries = arg1;
    };
    imports.wbg.__wbg_set_entry_point_1da27599bf796782 = function(arg0, arg1, arg2) {
        arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_entry_point_670e208336b80723 = function(arg0, arg1, arg2) {
        arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_entry_point_7e39bf2abe77ebae = function(arg0, arg1, arg2) {
        arg0.entryPoint = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_error_8a049a8a13ef53bd = function(arg0, arg1) {
        arg0.error = arg1;
    };
    imports.wbg.__wbg_set_external_texture_66700d1d2537a6de = function(arg0, arg1) {
        arg0.externalTexture = arg1;
    };
    imports.wbg.__wbg_set_fail_op_9de9bf69ac6682e3 = function(arg0, arg1) {
        arg0.failOp = __wbindgen_enum_GpuStencilOperation[arg1];
    };
    imports.wbg.__wbg_set_feature_level_ef2215a60cd4a7cc = function(arg0, arg1, arg2) {
        arg0.featureLevel = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_flip_y_8e10258813c55af9 = function(arg0, arg1) {
        arg0.flipY = arg1 !== 0;
    };
    imports.wbg.__wbg_set_force_fallback_adapter_93edeb3a479e1693 = function(arg0, arg1) {
        arg0.forceFallbackAdapter = arg1 !== 0;
    };
    imports.wbg.__wbg_set_format_10a5222e02236027 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_format_37627c6070d0ecfc = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_format_3c7d4bce3fb94de5 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_format_47fd2845afca8e1a = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_format_72e1ce883fb57e05 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_format_877a89e3431cb656 = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuVertexFormat[arg1];
    };
    imports.wbg.__wbg_set_format_ee418ce830040f4d = function(arg0, arg1) {
        arg0.format = __wbindgen_enum_GpuTextureFormat[arg1];
    };
    imports.wbg.__wbg_set_fragment_616c1d1c0db9abd4 = function(arg0, arg1) {
        arg0.fragment = arg1;
    };
    imports.wbg.__wbg_set_front_face_a1a0e940bd9fa3d0 = function(arg0, arg1) {
        arg0.frontFace = __wbindgen_enum_GpuFrontFace[arg1];
    };
    imports.wbg.__wbg_set_g_9ab482dfe9422850 = function(arg0, arg1) {
        arg0.g = arg1;
    };
    imports.wbg.__wbg_set_has_dynamic_offset_21302a736944b6d9 = function(arg0, arg1) {
        arg0.hasDynamicOffset = arg1 !== 0;
    };
    imports.wbg.__wbg_set_height_621faa0b76903e46 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_height_6f8f8ef4cb40e496 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_height_afe09c24165867f7 = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_height_cd4d12f9029588ee = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_height_d9f505e6008bc27c = function(arg0, arg1) {
        arg0.height = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_hidden_6508822431bec7bb = function(arg0, arg1) {
        arg0.hidden = arg1 !== 0;
    };
    imports.wbg.__wbg_set_hspace_36294a2b9bda9108 = function(arg0, arg1) {
        arg0.hspace = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_id_702da6e1bcec3b45 = function(arg0, arg1, arg2) {
        arg0.id = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_index_004a7b69c5302b3d = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_021489b2916af13e = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_0487dfc54e2277da = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = BigInt.asUintN(64, arg2);
    };
    imports.wbg.__wbg_set_index_04c4b93e64d08a52 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_165b46b0114d368c = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_42abe35f117e614e = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2 >>> 0;
    };
    imports.wbg.__wbg_set_index_59b24aaba83c46c8 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_692c683816d95946 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_d6edc63bcd424d0f = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_ea93cefcd6b66972 = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_index_ec29abb6047e216b = function(arg0, arg1, arg2) {
        arg0[arg1 >>> 0] = arg2;
    };
    imports.wbg.__wbg_set_inert_4869a285dbb3f7d3 = function(arg0, arg1) {
        arg0.inert = arg1 !== 0;
    };
    imports.wbg.__wbg_set_innerHTML_f1d03f780518a596 = function(arg0, arg1, arg2) {
        arg0.innerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_innerHeight_5b0c3264f1d7d630 = function() { return handleError(function (arg0, arg1) {
        arg0.innerHeight = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_innerText_b0abb40240106cb9 = function(arg0, arg1, arg2) {
        arg0.innerText = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_innerWidth_28aeaae481ce8cb4 = function() { return handleError(function (arg0, arg1) {
        arg0.innerWidth = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_isMap_92530a0ed373cfe5 = function(arg0, arg1) {
        arg0.isMap = arg1 !== 0;
    };
    imports.wbg.__wbg_set_label_084ba35e1f658204 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_0b21604c6a585153 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_1612451aa6bc6fc7 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_1b7e4bc9d67c38b4 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_1c17b3c7cb0f15f2 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_1f7d9fc344210b92 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_2e55e1407bac5ba2 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_2f29ea1ea0511b77 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_3cfe4e6ccc7e9caa = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_407c8b09134f4f1d = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_460e474dfeb4d74e = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_59b9cbe312d79c62 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_5dc53fac7117f697 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_6254d46ddbef48af = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_62f6b793bec18058 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_79670e5e0a403a6c = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_84ac534a2df93719 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_8c2527d134cf495f = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_8c7370df5a497e6d = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_8e88157a8e30ddcd = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_8edbc05494bffe0e = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_959d99d1662276f5 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_a3e6a83986c8058a = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_a56a46194be79e8d = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_a6c76bf653812d73 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_ae972d3c351c79ec = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_b1b0d28716686810 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_c20abc63eb84cfd5 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_cabc4eccde1e89fd = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_cbf44d7e07e3717a = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_ce9867437be7a2d7 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_cf1bc810a3bd9a59 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_d572db9458d3f3ed = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_d90e07589bdb8f1a = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_e322d1a1181a5944 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_e69d774bf38947d2 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_ea1e2a2915445d59 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_f400a474ce1ae4fb = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_f401ffe5fc8acb94 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_fb22a2b08ddade76 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_fd267f81a6ab4d68 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_label_ff7c2cb9af49bf08 = function(arg0, arg1, arg2) {
        arg0.label = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_lang_aefe120fe7873c48 = function(arg0, arg1, arg2) {
        arg0.lang = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_last_index_729ad266a11859f1 = function(arg0, arg1) {
        arg0.lastIndex = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_layout_06cbb3f28f4f0c74 = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_set_layout_3a36319a5990c8b7 = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_set_layout_89fac8ffd04a0d55 = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_set_layout_ac044d38ca30f520 = function(arg0, arg1) {
        arg0.layout = arg1;
    };
    imports.wbg.__wbg_set_length_a5425f40fdfb1bb5 = function(arg0, arg1) {
        arg0.length = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_load_op_d48e31970a7bdf9b = function(arg0, arg1) {
        arg0.loadOp = __wbindgen_enum_GpuLoadOp[arg1];
    };
    imports.wbg.__wbg_set_lod_max_clamp_150813b458d7989c = function(arg0, arg1) {
        arg0.lodMaxClamp = arg1;
    };
    imports.wbg.__wbg_set_lod_min_clamp_444adbc1645f8521 = function(arg0, arg1) {
        arg0.lodMinClamp = arg1;
    };
    imports.wbg.__wbg_set_longDesc_f00fa189eee62661 = function(arg0, arg1, arg2) {
        arg0.longDesc = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_loop_91318cc650a7c42e = function(arg0, arg1) {
        arg0.loop = arg1 !== 0;
    };
    imports.wbg.__wbg_set_mag_filter_4ce311d0e097cca4 = function(arg0, arg1) {
        arg0.magFilter = __wbindgen_enum_GpuFilterMode[arg1];
    };
    imports.wbg.__wbg_set_mapped_at_creation_34e7f793131eefbb = function(arg0, arg1) {
        arg0.mappedAtCreation = arg1 !== 0;
    };
    imports.wbg.__wbg_set_mask_a51cdf9e56393e94 = function(arg0, arg1) {
        arg0.mask = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_max_anisotropy_5be6e383b6e6632b = function(arg0, arg1) {
        arg0.maxAnisotropy = arg1;
    };
    imports.wbg.__wbg_set_max_draw_count_45cd8a38f46b28e1 = function(arg0, arg1) {
        arg0.maxDrawCount = arg1;
    };
    imports.wbg.__wbg_set_message_cf2927b952cdd3a9 = function(arg0, arg1, arg2) {
        arg0.message = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_min_binding_size_f9a65ac1a20ab955 = function(arg0, arg1) {
        arg0.minBindingSize = arg1;
    };
    imports.wbg.__wbg_set_min_filter_87ee94d6dcfdc3d8 = function(arg0, arg1) {
        arg0.minFilter = __wbindgen_enum_GpuFilterMode[arg1];
    };
    imports.wbg.__wbg_set_mip_level_2d7e962e91fd1c33 = function(arg0, arg1) {
        arg0.mipLevel = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_mip_level_82be44e699a9cabf = function(arg0, arg1) {
        arg0.mipLevel = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_mip_level_count_32bbfdc1aebc8dd3 = function(arg0, arg1) {
        arg0.mipLevelCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_mip_level_count_79f47bf6140098e5 = function(arg0, arg1) {
        arg0.mipLevelCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_mipmap_filter_1739c7c215847dc1 = function(arg0, arg1) {
        arg0.mipmapFilter = __wbindgen_enum_GpuMipmapFilterMode[arg1];
    };
    imports.wbg.__wbg_set_mode_21990cfcebddf276 = function(arg0, arg1) {
        arg0.mode = __wbindgen_enum_GpuCanvasToneMappingMode[arg1];
    };
    imports.wbg.__wbg_set_module_74f3d1c47da25794 = function(arg0, arg1) {
        arg0.module = arg1;
    };
    imports.wbg.__wbg_set_module_8ff6ea5431317fde = function(arg0, arg1) {
        arg0.module = arg1;
    };
    imports.wbg.__wbg_set_module_dae95bb56c7d6ee9 = function(arg0, arg1) {
        arg0.module = arg1;
    };
    imports.wbg.__wbg_set_multisample_156e854358e208ff = function(arg0, arg1) {
        arg0.multisample = arg1;
    };
    imports.wbg.__wbg_set_multisampled_775f1e38d554a0f4 = function(arg0, arg1) {
        arg0.multisampled = arg1 !== 0;
    };
    imports.wbg.__wbg_set_muted_92c7cf5ee78244cb = function(arg0, arg1) {
        arg0.muted = arg1 !== 0;
    };
    imports.wbg.__wbg_set_name_5399dd71553bb72d = function(arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_name_6679a24946499b52 = function(arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_name_b393d7370e087a87 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_set_name_df69b75cb0b4de8a = function(arg0, arg1, arg2) {
        arg0.name = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_nodeValue_997d7696f2c5d4bd = function(arg0, arg1, arg2) {
        arg0.nodeValue = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_nonce_3dd10c3bdc2f7d6d = function(arg0, arg1, arg2) {
        arg0.nonce = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_occlusion_query_set_52e43e246a9c0f43 = function(arg0, arg1) {
        arg0.occlusionQuerySet = arg1;
    };
    imports.wbg.__wbg_set_offset_25f624abc0979ae4 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_set_offset_9cf47ca05ec82222 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_set_offset_9ed8011d53037f93 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_set_offset_d27243aad0b0b017 = function(arg0, arg1) {
        arg0.offset = arg1;
    };
    imports.wbg.__wbg_set_onabort_00594d5471810b7b = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_set_onabort_0b0e068a384ddb12 = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_set_onabort_115b480c2ba2558c = function(arg0, arg1) {
        arg0.onabort = arg1;
    };
    imports.wbg.__wbg_set_onafterprint_c42d1f626700508e = function(arg0, arg1) {
        arg0.onafterprint = arg1;
    };
    imports.wbg.__wbg_set_onafterscriptexecute_a81231598900c9db = function(arg0, arg1) {
        arg0.onafterscriptexecute = arg1;
    };
    imports.wbg.__wbg_set_onanimationcancel_1f2764630797889c = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_set_onanimationcancel_53f0e2b47aff9f20 = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_set_onanimationcancel_681d47acb3d9b366 = function(arg0, arg1) {
        arg0.onanimationcancel = arg1;
    };
    imports.wbg.__wbg_set_onanimationend_1444e376a10d0633 = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_set_onanimationend_380c80840f03bcb4 = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_set_onanimationend_c4b0ab32695cea02 = function(arg0, arg1) {
        arg0.onanimationend = arg1;
    };
    imports.wbg.__wbg_set_onanimationiteration_1ada1eef8342faa9 = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_set_onanimationiteration_a2100bc6a1473176 = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_set_onanimationiteration_e69ede9fb409693f = function(arg0, arg1) {
        arg0.onanimationiteration = arg1;
    };
    imports.wbg.__wbg_set_onanimationstart_14280cdb56683c46 = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_set_onanimationstart_aff87bfc941a8929 = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_set_onanimationstart_f5fbe0333463b44e = function(arg0, arg1) {
        arg0.onanimationstart = arg1;
    };
    imports.wbg.__wbg_set_onappinstalled_f66e90fc605a4b09 = function(arg0, arg1) {
        arg0.onappinstalled = arg1;
    };
    imports.wbg.__wbg_set_onauxclick_2da032ccda961bab = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_set_onauxclick_68b81137e1543d4c = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_set_onauxclick_792c30b7cd519126 = function(arg0, arg1) {
        arg0.onauxclick = arg1;
    };
    imports.wbg.__wbg_set_onbeforeinput_0cb983860b631a4c = function(arg0, arg1) {
        arg0.onbeforeinput = arg1;
    };
    imports.wbg.__wbg_set_onbeforeinput_1a2f87564c9dbc25 = function(arg0, arg1) {
        arg0.onbeforeinput = arg1;
    };
    imports.wbg.__wbg_set_onbeforeinput_524cc8f073008f42 = function(arg0, arg1) {
        arg0.onbeforeinput = arg1;
    };
    imports.wbg.__wbg_set_onbeforeprint_907d90a89e07ad25 = function(arg0, arg1) {
        arg0.onbeforeprint = arg1;
    };
    imports.wbg.__wbg_set_onbeforescriptexecute_4bb6d72ba89ddc6b = function(arg0, arg1) {
        arg0.onbeforescriptexecute = arg1;
    };
    imports.wbg.__wbg_set_onbeforetoggle_67697de3542f2724 = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_set_onbeforetoggle_d573dd08b7e94f7c = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_set_onbeforetoggle_dd11152cba9674eb = function(arg0, arg1) {
        arg0.onbeforetoggle = arg1;
    };
    imports.wbg.__wbg_set_onbeforeunload_59ea9442f01c0343 = function(arg0, arg1) {
        arg0.onbeforeunload = arg1;
    };
    imports.wbg.__wbg_set_onblur_184ea633f3194fb3 = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_set_onblur_4d18e04cf4ed202d = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_set_onblur_b4bee17c4c9945a6 = function(arg0, arg1) {
        arg0.onblur = arg1;
    };
    imports.wbg.__wbg_set_oncanplay_aa0bc6f3e23daad0 = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_set_oncanplay_aedc6aa99aa1cfad = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_set_oncanplay_fceb433798e0dd58 = function(arg0, arg1) {
        arg0.oncanplay = arg1;
    };
    imports.wbg.__wbg_set_oncanplaythrough_4b87a14432697532 = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_set_oncanplaythrough_68784ed7a755146a = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_set_oncanplaythrough_b8af56ab9492a43a = function(arg0, arg1) {
        arg0.oncanplaythrough = arg1;
    };
    imports.wbg.__wbg_set_onchange_0d4609ea7108a779 = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_set_onchange_bc1507383449bba3 = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_set_onchange_ceed61dcb89e1290 = function(arg0, arg1) {
        arg0.onchange = arg1;
    };
    imports.wbg.__wbg_set_onclick_bcaf869d3d40a03b = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_set_onclick_bd577c6578279be4 = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_set_onclick_e10c1bcf5b221dcc = function(arg0, arg1) {
        arg0.onclick = arg1;
    };
    imports.wbg.__wbg_set_onclose_6b521bf8ae942671 = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_set_onclose_a9db12d0ac558893 = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_set_onclose_ae8a7059d63ccb7e = function(arg0, arg1) {
        arg0.onclose = arg1;
    };
    imports.wbg.__wbg_set_oncontextmenu_4b1f6764d59e9816 = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_set_oncontextmenu_86cbb4122303fff9 = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_set_oncontextmenu_cba5d065ecb87a7c = function(arg0, arg1) {
        arg0.oncontextmenu = arg1;
    };
    imports.wbg.__wbg_set_oncopy_1574155c86639e34 = function(arg0, arg1) {
        arg0.oncopy = arg1;
    };
    imports.wbg.__wbg_set_oncopy_c1ca2b47ae0ab9c5 = function(arg0, arg1) {
        arg0.oncopy = arg1;
    };
    imports.wbg.__wbg_set_oncut_4d69e112e43a8d1d = function(arg0, arg1) {
        arg0.oncut = arg1;
    };
    imports.wbg.__wbg_set_oncut_a4194565441bb6e9 = function(arg0, arg1) {
        arg0.oncut = arg1;
    };
    imports.wbg.__wbg_set_ondblclick_1c1cefe1443a19d0 = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_set_ondblclick_627dc7383dbf8573 = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_set_ondblclick_70077a42d1529678 = function(arg0, arg1) {
        arg0.ondblclick = arg1;
    };
    imports.wbg.__wbg_set_ondrag_3a07cb466913a356 = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_set_ondrag_4c173753f15b637f = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_set_ondrag_d5c4da3087d7b61e = function(arg0, arg1) {
        arg0.ondrag = arg1;
    };
    imports.wbg.__wbg_set_ondragend_4fc87a73212cc68c = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_set_ondragend_9727e4a9a83606ec = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_set_ondragend_ed9917f8bad7cc98 = function(arg0, arg1) {
        arg0.ondragend = arg1;
    };
    imports.wbg.__wbg_set_ondragenter_3821e0d354199071 = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_set_ondragenter_834aeb21d59b2a7a = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_set_ondragenter_8ceb6c4695d4f829 = function(arg0, arg1) {
        arg0.ondragenter = arg1;
    };
    imports.wbg.__wbg_set_ondragexit_42e05555c6211c18 = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_set_ondragexit_4ddb90f25d9ed388 = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_set_ondragexit_f7e1b1481a98765c = function(arg0, arg1) {
        arg0.ondragexit = arg1;
    };
    imports.wbg.__wbg_set_ondragleave_8346ea0ed8b8066b = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_set_ondragleave_922f26d2285aface = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_set_ondragleave_9573f53889375d8f = function(arg0, arg1) {
        arg0.ondragleave = arg1;
    };
    imports.wbg.__wbg_set_ondragover_5ce9c7cd45e9c16d = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_set_ondragover_ddb19154957b4510 = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_set_ondragover_e1110e3d7f949087 = function(arg0, arg1) {
        arg0.ondragover = arg1;
    };
    imports.wbg.__wbg_set_ondragstart_3a86f63d89222074 = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_set_ondragstart_e069f350758a765b = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_set_ondragstart_e07a27a630c34d2b = function(arg0, arg1) {
        arg0.ondragstart = arg1;
    };
    imports.wbg.__wbg_set_ondrop_3819fadf41edbeab = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_set_ondrop_75e3cd9715298e80 = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_set_ondrop_f2501b88e2fc2b12 = function(arg0, arg1) {
        arg0.ondrop = arg1;
    };
    imports.wbg.__wbg_set_ondurationchange_5c51bee64311f65b = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_set_ondurationchange_c8b84936d2254c62 = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_set_ondurationchange_d315532f18b7a934 = function(arg0, arg1) {
        arg0.ondurationchange = arg1;
    };
    imports.wbg.__wbg_set_onemptied_c1dac5b80843201b = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_set_onemptied_e019e5b08f903593 = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_set_onemptied_e86ff33ae91fa7db = function(arg0, arg1) {
        arg0.onemptied = arg1;
    };
    imports.wbg.__wbg_set_onencrypted_d5efb9e794e93384 = function(arg0, arg1) {
        arg0.onencrypted = arg1;
    };
    imports.wbg.__wbg_set_onended_0a404bf701325e0e = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_set_onended_486ed76e5c04a334 = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_set_onended_510d7b0ffba36ffe = function(arg0, arg1) {
        arg0.onended = arg1;
    };
    imports.wbg.__wbg_set_onenterpictureinpicture_81ac1378d8e71e2d = function(arg0, arg1) {
        arg0.onenterpictureinpicture = arg1;
    };
    imports.wbg.__wbg_set_onerror_48a84dc6a60cafe1 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onerror_5d63cbdb36302862 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onerror_d5671da43c08b208 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onerror_e7e40c62a55a0770 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onerror_ef048b246394e3a5 = function(arg0, arg1) {
        arg0.onerror = arg1;
    };
    imports.wbg.__wbg_set_onfocus_0c818e1c5bf1efd3 = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_set_onfocus_8a688e1d7fb4b320 = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_set_onfocus_947be13b7b2851ad = function(arg0, arg1) {
        arg0.onfocus = arg1;
    };
    imports.wbg.__wbg_set_onfullscreenchange_1547e6303f8fc93b = function(arg0, arg1) {
        arg0.onfullscreenchange = arg1;
    };
    imports.wbg.__wbg_set_onfullscreenerror_e765a439f376caec = function(arg0, arg1) {
        arg0.onfullscreenerror = arg1;
    };
    imports.wbg.__wbg_set_ongamepadconnected_6d53bfce61400d7f = function(arg0, arg1) {
        arg0.ongamepadconnected = arg1;
    };
    imports.wbg.__wbg_set_ongamepaddisconnected_8282ba1159085d52 = function(arg0, arg1) {
        arg0.ongamepaddisconnected = arg1;
    };
    imports.wbg.__wbg_set_ongotpointercapture_2c5d69d6eb5a7422 = function(arg0, arg1) {
        arg0.ongotpointercapture = arg1;
    };
    imports.wbg.__wbg_set_ongotpointercapture_8f3285e79340f3aa = function(arg0, arg1) {
        arg0.ongotpointercapture = arg1;
    };
    imports.wbg.__wbg_set_ongotpointercapture_c234b5662ba50ee5 = function(arg0, arg1) {
        arg0.ongotpointercapture = arg1;
    };
    imports.wbg.__wbg_set_onhashchange_70f4d17331790e87 = function(arg0, arg1) {
        arg0.onhashchange = arg1;
    };
    imports.wbg.__wbg_set_oninput_2757eb2036eac9ff = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_set_oninput_330d692d3ecc36bd = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_set_oninput_42a6db2c3bc97909 = function(arg0, arg1) {
        arg0.oninput = arg1;
    };
    imports.wbg.__wbg_set_oninvalid_1509814c73ab9a0f = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_set_oninvalid_9f5b87997e68f203 = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_set_oninvalid_e9b22a418a6012f6 = function(arg0, arg1) {
        arg0.oninvalid = arg1;
    };
    imports.wbg.__wbg_set_onkeydown_4423a3e8aac77535 = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_set_onkeydown_af635828dca03e84 = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_set_onkeydown_d2621c474b636979 = function(arg0, arg1) {
        arg0.onkeydown = arg1;
    };
    imports.wbg.__wbg_set_onkeypress_02c2addd1e8ea8ad = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_set_onkeypress_1aa984e7a94671a8 = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_set_onkeypress_1b27ebc0eb04fb3f = function(arg0, arg1) {
        arg0.onkeypress = arg1;
    };
    imports.wbg.__wbg_set_onkeyup_46f233b50e7ac6ed = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_set_onkeyup_8c2803ed96d084fb = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_set_onkeyup_913b36756e057c1d = function(arg0, arg1) {
        arg0.onkeyup = arg1;
    };
    imports.wbg.__wbg_set_onlanguagechange_7beb8c18bbfc6805 = function(arg0, arg1) {
        arg0.onlanguagechange = arg1;
    };
    imports.wbg.__wbg_set_onleavepictureinpicture_3cbd5eac9bb06262 = function(arg0, arg1) {
        arg0.onleavepictureinpicture = arg1;
    };
    imports.wbg.__wbg_set_onload_0cf71025dbb9c990 = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_set_onload_5e2862e3453854de = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_set_onload_b53ccfcc557eb4e5 = function(arg0, arg1) {
        arg0.onload = arg1;
    };
    imports.wbg.__wbg_set_onloadeddata_295bbf0c9d10c34a = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_set_onloadeddata_413b9e1644beed03 = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_set_onloadeddata_51e92087bc939213 = function(arg0, arg1) {
        arg0.onloadeddata = arg1;
    };
    imports.wbg.__wbg_set_onloadedmetadata_1a4fd931688a3ee2 = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_set_onloadedmetadata_37e3035596e659de = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_set_onloadedmetadata_ec0f2458973a5c87 = function(arg0, arg1) {
        arg0.onloadedmetadata = arg1;
    };
    imports.wbg.__wbg_set_onloadend_686b6082b96e8c08 = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_set_onloadend_dabdf5c120d850d8 = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_set_onloadend_db7f2daac0c008ab = function(arg0, arg1) {
        arg0.onloadend = arg1;
    };
    imports.wbg.__wbg_set_onloadstart_26e2691a70f9d6be = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_set_onloadstart_60ff95d4cbcaa179 = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_set_onloadstart_e0f26e080cc1a3ca = function(arg0, arg1) {
        arg0.onloadstart = arg1;
    };
    imports.wbg.__wbg_set_onlostpointercapture_0e92cfb556ca4577 = function(arg0, arg1) {
        arg0.onlostpointercapture = arg1;
    };
    imports.wbg.__wbg_set_onlostpointercapture_7792529cea9720e0 = function(arg0, arg1) {
        arg0.onlostpointercapture = arg1;
    };
    imports.wbg.__wbg_set_onlostpointercapture_905b6c71d20c9870 = function(arg0, arg1) {
        arg0.onlostpointercapture = arg1;
    };
    imports.wbg.__wbg_set_onmessage_5ac667c410109349 = function(arg0, arg1) {
        arg0.onmessage = arg1;
    };
    imports.wbg.__wbg_set_onmessage_deb94985de696ac7 = function(arg0, arg1) {
        arg0.onmessage = arg1;
    };
    imports.wbg.__wbg_set_onmessageerror_72a6db0f4a89f66c = function(arg0, arg1) {
        arg0.onmessageerror = arg1;
    };
    imports.wbg.__wbg_set_onmessageerror_fbdab1f3f5f0d2da = function(arg0, arg1) {
        arg0.onmessageerror = arg1;
    };
    imports.wbg.__wbg_set_onmousedown_16c1ef4b71d5a60d = function(arg0, arg1) {
        arg0.onmousedown = arg1;
    };
    imports.wbg.__wbg_set_onmousedown_9c57b4661bedf2bc = function(arg0, arg1) {
        arg0.onmousedown = arg1;
    };
    imports.wbg.__wbg_set_onmousedown_cd3549a5f3219689 = function(arg0, arg1) {
        arg0.onmousedown = arg1;
    };
    imports.wbg.__wbg_set_onmouseenter_4d40681662ad1b6f = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_set_onmouseenter_e4236fe7060c048b = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_set_onmouseenter_e621b22c12278b4d = function(arg0, arg1) {
        arg0.onmouseenter = arg1;
    };
    imports.wbg.__wbg_set_onmouseleave_5d865aa148356ddf = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_set_onmouseleave_e72a8a2e411f3a41 = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_set_onmouseleave_ef9be98bb8e57586 = function(arg0, arg1) {
        arg0.onmouseleave = arg1;
    };
    imports.wbg.__wbg_set_onmousemove_0861529a1e1dfc9d = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_set_onmousemove_8f619e0e30f22a00 = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_set_onmousemove_bb45647370878e3b = function(arg0, arg1) {
        arg0.onmousemove = arg1;
    };
    imports.wbg.__wbg_set_onmouseout_044ccb04149ba1f0 = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_set_onmouseout_49f84cda94755014 = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_set_onmouseout_97680e26ae49c1df = function(arg0, arg1) {
        arg0.onmouseout = arg1;
    };
    imports.wbg.__wbg_set_onmouseover_16076a1058b74e90 = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_set_onmouseover_2c69ae231ceb303a = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_set_onmouseover_ce572c9a511341d8 = function(arg0, arg1) {
        arg0.onmouseover = arg1;
    };
    imports.wbg.__wbg_set_onmouseup_2c49e01884dca513 = function(arg0, arg1) {
        arg0.onmouseup = arg1;
    };
    imports.wbg.__wbg_set_onmouseup_3a1dfbdc9bf40acd = function(arg0, arg1) {
        arg0.onmouseup = arg1;
    };
    imports.wbg.__wbg_set_onmouseup_d17e25a27d8de122 = function(arg0, arg1) {
        arg0.onmouseup = arg1;
    };
    imports.wbg.__wbg_set_onoffline_3ba49b807f63d6ee = function(arg0, arg1) {
        arg0.onoffline = arg1;
    };
    imports.wbg.__wbg_set_onoffline_4729c38f6b99930e = function(arg0, arg1) {
        arg0.onoffline = arg1;
    };
    imports.wbg.__wbg_set_ononline_1d032cbc28239da8 = function(arg0, arg1) {
        arg0.ononline = arg1;
    };
    imports.wbg.__wbg_set_ononline_dadca7a77cea2fc7 = function(arg0, arg1) {
        arg0.ononline = arg1;
    };
    imports.wbg.__wbg_set_onorientationchange_e3a5c7437427e0ac = function(arg0, arg1) {
        arg0.onorientationchange = arg1;
    };
    imports.wbg.__wbg_set_onpagehide_7f73053345f76611 = function(arg0, arg1) {
        arg0.onpagehide = arg1;
    };
    imports.wbg.__wbg_set_onpageshow_578f4f238c94abc7 = function(arg0, arg1) {
        arg0.onpageshow = arg1;
    };
    imports.wbg.__wbg_set_onpaste_2e03b8393362bc65 = function(arg0, arg1) {
        arg0.onpaste = arg1;
    };
    imports.wbg.__wbg_set_onpaste_ef7407b0cbbd16bc = function(arg0, arg1) {
        arg0.onpaste = arg1;
    };
    imports.wbg.__wbg_set_onpause_0eb6791b6b2dadfc = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_set_onpause_4bf3e035d678da08 = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_set_onpause_f8d8e4c1a7e0a430 = function(arg0, arg1) {
        arg0.onpause = arg1;
    };
    imports.wbg.__wbg_set_onplay_1eb1b16a58f86e91 = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_set_onplay_a46f6b77510675bc = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_set_onplay_c215af897d329aec = function(arg0, arg1) {
        arg0.onplay = arg1;
    };
    imports.wbg.__wbg_set_onplaying_0f740939f17e693c = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_set_onplaying_5e2a3a2471cc759c = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_set_onplaying_ef9460771fe3c69b = function(arg0, arg1) {
        arg0.onplaying = arg1;
    };
    imports.wbg.__wbg_set_onpointercancel_14c057a86714932c = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_set_onpointercancel_3fb123ca1e9ce1c7 = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_set_onpointercancel_d7043bc0a08a84a9 = function(arg0, arg1) {
        arg0.onpointercancel = arg1;
    };
    imports.wbg.__wbg_set_onpointerdown_083063db27c6120b = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_set_onpointerdown_0859430f9054a3c5 = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_set_onpointerdown_a0bcb02ce5a73fd0 = function(arg0, arg1) {
        arg0.onpointerdown = arg1;
    };
    imports.wbg.__wbg_set_onpointerenter_7c70a6c37ab381bf = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_set_onpointerenter_fc739b90a993f5f9 = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_set_onpointerenter_fdb6815b5a99d61f = function(arg0, arg1) {
        arg0.onpointerenter = arg1;
    };
    imports.wbg.__wbg_set_onpointerleave_1ed3376b69905214 = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_set_onpointerleave_27ec73543e20007f = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_set_onpointerleave_68966d44dfc946fa = function(arg0, arg1) {
        arg0.onpointerleave = arg1;
    };
    imports.wbg.__wbg_set_onpointerlockchange_1f4ccdb3a73afbf6 = function(arg0, arg1) {
        arg0.onpointerlockchange = arg1;
    };
    imports.wbg.__wbg_set_onpointerlockerror_0114dda44fb0acdb = function(arg0, arg1) {
        arg0.onpointerlockerror = arg1;
    };
    imports.wbg.__wbg_set_onpointermove_94c6ec3d2fa85972 = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_set_onpointermove_cbc8ab6db1481f79 = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_set_onpointermove_f092fb0dcbe4d0da = function(arg0, arg1) {
        arg0.onpointermove = arg1;
    };
    imports.wbg.__wbg_set_onpointerout_0edf5c8355e5cd36 = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_set_onpointerout_7146c89f5703e294 = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_set_onpointerout_fea80232efc106ab = function(arg0, arg1) {
        arg0.onpointerout = arg1;
    };
    imports.wbg.__wbg_set_onpointerover_426c4d980e831fa7 = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_set_onpointerover_4bf7e7629395a239 = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_set_onpointerover_f2307e0ba6e91230 = function(arg0, arg1) {
        arg0.onpointerover = arg1;
    };
    imports.wbg.__wbg_set_onpointerup_2f051d9c9be8b435 = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_set_onpointerup_6a79f52279daba72 = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_set_onpointerup_d81e19e4a036bb7b = function(arg0, arg1) {
        arg0.onpointerup = arg1;
    };
    imports.wbg.__wbg_set_onpopstate_75db27ac7d3afc6f = function(arg0, arg1) {
        arg0.onpopstate = arg1;
    };
    imports.wbg.__wbg_set_onprogress_1e202e2bf14395ee = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_set_onprogress_1e8e560d847e6664 = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_set_onprogress_c7aebaca73db4c16 = function(arg0, arg1) {
        arg0.onprogress = arg1;
    };
    imports.wbg.__wbg_set_onratechange_1f7f99e255263814 = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_set_onratechange_d8700e2a7717803a = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_set_onratechange_e7fdee02d0a55934 = function(arg0, arg1) {
        arg0.onratechange = arg1;
    };
    imports.wbg.__wbg_set_onreadystatechange_799cd29598c9edb4 = function(arg0, arg1) {
        arg0.onreadystatechange = arg1;
    };
    imports.wbg.__wbg_set_onreset_1bb08aaf79890722 = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_set_onreset_6731f6e72eabd72f = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_set_onreset_df6dce4da408e781 = function(arg0, arg1) {
        arg0.onreset = arg1;
    };
    imports.wbg.__wbg_set_onresize_53f64078ae3fd5ce = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_set_onresize_8b0e66e056b5ec80 = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_set_onresize_ab66010e0509ad14 = function(arg0, arg1) {
        arg0.onresize = arg1;
    };
    imports.wbg.__wbg_set_onresourcetimingbufferfull_7ac6a317d0531a50 = function(arg0, arg1) {
        arg0.onresourcetimingbufferfull = arg1;
    };
    imports.wbg.__wbg_set_onscroll_2ce5ce0764a5d3d6 = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_set_onscroll_8d95d4497e5bfc0a = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_set_onscroll_b865398fde173261 = function(arg0, arg1) {
        arg0.onscroll = arg1;
    };
    imports.wbg.__wbg_set_onseeked_0142c965af13d493 = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_set_onseeked_2b6b3e5d7f6ec287 = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_set_onseeked_b260032aefb6492a = function(arg0, arg1) {
        arg0.onseeked = arg1;
    };
    imports.wbg.__wbg_set_onseeking_0ca70f1c9a50daa3 = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_set_onseeking_99a230d6dffb6c7a = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_set_onseeking_e586b70bc7aaaf21 = function(arg0, arg1) {
        arg0.onseeking = arg1;
    };
    imports.wbg.__wbg_set_onselect_2db5fb6d417b5b14 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_set_onselect_c94036135033aa16 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_set_onselect_ff48a7cdc22d0737 = function(arg0, arg1) {
        arg0.onselect = arg1;
    };
    imports.wbg.__wbg_set_onselectionchange_af9004f416c386cd = function(arg0, arg1) {
        arg0.onselectionchange = arg1;
    };
    imports.wbg.__wbg_set_onselectstart_40bdeaad349aab87 = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_set_onselectstart_424a4d1e3d34b839 = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_set_onselectstart_9b584e1c83dfe589 = function(arg0, arg1) {
        arg0.onselectstart = arg1;
    };
    imports.wbg.__wbg_set_onshow_37fe777baeeea9cb = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_set_onshow_3f5601493b406e56 = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_set_onshow_8360cfb98fa04519 = function(arg0, arg1) {
        arg0.onshow = arg1;
    };
    imports.wbg.__wbg_set_onstalled_46fe96e06de7b043 = function(arg0, arg1) {
        arg0.onstalled = arg1;
    };
    imports.wbg.__wbg_set_onstalled_64897ec2d6ef7225 = function(arg0, arg1) {
        arg0.onstalled = arg1;
    };
    imports.wbg.__wbg_set_onstalled_864510ba2a6a8a14 = function(arg0, arg1) {
        arg0.onstalled = arg1;
    };
    imports.wbg.__wbg_set_onstorage_078e638699e352a8 = function(arg0, arg1) {
        arg0.onstorage = arg1;
    };
    imports.wbg.__wbg_set_onsubmit_310b5e63f29d7500 = function(arg0, arg1) {
        arg0.onsubmit = arg1;
    };
    imports.wbg.__wbg_set_onsubmit_5d4021b8144864e1 = function(arg0, arg1) {
        arg0.onsubmit = arg1;
    };
    imports.wbg.__wbg_set_onsubmit_baa7ef93634fa0f9 = function(arg0, arg1) {
        arg0.onsubmit = arg1;
    };
    imports.wbg.__wbg_set_onsuspend_1a058878472d59e9 = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_set_onsuspend_7e4b59604733017d = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_set_onsuspend_94f9efbe2e3ca65a = function(arg0, arg1) {
        arg0.onsuspend = arg1;
    };
    imports.wbg.__wbg_set_ontimeupdate_9c3fbed8d087a574 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_set_ontimeupdate_d754b29c6252f149 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_set_ontimeupdate_dd2bcc929a26da67 = function(arg0, arg1) {
        arg0.ontimeupdate = arg1;
    };
    imports.wbg.__wbg_set_ontoggle_5644be471692c6f6 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_set_ontoggle_a43be3b4ba957475 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_set_ontoggle_fa8d36d40c06b9b7 = function(arg0, arg1) {
        arg0.ontoggle = arg1;
    };
    imports.wbg.__wbg_set_ontouchcancel_0365a24f4f633130 = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_set_ontouchcancel_16b22efc8fffa2c9 = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_set_ontouchcancel_bf035224db287f4a = function(arg0, arg1) {
        arg0.ontouchcancel = arg1;
    };
    imports.wbg.__wbg_set_ontouchend_15952172353d6b85 = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_set_ontouchend_a44c41c019636cfa = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_set_ontouchend_dd50625de998f329 = function(arg0, arg1) {
        arg0.ontouchend = arg1;
    };
    imports.wbg.__wbg_set_ontouchmove_5d747068238fb447 = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_set_ontouchmove_70721005b4b0500f = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_set_ontouchmove_c2a2a4df774f3261 = function(arg0, arg1) {
        arg0.ontouchmove = arg1;
    };
    imports.wbg.__wbg_set_ontouchstart_0270746fccc3cbd9 = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_set_ontouchstart_95d45ab7b2f16b6d = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_set_ontouchstart_9eb415d38eb3bc55 = function(arg0, arg1) {
        arg0.ontouchstart = arg1;
    };
    imports.wbg.__wbg_set_ontransitioncancel_8f4013ec81ad8c12 = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_set_ontransitioncancel_9ef499e165a6cc95 = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_set_ontransitioncancel_cb8c2b7fe38c4014 = function(arg0, arg1) {
        arg0.ontransitioncancel = arg1;
    };
    imports.wbg.__wbg_set_ontransitionend_0f1667e22ae8a4e6 = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_set_ontransitionend_a2ed1ae75ba2024f = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_set_ontransitionend_fabec7f2a5dbff84 = function(arg0, arg1) {
        arg0.ontransitionend = arg1;
    };
    imports.wbg.__wbg_set_ontransitionrun_005cfe3075178b91 = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_set_ontransitionrun_1989a3fad8da853d = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_set_ontransitionrun_1d81e737cbfb4c4f = function(arg0, arg1) {
        arg0.ontransitionrun = arg1;
    };
    imports.wbg.__wbg_set_ontransitionstart_7fe66fe6ccdc4ccf = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_set_ontransitionstart_99e6ab5cee5ea727 = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_set_ontransitionstart_cea5017e52e96b30 = function(arg0, arg1) {
        arg0.ontransitionstart = arg1;
    };
    imports.wbg.__wbg_set_onuncapturederror_5abf5ded0c5c6c5f = function(arg0, arg1) {
        arg0.onuncapturederror = arg1;
    };
    imports.wbg.__wbg_set_onunload_ddd73460b2da1574 = function(arg0, arg1) {
        arg0.onunload = arg1;
    };
    imports.wbg.__wbg_set_onvisibilitychange_c59a077051ee7c37 = function(arg0, arg1) {
        arg0.onvisibilitychange = arg1;
    };
    imports.wbg.__wbg_set_onvolumechange_76c9054b179d735c = function(arg0, arg1) {
        arg0.onvolumechange = arg1;
    };
    imports.wbg.__wbg_set_onvolumechange_cddd07fdf07c9bfd = function(arg0, arg1) {
        arg0.onvolumechange = arg1;
    };
    imports.wbg.__wbg_set_onvolumechange_e3c777f4261ae9f2 = function(arg0, arg1) {
        arg0.onvolumechange = arg1;
    };
    imports.wbg.__wbg_set_onvrdisplayactivate_a9f3f0a4b2de1aa4 = function(arg0, arg1) {
        arg0.onvrdisplayactivate = arg1;
    };
    imports.wbg.__wbg_set_onvrdisplayconnect_c6d1bd2351110d25 = function(arg0, arg1) {
        arg0.onvrdisplayconnect = arg1;
    };
    imports.wbg.__wbg_set_onvrdisplaydeactivate_a5801462305628d7 = function(arg0, arg1) {
        arg0.onvrdisplaydeactivate = arg1;
    };
    imports.wbg.__wbg_set_onvrdisplaydisconnect_fb1e5b8f2b167413 = function(arg0, arg1) {
        arg0.onvrdisplaydisconnect = arg1;
    };
    imports.wbg.__wbg_set_onvrdisplaypresentchange_5079948c66d17130 = function(arg0, arg1) {
        arg0.onvrdisplaypresentchange = arg1;
    };
    imports.wbg.__wbg_set_onwaiting_712ca673cae1d5cc = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_set_onwaiting_af89ae87ca724f67 = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_set_onwaiting_edf949297d2f1806 = function(arg0, arg1) {
        arg0.onwaiting = arg1;
    };
    imports.wbg.__wbg_set_onwaitingforkey_10661389c0443f3b = function(arg0, arg1) {
        arg0.onwaitingforkey = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationend_2766e1042c46753c = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationend_4662d48b64d39842 = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationend_ad54cdab7e2f8e2c = function(arg0, arg1) {
        arg0.onwebkitanimationend = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationiteration_27cb89258543c60d = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationiteration_5c5d0d8503f31aab = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationiteration_c377378f96bc630f = function(arg0, arg1) {
        arg0.onwebkitanimationiteration = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationstart_281c20f35fd2006e = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationstart_a84978a3e6d56775 = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_set_onwebkitanimationstart_c6107af3d7e65ca2 = function(arg0, arg1) {
        arg0.onwebkitanimationstart = arg1;
    };
    imports.wbg.__wbg_set_onwebkittransitionend_44b69ea65a3b7f4d = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_set_onwebkittransitionend_cb6c95a2d4ad18e8 = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_set_onwebkittransitionend_e5337831d710a6e8 = function(arg0, arg1) {
        arg0.onwebkittransitionend = arg1;
    };
    imports.wbg.__wbg_set_onwheel_830a351dadcaf8a7 = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_set_onwheel_94e30295a95b4099 = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_set_onwheel_c8a1ab734a4e3fcb = function(arg0, arg1) {
        arg0.onwheel = arg1;
    };
    imports.wbg.__wbg_set_opener_4451ac8fa94a7a88 = function() { return handleError(function (arg0, arg1) {
        arg0.opener = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_operation_2ad26b5d94a70e63 = function(arg0, arg1) {
        arg0.operation = __wbindgen_enum_GpuBlendOperation[arg1];
    };
    imports.wbg.__wbg_set_origin_0b50b7c9d0cd0d2b = function(arg0, arg1) {
        arg0.origin = arg1;
    };
    imports.wbg.__wbg_set_origin_142f4ec35ba3f8da = function(arg0, arg1) {
        arg0.origin = arg1;
    };
    imports.wbg.__wbg_set_origin_39cb32dbeeb0475a = function(arg0, arg1) {
        arg0.origin = arg1;
    };
    imports.wbg.__wbg_set_outerHTML_02ce2c2be49abb5a = function(arg0, arg1, arg2) {
        arg0.outerHTML = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_outerHeight_f3256e39f5dd772c = function() { return handleError(function (arg0, arg1) {
        arg0.outerHeight = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_outerWidth_1add98d1e9418646 = function() { return handleError(function (arg0, arg1) {
        arg0.outerWidth = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_pass_op_25209e5db7ec5d4b = function(arg0, arg1) {
        arg0.passOp = __wbindgen_enum_GpuStencilOperation[arg1];
    };
    imports.wbg.__wbg_set_playbackRate_e620375c958dbe36 = function(arg0, arg1) {
        arg0.playbackRate = arg1;
    };
    imports.wbg.__wbg_set_popover_94bbed8748d8ae2b = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.popover = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_set_poster_3061000c66568250 = function(arg0, arg1, arg2) {
        arg0.poster = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_power_preference_2f983dce6d983584 = function(arg0, arg1) {
        arg0.powerPreference = __wbindgen_enum_GpuPowerPreference[arg1];
    };
    imports.wbg.__wbg_set_preload_8bd7b37d44807364 = function(arg0, arg1, arg2) {
        arg0.preload = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_premultiplied_alpha_16b28d8f8575df1b = function(arg0, arg1) {
        arg0.premultipliedAlpha = arg1 !== 0;
    };
    imports.wbg.__wbg_set_primitive_cc91060b2752c577 = function(arg0, arg1) {
        arg0.primitive = arg1;
    };
    imports.wbg.__wbg_set_query_set_57ee4e9bc06075da = function(arg0, arg1) {
        arg0.querySet = arg1;
    };
    imports.wbg.__wbg_set_query_set_e258abc9e7072a65 = function(arg0, arg1) {
        arg0.querySet = arg1;
    };
    imports.wbg.__wbg_set_r_4943e4c720ff77ca = function(arg0, arg1) {
        arg0.r = arg1;
    };
    imports.wbg.__wbg_set_referrerPolicy_a6cd3103f8409b50 = function(arg0, arg1, arg2) {
        arg0.referrerPolicy = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_required_features_52447a9e50ed9b36 = function(arg0, arg1) {
        arg0.requiredFeatures = arg1;
    };
    imports.wbg.__wbg_set_required_limits_4ea3c1d31cfbb0f4 = function(arg0, arg1) {
        arg0.requiredLimits = arg1;
    };
    imports.wbg.__wbg_set_resolve_target_28603a69bca08e48 = function(arg0, arg1) {
        arg0.resolveTarget = arg1;
    };
    imports.wbg.__wbg_set_resource_0b72a17db4105dcc = function(arg0, arg1) {
        arg0.resource = arg1;
    };
    imports.wbg.__wbg_set_rows_per_image_2388f2cfec4ea946 = function(arg0, arg1) {
        arg0.rowsPerImage = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_rows_per_image_d6b2e6d0385b8e27 = function(arg0, arg1) {
        arg0.rowsPerImage = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_sample_count_1cd165278e1081cb = function(arg0, arg1) {
        arg0.sampleCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_sample_count_8b3966e653c36415 = function(arg0, arg1) {
        arg0.sampleCount = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_sample_type_5656761d1d13c084 = function(arg0, arg1) {
        arg0.sampleType = __wbindgen_enum_GpuTextureSampleType[arg1];
    };
    imports.wbg.__wbg_set_sampler_9559ad3dd242f711 = function(arg0, arg1) {
        arg0.sampler = arg1;
    };
    imports.wbg.__wbg_set_screenX_eb062c61a7b1151d = function() { return handleError(function (arg0, arg1) {
        arg0.screenX = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_screenY_a89e1aafbdd99a66 = function() { return handleError(function (arg0, arg1) {
        arg0.screenY = arg1;
    }, arguments) };
    imports.wbg.__wbg_set_scrollHeight_2da0e759c7097381 = function(arg0, arg1) {
        arg0.scrollHeight = arg1;
    };
    imports.wbg.__wbg_set_scrollLeft_b4cda859c2fa1e56 = function(arg0, arg1) {
        arg0.scrollLeft = arg1;
    };
    imports.wbg.__wbg_set_scrollTop_275615c097214d8f = function(arg0, arg1) {
        arg0.scrollTop = arg1;
    };
    imports.wbg.__wbg_set_scrollTop_541712f061a7c649 = function(arg0, arg1) {
        arg0.scrollTop = arg1;
    };
    imports.wbg.__wbg_set_selectedStyleSheetSet_406dca27188ae0fe = function(arg0, arg1, arg2) {
        arg0.selectedStyleSheetSet = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_shader_location_2ee098966925fd00 = function(arg0, arg1) {
        arg0.shaderLocation = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_size_a43ef8b3ef024e2c = function(arg0, arg1) {
        arg0.size = arg1;
    };
    imports.wbg.__wbg_set_size_d3baf773adcc6357 = function(arg0, arg1) {
        arg0.size = arg1;
    };
    imports.wbg.__wbg_set_size_fadeb2bddc7e6f67 = function(arg0, arg1) {
        arg0.size = arg1;
    };
    imports.wbg.__wbg_set_sizes_dcc2ea7c4279950a = function(arg0, arg1, arg2) {
        arg0.sizes = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_slot_02a27c8ee68324d2 = function(arg0, arg1, arg2) {
        arg0.slot = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_source_306a944060401125 = function(arg0, arg1) {
        arg0.source = arg1;
    };
    imports.wbg.__wbg_set_source_d446ffccec7cce9a = function(arg0, arg1) {
        arg0.source = arg1;
    };
    imports.wbg.__wbg_set_spellcheck_81c1c50c54d8c24d = function(arg0, arg1) {
        arg0.spellcheck = arg1 !== 0;
    };
    imports.wbg.__wbg_set_src_21adce6310a95b0d = function(arg0, arg1, arg2) {
        arg0.src = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_src_84f27c5105946dce = function(arg0, arg1, arg2) {
        arg0.src = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_src_factor_ebc4adbcb746fedc = function(arg0, arg1) {
        arg0.srcFactor = __wbindgen_enum_GpuBlendFactor[arg1];
    };
    imports.wbg.__wbg_set_srcset_d736a34f10bb646e = function(arg0, arg1, arg2) {
        arg0.srcset = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_status_5f0e61b8bdc49dc6 = function() { return handleError(function (arg0, arg1, arg2) {
        arg0.status = getStringFromWasm0(arg1, arg2);
    }, arguments) };
    imports.wbg.__wbg_set_stencil_back_51d5377faff8840b = function(arg0, arg1) {
        arg0.stencilBack = arg1;
    };
    imports.wbg.__wbg_set_stencil_clear_value_21847cbc9881e39b = function(arg0, arg1) {
        arg0.stencilClearValue = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_stencil_front_115e8b375153cc55 = function(arg0, arg1) {
        arg0.stencilFront = arg1;
    };
    imports.wbg.__wbg_set_stencil_load_op_3531e7e23b9c735e = function(arg0, arg1) {
        arg0.stencilLoadOp = __wbindgen_enum_GpuLoadOp[arg1];
    };
    imports.wbg.__wbg_set_stencil_read_mask_6022bedf9e54ec0d = function(arg0, arg1) {
        arg0.stencilReadMask = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_stencil_read_only_02efae715d872f3e = function(arg0, arg1) {
        arg0.stencilReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_set_stencil_read_only_beb27fbf4ca9b6e4 = function(arg0, arg1) {
        arg0.stencilReadOnly = arg1 !== 0;
    };
    imports.wbg.__wbg_set_stencil_store_op_7b3259ed6b9d76ca = function(arg0, arg1) {
        arg0.stencilStoreOp = __wbindgen_enum_GpuStoreOp[arg1];
    };
    imports.wbg.__wbg_set_stencil_write_mask_294d575eb0e2fd6f = function(arg0, arg1) {
        arg0.stencilWriteMask = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_step_mode_5b6d687e55df5dd0 = function(arg0, arg1) {
        arg0.stepMode = __wbindgen_enum_GpuVertexStepMode[arg1];
    };
    imports.wbg.__wbg_set_storage_texture_b2963724a23aca9b = function(arg0, arg1) {
        arg0.storageTexture = arg1;
    };
    imports.wbg.__wbg_set_store_op_e1b7633c5612534a = function(arg0, arg1) {
        arg0.storeOp = __wbindgen_enum_GpuStoreOp[arg1];
    };
    imports.wbg.__wbg_set_strip_index_format_6d0c95e2646c52d1 = function(arg0, arg1) {
        arg0.stripIndexFormat = __wbindgen_enum_GpuIndexFormat[arg1];
    };
    imports.wbg.__wbg_set_tabIndex_10b13c5f00904478 = function(arg0, arg1) {
        arg0.tabIndex = arg1;
    };
    imports.wbg.__wbg_set_targets_9f867a93d09515a9 = function(arg0, arg1) {
        arg0.targets = arg1;
    };
    imports.wbg.__wbg_set_textContent_e461237efe237e01 = function(arg0, arg1, arg2) {
        arg0.textContent = arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_texture_08516f643ed9f7ef = function(arg0, arg1) {
        arg0.texture = arg1;
    };
    imports.wbg.__wbg_set_texture_5f5d866a27cda2f3 = function(arg0, arg1) {
        arg0.texture = arg1;
    };
    imports.wbg.__wbg_set_texture_fbeffa5f2e57db49 = function(arg0, arg1) {
        arg0.texture = arg1;
    };
    imports.wbg.__wbg_set_timestamp_writes_54b499e0902d7146 = function(arg0, arg1) {
        arg0.timestampWrites = arg1;
    };
    imports.wbg.__wbg_set_timestamp_writes_94da76b5f3fee792 = function(arg0, arg1) {
        arg0.timestampWrites = arg1;
    };
    imports.wbg.__wbg_set_title_0e27e17144febf34 = function(arg0, arg1, arg2) {
        arg0.title = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_title_68ffc586125a93b4 = function(arg0, arg1, arg2) {
        arg0.title = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_tone_mapping_df4d4ade43d53040 = function(arg0, arg1) {
        arg0.toneMapping = arg1;
    };
    imports.wbg.__wbg_set_topology_0ef9190b0c51fc78 = function(arg0, arg1) {
        arg0.topology = __wbindgen_enum_GpuPrimitiveTopology[arg1];
    };
    imports.wbg.__wbg_set_type_3b563491184d1c74 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_GpuQueryType[arg1];
    };
    imports.wbg.__wbg_set_type_657cd6d704dbc037 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_GpuBufferBindingType[arg1];
    };
    imports.wbg.__wbg_set_type_c2eb2929316959f4 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_WorkerType[arg1];
    };
    imports.wbg.__wbg_set_type_c9565dd4ebe21c60 = function(arg0, arg1) {
        arg0.type = __wbindgen_enum_GpuSamplerBindingType[arg1];
    };
    imports.wbg.__wbg_set_unclipped_depth_936bc9a32a318b94 = function(arg0, arg1) {
        arg0.unclippedDepth = arg1 !== 0;
    };
    imports.wbg.__wbg_set_usage_500c45ebe8b0bbf2 = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_usage_9c6ccd6bcc15f735 = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_usage_b84e5d16af27594a = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_usage_e2790ec1205a5e27 = function(arg0, arg1) {
        arg0.usage = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_useMap_e684b2d843482853 = function(arg0, arg1, arg2) {
        arg0.useMap = getStringFromWasm0(arg1, arg2);
    };
    imports.wbg.__wbg_set_value_029389309af8006f = function(arg0, arg1) {
        arg0.value = arg1;
    };
    imports.wbg.__wbg_set_vertex_9c9752039687305f = function(arg0, arg1) {
        arg0.vertex = arg1;
    };
    imports.wbg.__wbg_set_view_5aa6ed9f881b63f2 = function(arg0, arg1) {
        arg0.view = arg1;
    };
    imports.wbg.__wbg_set_view_820375e4a740874f = function(arg0, arg1) {
        arg0.view = arg1;
    };
    imports.wbg.__wbg_set_view_dimension_6ba3ac8e6bedbcb4 = function(arg0, arg1) {
        arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    };
    imports.wbg.__wbg_set_view_dimension_95e6461d131f7086 = function(arg0, arg1) {
        arg0.viewDimension = __wbindgen_enum_GpuTextureViewDimension[arg1];
    };
    imports.wbg.__wbg_set_view_formats_6533614c7017475e = function(arg0, arg1) {
        arg0.viewFormats = arg1;
    };
    imports.wbg.__wbg_set_view_formats_ff46db459c40096d = function(arg0, arg1) {
        arg0.viewFormats = arg1;
    };
    imports.wbg.__wbg_set_visibility_deca18896989c982 = function(arg0, arg1) {
        arg0.visibility = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_volume_2b439cbbd18fd2de = function(arg0, arg1) {
        arg0.volume = arg1;
    };
    imports.wbg.__wbg_set_vspace_0670874350f4a7e4 = function(arg0, arg1) {
        arg0.vspace = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_width_07eabc802de7b030 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_width_0a22c810f06a5152 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_width_77e16cb49c1565c6 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_width_7ff7a22c6e9f423e = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_width_daafa6cc102eba07 = function(arg0, arg1) {
        arg0.width = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_write_mask_122c167c45bb2d8e = function(arg0, arg1) {
        arg0.writeMask = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_x_be1ec46ce6627cfc = function(arg0, arg1) {
        arg0.x = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_x_cc281962ce68ef00 = function(arg0, arg1) {
        arg0.x = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_xr_compatible_12b8ac0f597bc898 = function(arg0, arg1) {
        arg0.xrCompatible = arg1 !== 0;
    };
    imports.wbg.__wbg_set_y_71fc9939d0375491 = function(arg0, arg1) {
        arg0.y = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_y_7d6f1f0a01ce4000 = function(arg0, arg1) {
        arg0.y = arg1 >>> 0;
    };
    imports.wbg.__wbg_set_z_b316da2a41e7822f = function(arg0, arg1) {
        arg0.z = arg1 >>> 0;
    };
    imports.wbg.__wbg_shaderSource_8a7a30baeaf655d5 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_shaderSource_aea71cfa376fc985 = function(arg0, arg1, arg2, arg3) {
        arg0.shaderSource(arg1, getStringFromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_share_c7775ba59e443879 = function(arg0) {
        const ret = arg0.share();
        return ret;
    };
    imports.wbg.__wbg_shift_077cbb7c3051ad59 = function(arg0) {
        const ret = arg0.shift();
        return ret;
    };
    imports.wbg.__wbg_showDirectoryPicker_b1f6b2daf5b45143 = function() { return handleError(function (arg0) {
        const ret = arg0.showDirectoryPicker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_showOpenFilePicker_b1ef92150919ff5d = function() { return handleError(function (arg0) {
        const ret = arg0.showOpenFilePicker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_showPopover_453e8c0c8e0ec621 = function() { return handleError(function (arg0) {
        arg0.showPopover();
    }, arguments) };
    imports.wbg.__wbg_showSaveFilePicker_65bbe492c64b8397 = function() { return handleError(function (arg0) {
        const ret = arg0.showSaveFilePicker();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sign_16a6fb7597db40a9 = function(arg0) {
        const ret = Math.sign(arg0);
        return ret;
    };
    imports.wbg.__wbg_sin_2701f914dcda706c = function(arg0) {
        const ret = Math.sin(arg0);
        return ret;
    };
    imports.wbg.__wbg_sinh_4a5b4b65c92f5bc3 = function(arg0) {
        const ret = Math.sinh(arg0);
        return ret;
    };
    imports.wbg.__wbg_size_a91c1a0d6e36c8cd = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_aeb57b993c620133 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_beea1890c315fb17 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_d159aac101706401 = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_dc8929829fe77b9c = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_size_f754c0ae85959e6a = function(arg0) {
        const ret = arg0.size;
        return ret;
    };
    imports.wbg.__wbg_sizes_8b91b8d6dd3724cc = function(arg0, arg1) {
        const ret = arg1.sizes;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_slice_090d9281ec9725bf = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_1c4bbae5154e2f61 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_27b3dfe21d8ce752 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_3127da4c08c04a51 = function(arg0, arg1) {
        const ret = arg0.slice(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_383893c4488543bf = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_3ab25105e7277633 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_6b3e337c22d900af = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_92a3cfd340d146fe = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_96379fb00301526b = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_9e1c79edfd1b8bb2 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_a74c218cad041bcf = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_aa806386650018c6 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_b30f2b48ea4114d5 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_c7aeac4076d8df35 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_cd947dd69c20739a = function(arg0, arg1) {
        const ret = arg0.slice(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_de9eb9b7986f3a9d = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slice_e2c9a6fc7ea8ac05 = function(arg0, arg1, arg2) {
        const ret = arg0.slice(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_slot_c8640a5fc05c4b23 = function(arg0, arg1) {
        const ret = arg1.slot;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_some_8e287b011bb6d851 = function(arg0, arg1, arg2) {
        try {
            var state0 = {a: arg1, b: arg2};
            var cb0 = (arg0) => {
                const a = state0.a;
                state0.a = 0;
                try {
                    return wasm_bindgen__convert__closures_____invoke__h34c0bbd826476d09(a, state0.b, arg0);
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
    imports.wbg.__wbg_sort_d2ccb8e4648a4339 = function(arg0) {
        const ret = arg0.sort();
        return ret;
    };
    imports.wbg.__wbg_source_2b52bd3a46922a4e = function(arg0) {
        const ret = arg0.source;
        return ret;
    };
    imports.wbg.__wbg_species_1c7a09c6cf880c05 = function() {
        const ret = Symbol.species;
        return ret;
    };
    imports.wbg.__wbg_spellcheck_36302e84fe11e6f6 = function(arg0) {
        const ret = arg0.spellcheck;
        return ret;
    };
    imports.wbg.__wbg_splice_bfc96678777b1ff9 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.splice(arg1 >>> 0, arg2 >>> 0, arg3);
        return ret;
    };
    imports.wbg.__wbg_split_27da6d0f9a1d9a49 = function(arg0, arg1, arg2) {
        const ret = arg0.split(arg1, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_split_2f4188463ba102d5 = function(arg0, arg1, arg2) {
        const ret = arg0.split(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_split_b8c0f35e292cad14 = function(arg0, arg1) {
        const ret = arg0.split(arg1);
        return ret;
    };
    imports.wbg.__wbg_split_c1d80f2c42f79df3 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.split(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_split_d723edcdcc610046 = function() {
        const ret = Symbol.split;
        return ret;
    };
    imports.wbg.__wbg_sqrt_8571e640d465225b = function(arg0) {
        const ret = Math.sqrt(arg0);
        return ret;
    };
    imports.wbg.__wbg_src_4c48df3819e23be3 = function(arg0, arg1) {
        const ret = arg1.src;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_src_80dc71df0354db69 = function(arg0, arg1) {
        const ret = arg1.src;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_srcset_6fd5d9ea6146a8ee = function(arg0, arg1) {
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
    imports.wbg.__wbg_startTime_1eefde09a81bd848 = function(arg0) {
        const ret = arg0.startTime;
        return ret;
    };
    imports.wbg.__wbg_startsWith_217030fc4d7b7268 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.startsWith(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_769e6b65d6557335 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_60cf02db4de8e1c1 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_PI_cf27220a091af98a = function() {
        const ret = Math.PI;
        return ret;
    };
    imports.wbg.__wbg_static_accessor_SELF_08f5a74c69739274 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_a8924b26aa92d024 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_status_ed80c5b798663fad = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.status;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_stencilFuncSeparate_8837ff1279f2bcd8 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilFuncSeparate_b6b919cb79b36c7f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilFuncSeparate(arg1 >>> 0, arg2 >>> 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilFunc_66ed501bccae2893 = function(arg0, arg1, arg2, arg3) {
        arg0.stencilFunc(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_stencilFunc_f4ffcf82c24abd4e = function(arg0, arg1, arg2, arg3) {
        arg0.stencilFunc(arg1 >>> 0, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_stencilMaskSeparate_8780b512ad994312 = function(arg0, arg1, arg2) {
        arg0.stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_stencilMaskSeparate_fdaf7687ee443945 = function(arg0, arg1, arg2) {
        arg0.stencilMaskSeparate(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_stencilMask_729d1b04c4560c92 = function(arg0, arg1) {
        arg0.stencilMask(arg1 >>> 0);
    };
    imports.wbg.__wbg_stencilMask_8763a80561b98dde = function(arg0, arg1) {
        arg0.stencilMask(arg1 >>> 0);
    };
    imports.wbg.__wbg_stencilOpSeparate_126147c7d73a0e8e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilOpSeparate_d1770154b137259f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.stencilOpSeparate(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_stencilOp_4f975954b1eda443 = function(arg0, arg1, arg2, arg3) {
        arg0.stencilOp(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_stencilOp_b4aaefe11e36739a = function(arg0, arg1, arg2, arg3) {
        arg0.stencilOp(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_sticky_ece5c18dd587606e = function(arg0) {
        const ret = arg0.sticky;
        return ret;
    };
    imports.wbg.__wbg_stopImmediatePropagation_7a285b5c01f7be73 = function(arg0) {
        arg0.stopImmediatePropagation();
    };
    imports.wbg.__wbg_stopPropagation_611935c25ee35a3c = function(arg0) {
        arg0.stopPropagation();
    };
    imports.wbg.__wbg_stop_7fd5a12e9de3b38d = function() { return handleError(function (arg0) {
        arg0.stop();
    }, arguments) };
    imports.wbg.__wbg_store_932416533080ed43 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.store(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_store_9f60a65541866026 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.store(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_stringify_0ad9bfa360e3acc2 = function() { return handleError(function (arg0, arg1) {
        const ret = JSON.stringify(arg0, arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_stringify_56d3c6664110414f = function(arg0, arg1) {
        const ret = JSON.stringify(arg1);
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_stringify_655a6390e1f5eb6b = function() { return handleError(function (arg0) {
        const ret = JSON.stringify(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_stringify_82ffd330809cbe46 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = JSON.stringify(arg0, arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sub_90544c99478606e8 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.sub(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_sub_c15b5c81e1c0ccaa = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.sub(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_subarray_1eb5a3b436603a84 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_2f3443c5e0c12bfa = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_3f9741dcca1b9d2d = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_7eb9cb6992d27ab6 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_845f2f5bce7d061a = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_b429552d461e9f0c = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_b7e3043586baa109 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_bf415b7afb0c6e09 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_c5018e79f9f56605 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_ea6e7fd36d9fc8f1 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_subarray_f4c5c78322c90830 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_submit_3ecd36be9abeba75 = function(arg0, arg1) {
        arg0.submit(arg1);
    };
    imports.wbg.__wbg_substr_f40e18e45844d7c9 = function(arg0, arg1, arg2) {
        const ret = arg0.substr(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_substring_a0e46c4f622a2b0c = function(arg0, arg1, arg2) {
        const ret = arg0.substring(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_4ee107e747105016 = function(arg0, arg1) {
        const ret = Intl.DateTimeFormat.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_879a1ca32b095e70 = function(arg0, arg1) {
        const ret = Intl.NumberFormat.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_ae2ff04de20dc362 = function(arg0, arg1) {
        const ret = Intl.RelativeTimeFormat.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_c7b679d1e922aebf = function(arg0, arg1) {
        const ret = Intl.PluralRules.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_supportedLocalesOf_e9833db1500750fe = function(arg0, arg1) {
        const ret = Intl.Collator.supportedLocalesOf(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbg_tabIndex_4c84f93349effb32 = function(arg0) {
        const ret = arg0.tabIndex;
        return ret;
    };
    imports.wbg.__wbg_table_35754f5e3ec4c8b0 = function(arg0, arg1, arg2, arg3, arg4) {
        console.table(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_table_472229eb3e368ff3 = function(arg0) {
        console.table(...arg0);
    };
    imports.wbg.__wbg_table_5319512525f7432e = function(arg0) {
        console.table(arg0);
    };
    imports.wbg.__wbg_table_a328b818d14d2ba4 = function(arg0, arg1, arg2) {
        console.table(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_table_c63dbcadeb215ca3 = function(arg0, arg1) {
        console.table(arg0, arg1);
    };
    imports.wbg.__wbg_table_dbb37b67c4e16984 = function(arg0, arg1, arg2, arg3) {
        console.table(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_table_ddab5ef75bb96bd0 = function() {
        console.table();
    };
    imports.wbg.__wbg_table_df6405f618eea3f4 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.table(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_table_f666f22f903b1145 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.table(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_tagName_e36b1c5d14a00d3f = function(arg0, arg1) {
        const ret = arg1.tagName;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_taintEnabled_59c1d6f90968247c = function(arg0) {
        const ret = arg0.taintEnabled();
        return ret;
    };
    imports.wbg.__wbg_taintEnabled_9e74dd19682d1b82 = function(arg0) {
        const ret = arg0.taintEnabled();
        return ret;
    };
    imports.wbg.__wbg_tan_1718699250915e49 = function(arg0) {
        const ret = Math.tan(arg0);
        return ret;
    };
    imports.wbg.__wbg_tanh_b1132bd8486b911d = function(arg0) {
        const ret = Math.tanh(arg0);
        return ret;
    };
    imports.wbg.__wbg_target_0e3e05a6263c37a0 = function(arg0) {
        const ret = arg0.target;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_terminate_08a1236dd2e69da0 = function(arg0) {
        arg0.terminate();
    };
    imports.wbg.__wbg_test_3a51dd9dede1e0e3 = function(arg0, arg1, arg2) {
        const ret = arg0.test(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_texImage2D_19dd33d7944c05ba = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_1a0b03e6bd425788 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_28301405d9ebf9d3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_317c034db0c882da = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_36bb05064c149c2f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_3895d5811cf2563e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_3d2786ea23b31a1b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_423a1d867ff52cf8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_43c519614f519b5e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_47adf40a84cba019 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_5970b28c16f125f9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_6544ac8c21a7eb47 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_67a53841dec7614d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_70863867b2dea79c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_7c615b63aba32e04 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_7e4f8934bc7c493a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_8489cac247463ec1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_9626e500f8562784 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_a371a2bbdf7996cf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_a9a016745f720266 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_b4b4ff4c0ba41d3b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4 >>> 0, arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_b6ad37172fd35d82 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_bb9c87914f232f46 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texImage2D_ce9a5b14a4659aca = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getArrayU8FromWasm0(arg9, arg10), arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_d2480404caf2a35b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_d37b35cd7e971b0d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_f519f02c55e45fb0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texImage2D_f79823bf359a6de9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage2D_fcbe848b27515431 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_0c45150b4a96b45e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_0c9cf74f3c3c59fe = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_1f2658c8a3746ca5 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_240d04294efb3cfe = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10, arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_3f85175d93adca09 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_4ab35596945e1c60 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10 === 0 ? undefined : getArrayU8FromWasm0(arg10, arg11));
    }, arguments) };
    imports.wbg.__wbg_texImage3D_8fe2fb7d371b3329 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_99356922315c6f4f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, getArrayU8FromWasm0(arg10, arg11), arg12 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_b02b60ac3eaf8b98 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_bb6c14b15e8a261c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_bd111db9b4f0d35a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_c2ab46b9e608d742 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10, arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_d6f9171216dd6530 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texImage3D_eef3e15768d1c162 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8 >>> 0, arg9 >>> 0, arg10);
    }, arguments) };
    imports.wbg.__wbg_texParameterf_88270ba8c54acc9a = function(arg0, arg1, arg2, arg3) {
        arg0.texParameterf(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameterf_bd465bf5a01981d6 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameterf(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameteri_035e104616b395e0 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texParameteri_3a52bfd2ef280632 = function(arg0, arg1, arg2, arg3) {
        arg0.texParameteri(arg1 >>> 0, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_texStorage2D_21e779f76539549d = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.texStorage2D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_texStorage3D_0b08c3a68b3d128e = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.texStorage3D(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_texSubImage2D_15b5cc967fefbbcf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_1d0fac99aa0a4c55 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_1f2ed8e2272ea41a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_350bf460ab7288ed = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_3773c2a43da38847 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_38b182399f10128e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_3e1d927391e9ebcf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_49726a179482ba4b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9, arg10 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_4a81120c9c2735ca = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9 === 0 ? undefined : getArrayU8FromWasm0(arg9, arg10));
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_5b8047167681a901 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, getArrayU8FromWasm0(arg9, arg10), arg11 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_5c47d2e2373a0b37 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_63c130edd06e2e92 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_65b65c3b76d83400 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_6b92ceb1553771fc = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_7b89a7441b2a9257 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_84cc61dfbe9deac2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_876689e5a8cd1dfb = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_ae08567291d80f19 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_b324d6b2ab2f9faa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_b3a850c16797a6b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_be20511e8daed6d0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_bf3bdccb7b052e05 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_ca6a06a1f33fd125 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_cbcc04a12fb26c7e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_cd3b21de5a56c2cd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_dc6a2bd41673ac84 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_dc95b375d770251c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7 >>> 0, arg8 >>> 0, arg9);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_e1ade2d5aed8a919 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage2D_e7c1f93b1c933e74 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        arg0.texSubImage2D(arg1 >>> 0, arg2, arg3, arg4, arg5 >>> 0, arg6 >>> 0, arg7);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_3b9eb99af3f0d604 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11 === 0 ? undefined : getArrayU8FromWasm0(arg11, arg12));
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_60e409379482084f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_6bb7cb2f55724a74 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11, arg12 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_73259eb1519be1e1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11, arg12 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_78f029ad7e55ca39 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_8f019f63c38f3965 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_9f46bb4a0a79d9e3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_a86271ca5befc16d = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_af2ddc81a17c35ce = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_b7d7e8b4d082781a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_c8ef5266b92e31e0 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_da65e56061783a1b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_e878e89d319561b4 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11);
    }, arguments) };
    imports.wbg.__wbg_texSubImage3D_fefbf42bde1981d3 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10, arg11, arg12, arg13) {
        arg0.texSubImage3D(arg1 >>> 0, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9 >>> 0, arg10 >>> 0, arg11 === 0 ? undefined : getArrayU8FromWasm0(arg11, arg12), arg13 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_textContent_8083fbe3416e42c7 = function(arg0, arg1) {
        const ret = arg1.textContent;
        var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_then_429f7caf1026411d = function(arg0, arg1, arg2) {
        const ret = arg0.then(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_then_4f95312d68691235 = function(arg0, arg1) {
        const ret = arg0.then(arg1);
        return ret;
    };
    imports.wbg.__wbg_throw_b8b9c661ad3ec032 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.throw(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_timeEnd_46ed224117e5f2d2 = function(arg0, arg1) {
        console.timeEnd(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_timeEnd_bdc2ebf40d99aee4 = function() {
        console.timeEnd();
    };
    imports.wbg.__wbg_timeLog_0694963d0bb4025c = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6, arg7, arg8);
    };
    imports.wbg.__wbg_timeLog_1318e3a10a082c3e = function() {
        console.timeLog();
    };
    imports.wbg.__wbg_timeLog_1f336993221b0818 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6, arg7);
    };
    imports.wbg.__wbg_timeLog_4120d0a5e3b47110 = function(arg0, arg1, arg2, arg3) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3);
    };
    imports.wbg.__wbg_timeLog_5434a03ee8159f77 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_timeLog_687ba033a98ade77 = function(arg0, arg1) {
        console.timeLog(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_timeLog_76c503911eea2c4b = function(arg0, arg1, arg2) {
        console.timeLog(getStringFromWasm0(arg0, arg1), ...arg2);
    };
    imports.wbg.__wbg_timeLog_a13b0d004a0e9c9e = function(arg0, arg1, arg2) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2);
    };
    imports.wbg.__wbg_timeLog_d5b17f937fd4deb1 = function(arg0, arg1, arg2, arg3, arg4) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4);
    };
    imports.wbg.__wbg_timeLog_ef72d4f0299f0bf6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.timeLog(getStringFromWasm0(arg0, arg1), arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_timeOrigin_95e84025402e6aa7 = function(arg0) {
        const ret = arg0.timeOrigin;
        return ret;
    };
    imports.wbg.__wbg_timeStamp_247ca24aecb3849b = function(arg0) {
        console.timeStamp(arg0);
    };
    imports.wbg.__wbg_timeStamp_91e11780a2f0df93 = function(arg0) {
        const ret = arg0.timeStamp;
        return ret;
    };
    imports.wbg.__wbg_timeStamp_fad034c9bd802ea8 = function() {
        console.timeStamp();
    };
    imports.wbg.__wbg_time_7d92b199d217b3ec = function() {
        console.time();
    };
    imports.wbg.__wbg_time_c49415b636fbbf3f = function(arg0, arg1) {
        console.time(getStringFromWasm0(arg0, arg1));
    };
    imports.wbg.__wbg_timestamp_3289032ebe7bffe4 = function(arg0, arg1) {
        const ret = arg1.timestamp;
        getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
    };
    imports.wbg.__wbg_title_5d690018366cff56 = function(arg0, arg1) {
        const ret = arg1.title;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_title_84b970bbd0c66838 = function(arg0, arg1) {
        const ret = arg1.title;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_toBlob_8e0d279e688339bb = function() { return handleError(function (arg0, arg1) {
        arg0.toBlob(arg1);
    }, arguments) };
    imports.wbg.__wbg_toBlob_955ee1d57dd87e4c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.toBlob(arg1, getStringFromWasm0(arg2, arg3), arg4);
    }, arguments) };
    imports.wbg.__wbg_toBlob_b5fc679e8f016759 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.toBlob(arg1, getStringFromWasm0(arg2, arg3));
    }, arguments) };
    imports.wbg.__wbg_toDataURL_0e3da1a2eb93763f = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.toDataURL();
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_toDataURL_9772ddfe7481029c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = arg1.toDataURL(getStringFromWasm0(arg2, arg3), arg4);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_toDataURL_ea17c70915698d48 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg1.toDataURL(getStringFromWasm0(arg2, arg3));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_toDateString_28166ab8736b80ba = function(arg0) {
        const ret = arg0.toDateString();
        return ret;
    };
    imports.wbg.__wbg_toExponential_21d565d4119880f0 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toExponential(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toFixed_5ca077abe2980cca = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toFixed(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toISOString_eca15cbe422eeea5 = function(arg0) {
        const ret = arg0.toISOString();
        return ret;
    };
    imports.wbg.__wbg_toJSON_0ab8532cd8d90702 = function(arg0) {
        const ret = arg0.toJSON();
        return ret;
    };
    imports.wbg.__wbg_toJSON_db8533c8df5e52b4 = function(arg0) {
        const ret = arg0.toJSON();
        return ret;
    };
    imports.wbg.__wbg_toJSON_f8f74de58ee8cd8e = function(arg0) {
        const ret = arg0.toJSON();
        return ret;
    };
    imports.wbg.__wbg_toLocaleDateString_5397fc287e55e800 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.toLocaleDateString(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_toLocaleLowerCase_45c50e93075ed5b6 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleLowerCase(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_36c5c0c1367ffc85 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleString(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_37758d4840ea4c89 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleString(arg1, arg2);
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_487d7583d7f60723 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleString(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_b5a738a75509e89a = function(arg0) {
        const ret = arg0.toLocaleString();
        return ret;
    };
    imports.wbg.__wbg_toLocaleString_e8c08307ff33156d = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.toLocaleString(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_toLocaleTimeString_2028ee3aeca29227 = function(arg0, arg1, arg2, arg3) {
        const ret = arg0.toLocaleTimeString(getStringFromWasm0(arg1, arg2), arg3);
        return ret;
    };
    imports.wbg.__wbg_toLocaleTimeString_21691a146123e19b = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleTimeString(getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLocaleUpperCase_1c49c7030a520999 = function(arg0, arg1, arg2) {
        const ret = arg0.toLocaleUpperCase(arg1 === 0 ? undefined : getStringFromWasm0(arg1, arg2));
        return ret;
    };
    imports.wbg.__wbg_toLowerCase_84e033d301b0158e = function(arg0) {
        const ret = arg0.toLowerCase();
        return ret;
    };
    imports.wbg.__wbg_toPrecision_d996d699753196f6 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toPrecision(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toPrimitive_89079ddf49aab413 = function() {
        const ret = Symbol.toPrimitive;
        return ret;
    };
    imports.wbg.__wbg_toStringTag_634c06c7bac3c35b = function() {
        const ret = Symbol.toStringTag;
        return ret;
    };
    imports.wbg.__wbg_toString_14b47ee7542a49ef = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_3086ecd5db6cffe1 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_42914f2ae774fcf8 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toString(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toString_49326ce0cb2d58c4 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.toString(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toString_6cc877eb81a0cf57 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_81f6a7a85665e0b2 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_99815908ae93d7d1 = function(arg0, arg1, arg2) {
        const ret = arg1.toString(arg2);
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_toString_b9e18d873c0186a9 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_efde9823d9b01c74 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_f07112df359c997f = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toString_f5d9d266c0cd9498 = function(arg0) {
        const ret = arg0.toString();
        return ret;
    };
    imports.wbg.__wbg_toTimeString_8d2c5f8f92a589bf = function(arg0) {
        const ret = arg0.toTimeString();
        return ret;
    };
    imports.wbg.__wbg_toUTCString_abd91fb107b3ef97 = function(arg0) {
        const ret = arg0.toUTCString();
        return ret;
    };
    imports.wbg.__wbg_toUpperCase_2c685a45c493360a = function(arg0) {
        const ret = arg0.toUpperCase();
        return ret;
    };
    imports.wbg.__wbg_toggleAttribute_1f6c5a5400f9f6b9 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = arg0.toggleAttribute(getStringFromWasm0(arg1, arg2), arg3 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_toggleAttribute_61e6909f3ef171e1 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.toggleAttribute(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_togglePopover_7cb9cc14c3417ead = function() { return handleError(function (arg0) {
        const ret = arg0.togglePopover();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_togglePopover_b768e3e11b0dc8a7 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.togglePopover(arg1 !== 0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_top_432667f8c72f69a2 = function() { return handleError(function (arg0) {
        const ret = arg0.top;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    }, arguments) };
    imports.wbg.__wbg_trace_01ab374ed11d02da = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.trace(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_trace_03dfeba8d134bed1 = function(arg0, arg1, arg2, arg3, arg4) {
        console.trace(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_trace_056716a95bc693a0 = function(arg0, arg1, arg2) {
        console.trace(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_trace_1b90bb18747ed0f7 = function(arg0, arg1, arg2, arg3) {
        console.trace(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_trace_2515ab7f71ba5375 = function(arg0) {
        console.trace(arg0);
    };
    imports.wbg.__wbg_trace_704b3ddae1d88244 = function() {
        console.trace();
    };
    imports.wbg.__wbg_trace_b213249bfc587469 = function(arg0) {
        console.trace(...arg0);
    };
    imports.wbg.__wbg_trace_ce1e919efe147969 = function(arg0, arg1) {
        console.trace(arg0, arg1);
    };
    imports.wbg.__wbg_trace_da86c3fa84d26ecb = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.trace(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_transferControlToOffscreen_fe35c7385639d202 = function() { return handleError(function (arg0) {
        const ret = arg0.transferControlToOffscreen();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_transferToImageBitmap_7048556ff33da7ed = function() { return handleError(function (arg0) {
        const ret = arg0.transferToImageBitmap();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_transformFeedbackVaryings_432d71688ac00160 = function(arg0, arg1, arg2, arg3) {
        arg0.transformFeedbackVaryings(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_trimEnd_e0e4f631102e78cb = function(arg0) {
        const ret = arg0.trimEnd();
        return ret;
    };
    imports.wbg.__wbg_trimLeft_46af8f77ef8028b1 = function(arg0) {
        const ret = arg0.trimLeft();
        return ret;
    };
    imports.wbg.__wbg_trimRight_b7a655b7e2a9903e = function(arg0) {
        const ret = arg0.trimRight();
        return ret;
    };
    imports.wbg.__wbg_trimStart_52ac31576b4cb1f7 = function(arg0) {
        const ret = arg0.trimStart();
        return ret;
    };
    imports.wbg.__wbg_trim_0b5cfb7c82eaaf24 = function(arg0) {
        const ret = arg0.trim();
        return ret;
    };
    imports.wbg.__wbg_trunc_c624a2c40f9e605f = function(arg0) {
        const ret = Math.trunc(arg0);
        return ret;
    };
    imports.wbg.__wbg_type_3f8f12fe0499db3a = function(arg0) {
        const ret = arg0.type;
        return (__wbindgen_enum_GpuQueryType.indexOf(ret) + 1 || 3) - 1;
    };
    imports.wbg.__wbg_type_4bea23a78318af32 = function(arg0, arg1) {
        const ret = arg1.type;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_type_98756b54d17daf1c = function(arg0) {
        const ret = arg0.type;
        return (__wbindgen_enum_GpuCompilationMessageType.indexOf(ret) + 1 || 4) - 1;
    };
    imports.wbg.__wbg_type_f26b0d983c529ba1 = function(arg0) {
        const ret = arg0.type;
        return ret;
    };
    imports.wbg.__wbg_unconfigure_b06b7982d5215681 = function(arg0) {
        arg0.unconfigure();
    };
    imports.wbg.__wbg_unescape_21ac6d7cd410b1b1 = function(arg0, arg1) {
        const ret = unescape(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_unicode_2794242afcacc2f9 = function(arg0) {
        const ret = arg0.unicode;
        return ret;
    };
    imports.wbg.__wbg_uniform1f_058417475b9966c8 = function(arg0, arg1, arg2) {
        arg0.uniform1f(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1f_b47da9590d2c2cf1 = function(arg0, arg1, arg2) {
        arg0.uniform1f(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_0b3aabaf6067bd60 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1fv_1a40304e8039c976 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_2b0e205d2a0cd0f9 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_2ec73b74e5d0ccab = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_34af570a79ed6b44 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_4691da1cb999d715 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_491f95f79e208e18 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_975f6b26e8f1d009 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1fv_a643562d19094d2e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_daaf71e10baec7b0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1fv_f040e4972d32c99d = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1fv_fb4eb71f02cc9067 = function(arg0, arg1, arg2) {
        arg0.uniform1fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1i_85131b7388bc8e3f = function(arg0, arg1, arg2) {
        arg0.uniform1i(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1i_e48736e68cd30ed1 = function(arg0, arg1, arg2) {
        arg0.uniform1i(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_04726d33724ccfdd = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_07fa30810aee6423 = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_089d5b683b50781f = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1iv_197d27aeb3d72d39 = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_70acb72b89f3b307 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_91d202b878e5499f = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_95d4e54bca077dcc = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1iv_9a703b165e99222b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_9f5a5e1cd80ac2d5 = function(arg0, arg1, arg2) {
        arg0.uniform1iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1iv_a1cbe026351ce709 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_b72f56367eb8c25a = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1iv_ca9e3ff2fcad9544 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1ui_03b9da58a76f91cf = function(arg0, arg1, arg2) {
        arg0.uniform1ui(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_09809637bcd41c23 = function(arg0, arg1, arg2) {
        arg0.uniform1uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1uiv_181719e8c4c3636b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_4b7bfbd3098956b0 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_5c48277180fcb391 = function(arg0, arg1, arg2) {
        arg0.uniform1uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform1uiv_90a30aa2a15b4fef = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform1uiv_aae657aa49d3b6fe = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_c780b82b3eda5c3b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_c83ae67d0a5f1d02 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform1uiv_d463fdd2670b9056 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform1uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2f_191d769606542c31 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2f(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2f_d0f7977f54aed068 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2f(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2fv_1fb3d40454237ba5 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_27fc95dace3772d8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_414a540b3027b18e = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_4f5fbe975462f7af = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_708680e0e9752754 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_8081759845516404 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_908e28848891e2bf = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2fv_9602f31ff99571c1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2fv_b3b15c9d8d8f1648 = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_d8cbecb4ba30380e = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_dff996a915026eb7 = function(arg0, arg1, arg2) {
        arg0.uniform2fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2fv_e8273ae0eb56fd9b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2i_09cfee35cc12c042 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2i(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2i_735de9f68404e378 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2i(arg1, arg2, arg3);
    };
    imports.wbg.__wbg_uniform2iv_3f71696540a8b2ea = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2iv_4205f90c68d843c3 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_530bc7350d2d8397 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_5a256eb12e79bf15 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_871d40a31a834512 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_8d64bb02ab86bd99 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_92375569687134ea = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_a0cc429953135311 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2iv_cb5905352e456d71 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2iv_e34ddbab861093e6 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_e94b935f879098e0 = function(arg0, arg1, arg2) {
        arg0.uniform2iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2iv_ff5db12ac7905013 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2ui_427e10cdbe1cd2f1 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2ui(arg1, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_093ef666e6ce3d91 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_19b3eed374dff41e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_32b1c565589f6c67 = function(arg0, arg1, arg2) {
        arg0.uniform2uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2uiv_4b2e0371b5bded39 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_65e0ce7711977996 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_8b142338906d7ff5 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform2uiv_d13ecb6185814e85 = function(arg0, arg1, arg2) {
        arg0.uniform2uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform2uiv_d310a5224c56a344 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform2uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform2uiv_d4ad7d27b02963b1 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform2uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3f_104354cf7ab15e8a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3f(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3f_dd2e42055b857ce7 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3f(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3fv_36f10be5eefdceb4 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_497413683a4e3b86 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_6ff1446ea7a2fb82 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_7ac34eaf25baf062 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_7e8f2681adc8f92d = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_aa655890f3512e6b = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_affc144702d476f0 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_b289ebff84984911 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_e0361ac5c63ab909 = function(arg0, arg1, arg2) {
        arg0.uniform3fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3fv_e58ff84eca16cad5 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3fv_e8268c205fefebc8 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3fv_ea610a4cf2b5d069 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3i_235de35c9b57bfe7 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3i(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3i_54e90bb0815289a8 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3i(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_uniform3iv_1251d491b7e58e2f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_2281a5688653493b = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_32e0a31857a4ff4e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_41452e1c0384ddce = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_429dcf702f1580b2 = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_624ea88531cdde63 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3iv_62f987f80e32bd23 = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_701bc6a450548735 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_8de8ccf0d65c2f7a = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3iv_a0412efc30e8de62 = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_a913682bf4dd917e = function(arg0, arg1, arg2) {
        arg0.uniform3iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3iv_afc54662b2809357 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform3ui_27bbb0fa552a44a7 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3ui(arg1, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_3bef7c553260ca4d = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_3c877e6c18e5f54e = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_4b08872c9a04c0b6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_5538e58088f086bf = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_69a5451419d98706 = function(arg0, arg1, arg2) {
        arg0.uniform3uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3uiv_804d13622cd94683 = function(arg0, arg1, arg2) {
        arg0.uniform3uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform3uiv_c05a569a86615dda = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_e0267235b805ee72 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform3uiv_ff68240586289823 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform3uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4f_1e4aad4d202f9f6c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4f_f0ae29c4c1eb79e0 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4f(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4fv_0a60e0897889f0be = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_2521ae2ffe6e215c = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4fv_520777d1c330aec3 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_5660b247b5947035 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_6a430f6ad65fcfe7 = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_7791cd1f420d1965 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_7ca221c6f4bd316f = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_9913dec8e48633d9 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4fv_cd085a4a789daeee = function(arg0, arg1, arg2) {
        arg0.uniform4fv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4fv_cf9d1216d9bbf8b6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_d476d8ca7a38d094 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4fv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4fv_dcee98875be357d8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4fv(arg1, getArrayF32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4i_5510c815d51cb29b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4i(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4i_a1ea9ab7a23d00e8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4i(arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_uniform4iv_30ec914363534122 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_60372f5c71c6f86e = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_6b56eb67296f9e26 = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_6d0331d24af48aea = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4iv_6d904c97874a180e = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_6f8da7990b4ff0f0 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_9599c397865e660b = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_9e38dad2e14636c0 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4iv_ab2cdcf4cf4a53e0 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_ce312aa3e3884d51 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4iv_d524964094c494f9 = function(arg0, arg1, arg2) {
        arg0.uniform4iv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4iv_f9ba7e9c4ac6d833 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4iv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4ui_52c9ac028208ffff = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4ui(arg1, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_0c4736d0e488eaaa = function(arg0, arg1, arg2) {
        arg0.uniform4uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniform4uiv_449d366aba3b4e2f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_766efbfa63685f92 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_uniform4uiv_79fc3e6be54c97be = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_7a62ec55c340b704 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniform4uiv(arg1, getArrayU32FromWasm0(arg2, arg3), arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_97b7ea888f486137 = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_b7b399a85db81717 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_bcf5bac4d336b66c = function(arg0, arg1, arg2, arg3) {
        arg0.uniform4uiv(arg1, arg2, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniform4uiv_c41011800f5f9522 = function(arg0, arg1, arg2) {
        arg0.uniform4uiv(arg1, arg2);
    };
    imports.wbg.__wbg_uniformBlockBinding_83eb9ed3f1189da9 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformBlockBinding(arg1, arg2 >>> 0, arg3 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_0d85645c2931fe0b = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_13787967d812a489 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2fv_14cba63d928d4dcb = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_178cfc7505a783f9 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_272d33be42e56cd6 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_3abc228a4dc657e8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_7764f7f44a5189b0 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2fv_86b2c9c45df941ce = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_90702a9a8694e69b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2fv_9b7b01ac16090ec0 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_d984e711e06445cb = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2fv_ea952de104151cba = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_0b94d10c35603bba = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_0ecb4102d9a28ccf = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_162f3c3cf34f825a = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_26f2df76f8031fdd = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_555675e668447883 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_580f698d9e0ab94b = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_d47110935f2fe03b = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_e145114f76210e27 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x3fv_f0dad33c79231b14 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_0a6210bb4db75162 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_230c3f13f6f91c36 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_3201dbba820ee7e7 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_9a0acc14216cbb0c = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_c11cac98bdf0e214 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_c14a9144c2f5cbd1 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_c5723945a331b236 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_dc8e83595bd2726c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix2x4fv_ec79a21441002c77 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix2x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_05b4ee88ec3207c1 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_2184bc82ceb9264f = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_282fde7c3164ac06 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_3b2ed3a816d45543 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3fv_7385f7e4a0d6ff04 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_74557a3f2a891c8c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_8808f670ddda5614 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_d56e6e2077f2f251 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_d765ff32eca3f5b5 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_db950e4fb1dabfdd = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3fv_dbeeb6ca3e16a461 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3fv_eb9d7317ce9cb6b5 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_08ad2a6d4ce48b22 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_0f8171c18af6a65b = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_11d50f0b78d73578 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_307bc225810da1f9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_3eeb4d86470b6a83 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_90c0f5c7e15a4116 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_a4f912a3c04871bf = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_a89ba9b43ca3d433 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x2fv_ba6bb644cea44710 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_21cfc220d781c054 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_2d84e01b77d01d68 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_62493488910f6791 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_7dddaa94b9b45994 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_8e523edb9df356a2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_a78caffb62d235c9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_b0a8dac9eab44628 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_bf38658e194b6509 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix3x4fv_eb937b60821534c2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix3x4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_0831a23da69002e6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_13aed120d325f82d = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_3795d34d258275f7 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_503b83d7d614c7b3 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_54fea58f845bbc0e = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_607ff035f8ffd9cd = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_62e9aaf2b4268690 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4fv_62eb369afce41dcc = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_7dd2816c32b68a12 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4fv_ba6edd7013e241c5 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_bcef71bb70f636cf = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4fv_bd2116c8b861f726 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_2058512310743564 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_29bdbe6b683b4eeb = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_37d292560c9500dd = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_6347fd8c8325e3cf = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_692f10b2150c1ef9 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_993246ee26413a22 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_a22a8418c2e2e131 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_c2145a33b4f70d66 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x2fv_f3619b9d7a434f15 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix4x2fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_08d9e07285e5d741 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_1fdb3436983d0ce6 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_2d6384478369aa16 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_45f7b122755e52e6 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4));
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_63e95b8856f41a35 = function(arg0, arg1, arg2, arg3) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_7b68dc57ae02a298 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_8759350c5f582efa = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_a6166e6ddcaa3fe2 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, getArrayF32FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    };
    imports.wbg.__wbg_uniformMatrix4x3fv_ee34dac517063001 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.uniformMatrix4x3fv(arg1, arg2 !== 0, arg3, arg4 >>> 0);
    };
    imports.wbg.__wbg_unmap_2903d5b193373f12 = function(arg0) {
        arg0.unmap();
    };
    imports.wbg.__wbg_unscopables_c662ad04680b5b35 = function() {
        const ret = Symbol.unscopables;
        return ret;
    };
    imports.wbg.__wbg_unshift_663583d1e06a5041 = function(arg0, arg1) {
        const ret = arg0.unshift(arg1);
        return ret;
    };
    imports.wbg.__wbg_usage_7b00ab14a235fa77 = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_usage_8386e9868095af0e = function(arg0) {
        const ret = arg0.usage;
        return ret;
    };
    imports.wbg.__wbg_useMap_a53450ef98021bdc = function(arg0, arg1) {
        const ret = arg1.useMap;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_useProgram_142dd02d095f80f1 = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_useProgram_4632a62f19deea67 = function(arg0, arg1) {
        arg0.useProgram(arg1);
    };
    imports.wbg.__wbg_userAgent_40dbb4d1f6fcb9f5 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.userAgent;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_userAgent_e18bc0cc9ad38ec1 = function() { return handleError(function (arg0, arg1) {
        const ret = arg1.userAgent;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    }, arguments) };
    imports.wbg.__wbg_validateProgram_d3b4874e5270e90a = function(arg0, arg1) {
        arg0.validateProgram(arg1);
    };
    imports.wbg.__wbg_validateProgram_d6f314905e0629f0 = function(arg0, arg1) {
        arg0.validateProgram(arg1);
    };
    imports.wbg.__wbg_validate_6a37e4edc7bba965 = function() { return handleError(function (arg0) {
        const ret = WebAssembly.validate(arg0);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_valueOf_1024b255fe545c31 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_17c63ed1b225597a = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_38b067ada369109c = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_5c7d3330710b697b = function(arg0, arg1) {
        const ret = arg0.valueOf(arg1);
        return ret;
    };
    imports.wbg.__wbg_valueOf_663ea9f1ad0d6eda = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_92f27cb37829e899 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_valueOf_c9742a3cff30fad7 = function(arg0) {
        const ret = arg0.valueOf();
        return ret;
    };
    imports.wbg.__wbg_value_57b7b035e117f7ee = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_value_d90ca81e8311c834 = function(arg0) {
        const ret = arg0.value;
        return ret;
    };
    imports.wbg.__wbg_values_1ad28fccb59aff05 = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_5122b02db5686076 = function(arg0) {
        const ret = Object.values(arg0);
        return ret;
    };
    imports.wbg.__wbg_values_618a32d667a285f8 = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_9152c8c1ab032dfa = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_9bdd87ddc51233e1 = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_b3c8a4a34344ba1a = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_values_d432fbf9bf270fef = function(arg0) {
        const ret = arg0.values();
        return ret;
    };
    imports.wbg.__wbg_vendor_390866512dd7820a = function(arg0, arg1) {
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
    imports.wbg.__wbg_vertexAttrib1f_3cef4a3c53186329 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1f(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1f_4d154a034c7d7a1c = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1f(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_2c431e2130ada1b2 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_57c78ea6a586dbac = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_6ec054bfa041d2ce = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_8867fe6462044f4d = function(arg0, arg1, arg2) {
        arg0.vertexAttrib1fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib1fv_a0761f0624cb067e = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib1fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib1fv_ed12733673335a32 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib1fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib2f_82c377c40c716214 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2f(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_vertexAttrib2f_ef79c4d24dfbca44 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2f(arg1 >>> 0, arg2, arg3);
    };
    imports.wbg.__wbg_vertexAttrib2fv_2b0576dbcb0cb740 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_323f3f355027e5ba = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_3395b00fd9507ec7 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_392d2463a14637e4 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib2fv_45377a7b1bbfe7fe = function(arg0, arg1, arg2) {
        arg0.vertexAttrib2fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib2fv_83233d64d11e51c1 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib2fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib3f_230fee086eac5e00 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.vertexAttrib3f(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_vertexAttrib3f_29b6f747c5579372 = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.vertexAttrib3f(arg1 >>> 0, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_vertexAttrib3fv_02df2c66278056de = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib3fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib3fv_1a30c8185a5205bf = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3fv_390facc4020e80ee = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3fv_9619aada4e994f4e = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib3fv_b5dde5bcf4c8b36e = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib3fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib3fv_cef03284eb54fac2 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib3fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4f_b3fd269eecee5069 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttrib4f(arg1 >>> 0, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttrib4f_ee20f53eb2c4cad8 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttrib4f(arg1 >>> 0, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttrib4fv_00f5a997c719ed61 = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4fv_1373358a3a8ea34f = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib4fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib4fv_4c82cff2ec53aecc = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4fv_a962a7f41dd33562 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttrib4fv(arg1 >>> 0, getArrayF32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttrib4fv_c6893826356d812d = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttrib4fv_e5c1167c0ba7bf8a = function(arg0, arg1, arg2) {
        arg0.vertexAttrib4fv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribDivisorANGLE_0797a329758e2a28 = function(arg0, arg1, arg2) {
        arg0.vertexAttribDivisorANGLE(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribDivisor_4f37e0f7c1197d16 = function(arg0, arg1, arg2) {
        arg0.vertexAttribDivisor(arg1 >>> 0, arg2 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribI4i_a316c13478f5046c = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribI4i(arg1 >>> 0, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttribI4iv_5145937de50c881c = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttribI4iv(arg1 >>> 0, getArrayI32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttribI4iv_d6db960fc15eec3e = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4iv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribI4iv_ffabb68db303c0f7 = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4iv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribI4ui_15a37d6bc220b359 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribI4ui(arg1 >>> 0, arg2 >>> 0, arg3 >>> 0, arg4 >>> 0, arg5 >>> 0);
    };
    imports.wbg.__wbg_vertexAttribI4uiv_3e8c76e603ee993f = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4uiv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribI4uiv_5bb78d745a1d8e55 = function(arg0, arg1, arg2, arg3) {
        arg0.vertexAttribI4uiv(arg1 >>> 0, getArrayU32FromWasm0(arg2, arg3));
    };
    imports.wbg.__wbg_vertexAttribI4uiv_d220d89294943fd4 = function(arg0, arg1, arg2) {
        arg0.vertexAttribI4uiv(arg1 >>> 0, arg2);
    };
    imports.wbg.__wbg_vertexAttribIPointer_79f5e6a1baa95ae2 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttribIPointer_87d7fcce484093c9 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.vertexAttribIPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4, arg5);
    };
    imports.wbg.__wbg_vertexAttribPointer_5a199b6a54af5748 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_5c516f4c675103bf = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_880223685613a791 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vertexAttribPointer_8a839a27e9382ddd = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.vertexAttribPointer(arg1 >>> 0, arg2, arg3 >>> 0, arg4 !== 0, arg5, arg6);
    };
    imports.wbg.__wbg_vibrate_7e23292d4b913d3c = function(arg0, arg1) {
        const ret = arg0.vibrate(arg1 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_vibrate_dffe3458763ff1a8 = function(arg0, arg1) {
        const ret = arg0.vibrate(arg1);
        return ret;
    };
    imports.wbg.__wbg_videoHeight_5a251e5cd2cd8ea8 = function(arg0) {
        const ret = arg0.videoHeight;
        return ret;
    };
    imports.wbg.__wbg_videoWidth_8fb6bad8e52949c8 = function(arg0) {
        const ret = arg0.videoWidth;
        return ret;
    };
    imports.wbg.__wbg_viewport_1b0f7b63c424b52f = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_viewport_ceaa5c1a061b76df = function(arg0, arg1, arg2, arg3, arg4) {
        arg0.viewport(arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_volume_03402f6d00ff2ded = function(arg0) {
        const ret = arg0.volume;
        return ret;
    };
    imports.wbg.__wbg_vspace_af025b5a32df4b6b = function(arg0) {
        const ret = arg0.vspace;
        return ret;
    };
    imports.wbg.__wbg_waitAsync_61d1afcf649a57e8 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitAsync_96350928218f329d = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitAsync_996175c9b558e2a4 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitAsync_ef2b0b046a5181bc = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.waitAsync(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_waitSync_7bf51ba7e6f91aba = function(arg0, arg1, arg2, arg3) {
        arg0.waitSync(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_waitSync_81c48cf4939ee5e7 = function(arg0, arg1, arg2, arg3) {
        arg0.waitSync(arg1, arg2 >>> 0, arg3);
    };
    imports.wbg.__wbg_wait_3bab3584505b2d90 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_9613d1a278bb8a97 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_98b423cf7b013ab6 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wait_ceb109d0011d6567 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = Atomics.wait(arg0, arg1 >>> 0, arg2, arg3);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_warn_14a9fd75d0abe5d7 = function(arg0) {
        console.warn(...arg0);
    };
    imports.wbg.__wbg_warn_165ef4f6bcfc05e7 = function(arg0, arg1, arg2, arg3) {
        console.warn(arg0, arg1, arg2, arg3);
    };
    imports.wbg.__wbg_warn_6e567d0d926ff881 = function(arg0) {
        console.warn(arg0);
    };
    imports.wbg.__wbg_warn_8b6740f2b8081f9f = function(arg0, arg1, arg2, arg3, arg4) {
        console.warn(arg0, arg1, arg2, arg3, arg4);
    };
    imports.wbg.__wbg_warn_989bed09a6035762 = function(arg0, arg1, arg2) {
        console.warn(arg0, arg1, arg2);
    };
    imports.wbg.__wbg_warn_aa97f91deb2806aa = function(arg0, arg1) {
        console.warn(arg0, arg1);
    };
    imports.wbg.__wbg_warn_b8be50386f743ce1 = function(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        console.warn(arg0, arg1, arg2, arg3, arg4, arg5, arg6);
    };
    imports.wbg.__wbg_warn_bafa638697107787 = function(arg0, arg1, arg2, arg3, arg4, arg5) {
        console.warn(arg0, arg1, arg2, arg3, arg4, arg5);
    };
    imports.wbg.__wbg_warn_dd465956a521e6fd = function() {
        console.warn();
    };
    imports.wbg.__wbg_wasmgpuselector_new = function(arg0) {
        const ret = WasmGpuSelector.__wrap(arg0);
        return ret;
    };
    imports.wbg.__wbg_webkitMatchesSelector_e323c1e97595335d = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.webkitMatchesSelector(getStringFromWasm0(arg1, arg2));
        return ret;
    }, arguments) };
    imports.wbg.__wbg_wgslLanguageFeatures_573953bc7ddeb467 = function(arg0) {
        const ret = arg0.wgslLanguageFeatures;
        return ret;
    };
    imports.wbg.__wbg_width_73a6511a2370c184 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_9ab139dc647aa315 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_b3ccec7cffad7d46 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_dd0cfe94d42f5143 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_e14768b034fbe406 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_e4c34297a471a380 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_width_f13d2e86324fc226 = function(arg0) {
        const ret = arg0.width;
        return ret;
    };
    imports.wbg.__wbg_window_a782b194486157e5 = function() { return handleError(function () {
        const ret = globalThis.window();
        return ret;
    }, arguments) };
    imports.wbg.__wbg_window_ccafac8afa5f4cec = function(arg0) {
        const ret = arg0.window;
        return ret;
    };
    imports.wbg.__wbg_writeBuffer_009c9a53780daefd = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_07458c24bc397c7b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_0bc786585bf0a0ea = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_1584f79dd0fb5eda = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_1897edb8e6677e9a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_1b488f06f2ea23d9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_213ee85718fba936 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_34887db91a2b2861 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_3d408c828ad37fa7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_46f679f805ff19e3 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_4888035a3a3048da = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_4f6f1b8c30b4373b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_598872cd3487b49f = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_5a0b40b9f8598a88 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_5c6c1da82f1d89b1 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_5ed8ccaea6bf0d0d = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_636f9880f90c5a7b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_6382a7a7f92c5eaa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_70a21ba100a4f631 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_7c5e09a741bbb010 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_80176b0702e482f7 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_85d9a40fc34bdb13 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_8edb1ec074970760 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_95784f2f3cc214e8 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_9832c6f97c6deb36 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_9914a4b37b7779a4 = function() { return handleError(function (arg0, arg1, arg2, arg3) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_9cf055c32d519385 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_9efc19fe988c6fac = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_a8384bab40f3f468 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4));
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_a9f96fe8ef7eed0e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_ab96dce3a2ac95fa = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_ae34794a6bfb017b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_b53239b61f81260b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4 >>> 0, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_b9535c63f37d3eb2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_be2b4c35ac86a10b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_cc461e5113740dc9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_d3206916e8b091b2 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_de1fd111643d9c6a = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_e0fd512291b8901e = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, getArrayU8FromWasm0(arg3, arg4), arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_e29834dec0ed3ed9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
        arg0.writeBuffer(arg1, arg2, getArrayU8FromWasm0(arg3, arg4), arg5, arg6);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_e29c194399f8e44c = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeBuffer_f02a490fdc6f0436 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeBuffer(arg1, arg2 >>> 0, arg3, arg4, arg5 >>> 0);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_3e46e3cb49eb4260 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeTexture(arg1, getArrayU8FromWasm0(arg2, arg3), arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_4fcab2760750d29b = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_7cda7fcaee2d9ef9 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4, arg5) {
        arg0.writeTexture(arg1, getArrayU8FromWasm0(arg2, arg3), arg4, arg5);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_ba506ae4ac210e72 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_c81c430a287fc905 = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_writeTexture_e6008247063eadbf = function() { return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        arg0.writeTexture(arg1, arg2, arg3, arg4);
    }, arguments) };
    imports.wbg.__wbg_xor_5e47ecfb8b8836e3 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.xor(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_xor_5e9be92d2e01a692 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Atomics.xor(arg0, arg1 >>> 0, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbindgen_cast_2241b6af4c4b2941 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(String) -> Externref`.
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_2ddd8a25ff58642a = function(arg0, arg1) {
        // Cast intrinsic for `I128 -> Externref`.
        const ret = (BigInt.asUintN(64, arg0) | (arg1 << BigInt(64)));
        return ret;
    };
    imports.wbg.__wbindgen_cast_38a261ec6a12ed41 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I64)) -> NamedExternref("BigInt64Array")`.
        const ret = getArrayI64FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_3ab50d48fbb5ae1c = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U64)) -> NamedExternref("BigUint64Array")`.
        const ret = getArrayU64FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_4625c577ab2ec9ee = function(arg0) {
        // Cast intrinsic for `U64 -> Externref`.
        const ret = BigInt.asUintN(64, arg0);
        return ret;
    };
    imports.wbg.__wbindgen_cast_4af8e60a922bcf35 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(F64)) -> NamedExternref("Float64Array")`.
        const ret = getArrayF64FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_77927a9dcb96442f = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8ClampedArray")`.
        const ret = getArrayU8FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_7c316abdc43840a3 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U32)) -> NamedExternref("Uint32Array")`.
        const ret = getArrayU32FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_94636bd0e62b4e75 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 2664, function: Function { arguments: [NamedExternref("GPUUncapturedErrorEvent")], shim_idx: 2665, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__h073b6d7deee1c387, wasm_bindgen__convert__closures_____invoke__h38800d657b13dd4c);
        return ret;
    };
    imports.wbg.__wbindgen_cast_9575fb55a66c262b = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I32)) -> NamedExternref("Int32Array")`.
        const ret = getArrayI32FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_9ae0607507abb057 = function(arg0) {
        // Cast intrinsic for `I64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_cast_bbb4883c6389f1de = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U16)) -> NamedExternref("Uint16Array")`.
        const ret = getArrayU16FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_cb9088102bce6b30 = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
        const ret = getArrayU8FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_cd07b1914aa3d62c = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(F32)) -> NamedExternref("Float32Array")`.
        const ret = getArrayF32FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_d6cd19b81560fd6e = function(arg0) {
        // Cast intrinsic for `F64 -> Externref`.
        const ret = arg0;
        return ret;
    };
    imports.wbg.__wbindgen_cast_e47ceb6027f5c92c = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I16)) -> NamedExternref("Int16Array")`.
        const ret = getArrayI16FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_cast_e7b45dd881f38ce3 = function(arg0, arg1) {
        // Cast intrinsic for `U128 -> Externref`.
        const ret = (BigInt.asUintN(64, arg0) | (BigInt.asUintN(64, arg1) << BigInt(64)));
        return ret;
    };
    imports.wbg.__wbindgen_cast_e84fd2e01c39a9c9 = function(arg0, arg1) {
        // Cast intrinsic for `Closure(Closure { dtor_idx: 3520, function: Function { arguments: [Externref], shim_idx: 3521, ret: Unit, inner_ret: Some(Unit) }, mutable: true }) -> Externref`.
        const ret = makeMutClosure(arg0, arg1, wasm.wasm_bindgen__closure__destroy__hd660cf5e4c31b356, wasm_bindgen__convert__closures_____invoke__h2cc2ea010b0df6f8);
        return ret;
    };
    imports.wbg.__wbindgen_cast_feefb5fadd6457fd = function(arg0, arg1) {
        // Cast intrinsic for `Ref(Slice(I8)) -> NamedExternref("Int8Array")`.
        const ret = getArrayI8FromWasm0(arg0, arg1);
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
    };
    imports['__wbindgen_placeholder__'] = __wbg_star0;

    return imports;
}

function __wbg_finalize_init(instance, module) {
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


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
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

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;
