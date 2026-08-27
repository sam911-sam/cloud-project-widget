(function () {

    "use strict";

    /* =========================================================
       GLOBALS
       ========================================================= */

    var widget = null;
    var platformServices = null;
    var i3DXCompassServices = null;
    var threeDSpaceURL = null;

    var selectedTemplate = null;
    var csrfToken = null;

    var templateResults = [];


    /* =========================================================
       START
       ========================================================= */

    function start() {

        console.log("======================================");
        console.log("CreateProjectFromTemplate START");
        console.log("======================================");

        /*
         * UWA is normally already available in a 3DEXPERIENCE
         * widget.
         */
        if (
            typeof UWA !== "undefined" &&
            UWA.Widget
        ) {
            widget = UWA.Widget.get();
        }

        if (!widget) {

            console.warn(
                "UWA widget not available yet. Retrying..."
            );

            setTimeout(start, 500);

            return;
        }

        console.log(
            "UWA Widget found:",
            widget
        );

        setupCreateButton();


        /*
         * Load Compass service through RequireJS.
         *
         * IMPORTANT:
         * We do NOT use an anonymous define() around the
         * complete widget anymore.
         */
        require(
            [
                "DS/i3DXCompassServices/i3DXCompassServices"
            ],

            function (CompassServices) {

                console.log(
                    "i3DXCompassServices loaded:",
                    CompassServices
                );

                i3DXCompassServices =
                    CompassServices;

                initialize();
            }
        );
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    function initialize() {

        console.log("======================================");
        console.log("INITIALIZE WIDGET");
        console.log("======================================");

        if (
            widget &&
            typeof widget.addEvent === "function"
        ) {

            widget.addEvent(
                "onLoad",
                function () {

                    console.log(
                        "Widget onLoad"
                    );
                }
            );
        }

        getPlatformServices();
    }


    /* =========================================================
       GET PLATFORM SERVICES
       ========================================================= */

    function getPlatformServices() {

        console.log("======================================");
        console.log("GET PLATFORM SERVICES");
        console.log("======================================");

        if (!i3DXCompassServices) {

            console.error(
                "i3DXCompassServices is not loaded."
            );

            return;
        }

        i3DXCompassServices.getPlatformServices({

            onComplete: function (services) {

                console.log(
                    "PLATFORM SERVICES RESPONSE:"
                );

                console.log(services);

                try {

                    console.log(
                        JSON.stringify(
                            services,
                            null,
                            2
                        )
                    );

                } catch (e) {

                    console.warn(
                        "Unable to stringify platform services",
                        e
                    );
                }


                platformServices =
                    services;


                if (!services) {

                    console.error(
                        "Platform services not available."
                    );

                    return;
                }


                /*
                 * Depending on the 3DEXPERIENCE version,
                 * the returned value can be an array or an
                 * object.
                 */

                var service = services;


                if (
                    Array.isArray(services)
                ) {

                    if (!services.length) {

                        console.error(
                            "Platform services array is empty."
                        );

                        return;
                    }

                    service =
                        services[0];
                }


                console.log(
                    "SELECTED PLATFORM SERVICE:"
                );

                console.log(service);


                /*
                 * Try the common 3DSpace properties.
                 */

                if (
                    service &&
                    service["3DSpace"]
                ) {

                    threeDSpaceURL =
                        service["3DSpace"];

                }

                else if (
                    service &&
                    service["3DSpaceURL"]
                ) {

                    threeDSpaceURL =
                        service["3DSpaceURL"];

                }

                else if (
                    service &&
                    service["3DSpaceUrl"]
                ) {

                    threeDSpaceURL =
                        service["3DSpaceUrl"];

                }


                /*
                 * Remove trailing slash.
                 */

                if (threeDSpaceURL) {

                    threeDSpaceURL =
                        String(
                            threeDSpaceURL
                        ).replace(
                            /\/+$/,
                            ""
                        );

                    console.log(
                        "3DSpace URL:",
                        threeDSpaceURL
                    );

                    searchProjectTemplates();

                    return;
                }


                /*
                 * Last-resort fallback.
                 */

                console.warn(
                    "3DSpace URL not directly returned by Compass."
                );


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

                    return;
                }


                console.error(
                    "Unable to determine 3DSpace URL."
                );
            },


            onFailure: function (error) {

                console.error(
                    "======================================"
                );

                console.error(
                    "PLATFORM SERVICES FAILED"
                );

                console.error(
                    "======================================"
                );

                console.error(error);
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


        if (!threeDSpaceURL) {

            console.error(
                "3DSpace URL is not available."
            );

            return;
        }


        var searchText = "PT";


        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projecttemplates/search" +
            "?searchStr=" +
            encodeURIComponent(searchText) +
            "&$top=100";


        console.log(
            "Template Search URL:"
        );

        console.log(url);


        if (
            typeof WAFData === "undefined" ||
            !WAFData.authenticatedRequest
        ) {

            console.error(
                "WAFData.authenticatedRequest is not available."
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
                        "======================================"
                    );

                    console.log(
                        "TEMPLATE SEARCH RESPONSE"
                    );

                    console.log(
                        "======================================"
                    );

                    console.log(response);


                    if (
                        !response ||
                        !response.data
                    ) {

                        console.error(
                            "No template data returned."
                        );

                        return;
                    }


                    console.log(
                        "ALL SEARCH RESULTS:"
                    );

                    console.log(
                        response.data
                    );


                    /*
                     * Only keep Project Template objects.
                     */

                    templateResults =
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
                        "FILTERED PROJECT TEMPLATES:"
                    );

                    console.log(
                        templateResults
                    );


                    if (
                        !templateResults.length
                    ) {

                        console.warn(
                            "No Project Template objects found."
                        );

                        return;
                    }


                    renderTemplateResults(
                        templateResults
                    );
                },


                onFailure: function (error) {

                    console.error(
                        "======================================"
                    );

                    console.error(
                        "PROJECT TEMPLATE SEARCH FAILED"
                    );

                    console.error(
                        "======================================"
                    );

                    console.error(error);
                }
            }
        );
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
            document.createElement(
                "option"
            );


        defaultOption.value = "";

        defaultOption.textContent =
            "Select Project Template";


        select.appendChild(
            defaultOption
        );


        results.forEach(
            function (item) {

                var option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


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


                /*
                 * Keep complete object available
                 * for debugging.
                 */

                option._templateObject =
                    item;


                select.appendChild(
                    option
                );
            }
        );


        select.onchange =
            function () {

                var index =
                    select.selectedIndex;


                if (
                    index <= 0 ||
                    !results[index - 1]
                ) {

                    selectedTemplate =
                        null;

                    console.log(
                        "No Project Template selected."
                    );

                    return;
                }


                selectedTemplate =
                    results[index - 1];


                console.log(
                    "======================================"
                );

                console.log(
                    "SELECTED PROJECT TEMPLATE"
                );

                console.log(
                    "======================================"
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


        if (!threeDSpaceURL) {

            callback(
                new Error(
                    "3DSpace URL is not available."
                )
            );

            return;
        }


        var url =
            threeDSpaceURL +
            "/resources/v1/application/CSRF";


        console.log(
            "CSRF URL:",
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


                onComplete: function (response) {

                    console.log(
                        "CSRF RESPONSE:"
                    );

                    console.log(response);


                    try {

                        console.log(
                            JSON.stringify(
                                response,
                                null,
                                2
                            )
                        );

                    } catch (e) {

                        console.warn(
                            "Unable to stringify CSRF response",
                            e
                        );
                    }


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


                        callback(
                            null,
                            csrfToken
                        );


                        return;
                    }


                    callback(
                        new Error(
                            "CSRF token not found in response."
                        )
                    );
                },


                onFailure: function (error) {

                    console.error(
                        "CSRF request failed:",
                        error
                    );


                    callback(
                        error
                    );
                }
            }
        );
    }


    /* =========================================================
       GET PROJECT TEMPLATE DETAILS
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
            "Template Detail URL:"
        );

        console.log(url);


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
                                "Project Template details not found."
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

                    console.error(
                        "Template detail request failed:",
                        error
                    );


                    callback(
                        error
                    );
                }
            }
        );
    }


    /* =========================================================
       BUILD TEMPLATE REFERENCE
       ========================================================= */

    function buildTemplateReference(
        template
    ) {

        /*
         * Keep the template reference structure
         * from your existing implementation.
         */

        var reference = {

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
                ),

            cestamp:
                template.cestamp
        };


        console.log(
            "PROJECT TEMPLATE REFERENCE:"
        );

        console.log(
            JSON.stringify(
                reference,
                null,
                2
            )
        );


        return reference;
    }


    /* =========================================================
       BUILD PROJECT PAYLOAD
       ========================================================= */

    function buildProjectPayload(
        template,
        projectTitle,
        projectDescription
    ) {

        console.log("======================================");
        console.log("BUILD PROJECT PAYLOAD");
        console.log("======================================");


        var templateReference =
            buildTemplateReference(
                template
            );


        console.log(
            "SELECTED TEMPLATE:"
        );

        console.log(template);


        /*
         * Project data elements.
         *
         * Keep the structure from the project creation
         * API information you provided.
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


        /*
         * Do NOT send constraintDate as an empty string.
         */

        var payload = {

            data: [

                {

                    type:
                        "Project Space",

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


        console.log(
            "======================================"
        );

        console.log(
            "FINAL PROJECT CREATION PAYLOAD"
        );

        console.log(
            "======================================"
        );


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
       GET SECURITY CONTEXT
       ========================================================= */

    function getSecurityContext() {

        var context = "";


        /*
         * Try widget preference.
         */

        try {

            if (
                widget &&
                typeof widget.getValue ===
                    "function"
            ) {

                context =
                    widget.getValue(
                        "SecurityContext"
                    ) || "";
            }

        } catch (e) {

            console.warn(
                "Unable to read SecurityContext preference:",
                e
            );
        }


        /*
         * Try DOM field.
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
            String(
                context || ""
            ).trim();


        console.log(
            "SecurityContext:",
            context || "(empty)"
        );


        return context;
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


        if (!threeDSpaceURL) {

            callback(
                new Error(
                    "3DSpace URL is not available."
                )
            );

            return;
        }


        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projects/fromTemplate";


        console.log(
            "POST URL:"
        );

        console.log(url);


        console.log(
            "POST BODY:"
        );

        console.log(
            JSON.stringify(
                payload,
                null,
                2
            )
        );


        console.log(
            "CSRF TOKEN:",
            csrfToken
                ? "[RECEIVED]"
                : "[MISSING]"
        );


        /*
         * Build headers.
         */

        var headers = {

            "Accept":
                "application/json",

            "Content-Type":
                "application/json",

            "ENO_CSRF_TOKEN":
                csrfToken
        };


        /*
         * Only add SecurityContext if we actually
         * have a value.
         *
         * This avoids sending:
         *
         * SecurityContext: ""
         */

        var securityContext =
            getSecurityContext();


        if (securityContext) {

            headers.SecurityContext =
                securityContext;
        }


        console.log(
            "POST HEADERS:"
        );

        console.log(
            headers
        );


        WAFData.authenticatedRequest(
            url,
            {

                method: "POST",

                type: "json",

                data:
                    JSON.stringify(
                        payload
                    ),

                headers:
                    headers,


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


                    try {

                        console.log(
                            "PROJECT CREATION RESPONSE JSON:"
                        );

                        console.log(
                            JSON.stringify(
                                response,
                                null,
                                2
                            )
                        );

                    } catch (e) {

                        console.warn(
                            "Unable to stringify creation response",
                            e
                        );
                    }


                    callback(
                        null,
                        response
                    );
                },


                onFailure: function (error) {

                    console.error(
                        "======================================"
                    );

                    console.error(
                        "PROJECT CREATION HTTP ERROR"
                    );

                    console.error(
                        "======================================"
                    );


                    console.error(
                        "ERROR OBJECT:"
                    );

                    console.error(
                        error
                    );


                    /*
                     * Some WAFData errors contain useful
                     * response/body information.
                     */

                    try {

                        console.error(
                            "ERROR JSON:"
                        );

                        console.error(
                            JSON.stringify(
                                error,
                                null,
                                2
                            )
                        );

                    } catch (e) {

                        console.warn(
                            "Unable to stringify error",
                            e
                        );
                    }


                    callback(
                        error
                    );
                }
            }
        );
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
            getInputValue(
                [
                    "projectTitle",
                    "title",
                    "projectName"
                ]
            );


        var description =
            getInputValue(
                [
                    "projectDescription",
                    "description"
                ]
            );


        if (!title) {

            title =
                "New Project";
        }


        if (!description) {

            description =
                "";
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
         * STEP 1
         * Get fresh CSRF token.
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


                csrfToken =
                    token;


                /*
                 * STEP 2
                 * Get complete template details.
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
                         * STEP 3
                         * Build payload.
                         */

                        var payload =
                            buildProjectPayload(
                                fullTemplate,
                                title,
                                description
                            );


                        /*
                         * STEP 4
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
                                        postError
                                    );


                                    showMessage(
                                        "Project creation failed. Check browser console for the API response."
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


                                console.log(
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


            if (!element) {
                continue;
            }


            var value;


            if (
                element.value !==
                undefined
            ) {

                value =
                    element.value;

            } else {

                value =
                    element.textContent;
            }


            if (
                value &&
                String(
                    value
                ).trim()
            ) {

                return String(
                    value
                ).trim();
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


        /*
         * Prevent duplicate event registration.
         */

        if (
            button._projectCreateHandlerAttached
        ) {

            return;
        }


        button._projectCreateHandlerAttached =
            true;


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                createProjectFromTemplate();
            }
        );


        console.log(
            "Create Project button connected."
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

    start();

})();
