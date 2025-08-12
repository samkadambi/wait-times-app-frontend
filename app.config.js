export default {
  expo: {
    name: "goodeye",
    slug: "goodeye",
    version: "1.0.3",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.samarthkadambi.goodeye",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"],
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: "com.samarthkadambi.goodeye",
    },
    web: {
      favicon: "./assets/images/favicon.png",
    },
    extra: {
      apiUrl: "https://d1kweu97gmmrny.cloudfront.net/api",
      imgUploadUrl: "http://Goodeye-backend-env.eba-gerwdqvn.us-east-2.elasticbeanstalk.com/api",
      eas: {
        projectId: "0102fd2b-bb76-4459-bfaa-79f368701c11",
      },
    },
    plugins: [
      "expo-web-browser",
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ffffff",
        },
      ],
    ],
  },
};
