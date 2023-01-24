//CHAT ENTRY WINDOW
var div = document.createElement("div");
div.style.cssText = "position: fixed;bottom: 10px;right: 10px;width: 200px;background-color: rgb(229, 229, 229);text-align: center;z-index:999";
document.body.appendChild(div);

//LOAD STYLED CHAT
fetch(chrome.runtime.getURL('chat.html'))
    .then(response => response.text())
    .then(data => {
    div.innerHTML = data;
    bindChat();
});


//CHAT FUNCTIONALITY
function bindChat(){
    
    const messagesDiv = document.getElementById('messages-3406983049683046');
    const messageInput = document.getElementById('message-input-3406983049683046');
    const sendButton = document.getElementById('send-button-3406983049683046');
    
    sendButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({type: 'SAY', channel: window.location.href, message: messageInput.value});
        messageInput.value = '';
    });
    messageInput.addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendButton.click();
        }
    });

    //LISTEN TO MSG FROM BACKGROUND
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            console.log(request);
            if(request.channel != window.location.href){
                return;
            }
            messagesDiv.innerHTML += request.message + '<br>';
    });
}
