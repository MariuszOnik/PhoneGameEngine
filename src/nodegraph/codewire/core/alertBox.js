export function showAlert(msg) {
    let alertMsg = document.getElementById("alert-box").children[0].children[0];
    let alertBox = document.getElementById("alert-box");
    document.getElementById("alert-ok-btn").addEventListener("click", (e) => {
        alertBox.classList.toggle("hidden", true);
    });
    alertMsg.innerHTML = `<span style="color: tomato;">Alert:</span> ${msg}`;
    alertBox.classList.toggle('hidden', false);
    [...document.getElementsByClassName("sidebox")].forEach(value => {
        if (value !== alertBox) {
            value.classList.toggle("hidden", true);
        }
        else {
            value.classList.toggle("hidden", false);
        }
    })
}
