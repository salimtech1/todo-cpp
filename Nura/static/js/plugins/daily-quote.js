const dailyQuotes = [
  "Small steps still move you forward.",
  "Make room for the life you are building.",
  "You are allowed to begin again.",
  "Progress can be quiet and still be real.",
  "Take today one kind choice at a time.",
  "Rest belongs in a life that is growing.",
  "Start where you are. Use what you have.",
  "There is no behind; there is only your next step."
];

window.Nura.registerWidget({
  id: "daily-quote",
  title: "Daily light",
  render() {
    const quote = dailyQuotes[new Date().getDate() % dailyQuotes.length];
    return `<section class="card quote-card" style="margin-top:12px"><strong>A small reminder</strong>“${quote}”</section>`;
  }
});
