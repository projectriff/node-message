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

const { AbstractMessage, Headers, Message } = require('..');

describe('Message', () => {

    describe('constructor', () => {

        it('extends AbstractMessage', () => {
            expect(new Message() instanceof AbstractMessage).toBe(true);
        });

        it('extends Message', () => {
            expect(new Message() instanceof Message).toBe(true);
        });

        it('converts other AbstractMessage types', () => {
            class AltMessage extends AbstractMessage {
                constructor() {
                    super();
                }
                toRiffMessage({ preservePayload } = {}) {
                    return {
                        headers: {
                            'Content-Type': {
                                values: ['text/plain']
                            }
                        },
                        payload: preservePayload ? 'hello world' : Buffer.from('preservePayload')
                    };
                }
            }

            const message = new Message(new AltMessage());
            expect(message instanceof Message).toBe(true);
            expect(message.headers.getValues('Content-Type')).toEqual(['text/plain']);
            expect(message.payload).toEqual('hello world');
        });

    });

    describe('.headers', () => {

        it('is a Headers object', () => {
            const message = new Message();
            expect(message.headers instanceof Headers).toBe(true);
        });

        it('is consistent', () => {
            const message = new Message();
            expect(message.headers).toBe(message.headers);
        });

        it('is immutable', () => {
            const message = new Message();
            message.headers = true;
            expect(message.headers).not.toBe(true);
        });

    });

    describe('.payload', () => {

        it('is null by default', () => {
            const message = new Message();
            expect(message.payload).toBeUndefined();
        });

        it('is the constructed payload value', () => {
            const message = new Message({}, 'hello world');
            expect(message.payload).toBe('hello world');
        });

        it('is consistent', () => {
            const message = new Message({}, 'hello world');
            expect(message.payload).toBe(message.payload);
        });

        it('is immutable', () => {
            const message = new Message();
            message.payload = true;
            expect(message.payload).not.toBe(true);
        });

    });

    describe('.toRiffMessage', () => {

        it('returns a plain object', () => {
            const message = new Message();
            expect(Object.getPrototypeOf(message.toRiffMessage())).toBe(Object.getPrototypeOf({}));
            expect(Object.keys(message.toRiffMessage())).toEqual(['headers', 'payload']);
        });

        it('the headers are riff headers', () => {
            const headers = new Headers()
                .addHeader('Content-Type', 'text/plain');
            const message = new Message(headers, null);
            expect(message.toRiffMessage().headers).toEqual(headers.toRiffHeaders());
        });

        it('the payload is a Buffer', () => {
            const message = new Message({}, 'hello world');
            expect(message.toRiffMessage().payload instanceof Buffer).toBe(true);
            expect(message.toRiffMessage().payload).toEqual(Buffer.from('hello world'));
        });

        it('a null payload is an empty Buffer', () => {
            const message = new Message({}, null);
            expect(message.toRiffMessage().payload).toEqual(Buffer.from([]));
        });

        it('an undefined payload is an empty Buffer', () => {
            const message = new Message({}, undefined);
            expect(message.toRiffMessage().payload).toEqual(Buffer.from([]));
        });

        it('can preserve the payload', () => {
            const payload = 'hello world';
            const message = new Message({}, payload);
            expect(message.toRiffMessage({ preservePayload: true }).payload).toBe(payload);
        });

    });

    describe('#fromRiffMessage', () => {

        it('returns a Message object', () => {
            const message = Message.fromRiffMessage({ headers: {}, payload: Buffer.from([]) });
            expect(message instanceof Message).toBe(true);
            expect(message.headers instanceof Headers).toBe(true);
            expect(message.payload).toEqual(Buffer.from([]));
        });

        it('parses multiple headers and values', () => {
            const message = Message.fromRiffMessage({
                headers: {
                    'content-type': {
                        values: [
                            'application/json'
                        ]
                    },
                    'Accept': {
                        values: [
                            'application/json',
                            'text/plain'
                        ]
                    }
                },
                payload: Buffer.from('hello world')
            });
            expect(message.headers.getValues('Content-Type')).toEqual(['application/json']);
            expect(message.headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
            expect(message.payload).toEqual(Buffer.from('hello world'));
        });

    });

    describe('#install', () => {

        it('registers itself as the message type', () => {
            const originalFromRiffMessage = AbstractMessage.fromRiffMessage;
            expect(Message.fromRiffMessage).not.toBe(AbstractMessage.fromRiffMessage);
            const uninstall = Message.install();
            expect(Message.fromRiffMessage).toBe(AbstractMessage.fromRiffMessage);
            uninstall();
            expect(Message.fromRiffMessage).not.toBe(AbstractMessage.fromRiffMessage);
            expect(AbstractMessage.fromRiffMessage).toBe(originalFromRiffMessage);

        });

    });

    describe('#builder', () => {

        it('builds a Message', () => {
            const message = Message.builder().build();
            expect(message instanceof Message).toBe(true);
        });

        it('manages headers', () => {
            const message = Message.builder()
                .addHeader('Content-Type', 'text/plain')
                .headers(new Headers().addHeader('content-type', 'application/json'))
                .addHeader('Accept', 'foo/bar')
                .replaceHeader('Accept', 'application/json', 'text/plain')
                .build();
            expect(message.headers.getValues('Content-Type')).toEqual(['application/json']);
            expect(message.headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('manages the payload', () => {
            const message = Message.builder()
                .payload('goodbye')
                .payload('hello')
                .build();
            expect(message.payload).toBe('hello');
        });

        it('is mutable', () => {
            const mb1 = Message.builder();
            const mb2 = mb1.addHeader('Content-Type', 'application/json');
            expect(mb1).toBe(mb2);
            const mb3 = mb2.payload('hello');
            expect(mb2).toBe(mb3);
            const mb4 = mb3.replaceHeader('Content-Type', 'text/plain');
            expect(mb3).toBe(mb4);
        });

    });

});
