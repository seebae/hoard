import React from 'react';
import { Provider } from 'react-redux';
import SplashScreen from 'react-native-splash-screen';
import {
 UrbanAirship,
} from 'urbanairship-react-native'
import {
  Alert,
  AppRegistry,
  Button,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  ListView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import NavigatorService from 'lib/navigator';
import configureStore from './configureStore';
/* import HockeyApp from 'react-native-hockeyapp';*/
// import Config from 'react-native-config';
import Login from 'screens/Login';
import Mnemonic from 'screens/Wallet/Mnemonic';
import Track from 'screens/Wallet/Track';
import Import from 'screens/Wallet/Import';
import Signup from 'screens/Signup';
import Menu from 'screens/Menu';
import { StackNavigator } from 'react-navigation';
import { INIT_REQUESTING } from './containers/App/constants';

export const store = configureStore();

const RoutingStack = StackNavigator(
  {
    Login: { screen: Login },
    Signup: { screen: Signup },
    Menu: { screen: Menu },
    Mnemonic: { screen: Mnemonic },
    Track: { screen: Track },
    Import: { screen: Import }
  },
  {
    headerMode: 'none'
  }
);

export let navigatorRef;

/*
  Example usage:
  handleDeepLink('org.reactjs.native.example.Hoard://confirm_transaction/?params={"tx":"123","uid":"12"}')
 */

function handleDeepLink(deepLink){
  const SCHEME = 'org.reactjs.native.example.Hoard://';
  let paths, params;

  let link = deepLink.replace(SCHEME, "");

  link = link.split('/');
  alert(`Deep Link: ${link[0]}`)

  if (link[link.length-1].includes('?params=')){
    params = link[link.length-1];
    params = params.replace('?params=', "")
    alert(`Params: ${params}`)
  }

  if (link[0] === 'confirm_transaction') {
     NavigatorService.navigateDeep([
      { routeName: "Wallet" }, { routeName: "Confirm", params: JSON.parse(params) }
    ]);
  }
  else{
    // TODO handle default or unhandled deeplinks
    NavigatorService.navigate('Dashboard');
  }


}


export default class App extends React.Component {
  componentWillMount() {
    /* HockeyApp.configure(Config.HOCKEYAPP_API_KEY, true);*/
  }

  componentDidMount() {
    /* HockeyApp.start();*/
    /* HockeyApp.checkForUpdate();*/
    store.dispatch({ type: INIT_REQUESTING });
    SplashScreen.hide();
  }

  componentWillMount() {
    UrbanAirship.getChannelId().then((channelId) => {
      // this.setState({channelId:channelId})
    });

    UrbanAirship.addListener("notificationResponse", (response) => {
      console.log('notificationResponse:', JSON.stringify(response));
      alert("notificationResponse: " + response.notification.alert);
    });

    UrbanAirship.addListener("pushReceived", (notification) => {
      console.log('pushReceived:', JSON.stringify(notification));
      alert("pushReceived: " + notification.alert);
    });

    UrbanAirship.addListener("deepLink", (event) => {
      console.log('deepLink:', JSON.stringify(event));
      handleDeepLink(event.deepLink)
    });

    UrbanAirship.addListener("registration", (event) => {
      console.log('registration:', JSON.stringify(event));
      // this.state.channelId = event.channelId;
      // this.setState(this.state);
    });

    UrbanAirship.addListener("notificationOptInStatus", (event) => {
      console.log('notificationOptInStatus:', JSON.stringify(event));
    });
  }

  render() {
    return (
      <Provider store={store}>
        <RoutingStack
          ref={navigatorRef => {
            NavigatorService.setContainer(navigatorRef);
          }}
        />
      </Provider>
    );
  }
}
