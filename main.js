console.log("main.js loaded");

const BASE_URL = "https://r1132101321030-eu1-ifwe.3dexperience.3ds.com";

window.onload = function () {
    console.log("onLoad triggered");

    var btn = document.getElementById("createBtn");

    btn.onclick = function () {
        console.log("CLICK EVENT FIRED");
        createProject();
    };
};

function getCSRF(callback) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", BASE_URL + "/3dspace/resources/v1/application/CSRF", true);

    xhr.setRequestHeader("Accept", "application/json");
    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log("CSRF status:", xhr.status);
            console.log(xhr.responseText);

            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                callback(response.csrf.value);
            } else {
                console.error("CSRF failed");
            }
        }
    };

    xhr.send();
}

function createProject() {
    var name = document.getElementById("projectName").value;
    var desc = document.getElementById("projectDescription").value;

    console.log("Input:", name, desc);

    getCSRF(function (token) {

        var payload = {
            data: [{
                type: "Project Space",
                dataelements: {
                    title: name,
                    description: desc
                }
            }]
        };

        sendRequest(payload, token);
    });
}

function sendRequest(payload, token) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", BASE_URL + "/3dspace/resources/v1/modeler/projects", true);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("ENO_CSRF_TOKEN", token);

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status, xhr.responseText);
        }
    };

    xhr.send(JSON.stringify(payload));
}
