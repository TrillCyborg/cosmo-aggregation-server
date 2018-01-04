const getSubString = (pair) => {
  const currencies = pair.split('-');
  return `5~CCCAGG~${currencies[0]}~${currencies[1]}`;
};

export default {
  getSubString,
};
