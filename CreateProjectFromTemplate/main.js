define([
    "UWA/Core",
    "DS/WAFData/WAFData",
    "DS/i3DXCompassServices/i3DXCompassServices"
], function (UWA, WAFData, i3DXCompassServices) {

    "use strict";

    /* =========================================================
       GLOBALS
       ========================================================= */

    var widget = null;
    var platformServices = null;
    var threeDSpaceURL = null;

    var selectedTemplate = null;
    var csrfToken = null;

    var templateResults = [];


    /* =========================================================
       WIDGET READY
       ========================================================= */

    function waitForWidget() {

        if (widget) {
            console.log("Widget object found");
            initialize();
            return;
        }

        console.log("Waiting for widget object...");

        if (typeof UWA !== "undefined" && UWA.Widget) {
            widget = UWA.Widget.get();
        }

        if (widget) {
            console.log("Widget object found");
            initialize();
        } else {
            setTimeout(waitForWidget, 500);
        }
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    function initialize() {

        console.log("Widget Loaded");

        if (typeof widget.addEvent === "function") {
            widget.addEvent("onLoad", function () {
                console.log("Widget onLoad");
            });
        }

        getPlatformServices();
    }


    /* =========================================================
       GET 3DSPACE
       ========================================================= */

    function getPlatformServices() {

        console.log("======================================");
        console.log("GET PLATFORM SERVICES");
        console.log("======================================");

        i3DXCompassServices.getPlatformServices({
            onComplete: function (services) {

                platformServices = services;

                console.log("Platform Services:");
                console.log(services);

                if (!services || !services.length) {
                    console.error("Platform services not available");
                    return;
                }

                /*
                 * Depending on platform version, services may be:
                 *
                 * {
                 *   platformId: "...",
                 *   displayName: "...",
                 *   type: "DEFAULT",
                 *   ...
                 * }
                 *
                 * or an array.
                 */

                var service = services;

                if (Array.isArray(services)) {
                    service = services[0];
                }

                if (
                    service &&
                    service["3DSpace"]
                ) {
                    threeDSpaceURL = service["3DSpace"];
                } else if (
                    service &&
                    service["3DSpaceURL"]
                ) {
                    threeDSpaceURL = service["3DSpaceURL"];
                } else if (
                    service &&
                    service.platformId
                ) {
                    /*
                     * Fallback.
                     * In your environment the platform service
                     * normally provides the 3DSpace URL.
                     */
                    console.warn(
                        "3DSpace URL was not directly returned by service."
                    );
                }

                if (threeDSpaceURL) {

                    /*
                     * Remove trailing slash.
                     */
                    threeDSpaceURL =
                        threeDSpaceURL.replace(/\/+$/, "");

                    console.log(
                        "3DSpace URL:",
                        threeDSpaceURL
                    );

                    searchProjectTemplates();

                } else {

                    /*
                     * Last-resort fallback based on the current
                     * 3DExperience page.
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
                            "Fallback 3DSpace URL:",
                            threeDSpaceURL
                        );

                        searchProjectTemplates();

                    } else {

                        console.error(
                            "Unable to determine 3DSpace URL"
                        );
                    }
                }
            },

            onFailure: function (error) {

                console.error(
                    "Failed to get platform services:",
                    error
                );
            }
        });
    }


    /* =========================================================
       SEARCH PROJECT TEMPLATES
       ========================================================= */

    function searchProjectTemplates() {

        console.log("======================================");
        console.log("SEARCH PROJECT TEMPLATES");
        console.log("======================================");

        var searchText = "PT";

        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projecttemplates/search" +
            "?searchStr=" +
            encodeURIComponent(searchText) +
            "&$top=100";

        console.log("Template Search URL:");
        console.log(url);

        WAFData.authenticatedRequest(url, {

            method: "GET",

            type: "json",

            headers: {
                "Accept": "application/json"
            },

            onComplete: function (response) {

                console.log(
                    "TEMPLATE SEARCH RESPONSE:"
                );

                console.log(response);

                if (
                    !response ||
                    !response.data
                ) {
                    console.error(
                        "No template data returned"
                    );
                    return;
                }

                /*
                 * IMPORTANT:
                 *
                 * Search may return:
                 * Project Space
                 * Project Template
                 * Task Type
                 * etc.
                 *
                 * We only allow:
                 *
                 * Project Template
                 */

                console.log(
                    "ALL SEARCH RESULTS:"
                );

                console.log(response.data);

                templateResults =
                    response.data.filter(function (item) {

                        return (
                            item &&
                            item.type === "Project Template"
                        );

                    });

                console.log(
                    "FILTERED PROJECT TEMPLATES:"
                );

                console.log(templateResults);

                if (!templateResults.length) {

                    console.warn(
                        "No Project Template objects found."
                    );

                    return;
                }

                /*
                 * Display results in UI.
                 */
                renderTemplateResults(
                    templateResults
                );
            },

            onFailure: function (error) {

                console.error(
                    "Project template search failed:",
                    error
                );
            }
        });
    }


    /* =========================================================
       RENDER TEMPLATE RESULTS
       ========================================================= */

    function renderTemplateResults(results) {

        var select =
            document.getElementById(
                "projectTemplate"
            );

        if (!select) {

            /*
             * Support alternative IDs.
             */
            select =
                document.getElementById(
                    "templateSelect"
                );
        }

        if (!select) {

            console.warn(
                "Template select element not found."
            );

            return;
        }

        select.innerHTML = "";

        var defaultOption =
            document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent =
            "Select Project Template";

        select.appendChild(
            defaultOption
        );

        results.forEach(function (item) {

            var option =
                document.createElement("option");

            option.value = item.id;

            var title =
                item.dataelements &&
                item.dataelements.title
                    ? item.dataelements.title
                    : item.id;

            var name =
                item.dataelements &&
                item.dataelements.name
                    ? item.dataelements.name
                    : "";

            option.textContent =
                name
                    ? name + " - " + title
                    : title;

            option._templateObject = item;

            select.appendChild(option);
        });

        /*
         * Native select change handler.
         */
        select.onchange = function () {

            var index =
                select.selectedIndex;

            if (
                index <= 0 ||
                !results[index - 1]
            ) {

                selectedTemplate = null;

                return;
            }

            selectedTemplate =
                results[index - 1];

            console.log(
                "SELECTED TEMPLATE OBJECT:"
            );

            console.log(
                selectedTemplate
            );

            console.log(
                "Template ID:",
                selectedTemplate.id
            );

            console.log(
                "Template Type:",
                selectedTemplate.type
            );

            console.log(
                "Template Cestamp:",
                selectedTemplate.cestamp
            );
        };
    }


    /* =========================================================
       GET CSRF TOKEN
       ========================================================= */

    function getCSRFToken(callback) {

        console.log("======================================");
        console.log("GET CSRF TOKEN");
        console.log("======================================");

        var url =
            threeDSpaceURL +
            "/resources/v1/application/CSRF";

        console.log("CSRF URL:");
        console.log(url);

        WAFData.authenticatedRequest(url, {

            method: "GET",

            type: "json",

            headers: {
                "Accept": "application/json"
            },

            onComplete: function (response) {

                console.log(
                    "CSRF RESPONSE:"
                );

                console.log(response);

                if (
                    response &&
                    response.csrf &&
                    response.csrf.value
                ) {

                    csrfToken =
                        response.csrf.value;

                    console.log(
                        "CSRF TOKEN RECEIVED"
                    );

                    callback(null, csrfToken);

                } else {

                    callback(
                        new Error(
                            "CSRF token not found in response"
                        )
                    );
                }
            },

            onFailure: function (error) {

                callback(error);
            }
        });
    }


    /* =========================================================
       GET TEMPLATE DETAILS
       ========================================================= */

    function getProjectTemplateDetails(
        template,
        callback
    ) {

        console.log("======================================");
        console.log("GET PROJECT TEMPLATE DETAILS");
        console.log("======================================");

        if (
            !template ||
            !template.id
        ) {

            callback(
                new Error(
                    "Invalid Project Template"
                )
            );

            return;
        }

        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projecttemplates/" +
            encodeURIComponent(template.id);

        console.log(
            "Template Detail URL:"
        );

        console.log(url);

        WAFData.authenticatedRequest(url, {

            method: "GET",

            type: "json",

            headers: {
                "Accept": "application/json"
            },

            onComplete: function (response) {

                console.log(
                    "PROJECT TEMPLATE DETAIL RESPONSE:"
                );

                console.log(response);

                if (
                    !response ||
                    !response.data ||
                    !response.data.length
                ) {

                    callback(
                        new Error(
                            "Project Template details not found"
                        )
                    );

                    return;
                }

                var fullTemplate =
                    response.data[0];

                console.log(
                    "FULL TEMPLATE OBJECT:"
                );

                console.log(
                    fullTemplate
                );

                callback(
                    null,
                    fullTemplate
                );
            },

            onFailure: function (error) {

                callback(error);
            }
        });
    }


    /* =========================================================
       BUILD TEMPLATE REFERENCE
       ========================================================= */

    function buildTemplateReference(template) {

        /*
         * This is the format shown in the API documentation.
         */

        return {
            id: template.id,

            type: "Project Template",

            identifier: template.id,

            source: threeDSpaceURL,

            relativePath:
                "/resources/v1/modeler/projecttemplates/" +
                template.id,

            cestamp: template.cestamp
        };
    }


    /* =========================================================
       BUILD PROJECT FROM TEMPLATE REQUEST
       ========================================================= */

    function buildProjectPayload(
        template,
        projectTitle,
        projectDescription
    ) {

        var templateReference =
            buildTemplateReference(
                template
            );

        console.log("======================================");
        console.log("SELECTED TEMPLATE");
        console.log("======================================");

        console.log(template);

        console.log("======================================");
        console.log("PROJECT TEMPLATE REFERENCE");
        console.log("======================================");

        console.log(
            JSON.stringify(
                templateReference,
                null,
                2
            )
        );


        /*
         * IMPORTANT:
         *
         * Do NOT send:
         *
         * constraintDate: ""
         *
         * because an empty date can be interpreted
         * as an invalid date by the server.
         *
         * We also only send the fields required
         * for the creation operation.
         */

        var projectDataElements = {

            scheduleFrom:
                "Project Start Date",

            defaultConstraintType:
                "As Soon As Possible",

            currency:
                "Unassigned",

            title:
                projectTitle,

            description:
                projectDescription
        };


        var payload = {

            data: [
                {
                    type: "Project Space",

                    dataelements:
                        projectDataElements,

                    relateddata: {

                        projectTemplate: [
                            templateReference
                        ]
                    }
                }
            ]
        };


        console.log("======================================");
        console.log("FINAL POST PAYLOAD");
        console.log("======================================");

        console.log(
            JSON.stringify(
                payload,
                null,
                2
            )
        );

        return payload;
    }


    /* =========================================================
       POST PROJECT FROM TEMPLATE
       ========================================================= */

    function postProjectFromTemplate(
        payload,
        callback
    ) {

        console.log("======================================");
        console.log("POST PROJECT FROM TEMPLATE");
        console.log("======================================");

        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projects/fromTemplate";

        console.log("POST URL:");
        console.log(url);

        console.log("POST BODY:");
        console.log(
            JSON.stringify(
                payload,
                null,
                2
            )
        );

        console.log("CSRF TOKEN:");
        console.log(csrfToken);


        /*
         * IMPORTANT:
         *
         * SecurityContext is deliberately NOT
         * hard-coded here.
         *
         * The current authenticated 3DEXPERIENCE
         * context is handled by WAFData.
         */

        WAFData.authenticatedRequest(url, {

            method: "POST",

            type: "json",

            data:
                JSON.stringify(payload),

            headers: {

                "Accept":
                    "application/json",

                "Content-Type":
                    "application/json",

                "ENO_CSRF_TOKEN":
                    csrfToken,

                "SecurityContext":
                    getSecurityContext()
            },

            onComplete: function (response) {

                console.log(
                    "======================================"
                );

                console.log(
                    "PROJECT CREATION RESPONSE"
                );

                console.log(
                    "======================================"
                );

                console.log(response);

                callback(
                    null,
                    response
                );
            },

            onFailure: function (error) {

                console.error(
                    "PROJECT CREATION HTTP ERROR"
                );

                console.error(error);

                callback(
                    error
                );
            }
        });
    }


    /* =========================================================
       SECURITY CONTEXT
       ========================================================= */

    function getSecurityContext() {

        /*
         * If your widget already has a SecurityContext
         * preference, use it.
         */

        var context = "";

        try {

            if (
                widget &&
                widget.getValue
            ) {

                context =
                    widget.getValue(
                        "SecurityContext"
                    ) || "";
            }

        } catch (e) {

            console.warn(
                "Unable to read SecurityContext preference",
                e
            );
        }

        /*
         * Also support a DOM field if your UI
         * contains one.
         */

        if (!context) {

            var element =
                document.getElementById(
                    "securityContext"
                );

            if (element) {

                context =
                    element.value ||
                    element.textContent ||
                    "";
            }
        }

        context =
            String(context || "").trim();

        console.log(
            "SecurityContext:",
            context || "(empty)"
        );

        return context;
    }


    /* =========================================================
       CREATE PROJECT FROM TEMPLATE
       ========================================================= */

    function createProjectFromTemplate() {

        console.log("======================================");
        console.log("CREATE PROJECT FROM TEMPLATE");
        console.log("======================================");


        if (!selectedTemplate) {

            showMessage(
                "Please select a Project Template."
            );

            return;
        }


        if (
            selectedTemplate.type !==
            "Project Template"
        ) {

            showMessage(
                "Invalid template type. Please select a Project Template."
            );

            return;
        }


        var title =
            getInputValue([
                "projectTitle",
                "title",
                "projectName"
            ]);


        var description =
            getInputValue([
                "projectDescription",
                "description"
            ]);


        if (!title) {

            title = "New Project";
        }


        if (!description) {

            description = "";
        }


        console.log(
            "Project Title:",
            title
        );

        console.log(
            "Project Description:",
            description
        );


        /*
         * Step 1:
         * Get a fresh CSRF token.
         */

        getCSRFToken(
            function (
                csrfError,
                token
            ) {

                if (csrfError) {

                    console.error(
                        "CSRF ERROR:",
                        csrfError
                    );

                    showMessage(
                        "Unable to get CSRF token."
                    );

                    return;
                }


                csrfToken = token;


                /*
                 * Step 2:
                 * Get the complete template object.
                 */

                getProjectTemplateDetails(
                    selectedTemplate,

                    function (
                        templateError,
                        fullTemplate
                    ) {

                        if (templateError) {

                            console.error(
                                "TEMPLATE DETAIL ERROR:",
                                templateError
                            );

                            showMessage(
                                "Unable to get Project Template details."
                            );

                            return;
                        }


                        /*
                         * Step 3:
                         * Build exact API payload.
                         */

                        var payload =
                            buildProjectPayload(
                                fullTemplate,
                                title,
                                description
                            );


                        /*
                         * Step 4:
                         * POST.
                         */

                        postProjectFromTemplate(
                            payload,

                            function (
                                postError,
                                response
                            ) {

                                if (postError) {

                                    console.error(
                                        "======================================"
                                    );

                                    console.error(
                                        "PROJECT CREATION FAILED"
                                    );

                                    console.error(
                                        "======================================"
                                    );

                                    console.error(
                                        "ERROR OBJECT:"
                                    );

                                    console.error(
                                        postError
                                    );

                                    showMessage(
                                        "Project creation failed. HTTP 400 / Bad Request."
                                    );

                                    return;
                                }


                                console.log(
                                    "======================================"
                                );

                                console.log(
                                    "PROJECT CREATED SUCCESSFULLY"
                                );

                                console.log(
                                    "======================================"
                                );

                                console.log(response);

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
       GET INPUT VALUE
       ========================================================= */

    function getInputValue(ids) {

        for (
            var i = 0;
            i < ids.length;
            i++
        ) {

            var element =
                document.getElementById(
                    ids[i]
                );

            if (element) {

                var value =
                    element.value !== undefined
                        ? element.value
                        : element.textContent;

                if (
                    value &&
                    String(value).trim()
                ) {

                    return String(
                        value
                    ).trim();
                }
            }
        }

        return "";
    }


    /* =========================================================
       MESSAGE
       ========================================================= */

    function showMessage(message) {

        console.log(
            "MESSAGE:",
            message
        );

        var element =
            document.getElementById(
                "message"
            );

        if (!element) {

            element =
                document.getElementById(
                    "status"
                );
        }

        if (element) {

            element.textContent =
                message;
        }
    }


    /* =========================================================
       BUTTON SETUP
       ========================================================= */

    function setupCreateButton() {

        var button =
            document.getElementById(
                "createProject"
            );

        if (!button) {

            button =
                document.getElementById(
                    "createProjectButton"
                );
        }

        if (!button) {

            console.warn(
                "Create Project button not found."
            );

            return;
        }

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                createProjectFromTemplate();
            }
        );
    }


    /* =========================================================
       PUBLIC DEBUG HELPERS
       ========================================================= */

    window.createProjectFromTemplate =
        createProjectFromTemplate;

    window.searchProjectTemplates =
        searchProjectTemplates;

    window.getCSRFToken =
        getCSRFToken;


    /* =========================================================
       START
       ========================================================= */

    setupCreateButton();

    waitForWidget();

});
