from flask import Flask, request, render_template_string
import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return render_template_string(open('index.html').read())

@app.route('/submit_drawing', methods=['POST'])
def submit_drawing():
    name = request.form['name']
    drawing_type = request.form['drawing_type']
    details = request.form['details']
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Store or process the request
    with open(f"requests/{timestamp}_drawing_request.txt", 'w') as file:
        file.write(f"Name: {name}\n")
        file.write(f"Drawing Type: {drawing_type}\n")
        file.write(f"Details: {details}\n")
        file.write(f"Timestamp: {timestamp}\n")
    
    return f"Thank you, {name}. Your drawing request has been submitted!"

if __name__ == '__main__':
    app.run(debug=True)
