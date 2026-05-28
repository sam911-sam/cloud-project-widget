javascript
console.log("main.js loaded");

window.onload = function () {

    console.log("window loaded");

    document
        .getElementById("createBtn")
        .addEventListener("click", function () {

            console.log("Button clicked");

            createProject();
        });
};

function getCSRFToken(callback) {

    var xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        "/3dspace/resources/v1/application/CSRF",
        true
    );

    xhr.setRequestHeader(
        "Accept",
        "application/json"
    );

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {

            console.log("CSRF RESPONSE");
            console.log(xhr.responseText);

            if (xhr.status === 200) {

                var response =
                    JSON.parse(xhr.responseText);

                callback(response.csrf.value);
            }
        }
    };

    xhr.send();
}

function createProject() {

    var name =
        document.getElementById("projectName").value;

    var description =
        document.getElementById("projectDescription").value;

    getCSRFToken(function (csrfToken) {

        sendCreateRequest(
            name,
            description,
            csrfToken
        );
    });
}

function sendCreateRequest(
    name,
    description,
    csrfToken
) {

    var payload = {

        data: [
            {
                type: "Project Space",

                dataelements: {
                    title: name,
                    description: description
                }
            }
        ]
    };

    console.log("PAYLOAD");
    console.log(JSON.stringify(payload));

    var xhr = new XMLHttpRequest();

    xhr.open(
        "POST",
        "/3dspace/resources/v1/modeler/projects",
        true
    );

    xhr.setRequestHeader(
        "Content-Type",
        "application/json"
    );

    xhr.setRequestHeader(
        "Accept",
        "application/json"
    );

    xhr.setRequestHeader(
        "ENO_CSRF_TOKEN",
        csrfToken
    );



    // CHANGE THIS VALUE
    xhr.setRequestHeader(
        "SecurityContext",
        "ctx::VPLMProjectLeader.MyCompany.Common Space"
    );



    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {

            console.log("STATUS");
            console.log(xhr.status);

            console.log("RESPONSE");
            console.log(xhr.responseText);

            var result =
                document.getElementById("result");

            if (
                xhr.status === 200 ||
                xhr.status === 201
            ) {

                result.innerHTML =
                    "Project Created Successfully";

                result.style.color =
                    "green";

            } else {

                result.innerHTML =
                    "Project Creation Failed";

                result.style.color =
                    "red";
            }
        }
    };

    xhr.send(JSON.stringify(payload));
}

