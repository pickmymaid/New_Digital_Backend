const { GetRoundedExperience } = require('./RoundExperience');

const experienceCalculator = (employmentHistory) => {
  let experience = 0;
  console.log(employmentHistory);

  if (employmentHistory) {
    employmentHistory.forEach((history) => {
      experience += history.experiance;
    });
  }

  return GetRoundedExperience(experience);
};

module.exports = { experienceCalculator };
