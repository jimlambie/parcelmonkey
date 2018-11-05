const http = require('http')
const https = require('https')

const API_VERSION = '3.1'

class ParcelMonkey {
  constructor (opts) {
    opts = opts || {}
    this.host = opts.host || '127.0.0.1'
    this.port = opts.port
    this.protocol = opts.port === 443 ? https : http
    this.userId = opts.userId
    this.apiKey = opts.apiKey
    this.disableAgent = opts.disableAgent || false

    this.log = require('@dadi/logger')
    this.log.init({ enabled: true, level: 'info', filename: 'pm', extension: 'log' }, {}, 'development')
  }

  sayHello (payload) {
    return this.makeRequest('/HelloWorld', payload, (err, result) => {
      console.log('err, result :', err, result)
    })
  }

  getQuote ({sender, recipient, boxes, value}) {
    return new Promise((resolve, reject) => {
      let payload = {
        origin: sender.country,
        destination: recipient.country,
        goods_value: value,
        sender,
        recipient,
        boxes
      }

      return this.makeRequest('/GetQuote', payload, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  }

  createShipment ({quote, sender, recipient, boxes, value, description, collectionDate, customsInfo}) {
    return new Promise((resolve, reject) => {
      let payload = {
        service: quote.service,
        origin: sender.country,
        destination: recipient.country,
        boxes,
        goods_value: value,
        goods_description: description,
        collection_date: collectionDate,
        sender,
        recipient
      }

      if (customsInfo) {
        payload.customs = customsInfo
      }

      return this.makeRequest('/CreateShipment', payload, (err, result) => {
        if (err) {
          return reject(err)
        }

        return resolve(result)
      })
    })
  }

  getCustomsInfo (sender, recipient) {
    return new Customs(sender, recipient)
  }

  makeRequest (endpoint, data, callback) {
    data = JSON.stringify(data)

    let options = {
      host: this.host,
      method: 'POST',
      path: endpoint,
      rejectUnauthorized: false
    }

    let called = false
    let errorMessage = 'ParcelMonkey JSON API: '

    let req = this.protocol.request(options, res => {
      let buf = ''

      res.on('data', data => {
        buf += data
      })

      res.on('end', () => {
        if (called) {
          return
        }

        called = true

        if (res.statusCode === 400) {
          callback(new Error(errorMessage + 'Bad Request: 400'))
          return
        }

        if (res.statusCode === 401) {
          callback(new Error(errorMessage + 'Connection Rejected: 401 Unauthorized'))
          return
        }

        if (res.statusCode === 403) {
          callback(new Error(errorMessage + 'Connection Rejected: 403 Forbidden'))
          return
        }

        if (res.statusCode === 500 && buf.toString('utf8') === 'Work queue depth exceeded') {
          let exceededError = new Error(errorMessage + buf.toString('utf8'))
          exceededError.code = 429 // Too many requests
          callback(exceededError)
          return
        }

        let parsedBuf

        try {
          parsedBuf = JSON.parse(buf)
        } catch (e) {
          this.log.error(e.stack)
          this.log.error(buf)
          this.log.error('HTTP Status code:' + res.statusCode)

          callback(new Error(errorMessage + 'Error Parsing JSON: ' + e.message))
          return
        }

        callback(parsedBuf.error, parsedBuf)
      })
    })

    req.on('error', function (e) {
      console.log(e)
      const err = new Error(errorMessage + 'Request Error: ' + e.message)

      if (!called) {
        called = true
        callback(err)
      }
    })

    req.setHeader('Content-Length', data.length)
    req.setHeader('Content-Type', 'application/json')

    req.setHeader('apiversion', API_VERSION)
    req.setHeader('userid', this.userId)
    req.setHeader('token', this.apiKey)

    req.write(data)
    req.end()
  }
}

class Address {
  constructor ({name, phone, email, address1, address2, town, county, country, postcode}) {
    this.name = name
    this.phone = phone
    this.email = email
    this.address1 = address1
    this.address2 = address2
    this.town = town
    this.county = county
    this.country = country
    this.postcode = postcode
  }
}

class Recipient extends Address {
  constructor ({name, phone, email, address1, address2, town, county, country, postcode}) {
    super({name, phone, email, address1, address2, town, county, country, postcode})
  }
}

class Sender extends Address {
  constructor ({name, phone, email, address1, address2, town, county, country, postcode}) {
    super({name, phone, email, address1, address2, town, county, country, postcode})
  }
}

class Box {
  constructor (length, width, height, weight) {
    this.length = length
    this.width = width
    this.height = height
    this.weight = weight
  }
}

class Customs {
  constructor ({sender, recipient, type, reason, countryOfManufacture}) {
    this.doc_type = type
    this.reason = reason
    this.sender_name = sender.name
    this.sender_tax_reference = sender.taxReference
    this.recipient_name = recipient.name
    this.recipient_tax_reference = recipient.taxReference
    this.country_of_manufacture = countryOfManufacture
  }
}

ParcelMonkey.Sender = Sender
ParcelMonkey.Recipient = Recipient
ParcelMonkey.Box = Box
ParcelMonkey.Customs = Customs

module.exports = ParcelMonkey
