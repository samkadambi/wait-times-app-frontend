export default {
  expo: {
    name: "GoodEye",
    slug: "goodeye",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.goodeye",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.yourcompany.goodeye",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiUrl: process.env.API_URL || "http://10.0.0.122:3001/api",
      eas: {
        projectId: "0102fd2b-bb76-4459-bfaa-79f368701c11",
      },
    },
    plugins: ["expo-router"],
  },
};
