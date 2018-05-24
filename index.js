const got = require('got')
const xmlParser = require('xml-js')

const safeJsonParse = value => {
  try {
    return JSON.parse(value)
  } catch (error) {
    try {
      return xmlParser.xml2js(value, { ignoreComment: true, alwaysChildren: true })
    } catch (error) {
      return value
    }
  }
}

/**
 * @typedef {object} Options
 * @property {string} [baseUrl] - Base URL for every request
 * @property {Object.<string,*>} [baseHeaders] - Define headers for every request
 * @property {boolean} [onlyPayload] - If true - return only response body
 */

/**
 * Awesome HTTP client!
 * @param {Options} options Options fo HTTP client
 */
module.exports = function (options) {
  const { baseUrl = '', baseHeaders = {}, onlyPayload = false } = options
  
  return {
    baseUrl, baseHeaders, onlyPayload,

    /**
     * @typedef {object} RequestOptions
     * @property {string} [method] - Request method. Default: GET
     * @property {string} [path] - Path to API route
     * @property {Object.<string,*>} [headers] - Additional request headers
     * @property {Object.<string,*>} [query] - Query params
     * @property {Object.<string,*>} [body] - Request body
     * @property {boolean} [isFormData] - If true, send body as form data
     */

    /**
     * Awesome function for making request!
     * @param {RequestOptions} options Request options
     */
    async request (options) {
      try {
        const reqOptions = { query = {} } = options
        const { method = 'GET', path = '', headers = {}, body = {}, isFormData = false } = options

        reqOptions['method'] = method.toUpperCase()
        console.log(`METHOD: ${reqOptions['method']}`)
        reqOptions['headers'] = { ...baseHeaders, ...headers }
        
        if (reqOptions['method'] === 'POST' || 
            reqOptions['method'] === 'PATCH' ||
            reqOptions['method'] === 'PUT' ||
            reqOptions['method'] === 'DELETE') { 
          
          reqOptions['body'] = isFormData ? body : JSON.stringify(body)
          reqOptions['form'] = isFormData
          reqOptions.headers['Content-Type'] = isFormData ? 'application/x-www-form-urlencoded' : 'application/json'
          console.log(`REQUEST BODY: ${JSON.stringify(reqOptions.body)}`)
        }

        const url = baseUrl + path
        console.log(`URL: ${url}`)
        console.log(`HEADERS: ${JSON.stringify(reqOptions.headers)}`)
        console.log(`QUERY: ${JSON.stringify(reqOptions.query)}`)
        
        const res = await got(url, reqOptions)
        console.log(`RESPONSE BODY: ${res.body}`)

        if (onlyPayload) return safeJsonParse(res.body)
        else return { ...res, body: safeJsonParse(res.body) }

      } catch (error) {
        if (error.constructor === got.HTTPError) {
          const res = error.response
          if (onlyPayload) return safeJsonParse(res.body)
          else return { ...res, body: safeJsonParse(res.body) }
        }
        else return { error: error.message || error }
      }
    }
  }
}
