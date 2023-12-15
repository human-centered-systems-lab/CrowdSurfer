/* eslint-disable no-undef */
import '../style/popup.scss';
import $ from 'jquery';
import '../style/images/logo-128.png';
import { url } from '../url';

/* Script for login page */

chrome.storage.local.get(['id'], (result) => {
  if (result.id !== undefined && result.id !== '') {
    window.location.href = 'home.html';
  }
});

$('.login-form').click((event) => {
  event.preventDefault();
  $('#prolific-input-1').blur(function () {
    // If no ID is provided
    if (!$(this).val()) {
      $(this).addClass('border-danger');
      $('.text-danger').css('display', 'block');
    } else {
      // start login if ID is provided
      $(this).removeClass('border-danger');
      // store ID in local storage and activate search for Tasks
      chrome.storage.local.set({ checkForTasks: true, id: $(this).val() }, () => {
        chrome.runtime.sendMessage({
          method: 'POST',
          action: 'xhttp',
          url: `${url}login`,
          data: {
            prolific_id: $(this).val(),
          },
        }, () => {
          // check if User already confirmed the account
          chrome.runtime.sendMessage({
            method: 'POST',
            action: 'xhttp',
            url: `${url}checkConfirm`,
            data: {
              prolific_id: $(this).val(),
            },
          }, (response) => {
            // if confirmed go to home
            if (response.message === 'confirmed') {
              chrome.storage.local.set({ confirmed: 'true' }, () => {
                window.location.href = 'home.html';
              });
            } else {
              // if not confirmed do demo task
              chrome.storage.local.set({ confirmed: 'false' }, () => {
                window.location.href = 'confirm-register.html';
              });
            }
          });
        });
      });
    }
  });
});
