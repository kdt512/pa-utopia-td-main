const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "攻擊升級",
  tap_to_upgrade: "點擊升級！",
  upgrade: "升級",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.tw = languages;
