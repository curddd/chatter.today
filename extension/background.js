chrome.runtime.onInstalled.addListener(function(details){
    if(details.reason === "install"){
        chrome.storage.local.set({
            'nick': 'chatter',
            'server': 'chatter.today:8080'
        });
    } else if(details.reason === "update"){
        chrome.storage.local.get(['nick','server'], function(result) {
            if (typeof result.nick === 'undefined') {
                chrome.storage.local.set({'nick': 'chatter'});
            }
            if (typeof result.update === 'undefined') {
                chrome.storage.local.set({'server': 'chatter.today:8080'});
            }
        });
    }
});






chrome.storage.local.get(['server', 'nick'], (res)=>{
    const socket = new WebSocket(`ws://${res.server}`);

    let tabUrls = [];
    let connected = false;
    
    //intial tab list
    chrome.tabs.query({}, function(tabs) {
        tabUrls = tabs.map(tab => tab.url);
    });
    
    chrome.tabs.onCreated.addListener(function(tab) {
        tabUrls.push(tab.url);
        console.log("Tab created with URL: " + tab.url);
        syncChannels();
    });
    
    chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
        tabUrls = tabUrls.filter(url => url !== removeInfo.url);
        console.log("Tab removed with URL: " + removeInfo.url);
        syncChannels();
    });
    
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
        let changes = false;
        if (changeInfo.url) {
            tabUrls = tabUrls.map(url => {
                if (url === changeInfo.url) {
                    changes = true;
                    return tab.url;
                }
                return url;
            });
            console.log("Tab updated with URL: " + tab.url);
           
        }
        if(changes){
            syncChannels();
        }
    });
    

    function syncChannels(){
        if(connected){
            socket.send(JSON.stringify({type: 'CHLIST', message: tabUrls}))
        }
    }

    socket.onopen = function() {
        console.log('Connected to server');
        connected = true;
        syncChannels();
    };

    //send inc message to all tabs
    socket.onmessage = function(msg) {
        console.log('inc msg:',msg);
        chrome.tabs.query({}, function(tabs) {
            for(tab_id in tabs){
                chrome.tabs.sendMessage(tabs[tab_id].id, JSON.parse(msg.data));
            }
        });
    };

    socket.onclose = function() {
        console.log('Disconnected from server');
        connected = false;
    };

    //take message from tab and send to socket
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            socket.send(JSON.stringify({type: request.type, channel: request.channel, message: `${res.nick}: ${request.message}`}));
        }
    );

});