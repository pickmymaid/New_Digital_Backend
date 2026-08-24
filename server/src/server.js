const { app } = require('./app');
const http = require('http');

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);


server.listen({port: PORT, host: '0.0.0.0'}, () => {
  console.log(`Server started at port ${PORT}`)
})
