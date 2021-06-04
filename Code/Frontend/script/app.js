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
    if (htmlTemperatuur){
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
}

const DisplaySettings = function(){
    const button = document.querySelector('.js-settings-button');
    button.addEventListener("click", function(){
        htmlSettings.classList.remove("u-display-none");
    })
    RemoveSettings();
    listenToClickConfirm();
}

const RemoveSettings = function(){
    const button = document.querySelector('.js-cancel')
    button.addEventListener("click", function(){
        htmlSettings.classList.add("u-display-none")
    })
}

const listenToClickConfirm = function(){
    const button = document.querySelector('.js-confirm');
    button.addEventListener("click", function(){
        let status = document.querySelector('.js-mode').value
        if (status == 'on'){
          status = 1;
        }
        else{
          status = 0;
        }

        console.log("Nieuwe settings")
        const jsonObject = {
            Periode: document.querySelector('.js-period').value,
            Modus: status
        }
        htmlSettings.classList.add("u-display-none")
        console.log(jsonObject)
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
    htmlSettings = document.querySelector('.js-settings')

    if (htmlTemperatuur){
        getTemp();
        getHum();
    }

    listenToSocket();
    DisplaySettings();
}

document.addEventListener('DOMContentLoaded', init);