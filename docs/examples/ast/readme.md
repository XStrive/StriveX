const resultCalcLogic = logic(calculatorLogic)
const resultCalcWithparams = logic(calculatorLogicParams)(90, 30)
const resultFibonacci = logic(fibonacci)(10)

console.log("resultCalcLogic", resultCalcLogic);
console.log("resultCalcWithparams", resultCalcWithparams);
console.log("resultFibonacci", resultFibonacci)
