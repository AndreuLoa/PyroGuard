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
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import LayerList from '@arcgis/core/widgets/LayerList';
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
    // const windLayer = new FeatureLayer({
    //   title: "Wind Layer",
    //   url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_direction_v1/FeatureServer"
    // });
    const waterLayer = new ImageryLayer({
      title: "Water Layer",
      url: "https://landscape6.arcgis.com/arcgis/rest/services/World_Distance_to_Surface_Water/ImageServer"
    })

    const meteoToken = "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2IjoxLCJ1c2VyIjoidXBzYV90ZXN0X3Rlc3QiLCJpc3MiOiJsb2dpbi5tZXRlb21hdGljcy5jb20iLCJleHAiOjE2OTY3NTQ4NTAsInN1YiI6ImFjY2VzcyJ9.d3e_1_VplF5Lp5WVMMG43OqwsYNDcCyqGWrDA9046dbYIgS-ZadclSIwObOqZUP2F11AKsQtx5kw7TfkQZsCyg";
    const windDirLayer = new VectorTileLayer({
      title: "Wind direction Layer",
      url: "https://api.meteomatics.com/mvt/barbs/wind_speed_100hPa:kn/style.json",
      customParameters: { access_token: meteoToken, datetime: "now", color: "true" }
    });

    const weatherLayer = new VectorTileLayer({
      title: "Weather Layer",
      url: "https://api.meteomatics.com/mvt/symbols/weather_symbol_1h:idx/style.json",
      customParameters: { access_token: meteoToken, datetime: "now" }
    });

    // // Create a query to fetch data from the feature layer
    // const query = windLayer.createQuery();
    // // Replace with the actual field names you want to extract
    // query.outFields = ['LATITUDE', 'LONGITUDE', 'WIND_DIRECT', 'WIND_SPEED'];

    // // Execute the query and fetch the data
    // windLayer.queryFeatures(query).then((result) => {
    //   const features = result.features;

    //   // Extract the desired attributes from each feature
    //   const extractedData = features.map((feature) => {
    //     const attributes = feature.attributes;
    //     return {
    //       "latitude": attributes.LATITUDE,
    //       "longitude": attributes.LONGITUDE,
    //       "windDirection": attributes.WIND_DIRECT,
    //       "windSpeed": attributes.WIND_SPEED
    //     };
    //   });

    //   // Process the extracted data as needed
    //   console.log(extractedData);
    // });

    this.map = new Map({
      basemap: "arcgis-imagery",
      layers: [waterLayer, weatherLayer, windDirLayer]
    });

    this.view = new MapView({
      map: this.map,
      container: container,
      center: [-63.15816823333734, -17.76918441888411], // Longitude, latitude
      zoom: 5,
    });

    const layerList = new LayerList({
      view: this.view
    });
    this.view.ui.add(layerList, "top-right");

    this.graphicsLayer = new GraphicsLayer({
      title: "Fire suceptibility",
    });
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
