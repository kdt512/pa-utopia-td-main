const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "공격 업그레이드",
  tap_to_upgrade: "업그레이드하려면 탭하세요!",
  upgrade: "업그레이드",
  stats_type_0: "체력",
  stats_type_1: "데미지",
  stats_type_2: "속도",
  stats_type_3: "공격 범위",
  stats_type_4: "공격 속도",
  stats_type_5: "치명타 확률",
  stats_type_6: "치명타 계수",
  stats_type_7: "재생",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.kr = languages;
