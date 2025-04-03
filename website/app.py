# from flask import Flask, request, render_template_string
# import datetime

# app = Flask(__name__)

# @app.route('/')
# def home():
#     return render_template_string(open('index.html').read())

# @app.route('/submit_drawing', methods=['POST'])
# def submit_drawing():
#     name = request.form['name']
#     drawing_type = request.form['drawing_type']
#     details = request.form['details']
#     timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
#     # Store or process the request
#     with open(f"requests/{timestamp}_drawing_request.txt", 'w') as file:
#         file.write(f"Name: {name}\n")
#         file.write(f"Drawing Type: {drawing_type}\n")
#         file.write(f"Details: {details}\n")
#         file.write(f"Timestamp: {timestamp}\n")
    
#     return f"Thank you, {name}. Your drawing request has been submitted!"

# if __name__ == '__main__':
#     app.run(debug=True)

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
from datetime import datetime
import base64
import uuid

app = Flask(__name__, static_folder='.', static_url_path='')

# Data storage paths
DATA_DIR = 'data'
ARTWORKS_FILE = os.path.join(DATA_DIR, 'artworks.json')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize data files if they don't exist
if not os.path.exists(ARTWORKS_FILE):
    with open(ARTWORKS_FILE, 'w') as f:
        json.dump([], f)

if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, 'w') as f:
        json.dump([], f)

# Helper functions
def get_artworks():
    try:
        with open(ARTWORKS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_artworks(artworks):
    with open(ARTWORKS_FILE, 'w') as f:
        json.dump(artworks, f)

def get_users():
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f)

# Routes
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/gallery.html')
def gallery():
    return send_from_directory('.', 'gallery.html')

@app.route('/marketplace.html')
def marketplace():
    return send_from_directory('.', 'marketplace.html')

# API Routes
@app.route('/api/artworks', methods=['GET'])
def get_all_artworks():
    artworks = get_artworks()
    # Filter out data URLs for performance
    for artwork in artworks:
        if 'dataURL' in artwork:
            artwork['dataURL'] = artwork['dataURL'][:30] + '...'
    return jsonify(artworks)

@app.route('/api/artworks/<artwork_id>', methods=['GET'])
def get_artwork(artwork_id):
    artworks = get_artworks()
    artwork = next((a for a in artworks if a['id'] == artwork_id), None)
    if artwork:
        return jsonify(artwork)
    return jsonify({'error': 'Artwork not found'}), 404

@app.route('/api/artworks', methods=['POST'])
def create_artwork():
    data = request.json
    
    # Validate required fields
    if not data.get('name') or not data.get('dataURL'):
        return jsonify({'error': 'Name and dataURL are required'}), 400
    
    # Create new artwork
    artwork_id = str(uuid.uuid4())
    
    # Save image data to file
    image_data = data['dataURL']
    if image_data.startswith('data:image'):
        # Extract the base64 part
        image_data = image_data.split(',')[1]
    
    # Create artwork object
    artwork = {
        'id': artwork_id,
        'name': data['name'],
        'date': datetime.now().isoformat(),
        'dataURL': data['dataURL'],  # Store full dataURL in JSON for simplicity
        'forSale': data.get('forSale', False),
        'price': float(data.get('price', 0)),
        'artist': data.get('artist', 'Anonymous')
    }
    
    # Add to artworks
    artworks = get_artworks()
    artworks.append(artwork)
    save_artworks(artworks)
    
    return jsonify(artwork), 201

@app.route('/api/artworks/<artwork_id>', methods=['PUT'])
def update_artwork(artwork_id):
    data = request.json
    artworks = get_artworks()
    
    for i, artwork in enumerate(artworks):
        if artwork['id'] == artwork_id:
            # Update fields
            if 'name' in data:
                artwork['name'] = data['name']
            if 'forSale' in data:
                artwork['forSale'] = data['forSale']
            if 'price' in data:
                artwork['price'] = float(data['price'])
            
            artworks[i] = artwork
            save_artworks(artworks)
            return jsonify(artwork)
    
    return jsonify({'error': 'Artwork not found'}), 404

@app.route('/api/artworks/<artwork_id>', methods=['DELETE'])
def delete_artwork(artwork_id):
    artworks = get_artworks()
    initial_count = len(artworks)
    
    artworks = [a for a in artworks if a['id'] != artwork_id]
    
    if len(artworks) < initial_count:
        save_artworks(artworks)
        return jsonify({'message': 'Artwork deleted successfully'})
    
    return jsonify({'error': 'Artwork not found'}), 404

@app.route('/api/marketplace', methods=['GET'])
def get_marketplace():
    artworks = get_artworks()
    marketplace_items = [a for a in artworks if a.get('forSale', False)]
    
    # Apply filters
    category = request.args.get('category')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    sort = request.args.get('sort', 'newest')
    
    if category and category != 'all':
        marketplace_items = [a for a in marketplace_items if a.get('category') == category]
    
    if min_price:
        marketplace_items = [a for a in marketplace_items if a.get('price', 0) >= float(min_price)]
    
    if max_price:
        marketplace_items = [a for a in marketplace_items if a.get('price', 0) <= float(max_price)]
    
    # Sort items
    if sort == 'newest':
        marketplace_items.sort(key=lambda x: x.get('date', ''), reverse=True)
    elif sort == 'price-low':
        marketplace_items.sort(key=lambda x: x.get('price', 0))
    elif sort == 'price-high':
        marketplace_items.sort(key=lambda x: x.get('price', 0), reverse=True)
    
    # Filter out data URLs for performance
    for item in marketplace_items:
        if 'dataURL' in item:
            item['dataURL'] = item['dataURL'][:30] + '...'
    
    return jsonify(marketplace_items)

@app.route('/api/purchase', methods=['POST'])
def purchase_artwork():
    data = request.json
    artwork_id = data.get('artwork_id')
    
    if not artwork_id:
        return jsonify({'error': 'Artwork ID is required'}), 400
    
    artworks = get_artworks()
    artwork = next((a for a in artworks if a['id'] == artwork_id), None)
    
    if not artwork:
        return jsonify({'error': 'Artwork not found'}), 404
    
    if not artwork.get('forSale', False):
        return jsonify({'error': 'Artwork is not for sale'}), 400
    
    # In a real app, you would process payment here
    
    # Update artwork status
    for i, a in enumerate(artworks):
        if a['id'] == artwork_id:
            artworks[i]['forSale'] = False
            artworks[i]['soldTo'] = data.get('buyer', 'Anonymous')
            artworks[i]['soldDate'] = datetime.now().isoformat()
            break
    
    save_artworks(artworks)
    
    return jsonify({'message': 'Purchase successful'})

if __name__ == '__main__':
    app.run(debug=True)