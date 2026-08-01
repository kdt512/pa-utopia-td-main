const win = window as any;

export const languages = {
  // Data
  attack_upgrade: "Angriffs-Upgrade",
  tap_to_upgrade: "Tippen zum Verbessern!",
  upgrade: "Verbessern",
  stats_type_0: "Leben",
  stats_type_1: "Schaden",
  stats_type_2: "Geschwindigkeit",
  stats_type_3: "Angriffsreichweite",
  stats_type_4: "Angriffsgeschwindigkeit",
  stats_type_5: "Kritische Trefferchance",
  stats_type_6: "Kritischer Schadensfaktor",
  stats_type_7: "Regeneration",
  upgrade_max: "Verbessern, um maximale Kraft freizuschalten!",
  attack: "ANGRIFF",
  defense: "VERTEIDIGUNG",
  play_now:"JETZT SPIELEN"
};

if (!win.languages) {
  win.languages = {};
}

win.languages.de = languages;
