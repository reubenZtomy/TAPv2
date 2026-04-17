from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

# Static folder points to frontend build directory (../frontend/dist)
static_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')

app = Flask(__name__, static_folder=static_dir)
CORS(app)


@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Hello from Flask backend'})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Serve built frontend files if present
    static_folder = app.static_folder
    if path != '' and os.path.exists(os.path.join(static_folder, path)):
        return send_from_directory(static_folder, path)
    index_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_path):
        return send_from_directory(static_folder, 'index.html')
    return jsonify({'message': 'Frontend not built. Run frontend in dev mode or build it.'}), 200


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
