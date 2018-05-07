import { DrawerNavigator, StackNavigator } from 'react-navigation';
import { Dimensions } from 'react-native';
import Dashboard from 'screens/Dashboard';
import ICO from 'screens/ICO';
import Wallet from 'screens/Wallet';
import Confirm from 'screens/Wallet/Confirm';
import Settings from 'screens/Settings';
import Intro from 'screens/Intro';
import CoinInformation from 'screens/CoinInformation';
import Authenticate from 'components/Authenticate';
import Store from 'components/Pin/Store';
import withHeader from 'hocs/withHeader';
import Menu from './Menu';

const itemWithHeader = (title, screen) => {
  return StackNavigator({ Main: { screen: withHeader(title, screen) } });
};

const RouteConfigs = {
  Intro: {
    screen: Intro,
  },
  Wallet: {
    screen: StackNavigator({
      Main: { screen: withHeader('Wallet', Wallet) },
      CoinInformation: { screen: CoinInformation },
      Confirm: { screen: Confirm },
    }),
  },
  Dashboard: {
    screen: itemWithHeader('Dashboard', Dashboard),
  },
  ICO: {
    screen: itemWithHeader('ICO', ICO),
  },
  Settings: {
    screen: Settings,
  },
  Authenticate: {
    screen: Authenticate,
  },
  Store: {
    screen: Store,
  },
};

const drawerNavigatorConfig = {
  drawerPosition: 'right',
  drawerWidth: Dimensions.get('window').width,
  contentComponent: Menu,
};

export default DrawerNavigator(RouteConfigs, drawerNavigatorConfig);
