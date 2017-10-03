import React from 'react'
import { Alert, View, ScrollView, Button, Text, AsyncStorage } from 'react-native'
// import BackgroundTask from 'react-native-background-task'
import moment from 'moment';
import Weather from './modules/Weather';
import WeatherView from './components/WeatherView';
// import PushNotification from 'react-native-push-notification';
import DeviceInfo from 'react-native-device-info';
import DatePicker from 'react-native-datepicker';
import Meteor, { createContainer } from 'react-native-meteor';
// import OneSignal from "react-native-onesignal";


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
// 
Meteor.connect('ws://192.168.88.49:3000/websocket');//do this only once 

class App extends React.Component {
  constructor(props) {
    super(props);
  
    this.state = {
      loading: true,
      oneSignalUserId : null
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
    await this.upsertUser();
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
    let weather = await Weather.getStoredWeather();
    let date = weather&&weather.date?weather.date:null;

    let schedule = await AsyncStorage.getItem('@MyApp:schedule');

    if(!schedule){
      schedule = '09:00';
    }

    const loading = false;
    this.setState({weather,date,schedule,loading});
  }

  async upsertUser(){
    let deviceId = DeviceInfo.getUniqueID();
    let location =  await Weather.getLocation();

    Meteor.call('users.upsert', {deviceId, location}, function(error,result){
      if(error){
        console.log(error);
      } else{
        console.log('Success users.upsert: ', result, {deviceId,location});
      }
    });
  }

  onSelectDate(date){
    const dateObject = moment(date, 'HH:mm').toDate();
    const deviceId = DeviceInfo.getUniqueID();
    Meteor.call('users.setSchedule', {deviceId, date:dateObject}, (error,result)=>{
      if(error){
        console.log(error);
        Alert.alert(error.reason);
      } else{
        this.setState({schedule:date});
        AsyncStorage.setItem('@MyApp:schedule', date);
        console.log('Success setSchedule: ', result, date);
      }
    });
  }
  
  render() {
    const {weather,date} = this.state;
    const { status } = this.props;

    const debug = false;

    return (
      <View style={{marginTop: 40, flex:1, 'alignItems':'center',  'justifyContent':'center'}}>
        {
          debug? (
            <View>
              <Button
                title="Read storage"
                onPress={this.readStorage.bind(this)}
              />
              <Button
                title="Get weather"
                onPress={this.getAndPersistWeather.bind(this)}
              />
            </View>
          ) : null
        }
        { !status.connected ? 
            <Text>Oops. It looks like you are not online. Please connect to the internet</Text>
          :
            <View>
              <Text style={{fontSize:20, marginBottom:10}}>Schedule notifications:</Text>
              <DatePicker
                style={{width: 200}}
                date={this.state.schedule}
                mode="time"
                format="HH:mm"
                confirmBtnText="Confirm"
                cancelBtnText="Cancel"
                onDateChange={this.onSelectDate.bind(this)}
              />
            </View>
        }
      </View>
          
          // {
            /*weather&&debug ? 
              <View>
                <Text>{weather.city?`Your location is: ${weather.city.name} (${weather.city.country})`:null}</Text>
                <Text>{`Last fetch: ${moment(date).format('YYYY-MM-DD HH:mm:ss')}`}</Text>
                {
                  weather.list.map((weather, i)=>{
                    return <WeatherView key={i} weather={weather}/>
                  })
                }
              </View>
           :null*/ 
          // }
    )
  }
}

export default createContainer(() => {
  return {
    status: Meteor.status(),
  };
}, App);