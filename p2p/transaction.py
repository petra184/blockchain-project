import time
import random
import hashlib

class Transaction:
    def __init__(self, sender, receiver, coins):
        self.timestamp = time.time()
        self.sender = sender
        self.receiver = receiver
        self.coins = coins
        self.status = False  # False = not yet included in a block

        # Unique transaction ID using sender, receiver, coins, and timestamp
        self.txid = self.generate_txid()

    def generate_txid(self):
        tx_data = f"{self.sender.name}-{self.receiver.name}-{self.coins}-{self.timestamp}-{random.randint(1, 1_000_000)}"
        return hashlib.md5(tx_data.encode()).hexdigest()

    def __repr__(self):
        return f"{self.txid}: {self.sender.name} pays {self.receiver.name} {self.coins} coins"
