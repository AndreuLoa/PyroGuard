import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild
} from '@angular/core';

import Map from "@arcgis/core/Map";
import MapView from '@arcgis/core/views/MapView';
import Bookmarks from '@arcgis/core/widgets/Bookmarks';
import Expand from '@arcgis/core/widgets/Expand';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Sketch from '@arcgis/core/widgets/Sketch';

import esriConfig from '@arcgis/core/config.js';
import { FireDataService } from 'src/app/fire-data.service';
import { FireData } from 'src/app/models/fire-data';
esriConfig.assetsPath = "/assets/";
esriConfig.apiKey = "AAPKcb316cbceb904bcabe2c351f094757dcALC9Q9-1SGUX-p3epTjwPM2kbUkb_hfV4nvUjWsV3OwxFdvi30rSOlRwiIyuLM1W";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {

  public view!: MapView;
  public fireDataList!: FireData[];

  @ViewChild('mapViewNode', { static: true })
  private mapViewEl!: ElementRef;

  constructor(private fireDataService: FireDataService) { }

  async initializeMap(): Promise<MapView> {
    const container = this.mapViewEl.nativeElement;

    const map = new Map({
      basemap: "arcgis-terrain"
    });

    const view = new MapView({
      map: map,
      container: container,
      center: [-63.15816823333734, -17.76918441888411], // Longitude, latitude
      zoom: 13,
    });

    // Add sketch widget
    const graphicsLayerSketch = new GraphicsLayer();
    map.add(graphicsLayerSketch);

    const sketch = new Sketch({
      layer: graphicsLayerSketch,
      view: view,
      creationMode: "update" // Auto-select
    });

    sketch.visibleElements = {
      selectionTools: {
        "lasso-selection": false
      },
      createTools: {
        point: false,
        circle: false,
      },
      undoRedoMenu: false,
      settingsMenu: false
    }

    view.ui.add(sketch, "top-right");

    const bookmarks = new Bookmarks({
      view: view,
      editingEnabled: true,
    });

    const bkExpand = new Expand({
      view: view,
      content: bookmarks,
      expanded: false,
    });

    view.ui.add(bkExpand, 'top-right');

    this.view = view;
    return await this.view.when();
  }

  ngOnInit() {
    try {
      this.initializeMap().then();

      this.fireDataService.getFireData().subscribe((data: FireData[]) => {
        console.log(data);
      });
      
    } catch (error) {
      console.error(error);
    }
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.destroy();
    }
  }
}
