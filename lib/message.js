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

const AbstractMessage = global._riff_AbstractMessage = global._riff_AbstractMessage || function AbstractMessage() {};

AbstractMessage.fromRiffMessage = function() {
    throw new Error("fromRiffMessage must be overridden");
};

AbstractMessage.prototype.toRiffMessage = function() {
    throw new Error("toRiffMessage must be overridden");
};

const headersSym = Symbol('headers');
const payloadSym = Symbol('payload');

class Message extends AbstractMessage {

    constructor(headers, payload) {
        super();
        if (headers instanceof Message) {
            const message = headers;
            return message;
        } else if (headers instanceof AbstractMessage) {
            const message = Message.fromRiffMessage(headers.toRiffMessage());
            return message;
        } else {
            this[headersSym] = new Headers(headers);
            this[payloadSym] = payload;
        }
    }

    get headers() {
        return this[headersSym];
    }

    get payload() {
        return this[payloadSym];
    }

    toRiffMessage() {
        return {
            headers: this[headersSym].toRiffHeaders(),
            payload: Buffer.from(this[payloadSym] == null ? [] : this[payloadSym])
        };
    }

    static fromRiffMessage(message) {
        const headers = Headers.fromRiffHeaders(message.headers);
        return new Message(headers, message.payload);
    }

    static install() {
        const headersUninstall = Headers.install();
        const originalFromRiffMessage = AbstractMessage.fromRiffMessage;
        AbstractMessage.fromRiffMessage = Message.fromRiffMessage;
        return function uninstall() {
            headersUninstall();
            AbstractMessage.fromRiffMessage = originalFromRiffMessage;
        }
    }

    static builder() {
        return new MessageBuilder();
    }

}

class MessageBuilder {

    constructor() {
        this[headersSym] = new Headers();
        this[payloadSym] = null;
    }

    addHeader(name, ...value) {
        this[headersSym] = this[headersSym].addHeader(name, ...value);
        return this;
    }

    replaceHeader(name, ...value) {
        this[headersSym] = this[headersSym].replaceHeader(name, ...value);
        return this;
    }

    payload(payload) {
        this[payloadSym] = payload;
        return this;
    }

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
