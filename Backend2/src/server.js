const { app } = require('./app');
const http = require('http');

const PORT = process.env.PORT || 8081;
const server = http.createServer(app);

server.listen({ port: PORT, host: '0.0.0.0' }, () => {
  console.log(`Backend2 (auth + payment) started at port ${PORT}`);
});
