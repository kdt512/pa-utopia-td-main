import { AudioPlayer } from "./AudioPlayer";
import { sys } from "cc";

const mraid = window["mraid"] || null;

export class GameFlow {
  public audioPlayer: AudioPlayer = null;

  public static instance: GameFlow = null;
  public static isLoaded = false;

  private callBack: Function = null;

  constructor(audioPlayer: AudioPlayer = null, callBack: Function = null) {
    this.audioPlayer = audioPlayer;
    GameFlow.instance = this;
    GameFlow.isLoaded = true;

    this.callBack = callBack;

    window["gameReady"] && window["gameReady"]();
  }

  private waitSettingUp(ad_network): void {
    switch (ad_network) {
      case "Unity": {
        console.log("init case Unity");
        mraid ? this.initUnity() : this.init();
        break;
      }
      case "Mintegral": {
        if (GameFlow.isLoaded) {
          console.log("init case Mintegral lately");
          this.init();
        }
        break;
      }
      default: {
        console.log("init case Default"); 
        this.init();
        break;
      }
    }
  }

  private initUnity(): void {
    if (!!mraid) {
      this.init();
      return;
    }

    mraid.addEventListener("ready", () => {
      if (mraid?.isViewable()) {
        this.init();
      } else {
        mraid?.addEventListener("viewableChange", () => {
          this.init();
        });
      }
    });
  }

  public setEndGame(): void {
    const ad_network = window["advChannels"];
    if (!!ad_network) {
      switch (ad_network) {
        case "Mintegral": {
          window["gameEnd"] && window["gameEnd"]();
          return;
        }
      }
    }
  }

  public callCTA(): void {
    const ad_network = window["advChannels"];
    if (!!ad_network) {
      switch (ad_network) {
        case "Mintegral": {
          window["install"] && window["install"]();
          return;
        }
        case "Unity":
        case "AppLovin": {
          let open;
          if (sys.os == sys.OS.ANDROID) {
            open = window["mraidOpenPlayStore"];
          } else {
            open = window["mraidOpenAppStore"];
          }
          open?.();
          return;
        }
      }
    }
    if (sys.os == sys.OS.ANDROID) {
      sys.openURL(
        "https://play.google.com/store/apps/details?id=com.legendarylabs.utopia&pcampaignid=web_share",
      );
    } else {
      sys.openURL(
        "https://apps.apple.com/us/app/utopia-idle-tower-defense/id6758493769",
      );
    }
  }

  public startAds(): void {
    this.waitSettingUp(window["advChannels"]);
  }

  public init(): void {
    this.callBack && this.callBack();
  }
}

window["advChannels"] = "{{__adv_channels_adapter__}}";

window["gameStart"] = function () {
  if (!GameFlow.instance) {
    console.log("init case Mintegral early");
    GameFlow.isLoaded = true;
  } else {
    console.log("init case Mintegral lately");
    GameFlow.instance.init();
  }
};

window["gameClose"] = function () {
  if (GameFlow.instance) {
    GameFlow.instance.audioPlayer.stopMusic();
  }
};
