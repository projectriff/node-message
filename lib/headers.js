/*
 * Copyright 2018 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const AbstractHeaders = global._riff_AbstractHeaders = global._riff_AbstractHeaders || function AbstractHeaders() {};

AbstractHeaders.fromRiffHeaders = function() {
    throw new Error("fromRiffHeaders must be overridden");
};

AbstractHeaders.prototype.toRiffHeaders = function() {
    throw new Error("toRiffHeaders must be overridden");
};

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

    static fromRiffHeaders(obj) {
        let headers = new Headers();
        for (const name of Object.keys(obj)) {
            if (obj[name] && obj[name].values) {
                const values = obj[name].values;
                headers = headers.addHeader(name, ...values);
            }
        }
        return headers;
    }

    static install() {
        const originalFromRiffHeaders = AbstractHeaders.fromRiffHeaders;
        AbstractHeaders.fromRiffHeaders = Headers.fromRiffHeaders;
        return function uninstall() {
            AbstractHeaders.fromRiffHeaders = originalFromRiffHeaders;
        }
    }

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

    replaceHeader(name, ...values) {
        const normalName = normalizeHeaderName(name);
        const next = new Headers(this);
        next[namesSym].set(normalName, name);
        next[valuesSym].set(normalName, values);
        return next;
    }

    getValue(name) {
        const normalName = normalizeHeaderName(name);
        const values = this[valuesSym].get(normalName);
        return values ? values[0] : null;
    }

    getValues(name) {
        const normalName = normalizeHeaderName(name);
        return (this[valuesSym].get(normalName) || []).slice();
    }

    toRiffHeaders() {
        const output = {};
        for (const normalName of this[namesSym].keys()) {
            output[this[namesSym].get(normalName)] = {
                values: this[valuesSym].get(normalName).map(v => '' + v)
            };
        }
        return output;
    }

}

module.exports = {
    AbstractHeaders,
    Headers
};
