/// <reference types="google.maps" />
import { WebPlugin } from '@capacitor/core';
import type { LatLngBounds } from './definitions';
import type { AccElementsArgs, AddMarkerArgs, CameraArgs, AddMarkersArgs, CapacitorGoogleMapsPlugin, CreateMapArgs, CurrentLocArgs, DestroyMapArgs, IndoorMapArgs, MapTypeArgs, PaddingArgs, RemoveMarkerArgs, TrafficLayerArgs, RemoveMarkersArgs, OnScrollArgs } from './implementation';
export declare class CapacitorGoogleMapsWeb extends WebPlugin implements CapacitorGoogleMapsPlugin {
    private gMapsRef;
    private maps;
    private currMarkerId;
    private onClusterClickHandler;
    private getIdFromMap;
    private getIdFromMarker;
    private importGoogleLib;
    setCamera(_args: CameraArgs): Promise<void>;
    setMapType(_args: MapTypeArgs): Promise<void>;
    enableIndoorMaps(_args: IndoorMapArgs): Promise<void>;
    enableTrafficLayer(_args: TrafficLayerArgs): Promise<void>;
    enableAccessibilityElements(_args: AccElementsArgs): Promise<void>;
    dispatchMapEvent(_args: {
        id: string;
    }): Promise<void>;
    enableCurrentLocation(_args: CurrentLocArgs): Promise<void>;
    setPadding(_args: PaddingArgs): Promise<void>;
    getMapBounds(_args: {
        id: string;
    }): Promise<LatLngBounds>;
    addMarkers(_args: AddMarkersArgs): Promise<{
        ids: string[];
    }>;
    addMarker(_args: AddMarkerArgs): Promise<{
        id: string;
    }>;
    removeMarkers(_args: RemoveMarkersArgs): Promise<void>;
    removeMarker(_args: RemoveMarkerArgs): Promise<void>;
    enableClustering(_args: {
        id: string;
    }): Promise<void>;
    disableClustering(_args: {
        id: string;
    }): Promise<void>;
    onScroll(_args: OnScrollArgs): Promise<void>;
    create(_args: CreateMapArgs): Promise<void>;
    destroy(_args: DestroyMapArgs): Promise<void>;
    setMarkerListeners(mapId: string, markerId: string, marker: google.maps.Marker): Promise<void>;
    setMapListeners(mapId: string): Promise<void>;
    private buildMarkerOpts;
}
