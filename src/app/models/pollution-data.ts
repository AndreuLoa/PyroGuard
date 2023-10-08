export interface PollutionData{
    longitude: number,
    latitude: number,
    aqi: number,
    co: number,
    no: number,
    no2: number,
    o3: number,
    so2: number,
    pm2_5: number,
    pm10: number,
    nh3: number,
    date: string
}

export interface PollutionLevels{
    co: string,
    no: string,
    no2: string,
    o3: string,
    pm2_5: string,
    pm10: string,
}