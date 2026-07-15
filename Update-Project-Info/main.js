var projectData = [];

var selectedProjectId = null;
var selectedProjectCestamp = null;

var spaceUrl = null;
var csrfToken = null;


(function () {

    function waitForWidget() {

        if (typeof widget === "undefined") {

            console.log("Waiting for widget object...");

            setTimeout(waitForWidget, 500);

            return;
        }


        console.log("Widget object found");


        widget.addEvent("onLoad", function () {


            console.log("Project Editor Loaded");


            widget.body.innerHTML =
                "<h3>Loading Projects...</h3>";


            require(
                [
                    "DS/WAFData/WAFData",
                    "DS/i3DXCompassServices/i3DXCompassServices"
                ],
                function (
                    WAFData,
                    CompassServices
                ) {


                    window.WAFData = WAFData;


                    CompassServices.getPlatformServices({

                        platformId:
                            widget.getValue("x3dPlatformId"),


                        onComplete: function (services) {


                            console.log(
                                "Services:",
                                services
                            );


                            spaceUrl =
                                services["3DSpace"];


                            console.log(
                                "3DSpace URL:",
                                spaceUrl
                            );


                            getCSRF();


                        },


                        onFailure: function (error) {


                            console.log(error);


                            alert(
                                "Failed to get platform services"
                            );


                        }

                    });


                }
            );


        });


    }


    waitForWidget();


})();



/* ===========================
   GET CSRF TOKEN
=========================== */


function getCSRF() {


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


            onComplete: function(response) {


                console.log(
                    "CSRF Response:",
                    response
                );


                csrfToken =
                    response.csrf.value;


                console.log(
                    "CSRF Token:",
                    csrfToken
                );


                loadProjects();


            },


            onFailure: function(error) {


                console.log(error);


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


    var projectUrl =
        spaceUrl +
        "/resources/v1/modeler/projects";


    console.log(
        "Loading Projects:",
        projectUrl
    );


    WAFData.authenticatedRequest(

        projectUrl,

        {

            method: "GET",

            type: "json",


            headers: {

                "Accept":
                    "application/json"

            },


            onComplete: function(response) {


                console.log(
                    "Projects Response:",
                    response
                );


                projectData =
                    response.data || [];


                buildUI();


            },


            onFailure: function(error) {


                console.log(error);


                alert(
                    "Failed to load projects"
                );


            }


        }

    );


}




/* ===========================
   BUILD UI
=========================== */


function buildUI() {


    widget.body.innerHTML =

        '<div class="card">' +

            '<h3>Project Editor</h3>' +

        '</div>' +


        '<select id="projectList">' +

            '<option>Loading...</option>' +

        '</select>' +


        '<br><br>' +


        '<div class="field">' +

            '<div class="label">Title</div>' +

            '<input id="title">' +

        '</div>' +


        '<div class="field">' +

            '<div class="label">Description</div>' +

            '<textarea id="description"></textarea>' +

        '</div>' +


        '<br>' +


        '<button id="btnUpdate">' +

            'Update Project' +

        '</button>';



    document
        .getElementById("projectList")
        .onchange = showProject;



    document
        .getElementById("btnUpdate")
        .onclick = updateProject;



    populateProjects();


}





/* ===========================
   POPULATE PROJECT LIST
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
            project.id;


        ddl.appendChild(option);


    }



    if (projectData.length > 0) {


        ddl.selectedIndex = 0;


        showProject();


    }


}





/* ===========================
   SHOW SELECTED PROJECT
=========================== */


function showProject() {


    var index =
        document.getElementById(
            "projectList"
        ).value;



    var project =
        projectData[index];



    if (!project)
        return;



    selectedProjectId =
        project.id;



    selectedProjectCestamp =
        project.cestamp;



    console.log(
        "Selected Project:",
        selectedProjectId
    );


    document.getElementById(
        "title"
    ).value =

        project.dataelements.title || "";



    document.getElementById(
        "description"
    ).value =

        project.dataelements.description || "";


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
                        document.getElementById(
                            "title"
                        ).value,


                    description:
                        document.getElementById(
                            "description"
                        ).value

                }

            }

        ]

    };



    var updateUrl =

        spaceUrl +

        "/resources/v1/modeler/projects/" +

        selectedProjectId;



    console.log(
        "UPDATE URL:",
        updateUrl
    );


    console.log(
        "PAYLOAD:",
        JSON.stringify(
            payload,
            null,
            2
        )
    );



    WAFData.authenticatedRequest(

        updateUrl,

        {


            method:
                "PUT",


            type:
                "json",



            headers: {


                "ENO_CSRF_TOKEN":
                    csrfToken,


                "Content-Type":
                    "application/json",


                "Accept":
                    "application/json"


            },



            data:
                JSON.stringify(
                    payload
                ),



            onComplete:function(response){


                console.log(
                    "UPDATE SUCCESS:",
                    response
                );


                alert(
                    "Project Updated Successfully"
                );


                loadProjects();


            },



            onFailure:function(error){


                console.log(
                    "UPDATE FAILED:",
                    error
                );


                alert(
                    "Update Failed. Check console."
                );


            }


        }

    );


}
