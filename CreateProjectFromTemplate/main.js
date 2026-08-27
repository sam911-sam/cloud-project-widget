(function () {

    var selectedTemplate = null;
    var searchTimer = null;

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
                        'Create Project from Template' +
                    '</div>' +

                    '<div class="dxp-form">' +

                        /* TEMPLATE SEARCH */
                        '<div class="dxp-field">' +
                            '<label>Template</label>' +

                            '<input ' +
                                'id="templateSearch" ' +
                                'placeholder="Search template..." ' +
                                'autocomplete="off">' +

                            '<div id="templateResults" class="dxp-template-results"></div>' +

                            '<div id="selectedTemplate" class="dxp-selected-template"></div>' +
                        '</div>' +

                        /* PROJECT NAME */
                        '<div class="dxp-field">' +
                            '<label>Project Name</label>' +
                            '<input ' +
                                'id="projectName" ' +
                                'placeholder="Enter project name">' +
                        '</div>' +

                        /* DESCRIPTION */
                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input ' +
                                'id="projectDescription" ' +
                                'placeholder="Enter description">' +
                        '</div>' +

                        /* BUTTON */
                        '<div class="dxp-actions">' +
                            '<button id="createBtn">Create Project</button>' +
                        '</div>' +

                        /* RESULT */
                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';

            document.getElementById("templateSearch").oninput =
                function () {

                    var searchText = this.value.trim();

                    selectedTemplate = null;

                    document.getElementById(
                        "selectedTemplate"
                    ).innerHTML = "";

                    if (searchTimer) {
                        clearTimeout(searchTimer);
                    }

                    if (searchText.length < 2) {

                        document.getElementById(
                            "templateResults"
                        ).innerHTML = "";

                        return;
                    }

                    searchTimer = setTimeout(function () {

                        searchTemplates(searchText);

                    }, 300);
                };

            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

        });
    }

    waitForWidget();

})();


/*
 * ============================================================
 * SEARCH PROJECT TEMPLATES
 * ============================================================
 */

function searchTemplates(searchText) {

    console.log("Searching templates:", searchText);

    require(
        [
            "DS/WAFData/WAFData",
            "DS/i3DXCompassServices/i3DXCompassServices"
        ],
        function (
            WAFData,
            CompassServices
        ) {

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    var spaceUrl =
                        services["3DSpace"];

                    console.log(
                        "3DSpace URL:",
                        spaceUrl
                    );

                    var templateUrl =
                        spaceUrl +
                        "/projecttemplates/search?searchStr=" +
                        encodeURIComponent(searchText) +
                        "&$top=20";

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
                                "Accept":
                                    "application/json"
                            },

                            onComplete: function (response) {

                                console.log(
                                    "TEMPLATE SEARCH SUCCESS"
                                );

                                console.log(response);

                                displayTemplates(
                                    response
                                );
                            },

                            onFailure: function (error) {

                                console.log(
                                    "TEMPLATE SEARCH FAILED"
                                );

                                console.log(error);

                                document.getElementById(
                                    "templateResults"
                                ).innerHTML =
                                    '<div class="dxp-template-error">' +
                                    'Template search failed' +
                                    '</div>';
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


/*
 * ============================================================
 * DISPLAY TEMPLATE RESULTS
 * ============================================================
 */

function displayTemplates(response) {

    var results =
        document.getElementById(
            "templateResults"
        );

    results.innerHTML = "";

    if (
        !response ||
        !response.data ||
        response.data.length === 0
    ) {

        results.innerHTML =
            '<div class="dxp-no-results">' +
            'No templates found' +
            '</div>';

        return;
    }

    response.data.forEach(function (template) {

        var dataelements =
            template.dataelements || {};

        var title =
            dataelements.title ||
            dataelements.name ||
            "Unnamed Template";

        var revision =
            dataelements.revision || "";

        var description =
            dataelements.description || "";

        var item =
            document.createElement("div");

        item.className =
            "dxp-template-item";

        item.innerHTML =
            '<div class="dxp-template-title">' +
                escapeHtml(title) +
            '</div>' +

            '<div class="dxp-template-details">' +
                (revision
                    ? "Revision: " +
                      escapeHtml(revision)
                    : "") +
            '</div>' +

            (
                description
                    ? '<div class="dxp-template-description">' +
                        escapeHtml(description) +
                      '</div>'
                    : ''
            );

        item.onclick = function () {

            selectTemplate(template);

        };

        results.appendChild(item);

    });
}


/*
 * ============================================================
 * SELECT TEMPLATE
 * ============================================================
 */

function selectTemplate(template) {

    selectedTemplate = template;

    console.log(
        "Selected Template:"
    );

    console.log(
        selectedTemplate
    );

    var dataelements =
        template.dataelements || {};

    var title =
        dataelements.title ||
        dataelements.name ||
        "Unnamed Template";

    document.getElementById(
        "templateSearch"
    ).value = title;

    document.getElementById(
        "templateResults"
    ).innerHTML = "";

    document.getElementById(
        "selectedTemplate"
    ).innerHTML =
        '<span class="dxp-selected-label">' +
            'Selected: ' +
        '</span>' +
        escapeHtml(title);

}


/*
 * ============================================================
 * CREATE PROJECT FROM TEMPLATE
 * ============================================================
 */

function createProjectFromTemplate() {

    console.log(
        "Create Project From Template Clicked"
    );

    var projectName =
        document.getElementById(
            "projectName"
        ).value.trim();

    var description =
        document.getElementById(
            "projectDescription"
        ).value.trim();

    var result =
        document.getElementById(
            "result"
        );

    /*
     * VALIDATION
     */

    if (!selectedTemplate) {

        result.innerHTML =
            '<span class="error">' +
            'Please select a project template' +
            '</span>';

        return;
    }

    if (!projectName) {

        result.innerHTML =
            '<span class="error">' +
            'Please enter a project name' +
            '</span>';

        return;
    }


    /*
     * GET TEMPLATE INFORMATION
     */

    var templateData =
        selectedTemplate.dataelements || {};

    var templateId =
        selectedTemplate.id;

    var templateType =
        selectedTemplate.type ||
        "Project Template";

    var templateObjectId =
        templateData.objectId ||
        templateId;


    console.log(
        "Template ID:",
        templateId
    );

    console.log(
        "Template Object ID:",
        templateObjectId
    );

    console.log(
        "Template Type:",
        templateType
    );


    /*
     * LOAD DS MODULES
     */

    require(
        [
            "DS/WAFData/WAFData",
            "DS/i3DXCompassServices/i3DXCompassServices"
        ],
        function (
            WAFData,
            CompassServices
        ) {

            console.log(
                "Modules Loaded"
            );

            /*
             * GET 3DSPACE URL
             */

            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue(
                        "x3dPlatformId"
                    ),

                onComplete:
                    function (services) {

                        console.log(
                            "Services Received"
                        );

                        console.log(
                            services
                        );

                        var spaceUrl =
                            services["3DSpace"];

                        console.log(
                            "3DSpace URL:",
                            spaceUrl
                        );


                        /*
                         * GET CSRF TOKEN
                         */

                        var csrfUrl =
                            spaceUrl +
                            "/resources/v1/application/CSRF";

                        WAFData.authenticatedRequest(
                            csrfUrl,
                            {
                                method: "GET",
                                type: "json",

                                onComplete:
                                    function (
                                        csrfResponse
                                    ) {

                                        console.log(
                                            "CSRF SUCCESS"
                                        );

                                        var csrfToken =
                                            csrfResponse
                                                .csrf
                                                .value;

                                        createProjectRequest(
                                            WAFData,
                                            spaceUrl,
                                            csrfToken,
                                            selectedTemplate,
                                            projectName,
                                            description
                                        );
                                    },

                                onFailure:
                                    function (
                                        error
                                    ) {

                                        console.log(
                                            "CSRF FAILED"
                                        );

                                        console.log(
                                            error
                                        );

                                        result.innerHTML =
                                            '<span class="error">' +
                                            'CSRF FAILED' +
                                            '</span>';
                                    }
                            }
                        );
                    },

                onFailure:
                    function (error) {

                        console.log(
                            "SERVICE DISCOVERY FAILED"
                        );

                        console.log(
                            error
                        );

                        result.innerHTML =
                            '<span class="error">' +
                            'SERVICE DISCOVERY FAILED' +
                            '</span>';
                    }
            });
        }
    );
}


/*
 * ============================================================
 * CREATE PROJECT REQUEST
 * ============================================================
 */

function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    template,
    projectName,
    description
) {

    var templateData =
        template.dataelements || {};

    /*
     * IMPORTANT:
     *
     * The API expects:
     *
     * relateddata.projectTemplate[0]
     *
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

                        {

                            id:
                                template.id,

                            type:
                                template.type ||
                                "Project Template",

                            identifier:
                                template.id,

                            source:
                                spaceUrl,

                            relativePath:
                                "/resources/v1/modeler/" +
                                "samples/" +
                                template.id,

                            cestamp:
                                template.cestamp || ""
                        }

                    ]

                }

            }

        ]

    };


    console.log(
        "Create Project Payload:"
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );


    /*
     * PROJECT API
     *
     * Assuming this is the same endpoint
     * used by your working project creation.
     */

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects";


    console.log(
        "Project URL:",
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
                JSON.stringify(
                    payload
                ),

            onComplete:
                function (response) {

                    console.log(
                        "PROJECT CREATED FROM TEMPLATE"
                    );

                    console.log(
                        response
                    );

                    document.getElementById(
                        "result"
                    ).innerHTML =
                        '<span class="success">' +
                        'Project Created Successfully' +
                        '</span>';
                },

            onFailure:
                function (error) {

                    console.log(
                        "PROJECT CREATION FAILED"
                    );

                    console.log(
                        error
                    );

                    document.getElementById(
                        "result"
                    ).innerHTML =
                        '<span class="error">' +
                        'PROJECT CREATION FAILED' +
                        '</span>';
                }

        }
    );
}


/*
 * ============================================================
 * HTML ESCAPE
 * ============================================================
 */

function escapeHtml(value) {

    if (value === null ||
        value === undefined) {

        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
