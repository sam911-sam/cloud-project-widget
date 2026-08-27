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


                        // =========================================
                        // PROJECT NAME
                        // =========================================

                        '<div class="dxp-field">' +

                            '<label>Project Name</label>' +

                            '<input ' +
                                'id="projectName" ' +
                                'type="text" ' +
                                'placeholder="Enter project name">' +

                        '</div>' +



                        // =========================================
                        // DESCRIPTION
                        // =========================================

                        '<div class="dxp-field">' +

                            '<label>Description</label>' +

                            '<input ' +
                                'id="projectDescription" ' +
                                'type="text" ' +
                                'placeholder="Enter description">' +

                        '</div>' +



                        // =========================================
                        // TEMPLATE SEARCH
                        // =========================================

                        '<div class="dxp-field">' +

                            '<label>Search Project Template</label>' +

                            '<div class="search-row">' +

                                '<input ' +
                                    'id="templateSearch" ' +
                                    'type="text" ' +
                                    'placeholder="Enter at least 2 characters">' +

                                '<button ' +
                                    'id="searchBtn" ' +
                                    'type="button">' +

                                    'Search' +

                                '</button>' +

                            '</div>' +

                        '</div>' +



                        // =========================================
                        // TEMPLATE DROPDOWN
                        // =========================================

                        '<div class="dxp-field">' +

                            '<label>Project Template</label>' +

                            '<select id="templateSelect">' +

                                '<option value="">' +
                                    'Select a template' +
                                '</option>' +

                            '</select>' +

                        '</div>' +



                        // =========================================
                        // SELECTED TEMPLATE INFORMATION
                        // =========================================

                        '<div id="templateInfo" class="template-info">' +

                            '<div>' +
                                '<span class="info-label">Template:</span> ' +
                                '<span id="selectedTemplateName">-</span>' +
                            '</div>' +

                            '<div>' +
                                '<span class="info-label">ID:</span> ' +
                                '<span id="selectedTemplateId">-</span>' +
                            '</div>' +

                        '</div>' +



                        // =========================================
                        // CREATE BUTTON
                        // =========================================

                        '<div class="dxp-actions">' +

                            '<button ' +
                                'id="createBtn" ' +
                                'type="button">' +

                                'Create Project' +

                            '</button>' +

                        '</div>' +



                        // =========================================
                        // RESULT
                        // =========================================

                        '<div id="result"></div>' +


                    '</div>' +

                '</div>';



            // ================================================
            // EVENT HANDLERS
            // ================================================

            document.getElementById("searchBtn").onclick =
                searchProjectTemplates;


            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;


            document.getElementById("templateSelect").onchange =
                templateSelected;


            // Allow ENTER key for template search

            document.getElementById("templateSearch")
                .addEventListener("keypress", function (event) {

                    if (event.key === "Enter") {

                        searchProjectTemplates();

                    }

                });

        });

    }


    waitForWidget();

})();



// ============================================================
// GLOBAL VARIABLES
// ============================================================

var templateResults = [];

var currentSpaceUrl = "";

var currentCsrfToken = "";



// ============================================================
// SEARCH PROJECT TEMPLATES
// ============================================================

function searchProjectTemplates() {

    console.log("====================================");
    console.log("SEARCH PROJECT TEMPLATES");
    console.log("====================================");


    var searchText =
        document.getElementById("templateSearch")
            .value
            .trim();


    var result =
        document.getElementById("result");


    var select =
        document.getElementById("templateSelect");



    // --------------------------------------------------------
    // Validate search text
    // --------------------------------------------------------

    if (searchText.length < 2) {

        result.innerHTML =
            "<span class='error'>" +
            "Please enter at least 2 characters to search." +
            "</span>";

        return;
    }



    result.innerHTML =
        "<span>" +
        "Searching project templates..." +
        "</span>";


    select.innerHTML =
        "<option value=''>" +
        "Searching..." +
        "</option>";



    // --------------------------------------------------------
    // Load 3DEXPERIENCE modules
    // --------------------------------------------------------

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



            // ------------------------------------------------
            // Get platform services
            // ------------------------------------------------

            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue("x3dPlatformId"),


                onComplete: function (services) {

                    console.log("Services Received");

                    console.log(services);



                    var spaceUrl =
                        services["3DSpace"];


                    if (!spaceUrl) {

                        result.innerHTML =
                            "<span class='error'>" +
                            "3DSpace service not found." +
                            "</span>";

                        return;
                    }



                    console.log(
                        "3DSpace URL:",
                        spaceUrl
                    );


                    currentSpaceUrl =
                        spaceUrl;



                    // ------------------------------------------------
                    // Get CSRF
                    // ------------------------------------------------

                    var csrfUrl =
                        spaceUrl +
                        "/resources/v1/application/CSRF";


                    WAFData.authenticatedRequest(

                        csrfUrl,

                        {

                            method: "GET",

                            type: "json",


                            onComplete: function (
                                csrfResponse
                            ) {

                                console.log(
                                    "CSRF SUCCESS"
                                );


                                if (
                                    !csrfResponse ||
                                    !csrfResponse.csrf ||
                                    !csrfResponse.csrf.value
                                ) {

                                    result.innerHTML =
                                        "<span class='error'>" +
                                        "CSRF token not found." +
                                        "</span>";

                                    return;
                                }



                                var csrfToken =
                                    csrfResponse.csrf.value;


                                currentCsrfToken =
                                    csrfToken;



                                console.log(
                                    "CSRF Token Received"
                                );



                                // ------------------------------------------------
                                // Search
                                // ------------------------------------------------

                                performTemplateSearch(

                                    WAFData,

                                    spaceUrl,

                                    csrfToken,

                                    searchText

                                );

                            },


                            onFailure: function (error) {

                                console.log(
                                    "CSRF FAILED"
                                );

                                console.log(error);


                                result.innerHTML =
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


                    result.innerHTML =
                        "<span class='error'>" +
                        "SERVICE DISCOVERY FAILED" +
                        "</span>";
                }

            });

        }

    );

}



// ============================================================
// PERFORM TEMPLATE SEARCH
// ============================================================

function performTemplateSearch(

    WAFData,
    spaceUrl,
    csrfToken,
    searchText

) {

    console.log(
        "Searching for:",
        searchText
    );



    // --------------------------------------------------------
    // Build URL
    // --------------------------------------------------------

    var searchUrl =

        spaceUrl +

        "/resources/v1/modeler/projecttemplates/search" +

        "?searchStr=" +

        encodeURIComponent(searchText) +

        "&$top=50";



    console.log(
        "Template Search URL:",
        searchUrl
    );



    // --------------------------------------------------------
    // GET Search Results
    // --------------------------------------------------------

    WAFData.authenticatedRequest(

        searchUrl,

        {

            method: "GET",

            type: "json",


            headers: {

                "Accept":
                    "application/json",

                "ENO_CSRF_TOKEN":
                    csrfToken

            },


            onComplete: function (response) {

                console.log(
                    "TEMPLATE SEARCH SUCCESS"
                );


                console.log(
                    "Template Search Response:"
                );


                console.log(response);



                if (
                    !response ||
                    !response.data
                ) {

                    showTemplateSearchError(
                        "Invalid response from Project Template search."
                    );

                    return;
                }



                templateResults =
                    response.data;



                console.log(
                    "Templates Found:",
                    templateResults.length
                );



                populateTemplateDropdown(
                    templateResults
                );

            },


            onFailure: function (error) {

                console.log(
                    "TEMPLATE SEARCH FAILED"
                );


                console.log(error);



                showTemplateSearchError(
                    "Template search failed."
                );

            }

        }

    );

}



// ============================================================
// POPULATE TEMPLATE DROPDOWN
// ============================================================

function populateTemplateDropdown(
    templates
) {

    var select =
        document.getElementById("templateSelect");


    var result =
        document.getElementById("result");



    select.innerHTML = "";



    // --------------------------------------------------------
    // No templates
    // --------------------------------------------------------

    if (
        !templates ||
        templates.length === 0
    ) {

        select.innerHTML =
            "<option value=''>" +
            "No templates found" +
            "</option>";


        result.innerHTML =
            "<span class='error'>" +
            "No project templates found." +
            "</span>";


        clearSelectedTemplate();

        return;
    }



    // --------------------------------------------------------
    // Default option
    // --------------------------------------------------------

    var defaultOption =
        document.createElement("option");


    defaultOption.value = "";

    defaultOption.text =
        "Select a template";


    select.appendChild(
        defaultOption
    );



    // --------------------------------------------------------
    // Add templates
    // --------------------------------------------------------

    for (
        var i = 0;
        i < templates.length;
        i++
    ) {

        var template =
            templates[i];


        var option =
            document.createElement("option");


        option.value = i;


        var title = "";


        if (
            template.dataelements
        ) {

            title =
                template.dataelements.title ||
                template.dataelements.name ||
                "";

        }


        if (!title) {

            title =
                "Template " + (i + 1);

        }


        option.text =
            title;


        select.appendChild(
            option
        );

    }



    result.innerHTML =
        "<span class='success'>" +
        templates.length +
        " template(s) found." +
        "</span>";


    clearSelectedTemplate();

}



// ============================================================
// TEMPLATE SELECTED
// ============================================================

function templateSelected() {

    var select =
        document.getElementById("templateSelect");


    var selectedIndex =
        select.value;



    if (
        selectedIndex === ""
    ) {

        clearSelectedTemplate();

        return;
    }



    var template =
        templateResults[
            parseInt(selectedIndex, 10)
        ];



    if (!template) {

        clearSelectedTemplate();

        return;
    }



    console.log(
        "===================================="
    );

    console.log(
        "SELECTED TEMPLATE"
    );

    console.log(
        "===================================="
    );

    console.log(template);



    var title = "";


    if (
        template.dataelements
    ) {

        title =
            template.dataelements.title ||
            template.dataelements.name ||
            "";

    }



    document.getElementById(
        "selectedTemplateName"
    ).textContent =
        title || "-";


    document.getElementById(
        "selectedTemplateId"
    ).textContent =
        template.id || "-";

}



// ============================================================
// CLEAR SELECTED TEMPLATE
// ============================================================

function clearSelectedTemplate() {

    document.getElementById(
        "selectedTemplateName"
    ).textContent =
        "-";


    document.getElementById(
        "selectedTemplateId"
    ).textContent =
        "-";

}



// ============================================================
// CREATE PROJECT FROM TEMPLATE
// ============================================================

function createProjectFromTemplate() {

    console.log(
        "===================================="
    );

    console.log(
        "CREATE PROJECT FROM TEMPLATE"
    );

    console.log(
        "===================================="
    );



    var projectName =
        document.getElementById("projectName")
            .value
            .trim();


    var projectDescription =
        document.getElementById("projectDescription")
            .value
            .trim();


    var select =
        document.getElementById("templateSelect");


    var selectedIndex =
        select.value;


    var result =
        document.getElementById("result");



    // --------------------------------------------------------
    // Validate Project Name
    // --------------------------------------------------------

    if (!projectName) {

        result.innerHTML =
            "<span class='error'>" +
            "Please enter Project Name." +
            "</span>";

        return;
    }



    // --------------------------------------------------------
    // Validate Template
    // --------------------------------------------------------

    if (
        selectedIndex === ""
    ) {

        result.innerHTML =
            "<span class='error'>" +
            "Please select a Project Template." +
            "</span>";

        return;
    }



    var template =
        templateResults[
            parseInt(selectedIndex, 10)
        ];



    if (!template) {

        result.innerHTML =
            "<span class='error'>" +
            "Selected template not found." +
            "</span>";

        return;
    }



    console.log(
        "Selected Template Object:",
        template
    );



    // --------------------------------------------------------
    // Get latest template information
    // --------------------------------------------------------

    var templateId =
        template.id;


    var templateType =
        template.type;


    var templateCestamp =
        template.cestamp;



    console.log(
        "Template ID:",
        templateId
    );


    console.log(
        "Template Type:",
        templateType
    );


    console.log(
        "Template Cestamp:",
        templateCestamp
    );



    if (!templateId) {

        result.innerHTML =
            "<span class='error'>" +
            "Template ID is missing." +
            "</span>";

        return;
    }



    result.innerHTML =
        "<span>" +
        "Getting template details..." +
        "</span>";



    // --------------------------------------------------------
    // Get complete template detail
    // --------------------------------------------------------

    getTemplateDetails(

        currentSpaceUrl,

        currentCsrfToken,

        templateId,

        projectName,

        projectDescription

    );

}



// ============================================================
// GET COMPLETE TEMPLATE DETAILS
// ============================================================

function getTemplateDetails(

    spaceUrl,

    csrfToken,

    templateId,

    projectName,

    projectDescription

) {

    console.log(
        "===================================="
    );

    console.log(
        "GET TEMPLATE DETAILS"
    );

    console.log(
        "===================================="
    );



    var templateUrl =

        spaceUrl +

        "/resources/v1/modeler/projecttemplates/" +

        encodeURIComponent(templateId);



    console.log(
        "Template Detail URL:",
        templateUrl
    );



    require(

        [
            "DS/WAFData/WAFData"
        ],

        function (WAFData) {


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


                    onComplete: function (
                        response
                    ) {

                        console.log(
                            "TEMPLATE DETAIL SUCCESS"
                        );


                        console.log(
                            response
                        );



                        if (
                            !response ||
                            !response.data ||
                            !response.data.length
                        ) {

                            resultMessage(
                                "Template details not found.",
                                true
                            );

                            return;
                        }



                        var template =
                            response.data[0];



                        console.log(
                            "Complete Template:",
                            template
                        );



                        var templateId =
                            template.id;


                        var templateType =
                            template.type;


                        var templateCestamp =
                            template.cestamp;



                        // ------------------------------------------------
                        // Check for possible source / relativePath
                        // ------------------------------------------------

                        var templateSource =
                            template.source ||
                            "";


                        var templateRelativePath =
                            template.relativePath ||
                            "";



                        if (
                            template.dataelements
                        ) {

                            templateSource =
                                template.dataelements.source ||
                                templateSource;


                            templateRelativePath =
                                template.dataelements.relativePath ||
                                templateRelativePath;

                        }



                        console.log(
                            "Template ID:",
                            templateId
                        );


                        console.log(
                            "Template Type:",
                            templateType
                        );


                        console.log(
                            "Template Cestamp:",
                            templateCestamp
                        );


                        console.log(
                            "Template Source:",
                            templateSource
                        );


                        console.log(
                            "Template Relative Path:",
                            templateRelativePath
                        );



                        // ------------------------------------------------
                        // Create project
                        // ------------------------------------------------

                        createProjectRequest(

                            WAFData,

                            spaceUrl,

                            csrfToken,

                            projectName,

                            projectDescription,

                            templateId,

                            templateType,

                            templateCestamp,

                            templateSource,

                            templateRelativePath

                        );

                    },


                    onFailure: function (error) {

                        console.log(
                            "TEMPLATE DETAIL FAILED"
                        );


                        console.log(error);



                        resultMessage(
                            "Failed to get template details.",
                            true
                        );

                    }

                }

            );

        }

    );

}



// ============================================================
// CREATE PROJECT REQUEST
// ============================================================

function createProjectRequest(

    WAFData,

    spaceUrl,

    csrfToken,

    projectName,

    projectDescription,

    templateId,

    templateType,

    templateCestamp,

    templateSource,

    templateRelativePath

) {


    console.log(
        "===================================="
    );

    console.log(
        "CREATE PROJECT REQUEST"
    );

    console.log(
        "===================================="
    );



    // --------------------------------------------------------
    // Build project template object
    // --------------------------------------------------------

    var projectTemplate = {

        id:
            templateId,

        type:
            templateType,

        identifier:
            templateId,

        source:
            templateSource || spaceUrl,

        relativePath:
            templateRelativePath,

        cestamp:
            templateCestamp

    };



    // --------------------------------------------------------
    // Payload
    // --------------------------------------------------------

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
                        projectDescription

                },


                relateddata: {

                    projectTemplate: [

                        projectTemplate

                    ]

                }

            }

        ]

    };



    console.log(
        "===================================="
    );

    console.log(
        "FINAL CREATE PROJECT PAYLOAD"
    );

    console.log(
        "===================================="
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

        "/resources/v1/modeler/projects/fromTemplate";



    console.log(
        "POST URL:",
        projectUrl
    );



    resultMessage(
        "Creating project..."
    );



    // --------------------------------------------------------
    // POST
    // --------------------------------------------------------

    WAFData.authenticatedRequest(

        projectUrl,

        {

            method:
                "POST",


            type:
                "json",


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


            onComplete: function (
                response
            ) {

                console.log(
                    "===================================="
                );

                console.log(
                    "PROJECT CREATED SUCCESSFULLY"
                );

                console.log(
                    "===================================="
                );


                console.log(
                    response
                );



                resultMessage(

                    "Project Created Successfully From Template"

                );

            },


            onFailure: function (
                error
            ) {

                console.log(
                    "===================================="
                );

                console.log(
                    "PROJECT CREATION FAILED"
                );

                console.log(
                    "===================================="
                );


                console.log(
                    error
                );



                var errorText =
                    getErrorMessage(error);



                resultMessage(

                    "PROJECT CREATION FAILED" +

                    (
                        errorText
                            ? ": " + errorText
                            : ""
                    ),

                    true

                );

            }

        }

    );

}



// ============================================================
// TEMPLATE SEARCH ERROR
// ============================================================

function showTemplateSearchError(
    message
) {

    var select =
        document.getElementById(
            "templateSelect"
        );


    var result =
        document.getElementById(
            "result"
        );


    select.innerHTML =
        "<option value=''>" +
        "Select a template" +
        "</option>";


    result.innerHTML =
        "<span class='error'>" +
        message +
        "</span>";


    clearSelectedTemplate();

}



// ============================================================
// RESULT MESSAGE
// ============================================================

function resultMessage(

    message,

    isError

) {

    var result =
        document.getElementById(
            "result"
        );


    if (!result) {
        return;
    }



    if (isError) {

        result.innerHTML =
            "<span class='error'>" +
            message +
            "</span>";

    } else {

        result.innerHTML =
            "<span>" +
            message +
            "</span>";

    }

}



// ============================================================
// ERROR MESSAGE
// ============================================================

function getErrorMessage(
    error
) {

    if (!error) {
        return "";
    }



    console.log(
        "Raw Error:",
        error
    );



    if (
        typeof error === "object"
    ) {

        if (error.error) {
            return error.error;
        }


        if (error.internalError) {
            return error.internalError;
        }


        if (error.message) {
            return error.message;
        }

    }



    if (
        typeof error === "string"
    ) {

        return error;

    }



    return "";

}
