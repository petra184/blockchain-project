import simpy
from transaction import Transaction
import random
import numpy as np
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from Models.Block import Block
from Models.Block import BlockChain
import time

class Connection:
    def __init__(self, env, sender, receiver):
        self.env = env
        self.sender = sender
        self.receiver = receiver

    def __repr__(self):
        return f'<Connection {self.sender} -> {self.receiver}>'

class Peer(object):
    def __init__(self, name, peer_type, env, network):
        self.name = name
        self.type = peer_type
        self.env = env
        self.network = network

        self.balance = 100
        self.unspentTransactions = []
        self.lasttransactiontime = time.time()

        self.localChain = BlockChain(network.genesisBlock)
        self.lastBlockHeard = network.genesisBlock
        self.lastBlockArrTime = time.time()

        self.connections = {}
        self.txn_queue = {}
        self.blk_queue = {network.genesisBlock.id: time.time()}

        self.Tk_mean = float(np.random.poisson(network.AVG_BLK_ARR_TIME, 1)[0])

    def __repr__(self):
        return f'<Peer {self.name}>'

    def connect(self, other):
        if not self.is_connected(other):
            self.connections[other] = Connection(self.env, self, other)
            if not other.is_connected(self):
                other.connect(self)

    def is_connected(self, other):
        return other in self.connections

    def computeDelay(self, other, msg):
        size = 0
        if isinstance(msg, Block):
            size = 8 * 10**6

        delay = self.network.pij
        cij = 100 * 10**3 if self.type == other.type == 'fast' else 5 * 10**3

        prop = float(size) / cij
        queuing = np.random.exponential(float(self.network.dij) / cij, 1)[0]

        return (delay + prop + queuing) / 1000

    def broadcast(self, msg, delay):
        for other in self.connections:
            if isinstance(msg, Transaction):
                if msg.txid not in other.txn_queue:
                    other.unspentTransactions.append(msg)
                    arrival = delay + self.computeDelay(other, msg)
                    other.txn_queue[msg.txid] = arrival
                    other.broadcast(msg, arrival)
            elif isinstance(msg, Block):
                if msg.id not in other.blk_queue:
                    arrival = delay + self.computeDelay(other, msg)
                    other.blk_queue[msg.id] = arrival

                    if not other.detectFork(msg, arrival):
                        other.updateChain(msg, arrival)
                        other.broadcast(msg, arrival)

    def detectFork(self, msg, arrival):
        last = self.localChain.getLast()
        if msg.parentlink == last.parentlink and msg.id != last.id:
            if arrival > self.lastBlockArrTime:
                self.lastBlockHeard = msg
                self.lastBlockArrTime = arrival
                return True
            else:
                self.resolveFork(msg)
        return False

    def resolveFork(self, msg):
        self.localChain.removeLast()
        self.localChain.addBlock(msg)

    def updateChain(self, newBlock, arrival):
        if newBlock != self.localChain.getLast():
            newBlock.parentlink = self.localChain.getLast().id
            self.localChain.addBlock(newBlock)
            self.lastBlockArrTime = arrival

    def generateTransaction(self):
        receiver = random.choice([p for p in self.connections if p.name != 'PeerServer']) or self

        if self.balance < 1:
            return

        coins = random.randint(1, self.balance)
        tx = Transaction(self.name, receiver, coins)
        self.lasttransactiontime = time.time()

        self.network.UTXO.append(tx)
        self.unspentTransactions.append(tx)

        self.broadcast(tx, tx.timestamp)

    def updateUTXO(self):
        # TODO: Implement UTXO updates and balance adjustment
        pass


    def createBlock(self):
        self.updateUTXO()

        if not self.unspentTransactions:
            self.unspentTransactions.extend(self.network.UTXO)
            if not self.unspentTransactions:
                return

        txns = self.unspentTransactions[:10]
        self.unspentTransactions = self.unspentTransactions[10:]

        newBlock = Block(txns, self)
        newBlock.parentlink = self.lastBlockHeard.id

        if newBlock.id in self.blk_queue:
            self.unspentTransactions.extend(newBlock.transactions)
            return

        self.localChain.addBlock(newBlock)
        self.blk_queue[newBlock.id] = newBlock.timestamp
        self.lastBlockArrTime = newBlock.timestamp

        self.broadcast(newBlock, newBlock.timestamp)


class Network:
    def __init__(self):
        self.env = simpy.Environment()
        self.genesisBlock = Block([], None)
        self.genesisBlock.id = '00000000000000000000000000000000'
        self.globalChain = BlockChain(self.genesisBlock)

        self.UTXO = []
        self.all_peers = []

        self.pij = np.random.uniform(10, 500)
        self.dij = 96 * 1000
        self.txn_interval_mean = 10
        self.mean_Tk = 3000
        self.AVG_BLK_ARR_TIME = 10 * self.mean_Tk  # for now assume 10 peers

    def add_peer(self, name, peer_type):
        peer = Peer(name, peer_type, self.env, self)
        self.all_peers.append(peer)
        return peer