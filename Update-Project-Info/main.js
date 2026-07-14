```javascript
var projectData = [];
var selectedProjectId = null;
var selectedProjectCestamp = null;
var spaceUrl = null;
var csrfToken = null;


widget.addEvent("onLoad", function () {

    widget.body.innerHTML =
        "<h3>Loading Projects...</h3>";

    require([
        "DS/WAFData/WAFData",
        "DS/i3DXCompassServices/i3DXCompassServices"
    ], function (WAFData, CompassServices) {

        window.WAFData = WAFData;

        CompassServices.getPlatformServices({

            platformId:
                widget.getValue("x3dPlatformId"),

            onComplete: function (services) {

                console.log("Services:", services);

                spaceUrl =
                    services["3DSpace"];

                console.log(
                    "3DSpace URL:",
                    spaceUrl
                );

                getCSRF();
            },

            onFailure: function (err) {

                console.log(err);

                alert(
                    "Failed to get platform services"
                );
            }
        });

    });

});


/* ===========================
   CSRF
=========================== */

function getCSRF() {

    var csrfUrl =
        spaceUrl +
        "/resources/v1/application/CSRF";


    WAFData.authenticatedRequest(
        csrfUrl,
        {

            method: "GET",
            type: "json",

            onComplete: function (res) {

                console.log(
                    "CSRF Response:",
                    res
                );

                csrfToken =
                    res.csrf.value;

                loadProjects();
            },

            onFailure: function (err) {

                console.log(err);

                alert(
                    "Failed to get CSRF token"
                );
            }
        }
    );
}



/* ===========================
   LOAD PROJECTS
=========================== */

function loadProjects() {

    var url =
        spaceUrl +
        "/resources/v1/modeler/projects";


    WAFData.authenticatedRequest(
        url,
        {

            method: "GET",

            type: "json",

            headers: {

                "Accept":
                    "application/json"
            },


            onComplete: function (res) {

                console.log(
                    "Projects Response:",
                    res
                );

                projectData =
                    res.data || [];

                buildUI();
            },


            onFailure: function (err) {

                console.log(err);

                alert(
                    "Failed to load projects"
                );
            }
        }
    );
}



/* ===========================
   UI
=========================== */

function buildUI() {

    widget.body.innerHTML =

        "<div class='project-container'>" +

        "<h3>Project Editor</h3>" +

        "<select id='projectList'></select>" +

        "<br/><br/>" +

        "<b>Title</b><br/>" +
        "<input id='title' />" +

        "<br/><br/>" +

        "<b>Description</b><br/>" +
        "<textarea id='description'></textarea>" +

        "<br/><br/>" +

        "<button id='btnUpdate'>" +
        "Update Project" +
        "</button>" +

        "</div>";


    document
        .getElementById("projectList")
        .onchange = showProject;


    document
        .getElementById("btnUpdate")
        .onclick = updateProject;


    populateProjects();
}



/* ===========================
   DROPDOWN
=========================== */

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

        var p =
            projectData[i];


        var option =
            document.createElement(
                "option"
            );


        option.value = i;


        option.text =
            p.dataelements.title ||
            p.dataelements.name ||
            p.id;


        ddl.appendChild(option);
    }


    if (projectData.length > 0) {

        ddl.selectedIndex = 0;

        showProject();
    }
}



/* ===========================
   SHOW PROJECT
=========================== */

function showProject() {

    var index =
        document.getElementById(
            "projectList"
        ).value;


    var p =
        projectData[index];


    if (!p)
        return;


    selectedProjectId =
        p.id;


    selectedProjectCestamp =
        p.cestamp;


    document.getElementById(
        "title"
    ).value =
        p.dataelements.title || "";


    document.getElementById(
        "description"
    ).value =
        p.dataelements.description || "";
}



/* ===========================
   UPDATE PROJECT
=========================== */

function updateProject() {


    if (!selectedProjectId) {

        alert(
            "Please select a project"
        );

        return;
    }


    var payload = {

        data: [

            {

                id:
                    selectedProjectId,


                type:
                    "Project Space",


                cestamp:
                    selectedProjectCestamp,


                dataelements: {

                    title:
                        document
                        .getElementById("title")
                        .value,


                    description:
                        document
                        .getElementById("description")
                        .value
                }
            }
        ]
    };


    var updateUrl =
        spaceUrl +
        "/resources/v1/modeler/projects/" +
        selectedProjectId;



    WAFData.authenticatedRequest(
        updateUrl,
        {

            method: "PUT",

            type: "json",


            headers: {

                "ENO_CSRF_TOKEN":
                    csrfToken,


                "Content-Type":
                    "application/json",


                "Accept":
                    "application/json"
            },


            data:
                JSON.stringify(payload),



            onComplete: function (res) {


                console.log(
                    "UPDATE SUCCESS:",
                    res
                );


                alert(
                    "Project Updated Successfully"
                );


                loadProjects();
            },


            onFailure: function (err) {


                console.log(
                    "UPDATE FAILED:",
                    err
                );


                alert(
                    "Update Failed. Check browser console."
                );
            }
        }
    );
}
```
