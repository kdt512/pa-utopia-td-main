const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "Attack Upgrade",
  tap_to_upgrade: "Tap to upgrade!",
  upgrade: "Upgrade",
  stats_type_0: "Damage",
  stats_type_1: "Attack Range",
  stats_type_2: "Attack Speed",
  stats_type_3: "Health",
  stats_type_4: "Speed",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.en = languages;
