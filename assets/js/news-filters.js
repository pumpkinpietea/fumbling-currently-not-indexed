(() => {
  const form = document.querySelector('[data-news-filters]');
  if (!form) return;
  form.hidden = false;
  const cards = [...document.querySelectorAll('[data-news-card]')];
  const status = document.querySelector('[data-news-status]');
  const apply = () => {
    const text = form.elements.query.value.trim().toLocaleLowerCase();
    const country = form.elements.country.value;
    const topic = form.elements.topic.value;
    let count = 0;
    for (const card of cards) {
      const visible = (!text || (card.dataset.search || card.textContent).toLocaleLowerCase().includes(text)) &&
        (!country || card.dataset.countries.split(' ').includes(country)) &&
        (!topic || card.dataset.topics.split(' ').includes(topic));
      card.hidden = !visible;
      if (visible) count++;
    }
    status.textContent = status.dataset.template.replace('{count}', String(count));
  };
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  form.addEventListener('submit', event => event.preventDefault());
  apply();
})();
