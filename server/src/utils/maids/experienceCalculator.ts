import { GetRoundedExperience } from './RoundExperience';

export const experienceCalculator = (employmentHistory: any[]) => {
  let experience = 0;
  console.log(employmentHistory);
  
  if (employmentHistory) {
    employmentHistory.forEach((history) => {
      experience += history.experiance;
    });
  }

  return GetRoundedExperience(experience);
};
