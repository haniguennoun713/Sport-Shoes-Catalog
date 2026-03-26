# ============================================================
#  app.py  –  Flask REST API for Sport Shoes Catalog
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from config import DB_CONFIG

app = Flask(__name__)
CORS(app)   # Allow cross-origin requests from the frontend


# ------------------------------------------------------------------
# Helper: get a fresh DB connection
# ------------------------------------------------------------------
def get_db():
    return mysql.connector.connect(**DB_CONFIG)


# ------------------------------------------------------------------
# POST /products  →  Add a new product
# ------------------------------------------------------------------
@app.route('/products', methods=['POST'])
def add_product():
    data = request.get_json()

    # ── Backend validation ──────────────────────────────────────
    errors = {}

    name = (data.get('name') or '').strip()
    description = (data.get('description') or '').strip()
    image_url = (data.get('image_url') or '').strip()

    if not name:
        errors['name'] = 'Product name is required.'
    elif len(name) > 120:
        errors['name'] = 'Name must be 120 characters or fewer.'

    if not description:
        errors['description'] = 'Description is required.'

    try:
        price = float(data.get('price'))
        if price <= 0:
            errors['price'] = 'Price must be a positive number.'
    except (TypeError, ValueError):
        errors['price'] = 'Price must be a valid number.'
        price = None

    if not image_url:
        errors['image_url'] = 'Image URL is required.'

    if errors:
        return jsonify({'success': False, 'errors': errors}), 400

    # ── Insert into DB ──────────────────────────────────────────
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO products (name, description, price, image_url) VALUES (%s, %s, %s, %s)",
            (name, description, price, image_url)
        )
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'id': new_id, 'message': 'Product added successfully!'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# ------------------------------------------------------------------
# GET /products  →  Fetch all products
# ------------------------------------------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM products ORDER BY id DESC")
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'products': products}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# ------------------------------------------------------------------
# GET /products/search?q=  →  Live search by name
#   • Products whose name STARTS WITH q come first
#   • Then remaining matches (name CONTAINS q)
# ------------------------------------------------------------------
@app.route('/products/search', methods=['GET'])
def search_products():
    q = (request.args.get('q') or '').strip()

    if not q:
        # Empty query → return all products
        return get_products()

    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # CASE expression pushes "starts with" rows to the top
        cursor.execute("""
            SELECT *,
                   CASE WHEN name LIKE %s THEN 0 ELSE 1 END AS sort_order
            FROM products
            WHERE name LIKE %s
            ORDER BY sort_order ASC, name ASC
        """, (q + '%', '%' + q + '%'))

        products = cursor.fetchall()

        # Remove the helper column before sending to frontend
        for p in products:
            p.pop('sort_order', None)

        cursor.close()
        conn.close()
        return jsonify({'success': True, 'products': products}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


# ------------------------------------------------------------------
# Run
# ------------------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
