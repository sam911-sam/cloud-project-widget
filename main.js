console.log("main.js loaded");

window.onload = function () {

    console.log("onLoad triggered");

    var btn = document.getElementById("createBtn");

    btn.onclick = function () {
        console.log("CLICK EVENT FIRED");
        createProject();
    };

    console.log("Button event attached successfully");
};


// --------------------
// 1. GET CSRF TOKEN
// --------------------
function getCSRF(callback) {

    var xhr = new XMLHttpRequest();

    xhr.open("GET", "/3dspace/resources/v1/application/CSRF", true);

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

                    console.log("CSRF TOKEN:", token);

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


// --------------------
// 2. CREATE PROJECT
// --------------------
function createProject() {

    console.log("Create Project clicked");

    var name = document.getElementById("projectName").value;
    var desc = document.getElementById("projectDescription").value;

    console.log("Input:", name, desc);

    getCSRF(function (csrfToken) {

        var payload = {
            data: [
                {
                    type: "Project Space",   // IMPORTANT: must match backend
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


// --------------------
// 3. SEND API REQUEST
// --------------------
function sendRequest(payload, csrfToken) {

    var xhr = new XMLHttpRequest();

    var baseUrl = "/3dspace";

    xhr.open(
        "POST",
        baseUrl + "/resources/v1/modeler/projects", //  confirm this endpoint in your system
        true
    );

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("ENO_CSRF_TOKEN", csrfToken);

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {

            console.log("HTTP Status:", xhr.status);
            console.log("Response:", xhr.responseText);

            var resultDiv = document.getElementById("result");

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
