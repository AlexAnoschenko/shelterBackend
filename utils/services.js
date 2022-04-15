function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function sortCards(a, b) {
  if (a.type > b.type) {
    return 1;
  }
  if (a.type < b.type) {
    return -1;
  }
  return 0;
}

module.exports = { shuffle, sortCards };
