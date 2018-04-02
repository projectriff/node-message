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

const { AbstractHeaders, Headers } = require('..');

describe('Headers', () => {

    describe('constructor', () => {

        it('extends AbstractHeaders', () => {
            expect(new Headers() instanceof AbstractHeaders).toBe(true);
        });

        it('extends Headers', () => {
            expect(new Headers() instanceof Headers).toBe(true);
        });

        it('clones Headers', () => {
            const h1 = new Headers()
                .addHeader('Content-Type', 'text/plain');
            const h2 = new Headers(h1);
            expect(h1).not.toBe(h2);
            expect(h1.toRiffHeaders()).toEqual(h2.toRiffHeaders());
        });

        it('converts other AbstractHeaders types', () => {
            class AltHeaders extends AbstractHeaders {
                constructor() {
                    super();
                }
                toRiffHeaders() {
                    return {
                        'Content-Type': {
                            values: ['text/plain']
                        }
                    };
                }
            }

            const headers = new Headers(new AltHeaders());
            expect(headers instanceof Headers).toBe(true);
            expect(headers.getValues('Content-Type')).toEqual(['text/plain']);
        });

    });

    describe('.addHeader', () => {

        it('adds a single header value', () => {
            const headers = new Headers()
                .addHeader('Content-Type', 'application/json');
            expect(headers.getValues('Content-Type')).toEqual(['application/json']);
        });

        it('adds a multiple header values', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json', 'text/plain');
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('adds a new values to existing values', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json')
                .addHeader('Accept', 'text/plain');
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('normalizes the header name', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json')
                .addHeader('accept', 'text/plain');
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('is immutable', () => {
            const h1 = new Headers();
            const h2 = h1.addHeader('Accept', 'application/json');
            expect(h1).not.toBe(h2);
            expect(h1.getValues('Accept')).toEqual([]);
            expect(h2.getValues('Accept')).toEqual(['application/json']);
        });

    });

    describe('.replaceHeader', () => {

        it('replaces a single header value', () => {
            const headers = new Headers()
                .replaceHeader('Content-Type', 'application/json');
            expect(headers.getValues('Content-Type')).toEqual(['application/json']);
        });

        it('replaces multiple header values', () => {
            const headers = new Headers()
                .replaceHeader('Accept', 'application/json', 'text/plain');
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('replaces an existing value with a new value', () => {
            const headers = new Headers()
                .replaceHeader('Content-Type', 'application/json')
                .replaceHeader('Content-Type', 'text/plain');
            expect(headers.getValues('Content-Type')).toEqual(['text/plain']);
        });

        it('normalizes the header name', () => {
            const headers = new Headers()
                .replaceHeader('Content-Type', 'application/json')
                .replaceHeader('content-type', 'text/plain');
            expect(headers.getValues('Content-Type')).toEqual(['text/plain']);
        });

        it('is immutable', () => {
            const h1 = new Headers();
            const h2 = h1.replaceHeader('Accept', 'application/json');
            expect(h1).not.toBe(h2);
            expect(h1.getValues('Accept')).toEqual([]);
            expect(h2.getValues('Accept')).toEqual(['application/json']);
        });

    });

    describe('.getValues', () => {

        it('gets all values for a header', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json')
                .addHeader('Accept', 'text/plain');
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('ignores header name case', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json')
                .addHeader('Accept', 'text/plain');
            expect(headers.getValues('accept')).toEqual(['application/json', 'text/plain']);
        });

        it('returns an empty array for an unknown header', () => {
            const headers = new Headers();
            expect(headers.getValues('bogus')).toEqual([]);
        });

        it('protects output from tamporing', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json', 'text/plain');
            const v1 = headers.getValues('Accept');
            const v2 = headers.getValues('Accept');
            expect(v1).toEqual(v2);
            expect(v1).not.toBe(v2);

            // tamper attempt
            v1.length = 0;
            expect(v1).not.toEqual(v2);
        });

    });

    describe('.getValue', () => {

        it('gets a single value for a header', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json');
            expect(headers.getValue('Accept')).toBe('application/json');
        });

        it('gets the first value for a header', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json', 'text/plain');
            expect(headers.getValue('Accept')).toBe('application/json');
        });

        it('ignores header name case', () => {
            const headers = new Headers()
                .addHeader('Accept', 'application/json', 'text/plain');
            expect(headers.getValue('accept')).toBe('application/json');
        });

        it('returns null for an unknown header', () => {
            const headers = new Headers();
            expect(headers.getValue('bogus')).toBe(null);
        });

    });

    describe('.toRiffHeaders', () => {

        it('returns all headers and values as a plain object', () => {
            const headers = new Headers()
                .addHeader('Content-Type', 'application/json')
                .addHeader('Accept', 'application/json', 'text/plain');
            expect(headers.toRiffHeaders()).toEqual({
                'Content-Type': {
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
            })
        });

        it('converts all header values to strings', () => {
            const headers = new Headers()
                .addHeader('correlationId', 1234);
            expect(headers.toRiffHeaders()).toEqual({
                'correlationId': {
                    values: [
                        '1234'
                    ]
                }
            })
        });

        it('preserves the header name format', () => {
            const h1 = new Headers().addHeader('Content-Type', 'text/plain');
            const h2 = new Headers().addHeader('content-type', 'text/plain');
            expect(h1.getValues('Content-Type')).toEqual(h2.getValues('Content-Type'));
            expect(h1.toRiffHeaders()).not.toEqual(h2.toRiffHeaders());
            expect(h1.toRiffHeaders()).toEqual({
                'Content-Type': {
                    values: ['text/plain']
                }
            });
            expect(h2.toRiffHeaders()).toEqual({
                'content-type': {
                    values: ['text/plain']
                }
            });
        });

        it('added headers use the initial name format', () => {
            const headers = new Headers()
                .addHeader('Content-Type', 'text/plain')
                .addHeader('content-type', 'application/json');
            expect(headers.toRiffHeaders()).toEqual({
                'Content-Type': {
                    values: [
                        'text/plain',
                        'application/json'
                    ]
                }
            });
        });

        it('replaced headers use the latest name format', () => {
            const headers = new Headers()
                .addHeader('Content-Type', 'text/plain')
                .replaceHeader('content-type', 'application/json');
            expect(headers.toRiffHeaders()).toEqual({
                'content-type': {
                    values: [
                        'application/json'
                    ]
                }
            });
        });

        it('returns an empty object for no headers', () => {
            const headers = new Headers();
            expect(headers.toRiffHeaders()).toEqual({});
        });

    });

    describe('#fromRiffHeaders', () => {

        it('returns a Headers object', () => {
            const headers = Headers.fromRiffHeaders({});
            expect(headers instanceof Headers).toBe(true);
        });

        it('parses multiple headers and values', () => {
            const headers = Headers.fromRiffHeaders({
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
            });
            expect(headers.getValues('Content-Type')).toEqual(['application/json']);
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('combines multiple header names differing only by case', () => {
            const headers = Headers.fromRiffHeaders({
                'accept': {
                    values: [
                        'application/json'
                    ]
                },
                'Accept': {
                    values: [
                        'text/plain'
                    ]
                }
            });
            expect(headers.getValues('Accept')).toEqual(['application/json', 'text/plain']);
        });

        it('ignores invalid header', () => {
            const headers = Headers.fromRiffHeaders({
                'Content-Type': [0],
                'Accpet': null,
                'correlationId': {
                    values: [
                        '1234'
                    ]
                }
            });
            expect(headers.getValues('Content-Type')).toEqual([]);
            expect(headers.getValues('Accpet')).toEqual([]);
            expect(headers.getValues('correlationId')).toEqual(['1234']);
        });

    });

    describe('#install', () => {

        it('registers itself as the header type', () => {
            const originalFromRiffHeaders = AbstractHeaders.fromRiffHeaders;
            expect(Headers.fromRiffHeaders).not.toBe(AbstractHeaders.fromRiffHeaders);
            const uninstall = Headers.install();
            expect(Headers.fromRiffHeaders).toBe(AbstractHeaders.fromRiffHeaders);
            uninstall();
            expect(Headers.fromRiffHeaders).not.toBe(AbstractHeaders.fromRiffHeaders);
            expect(AbstractHeaders.fromRiffHeaders).toBe(originalFromRiffHeaders);

        });

    });

});
