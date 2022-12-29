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
const sockets = {}
const names = {}
startServer(app)

const sendNamesList = () => {
  Object.values(sockets).forEach(ws => ws.send({
    names: Object.values(names)
  }))
}

const addName = async (wsId) => {
  const name = await namer.name()
  names[wsId] = name
  console.log('added name: ', name)

  // notify user of their new username
  sockets[wsId].send({
    username: name
  })

  // send message to all clients that user joined
  sendNamesList()
}

const removeName = async (wsId) => {
  const name = names[wsId]
  console.log('removing name: ', name)
  delete names[wsId]

  // send message to all clients that user joined
  sendNamesList()
}

function startServer(app) {
  // Create a web server to serve files and listen to WebSocket connections
  app.use(express.static('static'));
  const server = http.createServer(app);

  // Connect any incoming WebSocket connection to ShareDB
  const wss = new WebSocket.Server({server: server});
  wss.on('connection', async function(ws) {
    const stream = new WebSocketJSONStream(ws);
    ws.id = nanoid()
    sockets[ws.id] = stream
    await addName(ws.id)

    console.log("new stream connected: ", ws.id)

    stream.on('close', async () => {
      await removeName(stream.ws.id)
      delete sockets[stream.ws.id]
    })

    backend.listen(stream);
  });

  server.listen(process.env.PORT || 8080);
  console.log('Listening on http://localhost:8080');
}
