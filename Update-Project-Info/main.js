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


            require([
                "DS/WAFData/WAFData",
                "DS/i3DXCompassServices/i3DXCompassServices"

            ], function (WAFData, CompassServices) {


                window.WAFData = WAFData;


                CompassServices.getPlatformServices({

                    platformId:
                        widget.getValue("x3dPlatformId"),


                    onComplete:function(services){


                        console.log(
                            "Services:",
                            services
                        );


                        spaceUrl =
                            services["3DSpace"];


                        getCSRF();


                    },


                    onFailure:function(err){

                        console.log(err);

                        alert(
                            "Failed to get platform services"
                        );

                    }


                });


            });


        });

    }


    waitForWidget();


})();
