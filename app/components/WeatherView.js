import React, {Component} from 'react';
import { Alert, View, Button, Text, Image } from 'react-native'
import moment from 'moment';

export default class WeatherView extends Component {
  constructor(args) {
    super(args);
    // code
  }

  formatTime(date, format='YYYY-MM-DD HH:mm:ss'){
    return moment.unix(date).format(format);
  }

  isIn24HoursInterval(unix){
    const currentTime = moment();
    const date = moment.unix(unix);
    const hoursDiff = date.diff(currentTime, 'h');
    return hoursDiff <= 24 && hoursDiff>=0; 
  }

  render(){
    const {weather} = this.props;

    if(!this.isIn24HoursInterval(weather.dt)) return null;

    return(
      <View>
        <Text>{this.formatTime(weather.dt)}</Text>
        {
          weather.weather.map((weather,i)=>{
            return (
              <Image
                key={i}
                style={{width: 50, height: 50}}
                source={{uri: `https://openweathermap.org/img/w/${weather.icon}.png`}}
              />
            )
          })
        }
        <Text>Weather:</Text>
        {
          weather.weather.map((weather,i)=>{
            return(
              <Text key={i}>{`${weather.main} - ${weather.description}`}</Text>
            ) 
          })
        }
        <View style={{marginVertical:10}}>
          <Text>{`Humidity: ${weather.main.humidity}%`}</Text>
          <Text>{`Pressure: ${weather.main.pressure} hPa`}</Text>
          <Text>{`Temperature: ${weather.main.temp} °C`}</Text>
          <Text>{`Wind: ${weather.wind.speed} m/s`}</Text>
          <Text>{`Cloudiness: ${weather.clouds.all}%`}</Text>
          <Text>{weather.name?`Your location is: ${weather.name}`:null}</Text>
        </View>
      </View>
    
    )
  }
  // methods
}