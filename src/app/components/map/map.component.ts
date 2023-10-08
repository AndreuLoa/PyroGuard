//Angular Imports
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';

//ArcGis Imports
import Map from "@arcgis/core/Map";
import MapView from '@arcgis/core/views/MapView';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import esriConfig from '@arcgis/core/config.js';

esriConfig.assetsPath = "/assets/";
esriConfig.apiKey = "AAPKcb316cbceb904bcabe2c351f094757dcALC9Q9-1SGUX-p3epTjwPM2kbUkb_hfV4nvUjWsV3OwxFdvi30rSOlRwiIyuLM1W";

//Custom Imports
import { FireDataService } from 'src/app/fire-data.service';
import { FireData } from 'src/app/models/fire-data';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  @ViewChild('mapViewNode', { static: true })
  private mapViewEl!: ElementRef;
  private map!: Map;
  private view!: MapView;
  private graphicsLayer!: GraphicsLayer;


  constructor(
    private fireDataService: FireDataService,
  ) {
  }

  async initializeMap(): Promise<MapView> {
    const container = this.mapViewEl.nativeElement;
    const windLayer = new FeatureLayer({
      title: "Wind Layer",
      url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_direction_v1/FeatureServer"
    })

    this.map = new Map({
      basemap: "arcgis-imagery",
      layers: [windLayer]
    });

    this.view = new MapView({
      map: this.map,
      container: container,
      center: [-63.15816823333734, -17.76918441888411], // Longitude, latitude
      zoom: 5,
    });

    this.graphicsLayer = new GraphicsLayer();
    this.map.add(this.graphicsLayer);
    return await this.view.when();
  }

  ngOnInit() {
    try {
      this.initializeMap().then();

      this.fireDataService.getFireData().subscribe((fireDataList: FireData[]) => {
        fireDataList.forEach(element => {
          this.createPoint(element);
        });
      });

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

  private createPoint(fireData: FireData) {
    const point: Point = new Point({
      longitude: fireData.longitude,
      latitude: fireData.latitude
    })

    const simpleMarkerSymbol = new SimpleMarkerSymbol({
      color: [226, 119, 40],
      outline: {
        color: [255, 255, 255],
        width: 1
      }
    });

    const popupTemplate = {
      title: "{Name}",
      content: "{Description}"
    }
      console.log(fireData.confidence);
      
    let confidence = ''
    if (fireData.confidence == 'l') {
      confidence = 'Low';
    } else if (fireData.confidence == 'n') {
      confidence = 'Medium';
    } else if (fireData.confidence == 'h') {
      confidence = 'High';
    }

    const attributes = {
      Name: "Wildfire Detected",
      Description: "<table><tr><td>Date: </td><td>" + fireData.acq_date + "</td></tr><tr><td>Time: </td><td>" + fireData.acq_time + "</td></tr><tr><td>Latitude: </td><td>" + fireData.latitude + "</td></tr><tr><td>Longitude: </td><td>" + fireData.longitude + "</td></tr><tr><td>Confidence level: </td><td>" + confidence + "</td></tr><tr><td>Fire Intensity: </td><td>" + fireData.frp + "</td></tr></table>"
    }

    const pointGraphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol,
      popupTemplate: popupTemplate,
      attributes: attributes
    });

    this.graphicsLayer.add(pointGraphic);
  }
}
