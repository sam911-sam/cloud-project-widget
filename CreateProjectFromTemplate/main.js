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
                        'Create Project from Template' +
                    '</div>' +

                    '<div class="dxp-form">' +

                        /* TEMPLATE SEARCH */
                        '<div class="dxp-field">' +
                            '<label>Project Template</label>' +

                            '<div class="dxp-search-row">' +
                                '<input id="templateSearch" ' +
                                    'placeholder="Enter template name..." />' +

                                '<button id="searchBtn" class="dxp-search-btn">' +
                                    'Search' +
                                '</button>' +
                            '</div>' +

                        '</div>' +

                        /* TEMPLATE RESULTS */
                        '<div class="dxp-field">' +
                            '<label>Template List</label>' +

                            '<div id="templateList" class="dxp-template-list">' +
                                '<div class="dxp-empty">' +
                                    'Enter at least 2 characters and click Search' +
                                '</div>' +
                            '</div>' +

                            '<input type="hidden" id="selectedTemplateId">' +
                            '<input type="hidden" id="selectedTemplateType">' +
                        '</div>' +

                        /* PROJECT NAME */
                        '<div class="dxp-field">' +
                            '<label>Project Name</label>' +

                            '<input id="projectName" ' +
                                'placeholder="Enter project name">' +
                        '</div>' +

                        /* DESCRIPTION */
                        '<div class="dxp-field">' +
                            '<label>Description</label>' +

                            '<input id="projectDescription" ' +
                                'placeholder="Enter description">' +
                        '</div>' +

                        /* CREATE */
                        '<div class="dxp-actions">' +

                            '<button id="createBtn">' +
                                'Create Project' +
                            '</button>' +

                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';

            document.getElementById("searchBtn").onclick =
                searchTemplates;

            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

            console.log("UI initialized");

        });
    }

    waitForWidget();

})();


/* ============================================================
   SEARCH PROJECT TEMPLATES
   ============================================================ */

function searchTemplates() {

    var searchInput =
        document.getElementById("templateSearch");

    var searchStr =
        searchInput.value.trim();

    console.log("Searching Template:", searchStr);

    if (searchStr.length < 2) {

        document.getElementById("templateList").innerHTML =
            '<div class="dxp-error">' +
                'Please enter at least 2 characters.' +
            '</div>';

        return;
    }

    document.getElementById("templateList").innerHTML =
        '<div class="dxp-loading">Searching...</div>';

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
                     * IMPORTANT
                     *
                     * Project creation uses:
                     *
                     * /resources/v1/modeler/projects
                     *
                     * Project template API is under
                     * the projects resource.
                     */

                    var templateUrl =
                        spaceUrl +
                        "/resources/v1/modeler/projects/projecttemplates/search" +
                        "?searchStr=" +
                        encodeURIComponent(searchStr) +
                        "&$top=50";

                    console.log(
                        "Template Search URL:",
                        templateUrl
                    );

                    /*
                     * Security Context
                     *
                     * Use the widget's current security context
                     * if it is available.
                     */

                    var securityContext =
                        widget.getValue("x3dSecurityContext");

                    console.log(
                        "Security Context:",
                        securityContext
                    );

                    WAFData.authenticatedRequest(
                        templateUrl,
                        {

                            method: "GET",

                            type: "json",

                            headers: {

                                "Accept":
                                    "application/json",

                                "SecurityContext":
                                    securityContext || ""

                            },

                            onComplete:
                                function (response) {

                                    console.log(
                                        "TEMPLATE SEARCH SUCCESS"
                                    );

                                    console.log(
                                        response
                                    );

                                    displayTemplates(
                                        response
                                    );
                                },

                            onFailure:
                                function (error) {

                                    console.log(
                                        "TEMPLATE SEARCH FAILED"
                                    );

                                    console.log(error);

                                    document.getElementById(
                                        "templateList"
                                    ).innerHTML =
                                        '<div class="dxp-error">' +
                                            'Template search failed.' +
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

                    document.getElementById(
                        "templateList"
                    ).innerHTML =
                        '<div class="dxp-error">' +
                            'Unable to get 3DSpace service.' +
                        '</div>';
                }
            });

        }
    );
}


/* ============================================================
   DISPLAY TEMPLATE RESULTS
   ============================================================ */

function displayTemplates(response) {

    var list =
        document.getElementById("templateList");

    list.innerHTML = "";

    if (
        !response ||
        !response.data ||
        response.data.length === 0
    ) {

        list.innerHTML =
            '<div class="dxp-empty">' +
                'No project templates found.' +
            '</div>';

        return;
    }

    console.log(
        "Templates Found:",
        response.data.length
    );

    response.data.forEach(function (template) {

        var data =
            template.dataelements || {};

        var title =
            data.title ||
            data.name ||
            "Unnamed Template";

        var description =
            data.description || "";

        var item =
            document.createElement("div");

        item.className =
            "dxp-template-item";

        item.innerHTML =
            '<div class="dxp-template-title">' +
                escapeHtml(title) +
            '</div>' +

            '<div class="dxp-template-info">' +
                escapeHtml(description) +
            '</div>';

        item.onclick = function () {

            selectTemplate(
                template,
                item
            );

        };

        list.appendChild(item);

    });
}


/* ============================================================
   SELECT TEMPLATE
   ============================================================ */

function selectTemplate(
    template,
    element
) {

    console.log(
        "Selected Template:",
        template
    );

    /*
     * Remove previous selection
     */

    var items =
        document.querySelectorAll(
            ".dxp-template-item"
        );

    for (var i = 0; i < items.length; i++) {

        items[i].classList.remove(
            "selected"
        );
    }

    element.classList.add("selected");

    /*
     * Store template information
     */

    document.getElementById(
        "selectedTemplateId"
    ).value = template.id || "";

    document.getElementById(
        "selectedTemplateType"
    ).value = template.type || "";

    console.log(
        "Selected Template ID:",
        template.id
    );

    /*
     * Show selected template
     */

    var title =
        template.dataelements &&
        (
            template.dataelements.title ||
            template.dataelements.name
        );

    document.getElementById(
        "templateSearch"
    ).value = title || "";

}


/* ============================================================
   CREATE PROJECT FROM TEMPLATE
   ============================================================ */

function createProjectFromTemplate() {

    console.log(
        "Create Project From Template Clicked"
    );

    var templateId =
        document.getElementById(
            "selectedTemplateId"
        ).value;

    var templateType =
        document.getElementById(
            "selectedTemplateType"
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

        showResult(
            "Please select a project template.",
            "error"
        );

        return;
    }

    if (!projectName) {

        showResult(
            "Please enter a project name.",
            "error"
        );

        return;
    }


    console.log(
        "Template ID:",
        templateId
    );

    console.log(
        "Project Name:",
        projectName
    );


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

            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue("x3dPlatformId"),

                onComplete:
                    function (services) {

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
                                            templateId,
                                            templateType,
                                            projectName,
                                            description
                                        );

                                    },

                                onFailure:
                                    function (error) {

                                        console.log(
                                            "CSRF FAILED"
                                        );

                                        console.log(
                                            error
                                        );

                                        showResult(
                                            "CSRF FAILED",
                                            "error"
                                        );
                                    }
                            }
                        );

                    },

                onFailure:
                    function (error) {

                        console.log(
                            "SERVICE DISCOVERY FAILED"
                        );

                        console.log(error);

                    }

            });

        }
    );
}


/* ============================================================
   CREATE PROJECT REQUEST
   ============================================================ */

function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    templateId,
    templateType,
    projectName,
    description
) {

    var payload = {

        data: [

            {

                /*
                 * Project Space
                 */

                type: "Project Space",

                dataelements: {

                    title:
                        projectName,

                    description:
                        description,

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

                            id:
                                templateId,

                            type:
                                templateType,

                            identifier:
                                templateId,

                            source:
                                spaceUrl,

                            relativePath:
                                "/resources/v1/modeler/projects/" +
                                templateId

                        }

                    ]

                }

            }

        ]

    };


    console.log(
        "CREATE PROJECT PAYLOAD:"
    );

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );


    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects";


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

            onComplete:
                function (response) {

                    console.log(
                        "PROJECT CREATED"
                    );

                    console.log(
                        response
                    );

                    showResult(
                        "Project Created Successfully",
                        "success"
                    );

                },

            onFailure:
                function (error) {

                    console.log(
                        "PROJECT CREATION FAILED"
                    );

                    console.log(
                        error
                    );

                    showResult(
                        "PROJECT CREATION FAILED",
                        "error"
                    );

                }

        }
    );
}


/* ============================================================
   RESULT MESSAGE
   ============================================================ */

function showResult(
    message,
    type
) {

    var result =
        document.getElementById(
            "result"
        );

    result.className =
        type;

    result.innerHTML =
        message;
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHtml(value) {

    if (!value) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
