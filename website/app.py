from flask import Flask, request, render_template_string, jsonify
import datetime
import os
import sys

# Add BlockSim directory to system path
sys.path.append('/Users/Lorna/Desktop/crypto/website/BlockSim')

# Import required modules from BlockSim
from BlockSim.Models import Block
from BlockSim.Models import Transaction
from BlockSim import Main  

app = Flask(__name__)

blockCommit = Main.BlockCommit() if hasattr(Main, 'BlockCommit') else None

if blockCommit is None:
    raise ImportError("BlockCommit class not found in main.py. Ensure BlockSim has a blockCommit implementation.")

@app.route('/')
def home():
    return render_template_string(open('/Users/Lorna/Desktop/crypto/website/templates/index.html').read())

@app.route('/submit_drawing', methods=['POST'])
def submit_drawing():
    name = request.form['name']
    drawing_type = request.form['drawing_type']
    details = request.form['details']
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    art_metadata = {
        "name": name,
        "drawing_type": drawing_type,
        "details": details,
        "timestamp": timestamp
    }

    transaction = Transaction(sender="User", receiver="Marketplace", data=art_metadata)
    blockCommit.add_transaction(transaction)


    os.makedirs("requests", exist_ok=True)
    with open(f"requests/{timestamp}_drawing_request.txt", 'w') as file:
        file.write(f"Name: {name}\n")
        file.write(f"Drawing Type: {drawing_type}\n")
        file.write(f"Details: {details}\n")
        file.write(f"Timestamp: {timestamp}\n")
        file.write(f"Art Hash: {transaction.tx_hash}\n")
    
    return jsonify({"message": f"Thank you, {name}.", "art_hash": transaction.tx_hash})

@app.route('/buy_art', methods=['POST'])
def buy_art():
    buyer = request.form['buyer']
    art_hash = request.form['art_hash']

    # Simulate transaction
    purchase_transaction = Transaction(sender=buyer, receiver="Marketplace", data={"art_hash": art_hash, "action": "buy"})
    blockCommit.add_transaction(purchase_transaction)

    return jsonify({"message": f"{buyer} {art_hash}!", "transaction_hash": purchase_transaction.tx_hash})

if __name__ == '__main__':
    app.run(debug=True)
