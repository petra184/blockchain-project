import random
from InputsConfig import InputsConfig as p

class Network:
    def tx_prop_delay():
    	return random.expovariate(1/p.Tdelay)
    
    # Delay for propagating blocks in the network
    def block_prop_delay():
    	return random.expovariate(1/p.Bdelay)

    # Delay for propagating transactions in the networ
