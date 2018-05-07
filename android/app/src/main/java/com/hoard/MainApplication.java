package com.hoard;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.urbanairship.reactnative.ReactAirshipPackage;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.horcrux.svg.SvgPackage;
import com.rnfingerprint.FingerprintAuthPackage;
import com.rt2zz.reactnativecontacts.ReactNativeContacts;
import com.lugg.ReactNativeConfig.ReactNativeConfigPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new ReactAirshipPackage(),
            new SplashScreenReactPackage(),
            new VectorIconsPackage(),
            new SvgPackage(),
            new FingerprintAuthPackage(),
            new ReactNativeContacts(),
            new ReactNativeConfigPackage(),
            new LottiePackage()
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
