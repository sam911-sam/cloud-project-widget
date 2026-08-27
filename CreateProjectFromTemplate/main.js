define(
    "CreateProjectFromTemplate/main",
    [
        "UWA/Core",
        "DS/WAFData/WAFData",
        "DS/i3DXCompassServices/i3DXCompassServices"
    ],
    function (UWA, WAFData, i3DXCompassServices) {

        "use strict";

        /* =========================================================
         * GLOBALS
         * ========================================================= */

        var widget = null;

        var threeDSpaceURL = null;
        var platformServices = null;

        var csrfToken = null;

        var selectedTemplate = null;
        var templateResults = [];

        var initialized = false;


        /* =========================================================
         * INITIALIZATION
         * ========================================================= */

        function initialize() {

            if (initialized) {
                return;
            }

            initialized = true;

            console.log(
                "======================================"
            );
            console.log(
                "CREATE PROJECT FROM TEMPLATE WIDGET"
            );
            console.log(
                "INITIALIZING"
            );
            console.log(
                "======================================"
            );

            /*
             * Get current widget.
             */
            try {
                if (UWA && UWA.Widget) {
                    widget = UWA.Widget.get();
                }
            } catch (e) {
                console.warn(
                    "Unable to get UWA widget:",
                    e
                );
            }

            /*
             * IMPORTANT:
             *
             * Setup UI FIRST.
             *
             * This means the form does not remain blank
             * while platform services are loading.
             */
            setupCreateButton();

            /*
             * Start platform-service discovery.
             */
            getPlatformServices();
        }


        /* =========================================================
         * GET PLATFORM SERVICES
         * ========================================================= */

        function getPlatformServices() {

            console.log(
                "======================================"
            );
            console.log(
                "GET PLATFORM SERVICES"
            );
            console.log(
                "======================================"
            );

            try {

                i3DXCompassServices.getPlatformServices({

                    onComplete: function (services) {

                        console.log(
                            "Platform services response:"
                        );

                        console.log(services);

                        platformServices = services;

                        /*
                         * The API can return either an object
                         * or an array depending on platform version.
                         */
                        var service = services;

                        if (Array.isArray(services)) {

                            if (!services.length) {

                                console.error(
                                    "No platform services returned."
                                );

                                useFallback3DSpaceURL();

                                return;
                            }

                            service = services[0];
                        }

                        /*
                         * Try all commonly encountered
                         * 3DSpace URL properties.
                         */
                        threeDSpaceURL =
                            extract3DSpaceURL(service);

                        /*
                         * Some environments return a list.
                         */
                        if (
                            !threeDSpaceURL &&
                            Array.isArray(services)
                        ) {

                            for (
                                var i = 0;
                                i < services.length;
                                i++
                            ) {

                                threeDSpaceURL =
                                    extract3DSpaceURL(
                                        services[i]
                                    );

                                if (threeDSpaceURL) {
                                    break;
                                }
                            }
                        }

                        if (threeDSpaceURL) {

                            threeDSpaceURL =
                                removeTrailingSlash(
                                    threeDSpaceURL
                                );

                            console.log(
                                "3DSpace URL:"
                            );

                            console.log(
                                threeDSpaceURL
                            );

                            searchProjectTemplates();

                            return;
                        }

                        /*
                         * Last-resort fallback.
                         */
                        useFallback3DSpaceURL();
                    },

                    onFailure: function (error) {

                        console.error(
                            "Failed to get platform services:"
                        );

                        console.error(error);

                        useFallback3DSpaceURL();
                    }
                });

            } catch (e) {

                console.error(
                    "Exception while getting platform services:"
                );

                console.error(e);

                useFallback3DSpaceURL();
            }
        }


        /* =========================================================
         * EXTRACT 3DSPACE URL
         * ========================================================= */

        function extract3DSpaceURL(service) {

            if (!service) {
                return null;
            }

            /*
             * Direct properties.
             */
            var possibleValues = [
                service["3DSpace"],
                service["3DSpaceURL"],
                service["3DSpaceUrl"],
                service["3DSpaceURLBase"],
                service["3DSpaceBaseURL"],
                service["url"]
            ];

            for (
                var i = 0;
                i < possibleValues.length;
                i++
            ) {

                if (
                    possibleValues[i] &&
                    typeof possibleValues[i] === "string"
                ) {

                    if (
                        possibleValues[i]
                            .toLowerCase()
                            .indexOf("3dspace") !== -1
                    ) {

                        return possibleValues[i];
                    }
                }
            }

            /*
             * Sometimes services contain nested service data.
             */
            if (service.services) {

                var nested =
                    service.services;

                if (Array.isArray(nested)) {

                    for (
                        var j = 0;
                        j < nested.length;
                        j++
                    ) {

                        var nestedURL =
                            extract3DSpaceURL(
                                nested[j]
                            );

                        if (nestedURL) {
                            return nestedURL;
                        }
                    }

                } else if (
                    typeof nested === "object"
                ) {

                    var nestedURL2 =
                        extract3DSpaceURL(
                            nested
                        );

                    if (nestedURL2) {
                        return nestedURL2;
                    }
                }
            }

            return null;
        }


        /* =========================================================
         * FALLBACK 3DSPACE URL
         * ========================================================= */

        function useFallback3DSpaceURL() {

            console.warn(
                "Trying to determine 3DSpace URL from current page."
            );

            var currentURL =
                window.location.href;

            var hostname =
                window.location.hostname;

            /*
             * Typical 3DEXPERIENCE hostname:
             *
             * xxxx-space.3dexperience.3ds.com
             */

            var match =
                currentURL.match(
                    /https?:\/\/[^/]+-space\.3dexperience\.3ds\.com/i
                );

            if (match) {

                threeDSpaceURL =
                    match[0];

                console.log(
                    "Fallback 3DSpace URL:"
                );

                console.log(
                    threeDSpaceURL
                );

                searchProjectTemplates();

                return;
            }

            /*
             * Another useful fallback is to use the current
             * hostname if it already looks like a 3DSpace host.
             */
            if (
                hostname &&
                hostname.toLowerCase().indexOf(
                    "-space.3dexperience.3ds.com"
                ) !== -1
            ) {

                threeDSpaceURL =
                    window.location.origin;

                console.log(
                    "Fallback origin used as 3DSpace:"
                );

                console.log(
                    threeDSpaceURL
                );

                searchProjectTemplates();

                return;
            }

            console.error(
                "Unable to determine 3DSpace URL."
            );

            showMessage(
                "Unable to determine 3DSpace URL."
            );
        }


        /* =========================================================
         * REMOVE TRAILING SLASH
         * ========================================================= */

        function removeTrailingSlash(value) {

            if (!value) {
                return value;
            }

            return String(value).replace(
                /\/+$/,
                ""
            );
        }


        /* =========================================================
         * SEARCH PROJECT TEMPLATES
         * ========================================================= */

        function searchProjectTemplates() {

            if (!threeDSpaceURL) {

                console.error(
                    "Cannot search templates: 3DSpace URL missing."
                );

                return;
            }

            console.log(
                "======================================"
            );
            console.log(
                "SEARCH PROJECT TEMPLATES"
            );
            console.log(
                "======================================"
            );

            /*
             * Keep the search broad.
             *
             * We filter the response afterwards.
             */
            var searchText = "PT";

            var url =
                threeDSpaceURL +
                "/resources/v1/modeler/projecttemplates/search" +
                "?searchStr=" +
                encodeURIComponent(searchText) +
                "&$top=100";

            console.log(
                "Template search URL:"
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
                            "======================================"
                        );

                        console.log(
                            "TEMPLATE SEARCH RESPONSE"
                        );

                        console.log(
                            "======================================"
                        );

                        console.log(response);

                        var data = [];

                        if (
                            response &&
                            Array.isArray(response.data)
                        ) {

                            data =
                                response.data;
                        }

                        console.log(
                            "ALL TEMPLATE SEARCH RESULTS:"
                        );

                        console.log(data);

                        /*
                         * IMPORTANT:
                         *
                         * Only Project Template objects
                         * are allowed.
                         */
                        templateResults =
                            data.filter(
                                function (item) {

                                    if (!item) {
                                        return false;
                                    }

                                    return (
                                        String(
                                            item.type || ""
                                        ).toLowerCase() ===
                                        "project template"
                                            .toLowerCase()
                                    );
                                }
                            );

                        console.log(
                            "FILTERED PROJECT TEMPLATES:"
                        );

                        console.log(
                            templateResults
                        );

                        renderTemplateResults(
                            templateResults
                        );

                        if (!templateResults.length) {

                            showMessage(
                                "No Project Template objects found."
                            );

                            return;
                        }

                        showMessage(
                            templateResults.length +
                            " Project Template(s) loaded."
                        );
                    },

                    onFailure: function (error) {

                        console.error(
                            "======================================"
                        );

                        console.error(
                            "TEMPLATE SEARCH FAILED"
                        );

                        console.error(
                            "======================================"
                        );

                        console.error(error);

                        showMessage(
                            "Unable to load Project Templates."
                        );
                    }
                }
            );
        }


        /* =========================================================
         * RENDER TEMPLATE RESULTS
         * ========================================================= */

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
                    "Project Template select not found."
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
                        item.id || "";

                    var title = "";

                    var name = "";

                    if (
                        item.dataelements
                    ) {

                        title =
                            item.dataelements.title ||
                            "";

                        name =
                            item.dataelements.name ||
                            "";
                    }

                    if (!title) {
                        title =
                            item.title ||
                            item.name ||
                            item.id ||
                            "";
                    }

                    option.textContent =
                        name
                            ? name + " - " + title
                            : title;

                    /*
                     * Keep the complete object accessible.
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
                            "No template selected."
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
                        "Template type:",
                        selectedTemplate.type
                    );

                    console.log(
                        "Template cestamp:",
                        selectedTemplate.cestamp
                    );
                };
        }


        /* =========================================================
         * GET CSRF TOKEN
         * ========================================================= */

        function getCSRFToken(callback) {

            console.log(
                "======================================"
            );

            console.log(
                "GET CSRF TOKEN"
            );

            console.log(
                "======================================"
            );

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

                    onComplete:
                        function (response) {

                            console.log(
                                "CSRF RESPONSE:"
                            );

                            console.log(
                                response
                            );

                            var token = null;

                            /*
                             * Standard response.
                             */
                            if (
                                response &&
                                response.csrf &&
                                response.csrf.value
                            ) {

                                token =
                                    response.csrf.value;
                            }

                            /*
                             * Additional compatibility.
                             */
                            if (
                                !token &&
                                response &&
                                response.data &&
                                response.data.csrf &&
                                response.data.csrf.value
                            ) {

                                token =
                                    response.data.csrf.value;
                            }

                            if (!token) {

                                callback(
                                    new Error(
                                        "CSRF token not found in response."
                                    )
                                );

                                return;
                            }

                            csrfToken =
                                token;

                            console.log(
                                "CSRF TOKEN RECEIVED"
                            );

                            callback(
                                null,
                                token
                            );
                        },

                    onFailure:
                        function (error) {

                            console.error(
                                "CSRF request failed:"
                            );

                            console.error(
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
         * GET PROJECT TEMPLATE DETAILS
         * ========================================================= */

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

            console.log(
                "======================================"
            );

            console.log(
                "GET PROJECT TEMPLATE DETAILS"
            );

            console.log(
                "======================================"
            );

            var url =
                threeDSpaceURL +
                "/resources/v1/modeler/projecttemplates/" +
                encodeURIComponent(
                    template.id
                );

            console.log(
                "Template detail URL:"
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

                    onComplete:
                        function (response) {

                            console.log(
                                "TEMPLATE DETAIL RESPONSE:"
                            );

                            console.log(
                                response
                            );

                            if (
                                response &&
                                Array.isArray(
                                    response.data
                                ) &&
                                response.data.length
                            ) {

                                callback(
                                    null,
                                    response.data[0]
                                );

                                return;
                            }

                            /*
                             * Some responses may return
                             * the object directly.
                             */
                            if (
                                response &&
                                response.id
                            ) {

                                callback(
                                    null,
                                    response
                                );

                                return;
                            }

                            callback(
                                new Error(
                                    "Project Template details not found."
                                )
                            );
                        },

                    onFailure:
                        function (error) {

                            console.error(
                                "Template detail request failed:"
                            );

                            console.error(
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
         * BUILD TEMPLATE REFERENCE
         * ========================================================= */

        function buildTemplateReference(
            template
        ) {

            /*
             * This is intentionally kept close to the
             * schema you provided.
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
                    )
            };

            /*
             * Cestamp is useful when supplied by the
             * template object.
             */
            if (template.cestamp) {

                reference.cestamp =
                    template.cestamp;
            }

            return reference;
        }


        /* =========================================================
         * BUILD PROJECT PAYLOAD
         * ========================================================= */

        function buildProjectPayload(
            template,
            projectTitle,
            projectDescription
        ) {

            var templateReference =
                buildTemplateReference(
                    template
                );

            /*
             * IMPORTANT:
             *
             * Do not send empty constraintDate.
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
         * POST PROJECT FROM TEMPLATE
         * ========================================================= */

        function postProjectFromTemplate(
            payload,
            callback
        ) {

            console.log(
                "======================================"
            );

            console.log(
                "POST PROJECT FROM TEMPLATE"
            );

            console.log(
                "======================================"
            );

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
             * Only add SecurityContext if we
             * actually have one.
             *
             * Do NOT send:
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

                    onComplete:
                        function (response) {

                            console.log(
                                "======================================"
                            );

                            console.log(
                                "PROJECT CREATION RESPONSE"
                            );

                            console.log(
                                "======================================"
                            );

                            console.log(
                                response
                            );

                            callback(
                                null,
                                response
                            );
                        },

                    onFailure:
                        function (error) {

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
                                error
                            );

                            /*
                             * Print as much information as
                             * WAFData exposes.
                             */
                            try {

                                console.error(
                                    "Error JSON:",
                                    JSON.stringify(
                                        error,
                                        null,
                                        2
                                    )
                                );

                            } catch (e) {

                                console.error(
                                    "Could not stringify error."
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
         * SECURITY CONTEXT
         * ========================================================= */

        function getSecurityContext() {

            var context = "";

            /*
             * First try widget preference.
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
                    "Could not read SecurityContext widget preference:",
                    e
                );
            }

            /*
             * Then DOM.
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

            return String(
                context || ""
            ).trim();
        }


        /* =========================================================
         * CREATE PROJECT FROM TEMPLATE
         * ========================================================= */

        function createProjectFromTemplate() {

            console.log(
                "======================================"
            );

            console.log(
                "CREATE PROJECT FROM TEMPLATE"
            );

            console.log(
                "======================================"
            );

            if (!selectedTemplate) {

                showMessage(
                    "Please select a Project Template."
                );

                return;
            }

            if (
                String(
                    selectedTemplate.type || ""
                ).toLowerCase() !==
                "project template"
            ) {

                showMessage(
                    "Invalid Project Template selected."
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
                "Project title:",
                title
            );

            console.log(
                "Project description:",
                description
            );

            /*
             * Disable button during creation.
             */
            setCreateButtonEnabled(
                false
            );

            showMessage(
                "Getting CSRF token..."
            );

            /*
             * STEP 1
             */
            getCSRFToken(
                function (
                    csrfError,
                    token
                ) {

                    if (csrfError) {

                        console.error(
                            csrfError
                        );

                        setCreateButtonEnabled(
                            true
                        );

                        showMessage(
                            "Unable to get CSRF token."
                        );

                        return;
                    }

                    csrfToken =
                        token;

                    showMessage(
                        "Getting Project Template details..."
                    );

                    /*
                     * STEP 2
                     */
                    getProjectTemplateDetails(
                        selectedTemplate,
                        function (
                            templateError,
                            fullTemplate
                        ) {

                            if (templateError) {

                                console.error(
                                    templateError
                                );

                                setCreateButtonEnabled(
                                    true
                                );

                                showMessage(
                                    "Unable to get Project Template details."
                                );

                                return;
                            }

                            /*
                             * STEP 3
                             */
                            var payload =
                                buildProjectPayload(
                                    fullTemplate,
                                    title,
                                    description
                                );

                            showMessage(
                                "Creating project..."
                            );

                            /*
                             * STEP 4
                             */
                            postProjectFromTemplate(
                                payload,
                                function (
                                    postError,
                                    response
                                ) {

                                    setCreateButtonEnabled(
                                        true
                                    );

                                    if (postError) {

                                        console.error(
                                            "PROJECT CREATION ERROR:"
                                        );

                                        console.error(
                                            postError
                                        );

                                        showMessage(
                                            "Project creation failed. Check browser console for the server response."
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
         * GET INPUT VALUE
         * ========================================================= */

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

                var value = "";

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
                    String(value).trim()
                ) {

                    return String(
                        value
                    ).trim();
                }
            }

            return "";
        }


        /* =========================================================
         * BUTTON ENABLE/DISABLE
         * ========================================================= */

        function setCreateButtonEnabled(
            enabled
        ) {

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

            if (button) {

                button.disabled =
                    !enabled;
            }
        }


        /* =========================================================
         * MESSAGE
         * ========================================================= */

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
         * BUTTON SETUP
         * ========================================================= */

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
             * Avoid registering the event twice.
             */
            if (
                button._projectTemplateHandlerAdded
            ) {

                return;
            }

            button._projectTemplateHandlerAdded =
                true;

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    createProjectFromTemplate();
                }
            );
        }


        /* =========================================================
         * PUBLIC DEBUG FUNCTIONS
         * ========================================================= */

        window.createProjectFromTemplate =
            createProjectFromTemplate;

        window.searchProjectTemplates =
            searchProjectTemplates;

        window.getCSRFToken =
            getCSRFToken;


        /* =========================================================
         * START
         * ========================================================= */

        /*
         * UWA widget lifecycle.
         *
         * If the widget already exists, initialize immediately.
         * Otherwise wait for the DOM/widget lifecycle.
         */
        if (
            UWA &&
            UWA.Widget
        ) {

            try {

                widget =
                    UWA.Widget.get();

            } catch (e) {

                console.warn(
                    "UWA.Widget.get() failed:",
                    e
                );
            }
        }

        /*
         * Initialize immediately.
         *
         * The UI is set up before asynchronous
         * 3DSpace calls begin.
         */
        initialize();


        /* =========================================================
         * MODULE EXPORT
         * ========================================================= */

        return {

            createProjectFromTemplate:
                createProjectFromTemplate,

            searchProjectTemplates:
                searchProjectTemplates,

            getCSRFToken:
                getCSRFToken
        };
    }
);
