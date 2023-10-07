import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';

import Map from "@arcgis/core/Map";
import MapView from '@arcgis/core/views/MapView';

import esriConfig from '@arcgis/core/config.js';
esriConfig.assetsPath = "/assets/";
esriConfig.apiKey = "AAPKcb316cbceb904bcabe2c351f094757dcALC9Q9-1SGUX-p3epTjwPM2kbUkb_hfV4nvUjWsV3OwxFdvi30rSOlRwiIyuLM1W";

import { Point } from '../../models/Point';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  @ViewChild('mapViewNode', { static: true })
  private mapViewEl!: ElementRef;

  private view!: MapView;
  private map!: Map;
  private points: Point[] = [];


  async initializeMap(): Promise<MapView> {
    const container = this.mapViewEl.nativeElement;

    this.map = new Map({
      basemap: "arcgis-terrain"
    });

    this.view = new MapView({
      map: this.map,
      container: container,
      center: [-63.15816823333734, -17.76918441888411], // Longitude, latitude
      zoom: 13,
    });

    return await this.view.when();
  }

  ngOnInit() {
    try {
      this.initializeMap().then();
    } catch (error) {
      console.error(error);
    }
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.map.destroy();
      this.view.destroy();
    }
  }

  //function to add a point to the map
}
