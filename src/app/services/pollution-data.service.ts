import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PollutionData, PollutionLevels } from '../models/pollution-data';

@Injectable({
  providedIn: 'root'
})
export class PollutionDataService {
  private url = 'http://api.openweathermap.org/data/2.5/air_pollution?';
  private key = '&appid=9cf293ca7917a47cb21c47652dd944d5';
  public bufferSim: PollutionData[] = []; 
  public maxCalls: number = 15;
  public bufferCalls: number = 0;
  
  constructor(
    private http: HttpClient, 
    ) { }

  getPollutionData(latitude: number, longitude: number): Observable<PollutionData>{
    if (this.bufferCalls <= this.maxCalls){
      return this.getOneData(latitude, longitude).pipe(
        map(data => {
          this.bufferSim.push(data);
          this.bufferCalls++;
          return data;
        })
      );
    }
    else{
      const randomNumber = Math.floor(Math.random() * this.bufferSim.length);
      return new Observable<PollutionData>(observer => {
        observer.next(this.bufferSim[randomNumber]);
        observer.complete();
      });
    }
  }
  
  private getOneData(latitude: number, longitude: number): Observable<PollutionData> {
    const urlAPI = `${this.url}lat=${latitude}&lon=${longitude}${this.key}`;
    return this.http.get(urlAPI).pipe(
      map((response: any) => {
        const pollutionData: PollutionData = {
          longitude: response.coord.lon,
          latitude: response.coord.lat,
          aqi: response.list[0].main.aqi,
          co: response.list[0].components.co,
          no: response.list[0].components.no,
          no2: response.list[0].components.no2,
          o3: response.list[0].components.o3,
          so2: response.list[0].components.so2,
          pm2_5: response.list[0].components.pm2_5,
          pm10: response.list[0].components.pm10,
          nh3: response.list[0].components.nh3,
          date: response.list[0].dt
        };
        return pollutionData;
      })
    );
  }
}