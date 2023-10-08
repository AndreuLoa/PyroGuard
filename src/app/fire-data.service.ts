import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FireData } from './models/fire-data';

@Injectable({
  providedIn: 'root'
})
export class FireDataService {

  constructor(private http: HttpClient) { }

  getFireData(): Observable<FireData[]> {
    const url = 'https://firms.modaps.eosdis.nasa.gov/api/country/csv/5e4ca1e6eb1dde84754fb3544cd384ab/VIIRS_NOAA20_NRT/BOL/1/2023-10-07';
  
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((response: string) => this.csvToJSON(response))
    );
  }

  private csvToJSON(csv: string): FireData[] {
    const lines = csv.split('\n');
    const result: FireData[] = [];
    
    const headers = lines[0].split(',');
  
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
      const obj: FireData = {
        latitude: Number(currentLine[1]),
        longitude: Number(currentLine[2]),
        confidence: currentLine[10], 
        frp: Number(currentLine[13]), 
      };
  
      result.push(obj);
    }
  
    return result;
  }
}
