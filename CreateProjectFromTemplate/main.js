(function () {

    "use strict";

    var widget = null;
    var threeDSpaceURL = null;
    var selectedTemplate = null;
    var templateResults = [];

    /* =========================================================
       WAIT FOR WIDGET
       ========================================================= */

    function waitForWidget() {

        if (typeof window.widget !== "undefined" && window.widget) {

            widget = window.widget;

            console.log("Widget object found");

            widget.addEvent("onLoad", function () {

                console.log("Widget Loaded");

                buildUI();

                get3DSpaceURL();

            });

            return;
        }

        console.log("Waiting for widget object...");

        setTimeout(waitForWidget, 500);
    }


    /* =========================================================
       BUILD UI
       ========================================================= */

    function buildUI() {

        widget.body.innerHTML =

            '<div class="dxp-container">' +

                '<div class="dxp-header">' +
                    'Create Project From Template' +
                '</div>' +

                '<div class="dxp-section">' +

                    '<label class="dxp-label">' +
                        'Search Project Templates' +
                    '</label>' +

                    '<div class="dxp-search-row">' +

                        '<input ' +
                            'type="text" ' +
                            'id="templateSearch" ' +
                            'class="dxp-input" ' +
                            'placeholder="Enter template name..."' +
                        ' />' +

                        '<button ' +
                            'id="searchTemplateButton" ' +
                            'class="dxp-button dxp-search-button">' +
                            'Search' +
                        '</button>' +

                    '</div>' +

                '</div>' +


                '<div class="dxp-section">' +

                    '<label class="dxp-label">' +
                        'Project Template' +
                    '</label>' +

                    '<select ' +
                        'id="projectTemplate" ' +
                        'class="dxp-input">' +

                        '<option value="">' +
                            'Search for Project Templates first' +
                        '</option>' +

                    '</select>' +

                '</div>' +


                '<div class="dxp-section">' +

                    '<label class="dxp-label">' +
                        'Project Name' +
                    '</label>' +

                    '<input ' +
                        'type="text" ' +
                        'id="projectTitle" ' +
                        'class="dxp-input" ' +
                        'placeholder="Enter project name..."' +
                    ' />' +

                '</div>' +


                '<div class="dxp-section">' +

                    '<label class="dxp-label">' +
                        'Description' +
                    '</label>' +

                    '<textarea ' +
                        'id="projectDescription" ' +
                        'class="dxp-input dxp-textarea" ' +
                        'placeholder="Enter project description..."' +
                    '></textarea>' +

                '</div>' +


                '<div class="dxp-section dxp-action">' +

                    '<button ' +
                        'id="createProjectButton" ' +
                        'class="dxp-button dxp-create-button">' +
                        'Create Project' +
                    '</button>' +

                '</div>' +


                '<div ' +
                    'id="status" ' +
                    'class="dxp-status">' +
                    'Loading...' +
                '</div>' +

            '</div>';


        addStyles();

        setupEvents();

        console.log("UI created successfully");
    }


    /* =========================================================
       STYLES
       ========================================================= */

    function addStyles() {

        var style = document.createElement("style");

        style.innerHTML =

            '.dxp-container {' +
                'font-family: Arial, sans-serif;' +
                'padding: 20px;' +
                'max-width: 700px;' +
                'margin: 0 auto;' +
                'box-sizing: border-box;' +
            '}' +

            '.dxp-header {' +
                'font-size: 22px;' +
                'font-weight: bold;' +
                'color: #222;' +
                'margin-bottom: 25px;' +
                'padding-bottom: 12px;' +
                'border-bottom: 1px solid #ddd;' +
            '}' +

            '.dxp-section {' +
                'margin-bottom: 18px;' +
            '}' +

            '.dxp-label {' +
                'display: block;' +
                'font-weight: bold;' +
                'font-size: 14px;' +
                'margin-bottom: 7px;' +
                'color: #333;' +
            '}' +

            '.dxp-input {' +
                'width: 100%;' +
                'box-sizing: border-box;' +
                'padding: 10px 12px;' +
                'border: 1px solid #aaa;' +
                'border-radius: 4px;' +
                'font-size: 14px;' +
                'background: #fff;' +
            '}' +

            '.dxp-input:focus {' +
                'outline: none;' +
                'border-color: #368ec4;' +
                'box-shadow: 0 0 3px rgba(54,142,196,0.35);' +
            '}' +

            '.dxp-search-row {' +
                'display: flex;' +
                'gap: 8px;' +
            '}' +

            '.dxp-search-row .dxp-input {' +
                'flex: 1;' +
            '}' +

            '.dxp-search-button {' +
                'width: 100px;' +
            '}' +

            '.dxp-textarea {' +
                'height: 100px;' +
                'resize: vertical;' +
            '}' +

            '.dxp-button {' +
                'border: none;' +
                'border-radius: 4px;' +
                'padding: 10px 20px;' +
                'font-size: 14px;' +
                'cursor: pointer;' +
                'color: white;' +
                'background: #368ec4;' +
            '}' +

            '.dxp-button:hover {' +
                'background: #2879a9;' +
            '}' +

            '.dxp-button:disabled {' +
                'background: #aaa;' +
                'cursor: not-allowed;' +
            '}' +

            '.dxp-create-button {' +
                'background: #368ec4;' +
                'min-width: 160px;' +
            '}' +

            '.dxp-status {' +
                'margin-top: 15px;' +
                'padding: 10px;' +
                'font-size: 13px;' +
                'color: #555;' +
                'background: #f5f5f5;' +
                'border-radius: 4px;' +
            '}' +

            '.dxp-status.success {' +
                'color: #167c38;' +
                'background: #e8f5e9;' +
            '}' +

            '.dxp-status.error {' +
                'color: #b00020;' +
                'background: #ffebee;' +
            '}';

        document.head.appendChild(style);
    }


    /* =========================================================
       EVENTS
       ========================================================= */

    function setupEvents() {

        var searchButton =
            document.getElementById("searchTemplateButton");

        var createButton =
            document.getElementById("createProjectButton");

        var templateSelect =
            document.getElementById("projectTemplate");


        searchButton.addEventListener(
            "click",
            function () {

                searchProjectTemplates();

            }
        );


        createButton.addEventListener(
            "click",
            function () {

                createProjectFromTemplate();

            }
        );


        templateSelect.addEventListener(
            "change",
            function () {

                var index =
                    templateSelect.selectedIndex;

                if (index <= 0) {

                    selectedTemplate = null;

                    return;
                }

                selectedTemplate =
                    templateResults[index - 1];

                console.log(
                    "Selected Project Template:",
                    selectedTemplate
                );

            }
        );


        /*
         * Also allow ENTER in search field.
         */

        document
            .getElementById("templateSearch")
            .addEventListener(
                "keydown",
                function (event) {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        searchProjectTemplates();
                    }

                }
            );
    }


    /* =========================================================
       GET 3DSPACE URL
       ========================================================= */

    function get3DSpaceURL() {

        setStatus("Getting 3DSpace information...");

        /*
         * First try widget preferences.
         */

        try {

            if (widget && widget.getValue) {

                var preference =
                    widget.getValue("3DSpaceURL");

                if (preference) {

                    threeDSpaceURL =
                        String(preference).replace(/\/+$/, "");

                    console.log(
                        "3DSpace URL from preference:",
                        threeDSpaceURL
                    );

                    setStatus(
                        "Ready. Search for a Project Template."
                    );

                    return;
                }
            }

        } catch (e) {

            console.log(
                "3DSpaceURL preference not available."
            );
        }


        /*
         * Try current URL.
         */

        var currentURL =
            window.location.href;


        /*
         * Example:
         *
         * https://tenant-space.3dexperience.3ds.com/...
         *
         */

        var match =
            currentURL.match(
                /https?:\/\/[^/]+\.3dexperience\.3ds\.com/
            );


        if (match) {

            threeDSpaceURL =
                match[0];

            console.log(
                "3DSpace URL from current page:",
                threeDSpaceURL
            );

            setStatus(
                "Ready. Search for a Project Template."
            );

            return;
        }


        /*
         * If URL cannot be determined,
         * still keep the UI visible.
         */

        console.warn(
            "Could not automatically determine 3DSpace URL."
        );

        setStatus(
            "UI loaded. 3DSpace URL could not be detected."
        );
    }


    /* =========================================================
       SEARCH PROJECT TEMPLATES
       ========================================================= */

    function searchProjectTemplates() {

        if (!threeDSpaceURL) {

            setStatus(
                "3DSpace URL is not available.",
                true
            );

            return;
        }


        var searchText =
            document.getElementById(
                "templateSearch"
            ).value.trim();


        if (!searchText) {

            searchText = "PT";
        }


        setStatus(
            "Searching Project Templates..."
        );


        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projecttemplates/search" +
            "?searchStr=" +
            encodeURIComponent(searchText) +
            "&$top=100";


        console.log(
            "Template Search URL:",
            url
        );


        if (
            typeof WAFData === "undefined" ||
            !WAFData.authenticatedRequest
        ) {

            setStatus(
                "WAFData is not available.",
                true
            );

            console.error(
                "WAFData.authenticatedRequest is unavailable."
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

                onComplete:
                    function (response) {

                        console.log(
                            "Template Search Response:",
                            response
                        );


                        if (
                            !response ||
                            !response.data
                        ) {

                            setStatus(
                                "No template data returned.",
                                true
                            );

                            return;
                        }


                        /*
                         * Keep only Project Template.
                         */

                        templateResults =
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


                        /*
                         * Some platform versions
                         * may return slightly different
                         * type information.
                         *
                         * If strict filtering produces
                         * nothing, show all results
                         * for demo purposes.
                         */

                        if (
                            !templateResults.length
                        ) {

                            console.warn(
                                "No objects with type 'Project Template'."
                            );

                            templateResults =
                                response.data.filter(
                                    function (item) {

                                        return (
                                            item &&
                                            item.id
                                        );

                                    }
                                );
                        }


                        renderTemplateResults(
                            templateResults
                        );


                        if (
                            templateResults.length
                        ) {

                            setStatus(
                                templateResults.length +
                                " Project Template(s) found."
                            );

                        } else {

                            setStatus(
                                "No Project Templates found.",
                                true
                            );
                        }

                    },


                onFailure:
                    function (error) {

                        console.error(
                            "Template search failed:",
                            error
                        );

                        setStatus(
                            "Template search failed.",
                            true
                        );

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

            return;
        }


        select.innerHTML = "";


        var defaultOption =
            document.createElement("option");


        defaultOption.value = "";


        defaultOption.textContent =
            results.length
                ? "Select Project Template"
                : "No Project Templates Found";


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
                        item.id;

                }


                if (name && title) {

                    option.textContent =
                        name +
                        " - " +
                        title;

                } else {

                    option.textContent =
                        title ||
                        item.id;

                }


                select.appendChild(
                    option
                );

            }
        );


        selectedTemplate = null;
    }


    /* =========================================================
       CREATE PROJECT
       ========================================================= */

    function createProjectFromTemplate() {

        var templateSelect =
            document.getElementById(
                "projectTemplate"
            );


        var projectTitle =
            document.getElementById(
                "projectTitle"
            ).value.trim();


        var projectDescription =
            document.getElementById(
                "projectDescription"
            ).value.trim();


        if (!selectedTemplate) {

            var selectedIndex =
                templateSelect.selectedIndex;


            if (
                selectedIndex > 0 &&
                templateResults[selectedIndex - 1]
            ) {

                selectedTemplate =
                    templateResults[
                        selectedIndex - 1
                    ];

            }

        }


        if (!selectedTemplate) {

            setStatus(
                "Please select a Project Template.",
                true
            );

            return;
        }


        if (!projectTitle) {

            setStatus(
                "Please enter a Project Name.",
                true
            );

            return;
        }


        console.log(
            "======================================"
        );

        console.log(
            "CREATE PROJECT"
        );

        console.log(
            "======================================"
        );


        console.log(
            "Template:",
            selectedTemplate
        );


        console.log(
            "Project Name:",
            projectTitle
        );


        console.log(
            "Description:",
            projectDescription
        );


        /*
         * For the demo, get CSRF first.
         */

        getCSRFToken(
            function (error, token) {

                if (error) {

                    console.error(
                        "CSRF error:",
                        error
                    );

                    setStatus(
                        "Unable to obtain CSRF token.",
                        true
                    );

                    return;
                }


                createProject(
                    selectedTemplate,
                    projectTitle,
                    projectDescription,
                    token
                );

            }
        );
    }


    /* =========================================================
       GET CSRF TOKEN
       ========================================================= */

    function getCSRFToken(callback) {

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
                            "CSRF Response:",
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

                        } else {

                            callback(
                                new Error(
                                    "CSRF token not found."
                                )
                            );

                        }

                    },


                onFailure:
                    function (error) {

                        callback(error);

                    }

            }
        );
    }


    /* =========================================================
       CREATE PROJECT API
       ========================================================= */

    function createProject(
        template,
        title,
        description,
        csrfToken
    ) {

        /*
         * Template reference.
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
         * Include cestamp if supplied
         * by the template object.
         */

        if (template.cestamp) {

            templateReference.cestamp =
                template.cestamp;

        }


        /*
         * Project data.
         */

        var projectDataElements = {

            scheduleFrom:
                "Project Start Date",

            defaultConstraintType:
                "As Soon As Possible",

            currency:
                "Unassigned",

            title:
                title,

            description:
                description

        };


        /*
         * Request body.
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
            "FINAL CREATE PROJECT PAYLOAD:"
        );


        console.log(
            JSON.stringify(
                payload,
                null,
                2
            )
        );


        setStatus(
            "Creating project..."
        );


        var url =
            threeDSpaceURL +
            "/resources/v1/modeler/projects/fromTemplate";


        /*
         * SecurityContext.
         *
         * Do not force an invalid context.
         * Only send it if the widget provides one.
         */

        var securityContext =
            getSecurityContext();


        var headers = {

            "Accept":
                "application/json",

            "Content-Type":
                "application/json",

            "ENO_CSRF_TOKEN":
                csrfToken

        };


        if (securityContext) {

            headers["SecurityContext"] =
                securityContext;

        }


        console.log(
            "POST URL:",
            url
        );


        console.log(
            "HEADERS:",
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
                            "PROJECT CREATED:"
                        );

                        console.log(
                            response
                        );


                        setStatus(
                            "Project created successfully.",
                            false,
                            true
                        );

                    },

                onFailure:
                    function (error) {

                        console.error(
                            "PROJECT CREATION FAILED:"
                        );

                        console.error(
                            error
                        );


                        setStatus(
                            "Project creation failed. Check browser console for details.",
                            true
                        );

                    }

            }
        );
    }


    /* =========================================================
       SECURITY CONTEXT
       ========================================================= */

    function getSecurityContext() {

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

            console.log(
                "SecurityContext preference not available."
            );

        }


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
       STATUS
       ========================================================= */

    function setStatus(
        message,
        isError,
        isSuccess
    ) {

        var element =
            document.getElementById(
                "status"
            );


        if (!element) {

            return;
        }


        element.textContent =
            message;


        element.className =
            "dxp-status";


        if (isError) {

            element.className +=
                " error";

        }


        if (isSuccess) {

            element.className +=
                " success";

        }

    }


    /* =========================================================
       DEBUG HELPERS
       ========================================================= */

    window.searchProjectTemplates =
        searchProjectTemplates;


    window.createProjectFromTemplate =
        createProjectFromTemplate;


    /* =========================================================
       START
       ========================================================= */

    waitForWidget();

})();
