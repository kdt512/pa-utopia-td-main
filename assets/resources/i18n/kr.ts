const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "공격 업그레이드",
  tap_to_upgrade: "업그레이드하려면 탭하세요!",
  upgrade: "업그레이드",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.kr = languages;
