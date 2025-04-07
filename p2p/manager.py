import peer
import random
import time
import numpy as np
import operator

class Manager:
    
    def __init__(self, peer):
        self.peer = peer
        self.env.process(self.run())

    def __repr__(self):
        return "ConnectionManager(%s)" % self.peer.name

    @property
    def env(self):
        return self.peer.env

    @property
    def connected_peers(self):
        return self.peer.connections.keys()

    def simulate(self):
        # Generate transaction based on Poisson interval
        if (self.peer.sim_time - self.peer.lasttransactiontime) >= float(np.random.poisson(self.peer.txn_interval_mean, 1)[0]) / 1000:
            self.peer.generateTransaction()

        # Create block if time since last block is above Poisson-sampled delay
        if (self.peer.sim_time - self.peer.lastBlockArrTime) >= float(np.random.poisson(self.peer.Tk_mean, 1)[0]) / 1000:
            self.peer.createBlock()

    def getConsensus(self):
        blocks_on_nw = {}
        listofblocks_nw = []
        majority = 1 + len(self.peer.all_peers) // 2

        for p in self.peer.all_peers:
            x = p.blk_queue

            if not x:
                continue

            sorted_x = sorted(x.items(), key=operator.itemgetter(1))  # sort by arrival time
            latestblock = sorted_x[-1][0]  # fix: get the most recent block

            # Track the actual Block object for majority detection
            block_obj = next((blk for blk in p.listofBlocks if blk.id == latestblock), None)
            listofblocks_nw.append(block_obj)

            if latestblock in blocks_on_nw:
                blocks_on_nw[latestblock].append(p)
            else:
                blocks_on_nw[latestblock] = [p]

        # Detect consensus or fork
        if len(blocks_on_nw) == 1:
            # No fork — a single latest block across all peers
            latestblock = list(blocks_on_nw.keys())[0]
            if len(blocks_on_nw[latestblock]) >= majority:
                block_obj = next((x for x in listofblocks_nw if x.id
 == latestblock), None)
                if block_obj:
                    self.peer.globalChain.addBlock(block_obj)
                    self.syncChains(block_obj)
        else:
            # Fork detected: choose the block with the most peers
            chosen_block_id, peer_list = max(blocks_on_nw.items(), key=lambda x: len(x[1]))
            if len(peer_list) >= majority:
                block_obj = next((x for x in listofblocks_nw if x and x.id
 == chosen_block_id), None)
                if block_obj:
                    self.peer.globalChain.addBlock(block_obj)
                    self.syncChains(block_obj)

    def syncChains(self, consensus_block):
        # Sync all peers' local chains to the global chain
        for p in self.peer.all_peers:
            if p.localChain.getLast().id != consensus_block.id:
                p.localChain.addBlock(consensus_block)
                p.lastBlockHeard = consensus_block
                p.lastBlockArrTime = time.time()
                print(f"[SYNC] {p.name} updated to block {consensus_block.id
}")

    def run(self):
        while True:
            self.peer.sim_time = time.time()
            self.simulate()
            self.getConsensus()

            # Snapshot every 10 seconds for debugging
            if int(self.peer.sim_time) % 10 == 0:
                print(f"\n=== Network Snapshot at t={int(self.peer.sim_time)} ===")
                for p in self.peer.all_peers:
                    last_blk = p.localChain.getLast().id
    
                    print(f"{p.name}: Last Block = {last_blk}, Balance = {p.balance}")
                print("=============================================\n")

            yield self.env.timeout(1)
