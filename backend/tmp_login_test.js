const http = require('http');
const data = JSON.stringify({ email: 'john@email.com', password: 'candidate123' });
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('statusCode', res.statusCode);
  console.log('headers', res.headers);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => console.log('body', body));
});

req.on('error', (err) => console.error('request error', err));
req.write(data);
req.end();
