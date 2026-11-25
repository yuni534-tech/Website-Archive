from flask import Flask, render_template ,request

app = Flask(__name__)


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/test")
def test():
    name = request.args.get("name")
    return f"웹사이트 이름: {name}"

@app.route("/test-post", methods=["GET", "POST"])
def test_post():

    if request.method == "POST":
        name = request.form.get("Website Archive")
        url = request.form.get("url")

        return {"name": name, "url": url}

    return render_template("test_post.html")


