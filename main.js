console.log("main.js loaded");

window.onload = function () {

    console.log("window loaded");

    var btn = document.getElementById("createBtn");

    if (!btn) {
        console.log("Button not found");
        return;
    }

    btn.onclick = function () {
        console.log("Button clicked");
        createProject();
    };
};

function createProject() {

    console.log("createProject called");

    var name = document.getElementById("projectName").value;
    var desc = document.getElementById("projectDescription").value;

    console.log("Input:", name, desc);

    getCSRF(function (token) {

        console.log("CSRF received:", token);

        var payload = {
            data: [
                {
                    type: "Project Space",
                    dataelements: {
                        title: name,
                        description: desc
                    }
                }
            ]
        };

        sendRequest(payload, token);
    });
}

function getCSRF(callback) {

    console.log("Fetching CSRF...");

    var xhr = new XMLHttpRequest();

    // IMPORTANT: THIS ONLY WORKS INSIDE 3DEX DASHBOARD
    xhr.open("GET", "/3dspace/resources/v1/application/CSRF", true);

    xhr.setRequestHeader("Accept", "application/json");

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {

            console.log("CSRF status:", xhr.status);

            if (xhr.status === 200) {

                var response = JSON.parse(xhr.responseText);
                callback(response.csrf.value);

            } else {
                console.error("CSRF failed:", xhr.responseText);
            }
        }
    };

    xhr.send();
}

function sendRequest(payload, token) {

    console.log("Sending request...");

    var xhr = new XMLHttpRequest();

    xhr.open("POST", "/3dspace/resources/v1/modeler/projects", true);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("ENO_CSRF_TOKEN", token);

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {

            console.log("Response:", xhr.status, xhr.responseText);

            var result = document.getElementById("result");

            if (xhr.status === 200 || xhr.status === 201) {
                result.innerText = "Project Created Successfully";
                result.style.color = "green";
            } else {
                result.innerText = "Project Creation Failed";
                result.style.color = "red";
            }
        }
    };

    xhr.send(JSON.stringify(payload));
}
