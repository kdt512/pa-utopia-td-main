const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "공격 강화",
  tap_to_upgrade: "탭해서 강화!",
  upgrade: "강화",
  upgrade_plus: "강화+++",
  stats_type_0: "체력",
  stats_type_1: "데미지",
  stats_type_2: "속도",
  stats_type_3: "공격 범위",
  stats_type_4: "공격 속도",
  stats_type_5: "치명타 확률",
  stats_type_6: "치명타 계수",
  stats_type_7: "재생",
  upgrade_max: "업그레이드하여 최대 파워를 잠금 해제하세요!",
  attack: "공격",
  defense: "방어",
  download_now: "지금 다운로드",
  try_again: "다시 시도",
  play_now: "지금 플레이",
};

if (!win.languages) {
  win.languages = {};
}

win.languages.kr = languages;
