const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "攻撃アップグレード",
  tap_to_upgrade: "タップしてアップグレード！",
  upgrade: "アップグレード",
  stats_type_0: "体力",
  stats_type_1: "ダメージ",
  stats_type_2: "スピード",
  stats_type_3: "攻撃範囲",
  stats_type_4: "攻撃速度",
  stats_type_5: "クリティカルチャンス",
  stats_type_6: "クリティカルファクター",
  stats_type_7: "再生",
  upgrade_max: "アップグレードして最大パワーを解放！",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.jp = languages;
