from flask import Flask, send_file

app = Flask(__name__)


@app.get("/")
def index():
    return send_file("index.html")


@app.get("/designs.json")
def designs():
    return send_file("designs.json")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
