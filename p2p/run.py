import random
import simpy
import sys
from peer import Peer
from Models.Node import Node
from manager import Manager
import numpy as np
from peer import Network

env = simpy.Environment()
network = Network()

network.env = env


# Input arguments
n = int(sys.argv[1])                # Number of peers
z = int(sys.argv[2])                # % of slow nodes
txn_interval_mean = int(sys.argv[3])  # in ms
mean_Tk = int(sys.argv[4])          # mean block creation time (ms)
mean_links = int(sys.argv[5])       # binomial dist param for network density
SIM_DURATION = int(sys.argv[6])     # in ms
VISUALIZATION = False

# Apply global simulation parameters to Peer class
Peer.mean_Tk = mean_Tk
Peer.txn_interval_mean = txn_interval_mean

def initializePeer(peer_id, peer_type, env, network):
    return Peer(peer_id, peer_type, env, network)


def createPeers(numOfPeers, env, network):
    peers = []
    for i in range(numOfPeers):
        peer_type = 'slow' if i <= int(numOfPeers * (float(z) / 100)) else 'fast'
        p = initializePeer(f'p{i}', peer_type, env, network)
        peers.append(p)
    return peers


# Create simulation environment
env = simpy.Environment()
pserver = initializePeer('PeerServer', 'slow', env, network)


# Create and assign peers
peers = createPeers(n, env, network)
Peer.all_peers = peers

print("Starting Simulator...")
print("Peers connecting...")

# Connect peers using binomial link distribution
for p in peers:
    links = 1 + np.random.binomial(n, float(mean_links) / 100)
    attempts = 0
    while len(p.connections) < links and attempts < n * 2:  # Avoid infinite loops
        other = random.choice(peers)
        if p != other and other.name not in p.connections:
            p.connect(other)
        attempts += 1

    # Attach the manager to the peer
    Manager(p)

# Optionally run visualization
if VISUALIZATION:
    from animate import Visualizer
    Visualizer(env, peers)
else:
    env.run(until=SIM_DURATION)

print("Simulation ended.\nSaving peer data...")

# Output block trees for each peer
for p in Peer.all_peers:
    print(p.name, "-", p.type)

    filename = f"{p.name}.txt"
    with open(filename, 'w') as f:
        # Write block queue
        f.write('[ "None", ')
        f.write(', '.join([f"'{id}'" for id in p.blk_queue]))
        f.write(']\n[\n')

        # Write block edges (from-parent to-block)
        # Extract blocks from the blockchain instead of using listofBlocks
        blocks = []
        current = p.localChain.chain[0]  # Start with genesis block
        blocks.append(current)
        
        # Add all blocks from the chain
        for block in p.localChain.chain[1:]:
            blocks.append(block)
        
        # Write block edges
        for count, b in enumerate(blocks):
            from_blk = "'None'" if not hasattr(b, 'parentlink') or b.parentlink is None else f"'{b.parentlink}'"
            to_blk = f"'{b.id if hasattr(b, 'id') else b.id}'"
            edge = f"e{count}"
            f.write(f"{{ from: {from_blk}, to: {to_blk}, name: '{edge}' }},\n")
        f.write(']')

