/* eslint-disable no-undef */

/* This File handles all communication with the Backend */
const url = 'http://127.0.0.1:5000/';

// eslint-disable-next-line consistent-return
chrome.runtime.onMessage.addListener((request, sender, callback) => {
  const requestData = JSON.stringify(request.data);
  if (request.action === 'xhttp') {
    fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestData,
    })
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        console.error('Error:', error);
        callback();
      });
    return true;
  }
  if (request.action === 'notifications') {
    const r = (Math.random() + 1).toString(36).substring(7); // random ID for notification
    chrome.alarms.create(r, {
      when: request.date,
    });
    chrome.alarms.onAlarm.addListener(() => {
      chrome.notifications.create({
        title: 'CrowdSurfer',
        message: request.msg,
        iconUrl: `chrome-extension://${chrome.runtime.id}/dist/logo-128.png`,
        type: 'basic',
        priority: 2,
      });
    });
    callback('Alarm set');
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['checkForTasks'], (result) => {
    console.log(result.checkForTasks);
    if (!(result.checkForTasks === true || result.checkForTasks === false)) {
      chrome.tabs.create({ url });
      chrome.storage.local.set({ checkForTasks: false }, () => {
        console.log('Storage loaded');
      });
      chrome.storage.local.set({ lastDomain: 'CrowdSurfer' });
    }
  });
});

