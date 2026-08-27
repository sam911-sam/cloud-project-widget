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
                    '<div class="dxp-header">' +
                        'Create Project From Template' +
                    '</div>' +


                    '<div class="dxp-form">' +


                        // =========================================
                        // PROJECT NAME
                        // =========================================

                        '<div class="dxp-field">' +

                            '<label>Project Name</label>' +
                            '<input id="projectName" placeholder="Enter project name">' +

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
                            '<input id="projectDescription" placeholder="Enter description">' +

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
                            '<label>Project Template ID</label>' +
                            '<input id="templateId" ' +
                            'placeholder="Enter Project Template ID">' +

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
                            '<button id="createBtn">Create Project</button>' +

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

            document.getElementById("createBtn").onclick = createProjectFromTemplate;


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


function createProjectFromTemplate() {

    console.log("Create Project From Template Clicked");
// ============================================================
// GLOBAL VARIABLES
// ============================================================

    var projectName =
        document.getElementById("projectName").value.trim();
var templateResults = [];

    var projectDescription =
        document.getElementById("projectDescription").value.trim();
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

    var templateId =
        document.getElementById("templateId").value.trim();

    var result =
        document.getElementById("result");


    // -----------------------------
    // Validate input
    // -----------------------------
    var select =
        document.getElementById("templateSelect");

    if (!projectName) {

        result.innerHTML =
            "<span style='color:red'>Please enter Project Name</span>";

        return;
    }
    // --------------------------------------------------------
    // Validate search text
    // --------------------------------------------------------

    if (!templateId) {
    if (searchText.length < 2) {

        result.innerHTML =
            "<span style='color:red'>Please enter Project Template ID</span>";
            "<span class='error'>" +
            "Please enter at least 2 characters to search." +
            "</span>";

        return;
    }


    console.log("Project Name:", projectName);
    console.log("Description:", projectDescription);
    console.log("Template ID:", templateId);

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
@@ -114,97 +291,150 @@ function createProjectFromTemplate() {
            console.log("Modules Loaded");


            // -----------------------------
            // Get 3DSpace service
            // -----------------------------

            // ------------------------------------------------
            // Get platform services
            // ------------------------------------------------

            CompassServices.getPlatformServices({

                platformId: widget.getValue("x3dPlatformId"),
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


                    // -----------------------------
                    // Get CSRF token
                    // -----------------------------
                    currentSpaceUrl =
                        spaceUrl;



                    // ------------------------------------------------
                    // Get CSRF
                    // ------------------------------------------------

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

                                console.log("CSRF SUCCESS");
                                console.log(csrfResponse);


                                var csrfToken =
                                    csrfResponse.csrf.value;


                                currentCsrfToken =
                                    csrfToken;



                                console.log(
                                    "CSRF Token Received"
                                );


                                // -----------------------------
                                // Create project from template
                                // -----------------------------

                                createProjectFromTemplateRequest(
                                // ------------------------------------------------
                                // Search
                                // ------------------------------------------------

                                performTemplateSearch(

                                    WAFData,

                                    spaceUrl,

                                    csrfToken,
                                    projectName,
                                    projectDescription,
                                    templateId

                                    searchText

                                );

                            },


                            onFailure: function (error) {

                                console.log("CSRF FAILED");
                                console.log(
                                    "CSRF FAILED"
                                );

                                console.log(error);


                                result.innerHTML =
                                    "<span style='color:red'>" +
                                    "<span class='error'>" +
                                    "CSRF FAILED" +
                                    "</span>";
                            }

                        }

                    );

                },


@@ -216,177 +446,1288 @@ function createProjectFromTemplate() {

                    console.log(error);


                    result.innerHTML =
                        "<span style='color:red'>" +
                        "<span class='error'>" +
                        "SERVICE DISCOVERY FAILED" +
                        "</span>";
                }

            });

        }

    );

}


function createProjectFromTemplateRequest(

// ============================================================
// PERFORM TEMPLATE SEARCH
// ============================================================

function performTemplateSearch(

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
    searchText

        data: [
) {

            {
    console.log(
        "Searching for:",
        searchText
    );

                type: "Project Space",

                dataelements: {

                    constraintDate: "",
    // --------------------------------------------------------
    // Build URL
    // --------------------------------------------------------

                    scheduleFrom:
                        "Project Start Date",
    var searchUrl =

                    defaultConstraintType:
                        "As Soon As Possible",
        spaceUrl +

                    currency:
                        "Unassigned",
        "/resources/v1/modeler/projecttemplates/search" +

                    title:
                        projectName,
        "?searchStr=" +

                    description:
                        projectDescription
                },
        encodeURIComponent(searchText) +

        "&$top=50";

                relateddata: {

                    projectTemplate: [

                        {
    console.log(
        "Template Search URL:",
        searchUrl
    );

                            id: templateId,

                            type: "Project Template",

                            identifier: templateId,
    // --------------------------------------------------------
    // GET Search Results
    // --------------------------------------------------------

                            source: spaceUrl,
    WAFData.authenticatedRequest(

                            relativePath:
                                "/resources/v1/modeler/projects/" +
                                templateId,
        searchUrl,

                            cestamp: ""
        {

                        }
            method: "GET",

                    ]
                }
            }
        ]
    };
            type: "json",


    console.log(
        "Project From Template Payload:"
    );
            headers: {

    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );
                "Accept":
                    "application/json",

                "ENO_CSRF_TOKEN":
                    csrfToken

    // -----------------------------
    // API URL
    // -----------------------------
            },

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects/fromTemplate";

            onComplete: function (response) {

    console.log(
        "Project From Template URL:",
        projectUrl
    );
                console.log(
                    "TEMPLATE SEARCH SUCCESS"
                );


    // -----------------------------
    // POST request
    // -----------------------------
                console.log(
                    "Template Search Response:"
                );

    WAFData.authenticatedRequest(
        projectUrl,
        {

            method: "POST",
                console.log(response);

            type: "json",


            headers: {
                if (
                    !response ||
                    !response.data
                ) {

                "Content-Type":
                    "application/json",
                    showTemplateSearchError(
                        "Invalid response from Project Template search."
                    );

                "Accept":
                    "application/json",
                    return;
                }

                "ENO_CSRF_TOKEN":
                    csrfToken
            },


            data:
                JSON.stringify(payload),
                templateResults =
                    response.data;


            onComplete: function (response) {

                console.log(
                    "PROJECT CREATED FROM TEMPLATE"
                    "Templates Found:",
                    templateResults.length
                );

                console.log(response);


                document.getElementById("result").innerHTML =
                    "<span style='color:green'>" +
                    "Project Created Successfully From Template" +
                    "</span>";
                populateTemplateDropdown(
                    templateResults
                );

            },


            onFailure: function (error) {

                console.log(
                    "PROJECT FROM TEMPLATE FAILED"
                    "TEMPLATE SEARCH FAILED"
                );


                console.log(error);


                document.getElementById("result").innerHTML =
                    "<span style='color:red'>" +
                    "PROJECT CREATION FAILED" +
                    "</span>";

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
