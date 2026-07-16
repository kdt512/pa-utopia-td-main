const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "攻撃強化",
  tap_to_upgrade: "タップで強化!",
  upgrade: "強化",
  upgrade_plus: "強化+++",
  stats_type_0: "体力",
  stats_type_1: "ダメージ",
  stats_type_2: "スピード",
  stats_type_3: "攻撃範囲",
  stats_type_4: "攻撃速度",
  stats_type_5: "クリティカルチャンス",
  stats_type_6: "クリティカルファクター",
  stats_type_7: "再生",
  upgrade_max: "アップグレードして最大パワーを解放！",
  attack: "攻撃",
  defense: "防御",
  download_now: "今すぐダウンロード",
  try_again: "もう一度試す",
  play_now: "今すぐプレイ",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.jp = languages;
