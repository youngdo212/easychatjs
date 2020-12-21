const projectAddButton = document.querySelector('.button--add-project');
const modal = document.querySelector('.modal');
const modalContent = modal.querySelector('.modal-content');
const closeModal = (e) => {
  if (modalContent.contains(e.target)) return;

  modal.classList.remove('modal--visible');
  window.removeEventListener('click', closeModal, true);
};

projectAddButton.addEventListener('click', () => {
  modal.classList.add('modal--visible');

  window.addEventListener('click', closeModal, true);
});

const whitelistInputs = document.querySelectorAll('.whitelist-input');
whitelistInputs.forEach((input) => {
  input.addEventListener('keydown', ({ target, key }) => {
    if (key !== 'Enter') return;
    const projectId = target.dataset.projectId;
    const whiteUrl = target.value;

    callApi({
      method: 'post',
      url: '/whitelist',
      data: {
        projectId,
        whiteUrl,
      },
    });

    target.value = '';
  });
});

const tags = document.querySelectorAll('.tag');
tags.forEach((tag) => {
  tag.addEventListener('click', ({ target, currentTarget }) => {
    if (!target.closest('.tag__remove')) return;
    const projectId = currentTarget.dataset.projectId;
    const whiteUrlEl = currentTarget.querySelector('.tag__title');
    const whiteUrl = whiteUrlEl.textContent;

    callApi({
      method: 'delete',
      url: '/whitelist',
      data: {
        projectId,
        whiteUrl,
      },
    });
  });
});

function callApi({ method = 'get', url, data }) {
  return fetch(url, {
    method: method.toUpperCase(),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}
