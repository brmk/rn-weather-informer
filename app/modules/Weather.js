import { Alert, AsyncStorage } from 'react-native'

class Weather {
  constructor(args) {
    this.appId = 'ba3a91dcd7343fd7eaa8b1d1681f6973';
  }

  async getWeather(options={}){
    // Fetch some data over the network which we want the user to have an up-to-
    // date copy of, even if they have no network when using the app
    let coords = options.coords || await this.getLocation();

    // console.log(coords);
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.latitude}&lon=${coords.longitude}&APPID=${this.appId}&units=metric`);
    const weatherString = await response.text();

    let weather = JSON.parse(weatherString);

    weather.date = new Date();

    return weather;
  }

  async getCurrentWeather(options={}){
    // Fetch some data over the network which we want the user to have an up-to-
    // date copy of, even if they have no network when using the app
    let coords = options.coords || await this.getLocation();

    // console.log(coords);
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&APPID=${this.appId}&units=metric`);
    const weatherString = await response.text();

    let weather = JSON.parse(weatherString);

    weather.date = new Date();

    return weather;
  }

  async persistWeather(weather=this.getWeather()){
    // Data persisted to AsyncStorage can later be accessed by the foreground app
    weather = JSON.stringify(weather);
    await AsyncStorage.setItem('@MyApp:weather', weather);
    // await AsyncStorage.setItem('@MyApp:date', new Date());
  }

  async getStoredWeather() {
    const weather = await AsyncStorage.getItem('@MyApp:weather');
    // const date = await AsyncStorage.getItem('@MyApp:date');
    return JSON.parse(weather);
  }

  getLocation() {
    return new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition((location)=>{
        let coords = {
          latitude : location.coords.latitude,
          longitude: location.coords.longitude
        }
        resolve(coords);
      }, (error)=>reject(error));
    });
  }

}

export default new Weather();