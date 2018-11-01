# Message

[![Greenkeeper badge](https://badges.greenkeeper.io/projectriff/node-message.svg)](https://greenkeeper.io/)

Message and Headers types used by riff's node-function-invoker.

## Install

The node-function-invoker has a copy of this package built-in, however, in order to tests functions that accept and/or produce message, it's recomended that it is installed as a dependency that can be required directly whether running as a unit test or inside riff.

```bash
npm install --save @projectriff/message
```

## Usage

There are two primary types provided by this module `Message` and `Headers`. A message is a `payload` with `headers`. Headers is a case insensitive map with one to many values. While it's possible to construct message and headers objects directly, it's more common to use the builder.

```js
const { Message, Headers } = require('@projectriff/message');

// create a message, don't forget to call `.build()` at the end
const message = Message.builder()
    // add header with a single value
    .addHeader('Content-Type', 'text/plain')
    .addHeader('Accept', 'application/json')
    // add additional values for a header
    .addHeader('accept', 'text/plain;0.8', 'application/octet-stream;q=0.5')
    // replace a header, overwriting existing values
    .replaceHeader('Accept', 'application/octet-stream', 'text/plain')
    // set the payload
    .payload('Hello World!')
    // return the message
    .build();

// message headers are Headers
message.headers instanceof Headers; // true

// get the frist or all values for a header
message.headers.getValue('Content-Type');  // 'text/plain'
message.headers.getValues('Content-Type'); // [ 'text/plain' ]
message.headers.getValue('Accept');        // 'application/octet-stream'
message.headers.getValues('Accept');       // [ 'application/octet-stream', 'text/plain' ]

// header name are case insensitive
message.headers.getValue('Content-Type');  // 'text/plain'
message.headers.getValue('content-type');  // 'text/plain'
message.headers.getValue('CONTENT-TYPE');  // 'text/plain'

// content of the message
message.payload; // 'Hello World!'
```

The `message` and `message.headers` objects are immutable once constructed.


### riff Usage

To recieve a Message with headers instead of a payload.

```
module.exports = message => {
    const { headers, payload } = message;
    return `Message received with Content-Type '${headers.getValue('Content-Type')}' and payload '${payload}'.`;
};

// set argument type to message, default is payload
module.exports.$argumentType = 'message';
```

Functions that set custom headers need to return a Message.

```js
const { Message } = require('@projectriff/message');

module.exports = name => {
    return Message.builder()
        .addHeader('Content-Type', 'text/plain')
        .payload(`Hello ${name}!`)
        .build();
};
```

See the [node-function-invoker documentation](https://github.com/projectriff/node-function-invoker) for details.
