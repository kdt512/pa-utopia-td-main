const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "攻撃アップグレード",
  tap_to_upgrade: "タップしてアップグレード！",
  upgrade: "アップグレード",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.jp = languages;
