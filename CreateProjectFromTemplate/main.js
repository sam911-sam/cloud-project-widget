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
                            '<label>Project Name</label>' +
                            '<input id="projectName" placeholder="Enter project name">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input id="projectDescription" placeholder="Enter description">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Project Template</label>' +
                            '<input id="templateSearch" placeholder="Enter at least 2 characters">' +
                        '</div>' +

                        '<div class="dxp-actions">' +
                            '<button id="searchTemplateBtn">Search Templates</button>' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Select Project Template</label>' +
                            '<select id="templateSelect">' +
                                '<option value="">-- Select Template --</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="dxp-actions">' +
                            '<button id="createBtn">Create Project</button>' +
                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';

            document.getElementById("searchTemplateBtn").onclick =
                searchProjectTemplates;

            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

        });
    }

    waitForWidget();

})();


/* =========================================================
   SEARCH PROJECT TEMPLATES
   ========================================================= */

function searchProjectTemplates() {

    var searchInput =
        document.getElementById("templateSearch");

    var searchStr =
        searchInput.value.trim();

    if (searchStr.length < 2) {

        document.getElementById("result").innerHTML =
            "<span class='error'>" +
            "Enter at least 2 characters to search." +
            "</span>";

        return;
    }

    console.log("======================================");
    console.log("SEARCH PROJECT TEMPLATES");
    console.log("Search:", searchStr);

    require(
        [
            "DS/WAFData/WAFData",
            "DS/i3DXCompassServices/i3DXCompassServices"
        ],

        function (WAFData, CompassServices) {

            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    var spaceUrl =
                        services["3DSpace"];

                    console.log("3DSpace URL:", spaceUrl);

                    var searchUrl =
                        spaceUrl +
                        "/resources/v1/modeler/projecttemplates/search" +
                        "?searchStr=" +
                        encodeURIComponent(searchStr) +
                        "&$top=100";

                    console.log("Search URL:");
                    console.log(searchUrl);

                    WAFData.authenticatedRequest(
                        searchUrl,
                        {
                            method: "GET",
                            type: "json",

                            headers: {
                                "Accept": "application/json"
                            },

                            onComplete: function (response) {

                                console.log(
                                    "PROJECT TEMPLATE SEARCH RESPONSE:"
                                );

                                console.log(response);

                                populateTemplateSelect(response);

                            },

                            onFailure: function (error) {

                                console.log(
                                    "PROJECT TEMPLATE SEARCH FAILED"
                                );

                                console.log(error);

                                document.getElementById("result").innerHTML =
                                    "<span class='error'>" +
                                    "Template search failed." +
                                    "</span>";
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


/* =========================================================
   POPULATE TEMPLATE DROPDOWN
   ========================================================= */

function populateTemplateSelect(response) {

    var select =
        document.getElementById("templateSelect");

    select.innerHTML =
        '<option value="">-- Select Template --</option>';

    if (!response || !response.data) {

        document.getElementById("result").innerHTML =
            "<span class='error'>" +
            "No project templates found." +
            "</span>";

        return;
    }

    /*
     * Only accept Project Template objects.
     */

    var templates =
        response.data.filter(function (item) {

            return item.type === "Project Template";

        });

    console.log("Filtered Project Templates:");
    console.log(templates);

    if (templates.length === 0) {

        document.getElementById("result").innerHTML =
            "<span class='error'>" +
            "No Project Template objects found." +
            "</span>";

        return;
    }

    templates.forEach(function (template) {

        var option =
            document.createElement("option");

        option.value =
            template.id;

        option.text =
            template.dataelements &&
            template.dataelements.title
                ? template.dataelements.title +
                  " (" +
                  (template.dataelements.name || "") +
                  ")"
                : template.id;

        /*
         * Store complete object in DOM.
         */

        option.dataset.template =
            JSON.stringify(template);

        select.appendChild(option);
    });

    document.getElementById("result").innerHTML =
        "<span class='success'>" +
        templates.length +
        " Project Template(s) found." +
        "</span>";
}


/* =========================================================
   CREATE PROJECT FROM TEMPLATE
   ========================================================= */

function createProjectFromTemplate() {

    console.log("======================================");
    console.log("CREATE PROJECT FROM TEMPLATE");

    var projectName =
        document.getElementById("projectName")
            .value
            .trim();

    var description =
        document.getElementById("projectDescription")
            .value
            .trim();

    var select =
        document.getElementById("templateSelect");

    if (!projectName) {

        document.getElementById("result").innerHTML =
            "<span class='error'>" +
            "Please enter Project Name." +
            "</span>";

        return;
    }

    if (!select.value) {

        document.getElementById("result").innerHTML =
            "<span class='error'>" +
            "Please select a Project Template." +
            "</span>";

        return;
    }

    var selectedOption =
        select.options[select.selectedIndex];

    var template =
        JSON.parse(
            selectedOption.dataset.template
        );

    console.log("SELECTED TEMPLATE OBJECT:");
    console.log(template);

    console.log("Template ID:", template.id);
    console.log("Template Type:", template.type);
    console.log("Template Cestamp:", template.cestamp);

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

                    var spaceUrl =
                        services["3DSpace"];

                    console.log(
                        "3DSpace URL:",
                        spaceUrl
                    );

                    /*
                     * STEP 1
                     * Get CSRF token
                     */

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

                                console.log(
                                    "CSRF SUCCESS"
                                );

                                console.log(
                                    csrfResponse
                                );

                                if (
                                    !csrfResponse ||
                                    !csrfResponse.csrf ||
                                    !csrfResponse.csrf.value
                                ) {

                                    console.log(
                                        "CSRF TOKEN NOT FOUND"
                                    );

                                    document.getElementById(
                                        "result"
                                    ).innerHTML =
                                        "<span class='error'>" +
                                        "CSRF token not found." +
                                        "</span>";

                                    return;
                                }

                                var csrfToken =
                                    csrfResponse.csrf.value;

                                console.log(
                                    "CSRF Token received"
                                );

                                /*
                                 * STEP 2
                                 * Get complete Project Template
                                 */

                                getProjectTemplateDetails(
                                    WAFData,
                                    spaceUrl,
                                    csrfToken,
                                    template,
                                    projectName,
                                    description
                                );

                            },

                            onFailure: function (error) {

                                console.log(
                                    "CSRF FAILED"
                                );

                                console.log(error);

                                document.getElementById(
                                    "result"
                                ).innerHTML =
                                    "<span class='error'>" +
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
                }
            });
        }
    );
}


/* =========================================================
   GET COMPLETE PROJECT TEMPLATE DETAILS
   ========================================================= */

function getProjectTemplateDetails(
    WAFData,
    spaceUrl,
    csrfToken,
    template,
    projectName,
    description
) {

    var templateUrl =
        spaceUrl +
        "/resources/v1/modeler/projecttemplates/" +
        encodeURIComponent(template.id);

    console.log("======================================");
    console.log("GET PROJECT TEMPLATE DETAILS");
    console.log(templateUrl);

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
                    "PROJECT TEMPLATE DETAILS RESPONSE:"
                );

                console.log(response);

                var fullTemplate =
                    template;

                if (
                    response &&
                    response.data &&
                    response.data.length > 0
                ) {

                    fullTemplate =
                        response.data[0];
                }

                console.log(
                    "FULL PROJECT TEMPLATE:"
                );

                console.log(fullTemplate);

                createProjectRequest(
                    WAFData,
                    spaceUrl,
                    csrfToken,
                    fullTemplate,
                    projectName,
                    description
                );

            },

            onFailure: function (error) {

                console.log(
                    "GET PROJECT TEMPLATE FAILED"
                );

                console.log(error);

                /*
                 * If GET fails, we can still attempt
                 * using the search object.
                 */

                console.log(
                    "Using template search object instead."
                );

                createProjectRequest(
                    WAFData,
                    spaceUrl,
                    csrfToken,
                    template,
                    projectName,
                    description
                );
            }
        }
    );
}


/* =========================================================
   CREATE PROJECT REQUEST
   ========================================================= */

function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    template,
    projectName,
    description
) {

    console.log("======================================");
    console.log("PREPARING PROJECT FROM TEMPLATE");
    console.log("======================================");

    /*
     * IMPORTANT:
     *
     * The API example expects:
     *
     * projectTemplate:
     * [
     *   {
     *      id
     *      type
     *      identifier
     *      source
     *      relativePath
     *      cestamp
     *   }
     * ]
     */

    var projectTemplateReference = {

        id: template.id,

        type: template.type,

        identifier: template.id,

        source: spaceUrl,

        relativePath:
            "/resources/v1/modeler/projecttemplates/" +
            template.id,

        cestamp: template.cestamp || ""

    };


    /*
     * Build request payload
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

                        projectTemplateReference

                    ]

                }

            }

        ]

    };


    console.log(
        "======================================"
    );

    console.log(
        "PROJECT TEMPLATE REFERENCE"
    );

    console.log(
        JSON.stringify(
            projectTemplateReference,
            null,
            2
        )
    );

    console.log(
        "======================================"
    );

    console.log(
        "FINAL PROJECT FROM TEMPLATE PAYLOAD"
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


    /*
     * POST /projects/fromTemplate
     */

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects/fromTemplate";

    console.log(
        "POST URL:"
    );

    console.log(
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
                    "PROJECT CREATED FROM TEMPLATE"
                );

                console.log(
                    response
                );

                console.log(
                    "======================================"
                );

                var createdProjectId = "";

                if (
                    response &&
                    response.data &&
                    response.data.length > 0
                ) {

                    createdProjectId =
                        response.data[0].id || "";
                }

                document.getElementById(
                    "result"
                ).innerHTML =

                    "<span class='success'>" +

                    "Project Created Successfully" +

                    (
                        createdProjectId
                            ? "<br>Project ID: " +
                              createdProjectId
                            : ""
                    ) +

                    "</span>";

            },

            onFailure: function (error) {

                console.log(
                    "======================================"
                );

                console.log(
                    "PROJECT CREATION FAILED"
                );

                console.log(error);

                console.log(
                    "======================================"
                );

                document.getElementById(
                    "result"
                ).innerHTML =

                    "<span class='error'>" +

                    "PROJECT CREATION FAILED.<br>" +

                    "Open browser Network → fromTemplate → Response " +
                    "to see the ENOVIA error." +

                    "</span>";
            }

        }
    );
}
