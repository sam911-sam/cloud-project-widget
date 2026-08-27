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

                            '<input ' +
                                'id="projectName" ' +
                                'placeholder="Enter project name">' +

                        '</div>' +



                        '<div class="dxp-field">' +

                            '<label>Description</label>' +

                            '<input ' +
                                'id="projectDescription" ' +
                                'placeholder="Enter description">' +

                        '</div>' +



                        '<div class="dxp-field">' +

                            '<label>Project Template ID</label>' +

                            '<input ' +
                                'id="templateId" ' +
                                'placeholder="Enter project template ID">' +

                        '</div>' +



                        '<div class="dxp-actions">' +

                            '<button id="createBtn">' +

                                'Create Project' +

                            '</button>' +

                        '</div>' +



                        '<div id="result"></div>' +


                    '</div>' +

                '</div>';


            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

        });
    }


    waitForWidget();

})();



// ============================================================
// CREATE PROJECT FROM TEMPLATE
// ============================================================

function createProjectFromTemplate() {

    console.log("=================================");
    console.log("Create Project From Template");
    console.log("=================================");


    var projectName =
        document.getElementById("projectName").value.trim();


    var projectDescription =
        document.getElementById("projectDescription").value.trim();


    var templateId =
        document.getElementById("templateId").value.trim();


    var result =
        document.getElementById("result");



    // --------------------------------------------------------
    // Validate Project Name
    // --------------------------------------------------------

    if (!projectName) {

        result.innerHTML =
            "<span class='error'>" +
            "Please enter Project Name" +
            "</span>";

        return;
    }



    // --------------------------------------------------------
    // Validate Template ID
    // --------------------------------------------------------

    if (!templateId) {

        result.innerHTML =
            "<span class='error'>" +
            "Please enter Project Template ID" +
            "</span>";

        return;
    }



    result.innerHTML =
        "<span>" +
        "Connecting to 3DSpace..." +
        "</span>";



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


            console.log("3DEXPERIENCE modules loaded");


            // ------------------------------------------------
            // Get Platform Services
            // ------------------------------------------------

            CompassServices.getPlatformServices({

                platformId:
                    widget.getValue("x3dPlatformId"),


                onComplete: function (services) {

                    console.log(
                        "Platform services received"
                    );

                    console.log(services);



                    var spaceUrl =
                        services["3DSpace"];


                    if (!spaceUrl) {

                        console.log(
                            "3DSpace service not found"
                        );


                        result.innerHTML =
                            "<span class='error'>" +
                            "3DSpace service not found" +
                            "</span>";

                        return;
                    }



                    console.log(
                        "3DSpace URL:",
                        spaceUrl
                    );



                    result.innerHTML =
                        "<span>" +
                        "Getting CSRF token..." +
                        "</span>";



                    // ------------------------------------------------
                    // CSRF URL
                    // ------------------------------------------------

                    var csrfUrl =
                        spaceUrl +
                        "/resources/v1/application/CSRF";


                    console.log(
                        "CSRF URL:",
                        csrfUrl
                    );



                    // ------------------------------------------------
                    // Get CSRF Token
                    // ------------------------------------------------

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

                                console.log(
                                    csrfResponse
                                );



                                if (
                                    !csrfResponse ||
                                    !csrfResponse.csrf ||
                                    !csrfResponse.csrf.value
                                ) {

                                    console.log(
                                        "CSRF token not found"
                                    );


                                    result.innerHTML =
                                        "<span class='error'>" +
                                        "CSRF token not found" +
                                        "</span>";

                                    return;
                                }



                                var csrfToken =
                                    csrfResponse.csrf.value;



                                console.log(
                                    "CSRF token received"
                                );



                                // ------------------------------------------------
                                // Get Project Template
                                // ------------------------------------------------

                                getProjectTemplate(

                                    WAFData,

                                    spaceUrl,

                                    csrfToken,

                                    templateId,

                                    projectName,

                                    projectDescription

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
// GET PROJECT TEMPLATE
// ============================================================

function getProjectTemplate(

    WAFData,

    spaceUrl,

    csrfToken,

    templateId,

    projectName,

    projectDescription

) {


    console.log(
        "================================="
    );

    console.log(
        "Getting Project Template"
    );

    console.log(
        "================================="
    );



    resultMessage(
        "Getting Project Template..."
    );



    // --------------------------------------------------------
    // Project Template GET URL
    // --------------------------------------------------------

    var templateUrl =

        spaceUrl +

        "/resources/v1/modeler/projecttemplates/" +

        encodeURIComponent(templateId);



    console.log(
        "Template URL:",
        templateUrl
    );



    // --------------------------------------------------------
    // GET Project Template
    // --------------------------------------------------------

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


            onComplete: function (response) {


                console.log(
                    "PROJECT TEMPLATE GET SUCCESS"
                );


                console.log(
                    "Template Response:"
                );


                console.log(response);



                // ------------------------------------------------
                // Validate response
                // ------------------------------------------------

                if (

                    !response ||

                    !response.data ||

                    !response.data.length

                ) {


                    console.log(
                        "Project Template not found"
                    );


                    resultMessage(
                        "Project Template not found",
                        true
                    );


                    return;

                }



                // ------------------------------------------------
                // Get first template
                // ------------------------------------------------

                var template =
                    response.data[0];



                console.log(
                    "Actual Template Object:"
                );


                console.log(template);



                // ------------------------------------------------
                // Template ID
                // ------------------------------------------------

                var actualTemplateId =
                    template.id;



                // ------------------------------------------------
                // Template Type
                // ------------------------------------------------

                var actualTemplateType =
                    template.type;



                // ------------------------------------------------
                // Template CESTAMP
                // ------------------------------------------------

                var actualTemplateCestamp =
                    template.cestamp;



                console.log(
                    "Template ID:",
                    actualTemplateId
                );


                console.log(
                    "Template Type:",
                    actualTemplateType
                );


                console.log(
                    "Template Cestamp:",
                    actualTemplateCestamp
                );



                // ------------------------------------------------
                // Template title
                // ------------------------------------------------

                var templateTitle = "";



                if (
                    template.dataelements
                ) {

                    templateTitle =
                        template.dataelements.title ||
                        template.dataelements.name ||
                        "";

                }



                console.log(
                    "Template Title:",
                    templateTitle
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

                    actualTemplateId,

                    actualTemplateType,

                    actualTemplateCestamp

                );

            },



            onFailure: function (error) {


                console.log(
                    "PROJECT TEMPLATE GET FAILED"
                );


                console.log(error);



                var message =
                    getErrorMessage(error);



                resultMessage(

                    "PROJECT TEMPLATE GET FAILED" +
                    (message ? ": " + message : ""),

                    true

                );

            }

        }

    );

}



// ============================================================
// CREATE PROJECT FROM TEMPLATE API
// ============================================================

function createProjectRequest(

    WAFData,

    spaceUrl,

    csrfToken,

    projectName,

    projectDescription,

    templateId,

    templateType,

    templateCestamp

) {


    console.log(
        "================================="
    );

    console.log(
        "Creating Project From Template"
    );

    console.log(
        "================================="
    );



    resultMessage(
        "Creating Project..."
    );



    // --------------------------------------------------------
    // Project Template Object
    // --------------------------------------------------------

    var projectTemplate = {

        id:
            templateId,

        type:
            templateType,

        identifier:
            templateId,

        source:
            spaceUrl,

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



    // --------------------------------------------------------
    // Log payload
    // --------------------------------------------------------

    console.log(
        "================================="
    );


    console.log(
        "CREATE PROJECT PAYLOAD"
    );


    console.log(
        "================================="
    );


    console.log(
        JSON.stringify(
            payload,
            null,
            2
        )
    );



    // --------------------------------------------------------
    // API URL
    // --------------------------------------------------------

    var projectUrl =

        spaceUrl +

        "/resources/v1/modeler/projects/fromTemplate";



    console.log(
        "Project From Template URL:",
        projectUrl
    );



    // --------------------------------------------------------
    // POST request
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



            onComplete: function (response) {


                console.log(
                    "================================="
                );


                console.log(
                    "PROJECT CREATED SUCCESSFULLY"
                );


                console.log(
                    "================================="
                );


                console.log(response);



                resultMessage(

                    "Project Created Successfully From Template"

                );



                // ------------------------------------------------
                // Optional: log created project
                // ------------------------------------------------

                if (
                    response &&
                    response.data
                ) {

                    console.log(
                        "Created Project:",
                        response.data
                    );

                }

            },



            onFailure: function (error) {


                console.log(
                    "================================="
                );


                console.log(
                    "PROJECT CREATION FAILED"
                );


                console.log(
                    "================================="
                );


                console.log(error);



                var message =
                    getErrorMessage(error);



                resultMessage(

                    "PROJECT CREATION FAILED" +

                    (
                        message
                            ? ": " + message
                            : ""
                    ),

                    true

                );

            }

        }

    );

}



// ============================================================
// RESULT MESSAGE
// ============================================================

function resultMessage(
    message,
    isError
) {


    var result =
        document.getElementById("result");


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
// ERROR MESSAGE HELPER
// ============================================================

function getErrorMessage(error) {


    if (!error) {
        return "";
    }



    console.log(
        "Raw API Error:",
        error
    );



    // --------------------------------------------------------
    // Object error
    // --------------------------------------------------------

    if (typeof error === "object") {


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



    // --------------------------------------------------------
    // String error
    // --------------------------------------------------------

    if (typeof error === "string") {

        return error;

    }



    return "";

}
