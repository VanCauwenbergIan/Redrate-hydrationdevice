const lanIP = `${window.location.hostname}:5000`;
const socket = io(`http://${lanIP}`);

let htmlTemperatuur, htmlVochtigheid;

// callback-visualisation -show

const showTemp = function(jsonObject){
    console.log(jsonObject);
    updateTemperatuur(jsonObject.temperatuur.gemetenwaarde);
}

const showHum = function(jsonObject){
    console.log(jsonObject);
    updateVochtigheid(jsonObject.vochtigheid.gemetenwaarde);
}

// data access -get

const getTemp = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/temp`, showTemp);
}

const getHum = function(){
    handleData(`http://192.168.168.168:5000/api/v1/today/hum`, showHum); 
}

// socket listeners

const listenToSocket = function(){
    socket.on("B2F_addlog", function (jsonObject){
        console.log(`boodschap server: aangepaste waarde of status`);
        if (jsonObject.deviceid == 4){
            console.log(`Nieuwe temperatuur: ${jsonObject.gemetenwaarde}°C`);
            updateTemperatuur(jsonObject.gemetenwaarde);
        }
        else if (jsonObject.deviceid == 3){
            console.log(`Nieuwe relatieve luchtvochtigheid: ${jsonObject.gemetenwaarde}%`);
            updateVochtigheid(jsonObject.gemetenwaarde);
        }
    })
}

// functies voor socket listeners

const updateTemperatuur = function(temperatuur){
    htmlTemperatuur.innerHTML = `${temperatuur}°C`;
}

const updateVochtigheid = function(vochtigheid){
    htmlVochtigheid.innerHTML = `${vochtigheid}%`
}

const init = function () {
    console.log('DOM content loaded');
    htmlTemperatuur = document.querySelector('.js-temperature');
    htmlVochtigheid = document.querySelector('.js-rhumidity')

    getTemp();
    getHum();

    listenToSocket();
}

document.addEventListener('DOMContentLoaded', init);