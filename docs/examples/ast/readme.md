# Original code

## Handle Response 

function handlerError(res) {
  if (res && res.node.status === 400 || !res.node.status) {
    return "Bad Request";
  } else {
    return "Success";
  }
}

## Fibonacci

function fib(n) {
    const sol = [
        0,
        1
    ];
    for (let i = 2; i <= n; i++) {
        sol[i] = sol[i - 1] + sol[i - 2];
    }
    return sol[n];
}

## Calc

10 + 5 * 5

## Calc params

function calc(a, b) {
    return a * b;
}