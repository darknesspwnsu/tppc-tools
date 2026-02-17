export type TrainerRow = {
  name: string;
  number: number;
  expDay: number;
  expNight: number;
  level?: string;
};

export type TrainersTable = {
  columns?: string[];
  data: TrainerRow[];
};

export type TrainerPlan = {
  numBattles: number;
  expAfter: number;
  expGain: number;
};
