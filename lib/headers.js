/*
 * Copyright 2018 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const AbstractHeaders = ((cache, name) => {
    if (cache[name]) {
        return cache[name];
    }

    /**
     * Common base type for all headers classes
     */
    class AbstractHeaders {

        /**
         * Creates the installed headers type from the raw function-proto representation
         * of headers.
         * @param {Object} riffHeaders raw function-proto representation of headers
         * @returns {AbstractHeaders} installed headers object
         */
        //eslint-disable-next-line no-unused-vars
        static fromRiffHeaders(riffHeaders) {
            throw new Error("fromRiffHeaders must be overridden");
        }

        /**
         * Convert custom headers object to raw function-proto representation of headers.
         * Header values will be normalized to strings.
         * @param {Object} [opts={}] options
         * @param {boolean} [opts.preserveValues=false] when true, header values are not
         * normalized to strings
         * @returns {Object} raw function-proto representation of headers
         */
        //eslint-disable-next-line no-unused-vars
        toRiffHeaders({ preserveValues } = {}) {
            throw new Error("toRiffHeaders must be overridden");
        }

    }

    cache[name] = AbstractHeaders;

    return AbstractHeaders;
})(global, '_riff_AbstractHeaders');

const namesSym = Symbol('names');
const valuesSym = Symbol('values');

function normalizeHeaderName(name) {
    return name.toLowerCase();
}

function cloneMap(src) {
    const dest = new Map();
    for (const [key, value] of src.entries()) {
        dest.set(key, Array.isArray(value) ? value.slice() : value);
    }
    return dest;
}

/**
 * Immutable, case insensitive, multi-value map of header name to multiple header values
 * @param {AbstractHeaders} [headers] existing headers to clone
 */
class Headers extends AbstractHeaders {

    constructor(headers) {
        super();
        if (headers instanceof Headers) {
            this[namesSym] = cloneMap(headers[namesSym]);
            this[valuesSym] = cloneMap(headers[valuesSym]);
        } else if (headers instanceof AbstractHeaders) {
            headers = Headers.fromRiffHeaders(headers.toRiffHeaders());
            this[namesSym] = headers[namesSym];
            this[valuesSym] = headers[valuesSym];
        } else {
            this[namesSym] = new Map();
            this[valuesSym] = new Map();
        }
    }

    /**
     * @internal
     * Creates Headers from the raw function-proto representation of headers.
     * @param {Object} riffHeaders raw function-proto representation of headers
     * @returns {Headers} installed headers object
     */
    static fromRiffHeaders(riffHeaders) {
        let headers = new Headers();
        for (const name of Object.keys(riffHeaders)) {
            if (riffHeaders[name] && riffHeaders[name].values) {
                const values = riffHeaders[name].values;
                if (values != null && typeof values[Symbol.iterator] === 'function') {
                    headers = headers.addHeader(name, ...values);
                }
            }
        }
        return headers;
    }

    /**
     * Install Headers as the default AbstractHeaders type
     * @returns {function} uninsaller function restoring the type before installation
     */
    static install() {
        const originalFromRiffHeaders = AbstractHeaders.fromRiffHeaders;
        AbstractHeaders.fromRiffHeaders = Headers.fromRiffHeaders;
        return function uninstall() {
            AbstractHeaders.fromRiffHeaders = originalFromRiffHeaders;
        }
    }

    /**
     * Appends additional values for a header, creating the header if needed
     * @param {string} name header name, case insensitive
     * @param {string[]|*[]} values one or more header values
     */
    addHeader(name, ...values) {
        const normalName = normalizeHeaderName(name);
        const next = new Headers(this);
        if (!next[namesSym].has(normalName)) {
            next[namesSym].set(normalName, name);
        }
        if (next[valuesSym].has(normalName)) {
            values = this[valuesSym].get(normalName).concat(values);
        }
        next[valuesSym].set(normalName, values);
        return next;
    }

    /**
     * Sets values for a header, removing existing values
     * @param {string} name header name, case insensitive
     * @param {string[]|*[]} values one or more header values
     */
    replaceHeader(name, ...values) {
        const normalName = normalizeHeaderName(name);
        const next = new Headers(this);
        next[namesSym].set(normalName, name);
        next[valuesSym].set(normalName, values);
        return next;
    }

    /**
     * Get the first value for a header
     * @param {string} name header name, case insensitive
     * @return {string|*} header value, or null if not defined
     */
    getValue(name) {
        const normalName = normalizeHeaderName(name);
        const values = this[valuesSym].get(normalName);
        return values ? values[0] : null;
    }

    /**
     * Get all values for a header
     * @param {string} name header name, case insensitive
     * @return {string[]|*[]} header values, or empty array if not defined
     */
    getValues(name) {
        const normalName = normalizeHeaderName(name);
        return (this[valuesSym].get(normalName) || []).slice();
    }

    /**
     * @internal
     * Convert custom headers object to raw function-proto representation of headers.
     * Header values will be normalized to strings.
     * @param {Object} [opts={}] options
     * @param {boolean} [opts.preserveValues=false] when true, header values are not
     * normalized to strings
     * @returns {Object} raw function-proto representation of headers
     */
    toRiffHeaders({ preserveValues } = {}) {
        const output = {};
        for (const normalName of this[namesSym].keys()) {
            let values = this[valuesSym].get(normalName);
            if (!preserveValues) {
                values = values.map(v => '' + v);
            }
            output[this[namesSym].get(normalName)] = { values };
        }
        return output;
    }

}

module.exports = {
    AbstractHeaders,
    Headers
};
