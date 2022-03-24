export const sortObject = (obj: any) => {
  var sorted = [];
  for (var x in obj) {
    sorted.push([x, obj[x]]);
  }
  sorted.sort(function (a, b) {
    return b[1] - a[1];
  });
  return sorted;
};

export const msToHMS = (ms: number) => {
  let seconds = ms / 1000;
  const hours = Math.round(seconds / 3600);
  seconds = seconds % 3600;
  const minutes = Math.round(seconds / 60);
  seconds = seconds % 60;
  return hours + " Hours " + minutes + "  Minutes";
};

export const sleep = async (ms = 2000) => new Promise((r) => setTimeout(r, ms));
