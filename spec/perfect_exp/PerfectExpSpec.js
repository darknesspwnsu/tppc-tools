const { findOptimalTrainers } = require('../../perfect_exp.js');

describe('findOptimalTrainers', () => {
  const table = {
    data: [
      { name: 'Trainer A', number: 1, expDay: 100, expNight: 150 },
      { name: 'Trainer B', number: 2, expDay: 200, expNight: 300 },
      { name: 'Trainer C', number: 3, expDay: 300, expNight: 450 },
      { name: 'Trainer D', number: 4, expDay: 400, expNight: 600 },
    ],
  };

  it('should return an empty object if currentExp is greater than or equal to desiredExp', () => {
    const trainers = findOptimalTrainers(100, 50, table);
    expect(trainers).toEqual({});
  });

  it('should return the optimal trainers for daytime exp', () => {
    const trainers = findOptimalTrainers(0, 400, table);
    expect(trainers).toEqual({
      'Trainer D': {
        'numBattles': 1,
        'expAfter': 400,
        'expGain': 400,
      },
    });
  });

  it('should return the optimal trainers for nighttime exp', () => {
    const trainers = findOptimalTrainers(0, 600, table, true);
    expect(trainers).toEqual({
      'Trainer D': {
        'numBattles': 1,
        'expAfter': 600,
        'expGain': 600,
      },
    });
  });

  it('should include trainer ID if includeId parameter is set to true', () => {
    const trainers = findOptimalTrainers(0, 200, table, false, true);
    expect(trainers).toEqual({
      'Trainer B (2)': {
        'numBattles': 1,
        'expAfter': 200,
        'expGain': 200,
      },
    });
  });

  it('should filter out trainers that give negative exp gain', () => {
    const trainers = findOptimalTrainers(400, 800, table, false, false, 2);
    expect(trainers).toEqual({
      'Trainer B': {
        'numBattles': 2,
        'expAfter': 800,
        'expGain': 200,
      },
    });
  });

  it('should filter out trainers that cannot be KOed with Exp Freeze', () => {
    const trainers = findOptimalTrainers(0, 700, table, false, false, 3);
    expect(trainers).toEqual({
      'Trainer C': { 'numBattles': 2, 'expAfter': 600, 'expGain': 300 },
      'Trainer A': { 'numBattles': 1, 'expAfter': 700, 'expGain': 100 }
    });
  });
});
