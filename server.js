const WebSocket = require('ws');

wss = new WebSocket.Server({ port: 8080 });

// Keep track of the channels and their associated connections
const channels = new Map();



wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.uuid = (Math.random() + 1).toString(36).substring(7);
    ws.channels = [];

    // When the client sends a message
    ws.on('message', (message) => {
        let data = JSON.parse(message);

        switch (data.type) {

	    case 'CHLIST':

		//find out the ones that have been left and remove from channels
		for(old_chan of ws.channels){
			if(data.message.indexOf(old_chan)!=-1){
				continue;
			};
			console.log("removing from channel");
			channels.get(old_chan).splice(channels.get(old_chan).indexOf(ws),1);
		}

		//this is the new channel list
		ws.channels = data.message;
		for(channel of ws.channels){
			if(!channels.has(channel)){
				channels.set(channel, [ws]);
				continue;
			};
			if(channels.get(channel).indexOf(ws) != -1){
				continue;
			};
			channels.get(channel).push(ws);
		}
		break;
            
	    case 'JOIN':
                // Add the client to the channel and keep track of the channel
                if (!channels.has(data.channel)) {
                    channels.set(data.channel, []);
                }
                channels.get(data.channel).push(ws);
		if(ws.channels.indexOf(data.channel) == -1){
                	ws.channels.push(data.channel);
		}
                break;

	   case 'SAY':
		channels.get(data.channel).forEach((client) => {
			client.send(JSON.stringify({channel: data.channel, message: data.message}));
		});
		break;
		
        }
    });

    // When the client closes the connection
    ws.on('close', () => {
        console.log('Client disconnected');

        // Remove the client from the channel
	for(channel of ws.channels){
            channels.get(channel).splice(channels.get(channel).indexOf(ws), 1);
        }
    });
});
