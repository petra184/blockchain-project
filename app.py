from flask import Flask, render_template

app = Flask(
    __name__,
    static_folder='website/static',
    template_folder='website/templates'
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/draw')
def draw():
    return render_template('draw.html')

@app.route('/gallery')
def gallery():
    return render_template('gallery.html')  

if __name__ == '__main__':
    app.run(debug=True)
