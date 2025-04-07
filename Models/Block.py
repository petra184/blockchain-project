class Block(object):
    
    """ Defines the base Block model.

    :param int depth: the index of the block in the local blockchain ledger (0 for genesis block)
    :param int id: the uinque id or the hash of the block
    :param int previous: the uinque id or the hash of the previous block
    :param int timestamp: the time when the block is created
    :param int miner: the id of the miner who created the block
    :param list transactions: a list of transactions included in the block
    :param int size: the block size in MB
    """

    def __init__(self,
	 depth=0,
	 id=0,
	 previous=-1,
	 timestamp=0,
	 miner=None,
	 transactions=[],
	 size=1.0):

        self.depth = depth
        self.id = id
        self.previous = previous
        self.timestamp = timestamp
        self.miner = miner
        self.transactions = transactions or []
        self.size = size

class BlockChain:
    def __init__(self, genesis_block):
        self.chain = [genesis_block]
        self.block_map = {genesis_block.id: genesis_block}  # Optional: quick lookup

    def addBlock(self, block):
        # Ensure correct parent linkage before adding
        if self.chain and block.parentlink != self.chain[-1].id:
            raise ValueError("Block parentlink does not match last block in chain.")
        self.chain.append(block)
        self.block_map[block.id] = block

    def getLast(self):
        return self.chain[-1] if self.chain else None

    def removeLast(self):
        if self.chain:
            removed_block = self.chain.pop()
            self.block_map.pop(removed_block.id, None)

    def __len__(self):
        return len(self.chain)

    def __repr__(self):
        return f"<BlockChain length={len(self.chain)} last={self.getLast().id if self.chain else 'None'}>"
