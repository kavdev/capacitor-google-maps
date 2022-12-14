var capacitorCapacitorGoogleMaps = (function (exports, core, markerclusterer) {
    'use strict';

    exports.MapType = void 0;
    (function (MapType) {
        /**
         * Basic map.
         */
        MapType["Normal"] = "Normal";
        /**
         * Satellite imagery with roads and labels.
         */
        MapType["Hybrid"] = "Hybrid";
        /**
         * Satellite imagery with no labels.
         */
        MapType["Satellite"] = "Satellite";
        /**
         * Topographic data.
         */
        MapType["Terrain"] = "Terrain";
        /**
         * No base map tiles.
         */
        MapType["None"] = "None";
    })(exports.MapType || (exports.MapType = {}));

    const CapacitorGoogleMaps = core.registerPlugin('CapacitorGoogleMaps', {
        web: () => Promise.resolve().then(function () { return web; }).then(m => new m.CapacitorGoogleMapsWeb()),
    });
    CapacitorGoogleMaps.addListener('isMapInFocus', data => {
        var _a;
        const x = data.x;
        const y = data.y;
        const elem = document.elementFromPoint(x, y);
        const internalId = (_a = elem === null || elem === void 0 ? void 0 : elem.dataset) === null || _a === void 0 ? void 0 : _a.internalId;
        const mapInFocus = internalId === data.mapId;
        CapacitorGoogleMaps.dispatchMapEvent({ id: data.mapId, focus: mapInFocus });
    });

    class MapCustomElement extends HTMLElement {
        constructor() {
            super();
        }
        connectedCallback() {
            if (core.Capacitor.getPlatform() == 'ios') {
                this.style.overflow = 'scroll';
                this.style['-webkit-overflow-scrolling'] = 'touch';
                const overflowDiv = document.createElement('div');
                overflowDiv.style.height = '200%';
                this.appendChild(overflowDiv);
            }
        }
    }
    customElements.define('capacitor-google-map', MapCustomElement);
    class GoogleMap {
        constructor(id) {
            this.element = null;
            this.handleScrollEvent = () => this.updateMapBounds();
            this.id = id;
        }
        /**
         * Creates a new instance of a Google Map
         * @param options
         * @param callback
         * @returns GoogleMap
         */
        static async create(options, callback) {
            const newMap = new GoogleMap(options.id);
            if (!options.element) {
                throw new Error('container element is required');
            }
            if (options.config.androidLiteMode === undefined) {
                options.config.androidLiteMode = false;
            }
            newMap.element = options.element;
            newMap.element.dataset.internalId = options.id;
            const elementBounds = await GoogleMap.getElementBounds(options.element);
            options.config.width = elementBounds.width;
            options.config.height = elementBounds.height;
            options.config.x = elementBounds.x;
            options.config.y = elementBounds.y;
            options.config.devicePixelRatio = window.devicePixelRatio;
            if (core.Capacitor.getPlatform() == 'android') {
                newMap.initScrolling();
            }
            if (core.Capacitor.isNativePlatform()) {
                options.element = {};
            }
            await CapacitorGoogleMaps.create(options);
            if (callback) {
                const onMapReadyListener = await CapacitorGoogleMaps.addListener('onMapReady', (data) => {
                    if (data.mapId == newMap.id) {
                        callback(data);
                        onMapReadyListener.remove();
                    }
                });
            }
            return newMap;
        }
        static async getElementBounds(element) {
            return new Promise(resolve => {
                let elementBounds = element.getBoundingClientRect();
                if (elementBounds.width == 0) {
                    let retries = 0;
                    const boundsInterval = setInterval(function () {
                        if (elementBounds.width == 0 && retries < 30) {
                            elementBounds = element.getBoundingClientRect();
                            retries++;
                        }
                        else {
                            if (retries == 30) {
                                console.warn('Map size could not be determined');
                            }
                            clearInterval(boundsInterval);
                            resolve(elementBounds);
                        }
                    }, 100);
                }
                else {
                    resolve(elementBounds);
                }
            });
        }
        /**
         * Enable marker clustering
         *
         * @returns void
         */
        async enableClustering() {
            return CapacitorGoogleMaps.enableClustering({
                id: this.id,
            });
        }
        /**
         * Disable marker clustering
         *
         * @returns void
         */
        async disableClustering() {
            return CapacitorGoogleMaps.disableClustering({
                id: this.id,
            });
        }
        /**
         * Adds a marker to the map
         *
         * @param marker
         * @returns created marker id
         */
        async addMarker(marker) {
            const res = await CapacitorGoogleMaps.addMarker({
                id: this.id,
                marker,
            });
            return res.id;
        }
        /**
         * Adds multiple markers to the map
         *
         * @param markers
         * @returns array of created marker IDs
         */
        async addMarkers(markers) {
            const res = await CapacitorGoogleMaps.addMarkers({
                id: this.id,
                markers,
            });
            return res.ids;
        }
        /**
         * Remove marker from the map
         *
         * @param id id of the marker to remove from the map
         * @returns
         */
        async removeMarker(id) {
            return CapacitorGoogleMaps.removeMarker({
                id: this.id,
                markerId: id,
            });
        }
        /**
         * Remove markers from the map
         *
         * @param ids array of ids to remove from the map
         * @returns
         */
        async removeMarkers(ids) {
            return CapacitorGoogleMaps.removeMarkers({
                id: this.id,
                markerIds: ids,
            });
        }
        /**
         * Destroy the current instance of the map
         */
        async destroy() {
            if (core.Capacitor.getPlatform() == 'android') {
                this.disableScrolling();
            }
            this.removeAllMapListeners();
            return CapacitorGoogleMaps.destroy({
                id: this.id,
            });
        }
        /**
         * Update the map camera configuration
         *
         * @param config
         * @returns
         */
        async setCamera(config) {
            return CapacitorGoogleMaps.setCamera({
                id: this.id,
                config,
            });
        }
        /**
         * Sets the type of map tiles that should be displayed.
         *
         * @param mapType
         * @returns
         */
        async setMapType(mapType) {
            return CapacitorGoogleMaps.setMapType({
                id: this.id,
                mapType,
            });
        }
        /**
         * Sets whether indoor maps are shown, where available.
         *
         * @param enabled
         * @returns
         */
        async enableIndoorMaps(enabled) {
            return CapacitorGoogleMaps.enableIndoorMaps({
                id: this.id,
                enabled,
            });
        }
        /**
         * Controls whether the map is drawing traffic data, if available.
         *
         * @param enabled
         * @returns
         */
        async enableTrafficLayer(enabled) {
            return CapacitorGoogleMaps.enableTrafficLayer({
                id: this.id,
                enabled,
            });
        }
        /**
         * Show accessibility elements for overlay objects, such as Marker and Polyline.
         *
         * Only available on iOS.
         *
         * @param enabled
         * @returns
         */
        async enableAccessibilityElements(enabled) {
            return CapacitorGoogleMaps.enableAccessibilityElements({
                id: this.id,
                enabled,
            });
        }
        /**
         * Set whether the My Location dot and accuracy circle is enabled.
         *
         * @param enabled
         * @returns
         */
        async enableCurrentLocation(enabled) {
            return CapacitorGoogleMaps.enableCurrentLocation({
                id: this.id,
                enabled,
            });
        }
        /**
         * Set padding on the 'visible' region of the view.
         *
         * @param padding
         * @returns
         */
        async setPadding(padding) {
            return CapacitorGoogleMaps.setPadding({
                id: this.id,
                padding,
            });
        }
        /**
         * Get the map's current viewport latitude and longitude bounds.
         *
         * @returns {LatLngBounds}
         */
        async getMapBounds() {
            return CapacitorGoogleMaps.getMapBounds({
                id: this.id,
            });
        }
        initScrolling() {
            const ionContents = document.getElementsByTagName('ion-content');
            // eslint-disable-next-line @typescript-eslint/prefer-for-of
            for (let i = 0; i < ionContents.length; i++) {
                ionContents[i].scrollEvents = true;
            }
            window.addEventListener('ionScroll', this.handleScrollEvent);
            window.addEventListener('scroll', this.handleScrollEvent);
            window.addEventListener('resize', this.handleScrollEvent);
            if (screen.orientation) {
                screen.orientation.addEventListener('change', () => {
                    setTimeout(this.updateMapBounds, 500);
                });
            }
            else {
                window.addEventListener('orientationchange', () => {
                    setTimeout(this.updateMapBounds, 500);
                });
            }
        }
        disableScrolling() {
            window.removeEventListener('ionScroll', this.handleScrollEvent);
            window.removeEventListener('scroll', this.handleScrollEvent);
            window.removeEventListener('resize', this.handleScrollEvent);
            if (screen.orientation) {
                screen.orientation.removeEventListener('change', () => {
                    setTimeout(this.updateMapBounds, 1000);
                });
            }
            else {
                window.removeEventListener('orientationchange', () => {
                    setTimeout(this.updateMapBounds, 1000);
                });
            }
        }
        updateMapBounds() {
            if (this.element) {
                const mapRect = this.element.getBoundingClientRect();
                CapacitorGoogleMaps.onScroll({
                    id: this.id,
                    mapBounds: {
                        x: mapRect.x,
                        y: mapRect.y,
                        width: mapRect.width,
                        height: mapRect.height,
                    },
                });
            }
        }
        /*
        private findContainerElement(): HTMLElement | null {
          if (!this.element) {
            return null;
          }
      
          let parentElement = this.element.parentElement;
          while (parentElement !== null) {
            if (window.getComputedStyle(parentElement).overflowY !== 'hidden') {
              return parentElement;
            }
      
            parentElement = parentElement.parentElement;
          }
      
          return null;
        }
        */
        /**
         * Set the event listener on the map for 'onCameraIdle' events.
         *
         * @param callback
         * @returns
         */
        async setOnCameraIdleListener(callback) {
            if (this.onCameraIdleListener) {
                this.onCameraIdleListener.remove();
            }
            if (callback) {
                this.onCameraIdleListener = await CapacitorGoogleMaps.addListener('onCameraIdle', this.generateCallback(callback));
            }
            else {
                this.onCameraIdleListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onBoundsChanged' events.
         *
         * @param callback
         * @returns
         */
        async setOnBoundsChangedListener(callback) {
            if (this.onBoundsChangedListener) {
                this.onBoundsChangedListener.remove();
            }
            if (callback) {
                this.onBoundsChangedListener = await CapacitorGoogleMaps.addListener('onBoundsChanged', this.generateCallback(callback));
            }
            else {
                this.onBoundsChangedListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onCameraMoveStarted' events.
         *
         * @param callback
         * @returns
         */
        async setOnCameraMoveStartedListener(callback) {
            if (this.onCameraMoveStartedListener) {
                this.onCameraMoveStartedListener.remove();
            }
            if (callback) {
                this.onCameraMoveStartedListener = await CapacitorGoogleMaps.addListener('onCameraMoveStarted', this.generateCallback(callback));
            }
            else {
                this.onCameraMoveStartedListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onClusterClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnClusterClickListener(callback) {
            if (this.onClusterClickListener) {
                this.onClusterClickListener.remove();
            }
            if (callback) {
                this.onClusterClickListener = await CapacitorGoogleMaps.addListener('onClusterClick', this.generateCallback(callback));
            }
            else {
                this.onClusterClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onClusterInfoWindowClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnClusterInfoWindowClickListener(callback) {
            if (this.onClusterInfoWindowClickListener) {
                this.onClusterInfoWindowClickListener.remove();
            }
            if (callback) {
                this.onClusterInfoWindowClickListener =
                    await CapacitorGoogleMaps.addListener('onClusterInfoWindowClick', this.generateCallback(callback));
            }
            else {
                this.onClusterInfoWindowClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onInfoWindowClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnInfoWindowClickListener(callback) {
            if (this.onInfoWindowClickListener) {
                this.onInfoWindowClickListener.remove();
            }
            if (callback) {
                this.onInfoWindowClickListener = await CapacitorGoogleMaps.addListener('onInfoWindowClick', this.generateCallback(callback));
            }
            else {
                this.onInfoWindowClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMapClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMapClickListener(callback) {
            if (this.onMapClickListener) {
                this.onMapClickListener.remove();
            }
            if (callback) {
                this.onMapClickListener = await CapacitorGoogleMaps.addListener('onMapClick', this.generateCallback(callback));
            }
            else {
                this.onMapClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerClickListener(callback) {
            if (this.onMarkerClickListener) {
                this.onMarkerClickListener.remove();
            }
            if (callback) {
                this.onMarkerClickListener = await CapacitorGoogleMaps.addListener('onMarkerClick', this.generateCallback(callback));
            }
            else {
                this.onMarkerClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerDragStart' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerDragStartListener(callback) {
            if (this.onMarkerDragStartListener) {
                this.onMarkerDragStartListener.remove();
            }
            if (callback) {
                this.onMarkerDragStartListener = await CapacitorGoogleMaps.addListener('onMarkerDragStart', this.generateCallback(callback));
            }
            else {
                this.onMarkerDragStartListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerDrag' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerDragListener(callback) {
            if (this.onMarkerDragListener) {
                this.onMarkerDragListener.remove();
            }
            if (callback) {
                this.onMarkerDragListener = await CapacitorGoogleMaps.addListener('onMarkerDrag', this.generateCallback(callback));
            }
            else {
                this.onMarkerDragListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMarkerDragEnd' events.
         *
         * @param callback
         * @returns
         */
        async setOnMarkerDragEndListener(callback) {
            if (this.onMarkerDragEndListener) {
                this.onMarkerDragEndListener.remove();
            }
            if (callback) {
                this.onMarkerDragEndListener = await CapacitorGoogleMaps.addListener('onMarkerDragEnd', this.generateCallback(callback));
            }
            else {
                this.onMarkerDragEndListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMyLocationButtonClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMyLocationButtonClickListener(callback) {
            if (this.onMyLocationButtonClickListener) {
                this.onMyLocationButtonClickListener.remove();
            }
            if (callback) {
                this.onMyLocationButtonClickListener =
                    await CapacitorGoogleMaps.addListener('onMyLocationButtonClick', this.generateCallback(callback));
            }
            else {
                this.onMyLocationButtonClickListener = undefined;
            }
        }
        /**
         * Set the event listener on the map for 'onMyLocationClick' events.
         *
         * @param callback
         * @returns
         */
        async setOnMyLocationClickListener(callback) {
            if (this.onMyLocationClickListener) {
                this.onMyLocationClickListener.remove();
            }
            if (callback) {
                this.onMyLocationClickListener = await CapacitorGoogleMaps.addListener('onMyLocationClick', this.generateCallback(callback));
            }
            else {
                this.onMyLocationClickListener = undefined;
            }
        }
        /**
         * Remove all event listeners on the map.
         *
         * @param callback
         * @returns
         */
        async removeAllMapListeners() {
            if (this.onBoundsChangedListener) {
                this.onBoundsChangedListener.remove();
                this.onBoundsChangedListener = undefined;
            }
            if (this.onCameraIdleListener) {
                this.onCameraIdleListener.remove();
                this.onCameraIdleListener = undefined;
            }
            if (this.onCameraMoveStartedListener) {
                this.onCameraMoveStartedListener.remove();
                this.onCameraMoveStartedListener = undefined;
            }
            if (this.onClusterClickListener) {
                this.onClusterClickListener.remove();
                this.onClusterClickListener = undefined;
            }
            if (this.onClusterInfoWindowClickListener) {
                this.onClusterInfoWindowClickListener.remove();
                this.onClusterInfoWindowClickListener = undefined;
            }
            if (this.onInfoWindowClickListener) {
                this.onInfoWindowClickListener.remove();
                this.onInfoWindowClickListener = undefined;
            }
            if (this.onMapClickListener) {
                this.onMapClickListener.remove();
                this.onMapClickListener = undefined;
            }
            if (this.onMarkerClickListener) {
                this.onMarkerClickListener.remove();
                this.onMarkerClickListener = undefined;
            }
            if (this.onMyLocationButtonClickListener) {
                this.onMyLocationButtonClickListener.remove();
                this.onMyLocationButtonClickListener = undefined;
            }
            if (this.onMyLocationClickListener) {
                this.onMyLocationClickListener.remove();
                this.onMyLocationClickListener = undefined;
            }
        }
        generateCallback(callback) {
            const mapId = this.id;
            return (data) => {
                if (data.mapId == mapId) {
                    callback(data);
                }
            };
        }
    }

    class CapacitorGoogleMapsWeb extends core.WebPlugin {
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
            this.maps[_args.id].markerClusterer = new markerclusterer.MarkerClusterer({
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

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CapacitorGoogleMapsWeb: CapacitorGoogleMapsWeb
    });

    exports.GoogleMap = GoogleMap;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, capacitorExports, markerclusterer);
//# sourceMappingURL=plugin.js.map
