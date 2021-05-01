const fetch = require(`node-fetch`);

function convertToCharArray(string) {
  let a = [];
  for (let index = 0; index < string.length; index++) {
    a.push(string.charAt(index));
  }
  return a;
}

const giveNewWordWithUnderscores = async () => {
  const returnObj = { word: undefined, displayText: undefined };
  const res = await fetch(
    `https://arcane-brushlands-62039.herokuapp.com/api/random?number=1`
  );
  const resComp = await res.json();
  const string = await resComp.data.toString();
  returnObj.word = string;
  let array = string.split(`,`);

  function doWithString(word) {
    let maxLength = word.length;
    let percentValue = 0.6;
    let percentage = Math.round(percentValue * maxLength);
    let numberOfElements = percentage;
    let numsArray = generateNums(maxLength, numberOfElements);
    // console.log(`The numsArray => ` + JSON.stringify(numsArray));
    let str = underscorify(word, numsArray);

    function generateNums(maxRange, numberOfElements) {
      let array = [];
      while (array.length < numberOfElements) {
        let a = Math.round(0 + Math.random() * (maxRange - 1 - 0));
        if (!array.includes(a)) {
          array.push(a);
        }
      }
      return array;
    }

    function underscorify(string, numsArray) {
      let charArray = convertToCharArray(string);
      // console.log(`Char array => ` + charArray);
      for (let i = 0; i < numsArray.length; i++) {
        const index = numsArray[i];
        if (!(charArray[index] === ` ` || charArray[index] === `-`))
          charArray[index] = `_`;
      }
      return charArray.join("");
    }
    returnObj.displayText = str;
    return returnObj;
  }

  const result = doWithString(array.toString());
  return result;
};

module.exports = { giveNewWordWithUnderscores };
