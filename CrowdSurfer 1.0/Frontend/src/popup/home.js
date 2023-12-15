/* eslint-disable no-undef */
import '../style/popup.scss';
import $ from 'jquery';
import { url } from '../url';

/* This File contains the code for the home view in the extension popup. */

let allCheck = false;
let id;

// Check if the user has a confirmed account in local storage,
chrome.storage.local.get(['id', 'confirmed'], (result) => {
  if (result.id !== undefined && result.id !== '') {
    if (result.confirmed === 'true') {
      allCheck = true;
      id = result.id;
    } else {
      window.location.href = 'confirm-register.html';
    }
  }
});

/**
 * @description Capitalize a string for nicer view in text
 * @param s string to capitalize
 * @returns {string} capitalized string
 */
function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

/**
 * @description create a log entry in database
 * @param logType different log type are possible (displayed, related, etc.)
 * @param key the id of the feedbak task
 */
function log(logType, key) {
  chrome.runtime.sendMessage({
    method: 'POST',
    action: 'xhttp',
    url: `${url}log`,
    data: {
      prolific_id: id,
      log_type: logType,
      feedback_id: key,
    },
  });
}

$(() => {
  const nameOfMonth = new Date().toLocaleString('en-GB', { month: 'long' });
  $('#month')
    .html(`<i class="icon-checkmark-circle mr-2"></i> Tasks completed (${nameOfMonth})`);
  chrome.storage.local.get(['checkForTasks'], (result) => {
    if (result.checkForTasks === true) {
      $('#checkForTasks')
        .prop('checked', true);
      $('.text-danger')
        .hide();
    } else {
      $('#checkForTasks')
        .prop('checked', false);
      $('.text-danger')
        .show();
    }
  });
  // requests only if user is confirmed
  if (allCheck === true) {
    // Fill Popup Panel with all Informations needed from the database
    chrome.storage.local.get(['lastDomain'], (lastDomain) => {
      $('#name')
        .html(`Your ID: ${id}`);
      chrome.runtime.sendMessage({
        method: 'POST',
        action: 'xhttp',
        url: `${url}getFeedback`,
        data: {
          prolific_id: id,
          url: lastDomain,
        },
      }, (response) => {
        $('.lds-dual-ring')
          .parent()
          .remove();
        $('#bodyContent')
          .show();
        $('#domain')
          .html(`<i class="icon-list mr-2" style="margin-left: -30px;"></i>
                    Completed on ${capitalize(lastDomain.lastDomain)}`);
        $('#task-completed')
          .html(`${response.tasks_done}/${response.tasks_open}`);
        if (response.compensation !== undefined) {
          $('#task-id')
            .html(`&#xA3;${response.compensation}`);
          $('#task-date')
            .html(response.timestamp);
          $('#task-url')
            .html(`${capitalize(response.url)}.com`)
            .attr('href', `https://www.${response.url}.com`);
          $('#task-month')
            .html(`&#xA3;${response.month}`);
          $('#task-today')
            .html(`&#xA3;${response.today}`);
          $('#activities')
            .show();
        } else {
          $('#no-activities')
            .show();
        }
        if (response.message === 'true' || response.message === 'showed') {
          $('#new-task')
            .show();
          $('#msgText')
            .text(response.text);
          $('#msgLink')
            .attr('href', response.href);
        }
      });
    });
  }
  // log user off
  const logoff = document.getElementById('logoff');
  logoff.addEventListener('click', () => {
    chrome.storage.local.set({ id: '' }, () => {
      window.location.href = 'index.html';
      chrome.storage.local.set({ checkForTasks: false }, () => {
        console.log('Check for Tasks deactivated');
      });
    });
  });

  // show demo task again
  const help = document.getElementById('help');
  help.addEventListener('click', () => {
    window.open(`${url}demo?id=${id}`, '_blank')
      .focus();
  });
});

// listener on switch to check if task should be displayed
$('.switch')
  .on('change', () => {
    if ($('#checkForTasks')
      .is(':checked')) {
      chrome.storage.local.set({ checkForTasks: true }, () => {
        log('activated', 'null');
        $('.text-danger')
          .hide();
      });
    } else {
      chrome.storage.local.set({ checkForTasks: false }, () => {
        log('deactivated', 'null');
        $('.text-danger')
          .show();
      });
    }
  });
