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

                    '<div class="dxp-header">' +
                        'Create Project From Template' +
                    '</div>' +

                    '<div class="dxp-form">' +

                        '<div class="dxp-field">' +
                            '<label>Project Template</label>' +
                            '<select id="projectTemplate">' +
                                '<option value="">Loading templates...</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Project Name</label>' +
                            '<input id="projectName" placeholder="Enter project name">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input id="projectDescription" placeholder="Enter description">' +
                        '</div>' +

                        '<div class="dxp-actions">' +
                            '<button id="createBtn">Create Project</button>' +
                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';

            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

            initialize();

        });
    }

    waitForWidget();

})();


/*
 * Global variables
 */
var projectSpaceUrl = null;
var csrfToken = null;


/*
 * Initialize widget
 */
function initialize() {

    console.log("Initializing widget...");

    require(
        [
            "DS/WAFData/WAFData",
            "DS/i3DXCompassServices/i3DXCompassServices"
        ],
        function (WAFData, CompassServices) {

            console.log("Modules Loaded");

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    console.log("Platform services received");
                    console.log(services);

                    projectSpaceUrl = services["3DSpace"];

                    console.log(
                        "3DSpace URL:",
                        projectSpaceUrl
                    );

                    getCSRFToken(
                        WAFData,
                        projectSpaceUrl
                    );

                },

                onFailure: function (error) {

                    console.log(
                        "SERVICE DISCOVERY FAILED"
                    );

                    console.log(error);

                    showError(
                        "Unable to get 3DSpace service."
                    );
                }

            });

        }
    );
}


/*
 * Get CSRF token
 */
function getCSRFToken(
    WAFData,
    spaceUrl
) {

    console.log("Getting CSRF token...");

    var csrfUrl =
        spaceUrl +
        "/resources/v1/application/CSRF";

    WAFData.authenticatedRequest(
        csrfUrl,
        {
            method: "GET",
            type: "json",

            onComplete: function (response) {

                console.log("CSRF SUCCESS");
                console.log(response);

                if (
                    response &&
                    response.csrf &&
                    response.csrf.value
                ) {

                    csrfToken =
                        response.csrf.value;

                    console.log(
                        "CSRF Token received"
                    );

                    /*
                     * Now load project templates
                     */
                    searchProjectTemplates(
                        WAFData,
                        spaceUrl
                    );

                } else {

                    showError(
                        "CSRF token was not returned."
                    );
                }
            },

            onFailure: function (error) {

                console.log("CSRF FAILED");
                console.log(error);

                showError(
                    "CSRF request failed."
                );
            }
        }
    );
}


/*
 * Search Project Templates
 */
function searchProjectTemplates(
    WAFData,
    spaceUrl
) {

    console.log(
        "Searching project templates..."
    );

    /*
     * We need at least 2 characters.
     *
     * Change this if you know part of
     * your template name.
     */
    var searchText = "Project";

    var templateUrl =
        spaceUrl +
        "/resources/v1/modeler/projecttemplates/search" +
        "?searchStr=" +
        encodeURIComponent(searchText) +
        "&$top=100";

    console.log(
        "Template Search URL:",
        templateUrl
    );

    WAFData.authenticatedRequest(
        templateUrl,
        {
            method: "GET",
            type: "json",

            headers: {
                "Accept": "application/json"
            },

            onComplete: function (response) {

                console.log(
                    "TEMPLATE SEARCH SUCCESS"
                );

                console.log(response);

                populateTemplates(
                    response
                );
            },

            onFailure: function (error) {

                console.log(
                    "TEMPLATE SEARCH FAILED"
                );

                console.log(error);

                showError(
                    "Unable to load project templates."
                );
            }
        }
    );
}


/*
 * Populate template dropdown
 */
function populateTemplates(response) {

    var select =
        document.getElementById("projectTemplate");

    select.innerHTML =
        '<option value="">Select Project Template</option>';

    if (
        !response ||
        !response.data ||
        response.data.length === 0
    ) {

        select.innerHTML =
            '<option value="">No project templates found</option>';

        showError("No project templates found.");

        return;
    }

    console.log("ALL SEARCH RESULTS:");
    console.log(response.data);


    /*
     * Keep ONLY Project Template objects
     */
    var projectTemplates =
        response.data.filter(function (template) {

            console.log(
                "Object:",
                template.id,
                "Type:",
                template.type
            );

            return (
                template.type === "Project Template"
            );

        });


    console.log(
        "FILTERED PROJECT TEMPLATES:"
    );

    console.log(projectTemplates);


    if (projectTemplates.length === 0) {

        select.innerHTML =
            '<option value="">No Project Template objects found</option>';

        showError(
            "Search returned objects, but none are Project Template type."
        );

        return;
    }


    /*
     * Add only Project Template objects
     */
    projectTemplates.forEach(
        function (template) {

            var option =
                document.createElement("option");

            option.value =
                template.id;


            var title = "";

            if (
                template.dataelements &&
                template.dataelements.title
            ) {

                title =
                    template.dataelements.title;

            } else if (
                template.dataelements &&
                template.dataelements.name
            ) {

                title =
                    template.dataelements.name;

            } else {

                title =
                    template.id;
            }


            option.text =
                title;


            /*
             * Store complete object
             */
            option.templateObject =
                template;


            select.appendChild(option);

        }
    );


    console.log(
        "Project Templates loaded:",
        projectTemplates.length
    );
}



/*
 * Create Project From Template
 */
function createProjectFromTemplate() {

    console.log(
        "Create Project From Template clicked"
    );

    var templateId =
        document.getElementById(
            "projectTemplate"
        ).value;

    var projectName =
        document.getElementById(
            "projectName"
        ).value.trim();

    var description =
        document.getElementById(
            "projectDescription"
        ).value.trim();


    /*
     * Validation
     */
    if (!templateId) {

        showError(
            "Please select a project template."
        );

        return;
    }

    if (!projectName) {

        showError(
            "Please enter project name."
        );

        return;
    }


    if (!projectSpaceUrl) {

        showError(
            "3DSpace URL is not available."
        );

        return;
    }


    if (!csrfToken) {

        showError(
            "CSRF token is not available."
        );

        return;
    }


    require(
        [
            "DS/WAFData/WAFData"
        ],
        function (WAFData) {

            createProjectRequest(
                WAFData,
                projectSpaceUrl,
                csrfToken,
                templateId,
                projectName,
                description
            );

        }
    );
}


/*
 * POST /projects/fromTemplate
 */
function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    templateId,
    projectName,
    description
) {

    /*
     * Get the selected template object
     */
    var select =
        document.getElementById("projectTemplate");

    var selectedOption =
        select.options[select.selectedIndex];

    var templateObject =
        selectedOption.templateObject;


    console.log("SELECTED TEMPLATE OBJECT:");
    console.log(templateObject);


    /*
     * IMPORTANT:
     * Use the actual type returned by ENOVIA.
     */
    var templateType =
        templateObject.type;


    console.log(
        "Template ID:",
        templateId
    );

    console.log(
        "Template Type:",
        templateType
    );


    /*
     * Build payload according to:
     *
     * POST /projects/fromTemplate
     */
    var payload = {

        data: [

            {

                type: "Project Space",

                dataelements: {

                    title: projectName,

                    description: description,

                    scheduleFrom:
                        "Project Start Date",

                    defaultConstraintType:
                        "As Soon As Possible",

                    currency:
                        "Unassigned"

                },

                relateddata: {

                    projectTemplate: [

                        {

                            id: templateId,

                            type: templateType

                        }

                    ]

                }

            }

        ]

    };


    console.log(
        "======================================"
    );

    console.log(
        "PROJECT FROM TEMPLATE PAYLOAD"
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );

    console.log(
        "======================================"
    );


    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects/fromTemplate";


    console.log(
        "POST URL:",
        projectUrl
    );


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
                    "======================================"
                );

                console.log(
                    "PROJECT CREATED SUCCESSFULLY"
                );

                console.log(response);

                console.log(
                    "======================================"
                );


                showSuccess(
                    "Project Created Successfully From Template"
                );

            },


            onFailure: function (error) {

                console.log(
                    "======================================"
                );

                console.log(
                    "PROJECT CREATION FAILED"
                );

                console.log(error);


                /*
                 * Print everything we can get
                 * from the error object.
                 */
                console.log(
                    "Error type:",
                    typeof error
                );

                console.log(
                    "Error object:",
                    error
                );


                try {

                    console.log(
                        "Error JSON:"
                    );

                    console.log(
                        JSON.stringify(
                            error,
                            null,
                            2
                        )
                    );

                } catch (e) {

                    console.log(
                        "Could not stringify error"
                    );

                }


                /*
                 * Try to extract server response
                 */
                var serverMessage =
                    "PROJECT CREATION FAILED";


                if (error) {

                    if (error.message) {

                        serverMessage +=
                            ": " +
                            error.message;

                    } else if (
                        error.error
                    ) {

                        serverMessage +=
                            ": " +
                            error.error;

                    }

                }


                showError(
                    serverMessage
                );

            }

        }
    );
}



/*
 * Success message
 */
function showSuccess(message) {

    var result =
        document.getElementById("result");

    result.className =
        "success";

    result.innerHTML =
        message;
}


/*
 * Error message
 */
function showError(message) {

    var result =
        document.getElementById("result");

    result.className =
        "error";

    result.innerHTML =
        message;
}
