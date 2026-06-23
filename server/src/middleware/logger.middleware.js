import pinoHttp from 'pino-http';
import logger from '../config/logger.js';

export const httpLogger = pinoHttp({
  logger: logger,
  autoLogging: true,
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return `${req.method} ${req.url} not found`;
    }
    return `${req.method} ${req.url} completed`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'responseTime',
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
      remoteAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.headers['content-type'],
      },
    }),
  },
});
export const logRequestStart = (req, res, next) => {
  req.log = logger.child({
    reqId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  
  req.log.info({ 
    event: 'request_start',
    query: req.query,
    params: req.params,
  }, `Incoming ${req.method} ${req.url}`);
  
  next();
};

// Middleware to log request completion
export const logRequestEnd = (req, res, next) => {
  const startTime = Date.now();
  
  const originalEnd = res.end;
  
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    req.log.info({
      event: 'request_end',
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('content-length'),
    }, `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`);
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};