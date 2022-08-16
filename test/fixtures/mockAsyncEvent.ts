import type { OpenAPIV3_1 } from 'openapi-types';

export const rawNodejsTickObject = {
  args: [{
    state: {
      decodeStrings: false,
      defaultEncoding: 'utf8',
      bufferedIndex: 0,
      buffered: [{
        chunk: 'HTTP/1.1 200 OK\r\n' +
          'Content-Type: application/json\r\n' +
          'Date: Tue, 09 Aug 2022 03:38:21 GMT\r\n' +
          'Connection: keep-alive\r\n' +
          'Keep-Alive: timeout=5\r\n' +
          'Content-Length: 12\r\n' +
          '\r\n' +
          '{"code":"100"}',
        encoding: 'utf8' as 'utf-8',
        callback: []
      }, {
        chunk: '',
        encoding: 'latin1' as const,
        callback: []
      }]
    }
  }]
};

export const rawNodejsServerResponse = {
  args: [{
    _header: 'HTTP/1.1 200 OK\r\n' +
        'Content-Type: text/plain\r\n' +
        'Date: Tue, 09 Aug 2022 02:57:03 GMT\r\n' +
        'Connection: keep-alive\r\n' +
        'Keep-Alive: timeout=5\r\n' +
        'Content-Length: 12\r\n' +
        '\r\n',
    statusCode: 200,
    statusMessage: 'OK',
    req: {
      httpVersion: '1.1',
      rawHeaders: [
        'Host',
        'localhost:3000',
        'User-Agent',
        'curl/7.79.1',
        'Accept',
        '*/*',
        'Content-Length',
        '16',
        'Content-Type',
        'application/x-www-form-urlencoded'
      ],
      url: '/dapitest?search=test',
      method: 'POST' as OpenAPIV3_1.HttpMethods,
      _readableState: {
        buffer: {
          head: {
            data: Buffer.from('{"name":"dapi"}', 'utf-8'),
            next: null
          }
        }
      }
    }
  }]
};

export const expressTickObject = {
  args: [{
    state: {
      buffered: [{
        chunk: 'HTTP/1.1 200 OK\r\n' +
          'Connection: keep-alive\r\n' +
          'Keep-Alive: timeout=5\r\n' +
          '\r\n',
        encoding: 'latin1' as const
      }, {
        chunk: Buffer.from('{"data":{"name":"dapi-res"}}', 'utf-8'),
        encoding: 'buffer' as const
      }, {
        chunk: '',
        encoding: 'latin1' as const
      }]
    }
  }]
};

export const expressServerResponse = {
  args: [{
    _header: 'HTTP/1.1 200 OK\r\n' +
      'X-DNS-Prefetch-Control: off\r\n' +
      'Expect-CT: max-age=0\r\n' +
      'X-Frame-Options: SAMEORIGIN\r\n' +
      'Strict-Transport-Security: max-age=15552000; includeSubDomains\r\n' +
      'X-Download-Options: noopen\r\n' +
      'X-Content-Type-Options: nosniff\r\n' +
      'X-Permitted-Cross-Domain-Policies: none\r\n' +
      'Referrer-Policy: no-referrer\r\n' +
      'X-XSS-Protection: 0\r\n' +
      'Vary: Origin, Accept-Encoding\r\n' +
      'Access-Control-Allow-Credentials: true\r\n' +
      'Content-Type: application/json; charset=utf-8\r\n' +
      'Content-Length: 6896\r\n' +
      'ETag: W/"1af0-LmG1QAyc5Q2YIVtzdUvVsfI6t3c"\r\n' +
      'Date: Tue, 09 Aug 2022 07:30:30 GMT\r\n' +
      'Connection: keep-alive\r\n' +
      'Keep-Alive: timeout=5\r\n' +
      '\r\n',
    statusCode: 200,
    statusMessage: 'OK',
    req: {
      rawHeaders: [
        'Host',
        'localhost:3000',
        'User-Agent',
        'curl/7.79.1',
        'Accept',
        '*/*',
        'Content-Length',
        '16',
        'Content-Type',
        'application/json'
      ],
      url: '/api/endpoints/projects/5992f2f2-a3ef-4841-9bf8-102c9a701d2e?name=testdapi',
      method: 'POST' as OpenAPIV3_1.HttpMethods,
      params: { id: '5992f2f2-a3ef-4841-9bf8-102c9a701d2e' },
      query: { search: 'testdapi' },
      baseUrl: '/api/endpoints',
      originalUrl: '/api/endpoints/projects/5992f2f2-a3ef-4841-9bf8-102c9a701d2e?name=testdapi',
      body: { name: 'dapi v2' }
    }
  }]
};
