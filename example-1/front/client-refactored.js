(function () {

    // normalizing
    var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection,
        RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.msRTCSessionDescription,
        RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.msRTCIceCandidate;

    var offererId = 'Gandalf',   // note: client id conflicts can happen
        answererId = 'Saruman',  //       no websocket cleanup code exists
        ourId, peerId, rtcdatachannel;

    /** called when RTC signaling is complete and RTCDataChannel is ready */
    function comready() {
        rtcdatachannel.send('hello world!');

        setTimeout(function () {
            rtcdatachannel.send('hello world!!!!!');
        }, 3000);

        rtcdatachannel.onmessage = function (event) {
            document.getElementById('msg').innerHTML = 'RTCDataChannel peer ' + peerId + ' says: ' + event.data;
        }
    }

    /** global error function */
    function onerror(e) {
        console.log('====== WEBRTC ERROR ======', arguments);
        document.getElementById('msg').innerHTML = '====== WEBRTC ERROR ======<br>' + e;
        throw new Error(e);
    }

    var rtcpeerconn = new RTCPeerConnection(
        {
            iceServers: [
                {'url': 'stun:stun.services.mozilla.com'},
                {'url': 'stun:stun.l.google.com:19302'}
            ]
        },
        {
            optional: [
                {RtpDataChannels: false}
            ]
        }
    );

    rtcpeerconn.onicecandidate = function (event) {

        if (!event || !event.candidate) {
            return;
        }

        websocket.send(JSON.stringify({
            inst: 'send',
            peerId: peerId,
            message: {candidate: event.candidate}
        }));

    };

    rtcpeerconn.ondatachannel = function (event) {
        rtcdatachannel = event.channel;
        rtcdatachannel.onopen = comready;
        rtcdatachannel.onerror = onerror;
    };

    var websocket = new WebSocket('ws://' + window.location.hostname + ':' + ((+window.location.port) + 1));
    websocket.onerror = onerror;

    websocket.onmessage = function (input) {

        var message = JSON.parse(input.data);

        if (message.type && message.type === 'offer') {

            var offer = new RTCSessionDescription(message);

            rtcpeerconn.setRemoteDescription(offer, function () {
                rtcpeerconn.createAnswer(function (answer) {
                    rtcpeerconn.setLocalDescription(answer, function () {

                        var output = answer.toJSON();

                        if (typeof output === 'string') output = JSON.parse(output); // normalize: RTCSessionDescription.toJSON returns a json str in FF, but json obj in Chrome

                        websocket.send(JSON.stringify({
                            inst: 'send',
                            peerId: peerId,
                            message: output
                        }));
                        
                    }, onerror);
                }, onerror);
            }, onerror);
        } else if (message.type && message.type === 'answer') {
            var answer = new RTCSessionDescription(message);
            rtcpeerconn.setRemoteDescription(answer, function () {/* handler required but we have nothing to do */
                console.log('setRemoteDescription');
            }, onerror);
        } else if (rtcpeerconn.remoteDescription) {
            // ignore ice candidates until remote description is set
            rtcpeerconn.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    };

    window.init = function (weAreOfferer) {
        ourId = weAreOfferer ? offererId : answererId;
        peerId = weAreOfferer ? answererId : offererId;

        websocket.send(JSON.stringify({
            inst: 'init',
            id: ourId
        }));

        if (weAreOfferer) {

            rtcdatachannel = rtcpeerconn.createDataChannel(offererId + answererId);
            rtcdatachannel.onopen = comready;
            rtcdatachannel.onerror = onerror;

            rtcpeerconn.createOffer(function (offer) {
                rtcpeerconn.setLocalDescription(offer, function () {

                    var output = offer.toJSON();

                    if (typeof output === 'string') output = JSON.parse(output); // normalize: RTCSessionDescription.toJSON returns a json str in FF, but json obj in Chrome

                    websocket.send(JSON.stringify({
                        inst: 'send',
                        peerId: peerId,
                        message: output
                    }));

                }, onerror);
            }, onerror);
        }
    };

})();
