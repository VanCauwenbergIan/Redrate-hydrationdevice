const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let htmlTemperatuur;

const listenToSocket = function(){
    socket.on("B2F_addlog", function (jsonObject){
        console.log(`boodschap server: aangepaste waarde of status`);
        if (jsonObject.deviceid == 4){
            console.log(`Nieuwe temperatuur: ${jsonObject.gemetenwaarde}`);
            updateTemperatuur(jsonObject.gemetenwaarde);
        }
    })
}

const updateTemperatuur = function(temperatuur){
    htmlTemperatuur.innerHTML = `Temperature: ${temperatuur}°C`;
}

const init = function () {
    console.log('DOM content loaded');
    htmlTemperatuur = document.querySelector('.js-temperature');

    listenToSocket();
}

document.addEventListener('DOMContentLoaded', init);