let stream = new MediaStream();
let suuid = "ecf-001"

let config = {
  iceServers: [{
    urls: ["stun:stun.l.google.com:19302"]
  }]
};

const pc = new RTCPeerConnection(config);
pc.onnegotiationneeded = handleNegotiationNeededEvent;

let log = msg => {
  document.getElementById('div').innerHTML += msg + '<br>'
}

pc.ontrack = function(event) {
  stream.addTrack(event.track);
  videoElem.srcObject = stream;
  log(event.streams.length + ' track is delivered')
}

pc.oniceconnectionstatechange = e => log(pc.iceConnectionState)

async function handleNegotiationNeededEvent() {
  let offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  getRemoteSdp();
}

// $(document).ready(function() {
//   $('#' + suuid).addClass('active');
//   getCodecInfo();
// });

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById(suuid).classList.add('active');
  getCodecInfo();
});



// function getCodecInfo() {
//   $.get("../codec/" + suuid, function(data) {
//     try {
//       data = JSON.parse(data);
//     } catch (e) {
//       console.log(e);
//     } finally {
//       $.each(data,function(index,value){
//         pc.addTransceiver(value.Type, {
//           'direction': 'sendrecv'
//         })
//       })
//     }
//   });
// }

async function getCodecInfo() {
  try {
    const response = await fetch("../codec/" + suuid);
    if (!response.ok) {
      throw new Error('Failed to fetch codec info');
    }
    const data = await response.json();
    data.forEach(function(value) {
      pc.addTransceiver(value.Type, {
        'direction': 'sendrecv'
      });
    });
  } catch (error) {
    console.error(error);
  }
}


let sendChannel = null;

// function getRemoteSdp() {
//   $.post("../receiver/"+ suuid, {
//     suuid: suuid,
//     data: btoa(pc.localDescription.sdp)
//   }, function(data) {
//     try {
//       pc.setRemoteDescription(new RTCSessionDescription({
//         type: 'answer',
//         sdp: atob(data)
//       }))
//     } catch (e) {
//       console.warn(e);
//     }
//   });
// }


function getRemoteSdp() {
  fetch("http://127.0.0.1:8083/stream/receiver/" + suuid, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Connection': 'keep-alive'
    },
    body: "suuid=" + encodeURIComponent(suuid) + "&data=" + encodeURIComponent(btoa(pc.localDescription.sdp))
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erro ao fazer a requisição: ' + response.status);
    }
    return response.text();
  })
  .then(data => {
    try {
      pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: atob(data)
      }));
    } catch (e) {
      console.warn(e);
    }
  })
  .catch(error => {
    console.error(error);
  });
}
