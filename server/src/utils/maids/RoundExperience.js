const GetRoundedExperience = (experience) => {
  if (experience % 1 === 0) return experience;
  else return Number(experience.toFixed(1));
};

module.exports = { GetRoundedExperience };
