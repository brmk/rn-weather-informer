import React from 'react'
import { Alert, View, ScrollView, Button, Text, AsyncStorage } from 'react-native'
// import BackgroundTask from 'react-native-background-task'
import moment from 'moment';
import Weather from './modules/Weather';
import WeatherView from './components/WeatherView';
// import PushNotification from 'react-native-push-notification';
import DeviceInfo from 'react-native-device-info';
import DatePicker from 'react-native-datepicker';
// DeviceInfo.getUniqueID()
// one signal app id Your App ID: 0a6bc7e3-ee18-44a0-8365-7e5ebdab18d9


// BackgroundTask.define(async () => {
//   let weather = await Weather.getWeather();
//   Weather.persistWeather(weather);

//   let data = {
//     id: Math.random().toString(),
//     message: `${weather.weather[0].main} - ${weather.weather[0].description}`,
//     title: 'Weather update'
//   }

//   let location = await Weather.getLocation();

//   PushNotification.localNotification(data);
//   BackgroundTask.finish();
// });

export default class MyApp extends React.Component {
  constructor(props) {
    super(props);
  
    this.state = {
      loading: true
    };
  }

  // async notify(){
  //   let m = moment().add(5, 'second');
  //   let weather = await getWeather();
  //   // console.log(weather)
  //   let data = {
  //     id: Math.random().toString(),
  //     message: `${weather.weather[0].main} - ${weather.weather[0].description}`,
  //     title: 'Weather update',
  //     date: m.toDate()
  //   }
  //   PushNotification.localNotificationSchedule(data);
  // }

  async componentDidMount() {
    // await getWeather();
    await this.readStorage();
    // Optional: Check if the device is blocking background tasks or not
    // this.checkStatus()
  }

  
  // async checkStatus() {
  //   const status = await BackgroundTask.statusAsync()
  //   if (status.available) {
  //     // Everything's fine
  //     return
  //   }
    
  //   const reason = status.unavailableReason
  //   if (reason === BackgroundTask.UNAVAILABLE_DENIED) {
  //     Alert.alert('Denied', 'Please enable background "Background App Refresh" for this app')
  //   } else if (reason === BackgroundTask.UNAVAILABLE_RESTRICTED) {
  //     Alert.alert('Restricted', 'Background tasks are restricted on your device')
  //   }
  // }

  async getAndPersistWeather(){
    try{
      let weather = await Weather.getWeather(),
        {date} = weather;

      this.setState({weather,date});
      await Weather.persistWeather(weather);
    }
    catch(e) {
      Alert.alert('Something went wrong...');
    }
  }

  async readStorage(){
    let weather = await Weather.getStoredWeather(),
        {date} = weather;

    let schedule = await AsyncStorage.getItem('@MyApp:schedule');

    const loading = false;
    this.setState({weather,date,schedule,loading});
  }

  onSelectDate(date){
    this.setState({schedule:date});
    AsyncStorage.setItem('@MyApp:schedule', date);
  }
  
  render() {
    const {weather,date} = this.state;

    return (
      <ScrollView style={{marginTop: 40}}>
        <Button
          title="Read storage"
          onPress={this.readStorage.bind(this)}
        />
        <Button
          title="Get weather"
          onPress={this.getAndPersistWeather.bind(this)}
        />
        <DatePicker
          style={{width: 200}}
          date={this.state.schedule}
          mode="time"
          format="hh:mm"
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          onDateChange={this.onSelectDate.bind(this)}
        />
        {
          weather ? 
            <View>
              <Text>{weather.city?`Your location is: ${weather.city.name} (${weather.city.country})`:null}</Text>
              <Text>{`Last fetch: ${moment(date).format('YYYY-MM-DD HH:mm:ss')}`}</Text>
              {
                weather.list.map((weather, i)=>{
                  return <WeatherView key={i} weather={weather}/>
                })
              }
            </View>
         :null 
        }
      </ScrollView>
    )
  }
}