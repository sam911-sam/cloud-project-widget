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
                '<div class="dxp-container">' +

                    '<div class="dxp-header">Create Project From Template</div>' +

                    '<div class="dxp-form">' +

                        '<div class="dxp-field">' +
                            '<label>Project Name</label>' +
                            '<input id="projectName" placeholder="Enter project name">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input id="projectDescription" placeholder="Enter description">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Project Template ID</label>' +
                            '<input id="templateId" ' +
                            'placeholder="Enter Project Template ID">' +
                        '</div>' +

                        '<div class="dxp-actions">' +
                            '<button id="createBtn">Create Project</button>' +
                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';

            document.getElementById("createBtn").onclick = createProjectFromTemplate;

        });
    }

    waitForWidget();

})();


function createProjectFromTemplate() {

    console.log("Create Project From Template Clicked");

    var projectName =
        document.getElementById("projectName").value.trim();

    var projectDescription =
        document.getElementById("projectDescription").value.trim();

    var templateId =
        document.getElementById("templateId").value.trim();

    var result =
        document.getElementById("result");


    // -----------------------------
    // Validate input
    // -----------------------------

    if (!projectName) {

        result.innerHTML =
            "<span style='color:red'>Please enter Project Name</span>";

        return;
    }

    if (!templateId) {

        result.innerHTML =
            "<span style='color:red'>Please enter Project Template ID</span>";

        return;
    }


    console.log("Project Name:", projectName);
    console.log("Description:", projectDescription);
    console.log("Template ID:", templateId);


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


            // -----------------------------
            // Get 3DSpace service
            // -----------------------------

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    console.log("Services Received");
                    console.log(services);


                    var spaceUrl =
                        services["3DSpace"];


                    console.log(
                        "3DSpace URL:",
                        spaceUrl
                    );


                    // -----------------------------
                    // Get CSRF token
                    // -----------------------------

                    var csrfUrl =
                        spaceUrl +
                        "/resources/v1/application/CSRF";


                    console.log(
                        "CSRF URL:",
                        csrfUrl
                    );


                    WAFData.authenticatedRequest(
                        csrfUrl,
                        {

                            method: "GET",

                            type: "json",


                            onComplete: function (csrfResponse) {

                                console.log("CSRF SUCCESS");
                                console.log(csrfResponse);


                                var csrfToken =
                                    csrfResponse.csrf.value;


                                console.log(
                                    "CSRF Token Received"
                                );


                                // -----------------------------
                                // Create project from template
                                // -----------------------------

                                createProjectFromTemplateRequest(
                                    WAFData,
                                    spaceUrl,
                                    csrfToken,
                                    projectName,
                                    projectDescription,
                                    templateId
                                );

                            },


                            onFailure: function (error) {

                                console.log("CSRF FAILED");
                                console.log(error);

                                result.innerHTML =
                                    "<span style='color:red'>" +
                                    "CSRF FAILED" +
                                    "</span>";
                            }
                        }
                    );
                },


                onFailure: function (error) {

                    console.log(
                        "SERVICE DISCOVERY FAILED"
                    );

                    console.log(error);

                    result.innerHTML =
                        "<span style='color:red'>" +
                        "SERVICE DISCOVERY FAILED" +
                        "</span>";
                }
            });
        }
    );
}


function createProjectFromTemplateRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    projectName,
    projectDescription,
    templateId
) {

    // -----------------------------
    // Payload
    // -----------------------------

    var payload = {

        data: [

            {

                type: "Project Space",

                dataelements: {

                    constraintDate: "",

                    scheduleFrom:
                        "Project Start Date",

                    defaultConstraintType:
                        "As Soon As Possible",

                    currency:
                        "Unassigned",

                    title:
                        projectName,

                    description:
                        projectDescription
                },


                relateddata: {

                    projectTemplate: [

                        {

                            id: templateId,

                            type: "Project Template",

                            identifier: templateId,

                            source: spaceUrl,

                            relativePath:
                                "/resources/v1/modeler/projects/" +
                                templateId,

                            cestamp: ""

                        }

                    ]
                }
            }
        ]
    };


    console.log(
        "Project From Template Payload:"
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );


    // -----------------------------
    // API URL
    // -----------------------------

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects/fromTemplate";


    console.log(
        "Project From Template URL:",
        projectUrl
    );


    // -----------------------------
    // POST request
    // -----------------------------

    WAFData.authenticatedRequest(
        projectUrl,
        {

            method: "POST",

            type: "json",


            headers: {

                "Content-Type":
                    "application/json",

                "Accept":
                    "application/json",

                "ENO_CSRF_TOKEN":
                    csrfToken
            },


            data:
                JSON.stringify(payload),


            onComplete: function (response) {

                console.log(
                    "PROJECT CREATED FROM TEMPLATE"
                );

                console.log(response);


                document.getElementById("result").innerHTML =
                    "<span style='color:green'>" +
                    "Project Created Successfully From Template" +
                    "</span>";
            },


            onFailure: function (error) {

                console.log(
                    "PROJECT FROM TEMPLATE FAILED"
                );

                console.log(error);


                document.getElementById("result").innerHTML =
                    "<span style='color:red'>" +
                    "PROJECT CREATION FAILED" +
                    "</span>";

            }
        }
    );
}
