## ParcelMonkey Node.js Client

> Get quotes and create shipments from your Node.js applications

[![npm](https://img.shields.io/npm/v/parcelmonkey.svg?maxAge=10800&style=flat-square)](https://www.npmjs.com/package/parcelmonkey)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](http://standardjs.com/)


## Requirements

A user ID and API key from your account at https://www.parcelmonkey.co.uk/apiSettings.php

## Install

```
npm i parcelmonkey
```

### Connect to ParcelMonkey

```js
const ParcelMonkey = require('parcelmonkey')

let options = {
  host: 'api.parcelmonkey.co.uk',
  port: 443,
  userId: '<your user id>',
  apiKey: '<your API Key>'
}

let pm = new ParcelMonkey(options)
```

### Create a Box

`ParcelMonkey.Box` arguments:

* `length`: box length, in centimetres
* `width`: box width, in centimetres
* `height`: box height, in centimetres
* `weight`: box weight, in kilograms

```js
let box = new ParcelMonkey.Box(22.8, 14.6, 14.8, 1.1)
```

### Create Sender and Recipient

```js
let sender = new ParcelMonkey.Sender({
  name: 'Parcel Monkey',
  phone: '',
  email: '',
  address1: '',
  address2: '',
  town: 'London',
  county: 'London',
  country: 'GB',
  postcode: ''
})

let recipient = new ParcelMonkey.Recipient({
  name: 'Nicola',
  phone: '01234567890',
  email: 'nicola@example.com',
  address1: 'Hilton Midtown',
  address2: '1335 6th Avenue',
  town: 'New York',
  county: 'NY',
  country: 'US',
  postcode: '10019'
})
```

### Get shipping quotes

```js
pm.getQuote({
  sender,
  recipient,
  boxes: [box],  // array of boxes
  value: 20      // value in £
}).then(quotes => {
  console.log(quotes)

  // Select a record returned from `getQuote` to pass as the `quote` argument to `createShipment`.
  let quote = quotes[0]
})
```

### Create a shipment

```js
pm.createShipment({
  quote,
  sender,
  recipient,
  boxes: [box],
  value: 20,
  description: 'My shipment of things',
  collectionDate: '2018-11-07'
}).then(result => {
  console.log('SHIPMENT :', result)
}).catch(err => {
  console.log('SHIPMENT ERROR :', err)
})
```