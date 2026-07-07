import { _decorator, AudioClip, Component, Node } from 'cc';
import { AudioPlayer } from './AudioPlayer';

import { Game } from './Game';
import { LevelManager } from './LevelManager';

const { ccclass, property } = _decorator;

@ccclass('GameAudioAdapter')
export class GameAudioAdapter extends Component {

    @property(AudioClip) public music: AudioClip;
    @property(AudioClip) public tapSound: AudioClip;
    @property(AudioClip) public failSound: AudioClip;
    @property(AudioClip) public carSound: AudioClip;
    @property(AudioClip) public matchSound: AudioClip;
    @property(AudioClip) public mergeSound: AudioClip;
    @property(AudioClip) public engineSound: AudioClip;
    @property(AudioClip) public winSound: AudioClip;
    @property(AudioClip) public loseSound: AudioClip;

    @property(AudioClip) public trafficSound1: AudioClip;
    @property(AudioClip) public trafficSound2: AudioClip;
    @property(AudioClip) public helpSound: AudioClip;



    private audioPlayer: AudioPlayer;
    private levelManager: LevelManager = null;


    public init(levelManager: LevelManager): void {

        Game.instance.audioPlayer.playMusic(this.music);
        this.audioPlayer = Game.instance.audioPlayer;
        this.levelManager = levelManager;

        this.levelManager.Parking.onTapFailSound.on(() => { this.audioPlayer.playSound(this.failSound); }, this);
        this.levelManager.Parking.onCarStartSound.on(() => { this.audioPlayer.playSound(this.carSound); }, this);
        this.levelManager.Parking.onMatch.on(() => { this.audioPlayer.playSound(this.matchSound); }, this);

        

    }


}


