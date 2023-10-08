//Angular Imports
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Renderer2
} from '@angular/core';

//ArcGis Imports
import Map from "@arcgis/core/Map";
import MapView from '@arcgis/core/views/MapView';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import ImageryLayer from '@arcgis/core/layers/ImageryLayer';
import LayerList from '@arcgis/core/widgets/LayerList';
import esriConfig from '@arcgis/core/config.js';

//ArcGis Config
esriConfig.assetsPath = "/assets/";
esriConfig.apiKey = "AAPKcb316cbceb904bcabe2c351f094757dcALC9Q9-1SGUX-p3epTjwPM2kbUkb_hfV4nvUjWsV3OwxFdvi30rSOlRwiIyuLM1W";

//Custom Imports
import { FireDataService } from '../../services/fire-data.service';
import { FireData } from '../../models/fire-data';
import { PollutionDataService } from '../../services/pollution-data.service';
import { PollutionData, PollutionLevels } from '../../models/pollution-data';

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
    private renderer: Renderer2,
    private fireDataService: FireDataService,
    private pollutionDataService: PollutionDataService
  ) {
  }

  async initializeMap(): Promise<MapView> {
    const container = this.mapViewEl.nativeElement;
    const windLayer = new FeatureLayer({
      title: "Wind Layer",
      url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NOAA_METAR_current_wind_speed_direction_v1/FeatureServer"
    });
    const waterLayer = new ImageryLayer({
      title: "Water Layer",
      url: "https://landscape6.arcgis.com/arcgis/rest/services/World_Distance_to_Surface_Water/ImageServer"
    })

    // Create a query to fetch data from the feature layer
    const query = windLayer.createQuery();
    // Replace with the actual field names you want to extract
    query.outFields = ['LATITUDE', 'LONGITUDE', 'WIND_DIRECT', 'WIND_SPEED']; 

    // Execute the query and fetch the data
    windLayer.queryFeatures(query).then((result) => {
      const features = result.features;
      
      // Extract the desired attributes from each feature
      const extractedData = features.map((feature) => {
        const attributes = feature.attributes;
        return {
          "latitude": attributes.LATITUDE,
          "longitude": attributes.LONGITUDE,
          "windDirection": attributes.WIND_DIRECT,
          "windSpeed": attributes.WIND_SPEED
        };
      });

      // Process the extracted data as needed
      console.log(extractedData);
    });

    this.map = new Map({
      basemap: "arcgis-imagery",
      layers: [windLayer, waterLayer]
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
    this.pollutionDataService.getPollutionData(fireData.latitude,fireData.longitude).subscribe(
      data => {
        let pollutionData: PollutionData = data;
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
          Description: "<table><tr><td>Date: </td><td>" + fireData.acq_date + 
          "</td></tr><tr><td>Time: </td><td>" + fireData.acq_time + 
          "</td></tr><tr><td>Latitude: </td><td>" + fireData.latitude + 
          "</td></tr><tr><td>Longitude: </td><td>" + fireData.longitude + 
          "</td></tr><tr><td>Confidence level: </td><td>" + confidence + 
          "</td></tr><tr><td>CO Emissions: </td><td>" + pollutionData.co + "μg/m3" +
          "</td></tr><tr><td>NO Emissions: </td><td>" + pollutionData.no + "μg/m3" +
          "</td></tr><tr><td>NO<sub>2</sub> Emissions: </td><td>" + pollutionData.no2 + "μg/m3" +
          "</td></tr><tr><td>PM<sub>2.5</sub> Emissions: </td><td>" + pollutionData.pm2_5 + "μg/m3" +
          "</td></tr><tr><td>PM<sub>10</sub> Emissions: </td><td>" + pollutionData.pm10 + "μg/m3" +
          "</td></tr><tr><td>O<sub>3</sub> Emissions: </td><td>" + pollutionData.o3 + "μg/m3" +
          "</td></tr></table>"
        }
    
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: simpleMarkerSymbol,
          popupTemplate: popupTemplate,
          attributes: attributes
        });
    
        this.graphicsLayer.add(pointGraphic);
      }
    );
  }
}
