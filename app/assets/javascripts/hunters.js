function titleize(sentence) {
  if(!sentence.split)
    return sentence;

  const _titleizeWord = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  },
  result = [];
  sentence.split(" ").forEach(function(w) {
    result.push(_titleizeWord(w));
  });

  return result.join(" ");
}