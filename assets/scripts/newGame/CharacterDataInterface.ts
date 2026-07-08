export interface CharacterDataInterface {
  type: CharacterType;
  health: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackSpeed: number;
}

export enum CharacterType {
  PLAYER = 0,
  ENEMY = 1,
}

export interface IStats {
  level: number;
  name: string;
  value: number;
  valuePerLevel: number;
  cost: number;
  costPerLevel: number;
  type: StatsType;
}

export enum StatsType {
  HEALTH = 0,
  DAMAGE = 1,
  SPEED = 2,
  ATTACK_RANGE = 3,
  ATTACK_SPEED = 4,
  CRITICAL_CHANCE = 5,
  CRITICAL_FACTOR = 6,
  REGEN = 7,
}
