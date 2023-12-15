/* eslint-disable no-undef */
import $ from 'jquery';
import '../style/foreground.scss';
import { parseDomain, ParseResultType } from 'parse-domain';
import { url } from '../url';

let prolific;
const resizePanel = [];

chrome.storage.local.get(['id'], (result) => {
  prolific = result.id;
});

const { runtime: { getURL } } = chrome;

// eslint-disable-next-line no-restricted-globals
const parseResult = parseDomain(location.hostname);
let domain;

if (parseResult.type === ParseResultType.Listed) {
  domain = parseResult.domain;
}

// object to map HTMl elements to every panel type (text, tar and both)
const typeToConst = {
  text: {
    html: 'panel-text',
    htmlID: 'feedback-panel-text',
    listener: {
      remove: 'removeText',
      minimize: 'minimizeText',
      toggle: 'toggleText',
      dropdown: 'dropdownText',
      submit: 'textSubmit',
      danger: 'danger-text',
    },
  },
  star: {
    html: 'panel-stars',
    htmlID: 'feedback-panel-stars',
    listener: {
      remove: 'removeStars',
      minimize: 'minimizeStars',
      toggle: 'toggleStars',
      dropdown: 'dropdownStars',
      submit: 'starSubmit',
      danger: 'danger-stars',
    },
  },
  textStar: {
    html: 'panel-text-stars',
    htmlID: 'feedback-panel-text-stars',
    listener: {
      remove: 'removeTextStar',
      minimize: 'minimizeTextStar',
      toggle: 'toggleTextStar',
      dropdown: 'dropdownTextStar',
      submit: 'textStarSubmit',
      danger: 'danger-text-stars',
    },
  },
};

/**
 * @description calculate the position of the feedback panel according to the HTML element
 * @param dom The UI element which is to be evaluated with the feedback panel
 * @param direction The Direction to which the feedback panel should point
 * @returns {int[]} Top and left position
 */
function calcPositions(dom, direction) {
  const position = $(dom)
    .offset();
  let top;
  let left;
  switch (direction) {
    case 'left':
      top = position.top + ($(dom)
        .outerHeight(true) * 0.5) - 78;
      left = position.left + $(dom)
        .outerWidth(true) + 20;
      return [top, left];
    case 'right':
      top = position.top + ($(dom)
        .outerHeight(true) * 0.5) - 78;
      left = position.left - 250;
      return [top, left];
    case 'top':
      top = position.top + $(dom)
        .outerHeight(true) + 18;
      left = position.left + ($(dom)
        .outerWidth(true) * 0.5) - 115;
      return [top, left];
    case 'bottom':
      top = position.top - 186;
      left = position.left + ($(dom)
        .outerWidth(true) * 0.5) - 115;
      return [top, left];
    default:
      return [0, 0];
  }
}

/**
 * @description Allowing the same feedback panel type on one page
 * @param htmlID HTML ID of feedback panel (see typeToConst)
 * @param direction Direction of feedback panel
 * @param listener Listeners of feedback panel (see typeToConst)
 * @param id Feedback ID (can be found in database)
 * @param text Text to be displayed in feedback panel
 * @param value [textStar|star] if panel is star or text&star the stars need new IDs
 */
function handleUniqueHTML(htmlID, direction, listener, id, text, value) {
  $('.feedback-panel')
    .attr('id', `${htmlID}-${id}`)
    .addClass(`${htmlID}`)
    .removeClass('feedback-panel');
  $(`#${htmlID}-${id} .card`)
    .addClass(`arrow-${direction} ${id}`);
  $('#badge-crowdsurfer')
    .addClass(`badge-${direction} ${id}`)
    .attr('id', `badge-${id}`);
  $(`#${listener.dropdown}`)
    .attr('id', `${listener.dropdown}-${id}`);
  $('#remind')
    .attr('id', `remind-${id}`);
  $('#rewriteSuccess')
    .attr('id', `success-${id}`);
  $('#panelArea')
    .attr('id', `panelArea-${id}`);
  $('#moreInfo')
    .attr('id', `moreInfo-${id}`);
  $(`#${listener.toggle}`)
    .attr('id', `${listener.toggle}-${id}`);
  $(`#${listener.minimize}`)
    .attr('id', `${listener.minimize}-${id}`);
  $(`#${listener.remove}`)
    .attr('id', `${listener.remove}-${id}`);
  $(`#${listener.danger}`)
    .attr('id', `${listener.danger}-${id}`);
  $(`#${listener.submit}`)
    .attr('id', `${listener.submit}-${id}`);
  $('#openTasks')
    .attr('id', `openTasks-${id}`);

  $('#textCrowdSurfer')
    .attr('placeholder', text)
    .attr('id', `textCrowdSurfer-${id}`);

  if (value.type === 'textStar' || value.type === 'star') {
    $('#rating-5')
      .attr('id', `rating-5-${id}`);
    $('#rating-4')
      .attr('id', `rating-4-${id}`);
    $('#rating-3')
      .attr('id', `rating-3-${id}`);
    $('#rating-2')
      .attr('id', `rating-2-${id}`);
    $('#rating-1')
      .attr('id', `rating-1-${id}`);
    $('#label5')
      .attr('for', `rating-5-${id}`)
      .attr('id', `label5-${id}`);
    $('#label4')
      .attr('for', `rating-4-${id}`)
      .attr('id', `label4-${id}`);
    $('#label3')
      .attr('for', `rating-3-${id}`)
      .attr('id', `label3-${id}`);
    $('#label2')
      .attr('for', `rating-2-${id}`)
      .attr('id', `label2-${id}`);
    $('#label1')
      .attr('for', `rating-1-${id}`)
      .attr('id', `label1-${id}`);
  }
}

/**
 * @description Adds the Backend Calls for each Button
 * @param type [star|text|textStar]
 * @param htmlID see typeToConst
 * @param id Feedback ID (can be found in database)
 */
function addAPICalls(type, htmlID, id) {
  let rating;
  let text = '';
  if (type === 'star') {
    if ($(`#rating-5-${id}`)
      .is(':checked')) {
      rating = 5;
    } else if ($(`#rating-4-${id}`)
      .is(':checked')) {
      rating = 4;
    } else if ($(`#rating-3-${id}`)
      .is(':checked')) {
      rating = 3;
    } else if ($(`#rating-2-${id}`)
      .is(':checked')) {
      rating = 2;
    } else if ($(`#rating-1-${id}`)
      .is(':checked')) {
      rating = 1;
    }
  }
  if (type === 'text') {
    $('#textCrowdSurfer')
      .attr('id', `textCrowdSurfer-${id}`);
    text = $(`#textCrowdSurfer-${id}`)
      .val();
    rating = 0;
  }
  if (type === 'textStar') {
    text = $(`#textCrowdSurfer-${id}`)
      .val();
    if ($(`#rating-5-${id}`)
      .is(':checked')) {
      rating = 5;
    } else if ($(`#rating-4-${id}`)
      .is(':checked')) {
      rating = 4;
    } else if ($(`#rating-3-${id}`)
      .is(':checked')) {
      rating = 3;
    } else if ($(`#rating-2-${id}`)
      .is(':checked')) {
      rating = 2;
    } else if ($(`#rating-1-${id}`)
      .is(':checked')) {
      rating = 1;
    } else {
      rating = 0;
    }
    if (rating === 0 && text === '') {
      $(`#danger-text-stars-${id}`)
        .show();
      return;
    }
  }
  chrome.runtime.sendMessage({
    method: 'POST',
    action: 'xhttp',
    url: `${url}feedback`,
    data: {
      type,
      rating,
      text,
      prolific_id: prolific,
      url: domain,
      feedback_id: id,
      stat: 'done',
    },
  }, (resp) => {
    $(`#panelArea-${id}`)
      .hide();
    $(`#success-${id}`)
      .show();
    $(`#openTasks-${id}`)
      .show()
      .html(`${resp.done}/${resp.open} tasks on this domain completed`);
    setTimeout(() => {
      $(`#${htmlID}-${id}`)
        .remove();
    }, 4000);
  });
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
      prolific_id: prolific,
      log_type: logType,
      feedback_id: key,
    },
  });
}

/**
 * @description Adds the Event Listener to each Feature
 * @param htmlID HTML ID of feedback panel (see typeToConst)
 * @param direction Direction of feedback panel
 * @param listener Listeners of feedback panel (see typeToConst
 * @param type [star|text|textStar]
 * @param id Feedback ID (can be found in database)
 * @returns {string} success or error message
 */

function addListener(listener, htmlID, direction, type, id) {
  $(document)
    .on('click', `#${listener.remove}-${id}`, () => {
      $.get(getURL('/dist/confirm-reject.html'), (data) => {
        $($.parseHTML(data))
          .appendTo('body');
        $('#modal')
          .attr('id', 'modal-reject');
        $('#modal-reject .modal')
          .show();
        const confirm = document.getElementById('confirm');
        confirm.addEventListener('click', () => {
          chrome.runtime.sendMessage({
            method: 'POST',
            action: 'xhttp',
            url: `${url}feedback`,
            data: {
              type: 'none',
              rating: 'none',
              text: 'none',
              prolific_id: prolific,
              url: domain,
              feedback_id: id,
              stat: 'rejected',
            },
          }, () => {
            $(`#${htmlID}-${id}`)
              .hide();
            $('#modal-reject')
              .remove();
          });
        });
        const closeModal = document.getElementById('closeModal');
        closeModal.addEventListener('click', () => {
          $('#modal-reject')
            .remove();
        });
      });
    });

  $(document)
    .on('click', `#${listener.minimize}-${id}`, () => {
      $(`.arrow-${direction}.${id}`)
        .hide();
      log('minimize', id);
      $(`#badge-${id}`)
        .css('display', 'inline-block');
      $(`#${listener.dropdown}-${id}`)
        .css('display', 'none');
    });

  $(document)
    .on('click', `#${listener.toggle}-${id}`, () => {
      if ($(`#${listener.dropdown}-${id}`)
        .css('display') === 'none') {
        $(`#${listener.dropdown}-${id}`)
          .css('display', 'block');
      } else {
        $(`#${listener.dropdown}-${id}`)
          .css('display', 'none');
      }
    });

  $(document)
    .on('click', `#badge-${id}`, () => {
      $(`.arrow-${direction}.${id}`)
        .show();
      $(`#badge-${id}`)
        .hide();
    });

  $(document)
    .on('click', `#${listener.submit}-${id}`, () => {
      addAPICalls(type, htmlID, id, id);
    });

  $(document)
    .on('click', `#remind-${id}`, () => {
      chrome.runtime.sendMessage({
        action: 'notifications',
        date: Date.now() + 86400000,
        msg: `On ${domain} are still tasks to be completed.`,
      }, () => {
        log('reminder', id);
      });
      $(`#${htmlID}-${id}`)
        .remove();
    });

  $(document)
    .on('click', `#moreInfo-${id}`, () => {
      $.get(getURL('/dist/requester-information.html'), (data) => {
        $($.parseHTML(data))
          .appendTo('body');
        $('#modal')
          .attr('id', `modal-${type}`);
        $(`#modal-${type} .modal`)
          .show();
        chrome.runtime.sendMessage({
          method: 'POST',
          action: 'xhttp',
          url: `${url}info`,
          data: {
            feedback_id: id,
          },
        }, (response) => {
          $('#taskID')
            .html(response.feedback_id);
          $('#requester')
            .html(response.requester);
          $('#requesterID')
            .html(response.requester_id);
          $('#compensation')
            .html(response.compensation);
          $('#info')
            .html(response.info);
          $('#mail')
            .html(response.mail);
          log('info', id);
        });
        const closeModal = document.getElementById('closeModal');
        closeModal.addEventListener('click', () => {
          $(`#modal-${type}`)
            .remove();
        });
      });
    });
  return 'added EventListener';
}

/**
 * @description if window is resize position the feedback panels again
 */
function rearrangeHTML() {
  try {
    for (let i = 0; resizePanel.length; i += 1) {
      const [top, left] = calcPositions(resizePanel[i][0], resizePanel[i][1]);
      $(resizePanel[i][2])
        .css('top', top);
      $(resizePanel[i][2])
        .css('left', left);
    }
  } catch (e) {
    console.log('element not found');
  }
}

/**
 * @description Start all calculations for adding feedback panel on webpage
 * @param key Feedback ID (can be found in database)
 * @param value All data received from DB for an element
 */
function initPanel(key, value) {
  const {
    html,
    htmlID,
    listener,
  } = typeToConst[value.type];
  const {
    dom,
    direction,
    text,
    id,
    position,
  } = value;
  $.get(getURL(`/dist/${html}.html`), (data) => {
    try {
      const [top, left] = calcPositions(dom, direction);
      resizePanel.push([dom, direction, `#${htmlID}-${id}`]);
      $($.parseHTML(data))
        .appendTo('body');
      handleUniqueHTML(htmlID, direction, listener, id, text, value);
      $(`#${htmlID}-${id}`)
        .css('position', position)
        .css('top', top)
        .css('left', left);
      if (domain === 'youtube') {
        $(`.${htmlID}`)
          .css('transform', 'scale(1.3)');
        $(`#${listener.dropdown}-${id}`)
          .css('transform', 'translate(-30px, 35px)');
        $(`#textStarCrowdSurfer-${id}`)
          .css('font-size', '10px');
        $('#reject-modal-content')
          .css('transform', 'scale(1.3)');
      }
      setTimeout(addListener(listener, htmlID, direction, value.type, key, id), 4000);
      log('displayed', key);
      if (domain !== 'ebay' || domain !== 'sigchi') {
        setTimeout(rearrangeHTML, 7000); // Check Position after Advertising is loaded
      }
    } catch (e) {
      console.log('element not found');
    }
  });
}

let previousUrl = '';
// Listen to page changes, important on YouTube
const observer = new MutationObserver(() => {
  if (window.location.href !== previousUrl) {
    previousUrl = window.location.href;
    if (domain === 'youtube' && window.location.pathname === '/watch') {
      $('.card').hide();
    } else {
      $('.card').show();
      // setTimeout(rearrangeHTML, 3500);
    }
  }
});

const config = { subtree: true, childList: true };
observer.observe(document, config);

$(() => {
  chrome.storage.local.set({ lastDomain: domain });
  setTimeout(() => {
    const listOfPages = ['amazon', 'wikipedia', 'twitter', 'youtube', 'reddit',
      'ebay', 'weather', 'cnn', 'twitch', 'netflix', 'imdb', 'hulu', 'vimeo', 'trendyol', 'aliexpress',
      'walmart', 'wayfair', 'costco', 'facebook', 'instagram', 'linkedin', 'britannica', 'quora',
      'sciencedirect', 'wiktionary', 'craigslist', 'etsy', 'sears', 'picclick', 'medium', 'accuweather',
      'wunderground', 'theweathernetwork', 'metoffice', 'washingtonpost', 'nytimes', 'foxnews',
      'reuters', 'yahoo', 'acm', 'sigchi',
    ];
    const referTo = {
      youtube: ['twitch', 'netflix', 'imdb', 'hulu', 'vimeo'],
      amazon: ['trendyol', 'aliexpress', 'walmart', 'wayfair', 'costco'],
      wikipedia: ['britannica', 'quora', 'sciencedirect', 'wiktionary'],
      twitter: ['facebook', 'instagram', 'linkedin'],
      reddit: ['facebook', 'instagram', 'linkedin', 'medium'],
      ebay: ['craigslist', 'etsy', 'sears', 'picclick'],
      weather: ['accuweather', 'wunderground', 'theweathernetwork', 'metoffice'],
      cnn: ['washingtonpost', 'nytimes', 'foxnews', 'reuters', 'yahoo'],
      all: listOfPages,
    };
    if (listOfPages.includes(domain)) {
      // creates a lot of logs...
      // log('related', domain);
      chrome.runtime.sendMessage({
        method: 'POST',
        action: 'xhttp',
        url: `${url}news`,
        data: {
          prolific_id: prolific,
        },
      }, (resp) => {
        // Show notification if exists
        if (resp.message === 'true' && referTo[resp.refer].includes(domain)) {
          chrome.runtime.sendMessage({
            action: 'notifications',
            msg: 'A new task is waiting for you in CrowdSurfer!',
            date: Date.now(),
          }, () => {
          });
          chrome.runtime.sendMessage({
            method: 'POST',
            action: 'xhttp',
            url: `${url}updateNews`,
            data: {
              prolific_id: prolific,
            },
          });
        }
      });
      // Show panels only if switch is activated
      chrome.storage.local.get(['checkForTasks'], (result) => {
        if (result.checkForTasks === true) {
          chrome.runtime.sendMessage({
            method: 'POST',
            action: 'xhttp',
            url: `${url}queryTasks`,
            data: {
              prolific_id: prolific,
              url: domain,
            },
          }, (resp) => {
            $.each(resp, (key, value) => {
              initPanel(key, value);
            });
          });
          const fa = document.createElement('style');
          fa.textContent = `@font-face { font-family: icomoon; src: url("${
            getURL('dist/icomoon.woff')
          }"); }`;
          document.head.appendChild(fa);
        }
      });
    }
  }, 1200);
});

window.onresize = () => {
  rearrangeHTML();
};
