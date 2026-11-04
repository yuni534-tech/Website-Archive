from flask import Flask, request, send_file, Response

app = Flask(__name__)

@app.get("/")
def home():
    return send_file("index.html")

@app.get("/style.css")
def css():
    return send_file("style.css")

@app.get("/script.js")
def js():
    return send_file("script.js")

# POST 요청 : HTML form 데이터 받기
@app.post("/submit")
def submit():
    name = request.form.get("name")
    return f"{name}님 반가워요!"

#JS fetch 요청 
@app.get("/hello")
def hello():
    return "Flask 서버에서 보낸 메시지."

# GET 요청 : 파라미터 받기
@app.get("/greet")
def greet():
    name = request.args.get("name")
    return f"{name}님 반가워요!"