const viewer = document.querySelector('.lightbox');
const artwork = document.querySelector('#full-artwork');
const original = document.querySelector('#original-link');
const label = document.querySelector('#artwork-label');

document.querySelectorAll('[data-image]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !viewer.showModal) return;
    event.preventDefault();
    const image = link.querySelector('img');
    artwork.src = link.href;
    artwork.alt = image.alt;
    original.href = link.href;
    label.textContent = link.closest('figure').querySelector('figcaption span').textContent;
    viewer.showModal();
    viewer.querySelector('.lightbox-content').scrollTop = 0;
  });
});
viewer.querySelector('button').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const rect = viewer.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) viewer.close();
});
viewer.addEventListener('close', () => artwork.removeAttribute('src'));
