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
                    '<div class="dxp-header">Create Project From Template</div>' +
                    '<div class="dxp-form">' +

                        '<div class="dxp-field">' +
                            '<label>Project Template</label>' +
                            '<div class="dxp-search-row">' +
                                '<input id="templateSearch" placeholder="Enter template name..." autocomplete="off">' +
                                '<button id="searchTemplateBtn" class="dxp-search-button">Search</button>' +
                            '</div>' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Select Template</label>' +
                            '<select id="projectTemplate">' +
                                '<option value="">Search for a template first</option>' +
                            '</select>' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Project Name</label>' +
                            '<input id="projectName" placeholder="Enter project name">' +
                        '</div>' +

                        '<div class="dxp-field">' +
                            '<label>Description</label>' +
                            '<input id="projectDescription" placeholder="Enter description">' +
                        '</div>' +

                        '<div class="dxp-actions">' +
                            '<button id="createBtn" class="dxp-create-button">Create Project</button>' +
                        '</div>' +

                        '<div id="result"></div>' +
                    '</div>' +
                '</div>';

            document.getElementById("searchTemplateBtn").onclick =
                searchTemplateButtonClicked;

            document.getElementById("createBtn").onclick =
                createProjectFromTemplate;

            document.getElementById("projectTemplate").onchange =
                templateSelectionChanged;

            initialize();
        });
    }

    waitForWidget();
})();


/* GLOBAL VARIABLES */

var projectSpaceUrl = null;
var csrfToken = null;


/* INITIALIZE */

function initialize() {
    console.log("Initializing widget...");

    require([
        "DS/WAFData/WAFData",
        "DS/i3DXCompassServices/i3DXCompassServices"
    ], function (WAFData, CompassServices) {
        console.log("Modules Loaded");

        CompassServices.getPlatformServices({
            platformId: widget.getValue("x3dPlatformId"),

            onComplete: function (services) {
                console.log("Services Received");
                console.log(services);

                projectSpaceUrl = services["3DSpace"];

                console.log("3DSpace URL:", projectSpaceUrl);

                getCSRFToken(WAFData, projectSpaceUrl);
            },

            onFailure: function (error) {
                console.log("SERVICE DISCOVERY FAILED");
                console.log(error);
                showError("Unable to get 3DSpace service.");
            }
        });
    });
}


/* GET CSRF TOKEN */

function getCSRFToken(WAFData, spaceUrl) {
    console.log("Getting CSRF token...");

    var csrfUrl = spaceUrl + "/resources/v1/application/CSRF";

    WAFData.authenticatedRequest(csrfUrl, {
        method: "GET",
        type: "json",

        onComplete: function (response) {
            console.log("CSRF SUCCESS");
            console.log(response);

            if (response && response.csrf && response.csrf.value) {
                csrfToken = response.csrf.value;
                console.log("CSRF Token received");
            } else {
                showError("CSRF token was not returned.");
            }
        },

        onFailure: function (error) {
            console.log("CSRF FAILED");
            console.log(error);
            showError("CSRF request failed.");
        }
    });
}


/* SEARCH BUTTON */

function searchTemplateButtonClicked() {
    var searchText =
        document.getElementById("templateSearch").value.trim();

    console.log("Searching Template:", searchText);

    if (searchText.length < 2) {
        showError("Enter at least 2 characters to search.");
        return;
    }

    if (!projectSpaceUrl) {
        showError("3DSpace URL is not available.");
        return;
    }

    var select = document.getElementById("projectTemplate");
    select.innerHTML =
        '<option value="">Searching templates...</option>';

    var searchButton =
        document.getElementById("searchTemplateBtn");

    searchButton.disabled = true;
    searchButton.innerHTML = "Searching...";

    require(["DS/WAFData/WAFData"], function (WAFData) {
        searchProjectTemplates(
            WAFData,
            projectSpaceUrl,
            searchText
        );
    });
}


/* SEARCH PROJECT TEMPLATES */

function searchProjectTemplates(WAFData, spaceUrl, searchText) {
    console.log("Searching project templates...");

    var templateUrl =
        spaceUrl +
        "/resources/v1/modeler/projecttemplates/search" +
        "?searchStr=" +
        encodeURIComponent(searchText) +
        "&$top=100";

    console.log("Template Search URL:", templateUrl);

    showInfo("Searching templates...");

    WAFData.authenticatedRequest(templateUrl, {
        method: "GET",
        type: "json",

        headers: {
            "Accept": "application/json"
        },

        onComplete: function (response) {
            console.log("TEMPLATE SEARCH SUCCESS");
            console.log(response);

            resetSearchButton();
            populateTemplates(response);
        },

        onFailure: function (error) {
            console.log("TEMPLATE SEARCH FAILED");
            console.log(error);

            resetSearchButton();

            document.getElementById("projectTemplate").innerHTML =
                '<option value="">Search failed</option>';

            showError("Template search failed.");
        }
    });
}


/* RESET SEARCH BUTTON */

function resetSearchButton() {
    var button =
        document.getElementById("searchTemplateBtn");

    if (!button) return;

    button.disabled = false;
    button.innerHTML = "Search";
}


/* POPULATE TEMPLATE LIST */

function populateTemplates(response) {
    var select =
        document.getElementById("projectTemplate");

    select.innerHTML =
        '<option value="">Select Project Template</option>';

    if (!response || !response.data || response.data.length === 0) {
        select.innerHTML =
            '<option value="">No templates found</option>';

        showError("No project templates found.");
        return;
    }

    console.log("ALL SEARCH RESULTS:");
    console.log(
        "SELECTED/ALL TEMPLATE DATA:",
        JSON.stringify(response.data, null, 2)
    );

    /*
     * Only show:
     * Type  = Project Template
     * State = Release
     */
    var projectTemplates = response.data.filter(function (template) {
        var type = template.type;
        var state =
            template.dataelements &&
            template.dataelements.state;

        var title =
            template.dataelements &&
            template.dataelements.title;

        console.log(
            "Template:",
            template.id,
            "| Type:",
            type,
            "| State:",
            state,
            "| Title:",
            title
        );

        return type === "Project Template" && state === "Release";
    });

    console.log("RELEASE PROJECT TEMPLATES:");
    console.log(projectTemplates);

    if (projectTemplates.length === 0) {
        select.innerHTML =
            '<option value="">No released templates found</option>';

        showError("No released project templates found.");
        return;
    }

    projectTemplates.forEach(function (template) {
        var option = document.createElement("option");

        option.value = template.id;

        var title =
            template.dataelements &&
            template.dataelements.title
                ? template.dataelements.title
                : template.dataelements &&
                  template.dataelements.name
                    ? template.dataelements.name
                    : template.id;

        option.text = title;
        option.templateObject = template;

        select.appendChild(option);
    });

    console.log(
        "Released Project Templates loaded:",
        projectTemplates.length
    );

    showInfo(
        projectTemplates.length +
        " released project template" +
        (projectTemplates.length === 1 ? "" : "s") +
        " found. Please select a template."
    );
}


/* TEMPLATE SELECTION */

function templateSelectionChanged() {
    var select =
        document.getElementById("projectTemplate");

    if (!select.value) return;

    var option =
        select.options[select.selectedIndex];

    var template =
        option.templateObject;

    if (!template) return;

    var title =
        template.dataelements &&
        template.dataelements.title
            ? template.dataelements.title
            : template.id;

    console.log("Template selected:", title);

    showInfo("Template selected: " + title);
}


/* CREATE PROJECT */

function createProjectFromTemplate() {
    console.log("Create Project From Template clicked");

    var templateId =
        document.getElementById("projectTemplate").value;

    var projectName =
        document.getElementById("projectName").value.trim();

    var description =
        document.getElementById("projectDescription").value.trim();

    if (!templateId) {
        showError("Please select a project template.");
        return;
    }

    if (!projectName) {
        showError("Please enter project name.");
        return;
    }

    if (!projectSpaceUrl) {
        showError("3DSpace URL is not available.");
        return;
    }

    if (!csrfToken) {
        showError("CSRF token is not available.");
        return;
    }

    var createButton =
        document.getElementById("createBtn");

    createButton.disabled = true;
    createButton.innerHTML = "Creating...";

    showInfo("Creating project...");

    require(["DS/WAFData/WAFData"], function (WAFData) {
        createProjectRequest(
            WAFData,
            projectSpaceUrl,
            csrfToken,
            templateId,
            projectName,
            description
        );
    });
}


/* CREATE PROJECT REQUEST */

function createProjectRequest(
    WAFData,
    spaceUrl,
    csrfToken,
    templateId,
    projectName,
    description
) {
    var select =
        document.getElementById("projectTemplate");

    var selectedOption =
        select.options[select.selectedIndex];

    var template =
        selectedOption.templateObject;

    console.log("=================================");
    console.log("SELECTED TEMPLATE OBJECT");
    console.log(template);
    console.log("=================================");

    if (!template) {
        resetCreateButton();
        showError(
            "Selected template information is not available."
        );
        return;
    }

    var templateReference = {
        id: template.id,
        type: template.type,
        identifier: template.id,
        source: spaceUrl,
        relativePath:
            "/resources/v1/modeler/projecttemplates/" +
            template.id,
        cestamp: template.cestamp
    };

    console.log("PROJECT TEMPLATE REFERENCE:");
    console.log(
        JSON.stringify(templateReference, null, 2)
    );

    var payload = {
        data: [{
            type: "Project Space",

            dataelements: {
                constraintDate: "",
                scheduleFrom: "Project Start Date",
                defaultConstraintType: "As Soon As Possible",
                currency: "Unassigned",
                title: projectName,
                description: description
            },

            relateddata: {
                projectTemplate: [
                    templateReference
                ]
            }
        }]
    };

    console.log("=================================");
    console.log("CREATE PROJECT FROM TEMPLATE");
    console.log("Template ID:", template.id);
    console.log("Template Type:", template.type);
    console.log("Template State:",
        template.dataelements &&
        template.dataelements.state
    );
    console.log("Template Cestamp:", template.cestamp);
    console.log("Payload:");
    console.log(JSON.stringify(payload, null, 2));
    console.log("=================================");

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects/fromTemplate";

    console.log("POST URL:", projectUrl);

    WAFData.authenticatedRequest(projectUrl, {
        method: "POST",
        type: "json",

        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "ENO_CSRF_TOKEN": csrfToken
        },

        data: JSON.stringify(payload),

        onComplete: function (response) {
            console.log("=================================");
            console.log("PROJECT CREATED FROM TEMPLATE");
            console.log(response);
            console.log("=================================");

            resetCreateButton();

            showSuccess(
                "Project Created Successfully From Template"
            );
        },

        onFailure: function (error) {
            console.log("=================================");
            console.log("PROJECT CREATION FAILED");
            console.log(error);
            console.log("=================================");

            resetCreateButton();

            showError(
                "PROJECT CREATION FAILED: " +
                (
                    error && error.message
                        ? error.message
                        : "400 Bad Request"
                )
            );
        }
    });
}


/* RESET CREATE BUTTON */

function resetCreateButton() {
    var button =
        document.getElementById("createBtn");

    if (!button) return;

    button.disabled = false;
    button.innerHTML = "Create Project";
}


/* SUCCESS */

function showSuccess(message) {
    var result =
        document.getElementById("result");

    if (!result) return;

    result.className = "success";
    result.innerHTML = message;
}


/* ERROR */

function showError(message) {
    var result =
        document.getElementById("result");

    if (!result) return;

    result.className = "error";
    result.innerHTML = message;
}


/* INFO */

function showInfo(message) {
    var result =
        document.getElementById("result");

    if (!result) return;

    result.className = "info";
    result.innerHTML = message;
}
