console.log("main.js loaded");

window.onload = function () {

    console.log("window loaded");

    document.getElementById("createBtn")
        .addEventListener("click", function () {

        console.log("Button clicked");

        createProject();
    });
};

function getCSRF(callback) {

    var xhr = new XMLHttpRequest();

    xhr.open(
        "GET",
        "/3dspace/resources/v1/application/CSRF",
        true
    );

    xhr.setRequestHeader("Accept", "application/json");

    xhr.withCredentials = true;

    xhr.onreadystatechange = function () {

        if (xhr.readyState === 4) {

            console.log(xhr.responseText);

            if (xhr.status === 200) {

                var response = JSON.parse(xhr.responseText);

                callback(response.csrf.value);
            }
        }
    };

    xhr.send();
}

function createProject() {

    var name =
        document.getElementById("projectName").value;

    var desc =
        document.getElementById("projectDescription").value;

    getCSRF(function (token) {

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
            token
        );

        xhr.withCredentials = true;

        xhr.onreadystatechange = function () {

            if (xhr.readyState === 4) {

                console.log(xhr.responseText);

                if (xhr.status === 200 ||
                    xhr.status === 201) {

                    document.getElementById("result")
                        .innerHTML =
                        "Project Created Successfully";

                } else {

                    document.getElementById("result")
                        .innerHTML =
                        "Project Creation Failed";
                }
            }
        };

        xhr.send(JSON.stringify(payload));
    });
}