var projectData = [];

(function () {

    function waitForWidget() {

        if (typeof widget === "undefined") {
            console.log("Waiting for widget object...");
            setTimeout(waitForWidget, 500);
            return;
        }

        console.log("Widget object found");

        widget.addEvent("onLoad", function () {

            console.log("Project Browser Loaded");

            widget.body.innerHTML =
                '<h3>Projects</h3>' +

                '<select id="projectList">' +
                '<option>Loading...</option>' +
                '</select>' +

                '<hr>' +

                '<div class="field">' +
                '<span class="label">Title:</span> ' +
                '<span id="title"></span>' +
                '</div>' +

                '<div class="field">' +
                '<span class="label">Name:</span> ' +
                '<span id="name"></span>' +
                '</div>' +

                '<div class="field">' +
                '<span class="label">Description:</span> ' +
                '<span id="description"></span>' +
                '</div>' +

                '<div class="field">' +
                '<span class="label">State:</span> ' +
                '<span id="state"></span>' +
                '</div>';

            loadProjects();

        });
    }

    waitForWidget();

})();

function loadProjects() {

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
                    widget.getValue("x3dPlatformId"),

                onComplete: function (services) {

                    var spaceUrl =
                        services["3DSpace"];

                    getProjects(
                        WAFData,
                        spaceUrl
                    );

                },

                onFailure: function (error) {

                    console.log(error);

                    alert("Service Discovery Failed");

                }
            });

        }
    );

}

function getProjects(
    WAFData,
    spaceUrl
) {

    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects";

    WAFData.authenticatedRequest(
        projectUrl,
        {
            method: "GET",

            type: "json",

            headers: {
                "Accept": "application/json"
            },

            onComplete: function (response) {

                console.log(response);

                projectData =
                    response.data || [];

                populateProjects();

            },

            onFailure: function (error) {

                console.log(error);

                alert("Failed to load projects");

            }

        }
    );

}

function populateProjects() {

    var ddl =
        document.getElementById(
            "projectList"
        );

    ddl.innerHTML = "";

    for (
        var i = 0;
        i < projectData.length;
        i++
    ) {

        var project =
            projectData[i];

        var option =
            document.createElement(
                "option"
            );

        option.value = i;

        option.text =
            project.dataelements.title ||
            project.dataelements.name ||
            ("Project " + i);

        ddl.appendChild(option);

    }

    ddl.onchange =
        showProject;

    if (projectData.length > 0) {

        ddl.selectedIndex = 0;

        showProject();

    }

}

function showProject() {

    var index =
        document.getElementById(
            "projectList"
        ).value;

    var project =
        projectData[index];

    if (!project)
        return;

    document.getElementById(
        "title"
    ).innerHTML =
        project.dataelements.title || "";

    document.getElementById(
        "name"
    ).innerHTML =
        project.dataelements.name || "";

    document.getElementById(
        "description"
    ).innerHTML =
        project.dataelements.description || "";

    document.getElementById(
        "state"
    ).innerHTML =
        project.dataelements.state || "";

    widget.setTitle(
        project.dataelements.title || "Project Browser"
    );

}
