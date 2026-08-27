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
                            '<input id="projectName" ' +
                            'placeholder="Enter project name">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input id="projectDescription" ' +
                            'placeholder="Enter description">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Project Template Search</label>' +
                            '<input id="templateSearch" ' +
                            'placeholder="Enter template name">' +
                        '</div>' +

                        '<div class="dxp-actions">' +
                            '<button id="searchTemplateBtn">' +
                                'Search Template' +
                            '</button>' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Select Project Template</label>' +

                            '<select id="templateSelect">' +

                                '<option value="">' +
                                    '-- Select Project Template --' +
                                '</option>' +

                            '</select>' +

                        '</div>' +

                        '<div class="dxp-actions">' +

                            '<button id="createBtn">' +
                                'Create Project' +
                            '</button>' +

                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';


            document.getElementById(
                "searchTemplateBtn"
            ).onclick = searchProjectTemplates;


            document.getElementById(
                "createBtn"
            ).onclick = createProjectFromTemplate;

        });
    }

    waitForWidget();

})();


/* =========================================================
   GET 3DSPACE URL
   ========================================================= */

function get3DSpace(
    callback
) {

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

                    console.log(
                        "Platform Services:"
                    );

                    console.log(services);

                    var spaceUrl =
                        services["3DSpace"];

                    console.log(
                        "3DSpace URL:",
                        spaceUrl
                    );

                    if (!spaceUrl) {

                        showError(
                            "3DSpace service URL not found."
                        );

                        return;
                    }

                    callback(
                        WAFData,
                        spaceUrl
                    );
                },

                onFailure: function (error) {

                    console.log(
                        "SERVICE DISCOVERY FAILED"
                    );

                    console.log(error);

                    showError(
                        "3DSpace service discovery failed."
                    );
                }

            });

        }
    );
}


/* =========================================================
   SEARCH PROJECT TEMPLATES
   ========================================================= */

function searchProjectTemplates() {

    console.log("======================================");

    console.log(
        "SEARCH PROJECT TEMPLATES"
    );

    console.log("======================================");


    var searchInput =
        document.getElementById(
            "templateSearch"
        );

    var searchStr =
        searchInput.value.trim();


    if (searchStr.length < 2) {

        showError(
            "Please enter at least 2 characters."
        );

        return;
    }


    get3DSpace(

        function (
            WAFData,
            spaceUrl
        ) {

            var searchUrl =

                spaceUrl +

                "/resources/v1/modeler/projecttemplates/search" +

                "?searchStr=" +

                encodeURIComponent(searchStr) +

                "&$top=100";


            console.log(
                "Template Search URL:"
            );

            console.log(searchUrl);


            WAFData.authenticatedRequest(

                searchUrl,

                {

                    method: "GET",

                    type: "json",

                    headers: {

                        "Accept":
                            "application/json"

                    },


                    onComplete: function (
                        response
                    ) {

                        console.log(
                            "TEMPLATE SEARCH RESPONSE:"
                        );

                        console.log(response);


                        populateTemplateList(
                            response
                        );

                    },


                    onFailure: function (
                        error
                    ) {

                        console.log(
                            "TEMPLATE SEARCH FAILED"
                        );

                        console.log(error);


                        showError(
                            "Project Template search failed."
                        );

                    }

                }

            );

        }

    );

}


/* =========================================================
   POPULATE TEMPLATE DROPDOWN
   ========================================================= */

function populateTemplateList(
    response
) {

    var select =
        document.getElementById(
            "templateSelect"
        );


    select.innerHTML =

        '<option value="">' +
            '-- Select Project Template --' +
        '</option>';


    if (
        !response ||
        !response.data ||
        !Array.isArray(response.data)
    ) {

        showError(
            "No template data returned."
        );

        return;
    }


    /*
     * IMPORTANT
     *
     * Only accept:
     *
     * type === "Project Template"
     */

    var templates =
        response.data.filter(

            function (item) {

                return (
                    item &&
                    item.type ===
                    "Project Template"
                );

            }

        );


    console.log(
        "ALL SEARCH RESULTS:"
    );

    console.log(
        response.data
    );


    console.log(
        "FILTERED PROJECT TEMPLATES:"
    );

    console.log(
        templates
    );


    if (templates.length === 0) {

        showError(
            "No Project Template found."
        );

        return;
    }


    templates.forEach(

        function (template) {

            var option =
                document.createElement(
                    "option"
                );


            option.value =
                template.id;


            var title =

                template.dataelements &&
                template.dataelements.title

                    ? template.dataelements.title

                    : template.id;


            var name =

                template.dataelements &&
                template.dataelements.name

                    ? template.dataelements.name

                    : "";


            option.text =
                name
                    ? title + " (" + name + ")"
                    : title;


            /*
             * Store complete search object.
             */

            option.setAttribute(
                "data-template",
                JSON.stringify(template)
            );


            select.appendChild(
                option
            );

        }

    );


    showSuccess(

        templates.length +

        " Project Template(s) found."

    );

}


/* =========================================================
   CREATE PROJECT FROM TEMPLATE
   ========================================================= */

function createProjectFromTemplate() {

    console.log("======================================");

    console.log(
        "CREATE PROJECT FROM TEMPLATE"
    );

    console.log("======================================");


    var projectName =

        document.getElementById(
            "projectName"
        ).value.trim();


    var description =

        document.getElementById(
            "projectDescription"
        ).value.trim();


    var select =

        document.getElementById(
            "templateSelect"
        );


    if (!projectName) {

        showError(
            "Please enter Project Name."
        );

        return;
    }


    if (!select.value) {

        showError(
            "Please select a Project Template."
        );

        return;
    }


    var selectedOption =
        select.options[
            select.selectedIndex
        ];


    var template =

        JSON.parse(

            selectedOption.getAttribute(
                "data-template"
            )

        );


    console.log(
        "SELECTED TEMPLATE OBJECT:"
    );

    console.log(template);


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


    /*
     * Make sure selected object is really
     * a Project Template.
     */

    if (
        template.type !==
        "Project Template"
    ) {

        showError(
            "Selected object is not a Project Template."
        );

        return;
    }


    get3DSpace(

        function (
            WAFData,
            spaceUrl
        ) {

            /*
             * STEP 1
             *
             * Get CSRF token.
             */

            getCSRFToken(

                WAFData,

                spaceUrl,

                function (
                    csrfToken
                ) {

                    /*
                     * STEP 2
                     *
                     * Get complete template details.
                     */

                    getProjectTemplateDetails(

                        WAFData,

                        spaceUrl,

                        template,

                        function (
                            fullTemplate
                        ) {

                            /*
                             * STEP 3
                             *
                             * POST project from template.
                             */

                            postProjectFromTemplate(

                                WAFData,

                                spaceUrl,

                                csrfToken,

                                fullTemplate,

                                projectName,

                                description

                            );

                        }

                    );

                }

            );

        }

    );

}


/* =========================================================
   GET CSRF TOKEN
   ========================================================= */

function getCSRFToken(

    WAFData,

    spaceUrl,

    callback

) {

    console.log(
        "======================================"
    );

    console.log(
        "GET CSRF TOKEN"
    );

    console.log(
        "======================================"
    );


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


            onComplete: function (
                csrfResponse
            ) {

                console.log(
                    "CSRF RESPONSE:"
                );

                console.log(
                    csrfResponse
                );


                if (
                    !csrfResponse ||
                    !csrfResponse.csrf ||
                    !csrfResponse.csrf.value
                ) {

                    showError(
                        "CSRF token was not returned."
                    );

                    return;
                }


                var csrfToken =

                    csrfResponse.csrf.value;


                console.log(
                    "CSRF TOKEN RECEIVED"
                );


                callback(
                    csrfToken
                );

            },


            onFailure: function (
                error
            ) {

                console.log(
                    "CSRF FAILED"
                );

                console.log(error);


                showError(
                    "CSRF request failed."
                );

            }

        }

    );

}


/* =========================================================
   GET COMPLETE PROJECT TEMPLATE
   ========================================================= */

function getProjectTemplateDetails(

    WAFData,

    spaceUrl,

    template,

    callback

) {

    console.log(
        "======================================"
    );

    console.log(
        "GET PROJECT TEMPLATE DETAILS"
    );

    console.log(
        "======================================"
    );


    var templateId =
        template.id;


    var templateUrl =

        spaceUrl +

        "/resources/v1/modeler/projecttemplates/" +

        encodeURIComponent(
            templateId
        );


    console.log(
        "Template Detail URL:"
    );

    console.log(
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


            onComplete: function (
                response
            ) {

                console.log(
                    "PROJECT TEMPLATE DETAIL RESPONSE:"
                );

                console.log(
                    response
                );


                if (
                    response &&
                    response.data &&
                    response.data.length > 0
                ) {

                    var fullTemplate =
                        response.data[0];


                    console.log(
                        "FULL TEMPLATE OBJECT:"
                    );

                    console.log(
                        fullTemplate
                    );


                    callback(
                        fullTemplate
                    );

                }

                else {

                    console.log(
                        "Template detail response empty."
                    );


                    /*
                     * Fall back to search object.
                     */

                    callback(
                        template
                    );

                }

            },


            onFailure: function (
                error
            ) {

                console.log(
                    "TEMPLATE DETAIL GET FAILED"
                );

                console.log(error);


                /*
                 * Do not stop completely.
                 *
                 * Search result already contains
                 * template ID/type/cestamp.
                 */

                console.log(
                    "Using selected search object."
                );


                callback(
                    template
                );

            }

        }

    );

}


/* =========================================================
   POST PROJECT FROM TEMPLATE
   ========================================================= */

function postProjectFromTemplate(

    WAFData,

    spaceUrl,

    csrfToken,

    template,

    projectName,

    description

) {

    console.log(
        "======================================"
    );

    console.log(
        "BUILD PROJECT FROM TEMPLATE REQUEST"
    );

    console.log(
        "======================================"
    );


    /*
     * Template ID
     */

    var templateId =
        template.id;


    /*
     * Template type
     */

    var templateType =

        template.type ||
        "Project Template";


    /*
     * Template cestamp
     */

    var templateCestamp =

        template.cestamp ||
        "";


    /*
     * Build project template reference.
     *
     * This follows the structure shown
     * in the API documentation.
     */

    var projectTemplateReference = {

        id:
            templateId,

        type:
            templateType,

        identifier:
            templateId,

        source:
            spaceUrl,

        relativePath:

            "/resources/v1/modeler/projecttemplates/" +

            templateId,

        cestamp:
            templateCestamp

    };


    /*
     * FINAL PAYLOAD
     */

    var payload = {

        data: [

            {

                type:
                    "Project Space",


                dataelements: {

                    constraintDate:
                        "",

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
        "SELECTED TEMPLATE"
    );

    console.log(
        template
    );


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
        "FINAL POST PAYLOAD"
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
     * POST URL
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


    console.log(
        "======================================"
    );


    /*
     * POST request
     */

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


            onComplete: function (
                response
            ) {

                console.log(
                    "======================================"
                );

                console.log(
                    "PROJECT CREATED SUCCESSFULLY"
                );

                console.log(
                    "======================================"
                );


                console.log(
                    "SERVER RESPONSE:"
                );

                console.log(
                    response
                );


                var projectId = "";


                if (
                    response &&
                    response.data &&
                    response.data.length > 0
                ) {

                    projectId =
                        response.data[0].id ||
                        "";

                }


                if (projectId) {

                    showSuccess(

                        "Project Created Successfully." +

                        "<br>Project ID: " +

                        projectId

                    );

                }

                else {

                    showSuccess(
                        "Project Created Successfully."
                    );

                }

            },


            onFailure: function (
                error
            ) {

                console.log(
                    "======================================"
                );

                console.log(
                    "PROJECT CREATION FAILED"
                );

                console.log(
                    "======================================"
                );


                console.log(
                    "ERROR OBJECT:"
                );

                console.log(
                    error
                );


                /*
                 * WAFData sometimes exposes only
                 * NetworkError in the console.
                 *
                 * Therefore show a useful message
                 * in the widget.
                 */

                showError(

                    "PROJECT CREATION FAILED." +

                    "<br>HTTP 400 / Bad Request." +

                    "<br>Check Network → fromTemplate → Response."

                );

            }

        }

    );

}


/* =========================================================
   UI HELPERS
   ========================================================= */

function showSuccess(
    message
) {

    var result =
        document.getElementById(
            "result"
        );


    if (result) {

        result.innerHTML =

            "<span class='success'>" +

            message +

            "</span>";

    }

}


function showError(
    message
) {

    var result =
        document.getElementById(
            "result"
        );


    if (result) {

        result.innerHTML =

            "<span class='error'>" +

            message +

            "</span>";

    }

}
