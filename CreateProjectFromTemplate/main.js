(function () {

    var selectedTemplate = null;

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

                        /* TEMPLATE */
                        '<div class="dxp-field">' +
                            '<label>Project Template</label>' +

                            '<div class="dxp-template-search-row">' +

                                '<input ' +
                                    'id="templateSearch" ' +
                                    'placeholder="Enter template name">' +

                                '<button ' +
                                    'id="searchTemplateBtn" ' +
                                    'type="button">' +
                                    'Search' +
                                '</button>' +

                            '</div>' +

                            '<div id="templateResults"></div>' +

                            '<div id="selectedTemplate"></div>' +

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

                        /* CREATE BUTTON */
                        '<div class="dxp-actions">' +
                            '<button ' +
                                'id="createBtn" ' +
                                'type="button">' +
                                'Create Project' +
                            '</button>' +
                        '</div>' +

                        '<div id="result"></div>' +

                    '</div>' +

                '</div>';


            document.getElementById(
                "searchTemplateBtn"
            ).onclick = searchTemplates;


            document.getElementById(
                "createBtn"
            ).onclick = createProjectFromTemplate;


            /*
             * ENTER KEY ALSO SEARCHES
             */

            document.getElementById(
                "templateSearch"
            ).onkeydown = function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    searchTemplates();
                }
            };

        });
    }

    waitForWidget();

})();


/*
 * ============================================================
 * SEARCH TEMPLATES
 * ============================================================
 */

function searchTemplates() {

    var searchText =
        document.getElementById(
            "templateSearch"
        ).value.trim();


    var results =
        document.getElementById(
            "templateResults"
        );

    var selected =
        document.getElementById(
            "selectedTemplate"
        );


    selected.innerHTML = "";


    if (searchText.length < 2) {

        results.innerHTML =
            '<div class="error">' +
            'Enter at least 2 characters' +
            '</div>';

        return;
    }


    results.innerHTML =
        '<div class="dxp-loading">' +
        'Searching templates...' +
        '</div>';


    selectedTemplate = null;


    console.log(
        "Searching Template:",
        searchText
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
                         * FIRST GET CSRF
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


                                        searchTemplateRequest(
                                            WAFData,
                                            spaceUrl,
                                            csrfToken,
                                            searchText
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


                                        results.innerHTML =
                                            '<div class="error">' +
                                            'CSRF FAILED' +
                                            '</div>';
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


                        results.innerHTML =
                            '<div class="error">' +
                            'SERVICE DISCOVERY FAILED' +
                            '</div>';
                    }
            });

        }
    );
}


/*
 * ============================================================
 * TEMPLATE SEARCH REQUEST
 * ============================================================
 */

function searchTemplateRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    searchText
) {

    var results =
        document.getElementById(
            "templateResults"
        );


    var templateUrl =
        spaceUrl +
        "/projecttemplates/search?searchStr=" +
        encodeURIComponent(searchText) +
        "&$top=50";


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
                    "application/json",

                "ENO_CSRF_TOKEN":
                    csrfToken
            },


            onComplete:
                function (response) {

                    console.log(
                        "TEMPLATE SEARCH SUCCESS"
                    );

                    console.log(
                        response
                    );


                    displayTemplateResults(
                        response
                    );
                },


            onFailure:
                function (error) {

                    console.log(
                        "TEMPLATE SEARCH FAILED"
                    );

                    console.log(
                        error
                    );


                    results.innerHTML =
                        '<div class="error">' +
                        'TEMPLATE SEARCH FAILED' +
                        '</div>';
                }
        }
    );
}


/*
 * ============================================================
 * DISPLAY TEMPLATE RESULTS
 * ============================================================
 */

function displayTemplateResults(
    response
) {

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


    console.log(
        "Templates Found:",
        response.data.length
    );


    var list =
        document.createElement(
            "div"
        );

    list.className =
        "dxp-template-list";


    response.data.forEach(
        function (template) {

            var dataelements =
                template.dataelements || {};


            var title =
                dataelements.title ||
                dataelements.name ||
                "Unnamed Template";


            var revision =
                dataelements.revision ||
                "";


            var description =
                dataelements.description ||
                "";


            var item =
                document.createElement(
                    "div"
                );


            item.className =
                "dxp-template-item";


            item.innerHTML =

                '<div class="dxp-template-title">' +
                    escapeHtml(title) +
                '</div>' +

                (
                    revision
                    ?
                    '<div class="dxp-template-revision">' +
                        'Revision: ' +
                        escapeHtml(revision) +
                    '</div>'
                    :
                    ''
                ) +

                (
                    description
                    ?
                    '<div class="dxp-template-description">' +
                        escapeHtml(description) +
                    '</div>'
                    :
                    ''
                );


            item.onclick =
                function () {

                    selectTemplate(
                        template
                    );

                };


            list.appendChild(
                item
            );

        }
    );


    results.appendChild(
        list
    );
}


/*
 * ============================================================
 * SELECT TEMPLATE
 * ============================================================
 */

function selectTemplate(
    template
) {

    selectedTemplate =
        template;


    console.log(
        "Selected Template:"
    );

    console.log(
        template
    );


    var dataelements =
        template.dataelements || {};


    var title =
        dataelements.title ||
        dataelements.name ||
        "Unnamed Template";


    document.getElementById(
        "templateResults"
    ).innerHTML = "";


    document.getElementById(
        "templateSearch"
    ).value = title;


    document.getElementById(
        "selectedTemplate"
    ).innerHTML =

        '<div class="dxp-selected-template">' +

            '<span class="dxp-selected-label">' +
                'Selected Template: ' +
            '</span>' +

            escapeHtml(title) +

        '</div>';


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


    var result =
        document.getElementById(
            "result"
        );


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

    if (!selectedTemplate) {

        result.innerHTML =
            '<span class="error">' +
            'Please search and select a template' +
            '</span>';

        return;
    }


    if (!projectName) {

        result.innerHTML =
            '<span class="error">' +
            'Please enter project name' +
            '</span>';

        return;
    }


    result.innerHTML =
        '<span>' +
        'Creating project...' +
        '</span>';


    console.log(
        "Project Name:",
        projectName
    );

    console.log(
        "Description:",
        description
    );

    console.log(
        "Selected Template:",
        selectedTemplate
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


            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue(
                        "x3dPlatformId"
                    ),


                onComplete:
                    function (services) {

                        var spaceUrl =
                            services["3DSpace"];


                        console.log(
                            "3DSpace URL:",
                            spaceUrl
                        );


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

    var result =
        document.getElementById(
            "result"
        );


    /*
     * API TEMPLATE INFORMATION
     */

    var templateId =
        template.id;


    var templateType =
        template.type ||
        "Project Template";


    var templateCestamp =
        template.cestamp ||
        "";


    /*
     * REQUEST BODY
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
                                "/resources/v1/modeler/samples/" +
                                templateId,

                            cestamp:
                                templateCestamp
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


    /*
     * PROJECT API
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
                        "PROJECT CREATED"
                    );

                    console.log(
                        response
                    );


                    result.innerHTML =
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


                    result.innerHTML =
                        '<span class="error">' +
                        'PROJECT CREATION FAILED' +
                        '</span>';
                }

        }
    );
}


/*
 * ============================================================
 * ESCAPE HTML
 * ============================================================
 */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
