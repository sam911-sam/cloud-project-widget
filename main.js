console.log("main.js loaded");

const BASE_URL = "/3dspace"; 
//  IMPORTANT:
// Replace this when deploying on-premise, example:
// const BASE_URL = "https://your-server.com/3dspace";

window.onload = function () {
    console.log("onLoad triggered");

    var btn = document.getElementById("createBtn");

    if (!btn) {
        console.error("createBtn not found in HTML");
        return;
    }

    btn.onclick = function () {
        console.log("CLICK EVENT FIRED");
        createProject();
    };

    console.log("Button event attached successfully");
};

function getCSRF(callback) {
    var xhr = new XMLHttpRequest();

    xhr.open("GET", BASE_URL + "/resources/v1/application/CSRF", true);

    xhr.setRequestHeader("Accept", "application/json");
    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log("CSRF status:", xhr.status);
            console.log("CSRF response:", xhr.responseText);

            if (xhr.status === 200) {
                try {
                    var response = JSON.parse(xhr.responseText);
                    var token = response.csrf.value;

                    console.log("CSRF token:", token);
                    callback(token);

                } catch (e) {
                    console.error("CSRF parse error", e);
                }
            } else {
                console.error("CSRF request failed");
            }
        }
    };

    xhr.send();
}

function createProject() {
    console.log("Create Project clicked");

    var nameEl = document.getElementById("projectName");
    var descEl = document.getElementById("projectDescription");

    if (!nameEl || !descEl) {
        console.error("Missing input fields in HTML");
        return;
    }

    var name = nameEl.value;
    var desc = descEl.value;

    console.log("Input:", name, desc);

    getCSRF(function (csrfToken) {

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

        console.log("Payload:", JSON.stringify(payload, null, 2));

        sendRequest(payload, csrfToken);
    });
}

function sendRequest(payload, csrfToken) {
    var xhr = new XMLHttpRequest();

    xhr.open("POST", BASE_URL + "/resources/v1/modeler/projects", true);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("ENO_CSRF_TOKEN", csrfToken);

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log("HTTP Status:", xhr.status);
            console.log("Response:", xhr.responseText);

            var resultDiv = document.getElementById("result");

            if (!resultDiv) return;

            if (xhr.status === 200 || xhr.status === 201) {
                resultDiv.innerHTML = "Project created successfully";
                resultDiv.style.color = "green";
            } else {
                resultDiv.innerHTML = "Project creation failed";
                resultDiv.style.color = "red";
            }
        }
    };

    xhr.send(JSON.stringify(payload));
}
