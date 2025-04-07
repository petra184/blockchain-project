import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
from networkx.drawing.nx_agraph import graphviz_layout

def avg_bandwidth(peers):
    bws = [c.bandwidth for peer in peers for c in peer.connections.values()]
    return sum(bws) / len(bws) if bws else 0

def median_bandwidth(peers):
    bws = [c.bandwidth for peer in peers for c in peer.connections.values()]
    bws.sort()
    if not bws:
        return 0
    mid = len(bws) // 2
    return bws[mid] if len(bws) % 2 != 0 else (bws[mid - 1] + bws[mid]) / 2

def max_peers(peers):
    return max((len(p.connections) for p in peers), default=0)

def min_peers(peers):
    return min((len(p.connections) for p in peers), default=0)


class Visualizer:
    def __init__(self, env, peers):
        self.env = env
        self.peers = peers
        self.fig = plt.figure(figsize=(8, 8))
        self.anim = FuncAnimation(self.fig, self.update, interval=50, blit=False)
        plt.show()

    def update_simulation(self):
        self.env.run(until=self.env.now + 1)

    def update(self, _):
        self.update_simulation()

        G = nx.Graph()
        for peer in self.peers:
            G.add_node(peer, label=peer.name)
        for peer in self.peers:
            for other, conn in peer.connections.items():
                G.add_edge(peer, other, weight=conn.bandwidth)

        plt.cla()
        pos = graphviz_layout(G)  # You can also try spring_layout(G) if needed

        nx.draw_networkx_edges(G, pos)
        nodes = nx.draw_networkx_nodes(G, pos, node_size=20)

        plt.axis('off')

        KBit = 1024 / 8  # 1 KBit = 128 Bytes

        plt.text(0.5, 1.1, f"time: {self.env.now:.2f}",
                 horizontalalignment='left', transform=plt.gca().transAxes)
        plt.text(0.5, 1.07, f"avg bandwidth = {int(avg_bandwidth(self.peers)/KBit)} KBit",
                 horizontalalignment='left', transform=plt.gca().transAxes)
        plt.text(0.5, 1.04, f"median bandwidth = {int(median_bandwidth(self.peers)/KBit)} KBit",
                 horizontalalignment='left', transform=plt.gca().transAxes)
        plt.text(0.5, 1.01, f"min/max connections {min_peers(self.peers)}/{max_peers(self.peers)}",
                 horizontalalignment='left', transform=plt.gca().transAxes)

        return nodes,
