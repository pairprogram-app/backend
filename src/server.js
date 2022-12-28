const http = require('http');
const express = require('express');
const ShareDB = require('sharedb');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream');
const nanoid = require('nanoid-esm')
const AnimalNamer = require('animal-namer');
const namer = new AnimalNamer();

const backend = new ShareDB();

const app = express()
const names = {}
startServer(app)

const addName = async (wsId) => {
  names[wsId] = await namer.name()
  console.log('added name: ', names[wsId])

  // send message to all clients that user joined
}

const removeName = async (wsId) => {
  console.log('removing name: ', names[wsId])
  delete names[wsId]
  // send message to all clients that user joined
}

function startServer(app) {
  // Create a web server to serve files and listen to WebSocket connections
  app.use(express.static('static'));
  const server = http.createServer(app);

  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws) {
    const stream = new WebSocketJSONStream(ws);
    ws.id = nanoid()
    addName(ws.id)

    console.log("new stream connected: ", ws.id)

    stream.on('close', () => {
      removeName(stream.ws.id)
    })

    backend.listen(stream);
  });

  server.listen(8080);
  console.log('Listening on', process.env.PORT || 8080);
}