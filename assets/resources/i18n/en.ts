const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "Attack Upgrade",
  tap_to_upgrade: "Tap to upgrade!",
  upgrade: "Upgrade",
  stats_type_0: "Health",
  stats_type_1: "Damage",
  stats_type_2: "Speed",
  stats_type_3: "Attack Range",
  stats_type_4: "Attack Speed",
  stats_type_5: "Critical Chance",
  stats_type_6: "Critical Factor",
  stats_type_7: "Regen",
  upgrade_max: "Upgrade to unlock max power!",
  attack: "ATTACK",
  defense: "DEFENSE",
  play_now:"PLAY NOW"
};

if (!win.languages) {
  win.languages = {};
}

win.languages.en = languages;
