const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "攻擊強化",
  tap_to_upgrade: "點擊升級!",
  upgrade: "升級",
  stats_type_0: "生命值",
  stats_type_1: "傷害",
  stats_type_2: "速度",
  stats_type_3: "攻擊範圍",
  stats_type_4: "攻擊速度",
  stats_type_5: "暴擊率",
  stats_type_6: "暴擊係數",
  stats_type_7: "再生",
  upgrade_max: "升級以解鎖最大威力!",
  attack: "攻擊",
  defense: "防禦",
  play_now: "立即遊玩",
  match_tut: "配對以使用超能光束！",
  try_again: "再試一次",
  download_now: "立即下載",
  title_game_desc: "伊德塔防",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.tw = languages;
