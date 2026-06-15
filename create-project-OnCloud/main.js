(function () {

    function waitForWidget() {

        if (typeof widget === "undefined") {
            console.log("Waiting for widget object...");
            setTimeout(waitForWidget, 500);
            return;
        }

        console.log("Widget object found");

        widget.addEvent("onLoad", function () {

            console.log("Widget Loaded");

            widget.body.innerHTML =
                '<h3>Create Project Space</h3>' +
                '<input id="projectName" placeholder="Project Name"><br>' +
                '<input id="projectDescription" placeholder="Description"><br>' +
                '<button id="createBtn">Create Project</button>' +
                '<div id="result"></div>';

            document.getElementById("createBtn").onclick = createProject;
        });
    }

    waitForWidget();

})();

function createProject() {

    console.log("Create Project Clicked");

    require(
        [
            "DS/WAFData/WAFData",
            "DS/i3DXCompassServices/i3DXCompassServices"
        ],
        function (
            WAFData,
            CompassServices
        ) {

            console.log("Modules Loaded");

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    console.log("Services Received");
                    console.log(services);

                    var spaceUrl = services["3DSpace"];

                    console.log("3DSpace URL:", spaceUrl);

                    var csrfUrl =
                        spaceUrl + "/resources/v1/application/CSRF";

                    WAFData.authenticatedRequest(
                        csrfUrl,
                        {
                            method: "GET",
                            type: "json",

                            onComplete: function (csrfResponse) {

                                console.log("CSRF SUCCESS");

                                var csrfToken =
                                    csrfResponse.csrf.value;

                                createProjectRequest(
                                    WAFData,
                                    spaceUrl,
                                    csrfToken
                                );
                            },

                            onFailure: function (error) {

                                console.log("CSRF FAILED");
                                console.log(error);

                                document.getElementById("result").innerHTML =
                                    "<span style='color:red'>CSRF FAILED</span>";
                            }
                        }
                    );
                },

                onFailure: function (error) {

                    console.log("SERVICE DISCOVERY FAILED");
                    console.log(error);
                }
            });
        }
    );
}

function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken
) {

    var payload = {
        data: [
            {
                type: "Project Space",
                dataelements: {
                    title: document.getElementById("projectName").value,
                    description: document.getElementById("projectDescription").value
                }
            }
        ]
    };

    console.log("Payload:");
    console.log(JSON.stringify(payload, null, 2));

    var projectUrl =
        spaceUrl + "/resources/v1/modeler/projects";

    WAFData.authenticatedRequest(
        projectUrl,
        {
            method: "POST",
            type: "json",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "ENO_CSRF_TOKEN": csrfToken
            },

            data: JSON.stringify(payload),

            onComplete: function (response) {

                console.log("PROJECT CREATED");
                console.log(response);

                document.getElementById("result").innerHTML =
                    "<span style='color:green'>Project Created Successfully</span>";
            },

            onFailure: function (error) {

                console.log("PROJECT FAILED");
                console.log(error);

                document.getElementById("result").innerHTML =
                    "<span style='color:red'>PROJECT FAILED</span>";
            }
        }
    );
}
