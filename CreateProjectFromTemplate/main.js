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

                        // TEMPLATE SEARCH
                        '<div class="dxp-field">' +
                            '<label>Project Template</label>' +

                            '<div class="dxp-search-row">' +

                                '<input ' +
                                    'id="templateSearch" ' +
                                    'placeholder="Enter template name..." ' +
                                    'autocomplete="off">' +

                                '<button ' +
                                    'id="searchTemplateBtn" ' +
                                    'class="dxp-search-button">' +
                                    'Search' +
                                '</button>' +

                            '</div>' +
                        '</div>' +

                        // TEMPLATE LIST
                        '<div class="dxp-field">' +
                            '<label>Select Template</label>' +

                            '<select id="projectTemplate">' +
                                '<option value="">Search for a template first</option>' +
                            '</select>' +

                        '</div>' +

                        // PROJECT NAME
                        '<div class="dxp-field">' +
                            '<label>Project Name</label>' +
                            '<input ' +
                                'id="projectName" ' +
                                'placeholder="Enter project name">' +
                        '</div>' +

                        // DESCRIPTION
                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input ' +
                                'id="projectDescription" ' +
                                'placeholder="Enter description">' +
                        '</div>' +

                        // CREATE BUTTON
                        '<div class="dxp-actions">' +
                            '<button ' +
                                'id="createBtn" ' +
                                'class="dxp-create-button">' +
                                'Create Project' +
                            '</button>' +
                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';


            // BUTTON EVENTS

            document.getElementById("searchTemplateBtn").onclick =
                searchTemplateButtonClicked;

            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

            initialize();

        });
    }

    waitForWidget();

})();


/*
 * GLOBAL VARIABLES
 */

var projectSpaceUrl = null;
var csrfToken = null;


/*
 * INITIALIZE
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

                platformId:
                    widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    console.log("Services Received");
                    console.log(services);

                    projectSpaceUrl =
                        services["3DSpace"];

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
 * GET CSRF TOKEN
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
 * SEARCH BUTTON CLICK
 */

function searchTemplateButtonClicked() {

    var searchText =
        document.getElementById(
            "templateSearch"
        ).value.trim();

    console.log(
        "Searching Template:",
        searchText
    );


    /*
     * API requires minimum 2 characters
     */

    if (searchText.length < 2) {

        showError(
            "Enter at least 2 characters to search."
        );

        return;
    }


    if (!projectSpaceUrl) {

        showError(
            "3DSpace URL is not available."
        );

        return;
    }


    require(
        [
            "DS/WAFData/WAFData"
        ],

        function (WAFData) {

            searchProjectTemplates(
                WAFData,
                projectSpaceUrl,
                searchText
            );

        }
    );
}


/*
 * SEARCH PROJECT TEMPLATES
 */

function searchProjectTemplates(
    WAFData,
    spaceUrl,
    searchText
) {

    console.log(
        "Searching project templates..."
    );


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


    showInfo(
        "Searching templates..."
    );


    WAFData.authenticatedRequest(
        templateUrl,
        {

            method: "GET",

            type: "json",

            headers: {

                "Accept":
                    "application/json"

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
                    "Template search failed."
                );
            }
        }
    );
}


/*
 * POPULATE TEMPLATE LIST
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
            '<option value="">No templates found</option>';

        showError("No project templates found.");

        return;
    }

    console.log("ALL SEARCH RESULTS:");
 console.log(
    "SELECTED/ALL TEMPLATE DATA:",
    JSON.stringify(response.data, null, 2)
);


    var projectTemplates =
        response.data.filter(function (template) {

            console.log(
                "Template:",
                template.id,
                "Type:",
                template.type,
                "Title:",
                template.dataelements &&
                template.dataelements.title
            );

            return template.type === "Project Template";
        });

    console.log(
        "FILTERED PROJECT TEMPLATES:",
        projectTemplates
    );

    if (projectTemplates.length === 0) {

        select.innerHTML =
            '<option value="">No Project Template objects found</option>';

        showError(
            "Search returned objects, but none are Project Template type."
        );

        return;
    }

    projectTemplates.forEach(function (template) {

        var option =
            document.createElement("option");

        option.value = template.id;

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

        option.text = title;

        /*
         * Store the complete API object.
         */
        option.templateObject = template;

        select.appendChild(option);
    });

    console.log(
        "Project Templates loaded:",
        projectTemplates.length
    );
}



/*
 * CREATE PROJECT FROM TEMPLATE
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
     * VALIDATION
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
 * CREATE PROJECT REQUEST
 */

function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    templateId,
    projectName,
    description
) {

    var select =
        document.getElementById("projectTemplate");

    var selectedOption =
        select.options[select.selectedIndex];

    var template =
        selectedOption.templateObject;

    console.log("=================================");
    console.log("SELECTED TEMPLATE OBJECT");
    console.log(template);
    console.log("=================================");

    if (!template) {

        showError(
            "Selected template information is not available."
        );

        return;
    }

    /*
     * Build the project template reference
     * according to the API schema.
     */
    var templateReference = {

        id: template.id,

        type: template.type,

        identifier: template.id,

        source: spaceUrl,

        relativePath:
            "/resources/v1/modeler/projecttemplates/" +
            template.id,

        cestamp: template.cestamp
    };


    console.log(
        "PROJECT TEMPLATE REFERENCE:"
    );

    console.log(
        JSON.stringify(
            templateReference,
            null,
            2
        )
    );


    /*
     * Create project payload
     */
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
                        description
                },

                relateddata: {

                    projectTemplate: [

                        templateReference

                    ]

                }

            }

        ]

    };


    console.log(
        "================================="
    );

    console.log(
        "CREATE PROJECT FROM TEMPLATE"
    );

    console.log(
        "Template ID:",
        template.id
    );

    console.log(
        "Template Type:",
        template.type
    );

    console.log(
        "Template Cestamp:",
        template.cestamp
    );

    console.log(
        "Payload:"
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );

    console.log(
        "================================="
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
                    "================================="
                );

                console.log(
                    "PROJECT CREATED FROM TEMPLATE"
                );

                console.log(response);

                console.log(
                    "================================="
                );

                showSuccess(
                    "Project Created Successfully From Template"
                );

            },

            onFailure: function (error) {

                console.log(
                    "================================="
                );

                console.log(
                    "PROJECT CREATION FAILED"
                );

                console.log(error);

                console.log(
                    "================================="
                );

                showError(
                    "PROJECT CREATION FAILED: " +
                    (
                        error && error.message
                            ? error.message
                            : "400 Bad Request"
                    )
                );

            }

        }
    );
}



/*
 * SUCCESS MESSAGE
 */

function showSuccess(message) {

    var result =
        document.getElementById(
            "result"
        );


    result.className =
        "success";


    result.innerHTML =
        message;
}


/*
 * ERROR MESSAGE
 */

function showError(message) {

    var result =
        document.getElementById(
            "result"
        );


    result.className =
        "error";


    result.innerHTML =
        message;
}


/*
 * INFO MESSAGE
 */

function showInfo(message) {

    var result =
        document.getElementById(
            "result"
        );


    result.className =
        "info";


    result.innerHTML =
        message;
}
