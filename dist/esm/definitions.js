export var MapType;
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
})(MapType || (MapType = {}));
//# sourceMappingURL=definitions.js.map