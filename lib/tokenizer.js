'use strict';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bcoin = require('bcoin');

const FullNode = bcoin.fullnode;

class Tokenizer {
  constructor() {
    if (!(this instanceof Tokenizer)) {
      return new Tokenizer();
    }

    this.idx = 0; // block index;

    // Replace with p2p in the future
    this.node = new FullNode({
      network: 'main',
      db: 'leveldb',
      checkpoints: true,
      workers: true,
      logLevel: 'info',
      'coin-cache': 100,
      'max-inbound': 16,
      'max-outbound': 16,
      'http-port': 8332,
      'nodes': 'ip1,ip2,ip3'
    });
  }

  async start() {
    await this.node.open();
    //await this.node.connect();
    //this.node.startSync();

    server.listen(3000, () => {
      console.log('Tokenizer listening on port 3000');
    });

    io.on('connection', async (socket) => {
      console.log(socket.handshake.query.name + ' connected');
      await socket.emit('start');

      socket.on('getBlock', async (data) => {
        this.idx++;
        await this.sendBlock(socket, this.idx);
      });

    });
  }

  getBlock(height) {
    return this.node.chain.getBlock(height);
  }

  async sendBlock(socket, index) {
    let block = await this.getBlock(index);
    if (block) {
      const view = await this.node.chain.getBlockView(block);
      await socket.emit('block', {
        raw: block.toRaw(),
        view,
        idx: index
      });
    }
  }
}

module.exports = Tokenizer;