#from Models.Block import Block

# class Node(object):

#     """ Defines the base Node model.

#         :param int id: the uinque id of the node
#         :param list blockchain: the local blockchain (a list to store chain state locally) for the node
#         :param list transactionsPool: the transactions pool. Each node has its own pool if and only if Full technique is chosen
#         :param int blocks: the total number of blocks mined in the main chain
#         :param int balance: the amount of cryptocurrencies a node has
#     """
#     def __init__(self,id):
#         self.id= id
#         self.blockchain= []
#         self.transactionsPool= []
#         self.blocks= 0#
#         self.balance= 0

#     # Generate the Genesis block and append it to the local blockchain for all nodes
#     def generate_gensis_block():
#         from InputsConfig import InputsConfig as p
#         for node in p.NODES:
#             node.blockchain.append(Block())

#     # Get the last block at the node's local blockchain
#     def last_block(self):
#         return self.blockchain[len(self.blockchain)-1]

#     # Get the length of the blockchain (number of blocks)
#     def blockchain_length(self):
#         return len(self.blockchain)-1

#     # reset the state of blockchains for all nodes in the network (before starting the next run) 
#     def resetState():
#         from InputsConfig import InputsConfig as p
#         for node in p.NODES:
#             node.blockchain= [] # create an array for each miner to store chain state locally
#             node.transactionsPool= []
#             node.blocks=0 # total number of blocks mined in the main chain
#             node.balance= 0 # to count all reward that a miner made


from Models.Block import Block, BlockChain
import random
import numpy as np
import time

class Connection:
    def __init__(self, sender, receiver):
        self.sender = sender
        self.receiver = receiver

    def __repr__(self):
        return f"<Connection {self.sender.id} -> {self.receiver.id}>"

class Node:
    def __init__(self, id):
        self.id = id
        self.blockchain = BlockChain(Block())  # Start with genesis block
        self.transactionsPool = []
        self.blocks = 0
        self.balance = 0

        # Peer behavior
        self.connections = {}
        self.txn_queue = {}
        self.blk_queue = {self.blockchain.getLast().id: time.time()}
        self.lastBlockHeard = self.blockchain.getLast()
        self.lastBlockArrTime = time.time()

    def connect(self, other):
        if not self.is_connected(other):
            self.connections[other] = Connection(self, other)
            if not other.is_connected(self):
                other.connect(self)

    def is_connected(self, other):
        return other in self.connections

    def compute_delay(self, other, msg, pij=200, dij=96000):
        size = msg.size * 8 * 10**6 if hasattr(msg, 'size') else 1000
        cij = 100 * 10**3  # fast link assumption
        prop = float(size) / cij
        queuing = np.random.exponential(float(dij) / cij, 1)[0]
        return (pij + prop + queuing) / 1000  # seconds

    def broadcast(self, msg, delay=0):
        for other in self.connections:
            if hasattr(msg, 'id') and isinstance(msg, Block):
                if msg.id not in other.blk_queue:
                    arrival = delay + self.compute_delay(other, msg)
                    other.blk_queue[msg.id] = arrival
                    if not other.detect_fork(msg, arrival):
                        other.update_chain(msg, arrival)
                        other.broadcast(msg, arrival)
            elif hasattr(msg, 'id'):  # Transaction
                if msg.id not in other.txn_queue:
                    arrival = delay + self.compute_delay(other, msg)
                    other.txn_queue[msg.id] = arrival
                    other.transactionsPool.append(msg)
                    other.broadcast(msg, arrival)

    def detect_fork(self, block, arrival):
        last = self.blockchain.getLast()
        if block.previous == last.previous and block.id != last.id:
            if arrival > self.lastBlockArrTime:
                self.lastBlockHeard = block
                self.lastBlockArrTime = arrival
                return True
            else:
                self.resolve_fork(block)
        return False

    def resolve_fork(self, block):
        self.blockchain.removeLast()
        self.blockchain.addBlock(block)

    def update_chain(self, block, arrival):
        if block != self.blockchain.getLast():
            block.previous = self.blockchain.getLast().id
            self.blockchain.addBlock(block)
            self.lastBlockArrTime = arrival

    def receive_transaction(self, tx):
        if tx.id not in self.txn_queue:
            self.transactionsPool.append(tx)
            self.txn_queue[tx.id] = time.time()
            self.broadcast(tx)

    def mine_block(self, transactions):
        if not transactions:
            return None

        new_block = Block(
            depth=len(self.blockchain),
            id=random.getrandbits(128),
            previous=self.blockchain.getLast().id,
            timestamp=int(time.time()),
            miner=self.id,
            transactions=transactions
        )
        self.blockchain.addBlock(new_block)
        self.blk_queue[new_block.id] = new_block.timestamp
        self.lastBlockHeard = new_block
        self.lastBlockArrTime = new_block.timestamp

        self.broadcast(new_block, new_block.timestamp)
        self.blocks += 1
        return new_block

    def __repr__(self):
        return f"<Node {self.id}>"

    @staticmethod
    def generate_genesis_block():
        from InputsConfig import InputsConfig as p
        genesis = Block()
        for node in p.NODES:
            node.blockchain = BlockChain(genesis)
            node.blk_queue = {genesis.id: time.time()}

    @staticmethod
    def reset_state():
        from InputsConfig import InputsConfig as p
        for node in p.NODES:
            node.blockchain = BlockChain(Block())
            node.transactionsPool = []
            node.blocks = 0
            node.balance = 0
            node.txn_queue = {}
            node.blk_queue = {}
