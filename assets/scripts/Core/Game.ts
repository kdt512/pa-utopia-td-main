import { _decorator, Camera, Canvas, Component, Node } from "cc";
import { GameFlow } from "./GameFlow";
import { UICanvas } from "./UICanvas";
import { Signal } from "../eventSystem/Signal";
import { AudioPlayer } from "./AudioPlayer";
import { GameAudioAdapter } from "./GameAudioAdapter";
import * as i18n from './../../resources/i18n/LanguageData';
const { ccclass, property } = _decorator;

export enum GameState {
  None,
  Intro,
  GamePlay,
  Win,
  Lose,
}

@ccclass("Game")
export class Game extends Component {
  @property(Canvas) private canvas: Canvas = null;
  @property(UICanvas) private uiCanvas: UICanvas = null;
  @property(Camera) private camera: Camera = null;
  @property(GameAudioAdapter) public gameAudioAdapter: GameAudioAdapter = null;

  @property(AudioPlayer) public audioPlayer: AudioPlayer = null;

  @property(Node) public winPopUp: Node = null;
  @property(Node) public losePopUp: Node = null;

  private gameFlow: GameFlow = null;
  private isGameStarted = false;
  private _currentGameState: GameState = GameState.None;

  public onChangeState = new Signal<GameState>();

  public static instance: Game = null;

  protected onLoad(): void {
    this.gameFlow = new GameFlow(this.audioPlayer, this.setup);
    Game.instance = this;

  }

  protected start(): void {
    this.gameFlow.startAds();
  }

  protected update(dt: number): void {
    if (!this.isGameStarted) return;
  }

  private setup = (): void => {
    console.log("setup");

    this.setupComponents();

    console.log("setup Done");

    this.canvas.node.active = true;
    this.isGameStarted = true;
    this.CurrentGameState = GameState.GamePlay;
  };

  private setupComponents(): void {
    // this.levelManager.init();
    this.uiCanvas.init(this);
    this.audioPlayer.init(1, 0);
    // this.gameAudioAdapter.init(this.levelManager);
  }
  public get CurrentGameState(): GameState {
    return this._currentGameState;
  }

  public set CurrentGameState(value: GameState) {
    this._currentGameState = value;
    this.onChangeState.trigger(this._currentGameState);

    switch (this._currentGameState) {
      case GameState.Intro:
        // this.levelManager.startIntro();
        break;

      case GameState.GamePlay:
        break;

      case GameState.Win:
        this.gameFlow.setEndGame();
        this.GameCallCTA();
        this.winPopUp.active = true;
        // this.levelManager.stopGame();
        this.audioPlayer.playSound(this.gameAudioAdapter.winSound);

        break;
      case GameState.Lose:
        this.gameFlow.setEndGame();
        this.GameCallCTA();
        this.losePopUp.active = true;
        // this.levelManager.stopGame();
        this.audioPlayer.playSound(this.gameAudioAdapter.loseSound);
        break;
    }
  }

  public startGame(): void {
    this.CurrentGameState = GameState.GamePlay;
  }

  public get GameFlow(): GameFlow {
    return this.gameFlow;
  }

  public GameCallCTA(): void {
    this.gameFlow.callCTA();
  }
}
