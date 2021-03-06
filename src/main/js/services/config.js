'use strict';

angular.module('app')

    .factory('ConfigData', ['$http', '$q', 'APP_CONFIG', 'Notifications', function ($http, $q, APP_CONFIG, Notifications) {
        var listeners = [], factory = {}, currentShipments = [], allShipmentPkgIds = [], offlineMode = false,
            auth = make_base_auth(APP_CONFIG.EDC_USERNAME, APP_CONFIG.EDC_PASSWORD);

        function make_base_auth(user, password) {
            var tok = user + ':' + password;
            var hash = btoa(tok);
            return "Basic " + hash;
        }
        
        factory.addListener = function (listener) {
            listeners.push(listener);
        };

        factory.getDesc = function(pkgId) {
            for (var i = 0; i < currentShipments.length; i++) {
                if (currentShipments[i].pkgId == pkgId) {
                    return (currentShipments[i].name ? currentShipments[i].name : currentShipments[i].pkgId);
                }
            }
        };

        factory.removeAllListeners = function () {
            listeners = [];
        };
        factory.removeListener = function (listener) {
            listeners = listeners.filter(function (l) {
                return (l != listener);
            });
        };

        factory.getCurrentShipments = function () {
            return currentShipments;
        };

        factory.getAllShipmentPkgIds = function () {
            return allShipmentPkgIds;
        };

        factory.removeShipment = function(shipment, onSuccess, onFail) {
            // set config
            var tmpShipments = currentShipments.filter(function(shipObj) {
                return (shipment.pkgId != shipObj.pkgId);
            });

            persistShipments(tmpShipments, function (newShipments) {

                currentShipments = newShipments;
                listeners.forEach(function (listener) {
                    listener(null);
                });
                onSuccess(currentShipments);
            }, function (errMsg) {
                onFail(errMsg);
            });
        };

        factory.addShipment = function(shipment, onSuccess, onFail) {
            // set config
            var tmpShipments = currentShipments.concat(shipment);

            persistShipments(tmpShipments, function (newShipments) {

                currentShipments = newShipments;
                listeners.forEach(function (listener) {
                    listener(null);
                });
                onSuccess(currentShipments);

            }, function (errMsg) {
                onFail(errMsg);
            });
        };

        factory.saveShipments = function() {
            persistShipments(currentShipments, function(newShipments) {

            }, function(errMsg) {

            });

        };

        var persistShipments = function(shipments, onSuccess, onFail) {
            if (offlineMode) {
                onSuccess(shipments);
                return;
            }

            $http({
                method: 'PUT',
                url: APP_CONFIG.JDG_REST_ENDPOINT + '/rhiot/sensorConfig',
                data: JSON.stringify(shipments)
            }).then(function successCallback(response) {
                onSuccess(shipments);
            }, function errorCallback(response) {
                onFail(response.statusText);
            });

        };

        factory.reset = function () {


            allShipmentPkgIds = [];
            currentShipments = [];
            
            function offlineMode() {
                offlineMode = true;
                currentShipments = [
                    {
                        pkgId: "Precious Cargo Package ID",
                        name: "Precious Cargo",
                        fromAddress: 'San Francisco International Airport',
                        toAddress: 'Hilton San Francisco Union Square',
                        eta: (new Date().getTime() + (Math.random() * 144 * 60 * 60 * 1000)),
                        randomData: true
                    },
                    {
                        pkgId: "KK Ship",
                        name: "Red Hat KK",
                        fromAddress: 'Tokyo Narita International Airport',
                        toAddress: 'Osaka, Japan',
                        eta: (new Date().getTime() + (Math.random() * 144 * 60 * 60 * 1000)),
                        randomData: true
                    }
                ];
            }

            // get config
	offlineMode();
                listeners.forEach(function (listener) {
                        listener(null);
                    });


        };

        factory.reset();

        return factory;
    }]);
