import React from 'react'
import { Alert, View, ScrollView, Button, Text, AsyncStorage,Dimensions, Image } from 'react-native'
// import BackgroundTask from 'react-native-background-task'
import moment from 'moment';
import Weather from './modules/Weather';
import WeatherView from './components/WeatherView';
// import PushNotification from 'react-native-push-notification';
import DeviceInfo from 'react-native-device-info';
import DatePicker from 'react-native-datepicker';
import Meteor, { createContainer } from 'react-native-meteor';
import OneSignal from "react-native-onesignal";


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

const bg = require('./images/bg.jpg');

Meteor.connect('ws://weather-informer-backend.herokuapp.com/websocket');//do this only once 

const {height, width} = Dimensions.get('window');

class App extends React.Component {
  constructor(props) {
    super(props);
  
    this.state = {
      loading: true,
      oneSignalId : null
    };
  }

  componentWillMount() {
      OneSignal.inFocusDisplaying(2);

      OneSignal.addEventListener('received', this.onReceived);
      OneSignal.addEventListener('opened', this.onOpened);
      OneSignal.addEventListener('registered', this.onRegistered);
      OneSignal.addEventListener('ids', this.onIds.bind(this));
  }

  componentWillUnmount() {
      OneSignal.removeEventListener('received', this.onReceived);
      OneSignal.removeEventListener('opened', this.onOpened);
      OneSignal.removeEventListener('registered', this.onRegistered);
      OneSignal.removeEventListener('ids', this.onIds.bind(this));
  }

  onReceived(notification) {
      console.log("Notification received: ", notification);
  }

  onOpened(openResult) {
    console.log('Message: ', openResult.notification.payload.body);
    console.log('Data: ', openResult.notification.payload.additionalData);
    console.log('isActive: ', openResult.notification.isAppInFocus);
    console.log('openResult: ', openResult);
  }

  onRegistered(notifData) {
      console.log("Device had been registered for push notifications!", notifData);
  }

  onIds(device) {
    if(device && device.userId){
      this.setState({oneSignalId: device.userId});
      console.log('Device info: ', device);
    }
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
    await this.getRecommendation();
    this.setState({currentWeather:await Weather.getCurrentWeather()});
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

  async getRecommendation(){
    let location =  await Weather.getLocation();
    location = {
      latitude : 1.290098,
      longitude : 103.864746 
    }
    Meteor.call('getRecommendation', {location}, (error, result)=>{
      if(error){
        console.log(error);
      } else{
        console.log('getRecommendation: ', result, {location});
        this.setState({recommendation:result});
      }
    })
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

  componentWillUpdate(nextProps, nextState) {
    let deviceId = DeviceInfo.getUniqueID();
    const { status } = nextProps;
    const { oneSignalId, registeredDeviceForPushNotifications } = nextState;

    if(status.connected && !registeredDeviceForPushNotifications){
      Meteor.call('notifications.registerUserDevice', {deviceId, oneSignalId}, (error,result)=>{
        this.setState({registeredDeviceForPushNotifications:true});
      });
    }
  }
  
  render() {
    const { date, currentWeather, recommendation } = this.state;
    const { status } = this.props;

    const debug = false;  
    console.log(currentWeather)

    return (
      <View style={{flex:1}}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <Image
            style={{
              flex: 1,
              resizeMode:'cover',
            }}
            source={bg}
          />
        </View>
        { !status.connected ? 
          <Text style={{position:'absolute', top:0, left:0, width, backgroundColor:'#2276a7', color:'#fff', padding:10, paddingTop:30}}>Oops. It looks like you are not online. Please connect to the internet</Text>

          :null
        }
        {
          // debug? (
          //   <View>
          //     <Button
          //       title="Read storage"
          //       onPress={this.readStorage.bind(this)}
          //     />
          //     <Button
          //       title="Get weather"
          //       onPress={this.getAndPersistWeather.bind(this)}
          //     />
          //   </View>
          // ) : null
        }

        <View style={{paddingHorizontal:20, paddingTop: 70, 'alignItems':'center'}}> 
          <View>
            <Text style={{fontSize:20, marginBottom:10, backgroundColor:'transparent'}}>Notifications schedule:</Text>
            <DatePicker
              disabled={!status.connected}
              style={{width: 200}}
              date={this.state.schedule}
              mode="time"
              format="HH:mm"
              confirmBtnText="Confirm"
              cancelBtnText="Cancel"
              onDateChange={this.onSelectDate.bind(this)}
            />
          </View>
          {
            currentWeather ? 
              <View style={{marginVertical:60}}>
                {
                  currentWeather.weather.map((weather,i)=>{
                    return (
                      <View key={i} style={{alignItems:'center'}}>
                        <Image
                          style={{width: 60, height: 60}}
                          source={{uri: `https://openweathermap.org/img/w/${weather.icon}.png`}}
                        />
                        <Text style={{backgroundColor:'transparent', textAlign:'center'}}>{`${weather.main}`}</Text>
                        <Text style={{backgroundColor:'transparent', textAlign:'center', fontSize: 50}}>{`${currentWeather.main.temp}`} °C</Text>
                      </View>
                    )
                  })
                }
              </View>
            :null
          }
          {
            recommendation ? 
              <Text style={{backgroundColor:'transparent', textAlign:'center', fontSize:18}}>
                {recommendation}
              </Text>
            :null
          }
        </View>
      </View>
    )
  }
}

export default createContainer(() => {
  return {
    status: Meteor.status(),
  };
}, App);