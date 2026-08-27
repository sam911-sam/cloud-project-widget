(function () {

    "use strict";

    var widget = null;
    var threeDSpaceURL = null;
    var projectTemplates = [];

    /* =========================================================
       WAIT FOR 3DEXPERIENCE WIDGET
       ========================================================= */

    function waitForWidget() {

        if (typeof widget === "undefined" || !widget) {

            if (typeof window.widget !== "undefined") {
                widget = window.widget;
            }

        }

        if (!widget) {

            console.log("Waiting for widget object...");

            setTimeout(waitForWidget, 500);

            return;
        }

        console.log("Widget object found");

        initialize();
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    function initialize() {

        console.log("Initializing widget");

        widget.addEvent("onLoad", function () {

            console.log("Widget Loaded");

            renderForm();

            /*
             * IMPORTANT:
             * UI is rendered FIRST.
             * API loading happens AFTER the form is visible.
             */
            loadProjectTemplates();

        });

    }


    /* =========================================================
       RENDER FORM
       ========================================================= */

    function renderForm() {

        widget.body.innerHTML =

            '<div class="dxp-container">' +

                '<div class="dxp-header">' +
                    'Create Project From Template' +
                '</div>' +

                '<div class="dxp-form">' +

                    '<div class="dxp-field">' +
                        '<label>Project Title</label>' +
                        '<input ' +
                            'type="text" ' +
                            'id="projectTitle" ' +
                            'placeholder="Enter project title">' +
                    '</div>' +

                    '<div class="dxp-field">' +
                        '<label>Project Description</label>' +
                        '<textarea ' +
                            'id="projectDescription" ' +
                            'placeholder="Enter project description">' +
                        '</textarea>' +
                    '</div>' +

                    '<div class="dxp-field">' +
                        '<label>Project Template</label>' +
                        '<select id="projectTemplate">' +
                            '<option value="">Loading Project Templates...</option>' +
                        '</select>' +
                    '</div>' +

                    '<div class="dxp-field">' +
                        '<label>Security Context</label>' +
                        '<input ' +
                            'type="text" ' +
                            'id="securityContext" ' +
                            'placeholder="Optional Security Context">' +
                    '</div>' +

                    '<div class="dxp-actions">' +

                        '<button ' +
                            'id="createProject" ' +
                            'class="dxp-button">' +
                            'Create Project' +
                        '</button>' +

                    '</div>' +

                    '<div ' +
                        'id="message" ' +
                        'class="dxp-message">' +
                    '</div>' +

                '</div>' +

            '</div>';


        addStyles();

        setupCreateButton();

        console.log("Form rendered successfully");
    }


    /* =========================================================
       STYLES
       ========================================================= */

    function addStyles() {

        var style =
            document.createElement("style");

        style.innerHTML =

            ".dxp-container {" +
                "font-family: Arial, sans-serif;" +
                "padding: 20px;" +
                "background: #f5f6f7;" +
                "min-height: 100%;" +
                "box-sizing: border-box;" +
            "}" +

            ".dxp-header {" +
                "font-size: 20px;" +
                "font-weight: 600;" +
                "color: #1f2933;" +
                "margin-bottom: 25px;" +
                "padding-bottom: 12px;" +
                "border-bottom: 1px solid #d5d9dd;" +
            "}" +

            ".dxp-form {" +
                "background: white;" +
                "padding: 20px;" +
                "border-radius: 4px;" +
                "box-shadow: 0 1px 4px rgba(0,0,0,0.12);" +
                "max-width: 700px;" +
            "}" +

            ".dxp-field {" +
                "margin-bottom: 18px;" +
            "}" +

            ".dxp-field label {" +
                "display: block;" +
                "font-size: 13px;" +
                "font-weight: 600;" +
                "margin-bottom: 7px;" +
                "color: #374151;" +
            "}" +

            ".dxp-field input," +
            ".dxp-field textarea," +
            ".dxp-field select {" +
                "width: 100%;" +
                "box-sizing: border-box;" +
                "border: 1px solid #c7cdd3;" +
                "border-radius: 3px;" +
                "padding: 9px 10px;" +
                "font-size: 14px;" +
                "background: white;" +
            "}" +

            ".dxp-field textarea {" +
                "height: 90px;" +
                "resize: vertical;" +
            "}" +

            ".dxp-field input:focus," +
            ".dxp-field textarea:focus," +
            ".dxp-field select:focus {" +
                "outline: none;" +
                "border-color: #368ec4;" +
            "}" +

            ".dxp-actions {" +
                "margin-top: 25px;" +
            "}" +

            ".dxp-button {" +
                "background: #368ec4;" +
                "color: white;" +
                "border: none;" +
                "border-radius: 3px;" +
                "padding: 10px 22px;" +
                "font-size: 14px;" +
                "cursor: pointer;" +
            "}" +

            ".dxp-button:hover {" +
                "background: #2878a9;" +
            "}" +

            ".dxp-button:disabled {" +
                "background: #9ca3af;" +
                "cursor: not-allowed;" +
            "}" +

            ".dxp-message {" +
                "margin-top: 15px;" +
                "font-size: 13px;" +
                "color: #374151;" +
            "}";


        document.head.appendChild(style);
    }


    /* =========================================================
       GET PLATFORM / 3DSPACE
       ========================================================= */

    function loadProjectTemplates() {

        console.log("Loading project templates...");

        /*
         * First try the current 3DEXPERIENCE URL.
         *
         * This keeps the UI independent from the API.
         */

        var currentURL =
            window.location.href;

        var match =
            currentURL.match(
                /https?:\/\/[^/]+-space\.3dexperience\.3ds\.com/
            );


        if (match) {

            threeDSpaceURL =
                match[0] + "/enovia";

            console.log(
                "3DSpace URL detected:",
                threeDSpaceURL
            );

            searchProjectTemplates();

            return;
        }


        /*
         * If the URL cannot be detected, try
         * i3DXCompassServices if it is already available.
         */

        if (
            typeof i3DXCompassServices !== "undefined" &&
            i3DXCompassServices &&
            typeof i3DXCompassServices.getPlatformServices === "function"
        ) {

            console.log(
                "Getting platform services..."
            );

            i3DXCompassServices.getPlatformServices({

                onComplete: function (services) {

                    console.log(
                        "Platform services:",
                        services
                    );

                    var service = services;

                    if (Array.isArray(services)) {
                        service = services[0];
                    }

                    if (
                        service &&
                        service["3DSpace"]
                    ) {

                        threeDSpaceURL =
                            service["3DSpace"];

                    } else if (
                        service &&
                        service["3DSpaceURL"]
                    ) {

                        threeDSpaceURL =
                            service["3DSpaceURL"];

                    }


                    if (threeDSpaceURL) {

                        threeDSpaceURL =
                            threeDSpaceURL.replace(
                                /\/+$/,
                                ""
                            );

                        searchProjectTemplates();

                    } else {

                        showTemplateError(
                            "Unable to determine 3DSpace URL."
                        );
                    }

                },

                onFailure: function (error) {

                    console.error(
                        "Platform service error:",
                        error
                    );

                    showTemplateError(
                        "Unable to get 3DSpace service."
                    );
                }

            });

            return;
        }


        showTemplateError(
            "3DSpace service is not available."
        );
    }


    /* =========================================================
       SEARCH PROJECT TEMPLATES
       ========================================================= */

    function searchProjectTemplates() {

        console.log(
            "Searching Project Templates..."
        );


        var select =
            document.getElementById(
                "projectTemplate"
            );


        if (!select) {
            return;
        }


        select.innerHTML =
            '<option value="">Loading Project Templates...</option>';


        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projecttemplates/search" +
            "?searchStr=PT" +
            "&$top=100";


        console.log(
            "Template search URL:",
            url
        );


        if (
            typeof WAFData === "undefined" ||
            !WAFData.authenticatedRequest
        ) {

            console.error(
                "WAFData.authenticatedRequest is not available"
            );

            showTemplateError(
                "WAFData is not available."
            );

            return;
        }


        WAFData.authenticatedRequest(

            url,

            {

                method: "GET",

                type: "json",

                headers: {

                    "Accept":
                        "application/json"

                },

                onComplete: function (response) {

                    console.log(
                        "Project Template response:",
                        response
                    );

                    processTemplateResponse(
                        response
                    );
                },

                onFailure: function (error) {

                    console.error(
                        "Project Template search failed:",
                        error
                    );

                    showTemplateError(
                        "Unable to load Project Templates."
                    );
                }

            }
        );
    }


    /* =========================================================
       PROCESS TEMPLATE RESPONSE
       ========================================================= */

    function processTemplateResponse(
        response
    ) {

        var select =
            document.getElementById(
                "projectTemplate"
            );


        if (!select) {
            return;
        }


        select.innerHTML = "";


        var defaultOption =
            document.createElement(
                "option"
            );

        defaultOption.value = "";

        defaultOption.textContent =
            "Select Project Template";

        select.appendChild(
            defaultOption
        );


        if (
            !response ||
            !response.data ||
            !Array.isArray(response.data)
        ) {

            console.warn(
                "No template data returned."
            );

            showTemplateError(
                "No Project Templates found."
            );

            return;
        }


        /*
         * Only keep Project Template objects.
         */

        projectTemplates =
            response.data.filter(
                function (item) {

                    return (
                        item &&
                        (
                            item.type ===
                            "Project Template"
                        )
                    );

                }
            );


        console.log(
            "Filtered Project Templates:",
            projectTemplates
        );


        /*
         * If the server uses a slightly different
         * type value, show the returned objects
         * rather than leaving the UI empty.
         */

        if (!projectTemplates.length) {

            console.warn(
                "No objects with type 'Project Template'."
            );

            /*
             * DEMO FALLBACK:
             * Show all returned objects.
             */

            projectTemplates =
                response.data.filter(
                    function (item) {
                        return item && item.id;
                    }
                );
        }


        projectTemplates.forEach(
            function (item) {

                var option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.id || "";


                var name = "";

                var title = "";


                if (
                    item.dataelements
                ) {

                    name =
                        item.dataelements.name ||
                        "";

                    title =
                        item.dataelements.title ||
                        "";
                }


                if (!name) {
                    name = item.name || "";
                }


                if (!title) {
                    title = item.title || "";
                }


                var displayName = "";


                if (name && title) {

                    displayName =
                        name + " - " + title;

                } else if (name) {

                    displayName =
                        name;

                } else if (title) {

                    displayName =
                        title;

                } else {

                    displayName =
                        item.id;
                }


                option.textContent =
                    displayName;


                select.appendChild(
                    option
                );

            }
        );


        select.onchange =
            function () {

                var index =
                    select.selectedIndex - 1;


                if (
                    index < 0 ||
                    !projectTemplates[index]
                ) {

                    return;
                }


                console.log(
                    "Selected Project Template:",
                    projectTemplates[index]
                );
            };


        if (projectTemplates.length) {

            showMessage(
                projectTemplates.length +
                " Project Template(s) loaded."
            );

        } else {

            showTemplateError(
                "No Project Templates available."
            );
        }
    }


    /* =========================================================
       CREATE BUTTON
       ========================================================= */

    function setupCreateButton() {

        var button =
            document.getElementById(
                "createProject"
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                createProject();

            }
        );
    }


    /* =========================================================
       CREATE PROJECT
       ========================================================= */

    function createProject() {

        var title =
            getValue(
                "projectTitle"
            );


        var description =
            getValue(
                "projectDescription"
            );


        var select =
            document.getElementById(
                "projectTemplate"
            );


        var templateIndex =
            select ?
            select.selectedIndex - 1 :
            -1;


        var template =
            templateIndex >= 0 ?
            projectTemplates[templateIndex] :
            null;


        if (!template) {

            showMessage(
                "Please select a Project Template."
            );

            return;
        }


        if (!title) {

            title =
                "New Project";
        }


        var button =
            document.getElementById(
                "createProject"
            );


        if (button) {
            button.disabled = true;
            button.textContent =
                "Creating Project...";
        }


        showMessage(
            "Creating project..."
        );


        /*
         * Get CSRF first.
         */

        getCSRFToken(
            function (
                csrfError,
                csrfToken
            ) {

                if (csrfError) {

                    console.error(
                        csrfError
                    );

                    finishCreateButton();

                    showMessage(
                        "Unable to get CSRF token."
                    );

                    return;
                }


                /*
                 * Get full template.
                 */

                getProjectTemplateDetails(
                    template,

                    function (
                        detailError,
                        fullTemplate
                    ) {

                        if (detailError) {

                            console.error(
                                detailError
                            );

                            finishCreateButton();

                            showMessage(
                                "Unable to get template details."
                            );

                            return;
                        }


                        var payload =
                            buildProjectPayload(
                                fullTemplate,
                                title,
                                description
                            );


                        postProject(
                            payload,
                            csrfToken,

                            function (
                                error,
                                response
                            ) {

                                finishCreateButton();


                                if (error) {

                                    console.error(
                                        "Project creation error:",
                                        error
                                    );

                                    showMessage(
                                        "Project creation failed."
                                    );

                                    return;
                                }


                                console.log(
                                    "Project created:",
                                    response
                                );


                                showMessage(
                                    "Project created successfully."
                                );
                            }
                        );
                    }
                );
            }
        );
    }


    /* =========================================================
       CSRF TOKEN
       ========================================================= */

    function getCSRFToken(callback) {

        var url =
            threeDSpaceURL +
            "/resources/v1/application/CSRF";


        WAFData.authenticatedRequest(

            url,

            {

                method: "GET",

                type: "json",

                headers: {

                    "Accept":
                        "application/json"

                },

                onComplete:
                    function (response) {

                        console.log(
                            "CSRF response:",
                            response
                        );


                        if (
                            response &&
                            response.csrf &&
                            response.csrf.value
                        ) {

                            callback(
                                null,
                                response.csrf.value
                            );

                            return;
                        }


                        callback(
                            new Error(
                                "CSRF token not found."
                            )
                        );
                    },


                onFailure:
                    function (error) {

                        callback(
                            error
                        );
                    }

            }
        );
    }


    /* =========================================================
       GET TEMPLATE DETAILS
       ========================================================= */

    function getProjectTemplateDetails(
        template,
        callback
    ) {

        if (
            !template ||
            !template.id
        ) {

            callback(
                new Error(
                    "Invalid Project Template."
                )
            );

            return;
        }


        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projecttemplates/" +
            encodeURIComponent(
                template.id
            );


        console.log(
            "Template detail URL:",
            url
        );


        WAFData.authenticatedRequest(

            url,

            {

                method: "GET",

                type: "json",

                headers: {

                    "Accept":
                        "application/json"

                },

                onComplete:
                    function (response) {

                        console.log(
                            "Template detail response:",
                            response
                        );


                        if (
                            response &&
                            response.data &&
                            response.data.length
                        ) {

                            callback(
                                null,
                                response.data[0]
                            );

                            return;
                        }


                        /*
                         * If detail API doesn't return
                         * data, use search object.
                         */

                        callback(
                            null,
                            template
                        );
                    },


                onFailure:
                    function (error) {

                        console.warn(
                            "Template detail request failed. Using search object.",
                            error
                        );


                        /*
                         * For demo / compatibility,
                         * continue with original object.
                         */

                        callback(
                            null,
                            template
                        );
                    }

            }
        );
    }


    /* =========================================================
       BUILD PAYLOAD
       ========================================================= */

    function buildProjectPayload(
        template,
        title,
        description
    ) {

        /*
         * Keep this compatible with the
         * Project Space fromTemplate schema.
         */

        var templateReference = {

            id:
                template.id,

            type:
                "Project Template",

            identifier:
                template.id,

            source:
                threeDSpaceURL,

            relativePath:
                "/resources/v1/modeler/projecttemplates/" +
                encodeURIComponent(
                    template.id
                )

        };


        /*
         * Only add cestamp if available.
         */

        if (template.cestamp) {

            templateReference.cestamp =
                template.cestamp;
        }


        var payload = {

            data: [

                {

                    type:
                        "Project Space",

                    dataelements: {

                        title:
                            title,

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

                            templateReference

                        ]

                    }

                }

            ]

        };


        console.log(
            "FINAL PROJECT PAYLOAD:",
            JSON.stringify(
                payload,
                null,
                2
            )
        );


        return payload;
    }


    /* =========================================================
       POST PROJECT
       ========================================================= */

    function postProject(
        payload,
        csrfToken,
        callback
    ) {

        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projects/fromTemplate";


        console.log(
            "POST URL:",
            url
        );


        console.log(
            "POST BODY:",
            JSON.stringify(
                payload,
                null,
                2
            )
        );


        var securityContext =
            getValue(
                "securityContext"
            );


        var headers = {

            "Accept":
                "application/json",

            "Content-Type":
                "application/json",

            "ENO_CSRF_TOKEN":
                csrfToken

        };


        /*
         * Only send SecurityContext if
         * the user actually entered one.
         */

        if (securityContext) {

            headers.SecurityContext =
                securityContext;
        }


        WAFData.authenticatedRequest(

            url,

            {

                method:
                    "POST",

                type:
                    "json",

                data:
                    JSON.stringify(
                        payload
                    ),

                headers:
                    headers,

                onComplete:
                    function (response) {

                        callback(
                            null,
                            response
                        );
                    },

                onFailure:
                    function (error) {

                        callback(
                            error
                        );
                    }

            }
        );
    }


    /* =========================================================
       HELPERS
       ========================================================= */

    function getValue(id) {

        var element =
            document.getElementById(
                id
            );


        if (!element) {
            return "";
        }


        return String(
            element.value || ""
        ).trim();
    }


    function showMessage(message) {

        var element =
            document.getElementById(
                "message"
            );


        if (element) {

            element.textContent =
                message;
        }


        console.log(
            "MESSAGE:",
            message
        );
    }


    function showTemplateError(message) {

        var select =
            document.getElementById(
                "projectTemplate"
            );


        if (select) {

            select.innerHTML =
                '<option value="">' +
                    'Unable to load templates' +
                '</option>';
        }


        showMessage(
            message
        );
    }


    function finishCreateButton() {

        var button =
            document.getElementById(
                "createProject"
            );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Create Project";
        }
    }


    /* =========================================================
       GLOBAL DEBUG FUNCTIONS
       ========================================================= */

    window.createProjectFromTemplate =
        createProject;

    window.searchProjectTemplates =
        searchProjectTemplates;

    window.getCSRFToken =
        getCSRFToken;


    /* =========================================================
       START
       ========================================================= */

    waitForWidget();

})();
