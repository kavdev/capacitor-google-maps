import { WebPlugin } from '@capacitor/core';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
export class CapacitorGoogleMapsWeb extends WebPlugin {
    constructor() {
        super(...arguments);
        this.gMapsRef = undefined;
        this.maps = {};
        this.currMarkerId = 0;
        this.onClusterClickHandler = (_, cluster, map) => {
            var _a, _b;
            const mapId = this.getIdFromMap(map);
            const items = [];
            if (cluster.markers != undefined) {
                for (const marker of cluster.markers) {
                    const markerId = this.getIdFromMarker(mapId, marker);
                    items.push({
                        markerId: markerId,
                        latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                        longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                        title: marker.getTitle(),
                        snippet: '',
                    });
                }
            }
            this.notifyListeners('onClusterClick', {
                mapId: mapId,
                latitude: cluster.position.lat(),
                longitude: cluster.position.lng(),
                size: cluster.count,
                items: items,
            });
        };
    }
    getIdFromMap(map) {
        for (const id in this.maps) {
            if (this.maps[id].map == map) {
                return id;
            }
        }
        return '';
    }
    getIdFromMarker(mapId, marker) {
        for (const id in this.maps[mapId].markers) {
            if (this.maps[mapId].markers[id] == marker) {
                return id;
            }
        }
        return '';
    }
    async importGoogleLib(apiKey) {
        if (this.gMapsRef === undefined) {
            const lib = await import('@googlemaps/js-api-loader');
            const loader = new lib.Loader({
                apiKey: apiKey !== null && apiKey !== void 0 ? apiKey : '',
                version: 'weekly',
                libraries: ['places'],
            });
            const google = await loader.load();
            this.gMapsRef = google.maps;
            console.log('Loaded google maps API');
        }
    }
    async setCamera(_args) {
        // Animation not supported yet...
        this.maps[_args.id].map.moveCamera({
            center: _args.config.coordinate,
            heading: _args.config.bearing,
            tilt: _args.config.angle,
            zoom: _args.config.zoom,
        });
    }
    async setMapType(_args) {
        this.maps[_args.id].map.setMapTypeId(_args.mapType);
    }
    async enableIndoorMaps(_args) {
        throw new Error('Method not supported on web.');
    }
    async enableTrafficLayer(_args) {
        var _a;
        const trafficLayer = (_a = this.maps[_args.id].trafficLayer) !== null && _a !== void 0 ? _a : new google.maps.TrafficLayer();
        if (_args.enabled) {
            trafficLayer.setMap(this.maps[_args.id].map);
            this.maps[_args.id].trafficLayer = trafficLayer;
        }
        else if (this.maps[_args.id].trafficLayer) {
            trafficLayer.setMap(null);
            this.maps[_args.id].trafficLayer = undefined;
        }
    }
    async enableAccessibilityElements(_args) {
        throw new Error('Method not supported on web.');
    }
    dispatchMapEvent(_args) {
        throw new Error('Method not supported on web.');
    }
    async enableCurrentLocation(_args) {
        if (_args.enabled) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    this.maps[_args.id].map.setCenter(pos);
                    this.notifyListeners('onMyLocationButtonClick', {});
                    this.notifyListeners('onMyLocationClick', {});
                }, () => {
                    throw new Error('Geolocation not supported on web browser.');
                });
            }
            else {
                throw new Error('Geolocation not supported on web browser.');
            }
        }
    }
    async setPadding(_args) {
        const bounds = this.maps[_args.id].map.getBounds();
        if (bounds !== undefined) {
            this.maps[_args.id].map.fitBounds(bounds, _args.padding);
        }
    }
    async getMapBounds(_args) {
        const bounds = this.maps[_args.id].map.getBounds();
        if (!bounds) {
            throw new Error('Google Map Bounds could not be found.');
        }
        return {
            southwest: {
                lat: bounds.getSouthWest().lat(),
                lng: bounds.getSouthWest().lng(),
            },
            center: {
                lat: bounds.getCenter().lat(),
                lng: bounds.getCenter().lng(),
            },
            northeast: {
                lat: bounds.getNorthEast().lat(),
                lng: bounds.getNorthEast().lng(),
            },
        };
    }
    async addMarkers(_args) {
        const markerIds = [];
        const map = this.maps[_args.id];
        for (const markerArgs of _args.markers) {
            const markerOpts = this.buildMarkerOpts(markerArgs, map.map);
            const marker = new google.maps.Marker(markerOpts);
            const id = '' + this.currMarkerId;
            map.markers[id] = marker;
            this.setMarkerListeners(_args.id, id, marker);
            markerIds.push(id);
            this.currMarkerId++;
        }
        return { ids: markerIds };
    }
    async addMarker(_args) {
        const markerOpts = this.buildMarkerOpts(_args.marker, this.maps[_args.id].map);
        const marker = new google.maps.Marker(markerOpts);
        const id = '' + this.currMarkerId;
        this.maps[_args.id].markers[id] = marker;
        this.setMarkerListeners(_args.id, id, marker);
        this.currMarkerId++;
        return { id: id };
    }
    async removeMarkers(_args) {
        const map = this.maps[_args.id];
        for (const id of _args.markerIds) {
            map.markers[id].setMap(null);
            delete map.markers[id];
        }
    }
    async removeMarker(_args) {
        this.maps[_args.id].markers[_args.markerId].setMap(null);
        delete this.maps[_args.id].markers[_args.markerId];
    }
    async enableClustering(_args) {
        const markers = [];
        for (const id in this.maps[_args.id].markers) {
            markers.push(this.maps[_args.id].markers[id]);
        }
        this.maps[_args.id].markerClusterer = new MarkerClusterer({
            map: this.maps[_args.id].map,
            markers: markers,
            onClusterClick: this.onClusterClickHandler,
        });
    }
    async disableClustering(_args) {
        var _a;
        (_a = this.maps[_args.id].markerClusterer) === null || _a === void 0 ? void 0 : _a.setMap(null);
        this.maps[_args.id].markerClusterer = undefined;
    }
    async onScroll(_args) {
        throw new Error('Method not supported on web.');
    }
    async create(_args) {
        console.log(`Create map: ${_args.id}`);
        await this.importGoogleLib(_args.apiKey);
        this.maps[_args.id] = {
            map: new window.google.maps.Map(_args.element, Object.assign({}, _args.config)),
            element: _args.element,
            markers: {},
        };
        this.setMapListeners(_args.id);
    }
    async destroy(_args) {
        console.log(`Destroy map: ${_args.id}`);
        const mapItem = this.maps[_args.id];
        mapItem.element.innerHTML = '';
        mapItem.map.unbindAll();
        delete this.maps[_args.id];
    }
    async setMarkerListeners(mapId, markerId, marker) {
        marker.addListener('click', () => {
            var _a, _b;
            this.notifyListeners('onMarkerClick', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
        marker.addListener('dragstart', () => {
            var _a, _b;
            this.notifyListeners('onMarkerDragStart', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
        marker.addListener('drag', () => {
            var _a, _b;
            this.notifyListeners('onMarkerDrag', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
        marker.addListener('dragend', () => {
            var _a, _b;
            this.notifyListeners('onMarkerDragEnd', {
                mapId: mapId,
                markerId: markerId,
                latitude: (_a = marker.getPosition()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = marker.getPosition()) === null || _b === void 0 ? void 0 : _b.lng(),
                title: marker.getTitle(),
                snippet: '',
            });
        });
    }
    async setMapListeners(mapId) {
        const map = this.maps[mapId].map;
        map.addListener('idle', async () => {
            var _a, _b;
            const bounds = await this.getMapBounds({ id: mapId });
            this.notifyListeners('onCameraIdle', {
                mapId: mapId,
                bearing: map.getHeading(),
                bounds: bounds,
                latitude: (_a = map.getCenter()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = map.getCenter()) === null || _b === void 0 ? void 0 : _b.lng(),
                tilt: map.getTilt(),
                zoom: map.getZoom(),
            });
        });
        map.addListener('center_changed', () => {
            this.notifyListeners('onCameraMoveStarted', {
                mapId: mapId,
                isGesture: true,
            });
        });
        map.addListener('bounds_changed', async () => {
            var _a, _b;
            const bounds = await this.getMapBounds({ id: mapId });
            this.notifyListeners('onBoundsChanged', {
                mapId: mapId,
                bearing: map.getHeading(),
                bounds: bounds,
                latitude: (_a = map.getCenter()) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = map.getCenter()) === null || _b === void 0 ? void 0 : _b.lng(),
                tilt: map.getTilt(),
                zoom: map.getZoom(),
            });
        });
        map.addListener('click', (e) => {
            var _a, _b;
            this.notifyListeners('onMapClick', {
                mapId: mapId,
                latitude: (_a = e.latLng) === null || _a === void 0 ? void 0 : _a.lat(),
                longitude: (_b = e.latLng) === null || _b === void 0 ? void 0 : _b.lng(),
            });
        });
        this.notifyListeners('onMapReady', {
            mapId: mapId,
        });
    }
    buildMarkerOpts(marker, map) {
        let iconImage = undefined;
        if (marker.iconUrl) {
            iconImage = {
                url: marker.iconUrl,
                scaledSize: marker.iconSize
                    ? new google.maps.Size(marker.iconSize.width, marker.iconSize.height)
                    : null,
                anchor: marker.iconAnchor
                    ? new google.maps.Point(marker.iconAnchor.x, marker.iconAnchor.y)
                    : new google.maps.Point(0, 0),
                origin: marker.iconOrigin
                    ? new google.maps.Point(marker.iconOrigin.x, marker.iconOrigin.y)
                    : new google.maps.Point(0, 0),
            };
        }
        const opts = {
            position: marker.coordinate,
            map: map,
            opacity: marker.opacity,
            title: marker.title,
            icon: iconImage,
            draggable: marker.draggable,
        };
        return opts;
    }
}
//# sourceMappingURL=web.js.map