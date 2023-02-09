const rtcpeerconn = new RTCPeerConnection(
    {iceServers: [{'url': 'stun:stun.l.google.com:19302'}]},
    {optional: [{RtpDataChannels: false}]}
);

let rtcdatachannel = null;

// will (maybe "should"?) works for answer side only
rtcpeerconn.ondatachannel = function (event) {
    console.log('on data channel', rtcdatachannel, rtcdatachannel === event.channel);
    rtcdatachannel = event.channel;
    rtcdatachannel.onopen = function () {
        console.log('rtcdatachannel.onopen')

        rtcdatachannel.send('hello world from answer!');

        setTimeout(function () {
            rtcdatachannel.send('hello world answer!!!!!');
        }, 3000);

        rtcdatachannel.onmessage = function (event) {
            console.log(event.data);
        }

    };
    // rtcdatachannel.onerror = onerror;
};

rtcpeerconn.onicecandidate = function (event) {
    if (!event || !event.candidate) return;

    console.log(rtcpeerconn.remoteDescription);
    console.log('--- ice candidate ---');
    console.log(JSON.stringify(event.candidate));
};

// setInterval(() => {
//     console.log(rtcpeerconn.remoteDescription);
// }, 1e3)


async function handleCreateDataChannel() {
    rtcdatachannel = rtcpeerconn.createDataChannel(Date.now().toString(32));

    rtcdatachannel.onopen = function () {
        console.log('handleCreateDataChannel - on open');

        rtcdatachannel.send('hello world from offer!');

        setTimeout(function () {
            rtcdatachannel.send('hello world offer!!!!!');
        }, 3000);

        rtcdatachannel.onmessage = function (event) {
            console.log(event.data);
        }
    }

    const sessionDescription = await rtcpeerconn.createOffer();

    await rtcpeerconn.setLocalDescription(sessionDescription);

    console.log(JSON.stringify(sessionDescription));
}

async function applyOffer() {
    const offerJson = JSON.parse(document.querySelector('.js-offer-input').value);

    const offer = new RTCSessionDescription(offerJson);

    await rtcpeerconn.setRemoteDescription(offer);

    const sessionDescription = await rtcpeerconn.createAnswer();

    await rtcpeerconn.setLocalDescription(sessionDescription);

    console.log(JSON.stringify(sessionDescription));
}

async function applyAnswer() {
    const answerJson = JSON.parse(document.querySelector('.js-answer-input').value);

    await rtcpeerconn.setRemoteDescription(answerJson);
}

async function addIceCandidate() {
    const iceCandidateJson = JSON.parse(document.querySelector('.js-ice-candidate-input').value);

    await rtcpeerconn.addIceCandidate(new RTCIceCandidate(iceCandidateJson));
}
