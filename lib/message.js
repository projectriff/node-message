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

const { Headers } = require('./headers');

const AbstractMessage = ((cache, name) => {
    if (cache[name]) {
        return cache[name];
    }

    /**
     * Common base type for all message classes
     */
    class AbstractMessage {

        /**
         * Creates the installed message type from the raw function-proto representation
         * of a message.
         * @param {Object} riffMessage raw function-proto representation of a message
         * @returns {AbstractMessage} installed message object
         */
        //eslint-disable-next-line no-unused-vars
        static fromRiffMessage(riffMessage) {
            throw new Error("fromRiffMessage must be overridden");
        }

        /**
         * Convert custom message object to raw function-proto representation of a
         * message. Message values will be normalized to a Buffer, and header values
         * normalized to strings.
         * @param {Object} [opts={}] options
         * @param {boolean} [opts.preservePayload=false] when true, the payload is not
         * converted to a Buffer
         * @param {boolean} [opts.preserveHeaderValues=false] when true, header values
         * are not normalized to strings
         * @returns {Object} raw function-proto representation of the message
         */
        //eslint-disable-next-line no-unused-vars
        toRiffMessage({ preservePayload, preserveHeaderValues } = {}) {
            throw new Error("toRiffMessage must be overridden");
        }

    }

    cache[name] = AbstractMessage;

    return AbstractMessage;
})(global, '_riff_AbstractMessage');

const headersSym = Symbol('headers');
const payloadSym = Symbol('payload');

/**
 * Immutable message with case-insensitive headers and a payload
 * @param {AbstractMessage} message the message to clone
 */
/**
 * Immutable message with case-insensitive headers and a payload
 * @param {AbstractHeaders} headers the headers to clone
 * @param {Buffer|*} payload payload
 */
class Message extends AbstractMessage {

    constructor(headers, payload) {
        super();
        if (headers instanceof Message) {
            const message = headers;
            return message;
        } else if (headers instanceof AbstractMessage) {
            const message = Message.fromRiffMessage(headers.toRiffMessage({ preservePayload: true, preserveHeaderValues: true }));
            return message;
        } else {
            this[headersSym] = new Headers(headers);
            this[payloadSym] = payload;
        }
    }

    /**
     * Get message headers
     * @returns {Headers} the message headers
     */
    get headers() {
        return this[headersSym];
    }

    /**
     * Get message paylaod
     * @returns {Buffer|*} the message payload
     */
    get payload() {
        return this[payloadSym];
    }

    /**
     * @internal
     * Convert custom message object to raw function-proto representation of a
     * message. Message values will be normalized to a Buffer, and header values
     * normalized to strings.
     * @param {Object} [opts={}] options
     * @param {boolean} [opts.preservePayload=false] when true, the payload is not
     * converted to a Buffer
     * @param {boolean} [opts.preserveHeaderValues=false] when true, header values
     * are not normalized to strings
     * @returns {Object} raw function-proto representation of the message
     */
    toRiffMessage({ preservePayload, preserveHeaderValues } = {}) {
        const payload = this[payloadSym];
        return {
            headers: this[headersSym].toRiffHeaders({ preserveHeaderValues }),
            payload: preservePayload ? payload : Buffer.from(payload == null ? [] : payload)
        };
    }

    /**
     * Creates a Message from the raw function-proto representation of a message.
     * @param {Object} riffMessage raw function-proto representation of a message
     * @returns {Message} installed message object
     */
    static fromRiffMessage(riffMessage) {
        const headers = Headers.fromRiffHeaders(riffMessage.headers);
        return new Message(headers, riffMessage.payload);
    }

    /**
     * Installs Message as the default AbstractMessage type and Headers and the default
     * AbstractHeaders type
     * @returns {function} uninsaller function restoring the type before installation
     */
    static install() {
        const headersUninstall = Headers.install();
        const originalFromRiffMessage = AbstractMessage.fromRiffMessage;
        AbstractMessage.fromRiffMessage = Message.fromRiffMessage;
        return function uninstall() {
            headersUninstall();
            AbstractMessage.fromRiffMessage = originalFromRiffMessage;
        }
    }

    /**
     * Create a builder for a new Message
     * @returns {MessageBuilder}
     */
    static builder() {
        return new MessageBuilder();
    }

}

/**
 * Builder for a Message
 */
class MessageBuilder {

    constructor() {
        this[headersSym] = new Headers();
        this[payloadSym] = null;
    }

    /**
     * Appends additional values for a header, creating the header if needed
     * @param {string} name header name, case insensitive
     * @param {string[]|*[]} values one or more header values
     * @returns {MessageBuilder} the current builder
     */
    addHeader(name, ...values) {
        this[headersSym] = this[headersSym].addHeader(name, ...values);
        return this;
    }

    /**
     * Sets values for a header, removing existing values
     * @param {string} name header name, case insensitive
     * @param {string[]|*[]} values one or more header values
     * @returns {MessageBuilder} the current builder
     */
    replaceHeader(name, ...values) {
        this[headersSym] = this[headersSym].replaceHeader(name, ...values);
        return this;
    }

    /**
     * Replace all headers
     * @param {AbstractHeaders} headers the new headers
     * @returns {MessageBuilder} the current builder
     */
    headers(headers) {
        this[headersSym] = new Headers(headers);
        return this;
    }

    /**
     * Replace the payload
     * @param {Buffer|*} payload the new payload
     * @returns {MessageBuilder} the current builder
     */
    payload(payload) {
        this[payloadSym] = payload;
        return this;
    }

    /**
     * Create a Message from the builder
     * @returns {Message} the message from the builder's content
     */
    build() {
        return new Message(
            this[headersSym],
            this[payloadSym]
        );
    }

}

module.exports = {
    AbstractMessage,
    Message
};
