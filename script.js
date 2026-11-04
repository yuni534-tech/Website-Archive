function changeTitle() {
    document.getElementById("title").textContent = "JavaScript 실행 성공";
}

function hello(){
    fetch("/hello")
    .then(response => response.text())
    .then(data => {
        document.getElementById("result").textContent = data;
    });
}