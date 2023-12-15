/* eslint-disable no-undef */
import '../style/popup.scss';
import $ from 'jquery';
import { url } from '../url';

/* This script checks if the user is frequent user of webpages before doing the demo task */
$(() => {
  chrome.storage.local.get(['id'], (result) => {
    const button = document.getElementById('id');
    button.addEventListener('click', () => {
      window.open(`${url}demo?id=${result.id}`, '_blank')
        .focus();
    });
    chrome.runtime.sendMessage({
      method: 'POST',
      action: 'xhttp',
      url: `${url}checkConfirm`,
      data: {
        prolific_id: result.id,
      },
    }, (response) => {
      if (response.message === 'confirmed') {
        chrome.storage.local.set({ confirmed: 'true' }, () => {
          window.location.href = 'home.html';
        });
      } else {
        chrome.storage.local.set({ confirmed: 'false' });
      }
    });
  });
  $('#checker').change(() => {
    if (document.getElementById('checker').checked) {
      $('#id').removeAttr('disabled', '');
    } else {
      $('#id').attr('disabled', 'true');
    }
  });
});
