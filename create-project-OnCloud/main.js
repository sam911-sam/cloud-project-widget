console.log("Widget Loaded");

window.onload = function () {

    document
        .getElementById("createBtn")
        .onclick = createProject;
};

function createProject() {

    console.log("Create Project Clicked");

    var projectName =
        document.getElementById("projectName").value;

    var projectDescription =
        document.getElementById("projectDescription").value;

    require([
        "DS/WAFData/WAFData",
        "DS/PlatformAPI/PlatformAPI"
    ], function (WAFData, PlatformAPI) {

        console.log("Modules Loaded");

        PlatformAPI.getAllApplicationConfigurations({

            onSuccess: function (services) {

                console.log("Services Received");
                console.log(services);

                var spaceUrl =
                    services["3DSpace"] ||
                    services["3dspace"];

                var csrfUrl =
                    spaceUrl +
                    "/resources/v1/application/CSRF";

                WAFData.authenticatedRequest(
                    csrfUrl,
                    {
                        method: "GET",

                        onComplete: function (csrfResponse) {

                            var csrfToken =
                                csrfResponse.csrf.value;

                            console.log(
                                "CSRF TOKEN:",
                                csrfToken
                            );

                            createProjectObject(
                                WAFData,
                                spaceUrl,
                                csrfToken,
                                projectName,
                                projectDescription
                            );
                        },

                        onFailure: function (error) {

                            console.log(error);

                            document
                                .getElementById("result")
                                .innerHTML =
                                "Failed to get CSRF";
                        }
                    }
                );
            }
        });
    });
}

function createProjectObject(
    WAFData,
    spaceUrl,
    csrfToken,
    projectName,
    projectDescription
) {

    var payload = {

        data: [
            {
                type: "Project Space",

                dataelements: {

                    title: projectName,

                    description:
                        projectDescription
                }
            }
        ]
    };

    console.log("PAYLOAD");
    console.log(payload);

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects";

    WAFData.authenticatedRequest(
        projectUrl,
        {
            method: "POST",

            headers: {

                "ENO_CSRF_TOKEN":
                    csrfToken,

                "Content-Type":
                    "application/json"
            },

            data:
                JSON.stringify(payload),

            onComplete: function (
                response
            ) {

                console.log(
                    "PROJECT CREATED"
                );

                console.log(
                    JSON.stringify(
                        response,
                        null,
                        2
                    )
                );

                if (
                    response.data &&
                    response.data.length
                ) {

                    console.log(
                        "Project ID:",
                        response.data[0].id
                    );

                    console.log(
                        "Project Name:",
                        response.data[0]
                            .identifier
                    );
                }

                document
                    .getElementById(
                        "result"
                    )
                    .innerHTML =
                    "Project Created Successfully";
            },

            onFailure: function (
                error
            ) {

                console.log(
                    "FAILED"
                );

                console.log(
                    error
                );

                document
                    .getElementById(
                        "result"
                    )
                    .innerHTML =
                    "Project Creation Failed";
            }
        }
    );
}
