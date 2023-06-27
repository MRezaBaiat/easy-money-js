export function reversePair(pair: string): string {
  if (pair.split('/').length !== 2) {
    throw new Error(`pair '${pair}' is in incorrect format`);
  }
  const arr = pair.split('/');

  if (!arr[0] || !arr[1]) {
    throw new Error(`pair '${pair}' is in incorrect format`);
  }

  // throw an Error in this situation effect on other functions
  // if (arr[0] === arr[1]) {
  //   throw new Error(`pair '${pair}' is in incorrect format`);
  // }

  return `${arr[1]}/${arr[0]}`;
}
