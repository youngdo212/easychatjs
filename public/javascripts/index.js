const projectAddButton = document.querySelector('.button--add-project');
const modal = document.querySelector('.modal');
const modalContent = modal.querySelector('.modal-content');
const closeModal = (e) => {
  if(modalContent.contains(e.target)) return;

  modal.classList.remove('modal--visible');
  window.removeEventListener('click', closeModal, true);
};

projectAddButton.addEventListener('click', () => {
  modal.classList.add('modal--visible');

  window.addEventListener('click', closeModal, true);
});